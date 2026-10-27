import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import PlayerVsPlayerCalc from '@/lib/PlayerVsPlayerCalc';
import { GlobalState } from '@/state';
import { Prayer, PrayerMap } from '@/enums/Prayer';
import getSpellMaxHit from '@/types/SpellMax';
import {
  findEquipment, findSpell, getTestMonster, getTestPlayer,
} from '@/tests/utils/TestUtils';

const elements = [
  { spell: 'Wind', amulet: 'air', fragment: 'fragmentOfWind' },
  { spell: 'Water', amulet: 'water', fragment: 'fragmentOfWater' },
  { spell: 'Earth', amulet: 'earth', fragment: 'fragmentOfEarth' },
  { spell: 'Fire', amulet: 'fire', fragment: 'fragmentOfFire' },
] as const;
const monster = getTestMonster();
const style = { name: 'Autocast', type: 'magic', stance: 'Autocast' } as const;

describe.each(elements)('$spell elemental upgrades', ({ spell, amulet, fragment }) => {
  test.each([
    ['Strike', 8], ['Bolt', 12], ['Blast', 16], ['Wave', 20], ['Surge', 24],
  ] satisfies [string, number][])('%s stacks the matching amulet and fragment in PvP', (tier, base) => {
    const player = getTestPlayer(monster, {
      style,
      spell: findSpell(`${spell} ${tier}`),
      buffs: { [fragment]: true },
      equipment: { neck: findEquipment(`Amulet of ${amulet}`) },
    });
    expect(getSpellMaxHit(player)).toBe(base + 2);
    expect(new PlayerVsPlayerCalc(player, getTestPlayer(monster), { mode: 'pvp' })
      .getDistribution().getMax()).toBe(base + 4);
  });

  test('the combined amulet stacks with the fragment before magic damage bonuses', () => {
    const player = getTestPlayer(monster, {
      style,
      spell: findSpell(`${spell} Surge`),
      buffs: { [fragment]: true },
      equipment: { neck: findEquipment('Elemental amulet') },
      bonuses: { magic_str: 500 },
    });
    expect(new PlayerVsNPCCalc(player, monster).getDistribution().getMax()).toBe(42);
  });

  test('a fragment scales with matching elemental weakness', () => {
    const selectedSpell = findSpell(`${spell} Surge`);
    const target = getTestMonster('Abyssal demon', 'Standard', {
      weakness: { element: selectedSpell.element, severity: 100 },
    });
    const player = getTestPlayer(target, {
      style,
      spell: selectedSpell,
      buffs: { [fragment]: true },
      equipment: { neck: findEquipment(`Amulet of ${amulet}`) },
    });
    expect(new PlayerVsNPCCalc(player, target).getDistribution().getMax()).toBe(56);
  });

  test('other elements receive no bonus from this fragment or amulet', () => {
    for (const other of elements.filter((element) => element.spell !== spell)) {
      const player = getTestPlayer(monster, {
        style,
        spell: findSpell(`${other.spell} Surge`),
        buffs: { [fragment]: true },
        equipment: { neck: findEquipment(`Amulet of ${amulet}`) },
      });
      expect(new PlayerVsNPCCalc(player, monster).getDistribution().getMax()).toBe(24);
    }
  });
});

test('elemental upgrades stack with chaos gauntlets and ignore ancient spells and powered staves', () => {
  const player = getTestPlayer(monster, {
    style,
    spell: findSpell('Fire Bolt'),
    buffs: { fragmentOfFire: true },
    equipment: {
      neck: findEquipment('Elemental amulet'),
      hands: findEquipment('Chaos gauntlets'),
    },
  });
  expect(new PlayerVsNPCCalc(player, monster).getDistribution().getMax()).toBe(19);
  player.spell = findSpell('Ice Barrage');
  expect(new PlayerVsNPCCalc(player, monster).getDistribution().getMax()).toBe(30);

  const powered = getTestPlayer(monster, {
    equipment: { weapon: findEquipment('Trident of the Seas') },
  });
  const upgraded = getTestPlayer(monster, {
    equipment: {
      weapon: findEquipment('Trident of the Seas'),
      neck: findEquipment('Elemental amulet'),
    },
    buffs: {
      fragmentOfFire: true, fragmentOfWind: true, fragmentOfWater: true, fragmentOfEarth: true,
    },
  });
  expect(new PlayerVsNPCCalc(upgraded, monster).getDistribution().getMax())
    .toBe(new PlayerVsNPCCalc(powered, monster).getDistribution().getMax());
});

test('fragment unlocks survive sharing independently for attacker and defender', () => {
  const store = new GlobalState();
  store.updatePlayer({ buffs: { fragmentOfFire: true }, prayers: [Prayer.ZEAL] }, 0, 'attacker');
  store.updatePlayer({ buffs: { fragmentOfWater: true }, prayers: [Prayer.PROTECT_MAGIC] }, 0, 'defender');
  const restored = new GlobalState();
  restored.updateImportedData(JSON.parse(JSON.stringify(store.asImportableData)));
  expect(restored.attackerLoadouts[0].buffs.fragmentOfFire).toBe(true);
  expect(restored.attackerLoadouts[0].buffs.fragmentOfWater).toBe(false);
  expect(restored.defenderLoadouts[0].buffs.fragmentOfWater).toBe(true);
  expect(restored.defenderLoadouts[0].buffs.fragmentOfFire).toBe(false);
  expect(restored.attackerLoadouts[0].prayers).toEqual([Prayer.ZEAL]);
  expect(restored.defenderLoadouts[0].prayers).toEqual([Prayer.PROTECT_MAGIC]);
  expect(PrayerMap[Prayer.ZEAL].preRelease).toBeFalsy();
});
