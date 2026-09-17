import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ManpowerRole,
  ManpowerFormulaConfig,
  ManpowerSupplyAssumption,
  ManualTargetDemandRecord as ManualTargetRecord,
} from '../../types';
import {
  calculateAllQuartersSummary,
  DEFAULT_MANPOWER_CONFIG,
  DEFAULT_SUPPLY_ASSUMPTION,
} from '../../utils/manpowerCalculator';
import { parseDelimitedText } from '../../utils/parser';
import { exportToExcel } from '../../utils/excel';
import {
  Users,
  Settings,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sliders,
  Activity,
  BarChart3,
  RefreshCw,
  HelpCircle,
  Zap,
} from 'lucide-react';
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
} from 'recharts';

export const ManpowerPredictionSettings: React.FC = () => {
  const {
    manpowerConfig,
    updateManpowerConfig,
    resetManpowerConfig,
    manpowerSupplyAssumption,
    updateManpowerSupplyAssumption,
    manualTargetRecords,
    addManualTargetRecord,
    updateManualTargetRecord,
    deleteManualTargetRecord,
    batchImportManualTargets,
    clearAllManualTargets,
    projectPlans,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'formula' | 'supply' | 'simulation' | 'manual'>('formula');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Local state for editing formulas to enable batch saving or immediate reaction
  const [localFormula, setLocalFormula] = useState<ManpowerFormulaConfig>(() => ({
    ...DEFAULT_MANPOWER_CONFIG,
    ...(manpowerConfig || {}),
    manager: { ...DEFAULT_MANPOWER_CONFIG.manager, ...(manpowerConfig?.manager || {}) },
    civil: {
      ...DEFAULT_MANPOWER_CONFIG.civil,
      aboveGround: { ...DEFAULT_MANPOWER_CONFIG.civil.aboveGround, ...(manpowerConfig?.civil?.aboveGround || {}) },
      underGround: { ...DEFAULT_MANPOWER_CONFIG.civil.underGround, ...(manpowerConfig?.civil?.underGround || {}) },
      landscapeVip: { ...DEFAULT_MANPOWER_CONFIG.civil.landscapeVip, ...(manpowerConfig?.civil?.landscapeVip || {}) },
    },
    mep: { ...DEFAULT_MANPOWER_CONFIG.mep, ...(manpowerConfig?.mep || {}) },
    safety: { ...DEFAULT_MANPOWER_CONFIG.safety, ...(manpowerConfig?.safety || {}) },
    admin: { ...DEFAULT_MANPOWER_CONFIG.admin, ...(manpowerConfig?.admin || {}) },
    scheduleRatio: { ...DEFAULT_MANPOWER_CONFIG.scheduleRatio, ...(manpowerConfig?.scheduleRatio || {}) },
  }));

  const [localSupply, setLocalSupply] = useState<ManpowerSupplyAssumption>(() => ({
    ...DEFAULT_SUPPLY_ASSUMPTION,
    ...(manpowerSupplyAssumption || {}),
    recruitmentLeadQuarters:
      manpowerSupplyAssumption?.recruitmentLeadQuarters ??
      (manpowerSupplyAssumption as any)?.recruitingLeadTimeQuarters ??
      DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters,
  }));

  useEffect(() => {
    if (manpowerConfig) {
      setLocalFormula({
        ...DEFAULT_MANPOWER_CONFIG,
        ...manpowerConfig,
        manager: { ...DEFAULT_MANPOWER_CONFIG.manager, ...(manpowerConfig.manager || {}) },
        civil: {
          ...DEFAULT_MANPOWER_CONFIG.civil,
          aboveGround: { ...DEFAULT_MANPOWER_CONFIG.civil.aboveGround, ...(manpowerConfig.civil?.aboveGround || {}) },
          underGround: { ...DEFAULT_MANPOWER_CONFIG.civil.underGround, ...(manpowerConfig.civil?.underGround || {}) },
          landscapeVip: { ...DEFAULT_MANPOWER_CONFIG.civil.landscapeVip, ...(manpowerConfig.civil?.landscapeVip || {}) },
        },
        mep: { ...DEFAULT_MANPOWER_CONFIG.mep, ...(manpowerConfig.mep || {}) },
        safety: { ...DEFAULT_MANPOWER_CONFIG.safety, ...(manpowerConfig.safety || {}) },
        admin: { ...DEFAULT_MANPOWER_CONFIG.admin, ...(manpowerConfig.admin || {}) },
        scheduleRatio: { ...DEFAULT_MANPOWER_CONFIG.scheduleRatio, ...(manpowerConfig.scheduleRatio || {}) },
      });
    }
  }, [manpowerConfig]);

  useEffect(() => {
    if (manpowerSupplyAssumption) {
      setLocalSupply({
        ...DEFAULT_SUPPLY_ASSUMPTION,
        ...manpowerSupplyAssumption,
        recruitmentLeadQuarters:
          manpowerSupplyAssumption.recruitmentLeadQuarters ??
          (manpowerSupplyAssumption as any)?.recruitingLeadTimeQuarters ??
          DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters,
      });
    }
  }, [manpowerSupplyAssumption]);

  // Manual Target Batch Paste State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchParseError, setBatchParseError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  // Single Manual Target Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleTarget, setSingleTarget] = useState<Omit<ManualTargetRecord, 'id'>>({
    projectCode: projectPlans[0]?.projectCode || 'HH11',
    year: 2026,
    month: 10,
    role: 'site_director',
    headcount: 1,
    note: '',
  });

  // What-If Simulation State for Impact Analysis
  const [simTurnoverRate, setSimTurnoverRate] = useState<number>(
    manpowerSupplyAssumption?.quarterlyTurnoverRate ?? DEFAULT_SUPPLY_ASSUMPTION.quarterlyTurnoverRate
  );
  const [simNewHires, setSimNewHires] = useState<number>(
    manpowerSupplyAssumption?.quarterlyNewHires ?? DEFAULT_SUPPLY_ASSUMPTION.quarterlyNewHires
  );
  const [simBaselineSupply, setSimBaselineSupply] = useState<number>(
    manpowerSupplyAssumption?.baselineHeadcount ?? DEFAULT_SUPPLY_ASSUMPTION.baselineHeadcount
  );
  const [simLeadQuarters, setSimLeadQuarters] = useState<number>(
    manpowerSupplyAssumption?.recruitmentLeadQuarters ?? DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters
  );
  const [simWarningThreshold, setSimWarningThreshold] = useState<number>(
    manpowerSupplyAssumption?.warningThresholdPercent ?? DEFAULT_SUPPLY_ASSUMPTION.warningThresholdPercent
  );

  // Sync simulation initial values when manpowerSupplyAssumption updates
  useEffect(() => {
    if (manpowerSupplyAssumption) {
      setSimTurnoverRate(manpowerSupplyAssumption.quarterlyTurnoverRate);
      setSimNewHires(manpowerSupplyAssumption.quarterlyNewHires);
      setSimBaselineSupply(manpowerSupplyAssumption.baselineHeadcount);
      setSimLeadQuarters(
        manpowerSupplyAssumption.recruitmentLeadQuarters ?? DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters
      );
      setSimWarningThreshold(
        manpowerSupplyAssumption.warningThresholdPercent ?? DEFAULT_SUPPLY_ASSUMPTION.warningThresholdPercent
      );
    }
  }, [manpowerSupplyAssumption]);

  // Simulation supply assumption object
  const simulationSupplyAssumption: ManpowerSupplyAssumption = useMemo(() => ({
    baselineHeadcount: simBaselineSupply,
    quarterlyTurnoverRate: simTurnoverRate,
    quarterlyNewHires: simNewHires,
    recruitmentLeadQuarters: simLeadQuarters,
    warningThresholdPercent: simWarningThreshold,
  }), [simBaselineSupply, simTurnoverRate, simNewHires, simLeadQuarters, simWarningThreshold]);

  // Run calculation for simulation (real-time What-If scenario)
  const simulationResult = useMemo(() => {
    return calculateAllQuartersSummary(
      projectPlans,
      manualTargetRecords,
      localFormula,
      simulationSupplyAssumption,
      '全部單位',
      '全部職類'
    );
  }, [projectPlans, manualTargetRecords, localFormula, simulationSupplyAssumption]);

  // Run calculation for baseline (current official settings) for direct side-by-side comparison
  const baselineResult = useMemo(() => {
    return calculateAllQuartersSummary(
      projectPlans,
      manualTargetRecords,
      localFormula,
      localSupply,
      '全部單位',
      '全部職類'
    );
  }, [projectPlans, manualTargetRecords, localFormula, localSupply]);

  // Merged chart data comparing demand, baseline supply, and simulated supply curves
  const comparisonChartData = useMemo(() => {
    return simulationResult.quarterSummaries.map((simQ, idx) => {
      const baseQ = baselineResult.quarterSummaries[idx] || simQ;
      return {
        quarter: simQ.quarter,
        系統試算需求: simQ.calculatedDemand,
        目前正式供給: baseQ.projectedSupply,
        模擬調整後供給: simQ.projectedSupply,
        目前缺口: baseQ.netGap > 0 ? baseQ.netGap : 0,
        模擬調整後缺口: simQ.netGap > 0 ? simQ.netGap : 0,
        警戒缺口門檻: Math.round(simQ.calculatedDemand * (simWarningThreshold / 100)),
        demand: simQ.calculatedDemand,
        simSupply: simQ.projectedSupply,
        baseSupply: baseQ.projectedSupply,
        simGap: simQ.netGap,
        baseGap: baseQ.netGap,
        isSimWarning: simQ.isWarning,
        isBaseWarning: baseQ.isWarning,
        gapPercent: simQ.gapPercent,
      };
    });
  }, [simulationResult, baselineResult, simWarningThreshold]);

  // Calculate summary KPIs comparing baseline vs simulation
  const simulationKpiDiff = useMemo(() => {
    let baseMaxGap = 0;
    let simMaxGap = 0;
    let baseTotalSupply = 0;
    let simTotalSupply = 0;
    let baseWarningCount = baselineResult.warningQuarters.length;
    let simWarningCount = simulationResult.warningQuarters.length;

    baselineResult.quarterSummaries.forEach((q) => {
      if (q.netGap > baseMaxGap) baseMaxGap = q.netGap;
      baseTotalSupply += q.projectedSupply;
    });

    simulationResult.quarterSummaries.forEach((q) => {
      if (q.netGap > simMaxGap) simMaxGap = q.netGap;
      simTotalSupply += q.projectedSupply;
    });

    return {
      baseMaxGap,
      simMaxGap,
      gapReduction: baseMaxGap - simMaxGap,
      baseWarningCount,
      simWarningCount,
      warningReduction: baseWarningCount - simWarningCount,
      baseTotalSupply,
      simTotalSupply,
      supplyDiff: simTotalSupply - baseTotalSupply,
    };
  }, [baselineResult, simulationResult]);

  // Scenario Presets
  const applyScenarioPreset = (preset: 'conservative' | 'expansion' | 'high_turnover') => {
    if (preset === 'conservative') {
      setSimTurnoverRate(2.5);
      setSimNewHires(6);
      setSimLeadQuarters(2);
      showNotification('已載入「穩健保守情境 (低離職率 2.5% · 每季招募 6 人)」');
    } else if (preset === 'expansion') {
      setSimTurnoverRate(3.5);
      setSimNewHires(12);
      setSimLeadQuarters(1);
      showNotification('已載入「擴張積極情境 (加大招募 12 人 · 縮短前置至 1 季)」');
    } else if (preset === 'high_turnover') {
      setSimTurnoverRate(7.5);
      setSimNewHires(3);
      setSimLeadQuarters(3);
      showNotification('已載入「嚴峻流動情境 (高離職率 7.5% · 招募受限 3 人)」');
    }
  };

  const handleApplySimToOfficial = () => {
    updateManpowerSupplyAssumption(simulationSupplyAssumption);
    setLocalSupply(simulationSupplyAssumption);
    showNotification('成功將模擬情境參數套用為系統正式供給設定！');
  };

  const handleResetSimToOfficial = () => {
    setSimTurnoverRate(localSupply.quarterlyTurnoverRate);
    setSimNewHires(localSupply.quarterlyNewHires);
    setSimBaselineSupply(localSupply.baselineHeadcount);
    setSimLeadQuarters(localSupply.recruitmentLeadQuarters);
    setSimWarningThreshold(localSupply.warningThresholdPercent);
    showNotification('已重置模擬參數為目前系統設定！');
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSaveFormula = () => {
    updateManpowerConfig(localFormula);
    showNotification('已成功儲存系統人力試算公式設定！');
  };

  const handleResetFormula = () => {
    if (window.confirm('確定要將系統人力試算公式還原為遠雄標準預設值嗎？')) {
      resetManpowerConfig();
      // Sync local state
      setTimeout(() => {
        showNotification('已還原為遠雄標準公式參數！');
      }, 100);
    }
  };

  const handleSaveSupply = () => {
    updateManpowerSupplyAssumption(localSupply);
    showNotification('已成功儲存供給端推估參數設定！');
  };

  // Batch import manual targets
  const SAMPLE_MANUAL_TEMPLATE = `案別代碼\t年份\t月份\t職務\t需求人數\t備註
HH11\t2026\t10\t案主管\t1\t計畫前期進駐
HH11\t2026\t11\t土建工程師\t2\t基礎動工階段
HH11\t2026\t12\t機電工程師\t1\t管線預埋
FG09\t2027\t3\t案主管\t1\t遴選完成派駐`;

  const handleCopyManualTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_MANUAL_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const mapRoleStringToKey = (str: string): ManpowerRole => {
    const s = str.trim();
    if (s.includes('主') || s.includes('director')) return 'site_director';
    if (s.includes('土建') || s.includes('civil')) return 'civil_engineer';
    if (s.includes('機電') || s.includes('mep')) return 'mep_engineer';
    if (s.includes('職安') || s.includes('safety')) return 'safety_engineer';
    return 'operation_specialist';
  };

  const handleParseBatchManual = () => {
    if (!batchRawText.trim()) {
      setBatchParseError('請貼入資料內容');
      return;
    }

    try {
      const rows = parseDelimitedText(batchRawText);
      if (rows.length === 0) {
        setBatchParseError('未發現有效資料行');
        return;
      }

      const startIdx = rows[0][0]?.includes('案別') || rows[0][0]?.includes('代碼') ? 1 : 0;
      const parsed: ManualTargetRecord[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 4 || !r[0]) continue;
        const projectCode = r[0].trim();
        const year = parseInt(r[1]) || new Date().getFullYear();
        const month = parseInt(r[2]) || 1;
        const role = mapRoleStringToKey(r[3]);
        const headcount = parseFloat(r[4]) || 1;
        const note = r[5]?.trim() || '';

        parsed.push({
          id: `manual-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          projectCode,
          year,
          month,
          role,
          headcount,
          note,
        });
      }

      if (parsed.length === 0) {
        setBatchParseError('未解析出有效紀錄，請確認格式');
        return;
      }

      batchImportManualTargets(parsed);
      setShowBatchModal(false);
      setBatchRawText('');
      setBatchParseError(null);
      showNotification(`成功匯入 ${parsed.length} 筆原人工目標計畫！`);
    } catch (e: any) {
      setBatchParseError(`解析出錯：${e.message}`);
    }
  };

  const handleExportManualExcel = () => {
    const data = manualTargetRecords.map((r) => ({
      案別代碼: r.projectCode,
      年份: r.year,
      月份: r.month,
      職務:
        r.role === 'site_director'
          ? '案主管'
          : r.role === 'civil_engineer'
          ? '土建工程師'
          : r.role === 'mep_engineer'
          ? '機電工程師'
          : r.role === 'safety_engineer'
          ? '職安工程師'
          : '外業營管專員',
      需求人數: r.headcount,
      備註: r.note || '',
    }));
    exportToExcel(data, `原人工目標既有計畫表_${new Date().toISOString().slice(0, 10)}`);
  };

  const filteredManualRecords = manualTargetRecords.filter((r) => {
    if (!manualSearch.trim()) return true;
    const q = manualSearch.toLowerCase();
    return r.projectCode.toLowerCase().includes(q) || (r.note && r.note.toLowerCase().includes(q));
  });

  return (
    <div id="manpower-prediction-settings-content" className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              案場人力預測後台設定
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              外案配置規則與試算引擎
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            維護外案職位人力計算公式參數、原人工目標既有計畫表匯入，以及供給端離職與招募前置推估參數
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Quick jump to Manpower Supply/Demand Dashboard */}
          <button
            onClick={() => setActiveView('manpower_dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            前往人力供需戰情看板
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Jump to Project Plan Settings */}
          <button
            onClick={() => setActiveView('backend_project_plans')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            查看開案計畫清冊
          </button>

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl gap-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('formula')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'formula'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          (1-2) 系統試算人力公式設定
        </button>
        <button
          onClick={() => setActiveTab('supply')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'supply'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          (2) 供給端推估參數設定
        </button>
        <button
          onClick={() => setActiveTab('simulation')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'simulation'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          (3) 試算參數變動影響 (What-If 敏感情境分析)
          <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold font-mono">
            即時走勢
          </span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          (1-1) 原人工目標 (既有計畫表) 匯入
          <span className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full text-slate-600 font-mono">
            {manualTargetRecords.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: 系統試算人力公式設定 (1-2)
         ======================================================== */}
      {activeTab === 'formula' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                後台公式已連動至前端所有案場排程，修改後請點擊「儲存公式參數」即刻生效。
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFormula}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                還原標準預設
              </button>
              <button
                type="button"
                onClick={handleSaveFormula}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                儲存公式參數
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1-2-1. 案主管 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800">1-2-1. 案主管配置規則</h4>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                  案前 1 人 / F+365 歸零
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                公式說明：自案前排程配置 1 人，至使照核發後 365 天 (F+365) 釋出歸零。
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">案前配置基準人數</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localFormula.manager.preWorkHeadcount}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        manager: {
                          ...localFormula.manager,
                          preWorkHeadcount: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">使照後歸零天數 (F+N)</label>
                  <input
                    type="number"
                    value={localFormula.manager.resetDaysAfterLicense}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        manager: {
                          ...localFormula.manager,
                          resetDaysAfterLicense: parseInt(e.target.value) || 365,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 1-2-5. 外業營管專員 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-800">1-2-5. 外業營管專員配置規則</h4>
                </div>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  案前 1 人 / F+365 歸零
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                公式說明：案前排程配置 1 人，F+365 天釋出歸零。
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">案前配置基準人數</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localFormula.admin.preWorkHeadcount}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        admin: {
                          ...localFormula.admin,
                          preWorkHeadcount: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">使照後歸零天數 (F+N)</label>
                  <input
                    type="number"
                    value={localFormula.admin.resetDaysAfterLicense}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        admin: {
                          ...localFormula.admin,
                          resetDaysAfterLicense: parseInt(e.target.value) || 365,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 1-2-3. 機電工程師 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <h4 className="text-xs font-bold text-slate-800">1-2-3. 機電工程師配置規則</h4>
                </div>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">
                  基準 = 總層數 ÷ 設定值
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                案前 0.5 人，動工起 1 人，交屋 0.5 人，管委會成立 0.25 人，F+365 歸零；基準人數＝總層數 ÷ 設定值（四捨五入）。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">總層數除數設定值</label>
                  <input
                    type="number"
                    step="0.5"
                    value={localFormula.mep.divisorFloors}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        mep: {
                          ...localFormula.mep,
                          divisorFloors: parseFloat(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">案前係數</label>
                  <input
                    type="number"
                    step="0.05"
                    value={localFormula.mep.preWorkRate}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        mep: {
                          ...localFormula.mep,
                          preWorkRate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">動工起係數</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localFormula.mep.startWorkRate}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        mep: {
                          ...localFormula.mep,
                          startWorkRate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">交屋 / 管委會</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={localFormula.mep.handoverRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          mep: {
                            ...localFormula.mep,
                            handoverRate: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-1/2 p-1.5 border border-slate-300 rounded-lg outline-none text-[11px]"
                      title="交屋係數"
                    />
                    <input
                      type="number"
                      step="0.05"
                      value={localFormula.mep.committeeRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          mep: {
                            ...localFormula.mep,
                            committeeRate: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-1/2 p-1.5 border border-slate-300 rounded-lg outline-none text-[11px]"
                      title="管委會係數"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 1-2-4. 職安工程師 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800">1-2-4. 職安工程師配置規則</h4>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                  動工 1 人 / 使照後歸零
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                動工起 1 人，使照後歸零；基準人數＝總層數 ÷ 設定值（四捨五入）。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">總層數除數設定值</label>
                  <input
                    type="number"
                    step="0.5"
                    value={localFormula.safety.divisorFloors}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        safety: {
                          ...localFormula.safety,
                          divisorFloors: parseFloat(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">動工起係數</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localFormula.safety.startWorkRate}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        safety: {
                          ...localFormula.safety,
                          startWorkRate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">歸零時點</label>
                  <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-semibold text-[11px]">
                    使照日 (F) 即刻歸零
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-2-2. 土建工程師 (三向維度：地上層 / 地下層 / 景觀VIP) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  1-2-2. 土建工程師細項配置規則（地上層 / 地下層 / 景觀及VIP）
                </h4>
              </div>
              <span className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono font-bold">
                三維複合累計
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 地上層 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>* 地上層土建規則</span>
                  <span className="text-[10px] text-blue-600 font-mono">地上層數 ÷ 設定值</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  案前0.3人，動工起1人，交屋0.5人，管委會成立0.25人，F+365歸零。
                </p>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    地上層數除數設定值 (四捨五入)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={localFormula.civil.aboveGround.divisorFloors}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        civil: {
                          ...localFormula.civil,
                          aboveGround: {
                            ...localFormula.civil.aboveGround,
                            divisorFloors: parseFloat(e.target.value) || 1,
                          },
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-rose-700 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">案前係數:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={localFormula.civil.aboveGround.preWorkRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          civil: {
                            ...localFormula.civil,
                            aboveGround: {
                              ...localFormula.civil.aboveGround,
                              preWorkRate: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full p-1 border border-slate-200 rounded mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500">動工起係數:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={localFormula.civil.aboveGround.startWorkRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          civil: {
                            ...localFormula.civil,
                            aboveGround: {
                              ...localFormula.civil.aboveGround,
                              startWorkRate: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full p-1 border border-slate-200 rounded mt-0.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 地下層 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>* 地下層土建規則</span>
                  <span className="text-[10px] text-blue-600 font-mono">地下室面積 ÷ 設定值</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  自1FL起1人，交屋0.5人，管委會成立0.25人，F+365歸零。
                </p>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    地下室面積(坪)除數設定值
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={localFormula.civil.underGround.divisorArea}
                    onChange={(e) =>
                      setLocalFormula({
                        ...localFormula,
                        civil: {
                          ...localFormula.civil,
                          underGround: {
                            ...localFormula.civil.underGround,
                            divisorArea: parseFloat(e.target.value) || 1,
                          },
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-rose-700 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">1FL起係數:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={localFormula.civil.underGround.from1FLRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          civil: {
                            ...localFormula.civil,
                            underGround: {
                              ...localFormula.civil.underGround,
                              from1FLRate: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full p-1 border border-slate-200 rounded mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500">交屋/管委會:</span>
                    <div className="text-[11px] text-slate-600 mt-1 font-mono">0.5 / 0.25</div>
                  </div>
                </div>
              </div>

              {/* 景觀 / VIP */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>* 景觀 / VIP公設規則</span>
                  <span className="text-[10px] text-purple-600 font-mono">勾選即計 / 基準固定1</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  2FL起0.5人，6FL起1人，交屋0.5人，管委會成立0.25人，F+365歸零。
                </p>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">基準人數</label>
                  <div className="p-1.5 border border-slate-200 rounded-lg bg-white font-bold text-purple-700 font-mono">
                    固定 1 人（依開案計畫勾選啟用）
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">2FL 起係數:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={localFormula.civil.landscapeVip.from2FLRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          civil: {
                            ...localFormula.civil,
                            landscapeVip: {
                              ...localFormula.civil.landscapeVip,
                              from2FLRate: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full p-1 border border-slate-200 rounded mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500">6FL 起係數:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={localFormula.civil.landscapeVip.from6FLRate}
                      onChange={(e) =>
                        setLocalFormula({
                          ...localFormula,
                          civil: {
                            ...localFormula.civil,
                            landscapeVip: {
                              ...localFormula.civil.landscapeVip,
                              from6FLRate: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full p-1 border border-slate-200 rounded mt-0.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 工期節點進度比例推估設定 */}
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  工期節點估算比例（無 1FL/2FL/6FL 實際日期的案場以動工至使照總天數比例自動換算）：
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1FL (動工起 {Math.round(localFormula.scheduleRatio.fl1ProgressRatio * 100)}%)、2FL ({Math.round(localFormula.scheduleRatio.fl2ProgressRatio * 100)}%)、6FL ({Math.round(localFormula.scheduleRatio.fl6ProgressRatio * 100)}%)
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  step="0.01"
                  value={localFormula.scheduleRatio.fl1ProgressRatio}
                  onChange={(e) =>
                    setLocalFormula({
                      ...localFormula,
                      scheduleRatio: {
                        ...localFormula.scheduleRatio,
                        fl1ProgressRatio: parseFloat(e.target.value) || 0.2,
                      },
                    })
                  }
                  className="w-16 p-1 border border-slate-300 rounded bg-white text-center text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  value={localFormula.scheduleRatio.fl2ProgressRatio}
                  onChange={(e) =>
                    setLocalFormula({
                      ...localFormula,
                      scheduleRatio: {
                        ...localFormula.scheduleRatio,
                        fl2ProgressRatio: parseFloat(e.target.value) || 0.35,
                      },
                    })
                  }
                  className="w-16 p-1 border border-slate-300 rounded bg-white text-center text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  value={localFormula.scheduleRatio.fl6ProgressRatio}
                  onChange={(e) =>
                    setLocalFormula({
                      ...localFormula,
                      scheduleRatio: {
                        ...localFormula.scheduleRatio,
                        fl6ProgressRatio: parseFloat(e.target.value) || 0.55,
                      },
                    })
                  }
                  className="w-16 p-1 border border-slate-300 rounded bg-white text-center text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: 供給端推估參數設定 (Supply Side)
         ======================================================== */}
      {activeTab === 'supply' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600">
              設定人力供給端模擬參數，包含每季離職率、招募進度、前置期與缺口警示門檻。
            </span>
            <button
              type="button"
              onClick={handleSaveSupply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              儲存供給端參數
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 起始基準人力 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                起始基準人力（目前在職總人數）
              </label>
              <p className="text-[11px] text-slate-500">
                預設抓目前季度的實際在職人數，可在此手動調整覆蓋以進行情境模擬。
              </p>
              <input
                type="number"
                value={localSupply.baselineHeadcount}
                onChange={(e) =>
                  setLocalSupply({
                    ...localSupply,
                    baselineHeadcount: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-blue-700 text-sm"
              />
            </div>

            {/* 每季離職率 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                每季離職率 (%)
              </label>
              <p className="text-[11px] text-slate-500">
                全公司平均離職率，預設為 3%（每季度按期初人力乘算減項）。
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={localSupply.quarterlyTurnoverRate}
                  onChange={(e) =>
                    setLocalSupply({
                      ...localSupply,
                      quarterlyTurnoverRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 pr-8 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-800 text-sm"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* 每季預計新進人力 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                每季預計新進人力（人）
              </label>
              <p className="text-[11px] text-slate-500">
                常態性季補員計畫人數，預設為 0（純靠特定專案調度）。
              </p>
              <input
                type="number"
                value={localSupply.quarterlyNewHires}
                onChange={(e) =>
                  setLocalSupply({
                    ...localSupply,
                    quarterlyNewHires: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-emerald-700 text-sm"
              />
            </div>

            {/* 招募前置季數 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                招募前置季數（季）
              </label>
              <p className="text-[11px] text-slate-500">
                工程專案人力招募與培育準備週期，預設為 2 季（提前半年啟動招募）。
              </p>
              <input
                type="number"
                value={localSupply.recruitmentLeadQuarters}
                onChange={(e) =>
                  setLocalSupply({
                    ...localSupply,
                    recruitmentLeadQuarters: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-800 text-sm"
              />
            </div>

            {/* 預警門檻（缺口佔需求 %） */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                預警門檻（缺口佔需求 %）
              </label>
              <p className="text-[11px] text-slate-500">
                當某季度人力缺口佔該季總需求超過此比率時，儀表板將觸發紅字警戒（預設 15%）。
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={localSupply.warningThresholdPercent}
                  onChange={(e) =>
                    setLocalSupply({
                      ...localSupply,
                      warningThresholdPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 pr-8 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-rose-600 text-sm"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Quick Preview of Supply Curve under current settings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  當前供給參數推估走勢預覽（與案場總需求對比）
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('simulation')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                進入 (3) 試算參數變動影響 (What-If 完整情境分析)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisonChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="系統試算需求" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Line
                    type="monotone"
                    dataKey="目前正式供給"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2563eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="目前缺口"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#f43f5e' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: 試算參數變動影響 (What-If 敏感情境分析)
         ======================================================== */}
      {activeTab === 'simulation' && (
        <div className="space-y-4">
          {/* Header Card with Action Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  試算參數變動影響（What-If 敏感情境分析）
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                  即時曲線連動
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                任意拖曳下方離職率、每季新進招募人數或在職基準，系統即時重繪 12 季供需曲線與缺口衝擊，協助營造高階主管制定人力決策。
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetSimToOfficial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                重置為目前正式設定
              </button>
              <button
                type="button"
                onClick={handleApplySimToOfficial}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                套用此模擬參數為正式設定
              </button>
            </div>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>快速載入情境範本：</span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => applyScenarioPreset('conservative')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                🌱 穩健保守情境 (離職 2.5% · 招募 6人)
              </button>
              <button
                onClick={() => applyScenarioPreset('expansion')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                🚀 積極擴編情境 (離職 3.5% · 招募 12人 · 前置 1季)
              </button>
              <button
                onClick={() => applyScenarioPreset('high_turnover')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                ⚠️ 嚴峻流動情境 (離職 7.5% · 招募 3人 · 前置 3季)
              </button>
            </div>
          </div>

          {/* Side-by-side Decision Comparison KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                最高季度淨缺口衝擊對比
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-mono font-bold text-indigo-700">
                  {simulationKpiDiff.simMaxGap} 人
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (原正式設定: {simulationKpiDiff.baseMaxGap} 人)
                </span>
              </div>
              <p className="text-[11px] mt-1 font-semibold">
                {simulationKpiDiff.gapReduction > 0 ? (
                  <span className="text-emerald-600">
                    ▼ 缺口縮減 {simulationKpiDiff.gapReduction} 人（供需改善）
                  </span>
                ) : simulationKpiDiff.gapReduction < 0 ? (
                  <span className="text-rose-600">
                    ▲ 缺口擴大 {Math.abs(simulationKpiDiff.gapReduction)} 人（風險升高）
                  </span>
                ) : (
                  <span className="text-slate-500">— 缺口與目前正式設定相同</span>
                )}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                超標警戒季度數 (缺口 &gt; {simWarningThreshold}%)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-xl font-mono font-bold ${
                    simulationKpiDiff.simWarningCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {simulationKpiDiff.simWarningCount} 季
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (原正式設定: {simulationKpiDiff.baseWarningCount} 季)
                </span>
              </div>
              <p className="text-[11px] mt-1 font-semibold">
                {simulationKpiDiff.warningReduction > 0 ? (
                  <span className="text-emerald-600">
                    ▼ 減少 {simulationKpiDiff.warningReduction} 個警戒季度
                  </span>
                ) : simulationKpiDiff.warningReduction < 0 ? (
                  <span className="text-rose-600">
                    ▲ 增加 {Math.abs(simulationKpiDiff.warningReduction)} 個警戒季度
                  </span>
                ) : (
                  <span className="text-slate-500">— 警戒季度數持平</span>
                )}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                12 季累計推估供給人次變化
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-mono font-bold text-slate-800">
                  {simulationKpiDiff.simTotalSupply} 人次
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (原正式設定: {simulationKpiDiff.baseTotalSupply} 人次)
                </span>
              </div>
              <p className="text-[11px] mt-1 font-semibold">
                {simulationKpiDiff.supplyDiff > 0 ? (
                  <span className="text-emerald-600">
                    ▲ 累計增加供給 +{simulationKpiDiff.supplyDiff} 人次
                  </span>
                ) : simulationKpiDiff.supplyDiff < 0 ? (
                  <span className="text-rose-600">
                    ▼ 累計減少供給 {simulationKpiDiff.supplyDiff} 人次
                  </span>
                ) : (
                  <span className="text-slate-500">— 累計供給持平</span>
                )}
              </p>
            </div>
          </div>

          {/* Interactive Sliders & Inputs Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                變數調整控制台（滑動即刻重算）
              </h4>
              <span className="text-[11px] text-slate-400">
                此處調整僅為模擬試算，點擊上方按鈕方會正式生效
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. 每季自然離職率 (%) */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    每季自然離職率 (%)
                  </label>
                  <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {simTurnoverRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.2"
                  value={simTurnoverRate}
                  onChange={(e) => setSimTurnoverRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (極低)</span>
                  <span>4.5% (標準)</span>
                  <span>15% (極端流動)</span>
                </div>
              </div>

              {/* 2. 每季新進招募人力 (人) */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    每季新進招募人力 (人/季)
                  </label>
                  <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{simNewHires} 人
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={simNewHires}
                  onChange={(e) => setSimNewHires(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0人 (凍結)</span>
                  <span>5人 (一般)</span>
                  <span>25人 (大舉招聘)</span>
                </div>
              </div>

              {/* 3. 起始基準在職總人數 (人) */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    初始在職基準總額 (人)
                  </label>
                  <span className="text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {simBaselineSupply} 人
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  step="5"
                  value={simBaselineSupply}
                  onChange={(e) => setSimBaselineSupply(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>60人</span>
                  <span>120人 (常態)</span>
                  <span>200人</span>
                </div>
              </div>

              {/* 4. 招募儲備前置期 (季) */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    招募培訓前置期 (季)
                  </label>
                  <span className="text-xs font-mono font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {simLeadQuarters} 季 (提前 {simLeadQuarters * 3} 個月)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={simLeadQuarters}
                  onChange={(e) => setSimLeadQuarters(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0季 (即時入職)</span>
                  <span>2季 (常態半年)</span>
                  <span>4季 (一年期)</span>
                </div>
              </div>

              {/* 5. 缺口警戒預警門檻 (%) */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    缺口佔需求預警門檻 (%)
                  </label>
                  <span className="text-xs font-mono font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {simWarningThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={simWarningThreshold}
                  onChange={(e) => setSimWarningThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>5% (極嚴格)</span>
                  <span>15% (遠雄標準)</span>
                  <span>30% (寬鬆)</span>
                </div>
              </div>

              {/* Fast Reset Box */}
              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col justify-center gap-1.5">
                <span className="text-xs font-bold text-indigo-900">
                  即時試算狀態：
                </span>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  目前模擬：離職 <strong>{simTurnoverRate}%</strong>，招募 <strong>+{simNewHires}人</strong>。
                  圖表中綠色實線代表新情境，灰色虛線代表原正式設定。
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Chart: Real-time Curve Comparison */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  人力供需走勢曲線即時對照圖 (What-If Simulation Curves)
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span className="w-2.5 h-2.5 bg-blue-300 rounded-sm" /> 系統需求柱
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed" /> 原正式供給
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold font-mono">
                  <span className="w-3 h-1 bg-emerald-500 rounded" /> 模擬調整後供給
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisonChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {/* System Demand */}
                  <Bar dataKey="系統試算需求" fill="#bfdbfe" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  {/* Baseline Supply Curve (dashed) */}
                  <Line
                    type="monotone"
                    dataKey="目前正式供給"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#94a3b8' }}
                  />
                  {/* Simulated Supply Curve (highlight emerald) */}
                  <Line
                    type="monotone"
                    dataKey="模擬調整後供給"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                  {/* Simulated Net Gap Curve */}
                  <Line
                    type="monotone"
                    dataKey="模擬調整後缺口"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f43f5e' }}
                  />
                  {/* Alert Threshold Indicator */}
                  <ReferenceLine
                    y={0}
                    stroke="#e2e8f0"
                    strokeWidth={1.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Sensitivity Details Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              季度敏感度試算對照明細
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">預測季度</th>
                    <th className="py-2 px-3 text-right">系統試算需求</th>
                    <th className="py-2 px-3 text-right">原正式供給</th>
                    <th className="py-2 px-3 text-right font-bold text-emerald-700">
                      模擬調整後供給
                    </th>
                    <th className="py-2 px-3 text-right">供給人次增減</th>
                    <th className="py-2 px-3 text-right">模擬淨缺口</th>
                    <th className="py-2 px-3 text-right">缺口佔需求比</th>
                    <th className="py-2 px-3 text-center">警戒狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {comparisonChartData.map((row) => {
                    const supplyDelta = row.simSupply - row.baseSupply;
                    return (
                      <tr key={row.quarter} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-900">{row.quarter}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-600">
                          {row.demand} 人
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {row.baseSupply} 人
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                          {row.simSupply} 人
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {supplyDelta > 0 ? (
                            <span className="text-emerald-600">+{supplyDelta}</span>
                          ) : supplyDelta < 0 ? (
                            <span className="text-rose-600">{supplyDelta}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {row.simGap > 0 ? (
                            <span className="text-rose-600">-{row.simGap} 人</span>
                          ) : (
                            <span className="text-emerald-600">充足</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`font-bold ${
                              row.gapPercent >= simWarningThreshold ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            {row.gapPercent}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {row.isSimWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              超標警戒
                            </span>
                          ) : row.simGap > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              常規缺口
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              充裕滿足
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: 原人工目標 (既有計畫表) 匯入 (1-1)
         ======================================================== */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="搜尋案別或備註..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-52"
                />
              </div>
              <span className="text-xs text-slate-500">
                筆數：<strong className="text-blue-600 font-mono">{filteredManualRecords.length}</strong> 筆
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSingleModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                新增單筆目標
              </button>
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                批次貼入匯入既有計畫表
              </button>
              <button
                type="button"
                onClick={handleExportManualExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                匯出 Excel
              </button>
              {manualTargetRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('確定要清空所有原人工目標紀錄嗎？')) {
                      clearAllManualTargets();
                      showNotification('已清空所有原人工目標！');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空
                </button>
              )}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3">案別代碼</th>
                    <th className="py-2.5 px-3 text-center">年份</th>
                    <th className="py-2.5 px-3 text-center">月份</th>
                    <th className="py-2.5 px-3">職務職位</th>
                    <th className="py-2.5 px-3 text-right">人工目標需求 (人)</th>
                    <th className="py-2.5 px-3">備註說明</th>
                    <th className="py-2.5 px-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                  {filteredManualRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        目前尚無原人工目標紀錄，請點擊「批次貼入匯入既有計畫表」或「新增單筆目標」
                      </td>
                    </tr>
                  ) : (
                    filteredManualRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">{r.projectCode}</td>
                        <td className="py-2 px-3 text-center font-mono">{r.year}</td>
                        <td className="py-2 px-3 text-center font-mono">{r.month} 月</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {r.role === 'site_director'
                            ? '案主管'
                            : r.role === 'civil_engineer'
                            ? '土建工程師'
                            : r.role === 'mep_engineer'
                            ? '機電工程師'
                            : r.role === 'safety_engineer'
                            ? '職安工程師'
                            : '外業營管專員'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-700">
                          {r.headcount} 人
                        </td>
                        <td className="py-2 px-3 text-slate-500">{r.note || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteManualTargetRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="刪除此筆"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BATCH IMPORT MODAL
         ======================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  批次匯入原人工目標（既有計畫表）
                </h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              將既有計畫表中該案場各職位的人力需求（按年/月）自 Excel
              複製後直接貼於下方文字框（支援 Tab 或逗號分隔）。
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                貼入格式：案別代碼、年份、月份、職務、需求人數、備註
              </span>
              <button
                type="button"
                onClick={handleCopyManualTemplate}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTemplate ? '已複製範本！' : '複製範本表格'}
              </button>
            </div>

            <textarea
              rows={8}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder={`HH11\t2026\t10\t案主管\t1\t計畫前期進駐\nFG09\t2027\t3\t土建工程師\t2\t動工階段`}
              className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
            />

            {batchParseError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{batchParseError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleParseBatchManual}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                開始解析並匯入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SINGLE MANUAL TARGET MODAL
         ======================================================== */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">新增原人工目標紀錄</h3>
              <button
                onClick={() => setShowSingleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">案別代碼 *</label>
                <input
                  type="text"
                  value={singleTarget.projectCode}
                  onChange={(e) => setSingleTarget({ ...singleTarget, projectCode: e.target.value })}
                  placeholder="如 HH11"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">年份 *</label>
                  <input
                    type="number"
                    value={singleTarget.year}
                    onChange={(e) =>
                      setSingleTarget({ ...singleTarget, year: parseInt(e.target.value) || 2026 })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">月份 *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={singleTarget.month}
                    onChange={(e) =>
                      setSingleTarget({ ...singleTarget, month: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">職位職務 *</label>
                  <select
                    value={singleTarget.role}
                    onChange={(e) =>
                      setSingleTarget({ ...singleTarget, role: e.target.value as ManpowerRole })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="site_director">案主管</option>
                    <option value="civil_engineer">土建工程師</option>
                    <option value="mep_engineer">機電工程師</option>
                    <option value="safety_engineer">職安工程師</option>
                    <option value="operation_specialist">外業營管專員</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">需求人數 *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={singleTarget.headcount}
                    onChange={(e) =>
                      setSingleTarget({ ...singleTarget, headcount: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">備註說明</label>
                <input
                  type="text"
                  value={singleTarget.note || ''}
                  onChange={(e) => setSingleTarget({ ...singleTarget, note: e.target.value })}
                  placeholder="備註說明"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!singleTarget.projectCode) return;
                  addManualTargetRecord({
                    ...singleTarget,
                    id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  });
                  setShowSingleModal(false);
                  showNotification('已新增原人工目標！');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                儲存目標
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
