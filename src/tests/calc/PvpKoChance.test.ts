import { describe, expect, test } from '@jest/globals';
import PlayerVsPlayerCalc from '@/lib/PlayerVsPlayerCalc';
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

describe('PvP KO chance', () => {
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
