import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectPlan, BuildingCategory, getProjectBuildingCategory, BUILDING_CATEGORIES } from '../../types';
import { parseDelimitedText } from '../../utils/parser';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  Building2,
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Edit2,
  X,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  Layers,
  ArrowRight,
  Calendar,
  Eye,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const ProjectPlanSettings: React.FC = () => {
  const {
    projectPlans,
    addProjectPlan,
    updateProjectPlan,
    deleteProjectPlan,
    batchImportProjectPlans,
    clearAllProjectPlans,
    setActiveView,
  } = useApp();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectPlan | null>(null);

  // Helper to calculate F+150 days
  const calculateFPlus150 = (fDate: string): string => {
    if (!fDate) return '';
    try {
      const d = new Date(fDate);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 150);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Batch paste state
  const [batchRawText, setBatchRawText] = useState('');
  const [batchDelimiter, setBatchDelimiter] = useState<string>('auto');
  const [batchParseError, setBatchParseError] = useState<string | null>(null);
  const [parsedPreviewList, setParsedPreviewList] = useState<ProjectPlan[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Single Add / Edit Form State
  const [formData, setFormData] = useState<Omit<ProjectPlan, 'id'>>({
    projectCode: 'FG-TC01',
    region: '台中市西屯區',
    selectionDate: '2027-04-10',
    remainingDays: 265,
    startWorkDate: '2027-08-15',
    permitDate: '2027-05-20',
    licenseFDate: '2030-10-30',
    standardReleaseDate: '2031-03-29',
    handoverDate: '2031-04-30',
    committeeDate: '2031-07-30',
    isTakedownActive: true,
    department: '二部',
    section: '台中工務所',
    hasLandscapeVip: true,
    basementArea: 4800,
    totalFloorArea: 92450.0,
    undergroundFloors: '5',
    abovegroundFloors: '29',
    buildingsCount: 2,
    unitsCount: 320,
    jointOrUrbanRenewal: '合建案',
    defenseOrComprehensive: '防綜案',
    hazardAssessment: '危評案',
    specialMethod: '深開挖',
    pricePerPing: '72.5',
    costPerPing: '34.0',
    scaleType: '大型住宅',
    buildingCategory: '住宅',
    openYear: 2027,
    openQuarter: '2027Q3',
  });

  const filteredProjects = useMemo(() => {
    return projectPlans.filter((p) => {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const m1 = p.projectCode.toLowerCase().includes(q);
        const m2 = p.region.toLowerCase().includes(q);
        const m3 = p.scaleType.toLowerCase().includes(q);
        const bCat = p.buildingCategory || getProjectBuildingCategory(p);
        const m4 = bCat.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [projectPlans, searchKeyword]);

  const SAMPLE_PROJECT_DATA = `FG-TC01\t台中市西屯區\t2027-04-10\t265\t2027-08-15\t2027-05-20\t92450.0\t5\t29\t2\t320\t合建案\t防綜案\t危評案\t深開挖\t72.5\t34.0\t大型住宅\t住宅
FG-TC02\t台中市南屯區\t2028-03-25\t562\t2028-07-30\t2028-05-10\t78600.0\t4\t24\t2\t260\t無\t防綜案\t無\t深開挖\t68.0\t33.0\t中型住宅\t住宅
FG-TY01\t桃園市龜山區\t2025-12-08\t-191\t2026-05-07\t2026-01-22\t239064.5\t7\t32\t5\t1753\t合建案\t防綜案\t危評案\t深開挖\t65.8\t32.5\t大型住宅\t住宅
FG-TN01\t台南市東區\t2026-05-07\t-41\t2026-09-19\t2026-06-21\t50878.5\t6\t25\t2\t380\t無\t無\t危評案\t深開挖\t63.5\t30.0\t中型住宅\t住宅
FG-KH01\t高雄市鼓山區\t2026-11-15\t151\t2027-03-29\t2027-01-18\t32410.0\t5\t23\t1\t198\t無\t無\t無\t深開挖\t58.0\t28.0\t中型住宅\t住宅`;

  const SAMPLE_HEADER_TEMPLATE = `案別代碼\t地區\t遴選日期\t剩餘天數\t預計開工日\t建照取得日\t總樓地板面積(坪)\t地下層數\t地上層數\t棟數\t戶數\t合建/都更\t防綜案\t危害評估\t特殊工法\t每坪銷價\t每坪造價\t規模類型\t工程類型(住宅/廠辦/商辦/專案)`;

  // Parse Step 1 -> Opens Confirmation Modal (Step 2)
  const handleParseAndOpenPreview = () => {
    setBatchParseError(null);
    if (!batchRawText.trim()) {
      setBatchParseError('請貼入開案計畫文字資料');
      return;
    }

    try {
      const customDelim = batchDelimiter === 'auto' ? undefined : batchDelimiter;
      const rows = parseDelimitedText(batchRawText, customDelim);

      if (rows.length === 0) {
        setBatchParseError('解析失敗：未發現有效的資料列');
        return;
      }

      const startIdx =
        rows[0][0]?.includes('案別') ||
        rows[0][0]?.includes('代碼') ||
        rows[0][0]?.toLowerCase().includes('code')
          ? 1
          : 0;

      const imported: ProjectPlan[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2 || !row[0] || row[0].trim() === '') continue;

        const projectCode = row[0].trim();
        const region = row[1]?.trim() || '新北市';
        const selectionDate = row[2]?.trim() || '2026-12-01';
        const remainingDays = parseInt(row[3]) || 120;
        const startWorkDate = row[4]?.trim() || '2027-02-01';
        const permitDate = row[5]?.trim() || '2026-12-15';
        const totalFloorArea = parseFloat(row[6]?.replace(/,/g, '')) || 35000;
        const undergroundFloors = row[7]?.trim() || 'B3';
        const abovegroundFloors = row[8]?.trim() || '24F';
        const buildingsCount = parseInt(row[9]) || 1;
        const unitsCount = parseInt(row[10]) || 120;
        const jointOrUrbanRenewal = row[11]?.trim() || '無';
        const defenseOrComprehensive = row[12]?.trim() || '無';
        const hazardAssessment = row[13]?.trim() || '無';
        const specialMethod = row[14]?.trim() || '無';
        const pricePerPing = row[15]?.trim() || '70~80萬';
        const costPerPing = row[16]?.trim() || '25~28萬';
        const scaleType = (row[17]?.trim() || '中型住宅') as any;
        const rawBuildingCat = row[18]?.trim();
        const buildingCategory: BuildingCategory =
          rawBuildingCat && BUILDING_CATEGORIES.includes(rawBuildingCat as any)
            ? (rawBuildingCat as BuildingCategory)
            : getProjectBuildingCategory({
                scaleType,
                projectCode,
                jointOrUrbanRenewal,
              });

        const openYear = parseInt(selectionDate.slice(0, 4)) || 2026;
        const openQuarter = `${openYear}Q4`;

        imported.push({
          id: `proj-imp-${Date.now()}-${i}`,
          projectCode,
          region,
          selectionDate,
          remainingDays,
          startWorkDate,
          permitDate,
          totalFloorArea,
          undergroundFloors,
          abovegroundFloors,
          buildingsCount,
          unitsCount,
          jointOrUrbanRenewal,
          defenseOrComprehensive,
          hazardAssessment,
          specialMethod,
          pricePerPing,
          costPerPing,
          scaleType,
          buildingCategory,
          openYear,
          openQuarter,
        });
      }

      if (imported.length === 0) {
        setBatchParseError('未能解析出有效的開案計畫，請確認貼入內容與格式');
        return;
      }

      setParsedPreviewList(imported);
      setShowConfirmModal(true);
    } catch (e: any) {
      setBatchParseError(`解析出錯：${e?.message || '格式異常'}`);
    }
  };

  // Final Commit Import from Confirmation Modal
  const handleConfirmFinalImport = () => {
    if (parsedPreviewList.length === 0) return;

    batchImportProjectPlans(parsedPreviewList);
    setShowConfirmModal(false);
    setShowBatchModal(false);
    setBatchRawText('');
    setSuccessToast(`成功匯入 ${parsedPreviewList.length} 筆開案計畫排程資料！`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_HEADER_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleSaveSingleProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectCode) return;

    if (editingProject) {
      updateProjectPlan(editingProject.id, formData);
      setEditingProject(null);
    } else {
      addProjectPlan({
        id: `proj-${Date.now()}`,
        ...formData,
      });
      setShowAddModal(false);
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('project-plan-settings-content', {
        filename: `遠雄營造_開案計畫設定清冊_${new Date().toISOString().slice(0, 10)}`,
        title: '遠雄營造 開案計畫設定 管理清冊',
        subtitle: `開案標案總數：${filteredProjects.length} 案 · 內部工程與人資排程管制`,
        landscape: true,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map((p) => ({
      案別: p.projectCode,
      工程類型: p.buildingCategory || getProjectBuildingCategory(p),
      區域: p.region,
      工務所: `${p.department || ''} ${p.section || ''}`.trim(),
      遴選日: p.selectionDate,
      剩餘天數: p.remainingDays,
      開工日: p.startWorkDate,
      建照日: p.permitDate,
      使照日_F: p.licenseFDate || '',
      標準釋出_F加150: p.standardReleaseDate || '',
      交屋日: p.handoverDate || '預估中',
      管委會成立日: p.committeeDate || '預估中',
      下架啟動: p.isTakedownActive ? '已啟動' : '未啟動',
      總樓地板面積: p.totalFloorArea,
      地下室面積_坪: p.basementArea || 0,
      地下層: p.undergroundFloors,
      地上層: p.abovegroundFloors,
      景觀VIP公設: p.hasLandscapeVip ? '有' : '無',
      棟數: p.buildingsCount,
      戶數: p.unitsCount,
      合建都更: p.jointOrUrbanRenewal,
      防綜案: p.defenseOrComprehensive,
      危評案: p.hazardAssessment,
      特殊工法: p.specialMethod,
      售價: p.pricePerPing,
      造價: p.costPerPing,
      規模: p.scaleType,
    }));
    exportToExcel(exportData, `遠雄營造_開案計畫後台資料_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div id="project-plan-settings-content" className="space-y-5">
      {/* Top Banner with Quick Navigation */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              開案計畫設定
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              工程排程與標案清冊
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            維護工程開案計畫時程（含使照日 F、標準釋出 F+150、交屋日、管委會成立日與下架狀態），即時連動前台戰情儀表板與人力預測試算
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Visual Shortcut to Supervisor Permission Matrix */}
          <button
            id="btn-shortcut-to-perm-matrix"
            onClick={() => setActiveView('backend_global_settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
            title="一鍵直接前往主管權限矩陣"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            前往主管權限矩陣 (1-5)
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Visual Shortcut to Manpower Forecast Settings */}
          <button
            id="btn-shortcut-to-manpower-settings"
            onClick={() => setActiveView('backend_manpower_forecast_settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
            title="一鍵前往案場人力預測規則設定"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            案場人力預測設定
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋案別/區域/規模..."
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 w-52 bg-white outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            標案總數：<strong className="text-blue-700 font-mono font-bold">{filteredProjects.length}</strong> 案
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setBatchRawText('');
              setBatchParseError(null);
              setShowBatchModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            批次貼入開案資料
          </button>

          <button
            onClick={() => {
              setEditingProject(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新增開案計畫
          </button>

          {/* Export PDF Button */}
          <button
            id="btn-export-project-plan-settings-pdf"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg shadow-xs transition-colors"
            title="將當前開案計畫清冊匯出為 PDF 報告"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>產生報告中...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>匯出 PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            匯出 Excel
          </button>

          <button
            onClick={() => {
              if (window.confirm('確定要全數清空開案計畫資料庫嗎？此操作無法還原。')) {
                clearAllProjectPlans();
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            全數清除
          </button>
        </div>
      </div>

      {/* Projects List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
              <tr>
                <th className="py-2.5 px-3">案別代碼</th>
                <th className="py-2.5 px-3 text-center">工程類型</th>
                <th className="py-2.5 px-3">地區 / 工務所</th>
                <th className="py-2.5 px-3 text-center">下架狀態</th>
                <th className="py-2.5 px-3">遴選日期</th>
                <th className="py-2.5 px-3 text-center">剩餘天數</th>
                <th className="py-2.5 px-3">開工日</th>
                <th className="py-2.5 px-3">使照日 F</th>
                <th className="py-2.5 px-3">標準釋出 (F+150)</th>
                <th className="py-2.5 px-3">交屋日</th>
                <th className="py-2.5 px-3">管委會成立日</th>
                <th className="py-2.5 px-3 text-right">總樓地板面積</th>
                <th className="py-2.5 px-3 text-center">地下/地上</th>
                <th className="py-2.5 px-3 text-center">棟/戶數</th>
                <th className="py-2.5 px-3">工法/規模</th>
                <th className="py-2.5 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-slate-400">
                    目前無開案計畫資料，請點選「批次貼入開案資料」或「新增開案計畫」以建立資料
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-blue-600">{p.projectCode}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                          (p.buildingCategory || getProjectBuildingCategory(p)) === '住宅'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : (p.buildingCategory || getProjectBuildingCategory(p)) === '廠辦'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : (p.buildingCategory || getProjectBuildingCategory(p)) === '商辦'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {p.buildingCategory || getProjectBuildingCategory(p)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{p.region}</div>
                      {p.department && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.department} {p.section || ''}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateProjectPlan(p.id, { isTakedownActive: !p.isTakedownActive })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          p.isTakedownActive
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="點擊直接切換下架啟動狀態"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.isTakedownActive ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        {p.isTakedownActive ? '下架啟動' : '正常運行'}
                      </button>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{p.selectionDate}</td>
                    <td className="py-2 px-3 text-center font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.remainingDays < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.remainingDays} 天
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{p.startWorkDate}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40 px-2 rounded">
                      {p.licenseFDate || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-indigo-700 font-semibold bg-indigo-50/40 px-2 rounded">
                      {p.standardReleaseDate || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {p.handoverDate ? (
                        <span className="text-slate-800 font-medium">{p.handoverDate}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">預估中 (可留空)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {p.committeeDate ? (
                        <span className="text-slate-800 font-medium">{p.committeeDate}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">預估中 (可留空)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {Number(p.totalFloorArea || 0).toLocaleString()} 坪
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">
                      {p.undergroundFloors} / {p.abovegroundFloors}
                    </td>
                    <td className="py-2 px-3 text-center font-mono">
                      {p.buildingsCount} 棟 / {p.unitsCount} 戶
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800">{p.scaleType}</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-slate-500">{p.specialMethod || '標準工法'}</span>
                          {p.hasLandscapeVip && (
                            <span className="px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                              景觀VIP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingProject(p);
                            setFormData(p);
                            setShowAddModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="編輯"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`確定要刪除開案計畫【${p.projectCode}】嗎？`)) {
                              deleteProjectPlan(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          1. GUIDED BATCH IMPORT MODAL (引導彈跳視窗及說明區塊)
         ======================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                    開案資料批次匯入精靈
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Upload className="w-5 h-5 text-blue-600" />
                  批次貼入開案計畫清冊資料
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  支援直接自 Excel / Google Sheets 框選資料欄位複製後貼上，並提供二次確認機制。
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Flow Indicator */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="p-2 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                <span className="block text-[10px] opacity-80">步驟 1</span>
                複製 Excel 資料
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs">
                <span className="block text-[10px] text-blue-600">步驟 2</span>
                貼入下方文字區
              </div>
              <div className="p-2 rounded-lg bg-slate-200/80 text-slate-700 font-medium text-xs">
                <span className="block text-[10px] text-slate-500">步驟 3</span>
                二次彈跳確認
              </div>
              <div className="p-2 rounded-lg bg-slate-200/80 text-slate-700 font-medium text-xs">
                <span className="block text-[10px] text-slate-500">步驟 4</span>
                完成寫入資料庫
              </div>
            </div>

            {/* Column Guide and Explanation Section */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  開案清冊欄位排列順序說明 (共 18 欄)：
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        已複製標頭
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        複製欄位標頭
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchRawText(SAMPLE_PROJECT_DATA)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px] transition-colors"
                  >
                    填入範例資料
                  </button>
                </div>
              </div>

              {/* Column definitions pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-[11px] font-mono">
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 1</span>
                  <strong>案別代碼</strong> (FG-TC01)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 2</span>
                  <strong>地區</strong> (新北市)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 3</span>
                  <strong>遴選日期</strong> (YYYY-MM-DD)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 4</span>
                  <strong>剩餘天數</strong> (150)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 5</span>
                  <strong>開工日期</strong> (YYYY-MM-DD)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 6</span>
                  <strong>建照日</strong> (YYYY-MM-DD)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 7</span>
                  <strong>總坪數</strong> (48500)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 8</span>
                  <strong>地下層</strong> (B4)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 9</span>
                  <strong>地上層</strong> (28F)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 10</span>
                  <strong>棟數</strong> (2)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 11</span>
                  <strong>戶數</strong> (198)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 12</span>
                  <strong>合建/都更</strong> (合建)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 13</span>
                  <strong>防綜案</strong> (防綜案)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 14</span>
                  <strong>危評案</strong> (無)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 15</span>
                  <strong>特殊工法</strong> (深開挖)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 16</span>
                  <strong>每坪銷價</strong> (85~95萬)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 17</span>
                  <strong>每坪造價</strong> (28~32萬)
                </div>
                <div className="p-1.5 bg-white rounded border border-blue-200/80 text-center">
                  <span className="text-[10px] text-blue-600 block">欄 18</span>
                  <strong>規模類型</strong> (大型住宅)
                </div>
              </div>
            </div>

            {/* Delimiter selector & Paste Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  貼入開案計畫清冊文字 (支援 Excel 直接複製貼上)：
                </label>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>分隔符號：</span>
                  <select
                    value={batchDelimiter}
                    onChange={(e) => setBatchDelimiter(e.target.value)}
                    className="p-1 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="auto">自動偵測 (Tab / 逗號 / 斜線)</option>
                    <option value="\t">Tab 分隔 (Excel 複製)</option>
                    <option value=",">逗號 (CSV)</option>
                    <option value="/">斜線 (/)</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={8}
                value={batchRawText}
                onChange={(e) => setBatchRawText(e.target.value)}
                placeholder={`請貼入自 Excel 複製之開案計畫清冊文字...
範例：
FG-TC01\t台中市西屯區\t2027-04-10\t265\t2027-08-15\t2027-05-20\t92450.0\t5\t29\t2\t320\t合建案\t防綜案\t危評案\t深開挖\t72.5\t34.0\t大型住宅\t住宅`}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
            </div>

            {batchParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{batchParseError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleParseAndOpenPreview}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-4 h-4" />
                解析並預覽確認 (下一步)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. SECONDARY PREVIEW & CONFIRMATION MODAL (匯入資料二次確認視窗)
         ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  步驟 3 / 4：資料確認與預覽檢視
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  確認開案計畫批次匯入內容
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  請確認以下解析出的 <strong className="text-blue-700 font-mono">{parsedPreviewList.length}</strong> 筆開案計畫資料無誤後，再執行寫入動作。
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">
                  預計新增/覆寫標案：<strong className="text-blue-600 font-mono text-sm">{parsedPreviewList.length}</strong> 筆
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  欄位結構解析正常
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                點選下方「確認無誤，執行匯入」後將同步更新系統
              </span>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl max-h-[400px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">案別代碼</th>
                    <th className="py-2.5 px-3">地區</th>
                    <th className="py-2.5 px-3">遴選日期</th>
                    <th className="py-2.5 px-3 text-center">剩餘天數</th>
                    <th className="py-2.5 px-3">預計開工日</th>
                    <th className="py-2.5 px-3 text-right">總坪數</th>
                    <th className="py-2.5 px-3 text-center">層數 (地下/地上)</th>
                    <th className="py-2.5 px-3 text-center">棟/戶數</th>
                    <th className="py-2.5 px-3">合建/都更</th>
                    <th className="py-2.5 px-3">特殊工法</th>
                    <th className="py-2.5 px-3">規模類型</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap text-slate-700">
                  {parsedPreviewList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{p.projectCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{p.region}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{p.selectionDate}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {p.remainingDays} 天
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{p.startWorkDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {Number(p.totalFloorArea || 0).toLocaleString()} 坪
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">
                        {p.undergroundFloors} / {p.abovegroundFloors}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {p.buildingsCount} 棟 / {p.unitsCount} 戶
                      </td>
                      <td className="py-2 px-3 text-slate-600">{p.jointOrUrbanRenewal}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px]">
                          {p.specialMethod || '無'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.scaleType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirm Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                返回修改文字
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowBatchModal(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  放棄匯入
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalImport}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確認無誤，執行匯入 ({parsedPreviewList.length} 筆)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. ADD / EDIT SINGLE PROJECT MODAL
         ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingProject ? `編輯開案計畫：${editingProject.projectCode}` : '新增開案計畫'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleProject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">案別代碼 *</label>
                  <input
                    type="text"
                    required
                    value={formData.projectCode || ''}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 FG-TC01"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">地區 *</label>
                  <input
                    type="text"
                    required
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 新北市板橋區"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">遴選日期 *</label>
                  <input
                    type="date"
                    required
                    value={formData.selectionDate || ''}
                    onChange={(e) => setFormData({ ...formData, selectionDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">預計開工日</label>
                  <input
                    type="date"
                    value={formData.startWorkDate || ''}
                    onChange={(e) => setFormData({ ...formData, startWorkDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">建照取得日</label>
                  <input
                    type="date"
                    value={formData.permitDate || ''}
                    onChange={(e) => setFormData({ ...formData, permitDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">總樓地板面積(坪)</label>
                  <input
                    type="number"
                    value={formData.totalFloorArea ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, totalFloorArea: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">地下層</label>
                  <input
                    type="text"
                    value={formData.undergroundFloors || ''}
                    onChange={(e) => setFormData({ ...formData, undergroundFloors: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 B4"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">地上層</label>
                  <input
                    type="text"
                    value={formData.abovegroundFloors || ''}
                    onChange={(e) => setFormData({ ...formData, abovegroundFloors: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 28F"
                  />
                </div>
              </div>

              {/* 新增：工程時程與釋出關鍵節點管制 (使用者要求欄位) */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>時程與釋出管制（使照 F / 標準釋出 F+150 / 交屋 / 管委會）</span>
                  </div>
                  {/* 下架啟動 Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11px] font-semibold text-slate-700">下架啟動：</span>
                    <input
                      type="checkbox"
                      checked={!!formData.isTakedownActive}
                      onChange={(e) => setFormData({ ...formData, isTakedownActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    <span className={`text-[10px] font-bold ${formData.isTakedownActive ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formData.isTakedownActive ? '已啟動下架' : '正常推進'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      使照日 F *
                    </label>
                    <input
                      type="date"
                      value={formData.licenseFDate || ''}
                      onChange={(e) => {
                        const newF = e.target.value;
                        const autoF150 = calculateFPlus150(newF);
                        setFormData({
                          ...formData,
                          licenseFDate: newF,
                          standardReleaseDate: formData.standardReleaseDate ? formData.standardReleaseDate : autoF150,
                        });
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">
                        標準釋出 (F+150)
                      </label>
                      {formData.licenseFDate && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              standardReleaseDate: calculateFPlus150(formData.licenseFDate || ''),
                            })
                          }
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          帶入+150
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.standardReleaseDate || ''}
                      onChange={(e) => setFormData({ ...formData, standardReleaseDate: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      交屋日 <span className="text-[10px] text-slate-400 font-normal">(預估可留空)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.handoverDate || ''}
                      onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      管委會成立日 <span className="text-[10px] text-slate-400 font-normal">(預估可留空)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.committeeDate || ''}
                      onChange={(e) => setFormData({ ...formData, committeeDate: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 人力預測設定關聯輔助欄位 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">所屬工務部門</label>
                  <select
                    value={formData.department || '工務一部'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="工務一部">工務一部</option>
                    <option value="工務二部">工務二部</option>
                    <option value="工務三部">工務三部</option>
                    <option value="新竹工務所">新竹工務所</option>
                    <option value="台中工務所">台中工務所</option>
                    <option value="台南工務所">台南工務所</option>
                    <option value="高雄工務所">高雄工務所</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">地下室面積 (坪)</label>
                  <input
                    type="number"
                    value={formData.basementArea ?? 0}
                    onChange={(e) => setFormData({ ...formData, basementArea: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="土建地下層除數試算"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-3 select-none">
                    <input
                      type="checkbox"
                      checked={!!formData.hasLandscapeVip}
                      onChange={(e) => setFormData({ ...formData, hasLandscapeVip: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="font-semibold text-slate-700 text-xs">
                      含景觀 / VIP公設
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 ml-6">有勾選才計入土建景觀試算</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    工程/建築類型 <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={formData.buildingCategory || getProjectBuildingCategory(formData as any)}
                    onChange={(e) => setFormData({ ...formData, buildingCategory: e.target.value as any })}
                    className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50/50 font-bold text-blue-900 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="住宅">住宅 (Residential)</option>
                    <option value="廠辦">廠辦 (Factory/Office)</option>
                    <option value="商辦">商辦 (Commercial/Office)</option>
                    <option value="專案">專案 (Special Project)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">規模類型</label>
                  <select
                    value={formData.scaleType || '中型住宅'}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      const inferred = st.includes('廠辦') ? '廠辦' : st.includes('商辦') ? '商辦' : '住宅';
                      setFormData({
                        ...formData,
                        scaleType: st,
                        buildingCategory: formData.buildingCategory || (inferred as any),
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="小型住宅">小型住宅</option>
                    <option value="中型住宅">中型住宅</option>
                    <option value="大型住宅">大型住宅</option>
                    <option value="超高層住宅">超高層住宅</option>
                    <option value="商辦大樓">商辦大樓</option>
                    <option value="廠辦科技">廠辦科技</option>
                    <option value="複合開發">複合開發</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">特殊工法</label>
                  <input
                    type="text"
                    value={formData.specialMethod || ''}
                    onChange={(e) => setFormData({ ...formData, specialMethod: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 深開挖、逆打"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">合建/都更</label>
                  <input
                    type="text"
                    value={formData.jointOrUrbanRenewal || ''}
                    onChange={(e) => setFormData({ ...formData, jointOrUrbanRenewal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="如 合建、都更、無"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  儲存開案計畫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
