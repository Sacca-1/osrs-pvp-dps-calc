import { describe, expect, test } from '@jest/globals';
import {
  calculatePlayerVsNpc, findEquipmentById,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';
import { DetailKey } from '@/lib/CalcDetails';
import { Prayer, PrayerMap, SortedPrayers } from '@/enums/Prayer';
import { PartialDeep } from 'type-fest';
import { Player } from '@/types/Player';

describe('Prayers', () => {
  const monster = getTestMonster('Abyssal demon', 'Standard');

  describe('Zeal', () => {
    test('boosts melee attack and strength 5 percentage points above Piety', () => {
      const player = getTestPlayer(monster, {
        prayers: [Prayer.ZEAL],
        skills: { atk: 99, str: 99 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);

      expect(details.find((d) => d.label === DetailKey.PLAYER_ACCURACY_LEVEL_PRAYER)?.value).toBe(123);
      expect(details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value).toBe(126);
      expect(PrayerMap[Prayer.ZEAL].factorDefence).toEqual([125, 100]);
    });

    test('appears at the bottom of the prayer list', () => {
      expect(SortedPrayers.at(-1)?.[0]).toBe(String(Prayer.ZEAL));
    });
  });

  describe('Burst of Strength', () => {
    const basePlayer: PartialDeep<Player> = { prayers: [Prayer.BURST_OF_STRENGTH] };

    test('level 10 strength', () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { str: 10 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value).toBe(11);
    });

    test('level 99 strength', () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { str: 99 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value).toBe(103);
    });
  });

  describe('Sharp Eye', () => {
    const basePlayer: PartialDeep<Player> = {
      prayers: [Prayer.SHARP_EYE],
      equipment: {
        weapon: findEquipmentById(21902),
        ammo: findEquipmentById(21905),
      },
      style: {
        name: 'Rapid',
        type: 'ranged',
        stance: 'Rapid',
      },
    };

    test('level 10 ranged', () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { ranged: 10 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value).toBe(11);
    });

    test('level 99 ranged', () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { ranged: 99 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value).toBe(103);
    });
  });
});
