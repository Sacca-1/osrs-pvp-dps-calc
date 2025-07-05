import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import diary from '@/public/img/misc/diary.png';
import soulreaper_axe from '@/public/img/misc/soulreaper_axe.png';
import NumberInput from '@/app/components/generic/NumberInput';
import Toggle from '../generic/Toggle';

// Using remote image for burn hitsplat icon as there is no local asset yet
const burnHitsplatImg = 'https://oldschool.runescape.wiki/images/9/96/Hitsplat_burn.png';

const ExtraOptions: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];

  // Remote images for the new defender toggles
  const iceBarrageImg = 'https://oldschool.runescape.wiki/images/thumb/Ice_Barrage.png/32px-Ice_Barrage.png';
  const antifireImg = 'https://oldschool.runescape.wiki/images/thumb/Antifire_potion%284%29.png/32px-Antifire_potion%284%29.png';

  return (
    <div className="px-6 my-4">
      <div className="mt-2 mb-4">
        {side === 'attacker' ? (
          <>
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
            <div className="w-full mt-2">
              <NumberInput
                className="form-control w-12"
                required
                min={0}
                max={5}
                value={player.buffs.atlatlBurnStacks ?? 0}
                onChange={(v) => store.updatePlayer({ buffs: { atlatlBurnStacks: v } }, undefined, side)}
              />
              <span className="ml-1 text-sm select-none">
                <img src={burnHitsplatImg} width={18} className="inline-block" alt="" />
                {' '}
                Atlatl burn stacks
                {' '}
              </span>
            </div>
          </>
        ) : (
          <>
            <Toggle
              checked={player.buffs.frozen}
              setChecked={(c) => store.updatePlayer({ buffs: { frozen: c } }, undefined, side)}
              label={(<>
                <img src={iceBarrageImg} width={18} className="inline-block" alt="" />
                {' '}
                Frozen
                {' '}
              </>)}
            />
            <Toggle
              checked={player.buffs.antifire}
              setChecked={(c) => store.updatePlayer({ buffs: { antifire: c } }, undefined, side)}
              label={(<>
                <img src={antifireImg} width={18} className="inline-block" alt="" />
                {' '}
                Antifire
                {' '}
              </>)}
            />
          </>
        )}
      </div>
    </div>
  );
});

export default ExtraOptions;
