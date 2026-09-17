import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { getDepartmentRankPyramid, DepartmentRankPyramid } from '../../../utils/manpowerCalculator';

interface RankPyramidModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDept?: string;
}

const DEPARTMENTS = ['全部單位', '二部', '三部', '五部', '六部', '七部'];

export const RankPyramidModal: React.FC<RankPyramidModalProps> = ({
  isOpen,
  onClose,
  initialDept = '全部單位',
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(initialDept);

  if (!isOpen) return null;

  const data: DepartmentRankPyramid = getDepartmentRankPyramid(selectedDept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  DRILL-THROUGH REPORT
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                  黃金比例 (20% : 40% : 40%)
                </span>
              </div>
              <h2 className="text-base font-bold text-white">
                單位職等結構與接班金字塔鑽取分析
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Department Switcher */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>選擇分析單位:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">在職基準人數</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {data.totalHeadcount} <span className="text-xs font-normal text-slate-500">人</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>2-3 職等 (基層)</span>
                <span>目標 20%</span>
              </div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">
                {data.junior.count} 人{' '}
                <span className="text-xs font-semibold">({data.junior.percent}%)</span>
              </div>
              <div className="text-[11px] mt-0.5">
                偏差:{' '}
                <span
                  className={
                    data.junior.deviation < 0
                      ? 'text-rose-600 font-bold'
                      : 'text-emerald-700 font-bold'
                  }
                >
                  {data.junior.deviation > 0 ? `+${data.junior.deviation}%` : `${data.junior.deviation}%`}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                <span>4 職等 (中階/副主任)</span>
                <span>目標 40%</span>
              </div>
              <div className="text-xl font-bold text-blue-900 mt-0.5">
                {data.middle.count} 人{' '}
                <span className="text-xs font-semibold">({data.middle.percent}%)</span>
              </div>
              <div className="text-[11px] mt-0.5">
                偏差:{' '}
                <span className="font-bold text-blue-700">
                  {data.middle.deviation > 0 ? `+${data.middle.deviation}%` : `${data.middle.deviation}%`}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <div className="flex items-center justify-between text-xs text-purple-700 font-medium">
                <span>5-7 職等 (主管/所長)</span>
                <span>目標 40%</span>
              </div>
              <div className="text-xl font-bold text-purple-900 mt-0.5">
                {data.senior.count} 人{' '}
                <span className="text-xs font-semibold">({data.senior.percent}%)</span>
              </div>
              <div className="text-[11px] mt-0.5">
                偏差:{' '}
                <span
                  className={
                    data.senior.deviation > 0
                      ? 'text-amber-700 font-bold'
                      : 'text-purple-700 font-bold'
                  }
                >
                  {data.senior.deviation > 0 ? `+${data.senior.deviation}%` : `${data.senior.deviation}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Golden Ratio Pyramid Visualizer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>金字塔比例對照圖 (實際 vs 目標 20% : 40% : 40%)</span>
              <span className="text-xs font-normal text-slate-500">標準：穩定營造梯隊結構</span>
            </h4>

            {/* Senior Tier (Top) */}
            <div className="mb-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                  <span>5-7 職等：專案案主管 / 所長 / 處主管</span>
                </span>
                <span>
                  實際 {data.senior.count} 人 ({data.senior.percent}%) / 目標 40%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
                <div
                  className="bg-purple-600 h-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ width: `${Math.min(100, data.senior.percent * 2)}%` }}
                >
                  {data.senior.percent}%
                </div>
              </div>
            </div>

            {/* Middle Tier (Center) */}
            <div className="mb-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span>4 職等：中階資深工程師 / 副主任 (接班梯隊)</span>
                </span>
                <span>
                  實際 {data.middle.count} 人 ({data.middle.percent}%) / 目標 40%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ width: `${Math.min(100, data.middle.percent * 2)}%` }}
                >
                  {data.middle.percent}%
                </div>
              </div>
            </div>

            {/* Junior Tier (Base) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span>2-3 職等：基層現場監造工程師</span>
                </span>
                <span>
                  實際 {data.junior.count} 人 ({data.junior.percent}%) / 目標 20%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ width: `${Math.min(100, data.junior.percent * 2)}%` }}
                >
                  {data.junior.percent}%
                </div>
              </div>
            </div>
          </div>

          {/* Expert Diagnosis Card */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {selectedDept} 職等金字塔診斷報告
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {data.diagnosis}
                </p>
              </div>
            </div>
          </div>

          {/* Succession & Promotion Pipeline Analysis */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>4 職等晉升 5 職等接班梯隊推估 (Succession Pipeline)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500">合格中階工程師 (4職等)</span>
                <div className="text-lg font-bold text-slate-800 mt-1">
                  {data.promotionPipeline.eligibleMiddleEngineers} 人
                </div>
                <span className="text-[11px] text-slate-400">平均任職 2.5 年以上</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500">年度晉升能量 (以 15% 計)</span>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  預估升任 {data.promotionPipeline.projectedPromotionsNextYear} 人
                </div>
                <span className="text-[11px] text-slate-400">培育成熟可接任主管</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500">未來新案主管需求</span>
                <div className="text-lg font-bold text-slate-800 mt-1">
                  約 {data.promotionPipeline.projectManagerDemand} 人
                </div>
                <span className="text-[11px] text-slate-400">
                  {data.promotionPipeline.shortfall > 0
                    ? `缺口 ${data.promotionPipeline.shortfall} 人`
                    : '內部供應充裕'}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span><b>接班策略建議：</b>{data.promotionPipeline.suggestion}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
