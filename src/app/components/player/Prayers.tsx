import { observer } from 'mobx-react-lite';
import React from 'react';
import { Prayer, PrayerMap, SortedPrayers } from '@/enums/Prayer';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import GridItem from '@/app/components/generic/GridItem';
import { IconAlertTriangleFilled } from '@tabler/icons-react';

const Prayers: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];
  const { prayers } = player;
  const selectedPreReleasePrayers = prayers
    .map((prayer) => PrayerMap[prayer])
    .filter((prayer) => prayer.preRelease);
  const selectedPreReleaseNames = selectedPreReleasePrayers
    .map((prayer) => prayer.name.replace(' (pre-release)', ''))
    .join(', ');

  return (
    <div className="px-4 mb-8">
      <div className="grid grid-cols-4 gap-y-4 mt-6 w-48 m-auto items-center justify-center">
        {
          SortedPrayers.map(([k, v]) => (
            <GridItem
              key={k}
              item={parseInt(k)}
              name={v.name}
              image={v.image}
              active={prayers.includes(parseInt(k))}
              warning={v.preRelease}
              onClick={(p: Prayer) => store.togglePlayerPrayer(p, side)}
            />
          ))
        }
      </div>
      {selectedPreReleasePrayers.length > 0 && (
        <div className="flex items-center gap-2 mt-5 px-3 py-2 text-xs text-orange-900 bg-orange-100 border border-orange-300 rounded dark:text-orange-100 dark:bg-orange-950 dark:border-orange-700">
          <IconAlertTriangleFilled className="w-4 shrink-0" />
          <span>
            {`Pre-release prayer selected: ${selectedPreReleaseNames}. Its effects may change before release.`}
          </span>
        </div>
      )}
    </div>
  );
});

export default Prayers;
