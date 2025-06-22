import React, { useMemo } from 'react';
import SectionAccordion from '@/app/components/generic/SectionAccordion';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { Player } from '@/types/Player';
import PlayerVsPlayerCalc from '@/lib/PlayerVsPlayerCalc';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import hourglass from '@/public/img/Hourglass.png';
import LazyImage from '@/app/components/generic/LazyImage';
import { max } from 'd3-array';

interface PvpTtkProps { defenderIndex: number }

const SECONDS_PER_TICK = 0.6;

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  if(active&&payload&&payload.length){
    return (
      <div className="bg-white shadow rounded p-2 text-sm text-black flex items-center gap-2">
        <div>
          <p><strong>Within {label} ticks</strong></p>
          {payload.map((p)=>(<div key={p.name} className="flex justify-between w-40"><span className="flex items-center gap-1"><span className="w-3 h-3 inline-block border border-gray-400 rounded-lg" style={{backgroundColor:p.color}} />{p.name}</span><span className="text-gray-400 font-bold">{p.value}%</span></div>))}
        </div>
      </div>
    );
  }
  return null;
};

const PvpTtkComparison:React.FC<PvpTtkProps>=observer(({ defenderIndex })=>{
  const store = useStore();
  const { showTtkComparison } = store.prefs;
  const defender = store.defenderLoadouts[defenderIndex] as Player;

  const data = useMemo(()=>{
    const lines: {name:string,[key:string]:number|string}[]=[];
    const attackers = store.attackerLoadouts as Player[];
    const ttkDists = attackers.map(a=> new PlayerVsPlayerCalc(a, defender,{mode:'pvp'}).getTtkDistribution());
    const maxTick = max(ttkDists, d=> Math.max(...Array.from(d.keys())) )||0;
    const running:number[]=[];
    for(let t=0;t<=maxTick;t++){
      const row: any = { name: t };
      ttkDists.forEach((dist,i)=>{
        const v = dist.get(t) || 0;
        running[i]=(running[i]||0)+v;
        row[attackers[i].name]= (running[i]*100).toFixed(2);
      });
      lines.push(row);
    }
    return lines;
  },[store.attackerLoadouts,defender]);

  // colour palette
  const colours=['cyan','yellow','lime','orange','pink','#8B9BE8'];

  return (
    <SectionAccordion
      defaultIsOpen={showTtkComparison}
      onIsOpenChanged={(o)=>store.updatePreferences({showTtkComparison:o})}
      title={<div className="flex items-center gap-2"><div className="w-6 flex justify-center"><LazyImage src={hourglass.src}/></div><h3 className="font-serif font-bold">Time-to-Kill Graph (vs {defender.name})</h3></div>}
    >
      <div className="px-6 py-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{top:40,right:20}}>
            <XAxis dataKey="name" stroke="#777" label={{value:'Ticks',position:'insideBottom',offset:-15}} />
            <YAxis stroke="#777" domain={[0,100]} tickFormatter={(v:number)=>`${v}%`} label={{value:'chance',position:'insideLeft',angle:-90,style:{textAnchor:'middle'}}}/>
            <CartesianGrid stroke="gray" strokeDasharray="5 5" />
            <Tooltip content={CustomTooltip} />
            <Legend wrapperStyle={{fontSize:'.9em',top:0}}/>
            {store.attackerLoadouts.map((a,i)=>{
              const colour=colours[i%colours.length];
              return (<Line key={a.name} isAnimationActive={false} type="monotone" dataKey={a.name} stroke={colour} dot={false} connectNulls />);
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionAccordion>
  );
});

export default PvpTtkComparison; 