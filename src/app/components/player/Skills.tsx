import React from 'react';

import attack from '@/public/img/bonuses/attack.png';
import strength from '@/public/img/bonuses/strength.png';
import defence from '@/public/img/bonuses/defence.png';
import ranged from '@/public/img/bonuses/ranged.png';
import magic from '@/public/img/bonuses/magic.png';
import hitpoints from '@/public/img/bonuses/hitpoints.png';
import prayer from '@/public/img/tabs/prayer.png';
import { observer } from 'mobx-react-lite';
import UsernameLookup from '@/app/components/player/skills/UsernameLookup';
import SkillInput from '@/app/components/player/skills/SkillInput';
import Potion from '@/enums/Potion';
import { PotionMap } from '@/utils';
import BuffItem from '@/app/components/player/buffs/BuffItem';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';

const Skills: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];

  const allowedPotions = [
    Potion.SUPER_COMBAT,
    Potion.RANGING,
    Potion.IMBUED_HEART,
    Potion.SATURATED_HEART,
    Potion.FORGOTTEN_BREW,
  ];

  return (
    <div className="px-4 mt-4 flex flex-col mb-6 grow">
      {/* Stat presets */}
      <div className="flex gap-1 mb-2">
        {[
          { label: 'Pure', stats: { atk: 60, str: 99, def: 1, hp: 99, ranged: 99, magic: 99, prayer: 52 } },
          { label: 'Zerk', stats: { atk: 60, str: 99, def: 45, hp: 99, ranged: 99, magic: 99, prayer: 52 } },
          { label: 'Med', stats: { atk: 75, str: 99, def: 75, hp: 99, ranged: 99, magic: 99, prayer: 77 } },
          { label: 'Main', stats: { atk: 99, str: 99, def: 99, hp: 99, ranged: 99, magic: 99, prayer: 99 } },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            className="px-2 py-0.5 text-xs bg-body-100 dark:bg-dark-400 border border-body-300 dark:border-dark-200 rounded hover:bg-body-200 dark:hover:bg-dark-300"
            onClick={() => {
              store.updatePlayer({ skills: { ...player.skills, ...p.stats }, boosts: {} }, undefined, side);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center">
        <UsernameLookup />
      </div>
      <div className="mt-4">
        <div className="grid items-center gap-x-2" style={{ gridTemplateColumns: '2fr 2fr 2fr 2fr' }}>
          <SkillInput name="Attack" field="atk" image={attack} />
          <SkillInput name="Strength" field="str" image={strength} />
          <SkillInput name="Defence" field="def" image={defence} />
          <SkillInput name="Hitpoints" field="hp" image={hitpoints} />
          <SkillInput name="Ranged" field="ranged" image={ranged} />
          <SkillInput name="Magic" field="magic" image={magic} />
          <SkillInput name="Prayer" field="prayer" image={prayer} />
        </div>
      </div>
      <h4 className="mt-4 font-bold font-serif">
        Boosts
      </h4>
      <div className="mt-2 bg-white dark:bg-dark-500 dark:border-dark-200 rounded border border-gray-300">
        {
          Object.entries(PotionMap)
            .filter(([k]) => allowedPotions.includes(parseInt(k) as Potion))
            .sort((a, b) => a[1].order - b[1].order)
            .map(([k, v]) => {
              const potion: Potion = parseInt(k);
              const isActive = player.buffs.potions.includes(potion);

              return (
                <BuffItem
                  key={k}
                  potion={potion}
                  name={v.name}
                  image={v.image}
                  active={isActive}
                  setActive={(potion) => store.togglePlayerPotion(potion, side)}
                />
              );
            })
        }
      </div>
    </div>
  );
});

export default Skills;
