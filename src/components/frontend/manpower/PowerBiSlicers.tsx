import React from 'react';
import {
  Calendar,
  Building2,
  Briefcase,
  GitFork,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import {
  QUARTERS_LIST,
  BASE_SNAPSHOT_QUARTER,
} from '../../../utils/manpowerCalculator';

interface PowerBiSlicersProps {
  selectedQuarter: string;
  onQuarterChange: (q: string) => void;
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  selectedSection: string;
  onSectionChange: (sec: string) => void;
  availableSections: string[];
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  showWhatIf: boolean;
  onToggleWhatIf: () => void;
  onResetFilters: () => void;
  hasActiveWhatIf: boolean;
}

const DEPARTMENTS = ['全部單位', '二部', '三部', '五部', '六部', '七部'];
const ROLES = ['全部職類', '案主管', '建築', '機電', '職安', '營管'];
const PHASES = [
  '全部階段',
  '案前籌劃',
  '地下開挖與結構',
  '結構施工期',
  '上部裝修與使照',
  '收尾交屋與保固',
];

export const PowerBiSlicers: React.FC<PowerBiSlicersProps> = ({
  selectedQuarter,
  onQuarterChange,
  selectedDept,
  onDeptChange,
  selectedSection,
  onSectionChange,
  availableSections,
  selectedRole,
  onRoleChange,
  selectedPhase,
  onPhaseChange,
  showWhatIf,
  onToggleWhatIf,
  onResetFilters,
  hasActiveWhatIf,
}) => {
  const isFiltered =
    selectedQuarter !== BASE_SNAPSHOT_QUARTER ||
    selectedDept !== '全部單位' ||
    selectedSection !== '全部科案' ||
    selectedRole !== '全部職類' ||
    selectedPhase !== '全部階段' ||
    hasActiveWhatIf;

  return (
    <div
      id="powerbi-global-slicers-bar"
      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                全域互動切片器 (Power BI Global Slicers)
              </h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                即時雙向聯動中
              </span>
            </div>
            <p className="text-xs text-slate-500">
              點擊任一切片條件，所有 KPI 卡片、趨勢圖、職位長條圖、甘特矩陣及明細表立即同步連動
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              id="reset-all-slicers-button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="重設為 2026Q3 基準點與全部單位預設值"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重設全部篩選</span>
            </button>
          )}

          <button
            id="toggle-what-if-simulation-button"
            onClick={onToggleWhatIf}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showWhatIf || hasActiveWhatIf
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>參數變動影響試算 (What-If)</span>
            {hasActiveWhatIf && (
              <span className="w-2 h-2 rounded-full bg-amber-200"></span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slicer 1: 觀測季度 (Timeline Slicer) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>觀測季度 (Quarter)</span>
            </label>
            <button
              onClick={() => onQuarterChange(BASE_SNAPSHOT_QUARTER)}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              跳至 26'Q3 基準
            </button>
          </div>
          <div className="relative">
            <select
              id="quarter-slicer-select"
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            >
              {QUARTERS_LIST.map((q) => (
                <option key={q} value={q}>
                  {q} {q === BASE_SNAPSHOT_QUARTER ? '★ (2026Q3 基準點)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Slicer 2: 單位與科案構面 (Hierarchical Unit & Section Slicer) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>單位與轄下科案 (Unit & Section)</span>
            </label>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
              向下鑽取
            </span>
          </div>
          {/* Layer 1: 部室單位 */}
          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            {DEPARTMENTS.map((dept) => {
              const isSelected = selectedDept === dept;
              return (
                <button
                  key={dept}
                  id={`slicer-dept-${dept}`}
                  onClick={() => onDeptChange(dept)}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>
          {/* Layer 2: 轄下科案單位向下選取 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-0.5">
              <Layers className="w-3 h-3 text-slate-400" />
              科案:
            </span>
            <select
              id="slicer-section-select"
              value={selectedSection}
              onChange={(e) => onSectionChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            >
              <option value="全部科案">全部科案 ({availableSections.length} 個)</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Slicer 3: 職務構面 (Role Slicer) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-500" />
              <span>職務構面 (Role)</span>
            </label>
            <span className="text-[10px] text-slate-400">連動長條圖</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  id={`slicer-role-${role}`}
                  onClick={() => onRoleChange(role)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slicer 4: 工程階段切片 (Project Stage Slicer) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-emerald-500" />
              <span>案場工程階段 (Stage)</span>
            </label>
            <span className="text-[10px] text-slate-400">生命週期</span>
          </div>
          <select
            id="phase-slicer-select"
            value={selectedPhase}
            onChange={(e) => onPhaseChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
          >
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
