import Select from '@/app/components/generic/Select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/state';
import { Player } from '@/types/Player';
import { availableEquipment } from '@/lib/Equipment';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { getCombatStylesForCategory } from '@/utils';

interface EquipmentPresetsProps { side: 'attacker' | 'defender' }

const EquipmentPresets: React.FC<EquipmentPresetsProps> = ({ side }) => {
  const store = useStore();

  type TierCategory = 'pure' | 'zerk' | 'medMax';
  type StyleCategory = 'melee' | 'ranged' | 'magic' | 'spec' | 'tank';

  const [tier, setTier] = useState<TierCategory | 'all'>('all');
  const [style, setStyle] = useState<StyleCategory | 'all'>('all');

  interface RawPreset {
    label: string;
    tierTags: TierCategory[];
    style: StyleCategory;
    attackerOnly?: boolean;
    defenderOnly?: boolean;
    equipment: Record<string, number>; // slot -> id
  }

  const [parsedPresets, setParsedPresets] = useState<RawPreset[]>([]);

  // Fetch and parse presets text once on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const resp = await fetch('/gearpresets.txt');
        if (!resp.ok) throw new Error('Failed fetching presets');
        const txt = await resp.text();

        const presets: RawPreset[] = [];
        const blocks = txt.split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.trim().split(/\n/);
          if (lines.length === 0) continue;

          const header = lines[0];
          const headerMatch = /^(.*?) \((.*?)\)(?: \((.*?)\))?/.exec(header);
          if (!headerMatch) continue;
          const label = headerMatch[1].trim();
          const tierStr = headerMatch[2]?.toLowerCase() ?? '';
          const styleStr = (headerMatch[3]?.toLowerCase() ?? '') as StyleCategory;

          const tierTags: TierCategory[] = [];
          if (tierStr.includes('pure')) tierTags.push('pure');
          if (tierStr.includes('zerk')) tierTags.push('zerk');
          if (tierStr.includes('med') || tierStr.includes('max')) tierTags.push('medMax');

          if (tierTags.length === 0) tierTags.push('medMax'); // default

          const equipment: Record<string, number> = {};

          // skip the Slot header row, start after first row containing "Slot"
          const slotLines = lines.slice(lines.findIndex((l) => l.startsWith('Slot')) + 1);
          for (const sl of slotLines) {
            const [slotRaw, idRaw] = sl.split(/\s+/);
            if (!slotRaw || !idRaw) continue;
            equipment[slotRaw] = parseInt(idRaw, 10);
          }

          presets.push({ label, tierTags, style: styleStr || 'melee', equipment });
        }

        setParsedPresets(presets);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPresets();
  }, []);

  // Map to Select options once equipment data loaded
  const basePresets = useMemo(() => parsedPresets.map((p, idx) => ({
    label: p.label,
    value: idx, // index acts as value, we'll look up
    tierTags: p.tierTags,
    style: p.style,
    attackerOnly: p.attackerOnly,
    defenderOnly: p.defenderOnly,
  })), [parsedPresets]);

  const presets = basePresets.filter((p) => {
    if (p.attackerOnly && side !== 'attacker') return false;
    if (p.defenderOnly && side !== 'defender') return false;
    return true;
  });

  const filteredPresets = presets.filter((p) => {
    const tierOk = tier === 'all' || p.tierTags.includes(tier);
    const styleOk = style === 'all' || p.style === style;
    return tierOk && styleOk;
  });

  // Build item list with a category selector header (non-selectable)
  type ItemType = typeof filteredPresets[number] | { header: true };

  const items: ItemType[] = [{ header: true, label: 'header' }, ...filteredPresets];

  const onSelect = useCallback((v: { label?: string, value?: number } | null | undefined) => {
    if (!v) return;
    const idx = v.value as number;
    const preset = parsedPresets[idx];
    if (!preset) return;

    const findItemById = (id: number) => availableEquipment.find((eq) => eq.id === id) ?? null;
    const equipment: Partial<Player['equipment']> = {};
    for (const [slot, id] of Object.entries(preset.equipment)) {
      // @ts-ignore
      equipment[slot] = findItemById(id);
    }

    const newPlayer: Partial<Player> = {
      name: preset.label,
      equipment,
    };

    store.updatePlayer(newPlayer, undefined, side);
  }, [store, side, parsedPresets]);

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
                {['all', 'pure', 'zerk', 'medMax'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`px-2 py-0.5 rounded border ${tier === c ? 'bg-btns-400 text-white' : 'bg-body-100 dark:bg-dark-300'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTier(c as any);
                    }}
                  >
                    {c === 'all' ? 'All' : (c === 'medMax' ? 'Med/Max' : c.charAt(0).toUpperCase() + c.slice(1))}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {['all', 'melee', 'ranged', 'magic', 'spec', 'tank'].map((c) => (
                  <button
                    key={`style-${c}`}
                    type="button"
                    className={`px-2 py-0.5 rounded border ${style === c ? 'bg-btns-400 text-white' : 'bg-body-100 dark:bg-dark-300'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStyle(c as any);
                    }}
                  >
                    {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return <span>{item.label}</span>;
      }}
    />
  );
};

export default EquipmentPresets;
