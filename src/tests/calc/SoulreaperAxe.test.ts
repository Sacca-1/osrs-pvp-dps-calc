import { describe, expect, test } from '@jest/globals';
import {
  calculatePlayerVsNpc, findEquipment, getTestMonsterById, getTestPlayer,
} from '@/tests/utils/TestUtils';
import { Prayer } from '@/enums/Prayer';
import {
  SOULREAPER_MAX_STACKS,
  SOULREAPER_SPEC_ACCURACY_BONUS_PERCENT,
  SOULREAPER_SPEC_MIN_HIT_PERCENT,
} from '@/lib/constants';
import { Player } from '@/types/Player';
import { PartialDeep } from 'type-fest';

const monster = getTestMonsterById(415);
const basePlayer: PartialDeep<Player> = {
  prayers: [Prayer.PIETY],
  style: {
    name: 'Hack',
    type: 'slash',
    stance: 'Aggressive',
  },
  equipment: {
    weapon: findEquipment('Soulreaper axe'),
  },
};

describe('Soulreaper axe', () => {
  describe('Level 118, Gear bonus 188', () => {
    [
      [0, 61],
      [1, 64],
      [2, 67],
      [3, 70],
      [4, 72],
      [5, 75],
    ].forEach(([stacks, max]) => {
      test(`${stacks} stacks`, () => {
        const player = getTestPlayer(monster, {
          ...basePlayer,
          skills: {
            str: 118,
          },
          bonuses: {
            str: 188,
          },
          buffs: {
            soulreaperStacks: stacks,
          },
        });

        const { maxHit } = calculatePlayerVsNpc(monster, player);
        expect(maxHit).toBe(max);
      });
    });
  });

  describe('Level 99, Gear bonus 188', () => {
    test('legacy stack values are capped at the new maximum', () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: {
          str: 99,
        },
        bonuses: {
          str: 188,
        },
        buffs: {
          soulreaperStacks: 10,
        },
      });

      const { maxHit } = calculatePlayerVsNpc(monster, player);
      expect(maxHit).toBe(63);
    });
  });

  test('special attack gains 12% accuracy and 6% minimum hit per stack', () => {
    const normalPlayer = getTestPlayer(monster, basePlayer);
    const normalAttackRoll = calculatePlayerVsNpc(monster, normalPlayer).maxAttackRoll;

    for (let stacks = 0; stacks <= SOULREAPER_MAX_STACKS; stacks++) {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        buffs: {
          soulreaperStacks: stacks,
        },
      });
      const { dist, maxAttackRoll, maxHit } = calculatePlayerVsNpc(monster, player, {
        usingSpecialAttack: true,
      });
      const accurateHits = dist.dists
        .flatMap((hitDist) => hitDist.hits)
        .filter((hit) => hit.anyAccurate());

      expect(maxAttackRoll).toBe(Math.trunc(
        normalAttackRoll * (100 + stacks * SOULREAPER_SPEC_ACCURACY_BONUS_PERCENT) / 100,
      ));
      expect(Math.min(...accurateHits.map((hit) => hit.getSum()))).toBe(Math.max(
        1,
        Math.trunc(maxHit * stacks * SOULREAPER_SPEC_MIN_HIT_PERCENT / 100),
      ));
    }
  });

  test('base and ornamented axes use the new strength bonus and stack mechanics', () => {
    expect(findEquipment('Soulreaper axe').bonuses.str).toBe(125);
    expect(findEquipment('Soulreaper axe (o)').bonuses.str).toBe(125);

    const player = getTestPlayer(monster, {
      ...basePlayer,
      equipment: {
        weapon: findEquipment('Soulreaper axe (o)'),
      },
      buffs: {
        soulreaperStacks: SOULREAPER_MAX_STACKS,
      },
    });

    expect(calculatePlayerVsNpc(monster, player).maxHit).toBe(48);
  });
});
