import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  GraduationCap,
  Award,
  Calendar,
  Building2,
  User,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Plus,
  Compass,
  Filter,
  CheckSquare,
  Square,
  Search,
  ExternalLink,
  MessageSquare,
  FileCheck,
  Layers,
  AlertTriangle,
  X,
  Check,
  TrendingUp,
  Briefcase,
  IdCard,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  CourseEnrollment,
  InternalCourse,
  SmartActionPlan,
  ExternalCourseApplication,
  EmployeeLicense,
  SurveyForm,
  ActiveView,
} from '../../types';
import { isUserManager, getOrgScope } from '../../utils/orgScope';
import { EnrollmentReviewDetailModal } from './training/EnrollmentReviewDetailModal';
import { SmartActionPlanModal } from './training/SmartActionPlanModal';
import { ExternalAppReviewDetailModal } from './training/ExternalAppReviewDetailModal';
import { LicenseReviewDetailModal } from './training/LicenseReviewDetailModal';
import { AddResumeLicenseModal } from './resume/AddResumeLicenseModal';
import { RenewLicenseModal } from './resume/RenewLicenseModal';
import { CourseDetailModal } from './training/CourseDetailModal';
import { OnlineClassroomModal } from './training/OnlineClassroomModal';

export const FrontendHomeDashboard: React.FC = () => {
  const {
    currentUser,
    employees,
    orgTree,
    permissionMatrix,
    internalCourses,
    courseEnrollments,
    smartActionPlans,
    externalApplications,
    employeeLicenses,
    surveyForms,
    surveyResponses,
    masterLicenses,
    approveEnrollment,
    approveExternalApplication,
    verifyEmployeeLicense,
    managerEvaluateSmartActionPlan,
    addExternalApplication,
    setActiveView,
  } = useApp();

  // 1. Bound current employee
  const currentEmpNo =
    currentUser?.employee?.empNo ||
    currentUser?.empNo ||
    (currentUser?.type === 'google_admin' ? 'ADM-001' : employees[0]?.empNo || 'EMP-001');

  const currentEmployee =
    employees.find((e) => e.empNo === currentEmpNo) ||
    currentUser?.employee || {
      empNo: currentEmpNo,
      name: currentUser?.type === 'google_admin' ? 'Gary Chen (系統管理員)' : '同仁',
      department: '人力資源室',
      title: '專員',
      rank: '06',
      attribute: '內業' as const,
      status: '在職' as const,
      email: currentUser?.googleEmail || 'employee@farglory.com.tw',
      birthday: '1988-06-15',
      seniorityStartDate: '2018-03-01',
      id: 'emp-curr',
      section: '企劃組',
      pin: '0000',
    };

  // Determine if manager
  const isManager = useMemo(() => {
    return isUserManager(currentUser, orgTree, permissionMatrix);
  }, [currentUser, orgTree, permissionMatrix]);

  // Compute organization scope
  const orgScope = useMemo(() => {
    return getOrgScope(currentUser, orgTree, permissionMatrix);
  }, [currentUser, orgTree, permissionMatrix]);

  // Main navigation tab within home dashboard
  const [activeTab, setActiveTab] = useState<
    'pending_approvals' | 'my_submissions' | 'my_tracking' | 'quick_launchers'
  >('pending_approvals');

  // Filter mode for approvals: 'my_scope' vs 'all_company'
  const [approvalScopeFilter, setApprovalScopeFilter] = useState<'my_scope' | 'all_company'>('my_scope');

  // Search keyword inside approval/submissions
  const [searchQuery, setSearchQuery] = useState('');

  // Selected items for batch approval
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [selectedExternalAppIds, setSelectedExternalAppIds] = useState<string[]>([]);
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<string[]>([]);

  // Modals state
  const [inspectEnrollment, setInspectEnrollment] = useState<CourseEnrollment | null>(null);
  const [inspectExternalApp, setInspectExternalApp] = useState<ExternalCourseApplication | null>(null);
  const [inspectLicenseReview, setInspectLicenseReview] = useState<EmployeeLicense | null>(null);
  const [smartPlanTarget, setSmartPlanTarget] = useState<{
    enrollment: CourseEnrollment;
    course?: InternalCourse;
    plan?: SmartActionPlan;
    mode: 'setup' | 'self_eval' | 'view' | 'manager';
  } | null>(null);
  const [isAddLicenseOpen, setIsAddLicenseOpen] = useState(false);
  const [renewLicenseTarget, setRenewLicenseTarget] = useState<EmployeeLicense | null>(null);
  const [inspectCourse, setInspectCourse] = useState<InternalCourse | null>(null);
  const [classroomEnrollment, setClassroomEnrollment] = useState<CourseEnrollment | null>(null);
  const [isApplyExternalOpen, setIsApplyExternalOpen] = useState(false);

  // In-line manager evaluation quick prompt state
  const [quickEvalTarget, setQuickEvalTarget] = useState<{
    plan: SmartActionPlan;
    score: number;
    feedback: string;
  } | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ----------------------------------------------------
  // DATA CALCULATION: Pending Approvals (待我簽核/審核表單)
  // ----------------------------------------------------
  
  // 1. Pending Course Enrollments
  const pendingEnrollments = useMemo(() => {
    return courseEnrollments.filter((enr) => {
      if (enr.approvalStatus !== 'pending') return false;
      if (approvalScopeFilter === 'all_company' || currentUser?.type === 'google_admin') return true;
      // Filter by manager's department or leader scope
      if (orgScope.isFullAccess) return true;
      if (orgScope.leaderUnits.some((u) => enr.department.includes(u) || u.includes(enr.department))) return true;
      return enr.department === currentEmployee.department;
    });
  }, [courseEnrollments, approvalScopeFilter, currentUser, orgScope, currentEmployee]);

  // 2. Pending SMART Action Plan Evaluations
  const pendingSmartEvaluations = useMemo(() => {
    return smartActionPlans.filter((plan) => {
      // Status is self_evaluated (or submitted) and not manager_evaluated yet
      const needsEval = plan.status === 'self_evaluated' || (plan.status === 'submitted' && !plan.managerScore);
      if (!needsEval) return false;
      if (approvalScopeFilter === 'all_company' || currentUser?.type === 'google_admin') return true;
      if (orgScope.isFullAccess) return true;
      if (plan.department && orgScope.leaderUnits.some((u) => plan.department?.includes(u) || u.includes(plan.department || ''))) return true;
      return plan.department === currentEmployee.department;
    });
  }, [smartActionPlans, approvalScopeFilter, currentUser, orgScope, currentEmployee]);

  // 3. Pending External Course Grant Applications
  const pendingExternalApps = useMemo(() => {
    return externalApplications.filter((app) => {
      if (app.approvalStatus !== 'pending') return false;
      if (approvalScopeFilter === 'all_company' || currentUser?.type === 'google_admin') return true;
      if (orgScope.isFullAccess) return true;
      if (orgScope.leaderUnits.some((u) => app.department.includes(u) || u.includes(app.department))) return true;
      return app.department === currentEmployee.department;
    });
  }, [externalApplications, approvalScopeFilter, currentUser, orgScope, currentEmployee]);

  // 4. Pending Employee License Review
  const pendingLicenseReviews = useMemo(() => {
    return employeeLicenses.filter((lic) => {
      if (lic.status !== 'pending_review') return false;
      if (approvalScopeFilter === 'all_company' || currentUser?.type === 'google_admin') return true;
      if (orgScope.isFullAccess) return true;
      if (orgScope.leaderUnits.some((u) => lic.department.includes(u) || u.includes(lic.department))) return true;
      return lic.department === currentEmployee.department;
    });
  }, [employeeLicenses, approvalScopeFilter, currentUser, orgScope, currentEmployee]);

  const totalPendingApprovalsCount =
    pendingEnrollments.length +
    pendingSmartEvaluations.length +
    pendingExternalApps.length +
    pendingLicenseReviews.length;

  // ----------------------------------------------------
  // DATA CALCULATION: My Pending Submissions (我的待辦呈送/待填報表單)
  // ----------------------------------------------------

  // 1. Surveys not yet filled by current employee
  const myPendingSurveys = useMemo(() => {
    const filledSurveyIds = new Set(
      surveyResponses
        .filter((r) => r.empNo === currentEmpNo)
        .map((r) => r.surveyId)
    );
    return surveyForms.filter((f) => f.isPublished && !filledSurveyIds.has(f.id));
  }, [surveyForms, surveyResponses, currentEmpNo]);

  // 2. My Course Enrollments needing Action (Pre-Survey, Post-Survey, Exam, SMART Plan setup, SMART Self-Eval)
  const myEnrollmentsNeedingAction = useMemo(() => {
    const list: Array<{
      id: string;
      enrollment: CourseEnrollment;
      course?: InternalCourse;
      actionType: 'pre_survey' | 'post_survey' | 'take_exam' | 'smart_setup' | 'smart_self_eval';
      title: string;
      description: string;
      dueDate?: string;
      plan?: SmartActionPlan;
    }> = [];

    const myEnrs = courseEnrollments.filter((enr) => enr.empNo === currentEmpNo);

    myEnrs.forEach((enr) => {
      const course = internalCourses.find((c) => c.id === enr.courseId);
      const plan = smartActionPlans.find(
        (p) => p.empNo === currentEmpNo && (p.courseId === enr.courseId || p.enrollmentId === enr.id)
      );

      // Pre-survey pending
      if (course?.hasPreSurvey && !enr.preSurveyCompleted) {
        list.push({
          id: `pre-survey-${enr.id}`,
          enrollment: enr,
          course,
          actionType: 'pre_survey',
          title: `【課前問卷待填】${course.title}`,
          description: '請於開課前完成課前預習問卷，以利講師掌握學習需求。',
        });
      }

      // Exam pending (if enrolled and not passed yet)
      if (
        course?.hasPostTest &&
        !enr.examPassed &&
        (!enr.examScores || enr.examScores.length === 0 || (enr.examScore || 0) < (course.passingScore || 70))
      ) {
        list.push({
          id: `exam-${enr.id}`,
          enrollment: enr,
          course,
          actionType: 'take_exam',
          title: `【隨堂測驗待考】${course.title}`,
          description: `測驗及格標準 ${course.passingScore || 70} 分，請於期限內完成測驗。`,
        });
      }

      // Post-survey pending
      if (course?.hasPostSurvey && !enr.postSurveyCompleted && !enr.surveyCompleted) {
        list.push({
          id: `post-survey-${enr.id}`,
          enrollment: enr,
          course,
          actionType: 'post_survey',
          title: `【課後滿意度問卷待填】${course.title}`,
          description: '請填寫課後滿意度與建議，作為未來課程精進之參考。',
        });
      }

      // SMART action plan pending setup
      if (course?.requireSmartActionPlan && !plan && (enr.attendanceStatus === 'checked_in' || enr.finalPassStatus === 'in_progress' || enr.examPassed)) {
        list.push({
          id: `smart-setup-${enr.id}`,
          enrollment: enr,
          course,
          actionType: 'smart_setup',
          title: `【SMART 行動計畫待呈送】${course.title}`,
          description: '結訓 7 日內須依據現場工程訂定 S-M-A-R-T 落地實踐目標並呈送主管。',
        });
      }

      // SMART action plan pending self evaluation (60 days)
      if (plan && plan.status === 'submitted' && !plan.isSelfEvaluated) {
        list.push({
          id: `smart-eval-${enr.id}`,
          enrollment: enr,
          course,
          plan,
          actionType: 'smart_self_eval',
          title: `【SMART 60天落實期滿自評】${course?.title || plan.courseTitle}`,
          description: '60 天落地實踐期已屆，請填寫量化成果自評並上傳工程佐證。',
        });
      }
    });

    return list;
  }, [courseEnrollments, internalCourses, smartActionPlans, currentEmpNo]);

  // 3. My Licenses Expiring Soon
  const myExpiringLicenses = useMemo(() => {
    return employeeLicenses.filter((lic) => {
      if (lic.empNo !== currentEmpNo) return false;
      return lic.status === 'expiring_soon' || lic.status === 'expired';
    });
  }, [employeeLicenses, currentEmpNo]);

  const totalMyPendingCount =
    myPendingSurveys.length +
    myEnrollmentsNeedingAction.length +
    myExpiringLicenses.length;

  // ----------------------------------------------------
  // DATA CALCULATION: My Submitted History Tracking (我已呈送之表單)
  // ----------------------------------------------------
  const mySubmittedHistory = useMemo(() => {
    const items: Array<{
      id: string;
      category: '課程報名' | 'SMART行動計畫' | '外訓公差申請' | '專業證照申報' | '意願調查問卷';
      title: string;
      submittedAt: string;
      status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
      statusLabel: string;
      statusColor: string;
      reviewerName?: string;
      comment?: string;
      detailsObj?: any;
    }> = [];

    // 1. My Enrollments
    courseEnrollments
      .filter((e) => e.empNo === currentEmpNo)
      .forEach((e) => {
        let statusLabel = '自動核准';
        let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let st: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' = 'approved';

        if (e.approvalStatus === 'pending') {
          statusLabel = '主管簽核中';
          statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
          st = 'pending';
        } else if (e.approvalStatus === 'rejected') {
          statusLabel = '簽核未通過';
          statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
          st = 'rejected';
        } else if (e.finalPassStatus === 'passed') {
          statusLabel = '完訓及格 (已核發學分)';
          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          st = 'completed';
        } else {
          statusLabel = '報名成功 (研習中)';
          statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
          st = 'in_progress';
        }

        items.push({
          id: `enr-${e.id}`,
          category: '課程報名',
          title: `${e.courseTitle || '內部培訓'} (${e.batchName || e.batchNo || '梯次'})`,
          submittedAt: e.enrolledAt,
          status: st,
          statusLabel,
          statusColor,
          reviewerName: e.approverName,
          comment: e.approverComment,
          detailsObj: e,
        });
      });

    // 2. My SMART Plans
    smartActionPlans
      .filter((p) => p.empNo === currentEmpNo)
      .forEach((p) => {
        let statusLabel = '草稿';
        let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
        let st: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' = 'in_progress';

        if (p.status === 'submitted') {
          statusLabel = '目標已呈送 (60天落地落實中)';
          statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
          st = 'in_progress';
        } else if (p.status === 'self_evaluated') {
          statusLabel = '自評已送出 (待直屬主管考評)';
          statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
          st = 'pending';
        } else if (p.status === 'manager_evaluated' || p.status === 'completed') {
          statusLabel = `主管考評及格 (${p.managerScore || 90}分)`;
          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          st = 'completed';
        }

        items.push({
          id: `smart-${p.id}`,
          category: 'SMART行動計畫',
          title: `${p.courseTitle} - 落地實踐目標`,
          submittedAt: p.submittedAt || p.createdAt || '2026-06-01',
          status: st,
          statusLabel,
          statusColor,
          reviewerName: p.evaluatorName,
          comment: p.managerFeedback,
          detailsObj: p,
        });
      });

    // 3. My External Applications
    externalApplications
      .filter((a) => a.empNo === currentEmpNo)
      .forEach((a) => {
        let statusLabel = '審核中';
        let statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
        let st: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' = 'pending';

        if (a.approvalStatus === 'approved') {
          statusLabel = '核准補助 (公差派訓)';
          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          st = 'approved';
        } else if (a.approvalStatus === 'rejected') {
          statusLabel = '退回申請';
          statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
          st = 'rejected';
        }

        items.push({
          id: `ext-${a.id}`,
          category: '外訓公差申請',
          title: `${a.provider} - ${a.courseName}`,
          submittedAt: a.appliedAt,
          status: st,
          statusLabel,
          statusColor,
          reviewerName: a.approverName,
          detailsObj: a,
        });
      });

    // 4. My Licenses Submissions
    employeeLicenses
      .filter((l) => l.empNo === currentEmpNo)
      .forEach((l) => {
        let statusLabel = '審核入庫';
        let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let st: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' = 'completed';

        if (l.status === 'pending_review') {
          statusLabel = '人資室審核中';
          statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
          st = 'pending';
        } else if (l.status === 'expiring_soon') {
          statusLabel = '即將到期 (需回訓)';
          statusColor = 'bg-orange-50 text-orange-700 border-orange-200';
          st = 'in_progress';
        } else if (l.status === 'expired') {
          statusLabel = '證照已逾期';
          statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
          st = 'rejected';
        }

        items.push({
          id: `lic-${l.id}`,
          category: '專業證照申報',
          title: `${l.licenseName} (${l.licenseNo})`,
          submittedAt: l.submittedAt || l.issueDate,
          status: st,
          statusLabel,
          statusColor,
          reviewerName: l.verifiedBy,
          detailsObj: l,
        });
      });

    // Sort by submission date desc
    return items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [courseEnrollments, smartActionPlans, externalApplications, employeeLicenses, currentEmpNo]);

  // ----------------------------------------------------
  // REAL-TIME ACTIONS & BATCH APPROVAL HANDLERS
  // ----------------------------------------------------

  // Quick single approve enrollment
  const handleQuickApproveEnrollment = (enrId: string) => {
    approveEnrollment(enrId, true, currentEmpNo, currentEmployee.name, '主管即時核准');
    showToast('已即時核准該學員之培訓課程報名！');
  };

  // Quick single reject enrollment
  const handleQuickRejectEnrollment = (enrId: string) => {
    const reason = prompt('請輸入駁回原因：', '因工期排程考量，暫不派訓');
    if (reason !== null) {
      approveEnrollment(enrId, false, currentEmpNo, currentEmployee.name, reason);
      showToast('已駁回該學員之報名申請');
    }
  };

  // Quick single approve external app
  const handleQuickApproveExternalApp = (appId: string) => {
    approveExternalApplication(appId, true, currentEmployee.name);
    showToast('已即時核准該同仁之外訓補助與公差申請！');
  };

  // Quick single verify license
  const handleQuickVerifyLicense = (licId: string) => {
    verifyEmployeeLicense(licId, currentEmployee.name);
    showToast('已即時審核通過並將專業證照登記至人才庫總表！');
  };

  // Quick single evaluate SMART plan
  const handleQuickEvaluateSmartPlan = (plan: SmartActionPlan) => {
    setQuickEvalTarget({
      plan,
      score: plan.selfScore || 90,
      feedback: '目標具體明確，落地指標達成率佳，落實工程品質管控，予以核定結訓！',
    });
  };

  const handleConfirmQuickEval = () => {
    if (!quickEvalTarget) return;
    managerEvaluateSmartActionPlan(quickEvalTarget.plan.id, {
      managerScore: quickEvalTarget.score,
      managerFeedback: quickEvalTarget.feedback,
      evaluatorEmpNo: currentEmpNo,
      evaluatorName: currentEmployee.name,
    });
    setQuickEvalTarget(null);
    showToast('已完成現場考評並核發結訓學分！');
  };

  // Batch Approve All Filtered
  const handleBatchApproveAll = () => {
    if (totalPendingApprovalsCount === 0) return;

    if (!window.confirm(`確定要將目前篩選之 ${totalPendingApprovalsCount} 筆待簽核表單「一鍵全部核准」嗎？`)) {
      return;
    }

    // 1. Approve all pending enrollments
    pendingEnrollments.forEach((enr) => {
      approveEnrollment(enr.id, true, currentEmpNo, currentEmployee.name, '主管批次快速核准');
    });

    // 2. Approve all pending external apps
    pendingExternalApps.forEach((app) => {
      approveExternalApplication(app.id, true, currentEmployee.name);
    });

    // 3. Verify all pending licenses
    pendingLicenseReviews.forEach((lic) => {
      verifyEmployeeLicense(lic.id, currentEmployee.name);
    });

    // 4. Quick evaluate pending SMART plans
    pendingSmartEvaluations.forEach((plan) => {
      managerEvaluateSmartActionPlan(plan.id, {
        managerScore: plan.selfScore || 90,
        managerFeedback: '批次核准：目標量化達成，符合工程精進要點。',
        evaluatorEmpNo: currentEmpNo,
        evaluatorName: currentEmployee.name,
      });
    });

    setSelectedEnrollmentIds([]);
    setSelectedExternalAppIds([]);
    setSelectedLicenseIds([]);
    showToast(`已成功批次核准 ${totalPendingApprovalsCount} 筆表單！`);
  };

  // New External Application form state
  const [extCourseName, setExtCourseName] = useState('');
  const [extProvider, setExtProvider] = useState('財團法人台灣營建研究院');
  const [extCategory, setExtCategory] = useState('專業技術');
  const [extHours, setExtHours] = useState(16);
  const [extFee, setExtFee] = useState(6500);
  const [extStartDate, setExtStartDate] = useState('2026-09-15');
  const [extEndDate, setExtEndDate] = useState('2026-09-16');
  const [extReason, setExtReason] = useState('配合案場深開挖自動化監測與擋土支撐安全管理實務需求，精進現場工程技術。');

  const handleSubmitExternalApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extCourseName.trim()) {
      alert('請輸入外訓課程名稱');
      return;
    }

    addExternalApplication({
      empNo: currentEmpNo,
      empName: currentEmployee.name,
      department: currentEmployee.department,
      title: currentEmployee.title,
      courseName: extCourseName.trim(),
      provider: extProvider.trim(),
      trainingCategory: extCategory,
      hours: Number(extHours) || 8,
      fee: Number(extFee) || 0,
      startDate: extStartDate,
      endDate: extEndDate,
      reason: extReason.trim(),
      approvalStatus: 'pending',
      passStatus: 'pending_verification',
    });

    setIsApplyExternalOpen(false);
    showToast('外訓補助與公差申請表單已成功送出，已進入主管簽核流程！');
    setExtCourseName('');
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-800 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero Banner & Logged-in Staff Overview Card */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Greeting & Profile */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 ring-4 ring-white/10">
              {currentEmployee.name.charAt(0)}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {isManager ? '主管管理職 (具簽核權限)' : '一般同仁 (前台工作台)'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  工號：{currentEmployee.empNo}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  即時連線中
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{currentEmployee.name}</span>
                <span className="text-sm font-normal text-slate-300">
                  ({currentEmployee.department} · {currentEmployee.title} · {currentEmployee.rank}職等)
                </span>
              </h1>

              <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                <span>所屬科案：{currentEmployee.section || '未分派'}</span>
                <span>·</span>
                <span>屬性：{currentEmployee.attribute}</span>
                <span>·</span>
                <span>管理年資：{currentEmployee.internalMgmtStartDate ? `${currentEmployee.internalMgmtStartDate}起` : '儲備主管'}</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Action Launchers */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center">
            <button
              onClick={() => setIsApplyExternalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              提出外訓申請
            </button>
            <button
              onClick={() => setIsAddLicenseOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 active:scale-95"
            >
              <Award className="w-4 h-4" />
              申報新證照
            </button>
            <button
              onClick={() => setActiveView('frontend_survey_fill')}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              填報意願調查
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Metric Cards (即時待辦與簽核概況) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 待我簽核表單 */}
        <div
          onClick={() => setActiveTab('pending_approvals')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            activeTab === 'pending_approvals'
              ? 'bg-amber-500/10 border-amber-400/80 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              待我簽核 / 審查表單
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalPendingApprovalsCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">件待處理</span>
            {totalPendingApprovalsCount > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                需即時簽核
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 truncate">
            包含課程報名 {pendingEnrollments.length} · SMART考評 {pendingSmartEvaluations.length} · 外訓 {pendingExternalApps.length} · 證照 {pendingLicenseReviews.length}
          </p>
        </div>

        {/* Card 2: 我的待辦呈送 / 待填報 */}
        <div
          onClick={() => setActiveTab('my_submissions')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            activeTab === 'my_submissions'
              ? 'bg-blue-500/10 border-blue-400/80 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              我的待辦呈送 / 待填表單
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalMyPendingCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">項待填</span>
            {totalMyPendingCount > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                待送出
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 truncate">
            問卷 {myPendingSurveys.length} 份 · 研習測驗/SMART {myEnrollmentsNeedingAction.length} 項 · 證照預警 {myExpiringLicenses.length}
          </p>
        </div>

        {/* Card 3: 我呈送的表單流程進度 */}
        <div
          onClick={() => setActiveTab('my_tracking')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            activeTab === 'my_tracking'
              ? 'bg-indigo-500/10 border-indigo-400/80 ring-2 ring-indigo-400/20'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              已呈送表單流程追蹤
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {mySubmittedHistory.length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">筆歷程</span>
            <span className="ml-auto text-[11px] text-indigo-600 font-bold flex items-center gap-1">
              查看審查進度 <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 truncate">
            即時查閱各單位主管核決簽核紀錄與評語
          </p>
        </div>

        {/* Card 4: 快速申請與探索 */}
        <div
          onClick={() => setActiveTab('quick_launchers')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            activeTab === 'quick_launchers'
              ? 'bg-emerald-500/10 border-emerald-400/80 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              快速發起新表單
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900">
              5 大快捷申請
            </span>
            <span className="ml-auto text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              進入專區 <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 truncate">
            外訓補助 · 證照申報 · 課程報名 · 意願調查 · 履歷維護
          </p>
        </div>
      </div>

      {/* 3. Main Navigation Sub-Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('pending_approvals')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending_approvals'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>待我簽核 / 審查表單</span>
            {totalPendingApprovalsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'pending_approvals' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {totalPendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my_submissions')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_submissions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>我的待辦呈送 / 待填報</span>
            {totalMyPendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'my_submissions' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
              }`}>
                {totalMyPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my_tracking')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_tracking'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>我已呈送之表單進度 ({mySubmittedHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quick_launchers')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'quick_launchers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>快捷發起新申請</span>
          </button>
        </div>

        {/* Global Action on Tab: Batch Approve */}
        {activeTab === 'pending_approvals' && totalPendingApprovalsCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApproveAll}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              一鍵全部核准 ({totalPendingApprovalsCount} 件)
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* VIEW TAB 1: 待我簽核 / 審查表單 (即時簽核作業專區) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'pending_approvals' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Header Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  待簽核表單即時審批中心
                </h2>
                <p className="text-[11px] text-slate-500">
                  即時顯示同仁呈送之培訓報名、SMART行動計畫考評、外訓補助與專業證照審核。
                </p>
              </div>
            </div>

            {/* Scope Filter for Demo / Department */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">篩選範圍：</span>
              <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs">
                <button
                  onClick={() => setApprovalScopeFilter('my_scope')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    approvalScopeFilter === 'my_scope'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  我管轄部屬 ({currentEmployee.department})
                </button>
                <button
                  onClick={() => setApprovalScopeFilter('all_company')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    approvalScopeFilter === 'all_company'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  全公司待審 (測試模式)
                </button>
              </div>
            </div>
          </div>

          {/* If No Pending Items */}
          {totalPendingApprovalsCount === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">目前無任何待簽核表單</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                太棒了！您所管轄之同仁目前無待審之課程報名、SMART計畫或補助申請，所有表單皆已即時核決完畢。
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setApprovalScopeFilter('all_company')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
                >
                  切換至全公司待審清單檢視
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Course Enrollment Approvals Stream */}
              {pendingEnrollments.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        內部培訓課程報名簽核 ({pendingEnrollments.length} 筆)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">直屬主管 / 人資室審核 · 點選卡片調閱完整表單</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pendingEnrollments.map((enr) => {
                      const course = internalCourses.find((c) => c.id === enr.courseId);
                      return (
                        <div
                          key={enr.id}
                          onClick={() => setInspectEnrollment(enr)}
                          className="p-4 sm:p-5 hover:bg-blue-50/40 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                培訓報名
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {enr.empName} ({enr.empNo})
                              </span>
                              <span className="text-xs text-slate-500">
                                · {enr.department} · {enr.title}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                送出時間：{enr.enrolledAt}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                              <span>{enr.courseTitle || course?.title || '專業培訓課程'}</span>
                              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                                {enr.batchName || enr.batchNo || '開課梯次'}
                              </span>
                            </h4>

                            <p className="text-xs text-slate-600 flex items-center gap-3">
                              <span>課程時數：{course?.hours || 8} 小時</span>
                              <span>·</span>
                              <span>上課模式：{course?.deliveryMode === 'online' ? '線上數位' : '實體面授'}</span>
                              <span>·</span>
                              <span>報名性質：{enr.enrollmentType === 'assigned_mandatory' ? '公司指派必修' : '個人自主選修'}</span>
                            </p>
                          </div>

                          {/* Quick Action Buttons */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                          >
                            <button
                              onClick={() => setInspectEnrollment(enr)}
                              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-2xs"
                            >
                              調閱詳情
                            </button>
                            <button
                              onClick={() => handleQuickRejectEnrollment(enr.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200"
                            >
                              駁回
                            </button>
                            <button
                              onClick={() => handleQuickApproveEnrollment(enr.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              快速核准
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. SMART Action Plan Manager Evaluations */}
              {pendingSmartEvaluations.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <h3 className="text-xs font-bold text-amber-950">
                        SMART 課後行動計畫主管考評與核決 ({pendingSmartEvaluations.length} 筆)
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-700">60天落地自評已送出 · 點選卡片調閱完整指標審核</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pendingSmartEvaluations.map((plan) => {
                      const openSmartPlan = () => {
                        const enr = courseEnrollments.find(
                          (e) => e.empNo === plan.empNo && (e.courseId === plan.courseId || e.id === plan.enrollmentId)
                        ) || {
                          id: plan.enrollmentId || 'enr-temp',
                          batchId: plan.batchId || 'batch-1',
                          courseId: plan.courseId,
                          empNo: plan.empNo,
                          empName: plan.empName,
                          department: plan.department || '',
                          title: plan.title || '',
                          enrollmentType: 'self_enrolled',
                          listType: 'regular',
                          approvalStatus: 'approved',
                          enrolledAt: plan.submittedAt || '2026-06-01',
                          attendanceStatus: 'checked_in',
                          finalPassStatus: 'in_progress',
                        };
                        setSmartPlanTarget({
                          enrollment: enr,
                          course: internalCourses.find((c) => c.id === plan.courseId),
                          plan,
                          mode: 'manager',
                        });
                      };

                      return (
                        <div
                          key={plan.id}
                          onClick={openSmartPlan}
                          className="p-4 sm:p-5 hover:bg-amber-50/40 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                SMART考評
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {plan.empName} ({plan.empNo})
                              </span>
                              <span className="text-xs text-slate-500">
                                · {plan.department} · {plan.title}
                              </span>
                              {plan.selfScore && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  同仁自評：{plan.selfScore} 分
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                              {plan.courseTitle} - 現場實踐目標考評
                            </h4>

                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-2xl space-y-1">
                              <p>
                                <strong className="text-slate-800">具體目標 (Specific)：</strong>
                                {plan.specificGoal || '於負責之案場導入關鍵工法滾動控制'}
                              </p>
                              <p>
                                <strong className="text-slate-800">自評成果事蹟：</strong>
                                {plan.selfAchievementSummary || plan.selfNotes || '已完成現場施工界面整合與自主查核作業'}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                          >
                            <button
                              onClick={openSmartPlan}
                              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors border border-amber-200 shadow-2xs"
                            >
                              完整審核
                            </button>
                            <button
                              onClick={() => handleQuickEvaluateSmartPlan(plan)}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              即時考評 (90分核定)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. External Training Applications */}
              {pendingExternalApps.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        外部機構研習與公差補助申請 ({pendingExternalApps.length} 筆)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">外訓公差 · 費用核銷審查 · 點選卡片調閱完整申請單</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pendingExternalApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setInspectExternalApp(app)}
                        className="p-4 sm:p-5 hover:bg-purple-50/40 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                              外訓補助
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {app.empName} ({app.empNo})
                            </span>
                            <span className="text-xs text-slate-500">
                              · {app.department} · {app.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              申請時間：{app.appliedAt}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {app.provider} - {app.courseName}
                          </h4>

                          <p className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                            <span>研習日期：{app.startDate} ~ {app.endDate} ({app.hours} 小時)</span>
                            <span>·</span>
                            <span className="text-purple-700 font-semibold">
                              預估費用：${app.fee?.toLocaleString() || 0} 元
                            </span>
                            <span>·</span>
                            <span>原因：{app.reason}</span>
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                        >
                          <button
                            onClick={() => setInspectExternalApp(app)}
                            className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200 shadow-2xs"
                          >
                            調閱詳情
                          </button>
                          <button
                            onClick={() => {
                              approveExternalApplication(app.id, false, currentEmployee.name);
                              showToast('已退回該筆外訓申請');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200"
                          >
                            退回
                          </button>
                          <button
                            onClick={() => handleQuickApproveExternalApp(app.id)}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            核准補助
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Employee License Reviews */}
              {pendingLicenseReviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        同仁自主申報專業證照審核 ({pendingLicenseReviews.length} 筆)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">證書審核入庫 · 登錄人才庫 · 點選卡片調閱證件詳情</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pendingLicenseReviews.map((lic) => (
                      <div
                        key={lic.id}
                        onClick={() => setInspectLicenseReview(lic)}
                        className="p-4 sm:p-5 hover:bg-amber-50/40 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              證照審核
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {lic.empName} ({lic.empNo})
                            </span>
                            <span className="text-xs text-slate-500">
                              · {lic.department} · {lic.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              申報時間：{lic.submittedAt || lic.issueDate}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 group-hover:text-amber-800 transition-colors">
                            <span>{lic.licenseName}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              (字號：{lic.licenseNo})
                            </span>
                          </h4>

                          <p className="text-xs text-slate-600 flex items-center gap-3">
                            <span>發證機關：{lic.issuingAuthority}</span>
                            <span>·</span>
                            <span>取得日期：{lic.issueDate}</span>
                            <span>·</span>
                            <span>效期：{lic.hasExpiry ? (lic.expiryDate || '有期限') : '永久有效'}</span>
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                        >
                          <button
                            onClick={() => setInspectLicenseReview(lic)}
                            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors border border-amber-200 shadow-2xs"
                          >
                            調閱詳情
                          </button>
                          <button
                            onClick={() => {
                              showToast('已退回該筆證照申報，請同仁重新補件');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200"
                          >
                            退回
                          </button>
                          <button
                            onClick={() => handleQuickVerifyLicense(lic.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            審核入庫 (核發及格)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW TAB 2: 我的待辦呈送 / 待填報表單 (即時填報作業專區) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'my_submissions' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  我的待辦事項與填報作業專區
                </h2>
                <p className="text-[11px] text-slate-500">
                  請於規定期限內完成意願問卷、課前課後問卷、線上測驗與 SMART 行動計畫自評。
                </p>
              </div>
            </div>
          </div>

          {totalMyPendingCount === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">目前無任何待填報表單</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                您的所有問卷、研習進度與 SMART 落地計畫均已妥善填報完畢！
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Pending Surveys */}
              {myPendingSurveys.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        案主管遴選意願調查問卷 ({myPendingSurveys.length} 份待填)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">總管理處 · 年度意願調查</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {myPendingSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                              意願調查
                            </span>
                            <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              尚未填寫
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">
                            {survey.title}
                          </h4>

                          <p className="text-xs text-slate-600">
                            {survey.description || '請依個人職涯意願與可調動區域進行填報，以利開案主管媒合作業。'}
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveView('frontend_survey_fill')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-end sm:self-center active:scale-95"
                        >
                          <span>立即填報問卷</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Course Action Items (Pre/Post Survey, Exam, SMART) */}
              {myEnrollmentsNeedingAction.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        專業訓練研習作業 ({myEnrollmentsNeedingAction.length} 項待辦)
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">問卷 / 線上測驗 / SMART 自評</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {myEnrollmentsNeedingAction.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.actionType === 'smart_setup' || item.actionType === 'smart_self_eval'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {item.actionType === 'pre_survey' && '課前問卷'}
                              {item.actionType === 'post_survey' && '課後滿意度'}
                              {item.actionType === 'take_exam' && '隨堂測驗'}
                              {item.actionType === 'smart_setup' && 'SMART 目標呈送'}
                              {item.actionType === 'smart_self_eval' && 'SMART 60天自評'}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {item.enrollment.batchName || item.enrollment.batchNo || '期別'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600">
                            {item.description}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="shrink-0 self-end sm:self-center">
                          {item.actionType === 'smart_setup' && (
                            <button
                              onClick={() => {
                                setSmartPlanTarget({
                                  enrollment: item.enrollment,
                                  course: item.course,
                                  mode: 'setup',
                                });
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <span>設定 SMART 目標</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {item.actionType === 'smart_self_eval' && (
                            <button
                              onClick={() => {
                                setSmartPlanTarget({
                                  enrollment: item.enrollment,
                                  course: item.course,
                                  plan: item.plan,
                                  mode: 'self_eval',
                                });
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <span>填寫自評與成效</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(item.actionType === 'pre_survey' || item.actionType === 'post_survey' || item.actionType === 'take_exam') && (
                            <button
                              onClick={() => {
                                setClassroomEnrollment(item.enrollment);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <span>進入線上數位教室</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Expiring Licenses */}
              {myExpiringLicenses.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
                  <div className="bg-rose-50/80 px-4 py-3 border-b border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <h3 className="text-xs font-bold text-rose-950">
                        專業證照效期預警與法定回訓 ({myExpiringLicenses.length} 張)
                      </h3>
                    </div>
                    <span className="text-[11px] text-rose-700">90 天內即將到期 · 需完成回訓並申報</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {myExpiringLicenses.map((lic) => (
                      <div
                        key={lic.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              即將到期
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {lic.licenseName} ({lic.licenseNo})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            到期日：{lic.expiryDate} (回訓期限：{lic.renewalDeadlineDate || '儘速完成回訓'})
                          </p>
                        </div>

                        <button
                          onClick={() => setRenewLicenseTarget(lic)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-end sm:self-center active:scale-95"
                        >
                          <span>申報換證/回訓</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW TAB 3: 我已呈送之表單與簽核進度 (流程追蹤) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'my_tracking' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  我已呈送之表單與流程審查進度
                </h2>
                <p className="text-[11px] text-slate-500">
                  透明查閱所有呈送之研習報名、行動計畫、外訓補助與證照審核進度。
                </p>
              </div>
            </div>
          </div>

          {mySubmittedHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">尚無呈送表單紀錄</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                您目前尚未呈送任何申請表單，可至「選課中心」或「快捷發起新申請」提出報名或補助。
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {mySubmittedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.statusColor}`}>
                          {item.statusLabel}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          呈送時間：{item.submittedAt}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h4>

                      {item.reviewerName && (
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <span>審核主管：{item.reviewerName}</span>
                          {item.comment && (
                            <span className="text-slate-500">
                              (評語：{item.comment})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
                      {item.category === '課程報名' && (
                        <button
                          onClick={() => {
                            setInspectEnrollment(item.detailsObj);
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors border border-blue-200"
                        >
                          查看報名單
                        </button>
                      )}

                      {item.category === 'SMART行動計畫' && (
                        <button
                          onClick={() => {
                            const enr = courseEnrollments.find(
                              (e) => e.empNo === item.detailsObj.empNo && (e.courseId === item.detailsObj.courseId || e.id === item.detailsObj.enrollmentId)
                            ) || {
                              id: item.detailsObj.enrollmentId || 'enr-temp',
                              batchId: item.detailsObj.batchId || 'batch-1',
                              courseId: item.detailsObj.courseId,
                              empNo: item.detailsObj.empNo,
                              empName: item.detailsObj.empName,
                              department: item.detailsObj.department || '',
                              title: item.detailsObj.title || '',
                              enrollmentType: 'self_enrolled',
                              listType: 'regular',
                              approvalStatus: 'approved',
                              enrolledAt: item.detailsObj.submittedAt || '2026-06-01',
                              attendanceStatus: 'checked_in',
                              finalPassStatus: 'in_progress',
                            };
                            setSmartPlanTarget({
                              enrollment: enr,
                              course: internalCourses.find((c) => c.id === item.detailsObj.courseId),
                              plan: item.detailsObj,
                              mode: 'view',
                            });
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
                        >
                          查看表單
                        </button>
                      )}

                      {(item.category === '外訓公差申請' || (item.category as string) === '外訓補助') && (
                        <button
                          onClick={() => {
                            setInspectExternalApp(item.detailsObj);
                          }}
                          className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
                        >
                          查看外訓單
                        </button>
                      )}

                      {(item.category === '專業證照申報' || (item.category as string) === '證照申報') && (
                        <button
                          onClick={() => {
                            setInspectLicenseReview(item.detailsObj);
                          }}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors border border-amber-200"
                        >
                          查看證照詳情
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW TAB 4: 快捷發起新申請專區 */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'quick_launchers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
          {/* Launcher 1: 提出外部研習與公差補助申請 */}
          <div
            onClick={() => setIsApplyExternalOpen(true)}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                提出外部研習補助申請
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                向台灣營建研究院、職安協會等公協會申請專業課程進修、公差指派與費用補助。
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-purple-600">
              <span>立即填報申請單</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Launcher 2: 申報新取得專業證照 */}
          <div
            onClick={() => setIsAddLicenseOpen(true)}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                申報新取得專業證照
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                上傳公共工程品管、職業安全衛生或技師證書，經人資室審核後登記於人才庫。
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <span>立即上傳申報</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Launcher 3: 報名內部專業培訓課程 */}
          <div
            onClick={() => setActiveView('frontend_training_portal')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                探索內部培訓課程
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                瀏覽營造工程技術、工務管理、BIM與法規核心課程，自主報名開課梯次。
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <span>前往選課中心</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Launcher 4: 案主管意願調查填報 */}
          <div
            onClick={() => setActiveView('frontend_survey_fill')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                填報案主管意願調查
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                填寫開案派任意願、可調動區域與工程規模偏好，同步人才庫遴選大數據。
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <span>進入問卷填報</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Launcher 5: 維護個人履歷與專案經歷 */}
          <div
            onClick={() => setActiveView('frontend_training_portal')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                個人履歷與專案經歷
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                更新個人在職完案紀錄、歷年工程案場特殊工法經驗與專長標籤。
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span>前往個人資料專區</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INTERACTIVE MODALS */}
      {/* ---------------------------------------------------- */}

      {/* 1. Course Enrollment Review Modal */}
      {inspectEnrollment && (
        <EnrollmentReviewDetailModal
          isOpen={Boolean(inspectEnrollment)}
          onClose={() => setInspectEnrollment(null)}
          enrollment={inspectEnrollment}
          onApprove={(id, comment) => {
            approveEnrollment(id, true, currentEmpNo, currentEmployee.name, comment || '核准');
            setInspectEnrollment(null);
            showToast('已核准報名！');
          }}
          onReject={(id, comment) => {
            approveEnrollment(id, false, currentEmpNo, currentEmployee.name, comment || '未核准');
            setInspectEnrollment(null);
            showToast('已駁回報名！');
          }}
        />
      )}

      {/* 2. SMART Action Plan Interactive Modal */}
      {smartPlanTarget && (
        <SmartActionPlanModal
          enrollment={smartPlanTarget.enrollment}
          course={smartPlanTarget.course}
          plan={smartPlanTarget.plan}
          initialMode={smartPlanTarget.mode}
          onClose={() => setSmartPlanTarget(null)}
        />
      )}

      {/* 3. Add New License Modal */}
      {isAddLicenseOpen && (
        <AddResumeLicenseModal
          isOpen={isAddLicenseOpen}
          onClose={() => setIsAddLicenseOpen(false)}
          empNo={currentEmpNo}
        />
      )}

      {/* 4. Renew License Modal */}
      {renewLicenseTarget && (
        <RenewLicenseModal
          isOpen={Boolean(renewLicenseTarget)}
          onClose={() => setRenewLicenseTarget(null)}
          license={renewLicenseTarget}
        />
      )}

      {/* 5. Online Digital Classroom Modal */}
      {classroomEnrollment && (
        <OnlineClassroomModal
          isOpen={Boolean(classroomEnrollment)}
          onClose={() => setClassroomEnrollment(null)}
          enrollment={classroomEnrollment}
        />
      )}

      {/* 5b. External Application Review Detail Modal */}
      <ExternalAppReviewDetailModal
        isOpen={Boolean(inspectExternalApp)}
        onClose={() => setInspectExternalApp(null)}
        application={inspectExternalApp}
      />

      {/* 5c. Employee License Review Detail Modal */}
      <LicenseReviewDetailModal
        isOpen={Boolean(inspectLicenseReview)}
        onClose={() => setInspectLicenseReview(null)}
        license={inspectLicenseReview}
      />

      {/* 6. Quick Manager Evaluation Dialog */}
      {quickEvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  SMART 行動計畫現場主管考評
                </h3>
              </div>
              <button
                onClick={() => setQuickEvalTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <p><strong>受評學員：</strong>{quickEvalTarget.plan.empName} ({quickEvalTarget.plan.empNo} · {quickEvalTarget.plan.department})</p>
                <p><strong>培訓課程：</strong>{quickEvalTarget.plan.courseTitle}</p>
                <p><strong>學員自評：</strong>{quickEvalTarget.plan.selfScore || 90} 分</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  主管考評分數 (0-100 分)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quickEvalTarget.score}
                  onChange={(e) => setQuickEvalTarget({ ...quickEvalTarget, score: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  主管審核回饋與評語
                </label>
                <textarea
                  rows={3}
                  value={quickEvalTarget.feedback}
                  onChange={(e) => setQuickEvalTarget({ ...quickEvalTarget, feedback: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickEvalTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickEval}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                確認核定與結訓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. New External Course Application Modal */}
      {isApplyExternalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  提出外部機構研習與公差補助申請單
                </h3>
              </div>
              <button
                onClick={() => setIsApplyExternalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExternalApp} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                <div>
                  <span className="text-slate-500">申請同仁：</span>
                  <strong className="text-slate-900 ml-1">{currentEmployee.name} ({currentEmployee.empNo})</strong>
                </div>
                <div>
                  <span className="text-slate-500">所屬部室：</span>
                  <strong className="text-slate-900 ml-1">{currentEmployee.department}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  研習/培訓課程名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：營建工程深開挖自動化監測與安全支撐實務研習"
                  value={extCourseName}
                  onChange={(e) => setExtCourseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    培訓主辦機構
                  </label>
                  <input
                    type="text"
                    required
                    value={extProvider}
                    onChange={(e) => setExtProvider(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    專業職能類別
                  </label>
                  <select
                    value={extCategory}
                    onChange={(e) => setExtCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="專業技術">專業技術</option>
                    <option value="核心職能">核心職能</option>
                    <option value="工安品管">工安品管</option>
                    <option value="管理領導">管理領導</option>
                    <option value="法規檢定">法規檢定</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    研習時數 (小時)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={extHours}
                    onChange={(e) => setExtHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    預估報名費 (公司補助款)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extFee}
                    onChange={(e) => setExtFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    研習起日
                  </label>
                  <input
                    type="date"
                    value={extStartDate}
                    onChange={(e) => setExtStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    研習迄日
                  </label>
                  <input
                    type="date"
                    value={extEndDate}
                    onChange={(e) => setExtEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  派訓原由與工程效益說明
                </label>
                <textarea
                  rows={3}
                  value={extReason}
                  onChange={(e) => setExtReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyExternalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs"
                >
                  送出申請 (呈送主管審核)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
