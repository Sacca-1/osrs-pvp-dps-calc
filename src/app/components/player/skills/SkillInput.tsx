import { PlayerSkills } from '@/types/Player';
import Image, { StaticImageData } from 'next/image';
import React, { useId } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { useSide } from '@/sideContext';
import NumberInput from '@/app/components/generic/NumberInput';

interface SkillInputProps {
  name: string;
  field: keyof PlayerSkills;
  image: string | StaticImageData;
}

const SkillInput: React.FC<SkillInputProps> = observer((props) => {
  const store = useStore();
  const side = useSide();
  const player = side === 'attacker' ? store.attackerLoadouts[store.selectedAttacker] : store.defenderLoadouts[store.selectedDefender];
  const { name, field, image } = props;
  const id = useId();

  const currentLevel = (player.skills[field] ?? 0) + (player.boosts[field] ?? 0);

  return (
    <>
      <div className="text-sm flex justify-center">
        <Image src={image} alt={name} />
      </div>
      <div className="flex items-center w-32">
        <div className="text-sm font-mono w-14 text-right">
          {field === 'hp' ? (
            <div className="flex items-center">
              <NumberInput
                className="form-control w-full"
                id={id}
                required
                min={1}
                max={255}
                title={`Your current ${name} level`}
                value={currentLevel}
                onChange={(v) => {
                  if (!Number.isNaN(v)) {
                    store.updatePlayer({
                      boosts: {
                        [field]: v - (player.skills[field] ?? 0),
                      },
                    }, undefined, side);
                  }
                }}
              />
              /
            </div>
          ) : (
            <span title={`Your current ${name} level`}>
              {currentLevel}
              /
            </span>
          )}
        </div>
        <div className="w-12">
          <NumberInput
            className="form-control w-full"
            id={id}
            required
            min={1}
            max={255}
            title={`Your base ${name} level`}
            value={player.skills[field]}
            onChange={(v) => {
              store.updatePlayer({
                skills: {
                  [field]: v,
                },
              }, undefined, side);
            }}
          />
        </div>
      </div>
    </>
  );
});

export default SkillInput;
