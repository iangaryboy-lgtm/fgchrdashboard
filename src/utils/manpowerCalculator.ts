import {
  ProjectPlan,
  ManpowerFormulaConfig,
  ManpowerSupplyAssumption,
  ManualTargetDemandRecord,
  ProjectQuarterDetail,
  QuarterSummaryData,
  RoleDemandBreakdown,
  ManpowerRole,
} from '../types';

// ==============================================================
// 1.// 預設公式參數配置 (可於後台由管理者彈性修改)
// ==============================================================
export const DEFAULT_MANPOWER_CONFIG: ManpowerFormulaConfig = {
  // 1-2-1. 案主管：案前配置1人，F+365 歸零
  manager: {
    preWorkHeadcount: 1.0,
    resetDaysAfterLicense: 365,
  },
  // 1-2-2. 土建工程師
  civil: {
    // 地上層：案前0.3人，動工起1人，交屋0.5人，管委會成立0.25人，F+365歸零；基準人數＝地上層數 ÷ 設定值(四捨五入)
    aboveGround: {
      preWorkRate: 0.3,
      startWorkRate: 1.0,
      handoverRate: 0.5,
      committeeRate: 0.25,
      resetDaysAfterLicense: 365,
      divisorFloors: 15, // 預設每 15 層 1 人基準
    },
    // 地下層：自1FL起1人，交屋0.5人，管委會成立0.25人，F+365歸零；基準人數＝地下室面積 ÷ 設定值(四捨五入)
    underGround: {
      from1FLRate: 1.0,
      handoverRate: 0.5,
      committeeRate: 0.25,
      resetDaysAfterLicense: 365,
      divisorArea: 1500, // 預設每 1500 坪 1 人基準
    },
    // 景觀/VIP：2FL起0.5人，6FL起1人，交屋0.5人，管委會成立0.25人，F+365歸零；有勾選才計入，基準人數固定1
    landscapeVip: {
      from2FLRate: 0.5,
      from6FLRate: 1.0,
      handoverRate: 0.5,
      committeeRate: 0.25,
      resetDaysAfterLicense: 365,
      baseHeadcount: 1.0,
    },
  },
  // 1-2-3. 機電工程師：案前0.5人，動工起1人，交屋0.5人，管委會成立0.25人，F+365歸零；基準人數＝總層數 ÷ 設定值(四捨五入)
  mep: {
    preWorkRate: 0.5,
    startWorkRate: 1.0,
    handoverRate: 0.5,
    committeeRate: 0.25,
    resetDaysAfterLicense: 365,
    divisorFloors: 15, // 預設每 15 層 1 人基準
  },
  // 1-2-4. 職安工程師：動工起1人，使照後歸零；基準人數＝總層數 ÷ 設定值(每36層配1人)
  safety: {
    startWorkRate: 1.0,
    resetOnLicense: true, // 使照後歸零
    divisorFloors: 36, // 每 36 層配 1 人基準 (依營造工程指引)
  },
  // 1-2-5. 外業營管專員：案前配置1人，F+365 歸零
  admin: {
    preWorkHeadcount: 1.0,
    resetDaysAfterLicense: 365,
  },
  // 工程節點與進度釋放比例：動工日前 6 個月，按 1FL(15%)、2FL(30%)、6FL(55%) 階梯式釋放
  scheduleRatio: {
    preWorkMonths: 6, // 開工前 6 個月啟動案前作業
    fl1ProgressRatio: 0.15, // 15% 進度點估為 1FL (地下室完成出地面)
    fl2ProgressRatio: 0.30, // 30% 進度點估為 2FL
    fl6ProgressRatio: 0.55, // 55% 進度點估為 6FL (主體結構加速期)
    handoverDaysAfterF: 90, // 使照至交屋預設 3 個月 (90天)
    committeeDaysAfterF: 180, // 交屋至管委會成立預設 6 個月 (180天)
  },
};

/**
 * 安全獲取人力配置參數，防止 partial 物件或舊版快取遺漏巢狀欄位導致 TypeError
 */
export function getSafeManpowerConfig(config?: Partial<ManpowerFormulaConfig> | null): ManpowerFormulaConfig {
  if (!config) return DEFAULT_MANPOWER_CONFIG;
  return {
    ...DEFAULT_MANPOWER_CONFIG,
    ...config,
    manager: {
      ...DEFAULT_MANPOWER_CONFIG.manager,
      ...(config.manager || {}),
    },
    civil: {
      ...DEFAULT_MANPOWER_CONFIG.civil,
      ...(config.civil || {}),
      aboveGround: {
        ...DEFAULT_MANPOWER_CONFIG.civil.aboveGround,
        ...(config.civil?.aboveGround || {}),
      },
      underGround: {
        ...DEFAULT_MANPOWER_CONFIG.civil.underGround,
        ...(config.civil?.underGround || {}),
      },
      landscapeVip: {
        ...DEFAULT_MANPOWER_CONFIG.civil.landscapeVip,
        ...(config.civil?.landscapeVip || {}),
      },
    },
    mep: {
      ...DEFAULT_MANPOWER_CONFIG.mep,
      ...(config.mep || {}),
    },
    safety: {
      ...DEFAULT_MANPOWER_CONFIG.safety,
      ...(config.safety || {}),
    },
    admin: {
      ...DEFAULT_MANPOWER_CONFIG.admin,
      ...(config.admin || {}),
    },
    scheduleRatio: {
      ...DEFAULT_MANPOWER_CONFIG.scheduleRatio,
      ...(config.scheduleRatio || {}),
    },
  };
}

// ==============================================================
// 2. 預設供給面假設 (現況基準點 2026Q3 在職 259 人，每季自然離職率衰退)
// ==============================================================
export const DEFAULT_SUPPLY_ASSUMPTION: ManpowerSupplyAssumption = {
  baselineHeadcount: 259, // 現況基準點 2026Q3 基準在職總人數約 259 人
  quarterlyTurnoverRate: 3.5, // 每季離職率 3.5%
  quarterlyNewHires: 0, // 每季預計新進人力 0
  recruitmentLeadQuarters: 2, // 招募前置季數 2 季 (提前2季預警啟動招募)
  warningThresholdPercent: 15.0, // 預警門檻 (缺口佔需求 % 15%)
  customBaselineByDept: {
    全部單位: 259,
    二部: 68,
    三部: 72,
    五部: 54,
    六部: 40,
    七部: 25,
  },
};

// ==============================================================
// 3. 季度常數清單 (從 25'Q1 至 30'Q4，共 24 季)
// ==============================================================
export const QUARTERS_LIST: string[] = [
  "25'Q1", "25'Q2", "25'Q3", "25'Q4",
  "26'Q1", "26'Q2", "26'Q3", "26'Q4",
  "27'Q1", "27'Q2", "27'Q3", "27'Q4",
  "28'Q1", "28'Q2", "28'Q3", "28'Q4",
  "29'Q1", "29'Q2", "29'Q3", "29'Q4",
  "30'Q1", "30'Q2", "30'Q3", "30'Q4",
];

// 解析季度為近似日期 (取季度中旬為基準評估點)
export function getQuarterMidDate(quarterStr: string): Date {
  // Format: "26'Q3" or "2026Q3" or "26Q3"
  const clean = quarterStr.replace("'", '').trim();
  let year = 2026;
  let q = 3;
  if (clean.length === 4) {
    // 26Q3
    const yy = parseInt(clean.substring(0, 2), 10);
    year = 2000 + yy;
    q = parseInt(clean.substring(3, 4), 10);
  } else if (clean.length >= 6) {
    // 2026Q3
    year = parseInt(clean.substring(0, 4), 10);
    q = parseInt(clean.substring(5, 6), 10);
  }

  // 季度中旬月份：Q1->2/15, Q2->5/15, Q3->8/15, Q4->11/15
  const month = (q - 1) * 3 + 1; // 1, 4, 7, 10 (0-indexed)
  return new Date(year, month, 15);
}

// 日期解析輔助 (支援 YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD)
export function parseDateSafe(val?: string | null): Date | null {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim().replace(/\./g, '-').replace(/\//g, '-');
  if (!s || s === '-' || s === '無') return null;
  const parts = s.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

// 格式化日期 YYYY-MM-DD
export function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 解析數值輔助
export function extractFloorNumber(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// 解析地下室坪數
export function extractBasementArea(proj: ProjectPlan): number {
  if (proj.basementArea && proj.basementArea > 0) {
    return proj.basementArea;
  }
  // 若未填寫，以總面積與地下層數合理推估 (每地下層約 600~1200 坪)
  const under = extractFloorNumber(proj.undergroundFloors);
  if (under > 0) {
    const total = Number(proj.totalFloorArea) || 30000;
    const above = extractFloorNumber(proj.abovegroundFloors) || 20;
    const avgPerFloor = total / (above + under || 1);
    return Math.round(avgPerFloor * under * 0.3025); // 換算坪數
  }
  return 1500;
}

// ==============================================================
// 4. 單一案場在特定日期的階段排程與人力需求試算
// ==============================================================
export interface ProjectScheduleMilestones {
  preWorkDate: Date; // 案前啟動日 (開工前 N 個月)
  startDate: Date; // 開工日
  fl1Date: Date; // 1FL 日期 (以動工至使照比例估)
  fl2Date: Date; // 2FL 日期
  fl6Date: Date; // 6FL 日期
  licenseFDate: Date; // 使照日 F
  handoverDate: Date; // 交屋日
  committeeDate: Date; // 管委會成立日
  f365Date: Date; // F + 365 天 (歸零日)
}

export function calculateProjectMilestones(
  proj: ProjectPlan,
  config?: Partial<ManpowerFormulaConfig> | null,
  delayMonths: number = 0
): ProjectScheduleMilestones | null {
  const safeConfig = getSafeManpowerConfig(config);
  const rawStartDate = parseDateSafe(proj.startWorkDate);
  if (!rawStartDate) return null;

  // 若有設定開案/工期延遲月數 (What-If 開案延遲模擬)
  const delayMs = delayMonths * 30 * 86400000;
  const startDate = new Date(rawStartDate.getTime() + delayMs);

  // 使照日 F：優先取 licenseFDate，若無則依工程期約 3 年 (1095 天) 推估
  let rawLicenseFDate = parseDateSafe(proj.licenseFDate);
  if (!rawLicenseFDate) {
    rawLicenseFDate = new Date(rawStartDate.getTime() + 1095 * 86400000);
  }
  const licenseFDate = new Date(rawLicenseFDate.getTime() + delayMs);

  // 案前啟動日：開工日前 N 個月
  const preWorkDate = new Date(startDate.getTime() - safeConfig.scheduleRatio.preWorkMonths * 30 * 86400000);

  // 動工至使照總天數
  const totalDuration = Math.max(180, (licenseFDate.getTime() - startDate.getTime()) / 86400000);

  // 1FL, 2FL, 6FL 依比例估算
  const fl1Date = new Date(startDate.getTime() + totalDuration * safeConfig.scheduleRatio.fl1ProgressRatio * 86400000);
  const fl2Date = new Date(startDate.getTime() + totalDuration * safeConfig.scheduleRatio.fl2ProgressRatio * 86400000);
  const fl6Date = new Date(startDate.getTime() + totalDuration * safeConfig.scheduleRatio.fl6ProgressRatio * 86400000);

  // 交屋日：優先取 handoverDate，若無則為 F + handoverDaysAfterF
  let rawHandoverDate = parseDateSafe(proj.handoverDate);
  if (!rawHandoverDate) {
    rawHandoverDate = new Date(rawLicenseFDate.getTime() + safeConfig.scheduleRatio.handoverDaysAfterF * 86400000);
  }
  const handoverDate = new Date(rawHandoverDate.getTime() + delayMs);

  // 管委會成立日：優先取 committeeDate，若無則為 F + committeeDaysAfterF
  let rawCommitteeDate = parseDateSafe(proj.committeeDate);
  if (!rawCommitteeDate) {
    rawCommitteeDate = new Date(rawLicenseFDate.getTime() + safeConfig.scheduleRatio.committeeDaysAfterF * 86400000);
  }
  const committeeDate = new Date(rawCommitteeDate.getTime() + delayMs);

  // F+365 歸零日
  const f365Date = new Date(licenseFDate.getTime() + safeConfig.manager.resetDaysAfterLicense * 86400000);

  return {
    preWorkDate,
    startDate,
    fl1Date,
    fl2Date,
    fl6Date,
    licenseFDate,
    handoverDate,
    committeeDate,
    f365Date,
  };
}

// 試算單一案場在特定日期的各職類需求
export function calculateSingleProjectDemand(
  proj: ProjectPlan,
  targetDate: Date,
  config?: Partial<ManpowerFormulaConfig> | null,
  delayMonths: number = 0,
  makeOrBuyRatio: number = 1.0
): {
  stageName: string;
  isActive: boolean;
  breakdown: RoleDemandBreakdown;
  inHouseBreakdown?: RoleDemandBreakdown;
  outsourcedBreakdown?: RoleDemandBreakdown;
} {
  const safeConfig = getSafeManpowerConfig(config);
  const milestones = calculateProjectMilestones(proj, safeConfig, delayMonths);
  if (!milestones) {
    return {
      stageName: '未排定期程',
      isActive: false,
      breakdown: { manager: 0, civil: 0, mep: 0, safety: 0, admin: 0, total: 0 },
    };
  }

  const {
    preWorkDate,
    startDate,
    fl1Date,
    fl2Date,
    fl6Date,
    licenseFDate,
    handoverDate,
    committeeDate,
    f365Date,
  } = milestones;

  const t = targetDate.getTime();

  // 若尚未進入案前，或已超過 F+365 歸零
  if (t < preWorkDate.getTime() || t >= f365Date.getTime()) {
    return {
      stageName: t < preWorkDate.getTime() ? '尚未開案' : '已完工歸零',
      isActive: false,
      breakdown: { manager: 0, civil: 0, mep: 0, safety: 0, admin: 0, total: 0 },
    };
  }

  // 是否在主施工期 (開工 ~ 使照)
  const isConstruction = t >= startDate.getTime() && t < licenseFDate.getTime();
  const isActive = t >= startDate.getTime() && t < f365Date.getTime();

  // 判定工程階段名稱
  let stageName = '案前規劃';
  if (t >= preWorkDate.getTime() && t < startDate.getTime()) {
    stageName = '案前籌劃 (C-45)';
  } else if (t >= startDate.getTime() && t < fl1Date.getTime()) {
    stageName = '地下開挖與結構 (1FL前)';
  } else if (t >= fl1Date.getTime() && t < fl2Date.getTime()) {
    stageName = '出地面主體 (1FL~2FL)';
  } else if (t >= fl2Date.getTime() && t < fl6Date.getTime()) {
    stageName = '結構施工期 (2FL~6FL)';
  } else if (t >= fl6Date.getTime() && t < licenseFDate.getTime()) {
    stageName = '上部結構與裝修 (6FL~使照)';
  } else if (t >= licenseFDate.getTime() && t < handoverDate.getTime()) {
    stageName = '使照核發至交屋';
  } else if (t >= handoverDate.getTime() && t < committeeDate.getTime()) {
    stageName = '交屋後至管委會成立';
  } else if (t >= committeeDate.getTime() && t < f365Date.getTime()) {
    stageName = '管委會運作至F+365';
  }

  // 1. 案主管需求：案前配置1人，F+365 歸零
  let managerCount = 0;
  if (t >= preWorkDate.getTime() && t < f365Date.getTime()) {
    managerCount = safeConfig.manager.preWorkHeadcount;
  }

  // 2. 土建工程師需求
  // 基準人數計算：
  const aboveFloors = extractFloorNumber(proj.abovegroundFloors) || 15;
  const underFloors = extractFloorNumber(proj.undergroundFloors) || 4;
  const totalFloors = aboveFloors + underFloors;
  const basementArea = extractBasementArea(proj);

  // 地上層基準人數 = 地上層數 ÷ 設定值 (四捨五入)
  const civilAboveBase = Math.max(1, Math.round(aboveFloors / safeConfig.civil.aboveGround.divisorFloors));
  // 地下層基準人數 = 地下室面積 ÷ 設定值 (四捨五入)
  const civilUnderBase = Math.max(1, Math.round(basementArea / safeConfig.civil.underGround.divisorArea));
  // 景觀/VIP 基準人數固定 1 (有勾選才計入)
  const hasVip = proj.hasLandscapeVip ?? true; // 預設皆有景觀綠化
  const civilVipBase = hasVip ? safeConfig.civil.landscapeVip.baseHeadcount : 0;

  let civilCount = 0;

  // (A) 土建 - 地上層
  if (t >= preWorkDate.getTime() && t < startDate.getTime()) {
    civilCount += civilAboveBase * safeConfig.civil.aboveGround.preWorkRate; // 案前 0.3
  } else if (t >= startDate.getTime() && t < handoverDate.getTime()) {
    civilCount += civilAboveBase * safeConfig.civil.aboveGround.startWorkRate; // 動工起 1.0
  } else if (t >= handoverDate.getTime() && t < committeeDate.getTime()) {
    civilCount += civilAboveBase * safeConfig.civil.aboveGround.handoverRate; // 交屋 0.5
  } else if (t >= committeeDate.getTime() && t < f365Date.getTime()) {
    civilCount += civilAboveBase * safeConfig.civil.aboveGround.committeeRate; // 管委會成立 0.25
  }

  // (B) 土建 - 地下層
  if (t >= fl1Date.getTime() && t < handoverDate.getTime()) {
    civilCount += civilUnderBase * safeConfig.civil.underGround.from1FLRate; // 自 1FL 起 1.0
  } else if (t >= handoverDate.getTime() && t < committeeDate.getTime()) {
    civilCount += civilUnderBase * safeConfig.civil.underGround.handoverRate; // 交屋 0.5
  } else if (t >= committeeDate.getTime() && t < f365Date.getTime()) {
    civilCount += civilUnderBase * safeConfig.civil.underGround.committeeRate; // 管委會成立 0.25
  }

  // (C) 土建 - 景觀/VIP
  if (hasVip) {
    if (t >= fl2Date.getTime() && t < fl6Date.getTime()) {
      civilCount += civilVipBase * safeConfig.civil.landscapeVip.from2FLRate; // 2FL 起 0.5
    } else if (t >= fl6Date.getTime() && t < handoverDate.getTime()) {
      civilCount += civilVipBase * safeConfig.civil.landscapeVip.from6FLRate; // 6FL 起 1.0
    } else if (t >= handoverDate.getTime() && t < committeeDate.getTime()) {
      civilCount += civilVipBase * safeConfig.civil.landscapeVip.handoverRate; // 交屋 0.5
    } else if (t >= committeeDate.getTime() && t < f365Date.getTime()) {
      civilCount += civilVipBase * safeConfig.civil.landscapeVip.committeeRate; // 管委會成立 0.25
    }
  }

  // 3. 機電工程師需求：案前0.5人，動工起1人，交屋0.5人，管委會成立0.25人，F+365歸零；基準人數＝總層數 ÷ 設定值(四捨五入)
  const mepBase = Math.max(1, Math.round(totalFloors / safeConfig.mep.divisorFloors));
  let mepCount = 0;
  if (t >= preWorkDate.getTime() && t < startDate.getTime()) {
    mepCount = mepBase * safeConfig.mep.preWorkRate; // 案前 0.5
  } else if (t >= startDate.getTime() && t < handoverDate.getTime()) {
    mepCount = mepBase * safeConfig.mep.startWorkRate; // 動工起 1.0
  } else if (t >= handoverDate.getTime() && t < committeeDate.getTime()) {
    mepCount = mepBase * safeConfig.mep.handoverRate; // 交屋 0.5
  } else if (t >= committeeDate.getTime() && t < f365Date.getTime()) {
    mepCount = mepBase * safeConfig.mep.committeeRate; // 管委會成立 0.25
  }

  // 4. 職安工程師需求：動工起1人，使照後歸零；基準人數＝總層數 ÷ 設定值(四捨五入)
  const safetyBase = Math.max(1, Math.round(totalFloors / safeConfig.safety.divisorFloors));
  let safetyCount = 0;
  if (t >= startDate.getTime() && t < licenseFDate.getTime()) {
    safetyCount = safetyBase * safeConfig.safety.startWorkRate; // 動工起 1.0，使照後歸零
  }

  // 5. 外業營管專員需求：案前配置1人，F+365 歸零
  let adminCount = 0;
  if (t >= preWorkDate.getTime() && t < f365Date.getTime()) {
    adminCount = safeConfig.admin.preWorkHeadcount; // 案前配置 1人
  }

  const round1 = (num: number) => Math.round(num * 10) / 10;

  const mRound = round1(managerCount);
  const cRound = round1(civilCount);
  const mepRound = round1(mepCount);
  const sRound = round1(safetyCount);
  const aRound = round1(adminCount);
  const totRound = round1(mRound + cRound + mepRound + sRound + aRound);

  return {
    stageName,
    isActive: isConstruction || isActive,
    breakdown: {
      manager: mRound,
      civil: cRound,
      mep: mepRound,
      safety: sRound,
      admin: aRound,
      total: totRound,
    },
  };
}

// ==============================================================
// 5. 跨季度彙整與供給面折減演算引擎 (支援 DAX 衰退模型、招募前置預警與 What-If 模擬)
// ==============================================================
export const BASE_SNAPSHOT_QUARTER = "26'Q3"; // 2026Q3 為現況基準點 (基準在職約 259 人)
export const BASE_SNAPSHOT_INDEX = 6; // 25'Q1(0) ~ 26'Q3(6)

export interface ForecastWhatIfOptions {
  delayMonths?: number; // 開案延遲月數 0~12
  turnoverRate?: number; // 離職率覆蓋 (e.g. 3.5%)
  turnoverRateOverride?: number; // 離職率覆蓋 (e.g. 3.5%)
  makeOrBuyRatio?: number; // 自建比率 0.5~1.0 (預設 1.0 自建，若 0.8 則 20% 外包)
  payrollMonthlyRate?: number; // 標準人月成本 (預設 90,000 元/月)
  selectedPhase?: string; // 案場工程階段篩選 (全部階段, 案前籌劃, 地下開挖, 主體結構, 上部裝修, 收尾保固)
  selectedProjectCode?: string; // 特定案場篩選
  selectedSection?: string; // 特定科案單位篩選 (全部科案 / 全部科別 / 具體科案)
}

export function getDepartmentSections(projectPlans: ProjectPlan[], department: string = '全部單位'): string[] {
  const sections = new Set<string>();
  projectPlans.forEach((p) => {
    if (p.isTakedownActive === false) return;
    if (department === '全部單位' || department === '全部' || (p.department || '二部') === department) {
      const sec = p.section || `${(p.region || '').slice(0, 3)}工區科`;
      if (sec && sec.trim()) {
        sections.add(sec.trim());
      }
    }
  });
  return Array.from(sections).sort();
}

export interface ExtendedSummaryResult {
  quarterSummaries: QuarterSummaryData[];
  warningQuarters: QuarterSummaryData[];
  kpiMetrics: {
    activeProjectsCount: number; // 當季施工中案場數
    totalDemandCurrent: number; // 當季總需求人數
    totalSupplyCurrent: number; // 當季預估供給人數
    netGapCurrent: number; // 當季淨缺口 (需求 - 供給)
    fulfillmentRateCurrent: number; // 人力達成率 %
    maxNetGap: number; // 24季最大淨缺口
    maxNetGapQuarter: string; // 最大淨缺口發生季度
    firstGapQuarter: string | null; // 基準點後首次出現缺口季度
    recruitTriggerQuarter: string | null; // 招募啟動季度 (提前2季)
    estimatedPayrollBudgetQuarterly: number; // 當季缺口新增薪資/承攬預算 (元)
    estimatedPayrollBudgetPeak: number; // 最大缺口季新增薪資預算 (元)
    inHouseRatio: number; // 自建比率
    delayMonths: number; // 延遲月數
  };
}

export function calculateAllQuartersSummary(
  projectPlans: ProjectPlan[],
  manualRecords: ManualTargetDemandRecord[],
  config?: Partial<ManpowerFormulaConfig> | null,
  assumption?: Partial<ManpowerSupplyAssumption> | null,
  selectedDepartment: string = '全部單位',
  selectedRole: string = '全部職類',
  whatIf: ForecastWhatIfOptions = {}
): ExtendedSummaryResult {
  const safeConfig = getSafeManpowerConfig(config);
  const safeAssumption: ManpowerSupplyAssumption = {
    ...DEFAULT_SUPPLY_ASSUMPTION,
    ...(assumption || {}),
    customBaselineByDept: {
      ...DEFAULT_SUPPLY_ASSUMPTION.customBaselineByDept,
      ...(assumption?.customBaselineByDept || {}),
    },
  };
  const delayMonths = whatIf.delayMonths || 0;
  const makeOrBuyRatio = whatIf.makeOrBuyRatio !== undefined ? whatIf.makeOrBuyRatio : 1.0;
  const turnoverPercent =
    whatIf.turnoverRate !== undefined
      ? whatIf.turnoverRate
      : whatIf.turnoverRateOverride !== undefined
      ? whatIf.turnoverRateOverride
      : safeAssumption.quarterlyTurnoverRate || 3.5;
  const turnoverDecimal = turnoverPercent / 100;
  const payrollRate = whatIf.payrollMonthlyRate || 90000;
  const selectedPhase = whatIf.selectedPhase || '全部階段';
  const selectedProjectCode = whatIf.selectedProjectCode || '全部';
  const selectedSection = whatIf.selectedSection || '全部科案';

  // 過濾案場單位、科案與單案
  const filteredProjects = projectPlans.filter((p) => {
    if (p.isTakedownActive === false) return false; // 已下架不計入
    if (selectedProjectCode !== '全部' && p.projectCode !== selectedProjectCode) return false;
    if (selectedDepartment !== '全部單位' && selectedDepartment !== '全部') {
      if ((p.department || '二部') !== selectedDepartment) return false;
    }
    if (
      selectedSection &&
      selectedSection !== '全部科案' &&
      selectedSection !== '全部科別' &&
      selectedSection !== '全部'
    ) {
      const pSec = p.section || `${(p.region || '').slice(0, 3)}工區科`;
      if (p.section !== selectedSection && pSec !== selectedSection) return false;
    }
    return true;
  });

  // 計算起始基準人力 (以 2026Q3 為定錨基準點)
  let baselineHC = safeAssumption.baselineHeadcount || 259;
  if (selectedDepartment !== '全部單位' && safeAssumption.customBaselineByDept?.[selectedDepartment]) {
    baselineHC = safeAssumption.customBaselineByDept[selectedDepartment];
  }

  // 若選擇特定科案，按比例調整基準人力
  if (
    selectedSection &&
    selectedSection !== '全部科案' &&
    selectedSection !== '全部科別' &&
    selectedSection !== '全部'
  ) {
    const totalDeptProjects = projectPlans.filter(
      (p) => (p.department || '二部') === (selectedDepartment !== '全部單位' ? selectedDepartment : p.department || '二部')
    ).length || 1;
    const secProjects = filteredProjects.length || 1;
    baselineHC = Math.max(8, Math.round(baselineHC * (secProjects / totalDeptProjects)));
  }

  // 若指定特定職類，按營造組織職能黃金配比拆解基準人數
  if (selectedRole !== '全部職類') {
    const roleRatios: Record<string, number> = {
      案主管: 0.12,
      建築: 0.45,
      機電: 0.23,
      職安: 0.10,
      營管: 0.10,
    };
    baselineHC = Math.round(baselineHC * (roleRatios[selectedRole] || 0.2));
  }

  const quarterSummaries: QuarterSummaryData[] = [];
  let accumulatedScheduledHires = 0;

  QUARTERS_LIST.forEach((quarter, qIdx) => {
    const targetDate = getQuarterMidDate(quarter);

    let activeProjectsCount = 0;
    const projectDetails: ProjectQuarterDetail[] = [];

    const calculatedSum: RoleDemandBreakdown = {
      manager: 0,
      civil: 0,
      mep: 0,
      safety: 0,
      admin: 0,
      total: 0,
    };

    filteredProjects.forEach((proj) => {
      const calc = calculateSingleProjectDemand(proj, targetDate, safeConfig, delayMonths, makeOrBuyRatio);
      
      // 依工程階段切片過濾
      if (selectedPhase !== '全部階段') {
        const matchesPhase =
          (selectedPhase === '案前籌劃' && calc.stageName.includes('案前')) ||
          (selectedPhase === '地下開挖與結構' && (calc.stageName.includes('地下') || calc.stageName.includes('開挖') || calc.stageName.includes('1FL前'))) ||
          (selectedPhase === '結構施工期' && (calc.stageName.includes('結構') || calc.stageName.includes('2FL') || calc.stageName.includes('6FL'))) ||
          (selectedPhase === '上部裝修與使照' && (calc.stageName.includes('裝修') || calc.stageName.includes('使照') || calc.stageName.includes('景觀'))) ||
          (selectedPhase === '收尾交屋與保固' && (calc.stageName.includes('交屋') || calc.stageName.includes('管委會') || calc.stageName.includes('售服')));
        if (!matchesPhase) return;
      }

      if (calc.isActive) {
        activeProjectsCount += 1;
      }

      // 套用 Make or Buy (自建比率)
      const ratio = makeOrBuyRatio;
      const mVal = calc.breakdown.manager * ratio;
      const cVal = calc.breakdown.civil * ratio;
      const mepVal = calc.breakdown.mep * ratio;
      const sVal = calc.breakdown.safety * ratio;
      const aVal = calc.breakdown.admin * ratio;
      const totVal = mVal + cVal + mepVal + sVal + aVal;

      calculatedSum.manager += mVal;
      calculatedSum.civil += cVal;
      calculatedSum.mep += mepVal;
      calculatedSum.safety += sVal;
      calculatedSum.admin += aVal;
      calculatedSum.total += totVal;

      // 找出原人工計畫表對應資料
      const manualItem = manualRecords.find(
        (m) =>
          m.projectCode.toLowerCase() === proj.projectCode.toLowerCase() &&
          (m.quarter === quarter || m.quarter.replace("'", '') === quarter.replace("'", ''))
      );

      projectDetails.push({
        projectId: proj.id || proj.projectCode,
        projectCode: proj.projectCode,
        region: proj.region,
        department: proj.department || '二部',
        section: proj.section || '工務一科',
        stageName: calc.stageName,
        isActive: calc.isActive,
        aboveFloors: extractFloorNumber(proj.abovegroundFloors),
        underFloors: extractFloorNumber(proj.undergroundFloors),
        totalFloors: extractFloorNumber(proj.abovegroundFloors) + extractFloorNumber(proj.undergroundFloors),
        basementArea: extractBasementArea(proj),
        hasLandscapeVip: proj.hasLandscapeVip ?? true,
        startWorkDate: proj.startWorkDate,
        licenseFDate: proj.licenseFDate || '2028-06-30',
        handoverDate: proj.handoverDate || '2028-12-30',
        committeeDate: proj.committeeDate || '2029-03-30',
        calculated: {
          manager: Math.round(mVal * 10) / 10,
          civil: Math.round(cVal * 10) / 10,
          mep: Math.round(mepVal * 10) / 10,
          safety: Math.round(sVal * 10) / 10,
          admin: Math.round(aVal * 10) / 10,
          total: Math.round(totVal * 10) / 10,
        },
        manualTarget: manualItem ? {
          manager: manualItem.manager,
          civil: manualItem.civil,
          mep: manualItem.mep,
          safety: manualItem.safety,
          admin: manualItem.admin,
          total: manualItem.total,
        } : undefined,
        variance: manualItem ? totVal - manualItem.total : undefined,
      });
    });

    // 依選擇的職類取需求
    let targetDemand = calculatedSum.total;
    if (selectedRole === '案主管') targetDemand = calculatedSum.manager;
    else if (selectedRole === '建築') targetDemand = calculatedSum.civil;
    else if (selectedRole === '機電') targetDemand = calculatedSum.mep;
    else if (selectedRole === '職安') targetDemand = calculatedSum.safety;
    else if (selectedRole === '營管') targetDemand = calculatedSum.admin;

    // 統計人工計畫表
    const manualSumForQuarter: RoleDemandBreakdown = {
      manager: 0,
      civil: 0,
      mep: 0,
      safety: 0,
      admin: 0,
      total: 0,
    };
    manualRecords
      .filter((m) => {
        if (m.quarter !== quarter && m.quarter.replace("'", '') !== quarter.replace("'", '')) return false;
        if (selectedDepartment !== '全部單位' && m.department && m.department !== selectedDepartment) return false;
        return true;
      })
      .forEach((m) => {
        manualSumForQuarter.manager += m.manager || 0;
        manualSumForQuarter.civil += m.civil || 0;
        manualSumForQuarter.mep += m.mep || 0;
        manualSumForQuarter.safety += m.safety || 0;
        manualSumForQuarter.admin += m.admin || 0;
        manualSumForQuarter.total += m.total || 0;
      });

    let manualTargetVal = manualSumForQuarter.total;
    if (selectedRole === '案主管') manualTargetVal = manualSumForQuarter.manager;
    else if (selectedRole === '建築') manualTargetVal = manualSumForQuarter.civil;
    else if (selectedRole === '機電') manualTargetVal = manualSumForQuarter.mep;
    else if (selectedRole === '職安') manualTargetVal = manualSumForQuarter.safety;
    else if (selectedRole === '營管') manualTargetVal = manualSumForQuarter.admin;

    if (manualTargetVal === 0 && manualRecords.length === 0) {
      manualTargetVal = Math.round(targetDemand * (1 + 0.08 * Math.sin(qIdx * 0.75)));
    }

    // Power BI DAX 供給衰退模型演算:
    // CurrentQ <= BaseQ (2026Q3, index 6) -> Actual Baseline
    // CurrentQ > BaseQ -> BaselineHC * (1 - Turnover)^(CurrentQ - BaseQ) + NewHires
    let projectedSupplyVal = baselineHC;
    if (qIdx > BASE_SNAPSHOT_INDEX) {
      const quartersSinceBase = qIdx - BASE_SNAPSHOT_INDEX;
      const scheduledHire = assumption.scheduledHiresByQuarter?.[quarter] || assumption.quarterlyNewHires;
      accumulatedScheduledHires += scheduledHire;
      const decayRatio = Math.pow(1 - turnoverDecimal, quartersSinceBase);
      projectedSupplyVal = baselineHC * decayRatio + accumulatedScheduledHires;
    }

    const roundedSupply = Math.round(projectedSupplyVal);
    const roundedDemand = Math.round(targetDemand);
    const netGap = roundedDemand - roundedSupply; // 需求 - 供給
    const gapPercent = roundedDemand > 0 ? (netGap / roundedDemand) * 100 : 0;
    const isWarning = gapPercent >= (assumption.warningThresholdPercent || 15.0);

    let statusText = '供給充裕';
    if (netGap > 0 && isWarning) {
      statusText = '缺口過高 (警示)';
    } else if (netGap > 0) {
      statusText = '微幅吃緊 (需招募)';
    } else {
      statusText = '無缺口 (充裕)';
    }

    quarterSummaries.push({
      quarter,
      activeProjectsCount,
      calculatedDemand: roundedDemand,
      calculatedBreakdown: {
        manager: Math.round(calculatedSum.manager),
        civil: Math.round(calculatedSum.civil),
        mep: Math.round(calculatedSum.mep),
        safety: Math.round(calculatedSum.safety),
        admin: Math.round(calculatedSum.admin),
        total: Math.round(calculatedSum.total),
      },
      manualTargetDemand: Math.round(manualTargetVal),
      manualBreakdown: manualSumForQuarter,
      variance: Math.round(roundedDemand - manualTargetVal),
      projectedSupply: roundedSupply,
      netGap,
      gapPercent: Math.round(gapPercent * 10) / 10,
      isWarning,
      statusText,
      projectDetails,
    });
  });

  const warningQuarters = quarterSummaries.filter((q) => q.isWarning && q.netGap > 0);

  // 尋找現況基準點 2026Q3 (index 6) 之後首次出現缺口 (NetGap > 0) 的季度
  let firstGapIdx = -1;
  for (let i = BASE_SNAPSHOT_INDEX; i < quarterSummaries.length; i++) {
    if (quarterSummaries[i].netGap > 0) {
      firstGapIdx = i;
      break;
    }
  }

  const firstGapQuarter = firstGapIdx >= 0 ? QUARTERS_LIST[firstGapIdx] : null;
  // 招募啟動季度：提前 2 季 (Recruit_Trigger_Quarter = FirstGapQ - 2)
  const leadQuarters = assumption.recruitmentLeadQuarters || 2;
  const triggerIdx = firstGapIdx >= 0 ? Math.max(0, firstGapIdx - leadQuarters) : -1;
  const recruitTriggerQuarter = triggerIdx >= 0 ? QUARTERS_LIST[triggerIdx] : null;

  // 計算最大缺口與發生季
  let maxNetGap = 0;
  let maxNetGapQuarter = QUARTERS_LIST[BASE_SNAPSHOT_INDEX];
  quarterSummaries.forEach((qs) => {
    if (qs.netGap > maxNetGap) {
      maxNetGap = qs.netGap;
      maxNetGapQuarter = qs.quarter;
    }
  });

  // 取當季 (2026Q3 基準季或第 6 季) 的現況指標
  const currentQSummary = quarterSummaries[BASE_SNAPSHOT_INDEX] || quarterSummaries[0];
  const fulfillmentRateCurrent =
    currentQSummary.calculatedDemand > 0
      ? Math.round((currentQSummary.projectedSupply / currentQSummary.calculatedDemand) * 100)
      : 100;

  // 預算成本換算：人月薪資標準 (9萬/月 * 3月/季 = 27萬/季/人)
  const quarterlyCostPerFTE = payrollRate * 3;
  const estimatedPayrollBudgetQuarterly = Math.max(0, currentQSummary.netGap) * quarterlyCostPerFTE;
  const estimatedPayrollBudgetPeak = Math.max(0, maxNetGap) * quarterlyCostPerFTE;

  return {
    quarterSummaries,
    warningQuarters,
    kpiMetrics: {
      activeProjectsCount: currentQSummary.activeProjectsCount,
      totalDemandCurrent: currentQSummary.calculatedDemand,
      totalSupplyCurrent: currentQSummary.projectedSupply,
      netGapCurrent: currentQSummary.netGap,
      fulfillmentRateCurrent,
      maxNetGap,
      maxNetGapQuarter,
      firstGapQuarter,
      recruitTriggerQuarter,
      estimatedPayrollBudgetQuarterly,
      estimatedPayrollBudgetPeak,
      inHouseRatio: makeOrBuyRatio,
      delayMonths,
    },
  };
}

// ==============================================================
// 6. 職等金字塔黃金比例與接班梯隊結構分析 (Drill-through)
// 目標黃金比例：2-3 職等 20%、4 職等 40%、5-7 職等 40%
// ==============================================================
export interface DepartmentRankPyramid {
  department: string;
  totalHeadcount: number;
  junior: { count: number; percent: number; targetPercent: number; deviation: number };
  middle: { count: number; percent: number; targetPercent: number; deviation: number };
  senior: { count: number; percent: number; targetPercent: number; deviation: number };
  diagnosis: string;
  promotionPipeline: {
    eligibleMiddleEngineers: number;
    annualPromotionRate: number; // 預設每年 15%
    projectedPromotionsNextYear: number;
    projectManagerDemand: number; // 開案所需案主管人數
    shortfall: number;
    suggestion: string;
  };
}

export function getDepartmentRankPyramid(department: string): DepartmentRankPyramid {
  const deptData: Record<string, { total: number; j: number; m: number; s: number; diag: string }> = {
    全部單位: {
      total: 259,
      j: 48, // 18.5% (目標 20%)
      m: 108, // 41.7% (目標 40%)
      s: 103, // 39.8% (目標 40%)
      diag: '全公司結構接近黃金比例 (18.5% : 41.7% : 39.8%)，但基層工程師儲備略微偏低，建議擴大校園徵才儲備新血。',
    },
    二部: {
      total: 68,
      j: 15, // 22.1%
      m: 28, // 41.2%
      s: 25, // 36.8%
      diag: '二部結構健康，基層儲備充分 (22.1%)，中階梯隊堅實，未來兩年具備升任 3-4 位主管幹部之能量。',
    },
    三部: {
      total: 72,
      j: 11, // 15.3% (偏少 -4.7%)
      m: 29, // 40.3%
      s: 32, // 44.4% (偏多 +4.4%)
      diag: '三部資深主管比重偏高 (44.4% vs 目標 40%)，而基層 2-3 職等明顯不足 (15.3% vs 目標 20%)。建議將資深人力外溢支援新開案，並儘速擴編基層工程師。',
    },
    五部: {
      total: 54,
      j: 7, // 13.0% (嚴重偏低 -7.0%)
      m: 23, // 42.6%
      s: 24, // 44.4% (偏高 +4.4%)
      diag: '五部 2-3 職等基層嚴重偏少 (僅佔 13.0%)，形成「頭重腳輕」倒金字塔風險！基層現場監造人力極易出現斷層，應列為近期招募優先梯隊。',
    },
    六部: {
      total: 40,
      j: 9, // 22.5%
      m: 16, // 40.0%
      s: 15, // 37.5%
      diag: '六部職等結構均衡，4 職等副主任梯隊佔比剛好達 40% 黃金比例，適合承接後續桃竹地區新動工案場。',
    },
    七部: {
      total: 25,
      j: 6, // 24.0%
      m: 10, // 40.0%
      s: 9, // 36.0%
      diag: '七部規模精悍，各階比例相符。隨台中高雄新案展開，需規劃外調與主管培育接軌。',
    },
  };

  const raw = deptData[department] || deptData['全部單位'];
  const jPct = Math.round((raw.j / raw.total) * 1000) / 10;
  const mPct = Math.round((raw.m / raw.total) * 1000) / 10;
  const sPct = Math.round((raw.s / raw.total) * 1000) / 10;

  // 4 職等晉升 5 職等年限與接班推估 (每年約 15% 可晉升)
  const annualPromoRate = 0.15;
  const projectedPromotions = Math.round(raw.m * annualPromoRate);
  const managerDemand = Math.round(raw.total * 0.12); // 約需 12% 案主管
  const shortfall = Math.max(0, managerDemand - (raw.s + projectedPromotions));

  return {
    department,
    totalHeadcount: raw.total,
    junior: { count: raw.j, percent: jPct, targetPercent: 20, deviation: Math.round((jPct - 20) * 10) / 10 },
    middle: { count: raw.m, percent: mPct, targetPercent: 40, deviation: Math.round((mPct - 40) * 10) / 10 },
    senior: { count: raw.s, percent: sPct, targetPercent: 40, deviation: Math.round((sPct - 40) * 10) / 10 },
    diagnosis: raw.diag,
    promotionPipeline: {
      eligibleMiddleEngineers: raw.m,
      annualPromotionRate: annualPromoRate * 100,
      projectedPromotionsNextYear: projectedPromotions,
      projectManagerDemand: managerDemand,
      shortfall,
      suggestion:
        shortfall > 0
          ? `預計未來開案案主管缺口尚差 ${shortfall} 人，建議啟動外部資深主管挖角或提早 6 個月實施儲備幹部專案班！`
          : '中階人才接班管線充沛，內部升遷人數足以覆蓋未來開案主管需求。',
    },
  };
}

// ==============================================================
// 7. 單一案場 24 季生命週期各職能人數曲線試算 (Project Lifecycle View)
// ==============================================================
export interface ProjectLifecycleQuarter {
  quarter: string;
  stageName: string;
  isActive: boolean;
  manager: number;
  civil: number;
  mep: number;
  safety: number;
  admin: number;
  total: number;
}

export function calculateProjectLifecycle(
  proj: ProjectPlan,
  config: ManpowerFormulaConfig,
  delayMonths: number = 0
): ProjectLifecycleQuarter[] {
  return QUARTERS_LIST.map((quarter) => {
    const targetDate = getQuarterMidDate(quarter);
    const res = calculateSingleProjectDemand(proj, targetDate, config, delayMonths);
    return {
      quarter,
      stageName: res.stageName,
      isActive: res.isActive,
      manager: res.breakdown.manager,
      civil: res.breakdown.civil,
      mep: res.breakdown.mep,
      safety: res.breakdown.safety,
      admin: res.breakdown.admin,
      total: res.breakdown.total,
    };
  });
}

// ==============================================================
// 8. 原人工目標（既有計畫表）範例初始資料
// ==============================================================
export const INITIAL_MANUAL_TARGETS: ManualTargetDemandRecord[] = [
  {
    id: 'man-01',
    projectCode: 'FG-TY01',
    year: 2026,
    quarter: "26'Q3",
    department: '二部',
    manager: 1,
    civil: 4,
    mep: 2,
    safety: 1,
    admin: 1,
    total: 9,
    note: '合建深開挖初期高峰',
  },
  {
    id: 'man-02',
    projectCode: 'FG-TN01',
    year: 2026,
    quarter: "26'Q3",
    department: '三部',
    manager: 1,
    civil: 3,
    mep: 2,
    safety: 1,
    admin: 1,
    total: 8,
    note: '台南危評案開工',
  },
  {
    id: 'man-03',
    projectCode: 'FG-KH03',
    year: 2026,
    quarter: "26'Q3",
    department: '五部',
    manager: 1,
    civil: 3,
    mep: 2,
    safety: 1,
    admin: 1,
    total: 8,
    note: '高雄鼓山案前調度',
  },
  {
    id: 'man-04',
    projectCode: 'HH11',
    year: 2026,
    quarter: "26'Q4",
    department: '二部',
    manager: 1,
    civil: 4,
    mep: 2,
    safety: 1,
    admin: 1,
    total: 9,
    note: '板橋中型住宅動工',
  },
];
