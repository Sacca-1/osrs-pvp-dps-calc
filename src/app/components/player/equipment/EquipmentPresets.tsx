import Select from '@/app/components/generic/Select';
import React, { useCallback, useState } from 'react';
import EquipmentPreset from '@/enums/EquipmentPreset';
import { useStore } from '@/state';
import { PartialDeep } from 'type-fest';
import { Player } from '@/types/Player';
import { availableEquipment } from '@/lib/Equipment';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { getCombatStylesForCategory } from '@/utils';

interface EquipmentPresetsProps { side: 'attacker' | 'defender' }

const EquipmentPresets: React.FC<EquipmentPresetsProps> = ({ side }) => {
  const store = useStore();

  type PresetCategory = 'pure' | 'zerk' | 'medMax' | 'tank' | 'robes';
  type PresetStyle = 'ranged' | 'magic' | 'melee' | 'spec' | 'tank';

  const defaultCategory: PresetCategory | 'all' = side === 'attacker' ? 'medMax' : 'tank';
  const [category, setCategory] = useState<PresetCategory | 'all'>(defaultCategory);

  // Style filter only used for attacker UI
  const [style, setStyle] = useState<PresetStyle | 'all'>('all');

  // Helper so we don't write "both" everywhere
  type SideFlag = 'attacker' | 'defender' | 'both';

  interface PresetDef {
    label: string;
    value: EquipmentPreset;
    tags: PresetCategory[];
    styles: PresetStyle[];
    side: SideFlag;
  }

  const basePresets: PresetDef[] = [
    // --- Attacker presets ---
    { label: 'Eclipse Atlatl', value: EquipmentPreset.ECLIPSE_ATLATL, tags: ['medMax','zerk'], styles: ['ranged'], side: 'attacker' },
    { label: "DCB Barrows", value: EquipmentPreset.DCB_BARROWS, tags: ['medMax'], styles: ['ranged'], side: 'attacker' },
    { label: "RCB D'hide", value: EquipmentPreset.RCB_DHIDE, tags: ['medMax'], styles: ['ranged'], side: 'attacker' },
    { label: "Bowfa Crystal", value: EquipmentPreset.BOWFA_CRYSTAL, tags: ['medMax'], styles: ['ranged'], side: 'attacker' },
    { label: "Virtus Ancients", value: EquipmentPreset.VIRTUS_ANCIENTS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Ahrim's Ancients", value: EquipmentPreset.AHRIMS_ANCIENTS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Bloodbark Ancients", value: EquipmentPreset.BLOODBARK_ANCIENTS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Mystics Ancients", value: EquipmentPreset.MYSTICS_ANCIENTS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Mystics Normals", value: EquipmentPreset.MYSTICS_NORMALS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Bloodbark Normals", value: EquipmentPreset.BLOODBARK_NORMALS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Ahrim's Normals", value: EquipmentPreset.AHRIMS_NORMALS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Ancestral Normals", value: EquipmentPreset.ANCESTRAL_NORMALS, tags: ['medMax'], styles: ['magic'], side: 'both' },
    { label: "Noxious Halberd", value: EquipmentPreset.NOXIOUS_HALBERD, tags: ['medMax'], styles: ['melee'], side: 'attacker' },
    { label: "Osmumten's Fang", value: EquipmentPreset.OSMUMTENS_FANG, tags: ['medMax'], styles: ['melee'], side: 'attacker' },
    { label: "Zombie Axe", value: EquipmentPreset.ZOMBIE_AXE, tags: ['medMax'], styles: ['melee'], side: 'attacker' },
    { label: "Leaf-bladed Battleaxe", value: EquipmentPreset.LEAF_BLADED_BATTLEAXE, tags: ['medMax'], styles: ['melee'], side: 'attacker' },
    { label: "Abyssal Dagger", value: EquipmentPreset.ABYSSAL_DAGGER_SPEC, tags: ['medMax'], styles: ['spec'], side: 'attacker' },
    { label: "Dragon Dagger", value: EquipmentPreset.DRAGON_DAGGER_SPEC, tags: ['medMax'], styles: ['spec'], side: 'attacker' },
    { label: "Voidwaker", value: EquipmentPreset.VOIDWAKER_SPEC, tags: ['medMax'], styles: ['spec'], side: 'attacker' },
    { label: "Armadyl Godsword", value: EquipmentPreset.ARMADYL_GODSWORD_SPEC, tags: ['medMax'], styles: ['spec'], side: 'attacker' },
    // --- Defender presets ---
    { label: "Karil's Tank", value: EquipmentPreset.KARILS_TANK, tags: ['medMax'], styles: ['tank'], side: 'defender' },
    { label: "Crystal Tank", value: EquipmentPreset.CRYSTAL_TANK, tags: ['medMax'], styles: ['tank'], side: 'defender' },
    { label: "Blessed D'hide Tank", value: EquipmentPreset.BLESSED_DHIDE_TANK, tags: ['medMax'], styles: ['tank'], side: 'defender' },
    { label: "Black D'hide Tank", value: EquipmentPreset.BLACK_DHIDE_TANK, tags: ['medMax'], styles: ['tank'], side: 'defender' },
  ];

  const presets = basePresets.filter((p) => (p.side === 'both' || p.side === side));

  const categoryFilterFn = () => {
    if (side === 'attacker') {
      return (p: PresetDef) => (category === 'all' || p.tags.includes(category));
    }
    // defender: category represents style 'tank' or 'robes'
    if (category === 'tank') return (p: PresetDef) => p.styles.includes('tank');
    if (category === 'robes') return (p: PresetDef) => p.styles.includes('magic');
    return () => true;
  };

  const filteredPresets = presets.filter((p) => {
    if (!categoryFilterFn()(p)) return false;
    if (side === 'attacker') return (style === 'all' || p.styles.includes(style));
    return true; // defender doesn't use secondary style filter
  });

  // Build item list with a category selector header (non-selectable)
  type ItemType = typeof filteredPresets[number] | { header: true };

  const items: ItemType[] = [{ header: true, label: 'header' }, ...filteredPresets];

  const onSelect = useCallback((v: { label?: string, value?: EquipmentPreset } | null | undefined) => {
    if (!v) return;
    let newPlayer: Partial<Player> = {};

    const findItemById = (id: number) => availableEquipment.find((eq) => eq.id === id);

    switch (v.value) {
      case EquipmentPreset.ECLIPSE_ATLATL: {
        newPlayer = {
          name: v.label,
          equipment: {
            ammo: findItemById(28991) ?? null,
            body: findItemById(29004) ?? null,
            cape: findItemById(21295) ?? null,
            feet: findItemById(29806) ?? null,
            hands: findItemById(7462) ?? null,
            head: findItemById(29010) ?? null,
            legs: findItemById(29007) ?? null,
            neck: findItemById(6585) ?? null,
            ring: findItemById(25975) ?? null,
            shield: null,
            weapon: findItemById(29000) ?? null,
          },
        };
        break;
      }
      case EquipmentPreset.DCB_BARROWS: {
        newPlayer = {
          name: v.label,
          equipment: {
            ammo: findItemById(21932) ?? null,
            body: findItemById(4736) ?? null,
            cape: findItemById(21295) ?? null,
            feet: findItemById(29806) ?? null,
            hands: findItemById(7462) ?? null,
            head: findItemById(12931) ?? null,
            legs: findItemById(4738) ?? null,
            neck: findItemById(6585) ?? null,
            ring: findItemById(25975) ?? null,
            shield: findItemById(11283) ?? null,
            weapon: findItemById(21902) ?? null,
          },
        };
        break;
      }
      case EquipmentPreset.RCB_DHIDE: {
        newPlayer = {
          name: v.label,
          equipment: {
            ammo: findItemById(9244) ?? null,
            body: findItemById(2503) ?? null,
            cape: findItemById(21791) ?? null,
            feet: findItemById(11840) ?? null,
            hands: findItemById(7462) ?? null,
            head: findItemById(10828) ?? null,
            legs: findItemById(2497) ?? null,
            neck: findItemById(1704) ?? null,
            ring: findItemById(28329) ?? null,
            shield: findItemById(23991) ?? null,
            weapon: findItemById(9185) ?? null,
          },
        };
        break;
      }
      case EquipmentPreset.BOWFA_CRYSTAL: {
        newPlayer = {
          name: v.label,
          equipment: {
            ammo: findItemById(22947) ?? null,
            body: findItemById(23975) ?? null,
            cape: findItemById(21295) ?? null,
            feet: findItemById(29806) ?? null,
            hands: findItemById(7462) ?? null,
            head: findItemById(24271) ?? null,
            legs: findItemById(23979) ?? null,
            neck: findItemById(6585) ?? null,
            ring: findItemById(25975) ?? null,
            weapon: findItemById(25865) ?? null,
          },
        };
        break;
      }
      case EquipmentPreset.VIRTUS_ANCIENTS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(22947) ?? null, body: findItemById(26243) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(24271) ?? null, legs: findItemById(26245) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(27251) ?? null, weapon: findItemById(29594) ?? null } }; break; }
      case EquipmentPreset.AHRIMS_ANCIENTS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4712) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4714) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(6889) ?? null, weapon: findItemById(12904) ?? null } }; break; }
      case EquipmentPreset.BLOODBARK_ANCIENTS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(25404) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(11840) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(25416) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(12612) ?? null, weapon: findItemById(28262) ?? null } }; break; }
      case EquipmentPreset.MYSTICS_ANCIENTS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(9244) ?? null, body: findItemById(4091) ?? null, cape: findItemById(2412) ?? null, feet: findItemById(3105) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(4093) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(28329) ?? null, shield: findItemById(12612) ?? null, weapon: findItemById(4675) ?? null } }; break; }
      case EquipmentPreset.MYSTICS_NORMALS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(9244) ?? null, body: findItemById(4091) ?? null, cape: findItemById(2412) ?? null, feet: findItemById(3105) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(4093) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(28329) ?? null, shield: findItemById(20714) ?? null, weapon: findItemById(1405) ?? null } }; break; }
      case EquipmentPreset.BLOODBARK_NORMALS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(25404) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(11840) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(25416) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(20714) ?? null, weapon: findItemById(12000) ?? null } }; break; }
      case EquipmentPreset.AHRIMS_NORMALS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4712) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4714) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(20714) ?? null, weapon: findItemById(12904) ?? null } }; break; }
      case EquipmentPreset.ANCESTRAL_NORMALS: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(22947) ?? null, body: findItemById(21021) ?? null, cape: findItemById(21791) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(24271) ?? null, legs: findItemById(21024) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(20714) ?? null, weapon: findItemById(29594) ?? null } }; break; }
      case EquipmentPreset.NOXIOUS_HALBERD: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(22947) ?? null, body: findItemById(23975) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(24271) ?? null, legs: findItemById(23979) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, weapon: findItemById(29796) ?? null } }; break; }
      case EquipmentPreset.OSMUMTENS_FANG: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(22322) ?? null, weapon: findItemById(26219) ?? null } }; break; }
      case EquipmentPreset.ZOMBIE_AXE: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(10386) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(11840) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(10388) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(22322) ?? null, weapon: findItemById(28810) ?? null } }; break; }
      case EquipmentPreset.LEAF_BLADED_BATTLEAXE: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(9244) ?? null, body: findItemById(2503) ?? null, cape: findItemById(2412) ?? null, feet: findItemById(3105) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(2497) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(28329) ?? null, shield: findItemById(3842) ?? null, weapon: findItemById(20727) ?? null } }; break; }
      case EquipmentPreset.ABYSSAL_DAGGER_SPEC: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(22322) ?? null, weapon: findItemById(13265) ?? null } }; break; }
      case EquipmentPreset.DRAGON_DAGGER_SPEC: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(22322) ?? null, weapon: findItemById(1215) ?? null } }; break; }
      case EquipmentPreset.VOIDWAKER_SPEC: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(22322) ?? null, weapon: findItemById(27690) ?? null } }; break; }
      case EquipmentPreset.ARMADYL_GODSWORD_SPEC: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, weapon: findItemById(11802) ?? null } }; break; }
      // Defender presets
      case EquipmentPreset.KARILS_TANK: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(4736) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(12931) ?? null, legs: findItemById(4738) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(11283) ?? null, weapon: findItemById(12904) ?? null } }; break; }
      case EquipmentPreset.CRYSTAL_TANK: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(23975) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(29806) ?? null, hands: findItemById(7462) ?? null, head: findItemById(24271) ?? null, legs: findItemById(23979) ?? null, neck: findItemById(6585) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(11283) ?? null, weapon: findItemById(29594) ?? null } }; break; }
      case EquipmentPreset.BLESSED_DHIDE_TANK: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(21932) ?? null, body: findItemById(10386) ?? null, cape: findItemById(21295) ?? null, feet: findItemById(11840) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(10388) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(25975) ?? null, shield: findItemById(23991) ?? null, weapon: findItemById(28262) ?? null } }; break; }
      case EquipmentPreset.BLACK_DHIDE_TANK: {
        newPlayer = { name: v.label, equipment: { ammo: findItemById(9244) ?? null, body: findItemById(2503) ?? null, cape: findItemById(2412) ?? null, feet: findItemById(3105) ?? null, hands: findItemById(7462) ?? null, head: findItemById(10828) ?? null, legs: findItemById(2497) ?? null, neck: findItemById(1704) ?? null, ring: findItemById(28329) ?? null, shield: findItemById(12829) ?? null, weapon: findItemById(4675) ?? null } }; break; }
      default:
        break;
    }

    if (Object.keys(newPlayer).length > 0) {
      store.updatePlayer(newPlayer, undefined, side);
    }
  }, [store, side]);

  const categories = side === 'attacker'
    ? (['medMax', 'zerk', 'pure', 'all'] as const)
    : (['tank', 'robes'] as const);

  return (
    <Select<any>
      id="presets"
      items={items}
      placeholder="Presets"
      resetAfterSelect
      onSelectedItemChange={onSelect}
      CustomItemComponent={({ item }) => {
        // Header row renders category buttons
        // @ts-ignore
        if (item.header) {
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex gap-1">
                {/* Category buttons */}
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`px-2 py-0.5 rounded border ${category === c ? 'bg-btns-400 text-white' : 'bg-body-100 dark:bg-dark-300'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(c as any);
                    }}
                  >
                    {c === 'all' ? 'All' : (c === 'medMax' ? 'Med/Max' : c.charAt(0).toUpperCase() + c.slice(1))}
                  </button>
                ))}
              </div>
              {/* Style buttons (only attacker) */}
              {side === 'attacker' && (
                <div className="flex gap-1 mt-1">
                  {['all','ranged','magic','melee','spec','tank'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`px-2 py-0.5 rounded border ${style === s ? 'bg-btns-400 text-white' : 'bg-body-100 dark:bg-dark-300'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStyle(s as any);
                      }}
                    >
                      {s === 'all' ? 'All' : (s === 'magic' ? 'Robes' : s.charAt(0).toUpperCase() + s.slice(1))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return <span>{item.label}</span>;
      }}
    />
  );
};

export default EquipmentPresets;
