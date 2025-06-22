import { CalcOpts } from '@/lib/BaseCalc';
import { Player } from '@/types/Player';
import { Monster, BurnImmunity } from '@/types/Monster';
import { INITIAL_MONSTER_INPUTS } from '@/lib/Monsters';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { AttackDistribution } from '@/lib/HitDist';
import { Prayer } from '@/enums/Prayer';
import { PrayerMap } from '@/enums/Prayer';
import { PROTECTION_PRAYER_DAMAGE_REDUCTION } from '@/lib/constants';

/**
 * Helper to convert a Player object into a Monster-like structure so we can
 * reuse existing PvM logic without refactoring the whole stack. Only the
 * fields actually used by PlayerVsNPCCalc are populated.
 */
function playerToMonster(p: Player): Monster {
  // Determine prayer-based defence multipliers
  let defLevel = p.skills.def + (p.boosts.def || 0);
  let magicLevel = p.skills.magic + (p.boosts.magic || 0);

  let defFactor: [number, number] | null = null;
  let defMagicFactor: [number, number] | null = null;

  for (const pr of p.prayers) {
    const data = PrayerMap[pr];
    if (data?.factorDefence) {
      if (!defFactor || (data.factorDefence[0] / data.factorDefence[1]) > (defFactor[0] / defFactor[1])) {
        defFactor = data.factorDefence;
      }
    }
    if (data?.factorDefenceMagic) {
      if (!defMagicFactor || (data.factorDefenceMagic[0] / data.factorDefenceMagic[1]) > (defMagicFactor[0] / defMagicFactor[1])) {
        defMagicFactor = data.factorDefenceMagic;
      }
    }
  }

  if (defFactor) {
    defLevel = Math.floor(defLevel * defFactor[0] / defFactor[1]);
  }
  if (defMagicFactor) {
    magicLevel = Math.floor(magicLevel * defMagicFactor[0] / defMagicFactor[1]);
  }

  return {
    id: -100 - Math.random(), // arbitrary negative ID
    name: p.name,
    image: undefined,
    version: '',
    size: 1,
    speed: p.attackSpeed,
    style: null,
    skills: {
      atk: p.skills.atk + (p.boosts.atk || 0),
      def: defLevel,
      hp: p.skills.hp + (p.boosts.hp || 0),
      magic: magicLevel,
      ranged: p.skills.ranged + (p.boosts.ranged || 0),
      str: p.skills.str + (p.boosts.str || 0),
    },
    offensive: {
      atk: 0,
      magic: 0,
      magic_str: 0,
      ranged: 0,
      ranged_str: 0,
      str: 0,
    },
    defensive: {
      flat_armour: 0,
      stab: p.defensive.stab,
      slash: p.defensive.slash,
      crush: p.defensive.crush,
      magic: p.defensive.magic,
      light: p.defensive.ranged,
      standard: p.defensive.ranged,
      heavy: p.defensive.ranged,
    },
    attributes: [],
    weakness: null,
    immunities: { burn: BurnImmunity.NORMAL },
    inputs: { ...INITIAL_MONSTER_INPUTS },
  } as Monster;
}

export default class PlayerVsPlayerCalc extends PlayerVsNPCCalc {
  private defender: Player;

  constructor(attacker: Player, defender: Player, opts: Partial<CalcOpts> = {}) {
    const dummyMonster = playerToMonster(defender);
    super(attacker, dummyMonster, { ...opts, disableMonsterScaling: true, mode: 'pvp' });
    this.defender = defender;

    // Override blowpipe speed in PvP (4 ticks instead of 3)
    if (this.player.equipment.weapon?.name.includes('blowpipe')) {
      this.player.attackSpeed = 4;
    }

    // TODO: surface a user issue for blocked weapons in PvP mode
    // if (BLOCKED_PVP_WEAPONS.some((w) => this.wearing(w))) {
    //   this.addIssue(UserIssueType.EQUIPMENT_SET_EFFECT_UNSUPPORTED, 'This weapon is blocked in PvP.');
    // }
  }

  /**
   * Apply overhead-protection prayer reduction to the attacker->defender damage distribution.
   */
  public getDistribution(): AttackDistribution {
    const dist = super.getDistribution();

    const incomingStyle = this.player.style.type;
    const overhead = this.defender.overheadPrayer;

    if (overhead !== undefined && overhead !== null) {
      const correct = (
        (incomingStyle === 'magic' && overhead === Prayer.PROTECT_MAGIC)
        || (incomingStyle === 'ranged' && overhead === Prayer.PROTECT_MISSILES)
        || (['stab', 'slash', 'crush'].includes(incomingStyle || '') && overhead === Prayer.PROTECT_MELEE)
      );
      if (correct) {
        return dist.scaleDamage(PROTECTION_PRAYER_DAMAGE_REDUCTION[0], PROTECTION_PRAYER_DAMAGE_REDUCTION[1]);
      }
    }
    return dist;
  }

  /**
   * Blowpipe PvP attack speed fix.
   */
  public getAttackSpeed(): number {
    if (this.player.equipment.weapon?.name.includes('blowpipe')) {
      return 4;
    }
    return super.getAttackSpeed();
  }
} 