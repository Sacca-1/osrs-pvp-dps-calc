import { describe, expect, test } from '@jest/globals';
import PlayerVsPlayerCalc, { playerToMonster } from '@/lib/PlayerVsPlayerCalc';
import {
  findEquipment,
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
    expect(target.skills.def).toBe(75);
    expect(target.skills.hp).toBe(80);
    expect(target.skills.magic).toBe(83);
    expect(target.defensive.stab).toBe(11);
    expect(target.defensive.standard).toBe(55);
  });

  test('should use the full special attack hit distribution against the defender HP', () => {
    const m = getTestMonster();
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment('Crimson bludgeon'),
      },
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
