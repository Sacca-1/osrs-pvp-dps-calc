import { observer } from 'mobx-react-lite';
import React from 'react';
import { Prayer, SortedPrayers } from '@/enums/Prayer';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import GridItem from '@/app/components/generic/GridItem';

const Prayers: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];
  const { prayers } = player;

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
              onClick={(p: Prayer) => store.togglePlayerPrayer(p, side)}
            />
          ))
        }
      </div>
    </div>
  );
});

export default Prayers;
