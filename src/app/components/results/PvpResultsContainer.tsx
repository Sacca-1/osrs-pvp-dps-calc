import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import AutoHeight from '@/app/components/generic/AutoHeight';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import PvpResultsTable from '@/app/components/results/PvpResultsTable';
import PvpHitDistribution from '@/app/components/results/PvpHitDistribution';

const PvpResultsContainer: React.FC = observer(() => {
  const store = useStore();
  const { prefs } = store;

  // Only show when in PvP mode and calc is available
  if (!store.isPvpMode || !store.pvpCalc) return null;

  return (
    <div className="grow basis-1/4 md:mt-9 flex flex-col">
      <div className="sm:rounded shadow-lg bg-tile dark:bg-dark-300">
        <div className="px-4 py-3.5 border-b-body-400 bg-body-100 dark:bg-dark-400 dark:border-b-dark-200 border-b md:rounded md:rounded-bl-none md:rounded-br-none flex justify-between items-center">
          <h2 className="font-serif text-lg tracking-tight font-bold dark:text-white flex items-center gap-2">Results</h2>
        </div>
        <AutoHeight duration={200} height="auto">
          <div className="overflow-x-auto max-w-[100vw]">
            {store.defenderLoadouts.map((d,ix)=>{
              const showLabel = store.defenderLoadouts.length>1;
              return (
                // eslint-disable-next-line react/no-array-index-key
                <div key={ix} className="mb-4">
                  {showLabel && (
                    <h4 className="font-serif text-center my-1 text-gray-300">vs {d.name}</h4>
                  )}
                  <PvpResultsTable defenderIndex={ix} />
                </div>
              );
            })}
          </div>
        </AutoHeight>
        <button
          type="button"
          className="text-sm px-4 py-1 bg-dark-500 text-gray-300 w-full shadow border-t border-dark-200 flex justify-between items-center rounded-b" 
          onClick={() => store.updatePreferences({ resultsExpanded: !prefs.resultsExpanded })}
        >
          {prefs.resultsExpanded ? (
            <>
              <IconArrowUp size={15} />
              <div>Show less</div>
              <IconArrowUp size={15} />
            </>
          ) : (
            <>
              <IconArrowDown size={15} />
              <div>Show more</div>
              <IconArrowDown size={15} />
            </>
          )}
        </button>
      </div>
      <PvpHitDistribution />
    </div>
  );
});

export default PvpResultsContainer;
