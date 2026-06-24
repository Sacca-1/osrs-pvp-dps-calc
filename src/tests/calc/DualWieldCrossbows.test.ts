import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import {
  AmmoApplicability,
  ammoApplicability,
  calculateAttackSpeed,
} from '@/lib/Equipment';
import UserIssueType from '@/enums/UserIssueType';
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

const m = getTestMonster();

const raisedLinearExpected = (max: number) => max / 2 + 1 / (max + 1);

const playerWithDualCrossbows = (ammoName: string) => {
  const player = getTestPlayer(m, {
    equipment: {
      weapon: findEquipment('Dual-wield Crossbows'),
      ammo: findEquipment(ammoName),
    },
    skills: {
      ranged: 99,
    },
    buffs: {
      kandarinDiary: false,
    },
    style: {
      name: 'Rapid',
      type: 'ranged',
      stance: 'Rapid',
    },
  });

  player.attackSpeed = calculateAttackSpeed(player, m);
  return player;
};

describe('Dual-wield Crossbows', () => {
  test('should be selectable with fractured bolt variants', () => {
    expect(findEquipment('Dual-wield Crossbows')).toBeDefined();
    expect(findEquipment('Fractured Bolts')).toBeDefined();
    expect(findEquipment('Diamond-tipped Fractured Bolts')).toBeDefined();
    expect(findEquipment('Onyx-tipped Fractured Bolts')).toBeDefined();
  });

  test('should only allow fractured bolts', () => {
    const weapon = findEquipment('Dual-wield Crossbows');

    expect(ammoApplicability(weapon.id, findEquipment('Fractured Bolts').id)).toBe(AmmoApplicability.INCLUDED);
    expect(ammoApplicability(weapon.id, findEquipment('Diamond-tipped Fractured Bolts').id)).toBe(AmmoApplicability.INCLUDED);
    expect(ammoApplicability(weapon.id, findEquipment('Onyx-tipped Fractured Bolts').id)).toBe(AmmoApplicability.INCLUDED);
    expect(ammoApplicability(weapon.id, findEquipment('Diamond bolts (e)').id)).toBe(AmmoApplicability.INVALID);
  });

  test('should use a two-tick rapid attack speed', () => {
    const calc = new PlayerVsNPCCalc(playerWithDualCrossbows('Fractured Bolts'), m);

    expect(calc.getAttackSpeed()).toBe(2);
  });

  test('should show a pre-release warning when equipped', () => {
    const calc = new PlayerVsNPCCalc(playerWithDualCrossbows('Fractured Bolts'), m);

    expect(
      calc.userIssues.some((issue) => issue.type === UserIssueType.WEAPON_PRERELEASE),
    ).toBe(true);
  });

  test('should use a 50% reduced diamond bolt effect chance', () => {
    const p = playerWithDualCrossbows('Diamond-tipped Fractured Bolts');
    const noEffectPlayer = {
      ...p,
      equipment: {
        ...p.equipment,
        ammo: {
          ...findEquipment('Diamond-tipped Fractured Bolts'),
          name: 'Test no-effect fractured bolts',
        },
      },
    };
    const baseMax = new PlayerVsNPCCalc(noEffectPlayer, m, {
      overrides: { accuracy: 1 },
    }).getMax();
    const effectMax = Math.trunc(baseMax * 115 / 100);
    const expected = 0.05 * raisedLinearExpected(effectMax)
      + 0.95 * raisedLinearExpected(baseMax);

    const calc = new PlayerVsNPCCalc(p, m, {
      overrides: { accuracy: 1 },
    });

    expect(calc.getExpectedDamage()).toBeCloseTo(expected, 8);
  });

  test('should use a 50% reduced onyx bolt effect chance', () => {
    const p = playerWithDualCrossbows('Onyx-tipped Fractured Bolts');
    const noEffectPlayer = {
      ...p,
      equipment: {
        ...p.equipment,
        ammo: {
          ...findEquipment('Onyx-tipped Fractured Bolts'),
          name: 'Test no-effect fractured bolts',
        },
      },
    };
    const baseMax = new PlayerVsNPCCalc(noEffectPlayer, m, {
      overrides: { accuracy: 1 },
    }).getMax();
    const effectMax = Math.trunc(baseMax * 120 / 100);
    const expected = 0.055 * raisedLinearExpected(effectMax)
      + 0.945 * raisedLinearExpected(baseMax);

    const calc = new PlayerVsNPCCalc(p, m, {
      overrides: { accuracy: 1 },
    });

    expect(calc.getExpectedDamage()).toBeCloseTo(expected, 8);
  });
});
