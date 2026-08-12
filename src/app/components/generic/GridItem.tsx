import Image, { StaticImageData } from 'next/image';
import React from 'react';
import { observer } from 'mobx-react-lite';
import { IconAlertTriangleFilled, IconCircleCheckFilled } from '@tabler/icons-react';

interface IGridItemProps<T> {
  item: T;
  name: string;
  image: string | StaticImageData;
  onClick: (item: T) => void;
  active: boolean;
  warning?: boolean;
}

/**
 * Reusable component for clickable cells of certain grids, such as the Prayer grid.
 */
const GridItem: React.FC<IGridItemProps<number>> = observer(<T extends number>(props: IGridItemProps<T>) => {
  const {
    item, name, image, active, warning, onClick,
  } = props;

  return (
    <button
      type="button"
      data-tooltip-id="tooltip"
      data-tooltip-content={name}
      onClick={() => onClick(item)}
      className="cursor-pointer w-[28px] h-[23px] flex justify-center items-center"
    >
      <div className="relative">
        {warning && (
          <IconAlertTriangleFilled
            aria-hidden="true"
            className="absolute z-10 -top-3 -right-3 w-4 text-orange-400 drop-shadow"
          />
        )}
        {active && (
        <IconCircleCheckFilled
          className="filter drop-shadow absolute top-[-10px] left-[-12px] text-green-400 dark:text-green-200 w-5"
        />
        )}
        <Image src={image} alt={name} />
      </div>
    </button>
  );
});

export default GridItem;
