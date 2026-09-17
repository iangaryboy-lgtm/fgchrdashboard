export interface Employee {
  id: string;
  empNo: string; // 員工編號 e.g. "FG1001"
  name: string; // 姓名
  department: string; // 部室單位 e.g. "工程一部", "工程二部", "土木部", "人力資源室", "工務企劃室"
  section: string; // 科案單位 e.g. "HM2科", "FG-KH03案", "DH3案", "企劃組"
  title: string; // 職稱 e.g. "經理", "副理", "區棟組長", "工程師", "專員"
  jobTitle?: string; // 職稱別名
  positionTitle?: string; // 職位名稱 e.g. "土建工程師", "機電工程師", "人發訓練專員", "工安工程師", "成控工程師", "品管工程師", "採購專員"
  rank: string; // 職等 e.g. "05", "06", "07", "08", "09"
  attribute: '內業' | '外業'; // 屬性 (內/外業)
  birthday: string; // 生日 YYYY-MM-DD
  seniorityStartDate: string; // 遠營年資起算日 YYYY-MM-DD
  hireDate?: string; // 到職日別名
  internalMgmtStartDate?: string; // 內部管理年資起算日 YYYY-MM-DD
  pin: string; // 預設 PIN 碼 (4 碼)
  email: string; // 電子信箱
  phone?: string; // 聯絡電話
  status: '在職' | '離職';
  currentProject?: string; // 現行案場
  currentProjectCode?: string; // 案場代碼
}

export type OrgLevel =
  | 'board'
  | 'president'
  | 'division'
  | 'department'
  | 'section'
  | '董事長'
  | '總經理'
  | '處級'
  | '部室'
  | '科案';

export interface OrgNode {
  id: string;
  name: string;
  code: string;
  level: OrgLevel;
  parentId?: string;
  leaderEmpNo?: string;
  leaderName?: string;
  leaderTitle?: string;
  headcount?: number;
  children?: OrgNode[];
}

export interface PermissionMatrixItem {
  empNo: string;
  name: string;
  department: string;
  title: string;
  canLogin: boolean; // 是否可進入前台系統
  canAccessBackend?: boolean; // 是否具備後台管理權限 (MANAGEMENT SETTING: 案主管背景設定、全域總功能設定)
  dashboardAccess: Record<string, boolean>; // e.g. { "projectPlan": true, "candidatePool": true, "surveyFill": true }
}

export interface DashboardDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault: boolean;
}

export interface GoogleAdmin {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'VIEWER';
  addedAt: string;
}

export type ReleaseStatus =
  | '現任主管-尚未達釋出條件'
  | '現任主管-已達標準釋出'
  | '現任主管-已達使照提前釋出'
  | '現任主管-已達下架啟動釋出'
  | '曾任主管-可列入遴選評估'
  | '儲備幹部-待任用評估'
  | '儲備主管-待任用評估';

export type CandidateCategory =
  | '現任主管'
  | '曾任主管'
  | '儲備幹部'
  | '儲備主管'
  | '儲備主管-待任用評估';

export interface AnnualRateItem {
  year: string; // e.g. "2026年", "2025年", "2024年"
  target: number; // e.g. 1.50 (%)
  actual: number; // e.g. 1.00 (%)
  detailCount?: string; // e.g. "131/2495"
}

export interface ProjectExpDetail {
  projectCode: string; // e.g. "FG-HC01案", "H147案"
  projectName: string; // e.g. "FG-HC01案 / 林柏宏"
  scaleType: string; // e.g. "大型住宅"
  role: string; // e.g. "案主管"
  orderLabel: string; // e.g. "前一案", "前二案", "前三案"

  // ⓪ 財務/自負盈虧
  profitRate?: number; // 自負盈虧淨利率(%) e.g. 7.8, 5.2, 3.6, -1.8

  // ① 工程進度
  licenseProgress: {
    totalDays: number; // 總工期(天) e.g. 1455
    diffDays: number; // 超前/落後(天) e.g. -41 (負數落後)
    achievementRate: number; // 達成率(%) e.g. 97.3
  };
  handoverProgress: {
    targetDate: string; // 目標日 e.g. "2026/2/13"
    actualDate: string; // 實際日 e.g. "2026/1/3"
    diffDays: number; // 超前/落後(天) e.g. 41 (正數超前)
    handoverUnits: string; // 交屋戶數(戶) e.g. "2350/2370"
  };

  // ② 品質
  qualitySupervisionScore: number; // 品質監理 全案平均(分) e.g. 91.0
  complaintRates: AnnualRateItem[]; // 客訴率(%) 近三年

  // ③ 成本
  costAdditionRates: AnnualRateItem[]; // 營造追加率(%) 近三年
  totalAdditionAmount: number; // 全案累計追加金額(元) e.g. 22398673
  totalAdditionRate: number; // 全案累計追加率(%) e.g. 0.26

  // ④ 職安
  safetySupervisionScore: number; // 職安監理 全案平均(分) e.g. 93.0
  safetySuspensionsCount: number | string; // 停工(次) e.g. 1 或 "-"
  safetyFinesAmount: number; // 罰款(元) e.g. 200000

  // ⑤ 法律事件
  legalEvents: string; // 法律事件說明
}

export interface ProjectExp {
  projectCode?: string;
  projectName: string;
  scaleType: string;
  role: string;
  periodYears: number;
}

export interface CandidateProfile {
  id?: string;
  empNo: string; // 關聯 Employee
  internalMgmtStartDate?: string; // 內部管理年資起算日
  externalMgmtYears?: number; // 外部管理年資
  blockLeaderYears?: number; // 棟組長年資
  
  // Auto-calculated / synced fields:
  name?: string;
  department?: string;
  section?: string;
  title?: string;
  rank?: string;
  birthday?: string;
  age?: number;
  seniorityStartDate?: string;
  farglorySeniorityYears: number; // 遠營年資
  internalMgmtYears: number; // 管理年資內部
  dynamicSeniority?: number; // 依據基準日動態計算之年資
  dynamicInternalMgmtYears?: number; // 依據基準日動態計算之管理年資
  
  currentProject: string; // 現職案場 (e.g. "大型廠辦", "大型住宅", "中型住宅", "-")
  currentProjectCode?: string; // e.g. "HM2案"
  completedProjectsCount: number; // 管理職完案 (e.g. 5, 3, 2, 1)
  releaseStatus: ReleaseStatus; // 釋出狀態
  releaseDate: string; // 標準釋出日-F+150 (e.g. "2028/4/14" or "-")
  releaseQuarter: string; // 釋出季度 (e.g. "2025Q4", "2026Q1", "(空白)")
  candidateCategory: CandidateCategory; // 人選分類
  
  availableRegions: ('北區' | '中區' | '南區' | '台北市' | '新北市' | '桃園市' | '台中市' | '台南市' | '高雄市' | string)[]; // 可調動區域
  transferableRegions?: any;
  specialMethods: ('帷幕牆' | '深開挖' | '逆打' | string)[]; // 特殊工法經驗
  acceptedScales?: ('特大型' | '大型案' | '中型案' | '小型案' | '大型住宅' | '大型廠辦' | '中型住宅' | '中型廠辦' | '中型商辦' | '小型住宅' | string)[]; // 可接受規模
  capableScales?: any;
  
  sevenStagesYears: {
    preProject: number; // 案前管理
    hypothesis: number; // 假設階段
    foundation: number; // 基樁/土方/基坑
    structure: number;  // 結構體
    finishing: number;  // 裝修
    landscape: number;  // 景觀/公共設施
    handover: number;   // 交屋
  };
  
  eval2025: string; // 2025績效 e.g. "甲上", "甲", "乙"
  eval2024: string; // 2024績效
  eval2023: string; // 2023績效
  evaluations?: Record<string, string>; // 多年度考績記錄 e.g. { "2025": "甲上", "2024": "甲", "2023": "甲", "2026": "甲上" }
  
  projectExperiences?: ProjectExp[]; // 經歷案場資訊

  // PK 評比專用擴充欄位 (對應遠雄營造案主管遴選 4大專案指標 PK 總表)
  photoUrl?: string; // 主管照片 (支援更換/上傳)
  engineeringScore?: number; // 工程經歷 (50%), 如 50.0
  managementScore?: number; // 管理職能 (25%), 如 16.3
  personalityScore?: number; // 人格特質 (25%), 如 16.3
  totalScore?: number; // 總分, 如 82.5
  projectExpDetails?: ProjectExpDetail[]; // 依照經歷前三案資料 (未滿三案則全數列出)

  // ===== 年度 X 季度 案主管人選需求擴充 =====
  talentPoolStatus?: '可釋出' | '一年內' | '培育中' | '現職穩定'; // 供需狀態標籤 (可釋出, 一年內, 培育中)
  expectedAvailableQuarter?: string; // 預計可釋出/承接之季度 (如 "2027Q1")
}

export type ScaleType =
  | '大型住宅'
  | '小型住宅'
  | '大型廠辦'
  | '中型廠辦'
  | '大型商辦'
  | '中型商辦'
  | '中型住宅';

export type ScaleTier = '特大型案' | '大型案' | '中型案' | '小型案';

export type BuildingCategory = '住宅' | '廠辦' | '商辦' | '專案';
export const BUILDING_CATEGORIES: BuildingCategory[] = ['住宅', '廠辦', '商辦', '專案'];

export const getProjectBuildingCategory = (p: Partial<ProjectPlan>): BuildingCategory => {
  if (p.buildingCategory) return p.buildingCategory;
  const raw = `${p.scaleType || ''} ${p.projectCode || ''} ${p.jointOrUrbanRenewal || ''}`.toLowerCase();
  if (raw.includes('廠辦') || raw.includes('工廠') || (raw.includes('園區') && raw.includes('廠'))) return '廠辦';
  if (raw.includes('商辦') || raw.includes('商業') || raw.includes('辦公') || raw.includes('總部')) return '商辦';
  if (raw.includes('專案') || raw.includes('巨蛋') || raw.includes('醫療') || raw.includes('bot') || (p.projectCode && p.projectCode.toUpperCase().startsWith('SP'))) return '專案';
  if (raw.includes('住宅') || raw.includes('大樓') || raw.includes('豪宅')) return '住宅';
  return '住宅';
};

export type SixCitiesRegion =
  | '台北市'
  | '新北市'
  | '桃園市'
  | '台中市'
  | '台南市'
  | '高雄市'
  | '其他縣市';

export interface ProjectPlan {
  id: string;
  projectCode: string; // 案別 e.g. "FG-TPE01", "FG-NT01", "FG-TC01", "FG-TY01", "FG-KH01", "FG-TN01"
  region: string; // 區域 e.g. "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "其他縣市"
  normalizedRegion?: string; // 標準化區域 e.g. "北區", "中區", "南區"
  selectionDate: string; // C-45案主管遴選日 YYYY/MM/DD
  remainingDays: number; // 距離遴選剩餘天數
  dynamicRemainingDays?: number;
  startWorkDate: string; // C+75/90開工日 YYYY/MM/DD
  permitDate: string; // C建照日 YYYY/MM/DD
  totalFloorArea: number; // 總樓地板面積(㎡)
  undergroundFloors: string; // 地下層 e.g. "7", "6", "AB棟B4、C棟B2"
  abovegroundFloors: string; // 地上層 e.g. "32", "25", "16/22"
  buildingsCount: number; // 棟數
  unitsCount: number; // 戶數
  jointOrUrbanRenewal: '合建案' | '都更案' | '合建' | '都更' | '無' | string; // 特殊條件1 合建/都更案
  defenseOrComprehensive: '防綜案' | '無' | string; // 特殊條件2 防綜案
  hazardAssessment: '危評案' | '無' | string; // 特殊條件3 危評案
  specialMethod: '深開挖' | '逆打' | '帷幕牆' | '無' | string; // 特殊條件4 特殊工法
  pricePerPing: string; // 售價(坪)
  costPerPing: string; // 造價(坪)
  scaleType: ScaleType; // 開案規模類型 e.g. "大型住宅", "中型住宅"
  computedScaleTier?: string;
  buildingCategory?: BuildingCategory; // 建築/工程類型: 住宅 | 廠辦 | 商辦 | 專案
  scaleTier?: ScaleTier; // 規模統計級距 e.g. "特大型案", "大型案", "中型案", "小型案"
  openYear: number; // 開案年度 e.g. 2026, 2028, 2029, 2030, 2032
  openQuarter: string; // 開案季度 e.g. "2026Q3", "2026Q4", "2028Q4", "2029Q1", "2029Q2", "2030Q4", "2032Q3"
  requiredLeaderCategory?: string;
  matchedLeaderEmpNo?: string;
  matchedLeaderName?: string;

  // ===== 案場人力預測與工程進度擴充欄位 =====
  isTakedownActive?: boolean; // 下架啟動 (true: 啟動中/正常, false: 暫緩/下架)
  takedownDate?: string; // 下架啟動日期
  licenseFDate?: string; // 使照日 F (YYYY-MM-DD 或 YYYY/MM/DD)
  standardReleaseDate?: string; // 標準釋出日(F+150)
  handoverDate?: string; // 交屋日 (預估可留空)
  committeeDate?: string; // 管委會成立日 (預估可留空)
  department?: string; // 所屬單位 (如 "二部", "三部", "五部", "六部", "七部")
  section?: string; // 轄下科/工務所 (如 "土建一科", "建築工務所")
  hasLandscapeVip?: boolean; // 景觀/VIP設施 (有勾選才計入土建景觀人力)
  basementArea?: number; // 地下室面積 (坪)

  // ===== 年度 X 季度 案主管人選需求擴充欄位 =====
  quarterlyLifecycleStage?: '新開案' | '在建案' | '使照案' | '未啟動' | '已結案';
  quarterlyStatusOverrides?: Record<string, '新開案' | '在建案' | '使照案'>;
}

export type QuestionType =
  | 'open_text'       // 開放式問答
  | 'single_choice'   // 單選
  | 'multiple_choice' // 多選
  | 'single_matrix'   // 單選矩陣
  | 'multi_matrix'    // 多選矩陣
  | 'ranking'         // 項目排序
  | 'rating_star';    // 星級評分

export type SurveyQuestionType = QuestionType;

export interface SurveyQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // 選項 (for choices, ranking)
  matrixRows?: string[]; // 矩陣列 (for matrix)
  matrixCols?: string[]; // 矩陣欄 (for matrix)
  maxRating?: number; // for star rating (e.g. 5)
}

export interface SurveyForm {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  category?: string;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle?: string;
  empNo: string;
  empName: string;
  department?: string;
  title?: string;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> answer
  // Synced preferences:
  availableRegions?: ('北區' | '中區' | '南區' | '台北市' | '新北市' | '桃園市' | '台中市' | '台南市' | '高雄市' | string)[];
  acceptedScales?: string[];
  snapshotImageUrl?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body?: string;
  bodyHtml?: string;
  category?: '問卷通知' | '遴選通知' | '系統登入通知' | '組織異動通知' | '一般通知' | string;
  updatedAt?: string;
}

export interface EmailDispatchLog {
  id: string;
  sentAt: string;
  sender?: string;
  recipientEmpNo: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  templateId?: string;
  status: 'sent' | 'queued' | 'failed' | 'success';
  contentPreview?: string;
}

export type EmailLog = EmailDispatchLog;

// ----------------------------------------------------
// Training & Development System Types (專業訓練與人才發展)
// ----------------------------------------------------
// 專業訓練與育碁 (aEnrich) TMS/LMS 人才培育模組類型定義
// ----------------------------------------------------

export interface TrainingCategory {
  id: string;
  name: string; // e.g. "核心職能", "專業技術", "管理領導", "通識安全", "法規檢定"
  code: string; // e.g. "CAT-CORE", "CAT-TECH"
  color?: string; // e.g. "blue", "emerald", "purple", "amber", "rose", "cyan", "indigo"
  colorTag?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TeachingRecord {
  id: string;
  courseTitle: string;
  categoryName?: string;
  trainingCategory?: string;
  deliveryType?: 'physical' | 'online' | 'blended' | string;
  batchName?: string;
  startDate?: string;
  date?: string;
  hours: number;
  ratingAverage?: number;
  satisfactionScore?: number;
  studentCount?: number;
  attendeeCount?: number;
}

export interface Instructor {
  id: string;
  type: 'internal' | 'external';
  empNo?: string; // 內部講師：關聯 Employee.empNo
  name: string;
  organization: string; // 內部為 "遠雄營造" 或部室；外部為所屬單位機構
  department?: string; // 部室單位
  title: string;
  bio?: string;
  specialties?: string[];
  expertise?: string[];
  email?: string;
  phone?: string;
  hourlyRate?: number;
  ratingAverage?: number; // 歷年平均滿意度 (5分制)
  satisfactionScore?: number; // 別名相容
  totalHoursTaught?: number; // 累計授課時數
  totalTeachingHours?: number; // 別名相容
  totalBatchesTaught?: number; // 累計開班梯次
  isActive?: boolean;
  teachingHistory?: TeachingRecord[];
  teachingRecords?: TeachingRecord[]; // 別名相容
}

export interface TrainingMaterial {
  id: string;
  title: string;
  type?: string; // 別名相容 (e.g. video)
  category?: string;
  categoryName?: string;
  fileType: 'pdf' | 'word' | 'excel' | 'ppt' | 'mp4' | 'video' | 'youtube' | 'office' | 'scorm' | 'link' | string;
  fileName?: string;
  fileSize?: string;
  fileUrl: string;
  version?: string;
  description?: string;
  uploadedAt: string;
  uploadedBy?: string;
  usedInCourseIds?: string[]; // 關聯使用中的課程代碼或名稱
  videoDurationSeconds?: number;
  convertedFrom?: 'pptx' | 'ppt' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'office' | string;
  convertedAt?: string;
  pdfPageCount?: number;
  pdfPreviewContent?: {
    pages: Array<{
      pageNumber: number;
      chapterTitle: string;
      sections: Array<{
        heading: string;
        content: string;
        points?: string[];
        highlight?: string;
        tableData?: { headers: string[]; rows: string[][] };
        diagramType?: 'flow' | 'structure' | 'cpm' | 'checkpoints';
      }>;
    }>;
  };
}

export type InteractiveQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'matching' // 連連看 / 點擊連線配對題
  | 'rating_star'
  | 'scale_1_5'
  | 'rating'
  | 'open_text';

export interface MatchingPair {
  id: string;
  leftText: string; // 左側項目名稱 (例如：工法名稱、名詞)
  rightText: string; // 右側對應正解 (例如：特性、法規要求、標準)
}

export interface InteractiveQuestion {
  id: string;
  title: string;
  type: InteractiveQuestionType;
  required: boolean;
  options?: string[];
  correctAnswer?: string | string[]; // 測驗標準答案 (單選/是非為 string，多選為 array)
  correctOptionIndices?: number[]; // 測驗正確答案索引陣列 (例如 [1] 或 [0, 2])
  matchingPairs?: MatchingPair[]; // 連連看配對項目清單
  matchingScoringMode?: 'all_or_nothing' | 'partial'; // 連連看配分機制：全對才給分 (all_or_nothing) | 按比例給分 (partial)
  points?: number; // 測驗配分 (各題配分)
  explanation?: string; // 解答解析說明
  graderEmpNo?: string; // 問答題人工批改指派主管/講師員編
  graderName?: string; // 批改人員姓名/職稱
}

export interface TrainingExamConfig {
  id: string;
  title: string;
  passingScore: number; // 及格標準分數 (例如 70)
  maxAttempts: number; // 允許重測次數 (0 表示無上限，1 表示僅限一次，3 表示最多3次)
  allowedAttempts?: number; // 允許重測次數別名
  allowRetake?: boolean; // 是否允許重測
  timeLimitMinutes?: number; // 測驗作答時限 (分鐘)
  shuffleQuestions?: boolean; // 題目順序隨機（防同仁鄰座偷看題序）
  shuffleOptions?: boolean; // 選項順序隨機（防死記 A/B/C/D 選項）
  graderName?: string; // 問答題統一批改人員
  graderEmpNo?: string;
  questions: InteractiveQuestion[];
}

export interface TrainingSurveyConfig {
  id: string;
  title: string;
  type: 'pre_course' | 'post_satisfaction' | 'pre_survey' | 'post_survey';
  description?: string;
  questions: InteractiveQuestion[];
}

export type ReviewLevel = 'direct_manager' | 'dept_manager' | 'president' | 'chairman';

export interface SmartActionItem {
  id: string;
  topic: string; // 學習知識項目
  specificGoal: string; // 具體目標 (Specific)
  measurableMetric: string; // 衡量標準 (Measurable)
  achievableAction: string; // 行動方案 (Achievable)
  timeBoundDate: string; // 達成期限 (Time-bound)
  selfScore?: number; // 同仁自評分數 (1-100)
  selfNotes?: string;
  managerScore?: number; // 主管考評分數 (1-100)
  managerNotes?: string;
  evaluatedByEmpNo?: string;
  evaluatedByName?: string;
  evaluatedAt?: string;
}

export interface SmartActionPlan {
  id: string;
  empNo: string;
  empName: string;
  department?: string;
  title?: string;
  courseId: string;
  courseTitle: string;
  batchId?: string;
  submittedAt?: string;
  createdAt?: string;
  items?: SmartActionItem[];
  goals?: any[];
  reviewLevel?: ReviewLevel;
  status: 'draft' | 'submitted' | 'pending_self_eval' | 'self_evaluated' | 'manager_evaluated' | 'in_progress' | 'completed';
  
  // Flat SMART fields
  enrollmentId?: string;
  specificGoal?: string;
  measurableMetric?: string;
  achievableAction?: string;
  relevantImpact?: string;
  relevantReason?: string;
  timeBoundDate?: string;

  // 指定自評時間與自評表單填報資料
  evaluationScheduledDate?: string; // 指定自評開放日期
  evaluationPeriodDays?: number; // 30, 60, 90, 180 天
  isSelfEvaluated?: boolean;
  selfScore?: number; // 同仁自評分數 (1-100)
  selfNotes?: string; // 自評綜合心得
  selfAchievementSummary?: string; // 具體實踐成果與事蹟
  selfMetricResult?: string; // 量化指標達成率/數據
  selfChallengesFaced?: string; // 遭遇瓶頸與克服作法
  selfEvaluatedAt?: string; // 自評送出時間
  evidenceAttachmentName?: string; // 佐證附件或紀錄說明

  // 主管考評與核決
  managerScore?: number;
  managerFeedback?: string;
  evaluatedAt?: string;
  evaluatorEmpNo?: string;
  evaluatorName?: string;
  overallScore?: number;
}

export type BatchStatus =
  | 'draft'
  | 'open'
  | 'open_enrollment'
  | 'enrollment_closed'
  | 'in_progress'
  | 'completed'
  | 'archived';

export interface CourseBatch {
  id: string;
  courseId?: string;
  batchNo?: string; // e.g. "第 01 梯次", "2026 第一期"
  name?: string;
  batchCode?: string;
  batchName?: string;
  status: BatchStatus;
  startDate?: string; // 開課日期 YYYY-MM-DD
  endDate?: string; // 結訓日期 YYYY-MM-DD
  startTime?: string; // e.g. "09:00"
  endTime?: string; // e.g. "17:00"
  location?: string; // e.g. "遠雄營造總部 12F 大會議廳" / "線上數位教室"
  primaryInstructorId?: string;
  primaryInstructorName?: string;
  onlineMeetingUrl?: string;
  allowWaitlist?: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
  watchWindowStart?: string; // 線上課程可觀看起始日
  watchWindowEnd?: string; // 線上課程可觀看截止日
  maxParticipants?: number; // 正取人數上限
  maxWaitlist?: number; // 備取人數上限
  enrollmentDeadline?: string; // 報名截止日期 YYYY-MM-DD HH:mm
  cancellationDeadline?: string; // 取消報名截止日期
  requireCancellationApproval?: boolean; // 取消報名是否需簽核
  cancellationApprovalLevel?: ReviewLevel;
  qrCodeToken?: string; // 梯次現場簽到 QR Code 識別碼
  isArchived?: boolean;
  hasAssignment?: boolean;
  assignmentConfig?: CourseAssignmentConfig;
  classroomConfig?: any;
  // 結案數據快照
  summaryStats?: {
    attendanceRate: number; // 報到率 %
    passRate: number; // 完訓通過率 %
    avgSatisfaction: number; // 滿意度均分 (5分制)
    avgExamScore: number; // 測驗平均成績
    totalEnrolled: number;
    totalPassed: number;
  };
}

export type AttendanceStatus =
  | 'not_checked_in'
  | 'checked_in'
  | 'checked_out'
  | 'present'
  | 'late'
  | 'excused_leave'
  | 'absent';

export interface CourseEnrollment {
  id: string;
  batchId: string;
  batchName?: string;
  courseId: string;
  courseTitle?: string;
  courseName?: string;
  trainingCategory?: string;
  batchNo?: string;
  empNo: string;
  empName: string;
  employeeNo?: string;
  employeeName?: string;
  studentName?: string;
  department: string;
  section?: string;
  title: string;
  rank?: string;
  hours?: number;
  credits?: number;
  watchedDurationMinutes?: number;
  quizScore?: number;
  enrollmentType: 'self_enrolled' | 'assigned_mandatory';
  deliveryType?: 'physical' | 'online' | 'blended' | string;
  listType: 'regular' | 'waitlist' | 'pending_approval'; // 正取、備取、簽核中
  waitlistRank?: number; // 備取順位 (1, 2, 3...)
  approvalStatus: 'auto_approved' | 'pending' | 'approved' | 'rejected';
  approverEmpNo?: string;
  approverName?: string;
  approverComment?: string;
  approvedAt?: string;
  enrolledAt: string;
  completedApprovalAt?: string;
  isArchived?: boolean;
  status?: 'enrolled' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed';
  
  // 實體簽到與出勤
  attendanceStatus: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  checkInMethod?: 'qr_scan' | 'student_qr_pass' | 'manual_host' | 'verification_code';
  
  // 各項通過要件達成狀態
  preSurveyCompleted?: boolean;
  materialsReadDurationMinutes?: number;
  materialsReadPercent?: number;
  videoWatchedSeconds?: number;
  videoWatchPercent?: number;
  videoCompleted?: boolean;
  chapterProgress?: Record<string, {
    watchedSeconds: number;
    completed: boolean;
    completedAt?: string;
  }>;
  examScore?: number;
  examScores?: Array<{
    score: number;
    passed: boolean;
    submittedAt: string;
    attemptNumber: number;
    userAnswers?: Record<string, any>;
  }>;
  examPassed?: boolean;
  examCompleted?: boolean;
  examAttemptsCount?: number;
  postSurveyCompleted?: boolean;
  surveyCompleted?: boolean;
  postSurveyRating?: number; // 給予該堂課之滿意度評分 (1-5)
  actionPlanSubmitted?: boolean;
  actionPlanApproved?: boolean;
  isCertified?: boolean;
  
  // 課後作業繳交與批閱
  assignmentSubmitted?: boolean;
  assignmentPassed?: boolean;
  assignmentScore?: number;
  assignmentSubmission?: CourseAssignmentSubmission;
  
  // 最終梯次判定狀態
  finalPassStatus: 'passed' | 'failed' | 'pending_evaluation' | 'in_progress';
  certificateCode?: string;
  certificateNumber?: string;
  completedAt?: string;
  passedAt?: string;
  leaveReason?: string;
}

export type AssignmentFileType = 'word' | 'excel' | 'powerpoint' | 'pdf' | 'image';

export interface CourseAssignmentConfig {
  enabled: boolean;
  title: string;
  description: string;
  gradingType: 'pass_fail' | 'score_100'; // 通過/不通過 或是 百分制批閱分數
  passingScore?: number; // 及格門檻 (例如 70 分)
  allowedFileTypes: AssignmentFileType[]; // 可指定單一或多種檔案類型
  maxFileSizeMB?: number; // 單一檔案大小上限 (MB)
  reviewerEmpNo: string; // 指定批閱人員員編
  reviewerName: string; // 指定批閱人員姓名
  reviewerRole?: string; // 批閱人員職務/角色
  oneDriveFolderPath: string; // OneDrive / SharePoint 指定儲存資料夾位置
  oneDriveShareUrl?: string; // 真實微軟 365 官方共用連結 (SharePoint / OneDrive 共用網址)
  dueDateDaysAfterCourse?: number; // 結訓後 N 天內繳交
  isRequiredForCompletion?: boolean; // 是否為完訓結業必要要件
  rubrics?: Array<{
    id: string;
    criteria: string;
    maxScore: number;
    description?: string;
  }>;
}

export interface OneDriveTransmissionLog {
  id?: string;
  timestamp: string;
  stage: 'AUTH_INIT' | 'FOLDER_VERIFY' | 'FILE_INTEGRITY' | 'NETWORK_TRANSMIT' | 'SP_INDEXING' | 'PERMISSION_GRANT' | 'RECEIPT_CONFIRM';
  stageName: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  latencyMs?: number;
  details?: string;
  httpStatus?: number;
  cloudUri?: string;
}

export interface OneDriveFolderSegment {
  name: string;
  id: string;
  status: 'exists' | 'created';
  level: number;
  permissions: 'read_write' | 'read_only';
  lastModified?: string;
}

export interface OneDriveFolderVerificationResult {
  verified: boolean;
  rawPath: string;
  canonicalPath: string;
  siteUrl: string;
  driveId: string;
  destinationId: string;
  folderDepth: number;
  segments: OneDriveFolderSegment[];
  writable: boolean;
  storageQuota?: {
    usedMB: number;
    totalMB: number;
    percentUsed: number;
  };
  verifiedAt: string;
  serverMessage?: string;
}

export interface OneDriveAuthStatus {
  authenticated: boolean;
  mode: 'live_entra_id' | 'simulated_enterprise_proxy';
  tenantId: string;
  tenantName: string;
  clientId: string;
  sharePointHost: string;
  scopes: string[];
  expiresInSeconds?: number;
  tokenType: string;
  driveName: string;
  health: 'healthy' | 'degraded' | 'offline';
  pingMs: number;
  lastChecked: string;
  // Domain environment and editable share permissions
  networkEnvironment?: 'corporate_domain' | 'external_network';
  isDomainJoined?: boolean;
  isM365Authenticated?: boolean;
  authMethod?: 'domain_sso' | 'm365_login' | 'unauthenticated';
  userAccount?: string;
  userName?: string;
  folderSharePermission?: 'can_edit' | 'can_view';
  folderShareType?: 'organization_with_link' | 'specific_people';
}

export interface M365AuthSession {
  networkEnvironment: 'corporate_domain' | 'external_network';
  isDomainJoined: boolean;
  isM365Authenticated: boolean;
  authMethod: 'domain_sso' | 'm365_login' | 'unauthenticated';
  userAccount: string;
  userName: string;
  empNo: string;
  department: string;
  tenantDomain: string;
  folderSharePermission: 'can_edit' | 'can_view';
  tokenExpiry: string;
  lastVerifiedAt: string;
}


export interface CourseAssignmentSubmission {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle?: string;
  batchId?: string;
  batchNo?: string;
  empNo: string;
  empName?: string;
  studentName?: string;
  department?: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  fileType: AssignmentFileType;
  fileUrl: string;
  oneDriveSavedPath?: string;
  oneDrivePath?: string;
  oneDriveSyncStatus?: 'synced' | 'pending' | 'failed';
  oneDriveTransmissionId?: string;
  oneDriveSharePointUrl?: string;
  oneDriveDirectUrl?: string;
  oneDriveCloudLocationVerified?: boolean;
  oneDriveEtag?: string;
  oneDriveSha256?: string;
  oneDriveTransmissionLogs?: OneDriveTransmissionLog[];
  studentNote?: string;
  notes?: string;
  status: 'submitted' | 'graded_pass' | 'graded_fail' | 'graded_score' | 'returned_for_revision' | 'pending';
  gradeStatus?: 'pending' | 'graded';
  gradeScore?: number;
  gradeResult?: 'pass' | 'fail';
  score?: number;
  passed?: boolean;
  reviewedAt?: string;
  reviewerEmpNo?: string;
  reviewerName?: string;
  reviewerFeedback?: string;
  rubricScores?: Record<string, number>;
}

export interface CourseVideoChapter {
  id: string;
  title: string;
  chapterNo?: number | string;
  sourceType?: 'mp4' | 'youtube' | 'teams_onedrive' | 'upload';
  videoSource?: 'upload' | 'youtube' | 'teams_onedrive' | 'mp4';
  videoUrl?: string;
  durationSeconds?: number;
  description?: string;
  isRequired?: boolean;
  requiredWatchPercent?: number;
}

export interface CourseVideoConfig {
  enabled: boolean;
  videoType?: 'pre_study' | 'online_core'; // 實體課程(課前預習) 或 線上課程(主要內容)
  sourceType?: 'mp4' | 'youtube' | 'teams_onedrive' | 'upload';
  videoSource?: 'upload' | 'youtube' | 'teams_onedrive' | 'mp4';
  videoUrl: string;
  videoTitle?: string;
  videoDurationSeconds?: number;
  requiredWatchSeconds?: number;
  requiredDurationSeconds?: number;
  requiredWatchPercent?: number; // 如 90%
  antiCheatingPromptIntervalMinutes?: number; // 防作弊/防掛機彈窗間隔 (分鐘/秒)
  antiCheatingResponseTimeoutSeconds?: number; // 防作弊回應時限 (秒)，逾時自動暫停跳出
  popupIntervalSeconds?: number;
  popupTimeoutSeconds?: number;
  chapters?: CourseVideoChapter[]; // 多部影片 / 章節模組清單
}

export interface InternalCourse {
  id: string;
  courseCode: string; // e.g. "TR-ENG-2026-01"
  title: string;
  category: string; // 訓練類別名稱
  categoryId?: string;
  categoryName?: string;
  courseType: 'single' | 'blended' | 'package'; // 單堂課程, 混成式, 套裝課程
  structureType?: 'single' | 'blended' | 'package' | string;
  deliveryMode: 'in_person' | 'online' | 'blended'; // 實體, 線上, 混成
  deliveryType?: 'physical' | 'online' | 'blended' | string;
  hours: number; // 課程時數
  totalHours?: number; // 課程總時數別名
  credits?: number; // 認證學分
  instructorId: string;
  instructorName: string;
  instructorType: 'internal' | 'external';
  description: string;
  learningOutcomes: string[]; // 學習目標與核心效益
  skillTags: string[]; // 職能/技能標籤 (例如：深開挖工法, 工期排程, 工安防護)
  
  // 報名簽核條件
  approvalRequired?: boolean;
  approvalLevel?: ReviewLevel | string;
  enrollmentApprovalType: 'direct' | ReviewLevel;
  
  // 測驗與問卷
  hasPreTest?: boolean;
  hasPreSurvey?: boolean;
  hasPostTest?: boolean;
  hasPostSurvey?: boolean;
  passingScore?: number;
  requireSmartActionPlan?: boolean;
  surveyFormId?: string;

  // 課後作業設定 (可指定批閱人員、評分模式、格式與 OneDrive 儲存資料夾)
  hasAssignment?: boolean;
  assignmentConfig?: CourseAssignmentConfig;

  // 學員開放對象與限制條件
  targetAudience: any;
  
  // 教材與線上影片模組
  materials: TrainingMaterial[];
  videoConfig?: CourseVideoConfig;
  
  // 互動問卷與測驗配置 (同 MS Forms 設計)
  preSurveyConfig?: TrainingSurveyConfig;
  postSurveyConfig?: TrainingSurveyConfig;
  examConfig?: TrainingExamConfig;
  
  // 課後行動計畫配置 (SMART 原則與考核天數、審核層級)
  actionPlanRequired: boolean;
  hasSmartPlan?: boolean;
  actionPlanReviewLevel?: ReviewLevel;
  smartPlanReviewLevel?: ReviewLevel | string;
  actionPlanDaysToReview?: number; // 30, 60, 90, 180 天
  
  // 完訓通過標準設定
  passingCriteria: {
    requirePreSurvey: boolean;
    minMaterialReadMinutes: number;
    minVideoWatchPercent: number; // e.g. 90
    minAttendanceHours: number;
    minExamScore: number; // e.g. 70
    requirePostSurvey: boolean;
    requireActionPlan: boolean;
    requireAssignment?: boolean;
  };
  
  // 梯次清單
  batches: CourseBatch[];
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalCourse {
  id: string;
  courseCode: string;
  category: string;
  provider: string; // 培訓主辦機構 (例如：台灣營建研究院, 勞動部職安署)
  title: string;
  hours: number;
  estimatedFee: number;
  certificateType?: string; // 證照/結訓證書名稱
  description?: string;
  skillTags: string[];
}

export interface ExternalCourseApplication {
  id: string;
  empNo: string;
  empName: string;
  department: string;
  title: string;
  courseId?: string;
  courseName?: string;
  courseTitle?: string; // 別名相容
  provider?: string;
  organizer?: string; // 別名相容
  trainingCategory?: string;
  hours?: number;
  fee?: number;
  companySubsidyFee?: number; // 別名相容
  startDate?: string;
  endDate?: string;
  reason?: string;
  learningObjective?: string; // 別名相容
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  status?: 'pending' | 'approved' | 'rejected' | string; // 別名相容
  approvalFlow?: any;
  approverName?: string;
  approvedAt?: string;
  passStatus?: 'passed' | 'failed' | 'pending_verification' | string;
  certificateUrl?: string;
  reflectionNotes?: string;
  appliedAt: string;
}

export type ExternalTrainingApplication = ExternalCourseApplication;

export interface CompetencyDefinitionItem {
  id: string;
  stageGroup: string; // 階段/維度 e.g. "假設", "基礎", "結構", "裝修", "中庭景觀", "交屋驗收", "施工管理", "職安管理", "行政作業", "數量核算", "施工計畫", "管理職能"
  category: '管理職能' | '專業職能(一) 施工管理' | '專業職能(二) 施工階段' | '專業證照' | 'OJT實務';
  subCategory: string; // e.g. "開挖及支撐工程", "連續壁工程", "模板工程", "一般裝修工程", "合約管理", "工作指導"
  targetPosition: string; // 適用職位 e.g. "土建工程人員", "機電工程人員", "工安管理人員", "人發訓練專員", "ALL"
  targetRankRange: string; // 適用職等 e.g. "二~四職等", "五~七職等", "五~七職等(主管)", "全職等"
  definitions: string[]; // 條列式專業職能定義 (1. 熟悉... 2. 製作施工要典...)
  relatedCourseIds: string[]; // 關聯內部課程 ID
  relatedCourseTitles?: string[]; // 關聯課程名稱
  relatedLicenses?: string[]; // 關聯專業證照
  courseTypeCategory?: '基礎課程' | '專業課程' | '管理課程' | '專業證照' | 'OJT實務';
  ojtTrainingMethod?: string; // 施工階段(OJT)培訓方式
  ojtEvaluationMethod?: string; // 施工階段(OJT)評估方式
  updatedAt?: string;
}

export interface LearningPathStageConfig {
  rankLabel: string; // e.g. "二~四職等 (助工員~助工師)", "五~七職等 (副工程師~正工程師)", "五~七職等 (儲備主管/棟組長)", "五~七職等 (主任~副理)"
  courseType: '基礎課程' | '專業課程' | '管理課程' | '專業證照';
  items: string[]; // e.g. ["土方工程", "安全支撐工程", "觀測系統"]
  courseIds?: string[];
}

export interface LearningPathRowItem {
  id: string;
  category: '管理職能' | '專業職能(一) 施工管理' | '專業職能(二) 施工階段' | '專業證照' | '施工階段(OJT)培訓方式' | '施工階段(OJT)評估方式';
  subCategory: string; // e.g. "案前規劃", "假設", "基礎", "結構", "裝修", "中庭景觀", "交屋驗收", "合約管理", "業主關係管理", "廠商協調", "會議管理", "職安管理", "行政作業"
  stages: {
    tier2to4: string[]; // 二~四職等 (基礎課程)
    tier5to7Prof: string[]; // 五~七職等 (專業課程)
    tier5to7Leader: string[]; // 五~七職等 (儲備主管/棟組長 管理課程)
    tier5to7Manager: string[]; // 五~七職等 (主任~副理 管理課程)
  };
  notes?: string;
}

export interface CompetencyRadarScore {
  dimension: string; // e.g. "假設", "基礎", "結構", "裝修", "中庭景觀", "行政作業", "數量核算", "施工管理", "職安管理"
  fullMark: number; // 100
  score: number; // 達成率 % e.g. 83
  benchmarkAvg?: number; // 部門基準平均 %
  completedCount?: number;
  totalRequired?: number;
  status?: 'proficient' | 'in_progress' | 'needs_improvement';
}

export interface LearningMapMatrixCell {
  trackId: string;
  rankId: string;
  mandatoryCourseIds: string[]; // 必修課程 ID
  electiveCourseIds: string[]; // 選修課程 ID
  minElectivesRequired: number; // 選修應修門數
  targetSkills?: string[];
}

export interface LearningMap {
  id: string;
  title: string; // e.g. "【外業工程師專業學習地圖】"
  category?: '外業' | '內業' | '通識' | '主管領導' | string;
  version?: string; // e.g. "2026.1 版"
  isActive?: boolean;
  description: string;
  targetRole?: string;
  targetRank?: string;
  minCreditsRequired?: number;
  requiredCourseIds?: string[];
  electiveCourseIds?: string[];
  tracks?: { id: string; name: string; filterAttributes?: string[] }[]; // 橫軸：例如 ['土建工程師', '機電工程師', '職安工程師']
  ranks?: { id: string; name: string; rankCodes: string[] }[]; // 縱軸：例如 ['助理工程員', '工程員', '助理工程師', '副工程師', '工程師']
  matrix?: LearningMapMatrixCell[];
  updatedAt: string;
}

// ----------------------------------------------------
// 證照雲與履歷管理系統類型 (License & Resume Cloud)
// ----------------------------------------------------

export interface AnnualTrainingRequirement {
  id: string;
  year: number; // e.g. 2026, 2025, 2024
  title: string; // e.g. "2026 年度外業工程師專業精進與工安品管訓練規定"
  targetDepartments: string[]; // e.g. ['工程一部', '工程二部', '工務部'] or ['ALL']
  targetRanks: string[]; // e.g. ['04', '05', '06'] or ['ALL']
  targetJobTitles?: string[]; // e.g. ['工程師', '副工程師', '主任']
  totalRequiredHours: number; // e.g. 24
  mandatoryHours: number; // e.g. 16
  mandatoryCourseIds: string[]; // e.g. ['course-deep-excavation', 'course-bim-revit']
  electiveHours: number; // e.g. 8
  minCredits?: number; // e.g. 12
  passCriteriaNotes?: string; // 考核連動與法規規定備註
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type LicenseCategory =
  | '品質管理'
  | '職業安全衛生'
  | '營造工程技術'
  | '專業技師/建築師'
  | '特種設備操作'
  | '急救與防災'
  | '綠建築/BIM'
  | '其它專業';

export type LicenseStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_review';

// 證照資料標準庫/規格母庫定義 (Master License Definition)
export interface MasterLicenseDefinition {
  id: string; // e.g. "LIC-QC-01"
  code: string; // e.g. "QC-CIVIL"
  name: string; // e.g. "公共工程品質管理人員證書 (土建組)"
  category: LicenseCategory;
  issuingAuthority: string; // e.g. "行政院公共工程委員會"
  validityYears?: number; // 證書效期 (年)，未填或 0 代表永久有效
  hasExpiry: boolean;
  renewalRequired: boolean; // 是否需定期回訓
  renewalIntervalYears?: number; // 回訓週期年限
  renewalHours?: number; // 法定回訓時數 (小時)
  renewalNotes?: string; // 回訓法規規範說明
  mandatoryRoles?: string[]; // 法定對應工務/案場職務 (如: 品管主管、品管人員)
  companySubsidyRule?: string; // 公司補助/津貼獎勵政策
  isActive: boolean; // 是否啟用中
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeLicense {
  id: string;
  empNo: string;
  empName: string;
  department: string;
  title: string;
  licenseCategory: LicenseCategory;
  licenseName: string;
  licenseNo: string; // 證照字號
  licenseCode?: string; // 證照字號/代碼別名
  issuingAuthority: string; // 發證機關
  issueDate: string; // 取得日期 YYYY-MM-DD
  expiryDate?: string; // 有效到期日 YYYY-MM-DD
  hasExpiry: boolean; // 是否有有效期限限制
  renewalRequired: boolean; // 是否需定期回訓
  renewalIntervalYears?: number; // 回訓週期年限
  renewalDeadlineDate?: string; // 下次應回訓期限
  status: LicenseStatus | any;
  attachmentUrl?: string; // 證照影本附件
  attachmentName?: string;
  notes?: string;
  verifiedBy?: string; // 審核管理者
  verifier?: string; // 審核人員姓名別名
  verifiedAt?: string;
  submittedAt?: string;
}

export interface SiteLicenseRequirement {
  id: string;
  siteName: string; // 工地或案場名稱 e.g. "FG-TN01案-新莊副都心案", "FG-KH03案-台南安平住宅案", "全公司法定職缺"
  department?: string; // 所屬工程處/部室
  licenseCategory: LicenseCategory;
  licenseName: string;
  targetLicenseName?: string; // 別名
  requiredCount?: number; // 法定/公司目標需求名額
  requiredHeadcount?: number; // 需求人數別名
  currentCount?: number; // 目前持有在職數
  assignedEmpNos?: string[]; // 已指派進駐之人員工號清單
  isMandatoryByLaw?: boolean; // 是否為法規強制配置 (如職安主管、品管員)
  mandatoryLegal?: boolean; // 別名相容
  urgencyLevel?: 'high' | 'medium' | 'low';
  status?: 'met' | 'shortage' | 'surplus'; // 達標、缺額、充裕
  notes?: string;
}

export interface DispatchTrainingRecord {
  id: string;
  empNo: string;
  empName: string;
  department: string;
  title: string;
  targetLicenseCategory: LicenseCategory;
  targetLicenseName: string;
  trainingInstitute: string; // 培訓機構 e.g. 台灣營建研究院, 職安協會
  trainingStartDate: string;
  trainingEndDate: string;
  trainingHours?: number;
  tuitionFee?: number;
  companySubsidized?: boolean;
  dispatchedBy?: string;
  dispatchedSiteName?: string;
  estimatedCost?: number;
  dispatchReason?: '工地法定缺額指派' | '個人職涯升遷培訓' | '證照定期回訓' | '主管推薦' | '專案儲備需求' | string;
  status: 'training' | 'in_training' | 'examining' | 'completed' | 'verified' | 'failed' | string; // 派訓中、考照中、結訓待填、已結訓建檔、未通過
  examDate?: string;
  resultLicenseNo?: string;
  completionDate?: string;
  completionScore?: string;
  completionNotes?: string;
  certificateAttachmentUrl?: string;
  createdDate?: string;
}

export interface LicenseNotificationConfig {
  id: string;
  enabled?: boolean;
  enableAutoNotification?: boolean;
  advanceDays?: number[]; // e.g. [90, 60, 30, 7]
  notifyDaysBefore?: number[]; // e.g. [90, 60, 30, 7]
  notifyEmployee?: boolean;
  notifyManager?: boolean;
  notifyHrAdmin?: boolean;
  notifyTargets?: ('employee' | 'department_head' | 'hr_admin')[];
  hrAdminEmails?: string[];
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  lastRunDate?: string;
  templateCategory?: 'standard' | 'formal' | 'urgent';
}

export interface WorkExperienceItem {
  id: string;
  company: string;
  department?: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  projectHighlights?: string;
}

export interface ProjectExperienceItem {
  id: string;
  projectName: string;
  scaleType: string;
  role: string;
  startDate: string;
  endDate: string;
  specialMethods?: string[];
  responsibilities?: string;
}

export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: '博士' | '碩士' | '學士' | '專科' | '高中職' | string;
  gradYear: string;
  status: '畢業' | '肄業' | '在學';
}

export interface EmployeeResumeDetail {
  empNo: string;
  name: string;
  department: string;
  title: string;
  avatarUrl?: string;
  contactEmail?: string;
  phone?: string;
  selfIntro?: string; // 個人簡介與職涯專長
  skillTags: string[]; // 專業技術關鍵字
  educationList: EducationItem[];
  workHistory: WorkExperienceItem[];
  projectHistory: ProjectExperienceItem[];
  licenses: EmployeeLicense[];
  updatedAt: string;
}

export type ActiveView =
  | 'frontend_home'
  | 'home'
  | 'frontend_project_plan'
  | 'frontend_project_gantt'
  | 'project_gantt'
  | 'frontend_quarterly_demand'
  | 'quarterly_demand'
  | 'frontend_manpower_dashboard'
  | 'manpower_dashboard'
  | 'frontend_candidate_pool'
  | 'frontend_survey_fill'
  | 'frontend_training_portal'
  | 'training_portal'
  | 'backend_global_settings'
  | 'dept_manager_matrix'
  | 'supervisor_permission_matrix'
  | 'backend_candidate_settings'
  | 'backend_project_plan_settings'
  | 'backend_project_plans'
  | 'backend_manpower_forecast_settings'
  | 'manpower_forecast_settings'
  | 'backend_training_settings'
  | 'training_settings'
  | 'backend_resume_license_settings'
  | 'resume_license_settings'
  | 'project_plans'
  | 'candidates'
  | 'survey_fill'
  | 'global_settings'
  | 'candidate_settings'
  | 'project_plan_settings';

// ==========================================
// 年度 X 季度 案主管人選需求 (Quarterly Demand)
// ==========================================
export interface QuarterDemandStats {
  quarter: string; // "2027Q1" or "27'Q1"
  quarterLabel: string; // "27 · Q1"
  year: number; // 2027
  qNumber: number; // 1, 2, 3, 4
  isForecast: boolean; // 是否為未來預測季
  timelineStageLabel: string; // "未來預測" | "當前基準" | "歷史資料"

  // 案場統計
  totalDemandCount?: number;
  totalSupplyCount?: number;
  totalProjectsCount: number; // 案場數量 (如 29 案)
  newProjectCount: number; // 新開案 (如 5 案)
  underConstructionCount: number; // 在建案 (如 18 案)
  licenseCount: number; // 使照案 (如 2 案)

  // 案主管人才庫統計
  totalTalentPoolCount: number; // 案主管人才庫總池
  availableTalentCount: number; // 可釋出 / 隨時可派任
  withinOneYearCount: number; // 一年內釋出
  inTrainingCount: number; // 培育中 (儲備梯隊)
  stableOnDutyCount?: number; // 現任在案 (現職穩定)

  // 缺口與差異數
  talentGap: number; // 人選缺口
  variance: number; // 差異數 (可供應 - 需求)

  // 專案與人才庫清單關聯 (供明細彈窗/點選穿透查看)
  newProjects: ProjectPlan[];
  underConstructionProjects: ProjectPlan[];
  licenseProjects: ProjectPlan[];
  availableCandidates: CandidateProfile[];
  withinOneYearCandidates: CandidateProfile[];
  inTrainingCandidates: CandidateProfile[];
  stableOnDutyCandidates?: CandidateProfile[];
}

export interface YearDemandStats {
  year: number;
  yearLabel: string; // "2027 年度 (116年)"
  rocYear: number; // 116
  quarters: QuarterDemandStats[];
  annualNewProjects: number;
  annualUnderConstructionPeak: number;
  annualLicenseProjects: number;
  annualTotalProjectsPeak: number;
  annualAvailableTalentAvg: number;
  annualVariance: number;
  annualGapPeak: number;
}

// ==========================================
// 案場人力預測 (Manpower Forecast) 資料結構
// ==========================================

export type ManpowerRole =
  | 'manager'
  | 'civil'
  | 'mep'
  | 'safety'
  | 'admin'
  | 'site_director'
  | 'civil_engineer'
  | 'mep_engineer'
  | 'safety_engineer'
  | 'operation_specialist';

export interface RoleDemandBreakdown {
  manager: number; // 案主管
  civil: number;   // 建築(土建)工程師
  mep: number;     // 機電工程師
  safety: number;  // 職安工程師
  admin: number;   // 外業營管專員
  total: number;   // 小計
}

// 系統試算規則參數設定
export interface ManpowerFormulaConfig {
  // 1-2-1. 案主管
  manager: {
    preWorkHeadcount: number; // 案前配置人數 (預設 1)
    resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
  };
  // 1-2-2. 土建工程師
  civil: {
    // 地上層
    aboveGround: {
      preWorkRate: number; // 案前 (預設 0.3)
      startWorkRate: number; // 動工起 (預設 1.0)
      handoverRate: number; // 交屋 (預設 0.5)
      committeeRate: number; // 管委會成立 (預設 0.25)
      resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
      divisorFloors: number; // 地上層數除數基準 (預設 15，基準人數 = 地上層數 / 除數)
    };
    // 地下層
    underGround: {
      from1FLRate: number; // 自 1FL 起 (預設 1.0)
      handoverRate: number; // 交屋 (預設 0.5)
      committeeRate: number; // 管委會成立 (預設 0.25)
      resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
      divisorArea: number; // 地下室面積除數基準 (坪/人，預設 1500，基準人數 = 地下室面積 / 除數)
    };
    // 景觀/VIP
    landscapeVip: {
      from2FLRate: number; // 2FL 起 (預設 0.5)
      from6FLRate: number; // 6FL 起 (預設 1.0)
      handoverRate: number; // 交屋 (預設 0.5)
      committeeRate: number; // 管委會成立 (預設 0.25)
      resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
      baseHeadcount: number; // 基準人數固定 (預設 1)
    };
  };
  // 1-2-3. 機電工程師
  mep: {
    preWorkRate: number; // 案前 (預設 0.5)
    startWorkRate: number; // 動工起 (預設 1.0)
    handoverRate: number; // 交屋 (預設 0.5)
    committeeRate: number; // 管委會成立 (預設 0.25)
    resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
    divisorFloors: number; // 總層數除數基準 (預設 15，基準人數 = 總層數 / 除數)
  };
  // 1-2-4. 職安工程師
  safety: {
    startWorkRate: number; // 動工起 (預設 1.0)
    resetOnLicense: boolean; // 使照後歸零 (預設 true)
    divisorFloors: number; // 總層數除數基準 (預設 25，基準人數 = 總層數 / 除數)
  };
  // 1-2-5. 外業營管專員
  admin: {
    preWorkHeadcount: number; // 案前配置人數 (預設 1)
    resetDaysAfterLicense: number; // F+幾日歸零 (預設 365)
  };
  // 工期排程比例參數 (因 1FL/2FL/6FL 無工期，以動工至使照總天數比例估算)
  scheduleRatio: {
    preWorkMonths: number; // 案前啟動月數 (預設 3 個月)
    fl1ProgressRatio: number; // 1FL 進度點比例 (預設 0.25，即 25%)
    fl2ProgressRatio: number; // 2FL 進度點比例 (預設 0.35，即 35%)
    fl6ProgressRatio: number; // 6FL 進度點比例 (預設 0.50，即 50%)
    handoverDaysAfterF: number; // 交屋預估在 F 之後天數 (預設 180 天)
    committeeDaysAfterF: number; // 管委會預估在 F 之後天數 (預設 270 天)
  };
}

// 供給面假設參數設定
export interface ManpowerSupplyAssumption {
  baselineHeadcount: number; // 起始基準人力 (目前在職人數，可自訂覆蓋)
  customBaselineByDept?: Record<string, number>; // 各部自訂基準人力
  quarterlyTurnoverRate: number; // 每季離職率 % (預設 3.0%)
  turnoverRateByRole?: Record<ManpowerRole, number>; // 各職務個別離職率
  quarterlyNewHires: number; // 每季預計新進人力 (預設 0)
  scheduledHiresByQuarter?: Record<string, number>; // 特定季度已排定新進人力 (如 "26Q3": 5)
  recruitmentLeadQuarters: number; // 招募前置季數 (預設 2 季)
  warningThresholdPercent: number; // 預警門檻 (缺口佔需求 %，預設 15%)
}

// 原人工目標 (既有計畫表) 匯入記錄
export interface ManualTargetDemandRecord {
  id: string;
  projectCode: string; // 案別
  year: number; // 年度 e.g. 2026
  month?: number; // 月份 1-12
  quarter?: string; // 季度 e.g. "26'Q3" 或 "2026Q3"
  department?: string; // 單位 e.g. "二部"
  manager?: number;
  civil?: number;
  mep?: number;
  safety?: number;
  admin?: number;
  total?: number;
  role?: ManpowerRole;
  headcount?: number;
  note?: string;
}

// 單一案場在特定季度的試算明細
export interface ProjectQuarterDetail {
  projectId?: string;
  projectCode: string;
  region: string;
  department: string;
  section: string;
  stageName: string; // 例如 "案前籌劃", "地下開挖(1FL前)", "主體結構(2-6FL)", "裝修景觀", "交屋售服", "管委會運作", "未開工/已結案"
  isActive: boolean; // 是否為現予施工中
  aboveFloors: number;
  underFloors: number;
  totalFloors: number;
  basementArea: number;
  hasLandscapeVip: boolean;
  startWorkDate: string;
  licenseFDate: string;
  handoverDate: string;
  committeeDate: string;
  calculated: RoleDemandBreakdown;
  manualTarget?: RoleDemandBreakdown;
  variance?: number; // 試算 - 人工
}

// 季度彙整資料
export interface QuarterSummaryData {
  quarter: string; // e.g. "25'Q1", "26'Q3"
  activeProjectsCount: number; // 案場數 (現予施工中)
  calculatedDemand: number; // 試算目標人力
  calculatedBreakdown: RoleDemandBreakdown;
  manualTargetDemand: number; // 原人工目標 (既有計畫表)
  manualBreakdown: RoleDemandBreakdown;
  variance: number; // 試算 vs 原工 差異
  projectedSupply: number; // 供給預測 (留任人力)
  netGap: number; // 淨缺口 (需求 - 供給)
  gapPercent: number; // 缺口佔需求 %
  isWarning: boolean; // 是否達預警門檻 (>= warningThresholdPercent)
  statusText: string; // 例如 "供給充裕", "無缺口", "需啟動招募", "缺口預警"
  estimatedPayrollBudget?: number;
  projectDetails: ProjectQuarterDetail[];
}


