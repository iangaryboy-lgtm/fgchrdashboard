import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CandidateProfile, ReleaseStatus, CandidateCategory } from '../../types';
import { getOrgScope, filterCandidatesByScope } from '../../utils/orgScope';
import {
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  FileDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Layers,
  Award,
  CheckSquare,
  Square,
  X,
  Briefcase,
  TrendingUp,
  MapPin,
  CheckCircle2,
  CalendarDays,
  Swords,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  formatDecimal,
  formatYears,
  formatAge,
  calculateAge,
  calculateYearsDifference,
  getSixCityCategory,
} from '../../utils/parser';
import { CandidatePKModal } from './CandidatePKModal';
import { CandidateFullProfileModal } from './quarterly/CandidateFullProfileModal';
import { getCandidatePhoto } from '../../utils/candidatePkHelper';
import { A3PrintPdfController } from '../common/A3PrintPdfController';
import { PrintWrapper } from '../common/PrintWrapper';

export const CandidateTalentDashboard: React.FC = () => {
  const { candidates, currentUser, orgTree, permissionMatrix } = useApp();

  // Compute Data Scope based on logged-in user & permissions
  const scope = useMemo(
    () => getOrgScope(currentUser, orgTree, permissionMatrix),
    [currentUser, orgTree, permissionMatrix]
  );

  const scopedCandidates = useMemo(
    () => filterCandidatesByScope(candidates, scope),
    [candidates, scope]
  );

  // Data Base Date
  const [baseDate, setBaseDate] = useState<string>('2026-06-17');

  // Selected for PK Comparison
  const [selectedEmpNosForPk, setSelectedEmpNosForPk] = useState<string[]>([]);
  const [showPkModal, setShowPkModal] = useState<boolean>(false);

  // Compute Base Year and 3 Lookback Years
  const baseYear = useMemo(() => {
    try {
      const yr = new Date(baseDate).getFullYear();
      return isNaN(yr) ? 2026 : yr;
    } catch {
      return 2026;
    }
  }, [baseDate]);

  const lookbackYears = useMemo(() => {
    return [
      (baseYear - 1).toString(),
      (baseYear - 2).toString(),
      (baseYear - 3).toString(),
    ];
  }, [baseYear]);

  // Helper to get candidate evaluation score for a specific year
  const getCandidateEval = (c: CandidateProfile, yr: string): string => {
    if (c.evaluations && c.evaluations[yr] !== undefined) {
      return c.evaluations[yr];
    }
    if (yr === '2025' && c.eval2025) return c.eval2025;
    if (yr === '2024' && c.eval2024) return c.eval2024;
    if (yr === '2023' && c.eval2023) return c.eval2023;
    return '-';
  };

  // Top Single Select Filters
  const [selectedRank, setSelectedRank] = useState<string>('全部');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('全部');
  const [selectedCompletedCount, setSelectedCompletedCount] = useState<string>('全部');
  const [selectedInternalMgmtYears, setSelectedInternalMgmtYears] = useState<string>('全部');
  const [selectedDept, setSelectedDept] = useState<string>('全部');

  // 3 Lookback Years Performance Filters
  const [selectedEvalYear1, setSelectedEvalYear1] = useState<string>('全部');
  const [selectedEvalYear2, setSelectedEvalYear2] = useState<string>('全部');
  const [selectedEvalYear3, setSelectedEvalYear3] = useState<string>('全部');

  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 4 Core Dimensional Interactive Cross-Filters:
  // ① 人選分類 (Category)
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  // ② 可承接案場規模 (Scale - multi-match)
  const [scaleFilter, setScaleFilter] = useState<string[]>([]);
  // ③ 可調動區域 (Region - multi-match, normalized)
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  // ④ 現任主管釋出季度 (Quarter)
  const [interactiveReleaseQuarters, setInteractiveReleaseQuarters] = useState<string[]>([]);

  // Advanced Filters Drawer Toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Toggle Table Seven Stages Columns Expansion
  const [showSevenStagesColumns, setShowSevenStagesColumns] = useState<boolean>(false);

  // Method & Release Status filters (inside Advanced Filters Drawer)
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [releaseStatusFilter, setReleaseStatusFilter] = useState<string[]>([]);

  // Active Dropdown Popover state (1, 2, 3, 4)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Selected candidate profile modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  // Filter options definitions
  const allCategories: CandidateCategory[] = ['現任主管', '曾任主管', '儲備幹部', '儲備主管'];
  const allScales = ['特大型', '大型案', '中型案', '小型案'];
  const allSixCities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
  const allRegions = ['北區', '中區', '南區'];
  const allMethods = ['帷幕牆', '深開挖', '逆打'];
  const allReleaseStatuses: ReleaseStatus[] = [
    '現任主管-尚未達釋出條件',
    '現任主管-已達標準釋出',
    '現任主管-已達使照提前釋出',
    '現任主管-已達下架啟動釋出',
    '曾任主管-可列入遴選評估',
    '儲備幹部-待任用評估',
    '儲備主管-待任用評估',
  ];

  // Helper toggle functions
  const toggleSelection = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    allList: string[],
    item: string
  ) => {
    if (item === '__ALL__') {
      if (list.length === allList.length) {
        setList([]);
      } else {
        setList([...allList]);
      }
      return;
    }

    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleCandidateForPk = (empNo: string) => {
    if (selectedEmpNosForPk.includes(empNo)) {
      setSelectedEmpNosForPk(selectedEmpNosForPk.filter((id) => id !== empNo));
    } else {
      if (selectedEmpNosForPk.length >= 5) {
        alert('最多可同時選擇 5 位人選進行 PK 評選');
        return;
      }
      setSelectedEmpNosForPk([...selectedEmpNosForPk, empNo]);
    }
  };

  const handleSelectAllForPk = () => {
    const selectableLimit = Math.min(5, filteredCandidates.length);
    if (selectedEmpNosForPk.length >= selectableLimit && selectedEmpNosForPk.length > 0) {
      setSelectedEmpNosForPk([]);
    } else {
      setSelectedEmpNosForPk(filteredCandidates.slice(0, selectableLimit).map((c) => c.empNo));
    }
  };

  // Base Filtered Candidates List (based on search, basic conditions, and advanced drawer filters)
  const baseFilteredCandidates = useMemo(() => {
    return scopedCandidates.map((c) => {
      const dynamicAge = c.birthday ? calculateAge(c.birthday, baseDate) : (c.age || 45);
      const dynamicSeniority = c.seniorityStartDate
        ? calculateYearsDifference(c.seniorityStartDate, baseDate, 2)
        : Number(Number(c.farglorySeniorityYears || 0).toFixed(2));
      const dynamicInternalMgmtYears = c.internalMgmtStartDate
        ? calculateYearsDifference(c.internalMgmtStartDate, baseDate, 2)
        : Number(Number(c.internalMgmtYears || 0).toFixed(2));

      return {
        ...c,
        dynamicAge,
        dynamicSeniority,
        dynamicInternalMgmtYears,
      };
    }).filter((c) => {
      // Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchEmp = c.empNo.toLowerCase().includes(q);
        const matchSec = c.section?.toLowerCase().includes(q);
        const matchProj = c.currentProject?.toLowerCase().includes(q);
        if (!matchName && !matchEmp && !matchSec && !matchProj) return false;
      }

      // Rank
      if (selectedRank !== '全部' && c.rank !== selectedRank) return false;

      // Dept
      if (selectedDept !== '全部' && c.department !== selectedDept) return false;

      // Seniority
      if (selectedSeniority === '< 10年' && c.dynamicSeniority >= 10) return false;
      if (selectedSeniority === '10-20年' && (c.dynamicSeniority < 10 || c.dynamicSeniority > 20)) return false;
      if (selectedSeniority === '> 20年' && c.dynamicSeniority <= 20) return false;

      // Completed Count
      if (selectedCompletedCount !== '全部' && c.completedProjectsCount.toString() !== selectedCompletedCount) return false;

      // Internal Mgmt Years
      if (selectedInternalMgmtYears === '< 5年' && c.dynamicInternalMgmtYears >= 5) return false;
      if (selectedInternalMgmtYears === '5-10年' && (c.dynamicInternalMgmtYears < 5 || c.dynamicInternalMgmtYears > 10)) return false;
      if (selectedInternalMgmtYears === '> 10年' && c.dynamicInternalMgmtYears <= 10) return false;

      // 3 Lookback Years Performance
      const eval1 = getCandidateEval(c, lookbackYears[0]);
      const eval2 = getCandidateEval(c, lookbackYears[1]);
      const eval3 = getCandidateEval(c, lookbackYears[2]);

      if (selectedEvalYear1 !== '全部' && !eval1.includes(selectedEvalYear1)) return false;
      if (selectedEvalYear2 !== '全部' && !eval2.includes(selectedEvalYear2)) return false;
      if (selectedEvalYear3 !== '全部' && !eval3.includes(selectedEvalYear3)) return false;

      // Method Multi-select (Advanced Drawer)
      if (methodFilter.length > 0) {
        const hasMethod = c.specialMethods?.some((m) => methodFilter.includes(m));
        if (!hasMethod) return false;
      }

      // Release Status Multi-select (Advanced Drawer)
      if (releaseStatusFilter.length > 0) {
        if (!releaseStatusFilter.includes(c.releaseStatus)) return false;
      }

      return true;
    });
  }, [
    scopedCandidates,
    baseDate,
    lookbackYears,
    searchKeyword,
    selectedRank,
    selectedDept,
    selectedSeniority,
    selectedCompletedCount,
    selectedInternalMgmtYears,
    selectedEvalYear1,
    selectedEvalYear2,
    selectedEvalYear3,
    methodFilter,
    releaseStatusFilter,
  ]);

  // ① Category Stats (人選分類統計 - 4核心分類)
  const categoryStats = useMemo(() => {
    const order: CandidateCategory[] = ['現任主管', '曾任主管', '儲備主管', '儲備幹部'];
    const counts: Record<string, number> = {
      現任主管: 0,
      曾任主管: 0,
      儲備主管: 0,
      儲備幹部: 0,
    };
    baseFilteredCandidates.forEach((c) => {
      const cat = c.candidateCategory === '儲備主管-待任用評估' ? '儲備主管' : c.candidateCategory;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return order.map((category) => ({
      category,
      count: counts[category] || 0,
    }));
  }, [baseFilteredCandidates]);

  // ② Project Scale Stats (可承接案場規模統計) - Multi-matching aggregated
  const scaleStats = useMemo(() => {
    const scaleOrder = ['特大型', '大型案', '中型案', '小型案'];
    const counts: Record<string, number> = {
      特大型: 0,
      大型案: 0,
      中型案: 0,
      小型案: 0,
    };
    baseFilteredCandidates.forEach((c) => {
      (c.acceptedScales || []).forEach((s) => {
        if (counts[s] !== undefined) {
          counts[s]++;
        } else if (s.includes('特大')) {
          counts['特大型']++;
        } else if (s.includes('大型')) {
          counts['大型案']++;
        } else if (s.includes('中型')) {
          counts['中型案']++;
        } else if (s.includes('小型')) {
          counts['小型案']++;
        }
      });
    });
    return scaleOrder.map((scale) => ({
      scale,
      count: counts[scale] || 0,
    }));
  }, [baseFilteredCandidates]);

  // ③ Mobilizable Region Stats (可調動區域統計) - Multi-matching, non-six cities categorized into '其他'
  const regionStats = useMemo(() => {
    const targetCities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
    const counts: Record<string, number> = {
      台北市: 0,
      新北市: 0,
      桃園市: 0,
      台中市: 0,
      台南市: 0,
      高雄市: 0,
      其他: 0,
    };
    baseFilteredCandidates.forEach((c) => {
      (c.availableRegions || []).forEach((r) => {
        const cat = getSixCityCategory(r);
        const key = cat === '其他縣市' ? '其他' : cat;
        if (counts[key] !== undefined) {
          counts[key]++;
        } else if (counts[r] !== undefined) {
          counts[r]++;
        } else {
          counts['其他']++;
        }
      });
    });
    return [
      ...targetCities.map((city) => ({ region: city, count: counts[city] || 0 })),
      ...(counts['其他'] > 0 ? [{ region: '其他', count: counts['其他'] }] : []),
    ];
  }, [baseFilteredCandidates]);

  // ④ Release Quarter Distribution based on baseFilteredCandidates (strictly chronological order)
  const quarterStats = useMemo(() => {
    const counts: Record<string, number> = {};
    baseFilteredCandidates.forEach((c) => {
      const q = c.releaseQuarter || '(空白)';
      counts[q] = (counts[q] || 0) + 1;
    });

    const parseQuarterValue = (q: string) => {
      if (q === '(空白)' || q === '空白' || !q) return -1; // Keep (空白) at the very start
      const match = q.match(/^(\d{4})Q?([1-4])$/i);
      if (match) {
        return parseInt(match[1], 10) * 10 + parseInt(match[2], 10);
      }
      return 99990;
    };

    const allPresentQuarters = Object.keys(counts);
    const sortedQuarters = allPresentQuarters.sort((a, b) => {
      const valA = parseQuarterValue(a);
      const valB = parseQuarterValue(b);
      if (valA !== valB) return valA - valB;
      return a.localeCompare(b);
    });

    return sortedQuarters.map((q) => ({
      quarter: q,
      count: counts[q] || 0,
    }));
  }, [baseFilteredCandidates]);

  // Final Filtered Candidates List with Multi-Dimensional Cross-Filters Applied
  const filteredCandidates = useMemo(() => {
    return baseFilteredCandidates.filter((c) => {
      // ① Category filter
      if (categoryFilter.length > 0) {
        const normalizedCat = c.candidateCategory === '儲備主管-待任用評估' ? '儲備主管' : c.candidateCategory;
        if (!categoryFilter.includes(normalizedCat) && !categoryFilter.includes(c.candidateCategory)) {
          return false;
        }
      }

      // ② Scale filter (multi-match)
      if (scaleFilter.length > 0) {
        const cScales = c.acceptedScales || [];
        const matchesScale = scaleFilter.some((targetScale) =>
          cScales.some((s) => s === targetScale || s.includes(targetScale.slice(0, 2)))
        );
        if (!matchesScale) return false;
      }

      // ③ Region filter (multi-match)
      if (regionFilter.length > 0) {
        const cRegions = c.availableRegions || [];
        const matchesRegion = regionFilter.some((targetRegion) =>
          cRegions.some((r) => {
            if (r === targetRegion) return true;
            const cat = getSixCityCategory(r);
            if (cat === targetRegion) return true;
            if (targetRegion === '其他' && cat === '其他') return true;
            return false;
          })
        );
        if (!matchesRegion) return false;
      }

      // ④ Interactive Release Quarter Filter
      if (interactiveReleaseQuarters.length > 0) {
        const q = c.releaseQuarter || '(空白)';
        if (!interactiveReleaseQuarters.includes(q)) return false;
      }

      return true;
    });
  }, [
    baseFilteredCandidates,
    categoryFilter,
    scaleFilter,
    regionFilter,
    interactiveReleaseQuarters,
  ]);

  const maxQuarterCount = Math.max(...quarterStats.map((s) => s.count), 1);

  // Toggle Release Quarter Cross-Filter (Multi-Selection)
  const handleQuarterClick = (quarter: string) => {
    setInteractiveReleaseQuarters((prev) =>
      prev.includes(quarter) ? prev.filter((q) => q !== quarter) : [...prev, quarter]
    );
  };

  // Toggle Category Cross-Filter
  const handleCategoryClick = (cat: string) => {
    setCategoryFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Toggle Scale Cross-Filter
  const handleScaleClick = (scale: string) => {
    setScaleFilter((prev) =>
      prev.includes(scale) ? prev.filter((s) => s !== scale) : [...prev, scale]
    );
  };

  // Toggle Region Cross-Filter
  const handleRegionClick = (region: string) => {
    setRegionFilter((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  // Active advanced filters counter
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (selectedRank !== '全部') count++;
    if (selectedDept !== '全部') count++;
    if (selectedSeniority !== '全部') count++;
    if (selectedCompletedCount !== '全部') count++;
    if (selectedInternalMgmtYears !== '全部') count++;
    if (selectedEvalYear1 !== '全部') count++;
    if (selectedEvalYear2 !== '全部') count++;
    if (selectedEvalYear3 !== '全部') count++;
    if (methodFilter.length > 0) count += methodFilter.length;
    if (releaseStatusFilter.length > 0) count += releaseStatusFilter.length;
    return count;
  }, [
    selectedRank,
    selectedDept,
    selectedSeniority,
    selectedCompletedCount,
    selectedInternalMgmtYears,
    selectedEvalYear1,
    selectedEvalYear2,
    selectedEvalYear3,
    methodFilter,
    releaseStatusFilter,
  ]);

  const resetAllFilters = () => {
    setCategoryFilter([]);
    setScaleFilter([]);
    setRegionFilter([]);
    setInteractiveReleaseQuarters([]);
    setSelectedRank('全部');
    setSelectedDept('全部');
    setSelectedSeniority('全部');
    setSelectedCompletedCount('全部');
    setSelectedInternalMgmtYears('全部');
    setSelectedEvalYear1('全部');
    setSelectedEvalYear2('全部');
    setSelectedEvalYear3('全部');
    setMethodFilter([]);
    setReleaseStatusFilter([]);
    setSearchKeyword('');
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('candidate-talent-dashboard-content', {
        filename: `遠雄營造_案主管人才庫儀表板報告_A3橫式_${baseDate}_${new Date().toISOString().slice(0, 10)}`,
        title: '遠雄營造 案主管人才庫 儀表板戰情報告 (A3 橫式)',
        subtitle: `資料基礎日：${baseDate} · 考績歷練追溯：${lookbackYears[0]}、${lookbackYears[1]}、${lookbackYears[2]} · 人才庫總數：${filteredCandidates.length} 人`,
        landscape: true,
        paperSize: 'a3',
        fixedWidth: 1584,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredCandidates.map((c) => ({
      員工編號: c.empNo,
      姓名: c.name,
      部室單位: c.department,
      科案: c.section,
      職等: c.rank,
      職稱: c.title,
      年齡: c.dynamicAge,
      現職案場: c.currentProject,
      '遠營年資(年)': c.dynamicSeniority,
      '內部管理年資(年)': c.dynamicInternalMgmtYears,
      管理職完案: c.completedProjectsCount,
      釋出狀態: c.releaseStatus,
      '標準釋出日-F+150': c.releaseDate,
      釋出季度: c.releaseQuarter,
      人選分類: c.candidateCategory,
      '七大階段-案前管理': formatDecimal(c.sevenStagesYears?.preProject),
      '七大階段-假設階段': formatDecimal(c.sevenStagesYears?.hypothesis),
      '七大階段-基坑土方': formatDecimal(c.sevenStagesYears?.foundation),
      '七大階段-結構體': formatDecimal(c.sevenStagesYears?.structure),
      '七大階段-裝修': formatDecimal(c.sevenStagesYears?.finishing),
      '七大階段-景觀公設': formatDecimal(c.sevenStagesYears?.landscape),
      '七大階段-交屋': formatDecimal(c.sevenStagesYears?.handover),
      [`${lookbackYears[0]}考績`]: getCandidateEval(c, lookbackYears[0]),
      [`${lookbackYears[1]}考績`]: getCandidateEval(c, lookbackYears[1]),
      [`${lookbackYears[2]}考績`]: getCandidateEval(c, lookbackYears[2]),
    }));
    exportToExcel(data, `遠雄營造_案主管人才庫清冊_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <PrintWrapper
      id="candidate-talent-dashboard-content"
      className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-3.5"
      documentTitle="遠雄營造 案主管人才庫 儀表板戰情報告"
    >
      {/* Top Banner */}
      <div data-pdf-block="true" className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs pdf-block-avoid">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              案主管人才庫 儀表板
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              依照現行案主管遴選，人選篩選條件排序
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            以 <strong className="text-blue-700 font-mono">{baseDate}</strong> 資料為基礎 · 連動往前 3 年考績（{lookbackYears[0]}、{lookbackYears[1]}、{lookbackYears[2]}）· 精確評定七大階段歷練年資
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Base Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 border border-blue-200 rounded-lg">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <label className="text-xs font-bold text-blue-900 whitespace-nowrap">資料基礎日：</label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="py-0.5 px-1.5 text-xs font-mono font-bold text-blue-900 bg-white border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋姓名/編號/科案..."
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 w-36 sm:w-44 bg-white outline-none"
            />
          </div>

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              showAdvancedFilters || activeAdvancedCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>進階篩選條件</span>
            {activeAdvancedCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {activeAdvancedCount}
              </span>
            )}
            {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Reset All Filters Button */}
          {(categoryFilter.length > 0 ||
            scaleFilter.length > 0 ||
            regionFilter.length > 0 ||
            interactiveReleaseQuarters.length > 0 ||
            activeAdvancedCount > 0 ||
            searchKeyword) && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="清除所有篩選條件與圖表連動"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重設全部</span>
            </button>
          )}

          {/* PK Action Button */}
          <button
            onClick={() => {
              if (selectedEmpNosForPk.length === 0) {
                setSelectedEmpNosForPk(filteredCandidates.slice(0, 3).map((c) => c.empNo));
              }
              setShowPkModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-lg shadow-xs transition-all"
          >
            <Swords className="w-3.5 h-3.5 text-amber-300" />
            <span>案主管評選 PK 作業</span>
            {selectedEmpNosForPk.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                {selectedEmpNosForPk.length}
              </span>
            )}
          </button>

          {/* Dedicated A3 Print & PDF Export Controller */}
          <A3PrintPdfController
            targetElementId="candidate-talent-dashboard-content"
            documentTitle="遠雄營造 案主管人才庫 儀表板戰情報告"
            subtitle={`資料基礎日：${baseDate} · 考績歷練追溯：${lookbackYears[0]}、${lookbackYears[1]}、${lookbackYears[2]} · 人才庫總數：${filteredCandidates.length} 人`}
            baseDate={baseDate}
            buttonLabel="匯出PDF"
            variant="rose"
          />

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            匯出 Excel
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {showAdvancedFilters && (
        <div className="bg-slate-50/90 border border-blue-200 rounded-xl p-3.5 shadow-xs animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>進階細部條件篩選面板</span>
              <span className="text-[11px] text-slate-500 font-normal">（職等、年資、考績、工法與釋出狀態）</span>
            </div>
            <button
              onClick={() => {
                setSelectedRank('全部');
                setSelectedDept('全部');
                setSelectedSeniority('全部');
                setSelectedCompletedCount('全部');
                setSelectedInternalMgmtYears('全部');
                setSelectedEvalYear1('全部');
                setSelectedEvalYear2('全部');
                setSelectedEvalYear3('全部');
                setMethodFilter([]);
                setReleaseStatusFilter([]);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              清除進階條件
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* 職等 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">職等</label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full py-1 px-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部</option>
                <option value="08">08 (經理)</option>
                <option value="07">07 (副理)</option>
                <option value="06">06 (工程師)</option>
                <option value="05">05 (區棟組長)</option>
              </select>
            </div>

            {/* 部室 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">部室</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full py-1 px-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部</option>
                <option value="工程一部">工程一部</option>
                <option value="工程二部">工程二部</option>
                <option value="土木部">土木部</option>
                <option value="人力資源室">人力資源室</option>
                <option value="工務企劃室">工務企劃室</option>
              </select>
            </div>

            {/* 遠營年資 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">遠營年資</label>
              <select
                value={selectedSeniority}
                onChange={(e) => setSelectedSeniority(e.target.value)}
                className="w-full py-1 px-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部</option>
                <option value="< 10年">&lt; 10年</option>
                <option value="10-20年">10 ~ 20年</option>
                <option value="> 20年">&gt; 20年以上</option>
              </select>
            </div>

            {/* 完案小計 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">完案小計</label>
              <select
                value={selectedCompletedCount}
                onChange={(e) => setSelectedCompletedCount(e.target.value)}
                className="w-full py-1 px-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部</option>
                <option value="5">5 案</option>
                <option value="3">3 案</option>
                <option value="2">2 案</option>
                <option value="1">1 案</option>
              </select>
            </div>

            {/* 管理年資內部 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">內部管理年資</label>
              <select
                value={selectedInternalMgmtYears}
                onChange={(e) => setSelectedInternalMgmtYears(e.target.value)}
                className="w-full py-1 px-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部</option>
                <option value="< 5年">&lt; 5年</option>
                <option value="5-10年">5 ~ 10年</option>
                <option value="> 10年">&gt; 10年以上</option>
              </select>
            </div>

            {/* 3年考績 */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                考績 ({lookbackYears[0]}/{lookbackYears[1]}/{lookbackYears[2]})
              </label>
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={selectedEvalYear1}
                  onChange={(e) => setSelectedEvalYear1(e.target.value)}
                  className="py-1 px-0.5 text-[10px] font-medium bg-white border border-slate-300 rounded"
                >
                  <option value="全部">'{lookbackYears[0].slice(2)}</option>
                  <option value="甲上">甲上</option>
                  <option value="甲">甲</option>
                  <option value="乙">乙</option>
                </select>
                <select
                  value={selectedEvalYear2}
                  onChange={(e) => setSelectedEvalYear2(e.target.value)}
                  className="py-1 px-0.5 text-[10px] font-medium bg-white border border-slate-300 rounded"
                >
                  <option value="全部">'{lookbackYears[1].slice(2)}</option>
                  <option value="甲上">甲上</option>
                  <option value="甲">甲</option>
                  <option value="乙">乙</option>
                </select>
                <select
                  value={selectedEvalYear3}
                  onChange={(e) => setSelectedEvalYear3(e.target.value)}
                  className="py-1 px-0.5 text-[10px] font-medium bg-white border border-slate-300 rounded"
                >
                  <option value="全部">'{lookbackYears[2].slice(2)}</option>
                  <option value="甲上">甲上</option>
                  <option value="甲">甲</option>
                  <option value="乙">乙</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            {/* 特殊工法經驗 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">特殊工法經驗</label>
              <div className="flex flex-wrap items-center gap-2">
                {allMethods.map((m) => {
                  const isChecked = methodFilter.includes(m);
                  return (
                    <label
                      key={m}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelection(methodFilter, setMethodFilter, allMethods, m)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 釋出狀態細部 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">釋出狀態細部</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {allReleaseStatuses.map((st) => {
                  const isChecked = releaseStatusFilter.includes(st);
                  const shortName = st.replace('現任主管-', '').replace('曾任主管-', '').replace('儲備幹部-', '').replace('儲備主管-', '');
                  return (
                    <label
                      key={st}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                      title={st}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelection(releaseStatusFilter, setReleaseStatusFilter, allReleaseStatuses, st)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span>{shortName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Dimensional Interactive Cross-Filtering Cards (Power BI Style) with Left "人才庫總人數" Card */}
      <div data-pdf-block="true" className="flex flex-col lg:flex-row gap-3 items-stretch print-avoid-break pdf-block-avoid">
        {/* Left: 人才庫總人數 卡片 (如使用者附圖前方出現) */}
        <div
          onClick={() => {
            if (
              categoryFilter.length > 0 ||
              scaleFilter.length > 0 ||
              regionFilter.length > 0 ||
              interactiveReleaseQuarters.length > 0
            ) {
              setCategoryFilter([]);
              setScaleFilter([]);
              setRegionFilter([]);
              setInteractiveReleaseQuarters([]);
            }
          }}
          className={`w-full lg:w-52 xl:w-56 shrink-0 bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group ${
            categoryFilter.length > 0 ||
            scaleFilter.length > 0 ||
            regionFilter.length > 0 ||
            interactiveReleaseQuarters.length > 0
              ? 'border-blue-300 ring-2 ring-blue-100 cursor-pointer'
              : 'border-slate-200/90'
          }`}
          title={
            categoryFilter.length > 0 ||
            scaleFilter.length > 0 ||
            regionFilter.length > 0 ||
            interactiveReleaseQuarters.length > 0
              ? '點擊可重設篩選，顯示全體人才'
              : undefined
          }
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              人才庫總人數
            </span>
          </div>

          <div className="my-auto py-3 flex items-baseline">
            <span className="text-5xl sm:text-6xl font-black text-blue-600 tracking-tight font-sans">
              {filteredCandidates.length}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 ml-2">
              人
            </span>
          </div>

          {categoryFilter.length > 0 ||
          scaleFilter.length > 0 ||
          regionFilter.length > 0 ||
          interactiveReleaseQuarters.length > 0 ? (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                篩選中 / 總計 {scopedCandidates.length} 人
              </span>
              <span className="text-blue-600 font-bold text-[11px] group-hover:underline">
                重設
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium pt-1">
              全體合格候選人
            </div>
          )}
        </div>

        {/* Right: 人選分類 (4類) & 可承接案場規模 (4類) & 可調動區域 (六都) */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Row 1: 人選分類 (4類) & 可承接案場規模 (4類) - 左右對稱一致排列 */}
          <div data-pdf-block="true" className="grid grid-cols-1 lg:grid-cols-2 gap-3 print-avoid-break pdf-block-avoid">
          {/* ① Card 1: 人選分類 (4類) */}
          <div data-pdf-block="true" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between print-avoid-break pdf-block-avoid">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800">人選分類</h4>
                <span className="text-[10px] text-slate-400">點選連動多選</span>
              </div>
              {categoryFilter.length > 0 && (
                <button
                  onClick={() => setCategoryFilter([])}
                  className="text-[10px] font-semibold text-rose-600 hover:underline"
                >
                  清除
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoryStats.map((item) => {
                const isSelected = categoryFilter.includes(item.category);
                const isMuted = categoryFilter.length > 0 && !isSelected;
                return (
                  <button
                    key={item.category}
                    onClick={() => handleCategoryClick(item.category)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left transition-all keep-for-pdf ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                        : isMuted
                        ? 'bg-slate-50/60 border-slate-200 opacity-50 hover:opacity-90 hover:bg-slate-50'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-blue-50/40 hover:border-blue-300'
                    }`}
                  >
                    <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                      {item.category}
                    </span>
                    <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded ml-1.5 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ② Card 2: 可承接案場規模 (4類) - 排列格式與人選分類 100% 一致 */}
          <div data-pdf-block="true" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between print-avoid-break pdf-block-avoid">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800">可承接案場規模</h4>
                <span className="text-[10px] text-slate-400">支援多重承接</span>
              </div>
              {scaleFilter.length > 0 && (
                <button
                  onClick={() => setScaleFilter([])}
                  className="text-[10px] font-semibold text-rose-600 hover:underline"
                >
                  清除
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scaleStats.map((item) => {
                const isSelected = scaleFilter.includes(item.scale);
                const isMuted = scaleFilter.length > 0 && !isSelected;
                return (
                  <button
                    key={item.scale}
                    onClick={() => handleScaleClick(item.scale)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left transition-all keep-for-pdf ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
                        : isMuted
                        ? 'bg-slate-50/60 border-slate-200 opacity-50 hover:opacity-90 hover:bg-slate-50'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-indigo-50/40 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {item.scale}
                    </span>
                    <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded ml-1.5 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: 可調動區域 (六都) - 單排一字排開展示，絕不分成上下兩排 */}
        <div data-pdf-block="true" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs print-avoid-break pdf-block-avoid">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">可調動區域</h4>
              <span className="text-[10px] text-slate-400">（六都及其他區域調動意願 · 單排呈現 · 點擊連動名單）</span>
            </div>
            {regionFilter.length > 0 && (
              <button
                onClick={() => setRegionFilter([])}
                className="text-[10px] font-semibold text-rose-600 hover:underline"
              >
                清除區域篩選
              </button>
            )}
          </div>
          <div className="overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex items-center justify-between gap-2 w-full min-w-[560px]">
              {regionStats.map((item) => {
                const isSelected = regionFilter.includes(item.region);
                const isMuted = regionFilter.length > 0 && !isSelected;
                return (
                  <button
                    key={item.region}
                    onClick={() => handleRegionClick(item.region)}
                    className={`flex-1 min-w-[4.8rem] flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all keep-for-pdf ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                        : isMuted
                        ? 'bg-slate-50/60 border-slate-200 opacity-50 hover:opacity-90 hover:bg-slate-50'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-300'
                    }`}
                  >
                    <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {item.region}
                    </span>
                    <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded ml-1.5 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ④ Card 4: 現任主管釋出季度 分佈統計 (單排水平時序長條圖) */}
      <div data-pdf-block="true" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print-avoid-break pdf-block-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              現任主管釋出季度 分佈統計
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              (共 {quarterStats.length} 個時序 · 已排程 {quarterStats.filter(q => q.quarter !== '(空白)').reduce((s, i) => s + i.count, 0)} 人 / 未排定 {quarterStats.find(q => q.quarter === '(空白)')?.count || 0} 人)
            </span>
            {interactiveReleaseQuarters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
                  已選 ({interactiveReleaseQuarters.length})：
                </span>
                {interactiveReleaseQuarters.map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-xs"
                  >
                    {q}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuarterClick(q);
                      }}
                      className="hover:text-blue-950 p-0.5 rounded"
                      title={`移除 ${q}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>💡 點選長條圖可單選或多選連動名單 (水平時序一排呈現)</span>
            {interactiveReleaseQuarters.length > 0 && (
              <button
                onClick={() => setInteractiveReleaseQuarters([])}
                className="text-rose-600 font-semibold hover:underline"
              >
                清除季度連動
              </button>
            )}
          </div>
        </div>

        {/* Single Row Horizontal Bar Timeline */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-end justify-between gap-1 sm:gap-1.5 w-full min-w-[800px] pt-3 pb-1 border-b border-slate-100 select-none">
            {quarterStats.map((item) => {
              const heightPercent = Math.max(8, (item.count / maxQuarterCount) * 100);
              const isSelected = interactiveReleaseQuarters.includes(item.quarter);
              const isMuted = interactiveReleaseQuarters.length > 0 && !isSelected;
              const isBlank = item.quarter === '(空白)';

              return (
                <div
                  key={item.quarter}
                  onClick={() => handleQuarterClick(item.quarter)}
                  title={`點擊篩選【${item.quarter}】釋出主管 (共 ${item.count} 人)`}
                  className={`flex-1 min-w-[2.75rem] max-w-[5.25rem] flex flex-col items-center gap-1 cursor-pointer group transition-all duration-200 p-1 rounded-lg ${
                    isSelected
                      ? 'bg-blue-50/90 ring-2 ring-blue-500 rounded-lg shadow-xs scale-105'
                      : isMuted
                      ? 'opacity-35 hover:opacity-90 hover:bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Top Count Badge */}
                  <span
                    className={`text-xs font-mono transition-colors ${
                      isSelected
                        ? 'font-black text-blue-700 scale-110'
                        : item.count > 0
                        ? 'font-bold text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Vertical Bar Chamber */}
                  <div className="w-full h-24 bg-slate-100/70 rounded-t flex items-end justify-center p-0.5">
                    <div
                      className={`w-full rounded-t transition-all duration-300 shadow-xs ${
                        isSelected
                          ? 'bg-blue-600 ring-1 ring-blue-400'
                          : isBlank
                          ? 'bg-slate-400 group-hover:bg-slate-500'
                          : 'bg-blue-500 group-hover:bg-blue-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>

                  {/* Quarter Bottom Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono truncate w-full text-center px-1 py-0.5 rounded transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isBlank
                        ? 'text-slate-500 font-semibold group-hover:text-slate-800'
                        : 'text-slate-700 font-semibold group-hover:text-blue-700'
                    }`}
                  >
                    {item.quarter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Cross-Filters Indicators Bar */}
      {(categoryFilter.length > 0 ||
        scaleFilter.length > 0 ||
        regionFilter.length > 0 ||
        interactiveReleaseQuarters.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            已啟用維度跨圖表連動：
          </span>

          {categoryFilter.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-300 text-blue-800 rounded-md text-xs font-medium">
              分類: {c}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => handleCategoryClick(c)} />
            </span>
          ))}

          {scaleFilter.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-300 text-indigo-800 rounded-md text-xs font-medium">
              規模: {s}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => handleScaleClick(s)} />
            </span>
          ))}

          {regionFilter.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded-md text-xs font-medium">
              區域: {r}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => handleRegionClick(r)} />
            </span>
          ))}

          {interactiveReleaseQuarters.map((q) => (
            <span key={q} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 text-amber-800 rounded-md text-xs font-medium">
              季度: {q}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => handleQuarterClick(q)} />
            </span>
          ))}

          <button
            onClick={() => {
              setCategoryFilter([]);
              setScaleFilter([]);
              setRegionFilter([]);
              setInteractiveReleaseQuarters([]);
            }}
            className="text-xs text-rose-600 font-bold hover:underline ml-auto"
          >
            清除4大維度連動
          </button>
        </div>
      )}

      {/* Main Candidate Table with Dynamic 3-Year Lookback */}
      <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden pdf-block-avoid">
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">案主管人選清單與七大階段歷練年資</h3>
              <button
                onClick={() => setShowSevenStagesColumns(!showSevenStagesColumns)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                title="切換展開或收合詳細七大階段（案前管理、假設階段、基坑土方、結構體、裝修、景觀公設、交屋）歷練年資欄位"
              >
                <Layers className="w-3 h-3 text-blue-600" />
                <span>{showSevenStagesColumns ? '收合七大階段明細' : '展開七大階段明細'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              依基準日連動年齡/年資與往前 3 年考績 ({lookbackYears[0]}、{lookbackYears[1]}、{lookbackYears[2]}) · 點擊任一人選可查看詳細工程履歷
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              共顯示 <strong className="text-blue-700 font-mono font-bold">{filteredCandidates.length}</strong> 位人選
              {filteredCandidates.length !== candidates.length && (
                <span className="text-slate-400 ml-1">
                  (總池 {candidates.length} 人)
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    title="選取前 5 位進行 PK 評選"
                    checked={
                      selectedEmpNosForPk.length > 0 &&
                      selectedEmpNosForPk.length === Math.min(5, filteredCandidates.length)
                    }
                    onChange={handleSelectAllForPk}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">姓名</th>
                <th className="py-2.5 px-3">科案</th>
                <th className="py-2.5 px-3 text-center">職等</th>
                <th className="py-2.5 px-3">職稱</th>
                <th className="py-2.5 px-3 text-center">年齡</th>
                <th className="py-2.5 px-3">現職案場</th>
                <th className="py-2.5 px-3 text-right">遠營年資</th>
                <th className="py-2.5 px-3 text-right">管理年資內部</th>
                <th className="py-2.5 px-3 text-center">管理職完案</th>
                <th className="py-2.5 px-3">釋出狀態</th>
                <th className="py-2.5 px-3">標準釋出日</th>

                {/* 7 Stages Toggleable Columns */}
                {showSevenStagesColumns ? (
                  <>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">案前管理</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">假設階段</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">基坑土方</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">結構體</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">裝修</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">景觀公設</th>
                    <th className="py-2.5 px-2 bg-slate-100 text-slate-900 text-right">交屋</th>
                  </>
                ) : (
                  <th className="py-2.5 px-2.5 bg-slate-100 text-slate-900 text-center">
                    七大階段歷練
                  </th>
                )}

                <th className="py-2.5 px-2 text-center bg-blue-50/80 text-blue-900">{lookbackYears[0]}考績</th>
                <th className="py-2.5 px-2 text-center bg-blue-50/80 text-blue-900">{lookbackYears[1]}考績</th>
                <th className="py-2.5 px-2 text-center bg-blue-50/80 text-blue-900">{lookbackYears[2]}考績</th>
                <th className="py-2.5 px-2 text-center">動作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredCandidates.map((c) => {
                const isSelectedForPk = selectedEmpNosForPk.includes(c.empNo);
                let statusBadge = 'bg-slate-100 text-slate-700';
                if (c.releaseStatus.includes('尚未達釋出條件')) {
                  statusBadge = 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
                } else if (c.releaseStatus.includes('已達標準釋出')) {
                  statusBadge = 'bg-blue-50 text-blue-700 border border-blue-200 font-bold';
                } else if (c.releaseStatus.includes('提前釋出') || c.releaseStatus.includes('啟動釋出')) {
                  statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
                } else if (c.releaseStatus.includes('曾任主管')) {
                  statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                } else if (c.releaseStatus.includes('儲備幹部') || c.releaseStatus.includes('儲備主管')) {
                  statusBadge = 'bg-purple-50 text-purple-700 border border-purple-200';
                }

                const eval1 = getCandidateEval(c, lookbackYears[0]);
                const eval2 = getCandidateEval(c, lookbackYears[1]);
                const eval3 = getCandidateEval(c, lookbackYears[2]);

                return (
                  <tr
                    key={c.empNo}
                    onClick={() => setSelectedCandidate(c)}
                    className={`cursor-pointer transition-colors pdf-block-avoid ${
                      isSelectedForPk ? 'bg-blue-50/70 font-medium' : 'hover:bg-blue-50/40'
                    }`}
                  >
                    <td
                      className="py-2 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelectedForPk}
                        onChange={() => toggleCandidateForPk(c.empNo)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                          <img
                            src={getCandidatePhoto(c)}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                          <div className="hidden w-full h-full bg-blue-600 text-white text-[11px] font-black items-center justify-center">
                            {c.name.slice(0, 1)}
                          </div>
                        </div>
                        <span className="truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{c.section}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                      {c.rank}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">{c.title}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                      {c.dynamicAge}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{c.currentProject}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {formatDecimal(c.dynamicSeniority, 2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {formatDecimal(c.dynamicInternalMgmtYears, 2)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                      {c.completedProjectsCount}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${statusBadge}`}>
                        {c.releaseStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{c.releaseDate}</td>

                    {/* 7 Stages (Toggleable view) */}
                    {showSevenStagesColumns ? (
                      <>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.preProject)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.hypothesis)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.foundation)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.structure)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.finishing)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.landscape)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono bg-slate-50/50 text-slate-800">
                          {formatDecimal(c.sevenStagesYears?.handover)}
                        </td>
                      </>
                    ) : (
                      <td className="py-2 px-2 text-center bg-slate-50/50">
                        {(() => {
                          const stages = [
                            c.sevenStagesYears?.preProject || 0,
                            c.sevenStagesYears?.hypothesis || 0,
                            c.sevenStagesYears?.foundation || 0,
                            c.sevenStagesYears?.structure || 0,
                            c.sevenStagesYears?.finishing || 0,
                            c.sevenStagesYears?.landscape || 0,
                            c.sevenStagesYears?.handover || 0,
                          ];
                          const nonZeroCount = stages.filter((val) => val > 0).length;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                nonZeroCount >= 5
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : nonZeroCount >= 3
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                              title={`案前:${formatDecimal(stages[0])} / 假設:${formatDecimal(stages[1])} / 基坑:${formatDecimal(stages[2])} / 結構:${formatDecimal(stages[3])} / 裝修:${formatDecimal(stages[4])} / 景觀:${formatDecimal(stages[5])} / 交屋:${formatDecimal(stages[6])} (點擊表頭展開明細欄位)`}
                            >
                              {nonZeroCount} / 7 階段
                            </span>
                          );
                        })()}
                      </td>
                    )}

                    {/* 3 Years Performance */}
                    <td className="py-2 px-2 text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          eval1 === '甲上' || eval1 === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {eval1}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          eval2 === '甲上' || eval2 === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {eval2}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          eval3 === '甲上' || eval3 === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {eval3}
                      </span>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCandidateForPk(c.empNo);
                          }}
                          className={`px-1.5 py-1 text-[10px] rounded font-semibold transition-colors ${
                            isSelectedForPk
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 hover:bg-indigo-50 text-indigo-700'
                          }`}
                          title="加入 / 移出 PK 評選"
                        >
                          {isSelectedForPk ? '已加入PK' : '+ PK'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(c);
                          }}
                          className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition-colors"
                        >
                          履歷詳情
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating PK Bar */}
      {selectedEmpNosForPk.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 sm:px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 sm:gap-6 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>已選取</span>
                <span className="text-amber-400 font-mono text-sm font-black">
                  {selectedEmpNosForPk.length}
                </span>
                <span>位案主管候選人</span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                多維度並列比對七大階段經歷、歷年考績與完案實績 (上限 5 位)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPkModal(true)}
              className="px-3.5 sm:px-5 py-2 text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>啟動 PK 評選作業</span>
            </button>
            <button
              onClick={() => setSelectedEmpNosForPk([])}
              className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              清除
            </button>
          </div>
        </div>
      )}

      {/* Candidate PK Evaluation Modal */}
      {showPkModal && (
        <CandidatePKModal
          initialCandidates={candidates.filter((c) => selectedEmpNosForPk.includes(c.empNo))}
          onClose={() => setShowPkModal(false)}
        />
      )}

      {/* Candidate Career Details Modal 比照全新樣式呈現 */}
      <CandidateFullProfileModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
        benchmarkQuarter={
          baseDate
            ? `${new Date(baseDate).getFullYear()}Q${Math.floor(new Date(baseDate).getMonth() / 3) + 1}`
            : '2026Q2'
        }
      />
    </PrintWrapper>
  );
};
