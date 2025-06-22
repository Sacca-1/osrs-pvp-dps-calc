import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import Spinner from '@/app/components/Spinner';
import { ACCURACY_PRECISION, DPS_PRECISION, EXPECTED_HIT_PRECISION } from '@/lib/constants';
import { Player } from '@/types/Player';
import PlayerVsPlayerCalc from '@/lib/PlayerVsPlayerCalc';
import { max, min, some } from 'd3-array';

interface PvpResultsTableProps { defenderIndex: number }

// Helper to format numeric values like in PvM table
const fmt = (key:string, value:number): string => {
  switch(key){
    case 'accuracy':
    case 'specAccuracy':
      return `${(value*100).toFixed(ACCURACY_PRECISION)}%`;
    case 'dps':
    case 'specMomentDps':
      return value.toFixed(DPS_PRECISION);
    case 'specFullDps':
      return value.toPrecision(DPS_PRECISION);
    case 'expectedHit':
    case 'specExpected':
      return value.toFixed(EXPECTED_HIT_PRECISION);
    case 'ttk':
      return value === 0 ? '-----' : `${value.toFixed(1)}s`;
    default:
      return value.toFixed(0);
  }
};

const PvpResultsTable:React.FC<PvpResultsTableProps> = observer(({ defenderIndex }) => {
  const store = useStore();
  const { prefs, selectedAttacker } = store;
  const defender = store.defenderLoadouts[defenderIndex];
  const attackers = store.attackerLoadouts;

  type CalcKey = 'maxHit'|'expectedHit'|'dps'|'ttk'|'accuracy'|'maxAttackRoll'|'npcDefRoll'|'specAccuracy'|'specMomentDps'|'specFullDps'|'specMaxHit'|'specExpected';

  const expanded = prefs.resultsExpanded;

  const rowDefs: {key: CalcKey, label: string, title?: string, group?: string}[] = [
    {key:'maxHit', label:'Max hit', title:'The maximum hit that you will deal to the opponent'},
    ...(expanded ? [{key:'expectedHit', label:'Expected hit', title:'The average damage per attack, including misses.'}] : []),
    {key:'dps', label:'DPS', title:'Average damage per second'},
    {key:'ttk', label:'Avg. TTK', title:'Average time to defeat the opponent (in seconds)'},
    {key:'accuracy', label:'Accuracy', title:'How accurate you are against the opponent'},
    ...(!expanded ? [{key:'specExpected', label:'Spec expected hit', title:'Expected hit that the special attack will deal'} as any] : []),
  ];

  if(expanded){
    rowDefs.push({key: 'header_rolls' as any, label:'Rolls', group:'header'} as any);
    rowDefs.push({key:'maxAttackRoll', label:'Attack roll', title:'Your max attack roll'});
    rowDefs.push({key:'npcDefRoll', label:'Opponent def roll', title:'Opponent defence roll'});
    rowDefs.push({key: 'header_spec' as any, label:'Special attack', group:'header'} as any);
    rowDefs.push({key:'specAccuracy', label:'Accuracy', title:'Accuracy of your special attack'});
    rowDefs.push({key:'specMomentDps', label:'DPS', title:'Average DPS with infinite special energy'});
    rowDefs.push({key:'specFullDps', label:'Spec-only DPS', title:'DPS of special attack including regen'});
    rowDefs.push({key:'specMaxHit', label:'Max hit', title:'Max hit of your special attack'});
    rowDefs.push({key:'specExpected', label:'Expected hit', title:'Expected hit of your special attack'});
  }

  const calcs = attackers.map((a)=> new PlayerVsPlayerCalc(a as Player, defender as Player, {mode:'pvp'}));
  const hasResults = some(calcs, (c)=> c !== undefined);

  const getValue = (c:PlayerVsPlayerCalc, key:CalcKey): number | undefined => {
    switch(key){
      case 'maxHit': return c.getMax();
      case 'expectedHit': return c.getExpectedDamage();
      case 'dps': return c.getDps();
      case 'ttk': return c.getTtk();
      case 'accuracy': return c.getHitChance();
      case 'maxAttackRoll': return c.getMaxAttackRoll();
      case 'npcDefRoll': return c.getNPCDefenceRoll();
      default: return undefined;
    }
  };

  // Build table
  return (
    <table>
      <thead>
        <tr>
          <th aria-label="blank" className="bg-btns-400 border-r dark:bg-dark-500 select-none" />
          {attackers.map(({name},i)=>(
            // eslint-disable-next-line react/no-array-index-key
            <th
              key={i}
              className={`text-center w-28 border-r py-1.5 font-bold font-serif leading-tight text-xs ${selectedAttacker===i && store.selectedDefender===defenderIndex?'bg-orange-400 dark:bg-orange-700':'bg-btns-400 dark:bg-dark-500'}`}
              onClick={()=> {
                store.setSelectedLoadout(i);
                store.setSelectedDefender(defenderIndex);
              }}
            >
              {name}
            </th>))}
        </tr>
      </thead>
      <tbody>
        {rowDefs.map((row, ri)=>{
          if(row.group==='header'){
            return (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={ri}>
                <th className="t-group-header" colSpan={999}>{row.label}</th>
              </tr>
            );
          }

          const aggregator = ['ttk','npcDefRoll'].includes(row.key)?min:max;
          const bestVal = aggregator(calcs, (c,i)=> {
            const attacker = attackers[i] as Player;
            const v = (row.key.startsWith('spec')) ? (()=>{
              const specCalc = new PlayerVsPlayerCalc(attacker, defender as Player, {mode:'pvp', usingSpecialAttack:true});
              switch(row.key){
                case 'specAccuracy': return specCalc.getHitChance();
                case 'specMomentDps': return specCalc.getDps();
                case 'specFullDps': return undefined;
                case 'specMaxHit': return specCalc.getMax();
                case 'specExpected': return specCalc.getExpectedDamage();
                default: return undefined;
              }
            })() : getValue(c, row.key as any);
            return v === undefined ? (row.key==='ttk'||row.key==='npcDefRoll'? Number.POSITIVE_INFINITY : -Infinity) : v;
          });

          return (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={ri} className="odd:bg-body-100/50 dark:odd:bg-dark-400/50">
              <th className="w-40 px-4 border-r bg-btns-400 dark:bg-dark-500 select-none cursor-help underline decoration-dotted decoration-gray-300" title={row.title}>{row.label}</th>
              {calcs.map((c,ci)=>{
                const attacker = attackers[ci] as Player;
                const v = row.key.startsWith('spec') ? (()=>{
                  const specCalc = new PlayerVsPlayerCalc(attacker, defender as Player, {mode:'pvp', usingSpecialAttack:true});
                  switch(row.key){
                    case 'specAccuracy': return specCalc.getHitChance();
                    case 'specMomentDps': return specCalc.getDps();
                    case 'specFullDps': return undefined;
                    case 'specMaxHit': return specCalc.getMax();
                    case 'specExpected': return specCalc.getExpectedDamage();
                    default: return undefined;
                  }
                })() : getValue(c, row.key as any);
                const txt = v===undefined? 'N/A': fmt(row.key, v);
                const isBest = (v!==undefined) && (v===bestVal) && attackers.length>1;
                // eslint-disable-next-line react/no-array-index-key
                return <th key={ci} className={`text-center w-28 border-r ${isBest?'dark:text-green-200 text-green-800':'dark:text-body-200 text-black'}`}>{ hasResults ? txt : <Spinner className="w-3"/>}</th>;})}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});

export default PvpResultsTable; 