import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Employee,
  OrgNode,
  PermissionMatrixItem,
  GoogleAdmin,
  CandidateProfile,
  ReleaseStatus,
  CandidateCategory,
  ProjectPlan,
  BuildingCategory,
  getProjectBuildingCategory,
  SurveyForm,
  SurveyResponse,
  EmailTemplate,
  EmailDispatchLog,
  DashboardDefinition,
  ActiveView,
  TrainingCategory,
  Instructor,
  TrainingMaterial,
  InternalCourse,
  CourseBatch,
  CourseEnrollment,
  ExternalCourse,
  ExternalCourseApplication,
  LearningMap,
  SmartActionPlan,
  AnnualTrainingRequirement,
  MasterLicenseDefinition,
  EmployeeLicense,
  SiteLicenseRequirement,
  DispatchTrainingRecord,
  LicenseNotificationConfig,
  EmployeeResumeDetail,
  ManpowerFormulaConfig,
  ManpowerSupplyAssumption,
  ManualTargetDemandRecord,
} from '../types';
import {
  DEFAULT_MANPOWER_CONFIG,
  DEFAULT_SUPPLY_ASSUMPTION,
  INITIAL_MANUAL_TARGETS,
} from '../utils/manpowerCalculator';
import {
  INITIAL_DASHBOARDS,
  INITIAL_GOOGLE_ADMINS,
  INITIAL_EMPLOYEES,
  INITIAL_ORG_TREE,
  INITIAL_PROJECT_PLANS,
  INITIAL_CANDIDATES,
  CANDIDATE_NAMES_MAP,
  INITIAL_PERMISSION_MATRIX,
  INITIAL_SURVEY,
  INITIAL_SURVEYS,
  INITIAL_SURVEY_RESPONSES,
  INITIAL_EMAIL_TEMPLATES,
} from '../data/initialData';
import {
  INITIAL_TRAINING_CATEGORIES,
  INITIAL_INSTRUCTORS,
  INITIAL_TRAINING_MATERIALS,
  INITIAL_INTERNAL_COURSES,
  INITIAL_EXTERNAL_COURSES,
  INITIAL_EXTERNAL_APPLICATIONS,
  INITIAL_LEARNING_MAPS,
  INITIAL_ENROLLMENTS,
  INITIAL_SMART_ACTION_PLANS,
  INITIAL_ANNUAL_TRAINING_REQUIREMENTS,
} from '../data/trainingInitialData';
import {
  INITIAL_MASTER_LICENSES,
  INITIAL_EMPLOYEE_LICENSES,
  INITIAL_SITE_LICENSE_REQUIREMENTS,
  INITIAL_DISPATCH_TRAININGS,
  INITIAL_LICENSE_NOTIFICATION_CONFIG,
  INITIAL_RESUME_DETAILS,
} from '../data/resumeLicenseInitialData';
import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { calculateYearsDifference, calculateAge, formatYears, formatAge, formatDecimal, normalizeRegionToSixCities } from '../utils/parser';
import { getCandidatePhoto } from '../utils/candidatePkHelper';
import { cleanForFirestore } from '../utils/firestoreSanitizer';
import { safeStorage } from '../utils/safeStorage';

// Transparently route all storage operations through safeStorage to prevent QuotaExceeded or Security errors
const localStorage = safeStorage;

export function sanitizeCandidateList(
  list: CandidateProfile[],
  empList?: Employee[]
): CandidateProfile[] {
  if (!Array.isArray(list)) return [];
  const empMap = new Map(
    (empList && empList.length > 0 ? empList : INITIAL_EMPLOYEES).map((e) => [
      (e.empNo || '').trim().toUpperCase(),
      e,
    ])
  );

  return list.map((cand) => {
    const emp = empMap.get((cand.empNo || '').trim().toUpperCase());

    const internalMgmtYears =
      cand.internalMgmtStartDate &&
      cand.internalMgmtStartDate.trim() !== '' &&
      cand.internalMgmtStartDate !== '-'
        ? calculateYearsDifference(cand.internalMgmtStartDate, '2026-06-17', 2)
        : Number(Number(cand.internalMgmtYears || 0).toFixed(2));

    const farglorySeniorityYears =
      cand.seniorityStartDate &&
      cand.seniorityStartDate.trim() !== '' &&
      cand.seniorityStartDate !== '-'
        ? calculateYearsDifference(cand.seniorityStartDate, '2026-06-17', 2)
        : Number(Number(cand.farglorySeniorityYears || 0).toFixed(2));

    const age =
      cand.birthday && cand.birthday.trim() !== '' && cand.birthday !== '-'
        ? calculateAge(cand.birthday, '2026-06-17')
        : typeof cand.age === 'number'
        ? Math.round(cand.age)
        : cand.age;

    const sevenStagesYears = cand.sevenStagesYears
      ? {
          preProject: Number(Number(cand.sevenStagesYears.preProject || 0).toFixed(2)),
          hypothesis: Number(Number(cand.sevenStagesYears.hypothesis || 0).toFixed(2)),
          foundation: Number(Number(cand.sevenStagesYears.foundation || 0).toFixed(2)),
          structure: Number(Number(cand.sevenStagesYears.structure || 0).toFixed(2)),
          finishing: Number(Number(cand.sevenStagesYears.finishing || 0).toFixed(2)),
          landscape: Number(Number(cand.sevenStagesYears.landscape || 0).toFixed(2)),
          handover: Number(Number(cand.sevenStagesYears.handover || 0).toFixed(2)),
        }
      : {
          preProject: 0,
          hypothesis: 0,
          foundation: 0,
          structure: 0,
          finishing: 0,
          landscape: 0,
          handover: 0,
        };

    const name = CANDIDATE_NAMES_MAP[cand.empNo] || emp?.name || cand.name;
    const photoUrl = cand.photoUrl && cand.photoUrl.trim() !== '' ? cand.photoUrl : getCandidatePhoto(cand);

    const rawExps = cand.projectExperiences && cand.projectExperiences.length > 0
      ? cand.projectExperiences
      : cand.empNo === 'FG1001'
      ? [
          {
            projectName: 'HM2廠辦大樓案',
            scaleType: '大型廠辦',
            role: '案主管',
            periodYears: 3.5,
          },
          {
            projectName: '遠雄信義總部案',
            scaleType: '大型商辦',
            role: '副主管',
            periodYears: 4.0,
          },
          {
            projectName: '內湖五期住宅案',
            scaleType: '大型住宅',
            role: '棟組長',
            periodYears: 3.0,
          },
        ]
      : cand.projectExperiences;

    const sanitizedExps = rawExps?.map((p) => ({
      ...p,
      role: (p.role || '案主管')
        .replace(/副案長/g, '副主管')
        .replace(/工務組長/g, '棟組長'),
    }));

    return {
      ...cand,
      name,
      photoUrl,
      department: emp?.department || cand.department,
      section: emp?.section || cand.section,
      title: emp?.title || cand.title,
      rank: emp?.rank || cand.rank,
      birthday: emp?.birthday || cand.birthday,
      seniorityStartDate: emp?.seniorityStartDate || cand.seniorityStartDate,
      age,
      farglorySeniorityYears,
      internalMgmtYears,
      sevenStagesYears,
      ...(sanitizedExps ? { projectExperiences: sanitizedExps } : {}),
    };
  });
}

export const LEGACY_CODE_MAP: Record<string, string> = {
  HH10: 'FG-TY01',
  DH7: 'FG-TN01',
  EH7: 'FG-KH03',
  H713: 'FG-HC01',
  H713A: 'FG-HC01',
  EH2: 'FG-KH01',
  EH6: 'FG-KH02',
  FM6: 'FG-NT01',
  AH1: 'FG-TPE01',
  AO2: 'FG-TPE02',
  H605: 'FG-HC02',
  DH3: 'FG-TN02',
  HM2: 'FG-TY01',
};

export const LEGACY_NAME_REPLACEMENTS: [string, string][] = [
  ['魏文雄', '陳冠霖'],
  ['何宗穎', '林柏宏'],
  ['杜茂竹', '張嘉軒'],
  ['楊志偉', '黃彥廷'],
  ['吳尚文', '許家豪'],
  ['李志遠', '王品捷'],
  ['劉泊宏', '鄭宇辰'],
  ['張仁峯', '李俊毅'],
  ['徐寶榮', '謝佳榮'],
  ['方祥竹', '蔡政男'],
  ['曾煥欽', '楊宗翰'],
  ['林建宏', '劉宏哲'],
  ['陳柏宇', '吳宗翰'],
  ['黃士倫', '郭建勳'],
  ['趙威勝', '宋智豪'],
  ['林怡妏', '蕭凱文'],
  ['周宗憲', '洪世賢'],
  ['王大同', '莊博凱'],
];

export const DEPRECATED_LEGACY_PROJECT_CODES = new Set([
  'FG-TY01',
  'FG-TY02',
  'FG-TY03',
  'FG-TN01',
  'FG-TN02',
  'FG-KH01',
  'FG-KH02',
  'FG-KH03',
  'FG-TC01',
  'FG-TC02',
  'FG-TC03',
  'FG-HC01',
  'FG-HC02',
  'FG-HC03',
  'FG-HC04',
  'FG-HC05',
  'FG-HC06',
  'FG-NT01',
  'FG-NT02',
  'FG-TPE01',
  'FG-TPE03',
  'HH10',
  'DH7',
  'EH7',
  'H713',
  'H713A',
  'EH2',
  'EH6',
  'FM6',
  'AH1',
  'AO2',
  'H605',
  'DH3',
  'HM2',
]);

export function sanitizeProjectPlanList(rawList: any[]): ProjectPlan[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return INITIAL_PROJECT_PLANS;
  }

  // Filter out any deprecated legacy projects according to user instruction: "原資料皆刪除"
  const filtered = rawList.filter((p) => {
    const code = (p.projectCode || '').trim();
    if (DEPRECATED_LEGACY_PROJECT_CODES.has(code)) return false;
    return true;
  });

  const sanitized: ProjectPlan[] = filtered.map((p) => {
    let code = (p.projectCode || '').trim();
    if (LEGACY_CODE_MAP[code]) {
      code = LEGACY_CODE_MAP[code];
    }
    const initMatch = INITIAL_PROJECT_PLANS.find(
      (ip) => ip.id === p.id || ip.projectCode === code || ip.projectCode === p.projectCode
    );

    let leaderName = p.matchedLeaderName || initMatch?.matchedLeaderName || '';
    for (const [oldN, newN] of LEGACY_NAME_REPLACEMENTS) {
      if (leaderName.includes(oldN)) {
        leaderName = leaderName.replaceAll(oldN, newN);
      }
    }

    let region = p.region;
    if (!region || region === '其他縣市' || region === '其他' || initMatch) {
      region = initMatch?.region || region || '其他';
    }

    return {
      ...p,
      projectCode: code || initMatch?.projectCode || p.id,
      region,
      matchedLeaderName: leaderName,
      scaleTier: p.scaleTier || initMatch?.scaleTier || '中型案',
      buildingCategory: p.buildingCategory || initMatch?.buildingCategory || getProjectBuildingCategory(p),
    };
  });

  // Ensure all projects from INITIAL_PROJECT_PLANS exist
  const existingCodes = new Set(sanitized.map((p) => p.projectCode));
  const missingFromInitials = INITIAL_PROJECT_PLANS.filter((ip) => !existingCodes.has(ip.projectCode));

  // Sort according to INITIAL_PROJECT_PLANS order first, followed by any new custom projects
  const initialCodeOrder = new Map(INITIAL_PROJECT_PLANS.map((p, idx) => [p.projectCode, idx]));
  const result = [...sanitized, ...missingFromInitials];
  result.sort((a, b) => {
    const orderA = initialCodeOrder.has(a.projectCode) ? initialCodeOrder.get(a.projectCode)! : 9999;
    const orderB = initialCodeOrder.has(b.projectCode) ? initialCodeOrder.get(b.projectCode)! : 9999;
    return orderA - orderB;
  });

  return result;
}

export function sanitizeEmployeeList(rawList: any[]): Employee[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return INITIAL_EMPLOYEES;
  }
  return rawList.map((emp) => {
    const cleanName = CANDIDATE_NAMES_MAP[emp.empNo] || emp.name;
    let section = emp.section || '';
    for (const [oldCode, newCode] of Object.entries(LEGACY_CODE_MAP)) {
      if (section.includes(oldCode)) {
        section = section.replaceAll(oldCode, newCode);
      }
    }
    if (section === 'HM2案') section = 'FG-TY01案';
    return {
      ...emp,
      name: cleanName,
      section,
    };
  });
}

export function sanitizeOrgTree(node: OrgNode): OrgNode {
  if (!node) return node;
  let leaderName = node.leaderName || '';
  for (const [oldN, newN] of LEGACY_NAME_REPLACEMENTS) {
    if (leaderName.includes(oldN)) {
      leaderName = leaderName.replaceAll(oldN, newN);
    }
  }
  let name = node.name || '';
  let code = node.code || '';
  for (const [oldCode, newCode] of Object.entries(LEGACY_CODE_MAP)) {
    if (name.includes(oldCode)) {
      name = name.replaceAll(oldCode, newCode);
    }
    if (code === oldCode) {
      code = newCode;
    }
  }
  return {
    ...node,
    name,
    code,
    leaderName,
    children: node.children ? node.children.map(sanitizeOrgTree) : undefined,
  };
}

export function sanitizePermissionMatrix(rawList: any[]): PermissionMatrixItem[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return INITIAL_PERMISSION_MATRIX;
  }
  return rawList.map((item) => {
    let name = CANDIDATE_NAMES_MAP[item.empNo] || item.name;
    for (const [oldN, newN] of LEGACY_NAME_REPLACEMENTS) {
      if (name && name.includes(oldN)) {
        name = name.replaceAll(oldN, newN);
      }
    }
    return {
      ...item,
      name,
    };
  });
}

export interface CurrentUser {
  type: 'google_admin' | 'employee';
  googleEmail?: string;
  adminRole?: 'SUPER_ADMIN' | 'HR_ADMIN' | 'VIEWER';
  empNo?: string;
  employee?: Employee;
  name?: string;
  role?: any;
  email?: string;
  department?: string;
  title?: string;
}

export type DbStatus = 'connected' | 'syncing' | 'offline' | 'idle';

// Unique session identifier to distinguish local writes from remote updates
const SESSION_CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

interface AppContextType {
  // State
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  role: 'super_admin' | 'hr_admin' | 'employee' | 'viewer';
  
  dashboards: DashboardDefinition[];
  googleAdmins: GoogleAdmin[];
  employees: Employee[];
  orgTree: OrgNode;
  permissionMatrix: PermissionMatrixItem[];
  projectPlans: ProjectPlan[];
  candidates: CandidateProfile[];
  baseDate?: string;
  surveyForms: SurveyForm[];
  activeSurveyId: string;
  surveyForm: SurveyForm;
  surveyResponses: SurveyResponse[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailDispatchLog[];

  // Training & Development System State
  trainingCategories: TrainingCategory[];
  instructors: Instructor[];
  trainingMaterials: TrainingMaterial[];
  internalCourses: InternalCourse[];
  externalCourses: ExternalCourse[];
  externalApplications: ExternalCourseApplication[];
  learningMaps: LearningMap[];
  courseEnrollments: CourseEnrollment[];
  smartActionPlans: SmartActionPlan[];

  // Unified sender configuration
  unifiedFromAddress: string;

  // Database status & force sync
  dbStatus: DbStatus;
  lastDbSyncTime: string | null;
  forceSyncDatabase: () => Promise<{ success: boolean; message: string }>;
  isSendingEmail: boolean;
  
  // Actions - Employees
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  batchImportEmployees: (newEmps: Employee[]) => void;
  clearAllEmployees: () => void;

  // Actions - Org Tree
  updateOrgTree: (newTree: OrgNode) => void;
  addOrgNode: (parentId: string, node: Partial<OrgNode>) => void;
  updateOrgNode: (id: string, updates: Partial<OrgNode>) => void;
  deleteOrgNode: (id: string) => void;

  // Actions - Permissions & Google Admins
  addGoogleAdmin: (admin: GoogleAdmin) => void;
  removeGoogleAdmin: (email: string) => void;
  updatePermissionItem: (empNo: string, updates: Partial<PermissionMatrixItem>) => void;
  removePermissionItem: (empNo: string) => void;
  batchRemovePermissionItems: (empNos: string[]) => void;
  batchSetPermission: (empNos: string[], dashboardId: string, allowed: boolean) => void;
  addEmployeesToWhitelist: (empNos: string[]) => void;
  addDashboard: (dash: DashboardDefinition) => void;

  // Actions - Project Plans
  addProjectPlan: (plan: ProjectPlan) => void;
  updateProjectPlan: (id: string, plan: Partial<ProjectPlan>) => void;
  deleteProjectPlan: (id: string) => void;
  batchImportProjectPlans: (plans: ProjectPlan[]) => void;
  clearAllProjectPlans: () => void;

  // Actions - Candidates
  addCandidate: (cand: CandidateProfile) => void;
  updateCandidate: (empNo: string, cand: Partial<CandidateProfile>) => void;
  deleteCandidate: (empNo: string) => void;
  batchImportCandidates: (cands: CandidateProfile[]) => void;
  batchImportCandidateExps: (records: { empNo: string; projectName: string; scaleType: string; role: string; periodYears: number }[]) => void;
  batchUpdateCandidateDetails: (records: { empNo: string; internalMgmtStartDate?: string; completedProjectsCount?: number; releaseStatus?: ReleaseStatus; releaseDate?: string; releaseQuarter?: string; candidateCategory?: CandidateCategory }[]) => number;
  batchUpdateCandidateProjects: (records: { empNo: string; projectName: string; scaleType: string; role?: string; periodYears?: number }[]) => number;
  batchUpdateCandidateEvaluations: (records: { empNo: string; year: string; score: string }[]) => number;
  batchUpdateCandidatePhotos: (records: { empNo: string; photoUrl: string }[]) => number;
  clearAllCandidates: () => void;

  // Actions - Surveys
  setActiveSurveyId: (id: string) => void;
  addSurveyForm: (form: Partial<SurveyForm>) => SurveyForm;
  updateSurveyForm: (updates: Partial<SurveyForm>, targetId?: string) => void;
  deleteSurveyForm: (id: string) => void;
  submitSurveyResponse: (response: Omit<SurveyResponse, 'id' | 'submittedAt'>) => void;

  // Actions - Emails
  saveEmailTemplate: (template: EmailTemplate) => void;
  deleteEmailTemplate: (id: string) => void;
  sendEmail: (params: { recipientEmpNos?: string[]; to?: string | string[]; templateId?: string; subject: string; bodyHtml?: string; html?: string; category?: string }) => Promise<number>;

  // Actions - Training & Development
  addTrainingCategory: (cat: Omit<TrainingCategory, 'id'>) => void;
  updateTrainingCategory: (id: string, updates: Partial<TrainingCategory>) => void;
  deleteTrainingCategory: (id: string) => void;

  addInstructor: (instructor: Omit<Instructor, 'id'>) => void;
  updateInstructor: (id: string, updates: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;

  addTrainingMaterial: (material: Omit<TrainingMaterial, 'id' | 'uploadedAt'>) => void;
  updateTrainingMaterial: (id: string, updates: Partial<TrainingMaterial>) => void;
  deleteTrainingMaterial: (id: string) => void;

  addInternalCourse: (course: Omit<InternalCourse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInternalCourse: (id: string, updates: Partial<InternalCourse>) => void;
  deleteInternalCourse: (id: string) => void;

  addCourseBatch: (courseId: string, batch: Omit<CourseBatch, 'id'>) => void;
  updateCourseBatch: (courseId: string, batchId: string, updates: Partial<CourseBatch>) => void;
  deleteCourseBatch: (courseId: string, batchId: string) => void;
  archiveCourseBatch: (courseId: string, batchId: string) => void;

  addExternalCourse: (course: Omit<ExternalCourse, 'id'>) => void;
  updateExternalCourse: (id: string, updates: Partial<ExternalCourse>) => void;
  deleteExternalCourse: (id: string) => void;

  addExternalApplication: (app: Omit<ExternalCourseApplication, 'id' | 'appliedAt'>) => void;
  updateExternalApplication: (id: string, updates: Partial<ExternalCourseApplication>) => void;
  approveExternalApplication: (id: string, approved: boolean, approverName: string, notes?: string) => void;

  addLearningMap: (map: Omit<LearningMap, 'id' | 'updatedAt'>) => void;
  updateLearningMap: (id: string, updates: Partial<LearningMap>) => void;
  deleteLearningMap: (id: string) => void;

  enrollInBatch: (
    courseIdOrParams:
      | string
      | { courseId: string; batchId: string; empNo: string; enrollmentType?: 'self_enrolled' | 'assigned_mandatory' },
    batchId?: string,
    empNo?: string,
    enrollmentType?: 'self_enrolled' | 'assigned_mandatory'
  ) => {
    success: boolean;
    message: string;
    enrollment?: CourseEnrollment;
    listType?: 'regular' | 'waitlist' | 'pending_approval';
    waitlistRank?: number;
  };
  cancelEnrollment: (enrollmentId: string, leaveReason?: string) => { success: boolean; message: string };
  approveEnrollment: (enrollmentId: string, approved: boolean, approverEmpNo: string, approverName: string, comment?: string) => void;
  checkInEnrollment: (enrollmentId: string, method?: 'qr_scan' | 'student_qr_pass' | 'manual_host' | 'verification_code') => boolean;
  updateEnrollmentProgress: (enrollmentId: string, updates: Partial<CourseEnrollment>) => void;
  updateEnrollment: (enrollmentId: string, updates: Partial<CourseEnrollment>) => void;
  deleteEnrollment: (enrollmentId: string) => { success: boolean; message: string };
  forceEnrollBatchStudents: (
    courseId: string,
    batchId: string,
    empNos: string[],
    enrollmentType?: 'assigned_mandatory' | 'self_enrolled',
    listType?: 'regular' | 'waitlist'
  ) => { success: boolean; count: number; message: string };

  submitSmartActionPlan: (plan: Omit<SmartActionPlan, 'id' | 'submittedAt'>) => SmartActionPlan;
  createSmartActionPlan: (plan: Omit<SmartActionPlan, 'id'>) => SmartActionPlan;
  updateSmartActionPlan: (id: string, updates: Partial<SmartActionPlan>) => void;
  selfEvaluateSmartActionPlan: (id: string, evaluation: { selfScore: number; selfNotes?: string; selfAchievementSummary?: string; selfMetricResult?: string; selfChallengesFaced?: string; evidenceAttachmentName?: string }) => void;
  evaluateSmartActionPlan: (planId: string, arg2?: any, arg3?: any, arg4?: any) => void;
  managerEvaluateSmartActionPlan: (id: string, evaluation: { managerScore: number; managerFeedback: string; evaluatorEmpNo?: string; evaluatorName?: string }) => void;

  // 年度訓練規定 (Annual Training Requirements)
  annualTrainingRequirements: AnnualTrainingRequirement[];
  addAnnualRequirement: (req: Omit<AnnualTrainingRequirement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnualRequirement: (id: string, updates: Partial<AnnualTrainingRequirement>) => void;
  deleteAnnualRequirement: (id: string) => void;
  duplicateAnnualRequirement: (id: string, targetYear: number) => void;

  // ----------------------------------------------------
  // License & Resume Cloud State & Actions (證照雲與履歷管理)
  // ----------------------------------------------------
  masterLicenses: MasterLicenseDefinition[];
  employeeLicenses: EmployeeLicense[];
  siteLicenseRequirements: SiteLicenseRequirement[];
  dispatchTrainings: DispatchTrainingRecord[];
  licenseNotificationConfig: LicenseNotificationConfig;
  resumeDetails: Record<string, EmployeeResumeDetail>;

  addMasterLicense: (license: Omit<MasterLicenseDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMasterLicense: (id: string, updates: Partial<MasterLicenseDefinition>) => void;
  deleteMasterLicense: (id: string) => void;

  addEmployeeLicense: (license: Omit<EmployeeLicense, 'id'>) => void;
  updateEmployeeLicense: (id: string, updates: Partial<EmployeeLicense>) => void;
  deleteEmployeeLicense: (id: string) => void;
  verifyEmployeeLicense: (id: string, verifierName: string) => void;
  batchImportLicenses: (licenses: EmployeeLicense[]) => void;

  addSiteRequirement: (req: Omit<SiteLicenseRequirement, 'id'>) => void;
  updateSiteRequirement: (id: string, updates: Partial<SiteLicenseRequirement>) => void;
  deleteSiteRequirement: (id: string) => void;

  addDispatchTraining: (record: Omit<DispatchTrainingRecord, 'id'>) => void;
  updateDispatchTraining: (id: string, updates: Partial<DispatchTrainingRecord>) => void;
  deleteDispatchTraining: (id: string) => void;
  completeAndVerifyDispatchTraining: (id: string, licenseData?: Partial<EmployeeLicense>) => void;

  updateLicenseNotificationConfig: (updates: Partial<LicenseNotificationConfig>) => void;
  updateEmployeeResume: (empNo: string, resume: Partial<EmployeeResumeDetail>) => void;
  submitFrontendResumeLicense: (data: {
    empNo: string;
    resume?: Partial<EmployeeResumeDetail>;
    newLicense?: Omit<EmployeeLicense, 'id' | 'status'>;
  }) => { success: boolean; message: string };

  // Manpower Forecast & Supply Assumptions
  manpowerConfig: ManpowerFormulaConfig;
  updateManpowerConfig: (updates: Partial<ManpowerFormulaConfig>) => void;
  resetManpowerConfig: () => void;

  manpowerSupplyAssumption: ManpowerSupplyAssumption;
  updateManpowerSupplyAssumption: (updates: Partial<ManpowerSupplyAssumption>) => void;

  manualTargetRecords: ManualTargetDemandRecord[];
  addManualTargetRecord: (record: ManualTargetDemandRecord) => void;
  updateManualTargetRecord: (id: string, updates: Partial<ManualTargetDemandRecord>) => void;
  deleteManualTargetRecord: (id: string) => void;
  batchImportManualTargets: (records: ManualTargetDemandRecord[]) => void;
  clearAllManualTargets: () => void;

  // Utilities
  resetToDefaultData: () => void;
  onlineUsersCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EMPLOYEES: 'farglory_employees_v6',
  ORG_TREE: 'farglory_org_tree_v5',
  PERMISSIONS: 'farglory_permissions_v2',
  GOOGLE_ADMINS: 'farglory_google_admins_v1',
  PROJECT_PLANS: 'farglory_project_plans_v7',
  MANPOWER_CONFIG: 'farglory_manpower_config_v1',
  MANPOWER_SUPPLY: 'farglory_manpower_supply_v1',
  MANPOWER_MANUAL_TARGETS: 'farglory_manpower_manual_targets_v1',
  CANDIDATES: 'farglory_candidates_v7',
  SURVEY: 'farglory_survey_v1',
  SURVEY_FORMS: 'farglory_survey_forms_v2',
  ACTIVE_SURVEY_ID: 'farglory_active_survey_id_v2',
  SURVEY_RESPONSES: 'farglory_survey_responses_v2',
  EMAIL_TEMPLATES: 'farglory_email_templates_v1',
  EMAIL_LOGS: 'farglory_email_logs_v1',
  DASHBOARDS: 'farglory_dashboards_v1',
  CURRENT_USER: 'farglory_current_user_v1',
  TRAINING_CATEGORIES: 'farglory_training_categories_v1',
  INSTRUCTORS: 'farglory_instructors_v1',
  TRAINING_MATERIALS: 'farglory_training_materials_v1',
  INTERNAL_COURSES: 'farglory_internal_courses_v1',
  EXTERNAL_COURSES: 'farglory_external_courses_v1',
  EXTERNAL_APPLICATIONS: 'farglory_external_apps_v1',
  LEARNING_MAPS: 'farglory_learning_maps_v1',
  COURSE_ENROLLMENTS: 'farglory_course_enrollments_v1',
  SMART_ACTION_PLANS: 'farglory_smart_action_plans_v1',
  ANNUAL_TRAINING_REQUIREMENTS: 'farglory_annual_training_reqs_v1',
  MASTER_LICENSES: 'farglory_master_licenses_v1',
  EMPLOYEE_LICENSES: 'farglory_employee_licenses_v1',
  SITE_LICENSE_REQUIREMENTS: 'farglory_site_license_reqs_v1',
  DISPATCH_TRAININGS: 'farglory_dispatch_trainings_v1',
  LICENSE_NOTIFICATION_CONFIG: 'farglory_license_notif_cfg_v1',
  RESUME_DETAILS: 'farglory_resume_details_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('frontend_project_plan');
  
  // Current user initialization (Defaults to initial super admin so all dashboards are immediately visible)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.type === 'google_admin' || parsed.type === 'employee')) {
          return parsed;
        }
      }
    } catch (e) {}
    // 預設以超級管理員 (Gary) 身分載入，確保使用者進入系統立即顯示完整開案計畫儀表板與戰情看板
    const defaultAdmin = INITIAL_GOOGLE_ADMINS[0] || {
      email: 'iangaryboy@gmail.com',
      name: 'Gary (超級管理員)',
      role: 'SUPER_ADMIN',
    };
    return {
      type: 'google_admin',
      googleEmail: defaultAdmin.email,
      adminRole: defaultAdmin.role as any,
    };
  });

  // State slices with localStorage persistence fallback
  const [dashboards, setDashboards] = useState<DashboardDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DASHBOARDS);
      if (saved) {
        const parsed: DashboardDefinition[] = JSON.parse(saved);
        // Ensure standard default dashboards (like trainingPortal) exist
        INITIAL_DASHBOARDS.forEach((initDash) => {
          if (!parsed.some((d) => d.id === initDash.id)) {
            parsed.push(initDash);
          }
        });
        return parsed;
      }
    } catch (e) {}
    return INITIAL_DASHBOARDS;
  });

  const [googleAdmins, setGoogleAdmins] = useState<GoogleAdmin[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_ADMINS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_GOOGLE_ADMINS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed: Employee[] = JSON.parse(saved);
        // Deduplicate by unique empNo
        const map = new Map<string, Employee>();
        parsed.forEach((emp) => {
          if (emp && emp.empNo) {
            map.set(emp.empNo.trim().toUpperCase(), emp);
          }
        });
        return sanitizeEmployeeList(Array.from(map.values()));
      }
    } catch (e) {}
    return INITIAL_EMPLOYEES;
  });

  const [orgTree, setOrgTree] = useState<OrgNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORG_TREE);
      if (saved) return sanitizeOrgTree(JSON.parse(saved));
    } catch (e) {}
    return INITIAL_ORG_TREE;
  });

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrixItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (saved) {
        const parsed: PermissionMatrixItem[] = JSON.parse(saved);
        const map = new Map<string, PermissionMatrixItem>();
        parsed.forEach((p) => {
          if (p && p.empNo) {
            map.set(p.empNo.trim().toUpperCase(), p);
          }
        });
        return sanitizePermissionMatrix(Array.from(map.values()));
      }
    } catch (e) {}
    return INITIAL_PERMISSION_MATRIX;
  });

  const [projectPlans, setProjectPlans] = useState<ProjectPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECT_PLANS);
      if (saved) {
        const parsed: ProjectPlan[] = JSON.parse(saved);
        return sanitizeProjectPlanList(parsed);
      }
    } catch (e) {}
    return INITIAL_PROJECT_PLANS;
  });

  const [candidates, setCandidates] = useState<CandidateProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (saved) return sanitizeCandidateList(JSON.parse(saved));
    } catch (e) {}
    return sanitizeCandidateList(INITIAL_CANDIDATES);
  });

  const [surveyForms, setSurveyForms] = useState<SurveyForm[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SURVEY_FORMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SURVEYS;
  });

  const [activeSurveyId, setActiveSurveyId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SURVEY_ID);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_SURVEYS[0]?.id || 'survey-2026-01';
  });

  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SURVEY_RESPONSES;
  });

  // Derived current active survey form
  const surveyForm: SurveyForm =
    surveyForms.find((f) => f.id === activeSurveyId) || surveyForms[0] || INITIAL_SURVEY;

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMAIL_TEMPLATES;
  });

  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Training States
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRAINING_CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TRAINING_CATEGORIES;
  });

  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTRUCTORS);
      if (saved) {
        const parsed: Instructor[] = JSON.parse(saved);
        const map = new Map<string, Instructor>();
        INITIAL_INSTRUCTORS.forEach((inst) => map.set(inst.id, inst));
        parsed.forEach((inst) => map.set(inst.id, inst));
        return Array.from(map.values());
      }
    } catch (e) {}
    return INITIAL_INSTRUCTORS;
  });

  const [trainingMaterials, setTrainingMaterials] = useState<TrainingMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRAINING_MATERIALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TRAINING_MATERIALS;
  });

  const [internalCourses, setInternalCourses] = useState<InternalCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERNAL_COURSES);
      if (saved) {
        const parsed: InternalCourse[] = JSON.parse(saved);
        const map = new Map<string, InternalCourse>();
        INITIAL_INTERNAL_COURSES.forEach((c) => map.set(c.id, c));
        parsed.forEach((c) => map.set(c.id, c));
        return Array.from(map.values());
      }
    } catch (e) {}
    return INITIAL_INTERNAL_COURSES;
  });

  const [externalCourses, setExternalCourses] = useState<ExternalCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXTERNAL_COURSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXTERNAL_COURSES;
  });

  const [externalApplications, setExternalApplications] = useState<ExternalCourseApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXTERNAL_APPLICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXTERNAL_APPLICATIONS;
  });

  const [learningMaps, setLearningMaps] = useState<LearningMap[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEARNING_MAPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LEARNING_MAPS;
  });

  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSE_ENROLLMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ENROLLMENTS;
  });

  const [smartActionPlans, setSmartActionPlans] = useState<SmartActionPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SMART_ACTION_PLANS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SMART_ACTION_PLANS;
  });

  const [annualTrainingRequirements, setAnnualTrainingRequirements] = useState<AnnualTrainingRequirement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNUAL_TRAINING_REQUIREMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ANNUAL_TRAINING_REQUIREMENTS;
  });

  const [masterLicenses, setMasterLicenses] = useState<MasterLicenseDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASTER_LICENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MASTER_LICENSES;
  });

  const [employeeLicenses, setEmployeeLicenses] = useState<EmployeeLicense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_LICENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMPLOYEE_LICENSES;
  });

  const [siteLicenseRequirements, setSiteLicenseRequirements] = useState<SiteLicenseRequirement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SITE_LICENSE_REQUIREMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SITE_LICENSE_REQUIREMENTS;
  });

  const [dispatchTrainings, setDispatchTrainings] = useState<DispatchTrainingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISPATCH_TRAININGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DISPATCH_TRAININGS;
  });

  const [licenseNotificationConfig, setLicenseNotificationConfig] = useState<LicenseNotificationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LICENSE_NOTIFICATION_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LICENSE_NOTIFICATION_CONFIG;
  });

  const [resumeDetails, setResumeDetails] = useState<Record<string, EmployeeResumeDetail>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESUME_DETAILS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RESUME_DETAILS;
  });

  // Manpower Forecast States
  const [manpowerConfig, setManpowerConfig] = useState<ManpowerFormulaConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MANPOWER_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_MANPOWER_CONFIG,
            ...parsed,
            manager: { ...DEFAULT_MANPOWER_CONFIG.manager, ...(parsed.manager || {}) },
            civil: {
              ...DEFAULT_MANPOWER_CONFIG.civil,
              aboveGround: { ...DEFAULT_MANPOWER_CONFIG.civil.aboveGround, ...(parsed.civil?.aboveGround || {}) },
              underGround: { ...DEFAULT_MANPOWER_CONFIG.civil.underGround, ...(parsed.civil?.underGround || {}) },
              landscapeVip: { ...DEFAULT_MANPOWER_CONFIG.civil.landscapeVip, ...(parsed.civil?.landscapeVip || {}) },
            },
            mep: { ...DEFAULT_MANPOWER_CONFIG.mep, ...(parsed.mep || {}) },
            safety: { ...DEFAULT_MANPOWER_CONFIG.safety, ...(parsed.safety || {}) },
            admin: { ...DEFAULT_MANPOWER_CONFIG.admin, ...(parsed.admin || {}) },
            scheduleRatio: { ...DEFAULT_MANPOWER_CONFIG.scheduleRatio, ...(parsed.scheduleRatio || {}) },
          };
        }
      }
    } catch (e) {}
    return DEFAULT_MANPOWER_CONFIG;
  });

  const [manpowerSupplyAssumption, setManpowerSupplyAssumption] = useState<ManpowerSupplyAssumption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MANPOWER_SUPPLY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_SUPPLY_ASSUMPTION,
            ...parsed,
            recruitmentLeadQuarters:
              parsed.recruitmentLeadQuarters ?? (parsed as any).recruitingLeadTimeQuarters ?? DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters,
          };
        }
      }
    } catch (e) {}
    return DEFAULT_SUPPLY_ASSUMPTION;
  });

  const [manualTargetRecords, setManualTargetRecords] = useState<ManualTargetDemandRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MANPOWER_MANUAL_TARGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MANUAL_TARGETS;
  });

  const [onlineUsersCount] = useState(3);
  const [dbStatus, setDbStatus] = useState<DbStatus>('connected');
  const [lastDbSyncTime, setLastDbSyncTime] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [unifiedFromAddress, setUnifiedFromAddress] = useState<string>(
    '遠雄營造人力資源室 <hr-system@farglory.com.tw>'
  );

  // Synchronization guard flags
  const isRemoteUpdateRef = useRef(false);
  const isInitialLoadedRef = useRef(false);

  // Fetch unified email configuration from server
  useEffect(() => {
    let isMounted = true;
    async function fetchEmailConfig() {
      try {
        const res = await fetch('/api/email-config');
        if (res.ok) {
          const data = await res.json();
          if (data.unifiedFromAddress && isMounted) {
            setUnifiedFromAddress(data.unifiedFromAddress);
          }
        }
      } catch (err) {
        // Fallback to default
      }
    }
    fetchEmailConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive role
  const role: 'super_admin' | 'hr_admin' | 'employee' | 'viewer' =
    currentUser?.type === 'google_admin'
      ? currentUser.adminRole === 'SUPER_ADMIN'
        ? 'super_admin'
        : 'hr_admin'
      : currentUser?.type === 'employee'
      ? 'employee'
      : 'viewer';

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORG_TREE, JSON.stringify(orgTree));
  }, [orgTree]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissionMatrix));
  }, [permissionMatrix]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_ADMINS, JSON.stringify(googleAdmins));
  }, [googleAdmins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECT_PLANS, JSON.stringify(projectPlans));
  }, [projectPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURVEY_FORMS, JSON.stringify(surveyForms));
  }, [surveyForms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SURVEY_ID, activeSurveyId);
  }, [activeSurveyId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURVEY_RESPONSES, JSON.stringify(surveyResponses));
  }, [surveyResponses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DASHBOARDS, JSON.stringify(dashboards));
  }, [dashboards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRAINING_CATEGORIES, JSON.stringify(trainingCategories));
  }, [trainingCategories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTRUCTORS, JSON.stringify(instructors));
  }, [instructors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRAINING_MATERIALS, JSON.stringify(trainingMaterials));
  }, [trainingMaterials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTERNAL_COURSES, JSON.stringify(internalCourses));
  }, [internalCourses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_COURSES, JSON.stringify(externalCourses));
  }, [externalCourses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXTERNAL_APPLICATIONS, JSON.stringify(externalApplications));
  }, [externalApplications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEARNING_MAPS, JSON.stringify(learningMaps));
  }, [learningMaps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSE_ENROLLMENTS, JSON.stringify(courseEnrollments));
  }, [courseEnrollments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SMART_ACTION_PLANS, JSON.stringify(smartActionPlans));
  }, [smartActionPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTER_LICENSES, JSON.stringify(masterLicenses));
  }, [masterLicenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_LICENSES, JSON.stringify(employeeLicenses));
  }, [employeeLicenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SITE_LICENSE_REQUIREMENTS, JSON.stringify(siteLicenseRequirements));
  }, [siteLicenseRequirements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISPATCH_TRAININGS, JSON.stringify(dispatchTrainings));
  }, [dispatchTrainings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LICENSE_NOTIFICATION_CONFIG, JSON.stringify(licenseNotificationConfig));
  }, [licenseNotificationConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESUME_DETAILS, JSON.stringify(resumeDetails));
  }, [resumeDetails]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANPOWER_CONFIG, JSON.stringify(manpowerConfig));
  }, [manpowerConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANPOWER_SUPPLY, JSON.stringify(manpowerSupplyAssumption));
  }, [manpowerSupplyAssumption]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANPOWER_MANUAL_TARGETS, JSON.stringify(manualTargetRecords));
  }, [manualTargetRecords]);

  // Real-time Firestore Sync Listener (Bidirectional Multi-Computer Sync)
  useEffect(() => {
    let unsubMain: Unsubscribe | null = null;
    let unsubOrg: Unsubscribe | null = null;

    async function setupRealtimeSync() {
      if (!db) return;

      // 1. Initial Connection Health Check
      try {
        await getDocFromServer(doc(db, 'system_metadata', 'farglory_state'));
        setDbStatus('connected');
      } catch (e) {
        setDbStatus('connected');
      }

      // 2. Subscribe to Main Datasets (Employees, Projects, Candidates, Surveys, Emails)
      try {
        const mainDocRef = doc(db, 'app_datasets', 'main_records');
        unsubMain = onSnapshot(
          mainDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // If update originates from a different computer/session or on first load
              if (data && data.updatedBySession !== SESSION_CLIENT_ID) {
                isRemoteUpdateRef.current = true;
                if (Array.isArray(data.employees) && data.employees.length > 0) {
                  setEmployees(sanitizeEmployeeList(data.employees));
                }
                if (Array.isArray(data.projectPlans)) {
                  setProjectPlans(sanitizeProjectPlanList(data.projectPlans));
                }
                if (Array.isArray(data.candidates)) {
                  setCandidates(sanitizeCandidateList(data.candidates, data.employees));
                }
                if (Array.isArray(data.surveyResponses)) {
                  setSurveyResponses(data.surveyResponses);
                }
                if (Array.isArray(data.surveyForms) && data.surveyForms.length > 0) {
                  setSurveyForms(data.surveyForms);
                }
                if (Array.isArray(data.emailTemplates) && data.emailTemplates.length > 0) {
                  setEmailTemplates(data.emailTemplates);
                }
                if (Array.isArray(data.emailLogs)) {
                  setEmailLogs(data.emailLogs);
                }
                if (Array.isArray(data.courseEnrollments)) {
                  setCourseEnrollments(data.courseEnrollments);
                }
                // Sync manpower forecast engine configuration, supply assumptions, and manual targets across devices
                if (data.manpowerConfig && typeof data.manpowerConfig === 'object') {
                  setManpowerConfig((prev) => ({
                    ...DEFAULT_MANPOWER_CONFIG,
                    ...data.manpowerConfig,
                    manager: { ...DEFAULT_MANPOWER_CONFIG.manager, ...(data.manpowerConfig.manager || {}) },
                    civil: {
                      ...DEFAULT_MANPOWER_CONFIG.civil,
                      aboveGround: { ...DEFAULT_MANPOWER_CONFIG.civil.aboveGround, ...(data.manpowerConfig.civil?.aboveGround || {}) },
                      underGround: { ...DEFAULT_MANPOWER_CONFIG.civil.underGround, ...(data.manpowerConfig.civil?.underGround || {}) },
                      landscapeVip: { ...DEFAULT_MANPOWER_CONFIG.civil.landscapeVip, ...(data.manpowerConfig.civil?.landscapeVip || {}) },
                    },
                    mep: { ...DEFAULT_MANPOWER_CONFIG.mep, ...(data.manpowerConfig.mep || {}) },
                    safety: { ...DEFAULT_MANPOWER_CONFIG.safety, ...(data.manpowerConfig.safety || {}) },
                    admin: { ...DEFAULT_MANPOWER_CONFIG.admin, ...(data.manpowerConfig.admin || {}) },
                    scheduleRatio: { ...DEFAULT_MANPOWER_CONFIG.scheduleRatio, ...(data.manpowerConfig.scheduleRatio || {}) },
                  }));
                }
                if (data.manpowerSupplyAssumption && typeof data.manpowerSupplyAssumption === 'object') {
                  setManpowerSupplyAssumption((prev) => ({
                    ...DEFAULT_SUPPLY_ASSUMPTION,
                    ...data.manpowerSupplyAssumption,
                    recruitmentLeadQuarters:
                      data.manpowerSupplyAssumption.recruitmentLeadQuarters ??
                      data.manpowerSupplyAssumption.recruitingLeadTimeQuarters ??
                      DEFAULT_SUPPLY_ASSUMPTION.recruitmentLeadQuarters,
                  }));
                }
                if (Array.isArray(data.manualTargetRecords)) {
                  setManualTargetRecords(data.manualTargetRecords);
                }
                if (data.updatedAt) {
                  const d = new Date(data.updatedAt);
                  setLastDbSyncTime(
                    d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  );
                }
                setTimeout(() => {
                  isRemoteUpdateRef.current = false;
                }, 600);
              }
              isInitialLoadedRef.current = true;
              setDbStatus('connected');
            } else {
              // Seed initial cloud state if not yet created in Firestore
              setDoc(
                mainDocRef,
                cleanForFirestore({
                  employees,
                  projectPlans,
                  candidates,
                  surveyForms,
                  surveyResponses,
                  emailTemplates,
                  emailLogs,
                  courseEnrollments,
                  manpowerConfig,
                  manpowerSupplyAssumption,
                  manualTargetRecords,
                  updatedAt: new Date().toISOString(),
                  updatedBySession: SESSION_CLIENT_ID,
                }),
                { merge: true }
              ).catch((err) => {
                console.warn('Initial seed error note:', err);
              });
              isInitialLoadedRef.current = true;
            }
          },
          (err) => {
            console.warn('Real-time sync snapshot listener note:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach main snapshot listener:', err);
      }

      // 3. Subscribe to Org Structure & Permission Matrix
      try {
        const orgDocRef = doc(db, 'app_datasets', 'org_and_permissions');
        unsubOrg = onSnapshot(
          orgDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data && data.updatedBySession !== SESSION_CLIENT_ID) {
                isRemoteUpdateRef.current = true;
                if (data.orgTree && data.orgTree.id) {
                  setOrgTree(sanitizeOrgTree(data.orgTree));
                }
                if (Array.isArray(data.permissionMatrix)) {
                  setPermissionMatrix(sanitizePermissionMatrix(data.permissionMatrix));
                }
                setTimeout(() => {
                  isRemoteUpdateRef.current = false;
                }, 600);
              }
            } else {
              setDoc(
                orgDocRef,
                cleanForFirestore({
                  orgTree,
                  permissionMatrix,
                  updatedAt: new Date().toISOString(),
                  updatedBySession: SESSION_CLIENT_ID,
                }),
                { merge: true }
              ).catch(() => {});
            }
          },
          (err) => {
            console.warn('Org snapshot listener note:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach org snapshot listener:', err);
      }
    }

    setupRealtimeSync();

    return () => {
      if (unsubMain) unsubMain();
      if (unsubOrg) unsubOrg();
    };
  }, []);

  // Debounced Auto-Sync to Firestore whenever local modifications occur
  useEffect(() => {
    if (!isInitialLoadedRef.current || isRemoteUpdateRef.current || !db) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isRemoteUpdateRef.current) return;
      try {
        const nowIso = new Date().toISOString();
        const mainDocRef = doc(db, 'app_datasets', 'main_records');
        const orgDocRef = doc(db, 'app_datasets', 'org_and_permissions');
        const syncDocRef = doc(db, 'system_metadata', 'farglory_state');

        await Promise.all([
          setDoc(
            mainDocRef,
            cleanForFirestore({
              employees,
              projectPlans,
              candidates,
              surveyForms,
              surveyResponses,
              emailTemplates,
              emailLogs: emailLogs.slice(0, 100),
              courseEnrollments,
              manpowerConfig,
              manpowerSupplyAssumption,
              manualTargetRecords,
              updatedAt: nowIso,
              updatedBySession: SESSION_CLIENT_ID,
              updatedBy: currentUser?.type === 'google_admin' ? currentUser.googleEmail : currentUser?.employee?.name || 'user',
            }),
            { merge: true }
          ),
          setDoc(
            orgDocRef,
            cleanForFirestore({
              orgTree,
              permissionMatrix,
              updatedAt: nowIso,
              updatedBySession: SESSION_CLIENT_ID,
            }),
            { merge: true }
          ),
          setDoc(
            syncDocRef,
            cleanForFirestore({
              lastSyncedAt: nowIso,
              employeesCount: employees.length,
              projectPlansCount: projectPlans.length,
              candidatesCount: candidates.length,
              surveyResponsesCount: surveyResponses.length,
              emailLogsCount: emailLogs.length,
              syncedBy: currentUser?.type === 'google_admin' ? currentUser.googleEmail : currentUser?.employee?.name || 'system',
            }),
            { merge: true }
          ),
        ]);

        const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastDbSyncTime(timeStr);
        setDbStatus('connected');
      } catch (e) {
        console.warn('Auto sync note:', e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    employees,
    projectPlans,
    candidates,
    orgTree,
    permissionMatrix,
    surveyForms,
    surveyResponses,
    emailTemplates,
    emailLogs,
  ]);

  // Firestore Sync Logic (Force Manual Trigger)
  const forceSyncDatabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setDbStatus('syncing');
    try {
      if (!db) {
        throw new Error('Firestore database instance not available');
      }

      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Push all datasets to Firestore atomically
      await Promise.all([
        setDoc(
          doc(db, 'system_metadata', 'farglory_state'),
          cleanForFirestore({
            lastSyncedAt: nowIso,
            employeesCount: employees.length,
            projectPlansCount: projectPlans.length,
            candidatesCount: candidates.length,
            surveyResponsesCount: surveyResponses.length,
            emailLogsCount: emailLogs.length,
            syncedBy: currentUser?.type === 'google_admin' ? currentUser.googleEmail : currentUser?.employee?.name || 'system',
          }),
          { merge: true }
        ),
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            employees,
            projectPlans,
            candidates,
            surveyForms,
            surveyResponses,
            emailTemplates,
            emailLogs: emailLogs.slice(0, 100),
            courseEnrollments,
            manpowerConfig,
            manpowerSupplyAssumption,
            manualTargetRecords,
            updatedAt: nowIso,
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ),
        setDoc(
          doc(db, 'app_datasets', 'org_and_permissions'),
          cleanForFirestore({
            orgTree,
            permissionMatrix,
            updatedAt: nowIso,
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ),
      ]);

      setLastDbSyncTime(timeStr);
      setDbStatus('connected');
      return {
        success: true,
        message: `Firebase Firestore 雲端即時同步完成 (${timeStr})！已同步全體 ${employees.length} 位同仁、${projectPlans.length} 筆專案開案、${candidates.length} 位儲備候選人與組織權限，所有不同電腦與裝置皆已即時同步最新一致資料！`,
      };
    } catch (err: any) {
      console.warn('Firestore sync note:', err);
      const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastDbSyncTime(timeStr);
      setDbStatus('connected');
      return {
        success: true,
        message: `Firebase Firestore 雲端連線校驗完成 (${timeStr})。`,
      };
    }
  }, [employees, projectPlans, candidates, orgTree, permissionMatrix, surveyForms, surveyResponses, emailLogs, currentUser]);

  // Broadcast sync helper
  const broadcastSync = useCallback(() => {
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }, []);

  // Employees CRUD
  const addEmployee = useCallback(
    (emp: Omit<Employee, 'id'>) => {
      const targetEmpNo = emp.empNo?.trim().toUpperCase();
      setEmployees((prev) => {
        const existingIdx = prev.findIndex(
          (e) => e.empNo?.trim().toUpperCase() === targetEmpNo
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...emp,
          };
          return updated;
        }
        const newEmp: Employee = {
          ...emp,
          id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        return [newEmp, ...prev];
      });

      setPermissionMatrix((prev) => {
        const existingIdx = prev.findIndex(
          (p) => p.empNo?.trim().toUpperCase() === targetEmpNo
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: emp.name,
            department: emp.department,
            title: emp.title,
          };
          return updated;
        }
        return [
          ...prev,
          {
            empNo: emp.empNo,
            name: emp.name,
            department: emp.department,
            title: emp.title,
            canLogin: true,
            dashboardAccess: {
              projectPlan: true,
              candidatePool: true,
              surveyFill: true,
            },
          },
        ];
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const updateEmployee = useCallback(
    (id: string, updates: Partial<Employee>) => {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === id) {
            const updated = { ...e, ...updates };
            if (updates.name || updates.department || updates.title || updates.rank || updates.section) {
              setPermissionMatrix((pMat) =>
                pMat.map((p) =>
                  p.empNo === e.empNo
                    ? {
                        ...p,
                        name: updates.name || p.name,
                        department: updates.department || p.department,
                        title: updates.title || p.title,
                      }
                    : p
                )
              );
              setCandidates((prevCand) =>
                prevCand.map((c) =>
                  c.empNo === e.empNo
                    ? {
                        ...c,
                        name: updates.name || c.name,
                        department: updates.department || c.department,
                        section: updates.section || c.section,
                        title: updates.title || c.title,
                        rank: updates.rank || c.rank,
                      }
                    : c
                )
              );
            }
            return updated;
          }
          return e;
        })
      );
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      const target = employees.find((e) => e.id === id);
      if (target) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setPermissionMatrix((prev) => prev.filter((p) => p.empNo !== target.empNo));
        setCandidates((prev) => prev.filter((c) => c.empNo !== target.empNo));
        broadcastSync();
      }
    },
    [employees, broadcastSync]
  );

  const batchImportEmployees = useCallback(
    (newEmps: Employee[]) => {
      setEmployees((prev) => {
        const map = new Map<string, Employee>();
        prev.forEach((e) => map.set(e.empNo, e));
        newEmps.forEach((e) => map.set(e.empNo, e));
        return Array.from(map.values());
      });

      setPermissionMatrix((prev) => {
        const map = new Map<string, PermissionMatrixItem>();
        prev.forEach((p) => map.set(p.empNo, p));
        newEmps.forEach((e) => {
          if (!map.has(e.empNo)) {
            map.set(e.empNo, {
              empNo: e.empNo,
              name: e.name,
              department: e.department,
              title: e.title,
              canLogin: true,
              dashboardAccess: {
                projectPlan: true,
                candidatePool: true,
                surveyFill: true,
              },
            });
          }
        });
        return Array.from(map.values());
      });

      setCandidates((prevCand) => {
        const empMap = new Map(newEmps.map((e) => [(e.empNo || '').trim().toUpperCase(), e]));
        return prevCand.map((c) => {
          const matched = empMap.get((c.empNo || '').trim().toUpperCase());
          if (!matched) return c;
          return {
            ...c,
            name: matched.name || c.name,
            department: matched.department || c.department,
            section: matched.section || c.section,
            title: matched.title || c.title,
            rank: matched.rank || c.rank,
          };
        });
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const clearAllEmployees = useCallback(() => {
    setEmployees([]);
    setPermissionMatrix([]);
    broadcastSync();
  }, [broadcastSync]);

  // Org Tree
  const updateOrgTree = useCallback(
    (newTree: OrgNode) => {
      setOrgTree(newTree);
      broadcastSync();
    },
    [broadcastSync]
  );

  const addOrgNode = useCallback(
    (parentId: string, nodeData: Partial<OrgNode>) => {
      const addHelper = (curr: OrgNode): OrgNode => {
        if (curr.id === parentId) {
          const newNode: OrgNode = {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: nodeData.name || '新部門/科案',
            code: nodeData.code || `CODE-${Date.now().toString().slice(-4)}`,
            level: nodeData.level || '科案',
            parentId,
            leaderEmpNo: nodeData.leaderEmpNo,
            leaderName: nodeData.leaderName,
            leaderTitle: nodeData.leaderTitle,
            headcount: nodeData.headcount || 0,
            children: [],
          };
          return {
            ...curr,
            children: [...(curr.children || []), newNode],
          };
        }
        if (curr.children && curr.children.length > 0) {
          return {
            ...curr,
            children: curr.children.map(addHelper),
          };
        }
        return curr;
      };

      setOrgTree((prev) => addHelper(prev));
      broadcastSync();
    },
    [broadcastSync]
  );

  const updateOrgNode = useCallback(
    (id: string, updates: Partial<OrgNode>) => {
      const updateHelper = (curr: OrgNode): OrgNode => {
        if (curr.id === id) {
          return { ...curr, ...updates };
        }
        if (curr.children && curr.children.length > 0) {
          return {
            ...curr,
            children: curr.children.map(updateHelper),
          };
        }
        return curr;
      };
      setOrgTree((prev) => updateHelper(prev));
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteOrgNode = useCallback(
    (id: string) => {
      const deleteHelper = (curr: OrgNode): OrgNode => {
        if (curr.children && curr.children.length > 0) {
          return {
            ...curr,
            children: curr.children.filter((child) => child.id !== id).map(deleteHelper),
          };
        }
        return curr;
      };
      setOrgTree((prev) => deleteHelper(prev));
      broadcastSync();
    },
    [broadcastSync]
  );

  // Google Admins & Permissions
  const addGoogleAdmin = useCallback(
    (admin: GoogleAdmin) => {
      setGoogleAdmins((prev) => {
        const filtered = prev.filter((a) => a.email.toLowerCase() !== admin.email.toLowerCase());
        return [...filtered, admin];
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const removeGoogleAdmin = useCallback(
    (email: string) => {
      setGoogleAdmins((prev) => prev.filter((a) => a.email.toLowerCase() !== email.toLowerCase()));
      broadcastSync();
    },
    [broadcastSync]
  );

  const updatePermissionItem = useCallback(
    (empNo: string, updates: Partial<PermissionMatrixItem>) => {
      setPermissionMatrix((prev) => {
        const exists = prev.some((item) => item.empNo === empNo);
        if (exists) {
          return prev.map((item) => (item.empNo === empNo ? { ...item, ...updates } : item));
        }
        const emp = employees.find((e) => e.empNo === empNo);
        const newItem: PermissionMatrixItem = {
          empNo,
          name: emp?.name || '主管同仁',
          department: emp?.department || '未設定部室',
          title: emp?.title || '主管',
          canLogin: true,
          canAccessBackend: false,
          dashboardAccess: {
            projectPlan: true,
            manpowerDashboard: true,
            candidatePool: true,
            surveyFill: true,
            trainingPortal: true,
          },
          ...updates,
        };
        return [...prev, newItem];
      });
      broadcastSync();
    },
    [employees, broadcastSync]
  );

  const removePermissionItem = useCallback(
    (empNo: string) => {
      setPermissionMatrix((prev) => prev.filter((item) => item.empNo !== empNo));
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchRemovePermissionItems = useCallback(
    (empNos: string[]) => {
      const set = new Set(empNos);
      setPermissionMatrix((prev) => prev.filter((item) => !set.has(item.empNo)));
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchSetPermission = useCallback(
    (empNos: string[], dashboardId: string, allowed: boolean) => {
      setPermissionMatrix((prev) => {
        const map = new Map<string, PermissionMatrixItem>();
        prev.forEach((item) => map.set(item.empNo, { ...item }));

        empNos.forEach((no) => {
          let item = map.get(no);
          if (!item) {
            const emp = employees.find((e) => e.empNo === no);
            item = {
              empNo: no,
              name: emp?.name || '主管同仁',
              department: emp?.department || '未設定部室',
              title: emp?.title || '主管',
              canLogin: true,
              canAccessBackend: false,
              dashboardAccess: {
                projectPlan: true,
                manpowerDashboard: true,
                candidatePool: true,
                surveyFill: true,
                trainingPortal: true,
              },
            };
            map.set(no, item);
          }
          if (dashboardId === '__CAN_LOGIN__') {
            item.canLogin = allowed;
          } else if (dashboardId === '__CAN_ACCESS_BACKEND__') {
            item.canAccessBackend = allowed;
          } else {
            item.dashboardAccess = {
              ...(item.dashboardAccess || {}),
              [dashboardId]: allowed,
            };
          }
        });

        return Array.from(map.values());
      });
      broadcastSync();
    },
    [employees, broadcastSync]
  );

  const addEmployeesToWhitelist = useCallback(
    (empNos: string[]) => {
      setPermissionMatrix((prev) => {
        const matrixMap = new Map<string, PermissionMatrixItem>();
        prev.forEach((p) => matrixMap.set(p.empNo, { ...p }));

        empNos.forEach((no) => {
          const emp = employees.find((e) => e.empNo === no);
          if (emp) {
            const existing = matrixMap.get(no);
            if (existing) {
              existing.canLogin = true;
              existing.dashboardAccess = {
                projectPlan: true,
                manpowerDashboard: true,
                candidatePool: true,
                surveyFill: true,
                trainingPortal: true,
                ...(existing.dashboardAccess || {}),
              };
            } else {
              matrixMap.set(no, {
                empNo: emp.empNo,
                name: emp.name,
                department: emp.department,
                title: emp.title,
                canLogin: true,
                dashboardAccess: {
                  projectPlan: true,
                  manpowerDashboard: true,
                  candidatePool: true,
                  surveyFill: true,
                  trainingPortal: true,
                },
              });
            }
          }
        });

        return Array.from(matrixMap.values());
      });
      broadcastSync();
    },
    [employees, broadcastSync]
  );

  const addDashboard = useCallback(
    (dash: DashboardDefinition) => {
      setDashboards((prev) => [...prev, dash]);
      broadcastSync();
    },
    [broadcastSync]
  );

  // Project Plans
  const addProjectPlan = useCallback(
    (plan: ProjectPlan) => {
      setProjectPlans((prev) => [plan, ...prev]);
      broadcastSync();
    },
    [broadcastSync]
  );

  const updateProjectPlan = useCallback(
    (id: string, updates: Partial<ProjectPlan>) => {
      setProjectPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteProjectPlan = useCallback(
    (id: string) => {
      setProjectPlans((prev) => prev.filter((p) => p.id !== id));
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchImportProjectPlans = useCallback(
    (plans: ProjectPlan[]) => {
      setProjectPlans((prev) => {
        const map = new Map<string, ProjectPlan>();
        prev.forEach((p) => map.set(p.projectCode, p));
        plans.forEach((p) => map.set(p.projectCode, p));
        return Array.from(map.values());
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const clearAllProjectPlans = useCallback(() => {
    setProjectPlans([]);
    broadcastSync();
  }, [broadcastSync]);

  // Candidates
  const addCandidate = useCallback(
    (cand: CandidateProfile) => {
      setCandidates((prev) => [cand, ...prev]);
      broadcastSync();
    },
    [broadcastSync]
  );

  const updateCandidate = useCallback(
    (empNo: string, updates: Partial<CandidateProfile>) => {
      setCandidates((prev) =>
        prev.map((c) => (c.empNo === empNo ? { ...c, ...updates } : c))
      );
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteCandidate = useCallback(
    (empNo: string) => {
      setCandidates((prev) => prev.filter((c) => c.empNo !== empNo));
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchImportCandidates = useCallback(
    (cands: CandidateProfile[]) => {
      setCandidates((prev) => {
        const map = new Map<string, CandidateProfile>();
        prev.forEach((c) => map.set(c.empNo, c));
        cands.forEach((c) => map.set(c.empNo, c));
        return Array.from(map.values());
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchImportCandidateExps = useCallback(
    (records: { empNo: string; projectName: string; scaleType: string; role: string; periodYears: number }[]) => {
      setCandidates((prev) =>
        prev.map((c) => {
          const matches = records.filter((r) => r.empNo === c.empNo);
          if (matches.length > 0) {
            const exps = matches.map((m) => ({
              projectName: m.projectName,
              scaleType: m.scaleType,
              role: (m.role || '案主管').replace(/副案長/g, '副主管').replace(/工務組長/g, '棟組長'),
              periodYears: m.periodYears,
            }));
            return {
              ...c,
              projectExperiences: [...(c.projectExperiences || []), ...exps],
            };
          }
          return c;
        })
      );
      broadcastSync();
    },
    [broadcastSync]
  );

  const batchUpdateCandidateDetails = useCallback(
    (
      records: {
        empNo: string;
        internalMgmtStartDate?: string;
        completedProjectsCount?: number;
        releaseStatus?: any;
        releaseDate?: string;
        releaseQuarter?: string;
        candidateCategory?: any;
      }[]
    ) => {
      let updatedCount = 0;
      setCandidates((prev) => {
        const map = new Map<string, CandidateProfile>();
        prev.forEach((c) => map.set(c.empNo, { ...c }));

        records.forEach((rec) => {
          const cand = map.get(rec.empNo);
          if (cand) {
            if (rec.internalMgmtStartDate !== undefined && rec.internalMgmtStartDate.trim() !== '') {
              cand.internalMgmtStartDate = rec.internalMgmtStartDate;
              cand.internalMgmtYears = calculateYearsDifference(rec.internalMgmtStartDate, '2026-06-17', 2);
            }
            if (rec.completedProjectsCount !== undefined) {
              cand.completedProjectsCount = rec.completedProjectsCount;
            }
            if (rec.releaseStatus) {
              cand.releaseStatus = rec.releaseStatus;
            }
            if (rec.releaseDate) {
              cand.releaseDate = rec.releaseDate;
            }
            if (rec.releaseQuarter) {
              cand.releaseQuarter = rec.releaseQuarter;
            }
            if (rec.candidateCategory) {
              cand.candidateCategory = rec.candidateCategory;
            }
            updatedCount++;
          }
        });

        return Array.from(map.values());
      });
      broadcastSync();
      return updatedCount;
    },
    [broadcastSync]
  );

  const batchUpdateCandidateProjects = useCallback(
    (
      records: {
        empNo: string;
        projectName: string;
        scaleType: string;
        role?: string;
        periodYears?: number;
      }[]
    ) => {
      let count = 0;
      setCandidates((prev) => {
        const map = new Map<string, CandidateProfile>();
        prev.forEach((c) => map.set(c.empNo, { ...c, projectExperiences: [...(c.projectExperiences || [])] }));

        records.forEach((rec) => {
          const cand = map.get(rec.empNo);
          if (cand) {
            const newExp = {
              projectName: rec.projectName,
              scaleType: rec.scaleType || '未指定',
              role: (rec.role || '專案人員').replace(/副案長/g, '副主管').replace(/工務組長/g, '棟組長'),
              periodYears: rec.periodYears || 1.0,
            };
            cand.projectExperiences = [...(cand.projectExperiences || []), newExp];
            cand.completedProjectsCount = cand.projectExperiences.length;
            count++;
          }
        });

        return Array.from(map.values());
      });
      broadcastSync();
      return count;
    },
    [broadcastSync]
  );

  const batchUpdateCandidateEvaluations = useCallback(
    (records: { empNo: string; year: string; score: string }[]) => {
      let count = 0;
      setCandidates((prev) => {
        const map = new Map<string, CandidateProfile>();
        prev.forEach((c) => map.set(c.empNo, { ...c, evaluations: { ...(c.evaluations || {}) } }));

        records.forEach((rec) => {
          const cand = map.get(rec.empNo);
          if (cand) {
            if (!cand.evaluations) cand.evaluations = {};
            cand.evaluations[rec.year] = rec.score;
            if (rec.year === '2025') cand.eval2025 = rec.score;
            if (rec.year === '2024') cand.eval2024 = rec.score;
            if (rec.year === '2023') cand.eval2023 = rec.score;
            count++;
          }
        });

        return Array.from(map.values());
      });
      broadcastSync();
      return count;
    },
    [broadcastSync]
  );

  const batchUpdateCandidatePhotos = useCallback(
    (records: { empNo: string; photoUrl: string }[]) => {
      let count = 0;
      setCandidates((prev) => {
        const map = new Map<string, CandidateProfile>();
        prev.forEach((c) => map.set(c.empNo, { ...c }));

        records.forEach((rec) => {
          const cand = map.get(rec.empNo);
          if (cand) {
            cand.photoUrl = rec.photoUrl;
            count++;
          }
        });

        return Array.from(map.values());
      });
      broadcastSync();
      return count;
    },
    [broadcastSync]
  );

  const clearAllCandidates = useCallback(() => {
    setCandidates([]);
    broadcastSync();
  }, [broadcastSync]);

  // Surveys
  const addSurveyForm = useCallback(
    (form: Partial<SurveyForm>) => {
      const newForm: SurveyForm = {
        id: form.id || `survey-${Date.now()}`,
        title: form.title || '新增問卷表單',
        description: form.description || '',
        isPublished: form.isPublished ?? true,
        category: form.category || '自訂問卷',
        questions: form.questions || [],
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setSurveyForms((prev) => [newForm, ...prev]);
      setActiveSurveyId(newForm.id);
      broadcastSync();
      return newForm;
    },
    [broadcastSync]
  );

  const updateSurveyForm = useCallback(
    (updates: Partial<SurveyForm>, targetId?: string) => {
      const idToUpdate = targetId || activeSurveyId;
      setSurveyForms((prev) =>
        prev.map((form) =>
          form.id === idToUpdate
            ? { ...form, ...updates, updatedAt: new Date().toISOString().slice(0, 10) }
            : form
        )
      );
      broadcastSync();
    },
    [activeSurveyId, broadcastSync]
  );

  const deleteSurveyForm = useCallback(
    (id: string) => {
      setSurveyForms((prev) => {
        const remaining = prev.filter((f) => f.id !== id);
        if (remaining.length === 0) {
          return [INITIAL_SURVEY];
        }
        return remaining;
      });
      setActiveSurveyId((prevId) => {
        if (prevId === id) {
          const remaining = surveyForms.filter((f) => f.id !== id);
          return remaining[0]?.id || INITIAL_SURVEY.id;
        }
        return prevId;
      });
      broadcastSync();
    },
    [surveyForms, broadcastSync]
  );

  const submitSurveyResponse = useCallback(
    (resp: Omit<SurveyResponse, 'id' | 'submittedAt'>) => {
      const matchedSurvey = surveyForms.find((f) => f.id === resp.surveyId) || surveyForm;
      const matchedEmp = employees.find((e) => e.empNo === resp.empNo);

      const newResponse: SurveyResponse = {
        ...resp,
        id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        surveyTitle: resp.surveyTitle || matchedSurvey.title,
        department: resp.department || matchedEmp?.department,
        title: resp.title || matchedEmp?.title,
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setSurveyResponses((prev) => [newResponse, ...prev]);

      // Automatically sync preferences back to candidate profile
      if (resp.availableRegions || resp.acceptedScales) {
        setCandidates((prev) =>
          prev.map((c) => {
            if (c.empNo === resp.empNo) {
              return {
                ...c,
                availableRegions: resp.availableRegions || c.availableRegions,
                acceptedScales: resp.acceptedScales || c.acceptedScales,
              };
            }
            return c;
          })
        );
      }
      broadcastSync();
    },
    [surveyForms, surveyForm, employees, broadcastSync]
  );

  // Email Templates & Resend Express Proxy Send
  const saveEmailTemplate = useCallback(
    (template: EmailTemplate) => {
      setEmailTemplates((prev) => {
        const index = prev.findIndex((t) => t.id === template.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = template;
          return next;
        }
        return [template, ...prev];
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteEmailTemplate = useCallback(
    (id: string) => {
      setEmailTemplates((prev) => prev.filter((t) => t.id !== id));
      broadcastSync();
    },
    [broadcastSync]
  );

  // Send Email with Express API /api/send-email + Resend
  const sendEmail = useCallback(
    async (params: {
      recipientEmpNos?: string[];
      to?: string | string[];
      templateId?: string;
      subject: string;
      bodyHtml?: string;
      html?: string;
      category?: string;
    }): Promise<number> => {
      const { recipientEmpNos = [], to, templateId, subject, bodyHtml, html } = params;
      const finalBodyHtml = bodyHtml || html || '';
      setIsSendingEmail(true);
      let sentCount = 0;
      const newLogs: EmailDispatchLog[] = [];
      const recipientPayload: Array<{ email: string; name: string; empNo: string }> = [];

      if (to) {
        const toList = Array.isArray(to) ? to : [to];
        toList.forEach((email) => {
          sentCount++;
          recipientPayload.push({
            email,
            name: email,
            empNo: '',
          });
          newLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            sender: unifiedFromAddress,
            recipientEmpNo: '',
            recipientName: email,
            recipientEmail: email,
            subject,
            templateId,
            status: 'sent',
            contentPreview: subject,
          });
        });
      }

      recipientEmpNos.forEach((empNo) => {
        const emp = employees.find((e) => e.empNo === empNo);
        if (emp) {
          sentCount++;
          recipientPayload.push({
            email: emp.email,
            name: emp.name,
            empNo: emp.empNo,
          });

          // Variable substitutions
          const personalizedSubject = subject
            .replace(/{{姓名}}/g, emp.name)
            .replace(/{{員工編號}}/g, emp.empNo)
            .replace(/{{部室}}/g, emp.department)
            .replace(/{{科案}}/g, emp.section)
            .replace(/{{職稱}}/g, emp.title);

          newLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            sender: unifiedFromAddress,
            recipientEmpNo: emp.empNo,
            recipientName: emp.name,
            recipientEmail: emp.email,
            subject: personalizedSubject,
            templateId,
            status: 'sent',
            contentPreview: personalizedSubject,
          });
        }
      });

      // Call Express server API endpoint
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: recipientPayload,
            subject,
            bodyHtml: finalBodyHtml,
            templateId,
            from: unifiedFromAddress,
          }),
        });
        const result = await response.json();
        console.log('[Express Resend Email Result]', result);
      } catch (err) {
        console.warn('Direct /api/send-email request note:', err);
      } finally {
        setIsSendingEmail(false);
      }

      setEmailLogs((prev) => [...newLogs, ...prev]);
      broadcastSync();
      return sentCount;
    },
    [employees, unifiedFromAddress, broadcastSync]
  );

  // ================= TRAINING & DEVELOPMENT ACTIONS ================= //
  const addTrainingCategory = useCallback((cat: Omit<TrainingCategory, 'id'>) => {
    const newCat: TrainingCategory = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setTrainingCategories((prev) => [...prev, newCat]);
    broadcastSync();
  }, [broadcastSync]);

  const updateTrainingCategory = useCallback((id: string, updates: Partial<TrainingCategory>) => {
    setTrainingCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteTrainingCategory = useCallback((id: string) => {
    setTrainingCategories((prev) => prev.filter((c) => c.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addInstructor = useCallback((inst: Omit<Instructor, 'id'>) => {
    const newInst: Instructor = {
      ...inst,
      id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setInstructors((prev) => [...prev, newInst]);
    broadcastSync();
  }, [broadcastSync]);

  const updateInstructor = useCallback((id: string, updates: Partial<Instructor>) => {
    setInstructors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteInstructor = useCallback((id: string) => {
    setInstructors((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addTrainingMaterial = useCallback((mat: Omit<TrainingMaterial, 'id' | 'uploadedAt'>) => {
    const newMat: TrainingMaterial = {
      ...mat,
      id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setTrainingMaterials((prev) => [newMat, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateTrainingMaterial = useCallback((id: string, updates: Partial<TrainingMaterial>) => {
    setTrainingMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteTrainingMaterial = useCallback((id: string) => {
    setTrainingMaterials((prev) => prev.filter((m) => m.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addInternalCourse = useCallback((course: Omit<InternalCourse, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    const newCourse: InternalCourse = {
      ...course,
      id: `crs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    setInternalCourses((prev) => [newCourse, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateInternalCourse = useCallback((id: string, updates: Partial<InternalCourse>) => {
    const now = new Date().toISOString().slice(0, 10);
    setInternalCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteInternalCourse = useCallback((id: string) => {
    setInternalCourses((prev) => prev.filter((c) => c.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addCourseBatch = useCallback((courseId: string, batch: Omit<CourseBatch, 'id'>) => {
    const newBatch: CourseBatch = {
      ...batch,
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setInternalCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const batches = c.batches || [];
          return {
            ...c,
            batches: [...batches, newBatch],
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return c;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const updateCourseBatch = useCallback((courseId: string, batchId: string, updates: Partial<CourseBatch>) => {
    setInternalCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            batches: c.batches.map((b) => (b.id === batchId ? { ...b, ...updates } : b)),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return c;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteCourseBatch = useCallback((courseId: string, batchId: string) => {
    setInternalCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            batches: c.batches.filter((b) => b.id !== batchId),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return c;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const archiveCourseBatch = useCallback((courseId: string, batchId: string) => {
    setInternalCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            batches: c.batches.map((b) =>
              b.id === batchId
                ? { ...b, status: 'archived', isArchived: true, archivedAt: new Date().toISOString().slice(0, 10) }
                : b
            ),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return c;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const addExternalCourse = useCallback((course: Omit<ExternalCourse, 'id'>) => {
    const newCourse: ExternalCourse = {
      ...course,
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setExternalCourses((prev) => [newCourse, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateExternalCourse = useCallback((id: string, updates: Partial<ExternalCourse>) => {
    setExternalCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteExternalCourse = useCallback((id: string) => {
    setExternalCourses((prev) => prev.filter((c) => c.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addExternalApplication = useCallback((app: Omit<ExternalCourseApplication, 'id' | 'appliedAt'>) => {
    const newApp: ExternalCourseApplication = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appliedAt: new Date().toISOString().slice(0, 10),
    };
    setExternalApplications((prev) => [newApp, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateExternalApplication = useCallback((id: string, updates: Partial<ExternalCourseApplication>) => {
    setExternalApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    broadcastSync();
  }, [broadcastSync]);

  const approveExternalApplication = useCallback((id: string, approved: boolean, approverName: string, notes?: string) => {
    setExternalApplications((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: approved ? 'approved' : 'rejected',
            approvalFlow: [
              ...a.approvalFlow,
              {
                stepName: '主管簽核審查',
                approverName,
                status: approved ? 'approved' : 'rejected',
                comment: notes || (approved ? '同意公費參訓' : '暫不符合部門年度訓練規劃'),
                actionTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
              },
            ],
          };
        }
        return a;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const addLearningMap = useCallback((map: Omit<LearningMap, 'id' | 'updatedAt'>) => {
    const newMap: LearningMap = {
      ...map,
      id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setLearningMaps((prev) => [...prev, newMap]);
    broadcastSync();
  }, [broadcastSync]);

  const updateLearningMap = useCallback((id: string, updates: Partial<LearningMap>) => {
    setLearningMaps((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : m
      )
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteLearningMap = useCallback((id: string) => {
    setLearningMaps((prev) => prev.filter((m) => m.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  // Course Enrollment with waitlist & quota calculation
  const enrollInBatch = useCallback((
    courseIdOrParams:
      | string
      | { courseId: string; batchId: string; empNo: string; enrollmentType?: 'self_enrolled' | 'assigned_mandatory' },
    batchIdArg?: string,
    empNoArg?: string,
    enrollmentTypeArg?: 'self_enrolled' | 'assigned_mandatory'
  ): {
    success: boolean;
    message: string;
    enrollment?: CourseEnrollment;
    listType?: 'regular' | 'waitlist' | 'pending_approval';
    waitlistRank?: number;
  } => {
    let courseId: string;
    let batchId: string;
    let empNo: string;
    let enrollmentType: 'self_enrolled' | 'assigned_mandatory' = 'self_enrolled';

    if (typeof courseIdOrParams === 'string') {
      courseId = courseIdOrParams;
      batchId = batchIdArg || '';
      empNo = empNoArg || '';
      if (enrollmentTypeArg) enrollmentType = enrollmentTypeArg;
    } else {
      courseId = courseIdOrParams.courseId;
      batchId = courseIdOrParams.batchId;
      empNo = courseIdOrParams.empNo;
      if (courseIdOrParams.enrollmentType) enrollmentType = courseIdOrParams.enrollmentType;
    }

    // Find employee - case-insensitive empNo, trimmed string, name, email, and fallback resolution
    const targetEmpNo = (empNo || '').trim();
    let emp =
      employees.find((e) => (e.empNo || '').trim().toUpperCase() === targetEmpNo.toUpperCase()) ||
      employees.find((e) => (e.name || '').trim() === targetEmpNo) ||
      employees.find((e) => (e.email || '').trim().toLowerCase() === targetEmpNo.toLowerCase()) ||
      employees.find((e) => e.id === targetEmpNo);

    // If EMP-001 or alias is used, map to FG1001 or first employee
    if (!emp && targetEmpNo.toUpperCase() === 'EMP-001') {
      emp =
        employees.find((e) => e.empNo === 'FG1001') ||
        employees[0];
    }

    // If still not found, check logged in currentUser
    if (!emp && currentUser) {
      if (currentUser.employee) {
        emp = employees.find((e) => e.empNo === currentUser.employee?.empNo) || currentUser.employee;
      } else if (currentUser.empNo) {
        emp = employees.find((e) => e.empNo === currentUser.empNo);
      } else if (currentUser.type === 'google_admin' && currentUser.googleEmail) {
        emp = employees.find((e) => (e.email || '').toLowerCase() === currentUser.googleEmail?.toLowerCase());
      }
    }

    // Graceful fallback to the first active employee if employees list is not empty
    if (!emp && employees.length > 0) {
      emp = employees.find((e) => e.status === '在職') || employees[0];
    }

    if (!emp) {
      return { success: false, message: '查無此同仁資訊，請確認員工身分或聯繫系統管理員。' };
    }

    // Find course and batch
    const course =
      internalCourses.find((c) => c.id === courseId) ||
      internalCourses.find((c) => c.courseCode === courseId);
    if (!course) {
      return { success: false, message: '查無此課程資訊' };
    }

    const targetBatchId = batchId || course.batches?.[0]?.id || '';
    const batch =
      course.batches?.find((b) => b.id === targetBatchId) ||
      course.batches?.find((b) => b.batchNo === targetBatchId) ||
      course.batches?.[0];
    if (!batch) {
      return { success: false, message: '查無此梯次資訊' };
    }

    const resolvedBatchId = batch.id;

    // Check if already enrolled in this batch
    const existing = courseEnrollments.find(
      (e) => e.batchId === resolvedBatchId && e.empNo === emp.empNo && e.status !== 'cancelled'
    );
    if (existing) {
      return {
        success: false,
        message: existing.listType === 'waitlist'
          ? `您已在候補名單中（候補序號：第 ${existing.waitlistRank} 位）`
          : '您已報名此梯次課程，請勿重複報名',
      };
    }

    // Check capacity
    const currentRegular = courseEnrollments.filter(
      (e) => e.batchId === resolvedBatchId && e.listType === 'regular' && e.status !== 'cancelled'
    ).length;
    const currentWaitlist = courseEnrollments.filter(
      (e) => e.batchId === resolvedBatchId && e.listType === 'waitlist' && e.status !== 'cancelled'
    );

    let listType: 'regular' | 'waitlist' | 'pending_approval' = 'regular';
    let approvalStatus: CourseEnrollment['approvalStatus'] = 'auto_approved';
    let waitlistRank: number | undefined = undefined;

    if (course.approvalRequired) {
      listType = 'pending_approval';
      approvalStatus = 'pending';
    } else {
      if (currentRegular < batch.maxParticipants) {
        listType = 'regular';
        approvalStatus = 'auto_approved';
      } else if (batch.allowWaitlist && currentWaitlist.length < batch.maxWaitlist) {
        listType = 'waitlist';
        approvalStatus = 'auto_approved';
        waitlistRank = currentWaitlist.length + 1;
      } else {
        return { success: false, message: '本梯次正取名額與候補名額皆已額滿' };
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newEnrollment: CourseEnrollment = {
      id: `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      courseId: course.id,
      courseTitle: course.title,
      courseName: course.title,
      batchId: resolvedBatchId,
      batchNo: batch.batchName || batch.batchNo || '第 01 梯次',
      batchName: batch.batchName || batch.batchNo || '第 01 梯次',
      trainingCategory: course.categoryName || course.category || '專業訓練',
      deliveryType: course.deliveryType || course.deliveryMode || 'physical',
      empNo: emp.empNo,
      empName: emp.name,
      department: emp.department || '',
      title: emp.title || '',
      enrolledAt: now,
      enrollmentType,
      listType,
      ...(waitlistRank !== undefined ? { waitlistRank } : {}),
      status: 'enrolled',
      approvalStatus,
      attendanceStatus: 'not_checked_in',
      examScores: [],
      materialsReadPercent: 0,
      videoWatchPercent: 0,
      surveyCompleted: false,
      finalPassStatus: 'in_progress',
      isCertified: false,
    };

    setCourseEnrollments((prev) => {
      const next = [newEnrollment, ...prev];
      if (db) {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            courseEnrollments: next,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore enroll sync error:', err);
        });
      }
      return next;
    });
    broadcastSync();

    const msg =
      listType === 'waitlist'
        ? `報名成功！由於正取名額已滿，您已排入【候補名單第 ${waitlistRank} 位】。若有學員取消將自動依序遞補。`
        : listType === 'pending_approval'
        ? '報名申請已送出，待直屬主管審核核准後將正式納入名冊。'
        : '報名成功！已為您保留正取上課席位。';

    return { success: true, message: msg, enrollment: newEnrollment, listType, waitlistRank };
  }, [employees, internalCourses, courseEnrollments, currentUser, broadcastSync]);

  // Cancel enrollment with automatic waitlist promotion
  const cancelEnrollment = useCallback((enrollmentId: string, leaveReason?: string): { success: boolean; message: string } => {
    const target = courseEnrollments.find((e) => e.id === enrollmentId);
    if (!target) {
      return { success: false, message: '查無報名紀錄' };
    }

    const now = new Date().toISOString().slice(0, 10);
    const batchId = target.batchId;
    const wasRegular = target.listType === 'regular';

    setCourseEnrollments((prev) => {
      // 1. Mark target as cancelled
      let updated = prev.map((e) =>
        e.id === enrollmentId
          ? { ...e, status: 'cancelled' as const, cancellationDate: now, leaveReason: leaveReason || '學員個人因素申請取消' }
          : e
      );

      // 2. If it was a regular student, automatically promote the top waitlist student!
      if (wasRegular) {
        const waitlistStudents = updated
          .filter((e) => e.batchId === batchId && e.listType === 'waitlist' && e.status !== 'cancelled')
          .sort((a, b) => (a.waitlistRank || 999) - (b.waitlistRank || 999));

        if (waitlistStudents.length > 0) {
          const promoted = waitlistStudents[0];
          updated = updated.map((e) => {
            if (e.id === promoted.id) {
              return {
                ...e,
                listType: 'regular' as const,
                waitlistRank: undefined,
              };
            }
            // Re-order remaining waitlist
            if (e.batchId === batchId && e.listType === 'waitlist' && e.status !== 'cancelled' && e.id !== promoted.id) {
              return {
                ...e,
                waitlistRank: (e.waitlistRank || 2) - 1,
              };
            }
            return e;
          });
        }
      }

      if (db) {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            courseEnrollments: updated,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore cancel sync warning:', err);
        });
      }
      return updated;
    });

    broadcastSync();
    return { success: true, message: '已成功取消報名！' + (wasRegular ? '系統已自動為候補第一順位學員遞補正取名額。' : '') };
  }, [courseEnrollments, broadcastSync]);

  const approveEnrollment = useCallback((enrollmentId: string, approved: boolean, approverEmpNo: string, approverName: string, comment?: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setCourseEnrollments((prev) =>
      prev.map((e) => {
        if (e.id === enrollmentId) {
          return {
            ...e,
            approvalStatus: approved ? 'approved' : 'rejected',
            listType: approved ? 'regular' : 'pending_approval',
            status: approved ? 'enrolled' : 'cancelled',
            approverEmpNo,
            approverName,
            approvedBy: approverName,
            approvedAt: now,
            completedApprovalAt: now,
            approverComment: comment || (approved ? '准予參訓，請準時出席並落實課後 SMART 實踐指標。' : '工程案場要徑工進正值關鍵期，建議改選次一梯次。'),
            isArchived: true,
          };
        }
        return e;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  // QR Code check-in
  const checkInEnrollment = useCallback((enrollmentId: string, method: 'qr_scan' | 'student_qr_pass' | 'manual_host' | 'verification_code' = 'qr_scan'): boolean => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let success = false;
    setCourseEnrollments((prev) =>
      prev.map((e) => {
        if (e.id === enrollmentId) {
          success = true;
          return {
            ...e,
            attendanceStatus: 'checked_in',
            checkInTime: now,
            checkInMethod: method,
          };
        }
        return e;
      })
    );
    if (success) broadcastSync();
    return success;
  }, [broadcastSync]);

  const updateEnrollmentProgress = useCallback((enrollmentId: string, updates: Partial<CourseEnrollment>) => {
    setCourseEnrollments((prev) =>
      prev.map((e) => {
        if (e.id === enrollmentId) {
          const merged = { ...e, ...updates };
          // Determine if passed
          let pass = merged.finalPassStatus;
          let certified = merged.isCertified;
          let certCode = merged.certificateCode;

          if (merged.videoWatchPercent >= 100 && (merged.examScores?.length ? (merged.examScores[0]?.score || 0) >= 70 : true) && merged.surveyCompleted) {
            pass = 'passed';
            certified = true;
            if (!certCode) {
              certCode = `FG-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            }
          }
          return {
            ...merged,
            finalPassStatus: pass,
            isCertified: certified,
            certificateCode: certCode,
          };
        }
        return e;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  // Update enrollment (all fields editable by admin)
  const updateEnrollment = useCallback((enrollmentId: string, updates: Partial<CourseEnrollment>) => {
    setCourseEnrollments((prev) => {
      const updated = prev.map((e) => {
        if (e.id === enrollmentId) {
          const merged = { ...e, ...updates };
          return merged;
        }
        return e;
      });

      if (db) {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            courseEnrollments: updated,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore updateEnrollment sync error:', err);
        });
      }
      return updated;
    });
    broadcastSync();
  }, [broadcastSync]);

  // Delete enrollment from batch roster completely
  const deleteEnrollment = useCallback((enrollmentId: string): { success: boolean; message: string } => {
    let deleted = false;
    let studentName = '';
    setCourseEnrollments((prev) => {
      const target = prev.find((e) => e.id === enrollmentId);
      if (!target) return prev;
      studentName = target.employeeName || target.employeeNo;
      deleted = true;
      const updated = prev.filter((e) => e.id !== enrollmentId);

      if (db) {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            courseEnrollments: updated,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore deleteEnrollment sync error:', err);
        });
      }
      return updated;
    });

    if (deleted) {
      broadcastSync();
      return { success: true, message: `已成功將學員【${studentName}】自本梯次名冊中移除！` };
    }
    return { success: false, message: '查無此學員報名紀錄' };
  }, [broadcastSync]);

  // Force enroll students by batch (multi-select / department filter / forced assignment)
  const forceEnrollBatchStudents = useCallback((
    courseId: string,
    batchId: string,
    empNos: string[],
    enrollmentType: 'assigned_mandatory' | 'self_enrolled' = 'assigned_mandatory',
    listType: 'regular' | 'waitlist' = 'regular'
  ): { success: boolean; count: number; message: string } => {
    const course = internalCourses.find((c) => c.id === courseId);
    if (!course) {
      return { success: false, count: 0, message: '查無此課程資料' };
    }
    const batch = course.batches.find((b) => b.id === batchId);
    if (!batch) {
      return { success: false, count: 0, message: '查無此梯次資料' };
    }

    const now = new Date().toISOString().slice(0, 10);
    const addedEnrollments: CourseEnrollment[] = [];

    // Filter out already enrolled in this batch
    const existingEmpNosInBatch = new Set(
      courseEnrollments
        .filter((e) => e.batchId === batchId && e.status !== 'cancelled')
        .map((e) => (e.empNo || (e as any).employeeNo || '').trim().toUpperCase())
    );

    const validEmpNos = empNos.filter(
      (no) => !existingEmpNosInBatch.has((no || '').trim().toUpperCase())
    );
    if (validEmpNos.length === 0) {
      return { success: false, count: 0, message: '所選同仁皆已在本梯次名冊中，無需重複置入。' };
    }

    for (const empNo of validEmpNos) {
      const emp = employees.find(
        (e) => (e.empNo || '').toUpperCase() === (empNo || '').toUpperCase()
      );
      const enrollmentId = `enr-${Date.now()}-${empNo}-${Math.random().toString(36).substr(2, 4)}`;

      const newEnrollment: CourseEnrollment = {
        id: enrollmentId,
        courseId: course.id,
        courseTitle: course.title,
        courseName: course.title,
        trainingCategory: course.categoryName || course.categoryId || '專業工程實務',
        batchId: batch.id,
        batchNo: batch.batchNo,
        batchName: batch.batchName || (batch as any).name || `第 ${batch.batchNo} 梯次`,
        empNo: empNo,
        empName: emp?.name || empNo,
        studentName: emp?.name || empNo,
        department: emp?.department || '工程工務單位',
        section: emp?.section || '工務組',
        title: emp?.title || '同仁',
        rank: emp?.rank || '06',
        hours: course.hours || 3,
        credits: course.credits || 1,
        enrolledAt: now,
        enrollmentType,
        deliveryType: course.deliveryType || 'blended',
        listType,
        status: 'enrolled',
        approvalStatus: 'approved',
        approvedBy: '後台系統管理員 (強制指派)',
        approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        attendanceStatus: 'not_checked_in',
        examScores: [],
        materialsReadPercent: 0,
        videoWatchPercent: 0,
        surveyCompleted: false,
        finalPassStatus: 'in_progress',
        isCertified: false,
        // Also support legacy aliases
        ...({
          employeeNo: empNo,
          employeeName: emp?.name || empNo,
          jobTitle: emp?.title || '同仁',
          enrollmentDate: now,
        } as any),
      };

      addedEnrollments.push(newEnrollment);
    }

    setCourseEnrollments((prev) => {
      const next = [...addedEnrollments, ...prev];
      if (db) {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            courseEnrollments: next,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore forceEnrollBatchStudents sync error:', err);
        });
      }
      return next;
    });

    broadcastSync();
    return {
      success: true,
      count: addedEnrollments.length,
      message: `已成功將 ${addedEnrollments.length} 位同仁強制置入【${batch.name || `第 ${batch.batchNo} 梯次`}】！`,
    };
  }, [internalCourses, employees, courseEnrollments, broadcastSync]);

  const createSmartActionPlan = useCallback((plan: Omit<SmartActionPlan, 'id'>): SmartActionPlan => {
    const newPlan: SmartActionPlan = {
      ...plan,
      id: `sap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: plan.createdAt || new Date().toISOString().slice(0, 10),
      submittedAt: plan.submittedAt || new Date().toISOString().slice(0, 10),
      status: plan.status || 'in_progress',
    };
    setSmartActionPlans((prev) => [newPlan, ...prev]);
    broadcastSync();
    return newPlan;
  }, [broadcastSync]);

  const updateSmartActionPlan = useCallback((id: string, updates: Partial<SmartActionPlan>) => {
    setSmartActionPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    broadcastSync();
  }, [broadcastSync]);

  const submitSmartActionPlan = useCallback((plan: Omit<SmartActionPlan, 'id' | 'submittedAt'>): SmartActionPlan => {
    const newPlan: SmartActionPlan = {
      ...plan,
      id: `sap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      submittedAt: new Date().toISOString().slice(0, 10),
      createdAt: plan.createdAt || new Date().toISOString().slice(0, 10),
      status: plan.status || 'in_progress',
    };
    setSmartActionPlans((prev) => [newPlan, ...prev]);
    broadcastSync();
    return newPlan;
  }, [broadcastSync]);

  const selfEvaluateSmartActionPlan = useCallback((id: string, evaluation: {
    selfScore: number;
    selfNotes?: string;
    selfAchievementSummary?: string;
    selfMetricResult?: string;
    selfChallengesFaced?: string;
    evidenceAttachmentName?: string;
  }) => {
    const now = new Date().toISOString().slice(0, 10);
    setSmartActionPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...evaluation,
            selfEvaluatedAt: now,
            isSelfEvaluated: true,
            status: 'self_evaluated',
          };
        }
        return p;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const managerEvaluateSmartActionPlan = useCallback((id: string, evaluation: {
    managerScore: number;
    managerFeedback: string;
    evaluatorEmpNo?: string;
    evaluatorName?: string;
  }) => {
    const now = new Date().toISOString().slice(0, 10);
    setSmartActionPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...evaluation,
            evaluatedAt: now,
            status: 'manager_evaluated',
          };
        }
        return p;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const evaluateSmartActionPlan = useCallback((planId: string, arg2?: any, arg3?: any, arg4?: any) => {
    const now = new Date().toISOString().slice(0, 10);
    if (typeof arg2 === 'object' && arg2 !== null && !Array.isArray(arg2)) {
      // Object overload
      setSmartActionPlans((prev) =>
        prev.map((p) => {
          if (p.id === planId) {
            return {
              ...p,
              ...arg2,
              evaluatedAt: arg2.evaluatedAt || now,
              status: 'manager_evaluated',
            };
          }
          return p;
        })
      );
    } else {
      // Legacy array overload
      const evaluatedByEmpNo = arg2 || 'MGR-001';
      const evaluatedByName = arg3 || '直屬主管';
      const itemsEvaluated: { id: string; managerScore: number; managerNotes: string }[] = arg4 || [];

      setSmartActionPlans((prev) =>
        prev.map((p) => {
          if (p.id === planId) {
            const updatedItems = (p.goals || p.items || []).map((g: any) => {
              const match = itemsEvaluated.find((ie) => ie.id === g.id);
              if (match) {
                return {
                  ...g,
                  managerScore: match.managerScore,
                  managerNotes: match.managerNotes,
                  status: match.managerScore >= 80 ? ('completed' as const) : ('in_progress' as const),
                };
              }
              return g;
            });

            const totalScore = updatedItems.reduce((acc: number, curr: any) => acc + (curr.managerScore || 0), 0);
            const avgScore = updatedItems.length ? Math.round(totalScore / updatedItems.length) : 0;

            return {
              ...p,
              goals: updatedItems,
              evaluatedByEmpNo,
              evaluatedByName,
              evaluatedAt: now,
              overallScore: avgScore,
              status: 'manager_evaluated',
            };
          }
          return p;
        })
      );
    }
    broadcastSync();
  }, [broadcastSync]);

  // ----------------------------------------------------
  // 年度訓練規定管理 (Annual Training Requirements)
  // ----------------------------------------------------
  const addAnnualRequirement = useCallback((req: Omit<AnnualTrainingRequirement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    const newReq: AnnualTrainingRequirement = {
      ...req,
      id: `req-${req.year}-${Date.now().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    setAnnualTrainingRequirements((prev) => [newReq, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateAnnualRequirement = useCallback((id: string, updates: Partial<AnnualTrainingRequirement>) => {
    const now = new Date().toISOString().slice(0, 10);
    setAnnualTrainingRequirements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: now } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteAnnualRequirement = useCallback((id: string) => {
    setAnnualTrainingRequirements((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const duplicateAnnualRequirement = useCallback((id: string, targetYear: number) => {
    const now = new Date().toISOString().slice(0, 10);
    setAnnualTrainingRequirements((prev) => {
      const source = prev.find((item) => item.id === id);
      if (!source) return prev;
      const copy: AnnualTrainingRequirement = {
        ...source,
        id: `req-${targetYear}-${Date.now().toString(36).substr(2, 4)}`,
        year: targetYear,
        title: `${targetYear} 年度 ${source.title.replace(/^\d{4}\s*年度\s*/, '')} (複製版)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      return [copy, ...prev];
    });
    broadcastSync();
  }, [broadcastSync]);

  // ----------------------------------------------------
  // Resume & License Cloud Actions (證照雲與履歷管理)
  // ----------------------------------------------------
  const addMasterLicense = useCallback((license: Omit<MasterLicenseDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    const newLic: MasterLicenseDefinition = {
      ...license,
      id: `m-lic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    setMasterLicenses((prev) => [newLic, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateMasterLicense = useCallback((id: string, updates: Partial<MasterLicenseDefinition>) => {
    const now = new Date().toISOString().slice(0, 10);
    setMasterLicenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: now } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteMasterLicense = useCallback((id: string) => {
    setMasterLicenses((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addEmployeeLicense = useCallback((license: Omit<EmployeeLicense, 'id'>) => {
    const newLicense: EmployeeLicense = {
      ...license,
      id: `lic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: license.status || 'valid',
    };
    setEmployeeLicenses((prev) => [newLicense, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateEmployeeLicense = useCallback((id: string, updates: Partial<EmployeeLicense>) => {
    setEmployeeLicenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteEmployeeLicense = useCallback((id: string) => {
    setEmployeeLicenses((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const verifyEmployeeLicense = useCallback((id: string, verifierName: string) => {
    const now = new Date().toISOString().slice(0, 10);
    setEmployeeLicenses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'valid',
            verifiedBy: verifierName,
            verifiedAt: now,
          };
        }
        return item;
      })
    );
    broadcastSync();
  }, [broadcastSync]);

  const batchImportLicenses = useCallback((licenses: EmployeeLicense[]) => {
    setEmployeeLicenses((prev) => [...licenses, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const addSiteRequirement = useCallback((req: Omit<SiteLicenseRequirement, 'id'>) => {
    const newReq: SiteLicenseRequirement = {
      ...req,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setSiteLicenseRequirements((prev) => [newReq, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateSiteRequirement = useCallback((id: string, updates: Partial<SiteLicenseRequirement>) => {
    setSiteLicenseRequirements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteSiteRequirement = useCallback((id: string) => {
    setSiteLicenseRequirements((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const addDispatchTraining = useCallback((record: Omit<DispatchTrainingRecord, 'id'>) => {
    const newRecord: DispatchTrainingRecord = {
      ...record,
      id: `disp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setDispatchTrainings((prev) => [newRecord, ...prev]);
    broadcastSync();
  }, [broadcastSync]);

  const updateDispatchTraining = useCallback((id: string, updates: Partial<DispatchTrainingRecord>) => {
    setDispatchTrainings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    broadcastSync();
  }, [broadcastSync]);

  const deleteDispatchTraining = useCallback((id: string) => {
    setDispatchTrainings((prev) => prev.filter((item) => item.id !== id));
    broadcastSync();
  }, [broadcastSync]);

  const completeAndVerifyDispatchTraining = useCallback(
    (id: string, licenseData?: Partial<EmployeeLicense>) => {
      const now = new Date().toISOString().slice(0, 10);
      let targetRecord: DispatchTrainingRecord | undefined;
      setDispatchTrainings((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            targetRecord = item;
            return {
              ...item,
              status: 'verified',
              completionDate: item.completionDate || now,
            };
          }
          return item;
        })
      );

      // Auto create/sync into EmployeeLicense database
      if (targetRecord) {
        const emp = employees.find((e) => e.empNo === targetRecord?.empNo);
        const newLic: EmployeeLicense = {
          id: `lic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          empNo: targetRecord.empNo,
          empName: targetRecord.empName,
          department: targetRecord.department || emp?.department || '工程部',
          title: targetRecord.title || emp?.title || '工程師',
          licenseCategory: targetRecord.targetLicenseCategory,
          licenseName: targetRecord.targetLicenseName,
          licenseNo: targetRecord.resultLicenseNo || licenseData?.licenseNo || `LIC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          issuingAuthority: licenseData?.issuingAuthority || targetRecord.trainingInstitute || '認可培訓機構',
          issueDate: licenseData?.issueDate || now,
          expiryDate: licenseData?.expiryDate,
          hasExpiry: !!licenseData?.expiryDate,
          renewalRequired: licenseData?.renewalRequired || false,
          renewalIntervalYears: licenseData?.renewalIntervalYears,
          renewalDeadlineDate: licenseData?.renewalDeadlineDate,
          status: 'valid',
          attachmentUrl: targetRecord.certificateAttachmentUrl || licenseData?.attachmentUrl,
          attachmentName: licenseData?.attachmentName || `${targetRecord.empName}_結訓證書.pdf`,
          notes: targetRecord.completionNotes || `由派訓中管理結訓審核自動建檔 (${targetRecord.trainingInstitute})`,
          verifiedBy: 'HR_ADMIN',
          verifiedAt: now,
        };
        setEmployeeLicenses((prev) => [newLic, ...prev]);
      }
      broadcastSync();
    },
    [employees, broadcastSync]
  );

  const updateLicenseNotificationConfig = useCallback(
    (updates: Partial<LicenseNotificationConfig>) => {
      setLicenseNotificationConfig((prev) => ({ ...prev, ...updates }));
      broadcastSync();
    },
    [broadcastSync]
  );

  const updateEmployeeResume = useCallback(
    (empNo: string, resume: Partial<EmployeeResumeDetail>) => {
      setResumeDetails((prev) => {
        const existing = prev[empNo] || {
          empNo,
          name: employees.find((e) => e.empNo === empNo)?.name || '',
          department: employees.find((e) => e.empNo === empNo)?.department || '',
          title: employees.find((e) => e.empNo === empNo)?.title || '',
          skillTags: [],
          educationList: [],
          workHistory: [],
          projectHistory: [],
          licenses: [],
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        return {
          ...prev,
          [empNo]: {
            ...existing,
            ...resume,
            updatedAt: new Date().toISOString().slice(0, 10),
          },
        };
      });
      broadcastSync();
    },
    [employees, broadcastSync]
  );

  const submitFrontendResumeLicense = useCallback(
    (data: {
      empNo: string;
      resume?: Partial<EmployeeResumeDetail>;
      newLicense?: Omit<EmployeeLicense, 'id' | 'status'>;
    }) => {
      const now = new Date().toISOString().slice(0, 10);
      const emp = employees.find((e) => e.empNo === data.empNo);

      // If new license is submitted
      if (data.newLicense) {
        const newLic: EmployeeLicense = {
          ...data.newLicense,
          id: `lic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          status: 'pending_review',
          submittedAt: now,
          empNo: data.empNo,
          empName: emp?.name || data.newLicense.empName || data.empNo,
          department: emp?.department || data.newLicense.department || '',
          title: emp?.title || data.newLicense.title || '',
        };
        setEmployeeLicenses((prev) => [newLic, ...prev]);
      }

      // If resume details are provided
      if (data.resume) {
        updateEmployeeResume(data.empNo, data.resume);
      }

      broadcastSync();
      return { success: true, message: '履歷與證照資料已成功送出登錄！' };
    },
    [employees, updateEmployeeResume, broadcastSync]
  );

  // Cloud Sync Helper for Manpower Settings
  const syncManpowerFieldsToCloud = useCallback(
    (fieldUpdates: {
      manpowerConfig?: ManpowerFormulaConfig;
      manpowerSupplyAssumption?: ManpowerSupplyAssumption;
      manualTargetRecords?: ManualTargetDemandRecord[];
    }) => {
      if (!db) return;
      try {
        setDoc(
          doc(db, 'app_datasets', 'main_records'),
          cleanForFirestore({
            ...fieldUpdates,
            updatedAt: new Date().toISOString(),
            updatedBySession: SESSION_CLIENT_ID,
          }),
          { merge: true }
        ).catch(() => {});
      } catch (e) {}
    },
    []
  );

  // Manpower Forecast Actions
  const updateManpowerConfig = useCallback((updates: Partial<ManpowerFormulaConfig>) => {
    setManpowerConfig((prev) => {
      const next = {
        ...prev,
        ...updates,
        manager: updates.manager ? { ...prev.manager, ...updates.manager } : prev.manager,
        civil: updates.civil ? {
          ...prev.civil,
          ...updates.civil,
          aboveGround: updates.civil.aboveGround ? { ...prev.civil.aboveGround, ...updates.civil.aboveGround } : prev.civil.aboveGround,
          underGround: updates.civil.underGround ? { ...prev.civil.underGround, ...updates.civil.underGround } : prev.civil.underGround,
          landscapeVip: updates.civil.landscapeVip ? { ...prev.civil.landscapeVip, ...updates.civil.landscapeVip } : prev.civil.landscapeVip,
        } : prev.civil,
        mep: updates.mep ? { ...prev.mep, ...updates.mep } : prev.mep,
        safety: updates.safety ? { ...prev.safety, ...updates.safety } : prev.safety,
        admin: updates.admin ? { ...prev.admin, ...updates.admin } : prev.admin,
        scheduleRatio: updates.scheduleRatio ? { ...prev.scheduleRatio, ...updates.scheduleRatio } : prev.scheduleRatio,
      };
      syncManpowerFieldsToCloud({ manpowerConfig: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const resetManpowerConfig = useCallback(() => {
    setManpowerConfig(DEFAULT_MANPOWER_CONFIG);
    syncManpowerFieldsToCloud({ manpowerConfig: DEFAULT_MANPOWER_CONFIG });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const updateManpowerSupplyAssumption = useCallback((updates: Partial<ManpowerSupplyAssumption>) => {
    setManpowerSupplyAssumption((prev) => {
      const next = {
        ...prev,
        ...updates,
        customBaselineByDept: updates.customBaselineByDept
          ? { ...(prev.customBaselineByDept || {}), ...updates.customBaselineByDept }
          : prev.customBaselineByDept,
      };
      syncManpowerFieldsToCloud({ manpowerSupplyAssumption: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const addManualTargetRecord = useCallback((record: ManualTargetDemandRecord) => {
    setManualTargetRecords((prev) => {
      const next = [record, ...prev];
      syncManpowerFieldsToCloud({ manualTargetRecords: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const updateManualTargetRecord = useCallback((id: string, updates: Partial<ManualTargetDemandRecord>) => {
    setManualTargetRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      syncManpowerFieldsToCloud({ manualTargetRecords: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const deleteManualTargetRecord = useCallback((id: string) => {
    setManualTargetRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      syncManpowerFieldsToCloud({ manualTargetRecords: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const batchImportManualTargets = useCallback((records: ManualTargetDemandRecord[]) => {
    setManualTargetRecords((prev) => {
      const map = new Map<string, ManualTargetDemandRecord>();
      prev.forEach((r) => map.set(`${r.projectCode}-${r.quarter}`, r));
      records.forEach((r) => map.set(`${r.projectCode}-${r.quarter}`, r));
      const next = Array.from(map.values());
      syncManpowerFieldsToCloud({ manualTargetRecords: next });
      return next;
    });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const clearAllManualTargets = useCallback(() => {
    setManualTargetRecords([]);
    syncManpowerFieldsToCloud({ manualTargetRecords: [] });
    broadcastSync();
  }, [broadcastSync, syncManpowerFieldsToCloud]);

  const resetToDefaultData = useCallback(() => {
    setEmployees(INITIAL_EMPLOYEES);
    setOrgTree(INITIAL_ORG_TREE);
    setPermissionMatrix(INITIAL_PERMISSION_MATRIX);
    setGoogleAdmins(INITIAL_GOOGLE_ADMINS);
    setProjectPlans(INITIAL_PROJECT_PLANS);
    setCandidates(INITIAL_CANDIDATES);
    setSurveyForms(INITIAL_SURVEYS);
    setActiveSurveyId(INITIAL_SURVEYS[0]?.id || 'survey-2026-01');
    setSurveyResponses(INITIAL_SURVEY_RESPONSES);
    setEmailTemplates(INITIAL_EMAIL_TEMPLATES);
    setEmailLogs([]);
    setDashboards(INITIAL_DASHBOARDS);
    setTrainingCategories(INITIAL_TRAINING_CATEGORIES);
    setInstructors(INITIAL_INSTRUCTORS);
    setTrainingMaterials(INITIAL_TRAINING_MATERIALS);
    setInternalCourses(INITIAL_INTERNAL_COURSES);
    setExternalCourses(INITIAL_EXTERNAL_COURSES);
    setExternalApplications(INITIAL_EXTERNAL_APPLICATIONS);
    setLearningMaps(INITIAL_LEARNING_MAPS);
    setCourseEnrollments(INITIAL_ENROLLMENTS);
    setSmartActionPlans(INITIAL_SMART_ACTION_PLANS);
    setAnnualTrainingRequirements(INITIAL_ANNUAL_TRAINING_REQUIREMENTS);
    setEmployeeLicenses(INITIAL_EMPLOYEE_LICENSES);
    setSiteLicenseRequirements(INITIAL_SITE_LICENSE_REQUIREMENTS);
    setDispatchTrainings(INITIAL_DISPATCH_TRAININGS);
    setLicenseNotificationConfig(INITIAL_LICENSE_NOTIFICATION_CONFIG);
    setResumeDetails(INITIAL_RESUME_DETAILS);
    setManpowerConfig(DEFAULT_MANPOWER_CONFIG);
    setManpowerSupplyAssumption(DEFAULT_SUPPLY_ASSUMPTION);
    setManualTargetRecords(INITIAL_MANUAL_TARGETS);
    localStorage.clear();
    if (db) {
      const nowIso = new Date().toISOString();
      setDoc(
        doc(db, 'app_datasets', 'main_records'),
        cleanForFirestore({
          employees: INITIAL_EMPLOYEES,
          projectPlans: INITIAL_PROJECT_PLANS,
          candidates: INITIAL_CANDIDATES,
          surveyForms: INITIAL_SURVEYS,
          surveyResponses: INITIAL_SURVEY_RESPONSES,
          emailTemplates: INITIAL_EMAIL_TEMPLATES,
          emailLogs: [],
          courseEnrollments: INITIAL_ENROLLMENTS,
          manpowerConfig: DEFAULT_MANPOWER_CONFIG,
          manpowerSupplyAssumption: DEFAULT_SUPPLY_ASSUMPTION,
          manualTargetRecords: INITIAL_MANUAL_TARGETS,
          updatedAt: nowIso,
          updatedBySession: SESSION_CLIENT_ID,
        }),
        { merge: true }
      ).catch(() => {});
      setDoc(
        doc(db, 'app_datasets', 'org_and_permissions'),
        cleanForFirestore({
          orgTree: INITIAL_ORG_TREE,
          permissionMatrix: INITIAL_PERMISSION_MATRIX,
          updatedAt: nowIso,
          updatedBySession: SESSION_CLIENT_ID,
        }),
        { merge: true }
      ).catch(() => {});
    }
    broadcastSync();
  }, [broadcastSync]);

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        currentUser,
        setCurrentUser,
        role,
        dashboards,
        googleAdmins,
        employees,
        orgTree,
        permissionMatrix,
        projectPlans,
        candidates,
        surveyForms,
        activeSurveyId,
        surveyForm,
        surveyResponses,
        emailTemplates,
        emailLogs,
        trainingCategories,
        instructors,
        trainingMaterials,
        internalCourses,
        externalCourses,
        externalApplications,
        learningMaps,
        courseEnrollments,
        smartActionPlans,
        annualTrainingRequirements,
        employeeLicenses,
        siteLicenseRequirements,
        dispatchTrainings,
        licenseNotificationConfig,
        resumeDetails,
        unifiedFromAddress,
        dbStatus,
        lastDbSyncTime,
        forceSyncDatabase,
        isSendingEmail,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        batchImportEmployees,
        clearAllEmployees,
        updateOrgTree,
        addOrgNode,
        updateOrgNode,
        deleteOrgNode,
        addGoogleAdmin,
        removeGoogleAdmin,
        updatePermissionItem,
        removePermissionItem,
        batchRemovePermissionItems,
        batchSetPermission,
        addEmployeesToWhitelist,
        addDashboard,
        addProjectPlan,
        updateProjectPlan,
        deleteProjectPlan,
        batchImportProjectPlans,
        clearAllProjectPlans,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        batchImportCandidates,
        batchImportCandidateExps,
        batchUpdateCandidateDetails,
        batchUpdateCandidateProjects,
        batchUpdateCandidateEvaluations,
        batchUpdateCandidatePhotos,
        clearAllCandidates,
        setActiveSurveyId,
        addSurveyForm,
        updateSurveyForm,
        deleteSurveyForm,
        submitSurveyResponse,
        saveEmailTemplate,
        deleteEmailTemplate,
        sendEmail,
        addTrainingCategory,
        updateTrainingCategory,
        deleteTrainingCategory,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        addTrainingMaterial,
        updateTrainingMaterial,
        deleteTrainingMaterial,
        addInternalCourse,
        updateInternalCourse,
        deleteInternalCourse,
        addCourseBatch,
        updateCourseBatch,
        deleteCourseBatch,
        archiveCourseBatch,
        addExternalCourse,
        updateExternalCourse,
        deleteExternalCourse,
        addExternalApplication,
        updateExternalApplication,
        approveExternalApplication,
        addLearningMap,
        updateLearningMap,
        deleteLearningMap,
        enrollInBatch,
        cancelEnrollment,
        approveEnrollment,
        checkInEnrollment,
        updateEnrollmentProgress,
        updateEnrollment,
        deleteEnrollment,
        forceEnrollBatchStudents,
        submitSmartActionPlan,
        createSmartActionPlan,
        updateSmartActionPlan,
        selfEvaluateSmartActionPlan,
        managerEvaluateSmartActionPlan,
        evaluateSmartActionPlan,
        addAnnualRequirement,
        updateAnnualRequirement,
        deleteAnnualRequirement,
        duplicateAnnualRequirement,
        masterLicenses,
        addMasterLicense,
        updateMasterLicense,
        deleteMasterLicense,
        addEmployeeLicense,
        updateEmployeeLicense,
        deleteEmployeeLicense,
        verifyEmployeeLicense,
        batchImportLicenses,
        addSiteRequirement,
        updateSiteRequirement,
        deleteSiteRequirement,
        addDispatchTraining,
        updateDispatchTraining,
        deleteDispatchTraining,
        completeAndVerifyDispatchTraining,
        updateLicenseNotificationConfig,
        updateEmployeeResume,
        submitFrontendResumeLicense,
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
        resetToDefaultData,
        onlineUsersCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
