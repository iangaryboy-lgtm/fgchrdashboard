import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectPlan } from '../../types';
import { normalizeDateString, formatDecimal } from '../../utils/parser';
import { matchCandidatesForProject } from '../../utils/matching';
import {
  CalendarRange,
  Filter,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Clock,
  Layers,
  Building,
  Flag,
  Info,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';

// 六都 + 其他縣市 篩選選項
const REGION_OPTIONS = [
  { id: 'ALL', label: '全部區域' },
  { id: '台北市', label: '台北市' },
  { id: '新北市', label: '新北市' },
  { id: '桃園市', label: '桃園市' },
  { id: '台中市', label: '台中市' },
  { id: '台南市', label: '台南市' },
  { id: '高雄市', label: '高雄市' },
  { id: '其他縣市', label: '其他縣市' },
];

// 關鍵里程碑定義
interface MilestonePoint {
  id: string;
  name: string;
  shortName: string;
  dateStr: string;
  date: Date;
  type: 'permit' | 'selection' | 'start' | 'fl1' | 'fl2' | 'fl6' | 'license' | 'release' | 'handover' | 'committee';
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

// 施工階段定義
interface StageSpan {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  startStr: string;
  endStr: string;
  color: string; // Tailwind class or hex
  textColor: string;
  description: string;
}

// 單一案場的甘特圖計算資訊
interface ProjectGanttItem {
  project: ProjectPlan;
  regionCategory: string; // 六都或其它
  startYear: number;
  openQuarter: string;
  minDate: Date;
  maxDate: Date;
  stages: StageSpan[];
  milestones: MilestonePoint[];
  selectionDate: Date | null;
  selectionDateStr: string;
  selectionDaysRemain: number;
  isSelectionUrgent: boolean;
}

// Helper: 產生安全 Date 物件
function parseDateSafe(dateStr?: string | null): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null;
  const norm = normalizeDateString(dateStr);
  if (!norm) return null;
  const d = new Date(norm + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function formatDateDisplay(d?: Date | null): string {
  if (!d || isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export const ProjectGanttDashboard: React.FC = () => {
  const { projectPlans, candidates } = useApp();

  // 篩選器狀態
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [timelineZoom, setTimelineZoom] = useState<'year' | 'quarter' | 'month'>('quarter');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'URGENT_SELECTION' | 'PRE_START' | 'UNDER_CONSTRUCTION' | 'NEAR_COMPLETION'>('ALL');
  
  // 檢視詳情彈窗
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<ProjectPlan | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    text: string;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  // 1. 整理可選的年份與季度選項
  const { yearOptions, quarterOptions } = useMemo(() => {
    const years = new Set<number>();
    const quarters = new Set<string>();

    projectPlans.forEach((p) => {
      if (p.openYear) years.add(p.openYear);
      if (p.openQuarter) quarters.add(p.openQuarter);
      const s = parseDateSafe(p.startWorkDate);
      if (s) years.add(s.getFullYear());
      const sel = parseDateSafe(p.selectionDate);
      if (sel) years.add(sel.getFullYear());
    });

    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const sortedQuarters = Array.from(quarters).sort();

    return {
      yearOptions: sortedYears.map((y) => ({ id: String(y), label: `${y} 年` })),
      quarterOptions: sortedQuarters.map((q) => ({ id: q, label: q.replace('Q', '年Q') })),
    };
  }, [projectPlans]);

  // 2. 將各案場計算完整的施工階段與關鍵里程碑排程
  const processedGanttItems: ProjectGanttItem[] = useMemo(() => {
    return projectPlans.map((proj) => {
      // 判斷六都歸屬
      const rawReg = (proj.region || proj.normalizedRegion || '').trim();
      let regionCat = '其他縣市';
      if (['台北市', '臺北市'].some((k) => rawReg.includes(k))) regionCat = '台北市';
      else if (rawReg.includes('新北市')) regionCat = '新北市';
      else if (rawReg.includes('桃園市')) regionCat = '桃園市';
      else if (rawReg.includes('台中市') || rawReg.includes('臺中市')) regionCat = '台中市';
      else if (rawReg.includes('台南市') || rawReg.includes('臺南市')) regionCat = '台南市';
      else if (rawReg.includes('高雄市')) regionCat = '高雄市';

      // 關鍵時間點解析
      const permitDate = parseDateSafe(proj.permitDate);
      const selectionDate = parseDateSafe(proj.selectionDate);
      const startDate = parseDateSafe(proj.startWorkDate) || (permitDate ? new Date(permitDate.getTime() + 75 * 86400000) : new Date(2026, 6, 1));
      
      // 使照日：若無則依開工後約 1095 天 (3年) 推估
      const licenseFDate = parseDateSafe(proj.licenseFDate) || new Date(startDate.getTime() + 1095 * 86400000);
      
      // 案前啟動：開工日前約 180 天 (6個月)
      const preWorkDate = new Date(startDate.getTime() - 180 * 86400000);
      
      // 中間施工節點 (依工期天數比例估算)
      const totalWorkDuration = Math.max(licenseFDate.getTime() - startDate.getTime(), 365 * 86400000);
      const fl1Date = new Date(startDate.getTime() + totalWorkDuration * 0.20); // 地下室出地面
      const fl2Date = new Date(startDate.getTime() + totalWorkDuration * 0.35); // 2FL
      const fl6Date = new Date(startDate.getTime() + totalWorkDuration * 0.55); // 6FL 結構加速
      
      // 後續里程碑
      const releaseDate = parseDateSafe(proj.standardReleaseDate) || new Date(licenseFDate.getTime() + 150 * 86400000);
      const handoverDate = parseDateSafe(proj.handoverDate) || new Date(licenseFDate.getTime() + 180 * 86400000);
      const committeeDate = parseDateSafe(proj.committeeDate) || new Date(licenseFDate.getTime() + 270 * 86400000);

      // 施工階段清單 (按工期順序)
      const stages: StageSpan[] = [
        {
          id: 'stage-pre',
          name: '案前籌備期',
          startDate: preWorkDate,
          endDate: startDate,
          startStr: formatDateDisplay(preWorkDate),
          endStr: formatDateDisplay(startDate),
          color: 'bg-amber-500/80 hover:bg-amber-500',
          textColor: 'text-amber-900',
          description: '建照取得、案主管遴選啟動、前期規劃與發包籌備',
        },
        {
          id: 'stage-foundation',
          name: '地下開挖與基礎',
          startDate: startDate,
          endDate: fl1Date,
          startStr: formatDateDisplay(startDate),
          endStr: formatDateDisplay(fl1Date),
          color: 'bg-blue-600/85 hover:bg-blue-600',
          textColor: 'text-blue-900',
          description: '基樁、連續壁、土方開挖與地下室結構體',
        },
        {
          id: 'stage-structure',
          name: '地上主體結構',
          startDate: fl1Date,
          endDate: fl6Date,
          startStr: formatDateDisplay(fl1Date),
          endStr: formatDateDisplay(fl6Date),
          color: 'bg-indigo-600/85 hover:bg-indigo-600',
          textColor: 'text-indigo-900',
          description: '1FL~6FL~頂樓 RC/SRC 結構體澆置',
        },
        {
          id: 'stage-finishing',
          name: '裝修景觀與機電',
          startDate: fl6Date,
          endDate: licenseFDate,
          startStr: formatDateDisplay(fl6Date),
          endStr: formatDateDisplay(licenseFDate),
          color: 'bg-emerald-600/85 hover:bg-emerald-600',
          textColor: 'text-emerald-900',
          description: '室內裝修、機電配管、外牆帷幕、景觀與取得使用執照',
        },
        {
          id: 'stage-handover',
          name: '交屋售服與管委會',
          startDate: licenseFDate,
          endDate: committeeDate,
          startStr: formatDateDisplay(licenseFDate),
          endStr: formatDateDisplay(committeeDate),
          color: 'bg-purple-600/80 hover:bg-purple-600',
          textColor: 'text-purple-900',
          description: '使照核發後客戶驗屋、標準釋出日(F+150)、交屋與成立管委會',
        },
      ];

      // 關鍵里程碑標記
      const milestones: MilestonePoint[] = [];

      if (permitDate) {
        milestones.push({
          id: 'ms-permit',
          name: '建照取得日 (C)',
          shortName: 'C建照',
          dateStr: formatDateDisplay(permitDate),
          date: permitDate,
          type: 'permit',
          color: 'text-sky-600',
          bgColor: 'bg-sky-500',
          borderColor: 'border-sky-300',
          description: `預計取得建照日：${formatDateDisplay(permitDate)}`,
        });
      }

      if (selectionDate) {
        milestones.push({
          id: 'ms-selection',
          name: '案主管遴選日 (C-45)',
          shortName: '主管遴選',
          dateStr: formatDateDisplay(selectionDate),
          date: selectionDate,
          type: 'selection',
          color: 'text-rose-600',
          bgColor: 'bg-rose-500',
          borderColor: 'border-rose-400',
          description: `案主管遴選日：${formatDateDisplay(selectionDate)}（C建照日前45天啟動遴選評估與人選適配）`,
        });
      }

      milestones.push({
        id: 'ms-start',
        name: '預計動工日 (C+75)',
        shortName: '開工日',
        dateStr: formatDateDisplay(startDate),
        date: startDate,
        type: 'start',
        color: 'text-blue-600',
        bgColor: 'bg-blue-600',
        borderColor: 'border-blue-400',
        description: `現場實質動工日：${formatDateDisplay(startDate)}`,
      });

      milestones.push({
        id: 'ms-license',
        name: '使照核發日 (F)',
        shortName: 'F使照',
        dateStr: formatDateDisplay(licenseFDate),
        date: licenseFDate,
        type: 'license',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-600',
        borderColor: 'border-emerald-400',
        description: `使用執照取得日：${formatDateDisplay(licenseFDate)}`,
      });

      milestones.push({
        id: 'ms-release',
        name: '主管標準釋出日 (F+150)',
        shortName: '主管釋出',
        dateStr: formatDateDisplay(releaseDate),
        date: releaseDate,
        type: 'release',
        color: 'text-violet-600',
        bgColor: 'bg-violet-600',
        borderColor: 'border-violet-400',
        description: `使照後150天主管達標準釋出條件：${formatDateDisplay(releaseDate)}`,
      });

      // 遴選倒數與急迫度判斷 (基準日 2026-06-17)
      const refNow = new Date('2026-06-17T00:00:00');
      let selectionDaysRemain = 999;
      let isSelectionUrgent = false;

      if (selectionDate) {
        selectionDaysRemain = Math.round((selectionDate.getTime() - refNow.getTime()) / 86400000);
        isSelectionUrgent = selectionDaysRemain <= 90; // 90天內或已到期
      }

      const minDate = preWorkDate;
      const maxDate = committeeDate;

      return {
        project: proj,
        regionCategory: regionCat,
        startYear: startDate.getFullYear(),
        openQuarter: proj.openQuarter || `${startDate.getFullYear()}Q${Math.floor(startDate.getMonth() / 3) + 1}`,
        minDate,
        maxDate,
        stages,
        milestones,
        selectionDate,
        selectionDateStr: formatDateDisplay(selectionDate),
        selectionDaysRemain,
        isSelectionUrgent,
      };
    });
  }, [projectPlans]);

  // 3. 根據篩選條件過濾案場
  const filteredGanttItems = useMemo(() => {
    return processedGanttItems.filter((item) => {
      // 區域篩選 (六都 + 其他)
      if (selectedRegion !== 'ALL') {
        if (selectedRegion === '其他縣市') {
          if (['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'].includes(item.regionCategory)) {
            return false;
          }
        } else if (item.regionCategory !== selectedRegion) {
          return false;
        }
      }

      // 年份篩選
      if (selectedYear !== 'ALL') {
        const yNum = parseInt(selectedYear, 10);
        const hasYearMatch =
          item.startYear === yNum ||
          item.project.openYear === yNum ||
          (item.selectionDate && item.selectionDate.getFullYear() === yNum);
        if (!hasYearMatch) return false;
      }

      // 季度篩選
      if (selectedQuarter !== 'ALL') {
        if (item.openQuarter !== selectedQuarter && item.project.openQuarter !== selectedQuarter) {
          return false;
        }
      }

      // 狀態階段篩選
      if (stageFilter === 'URGENT_SELECTION' && !item.isSelectionUrgent) return false;
      if (stageFilter === 'PRE_START' && item.selectionDaysRemain < 0) return false;

      // 關鍵字搜尋 (案號、區域、單位、主管等)
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const p = item.project;
        const match =
          (p.projectCode && p.projectCode.toLowerCase().includes(kw)) ||
          (p.region && p.region.toLowerCase().includes(kw)) ||
          (p.scaleType && p.scaleType.toLowerCase().includes(kw)) ||
          (p.department && p.department.toLowerCase().includes(kw)) ||
          (p.matchedLeaderName && p.matchedLeaderName.toLowerCase().includes(kw));
        if (!match) return false;
      }

      return true;
    });
  }, [processedGanttItems, selectedRegion, selectedYear, selectedQuarter, stageFilter, searchKeyword]);

  // 4. 計算時間軸全域範圍 (最早與最晚日期)
  const timelineRange = useMemo(() => {
    if (filteredGanttItems.length === 0) {
      const start = new Date(2025, 0, 1);
      const end = new Date(2030, 11, 31);
      return { start, end, totalDays: (end.getTime() - start.getTime()) / 86400000 };
    }

    let minT = Infinity;
    let maxT = -Infinity;

    filteredGanttItems.forEach((item) => {
      if (item.minDate.getTime() < minT) minT = item.minDate.getTime();
      if (item.maxDate.getTime() > maxT) maxT = item.maxDate.getTime();
    });

    // 擴展邊界緩衝 30 天
    const start = new Date(minT - 30 * 86400000);
    const end = new Date(maxT + 30 * 86400000);
    const totalDays = Math.max((end.getTime() - start.getTime()) / 86400000, 1);

    return { start, end, totalDays };
  }, [filteredGanttItems]);

  // 5. 產生甘特圖上方時間軸標記 (依年份/季度生成垂直刻度)
  const timeAxisTicks = useMemo(() => {
    const { start, end } = timelineRange;
    const ticks: {
      date: Date;
      label: string;
      subLabel: string;
      percent: number;
      isYearBoundary: boolean;
    }[] = [];

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    for (let y = startYear; y <= endYear; y++) {
      for (let q = 1; q <= 4; q++) {
        const m = (q - 1) * 3;
        const tickDate = new Date(y, m, 1);
        if (tickDate >= start && tickDate <= end) {
          const percent = ((tickDate.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
          ticks.push({
            date: tickDate,
            label: `${y} Q${q}`,
            subLabel: `${y}年`,
            percent,
            isYearBoundary: q === 1,
          });
        }
      }
    }

    return ticks;
  }, [timelineRange]);

  // Helper: 計算日期在時間軸上的百分比位置
  const getPercentPosition = (d: Date) => {
    const { start, end } = timelineRange;
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return 0;
    const pos = ((d.getTime() - start.getTime()) / totalMs) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  // 統計數據
  const stats = useMemo(() => {
    const totalCount = filteredGanttItems.length;
    const urgentCount = filteredGanttItems.filter((i) => i.isSelectionUrgent).length;
    const nextQCount = filteredGanttItems.filter(
      (i) => i.selectionDaysRemain >= 0 && i.selectionDaysRemain <= 90
    ).length;
    const assignedCount = filteredGanttItems.filter((i) => i.project.matchedLeaderName).length;

    return { totalCount, urgentCount, nextQCount, assignedCount };
  }, [filteredGanttItems]);

  return (
    <div className="space-y-4">
      {/* 頂部標題與快速統計列 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>開案計畫甘特圖 (工程階段與主管遴選時程)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  輕量視覺化
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                視覺化展現各個案場之預計開案、施工階段里程碑，並精確鎖定案主管需要遴選之時間點 (C-45)
              </p>
            </div>
          </div>
        </div>

        {/* 快速統計指標 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <Building className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold leading-none">納入案場</div>
              <div className="text-sm font-black text-slate-800 font-mono mt-0.5">{stats.totalCount} 案</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-rose-600" />
            <div>
              <div className="text-[10px] text-rose-600 font-semibold leading-none">90天內待遴選</div>
              <div className="text-sm font-black text-rose-700 font-mono mt-0.5">{stats.urgentCount} 案</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-emerald-600 font-semibold leading-none">已推薦人選</div>
              <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">{stats.assignedCount} 案</div>
            </div>
          </div>
        </div>
      </div>

      {/* 篩選工具列：六都 + 其他、年份、季度、關鍵字 */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* 第一列：六都快速按鈕篩選 */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mr-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>地區篩選：</span>
          </div>
          {REGION_OPTIONS.map((r) => {
            const isSelected = selectedRegion === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRegion(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* 第二列：年份、季度下拉與關鍵字搜尋 */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* 年份下拉 */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500">年份:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">全年度</option>
                {yearOptions.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 季度下拉 */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500">開案季度:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">全季度</option>
                {quarterOptions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 狀態切換 */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500">遴選焦點:</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as any)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">全部案場</option>
                <option value="URGENT_SELECTION">🔥 90天內需要遴選 (急迫)</option>
                <option value="PRE_START">尚未開工 (籌劃中)</option>
              </select>
            </div>
          </div>

          {/* 搜尋欄位與重設 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋案號、區域、單位..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(selectedRegion !== 'ALL' || selectedYear !== 'ALL' || selectedQuarter !== 'ALL' || stageFilter !== 'ALL' || searchKeyword) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion('ALL');
                  setSelectedYear('ALL');
                  setSelectedQuarter('ALL');
                  setStageFilter('ALL');
                  setSearchKeyword('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
              >
                重設條件
              </button>
            )}
          </div>
        </div>

        {/* 里程碑顏色圖例 (Legend) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
          <span className="font-bold text-slate-700">圖例說明：</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-xs inline-block"></span>
            <span className="font-semibold text-rose-700">★ C-45 案主管遴選日 (核心節點)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow-xs inline-block"></span>
            <span>建照取得 (C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs inline-block"></span>
            <span>預計動工</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-xs inline-block"></span>
            <span>使照取得 (F)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-violet-600 border-2 border-white shadow-xs inline-block"></span>
            <span>主管標準釋出 (F+150)</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>點擊任一案場可開啟完整工程與主管適配報告</span>
          </div>
        </div>
      </div>

      {/* 主甘特圖視圖 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* 甘特圖容器 - 支援水平捲動 */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px] select-none">
            {/* 時間軸 Header 列 */}
            <div className="flex items-stretch border-b border-slate-200 bg-slate-50/90 sticky top-0 z-20">
              {/* 左側案場資訊標頭固定區 */}
              <div className="w-80 shrink-0 p-3 border-r border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
                <span>案場名稱 / 規模 / 區域</span>
                <span className="text-[11px] text-slate-400 font-medium">遴選倒數</span>
              </div>

              {/* 右側時間軸刻度列 */}
              <div className="flex-1 relative h-10">
                {timeAxisTicks.map((t, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 flex flex-col justify-center px-1 border-l border-slate-200/80 text-[10px]"
                    style={{ left: `${t.percent}%` }}
                  >
                    <span
                      className={`font-mono font-bold truncate ${
                        t.isYearBoundary ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 甘特圖案場列表列 */}
            <div className="divide-y divide-slate-100">
              {filteredGanttItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  無符合篩選條件的案場，請嘗試放寬篩選條件。
                </div>
              ) : (
                filteredGanttItems.map((item) => {
                  const p = item.project;
                  const isUrgent = item.isSelectionUrgent;

                  return (
                    <div
                      key={p.id || p.projectCode}
                      className="flex items-center hover:bg-blue-50/40 transition-colors group relative"
                    >
                      {/* 左側案場卡片列 */}
                      <div className="w-80 shrink-0 p-3 border-r border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedProjectForModal(p)}
                              className="font-bold text-xs text-blue-700 hover:text-blue-900 hover:underline font-mono truncate flex items-center gap-1 cursor-pointer"
                              title="點擊檢視案場詳細資料與人選PK報告"
                            >
                              <span>{p.projectCode}案</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                            </button>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {item.regionCategory}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-600">
                              {p.scaleType}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-2">
                            <span>開案：{item.openQuarter}</span>
                            <span>•</span>
                            <span>{p.department || '工務部'}</span>
                            {p.matchedLeaderName && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                  <UserCheck className="w-3 h-3" />
                                  {p.matchedLeaderName.split(' ')[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 主管遴選時間點提示標籤 */}
                        <div className="text-right shrink-0">
                          <div
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold inline-flex items-center gap-1 ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                            title={`遴選預定日: ${item.selectionDateStr}`}
                          >
                            <Flag className="w-3 h-3 text-rose-500" />
                            <span>{item.selectionDaysRemain > 0 ? `${item.selectionDaysRemain}天` : '即刻遴選'}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                            {item.selectionDateStr}
                          </div>
                        </div>
                      </div>

                      {/* 右側甘特圖排程長條區 */}
                      <div className="flex-1 relative h-14 overflow-hidden">
                        {/* 垂直時間網格背景線 */}
                        {timeAxisTicks.map((t, idx) => (
                          <div
                            key={idx}
                            className={`absolute top-0 bottom-0 border-l pointer-events-none ${
                              t.isYearBoundary ? 'border-slate-200/90' : 'border-slate-100'
                            }`}
                            style={{ left: `${t.percent}%` }}
                          />
                        ))}

                        {/* 今日基準線 (2026-06-17) */}
                        {(() => {
                          const todayDate = new Date('2026-06-17T00:00:00');
                          const todayPercent = getPercentPosition(todayDate);
                          if (todayPercent > 0 && todayPercent < 100) {
                            return (
                              <div
                                className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-400 z-10 pointer-events-none"
                                style={{ left: `${todayPercent}%` }}
                                title="今日參考基準日 (2026/06/17)"
                              />
                            );
                          }
                          return null;
                        })()}

                        {/* 各施工階段長條 (橫向分段 Gantt Bars) */}
                        <div className="absolute inset-y-3 flex items-center left-0 right-0">
                          {item.stages.map((stage) => {
                            const leftPercent = getPercentPosition(stage.startDate);
                            const rightPercent = getPercentPosition(stage.endDate);
                            const widthPercent = Math.max(rightPercent - leftPercent, 0.8);

                            return (
                              <div
                                key={stage.id}
                                className={`absolute h-6 rounded-md ${stage.color} border border-white/40 shadow-xs flex items-center px-1.5 text-[10px] font-bold text-white transition-all cursor-pointer group/bar`}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                                title={`${stage.name}\n期間: ${stage.startStr} ~ ${stage.endStr}\n${stage.description}`}
                                onClick={() => setSelectedProjectForModal(p)}
                              >
                                <span className="truncate drop-shadow-xs">{stage.name}</span>
                              </div>
                            );
                          })}

                          {/* 關鍵里程碑 Pin 標記 (建照、遴選日、動工、使照) */}
                          {item.milestones.map((ms) => {
                            const msPercent = getPercentPosition(ms.date);
                            const isSelection = ms.type === 'selection';

                            return (
                              <div
                                key={ms.id}
                                className="absolute z-10 -translate-x-1/2 flex flex-col items-center group/ms cursor-pointer"
                                style={{ left: `${msPercent}%` }}
                                onClick={() => setSelectedProjectForModal(p)}
                              >
                                {/* Pin 標記圖示 */}
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-md transition-transform group-hover/ms:scale-125 ${
                                    isSelection
                                      ? 'bg-rose-500 text-white ring-2 ring-rose-300 ring-offset-1 animate-bounce'
                                      : `${ms.bgColor} text-white`
                                  }`}
                                  title={`${ms.name}\n預計日期: ${ms.dateStr}\n${ms.description}`}
                                >
                                  {isSelection ? '★' : '•'}
                                </div>

                                {/* 懸浮彈出資訊標籤 */}
                                <div className="hidden group-hover/ms:flex absolute bottom-6 z-30 flex-col items-center whitespace-nowrap pointer-events-none">
                                  <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-slate-700">
                                    <div className="font-bold text-amber-300">{ms.name}</div>
                                    <div className="text-slate-300 font-mono">{ms.dateStr}</div>
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 底部說明 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>紅色五角星代表【C-45 案主管遴選節點】，點擊任一案場可直接查閱「4大專案指標 PK 總表」與適配人選報告。</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            資料更新基準：2026/06/17 • 遠雄營造工程戰情系統
          </div>
        </div>
      </div>

      {/* 點擊案場彈出之主管適配與工程詳情彈窗 */}
      {selectedProjectForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-md text-xs font-mono font-bold">
                    {selectedProjectForModal.projectCode}案
                  </span>
                  <h3 className="text-base font-bold">案主管適配推薦與時程分析報告</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-100 mt-2">
                  <span>區域：{selectedProjectForModal.region || selectedProjectForModal.normalizedRegion}</span>
                  <span>·</span>
                  <span>規模：{selectedProjectForModal.scaleTier || selectedProjectForModal.scaleType} ({Number(selectedProjectForModal.totalFloorArea || 0).toLocaleString()} ㎡)</span>
                  <span>·</span>
                  <span>C-45 遴選預定日：<strong className="text-white font-mono">{selectedProjectForModal.selectionDate}</strong></span>
                  <span>·</span>
                  <span>預計動工日：<strong className="text-amber-300 font-mono">{selectedProjectForModal.startWorkDate}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProjectForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* 工程規格與關鍵排程速覽 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">地上/地下樓層</span>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    地上 {selectedProjectForModal.abovegroundFloors || '-'} / 地下 {selectedProjectForModal.undergroundFloors || '-'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">棟數 / 戶數</span>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {selectedProjectForModal.buildingsCount || 0} 棟 / {selectedProjectForModal.unitsCount || 0} 戶
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">特殊工法條件</span>
                  <div className="text-sm font-bold text-blue-700 mt-0.5">
                    {selectedProjectForModal.specialMethod && selectedProjectForModal.specialMethod !== '無'
                      ? selectedProjectForModal.specialMethod
                      : '標準工法'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">目前配對/已任主管</span>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5 truncate">
                    {selectedProjectForModal.matchedLeaderName || '待遴選推薦'}
                  </div>
                </div>
              </div>

              {/* 案主管人才庫適配排序推薦清單 */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>遴選適配度推薦評估 (依區域意願、案場規模與管理年資試算)</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">推薦</th>
                        <th className="py-2.5 px-3">姓名 / 員編</th>
                        <th className="py-2.5 px-3">目前單位 / 職稱</th>
                        <th className="py-2.5 px-3">釋出狀態 / 季度</th>
                        <th className="py-2.5 px-3 text-center">管理年資</th>
                        <th className="py-2.5 px-3 text-center">完案數</th>
                        <th className="py-2.5 px-3 text-center">適配度</th>
                        <th className="py-2.5 px-3">推薦關鍵優勢</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matchCandidatesForProject(selectedProjectForModal, candidates).slice(0, 5).map((match, idx) => {
                        const cand = match.candidate;
                        return (
                          <tr key={cand.empNo} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[11px] ${
                                  idx === 0
                                    ? 'bg-amber-500 text-white'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-800'
                                    : idx === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{cand.name}</div>
                              <div className="text-[11px] font-mono text-blue-600">{cand.empNo}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800 font-medium">{cand.department}</div>
                              <div className="text-[11px] text-slate-500">{cand.title}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                {cand.releaseStatus || '可列入遴選'}
                              </span>
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                {cand.releaseQuarter || '-'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {formatDecimal(cand.internalMgmtYears, 2)} 年
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                              {cand.completedProjectsCount || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono font-black text-blue-700 text-sm px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                                {Math.round(match.totalScore)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                {match.reasons.slice(0, 2).map((r, rIdx) => (
                                  <div key={rIdx} className="text-[11px] text-slate-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                可前往「人資戰情室前台 ➜ 案主管人才庫儀表板」執行正式指派與人選意願調整。
              </span>
              <button
                onClick={() => setSelectedProjectForModal(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
