import React from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  X,
} from 'lucide-react';

export interface WhatIfParams {
  delayMonths: number;
  turnoverRate: number;
  makeOrBuyRatio: number;
  payrollMonthlyRate: number;
}

interface WhatIfSimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  params: WhatIfParams;
  onChangeParams: (params: WhatIfParams) => void;
  onReset: () => void;
}

export const WhatIfSimulationDrawer: React.FC<WhatIfSimulationDrawerProps> = ({
  isOpen,
  onClose,
  params,
  onChangeParams,
  onReset,
}) => {
  if (!isOpen) return null;

  const handlePreset = (preset: 'base' | 'delay' | 'outsource' | 'high_turnover') => {
    if (preset === 'base') {
      onChangeParams({
        delayMonths: 0,
        turnoverRate: 3.5,
        makeOrBuyRatio: 1.0,
        payrollMonthlyRate: 90000,
      });
    } else if (preset === 'delay') {
      onChangeParams({
        delayMonths: 6,
        turnoverRate: 3.5,
        makeOrBuyRatio: 1.0,
        payrollMonthlyRate: 90000,
      });
    } else if (preset === 'outsource') {
      onChangeParams({
        delayMonths: 0,
        turnoverRate: 3.5,
        makeOrBuyRatio: 0.75, // 75% 自建，25% 外包承攬
        payrollMonthlyRate: 95000,
      });
    } else if (preset === 'high_turnover') {
      onChangeParams({
        delayMonths: 0,
        turnoverRate: 5.5,
        makeOrBuyRatio: 1.0,
        payrollMonthlyRate: 90000,
      });
    }
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-xs relative transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                WHAT-IF SIMULATION ENGINE
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 font-medium">
                營造實務情境模擬
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              案場工期延遲、離職率與承攬自建比率動態試算
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Presets */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium mr-1 text-[11px]">快速情境:</span>
            <button
              onClick={() => handlePreset('base')}
              className="px-2 py-0.5 rounded bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium text-[11px] cursor-pointer"
            >
              基準常態
            </button>
            <button
              onClick={() => handlePreset('delay')}
              className="px-2 py-0.5 rounded bg-white text-amber-800 hover:bg-amber-100 border border-amber-200 font-medium text-[11px] cursor-pointer"
            >
              開案延遲6月
            </button>
            <button
              onClick={() => handlePreset('outsource')}
              className="px-2 py-0.5 rounded bg-white text-indigo-800 hover:bg-indigo-100 border border-indigo-200 font-medium text-[11px] cursor-pointer"
            >
              外包承攬25%
            </button>
            <button
              onClick={() => handlePreset('high_turnover')}
              className="px-2 py-0.5 rounded bg-white text-rose-800 hover:bg-rose-100 border border-rose-200 font-medium text-[11px] cursor-pointer"
            >
              高離職率5.5%
            </button>
          </div>

          <button
            onClick={onReset}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
            title="重設模擬參數"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-amber-100 transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Slider 1: 開案延遲 (0 - 12 個月) */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>開案/工期延遲 (Delay)</span>
            </span>
            <span className="font-bold text-amber-700 font-mono text-sm">
              +{params.delayMonths} 個月
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={params.delayMonths}
            onChange={(e) =>
              onChangeParams({ ...params, delayMonths: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>如期開工 (0月)</span>
            <span>延緩半年 (6月)</span>
            <span>嚴重延誤 (12月)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            模擬需求高峰遞延，分散當前人力短缺衝擊
          </p>
        </div>

        {/* Slider 2: 每季離職率 (1.0% - 8.0%) */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>每季離職率 (Turnover)</span>
            </span>
            <span className="font-bold text-rose-600 font-mono text-sm">
              {params.turnoverRate.toFixed(1)}% /季
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.5"
            value={params.turnoverRate}
            onChange={(e) =>
              onChangeParams({ ...params, turnoverRate: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>穩定 (1%)</span>
            <span>平均 (3.5%)</span>
            <span>嚴峻 (8%)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            直接影響 2026Q3 之後留任供給線複利衰退速率
          </p>
        </div>

        {/* Slider 3: 自建比率 Make vs Buy (50% - 100%) */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>自建承攬比率 (Make/Buy)</span>
            </span>
            <span className="font-bold text-indigo-600 font-mono text-sm">
              {Math.round(params.makeOrBuyRatio * 100)}% 自建
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="1.00"
            step="0.05"
            value={params.makeOrBuyRatio}
            onChange={(e) =>
              onChangeParams({ ...params, makeOrBuyRatio: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>50% 外包</span>
            <span>80% 自建</span>
            <span>100% 正職自建</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            外包部分轉由協力廠商派駐，大幅緩解正職編制需求
          </p>
        </div>

        {/* Slider 4: 標準人月薪資成本 (7萬 - 15萬) */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>人月標準成本 (FTE Rate)</span>
            </span>
            <span className="font-bold text-emerald-700 font-mono text-sm">
              {(params.payrollMonthlyRate / 10000).toFixed(1)} 萬元/月
            </span>
          </div>
          <input
            type="range"
            min="70000"
            max="150000"
            step="5000"
            value={params.payrollMonthlyRate}
            onChange={(e) =>
              onChangeParams({
                ...params,
                payrollMonthlyRate: parseInt(e.target.value, 10),
              })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>7 萬元</span>
            <span>9 萬元 (預設)</span>
            <span>15 萬元</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            將淨人力缺口即時連動試算為每季新增人事預算
          </p>
        </div>
      </div>
    </div>
  );
};
