import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  QrCode,
  Video,
  Target,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Users,
  ChevronRight,
  ExternalLink,
  Edit3,
  TrendingUp,
  FileText,
  ShieldCheck,
  Filter,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { CourseEnrollment, InternalCourse, SmartActionPlan } from '../../../types';
import { PhysicalCheckInModal } from './PhysicalCheckInModal';
import { OnlineClassroomModal } from './OnlineClassroomModal';
import { SmartActionPlanModal } from './SmartActionPlanModal';
import { CertificateModal } from './CertificateModal';
import { PersonalLearningProgressDashboard } from './PersonalLearningProgressDashboard';
import { AssignmentSubmissionModal } from './AssignmentSubmissionModal';
import { AssignmentGradingModal } from './AssignmentGradingModal';

interface MyLearningViewProps {
  currentEmpNo?: string;
  onSelectEmpNo?: (empNo: string) => void;
  onNavigateToCatalog?: () => void;
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  currentEmpNo = 'EMP-001',
  onSelectEmpNo,
  onNavigateToCatalog,
}) => {
  const {
    courseEnrollments,
    internalCourses,
    smartActionPlans,
    employees,
    trainingMaterials,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'upcoming' | 'smart_evaluation' | 'waitlist' | 'completed' | 'certs'
  >('upcoming');

  const [smartStatusFilter, setSmartStatusFilter] = useState<
    'all' | 'pending_setup' | 'in_progress' | 'pending_self_eval' | 'completed'
  >('all');

  // Modals state
  const [activeCheckInEnrollment, setActiveCheckInEnrollment] = useState<CourseEnrollment | null>(null);
  const [activeOnlineCourse, setActiveOnlineCourse] = useState<{
    enrollment: CourseEnrollment;
    course: InternalCourse;
  } | null>(null);
  const [activeSmartPlanModal, setActiveSmartPlanModal] = useState<{
    enrollment: CourseEnrollment;
    course?: InternalCourse;
    plan?: SmartActionPlan;
    initialMode?: 'setup' | 'self_eval' | 'view' | 'manager';
  } | null>(null);
  const [activeCert, setActiveCert] = useState<{
    enrollment: CourseEnrollment;
    course?: InternalCourse;
  } | null>(null);
  const [activeAssignmentCourse, setActiveAssignmentCourse] = useState<{
    enrollment: CourseEnrollment;
    course: InternalCourse;
  } | null>(null);
  const [activeGradingCourse, setActiveGradingCourse] = useState<{
    enrollment: CourseEnrollment;
    course: InternalCourse;
  } | null>(null);

  // Filter enrollments for this employee
  const myEnrollments = courseEnrollments.filter(
    (e) => (e.empNo === currentEmpNo || (!e.empNo && currentEmpNo === 'EMP-001')) && e.status !== 'cancelled'
  );

  const upcomingList = myEnrollments.filter(
    (e) => (e.listType === 'regular' || e.listType === 'pending_approval') && e.status !== 'completed'
  );

  const waitlistList = myEnrollments.filter((e) => e.listType === 'waitlist');

  const completedList = myEnrollments.filter((e) => e.status === 'completed');

  const currentEmp = employees.find((e) => e.empNo === currentEmpNo) || employees[0];

  // Courses that require SMART Action Plan or already have a SMART plan
  const smartCourseItems = myEnrollments.filter((enr) => {
    const course = internalCourses.find((c) => c.id === enr.courseId);
    const matchedPlan = smartActionPlans.find(
      (p) => p.enrollmentId === enr.id || (p.empNo === currentEmpNo && p.courseId === enr.courseId)
    );
    // Courses requiring action plan or completed/in-progress courses with plan attached
    const isRequired =
      course?.actionPlanRequired === true ||
      course?.requireSmartActionPlan === true ||
      course?.passingCriteria?.requireActionPlan === true;
    return isRequired || matchedPlan !== undefined;
  });

  // Also include standalone smart plans for current user even if not in myEnrollments
  const userStandalonePlans = smartActionPlans.filter(
    (p) =>
      (p.empNo === currentEmpNo || (!p.empNo && currentEmpNo === 'EMP-001')) &&
      !smartCourseItems.some((e) => e.id === p.enrollmentId || e.courseId === p.courseId)
  );

  // Calculate statistics for SMART evaluation
  const smartStats = {
    total: smartCourseItems.length + userStandalonePlans.length,
    pendingSetup: 0,
    inProgress: 0,
    pendingSelfEval: 0,
    completed: 0,
  };

  smartCourseItems.forEach((enr) => {
    const plan = smartActionPlans.find(
      (p) => p.enrollmentId === enr.id || (p.empNo === currentEmpNo && p.courseId === enr.courseId)
    );
    if (!plan) {
      smartStats.pendingSetup++;
    } else if (plan.status === 'manager_evaluated' || plan.status === 'completed') {
      smartStats.completed++;
    } else if (plan.status === 'self_evaluated') {
      smartStats.completed++;
    } else if (plan.isSelfEvaluated) {
      smartStats.completed++;
    } else {
      // Check if scheduled date reached
      const isReached = plan.evaluationScheduledDate
        ? new Date(plan.evaluationScheduledDate).getTime() <= new Date().getTime()
        : true;
      if (isReached || plan.status === 'pending_self_eval') {
        smartStats.pendingSelfEval++;
      } else {
        smartStats.inProgress++;
      }
    }
  });

  userStandalonePlans.forEach((plan) => {
    if (plan.status === 'manager_evaluated' || plan.status === 'completed' || plan.status === 'self_evaluated' || plan.isSelfEvaluated) {
      smartStats.completed++;
    } else {
      const isReached = plan.evaluationScheduledDate
        ? new Date(plan.evaluationScheduledDate).getTime() <= new Date().getTime()
        : true;
      if (isReached || plan.status === 'pending_self_eval') {
        smartStats.pendingSelfEval++;
      } else {
        smartStats.inProgress++;
      }
    }
  });

  // Calculate user total credits & hours
  const totalEarnedCredits = completedList.reduce((sum, enr) => {
    const crs = internalCourses.find((c) => c.id === enr.courseId);
    return sum + (crs?.credits || 0);
  }, 0);

  const totalEarnedHours = completedList.reduce((sum, enr) => {
    const crs = internalCourses.find((c) => c.id === enr.courseId);
    return sum + (crs?.hours || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* 1. Visual Learning Progress Tracking Dashboard (Requirement 1: 圓餅圖表視覺化追蹤面板) */}
      <PersonalLearningProgressDashboard
        currentEmployee={currentEmp}
        enrollments={courseEnrollments}
        courses={internalCourses}
        materials={trainingMaterials}
        smartPlans={smartActionPlans}
        onOpenClassroom={(enrollment, course) =>
          setActiveOnlineCourse({ enrollment, course })
        }
        onOpenCertificate={(enrollment, course) =>
          setActiveCert({ enrollment, course })
        }
        onOpenSmartPlan={(enrollment, course) =>
          setActiveSmartPlanModal({
            enrollment,
            course,
            initialMode: 'self_eval',
          })
        }
        onNavigateToCatalog={onNavigateToCatalog}
      />

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          進行中 / 待上課 ({upcomingList.length})
        </button>

        {/* Dedicated SMART Evaluation Tab */}
        <button
          onClick={() => setActiveSubTab('smart_evaluation')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all relative ${
            activeSubTab === 'smart_evaluation'
              ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-xs'
              : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-400" />
          SMART 實踐落地評鑑 ({smartStats.total})
          {smartStats.pendingSelfEval > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
          )}
          {smartStats.pendingSelfEval > 0 && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black">
              {smartStats.pendingSelfEval}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('waitlist')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'waitlist'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          候補排隊中 ({waitlistList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('completed')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          已完訓課程 ({completedList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('certs')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'certs'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          電子證書夾 ({completedList.length})
        </button>
      </div>

      {/* ================= TAB 1: UPCOMING ================= */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingList.map((enr) => {
            const course = internalCourses.find((c) => c.id === enr.courseId);
            const isPhysical = enr.deliveryType === 'physical';
            const matchedPlan = smartActionPlans.find(
              (p) => p.enrollmentId === enr.id || (p.empNo === currentEmpNo && p.courseId === enr.courseId)
            );
            const requiresSmart =
              course?.actionPlanRequired === true ||
              course?.requireSmartActionPlan === true ||
              course?.passingCriteria?.requireActionPlan === true;

            return (
              <div
                key={enr.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isPhysical
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isPhysical ? '實體研習' : '線上影音'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                      {enr.batchName}
                    </span>
                    {requiresSmart && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <Target className="w-3 h-3 text-amber-700" />
                        需設定 SMART 實踐指標
                      </span>
                    )}
                    {enr.approvalStatus === 'pending' && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[10px] font-bold">
                        待主管審核中
                      </span>
                    )}
                    {enr.attendanceStatus === 'checked_in' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已現場簽到
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{enr.courseTitle}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      報名日期：{enr.enrolledAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      獲得學分：{course?.credits || 4} 點
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  {!isPhysical && (
                    <div className="pt-2 max-w-xs space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>研習進度</span>
                        <span className="font-bold text-slate-800">{enr.videoWatchPercent || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${enr.videoWatchPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {/* Physical Check-in Button */}
                  {isPhysical && (
                    <button
                      onClick={() => setActiveCheckInEnrollment(enr)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                        enr.attendanceStatus === 'checked_in'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      {enr.attendanceStatus === 'checked_in' ? '查看報到憑證' : '現場 QR 簽到報到'}
                    </button>
                  )}

                  {/* Classroom Button */}
                  {course && (
                    <button
                      onClick={() => setActiveOnlineCourse({ enrollment: enr, course })}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      title="進入研習教室進行課前問卷、閱讀講義、觀看影音與隨堂測驗"
                    >
                      <Video className="w-4 h-4" />
                      進入研習教室
                    </button>
                  )}

                  {/* Assignment Button (Word, Excel, PPT, PDF, Image) */}
                  {course && (
                    <button
                      onClick={() => setActiveAssignmentCourse({ enrollment: enr, course })}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                        enr.assignmentSubmission?.gradeStatus === 'graded'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : enr.assignmentSubmission
                          ? 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20'
                      }`}
                      title="繳交或檢視課後實務作業與 OneDrive 雲端存檔狀態"
                    >
                      <FileText className="w-4 h-4" />
                      {enr.assignmentSubmission?.gradeStatus === 'graded'
                        ? `作業已批閱 (${enr.assignmentSubmission.gradeScore !== undefined ? `${enr.assignmentSubmission.gradeScore}分` : '通過'})`
                        : enr.assignmentSubmission
                        ? '作業已繳交 (待批閱)'
                        : '繳交實務作業'}
                    </button>
                  )}

                  {/* SMART Plan Button */}
                  <button
                    onClick={() =>
                      setActiveSmartPlanModal({
                        enrollment: enr,
                        course,
                        plan: matchedPlan,
                        initialMode: matchedPlan ? (matchedPlan.isSelfEvaluated ? 'view' : 'self_eval') : 'setup',
                      })
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                      matchedPlan
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : requiresSmart
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-amber-300" />
                    {matchedPlan ? (matchedPlan.isSelfEvaluated ? '檢視 SMART 評鑑' : 'SMART 自評中') : '設定 SMART 目標'}
                  </button>
                </div>
              </div>
            );
          })}

          {upcomingList.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">目前暫無進行中或待上課的課程</h4>
              <p className="text-xs text-slate-400 mt-1">請前往「選課中心」選修您感興趣之專業職能課程</p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SMART EVALUATION SECTION (SMART 實踐落地評鑑專區) ================= */}
      {activeSubTab === 'smart_evaluation' && (
        <div className="space-y-6">
          {/* Hero Banner with Clear Explanation */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  課後落地實踐 · 目標與自評管理
                </span>
                <span className="text-xs text-slate-400">育碁 aEnrich 職能模型</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                SMART 實踐落地評鑑專區
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                當研習課程要求設定 SMART 資料時，會自動呈現於本專區。學員完成目標擬定並送出後，系統將於<strong>指定考核時間到達時</strong>自動開放「落地實踐自評表單」，由同仁回填案場落實成果並自評送出，由直屬主管進行最終核定考評。
              </p>
            </div>

            {/* Workflow steps visual */}
            <div className="relative z-10 mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold block">STEP 1</span>
                <div className="font-bold text-white">課程要求 SMART</div>
                <p className="text-[11px] text-slate-400">教務要求課後指標，自動列入本專區</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] text-blue-400 font-bold block">STEP 2</span>
                <div className="font-bold text-white">擬定五大指標送出</div>
                <p className="text-[11px] text-slate-400">填寫 S-M-A-R-T 並設定指定自評時間</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30 space-y-1">
                <span className="text-[10px] text-amber-300 font-bold block">STEP 3</span>
                <div className="font-bold text-amber-200">指定時間填報自評</div>
                <p className="text-[11px] text-amber-300/80">時間到期出現自評表單，回填成果送出</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 space-y-1">
                <span className="text-[10px] text-emerald-300 font-bold block">STEP 4</span>
                <div className="font-bold text-emerald-200">直屬主管實踐考評</div>
                <p className="text-[11px] text-emerald-300/80">主管 60 天考核評分與指導，歸檔證照庫</p>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSmartStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  smartStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部課程 ({smartStats.total})
              </button>
              <button
                onClick={() => setSmartStatusFilter('pending_setup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  smartStatusFilter === 'pending_setup'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                待設定目標 ({smartStats.pendingSetup})
              </button>
              <button
                onClick={() => setSmartStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  smartStatusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                實踐進行中 ({smartStats.inProgress})
              </button>
              <button
                onClick={() => setSmartStatusFilter('pending_self_eval')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  smartStatusFilter === 'pending_self_eval'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
              >
                待同仁自評 ({smartStats.pendingSelfEval})
              </button>
              <button
                onClick={() => setSmartStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  smartStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                已完成評鑑 ({smartStats.completed})
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              綁定同仁：{currentEmp?.name} ({currentEmpNo})
            </div>
          </div>

          {/* List of SMART Evaluation Course Cards */}
          <div className="space-y-4">
            {smartCourseItems.map((enr) => {
              const course = internalCourses.find((c) => c.id === enr.courseId);
              const plan = smartActionPlans.find(
                (p) => p.enrollmentId === enr.id || (p.empNo === currentEmpNo && p.courseId === enr.courseId)
              );

              // Determine plan stage
              const isPlanCreated = !!plan;
              const isSelfEvaluated = plan?.isSelfEvaluated || plan?.status === 'self_evaluated' || plan?.status === 'manager_evaluated';
              const isManagerEvaluated = plan?.status === 'manager_evaluated' || plan?.status === 'completed' || !!plan?.managerScore;

              // Check scheduled date
              const scheduledDateStr = plan?.evaluationScheduledDate || '2026-10-15';
              const isScheduledReached = plan?.evaluationScheduledDate
                ? new Date(plan.evaluationScheduledDate).getTime() <= new Date().getTime()
                : true;

              // Filter check
              if (smartStatusFilter === 'pending_setup' && isPlanCreated) return null;
              if (smartStatusFilter === 'in_progress' && (!isPlanCreated || isSelfEvaluated || isScheduledReached)) return null;
              if (smartStatusFilter === 'pending_self_eval' && (!isPlanCreated || isSelfEvaluated || !isScheduledReached)) return null;
              if (smartStatusFilter === 'completed' && !isSelfEvaluated && !isManagerEvaluated) return null;

              return (
                <div
                  key={enr.id}
                  className={`bg-white rounded-3xl border p-6 shadow-xs transition-all space-y-4 ${
                    !isPlanCreated
                      ? 'border-amber-300 bg-amber-50/20'
                      : isScheduledReached && !isSelfEvaluated
                      ? 'border-red-300 bg-red-50/20 ring-2 ring-red-200'
                      : isManagerEvaluated
                      ? 'border-emerald-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                          {enr.batchName || '2026 夏季班'}
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold">
                          🎯 要求課後實踐指標
                        </span>
                        <span className="text-xs text-slate-500">
                          獲得學分：{course?.credits || 4} 點 · 研習時數：{course?.hours || 12} 小時
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{enr.courseTitle}</h3>
                    </div>

                    {/* Stage Badge */}
                    <div>
                      {!isPlanCreated ? (
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-black shadow-xs">
                          待設定 SMART 目標
                        </span>
                      ) : isManagerEvaluated ? (
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          主管考評完成 ({plan?.managerScore || 95} 分)
                        </span>
                      ) : isSelfEvaluated ? (
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          已送出自評 · 待主管考評
                        </span>
                      ) : isScheduledReached ? (
                        <span className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-black shadow-xs animate-pulse flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          指定時間已到 · 待同仁自評
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-black shadow-xs">
                          實踐落地進行中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content depending on state */}
                  {!isPlanCreated ? (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          尚未設定 SMART 目標與指定自評時間
                        </h4>
                        <p className="text-xs text-amber-800">
                          本課程經授課主管設定需繳交落地實踐行動計畫，請於結訓前完成目標擬定並送出。
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setActiveSmartPlanModal({
                            enrollment: enr,
                            course,
                            initialMode: 'setup',
                          })
                        }
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
                      >
                        <Edit3 className="w-4 h-4 stroke-[2.5]" />
                        ⚡️ 立即設定 SMART 目標
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {/* Summary of SMART Goal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800">
                        <div className="space-y-1">
                          <strong className="text-blue-700">S 具體目標：</strong>
                          <p className="text-slate-600 line-clamp-2">{plan.specificGoal}</p>
                        </div>
                        <div className="space-y-1">
                          <strong className="text-emerald-700">M 衡量指標：</strong>
                          <p className="text-slate-600 line-clamp-2">{plan.measurableMetric}</p>
                        </div>
                      </div>

                      {/* Schedule info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-indigo-950">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>
                            指定自評開放時間：<strong>{scheduledDateStr}</strong>
                          </span>
                          <span className="text-[11px] text-indigo-600 font-semibold">
                            (實踐追蹤週期：{plan.evaluationPeriodDays || 60} 天)
                          </span>
                        </div>

                        {/* If not self evaluated, show countdown or alert */}
                        {!isSelfEvaluated && (
                          <div className="flex items-center gap-2">
                            {isScheduledReached ? (
                              <span className="px-2 py-0.5 bg-red-500 text-white rounded-md font-bold text-[10px]">
                                🔔 評核時間已開放！
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-md font-bold text-[10px]">
                                ⏳ 實踐中 (即將開放自評)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* If self evaluated, show self evaluation summary */}
                      {isSelfEvaluated && (
                        <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1.5">
                          <div className="flex items-center justify-between text-amber-950 font-bold">
                            <span className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-600" />
                              同仁實踐成果自評：{plan.selfScore} 分
                            </span>
                            <span className="text-[11px] text-slate-500">
                              自評送出日期：{plan.selfEvaluatedAt || '2026-08-30'}
                            </span>
                          </div>
                          <p className="text-slate-700 line-clamp-2">
                            {plan.selfAchievementSummary || '已落實關鍵要徑滾動控制，偏差率小於 1.5%。'}
                          </p>
                        </div>
                      )}

                      {/* If manager evaluated, show manager feedback */}
                      {isManagerEvaluated && (
                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-emerald-950">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              主管核定考核：{plan.managerScore} 分 ({plan.evaluatorName || '陳冠霖 經理'})
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              考核日期：{plan.evaluatedAt || '2026-08-31'}
                            </span>
                          </div>
                          <p className="text-emerald-900 italic line-clamp-2">
                            "{plan.managerFeedback || '目標明確，案場成效顯著，准予通過考核。'}"
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        {/* If not self evaluated yet, prominent self evaluation button */}
                        {!isSelfEvaluated && (
                          <button
                            onClick={() =>
                              setActiveSmartPlanModal({
                                enrollment: enr,
                                course,
                                plan,
                                initialMode: 'self_eval',
                              })
                            }
                            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                          >
                            <Award className="w-4 h-4 text-amber-300" />
                            📝 填寫實踐成效並自評送出
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setActiveSmartPlanModal({
                              enrollment: enr,
                              course,
                              plan,
                              initialMode: isSelfEvaluated ? 'view' : 'setup',
                            })
                          }
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {isSelfEvaluated ? '📋 檢視完整評鑑報告' : '✏️ 編輯 / 檢視 SMART 目標'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {smartCourseItems.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
                <Target className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">目前尚無要求 SMART 落地評鑑的課程</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  當您修習之專業技術或案主管核心課程設定了課後 SMART 實踐指標時，系統將自動在此為您啟動落地目標追蹤與指定自評考核。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: WAITLIST ================= */}
      {activeSubTab === 'waitlist' && (
        <div className="space-y-4">
          {waitlistList.map((enr) => (
            <div
              key={enr.id}
              className="bg-amber-50/40 rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                    候補中 · 第 {enr.waitlistRank} 順位
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{enr.batchName}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{enr.courseTitle}</h3>
                <p className="text-xs text-slate-500">
                  排隊報名時間：{enr.enrolledAt} · 若有正取學員請假或取消，系統將依順位自動發信遞補正取。
                </p>
              </div>

              <span className="text-xs text-amber-700 font-semibold bg-amber-100/70 px-3 py-1.5 rounded-xl self-end sm:self-center">
                排隊等待遞補中
              </span>
            </div>
          ))}

          {waitlistList.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">目前無任何候補排隊中的課程</h4>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: COMPLETED ================= */}
      {activeSubTab === 'completed' && (
        <div className="space-y-4">
          {completedList.map((enr) => {
            const course = internalCourses.find((c) => c.id === enr.courseId);
            const matchedPlan = smartActionPlans.find(
              (p) => p.enrollmentId === enr.id || (p.empNo === currentEmpNo && p.courseId === enr.courseId)
            );

            return (
              <div
                key={enr.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      已結業考核通過
                    </span>
                    <span className="text-xs text-slate-500">{enr.batchName}</span>
                    {matchedPlan && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                        SMART 實踐已登記
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{enr.courseTitle}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>結訓日期：{enr.completedAt || '2026-03-01'}</span>
                    <span>測驗成績：<strong className="text-slate-800">{enr.examScore || 90} 分</strong></span>
                    <span>獲得學分：<strong className="text-indigo-600">{course?.credits || 4} 點</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Assignment Button in Completed List */}
                  {course && (
                    <button
                      onClick={() => setActiveAssignmentCourse({ enrollment: enr, course })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                        enr.assignmentSubmission?.gradeStatus === 'graded'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : enr.assignmentSubmission
                          ? 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="檢視課後實務作業與批閱成果"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {enr.assignmentSubmission?.gradeStatus === 'graded'
                        ? `作業得分 ${enr.assignmentSubmission.gradeScore !== undefined ? `${enr.assignmentSubmission.gradeScore}分` : '通過'}`
                        : enr.assignmentSubmission
                        ? '作業審核中'
                        : '作業檔案'}
                    </button>
                  )}

                  {matchedPlan && (
                    <button
                      onClick={() =>
                        setActiveSmartPlanModal({
                          enrollment: enr,
                          course,
                          plan: matchedPlan,
                          initialMode: 'view',
                        })
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      實踐評鑑紀錄
                    </button>
                  )}
                  <button
                    onClick={() => setActiveCert({ enrollment: enr, course })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    檢視結業證書
                  </button>
                </div>
              </div>
            );
          })}

          {completedList.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">尚未有完訓紀錄</h4>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: CERTS ================= */}
      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedList.map((enr) => {
            const course = internalCourses.find((c) => c.id === enr.courseId);
            return (
              <div
                key={enr.id}
                onClick={() => setActiveCert({ enrollment: enr, course })}
                className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer space-y-3 group hover:border-amber-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {enr.certificateNumber || 'FG-CERT-2026-001'}
                  </span>
                  <Award className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{enr.courseTitle}</h4>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>發證日期: {enr.completedAt || '2026-03-01'}</span>
                  <span className="text-amber-600 font-bold group-hover:underline">點擊開立證書 →</span>
                </div>
              </div>
            );
          })}

          {completedList.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">目前證書夾尚無證書</h4>
            </div>
          )}
        </div>
      )}

      {/* Modals rendering */}
      {activeCheckInEnrollment && (
        <PhysicalCheckInModal
          enrollment={activeCheckInEnrollment}
          onClose={() => setActiveCheckInEnrollment(null)}
        />
      )}

      {activeOnlineCourse && (
        <OnlineClassroomModal
          enrollment={activeOnlineCourse.enrollment}
          course={activeOnlineCourse.course}
          onClose={() => setActiveOnlineCourse(null)}
        />
      )}

      {activeSmartPlanModal && (
        <SmartActionPlanModal
          enrollment={activeSmartPlanModal.enrollment}
          course={activeSmartPlanModal.course}
          plan={activeSmartPlanModal.plan}
          initialMode={activeSmartPlanModal.initialMode}
          onClose={() => setActiveSmartPlanModal(null)}
        />
      )}

      {activeCert && (
        <CertificateModal
          enrollment={activeCert.enrollment}
          course={activeCert.course}
          onClose={() => setActiveCert(null)}
        />
      )}

      {/* Assignment Submission Modal */}
      {activeAssignmentCourse && (
        <AssignmentSubmissionModal
          enrollment={activeAssignmentCourse.enrollment}
          course={activeAssignmentCourse.course}
          onClose={() => setActiveAssignmentCourse(null)}
        />
      )}

      {/* Assignment Grading Modal */}
      {activeGradingCourse && (
        <AssignmentGradingModal
          enrollment={activeGradingCourse.enrollment}
          course={activeGradingCourse.course}
          onClose={() => setActiveGradingCourse(null)}
        />
      )}
    </div>
  );
};
