import { describe, expect, test } from '@jest/globals';
import {
  calculatePlayerVsNpc, findEquipment, getTestMonsterById, getTestPlayer,
} from '@/tests/utils/TestUtils';
import { Prayer } from '@/enums/Prayer';
import {
  SOULREAPER_MAX_STACKS,
  SOULREAPER_STACK_BONUS_PERCENT,
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
      [1, 66],
      [2, 70],
      [3, 75],
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
          soulreaperStacks: 5,
        },
      });

      const { maxHit } = calculatePlayerVsNpc(monster, player);
      expect(maxHit).toBe(63);
    });
  });

  test('special attack accuracy increases by 10% per stack', () => {
    const normalPlayer = getTestPlayer(monster, basePlayer);
    const normalAttackRoll = calculatePlayerVsNpc(monster, normalPlayer).maxAttackRoll;

    for (let stacks = 0; stacks <= SOULREAPER_MAX_STACKS; stacks++) {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        buffs: {
          soulreaperStacks: stacks,
        },
      });
      const { maxAttackRoll } = calculatePlayerVsNpc(monster, player, {
        usingSpecialAttack: true,
      });

      expect(maxAttackRoll).toBe(Math.trunc(
        normalAttackRoll * (100 + stacks * SOULREAPER_STACK_BONUS_PERCENT) / 100,
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
