import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';

const PvpResults: React.FC = observer(() => {
  const store = useStore();
  const pvp = store.pvpCalc;

  if (!pvp) return null;

  const attackerName = store.attackerLoadouts[store.selectedAttacker].name;
  const defenderName = store.defenderLoadouts[store.selectedDefender].name;

  const attackerCalc = pvp.calc;
  const defenderCalc = pvp.reverse;

  const formatPct = (v:number) => `${(v * 100).toFixed(1)}%`;

  const rows = [
    {
      label: 'Max hit',
      attacker: attackerCalc.getMax().toFixed(0),
      defender: defenderCalc.getMax().toFixed(0),
    },
    {
      label: 'Accuracy',
      attacker: formatPct(attackerCalc.getHitChance()),
      defender: formatPct(defenderCalc.getHitChance()),
    },
    {
      label: 'DPS',
      attacker: pvp.attackerDps.toFixed(2),
      defender: pvp.defenderDps.toFixed(2),
    },
    {
      label: 'Average TTK',
      attacker: attackerCalc.getTtk().toFixed(1),
      defender: defenderCalc.getTtk().toFixed(1),
    },
  ];

  return (
    <div className="bg-tile dark:bg-dark-300 md:rounded shadow-lg max-w-[100vw] my-2 p-4 text-black dark:text-white">
      <h3 className="font-serif font-bold text-lg mb-4 flex justify-between items-center">
        <span>PvP Results</span>
        <span className="text-sm font-normal">{attackerName} vs {defenderName}</span>
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-serif px-2 py-1" />
            <th className="text-center font-serif px-2 py-1 border-x border-body-400 dark:border-dark-200">{attackerName}</th>
            <th className="text-center font-serif px-2 py-1">{defenderName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="odd:bg-body-100/50 dark:odd:bg-dark-400/50">
              <td className="px-2 py-1 font-bold">{r.label}</td>
              <td className="px-2 py-1 text-center border-x border-body-400 dark:border-dark-200">{r.attacker}</td>
              <td className="px-2 py-1 text-center">{r.defender}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default PvpResults; 