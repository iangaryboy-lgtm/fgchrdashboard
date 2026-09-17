import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ProjectPlan,
  CandidateProfile,
  ScaleTier,
  Employee,
  BuildingCategory,
  BUILDING_CATEGORIES,
  getProjectBuildingCategory,
} from '../../types';
import { matchCandidatesForProject } from '../../utils/matching';
import { getOrgScope, filterProjectsByScope } from '../../utils/orgScope';
import {
  Building2,
  Search,
  Calendar,
  Sparkles,
  X,
  FileSpreadsheet,
  FileDown,
  Loader2,
  MapPin,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  TrendingUp,
  AlertCircle,
  Award,
  ArrowUpDown,
  Layers,
  CheckCircle2,
  ExternalLink,
  Swords,
  Home,
  Factory,
  Briefcase,
  Boxes,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Scan,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excel';
import { exportElementToPdf } from '../../utils/pdfExport';
import { normalizeRegionToSixCities, formatDecimal } from '../../utils/parser';
import { CandidatePKModal } from './CandidatePKModal';
import { CandidateFullProfileModal } from './quarterly/CandidateFullProfileModal';
import { getCandidatePhoto } from '../../utils/candidatePkHelper';
import { A3PrintPdfController } from '../common/A3PrintPdfController';
import { PrintWrapper } from '../common/PrintWrapper';

const SCALE_TIERS: ScaleTier[] = ['特大型案', '大型案', '中型案', '小型案'];
const CITIES_LIST = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '其他'];

export const getProjectScaleTier = (p: ProjectPlan): ScaleTier => {
  if (p.scaleTier) return p.scaleTier;
  if (p.totalFloorArea >= 150000) return '特大型案';
  if (p.totalFloorArea >= 80000 || p.scaleType?.includes('大型')) return '大型案';
  if (p.totalFloorArea >= 25000 || p.scaleType?.includes('中型')) return '中型案';
  return '小型案';
};

interface MatrixSelection {
  id: string;
  type: 'cell' | 'tier' | 'quarter';
  tier?: ScaleTier;
  quarter?: string;
  label: string;
}

type SortField = 'projectCode' | 'buildingCategory' | 'region' | 'scaleTier' | 'selectionDate' | 'remainingDays' | 'totalFloorArea';
type SortOrder = 'asc' | 'desc';

export const ProjectPlanDashboard: React.FC = () => {
  const { projectPlans, candidates, employees, currentUser, orgTree, permissionMatrix } = useApp();

  // Employee Map from Global Database for accurate Title & Rank
  const empMap = useMemo(() => {
    const map = new Map<string, Employee>();
    (employees || []).forEach((emp) => {
      if (emp.empNo) map.set(emp.empNo.trim().toUpperCase(), emp);
    });
    return map;
  }, [employees]);

  // Compute Org Scope
  const scope = useMemo(
    () => getOrgScope(currentUser, orgTree, permissionMatrix),
    [currentUser, orgTree, permissionMatrix]
  );

  const scopedProjects = useMemo(
    () => filterProjectsByScope(projectPlans, scope),
    [projectPlans, scope]
  );

  // Data Base Date
  const [baseDate, setBaseDate] = useState<string>('2026-06-17');

  // Search & Filter controls
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedSpecialCondition, setSelectedSpecialCondition] = useState<string>('全部');
  const [urgencyQuickFilter, setUrgencyQuickFilter] = useState<'all' | 'urgent60' | 'moderate120' | 'largeTier' | 'urbanSpecial'>('all');

  // Table Sorting
  const [sortField, setSortField] = useState<SortField>('selectionDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Table Independent Zoom & Single-Page Presentation
  const [tableScale, setTableScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('project_plan_table_scale');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 40 && val <= 130) return val;
      }
    } catch {}
    return 100;
  });

  const [isSinglePageMode, setIsSinglePageMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('project_plan_table_single_page') === 'true';
    } catch {}
    return false;
  });

  const [isTableFullscreen, setIsTableFullscreen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('project_plan_table_scale', String(tableScale));
      localStorage.setItem('project_plan_table_single_page', String(isSinglePageMode));
    } catch {}
  }, [tableScale, isSinglePageMode]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTableFullscreen) {
        setIsTableFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTableFullscreen]);

  // Power BI Style Interactive Cross-Filter States (Multi-Selection)
  const [interactiveYears, setInteractiveYears] = useState<number[]>([]);
  const [interactiveQuarters, setInteractiveQuarters] = useState<string[]>([]);
  const [interactiveProjectCodes, setInteractiveProjectCodes] = useState<string[]>([]);
  const [interactiveMatrixSelections, setInteractiveMatrixSelections] = useState<MatrixSelection[]>([]);
  const [interactiveCities, setInteractiveCities] = useState<string[]>([]);
  const [interactiveBuildingCategories, setInteractiveBuildingCategories] = useState<BuildingCategory[]>([]);

  // Selected project for matching recommendation modal
  const [selectedProject, setSelectedProject] = useState<ProjectPlan | null>(null);

  // Selected candidate for viewing full resume profile modal with photos
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<CandidateProfile | null>(null);

  // Selected project & candidates for Top-3 PK Modal (同案主管人才庫儀表板PK畫面)
  const [pkProject, setPkProject] = useState<ProjectPlan | null>(null);
  const [pkCandidates, setPkCandidates] = useState<CandidateProfile[]>([]);

  const handleOpenProjectPk = (project: ProjectPlan) => {
    const matches = matchCandidatesForProject(project, candidates);
    const top3 = matches.slice(0, 3).map((m) => m.candidate);
    setPkProject(project);
    setPkCandidates(top3.length > 0 ? top3 : candidates.slice(0, 3));
  };

  // Helper to calculate remaining days from base date
  const calculateRemainingDays = (selectionDateStr?: string) => {
    if (!selectionDateStr || selectionDateStr === '-') return 0;
    try {
      const parts = selectionDateStr.replace(/\//g, '-');
      const selTime = new Date(parts).getTime();
      const baseTime = new Date(baseDate).getTime();
      if (isNaN(selTime) || isNaN(baseTime)) return 0;
      return Math.ceil((selTime - baseTime) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Base filtered project list with normalized fields
  const baseFilteredProjects = useMemo(() => {
    return scopedProjects
      .map((p) => ({
        ...p,
        dynamicRemainingDays: calculateRemainingDays(p.selectionDate),
        normalizedRegion: normalizeRegionToSixCities(p.region),
        computedScaleTier: getProjectScaleTier(p),
      }))
      .filter((p) => {
        // Special conditions filter
        if (selectedSpecialCondition !== '全部') {
          if (selectedSpecialCondition === '合建/都更' && p.jointOrUrbanRenewal === '無') return false;
          if (selectedSpecialCondition === '防綜案' && p.defenseOrComprehensive === '無') return false;
          if (selectedSpecialCondition === '危評案' && p.hazardAssessment === '無') return false;
          if (selectedSpecialCondition === '特殊工法' && p.specialMethod === '無') return false;
        }

        // Search keyword
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase();
          const matchCode = (p.projectCode || '').toLowerCase().includes(q);
          const matchReg = (p.normalizedRegion || '').toLowerCase().includes(q) || (p.region || '').toLowerCase().includes(q);
          const matchScale = (p.scaleType || '').toLowerCase().includes(q) || (p.computedScaleTier || '').toLowerCase().includes(q);
          const bCat = p.buildingCategory || getProjectBuildingCategory(p) || '';
          const matchCat = bCat.toLowerCase().includes(q);
          if (!matchCode && !matchReg && !matchScale && !matchCat) return false;
        }

        return true;
      });
  }, [scopedProjects, baseDate, selectedSpecialCondition, searchKeyword]);

  // 1. Projects for Left Matrix Calculation (filtered by interactiveYears, interactiveCities, interactiveBuildingCategories, interactiveProjectCodes)
  const matrixProjects = useMemo(() => {
    return baseFilteredProjects.filter((p) => {
      if (interactiveYears.length > 0) {
        if (!p.openYear || !interactiveYears.includes(p.openYear)) return false;
      }
      if (interactiveProjectCodes.length > 0) {
        if (!interactiveProjectCodes.includes(p.projectCode)) return false;
      }
      if (interactiveCities.length > 0) {
        const city = p.normalizedRegion;
        const displayCity = city === '其他縣市' ? '其他' : city;
        if (!interactiveCities.includes(displayCity) && !interactiveCities.includes(city)) {
          return false;
        }
      }
      if (interactiveBuildingCategories.length > 0) {
        const cat = p.buildingCategory || getProjectBuildingCategory(p);
        if (!interactiveBuildingCategories.includes(cat)) {
          return false;
        }
      }
      return true;
    });
  }, [baseFilteredProjects, interactiveYears, interactiveProjectCodes, interactiveCities, interactiveBuildingCategories]);

  // 2. Cross-matrix calculation (Scale Tier vs Quarter)
  const matrixData = useMemo(() => {
    const quarterSet = new Set<string>();
    scopedProjects.forEach((p) => {
      if (p.openQuarter) quarterSet.add(p.openQuarter);
    });
    matrixProjects.forEach((p) => {
      if (p.openQuarter) quarterSet.add(p.openQuarter);
    });

    const allQuarters = Array.from(quarterSet).sort();
    const matrix: Record<ScaleTier, Record<string, number>> = {
      特大型案: {},
      大型案: {},
      中型案: {},
      小型案: {},
    };
    const tierTotals: Record<ScaleTier, number> = {
      特大型案: 0,
      大型案: 0,
      中型案: 0,
      小型案: 0,
    };
    const quarterTotals: Record<string, number> = {};

    SCALE_TIERS.forEach((tier) => {
      matrix[tier] = {};
      allQuarters.forEach((q) => {
        matrix[tier][q] = 0;
      });
    });
    allQuarters.forEach((q) => {
      quarterTotals[q] = 0;
    });

    matrixProjects.forEach((p) => {
      const tier = p.computedScaleTier;
      const q = p.openQuarter;
      if (matrix[tier] && q && matrix[tier][q] !== undefined) {
        matrix[tier][q] += 1;
        tierTotals[tier] += 1;
        quarterTotals[q] += 1;
      }
    });

    const totalCount = Object.values(quarterTotals).reduce((sum, val) => sum + val, 0);

    return { allQuarters, matrix, tierTotals, quarterTotals, totalCount };
  }, [scopedProjects, matrixProjects]);

  // 3. Projects for Right City Chart (filtered by interactiveYears, interactiveQuarters, interactiveProjectCodes, interactiveMatrixSelections, and interactiveBuildingCategories if selected)
  const cityProjects = useMemo(() => {
    return baseFilteredProjects.filter((p) => {
      if (interactiveYears.length > 0) {
        if (!p.openYear || !interactiveYears.includes(p.openYear)) return false;
      }
      if (interactiveQuarters.length > 0) {
        if (!p.openQuarter || !interactiveQuarters.includes(p.openQuarter)) return false;
      }
      if (interactiveProjectCodes.length > 0) {
        if (!interactiveProjectCodes.includes(p.projectCode)) return false;
      }
      if (interactiveMatrixSelections.length > 0) {
        const matchesMatrix = interactiveMatrixSelections.some((sel) => {
          if (sel.type === 'cell') {
            return p.computedScaleTier === sel.tier && p.openQuarter === sel.quarter;
          }
          if (sel.type === 'tier') {
            return p.computedScaleTier === sel.tier;
          }
          if (sel.type === 'quarter') {
            return p.openQuarter === sel.quarter;
          }
          return false;
        });
        if (!matchesMatrix) return false;
      }
      if (interactiveBuildingCategories.length > 0) {
        const cat = p.buildingCategory || getProjectBuildingCategory(p);
        if (!interactiveBuildingCategories.includes(cat)) {
          return false;
        }
      }
      return true;
    });
  }, [baseFilteredProjects, interactiveYears, interactiveQuarters, interactiveProjectCodes, interactiveMatrixSelections, interactiveBuildingCategories]);

  // 4. Six Cities Distribution Data
  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      台北市: 0,
      新北市: 0,
      桃園市: 0,
      台中市: 0,
      台南市: 0,
      高雄市: 0,
      其他: 0,
    };

    cityProjects.forEach((p) => {
      const city = p.normalizedRegion;
      const displayKey = city === '其他縣市' ? '其他' : city;
      if (counts[displayKey] !== undefined) {
        counts[displayKey] += 1;
      } else {
        counts['其他'] += 1;
      }
    });

    const totalCount = cityProjects.length;

    // Find main region
    let mainRegion = '無';
    let maxCount = 0;
    Object.entries(counts).forEach(([reg, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        mainRegion = reg;
      }
    });
    const mainPercentage = totalCount > 0 ? Math.round((maxCount / totalCount) * 100) : 0;

    return { counts, totalCount, mainRegion, mainPercentage };
  }, [cityProjects]);

  // 5. Projects for Building Category Chart (filtered by interactiveYears, interactiveQuarters, interactiveProjectCodes, interactiveMatrixSelections, and interactiveCities if selected)
  const categoryProjects = useMemo(() => {
    return baseFilteredProjects.filter((p) => {
      if (interactiveYears.length > 0) {
        if (!p.openYear || !interactiveYears.includes(p.openYear)) return false;
      }
      if (interactiveQuarters.length > 0) {
        if (!p.openQuarter || !interactiveQuarters.includes(p.openQuarter)) return false;
      }
      if (interactiveProjectCodes.length > 0) {
        if (!interactiveProjectCodes.includes(p.projectCode)) return false;
      }
      if (interactiveMatrixSelections.length > 0) {
        const matchesMatrix = interactiveMatrixSelections.some((sel) => {
          if (sel.type === 'cell') {
            return p.computedScaleTier === sel.tier && p.openQuarter === sel.quarter;
          }
          if (sel.type === 'tier') {
            return p.computedScaleTier === sel.tier;
          }
          if (sel.type === 'quarter') {
            return p.openQuarter === sel.quarter;
          }
          return false;
        });
        if (!matchesMatrix) return false;
      }
      if (interactiveCities.length > 0) {
        const city = p.normalizedRegion;
        const displayCity = city === '其他縣市' ? '其他' : city;
        if (!interactiveCities.includes(displayCity) && !interactiveCities.includes(city)) {
          return false;
        }
      }
      return true;
    });
  }, [baseFilteredProjects, interactiveYears, interactiveQuarters, interactiveProjectCodes, interactiveMatrixSelections, interactiveCities]);

  // 6. Building Category Distribution Data (住宅 / 廠辦 / 商辦 / 專案)
  const categoryDistribution = useMemo(() => {
    const counts: Record<BuildingCategory, number> = {
      住宅: 0,
      廠辦: 0,
      商辦: 0,
      專案: 0,
    };
    const floorAreas: Record<BuildingCategory, number> = {
      住宅: 0,
      廠辦: 0,
      商辦: 0,
      專案: 0,
    };

    categoryProjects.forEach((p) => {
      const cat = p.buildingCategory || getProjectBuildingCategory(p);
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
        floorAreas[cat] += Number(p.totalFloorArea || 0);
      } else {
        counts['住宅'] += 1;
        floorAreas['住宅'] += Number(p.totalFloorArea || 0);
      }
    });

    const totalCount = categoryProjects.length;
    const totalFloorAreaSum = Object.values(floorAreas).reduce((a, b) => a + b, 0);

    let mainCategory: BuildingCategory = '住宅';
    let maxCount = -1;
    BUILDING_CATEGORIES.forEach((cat) => {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        mainCategory = cat;
      }
    });
    const mainPercentage = totalCount > 0 ? Math.round((maxCount / totalCount) * 100) : 0;

    return { counts, floorAreas, totalCount, totalFloorAreaSum, mainCategory, mainPercentage };
  }, [categoryProjects]);

  // 7. Filtered projects before sorting
  const filteredProjectsUnsorted = useMemo(() => {
    return baseFilteredProjects.filter((p) => {
      // Year Cross-Filter
      if (interactiveYears.length > 0) {
        if (!p.openYear || !interactiveYears.includes(p.openYear)) return false;
      }

      // Quarter Cross-Filter
      if (interactiveQuarters.length > 0) {
        if (!p.openQuarter || !interactiveQuarters.includes(p.openQuarter)) return false;
      }

      // Project Code Cross-Filter
      if (interactiveProjectCodes.length > 0) {
        if (!interactiveProjectCodes.includes(p.projectCode)) return false;
      }

      // Matrix Cross-Filter
      if (interactiveMatrixSelections.length > 0) {
        const matchesMatrix = interactiveMatrixSelections.some((sel) => {
          if (sel.type === 'cell') {
            return p.computedScaleTier === sel.tier && p.openQuarter === sel.quarter;
          }
          if (sel.type === 'tier') {
            return p.computedScaleTier === sel.tier;
          }
          if (sel.type === 'quarter') {
            return p.openQuarter === sel.quarter;
          }
          return false;
        });
        if (!matchesMatrix) return false;
      }

      // City Cross-Filter
      if (interactiveCities.length > 0) {
        const city = p.normalizedRegion;
        const displayCity = city === '其他縣市' ? '其他' : city;
        if (!interactiveCities.includes(displayCity) && !interactiveCities.includes(city)) {
          return false;
        }
      }

      // Building Category Cross-Filter
      if (interactiveBuildingCategories.length > 0) {
        const cat = p.buildingCategory || getProjectBuildingCategory(p);
        if (!interactiveBuildingCategories.includes(cat)) {
          return false;
        }
      }

      // Quick filter tabs
      if (urgencyQuickFilter === 'urgent60' && p.dynamicRemainingDays > 60) return false;
      if (urgencyQuickFilter === 'moderate120' && (p.dynamicRemainingDays <= 60 || p.dynamicRemainingDays > 120)) return false;
      if (urgencyQuickFilter === 'largeTier' && !(p.computedScaleTier === '特大型案' || p.computedScaleTier === '大型案')) return false;
      if (urgencyQuickFilter === 'urbanSpecial' && p.jointOrUrbanRenewal === '無' && p.specialMethod === '無') return false;

      return true;
    });
  }, [baseFilteredProjects, interactiveYears, interactiveQuarters, interactiveProjectCodes, interactiveMatrixSelections, interactiveCities, interactiveBuildingCategories, urgencyQuickFilter]);

  // 8. Sorted Projects
  const filteredProjects = useMemo(() => {
    return [...filteredProjectsUnsorted].sort((a, b) => {
      let valA: any = a.projectCode;
      let valB: any = b.projectCode;

      if (sortField === 'projectCode') {
        valA = a.projectCode;
        valB = b.projectCode;
      } else if (sortField === 'buildingCategory') {
        valA = a.buildingCategory || getProjectBuildingCategory(a);
        valB = b.buildingCategory || getProjectBuildingCategory(b);
      } else if (sortField === 'region') {
        valA = a.region || a.normalizedRegion;
        valB = b.region || b.normalizedRegion;
      } else if (sortField === 'scaleTier') {
        valA = a.totalFloorArea;
        valB = b.totalFloorArea;
      } else if (sortField === 'selectionDate') {
        valA = a.selectionDate || '';
        valB = b.selectionDate || '';
      } else if (sortField === 'remainingDays') {
        valA = a.dynamicRemainingDays;
        valB = b.dynamicRemainingDays;
      } else if (sortField === 'totalFloorArea') {
        valA = a.totalFloorArea;
        valB = b.totalFloorArea;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProjectsUnsorted, sortField, sortOrder]);

  // Toggle sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Table zoom & single-page presentation helpers
  const handleToggleSinglePageFit = () => {
    if (isSinglePageMode) {
      setIsSinglePageMode(false);
      setTableScale(100);
    } else {
      setIsSinglePageMode(true);
      const rowCount = filteredProjects.length;
      if (rowCount <= 6) {
        setTableScale(90);
      } else if (rowCount <= 12) {
        setTableScale(80);
      } else if (rowCount <= 18) {
        setTableScale(72);
      } else if (rowCount <= 26) {
        setTableScale(62);
      } else if (rowCount <= 36) {
        setTableScale(55);
      } else {
        setTableScale(48);
      }
    }
  };

  const handleZoomIn = () => {
    setTableScale((prev) => Math.min(130, prev + 5));
  };

  const handleZoomOut = () => {
    setTableScale((prev) => Math.max(40, prev - 5));
  };

  const handleSetScale = (scale: number) => {
    setTableScale(scale);
    if (scale === 100) {
      setIsSinglePageMode(false);
    }
  };

  const handleResetTableScale = () => {
    setTableScale(100);
    setIsSinglePageMode(false);
  };

  // Dynamic density calculation based on scale and single-page mode
  const tableDensity = useMemo(() => {
    if (tableScale <= 60 || (isSinglePageMode && filteredProjects.length > 22)) {
      return {
        level: 'ultra',
        thClass: 'py-1.5 px-2 text-[10.5px]',
        tdClass: 'py-1 px-2 text-[10.5px]',
        badgeClass: 'px-1.5 py-0 text-[9.5px]',
        btnClass: 'px-2 py-0.5 text-[9.5px]',
        iconSize: 'w-3 h-3',
        minWidth: 'min-w-[1080px]',
      };
    }
    if (tableScale <= 75 || isSinglePageMode) {
      return {
        level: 'compact',
        thClass: 'py-2 px-2.5 text-[11.5px]',
        tdClass: 'py-1.5 px-2.5 text-[11.5px]',
        badgeClass: 'px-2 py-0.5 text-[10.5px]',
        btnClass: 'px-2.5 py-0.5 text-[10.5px]',
        iconSize: 'w-3.5 h-3.5',
        minWidth: 'min-w-[1240px]',
      };
    }
    if (tableScale <= 88) {
      return {
        level: 'moderate',
        thClass: 'py-2.5 px-3 text-xs',
        tdClass: 'py-2 px-3 text-xs',
        badgeClass: 'px-2 py-0.5 text-xs',
        btnClass: 'px-2.5 py-1 text-xs',
        iconSize: 'w-3.5 h-3.5',
        minWidth: 'min-w-[1360px]',
      };
    }
    return {
      level: 'normal',
      thClass: 'py-3.5 px-3.5 text-xs sm:text-sm',
      tdClass: 'py-3 px-3 text-xs sm:text-sm',
      badgeClass: 'px-2.5 py-1 text-xs',
      btnClass: 'px-3 py-1.5 text-xs',
      iconSize: 'w-3.5 h-3.5',
      minWidth: 'min-w-[1480px]',
    };
  }, [tableScale, isSinglePageMode, filteredProjects.length]);

  // 7. Calculate Top Strategic Metric Cards & Year Statistics
  const allOpenYears = useMemo(() => {
    const counts: Record<number, number> = {};
    scopedProjects.forEach((p) => {
      if (p.openYear) {
        counts[p.openYear] = (counts[p.openYear] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([y, c]) => ({ year: Number(y), totalCount: c }))
      .sort((a, b) => a.year - b.year);
  }, [scopedProjects]);

  const peakYears = useMemo(() => {
    const counts: Record<number, number> = {};
    baseFilteredProjects.forEach((p) => {
      if (p.openYear) {
        counts[p.openYear] = (counts[p.openYear] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([y, c]) => ({ year: Number(y), count: c }))
      .sort((a, b) => b.count - a.count || a.year - b.year)
      .slice(0, 2);
  }, [baseFilteredProjects]);

  const peakQuarter = useMemo(() => {
    const counts: Record<string, number> = {};
    baseFilteredProjects.forEach((p) => {
      if (p.openQuarter) {
        counts[p.openQuarter] = (counts[p.openQuarter] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return { rawQuarter: '', quarterLabel: '-', count: 0 };
    const [q, c] = sorted[0];
    return { rawQuarter: q, quarterLabel: q.replace('Q', '年Q'), count: c };
  }, [baseFilteredProjects]);

  const nextQuarterInfo = useMemo(() => {
    const d = new Date(baseDate.replace(/\//g, '-'));
    let baseYear = d.getFullYear();
    let baseMonth = d.getMonth() + 1;
    if (isNaN(baseYear)) {
      baseYear = 2026;
      baseMonth = 6;
    }
    const currentQNum = Math.ceil(baseMonth / 3);
    const currentQuarter = `${baseYear}Q${currentQNum}`;

    const quartersWithProjects: Record<string, ProjectPlan[]> = {};
    baseFilteredProjects.forEach((p) => {
      if (p.openQuarter) {
        if (!quartersWithProjects[p.openQuarter]) {
          quartersWithProjects[p.openQuarter] = [];
        }
        quartersWithProjects[p.openQuarter].push(p);
      }
    });
    const sortedQuarters = Object.keys(quartersWithProjects).sort();
    if (sortedQuarters.length === 0) {
      return { quarter: '', quarterLabel: '-', count: 0, projectCodes: [], projects: [] };
    }
    const upcomingQuarters = sortedQuarters.filter((q) => q > currentQuarter);
    const targetQ = upcomingQuarters.length > 0 ? upcomingQuarters[0] : sortedQuarters[0];
    const projs = quartersWithProjects[targetQ] || [];
    return {
      quarter: targetQ,
      quarterLabel: targetQ.replace('Q', '年Q'),
      count: projs.length,
      projectCodes: projs.map((p) => p.projectCode),
      projects: projs,
    };
  }, [baseFilteredProjects, baseDate]);

  // Counts for quick filter badges
  const quickFilterCounts = useMemo(() => {
    let urgent = 0;
    let moderate = 0;
    let large = 0;
    let special = 0;

    baseFilteredProjects.forEach((p) => {
      if (p.dynamicRemainingDays <= 60) urgent++;
      if (p.dynamicRemainingDays > 60 && p.dynamicRemainingDays <= 120) moderate++;
      if (p.computedScaleTier === '特大型案' || p.computedScaleTier === '大型案') large++;
      if (p.jointOrUrbanRenewal !== '無' || p.specialMethod !== '無') special++;
    });

    return { total: baseFilteredProjects.length, urgent, moderate, large, special };
  }, [baseFilteredProjects]);

  // Smooth scroll helper when user explicitly wants to navigate to the table
  const scrollToTable = () => {
    const tableEl = document.getElementById('project-plan-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Matrix Filter Helper (Multi-Selection) - stays in place without jumping
  const handleMatrixClick = (
    type: 'cell' | 'tier' | 'quarter',
    tier?: ScaleTier,
    quarter?: string,
    customLabel?: string
  ) => {
    let id = '';
    let label = '';

    if (type === 'cell') {
      id = `cell:${tier}:${quarter}`;
      label = `${tier} · ${quarter}`;
    } else if (type === 'tier') {
      id = `tier:${tier}`;
      label = `${tier}`;
    } else if (type === 'quarter') {
      id = `quarter:${quarter}`;
      label = `${quarter} 季度`;
    }
    if (customLabel) label = customLabel;

    setInteractiveMatrixSelections((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      } else {
        return [...prev, { id, type, tier, quarter, label }];
      }
    });
  };

  const handleRemoveMatrixSelection = (id: string) => {
    setInteractiveMatrixSelections((prev) => prev.filter((item) => item.id !== id));
  };

  // Year Filter Helper (Multi-Selection)
  const toggleInteractiveYear = (year: number) => {
    setInteractiveYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Quarter Filter Helper (Multi-Selection)
  const toggleInteractiveQuarter = (quarter: string) => {
    setInteractiveQuarters((prev) =>
      prev.includes(quarter) ? prev.filter((q) => q !== quarter) : [...prev, quarter]
    );
  };

  // Project Code Filter Helper (Multi-Selection)
  const toggleInteractiveProjectCode = (code: string) => {
    setInteractiveProjectCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // City Filter Helper (Multi-Selection) - stays in place without jumping
  const handleCityClick = (cityName: string) => {
    setInteractiveCities((prev) =>
      prev.includes(cityName) ? prev.filter((c) => c !== cityName) : [...prev, cityName]
    );
  };

  // Building Category Filter Helper (Multi-Selection) - stays in place without jumping
  const handleBuildingCategoryClick = (category: BuildingCategory) => {
    setInteractiveBuildingCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Clear all interactive chart cross-filters
  const handleClearAllInteractiveFilters = () => {
    setInteractiveYears([]);
    setInteractiveQuarters([]);
    setInteractiveProjectCodes([]);
    setInteractiveMatrixSelections([]);
    setInteractiveCities([]);
    setInteractiveBuildingCategories([]);
  };

  const hasActiveInteractiveFilters =
    interactiveYears.length > 0 ||
    interactiveQuarters.length > 0 ||
    interactiveProjectCodes.length > 0 ||
    interactiveMatrixSelections.length > 0 ||
    interactiveCities.length > 0 ||
    interactiveBuildingCategories.length > 0;

  // Match calculations for selected project modal
  const matchedLeaders = useMemo(() => {
    if (!selectedProject) return [];
    return matchCandidatesForProject(selectedProject, candidates);
  }, [selectedProject, candidates]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('project-plan-dashboard-content', {
        filename: `遠雄營造_開案計畫儀表板報告_A3橫式_${baseDate}_${new Date().toISOString().slice(0, 10)}`,
        title: '遠雄營造 開案計畫 儀表板戰情報告 (A3 橫式)',
        subtitle: `資料基礎日：${baseDate} · 待遴選案場：${filteredProjects.length} 案 · 內部決策與主管排程專用`,
        landscape: true,
        paperSize: 'a3',
        fixedWidth: 1584,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map((p) => ({
      案別代碼: p.projectCode,
      工程類型: p.buildingCategory || getProjectBuildingCategory(p),
      區域: p.region || p.normalizedRegion,
      規模級距: p.computedScaleTier,
      開案規模類型: p.scaleType,
      'C-45案主管遴選日': p.selectionDate,
      距離遴選剩餘天數: p.dynamicRemainingDays,
      'C+75/90開工日': p.startWorkDate,
      C建照日: p.permitDate,
      '總樓地板面積(㎡)': p.totalFloorArea,
      地下層: p.undergroundFloors,
      地上層: p.abovegroundFloors,
      棟數: p.buildingsCount,
      戶數: p.unitsCount,
      '合建/都更案': p.jointOrUrbanRenewal,
      防綜案: p.defenseOrComprehensive,
      危評案: p.hazardAssessment,
      特殊工法: p.specialMethod,
    }));
    exportToExcel(exportData, `遠雄營造_開案計畫資料_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <PrintWrapper
      id="project-plan-dashboard-content"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4"
      documentTitle="遠雄營造 開案計畫 儀表板戰情報告"
    >
      {/* Top Banner & Header */}
      <div data-pdf-block="true" className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs pdf-block-avoid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                開案計畫 儀表板
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                C-45 案主管遴選排程管理
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              以資料基礎日 <strong className="text-blue-700 font-mono font-bold">{baseDate}</strong> 為推算核心 · 即時計算開工時程、建照時程及主管最適適配度
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Data Base Date Picker */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/90 border border-blue-200/80 rounded-lg shadow-2xs">
              <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
              <label className="text-xs font-bold text-blue-900 whitespace-nowrap">資料基礎日：</label>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="py-0.5 px-2 text-xs font-mono font-bold text-blue-950 bg-white border border-blue-300 rounded shadow-2xs focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              />
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋代碼 / 六都 / 規模..."
                className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 w-44 bg-white outline-none placeholder:text-slate-400"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Special Condition Filter Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                showAdvancedFilters || selectedSpecialCondition !== '全部'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="特殊屬性條件篩選"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>條件</span>
              {selectedSpecialCondition !== '全部' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              )}
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Dedicated A3 Print & PDF Export Controller */}
            <A3PrintPdfController
              targetElementId="project-plan-dashboard-content"
              documentTitle="遠雄營造 開案計畫 儀表板戰情報告"
              subtitle={`資料基礎日：${baseDate} · 待遴選案場：${filteredProjects.length} 案 · 內部決策與主管排程專用`}
              baseDate={baseDate}
              buttonLabel="匯出PDF"
              variant="rose"
            />

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              匯出 Excel
            </button>
          </div>
        </div>

        {/* Collapsible Filter for Special Attributes */}
        {showAdvancedFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              特殊工法與法規條件：
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {['全部', '合建/都更', '防綜案', '危評案', '特殊工法'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedSpecialCondition(cond)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    selectedSpecialCondition === cond
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            {selectedSpecialCondition !== '全部' && (
              <button
                onClick={() => setSelectedSpecialCondition('全部')}
                className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
              >
                重設條件
              </button>
            )}
          </div>
        )}
      </div>

      {/* 頂部指標區：左側待遴選案場卡片 + 右側拆為上下兩欄 (上欄：所有待開案年度及當年度案數；下欄：其餘4張指標卡片) */}
      <div data-pdf-block="true" className="flex flex-col lg:flex-row gap-3.5 items-stretch pdf-block-avoid">
        {/* 左側卡片: 待遴選案場 */}
        <div
          onClick={handleClearAllInteractiveFilters}
          className={`w-full lg:w-60 shrink-0 bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-xs ${
            hasActiveInteractiveFilters
              ? 'border-blue-300 ring-2 ring-blue-100'
              : 'border-slate-200/90'
          }`}
          title="點擊可重設所有交叉篩選，顯示全體案場"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">待遴選案場</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 border border-rose-100/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-black text-rose-600 tracking-tight font-sans">
              {filteredProjects.length}
            </span>
            <span className="text-base font-bold text-slate-500">案</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {hasActiveInteractiveFilters ? (
                <span>篩選中 <strong className="text-rose-600 font-bold">{filteredProjects.length}</strong> / {scopedProjects.length} 案</span>
              ) : (
                <span>總計 {scopedProjects.length} 案</span>
              )}
            </span>
            {hasActiveInteractiveFilters && (
              <span className="text-blue-600 font-bold text-[11px] group-hover:underline">
                重設
              </span>
            )}
          </div>
        </div>

        {/* 右側區域：拆分為上下兩欄 */}
        <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
          {/* 上欄：呈現所有待開案年度及當年度案數 */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-1 shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>待開案年度及案數：</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {allOpenYears.map(({ year, totalCount }) => {
                  const isSelected = interactiveYears.includes(year);
                  return (
                    <button
                      key={year}
                      onClick={() => toggleInteractiveYear(year)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200/90 hover:border-blue-200'
                      }`}
                      title={`點擊多選/取消 ${year} 年度案場並連動清冊`}
                    >
                      <span>{year}年</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-xs font-black font-mono ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : 'bg-white text-slate-900 border border-slate-200/60 shadow-2xs'
                        }`}
                      >
                        {totalCount}案
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {interactiveYears.length > 0 && (
              <button
                onClick={() => setInteractiveYears([])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors shrink-0"
              >
                清除年度 ({interactiveYears.length})
              </button>
            )}
          </div>

          {/* 下欄：呈現其餘 4 張指標卡片（高峰年度、高峰季度、下季度遴選數、下季度遴選案場） */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 卡片 1: 高峰年度 */}
            <div
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                peakYears.some((py) => interactiveYears.includes(py.year))
                  ? 'border-blue-400 ring-2 ring-blue-100'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700">高峰年度</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 border border-blue-100/60 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex flex-col gap-1">
                {!peakYears || peakYears.length === 0 ? (
                  <span className="text-sm font-bold text-slate-400">-</span>
                ) : (
                  peakYears.map((py, idx) => {
                    const isYearActive = interactiveYears.includes(py.year);
                    return (
                      <button
                        key={py.year}
                        onClick={() => toggleInteractiveYear(py.year)}
                        className={`flex items-baseline justify-between px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                          isYearActive
                            ? 'bg-blue-50 text-blue-900 font-bold'
                            : 'hover:bg-slate-50'
                        }`}
                        title={`點擊連動篩選 ${py.year} 年`}
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{py.year}年</span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${
                              idx === 0 ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {py.count}
                          </span>
                          <span className="text-xs font-bold text-slate-500">案</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 卡片 2: 高峰季度 */}
            <div
              onClick={() => {
                if (peakQuarter?.rawQuarter) {
                  toggleInteractiveQuarter(peakQuarter.rawQuarter);
                }
              }}
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer ${
                peakQuarter?.rawQuarter && interactiveQuarters.includes(peakQuarter.rawQuarter)
                  ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20'
                  : 'border-slate-200/90 hover:border-amber-200'
              }`}
              title="點擊連動篩選高峰季度"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700">高峰季度</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 border border-amber-100/60 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {peakQuarter?.quarterLabel || '-'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight font-sans">
                  {peakQuarter?.count || 0}
                </span>
                <span className="text-xs font-bold text-slate-500">案</span>
              </div>
            </div>

            {/* 卡片 3: 下季度遴選數 */}
            <div
              onClick={() => {
                if (nextQuarterInfo?.quarter) {
                  toggleInteractiveQuarter(nextQuarterInfo.quarter);
                }
              }}
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer ${
                nextQuarterInfo?.quarter && interactiveQuarters.includes(nextQuarterInfo.quarter)
                  ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/20'
                  : 'border-slate-200/90 hover:border-indigo-200'
              }`}
              title="點擊連動篩選下季度案場"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700">下季度遴選數</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100/60 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {nextQuarterInfo?.quarterLabel || '-'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight font-sans">
                  {nextQuarterInfo?.count || 0}
                </span>
                <span className="text-xs font-bold text-slate-500">案</span>
              </div>
            </div>

            {/* 卡片 4: 下季度遴選案場 (完整呈現所有案場，保證案數與清冊 100% 對應) */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-700">下季度遴選案場</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    共 {nextQuarterInfo?.projects.length || 0} 案
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100/60 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex flex-col gap-1 max-h-[86px] overflow-y-auto pr-0.5 custom-scrollbar">
                {(nextQuarterInfo?.projects || []).length > 0 ? (
                  nextQuarterInfo.projects.map((proj) => {
                    const isSelected = interactiveProjectCodes.includes(proj.projectCode);
                    return (
                      <button
                        key={proj.projectCode}
                        onClick={() => toggleInteractiveProjectCode(proj.projectCode)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-md border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200/80 hover:border-emerald-200'
                        }`}
                        title={`點擊連動篩選此案：${proj.projectCode}（${proj.region || proj.normalizedRegion}）`}
                      >
                        <span className="text-xs font-black font-mono text-slate-900">
                          {proj.projectCode}案
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                          {proj.region || proj.normalizedRegion}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 font-medium py-2">目前無待選案場</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: BI 交叉分析圖表 (時程規模矩陣 + 工程類型長條圖 + 六都建築統計) */}
      <div className="space-y-4">
        {/* Row 1: 開案規模及年度統計(依照C-45統計) */}
        <div data-pdf-block="true" className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between pdf-block-avoid">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">開案規模及年度統計 (依照 C-45 統計)</h2>
                {interactiveYears.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    連動年度：{interactiveYears.map((y) => `${y}年`).join('、')}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInteractiveYears([]);
                      }}
                      className="hover:text-blue-950 ml-0.5"
                      title="清除年度篩選"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {interactiveCities.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    連動區域：{interactiveCities.join('、')} ({matrixData.totalCount}案)
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInteractiveCities([]);
                      }}
                      className="hover:text-emerald-950 ml-0.5"
                      title="清除區域篩選"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {interactiveBuildingCategories.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    連動類型：{interactiveBuildingCategories.join('、')} ({matrixData.totalCount}案)
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInteractiveBuildingCategories([]);
                      }}
                      className="hover:text-indigo-950 ml-0.5"
                      title="清除工程類型篩選"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {interactiveMatrixSelections.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                    已選維度 ({interactiveMatrixSelections.length})
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInteractiveMatrixSelections([]);
                      }}
                      className="hover:text-blue-950 ml-0.5"
                      title="清除篩選"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                💡 點選儲存格或欄列即時連動清冊
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs sm:text-sm text-center border-collapse select-none">
                <thead>
                  <tr className="bg-slate-100 text-xs font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left">規模級距</th>
                    {matrixData.allQuarters.map((q) => {
                      const isColSelected =
                        interactiveMatrixSelections.some(
                          (s) => s.type === 'quarter' && s.quarter === q
                        ) || interactiveQuarters.includes(q);
                      return (
                        <th
                          key={q}
                          onClick={() => {
                            if (interactiveQuarters.includes(q)) {
                              toggleInteractiveQuarter(q);
                            } else {
                              handleMatrixClick('quarter', undefined, q, `${q} 季度`);
                            }
                          }}
                          title={`點擊多選/取消 ${q} 所有開案`}
                          className={`py-2 px-1 font-mono cursor-pointer transition-all hover:bg-blue-100/70 ${
                            isColSelected
                              ? 'bg-blue-600 text-white font-black shadow-xs'
                              : 'hover:text-blue-700'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{q}</span>
                            {isColSelected && (
                              <span className="text-[10px] text-blue-100 font-normal">已選</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-2.5 bg-slate-200/70 text-slate-900 font-extrabold">總計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {SCALE_TIERS.map((tier) => {
                    const totalInTier = matrixData.tierTotals[tier] || 0;
                    const isRowSelected = interactiveMatrixSelections.some(
                      (s) => s.type === 'tier' && s.tier === tier
                    );

                    return (
                      <tr
                        key={tier}
                        className={`transition-colors pdf-block-avoid ${
                          isRowSelected ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Scale Tier Row Header */}
                        <td
                          onClick={() => handleMatrixClick('tier', tier, undefined, `${tier}`)}
                          title={`點擊多選/取消 ${tier} 所有開案`}
                          className={`py-2 px-3 text-left font-semibold cursor-pointer transition-all ${
                            isRowSelected
                              ? 'text-blue-700 font-bold bg-blue-100/50'
                              : 'text-slate-800 hover:text-blue-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-sans text-xs sm:text-sm">
                            <span>{tier}</span>
                            {isRowSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                        </td>

                        {/* Cells */}
                        {matrixData.allQuarters.map((q) => {
                          const count = matrixData.matrix[tier]?.[q] || 0;
                          const isCellSelected = interactiveMatrixSelections.some(
                            (s) => s.type === 'cell' && s.tier === tier && s.quarter === q
                          );
                          const isColSelected = interactiveMatrixSelections.some(
                            (s) => s.type === 'quarter' && s.quarter === q
                          );

                          return (
                            <td
                              key={q}
                              onClick={() => {
                                if (count > 0) {
                                  handleMatrixClick('cell', tier, q, `${tier} · ${q}`);
                                }
                              }}
                              className={`py-1 px-1 transition-all ${
                                count > 0 ? 'cursor-pointer' : 'cursor-default'
                              } ${
                                isCellSelected
                                  ? 'bg-blue-100/80 ring-2 ring-blue-500 rounded-sm'
                                  : isRowSelected || isColSelected
                                  ? 'bg-blue-50/40'
                                  : ''
                              }`}
                            >
                              {count > 0 ? (
                                <span
                                  title={`點擊多選/取消 ${tier} ${q} (共 ${count} 案)`}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs sm:text-sm transition-all transform hover:scale-110 shadow-2xs ${
                                    isCellSelected
                                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                                      : count >= 3
                                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                                      : count >= 2
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                                  }`}
                                >
                                  {count}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Total */}
                        <td
                          onClick={() => handleMatrixClick('tier', tier, undefined, `${tier}`)}
                          title={`點擊多選/取消 ${tier} 總計 (${totalInTier} 案)`}
                          className={`py-2 px-2.5 font-bold cursor-pointer transition-colors text-xs sm:text-sm ${
                            isRowSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-50 text-slate-900 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {totalInTier > 0 ? totalInTier : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200 text-xs sm:text-sm pdf-block-avoid">
                    <td className="py-2 px-3 text-left text-slate-800 font-sans">總計</td>
                    {matrixData.allQuarters.map((q) => {
                      const isColSelected =
                        interactiveMatrixSelections.some(
                          (s) => s.type === 'quarter' && s.quarter === q
                        ) || interactiveQuarters.includes(q);
                      const qTotal = matrixData.quarterTotals[q] || 0;

                      return (
                        <td
                          key={q}
                          onClick={() => {
                            if (interactiveQuarters.includes(q)) {
                              toggleInteractiveQuarter(q);
                            } else {
                              handleMatrixClick('quarter', undefined, q, `${q} 季度`);
                            }
                          }}
                          title={`點擊多選/取消 ${q} 總計 (${qTotal} 案)`}
                          className={`py-2 px-1 cursor-pointer transition-colors ${
                            isColSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {qTotal > 0 ? qTotal : '-'}
                        </td>
                      );
                    })}
                    <td
                      onClick={handleClearAllInteractiveFilters}
                      title="點擊清除所有圖表多選連動篩選"
                      className="py-2 px-2.5 bg-slate-200 text-rose-600 font-black font-mono cursor-pointer hover:bg-rose-50 text-sm"
                    >
                      {matrixData.totalCount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <span>
              統計季度跨度：<strong className="text-slate-800 font-bold">{matrixData.allQuarters.length} 個季度</strong>
            </span>
            <span>
              總開案量：<strong className="text-blue-700 font-mono font-bold">{matrixData.totalCount} 案</strong>
            </span>
          </div>
        </div>

        {/* Row 2: 雙長條圖並列 (工程類型統計 + 六都建築統計) */}
        <div data-pdf-block="true" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pdf-block-avoid print-avoid-break">
          {/* Left: 工程類型統計 (住宅 / 廠辦 / 商辦 / 專案) */}
          <div data-pdf-block="true" className="lg:col-span-6 bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between pdf-block-avoid print-avoid-break">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">工程類型統計</h2>
                  {interactiveBuildingCategories.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                      已選 ({interactiveBuildingCategories.length})
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractiveBuildingCategories([]);
                        }}
                        className="hover:text-indigo-950 ml-0.5"
                        title="清除工程類型篩選"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {interactiveCities.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      連動區域 ({interactiveCities.length})
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  💡 點選長條圖可切換多選連動
                </span>
              </div>

              <div className="space-y-2.5">
                {BUILDING_CATEGORIES.map((cat) => {
                  const count = categoryDistribution.counts[cat] || 0;
                  const percentage =
                    categoryDistribution.totalCount > 0
                      ? Math.round((count / categoryDistribution.totalCount) * 100)
                      : 0;
                  const isSelected = interactiveBuildingCategories.includes(cat);
                  const isMuted = interactiveBuildingCategories.length > 0 && !isSelected;

                  const meta = {
                    住宅: {
                      icon: Home,
                      color: 'text-blue-700',
                      bgActive: 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-400 shadow-2xs',
                      barBg: 'bg-blue-600',
                      subText: '住宅大樓、大型社區',
                    },
                    廠辦: {
                      icon: Factory,
                      color: 'text-amber-800',
                      bgActive: 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400 shadow-2xs',
                      barBg: 'bg-amber-500',
                      subText: '科技廠房、工業園區',
                    },
                    商辦: {
                      icon: Briefcase,
                      color: 'text-indigo-700',
                      bgActive: 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400 shadow-2xs',
                      barBg: 'bg-indigo-600',
                      subText: '商業辦公大樓、企業總部',
                    },
                    專案: {
                      icon: Sparkles,
                      color: 'text-emerald-700',
                      bgActive: 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400 shadow-2xs',
                      barBg: 'bg-emerald-600',
                      subText: '特殊專案、統包工程',
                    },
                  }[cat];

                  const IconComp = meta.icon;

                  return (
                    <div
                      key={cat}
                      onClick={() => handleBuildingCategoryClick(cat)}
                      title={`點擊多選/取消【${cat}】並連動時程矩陣與清冊`}
                      className={`px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                        isSelected
                          ? meta.bgActive
                          : isMuted
                          ? 'opacity-40 hover:opacity-90 hover:bg-slate-50 border-transparent'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
                        <span
                          className={`flex items-center gap-1.5 font-bold ${
                            isSelected ? meta.color : 'text-slate-800'
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? meta.color : 'text-slate-500'}`} />
                          <span>{cat}</span>
                          <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">({meta.subText})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isSelected ? meta.color : 'text-slate-900'
                            }`}
                          >
                            {count} 案{' '}
                            <span className="text-slate-400 font-normal text-xs">({percentage}%)</span>
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${meta.barBg}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-600">
              <span>
                主要類型：<strong className="text-slate-800 font-bold">{categoryDistribution.mainCategory}</strong> ({categoryDistribution.mainPercentage}%)
              </span>
              <span>
                統計案數：<strong className="text-slate-800 font-bold">{categoryDistribution.totalCount} 案</strong>
              </span>
            </div>
          </div>

          {/* Right: 六都建築統計 */}
          <div data-pdf-block="true" className="lg:col-span-6 bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between pdf-block-avoid print-avoid-break">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">六都建築統計</h2>
                  {interactiveCities.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                      已選 ({interactiveCities.length})
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractiveCities([]);
                        }}
                        className="hover:text-blue-950 ml-0.5"
                        title="清除區域篩選"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {interactiveBuildingCategories.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      連動類型 ({interactiveBuildingCategories.length})
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  💡 點選長條圖可切換多選
                </span>
              </div>

              <div className="space-y-1.5">
                {CITIES_LIST.map((cityName) => {
                  const count = cityDistribution.counts[cityName] || 0;
                  const percentage =
                    cityDistribution.totalCount > 0
                      ? Math.round((count / cityDistribution.totalCount) * 100)
                      : 0;
                  const isSelected = interactiveCities.includes(cityName);
                  const isMuted = interactiveCities.length > 0 && !isSelected;

                  return (
                    <div
                      key={cityName}
                      onClick={() => handleCityClick(cityName)}
                      title={`點擊多選/取消【${cityName}】開案並連動需求時程分佈`}
                      className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-300 shadow-2xs ring-1 ring-blue-400'
                          : isMuted
                          ? 'opacity-40 hover:opacity-90 hover:bg-slate-50 border-transparent'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between text-xs sm:text-sm font-medium mb-1">
                        <span
                          className={`flex items-center gap-1.5 font-bold ${
                            isSelected ? 'text-blue-900' : 'text-slate-800'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                          {cityName}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isSelected ? 'text-blue-700' : 'text-slate-900'
                          }`}
                        >
                          {count} 案{' '}
                          <span className="text-slate-400 font-normal text-xs">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isSelected
                              ? 'bg-blue-600 shadow-2xs'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-600">
              <span>
                主要區域：<strong className="text-slate-800 font-bold">{cityDistribution.mainRegion}</strong> ({cityDistribution.mainPercentage}%)
              </span>
              <span>
                統計案數：<strong className="text-slate-800 font-bold">{cityDistribution.totalCount} 案</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Interactive Filter Banner (Power BI Style Multi-Select Bar) */}
      {hasActiveInteractiveFilters && (
        <div className="flex flex-wrap items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2 rounded-xl shadow-xs animate-in fade-in duration-150 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              圖表多選連動中：
            </span>
            {interactiveYears.map((year) => (
              <span
                key={year}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-700 text-white font-medium shadow-2xs text-xs"
              >
                <span>年度：{year}年</span>
                <button
                  onClick={() => toggleInteractiveYear(year)}
                  className="hover:bg-blue-800 p-0.5 rounded"
                  title="移除此年度篩選"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interactiveQuarters.map((quarter) => (
              <span
                key={quarter}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-600 text-white font-medium shadow-2xs text-xs"
              >
                <span>季度：{quarter}</span>
                <button
                  onClick={() => toggleInteractiveQuarter(quarter)}
                  className="hover:bg-amber-700 p-0.5 rounded"
                  title="移除此季度篩選"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interactiveProjectCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-700 text-white font-medium shadow-2xs text-xs"
              >
                <span>案場：{code}案</span>
                <button
                  onClick={() => toggleInteractiveProjectCode(code)}
                  className="hover:bg-emerald-800 p-0.5 rounded"
                  title="移除此案場篩選"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interactiveMatrixSelections.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-600 text-white font-medium shadow-2xs text-xs"
              >
                <span>時程/規模：{item.label}</span>
                <button
                  onClick={() => handleRemoveMatrixSelection(item.id)}
                  className="hover:bg-blue-700 p-0.5 rounded"
                  title="移除此項目"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interactiveCities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-600 text-white font-medium shadow-2xs text-xs"
              >
                <span>區域：{city}</span>
                <button
                  onClick={() => handleCityClick(city)}
                  className="hover:bg-teal-700 p-0.5 rounded"
                  title="移除此區域"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interactiveBuildingCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-medium shadow-2xs text-xs"
              >
                <span>類型：{cat}</span>
                <button
                  onClick={() => handleBuildingCategoryClick(cat)}
                  className="hover:bg-indigo-700 p-0.5 rounded"
                  title="移除此工程類型"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <span className="text-slate-600 text-[11px] ml-1">
              (符合：<strong className="text-blue-700 font-mono font-bold">{filteredProjects.length}</strong> / {scopedProjects.length} 案)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={scrollToTable}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 hover:bg-blue-100/80 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
              title="平滑滾動至下方清冊"
            >
              <span>查看下方清冊 ({filteredProjects.length})</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAllInteractiveFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline px-1"
            >
              清除全部圖表連動
            </button>
          </div>
        </div>
      )}

      {/* Backdrop when Table is in Fullscreen mode */}
      {isTableFullscreen && (
        <div
          onClick={() => setIsTableFullscreen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        />
      )}

      {/* Main Table: 開案計畫與遴選倒數清冊 */}
      <div
        data-pdf-block="true"
        id="project-plan-table-container"
        className={`bg-white transition-all scroll-mt-4 pdf-block-avoid ${
          isTableFullscreen
            ? 'fixed inset-2 sm:inset-5 z-50 rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-40px)] overflow-hidden'
            : 'rounded-xl border border-slate-200/80 shadow-xs overflow-hidden'
        }`}
      >
        {/* Table Top Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>開案計畫與遴選倒數清冊</span>
                <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                  (點擊案別可查看推薦名冊與適配分析)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 sm:hidden">
                點擊案別可查看推薦名冊與適配分析
              </p>
            </div>
          </div>

          {/* Fast Urgency Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <button
              onClick={() => setUrgencyQuickFilter('all')}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                urgencyQuickFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部 ({quickFilterCounts.total})
            </button>
            <button
              onClick={() => setUrgencyQuickFilter('urgent60')}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                urgencyQuickFilter === 'urgent60'
                  ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-2xs'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              60天內緊急 ({quickFilterCounts.urgent})
            </button>
            <button
              onClick={() => setUrgencyQuickFilter('moderate120')}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                urgencyQuickFilter === 'moderate120'
                  ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-2xs'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              61-120天 ({quickFilterCounts.moderate})
            </button>
            <button
              onClick={() => setUrgencyQuickFilter('largeTier')}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                urgencyQuickFilter === 'largeTier'
                  ? 'bg-slate-800 text-white border-slate-800 font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              大型/特大型 ({quickFilterCounts.large})
            </button>
            <button
              onClick={() => setUrgencyQuickFilter('urbanSpecial')}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                urgencyQuickFilter === 'urbanSpecial'
                  ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-2xs'
                  : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
              }`}
            >
              都更/特殊工法 ({quickFilterCounts.special})
            </button>
          </div>
        </div>

        {/* Dedicated Table Scale & Single-Page Fit Toolbar */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: 一頁呈現 Auto-Fit Toggle & Active Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSinglePageFit}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-2xs cursor-pointer active:scale-95 ${
                isSinglePageMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-emerald-600/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-emerald-500 hover:text-emerald-700'
              }`}
              title="自動計算最佳縮放比例與緊湊密度，消除內部垂直滾動條，讓全部案場資訊於單頁完整呈現"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSinglePageMode ? 'text-amber-200 animate-spin' : 'text-emerald-600'}`} />
              <span>{isSinglePageMode ? `一頁呈現中 (${tableScale}%)` : '⚡ 一頁呈現 (Auto Fit)'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <span>共</span>
              <span className="font-bold font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {filteredProjects.length}
              </span>
              <span>筆案場</span>
              {isSinglePageMode && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  全展現 · 零內部滾動
                </span>
              )}
            </div>
          </div>

          {/* Right: Scale Controls, Presets, Fullscreen */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium hidden md:inline text-xs">清冊獨立縮放：</span>

            {/* Fast Scale Presets */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              {[
                { label: '100%', val: 100 },
                { label: '85%', val: 85 },
                { label: '70%', val: 70 },
                { label: '55%', val: 55 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleSetScale(preset.val)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                    tableScale === preset.val && !isSinglePageMode
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={`切換縮放比例為 ${preset.val}%`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Stepper Zoom Buttons */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={tableScale <= 40}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="縮小清冊 (每次 -5%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-xs font-bold text-slate-800 min-w-[38px] text-center">
                {tableScale}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={tableScale >= 130}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="放大清冊 (每次 +5%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset */}
            {(tableScale !== 100 || isSinglePageMode) && (
              <button
                type="button"
                onClick={handleResetTableScale}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="還原預設 100% 比例與標準滾動模式"
              >
                <RotateCcw className="w-3 h-3" />
                <span>還原</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsTableFullscreen((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-colors shadow-2xs cursor-pointer ${
                isTableFullscreen
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={isTableFullscreen ? '退出全螢幕檢視 (ESC)' : '全螢幕/滿版清冊檢視'}
            >
              {isTableFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div
          className={`overflow-x-auto transition-all ${
            isTableFullscreen
              ? 'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300'
              : isSinglePageMode
              ? 'max-h-none overflow-y-visible'
              : 'max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300'
          }`}
          style={{
            zoom: tableScale !== 100 ? `${tableScale / 100}` : undefined,
          }}
        >
          <table className={`w-full ${tableDensity.minWidth} text-left border-collapse`}>
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <tr>
                <th
                  onClick={() => handleSort('projectCode')}
                  className={`${tableDensity.thClass} cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[95px]`}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>案別代碼</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('buildingCategory')}
                  className={`${tableDensity.thClass} text-center cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[85px]`}
                >
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                    <span>工程類型</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('region')}
                  className={`${tableDensity.thClass} cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[90px]`}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>區域</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('scaleTier')}
                  className={`${tableDensity.thClass} cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[90px]`}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>規模級距</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('selectionDate')}
                  className={`${tableDensity.thClass} cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[135px]`}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>C-45 案主管遴選日</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remainingDays')}
                  className={`${tableDensity.thClass} text-center cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[120px]`}
                >
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                    <span>距離基礎日剩餘</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className={`${tableDensity.thClass} font-mono whitespace-nowrap min-w-[115px]`}>C+75/90 開工日</th>
                <th className={`${tableDensity.thClass} font-mono whitespace-nowrap min-w-[110px]`}>C 建照取得日</th>
                <th
                  onClick={() => handleSort('totalFloorArea')}
                  className={`${tableDensity.thClass} text-right cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap min-w-[115px]`}
                >
                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <span>總樓地板(㎡)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className={`${tableDensity.thClass} text-center whitespace-nowrap min-w-[115px]`}>樓層(地下/地上)</th>
                <th className={`${tableDensity.thClass} text-center whitespace-nowrap min-w-[95px]`}>棟/戶數</th>
                <th className={`${tableDensity.thClass} text-center whitespace-nowrap min-w-[115px]`}>特殊屬性</th>
                <th className={`${tableDensity.thClass} text-center whitespace-nowrap min-w-[105px]`}>智能推薦名冊</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <span className="font-medium text-slate-600">無符合條件的開案資料</span>
                      <span className="text-xs text-slate-400">請嘗試清除連動篩選或放寬搜尋關鍵字</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const isUrgent = p.dynamicRemainingDays <= 60;
                  const isModerate = p.dynamicRemainingDays > 60 && p.dynamicRemainingDays <= 120;
                  const bCategory = p.buildingCategory || getProjectBuildingCategory(p);

                  return (
                    <tr
                      key={p.projectCode}
                      onClick={() => setSelectedProject(p)}
                      className="hover:bg-blue-50/60 cursor-pointer transition-colors pdf-block-avoid"
                      title="點擊查看推薦名冊與適配分析"
                    >
                      <td className={`${tableDensity.tdClass} font-mono font-bold text-blue-600 hover:underline whitespace-nowrap min-w-[95px]`}>
                        {p.projectCode}
                      </td>
                      <td className={`${tableDensity.tdClass} text-center whitespace-nowrap min-w-[85px]`}>
                        <span
                          className={`inline-flex items-center ${tableDensity.badgeClass} rounded font-bold border whitespace-nowrap ${
                            bCategory === '住宅'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : bCategory === '廠辦'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : bCategory === '商辦'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {bCategory}
                        </span>
                      </td>
                      <td className={`${tableDensity.tdClass} whitespace-nowrap min-w-[90px]`}>
                        <span className="inline-flex items-center gap-1 text-slate-800 font-medium whitespace-nowrap">
                          <MapPin className={`${tableDensity.iconSize} text-slate-400 shrink-0`} />
                          {p.region || p.normalizedRegion}
                        </span>
                      </td>
                      <td className={`${tableDensity.tdClass} whitespace-nowrap min-w-[90px]`}>
                        <span
                          className={`inline-flex items-center ${tableDensity.badgeClass} rounded font-bold whitespace-nowrap ${
                            p.computedScaleTier === '特大型案'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : p.computedScaleTier === '大型案'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : p.computedScaleTier === '中型案'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {p.computedScaleTier}
                        </span>
                      </td>
                      <td className={`${tableDensity.tdClass} font-mono text-slate-800 font-medium whitespace-nowrap min-w-[135px]`}>
                        {p.selectionDate}
                      </td>
                      <td className={`${tableDensity.tdClass} text-center whitespace-nowrap min-w-[120px]`}>
                        <span
                          className={`inline-flex items-center gap-1 ${tableDensity.badgeClass} rounded-full font-mono font-bold shadow-2xs whitespace-nowrap ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                              : isModerate
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>}
                          {p.dynamicRemainingDays} 天
                        </span>
                      </td>
                      <td className={`${tableDensity.tdClass} font-mono text-slate-700 whitespace-nowrap min-w-[115px]`}>
                        {p.startWorkDate}
                      </td>
                      <td className={`${tableDensity.tdClass} font-mono text-slate-700 whitespace-nowrap min-w-[110px]`}>
                        {p.permitDate}
                      </td>
                      <td className={`${tableDensity.tdClass} text-right font-mono text-slate-900 font-bold whitespace-nowrap min-w-[115px]`}>
                        {Number(p.totalFloorArea || 0).toLocaleString()} ㎡
                      </td>
                      <td className={`${tableDensity.tdClass} text-center font-mono text-slate-700 whitespace-nowrap min-w-[115px]`}>
                        B{p.undergroundFloors}F / {p.abovegroundFloors}F
                      </td>
                      <td className={`${tableDensity.tdClass} text-center font-mono text-slate-700 whitespace-nowrap min-w-[95px]`}>
                        {p.buildingsCount}棟 / {p.unitsCount}戶
                      </td>
                      <td className={`${tableDensity.tdClass} text-center whitespace-nowrap min-w-[115px]`}>
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                          {p.jointOrUrbanRenewal !== '無' && (
                            <span className={`inline-flex items-center ${tableDensity.badgeClass} bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold whitespace-nowrap shrink-0`}>
                              {p.jointOrUrbanRenewal}
                            </span>
                          )}
                          {p.specialMethod !== '無' && (
                            <span className={`inline-flex items-center ${tableDensity.badgeClass} bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold whitespace-nowrap shrink-0`}>
                              {p.specialMethod}
                            </span>
                          )}
                          {p.jointOrUrbanRenewal === '無' && p.specialMethod === '無' && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className={`${tableDensity.tdClass} text-center whitespace-nowrap min-w-[105px]`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(p);
                          }}
                          className={`inline-flex items-center gap-1 ${tableDensity.btnClass} font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap`}
                          title="開啟推薦名冊與適配分析"
                        >
                          <Sparkles className={`${tableDensity.iconSize} text-blue-600`} />
                          <span>推薦名冊</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Candidate Matching Recommendation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-md text-xs font-mono font-bold">
                    {selectedProject.projectCode}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold">案主管適配推薦名冊分析</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100 mt-2">
                  <span className="px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                    {selectedProject.buildingCategory || getProjectBuildingCategory(selectedProject)}
                  </span>
                  <span>·</span>
                  <span>區域：{selectedProject.region || selectedProject.normalizedRegion}</span>
                  <span>·</span>
                  <span>規模：{selectedProject.computedScaleTier || selectedProject.scaleType} ({Number(selectedProject.totalFloorArea || 0).toLocaleString()} ㎡)</span>
                  <span>·</span>
                  <span>
                    C-45遴選日：<strong className="text-white font-mono">{selectedProject.selectionDate}</strong> (倒數 <strong className="text-amber-300 font-mono">{selectedProject.dynamicRemainingDays}</strong> 天)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    依據 <strong>釋出時程匹配度</strong>、<strong>過往工程規模等級</strong>、<strong>職務任用適格性</strong> 及 <strong>工法相容度</strong> 進行動態加權運算。
                  </span>
                </div>
                <span className="font-bold text-blue-800 font-mono shrink-0 ml-auto">
                  共比對 {candidates.length} 位儲備人選
                </span>
              </div>

              {/* Recommended Candidates Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
                <table className="w-full text-xs text-left border-collapse min-w-[820px] table-fixed">
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '170px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '170px' }} />
                    <col style={{ width: '85px' }} />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: '85px' }} />
                    <col />
                  </colgroup>
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 text-center">推薦名次</th>
                      <th className="py-3 px-3">人選姓名 / 工號</th>
                      <th className="py-3 px-3">部室 / 職稱與職等</th>
                      <th className="py-3 px-3">釋出狀態與季度</th>
                      <th className="py-3 px-3 text-center">管理年資</th>
                      <th className="py-3 px-3 text-center">完案數</th>
                      <th className="py-3 px-3 text-center">匹配分數</th>
                      <th className="py-3 px-3">適配原因分析</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchedLeaders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          目前無適配之主管人選
                        </td>
                      </tr>
                    ) : (
                      matchedLeaders.slice(0, 5).map((match, idx) => {
                        const cand = match.candidate;
                        const emp =
                          empMap.get((cand.empNo || '').trim().toUpperCase()) ||
                          (employees || []).find((e) => e.name === cand.name || (cand.empNo && e.empNo === cand.empNo));
                        const isTop = idx === 0;
                        const score = match.totalScore ?? match.matchScore ?? 0;
                        const reasonsList = match.reasons || match.matchReasons || [];

                        const displayName = emp?.name || cand.name;
                        const displayDept = emp?.department || cand.department || '-';
                        const displayTitle = emp?.title || cand.title || '案主管';
                        const displayRank = emp?.rank || cand.rank || '';

                        const releaseStatusText = cand.releaseStatus || '待派';
                        const isStatusDelayed = releaseStatusText.includes('未') || releaseStatusText.includes('延') || releaseStatusText.includes('在建');
                        const isStatusReady = releaseStatusText.includes('可') || releaseStatusText.includes('待派') || releaseStatusText.includes('完工') || releaseStatusText.includes('釋出');

                        return (
                          <tr
                            key={cand.empNo || `candidate-match-${idx}`}
                            className={`hover:bg-blue-50/40 transition-colors ${
                              isTop ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center align-middle">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-mono text-xs shadow-2xs ${
                                  idx === 0
                                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-800'
                                    : idx === 2
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <div
                                onClick={() => setSelectedCandidateForProfile(cand)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                                title="點擊查看此案主管之完整履歷與相片"
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                                  <img
                                    src={cand.photoUrl || getCandidatePhoto(cand)}
                                    alt={displayName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                                    {displayName.slice(0, 1)}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="truncate">{displayName}</span>
                                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      [履歷]
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-blue-600 truncate">{cand.empNo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <div className="text-slate-800 font-semibold truncate">{displayDept}</div>
                              <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-slate-750">{displayTitle}</span>
                                {displayRank ? (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                                    {displayRank}職等
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">職等未載</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] leading-tight max-w-[155px] truncate ${
                                  isStatusReady
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isStatusDelayed
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                                title={releaseStatusText}
                              >
                                {releaseStatusText}
                              </span>
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5 font-medium">
                                {cand.releaseQuarter || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono align-middle text-slate-700">
                              {formatDecimal(cand.internalMgmtYears, 2)} 年
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 align-middle">
                              {cand.completedProjectsCount || 0}
                            </td>
                            <td className="py-3 px-3 text-center align-middle">
                              <span className="inline-block font-mono font-black text-blue-700 text-sm px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 shadow-2xs">
                                {Math.round(score)}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <div className="space-y-1">
                                {reasonsList.slice(0, 2).map((reason: string, rIdx: number) => (
                                  <div
                                    key={rIdx}
                                    className="text-[11px] text-slate-600 flex items-start gap-1.5"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                                    <span className="leading-snug">{reason}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                點選人選後可在「人選推薦適配」模組查看其完整工程履歷及完案規模明細。
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenProjectPk(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="啟動適配推薦前 3 名人選之 PK 深度評選對照"
                >
                  <Swords className="w-4 h-4 text-amber-900" />
                  <span>針對前 3 名人員 PK 評比</span>
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  關閉視窗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Candidates PK Modal (同案主管人才庫儀表板PK畫面) */}
      {pkProject && pkCandidates.length > 0 && (
        <CandidatePKModal
          initialCandidates={pkCandidates}
          associatedProject={pkProject}
          onClose={() => {
            setPkProject(null);
            setPkCandidates([]);
          }}
        />
      )}

      {/* Candidate Full Profile & Resume Modal (含人員照片與工程實績) */}
      {selectedCandidateForProfile && (
        <CandidateFullProfileModal
          isOpen={Boolean(selectedCandidateForProfile)}
          onClose={() => setSelectedCandidateForProfile(null)}
          candidate={selectedCandidateForProfile}
        />
      )}
    </PrintWrapper>
  );
};
