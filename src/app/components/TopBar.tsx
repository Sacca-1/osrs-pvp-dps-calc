import { useStore } from '@/state';
import {
  IconBrandDiscord,
  IconShare2,
} from '@tabler/icons-react';
import wiki from '@/public/img/Wiki@2x.webp';
import React from 'react';
import { observer } from 'mobx-react-lite';
import Changelog from '@/app/components/Changelog';

const TopBar: React.FC = observer(() => {
  const store = useStore();

  return (
    <div className="mx-auto px-3 sm:px-6 lg:px-8 bg-btns-400 dark:bg-dark-500 shadow border-b-4 border-body-500 dark:border-dark-200">
      <div className="relative flex items-center justify-between h-16">
        <div className="flex-1 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center gap-2 select-none">
            <h1 className="font-bold font-serif text-white">PvP DPS calculator based on</h1>
            <a target="_blank" href="https://oldschool.runescape.wiki"><img src={wiki.src} className="w-12" alt="OSRS Wiki" /></a>
          </div>
          <div className="block ml-6">
            <div className="flex text-body-200 text-xs font-medium space-x-2">
              <Changelog />
              <a
                href="https://discord.com/users/687630346845683752"
                target="_blank"
                className="transition-all hover:scale-105 no-underline text-white border border-transparent bg-[#5865F2] py-1.5 px-2.5 rounded-md flex items-center gap-1"
              >
                <IconBrandDiscord size={20} aria-label="Discord" />
                <div className="hidden md:block">Feedback? Message me</div>
              </a>
              <button
                type="button"
                className="transition-all hover:scale-105 hover:text-white border border-body-500 bg-[#3e2816] py-1.5 px-2.5 rounded-md dark:bg-dark-300 dark:border-dark-200 flex items-center gap-1"
                onClick={() => {
                  store.updateUIState({ showShareModal: true });
                }}
              >
                <IconShare2 size={20} aria-label="Share loadout" />
                <div className="hidden md:block">Share loadout</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TopBar;
