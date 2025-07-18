import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import AttributeInput from '@/app/components/generic/AttributeInput';
import strength from '@/public/img/bonuses/strength.png';
import rangedStrength from '@/public/img/bonuses/ranged_strength.png';
import magicStrength from '@/public/img/bonuses/magic_strength.png';
import prayer from '@/public/img/tabs/prayer.png';
import attackSpeed from '@/public/img/bonuses/attack_speed.png';
import { EquipmentBonuses } from '@/lib/Equipment';

const OtherBonuses: React.FC<{ computedStats: EquipmentBonuses }> = observer(({ computedStats }) => {
  const store = useStore();
  const side = useSide();
  const prefs = store.prefs;
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];

  return (
    <div className="w-[95px]">
      <p className="text-sm text-gray-500 dark:text-gray-300">Other</p>
      <div className="flex flex-col gap-1 mt-3 text-center">
        <AttributeInput
          disabled={!prefs.manualMode}
          name="Strength"
          image={strength}
          value={player.bonuses.str}
          className={`${(player.bonuses.str !== computedStats.bonuses.str) ? 'bg-yellow-200 dark:bg-yellow-500' : ''}`}
          onChange={(v) => store.updatePlayer({ bonuses: { str: v } }, undefined, side)}
        />
        <AttributeInput
          disabled={!prefs.manualMode}
          name="Ranged Strength"
          image={rangedStrength}
          value={player.bonuses.ranged_str}
          className={`${(player.bonuses.ranged_str !== computedStats.bonuses.ranged_str) ? 'bg-yellow-200 dark:bg-yellow-500' : ''}`}
          onChange={(v) => store.updatePlayer({ bonuses: { ranged_str: v } }, undefined, side)}
        />
        <AttributeInput
          disabled={!prefs.manualMode}
          name="Magic Strength"
          image={magicStrength}
          step={0.1}
          value={parseFloat((player.bonuses.magic_str / 10).toFixed(1))}
          className={`${(player.bonuses.magic_str !== computedStats.bonuses.magic_str) ? 'bg-yellow-200 dark:bg-yellow-500' : ''}`}
          onChange={(v) => store.updatePlayer({ bonuses: { magic_str: Math.trunc(v * 10) } }, undefined, side)}
        />
        <AttributeInput
          disabled={!prefs.manualMode}
          name="Prayer"
          image={prayer}
          value={player.bonuses.prayer}
          className={`${(player.bonuses.prayer !== computedStats.bonuses.prayer) ? 'bg-yellow-200 dark:bg-yellow-500' : ''}`}
          onChange={(v) => store.updatePlayer({ bonuses: { prayer: v } }, undefined, side)}
        />
        <AttributeInput
          disabled={!prefs.manualMode}
          name="Attack Speed"
          image={attackSpeed}
          value={player.attackSpeed}
          className={`${(player.attackSpeed !== computedStats.attackSpeed) ? 'bg-yellow-200 dark:bg-yellow-500' : ''}`}
          onChange={(v) => store.updatePlayer({ attackSpeed: v }, undefined, side)}
          min={1}
        />
      </div>
    </div>
  );
});

export default OtherBonuses;
