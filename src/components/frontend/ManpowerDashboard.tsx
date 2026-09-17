import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateAllQuartersSummary,
  getDepartmentSections,
  BASE_SNAPSHOT_QUARTER,
} from '../../utils/manpowerCalculator';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  FileDown,
  Building2,
  Settings,
  Filter,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Calendar,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  PieChart,
  Bell,
  Search,
  FolderTree,
  List,
  ExternalLink,
  X,
  Sliders,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { ProjectPlan, ProjectQuarterDetail, RoleDemandBreakdown } from '../../types';
import { PowerBiSlicers } from './manpower/PowerBiSlicers';
import { PowerBiKpiCards } from './manpower/PowerBiKpiCards';
import { ManpowerTrendChart } from './manpower/ManpowerTrendChart';
import { ManpowerDeficitSupplyTrendChart } from './manpower/ManpowerDeficitSupplyTrendChart';
import { UnitConfigurationChart } from './manpower/UnitConfigurationChart';
import { ProjectGanttMatrix } from './manpower/ProjectGanttMatrix';
import { RankPyramidModal } from './manpower/RankPyramidModal';
import { ProjectLifecycleModal } from './manpower/ProjectLifecycleModal';
import { WhatIfSimulationDrawer, WhatIfParams } from './manpower/WhatIfSimulationDrawer';

export const ManpowerDashboard: React.FC = () => {
  const {
    projectPlans,
    manpowerConfig,
    manpowerSupplyAssumption,
    manualTargetRecords,
    setActiveView,
  } = useApp();

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'drilldown'>('overview');

  // Global Slicers States
  const [selectedQuarter, setSelectedQuarter] = useState<string>(BASE_SNAPSHOT_QUARTER);
  const [selectedDept, setSelectedDept] = useState<string>('全部單位');
  const [selectedSection, setSelectedSection] = useState<string>('全部科案');
  const [selectedRole, setSelectedRole] = useState<string>('全部職類');
  const [selectedPhase, setSelectedPhase] = useState<string>('全部階段');

  // Available sections dynamically derived from projectPlans and selectedDept
  const availableSections = useMemo(() => {
    return getDepartmentSections(projectPlans, selectedDept);
  }, [projectPlans, selectedDept]);

  // Handle department change and auto-reset section if not in selected department
  const handleDeptChange = (newDept: string) => {
    setSelectedDept(newDept);
    const validSections = getDepartmentSections(projectPlans, newDept);
    if (selectedSection !== '全部科案' && !validSections.includes(selectedSection)) {
      setSelectedSection('全部科案');
    }
  };

  // What-If Simulation State
  const [showWhatIf, setShowWhatIf] = useState<boolean>(false);
  const [whatIfParams, setWhatIfParams] = useState<WhatIfParams>({
    delayMonths: 0,
    turnoverRate: manpowerSupplyAssumption.quarterlyTurnoverRate || 3.5,
    makeOrBuyRatio: 1.0,
    payrollMonthlyRate: 90000,
  });

  // Drill-Through Modals State
  const [isRankPyramidOpen, setIsRankPyramidOpen] = useState<boolean>(false);
  const [deptForRankPyramid, setDeptForRankPyramid] = useState<string>('全部單位');
  const [selectedProjectForLifecycle, setSelectedProjectForLifecycle] = useState<ProjectPlan | null>(null);

  // Department Hierarchical Collapsible State in Drilldown Table
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [drilldownViewMode, setDrilldownViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');
  const [detailSearchQuery, setDetailSearchQuery] = useState<string>('');

  // 15% Warning Banner State: default collapsed / compact to satisfy UX optimization
  const [dismissAlertBanner, setDismissAlertBanner] = useState<boolean>(false);
  const [isAlertBannerExpanded, setIsAlertBannerExpanded] = useState<boolean>(false);
  const [isTrendChartExpanded, setIsTrendChartExpanded] = useState<boolean>(false);

  // Run the core manpower forecast engine with all active slicers seamlessly linked
  const calculationResult = useMemo(() => {
    return calculateAllQuartersSummary(
      projectPlans,
      manualTargetRecords,
      manpowerConfig,
      {
        ...manpowerSupplyAssumption,
        quarterlyTurnoverRate: whatIfParams.turnoverRate,
      },
      selectedDept,
      selectedRole,
      {
        delayMonths: whatIfParams.delayMonths,
        makeOrBuyRatio: whatIfParams.makeOrBuyRatio,
        turnoverRate: whatIfParams.turnoverRate,
        payrollMonthlyRate: whatIfParams.payrollMonthlyRate,
        selectedPhase,
        selectedSection,
      }
    );
  }, [
    projectPlans,
    manualTargetRecords,
    manpowerConfig,
    manpowerSupplyAssumption,
    selectedDept,
    selectedRole,
    selectedPhase,
    selectedSection,
    whatIfParams,
  ]);

  const { quarterSummaries, warningQuarters, kpiMetrics } = calculationResult;

  // Identify Quarters where Gap Percentage exceeds 15% (Threshold check)
  const thresholdRate = manpowerSupplyAssumption.warningThresholdPercent || 15;
  const highRiskQuarters = useMemo(() => {
    return quarterSummaries.filter((q) => q.gapPercent >= thresholdRate && q.netGap > 0);
  }, [quarterSummaries, thresholdRate]);

  // Current selected quarter summary data
  const currentQuarterData = useMemo(() => {
    return (
      quarterSummaries.find((q) => q.quarter === selectedQuarter) ||
      quarterSummaries[0] ||
      null
    );
  }, [quarterSummaries, selectedQuarter]);

  // Current selected quarter fulfillment rate & gap payroll budget for observation quarter
  const currentFulfillmentRate = useMemo(() => {
    if (!currentQuarterData) return 100;
    if (currentQuarterData.calculatedDemand <= 0) return 100;
    return Math.round((currentQuarterData.projectedSupply / currentQuarterData.calculatedDemand) * 100);
  }, [currentQuarterData]);

  const currentPayrollBudget = useMemo(() => {
    if (!currentQuarterData || currentQuarterData.netGap <= 0) return 0;
    const monthlyRate = whatIfParams.payrollMonthlyRate || 90000;
    return currentQuarterData.netGap * monthlyRate * 3;
  }, [currentQuarterData, whatIfParams.payrollMonthlyRate]);

  // Organize Active Drill Quarter projects by Department -> Section -> Projects for hierarchical collapse
  const departmentGroups = useMemo(() => {
    if (!currentQuarterData) return [];

    const rawDetails = currentQuarterData.projectDetails.filter((pd) => {
      if (selectedDept !== '全部' && selectedDept !== '全部單位' && pd.department !== selectedDept) {
        return false;
      }
      if (
        selectedSection &&
        selectedSection !== '全部科案' &&
        selectedSection !== '全部科別' &&
        selectedSection !== '全部'
      ) {
        const sec = pd.section || `${pd.region.slice(0, 3)}工區科`;
        if (pd.section !== selectedSection && sec !== selectedSection) {
          return false;
        }
      }
      if (!detailSearchQuery.trim()) return true;
      const q = detailSearchQuery.toLowerCase();
      return (
        pd.projectCode.toLowerCase().includes(q) ||
        pd.region.toLowerCase().includes(q) ||
        (pd.department && pd.department.toLowerCase().includes(q)) ||
        (pd.section && pd.section.toLowerCase().includes(q)) ||
        pd.stageName.toLowerCase().includes(q)
      );
    });

    const map = new Map<string, ProjectQuarterDetail[]>();
    rawDetails.forEach((pd) => {
      let deptName = pd.department ? pd.department.trim() : '二部';
      if (!map.has(deptName)) {
        map.set(deptName, []);
      }
      map.get(deptName)!.push(pd);
    });

    const sortedDepts = Array.from(map.keys()).sort();

    return sortedDepts.map((deptName) => {
      const projs = map.get(deptName)!;
      const breakdown: RoleDemandBreakdown = {
        manager: 0,
        civil: 0,
        mep: 0,
        safety: 0,
        admin: 0,
        total: 0,
      };

      const secMap = new Map<string, ProjectQuarterDetail[]>();
      projs.forEach((p) => {
        breakdown.manager += p.calculated.manager;
        breakdown.civil += p.calculated.civil;
        breakdown.mep += p.calculated.mep;
        breakdown.safety += p.calculated.safety;
        breakdown.admin += p.calculated.admin;
        breakdown.total += p.calculated.total;

        const secName = p.section || `${p.region.slice(0, 3)}工區科`;
        if (!secMap.has(secName)) {
          secMap.set(secName, []);
        }
        secMap.get(secName)!.push(p);
      });

      breakdown.manager = Math.round(breakdown.manager * 10) / 10;
      breakdown.civil = Math.round(breakdown.civil * 10) / 10;
      breakdown.mep = Math.round(breakdown.mep * 10) / 10;
      breakdown.safety = Math.round(breakdown.safety * 10) / 10;
      breakdown.admin = Math.round(breakdown.admin * 10) / 10;
      breakdown.total = Math.round(breakdown.total * 10) / 10;

      const sections = Array.from(secMap.keys()).map((secName) => {
        const secProjs = secMap.get(secName)!;
        const secDemand =
          Math.round(secProjs.reduce((acc, cur) => acc + cur.calculated.total, 0) * 10) / 10;
        return {
          sectionName: secName,
          projects: secProjs,
          totalDemand: secDemand,
        };
      });

      return {
        department: deptName,
        projects: projs,
        totalProjects: projs.length,
        totalDemand: breakdown.total,
        breakdown,
        sections,
      };
    });
  }, [currentQuarterData, selectedDept, detailSearchQuery]);

  // Expand all by default
  useEffect(() => {
    if (departmentGroups.length > 0 && Object.keys(expandedDepts).length === 0) {
      const initial: Record<string, boolean> = {};
      departmentGroups.forEach((dg) => {
        initial[dg.department] = true;
      });
      setExpandedDepts(initial);
    }
  }, [departmentGroups]);

  const toggleDeptExpand = (dept: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const handleExpandAllDepts = () => {
    const next: Record<string, boolean> = {};
    departmentGroups.forEach((dg) => {
      next[dg.department] = true;
    });
    setExpandedDepts(next);
  };

  const handleCollapseAllDepts = () => {
    const next: Record<string, boolean> = {};
    departmentGroups.forEach((dg) => {
      next[dg.department] = false;
    });
    setExpandedDepts(next);
  };

  // Reset Slicers
  const handleResetSlicers = () => {
    setSelectedQuarter(BASE_SNAPSHOT_QUARTER);
    setSelectedDept('全部單位');
    setSelectedSection('全部科案');
    setSelectedRole('全部職類');
    setSelectedPhase('全部階段');
  };

  // Reset What-If
  const handleResetWhatIf = () => {
    setWhatIfParams({
      delayMonths: 0,
      turnoverRate: manpowerSupplyAssumption.quarterlyTurnoverRate || 3.5,
      makeOrBuyRatio: 1.0,
      payrollMonthlyRate: 90000,
    });
  };

  const hasActiveWhatIf =
    whatIfParams.delayMonths !== 0 ||
    whatIfParams.turnoverRate !== (manpowerSupplyAssumption.quarterlyTurnoverRate || 3.5) ||
    whatIfParams.makeOrBuyRatio !== 1.0 ||
    whatIfParams.payrollMonthlyRate !== 90000;

  // Open Rank Pyramid Modal
  const handleOpenRankPyramid = (dept: string) => {
    setDeptForRankPyramid(dept);
    setIsRankPyramidOpen(true);
  };

  // Excel Export
  const handleExportExcel = () => {
    const exportRows = quarterSummaries.map((q) => ({
      季度: q.quarter,
      活躍案場數: q.activeProjectsCount,
      系統試算總需求: q.calculatedDemand,
      案主管需求: q.calculatedBreakdown.manager,
      土建工程師需求: q.calculatedBreakdown.civil,
      機電工程師需求: q.calculatedBreakdown.mep,
      職安工程師需求: q.calculatedBreakdown.safety,
      外業營管需求: q.calculatedBreakdown.admin,
      原人工目標: q.manualTargetDemand,
      試算與人工目標差異: q.variance,
      預估供給人力: q.projectedSupply,
      人力淨缺口: q.netGap,
      缺口佔需求比率: `${q.gapPercent}%`,
      風險狀態: q.statusText,
      預估薪資外包預算: q.estimatedPayrollBudget,
    }));

    exportToExcel(
      exportRows,
      `遠雄營造_PowerBI人力供需戰情報表_${new Date().toISOString().slice(0, 10)}`
    );
  };

  // PDF Export
  const handleExportPdf = () => {
    exportElementToPdf('manpower-dashboard-container', {
      filename: `遠雄營造_PowerBI人力戰情簡報_${new Date().toISOString().slice(0, 10)}`,
      title: '遠雄營造 Power BI 人力供需戰情與甘特配置簡報',
      subtitle: `觀測季度：${selectedQuarter} · 基準定錨：2026Q3 (259人) · 招募前置連動`,
      landscape: true,
    });
  };

  return (
    <div id="manpower-dashboard-container" className="space-y-4">
      {/* Optimized Collapsible Warning Banner (Requirement 3: 隱藏或優化呈現) */}
      {highRiskQuarters.length > 0 && !dismissAlertBanner && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/80 border border-amber-200/90 rounded-xl px-3.5 sm:px-4 py-2.5 shadow-2xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xs text-slate-700 flex items-center flex-wrap gap-1.5 min-w-0">
                <span className="font-bold text-amber-800">缺口預警提示:</span>
                <span>
                  共偵測到 <strong className="text-rose-600 font-bold font-mono">{highRiskQuarters.length} 個季度</strong> 缺口佔比達 15% 門檻
                </span>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-slate-500 hidden sm:inline">
                  首次缺口季度：<span className="font-mono font-bold text-slate-800">{highRiskQuarters[0]?.quarter}</span>
                </span>
                {kpiMetrics.recruitTriggerQuarter && (
                  <span className="text-slate-500 hidden md:inline">
                    · 建議啟動招募：<span className="font-mono font-bold text-indigo-700">{kpiMetrics.recruitTriggerQuarter}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsAlertBannerExpanded(!isAlertBannerExpanded)}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title={isAlertBannerExpanded ? '收合警示明細' : '展開檢視受影響季度與應對方案'}
              >
                {isAlertBannerExpanded ? (
                  <>
                    <span>收合明細</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>展開明細</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <button
                onClick={() => setDismissAlertBanner(true)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="隱藏上方警示訊息"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded Rich Details */}
          {isAlertBannerExpanded && (
            <div className="mt-3 pt-3 border-t border-amber-200/70 animate-in fade-in duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    在當前排程與自然折減假設下，部分季度之工程師需求超出既有供給規模。點選下方季度標籤可直接跳轉至該季度檢視受影響之案場配置：
                  </p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-slate-700">超標季度直達：</span>
                    {highRiskQuarters.map((hq) => (
                      <button
                        key={hq.quarter}
                        onClick={() => {
                          setSelectedQuarter(hq.quarter);
                          setActiveTab('drilldown');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold font-mono transition-all hover:scale-105 cursor-pointer shadow-2xs"
                        title="點擊切換並導向至此季度之案場明細"
                      >
                        <span>{hq.quarter}</span>
                        <span className="text-[11px] text-rose-600 font-semibold">
                          (缺口 {hq.gapPercent}%, -{hq.netGap}人)
                        </span>
                        <ArrowRight className="w-3 h-3 text-rose-400" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => setShowWhatIf(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    參數變動影響試算
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 pdf-block-avoid">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              人力供需戰情看板 (Power BI 企業級報表)
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              24 季動態預測 · 2026Q3 基準 (259人)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            三層導航架構：總覽彙整與 KPI 卡片 → 單位/案場穿透與甘特矩陣 → 職能與職等結構鑽取 (黃金比例 20:40:40)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {dismissAlertBanner && highRiskQuarters.length > 0 && (
            <button
              onClick={() => setDismissAlertBanner(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
              title="重新顯示缺口預警訊息"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>顯示警示 ({highRiskQuarters.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('backend_manpower_forecast_settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            預測規則與參數
          </button>

          <button
            onClick={() => setActiveView('backend_project_plans')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            排程清單
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            匯出 Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            匯出 PDF
          </button>
        </div>
      </div>

      {/* Global Slicers */}
      <PowerBiSlicers
        selectedQuarter={selectedQuarter}
        onQuarterChange={setSelectedQuarter}
        selectedDept={selectedDept}
        onDeptChange={handleDeptChange}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        availableSections={availableSections}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedPhase={selectedPhase}
        onPhaseChange={setSelectedPhase}
        showWhatIf={showWhatIf}
        onToggleWhatIf={() => setShowWhatIf(!showWhatIf)}
        onResetFilters={handleResetSlicers}
        hasActiveWhatIf={hasActiveWhatIf}
      />

      {/* What-If Simulation Drawer */}
      <WhatIfSimulationDrawer
        isOpen={showWhatIf}
        onClose={() => setShowWhatIf(false)}
        params={whatIfParams}
        onChangeParams={setWhatIfParams}
        onReset={handleResetWhatIf}
      />

      {/* Top 3 KPI Cards */}
      <PowerBiKpiCards
        selectedQuarter={selectedQuarter}
        activeProjectsCount={currentQuarterData?.activeProjectsCount || 0}
        totalDemand={currentQuarterData?.calculatedDemand || 0}
        totalSupply={currentQuarterData?.projectedSupply || 0}
        netGap={currentQuarterData?.netGap || 0}
        fulfillmentRate={currentFulfillmentRate}
        maxNetGap={kpiMetrics.maxNetGap}
        maxNetGapQuarter={kpiMetrics.maxNetGapQuarter}
        firstGapQuarter={kpiMetrics.firstGapQuarter}
        recruitTriggerQuarter={kpiMetrics.recruitTriggerQuarter}
        estimatedPayrollBudgetQuarterly={currentPayrollBudget}
        warningThresholdPercent={thresholdRate}
        onJumpToQuarter={(q) => setSelectedQuarter(q)}
      />

      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs pdf-block-avoid">
        <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Power BI 視覺戰情總覽</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>24 季供需矩陣數據表</span>
          </button>
          <button
            onClick={() => setActiveTab('drilldown')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'drilldown'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>部室科/案場折疊明細</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden md:flex items-center gap-2">
          <span>目前觀測：</span>
          <span className="font-bold text-blue-700">{selectedQuarter}</span>
          <span>· 單位：</span>
          <span className="font-bold text-slate-800">{selectedDept}</span>
          <span>· 職類：</span>
          <span className="font-bold text-slate-800">{selectedRole}</span>
        </div>
      </div>

      {/* Tab 1: Overview - The 3 Requested Power BI Visuals */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Top Visuals Grid: Visual 1 Trend & Visual 2 Unit Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Visual 1: 各季度案場人力缺口與供給預測走勢圖 (Recharts Trend Analysis) */}
            <div className={`w-full ${isTrendChartExpanded ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
              <ManpowerDeficitSupplyTrendChart
                quarterSummaries={quarterSummaries}
                selectedQuarter={selectedQuarter}
                onSelectQuarter={setSelectedQuarter}
                recruitTriggerQuarter={kpiMetrics.recruitTriggerQuarter}
                warningThresholdPercent={thresholdRate}
                kpiMetrics={kpiMetrics}
                isExpanded={isTrendChartExpanded}
                onToggleExpand={() => setIsTrendChartExpanded(!isTrendChartExpanded)}
              />
            </div>

            {/* Visual 2: 單位人力配置與職能拆解 (5 Cols on Desktop) */}
            <div className={`w-full ${isTrendChartExpanded ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
              <UnitConfigurationChart
                currentQuarterData={currentQuarterData}
                selectedDept={selectedDept}
                onSelectDept={handleDeptChange}
                selectedSection={selectedSection}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                onOpenRankPyramid={handleOpenRankPyramid}
              />
            </div>
          </div>

          {/* Visual 3: 案場排程與人力甘特矩陣 (Full Width) */}
          <div>
            <ProjectGanttMatrix
              projectPlans={projectPlans}
              selectedDept={selectedDept}
              selectedSection={selectedSection}
              selectedRole={selectedRole}
              selectedPhase={selectedPhase}
              selectedQuarter={selectedQuarter}
              config={manpowerConfig}
              delayMonths={whatIfParams.delayMonths}
              makeOrBuyRatio={whatIfParams.makeOrBuyRatio}
              onSelectProjectForLifecycle={(proj) => setSelectedProjectForLifecycle(proj)}
              onSelectQuarter={setSelectedQuarter}
            />
          </div>
        </div>
      )}

      {/* Tab 2: 24 季供需矩陣數據表 */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden pdf-block-avoid">
          <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                24 季度人力供需矩陣數據清冊（點擊任一行即可設為當前觀測季度）
              </span>
              <span className="text-[11px] text-slate-400">
                共 {quarterSummaries.length} 個預測季度
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
              * 缺口佔需求比率達 {thresholdRate}% 時標記高風險
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
                <tr>
                  <th className="py-2.5 px-3">預測季度</th>
                  <th className="py-2.5 px-3 text-center">活躍案場</th>
                  <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900">
                    系統試算需求
                  </th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-normal">主管</th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-normal">土建</th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-normal">機電</th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-normal">職安</th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-normal">營管</th>
                  <th className="py-2.5 px-3 text-right bg-slate-100/70 text-slate-800">
                    原人工目標
                  </th>
                  <th className="py-2.5 px-3 text-right">試算差異</th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50/50 text-emerald-900">
                    預估供給
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold">淨缺口</th>
                  <th className="py-2.5 px-3 text-center">缺口佔比</th>
                  <th className="py-2.5 px-3 text-center">風險狀態</th>
                  <th className="py-2.5 px-3 text-right">外包預算估計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap font-mono">
                {quarterSummaries.map((q, qIdx) => {
                  const isSelected = selectedQuarter === q.quarter;
                  const isBase = q.quarter === BASE_SNAPSHOT_QUARTER;
                  return (
                    <tr
                      key={q.quarter || `q-${qIdx}`}
                      onClick={() => setSelectedQuarter(q.quarter)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer pdf-block-avoid ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-blue-700 flex items-center gap-1.5">
                        {q.quarter}
                        {isBase && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-sans">
                            基準
                          </span>
                        )}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </td>
                      <td className="py-2 px-3 text-center font-sans text-slate-600">
                        {q.activeProjectsCount} 案
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-800 bg-blue-50/30">
                        {q.calculatedDemand}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {q.calculatedBreakdown.manager}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {q.calculatedBreakdown.civil}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {q.calculatedBreakdown.mep}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {q.calculatedBreakdown.safety}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {q.calculatedBreakdown.admin}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 bg-slate-50/50">
                        {q.manualTargetDemand}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={
                            q.variance > 0
                              ? 'text-blue-600 font-bold'
                              : q.variance < 0
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }
                        >
                          {q.variance > 0 ? `+${q.variance}` : q.variance}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 bg-emerald-50/30">
                        {q.projectedSupply}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        <span
                          className={
                            q.netGap > 0
                              ? q.gapPercent >= thresholdRate
                                ? 'text-rose-600 font-extrabold'
                                : 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {q.netGap > 0 ? `+${q.netGap}` : q.netGap}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.gapPercent >= thresholdRate
                              ? 'bg-rose-100 text-rose-800'
                              : q.gapPercent > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {q.gapPercent}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.statusText.includes('警戒')
                              ? 'bg-rose-100 text-rose-800'
                              : q.statusText.includes('吃緊')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {q.statusText}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans text-slate-700">
                        {q.estimatedPayrollBudget > 0
                          ? `${Math.round(q.estimatedPayrollBudget / 10000).toLocaleString()} 萬`
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: 部室科/案場層級折疊明細 (Hierarchical Collapsible Drilldown Table) */}
      {activeTab === 'drilldown' && currentQuarterData && (
        <div id="drilldown-section" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4 pdf-block-avoid">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  【{currentQuarterData.quarter}】單季案場穿透試算明細清冊
                </h3>
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  活躍案場共 {currentQuarterData.projectDetails.length} 案
                </span>
                {currentQuarterData.isWarning && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    缺口 {currentQuarterData.gapPercent}% (警戒中)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支援點擊『部』向下展開『轄下科與案場』，點擊部門行即可折疊/收合
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={detailSearchQuery}
                  onChange={(e) => setDetailSearchQuery(e.target.value)}
                  placeholder="搜尋案號、工區、科別..."
                  className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
                />
                {detailSearchQuery && (
                  <button
                    onClick={() => setDetailSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setDrilldownViewMode('hierarchy')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    drilldownViewMode === 'hierarchy'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                  部室層級折疊
                </button>
                <button
                  onClick={() => setDrilldownViewMode('flat')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    drilldownViewMode === 'flat'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5 text-slate-500" />
                  平鋪清冊
                </button>
              </div>

              {drilldownViewMode === 'hierarchy' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExpandAllDepts}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                  >
                    全部展開
                  </button>
                  <button
                    onClick={handleCollapseAllDepts}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                  >
                    全部收合
                  </button>
                </div>
              )}

              <span className="text-xs text-slate-500 font-mono pl-2 border-l border-slate-200">
                合計需求：<strong className="text-blue-700 font-bold">{currentQuarterData.calculatedDemand}</strong> 人
              </span>
            </div>
          </div>

          {/* Drilldown Body: Hierarchy Mode */}
          {drilldownViewMode === 'hierarchy' ? (
            <div className="space-y-3">
              {departmentGroups.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {detailSearchQuery ? '查無符合搜尋條件的案場' : '該季度無活躍施工案場'}
                </div>
              ) : (
                departmentGroups.map((dg) => {
                  const isExpanded = !!expandedDepts[dg.department];
                  return (
                    <div
                      key={dg.department}
                      className="border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs pdf-block-avoid"
                    >
                      {/* Department Collapsible Header Row */}
                      <div
                        onClick={() => toggleDeptExpand(dg.department)}
                        className={`p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                          isExpanded
                            ? 'bg-blue-50/70 border-b border-blue-100'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            {dg.department}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 font-mono">
                              轄下 {dg.totalProjects} 案
                            </span>
                          </span>
                        </div>

                        {/* Department Summary Metrics */}
                        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                          <span className="text-slate-600">
                            主管: <strong>{dg.breakdown.manager}</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">
                            土建: <strong>{dg.breakdown.civil}</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">
                            機電: <strong>{dg.breakdown.mep}</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">
                            職安: <strong>{dg.breakdown.safety}</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">
                            營管: <strong>{dg.breakdown.admin}</strong>
                          </span>
                          <span className="ml-2 font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            部總需求: {dg.totalDemand} 人
                          </span>
                        </div>
                      </div>

                      {/* Collapsible Child Section: Sections and Projects */}
                      {isExpanded && (
                        <div className="p-3 bg-white space-y-4">
                          {dg.sections.map((sec) => (
                            <div key={sec.sectionName} className="border border-slate-100 rounded-lg overflow-hidden">
                              <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  <span>{sec.sectionName}</span>
                                  <span className="text-[10px] font-normal text-slate-400 font-mono">
                                    ({sec.projects.length} 案)
                                  </span>
                                </span>
                                <span className="font-mono text-indigo-700 font-bold">
                                  科需求小計: {sec.totalDemand} 人
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50/50 text-[10px] text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                      <th className="py-2 px-3">案號</th>
                                      <th className="py-2 px-3">區域名稱</th>
                                      <th className="py-2 px-3">工程階段</th>
                                      <th className="py-2 px-3 text-center">樓層 (B/F)</th>
                                      <th className="py-2 px-3 text-center">特殊加成</th>
                                      <th className="py-2 px-3 text-right">案主管</th>
                                      <th className="py-2 px-3 text-right">土建</th>
                                      <th className="py-2 px-3 text-right">機電</th>
                                      <th className="py-2 px-3 text-right">職安</th>
                                      <th className="py-2 px-3 text-right">營管</th>
                                      <th className="py-2 px-3 text-right font-bold text-blue-700">總需求</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    {sec.projects.map((p, pIdx) => (
                                      <tr key={p.projectCode || pIdx} className="hover:bg-slate-50/60 pdf-block-avoid">
                                        <td className="py-2 px-3 font-bold text-blue-600">
                                          {p.projectCode}
                                        </td>
                                        <td className="py-2 px-3 font-sans font-medium text-slate-900">
                                          {p.region}
                                        </td>
                                        <td className="py-2 px-3 font-sans">
                                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                            {p.stageName}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center text-slate-600">
                                          {p.underFloors} / {p.aboveFloors}
                                        </td>
                                        <td className="py-2 px-3 text-center font-sans">
                                          {p.hasLandscapeVip ? (
                                            <span className="text-purple-600 font-bold text-[10px]">✔ 計入</span>
                                          ) : (
                                            <span className="text-slate-300 text-[10px]">—</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">{p.calculated.manager}</td>
                                        <td className="py-2 px-3 text-right font-semibold">{p.calculated.civil}</td>
                                        <td className="py-2 px-3 text-right">{p.calculated.mep}</td>
                                        <td className="py-2 px-3 text-right">{p.calculated.safety}</td>
                                        <td className="py-2 px-3 text-right">{p.calculated.admin}</td>
                                        <td className="py-2 px-3 text-right font-bold text-blue-700 bg-blue-50/20">
                                          {p.calculated.total} 人
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Flat Mode Table */
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3">案號</th>
                    <th className="py-2.5 px-3">部門</th>
                    <th className="py-2.5 px-3">區域名稱</th>
                    <th className="py-2.5 px-3">階段狀態</th>
                    <th className="py-2.5 px-3 text-center">樓層規模</th>
                    <th className="py-2.5 px-3 text-center">景觀VIP</th>
                    <th className="py-2.5 px-3 text-right">案主管</th>
                    <th className="py-2.5 px-3 text-right">土建</th>
                    <th className="py-2.5 px-3 text-right">機電</th>
                    <th className="py-2.5 px-3 text-right">職安</th>
                    <th className="py-2.5 px-3 text-right">營管</th>
                    <th className="py-2.5 px-3 text-right font-bold text-blue-700">總需求</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {currentQuarterData.projectDetails.map((pd, pdIdx) => (
                    <tr
                      key={pd.projectId ? `${currentQuarterData.quarter}-${pd.projectId}` : `${currentQuarterData.quarter}-${pd.projectCode}-${pdIdx}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-blue-600">{pd.projectCode}</td>
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          {pd.department || '二部'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold text-slate-900">{pd.region}</span>
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {pd.stageName}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">
                        {pd.underFloors} / {pd.aboveFloors}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        {pd.hasLandscapeVip ? (
                          <span className="text-purple-600 font-bold text-[10px]">✔ 計入</span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">{pd.calculated.manager}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-semibold">{pd.calculated.civil}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{pd.calculated.mep}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{pd.calculated.safety}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{pd.calculated.admin}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700 bg-blue-50/20">
                        {pd.calculated.total} 人
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Drill-through Modal 1: 職等金字塔與黃金比例鑽取 (Golden Ratio 20:40:40) */}
      <RankPyramidModal
        isOpen={isRankPyramidOpen}
        onClose={() => setIsRankPyramidOpen(false)}
        initialDept={deptForRankPyramid}
      />

      {/* Drill-through Modal 2: 單案生命週期全景 (Project Lifecycle View) */}
      <ProjectLifecycleModal
        project={selectedProjectForLifecycle}
        isOpen={!!selectedProjectForLifecycle}
        onClose={() => setSelectedProjectForLifecycle(null)}
        config={manpowerConfig}
        delayMonths={whatIfParams.delayMonths}
      />
    </div>
  );
};
