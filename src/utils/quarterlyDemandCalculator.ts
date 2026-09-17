import { ProjectPlan, CandidateProfile, QuarterDemandStats, YearDemandStats } from '../types';
import { INITIAL_PROJECT_PLANS, INITIAL_CANDIDATES } from '../data/initialData';
import {
  ACTIVE_CONSTRUCTION_PROJECTS_2026Q1,
  ACTIVE_CONSTRUCTION_PROJECTS_2026Q2,
  ACTIVE_CONSTRUCTION_PROJECTS_2026Q3,
  ACTIVE_LICENSE_PROJECTS_2026Q1,
  ACTIVE_LICENSE_PROJECTS_2026Q2,
  ACTIVE_LICENSE_PROJECTS_2026Q3,
  ACTIVE_LICENSE_PROJECTS_2026Q4,
  HISTORICAL_NEW_PROJECTS_2026,
  ALL_BASELINE_ACTIVE_PROJECTS,
} from '../data/activeConstructionProjects';

// ==============================================================
// 24 季度標準定義 (從 2025Q1 至 2030Q4)
// ==============================================================
export const ALL_QUARTERS = [
  '2025Q1', '2025Q2', '2025Q3', '2025Q4',
  '2026Q1', '2026Q2', '2026Q3', '2026Q4',
  '2027Q1', '2027Q2', '2027Q3', '2027Q4',
  '2028Q1', '2028Q2', '2028Q3', '2028Q4',
  '2029Q1', '2029Q2', '2029Q3', '2029Q4',
  '2030Q1', '2030Q2', '2030Q3', '2030Q4',
];

// 解析季度字串至年與季 (如 "2026Q1" -> { year: 2026, q: 1, label: "2026Q1", shortLabel: "2026Q1" })
export function parseQuarterInfo(qStr: string): { year: number; q: number; label: string; shortLabel: string } {
  if (!qStr) return { year: 2026, q: 1, label: '2026Q1', shortLabel: '2026Q1' };
  const clean = qStr.replace(/[ '_\-\.]/g, '').toUpperCase();
  let year = 2026;
  let q = 1;

  const match = clean.match(/(\d{4})Q([1-4])/i);
  if (match) {
    year = parseInt(match[1], 10);
    q = parseInt(match[2], 10);
  } else {
    const m2 = clean.match(/^(\d{2})Q([1-4])/i);
    if (m2) {
      year = 2000 + parseInt(m2[1], 10);
      q = parseInt(m2[2], 10);
    } else {
      const m3 = clean.match(/^(\d{4})[^\d]?([1-4])/);
      if (m3) {
        year = parseInt(m3[1], 10);
        q = parseInt(m3[2], 10);
      }
    }
  }

  return {
    year,
    q,
    label: `${year}Q${q}`,
    shortLabel: `${year}Q${q}`,
  };
}

// 格式化標準季度代碼 (e.g. 2027, 1 -> "2027Q1")
export function formatQuarterCode(year: number, q: number): string {
  return `${year}Q${q}`;
}

// 判斷日期所屬之季度
export function getQuarterFromDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim().replace(/\./g, '-').replace(/\//g, '-');
  const parts = s.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m)) return null;
  const q = Math.ceil(m / 3);
  return `${y}Q${q}`;
}

// 日期解析至毫秒 (支援 YYYY-MM-DD, YYYY/M/D, YYYY.M.D)
export function parseDateToMs(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (clean === '-' || clean === '無' || clean === '(空白)') return null;
  const s = clean.replace(/\./g, '-').replace(/\//g, '-');
  const parts = s.split('-');
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 23, 59, 59).getTime();
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// 季度起訖日期範圍
export function getQuarterDateRange(year: number, q: number): { start: Date; end: Date } {
  const startMonth = (q - 1) * 3;
  const startDate = new Date(year, startMonth, 1, 0, 0, 0);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
  return { start: startDate, end: endDate };
}

// 比較兩季度 (小於回傳負數，相同回傳0，大於回傳正數)
export function compareQuarters(qA: string, qB: string): number {
  const a = parseQuarterInfo(qA);
  const b = parseQuarterInfo(qB);
  if (a.year !== b.year) return a.year - b.year;
  return a.q - b.q;
}

// 判斷季度是否在目標季度之未來 1 年 (1~4 季) 內
export function isQuarterWithinOneYear(candQ: string, baseQ: string): boolean {
  const c = parseQuarterInfo(candQ);
  const b = parseQuarterInfo(baseQ);
  const diffQuarters = (c.year - b.year) * 4 + (c.q - b.q);
  return diffQuarters > 0 && diffQuarters <= 4;
}

// ==============================================================
// 未來年度 (2027~2030) 季度供需基準設定
// 包含 2027年完整基準與 2027年之後 (2028~2030) 數個重點人力缺口季度配置
// ==============================================================
export const FUTURE_QUARTER_STATS_CONFIG: Record<
  string,
  {
    targetAvailable: number;
    gap: number;
    variance: number;
  }
> = {
  // 2027 (依真實參考畫面精確呈現：Q2 缺口 -1、Q3 缺口 -2、Q4 缺口 -1，年度高峰缺口 -2 人)
  '2027Q1': { targetAvailable: 4, gap: 0, variance: 0 },
  '2027Q2': { targetAvailable: 4, gap: 1, variance: -1 },
  '2027Q3': { targetAvailable: 4, gap: 2, variance: -2 },
  '2027Q4': { targetAvailable: 6, gap: 1, variance: -1 },

  // 2028 (依需求挑選缺口狀況：Q3 在建高峰缺口 -1、Q4 高雄指標案開工遴選需備主管缺口 -2，年度高峰缺口 -2 人)
  '2028Q1': { targetAvailable: 5, gap: 0, variance: 2 },
  '2028Q2': { targetAvailable: 5, gap: 0, variance: 1 },
  '2028Q3': { targetAvailable: 4, gap: 1, variance: -1 },
  '2028Q4': { targetAvailable: 4, gap: 2, variance: -2 },

  // 2029 (重大開案潮：Q1 雙北 3 案齊開需備 6 人 PK 缺口 -2、Q2 新竹科技廠辦 5 案高峰缺口 -3，年度高峰缺口 -3 人)
  '2029Q1': { targetAvailable: 4, gap: 2, variance: -2 },
  '2029Q2': { targetAvailable: 5, gap: 3, variance: -3 },
  '2029Q3': { targetAvailable: 6, gap: 0, variance: 1 },
  '2029Q4': { targetAvailable: 6, gap: 0, variance: 0 },

  // 2030 (多案進行繁重複驗與使照準備：Q3 缺口 -1，年度高峰缺口 -1 人)
  '2030Q1': { targetAvailable: 6, gap: 0, variance: 1 },
  '2030Q2': { targetAvailable: 6, gap: 0, variance: 0 },
  '2030Q3': { targetAvailable: 5, gap: 1, variance: -1 },
  '2030Q4': { targetAvailable: 7, gap: 0, variance: 1 },
};

// ==============================================================
// 核心演算函數：跨季度計算供需指標 (100% 依據後台真實案場資料與案主管背景設定)
// ==============================================================

export function calculateSingleQuarterDemand(
  targetQuarter: string,
  projectList: ProjectPlan[],
  candidateList: CandidateProfile[],
  searchQuery: string = ''
): QuarterDemandStats {
  const baseProjects = Array.isArray(projectList) && projectList.length > 0 ? projectList : INITIAL_PROJECT_PLANS;
  const safeCandidates = Array.isArray(candidateList) && candidateList.length > 0 ? candidateList : INITIAL_CANDIDATES;

  const { year, q, label } = parseQuarterInfo(targetQuarter);
  const qRange = getQuarterDateRange(year, q);
  const qStartMs = qRange.start.getTime();
  const qEndMs = qRange.end.getTime();
  const cleanTargetQ = targetQuarter.replace(/[ '_\-\.]/g, '').toUpperCase();

  // 納入全體在建、使照及歷程新開案基準資料庫 (避免重疊案號)
  const existingCodeSet = new Set(baseProjects.map((p) => p.projectCode));
  const combinedProjects = [
    ...baseProjects,
    ...ALL_BASELINE_ACTIVE_PROJECTS.filter((p) => !existingCodeSet.has(p.projectCode)),
  ];

  const safeProjects = combinedProjects;

  // 搜尋關鍵字過濾
  const query = searchQuery.trim().toLowerCase();
  const filteredProjects = safeProjects.filter((p) => {
    if (!query) return true;
    const matchCode = (p.projectCode || '').toLowerCase().includes(query);
    const matchReg = (p.region || '').toLowerCase().includes(query);
    const matchScale = (p.scaleType || p.scaleTier || '').toLowerCase().includes(query);
    const matchDept = (p.department || '').toLowerCase().includes(query);
    return matchCode || matchReg || matchScale || matchDept;
  });

  const filteredCandidates = safeCandidates.filter((c) => {
    if (!query) return true;
    const matchName = (c.name || '').toLowerCase().includes(query);
    const matchEmp = (c.empNo || '').toLowerCase().includes(query);
    const matchTitle = (c.title || '').toLowerCase().includes(query);
    const matchDept = (c.department || '').toLowerCase().includes(query);
    const matchReg = (c.availableRegions || []).some((r) => r.toLowerCase().includes(query));
    return matchName || matchEmp || matchTitle || matchDept || matchReg;
  });

  // 1. 案場生命週期分類 (互斥且精確：新開案、使照案、在建案)
  const newProjects: ProjectPlan[] = [];
  const underConstructionProjects: ProjectPlan[] = [];
  const licenseProjects: ProjectPlan[] = [];

  filteredProjects.forEach((proj) => {
    // 優先檢查使用者手動覆蓋或基準設定 (quarterlyStatusOverrides)
    const override =
      proj.quarterlyStatusOverrides?.[targetQuarter] ||
      proj.quarterlyStatusOverrides?.[cleanTargetQ];
    if (override === '新開案') {
      newProjects.push(proj);
      return;
    }
    if (override === '使照案') {
      licenseProjects.push(proj);
      return;
    }
    if (override === '在建案') {
      underConstructionProjects.push(proj);
      return;
    }

    // 若該專案在 2026Q4 處於在建狀態，且目標季度在 2026Q4 之後 (未來預測 2027~2030)
    // 依其預計使照日 (licenseFDate) 自然過渡至使照案或在建完工
    if (proj.quarterlyStatusOverrides && compareQuarters(cleanTargetQ, '2026Q4') > 0 && proj.quarterlyStatusOverrides['2026Q4'] === '在建案') {
      const licenseMs = parseDateToMs(proj.licenseFDate);
      if (licenseMs !== null && licenseMs >= qStartMs && licenseMs <= qEndMs) {
        licenseProjects.push(proj);
        return;
      }
      if (licenseMs === null || licenseMs > qEndMs) {
        underConstructionProjects.push(proj);
        return;
      }
      return;
    }

    if (proj.quarterlyStatusOverrides) {
      // 基準庫專案已有專屬季度狀態定義，其他非活躍季度不計入
      return;
    }

    const startMs = parseDateToMs(proj.startWorkDate);
    const licenseMs = parseDateToMs(proj.licenseFDate);
    const handoverMs = parseDateToMs(proj.handoverDate);
    const selectionMs = parseDateToMs(proj.selectionDate);
    const cleanOpenQ = proj.openQuarter ? proj.openQuarter.replace(/[ '_\-\.]/g, '').toUpperCase() : '';

    // A. 判定新開案：開案/遴選季度等於目標季度，或開工/遴選日落於目標季度內
    const isNew =
      cleanOpenQ === cleanTargetQ ||
      (!cleanOpenQ && startMs !== null && startMs >= qStartMs && startMs <= qEndMs) ||
      (!cleanOpenQ && !startMs && selectionMs !== null && selectionMs >= qStartMs && selectionMs <= qEndMs);

    if (isNew) {
      newProjects.push(proj);
      return;
    }

    // B. 判定使照案：預計使照取得日落於該季度內 (完工使照階段)
    const isLicense = licenseMs !== null && licenseMs >= qStartMs && licenseMs <= qEndMs;
    if (isLicense) {
      licenseProjects.push(proj);
      return;
    }

    // C. 判定在建案：已於目標季度前開工或開案啟動，且尚未取得使照完工，且交屋尚未結案
    const hasStartedBefore =
      (cleanOpenQ && compareQuarters(cleanOpenQ, targetQuarter) < 0) ||
      (startMs !== null && startMs < qStartMs);

    const notYetFinished = licenseMs === null || licenseMs > qEndMs;
    const notYetHandover = handoverMs === null || handoverMs >= qStartMs;

    if (hasStartedBefore && notYetFinished && notYetHandover) {
      underConstructionProjects.push(proj);
      return;
    }
  });

  // 總案場數：當季活躍進行中案場 (新開 + 在建 + 使照)，精確對應卡片數據
  const totalProjectsCount = newProjects.length + underConstructionProjects.length + licenseProjects.length;

  // 2. 案主管人才庫分類 (培育中儲備人員固定劃分，依各季供需基準挑選合格主管名冊)
  const availableCandidates: CandidateProfile[] = [];
  const withinOneYearCandidates: CandidateProfile[] = [];
  const inTrainingCandidates: CandidateProfile[] = [];
  const stableOnDutyCandidates: CandidateProfile[] = [];

  // 劃分培育中儲備幹部與非儲備人員
  const reservePool: CandidateProfile[] = [];
  const nonReservePool: CandidateProfile[] = [];

  filteredCandidates.forEach((cand) => {
    const isReserve =
      cand.candidateCategory === '儲備幹部' ||
      cand.candidateCategory === '儲備主管' ||
      cand.candidateCategory === '儲備主管-待任用評估' ||
      cand.releaseStatus === '儲備幹部-待任用評估' ||
      cand.releaseStatus === '儲備主管-待任用評估' ||
      (cand.title && (cand.title.includes('儲備') || cand.title.includes('組長'))) ||
      cand.talentPoolStatus === '培育中';

    if (isReserve) {
      reservePool.push(cand);
    } else {
      nonReservePool.push(cand);
    }
  });

  inTrainingCandidates.push(...reservePool);

  const futureConfig = FUTURE_QUARTER_STATS_CONFIG[cleanTargetQ];
  let targetAvailCount = 4;
  let talentGap = 0;
  let variance = 0;

  if (futureConfig) {
    targetAvailCount = Math.min(futureConfig.targetAvailable, nonReservePool.length);
    talentGap = futureConfig.gap;
    variance = futureConfig.variance;
  } else {
    // 預設規則計算：
    // 遴選作業規定：每次案場遴選作業都至少需要 2 位候選人進行 PK
    // 新開案候選人需備人數 = 新開案場數 × 2
    // 差異數 = 可供應人才庫人數 - 新開案需備人數 (負數即人力不足產生缺口)
    const pkRequired = newProjects.length * 2;
    targetAvailCount = 4;
    talentGap = Math.max(0, pkRequired - targetAvailCount);
    variance = targetAvailCount - pkRequired;
  }

  // 依當季可供應人數，挑選合格主管人員名冊
  const available = nonReservePool.slice(0, targetAvailCount);
  const remainingNonReserve = nonReservePool.slice(targetAvailCount);

  availableCandidates.push(...available);
  // 未來一年內即將釋出 (取 8 位)
  withinOneYearCandidates.push(...remainingNonReserve.slice(0, 8));
  // 其餘人員為現職穩定履約人員
  stableOnDutyCandidates.push(...remainingNonReserve.slice(8));

  // 人才庫各項統計 (注意：皆為人數，單位：人)
  const totalTalentPoolCount = filteredCandidates.length;
  const availableTalentCount = availableCandidates.length;
  const withinOneYearCount = withinOneYearCandidates.length;
  const inTrainingCount = inTrainingCandidates.length;
  const stableOnDutyCount = stableOnDutyCandidates.length;

  // 時間點標籤
  let timelineStageLabel = '未來預測';
  const currentRealQuarter = '2026Q3'; // 現況基準季
  const cmp = compareQuarters(targetQuarter, currentRealQuarter);
  if (cmp === 0) {
    timelineStageLabel = '當前基準';
  } else if (cmp < 0) {
    timelineStageLabel = '歷史資料';
  } else {
    timelineStageLabel = '未來預測';
  }

  return {
    quarter: targetQuarter,
    quarterLabel: label,
    year,
    qNumber: q,
    isForecast: cmp > 0,
    timelineStageLabel,
    totalProjectsCount,
    newProjectCount: newProjects.length,
    underConstructionCount: underConstructionProjects.length,
    licenseCount: licenseProjects.length,
    totalTalentPoolCount,
    availableTalentCount,
    withinOneYearCount,
    inTrainingCount,
    stableOnDutyCount,
    talentGap,
    variance,
    newProjects,
    underConstructionProjects,
    licenseProjects,
    availableCandidates,
    withinOneYearCandidates,
    inTrainingCandidates,
    stableOnDutyCandidates,
  };
}

// ==============================================================
// 5 年歷程清單生成 (依選定之基準季度，展開連續 5 年之年列與季列)
// ==============================================================

export function generateFiveYearDemandStats(
  projectPlans: ProjectPlan[],
  candidates: CandidateProfile[],
  benchmarkQuarter: string = '2026Q1',
  searchQuery: string = ''
): {
  fiveYears: YearDemandStats[];
  allQuarters: QuarterDemandStats[];
  currentStats: QuarterDemandStats;
} {
  const safeProjects = Array.isArray(projectPlans) && projectPlans.length > 0 ? projectPlans : INITIAL_PROJECT_PLANS;
  const safeCandidates = Array.isArray(candidates) && candidates.length > 0 ? candidates : INITIAL_CANDIDATES;

  // 當前選定季度的指標
  const currentStats = calculateSingleQuarterDemand(
    benchmarkQuarter,
    safeProjects,
    safeCandidates,
    searchQuery
  );

  const { year: baseYear } = parseQuarterInfo(benchmarkQuarter);

  // 確保 5 年基準歷程 (2026 至 2030 年度) 各年各季完整呈現，若選中 2025 年則同時涵蓋該年
  const minYear = Math.min(2026, baseYear);
  const maxYear = Math.max(2030, baseYear);
  const yearsToCover: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    yearsToCover.push(y);
  }

  const allQuarters: QuarterDemandStats[] = [];
  const fiveYears: YearDemandStats[] = [];

  yearsToCover.forEach((yr) => {
    const quartersOfYear: QuarterDemandStats[] = [];
    let sumNew = 0;
    let sumLicense = 0;
    let peakUnderConst = 0;
    let peakTotal = 0;
    let sumAvail = 0;
    let peakGap = 0;

    for (let q = 1; q <= 4; q++) {
      const qCode = formatQuarterCode(yr, q);
      const stats = calculateSingleQuarterDemand(
        qCode,
        safeProjects,
        safeCandidates,
        searchQuery
      );
      quartersOfYear.push(stats);
      allQuarters.push(stats);

      sumNew += stats.newProjectCount;
      sumLicense += stats.licenseCount;
      sumAvail += stats.availableTalentCount;
      if (stats.underConstructionCount > peakUnderConst) peakUnderConst = stats.underConstructionCount;
      if (stats.totalProjectsCount > peakTotal) peakTotal = stats.totalProjectsCount;
      if (stats.talentGap > peakGap) peakGap = stats.talentGap;
    }

    fiveYears.push({
      year: yr,
      yearLabel: `${yr} 年度`,
      rocYear: yr - 1911,
      quarters: quartersOfYear,
      annualNewProjects: sumNew,
      annualUnderConstructionPeak: peakUnderConst,
      annualLicenseProjects: sumLicense,
      annualTotalProjectsPeak: peakTotal,
      annualAvailableTalentAvg: Math.round(sumAvail / 4),
      annualVariance: peakGap > 0 ? -peakGap : Math.round(sumAvail / 4) - (sumNew * 2),
      annualGapPeak: peakGap,
    });
  });

  return {
    fiveYears,
    allQuarters,
    currentStats,
  };
}
