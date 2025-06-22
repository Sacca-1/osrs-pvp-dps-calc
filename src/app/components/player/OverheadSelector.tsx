import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import { Prayer } from '@/enums/Prayer';
import ProtectMagic from '@/public/img/prayers/Protect_from_Magic.png';
import ProtectMelee from '@/public/img/prayers/Protect_from_Melee.png';
import ProtectRanged from '@/public/img/prayers/Protect_from_Missiles.png';
import GridItem from '@/app/components/generic/GridItem';

const OVERHEADS: { prayer: Prayer, name: string, image: any }[] = [
  { prayer: Prayer.PROTECT_MELEE, name: 'Protect Melee', image: ProtectMelee },
  { prayer: Prayer.PROTECT_MISSILES, name: 'Protect Missiles', image: ProtectRanged },
  { prayer: Prayer.PROTECT_MAGIC, name: 'Protect Magic', image: ProtectMagic },
];

const OverheadSelector: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];
  const { overheadPrayer } = player;

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="font-bold text-sm mb-1">Overhead Prayer</div>
      <div className="grid grid-cols-3 gap-2">
        {OVERHEADS.map((o) => (
          <GridItem
            key={o.prayer}
            item={o.prayer}
            name={o.name}
            image={o.image}
            active={overheadPrayer === o.prayer}
            onClick={(p: Prayer) => {
              store.updatePlayer({ overheadPrayer: overheadPrayer === p ? null : p }, undefined, side);
            }}
          />
        ))}
      </div>
    </div>
  );
});

export default OverheadSelector; 