import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import diary from '@/public/img/misc/diary.png';
import soulreaper_axe from '@/public/img/misc/soulreaper_axe.png';
import NumberInput from '@/app/components/generic/NumberInput';
import Toggle from '../generic/Toggle';

const ExtraOptions: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];

  return (
    <div className="px-6 my-4">
      <div className="mt-2 mb-4">
        <Toggle
          checked={player.buffs.kandarinDiary}
          setChecked={(c) => store.updatePlayer({ buffs: { kandarinDiary: c } }, undefined, side)}
          label={(<>
            <img src={diary.src} width={18} className="inline-block" alt="" />
            {' '}
            Kandarin Hard Diary
            {' '}
          </>)}
        />
        <div className="w-full mt-2">
          <NumberInput
            className="form-control w-12"
            required
            min={0}
            max={5}
            value={player.buffs.soulreaperStacks}
            onChange={(v) => store.updatePlayer({ buffs: { soulreaperStacks: v } }, undefined, side)}
          />
          <span className="ml-1 text-sm select-none">
            <img src={soulreaper_axe.src} width={18} className="inline-block" alt="" />
            {' '}
            Soul stacks
            {' '}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ExtraOptions;
