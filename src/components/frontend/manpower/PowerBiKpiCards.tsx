import React from 'react';
import { Building2, Users, AlertTriangle, CheckCircle2, Bell, DollarSign } from 'lucide-react';

interface PowerBiKpiCardsProps {
  selectedQuarter: string;
  activeProjectsCount: number;
  totalDemand: number;
  totalSupply: number;
  netGap: number;
  fulfillmentRate: number;
  maxNetGap: number;
  maxNetGapQuarter: string;
  firstGapQuarter: string | null;
  recruitTriggerQuarter: string | null;
  estimatedPayrollBudgetQuarterly: number;
  warningThresholdPercent: number;
  onJumpToQuarter: (q: string) => void;
}

export const PowerBiKpiCards: React.FC<PowerBiKpiCardsProps> = ({
  selectedQuarter,
  activeProjectsCount,
  totalDemand,
  totalSupply,
  netGap,
  fulfillmentRate,
  maxNetGap,
  maxNetGapQuarter,
  firstGapQuarter,
  recruitTriggerQuarter,
  estimatedPayrollBudgetQuarterly,
  warningThresholdPercent,
  onJumpToQuarter,
}) => {
  // Gap percentage for current observed quarter (only positive when netGap > 0)
  const gapPercent = totalDemand > 0 && netGap > 0 ? Math.round((netGap / totalDemand) * 1000) / 10 : 0;
  const isHighWarning = gapPercent >= warningThresholdPercent && netGap > 0;

  // Format money into NTD Wan/Yi
  const formatMoney = (val: number) => {
    if (val >= 100000000) {
      return `${(val / 100000000).toFixed(1)} 億元`;
    }
    if (val >= 10000) {
      return `${Math.round(val / 10000).toLocaleString()} 萬元`;
    }
    return `${val.toLocaleString()} 元`;
  };

  return (
    <div id="power-bi-kpi-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* KPI 卡 1: 施工案場數 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                KPI CARD 01
              </span>
              <h4 className="text-xs font-bold text-slate-700">當季活躍施工案場</h4>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            觀測基準: {selectedQuarter}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeProjectsCount}
              <span className="text-sm font-normal text-slate-500 ml-1">案</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              涵蓋地下開挖、結構體至裝修使照現行工區
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-slate-500">工期連動試算</span>
          <span className="font-medium text-blue-600">階梯式進度人力釋放</span>
        </div>
      </div>

      {/* KPI 卡 2: 總需求 vs 供給 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                KPI CARD 02
              </span>
              <h4 className="text-xs font-bold text-slate-700">總需求 vs 供給人力</h4>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                fulfillmentRate >= 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : fulfillmentRate >= 85
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              達成率 {fulfillmentRate}%
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalDemand}
              </span>
              <span className="text-sm font-medium text-slate-500">/ 供給 {totalSupply} 人</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              需求以樓層面積係數試算；供給採自然離職遞減
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">現況在職基準定錨</span>
          <span className="font-semibold text-slate-700">2026Q3 (259人)</span>
        </div>
      </div>

      {/* KPI 卡 3: 淨缺口預警 & 招募啟動前置 - 預設以觀測季度基準當下數值呈現 */}
      <div
        className={`rounded-xl p-4 shadow-xs border transition-all ${
          isHighWarning
            ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
            : 'bg-white border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isHighWarning
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : netGap > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {netGap > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                KPI CARD 03
              </span>
              <h4 className="text-xs font-bold text-slate-700">淨缺口與招募前置預警</h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              觀測基準: {selectedQuarter}
            </span>
            {recruitTriggerQuarter && (
              <button
                onClick={() => onJumpToQuarter(recruitTriggerQuarter)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                title={`全期預警：首次缺口季為 ${firstGapQuarter || ''}，點擊跳轉至提前2季招募啟動季 ${recruitTriggerQuarter}`}
              >
                <Bell className="w-2.5 h-2.5" />
                <span>預警啟動: {recruitTriggerQuarter}</span>
              </button>
            )}
          </div>
        </div>

        {/* 觀測季度基準當下數值呈現 */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              {netGap > 0 ? (
                <>
                  <span className="text-3xl font-extrabold tracking-tight text-rose-600">
                    +{netGap}
                    <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    缺口佔比 {gapPercent}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600">
                    0
                    <span className="text-sm font-normal text-slate-500 ml-1">人缺口</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    供給充裕 (餘裕 +{Math.abs(netGap)} 人)
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <span>
                當季供需：需求 <b className="text-slate-800 font-mono">{totalDemand}</b> 人 / 供給 <b className="text-slate-800 font-mono">{totalSupply}</b> 人
              </span>
              <span className="text-slate-300">|</span>
              <span>
                全期峰值缺口: <b className="text-slate-800 font-mono">{maxNetGap > 0 ? `${maxNetGap} 人` : '無'}</b> {maxNetGap > 0 ? `(${maxNetGapQuarter})` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>觀測當季缺口薪資/承攬預估</span>
          </span>
          <span className="font-bold text-slate-800 font-mono">
            {estimatedPayrollBudgetQuarterly > 0
              ? formatMoney(estimatedPayrollBudgetQuarterly)
              : '觀測當季無缺口額外支出'}
          </span>
        </div>
      </div>
    </div>
  );
};
