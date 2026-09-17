import React, { useState, useRef, useEffect } from 'react';
import { CandidateProfile, ProjectPlan, ProjectExpDetail } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Swords,
  Award,
  Crown,
  CheckCircle2,
  Calendar,
  Building,
  Star,
  FileSpreadsheet,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronLeft,
  MoveHorizontal,
  Compass,
  Printer,
  Camera,
  Upload,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  Percent,
  FileDown,
  Loader2,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import { formatYears, formatDecimal, formatAge, calculateYearsDifference } from '../../utils/parser';
import {
  getCandidatePhoto,
  getCandidateProjectExperiences,
  getCandidateScores,
  formatExperienceRole,
} from '../../utils/candidatePkHelper';
import { A3PrintPdfController } from '../common/A3PrintPdfController';

interface CandidatePKModalProps {
  initialCandidates: CandidateProfile[];
  associatedProject?: ProjectPlan | null;
  onClose: () => void;
}

export const CandidatePKModal: React.FC<CandidatePKModalProps> = ({
  initialCandidates,
  associatedProject,
  onClose,
}) => {
  const { candidates, baseDate, updateCandidate } = useApp();

  // Selected candidates for comparison (max 5, default to 3 for primary A3 layout)
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateProfile[]>(() => {
    if (initialCandidates.length >= 3) return initialCandidates.slice(0, 5);
    if (initialCandidates.length > 0) {
      // If 1 or 2 candidates passed, supplement to 3 as requested ("以3人畫面為主要放置版型")
      const currentEmpNos = new Set(initialCandidates.map((c) => c.empNo));
      const needed = 3 - initialCandidates.length;
      const additional = candidates.filter((c) => !currentEmpNos.has(c.empNo)).slice(0, needed);
      return [...initialCandidates, ...additional];
    }
    // Default to 3 candidates: 林柏宏 (FG1002), 李俊毅 (FG1008) and a 3rd top candidate
    const cand1002 = candidates.find((c) => c.empNo === 'FG1002' || c.name === '林柏宏');
    const cand1008 = candidates.find((c) => c.empNo === 'FG1008' || c.name === '李俊毅');
    const defaultList: CandidateProfile[] = [];
    if (cand1002) defaultList.push(cand1002);
    if (cand1008) defaultList.push(cand1008);
    const existing = new Set(defaultList.map((c) => c.empNo));
    const third = candidates.find((c) => !existing.has(c.empNo));
    if (third) defaultList.push(third);
    if (defaultList.length >= 3) return defaultList;
    return candidates.slice(0, 3);
  });

  const [activeTab, setActiveTab] = useState<'4metrics' | 'stages' | 'all'>('4metrics');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | 'all'>('all');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [photoEditingEmpNo, setPhotoEditingEmpNo] = useState<string | null>(null);
  const [customPhotoInput, setCustomPhotoInput] = useState<string>('');

  // Horizontal drag-to-scroll and multi-candidate quick jump state
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Column and table width calculations optimized for A3 landscape (1584px fixed width) with 3-person primary layout
  const candidateColWidth = (() => {
    if (selectedCandidates.length === 3) {
      return selectedProjectIndex === 'all' ? 395 : 360;
    } else if (selectedCandidates.length === 2) {
      return selectedProjectIndex === 'all' ? 560 : 500;
    } else if (selectedCandidates.length === 1) {
      return 800;
    } else if (selectedCandidates.length === 4) {
      return 300;
    } else {
      return 255;
    }
  })();
  const leftColsWidth = 340; // Col 1 (100px) + Col 2 (110px) + Col 3 (130px)
  const totalTableMinWidth = leftColsWidth + selectedCandidates.length * candidateColWidth;

  const updateScrollInfo = () => {
    if (!tableScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollInfo();
    const timer = setTimeout(updateScrollInfo, 100);
    return () => clearTimeout(timer);
  }, [selectedCandidates.length, activeTab, selectedProjectIndex]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('select') ||
      target.closest('.no-drag')
    ) {
      return;
    }
    setIsDragging(true);
    if (tableScrollRef.current) {
      setStartX(e.pageX - tableScrollRef.current.offsetLeft);
      setScrollLeftState(tableScrollRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !tableScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableScrollRef.current.scrollLeft = scrollLeftState - walk;
    updateScrollInfo();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    updateScrollInfo();
  };

  const scrollByAmount = (amount: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollToCandidate = (index: number) => {
    if (!tableScrollRef.current) return;
    if (index === 0) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const targetLeft = leftColsWidth + index * candidateColWidth - 120;
      tableScrollRef.current.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadEmpNoRef = useRef<string | null>(null);

  const handleAddCandidate = (cand: CandidateProfile) => {
    if (!selectedCandidates.some((c) => c.empNo === cand.empNo)) {
      if (selectedCandidates.length >= 5) {
        alert('PK 評選作業同時最多比較 5 位人選');
        return;
      }
      setSelectedCandidates([...selectedCandidates, cand]);
    }
    setShowAddDropdown(false);
    setSearchFilter('');
  };

  const handleRemoveCandidate = (empNo: string) => {
    if (selectedCandidates.length <= 2) {
      alert('依據遴選作業規定：每次案場遴選作業都至少需要 2 人進行 PK，受評選名冊不可少於 2 位候選人');
      return;
    }
    setSelectedCandidates(selectedCandidates.filter((c) => c.empNo !== empNo));
  };

  // Photo uploading / replacing handler
  const handleTriggerUpload = (empNo: string) => {
    targetUploadEmpNoRef.current = empNo;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const empNo = targetUploadEmpNoRef.current;
    if (!file || !empNo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        if (updateCandidate) {
          updateCandidate(empNo, { photoUrl: base64Url });
        }
        setSelectedCandidates((prev) =>
          prev.map((c) => (c.empNo === empNo ? { ...c, photoUrl: base64Url } : c))
        );
      }
    };
    reader.readAsDataURL(file);
    setPhotoEditingEmpNo(null);
  };

  const handleSaveCustomPhotoUrl = (empNo: string) => {
    if (customPhotoInput.trim() !== '') {
      if (updateCandidate) {
        updateCandidate(empNo, { photoUrl: customPhotoInput.trim() });
      }
      setSelectedCandidates((prev) =>
        prev.map((c) => (c.empNo === empNo ? { ...c, photoUrl: customPhotoInput.trim() } : c))
      );
    }
    setPhotoEditingEmpNo(null);
    setCustomPhotoInput('');
  };

  const handleResetPhoto = (empNo: string) => {
    if (updateCandidate) {
      updateCandidate(empNo, { photoUrl: '' });
    }
    setSelectedCandidates((prev) =>
      prev.map((c) => (c.empNo === empNo ? { ...c, photoUrl: '' } : c))
    );
    setPhotoEditingEmpNo(null);
  };

  // Helper to get active project exp for a candidate
  const getActiveExp = (c: CandidateProfile, targetIdx: number | 'all'): ProjectExpDetail | null => {
    const exps = getCandidateProjectExperiences(c);
    if (targetIdx === 'all') return exps[0] || null;
    return exps[targetIdx] || null;
  };

  const stageKeys: Array<{
    key: 'preProject' | 'hypothesis' | 'foundation' | 'structure' | 'finishing' | 'landscape' | 'handover';
    label: string;
    description: string;
  }> = [
    { key: 'preProject', label: '案前管理', description: '規劃、圖面、預算審定' },
    { key: 'hypothesis', label: '假設階段', description: '臨時水電、圍籬安全' },
    { key: 'foundation', label: '基坑土方', description: '連續壁、深開挖、基樁' },
    { key: 'structure', label: '結構體', description: '鋼構/RC、柱樑灌漿' },
    { key: 'finishing', label: '裝修工程', description: '內裝、泥作、帷幕、機電' },
    { key: 'landscape', label: '景觀公設', description: '戶外景觀、門廳公設' },
    { key: 'handover', label: '驗收交屋', description: '使照取得、產權點交' },
  ];

  const maxStages = {
    preProject: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.preProject ?? 0)),
    hypothesis: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.hypothesis ?? 0)),
    foundation: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.foundation ?? 0)),
    structure: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.structure ?? 0)),
    finishing: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.finishing ?? 0)),
    landscape: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.landscape ?? 0)),
    handover: Math.max(...selectedCandidates.map((c) => c.sevenStagesYears?.handover ?? 0)),
  };

  // Candidates available to add
  const availableToAdd = candidates.filter(
    (c) =>
      !selectedCandidates.some((sc) => sc.empNo === c.empNo) &&
      (c.name?.includes(searchFilter) ||
        c.empNo?.includes(searchFilter) ||
        c.department?.includes(searchFilter))
  );

  // Compute ranking of candidates based on totalScore
  const sortedCandidatesByScore = [...selectedCandidates].sort((a, b) => {
    const scoreA = getCandidateScores(a).totalScore;
    const scoreB = getCandidateScores(b).totalScore;
    return scoreB - scoreA;
  });

  const getCandidateRank = (empNo: string): number => {
    const idx = sortedCandidatesByScore.findIndex((c) => c.empNo === empNo);
    return idx >= 0 ? idx + 1 : 99;
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return Number(val).toLocaleString('zh-TW');
  };

  // 歷練案場從左到右並列顯示輔助函式（預設前三案完整並列）
  const renderProjectCells = (
    c: CandidateProfile,
    renderFn: (exp: ProjectExpDetail | undefined, idx: number) => React.ReactNode
  ) => {
    if (selectedProjectIndex !== 'all') {
      const exp = getActiveExp(c, selectedProjectIndex);
      return renderFn(exp, typeof selectedProjectIndex === 'number' ? selectedProjectIndex : 0);
    }
    const exps = getCandidateProjectExperiences(c);
    return (
      <div className="grid grid-cols-3 gap-1 text-center font-mono">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="min-w-0">
            {renderFn(exps[idx], idx)}
          </div>
        ))}
      </div>
    );
  };

  const handleExportPK = () => {
    const exportData = selectedCandidates.map((c) => {
      const scores = getCandidateScores(c);
      const exps = getCandidateProjectExperiences(c);
      const exp1 = exps[0];
      const exp2 = exps[1];
      const exp3 = exps[2];

      return {
        人選類別: c.candidateCategory,
        提報人選: `${c.currentProjectCode || c.currentProject || ''} / ${c.name} (員編:${c.empNo} · 職稱:${c.title || '案主管'})`,
        工號: c.empNo,
        姓名: c.name,
        職稱: c.title || '案主管',
        現職案場科案: `${c.currentProjectCode || c.currentProject || ''} / ${c.name}`,
        可承接規模: c.acceptedScales?.join('、') || '大型、中型、小型',
        '工程經歷得分(50%)': scores.engineeringScore,
        '管理職能得分(25%)': scores.managementScore,
        '人格特質得分(25%)': scores.personalityScore,
        總分: scores.totalScore,
        經歷案場總數: exps.length,
        '前一案-案代號': exp1?.projectCode || '-',
        '前一案-自負盈虧淨利率(%)': exp1?.profitRate !== undefined ? `${exp1.profitRate}%` : '-',
        '前一案-使照總工期(天)': exp1?.licenseProgress.totalDays || '-',
        '前一案-使照超前落後(天)': exp1?.licenseProgress.diffDays || '-',
        '前一案-使照達成率(%)': exp1 ? `${exp1.licenseProgress.achievementRate}%` : '-',
        '前一案-交屋超前落後(天)': exp1?.handoverProgress.diffDays || '-',
        '前一案-交屋戶數': exp1?.handoverProgress.handoverUnits || '-',
        '前一案-品質監理全案平均': exp1?.qualitySupervisionScore || '-',
        '前一案-累計追加金額(元)': exp1?.totalAdditionAmount || '-',
        '前一案-累計追加率(%)': exp1 ? `${exp1.totalAdditionRate}%` : '-',
        '前一案-職安監理全案平均': exp1?.safetySupervisionScore || '-',
        '前一案-職安中心罰款(元)': exp1?.safetyFinesAmount || 0,
        '前一案-法律事件': exp1?.legalEvents || '-',
        '前二案-案代號': exp2?.projectCode || '(無)',
        '前二案-自負盈虧淨利率(%)': exp2?.profitRate !== undefined ? `${exp2.profitRate}%` : '-',
        '前二案-使照總工期(天)': exp2?.licenseProgress.totalDays || '-',
        '前二案-使照超前落後(天)': exp2?.licenseProgress.diffDays || '-',
        '前三案-案代號': exp3?.projectCode || '(無)',
        '前三案-自負盈虧淨利率(%)': exp3?.profitRate !== undefined ? `${exp3.profitRate}%` : '-',
        '前三案-使照總工期(天)': exp3?.licenseProgress.totalDays || '-',
      };
    });

    exportToExcel(
      exportData,
      `遠雄營造_案主管候選人PK評選報告(4大專案指標)_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('candidate-pk-export-container', {
        filename: `遠雄營造_案主管PK評選決策報告_A3橫式_${new Date().toISOString().slice(0, 10)}`,
        title: '遠雄營造 案主管候選人評選 PK 決策總表 (A3 橫式)',
        subtitle: `受評選名單 (${selectedCandidates.length}人)：${selectedCandidates.map((c) => `${c.name} (${c.empNo})`).join('、')} · 基準日：${baseDate} · ${associatedProject ? `擬派目標：${associatedProject.projectCode} · ` : ''}${activeTab === '4metrics' ? '4大專案指標 PK 總表' : '七大階段年資對比'}`,
        landscape: true,
        paperSize: 'a3',
        fixedWidth: 1584,
      });
    } catch (err) {
      console.error('Candidate PK PDF export error:', err);
      alert('A3 PDF 匯出失敗，請稍後再試。');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[1550px] max-h-[96vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0f2d59] to-[#1e3a8a] text-white p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  案主管候選人 PK 評選決策戰情室
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                  {selectedCandidates.length} 位主管並列評估
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-400/20 text-blue-200 border border-blue-400/30">
                  4大專案指標 × 前三案實績歷練
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  資料基準日：<strong className="text-white font-mono">{baseDate}</strong>
                </span>
                <span>·</span>
                <span className="text-amber-200">
                  依照人員經歷前三案資料（若尚未到三案歷練，則全數列出）
                </span>
                {associatedProject && (
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold ml-1">
                    <Building className="w-3.5 h-3.5" />
                    擬派任目標案場：{associatedProject.projectCode} ({associatedProject.region} · {associatedProject.scaleType})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/20 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('4metrics')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === '4metrics'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                4大專案指標 PK 總表
              </button>
              <button
                onClick={() => setActiveTab('stages')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'stages'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                七大階段年資對比
              </button>
            </div>

            {/* Dedicated A3 Print & PDF Export Controller */}
            <A3PrintPdfController
              targetElementId="candidate-pk-export-container"
              documentTitle="遠雄營造 案主管候選人評選 PK 決策總表 (A3 橫式 3人版型)"
              subtitle={`受評選名單 (${selectedCandidates.length}人)：${selectedCandidates.map((c) => `${c.name} (${c.empNo})`).join('、')} · 基準日：${baseDate} · ${associatedProject ? `擬派目標：${associatedProject.projectCode} · ` : ''}${activeTab === '4metrics' ? '4大專案指標 PK 總表' : '七大階段年資對比'}`}
              baseDate={baseDate}
              buttonLabel="匯出PDF"
              variant="amber"
            />

            <button
              onClick={handleExportPK}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">匯出 Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls / Candidate Selector & Project Exp Filter Bar */}
        <div className="p-3 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">受評選候選人：</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              遴選規定：每次案場遴選作業至少需 2 人進行 PK ({selectedCandidates.length} 位受評選)
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedCandidates.map((c, idx) => (
                <span
                  key={c.empNo}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs font-medium"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({c.empNo})</span>
                  <button
                    onClick={() => handleRemoveCandidate(c.empNo)}
                    className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="移出此人選"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project Experience Slicer when in 4metrics tab */}
            {activeTab === '4metrics' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  歷練案場顯示模式：
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedProjectIndex('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedProjectIndex === 'all'
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="預設前三案完整資訊（從左到右並列顯示，若未達三案則全數列出）"
                  >
                    <Layers className="w-3 h-3" />
                    前三案完整並列 (預設)
                  </button>
                  <button
                    onClick={() => setSelectedProjectIndex(0)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedProjectIndex === 0
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                    僅看前一案
                  </button>
                  <button
                    onClick={() => setSelectedProjectIndex(1)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedProjectIndex === 1
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    僅看前二案
                  </button>
                  <button
                    onClick={() => setSelectedProjectIndex(2)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedProjectIndex === 2
                        ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                    僅看前三案
                  </button>
                </div>
              </div>
            )}

            {/* Add Candidate Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                disabled={selectedCandidates.length >= 5}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                加入人選 PK ({selectedCandidates.length}/5)
              </button>

              {showAddDropdown && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-slate-800">搜尋加入人選</span>
                    <button
                      onClick={() => setShowAddDropdown(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="搜尋姓名 / 員編 / 部室..."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 mb-2"
                    autoFocus
                  />

                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {availableToAdd.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">無可加入之人選</div>
                    ) : (
                      availableToAdd.map((cand) => (
                        <button
                          key={cand.empNo}
                          onClick={() => handleAddCandidate(cand)}
                          className="w-full text-left p-2 hover:bg-blue-50 rounded-lg text-xs flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700">
                              {cand.name} ({cand.empNo})
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cand.department} · {cand.title} · 職等 {cand.rank}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Main Scroll Area */}
        <div id="candidate-pk-export-container" className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 bg-slate-50/50">
          {/* A3 PDF Report Header Banner (Preserved in PDF Export) */}
          <div
            data-pdf-block="true"
            className="p-4 bg-gradient-to-r from-slate-900 via-[#102a54] to-[#1e3a8a] text-white rounded-xl border border-slate-700 flex items-center justify-between shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                  A3 橫式決策報告
                </span>
                <h1 className="text-base font-black tracking-tight text-white">
                  遠雄營造 案主管候選人評選 PK 決策總表
                </h1>
                <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  以3人畫面為主要放置版型
                </span>
              </div>
              <p className="text-xs text-slate-300">
                評估模式：{activeTab === '4metrics' ? '4大專案指標 × 前三案完工實績歷練' : '工程七大階段實務歷練年資'} · 資料基準日：{baseDate}
                {associatedProject && ` · 擬派任目標案場：${associatedProject.projectCode} (${associatedProject.region} · ${associatedProject.scaleType})`}
              </p>
            </div>
            <div className="text-right text-xs text-slate-300">
              <div className="font-bold text-white">
                受評選人選：{selectedCandidates.map((c) => `${c.name} (${c.empNo})`).join('、')}
              </div>
              <div className="text-[11px] text-amber-300 mt-0.5">
                完整跨頁保護 · A3 橫向最佳化 (420mm × 297mm)
              </div>
            </div>
          </div>

          {/* TAB 1: 4大專案指標 PK 總表 (100% 精確復刻使用者附圖) */}
          {activeTab === '4metrics' && (
            <div className="space-y-4">
              {/* 橫向滑動導覽列與多位主管快速定位列 (特別優化 4~5 人 PK 橫向檢視體驗，列印/PDF匯出時隱藏) */}
              <div
                data-html2canvas-ignore="true"
                className="no-print print-hide hidden-for-pdf bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-blue-800"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-blue-200 font-bold text-xs">
                    <MoveHorizontal className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>人選左右滑動定位：</span>
                  </div>

                  {/* Left / Right scroll buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollByAmount(-350)}
                      disabled={!canScrollLeft}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        canScrollLeft
                          ? 'bg-white/10 hover:bg-white text-white hover:text-slate-900 border-white/30 cursor-pointer shadow-xs'
                          : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed opacity-50'
                      }`}
                      title="向左滾動看前面人選"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>向左</span>
                    </button>

                    <button
                      onClick={() => scrollByAmount(350)}
                      disabled={!canScrollRight}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        canScrollRight
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 cursor-pointer shadow-md'
                          : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed opacity-50'
                      }`}
                      title="向右滾動看後面人選"
                    >
                      <span>向右 (看第 {selectedCandidates.length} 位)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Candidate Quick Jump Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap ml-1">
                    <span className="text-[11px] text-blue-300 font-medium hidden md:inline">直達人選：</span>
                    {selectedCandidates.map((c, idx) => (
                      <button
                        key={c.empNo}
                        onClick={() => scrollToCandidate(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          idx === selectedCandidates.length - 1 && selectedCandidates.length >= 4
                            ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                            : 'bg-white/15 text-white hover:bg-white hover:text-slate-900 border-white/20'
                        }`}
                        title={`點擊立即聚焦捲動至第 ${idx + 1} 位主管【${c.name}】`}
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-950/40 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span>{c.name}</span>
                        {idx === selectedCandidates.length - 1 && selectedCandidates.length >= 4 && (
                          <span className="text-[9px] bg-slate-900 text-amber-300 px-1 rounded font-bold">第{idx + 1}人</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/15 text-blue-100 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    可直接按住滑鼠拖曳表格，或按 Shift+滾輪橫向滑動
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <div
                  ref={tableScrollRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onScroll={updateScrollInfo}
                  className={`${
                    isExportingPdf ? 'overflow-visible max-h-none' : 'overflow-auto max-h-[75vh] md:max-h-[78vh]'
                  } transition-colors scrollbar-thin scrollbar-thumb-blue-400/80 scrollbar-track-slate-100 ${
                    isDragging ? 'select-none cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <table
                    className="w-full text-xs text-left border-separate border-spacing-0 border border-slate-400"
                    style={{ minWidth: `${totalTableMinWidth}px` }}
                  >
                    <colgroup>
                      <col style={{ width: '100px', minWidth: '100px' }} />
                      <col style={{ width: '110px', minWidth: '110px' }} />
                      <col style={{ width: '130px', minWidth: '130px' }} />
                      {selectedCandidates.map((c) => (
                        <col
                          key={c.empNo}
                          style={{
                            width: `${candidateColWidth}px`,
                            minWidth: `${candidateColWidth}px`,
                          }}
                        />
                      ))}
                    </colgroup>

                    <tbody>
                      {/* ① 人選類別 (深藍底白字) - 固定置頂與左側標題 */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky top-0 left-0 z-40 py-2.5 px-3 font-extrabold text-white text-center bg-[#102a54] tracking-wide border-b border-r border-slate-500 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)] h-[42px]"
                        >
                          人選類別
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            style={{
                              width: `${candidateColWidth}px`,
                              minWidth: `${candidateColWidth}px`,
                            }}
                            className="sticky top-0 z-30 py-2.5 px-3 font-extrabold text-white text-center bg-[#102a54] text-sm tracking-wide border-b border-l border-slate-500 h-[42px]"
                          >
                            {c.candidateCategory || '現任主管'}
                          </td>
                        ))}
                      </tr>

                      {/* ② 提報人選 (深藍底白字，加註員工編號及職稱) - 固定置頂第二行與左側標題 */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky top-[42px] left-0 z-40 py-3 px-3 font-extrabold text-white text-center bg-[#1e3a8a] tracking-wide border-b border-r border-slate-500 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)]"
                        >
                          提報人選
                        </td>
                        {selectedCandidates.map((c) => {
                          const projCode = c.currentProjectCode || c.currentProject || '專案';
                          return (
                            <td
                              key={c.empNo}
                              style={{
                                width: `${candidateColWidth}px`,
                                minWidth: `${candidateColWidth}px`,
                              }}
                              className="sticky top-[42px] z-30 py-2.5 px-3 text-white text-center border-b border-l border-slate-500 bg-[#1e3a8a]"
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <div className="text-sm sm:text-base font-black tracking-wide text-white">
                                  {projCode} / {c.name}
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap">
                                  <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded font-mono text-[11px] font-semibold border border-white/25 text-blue-50">
                                    <span className="text-blue-200">工號</span>
                                    <span className="font-bold">{c.empNo}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-300/30">
                                    <span className="text-amber-300">職稱</span>
                                    <span className="font-bold text-white">{c.title || '案主管'}</span>
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ③ 照片 (支援大頭照展示與放置/上傳照片) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-6 px-3 font-bold text-slate-700 text-center bg-slate-50 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
                            <Camera className="w-5 h-5 text-blue-600" />
                            <span className="font-extrabold text-sm">照片</span>
                            <span className="text-[10px] text-slate-400">大頭照可點選更換</span>
                          </div>
                        </td>
                        {selectedCandidates.map((c) => {
                          const photo = getCandidatePhoto(c);
                          const isEditingThis = photoEditingEmpNo === c.empNo;
                          return (
                            <td
                              key={c.empNo}
                              style={{
                                width: `${candidateColWidth}px`,
                                minWidth: `${candidateColWidth}px`,
                              }}
                              className="py-4 px-4 text-center border-l border-b border-slate-300 align-middle bg-white"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                {/* Photo Frame */}
                                <div className="relative group w-32 h-40 sm:w-36 sm:h-44 rounded-md overflow-hidden shadow-md bg-slate-100 flex items-center justify-center transition-transform hover:scale-[1.02] border-2 border-slate-300">
                                  <img
                                    src={photo}
                                    alt={c.name}
                                    className="w-full h-full object-cover object-center"
                                    referrerPolicy="no-referrer"
                                  />

                                  {/* Hover Action Overlay */}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                                    <button
                                      onClick={() => handleTriggerUpload(c.empNo)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1"
                                      title="從本機上傳大頭照"
                                    >
                                      <Upload className="w-3 h-3" />
                                      上傳照片
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPhotoEditingEmpNo(c.empNo);
                                        setCustomPhotoInput(c.photoUrl || '');
                                      }}
                                      className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px]"
                                    >
                                      網址 / 重設
                                    </button>
                                  </div>
                                </div>

                                {/* Photo Change Bar */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleTriggerUpload(c.empNo)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors shadow-2xs"
                                  >
                                    <Camera className="w-3 h-3 text-blue-600" />
                                    <span>更換照片</span>
                                  </button>
                                  {c.photoUrl && (
                                    <button
                                      onClick={() => handleResetPhoto(c.empNo)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                      title="恢復預設照片"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Custom URL Popover */}
                                {isEditingThis && (
                                  <div className="w-full max-w-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-left shadow-lg space-y-1.5 text-xs animate-in fade-in">
                                    <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                                      <span>自訂照片圖片網址</span>
                                      <button
                                        onClick={() => setPhotoEditingEmpNo(null)}
                                        className="text-slate-400 hover:text-slate-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={customPhotoInput}
                                      onChange={(e) => setCustomPhotoInput(e.target.value)}
                                      placeholder="https://... 或點上方上傳"
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                    />
                                    <div className="flex items-center justify-end gap-1.5 pt-1">
                                      <button
                                        onClick={() => setPhotoEditingEmpNo(null)}
                                        className="px-2 py-0.5 text-[10px] text-slate-600 bg-slate-200 rounded"
                                      >
                                        取消
                                      </button>
                                      <button
                                        onClick={() => handleSaveCustomPhotoUrl(c.empNo)}
                                        className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded shadow-xs"
                                      >
                                        儲存網址
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ④ 可承接規模 (■大型、■中型、■小型) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 font-extrabold text-slate-800 text-center bg-slate-50 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          可承接規模
                        </td>
                        {selectedCandidates.map((c) => {
                          const accepted = c.acceptedScales || ['大型案', '中型案', '小型案'];
                          const hasLarge = accepted.some((s) => s.includes('大型'));
                          const hasMed = accepted.some((s) => s.includes('中型'));
                          const hasSmall = accepted.some((s) => s.includes('小型'));

                          return (
                            <td
                              key={c.empNo}
                              style={{
                                width: `${candidateColWidth}px`,
                                minWidth: `${candidateColWidth}px`,
                              }}
                              className="py-2.5 px-4 text-center bg-white border-l border-b border-slate-300 whitespace-nowrap"
                            >
                              <div className="flex items-center justify-center gap-3 font-semibold text-slate-800">
                                <span className="inline-flex items-center gap-1">
                                  {hasLarge ? (
                                    <span className="w-3 h-3 bg-slate-900 rounded-xs inline-block" />
                                  ) : (
                                    <span className="w-3 h-3 border border-slate-400 rounded-xs inline-block" />
                                  )}
                                  <span>大型</span>
                                </span>
                                <span>、</span>
                                <span className="inline-flex items-center gap-1">
                                  {hasMed ? (
                                    <span className="w-3 h-3 bg-slate-900 rounded-xs inline-block" />
                                  ) : (
                                    <span className="w-3 h-3 border border-slate-400 rounded-xs inline-block" />
                                  )}
                                  <span>中型</span>
                                </span>
                                <span>、</span>
                                <span className="inline-flex items-center gap-1">
                                  {hasSmall ? (
                                    <span className="w-3 h-3 bg-slate-900 rounded-xs inline-block" />
                                  ) : (
                                    <span className="w-3 h-3 border border-slate-400 rounded-xs inline-block" />
                                  )}
                                  <span>小型</span>
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑤ 工程經歷 (50%) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 font-extrabold text-slate-800 text-center bg-slate-50 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          工程經歷(50%)
                        </td>
                        {selectedCandidates.map((c) => {
                          const scores = getCandidateScores(c);
                          return (
                            <td
                              key={c.empNo}
                              className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 text-sm bg-white border-l border-b border-slate-300"
                            >
                              {scores.engineeringScore.toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑥ 管理職能 (25%) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 font-extrabold text-slate-800 text-center bg-slate-50 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          管理職能(25%)
                        </td>
                        {selectedCandidates.map((c) => {
                          const scores = getCandidateScores(c);
                          return (
                            <td
                              key={c.empNo}
                              className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 text-sm bg-white border-l border-b border-slate-300"
                            >
                              {scores.managementScore.toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑦ 人格特質 (25%) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 font-extrabold text-slate-800 text-center bg-slate-50 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          人格特質(25%)
                        </td>
                        {selectedCandidates.map((c) => {
                          const scores = getCandidateScores(c);
                          return (
                            <td
                              key={c.empNo}
                              className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 text-sm bg-white border-l border-b border-slate-300"
                            >
                              {scores.personalityScore.toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑧ 總分 (紅底白字醒目呈現) */}
                      <tr className="border-b-2 border-slate-400 bg-[#a81c1c] text-white">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-3 px-3 font-black text-center text-sm tracking-wider bg-[#a81c1c] text-white border-r-2 border-rose-900 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.18)]"
                        >
                          總分
                        </td>
                        {selectedCandidates.map((c) => {
                          const scores = getCandidateScores(c);
                          return (
                            <td
                              key={c.empNo}
                              style={{
                                width: `${candidateColWidth}px`,
                                minWidth: `${candidateColWidth}px`,
                              }}
                              className="py-3 px-4 text-center font-mono font-black border-l border-b border-rose-800 bg-[#a81c1c]"
                            >
                              <div className="flex items-center justify-center">
                                <span className="text-xl tracking-wider">{scores.totalScore.toFixed(1)}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑨ 綜合評比 (4大專案指標) 橫幅 */}
                      <tr className="border-b border-slate-400 bg-[#102a54] text-white">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 font-extrabold text-center tracking-wide bg-[#102a54] text-white border-r-2 border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)]"
                        >
                          綜合評比(4大專案指標)
                        </td>
                        {selectedCandidates.map((c) => {
                          const exps = getCandidateProjectExperiences(c);
                          if (selectedProjectIndex !== 'all') {
                            const exp = getActiveExp(c, selectedProjectIndex);
                            return (
                              <td
                                key={c.empNo}
                                style={{
                                  width: `${candidateColWidth}px`,
                                  minWidth: `${candidateColWidth}px`,
                                }}
                                className="py-2.5 px-4 font-black text-center text-sm tracking-wide border-l border-b border-slate-500 bg-[#102a54]"
                              >
                                {exp ? `${exp.projectCode} (${exp.orderLabel})` : '未達此案歷練'}
                              </td>
                            );
                          }
                          return (
                            <td
                              key={c.empNo}
                              style={{
                                width: `${candidateColWidth}px`,
                                minWidth: `${candidateColWidth}px`,
                              }}
                              className="py-2 px-2 text-center border-l border-b border-slate-500 bg-[#102a54]"
                            >
                              <div className="grid grid-cols-3 gap-1 text-center">
                                {[0, 1, 2].map((idx) => {
                                  const exp = exps[idx];
                                  const label = idx === 0 ? '前一案' : idx === 1 ? '前二案' : '前三案';
                                  return (
                                    <div
                                      key={idx}
                                      className="p-1 rounded bg-slate-800/80 border border-slate-600/70 text-left sm:text-center"
                                    >
                                      <div className="text-[10px] text-blue-200 font-semibold">{label}</div>
                                      <div className="font-mono font-black text-white text-xs truncate">
                                        {exp ? exp.projectCode : '-'}
                                      </div>
                                      {exp && (
                                        <div className="text-[9px] text-slate-300 truncate">
                                          {exp.scaleType}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑨.1 自負盈虧淨利率 (4大指標前置指標：前三案自負盈虧) */}
                      <tr className="border-b-2 border-slate-300 bg-slate-50/80">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-2.5 px-3 text-center bg-slate-100 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              <span>自負盈虧淨利率</span>
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold">
                              (前三案歷練完工淨利率)
                            </div>
                          </div>
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            style={{
                              width: `${candidateColWidth}px`,
                              minWidth: `${candidateColWidth}px`,
                            }}
                            className="py-2.5 px-2 text-center border-l border-b border-slate-300 bg-white"
                          >
                            {renderProjectCells(c, (exp) => {
                              if (!exp) {
                                return (
                                  <div className="py-1.5 px-1 bg-slate-50 rounded text-slate-400 text-xs font-mono">
                                    -
                                  </div>
                                );
                              }
                              const rate = exp.profitRate;
                              if (rate === undefined || rate === null) {
                                return (
                                  <div className="py-1.5 px-1 bg-slate-50 rounded text-slate-400 text-xs font-mono">
                                    -
                                  </div>
                                );
                              }
                              const isHighProfit = rate >= 5.0;
                              const isNegative = rate < 0;
                              return (
                                <div
                                  className={`py-1 px-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all ${
                                    isNegative
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                                      : isHighProfit
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                                  }`}
                                  title={`自負盈虧淨利率：${rate > 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`} (${isHighProfit ? '達標 5%↑' : isNegative ? '虧損負值' : '未達 5%'})`}
                                >
                                  <span>{rate > 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`}</span>
                                  {isHighProfit && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white font-black leading-none shadow-2xs" title="淨利率 5% 以上">
                                      5%↑
                                    </span>
                                  )}
                                  {isNegative && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-600 text-white font-black leading-none shadow-2xs" title="負值虧損">
                                      負
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        ))}
                      </tr>

                      {/* ⑩ 綜合評比 - 工程進度 - 使照進度 (F) */}
                      {/* 10.1 總工期(天) */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={7}
                          className="sticky left-0 z-20 py-3 px-2 font-extrabold text-center bg-sky-50 text-sky-950 border-r border-b border-slate-300"
                        >
                          <div className="flex flex-col items-center justify-center font-bold text-sm">
                            <span>工</span>
                            <span>程</span>
                            <span>進</span>
                            <span>度</span>
                          </div>
                        </td>
                        <td
                          rowSpan={3}
                          className="sticky left-[100px] z-20 py-2 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300"
                        >
                          使照進度<br />(F)
                        </td>
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          總工期(天)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold text-slate-900 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp?.licenseProgress.totalDays ?? '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 10.2 超前/落後(天) */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          超前/落後(天)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => {
                              if (!exp) return <div className="py-1 px-1 bg-slate-50 rounded text-slate-400 text-xs">-</div>;
                              const diff = exp.licenseProgress.diffDays;
                              const isLag = diff < 0;
                              return (
                                <div
                                  className={`py-1 px-1 bg-slate-50 rounded text-xs ${
                                    isLag ? 'text-rose-600' : 'text-blue-700'
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff}
                                </div>
                              );
                            })}
                          </td>
                        ))}
                      </tr>

                      {/* 10.3 達成率(%) */}
                      <tr className="border-b border-slate-300">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          達成率(%)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold text-slate-900 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp ? `${exp.licenseProgress.achievementRate.toFixed(2)}%` : '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* ⑪ 交屋達90%進度 (F+165天) */}
                      {/* 11.1 目標 */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={4}
                          className="sticky left-[100px] z-20 py-2 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300"
                        >
                          交屋達<br />90%進度<br />(F+165天)
                        </td>
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          目標
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-medium text-slate-800 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-[11px] truncate">
                                {exp?.handoverProgress.targetDate || '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 11.2 實際 */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          實際
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-medium text-slate-800 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-[11px] truncate">
                                {exp?.handoverProgress.actualDate || '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 11.3 超前/落後(天) */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          超前/落後(天)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => {
                              if (!exp) return <div className="py-1 px-1 bg-slate-50 rounded text-slate-400 text-xs">-</div>;
                              const diff = exp.handoverProgress.diffDays;
                              const isLag = diff < 0;
                              return (
                                <div
                                  className={`py-1 px-1 bg-slate-50 rounded text-xs ${
                                    isLag ? 'text-rose-600' : 'text-blue-700'
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff}
                                </div>
                              );
                            })}
                          </td>
                        ))}
                      </tr>

                      {/* 11.4 交屋戶數(戶) */}
                      <tr className="border-b border-slate-300">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          交屋戶數(戶)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-semibold text-slate-900 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-[11px] truncate">
                                {exp?.handoverProgress.handoverUnits || '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* ⑫ 綜合評比 - 品質 */}
                      {/* 12.1 品質監理 全案平均(分) */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={5}
                          className="sticky left-0 z-20 py-3 px-2 font-extrabold text-center bg-amber-50 text-amber-950 border-r border-b border-slate-300"
                        >
                          <div className="flex flex-col items-center justify-center font-bold text-sm">
                            <span>品</span>
                            <span>質</span>
                          </div>
                        </td>
                        <td className="sticky left-[100px] z-20 py-2.5 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300">
                          品質監理
                        </td>
                        <td className="sticky left-[210px] z-20 py-2.5 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          全案平均(分)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2.5 px-2 text-center font-mono font-bold text-blue-900 text-sm border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp ? exp.qualitySupervisionScore.toFixed(1) : '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 12.2 客訴率(%) - 年度 */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={4}
                          className="sticky left-[100px] z-20 py-2 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300"
                        >
                          客訴率<br />(%)
                        </td>
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          年度
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.complaintRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] font-bold text-slate-800">
                                {rates.map((r, i) => (
                                  <div key={i} className="py-0.5 bg-slate-100 rounded">
                                    {r.year}
                                  </div>
                                ))}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 12.3 客訴率 - 目標 */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          目標
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.complaintRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] text-slate-700">
                                {rates.map((r, i) => (
                                  <div key={i} className="py-0.5">
                                    {r.target.toFixed(2)}%
                                  </div>
                                ))}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 12.4 客訴率 - 實際 */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          實際
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.complaintRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] font-bold">
                                {rates.map((r, i) => {
                                  const isOver = r.actual > r.target;
                                  return (
                                    <div
                                      key={i}
                                      className={`py-0.5 ${isOver ? 'text-rose-600' : 'text-slate-800'}`}
                                    >
                                      {r.actual.toFixed(2)}%
                                    </div>
                                  );
                                })}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 12.5 客訴率 - 客訴件數(件) */}
                      <tr className="border-b border-slate-300">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          客訴件數(件)
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.complaintRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] text-slate-600">
                                {rates.map((r, i) => (
                                  <div key={i} className="py-0.5">
                                    {r.detailCount || '-'}
                                  </div>
                                ))}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* ⑬ 綜合評比 - 成本 */}
                      {/* 13.1 營造追加率(%) 年度 */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={5}
                          className="sticky left-0 z-20 py-3 px-2 font-extrabold text-center bg-emerald-50 text-emerald-950 border-r border-b border-slate-300"
                        >
                          <div className="flex flex-col items-center justify-center font-bold text-sm">
                            <span>成</span>
                            <span>本</span>
                          </div>
                        </td>
                        <td
                          rowSpan={3}
                          className="sticky left-[100px] z-20 py-2 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300"
                        >
                          營造<br />追加率(%)
                        </td>
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          年度
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.costAdditionRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] font-bold text-slate-800">
                                {rates.map((r, i) => (
                                  <div key={i} className="py-0.5 bg-slate-100 rounded">
                                    {r.year}
                                  </div>
                                ))}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 13.2 營造追加率 - 目標 */}
                      <tr className="border-b border-slate-200">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          目標
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.costAdditionRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] text-slate-700">
                                {rates.map((r, i) => (
                                  <div key={i} className="py-0.5">
                                    {r.target.toFixed(2)}%
                                  </div>
                                ))}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 13.3 營造追加率 - 實際 (超標紅字) */}
                      <tr className="border-b border-slate-300">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          實際
                        </td>
                        {selectedCandidates.map((c) => {
                          const exp = getActiveExp(c, selectedProjectIndex);
                          const rates = exp?.costAdditionRates || [];
                          return (
                            <td key={c.empNo} className="py-1 px-2 border-l border-b border-slate-300">
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] font-bold">
                                {rates.map((r, i) => {
                                  const isOver = r.actual > r.target;
                                  return (
                                    <div
                                      key={i}
                                      className={`py-0.5 ${isOver ? 'text-rose-600' : 'text-slate-800'}`}
                                    >
                                      {r.actual.toFixed(2)}%
                                    </div>
                                  );
                                })}
                                {rates.length === 0 && <div className="col-span-3 text-slate-400">-</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 13.4 全案累計追加金額(元) */}
                      <tr className="border-b border-slate-200">
                        <td
                          colSpan={2}
                          className="sticky left-[100px] z-20 py-2.5 px-3 font-bold text-center bg-slate-50 border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          全案累計追加金額(元)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2.5 px-2 text-center font-mono font-bold text-slate-900 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs truncate">
                                {exp ? formatCurrency(exp.totalAdditionAmount) : '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 13.5 全案累計追加率(%) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={2}
                          className="sticky left-[100px] z-20 py-2.5 px-3 font-bold text-center bg-slate-50 border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          全案累計追加率(%)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2.5 px-2 text-center font-mono font-bold text-slate-900 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp ? `${exp.totalAdditionRate.toFixed(2)}%` : '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* ⑭ 綜合評比 - 職安 */}
                      {/* 14.1 職安監理 全案平均(分) */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={3}
                          className="sticky left-0 z-20 py-3 px-2 font-extrabold text-center bg-purple-50 text-purple-950 border-r border-b border-slate-300"
                        >
                          <div className="flex flex-col items-center justify-center font-bold text-sm">
                            <span>職</span>
                            <span>安</span>
                          </div>
                        </td>
                        <td className="sticky left-[100px] z-20 py-2.5 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300">
                          職安監理
                        </td>
                        <td className="sticky left-[210px] z-20 py-2.5 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          全案平均(分)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2.5 px-2 text-center font-mono font-bold text-blue-900 text-sm border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp ? exp.safetySupervisionScore.toFixed(1) : '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 14.2 職安中心違規處罰 - 停工(次) */}
                      <tr className="border-b border-slate-200">
                        <td
                          rowSpan={2}
                          className="sticky left-[100px] z-20 py-2 px-2 font-bold text-center bg-slate-50 border-r border-b border-slate-300"
                        >
                          職安中心<br />違規處罰
                        </td>
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          停工(次)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => (
                              <div className="py-1 px-1 bg-slate-50 rounded text-xs">
                                {exp?.safetySuspensionsCount ?? '-'}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>

                      {/* 14.3 職安中心違規處罰 - 罰款(元) */}
                      <tr className="border-b border-slate-300">
                        <td className="sticky left-[210px] z-20 py-2 px-2 text-center font-medium text-slate-700 bg-white border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          罰款(元)
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-2 px-2 text-center font-mono font-bold border-l border-b border-slate-300"
                          >
                            {renderProjectCells(c, (exp) => {
                              if (!exp) return <div className="py-1 px-1 bg-slate-50 rounded text-slate-400 text-xs">-</div>;
                              const fines = exp.safetyFinesAmount ?? 0;
                              return (
                                <div
                                  className={`py-1 px-1 bg-slate-50 rounded text-xs ${
                                    fines > 0 ? 'text-rose-600' : 'text-slate-800'
                                  }`}
                                >
                                  {fines > 0 ? formatCurrency(fines) : '-'}
                                </div>
                              );
                            })}
                          </td>
                        ))}
                      </tr>

                      {/* ⑮ 綜合評比 - 法律事件 (詳細法規訴訟內容) */}
                      <tr className="border-b border-slate-300">
                        <td
                          colSpan={3}
                          className="sticky left-0 z-20 py-6 px-3 font-extrabold text-center bg-slate-100 text-slate-800 border-r-2 border-b border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                        >
                          法律事件
                        </td>
                        {selectedCandidates.map((c) => (
                          <td
                            key={c.empNo}
                            className="py-3 px-2 text-left font-sans text-xs text-slate-700 bg-white border-l border-b border-slate-300 align-top leading-relaxed"
                          >
                            {renderProjectCells(c, (exp) => {
                              if (!exp) return <div className="p-1.5 bg-slate-50 rounded text-slate-400 text-center">-</div>;
                              return (
                                <div className="p-2 bg-slate-50 rounded border border-slate-200 leading-relaxed whitespace-pre-line text-[11px]">
                                  <div className="font-bold text-slate-900 mb-1 font-mono text-[10px] text-blue-700 border-b border-slate-200 pb-0.5">
                                    {exp.orderLabel} ({exp.projectCode})
                                  </div>
                                  {exp.legalEvents || '無法律事件紀錄'}
                                </div>
                              );
                            })}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 說明列 */}
                <div className="p-3 bg-slate-50 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>經歷案場歷練說明</strong>：依人員經歷之前三案資料評估（若尚未到三案歷練，則全數列出）。
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedCandidates.map((c) => {
                      const exps = getCandidateProjectExperiences(c);
                      return (
                        <span key={c.empNo} className="font-mono text-slate-700">
                          {c.name}：共 <strong>{exps.length}</strong> 案歷練 (
                          {exps.map((e) => `${e.orderLabel}:${e.projectCode}`).join('、')})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 當使用者選擇「前三案全數並列」時，展開每位人選的所有歷練案場深入對比卡片 */}
              {selectedProjectIndex === 'all' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      前三案實績歷練全數並列矩陣 (若未達三案則全數列出)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      逐一核對主管歷史代表案場之使照、交屋、品質、追加成本與職安紀錄
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedCandidates.map((cand) => {
                      const exps = getCandidateProjectExperiences(cand);
                      return (
                        <div
                          key={cand.empNo}
                          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{cand.name}</span>
                              <span className="text-xs text-slate-500 font-mono">({cand.empNo})</span>
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-bold">
                                {cand.title || '案主管'}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                                {cand.candidateCategory}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 font-mono">
                              共 {exps.length} 案歷練 (全數列出)
                            </span>
                          </div>

                          <div className="space-y-3">
                            {exps.map((exp, expIdx) => (
                              <div
                                key={expIdx}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                      {exp.orderLabel}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900">
                                      {exp.projectName}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      ({exp.scaleType} · 擔任{formatExperienceRole(exp.role)})
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-blue-700 font-bold">
                                    {exp.projectCode}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                  <div className="bg-white p-2 rounded border border-slate-200">
                                    <span className="text-slate-500 block">使照工期 (超落)</span>
                                    <strong className="text-slate-900 font-mono">
                                      {exp.licenseProgress.totalDays}天 ({exp.licenseProgress.diffDays}天)
                                    </strong>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-slate-200">
                                    <span className="text-slate-500 block">交屋戶數 (超落)</span>
                                    <strong className="text-slate-900 font-mono">
                                      {exp.handoverProgress.handoverUnits} ({exp.handoverProgress.diffDays}天)
                                    </strong>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-slate-200">
                                    <span className="text-slate-500 block">品質監理均分</span>
                                    <strong className="text-blue-700 font-mono font-bold">
                                      {exp.qualitySupervisionScore.toFixed(1)}分
                                    </strong>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-slate-200">
                                    <span className="text-slate-500 block">追加率 (金額)</span>
                                    <strong className="text-slate-900 font-mono">
                                      {exp.totalAdditionRate}% ({formatCurrency(exp.totalAdditionAmount)}元)
                                    </strong>
                                  </div>
                                </div>

                                <div className="text-[11px] text-slate-600 space-y-0.5 bg-white p-2 rounded border border-slate-200">
                                  <div>
                                    <strong>職安表現</strong>：監理評分 {exp.safetySupervisionScore} 分 · 停工 {exp.safetySuspensionsCount} 次 · 罰款 {exp.safetyFinesAmount > 0 ? `${formatCurrency(exp.safetyFinesAmount)} 元` : '0 元'}
                                  </div>
                                  <div>
                                    <strong>法律事件</strong>：{exp.legalEvents}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 七大階段年資對比 (保留工程技術全生命週期對比) */}
          {activeTab === 'stages' && (
            <div className="space-y-4">
              {/* 橫向滑動導覽列與多位主管快速定位列 (列印/PDF匯出時隱藏) */}
              <div
                data-html2canvas-ignore="true"
                className="no-print print-hide hidden-for-pdf bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-blue-800"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-blue-200 font-bold text-xs">
                    <MoveHorizontal className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>人選左右滑動定位：</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollByAmount(-300)}
                      disabled={!canScrollLeft}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        canScrollLeft
                          ? 'bg-white/10 hover:bg-white text-white hover:text-slate-900 border-white/30 cursor-pointer shadow-xs'
                          : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed opacity-50'
                      }`}
                      title="向左滾動看前面人選"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>向左</span>
                    </button>

                    <button
                      onClick={() => scrollByAmount(300)}
                      disabled={!canScrollRight}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        canScrollRight
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 cursor-pointer shadow-md'
                          : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed opacity-50'
                      }`}
                      title="向右滾動看後面人選"
                    >
                      <span>向右 (看第 {selectedCandidates.length} 位)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Candidate Quick Jump Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap ml-1">
                    <span className="text-[11px] text-blue-300 font-medium hidden md:inline">直達人選：</span>
                    {selectedCandidates.map((c, idx) => (
                      <button
                        key={c.empNo}
                        onClick={() => scrollToCandidate(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          idx === selectedCandidates.length - 1 && selectedCandidates.length >= 4
                            ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                            : 'bg-white/15 text-white hover:bg-white hover:text-slate-900 border-white/20'
                        }`}
                        title={`點擊立即聚焦捲動至第 ${idx + 1} 位主管【${c.name}】`}
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-950/40 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/15 text-blue-100 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    可按住滑鼠直接拖曳表格，或按 Shift+滾輪橫向滑動
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    工程七大階段實務歷練年資 對比統計 (單位：年)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    標註金冠為該階段年資領先者
                  </span>
                </div>

                <div
                  ref={tableScrollRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onScroll={updateScrollInfo}
                  className={`overflow-x-auto transition-colors scrollbar-thin scrollbar-thumb-blue-400/80 scrollbar-track-slate-100 ${
                    isDragging ? 'select-none cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <table
                    className="w-full text-xs text-left border-collapse"
                    style={{ minWidth: `${Math.max(900, 200 + selectedCandidates.length * 240)}px` }}
                  >
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-48 bg-slate-100/80 sticky left-0 z-10">
                          階段名稱 / 專業歷練範疇
                        </th>
                        {selectedCandidates.map((c) => (
                          <th key={c.empNo} className="py-2.5 px-3 min-w-48 text-slate-800">
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">工號:{c.empNo}</span>
                              <span className="text-blue-700 bg-blue-50 px-1 rounded font-semibold">{c.title || '案主管'}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stageKeys.map(({ key, label, description }) => {
                        const currentMax = maxStages[key];
                        return (
                          <tr key={key} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 bg-slate-50/50 sticky left-0 font-semibold text-slate-700">
                              <div>{label}</div>
                              <div className="text-[10px] text-slate-400">{description}</div>
                            </td>
                            {selectedCandidates.map((c) => {
                              const years = c.sevenStagesYears?.[key] ?? 0;
                              const isLead = years === currentMax && currentMax > 0;
                              const widthPct =
                                currentMax > 0 ? Math.min(100, Math.round((years / 6) * 100)) : 0;

                              return (
                                <td key={c.empNo} className="py-2.5 px-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between font-mono">
                                      <span
                                        className={`font-bold ${
                                          isLead ? 'text-blue-700' : 'text-slate-700'
                                        }`}
                                      >
                                        {years.toFixed(2)} 年
                                      </span>
                                      {isLead && (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Crown className="w-3 h-3" />
                                          領先
                                        </span>
                                      )}
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          isLead ? 'bg-blue-600' : 'bg-slate-400'
                                        }`}
                                        style={{ width: `${Math.max(5, widthPct)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI Strategic Decision Summary Box */}
          <div data-pdf-block="true" className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-xl border border-blue-200 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>案主管遴選小組 綜合評審決策總結</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {selectedCandidates.map((cand) => {
                const scores = getCandidateScores(cand);
                const exps = getCandidateProjectExperiences(cand);
                const exp1 = exps[0];
                return (
                  <div
                    key={cand.empNo}
                    className="p-3 bg-white/90 rounded-lg border border-blue-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                      <span className="font-bold text-slate-900">{cand.name}</span>
                      <span className="font-mono text-blue-700 font-extrabold">
                        總分 {scores.totalScore}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        • <strong>綜合評分</strong>：工程 50% ({scores.engineeringScore}) · 管理 25% ({scores.managementScore}) · 人格 25% ({scores.personalityScore})
                      </div>
                      <div>
                        • <strong>代表歷練</strong>：
                        {exps.map((e) => `${e.orderLabel} ${e.projectCode}`).join('、')}
                      </div>
                      {exp1 && (
                        <div>
                          • <strong>前一案完工狀況</strong>：使照工期 {exp1.licenseProgress.totalDays} 天 (超落 {exp1.licenseProgress.diffDays} 天) · 交屋超落 {exp1.handoverProgress.diffDays} 天。
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            遠雄營造 案主管人才庫遴選審查決策系統 · 支援照片上傳、經歷前三案完整評比
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="匯出 A3 橫式高解析度 PDF 決策總表"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? '產生 PDF...' : '匯出PDF'}</span>
            </button>
            <button
              onClick={handleExportPK}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              匯出 Excel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              關閉評審表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
