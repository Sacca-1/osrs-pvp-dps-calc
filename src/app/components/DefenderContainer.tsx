import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { calculateCombatLevel } from '@/utils';
import PlayerInnerContainer from '@/app/components/player/PlayerInnerContainer';
import LoadoutName from '@/app/components/player/LoadoutName';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import WikiSyncButton from '@/app/components/player/WikiSyncButton';

const DefenderContainer: React.FC = observer(() => {
  const store = useStore();
  const {
    defenderLoadouts: loadouts,
    defender: player,
    selectedDefender,
  } = store;

  const canCreate = loadouts.length < 6;

  return (
    <div className="flex flex-col w-[350px]">
      <div className="text-center font-serif font-bold text-gray-300 dark:text-gray-300 mb-1">Defender</div>
      <div className="sm:rounded sm:rounded-b-none text-sm font-bold font-serif flex gap-2 items-center bg-transparent text-white border-b-4 border-blue-300 dark:border-blue-700">
        <div className="my-1 flex h-full">
          {loadouts.map((l, ix) => (
            <button
              type="button"
              // eslint-disable-next-line react/no-array-index-key
              key={ix}
              className={`min-w-[40px] text-left first:md:rounded-tl px-4 py-1 border-l-2 first:border-l-0 last:rounded-tr border-body-100 dark:border-dark-300 transition-colors ${selectedDefender === ix ? 'bg-blue-400 dark:bg-blue-700' : 'bg-btns-400 dark:bg-dark-400'}`}
              onClick={() => store.setSelectedDefender(ix)}
            >
              {ix + 1}
            </button>
          ))}
        </div>
        <div>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => store.createLoadout(true, selectedDefender, 'defender')}
            className="disabled:cursor-not-allowed text-body-500 dark:text-dark-100 disabled:text-body-200 dark:disabled:text-dark-500 hover:text-green transition-colors"
            data-tooltip-id="tooltip"
            data-tooltip-content="Add new defender setup"
          >
            <IconPlus aria-label="Add new loadout" />
          </button>
        </div>
      </div>
      <div className="bg-tile sm:rounded-b-lg dark:bg-dark-300 text-black dark:text-white shadow-lg flex flex-col">
        <div className="px-5 py-3 border-b-body-400 dark:border-b-dark-200 border-b flex justify-between items-center font-serif">
          <div className="min-w-0">
            <LoadoutName name={loadouts[selectedDefender].name} renameLoadout={(i, n) => store.renameLoadout(i, n, 'defender')} index={selectedDefender} />
            <div className="text-xs font-bold text-gray-500 dark:text-gray-300">
              Level {calculateCombatLevel(player.skills)}
            </div>
          </div>
          <div className="flex gap-1">
            <WikiSyncButton />
            <button
              type="button"
              onClick={() => store.deleteLoadout(selectedDefender, 'defender')}
              className="disabled:cursor-not-allowed text-body-500 dark:text-dark-100 disabled:text-btns-100 dark:disabled:text-dark-500 hover:text-red transition-colors"
              data-tooltip-id="tooltip"
              data-tooltip-content="Remove loadout"
            >
              <IconTrash aria-label="Remove loadout" />
            </button>
          </div>
        </div>
        <PlayerInnerContainer side="defender" />
      </div>
    </div>
  );
});

export default DefenderContainer; 