import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import {
  AmmoApplicability,
  ammoApplicability,
  calculateAttackSpeed,
  calculateEquipmentBonusesFromGear,
} from '@/lib/Equipment';
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

const monster = getTestMonster();

const playerWithAmmo = (ammoName: string) => {
  const player = getTestPlayer(monster, {
    equipment: {
      weapon: findEquipment('Magic shortbow'),
      ammo: findEquipment(ammoName),
    },
    skills: {
      ranged: 99,
    },
    style: {
      name: 'Accurate',
      type: 'ranged',
      stance: 'Accurate',
    },
  });

  player.attackSpeed = calculateAttackSpeed(player, monster);
  return player;
};

describe('Seeking arrows', () => {
  test('should be selectable as upgraded standard arrow tiers', () => {
    expect(findEquipment('Seeking bronze arrow')).toBeDefined();
    expect(findEquipment('Seeking iron arrow')).toBeDefined();
    expect(findEquipment('Seeking steel arrow')).toBeDefined();
    expect(findEquipment('Seeking mithril arrow')).toBeDefined();
    expect(findEquipment('Seeking adamant arrow')).toBeDefined();
    expect(findEquipment('Seeking rune arrow')).toBeDefined();
    expect(findEquipment('Seeking amethyst arrow')).toBeDefined();
    expect(findEquipment('Seeking dragon arrow')).toBeDefined();
    expect(findEquipment('Seeking broad arrows')).toBeDefined();
  });

  test('should follow the same bow tier restrictions as standard arrows', () => {
    const yewShortbow = findEquipment('Yew shortbow');
    const magicShortbow = findEquipment('Magic shortbow');
    const darkBow = findEquipment('Dark bow', 'Regular');

    expect(ammoApplicability(yewShortbow.id, findEquipment('Seeking rune arrow').id)).toBe(AmmoApplicability.INCLUDED);
    expect(ammoApplicability(yewShortbow.id, findEquipment('Seeking amethyst arrow').id)).toBe(AmmoApplicability.INVALID);
    expect(ammoApplicability(magicShortbow.id, findEquipment('Seeking amethyst arrow').id)).toBe(AmmoApplicability.INCLUDED);
    expect(ammoApplicability(magicShortbow.id, findEquipment('Seeking dragon arrow').id)).toBe(AmmoApplicability.INVALID);
    expect(ammoApplicability(darkBow.id, findEquipment('Seeking dragon arrow').id)).toBe(AmmoApplicability.INCLUDED);
  });

  test('should add 20 ranged accuracy over the base arrow', () => {
    const basePlayer = playerWithAmmo('Amethyst arrow');
    const seekerPlayer = playerWithAmmo('Seeking amethyst arrow');
    const baseBonuses = calculateEquipmentBonusesFromGear(basePlayer, monster);
    const seekerBonuses = calculateEquipmentBonusesFromGear(seekerPlayer, monster);

    expect(seekerBonuses.bonuses.ranged_str).toBe(baseBonuses.bonuses.ranged_str);
    expect(seekerBonuses.offensive.ranged).toBe(baseBonuses.offensive.ranged + 20);
    expect(new PlayerVsNPCCalc(seekerPlayer, monster).getMaxAttackRoll()).toBeGreaterThan(
      new PlayerVsNPCCalc(basePlayer, monster).getMaxAttackRoll(),
    );
  });

  test('should keep misses while raising successful hits below 3', () => {
    const calc = new PlayerVsNPCCalc(playerWithAmmo('Seeking bronze arrow'), monster, {
      overrides: { accuracy: 0.5 },
    });
    const hits = calc.getDistribution().dists[0].hits;
    const accurateHits = hits.filter((hit) => hit.anyAccurate());
    const missChance = hits
      .filter((hit) => !hit.anyAccurate())
      .reduce((total, hit) => total + hit.probability, 0);

    expect(missChance).toBeCloseTo(0.5);
    expect(Math.min(...accurateHits.map((hit) => hit.getSum()))).toBe(3);
  });

  test('should not show a pre-release warning when equipped from regenerated wiki data', () => {
    const calc = new PlayerVsNPCCalc(playerWithAmmo('Seeking amethyst arrow'), monster);

    expect(calc.userIssues).toHaveLength(0);
  });
});
