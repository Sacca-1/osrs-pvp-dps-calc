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

  type PresetCategory = 'pure' | 'zerk' | 'medMax';

  const [category, setCategory] = useState<PresetCategory | 'all'>('all');

  const basePresets = [
    {
      label: 'Eclipse Atlatl',
      value: EquipmentPreset.ECLIPSE_ATLATL,
      tags: ['medMax'] as PresetCategory[],
      attackerOnly: true,
    },
  ];

  const presets = basePresets.filter((p) => !(p.attackerOnly && side !== 'attacker'));

  const filteredPresets = presets.filter((p) => category === 'all' || p.tags.includes(category));

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
      default:
        break;
    }

    if (Object.keys(newPlayer).length > 0) {
      store.updatePlayer(newPlayer, undefined, side);
    }
  }, [store, side]);

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
            <div className="flex gap-1 text-xs">
              {['all', 'pure', 'zerk', 'medMax'].map((c) => (
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
          );
        }
        return <span>{item.label}</span>;
      }}
    />
  );
};

export default EquipmentPresets;
