import { describe, expect, test } from '@jest/globals';
import PlayerVsPlayerCalc, { playerToMonster } from '@/lib/PlayerVsPlayerCalc';
import {
  findEquipment,
  findSpell,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

describe('PvP KO chance', () => {
  test('should convert defenders into stable monster-shaped targets with current stats', () => {
    const m = getTestMonster();
    const defender = getTestPlayer(m, {
      skills: {
        def: 70,
        hp: 90,
        magic: 80,
      },
      boosts: {
        def: 5,
        hp: -10,
        magic: 3,
      },
      defensive: {
        stab: 11,
        slash: 22,
        crush: 33,
        magic: 44,
        ranged: 55,
      },
    });

    const target = playerToMonster(defender, -222);

    expect(target.id).toBe(-222);
    expect(target.skills.def).toBe(74);
    expect(target.skills.hp).toBe(80);
    expect(target.skills.magic).toBe(79);
    expect(target.defensive.stab).toBe(11);
    expect(target.defensive.standard).toBe(55);
  });

  test('should use player effective defence for physical PvP defence rolls', () => {
    const m = getTestMonster();
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment('Abyssal whip'),
      },
    });
    const defender = getTestPlayer(m, {
      skills: {
        def: 70,
      },
      boosts: {
        def: 5,
      },
      defensive: {
        stab: 11,
        slash: 22,
        crush: 33,
        magic: 44,
        ranged: 55,
      },
    });

    const calc = new PlayerVsPlayerCalc(attacker, defender, { mode: 'pvp' });

    expect(calc.getNPCDefenceRoll()).toBe((75 + 8) * (22 + 64));
  });

  test('should use 70% magic and 30% defence for PvP magic defence rolls', () => {
    const m = getTestMonster();
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment('Trident of the seas'),
      },
    });
    const defender = getTestPlayer(m, {
      skills: {
        def: 70,
        magic: 80,
      },
      boosts: {
        def: 5,
        magic: 3,
      },
      defensive: {
        stab: 11,
        slash: 22,
        crush: 33,
        magic: 44,
        ranged: 55,
      },
    });
    const magicEffectiveLevel = Math.trunc((83 * 7 + 75 * 3) / 10) + 8;

    const calc = new PlayerVsPlayerCalc(attacker, defender, { mode: 'pvp' });

    expect(calc.getNPCDefenceRoll()).toBe(magicEffectiveLevel * (44 + 64));
  });

  test('should convert successful 0 damage rolls into 1 damage', () => {
    const m = getTestMonster();
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment('Abyssal whip'),
      },
    });
    const defender = getTestPlayer(m);
    const calc = new PlayerVsPlayerCalc(attacker, defender, {
      mode: 'pvp',
      overrides: {
        accuracy: 1,
      },
    });
    const dist = calc.getDistribution().singleHitsplat;
    const hitsByDamage = new Map(
      dist.hits.map((hit) => [hit.getSum(), hit.probability]),
    );
    const maxHit = dist.getMax();

    expect(hitsByDamage.get(0)).toBeUndefined();
    expect(hitsByDamage.get(1)).toBeCloseTo(2 / (maxHit + 1), 8);
  });

  test('should apply distinct charged tome PvP damage multipliers', () => {
    const m = getTestMonster();
    const defender = getTestPlayer(m);
    const magicStyle = {
      name: 'Spell',
      type: 'magic' as const,
      stance: 'Manual Cast' as const,
    };

    const fire = new PlayerVsPlayerCalc(
      getTestPlayer(m, {
        equipment: { shield: findEquipment('Tome of fire', 'Charged') },
        spell: findSpell('Fire Bolt'),
        style: magicStyle,
      }),
      defender,
      { mode: 'pvp' },
    );
    const water = new PlayerVsPlayerCalc(
      getTestPlayer(m, {
        equipment: { shield: findEquipment('Tome of water', 'Charged') },
        spell: findSpell('Water Bolt'),
        style: magicStyle,
      }),
      defender,
      { mode: 'pvp' },
    );
    const earth = new PlayerVsPlayerCalc(
      getTestPlayer(m, {
        equipment: { shield: findEquipment('Tome of earth', 'Charged') },
        spell: findSpell('Earth Bolt'),
        style: magicStyle,
      }),
      defender,
      { mode: 'pvp' },
    );

    expect(fire.getMax()).toBe(Math.trunc(12 * 3 / 2));
    expect(water.getMax()).toBe(Math.trunc(12 * 6 / 5));
    expect(earth.getMax()).toBe(Math.trunc(12 * 11 / 10));
  });

  test('should use the full special attack hit distribution against the defender HP', () => {
    const m = getTestMonster();
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment('Crimson kisten'),
      },
      style: { name: 'Smash', type: 'crush', stance: 'Aggressive' },
    });
    const defender = getTestPlayer(m, {
      skills: {
        hp: 50,
      },
    });

    const calc = new PlayerVsPlayerCalc(attacker, defender, {
      mode: 'pvp',
      usingSpecialAttack: true,
      overrides: {
        accuracy: 1,
      },
    });
    const accurateHits = calc.getDistribution().singleHitsplat.hits
      .filter((hit) => hit.anyAccurate())
      .map((hit) => hit.getSum());
    const maxHit = Math.max(...accurateHits);
    const minHit = Math.min(...accurateHits);

    expect(calc.getKoChance(maxHit)).toBeCloseTo(1 / accurateHits.length, 8);
    expect(calc.getKoChance(minHit)).toBe(1);
    expect(calc.getKoChance(maxHit + 1)).toBe(0);
  });
});
