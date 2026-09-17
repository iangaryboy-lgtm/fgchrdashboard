import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
  BarChart3,
  Bell,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { QuarterSummaryData } from '../../../types';
import { BASE_SNAPSHOT_QUARTER } from '../../../utils/manpowerCalculator';

interface ManpowerDeficitSupplyTrendChartProps {
  quarterSummaries: QuarterSummaryData[];
  selectedQuarter: string;
  onSelectQuarter: (q: string) => void;
  recruitTriggerQuarter?: string | null;
  warningThresholdPercent?: number;
  kpiMetrics?: {
    maxNetGap: number;
    maxNetGapQuarter: string;
    firstGapQuarter: string | null;
    recruitTriggerQuarter: string | null;
  };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ManpowerDeficitSupplyTrendChart: React.FC<ManpowerDeficitSupplyTrendChartProps> = ({
  quarterSummaries,
  selectedQuarter,
  onSelectQuarter,
  recruitTriggerQuarter = null,
  warningThresholdPercent = 15,
  kpiMetrics,
  isExpanded,
  onToggleExpand,
}) => {
  // Chart visual modes
  const [chartMode, setChartMode] = useState<'deficit_supply' | 'net_gap_only' | 'role_breakdown'>('deficit_supply');
  
  // Time scope: 'all' (24Q), '12q', '8q' (optimized for mobile screens)
  const [timeScope, setTimeScope] = useState<'all' | '12q' | '8q'>('all');

  // Filter quarters based on time scope
  const filteredSummaries = useMemo(() => {
    if (!quarterSummaries || quarterSummaries.length === 0) return [];
    if (timeScope === '8q') {
      return quarterSummaries.slice(0, 8);
    }
    if (timeScope === '12q') {
      return quarterSummaries.slice(0, 12);
    }
    return quarterSummaries;
  }, [quarterSummaries, timeScope]);

  // Format dataset for Recharts
  const chartData = useMemo(() => {
    return filteredSummaries.map((q) => {
      const netGap = Math.max(0, q.netGap);
      const isSelected = q.quarter === selectedQuarter;
      const isOverThreshold = q.gapPercent >= warningThresholdPercent && netGap > 0;

      return {
        quarter: q.quarter,
        calculatedDemand: q.calculatedDemand,
        projectedSupply: q.projectedSupply,
        manualTargetDemand: q.manualTargetDemand,
        netGap,
        gapPercent: q.gapPercent,
        isWarning: q.isWarning,
        isOverThreshold,
        isSelected,
        manager: q.calculatedBreakdown?.manager || 0,
        civil: q.calculatedBreakdown?.civil || 0,
        mep: q.calculatedBreakdown?.mep || 0,
        safety: q.calculatedBreakdown?.safety || 0,
        admin: q.calculatedBreakdown?.admin || 0,
        activeProjectsCount: q.activeProjectsCount,
      };
    });
  }, [filteredSummaries, selectedQuarter, warningThresholdPercent]);

  // Current selected quarter's summary
  const currentQuarterItem = useMemo(() => {
    return quarterSummaries.find((q) => q.quarter === selectedQuarter) || quarterSummaries[0];
  }, [quarterSummaries, selectedQuarter]);

  // Compute summary stats for badges
  const currentDemand = currentQuarterItem?.calculatedDemand || 0;
  const currentSupply = currentQuarterItem?.projectedSupply || 0;
  const currentGap = currentQuarterItem?.netGap || 0;
  const currentGapPercent = currentQuarterItem?.gapPercent || 0;

  // Max gap metric
  const maxGap = kpiMetrics?.maxNetGap ?? Math.max(...quarterSummaries.map((q) => Math.max(0, q.netGap)));
  const maxGapQuarter =
    kpiMetrics?.maxNetGapQuarter ||
    quarterSummaries.find((q) => q.netGap === maxGap)?.quarter ||
    '-';

  // Custom rich Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = quarterSummaries.find((q) => q.quarter === label);
    if (!dataItem) return null;

    const isTrigger = label === recruitTriggerQuarter;
    const isBase = label === BASE_SNAPSHOT_QUARTER;
    const isCurrent = label === selectedQuarter;
    const netGapVal = Math.max(0, dataItem.netGap);
    const hasDeficit = netGapVal > 0;
    const isHighRisk = dataItem.gapPercent >= warningThresholdPercent && hasDeficit;

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[220px] max-w-[280px] backdrop-blur-md z-50">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100 font-mono">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{label}</span>
            {isCurrent && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                觀測中
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isBase && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
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

        <div className="space-y-1.5 font-sans">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              案場總需求:
            </span>
            <span className="font-bold text-white font-mono text-sm">
              {dataItem.calculatedDemand} 人
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              預估留任供給:
            </span>
            <span className="font-bold text-emerald-300 font-mono text-sm">
              {dataItem.projectedSupply} 人
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-700/80 flex justify-between items-center">
            <span className="text-slate-300 font-medium">人力淨缺口:</span>
            <span
              className={`font-bold font-mono text-sm ${
                hasDeficit
                  ? isHighRisk
                    ? 'text-rose-400'
                    : 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {hasDeficit ? `-${netGapVal} 人` : '供需平衡 (0人)'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>缺口佔比 / 警戒狀態:</span>
            <span
              className={`font-semibold ${
                isHighRisk ? 'text-rose-400 font-bold' : hasDeficit ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {dataItem.gapPercent}% {isHighRisk ? '(高風險警戒)' : ''}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between items-center">
            <span>現正施工案場:</span>
            <span className="font-mono text-slate-200">{dataItem.activeProjectsCount} 案</span>
          </div>
        </div>

        {chartMode === 'role_breakdown' && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300 font-mono">
            <div>案主管: <b className="text-white">{dataItem.calculatedBreakdown.manager}</b></div>
            <div>建築土建: <b className="text-white">{dataItem.calculatedBreakdown.civil}</b></div>
            <div>機電工程: <b className="text-white">{dataItem.calculatedBreakdown.mep}</b></div>
            <div>職安管理: <b className="text-white">{dataItem.calculatedBreakdown.safety}</b></div>
            <div>外業營管: <b className="text-white">{dataItem.calculatedBreakdown.admin}</b></div>
          </div>
        )}

        <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-blue-300/80 text-center flex items-center justify-center gap-1">
          <span>點擊此處將全域切換為</span>
          <strong className="text-white font-mono">{label}</strong>
        </div>
      </div>
    );
  };

  return (
    <div
      id="manpower-deficit-supply-trend-chart"
      className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs transition-all hover:border-blue-300 flex flex-col justify-between"
    >
      {/* 1. Header with Responsive Breakpoint Layout: Stacks Vertically on Mobile (< sm) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  TREND ANALYSIS
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                  各季度案場人力缺口與供給預測走勢圖
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                2025Q1 至 2030Q4 跨 24 季演進 · 2026Q3 基準 (259人) · 呈現工程需求、在職供給與人力淨缺口赤字演化
              </p>
            </div>
          </div>

          {/* Action & View Controls: Auto Stacking & Responsive Alignment */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {/* Time Scope Toggle (Essential for mobile screen legibility) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setTimeScope('8q')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === '8q'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="聚焦近 8 季精準預測 (適合行動端窄螢幕)"
              >
                近 8 季
              </button>
              <button
                onClick={() => setTimeScope('12q')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === '12q'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="聚焦近 12 季中期走勢"
              >
                近 12 季
              </button>
              <button
                onClick={() => setTimeScope('all')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === 'all'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="檢視全 24 季長期宏觀"
              >
                全 24 季
              </button>
            </div>

            {/* Visual View Mode */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setChartMode('deficit_supply')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'deficit_supply'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="供需曲線與缺口雙軸綜合走勢"
              >
                供需缺口雙軸
              </button>
              <button
                onClick={() => setChartMode('net_gap_only')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'net_gap_only'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="純人力缺口柱狀赤字分析"
              >
                淨缺口分析
              </button>
              <button
                onClick={() => setChartMode('role_breakdown')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'role_breakdown'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="五大職能工程師需求拆解"
              >
                職能拆解
              </button>
            </div>

            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer hidden md:flex items-center justify-center"
                title={isExpanded ? '還原為雙欄佈局' : '展開為全寬大圖表'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* 2. Responsive Summary Metric Pills (Mobile Stacking: 2-Cols on Mobile, 4-Cols on Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
          {/* Metric 1: Selected Quarter Demand */}
          <div className="bg-blue-50/70 border border-blue-100/80 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
              <span>{selectedQuarter} 總需求</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </span>
            <div className="text-lg sm:text-xl font-black text-blue-900 font-mono mt-0.5">
              {currentDemand} <span className="text-xs font-normal text-blue-700">人</span>
            </div>
          </div>

          {/* Metric 2: Selected Quarter Supply */}
          <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
              <span>{selectedQuarter} 預估供給</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-900 font-mono mt-0.5">
              {currentSupply} <span className="text-xs font-normal text-emerald-700">人</span>
            </div>
          </div>

          {/* Metric 3: Selected Quarter Net Deficit / Gap */}
          <div
            className={`rounded-lg p-2 border flex flex-col justify-between ${
              currentGap > 0
                ? currentGapPercent >= warningThresholdPercent
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center justify-between">
              <span>{selectedQuarter} 人力缺口</span>
              {currentGap > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </span>
            <div className="text-lg sm:text-xl font-black font-mono mt-0.5 flex items-baseline gap-1">
              {currentGap > 0 ? (
                <>
                  <span className="text-rose-600">-{currentGap}</span>
                  <span className="text-xs font-normal">人 ({currentGapPercent}%)</span>
                </>
              ) : (
                <span className="text-emerald-700 text-sm font-bold">供需平衡</span>
              )}
            </div>
          </div>

          {/* Metric 4: Max Gap Quarter & Hiring Trigger */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>全期最大缺口</span>
              {recruitTriggerQuarter && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                  {recruitTriggerQuarter} 招募
                </span>
              )}
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-800 font-mono mt-0.5 flex items-baseline gap-1">
              <span>{maxGap > 0 ? `-${maxGap}` : '0'}</span>
              <span className="text-xs font-normal text-slate-500">
                人 {maxGapQuarter !== '-' ? `(${maxGapQuarter})` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Responsive Recharts Canvas: Adapts Height for Mobile & Desktop */}
      <div className="h-[290px] sm:h-[340px] md:h-[370px] w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 15, left: -15, bottom: 25 }}
            onClick={(state) => {
              if (state && state.activeLabel) {
                onSelectQuarter(String(state.activeLabel));
              }
            }}
          >
            <defs>
              <linearGradient id="supplyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roseGapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="amberGapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.75} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={40}
            />

            {/* Left Y-Axis: Numbers in Person */}
            <YAxis
              yAxisId="people"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="人"
            />

            {/* Right Y-Axis: Deficit Percentage % */}
            {chartMode !== 'role_breakdown' && (
              <YAxis
                yAxisId="percent"
                orientation="right"
                tick={{ fontSize: 10, fill: '#f43f5e' }}
                tickLine={{ stroke: '#fca5a5' }}
                axisLine={{ stroke: '#fca5a5' }}
                unit="%"
                domain={[0, (dataMax: number) => Math.max(30, Math.ceil(dataMax * 1.2))]}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />

            {/* 2026Q3 基準點垂直線 */}
            <ReferenceLine
              yAxisId="people"
              x={BASE_SNAPSHOT_QUARTER}
              stroke="#2563eb"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              label={{
                value: '26Q3 基準 (259人)',
                position: 'top',
                fill: '#2563eb',
                fontSize: 10,
                fontWeight: 700,
              }}
            />

            {/* 招募啟動前置警示線 */}
            {recruitTriggerQuarter && (
              <ReferenceLine
                yAxisId="people"
                x={recruitTriggerQuarter}
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: '建議招募啟動',
                  position: 'insideTopLeft',
                  fill: '#e11d48',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}

            {/* 15% 缺口高風險警戒水平線 (Secondary Axis) */}
            {chartMode !== 'role_breakdown' && (
              <ReferenceLine
                yAxisId="percent"
                y={warningThresholdPercent}
                stroke="#f43f5e"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `${warningThresholdPercent}% 赤字警戒線`,
                  position: 'insideBottomRight',
                  fill: '#f43f5e',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Mode 1: 供需缺口雙軸綜合走勢 (Flagship View) */}
            {chartMode === 'deficit_supply' && (
              <>
                {/* 預估留任供給區域 */}
                <Area
                  yAxisId="people"
                  type="monotone"
                  dataKey="projectedSupply"
                  name="預估留任供給 (在職折減)"
                  fill="url(#supplyGradient)"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />

                {/* 案場總需求曲線 */}
                <Line
                  yAxisId="people"
                  type="monotone"
                  dataKey="calculatedDemand"
                  name="案場工程需求 (試算總計)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: '#1d4ed8' }}
                />

                {/* 淨人力缺口長條 */}
                <Bar
                  yAxisId="people"
                  dataKey="netGap"
                  name="人力淨缺口 (赤字人數)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = entry.quarter === selectedQuarter;
                    let fill = 'transparent';
                    if (entry.netGap > 0) {
                      fill = entry.isOverThreshold ? 'url(#roseGapGradient)' : 'url(#amberGapGradient)';
                    }
                    return (
                      <Cell
                        key={`gap-cell-${index}`}
                        fill={fill}
                        stroke={isSelected ? '#1e293b' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>

                {/* 缺口率折線 (Secondary Axis) */}
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="gapPercent"
                  name="缺口率 (%)"
                  stroke="#f43f5e"
                  strokeWidth={1.8}
                  strokeDasharray="3 2"
                  dot={false}
                />
              </>
            )}

            {/* Mode 2: 純淨缺口長條分析 */}
            {chartMode === 'net_gap_only' && (
              <>
                <Bar
                  yAxisId="people"
                  dataKey="netGap"
                  name="人力淨缺口人數"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = entry.quarter === selectedQuarter;
                    let fill = '#10b981';
                    if (entry.netGap > 0) {
                      fill = entry.isOverThreshold ? '#f43f5e' : '#f59e0b';
                    }
                    return (
                      <Cell
                        key={`gap-only-${index}`}
                        fill={fill}
                        stroke={isSelected ? '#0f172a' : 'none'}
                        strokeWidth={isSelected ? 2.5 : 0}
                      />
                    );
                  })}
                </Bar>

                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="gapPercent"
                  name="缺口率 (%)"
                  stroke="#e11d48"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#e11d48' }}
                />
              </>
            )}

            {/* Mode 3: 職能結構堆疊長條 */}
            {chartMode === 'role_breakdown' && (
              <>
                <Bar yAxisId="people" dataKey="manager" name="案主管" stackId="roleStack" fill="#3b82f6" />
                <Bar yAxisId="people" dataKey="civil" name="建築土建" stackId="roleStack" fill="#10b981" />
                <Bar yAxisId="people" dataKey="mep" name="機電工程" stackId="roleStack" fill="#f59e0b" />
                <Bar yAxisId="people" dataKey="safety" name="職安管理" stackId="roleStack" fill="#ec4899" />
                <Bar yAxisId="people" dataKey="admin" name="外業營管" stackId="roleStack" fill="#8b5cf6" />
                <Line
                  yAxisId="people"
                  type="monotone"
                  dataKey="projectedSupply"
                  name="預估供給上限"
                  stroke="#0f172a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Interactive Footer Hint */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>點擊圖表內任一季度柱狀，即刻同步切換全戰情看板觀測時間錨點</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>當前觀測季度：<strong className="text-blue-700 font-bold">{selectedQuarter}</strong></span>
          {recruitTriggerQuarter && (
            <button
              onClick={() => onSelectQuarter(recruitTriggerQuarter)}
              className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline flex items-center gap-0.5"
            >
              <span>跳轉至招募季 ({recruitTriggerQuarter})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
