import React from 'react';
import EquipmentGrid from '@/app/components/player/equipment/EquipmentGrid';
import Bonuses from '@/app/components/player/Bonuses';
import EquipmentPresets from '@/app/components/player/equipment/EquipmentPresets';
import EquipmentSelect from './equipment/EquipmentSelect';

interface EquipmentProps { side: 'attacker' | 'defender' }

const Equipment: React.FC<EquipmentProps> = ({ side }) => (
  <div className="px-4">
    <div className="mt-4">
      <EquipmentGrid side={side} />
    </div>
    <div className="mt-4 flex grow gap-0.5">
      <div className="basis-full">
        <EquipmentSelect side={side} />
      </div>
      <div className="basis-32">
        <EquipmentPresets side={side} />
      </div>
    </div>
    <div>
      <Bonuses />
    </div>
  </div>
);

export default Equipment;
