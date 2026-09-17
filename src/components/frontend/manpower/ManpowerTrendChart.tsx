import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingUp, Layers, Info, Calendar } from 'lucide-react';
import { QuarterSummaryData } from '../../../types';
import { BASE_SNAPSHOT_QUARTER } from '../../../utils/manpowerCalculator';

interface ManpowerTrendChartProps {
  quarterSummaries: QuarterSummaryData[];
  selectedQuarter: string;
  onSelectQuarter: (q: string) => void;
  recruitTriggerQuarter: string | null;
  warningThresholdPercent: number;
}

export const ManpowerTrendChart: React.FC<ManpowerTrendChartProps> = ({
  quarterSummaries,
  selectedQuarter,
  onSelectQuarter,
  recruitTriggerQuarter,
  warningThresholdPercent,
}) => {
  const [chartMode, setChartMode] = useState<'supply_demand' | 'role_stack'>('supply_demand');

  // Format data for recharts
  const chartData = quarterSummaries.map((q) => ({
    quarter: q.quarter,
    calculatedDemand: q.calculatedDemand,
    projectedSupply: q.projectedSupply,
    manualTargetDemand: q.manualTargetDemand,
    netGap: Math.max(0, q.netGap),
    gapPercent: q.gapPercent,
    isWarning: q.isWarning,
    manager: q.calculatedBreakdown.manager,
    civil: q.calculatedBreakdown.civil,
    mep: q.calculatedBreakdown.mep,
    safety: q.calculatedBreakdown.safety,
    admin: q.calculatedBreakdown.admin,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = quarterSummaries.find((q) => q.quarter === label);
    if (!dataItem) return null;

    const isTrigger = label === recruitTriggerQuarter;
    const isBase = label === BASE_SNAPSHOT_QUARTER;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[200px] backdrop-blur-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
          <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {label}
          </span>
          <div className="flex items-center gap-1">
            {isBase && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                現況基準
              </span>
            )}
            {isTrigger && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                啟動招募
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-blue-300">
            <span>試算目標需求:</span>
            <span className="font-bold text-white text-sm">{dataItem.calculatedDemand} 人</span>
          </div>
          <div className="flex justify-between items-center text-emerald-300">
            <span>預估留任供給:</span>
            <span className="font-bold text-white text-sm">{dataItem.projectedSupply} 人</span>
          </div>
          <div className="flex justify-between items-center text-amber-300">
            <span>既有人工目標:</span>
            <span className="font-medium text-slate-200">{dataItem.manualTargetDemand} 人</span>
          </div>
          <div className="pt-1.5 border-t border-slate-700/80 flex justify-between items-center">
            <span className="text-slate-300">淨人力缺口:</span>
            <span
              className={`font-bold ${
                dataItem.netGap > 0
                  ? dataItem.gapPercent >= warningThresholdPercent
                    ? 'text-rose-400'
                    : 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {dataItem.netGap > 0 ? `+${dataItem.netGap} 人` : `${dataItem.netGap} 人`} (
              {dataItem.gapPercent}%)
            </span>
          </div>
        </div>

        {chartMode === 'role_stack' && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
            <div>案主管: <b className="text-white">{dataItem.calculatedBreakdown.manager}</b></div>
            <div>建築土建: <b className="text-white">{dataItem.calculatedBreakdown.civil}</b></div>
            <div>機電工程: <b className="text-white">{dataItem.calculatedBreakdown.mep}</b></div>
            <div>職安管理: <b className="text-white">{dataItem.calculatedBreakdown.safety}</b></div>
            <div>外業營管: <b className="text-white">{dataItem.calculatedBreakdown.admin}</b></div>
          </div>
        )}

        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 text-center">
          點擊此季度切換全域報表現況
        </div>
      </div>
    );
  };

  return (
    <div id="power-bi-trend-chart-card" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                VISUAL 01
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                24 季人力供需預測與招募啟動前置趨勢線
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            2025Q1 至 2030Q4 跨 24 季演算；以 2026Q3 (259人) 為在職基準點並結合自然離職衰減模型
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-medium text-slate-600">
            <button
              onClick={() => setChartMode('supply_demand')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                chartMode === 'supply_demand'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              供需對比視角
            </button>
            <button
              onClick={() => setChartMode('role_stack')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                chartMode === 'role_stack'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              職能結構堆疊
            </button>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
            onClick={(state) => {
              if (state && state.activeLabel) {
                onSelectQuarter(String(state.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              interval={0}
              angle={-30}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="人"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />

            {/* 2026Q3 現況基準點垂直標記線 */}
            <ReferenceLine
              x={BASE_SNAPSHOT_QUARTER}
              stroke="#2563eb"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: '2026Q3 基準點',
                position: 'top',
                fill: '#2563eb',
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* 招募啟動季度垂直標記線 */}
            {recruitTriggerQuarter && (
              <ReferenceLine
                x={recruitTriggerQuarter}
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: '提前2季啟動招募',
                  position: 'insideTopLeft',
                  fill: '#e11d48',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}

            {chartMode === 'supply_demand' ? (
              <>
                {/* 淨缺口長條 */}
                <Bar
                  dataKey="netGap"
                  name="淨缺口 (需招募/承攬)"
                  barSize={14}
                  radius={[4, 4, 0, 0]}
                  fill="#fca5a5"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.quarter === selectedQuarter
                          ? '#dc2626'
                          : entry.isWarning
                          ? '#f87171'
                          : '#cbd5e1'
                      }
                    />
                  ))}
                </Bar>

                {/* 試算目標需求折線 */}
                <Line
                  type="monotone"
                  dataKey="calculatedDemand"
                  name="系統試算需求 (Demand)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />

                {/* 預估留任供給折線 */}
                <Line
                  type="monotone"
                  dataKey="projectedSupply"
                  name="留任供給預測 (Supply, 衰退模型)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: '#059669' }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />

                {/* 既有人工計畫目標 */}
                <Line
                  type="monotone"
                  dataKey="manualTargetDemand"
                  name="原人工目標 (計畫表對照)"
                  stroke="#f59e0b"
                  strokeWidth={1.8}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </>
            ) : (
              <>
                {/* 堆疊職能長條圖 */}
                <Bar dataKey="manager" name="案主管" stackId="roleStack" fill="#3b82f6" />
                <Bar dataKey="civil" name="建築土建" stackId="roleStack" fill="#10b981" />
                <Bar dataKey="mep" name="機電工程" stackId="roleStack" fill="#f59e0b" />
                <Bar dataKey="safety" name="職安管理" stackId="roleStack" fill="#ec4899" />
                <Bar dataKey="admin" name="外業營管" stackId="roleStack" fill="#8b5cf6" />
                <Line
                  type="monotone"
                  dataKey="projectedSupply"
                  name="留任供給線"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>試算需求線 (依工期節點階梯試算)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>供給線 (2026Q3 基準 259 人遞減)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span>
            <span>缺口警示柱 (缺口佔比 &gt; 15%)</span>
          </div>
        </div>
        <div className="text-[11px] text-blue-600 font-medium">
          💡 點選任一季度可切換下方案場甘特與部室明細
        </div>
      </div>
    </div>
  );
};
