import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

const monster = getTestMonster();

describe('Aquanite hopper', () => {
  test('fires its second shot 11% of the time with the halved accuracy penalty', () => {
    const player = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Dragon crossbow'),
        shield: findEquipment('Aquanite hopper'),
        ammo: findEquipment('Runite bolts', 'Unpoisoned'),
      },
      style: {
        name: 'Rapid',
        type: 'ranged',
        stance: 'Rapid',
      },
    });
    const calc = new PlayerVsNPCCalc(player, monster, {
      overrides: { accuracy: 1 },
    });
    const hits = calc.getDistribution().dists.flatMap((dist) => dist.hits);
    const secondShotProbability = hits
      .filter((hit) => hit.hitsplats.length === 2)
      .reduce((total, hit) => total + hit.probability, 0);
    const accurateSecondShotProbability = hits
      .filter((hit) => hit.hitsplats[1]?.accurate)
      .reduce((total, hit) => total + hit.probability, 0);

    expect(secondShotProbability).toBeCloseTo(0.11, 10);
    expect(accurateSecondShotProbability).toBeCloseTo(0.11 * 2 / 3, 10);
  });
});
