import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  FileDown,
  FileSpreadsheet,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Eye,
  X,
  ExternalLink,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  ALL_QUARTERS,
  parseQuarterInfo,
  formatQuarterCode,
  generateFiveYearDemandStats,
  compareQuarters,
  FUTURE_QUARTER_STATS_CONFIG,
} from '../../utils/quarterlyDemandCalculator';
import { QuarterDemandStats, YearDemandStats, ProjectPlan, CandidateProfile } from '../../types';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import { ProjectStatusListModal, ProjectStatusType } from './quarterly/ProjectStatusListModal';
import { PersonnelDetailModal, TalentTab } from './quarterly/PersonnelDetailModal';
import { A3PrintPdfController } from '../common/A3PrintPdfController';
import { PrintWrapper } from '../common/PrintWrapper';

export const QuarterlyDemandDashboard: React.FC = () => {
  const { projectPlans, candidates } = useApp();

  // Data Base Date
  const baseDate = '2026-06-17';

  // 1. 選定基準季度：以目前月份進行進入頁面之動態判定基準值 (目前 9 月預設 2026年Q3 呈現)
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1~12 月
    const currentQ = Math.ceil(currentMonth / 3); // 例如 9 月 -> 第 3 季 (Q3)
    const dynamicQuarter = `${currentYear}Q${currentQ}`;
    return ALL_QUARTERS.includes(dynamicQuarter) ? dynamicQuarter : '2026Q3';
  });

  // 2. 搜尋過濾
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 3. 年度展開/收合狀態 (預設全展開)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({
    2025: true,
    2026: true,
    2027: true,
    2028: true,
    2029: true,
    2030: true,
  });

  // 當切換選定基準季度時，確保該年度必定為展開狀態
  React.useEffect(() => {
    const { year } = parseQuarterInfo(selectedQuarter);
    setExpandedYears((prev) => ({
      ...prev,
      [year]: true,
    }));
  }, [selectedQuarter]);

  // 4. 新開案 / 在建案 / 使照案 明細彈窗狀態 (支援六都 + 其他分類)
  const [projectModalConfig, setProjectModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    quarterLabel: string;
    statusType: ProjectStatusType;
    projects: ProjectPlan[];
  } | null>(null);

  // 5. 人才庫詳細名冊彈窗狀態 (支援 可供應 / 一年度預計釋出 / 培育中 / 現任在案 4 大 Tab)
  const [personnelModalQuarter, setPersonnelModalQuarter] = useState<QuarterDemandStats | null>(null);
  const [personnelModalTab, setPersonnelModalTab] = useState<TalentTab>('available');

  // 6. 說明卡展開/收合
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);
  // 7. 匯出狀態
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // 季度索引位置 (以 2026Q3 為預設基準)
  const currentQIndex = useMemo(() => {
    const idx = ALL_QUARTERS.indexOf(selectedQuarter);
    return idx >= 0 ? idx : ALL_QUARTERS.indexOf('2026Q3');
  }, [selectedQuarter]);

  // 動態計算 5 年與當前選定季度的供需數據
  const { fiveYears, currentStats } = useMemo(() => {
    return generateFiveYearDemandStats(
      projectPlans,
      candidates,
      selectedQuarter,
      searchQuery
    );
  }, [projectPlans, candidates, selectedQuarter, searchQuery]);

  // 表格呈現之年度與季度：各年度皆完整呈現 4 季度 (例如 2026 Q1~Q4)，當前選定基準季自動標註醒目
  const displayedYearGroups = useMemo(() => {
    return fiveYears.map((yg) => ({
      ...yg,
      subtotalBadge: '4 季度小計',
    }));
  }, [fiveYears]);

  // 切換前一季
  const handlePrevQuarter = () => {
    if (currentQIndex > 0) {
      setSelectedQuarter(ALL_QUARTERS[currentQIndex - 1]);
    }
  };

  // 切換下一季
  const handleNextQuarter = () => {
    if (currentQIndex < ALL_QUARTERS.length - 1) {
      setSelectedQuarter(ALL_QUARTERS[currentQIndex + 1]);
    }
  };

  // 切換特定年度展開/收合
  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // 全部展開或收合
  const handleToggleAllYears = (expand: boolean) => {
    const updated: Record<number, boolean> = {};
    fiveYears.forEach((y) => {
      updated[y.year] = expand;
    });
    setExpandedYears(updated);
  };

  // 匯出 Excel
  const handleExportExcel = () => {
    const rows: Record<string, any>[] = [];
    fiveYears.forEach((yr) => {
      yr.quarters.forEach((q) => {
        rows.push({
          年度: `${yr.year} 年度`,
          季度: q.quarter,
          時態標記: q.timelineStageLabel,
          新開案數: q.newProjectCount,
          在建案數: q.underConstructionCount,
          使照案數: q.licenseCount,
          案場總數: q.totalProjectsCount,
          可供應人才庫人數: q.availableTalentCount,
          一年內即將釋出人數: q.withinOneYearCount,
          培育中儲備幹部數: q.inTrainingCount,
          人才總池人數: q.totalTalentPoolCount,
          人選缺口: q.talentGap,
          差異數: q.variance,
        });
      });
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    exportToExcel(rows, `遠雄營造_案主管供需儀表板_${dateStr}`, '5年供需統計');
  };

  // 匯出 PDF
  const handleExportPdf = async () => {
    if (!dashboardRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('quarterly-demand-dashboard-content', {
        filename: `遠雄營造_案主管供需儀表板_A3橫式_${selectedQuarter}_${new Date().toISOString().slice(0, 10)}`,
        title: '遠雄營造 HR MASTER Pro - 案主管供需儀表板 (A3 橫式)',
        subtitle: `基準季度：${currentStats.quarterLabel} (${currentStats.timelineStageLabel}) · 5年歷程供需分析`,
        landscape: true,
        paperSize: 'a3',
        fixedWidth: 1584,
      });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF 匯出失敗，請稍後再試。');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 取得整年度指定類型的去重案場清單
  const getYearProjects = (
    yearGroup: YearDemandStats,
    type: 'new' | 'underConstruction' | 'license'
  ): ProjectPlan[] => {
    const map = new Map<string, ProjectPlan>();
    yearGroup.quarters.forEach((q) => {
      const list =
        type === 'new'
          ? q.newProjects
          : type === 'underConstruction'
          ? q.underConstructionProjects
          : q.licenseProjects;
      list.forEach((p) => {
        if (!map.has(p.projectCode)) {
          map.set(p.projectCode, p);
        }
      });
    });
    return Array.from(map.values());
  };

  return (
    <PrintWrapper
      id="quarterly-demand-dashboard-content"
      ref={dashboardRef}
      className="space-y-5 p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800"
      documentTitle="遠雄營造 案主管供需儀表板 供需平衡戰情報告"
    >
      {/* ============================================================== */}
      {/* 1. 上方控制列與篩選值區塊 (完整復刻附圖上方佈局) */}
      {/* ============================================================== */}
      <div data-pdf-block="true" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 transition-all pdf-block-avoid">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* 左側：標題與滑桿季度選擇控制項 */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* 標題與圖示 */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  案主管供需儀表板
                </h1>
                <div className="text-[11px] font-medium text-slate-500">
                  即時基準比對演算 · 動態工程人選供需模型
                </div>
              </div>
            </div>

            {/* 季度切換控制群組 (整合年份選擇、季度分段器與時間軸滑桿) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2 sm:px-3.5 sm:py-2 shadow-2xs">
              {/* 步進箭頭與當前季度時態標籤 */}
              <div className="flex items-center justify-between sm:justify-start gap-2">
                {/* 向左箭頭 */}
                <button
                  type="button"
                  id="btn-prev-quarter"
                  onClick={handlePrevQuarter}
                  disabled={currentQIndex === 0}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  title="前一季"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* 季度名稱與時態 */}
                <div className="text-center px-2 min-w-[80px]">
                  <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight tracking-tight flex items-center justify-center gap-1">
                    <span>{currentStats.quarterLabel}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentStats.timelineStageLabel === '當前基準'
                          ? 'bg-amber-500 animate-pulse'
                          : currentStats.timelineStageLabel === '未來預測'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-slate-500">
                      {currentStats.timelineStageLabel}
                    </span>
                  </div>
                </div>

                {/* 向右箭頭 */}
                <button
                  type="button"
                  id="btn-next-quarter"
                  onClick={handleNextQuarter}
                  disabled={currentQIndex === ALL_QUARTERS.length - 1}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  title="下一季"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 年份快速選擇與季度選擇鈕 */}
              <div className="flex flex-wrap items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                {/* 年度下拉/按鈕 (統一使用完整西元年) */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((yr) => {
                    const yrStr = String(yr);
                    const isYearActive = selectedQuarter.startsWith(yrStr);
                    const qNum = selectedQuarter.slice(5) || '1';
                    return (
                      <button
                        key={`quick-year-${yr}`}
                        type="button"
                        onClick={() => {
                          const newQ = `${yr}Q${qNum}`;
                          if (ALL_QUARTERS.includes(newQ)) {
                            setSelectedQuarter(newQ);
                          }
                        }}
                        className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                          isYearActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>

                {/* 季度 (Q1~Q4) 快速切換 */}
                <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  {[1, 2, 3, 4].map((q) => {
                    const currentYr = selectedQuarter.slice(0, 4) || '2026';
                    const targetQStr = `${currentYr}Q${q}`;
                    const isQActive = selectedQuarter === targetQStr;
                    const hasGap =
                      (FUTURE_QUARTER_STATS_CONFIG[targetQStr]?.gap || 0) > 0 ||
                      targetQStr === '2026Q3';
                    return (
                      <button
                        key={`quick-q-${q}`}
                        type="button"
                        onClick={() => {
                          if (ALL_QUARTERS.includes(targetQStr)) {
                            setSelectedQuarter(targetQStr);
                          }
                        }}
                        className={`relative px-2 py-0.5 text-xs font-bold rounded transition-all flex items-center gap-1 ${
                          isQActive
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title={`${targetQStr}${hasGap ? '（案主管人力有缺口）' : ''}`}
                      >
                        <span>Q{q}</span>
                        {hasGap && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isQActive ? 'bg-white' : 'bg-rose-500'
                            }`}
                            title="此季度有人力缺口"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 季度時間軸滑桿 */}
              <div className="flex flex-col justify-center px-1 min-w-[130px] sm:min-w-[170px] sm:border-l sm:border-slate-200 sm:pl-3">
                <input
                  id="quarter-timeline-slider"
                  type="range"
                  min={0}
                  max={ALL_QUARTERS.length - 1}
                  step={1}
                  value={currentQIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setSelectedQuarter(ALL_QUARTERS[idx]);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-hidden"
                  title={`當前季度：${currentStats.quarterLabel}`}
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5 mt-1">
                  <span>2025</span>
                  <span>2026</span>
                  <span>2027</span>
                  <span>2028</span>
                  <span>2029</span>
                  <span>2030</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：搜尋與匯出操作按鈕 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 搜尋欄位 */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-quarterly-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋案別/區域/規模..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="清除搜尋"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dedicated A3 Print & PDF Export Controller */}
            <A3PrintPdfController
              targetElementId="quarterly-demand-dashboard-content"
              documentTitle="遠雄營造 案主管供需儀表板 供需平衡戰情報告"
              subtitle={`統計季度：${selectedQuarter} · 需求總量：${currentStats.totalDemandCount} 人 · 供給總量：${currentStats.totalSupplyCount} 人 · 人力缺口：${currentStats.talentGap} 人`}
              baseDate={baseDate}
              buttonLabel="匯出PDF"
              variant="rose"
            />

            {/* 匯出 Excel 按鈕 (綠底或綠邊框，如附圖綠按鈕) */}
            <button
              type="button"
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>匯出 Excel</span>
            </button>
          </div>
        </div>

        {/* 2. 5大核心數值指標卡片 (100% 依據後台真實案場與主管背景設定動態推演) */}
        <div data-pdf-block="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-5 pt-4 border-t border-slate-100 print-avoid-break pdf-block-avoid">
          {/* 卡片 1: 案場數量 (可點擊穿透查看當季活躍或全期規劃案場清單) */}
          <div
            onClick={() => {
              const hasActive = currentStats.totalProjectsCount > 0;
              const projs = hasActive
                ? [...currentStats.newProjects, ...currentStats.underConstructionProjects, ...currentStats.licenseProjects]
                : projectPlans;
              setProjectModalConfig({
                isOpen: true,
                title: hasActive
                  ? `${currentStats.quarterLabel} 進行中案場名冊 (${currentStats.totalProjectsCount} 案)`
                  : `後台開案計畫庫全期名冊 (${projectPlans.length} 案，當季尚未開工)`,
                quarterLabel: currentStats.quarterLabel,
                statusType: hasActive ? (currentStats.newProjectCount > 0 ? 'new' : 'underConstruction') : 'new',
                projects: projs,
              });
            }}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between cursor-pointer group select-none pdf-block-avoid"
            title="點擊查看案場詳細名冊清單"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                案場數量
              </span>
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                <Eye className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {currentStats.totalProjectsCount}
              </span>
              <span className="text-sm font-bold text-slate-500">案</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>當季進行中 (新開+在建+使照)</span>
              <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">檢視明細 &rarr;</span>
            </div>
          </div>

          {/* 卡片 2: 案場分類細分 (新開案 / 在建案 / 使照案) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between pdf-block-avoid">
            {/* 表頭區 (淺灰色底) */}
            <div className="grid grid-cols-3 text-center py-2.5 px-1 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>新開案</span>
              </div>
              <div className="flex items-center justify-center gap-1 border-x border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>在建案</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>使照案</span>
              </div>
            </div>
            {/* 數值列 (可點擊開啟個別狀態案場清單) */}
            <div className="grid grid-cols-3 text-center py-2 px-1 font-black text-slate-900 text-base sm:text-lg">
              <button
                type="button"
                onClick={() => {
                  setProjectModalConfig({
                    isOpen: true,
                    title: `${currentStats.quarterLabel} 新開案清單 (${currentStats.newProjectCount} 案)`,
                    quarterLabel: currentStats.quarterLabel,
                    statusType: 'new',
                    projects: currentStats.newProjects,
                  });
                }}
                className="py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊查看當季新開案清單"
              >
                <span className="text-blue-700 group-hover:scale-105 inline-block transition-transform">{currentStats.newProjectCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">案</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">當季啟動</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectModalConfig({
                    isOpen: true,
                    title: `${currentStats.quarterLabel} 在建案清單 (${currentStats.underConstructionCount} 案)`,
                    quarterLabel: currentStats.quarterLabel,
                    statusType: 'underConstruction',
                    projects: currentStats.underConstructionProjects,
                  });
                }}
                className="py-1 border-x border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊查看在建工程案場清單"
              >
                <span className="text-slate-800 group-hover:scale-105 inline-block transition-transform">{currentStats.underConstructionCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">案</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">施工中</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectModalConfig({
                    isOpen: true,
                    title: `${currentStats.quarterLabel} 使照案清單 (${currentStats.licenseCount} 案)`,
                    quarterLabel: currentStats.quarterLabel,
                    statusType: 'license',
                    projects: currentStats.licenseProjects,
                  });
                }}
                className="py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊查看完工使照階段案場清單"
              >
                <span className="text-emerald-700 group-hover:scale-105 inline-block transition-transform">{currentStats.licenseCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">案</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">使照收尾</div>
              </button>
            </div>
          </div>

          {/* 卡片 3: 案主管人才庫 (點擊開啟人才名冊彈窗) */}
          <div
            onClick={() => {
              setPersonnelModalTab('available');
              setPersonnelModalQuarter(currentStats);
            }}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between cursor-pointer group select-none pdf-block-avoid"
            title="點擊檢視人才庫詳細名冊與履歷"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-indigo-700 transition-colors">
                案主管人才庫
              </span>
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {currentStats.totalTalentPoolCount}
              </span>
              <span className="text-sm font-bold text-slate-500">人</span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md ml-auto">
                人才總池
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>含現任、曾任主管與儲備梯隊</span>
              <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">檢視名冊 &rarr;</span>
            </div>
          </div>

          {/* 卡片 4: 人才庫狀態細分 (可釋出 / 一年內 / 培育中) - 點選直接切換對應分頁 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between pdf-block-avoid">
            {/* 表頭區 (淺灰色底) */}
            <div className="grid grid-cols-3 text-center py-2.5 px-1 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>可釋出</span>
              </div>
              <div className="flex items-center justify-center gap-1 border-x border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>一年內</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>培育中</span>
              </div>
            </div>
            {/* 數值列 (點選切換該狀態的人選彈窗) */}
            <div className="grid grid-cols-3 text-center py-2 px-1 font-black text-slate-900 text-base sm:text-lg">
              <button
                type="button"
                onClick={() => {
                  setPersonnelModalTab('available');
                  setPersonnelModalQuarter(currentStats);
                }}
                className="py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊檢視已達標準釋出名冊 (隨時可受派任主管)"
              >
                <span className="text-blue-700 group-hover:scale-105 inline-block transition-transform">{currentStats.availableTalentCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">人</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">隨時可派任</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPersonnelModalTab('withinOneYear');
                  setPersonnelModalQuarter(currentStats);
                }}
                className="py-1 border-x border-slate-100 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊檢視未來 1 年內即將釋出主管名冊"
              >
                <span className="text-amber-600 group-hover:scale-105 inline-block transition-transform">{currentStats.withinOneYearCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">人</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">1年內釋出</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPersonnelModalTab('inTraining');
                  setPersonnelModalQuarter(currentStats);
                }}
                className="py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer group keep-for-pdf"
                title="點擊檢視培育中儲備幹部與儲備主管梯隊"
              >
                <span className="text-indigo-600 group-hover:scale-105 inline-block transition-transform">{currentStats.inTrainingCount}</span>
                <span className="text-xs font-bold text-slate-500 ml-0.5">人</span>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">儲備梯隊</div>
              </button>
            </div>
          </div>

          {/* 卡片 5: 人選缺口 */}
          <div
            onClick={() => {
              setPersonnelModalTab('available');
              setPersonnelModalQuarter(currentStats);
            }}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between cursor-pointer group select-none pdf-block-avoid"
            title="點擊查看人選供需對照名冊"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                人選缺口
              </span>
              {currentStats.talentGap > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-300">
                  人力不足 · 需提前培育
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                  人力充裕
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 my-1.5">
              <span
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  currentStats.talentGap > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {currentStats.talentGap}
              </span>
              <span
                className={`text-sm font-bold ${
                  currentStats.talentGap > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                人
              </span>
              {currentStats.talentGap > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded ml-auto border border-rose-200">
                  -{currentStats.talentGap} 人
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate" title={`遴選規定：每次案場遴選作業至少需 2 人 PK。(新開 ${currentStats.newProjectCount} 案 × 2人PK) - 可釋出 ${currentStats.availableTalentCount} 人 = 缺口 ${currentStats.talentGap} 人`}>
              {currentStats.newProjectCount > 0 ? (
                <span>
                  (新開 {currentStats.newProjectCount} 案 × 2人PK) - 可釋出 {currentStats.availableTalentCount} = {currentStats.variance < 0 ? `-${Math.abs(currentStats.variance)}` : `+${currentStats.variance}`} 人
                </span>
              ) : (
                <span>
                  新開 0 案 (可釋出 {currentStats.availableTalentCount} 人充裕)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 下方 5 年歷程季度列表區塊 (年度為列，年度下方為該年度各季度) */}
      {/* ============================================================== */}
      <div data-pdf-block="true" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden pdf-block-avoid">
        {/* 表格頂部功能列 */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100/60 border border-blue-200 flex items-center justify-center text-blue-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  5 年基準歷程供需對照表
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  當前基準：{selectedQuarter}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                各年度完整呈現 4 季度供需歷程，當前基準季醒目標註，點選任一季度列可即時同步上方看板
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-toggle-all-years-expand"
              onClick={() => handleToggleAllYears(true)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              全部展開
            </button>
            <button
              type="button"
              id="btn-toggle-all-years-collapse"
              onClick={() => handleToggleAllYears(false)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              全部收合
            </button>
            <button
              type="button"
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showFormulaInfo ? '收合說明' : '欄位與計算說明'}</span>
            </button>
          </div>
        </div>

        {/* 說明區塊 (點擊展開) */}
        {showFormulaInfo && (
          <div
            data-guide-panel="true"
            className="no-print print-hide guide-panel p-4 bg-blue-50/60 border-b border-blue-100 text-xs text-slate-700 space-y-2"
          >
            <div className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>系統欄位計算規則與後台擴充說明</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">1. 新開案</span>
                <p className="text-slate-600 mt-0.5">
                  該季度開案 (openQuarter) 或開工日 (startWorkDate) 落於該季度的專案數。
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">2. 在建案</span>
                <p className="text-slate-600 mt-0.5">
                  已開工施工中且尚未取得使照的專案數 (扣除該季新開案)。
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">3. 使照案</span>
                <p className="text-slate-600 mt-0.5">
                  使照取得日 (licenseFDate) 或預計交屋日落於該季度的完工建案。
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">4. 可供應人才庫人數</span>
                <p className="text-slate-600 mt-0.5">
                  該季度已達標準釋出、提前釋出或曾任主管合格，可即刻調派承接案場的總人數。
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">5. 遴選作業規定與人選缺口</span>
                <p className="text-slate-600 mt-0.5">
                  依遴選作業規定：每次案場遴選作業都至少需要 2 人進行 PK。新開案人選需求 = 新開案數 × 2。差異數 = 可供應人才庫人數 - 新開案需備人數。若為負數則為人力不足 (紅字缺口)，需啟動儲備幹部提前培育或擴充候選人。
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="font-bold text-blue-800">6. 後台新增欄位與彈性</span>
                <p className="text-slate-600 mt-0.5">
                  已於後台資料結構新增「quarterlyLifecycleStage」與「talentPoolStatus」，支援管理者於後台指定案場狀態或調派儲備名冊。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 核心表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 min-w-[180px]">年度 / 季度</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">新開案</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">在建案</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">使照案</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">案場總數</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">可供應人才庫人數</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">差異數 (缺口 / 餘裕)</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">明細檢視</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium">
              {displayedYearGroups.map((yearGroup) => {
                const isExpanded = expandedYears[yearGroup.year] !== false;
                return (
                  <React.Fragment key={`year-group-${yearGroup.year}`}>
                    {/* 年度列 (可收合/展開) */}
                    <tr
                      id={`row-year-${yearGroup.year}`}
                      onClick={() => toggleYear(yearGroup.year)}
                      className="bg-slate-50/90 hover:bg-slate-100 cursor-pointer transition-colors border-t-2 border-slate-200 select-none font-bold text-slate-900 pdf-block-avoid"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 hover:text-slate-800">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            {yearGroup.yearLabel}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 bg-blue-100/70 text-blue-700 rounded-full font-semibold">
                            {yearGroup.subtotalBadge || '4 季度小計'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const projs = getYearProjects(yearGroup, 'new');
                            setProjectModalConfig({
                              isOpen: true,
                              title: `${yearGroup.yearLabel} 全部新開案清單`,
                              quarterLabel: `${yearGroup.year} 年度`,
                              statusType: 'new',
                              projects: projs,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-blue-700 font-extrabold hover:bg-blue-100 hover:text-blue-900 transition-all cursor-pointer"
                          title="點選查看新開案詳細明細 (六都+其他、規模級距、特殊屬性)"
                        >
                          <span>{yearGroup.annualNewProjects} 案</span>
                          <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const projs = getYearProjects(yearGroup, 'underConstruction');
                            setProjectModalConfig({
                              isOpen: true,
                              title: `${yearGroup.yearLabel} 在建案清單 (高峰)`,
                              quarterLabel: `${yearGroup.year} 年度`,
                              statusType: 'underConstruction',
                              projects: projs,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-slate-800 font-bold hover:bg-slate-200 transition-all cursor-pointer"
                          title="點選查看在建案詳細明細 (六都+其他、規模級距、特殊屬性)"
                        >
                          <span>{yearGroup.annualUnderConstructionPeak} 案 (高峰)</span>
                          <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const projs = getYearProjects(yearGroup, 'license');
                            setProjectModalConfig({
                              isOpen: true,
                              title: `${yearGroup.yearLabel} 使照案清單`,
                              quarterLabel: `${yearGroup.year} 年度`,
                              statusType: 'license',
                              projects: projs,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-emerald-700 font-bold hover:bg-emerald-100 hover:text-emerald-900 transition-all cursor-pointer"
                          title="點選查看使照案詳細明細 (六都+其他、規模級距、特殊屬性)"
                        >
                          <span>{yearGroup.annualLicenseProjects} 案</span>
                          <Eye className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-800 font-bold">
                        {yearGroup.annualTotalProjectsPeak} 案
                      </td>
                      <td className="py-3.5 px-4 text-center text-blue-700 font-bold">
                        平均 {yearGroup.annualAvailableTalentAvg} 人
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            yearGroup.annualGapPeak > 0
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {yearGroup.annualGapPeak > 0
                            ? `人力不足 (高峰缺口 -${yearGroup.annualGapPeak} 人)`
                            : '人力充足'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-normal">
                        {isExpanded ? '點擊收合' : '點擊展開'}
                      </td>
                    </tr>

                    {/* 年度下方：該年度 4 個季度明細列 */}
                    {isExpanded &&
                      yearGroup.quarters.map((quarterStats) => {
                        const isSelected = quarterStats.quarter === selectedQuarter;
                        return (
                          <tr
                            key={`quarter-row-${quarterStats.quarter}`}
                            id={`row-quarter-${quarterStats.quarter}`}
                            onClick={() => setSelectedQuarter(quarterStats.quarter)}
                            className={`transition-colors pdf-block-avoid cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/80 font-semibold ring-2 ring-amber-400/80'
                                : 'bg-white hover:bg-slate-50/70'
                            }`}
                            title={`點選將基準切換為 ${quarterStats.quarter}`}
                          >
                            {/* 季度名稱 */}
                            <td className="py-3 px-4 pl-10">
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-200 animate-pulse" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                                <span
                                  className={`text-sm ${
                                    isSelected ? 'font-black text-amber-950' : 'font-bold text-slate-800'
                                  }`}
                                >
                                  {quarterStats.quarter}
                                </span>
                                <span className="text-xs text-slate-400 font-normal">
                                  (第 {quarterStats.qNumber} 季)
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold border border-amber-300 shadow-2xs">
                                    當前基準
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 新開案 (點選出現明細，六都+其他、規模級距、特殊屬性) */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectModalConfig({
                                    isOpen: true,
                                    title: `${quarterStats.quarter} 新開案清單明細`,
                                    quarterLabel: quarterStats.quarter,
                                    statusType: 'new',
                                    projects: quarterStats.newProjects || [],
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                                  quarterStats.newProjectCount > 0
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200/80 shadow-2xs'
                                    : 'text-slate-400 font-normal hover:bg-slate-100'
                                }`}
                                title="點選檢視新開案詳細明細 (六都+其他、規模級距、特殊屬性)"
                              >
                                <span>{quarterStats.newProjectCount} 案</span>
                                {quarterStats.newProjectCount > 0 && (
                                  <Eye className="w-3 h-3 opacity-70" />
                                )}
                              </button>
                            </td>

                            {/* 在建案 (點選出現明細) */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectModalConfig({
                                    isOpen: true,
                                    title: `${quarterStats.quarter} 在建案清單明細`,
                                    quarterLabel: quarterStats.quarter,
                                    statusType: 'underConstruction',
                                    projects: quarterStats.underConstructionProjects || [],
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                  quarterStats.underConstructionCount > 0
                                    ? 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent hover:border-slate-300'
                                    : 'text-slate-400 font-normal hover:bg-slate-100'
                                }`}
                                title="點選檢視在建案詳細明細 (六都+其他、規模級距、特殊屬性)"
                              >
                                <span>{quarterStats.underConstructionCount} 案</span>
                                {quarterStats.underConstructionCount > 0 && (
                                  <Eye className="w-3 h-3 opacity-60" />
                                )}
                              </button>
                            </td>

                            {/* 使照案 (點選出現明細) */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectModalConfig({
                                    isOpen: true,
                                    title: `${quarterStats.quarter} 使照案清單明細`,
                                    quarterLabel: quarterStats.quarter,
                                    statusType: 'license',
                                    projects: quarterStats.licenseProjects || [],
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  quarterStats.licenseCount > 0
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 shadow-2xs'
                                    : 'text-slate-400 font-normal hover:bg-slate-100'
                                }`}
                                title="點選檢視使照案詳細明細 (六都+其他、規模級距、特殊屬性)"
                              >
                                <span>{quarterStats.licenseCount} 案</span>
                                {quarterStats.licenseCount > 0 && (
                                  <Eye className="w-3 h-3 opacity-70" />
                                )}
                              </button>
                            </td>

                            {/* 案場總數 */}
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {quarterStats.totalProjectsCount} 案
                            </td>

                            {/* 可供應人才庫人數 */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="font-black text-blue-700 text-sm">
                                  {quarterStats.availableTalentCount} 人
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  (池: {quarterStats.totalTalentPoolCount})
                                </span>
                              </div>
                            </td>

                            {/* 差異數 (缺口 / 餘裕) */}
                            <td className="py-3 px-4 text-center">
                              {quarterStats.talentGap > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>人力不足 (缺口 -{quarterStats.talentGap} 人)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>充裕 +{Math.abs(quarterStats.variance)} 人</span>
                                </span>
                              )}
                            </td>

                            {/* 最右方明細檢視按鈕 (詳細人員資訊，切換為可供應/一年內/培育中，詳列釋出狀態) */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                id={`btn-view-detail-${quarterStats.quarter}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPersonnelModalQuarter(quarterStats);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition-colors border border-blue-200 hover:border-blue-600 shadow-2xs cursor-pointer"
                                title="點選檢視詳細人員資訊 (可供應人才庫、一年度預計釋出、培育中儲備幹部)"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>人員名冊</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. 專案明細彈窗 (新開案 / 在建案 / 使照案，支援六都 + 其他分類) */}
      {/* ============================================================== */}
      {projectModalConfig && (
        <ProjectStatusListModal
          isOpen={projectModalConfig.isOpen}
          onClose={() => setProjectModalConfig(null)}
          title={projectModalConfig.title}
          quarterLabel={projectModalConfig.quarterLabel}
          statusType={projectModalConfig.statusType}
          projects={projectModalConfig.projects}
        />
      )}

      {/* ============================================================== */}
      {/* 4. 人員詳細資訊名冊彈窗 (可供應人才庫 / 一年度預計釋出 / 培育中儲備幹部 / 現任在案) */}
      {/* ============================================================== */}
      {personnelModalQuarter && (
        <PersonnelDetailModal
          isOpen={!!personnelModalQuarter}
          onClose={() => setPersonnelModalQuarter(null)}
          quarterStats={personnelModalQuarter}
          initialTab={personnelModalTab}
        />
      )}
    </PrintWrapper>
  );
};
