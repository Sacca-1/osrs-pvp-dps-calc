import React, {
  useEffect, useState, useCallback, useMemo,
} from 'react';
import SectionAccordion from '@/app/components/generic/SectionAccordion';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { Player } from '@/types/Player';
import equipmentStats from '@/public/img/Equipment Stats.png';
import LazyImage from '@/app/components/generic/LazyImage';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { CompareRequest, WorkerRequestType } from '@/worker/CalcWorkerTypes';
import { CompareResult, CompareXAxis, CompareYAxis } from '@/lib/Comparator';
import { useCalc } from '@/worker/CalcWorker';
import { keys } from '@/utils';
import { playerToMonster } from '@/lib/PlayerVsPlayerCalc';

// Duplicates the PvM comparison graph but vs a defender loadout.
interface PvpLoadoutComparisonProps { defenderIndex: number }

const XAxisOptions = [
  { label: 'Opponent defence level', axisLabel: 'Level', value: CompareXAxis.MONSTER_DEF },
  { label: 'Opponent HP', axisLabel: 'Hitpoints', value: CompareXAxis.MONSTER_HP },
  { label: 'Player attack level', axisLabel: 'Level', value: CompareXAxis.PLAYER_ATTACK_LEVEL },
  { label: 'Player strength level', axisLabel: 'Level', value: CompareXAxis.PLAYER_STRENGTH_LEVEL },
];

const YAxisOptions = [
  { label: 'Player DPS', axisLabel: 'DPS', value: CompareYAxis.PLAYER_DPS },
  { label: 'Player expected hit', axisLabel: 'Hit', value: CompareYAxis.PLAYER_EXPECTED_HIT },
  { label: 'Time-to-kill', axisLabel: 'Seconds', value: CompareYAxis.PLAYER_TTK },
];

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow rounded p-2 text-sm text-black flex items-center gap-2">
        <div>
          <p><strong>{label}</strong></p>
          {payload.map((p) => (
            <div key={p.name} className="flex justify-between w-40 gap-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 inline-block border border-gray-400 rounded-lg" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
              <span className="text-gray-400 font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PvpLoadoutComparison: React.FC<PvpLoadoutComparisonProps> = observer(({ defenderIndex }) => {
  const calc = useCalc();
  const store = useStore();
  const defender = store.defenderLoadouts[defenderIndex] as Player;
  const defenderMonster = playerToMonster(defender, -200 - defenderIndex);

  const loadoutsJson = JSON.stringify(store.attackerLoadouts);
  const defenderJson = JSON.stringify(defenderMonster);

  const [compareResult, setCompareResult] = useState<CompareResult>();
  const xAxisType = XAxisOptions[0];
  const yAxisType = YAxisOptions[0];
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !xAxisType || !yAxisType || !calc.isReady()) { setCompareResult(undefined); return; }
    const req:CompareRequest = {
      type: WorkerRequestType.COMPARE,
      data: {
        loadouts: JSON.parse(loadoutsJson),
        monster: JSON.parse(defenderJson),
        axes: { x: xAxisType.value, y: yAxisType.value },
      },
    };
    calc.do(req).then((r) => setCompareResult(r.payload)).catch(() => {});
  }, [isOpen, loadoutsJson, defenderJson, xAxisType, yAxisType, calc]);

  const [tickCount, domainMax] = useMemo(() => {
    if (!compareResult?.domainMax) return [1, 1];
    const highest = Math.ceil(compareResult.domainMax);
    const step = 10 ** Math.floor(Math.log10(highest) - 1);
    const ceil = Math.ceil(highest / step) * step - 1 / 1e9;
    const count = 1 + Math.ceil(highest / step);
    return [count, ceil];
  }, [compareResult]);

  const generateLines = useCallback(() => {
    if (!compareResult?.entries.length) return [];
    const colours = ['cyan', 'yellow', 'lime', 'orange', 'pink', '#8B9BE8'];
    const lines:React.ReactNode[] = [];
    keys(compareResult.entries[0]).forEach((k) => { if (k !== 'name') { const colour = colours.shift() || 'red'; lines.push(<Line key={k} type="monotone" dataKey={k} stroke={colour} dot={false} isAnimationActive={false} />); colours.push(colour); } });
    return lines;
  }, [compareResult]);

  return (
    <SectionAccordion
      defaultIsOpen
      onIsOpenChanged={(o) => setIsOpen(o)}
      title={(
        <div className="flex items-center gap-2">
          <div className="w-6 flex justify-center"><LazyImage src={equipmentStats.src} /></div>
          <h3 className="font-serif font-bold">
            Loadout Comparison Graph (vs
            {defender.name}
            )
          </h3>
        </div>
)}
    >
      {compareResult && (
        <div className="px-6 py-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={compareResult.entries} margin={{ top: 40, right: 20 }}>
              <XAxis dataKey="name" stroke="#777" label={{ value: xAxisType?.axisLabel, position: 'insideBottom', offset: -15 }} />
              <YAxis
                stroke="#777"
                domain={[0, domainMax]}
                tickCount={tickCount}
                label={{
                  value: yAxisType?.axisLabel, position: 'insideLeft', angle: -90, style: { textAnchor: 'middle' },
                }}
              />
              <CartesianGrid stroke="gray" strokeDasharray="5 5" />
              <Tooltip content={CustomTooltip} />
              <Legend wrapperStyle={{ fontSize: '.9em', top: 0 }} />
              {generateLines()}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionAccordion>
  );
});

export default PvpLoadoutComparison;
