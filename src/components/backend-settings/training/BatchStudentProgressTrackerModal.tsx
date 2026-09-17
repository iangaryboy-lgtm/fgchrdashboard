import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  FileText,
  Video,
  HelpCircle,
  Star,
  Target,
  Bell,
  Send,
  Download,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  ArrowUpDown,
  BookOpen,
  Sliders,
  UserPlus,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  InternalCourse,
  CourseBatch,
  CourseEnrollment,
  SmartActionPlan,
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import { SmartActionPlanModal } from '../../frontend/training/SmartActionPlanModal';
import { ForceEnrollStudentsModal } from './ForceEnrollStudentsModal';
import { EditStudentProgressModal } from './EditStudentProgressModal';

interface BatchStudentProgressTrackerModalProps {
  course: InternalCourse;
  batch: CourseBatch;
  onClose: () => void;
  onOpenClassroomSettings?: () => void;
}

export const BatchStudentProgressTrackerModal: React.FC<BatchStudentProgressTrackerModalProps> = ({
  course,
  batch,
  onClose,
  onOpenClassroomSettings,
}) => {
  const { courseEnrollments, smartActionPlans, employees, currentUser, deleteEnrollment } = useApp();

  // Force Enroll & Edit Student Modal states
  const [isForceEnrollModalOpen, setIsForceEnrollModalOpen] = useState(false);
  const [editingStudentEnrollment, setEditingStudentEnrollment] = useState<CourseEnrollment | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<CourseEnrollment | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'pending' | 'needs_reminder'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | 'pre_survey' | 'video' | 'exam' | 'post_survey' | 'smart_plan'>('all');

  // Reminders / Nudge States
  const [reminderModalTarget, setReminderModalTarget] = useState<CourseEnrollment[] | null>(null);
  const [reminderChannels, setReminderChannels] = useState<{ email: boolean; teams: boolean; push: boolean }>({
    email: true,
    teams: true,
    push: true,
  });
  const [reminderItems, setReminderItems] = useState<{
    pre_survey: boolean;
    video: boolean;
    exam: boolean;
    post_survey: boolean;
    smart_plan: boolean;
    manager_review: boolean;
  }>({
    pre_survey: true,
    video: true,
    exam: true,
    post_survey: true,
    smart_plan: true,
    manager_review: true,
  });
  const [reminderCustomNote, setReminderCustomNote] = useState('請同仁與主管配合於截止日前完成研習各項未達標要件與評定作業，以利核算教育訓練學分。');
  const [reminderSuccessToast, setReminderSuccessToast] = useState<string | null>(null);
  const [remindedEnrollmentIds, setRemindedEnrollmentIds] = useState<Record<string, string>>({});

  // Inspection Modal States (Viewing detailed answers)
  const [inspectedEnrollment, setInspectedEnrollment] = useState<CourseEnrollment | null>(null);
  const [inspectedDetailTab, setInspectedDetailTab] = useState<'pre_survey' | 'video' | 'exam' | 'post_survey' | 'smart_plan'>('pre_survey');
  const [activeSmartPlanModalTarget, setActiveSmartPlanModalTarget] = useState<{
    enrollment: CourseEnrollment;
    plan?: SmartActionPlan;
  } | null>(null);

  // Get all enrollments for this batch
  const batchEnrollments = useMemo(() => {
    return courseEnrollments.filter(
      (e) => e.batchId === batch.id && e.status !== 'cancelled'
    );
  }, [courseEnrollments, batch.id]);

  const regularStudents = useMemo(() => {
    return batchEnrollments.filter((e) => e.listType === 'regular' || e.listType === 'pending_approval');
  }, [batchEnrollments]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = regularStudents.length;
    if (total === 0) {
      return {
        total: 0,
        checkedInCount: 0,
        checkedInPercent: 0,
        preSurveyCompletedCount: 0,
        preSurveyPercent: 0,
        videoCompletedCount: 0,
        videoPercent: 0,
        examPassedCount: 0,
        examPassedPercent: 0,
        examAvgScore: 0,
        postSurveyCompletedCount: 0,
        postSurveyPercent: 0,
        postSurveyAvgRating: 0,
        smartPlanSubmittedCount: 0,
        smartPlanApprovedCount: 0,
        smartPlanPercent: 0,
        finalPassedCount: 0,
        finalPassedPercent: 0,
        needsReminderCount: 0,
      };
    }

    const checkedInCount = regularStudents.filter((e) => e.attendanceStatus === 'checked_in').length;
    const preSurveyCompletedCount = regularStudents.filter((e) => e.preSurveyCompleted).length;
    const videoCompletedCount = regularStudents.filter((e) => e.videoCompleted || (e.videoWatchPercent && e.videoWatchPercent >= 90)).length;
    
    const examPassedList = regularStudents.filter((e) => (e.examScore && e.examScore >= (course.passingScore || 70)) || e.examPassed);
    const examPassedCount = examPassedList.length;
    const examTotalScores = regularStudents.reduce((acc, curr) => acc + (curr.examScore || 0), 0);
    const examTakers = regularStudents.filter((e) => typeof e.examScore === 'number' && e.examScore > 0).length;
    const examAvgScore = examTakers > 0 ? Math.round(examTotalScores / examTakers) : 0;

    const postSurveyCompletedCount = regularStudents.filter((e) => e.postSurveyCompleted || e.surveyCompleted).length;
    const postSurveyTotalRating = regularStudents.reduce((acc, curr) => acc + (curr.postSurveyRating || 5), 0);
    const postSurveyAvgRating = postSurveyCompletedCount > 0 ? Number((postSurveyTotalRating / postSurveyCompletedCount).toFixed(1)) : 5.0;

    const smartPlanSubmittedCount = regularStudents.filter((e) => e.actionPlanSubmitted).length;
    const smartPlanApprovedCount = regularStudents.filter((e) => e.actionPlanApproved).length;

    const finalPassedCount = regularStudents.filter((e) => e.finalPassStatus === 'passed').length;
    const needsReminderCount = regularStudents.filter((e) => e.finalPassStatus !== 'passed').length;

    return {
      total,
      checkedInCount,
      checkedInPercent: Math.round((checkedInCount / total) * 100),
      preSurveyCompletedCount,
      preSurveyPercent: Math.round((preSurveyCompletedCount / total) * 100),
      videoCompletedCount,
      videoPercent: Math.round((videoCompletedCount / total) * 100),
      examPassedCount,
      examPassedPercent: Math.round((examPassedCount / total) * 100),
      examAvgScore,
      postSurveyCompletedCount,
      postSurveyPercent: Math.round((postSurveyCompletedCount / total) * 100),
      postSurveyAvgRating,
      smartPlanSubmittedCount,
      smartPlanApprovedCount,
      smartPlanPercent: Math.round((smartPlanSubmittedCount / total) * 100),
      finalPassedCount,
      finalPassedPercent: Math.round((finalPassedCount / total) * 100),
      needsReminderCount,
    };
  }, [regularStudents, course.passingScore]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return regularStudents.filter((enr) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = enr.empName?.toLowerCase().includes(term);
        const matchesNo = enr.empNo?.toLowerCase().includes(term);
        const matchesDept = enr.department?.toLowerCase().includes(term);
        const matchesTitle = enr.title?.toLowerCase().includes(term);
        if (!matchesName && !matchesNo && !matchesDept && !matchesTitle) return false;
      }

      // Status filter
      if (statusFilter === 'passed' && enr.finalPassStatus !== 'passed') return false;
      if (statusFilter === 'pending' && (enr.finalPassStatus === 'passed' || enr.finalPassStatus === 'failed')) return false;
      if (statusFilter === 'needs_reminder' && enr.finalPassStatus === 'passed') return false;

      // Stage filter
      if (stageFilter === 'pre_survey' && enr.preSurveyCompleted) return false;
      if (stageFilter === 'video' && (enr.videoCompleted || (enr.videoWatchPercent && enr.videoWatchPercent >= 90))) return false;
      if (stageFilter === 'exam' && (enr.examPassed || (enr.examScore && enr.examScore >= (course.passingScore || 70)))) return false;
      if (stageFilter === 'post_survey' && (enr.postSurveyCompleted || enr.surveyCompleted)) return false;
      if (stageFilter === 'smart_plan' && enr.actionPlanApproved) return false;

      return true;
    });
  }, [regularStudents, searchTerm, statusFilter, stageFilter, course.passingScore]);

  // Handle Send Reminders
  const handleSendReminder = (targets: CourseEnrollment[]) => {
    if (targets.length === 0) return;
    const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    const newReminded: Record<string, string> = { ...remindedEnrollmentIds };
    targets.forEach((t) => {
      newReminded[t.id] = `已於 ${nowStr} 發送催填`;
    });
    setRemindedEnrollmentIds(newReminded);

    const names = targets.map((t) => t.empName).join('、');
    setReminderSuccessToast(`已成功透過 Teams 及 Email 向【${targets.length} 位同仁 (${names})】發送填答與評定催繳通知！`);
    setReminderModalTarget(null);
    setTimeout(() => {
      setReminderSuccessToast(null);
    }, 4000);
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      '課程編號',
      '課程名稱',
      '開課梯次',
      '學員姓名',
      '學員工號',
      '所屬部室',
      '職稱職等',
      '報名時間',
      '簽到狀態',
      '簽到時間',
      '課前問卷狀態',
      '影音研習時數(分)',
      '影音防掛機狀態',
      '隨堂測驗分數',
      '隨堂測驗及格狀態',
      '課後滿意度調查',
      '滿意度評分(1-5星)',
      'SMART實踐計畫狀態',
      '主管考評狀態',
      '主管考評評分',
      '考評主管姓名',
      '最終完訓判定',
      '證書字號',
      '認證學分',
      '最後催填紀錄',
    ];

    const rows = regularStudents.map((enr) => {
      const plan = smartActionPlans.find(
        (p) => p.empNo === enr.empNo && (p.batchId === batch.id || p.courseId === course.id)
      );

      const passStatusLabel =
        enr.finalPassStatus === 'passed'
          ? '已達標完訓'
          : enr.finalPassStatus === 'failed'
          ? '未達標(不合格)'
          : '進行中(待評定)';

      const smartStatusLabel = plan
        ? plan.status === 'manager_evaluated'
          ? '主管已考評'
          : plan.status === 'self_evaluated'
          ? '學員已自評(待主管核決)'
          : '已填寫實踐目標'
        : enr.actionPlanSubmitted
        ? '已繳交'
        : '未填寫';

      const reminderInfo = remindedEnrollmentIds[enr.id] || '無催填紀錄';

      return [
        `"${course.courseCode || course.id}"`,
        `"${course.title.replace(/"/g, '""')}"`,
        `"${batch.batchName || batch.batchNo}"`,
        `"${enr.empName}"`,
        `"${enr.empNo}"`,
        `"${enr.department}"`,
        `"${enr.title} (${enr.rank || '06'})"`,
        `"${enr.enrolledAt}"`,
        `"${enr.attendanceStatus === 'checked_in' ? '已簽到出席' : '未報到'}"`,
        `"${enr.checkInTime || '-'}"`,
        `"${enr.preSurveyCompleted ? '已完成填答' : '未填寫'}"`,
        `"${enr.materialsReadDurationMinutes || Math.round((enr.videoWatchedSeconds || 0) / 60)}"`,
        `"${enr.videoCompleted ? '完訓達標(防掛機通過)' : '研習中'}"`,
        `"${enr.examScore ?? '-'}"`,
        `"${(enr.examScore && enr.examScore >= (course.passingScore || 70)) || enr.examPassed ? '及格通過' : '未達標'}"`,
        `"${enr.postSurveyCompleted || enr.surveyCompleted ? '已填寫' : '未填寫'}"`,
        `"${enr.postSurveyRating || 5} 星"`,
        `"${smartStatusLabel}"`,
        `"${enr.actionPlanApproved || plan?.status === 'manager_evaluated' ? '已核准' : '待考評'}"`,
        `"${plan?.managerScore ?? '-'}"`,
        `"${plan?.evaluatorName || enr.approverName || '-'}"`,
        `"${passStatusLabel}"`,
        `"${enr.certificateCode || enr.certificateNumber || '-'}"`,
        `"${course.credits || 2} 點"`,
        `"${reminderInfo}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `內部訓練學員研習歷程與填答總表_${course.title}_${batch.batchName || batch.batchNo}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* TOP HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded text-[10px] font-bold">
                研習歷程與填答總彙整
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[10px] font-bold">
                {batch.batchName || batch.batchNo}
              </span>
              <span className="text-xs text-slate-300">
                開課日期：{batch.startDate} ({batch.startTime}~{batch.endTime})
              </span>
            </div>
            <h2 className="text-base font-black text-white mt-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              【{course.title}】學員各階段執行狀況、詳細填答紀錄與催填總管
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenClassroomSettings && (
              <button
                onClick={onOpenClassroomSettings}
                className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-indigo-400/30"
              >
                <Sliders className="w-3.5 h-3.5" />
                研習教室設定
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOAST SUCCESS ALERT */}
        {reminderSuccessToast && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {reminderSuccessToast}
            </span>
            <button onClick={() => setReminderSuccessToast(null)} className="hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {/* AGGREGATE SUMMARY KPI CARDS */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
            
            {/* KPI 1: 參訓人數 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                正取/簽到
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.checkedInCount} <span className="text-xs font-normal text-slate-400">/ {stats.total} 人</span>
              </div>
              <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                出勤率 {stats.checkedInPercent}%
              </div>
            </div>

            {/* KPI 2: 課前問卷 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                1. 課前問卷
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.preSurveyCompletedCount} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
              </div>
              <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                填寫率 {stats.preSurveyPercent}%
              </div>
            </div>

            {/* KPI 3: 影音防掛機 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-cyan-600" />
                2. 影音研習
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.videoCompletedCount} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
              </div>
              <div className="text-[10px] text-cyan-600 font-bold mt-0.5">
                完看率 {stats.videoPercent}%
              </div>
            </div>

            {/* KPI 4: 隨堂測驗 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                3. 線上測驗
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.examPassedCount} <span className="text-xs font-normal text-slate-400">及格</span>
              </div>
              <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                均分 {stats.examAvgScore} 分 ({stats.examPassedPercent}%)
              </div>
            </div>

            {/* KPI 5: 課後滿意度 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-purple-600" />
                4. 課後滿意度
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.postSurveyCompletedCount} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
              </div>
              <div className="text-[10px] text-purple-600 font-bold mt-0.5">
                平均 {stats.postSurveyAvgRating} ★ ({stats.postSurveyPercent}%)
              </div>
            </div>

            {/* KPI 6: SMART 行動計畫 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-rose-600" />
                5. SMART 實踐
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {stats.smartPlanApprovedCount} <span className="text-xs font-normal text-slate-400">考評通過</span>
              </div>
              <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                繳交 {stats.smartPlanSubmittedCount} 份 ({stats.smartPlanPercent}%)
              </div>
            </div>

            {/* KPI 7: 總體達標完訓 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                總體達標完訓
              </div>
              <div className="text-lg font-black text-emerald-900 mt-0.5">
                {stats.finalPassedCount} <span className="text-xs font-normal text-emerald-600">/ {stats.total} 人</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                核發率 {stats.finalPassedPercent}%
              </div>
            </div>

          </div>
        </div>

        {/* TOOLBAR & ACTIONS */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="搜尋姓名、工號或部室..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:w-64 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="all">全部學員 ({regularStudents.length})</option>
              <option value="passed">已達標完訓 ({stats.finalPassedCount})</option>
              <option value="pending">進行中 / 待考評 ({stats.total - stats.finalPassedCount})</option>
              <option value="needs_reminder">需催填 / 未達標 ({stats.needsReminderCount})</option>
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="all">全部階段篩選</option>
              <option value="pre_survey">僅看未繳課前問卷</option>
              <option value="video">僅看未看滿影音</option>
              <option value="exam">僅看隨堂測驗未及格</option>
              <option value="post_survey">僅看未填課後滿意度</option>
              <option value="smart_plan">僅看未完成 SMART/考評</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsForceEnrollModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              後台強制置入學員 (多人條件篩選)
            </button>

            <button
              onClick={() => {
                const unpassed = regularStudents.filter((e) => e.finalPassStatus !== 'passed');
                setReminderModalTarget(unpassed.length > 0 ? unpassed : regularStudents);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              一鍵批量催填提醒 ({stats.needsReminderCount} 人需催填)
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              匯出總彙整報表 (Excel/CSV)
            </button>
          </div>
        </div>

        {/* Action notification toast */}
        {actionNotice && (
          <div className="mx-6 mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-100 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* MAIN TABLE: TRAINEE STAGE EXECUTION MATRIX */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3.5">學員資訊</th>
                  <th className="py-3 px-2 text-center">簽到狀態</th>
                  <th className="py-3 px-2 text-center">課前問卷</th>
                  <th className="py-3 px-2 text-center">影音研習 (防掛機)</th>
                  <th className="py-3 px-2 text-center">隨堂線上測驗</th>
                  <th className="py-3 px-2 text-center">課後滿意度</th>
                  <th className="py-3 px-2 text-center">SMART 行動計畫</th>
                  <th className="py-3 px-3 text-center">最終完訓判定</th>
                  <th className="py-3 px-3.5 text-right">催填與明細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((enr) => {
                  const plan = smartActionPlans.find(
                    (p) => p.empNo === enr.empNo && (p.batchId === batch.id || p.courseId === course.id)
                  );

                  const isPassed = enr.finalPassStatus === 'passed';
                  const reminderHistory = remindedEnrollmentIds[enr.id];

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Trainee Info */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                            {enr.empName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              {enr.empName}
                              <span className="text-[10px] font-mono text-slate-400">({enr.empNo})</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {enr.department} · {enr.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-2 text-center">
                        {enr.attendanceStatus === 'checked_in' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            已簽到 ({enr.checkInTime?.slice(11, 16) || '出席'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            未報到
                          </span>
                        )}
                      </td>

                      {/* Pre Survey */}
                      <td className="py-3 px-2 text-center">
                        {enr.preSurveyCompleted ? (
                          <button
                            onClick={() => {
                              setInspectedEnrollment(enr);
                              setInspectedDetailTab('pre_survey');
                            }}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px] transition-colors"
                            title="點選檢視學員課前問卷填答明細"
                          >
                            <Check className="w-3 h-3" />
                            已填寫
                            <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold">
                            未填寫
                          </span>
                        )}
                      </td>

                      {/* Video & Anti-cheating */}
                      <td className="py-3 px-2 text-center">
                        {enr.videoCompleted || (enr.videoWatchPercent && enr.videoWatchPercent >= 90) ? (
                          <button
                            onClick={() => {
                              setInspectedEnrollment(enr);
                              setInspectedDetailTab('video');
                            }}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-md font-bold text-[10px] transition-colors"
                            title="檢視影音防掛機觀看紀錄"
                          >
                            <ShieldCheck className="w-3 h-3 text-cyan-600" />
                            100% 完看
                            <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                            {enr.videoWatchPercent || 0}% 觀看中
                          </span>
                        )}
                      </td>

                      {/* Exam */}
                      <td className="py-3 px-2 text-center">
                        {typeof enr.examScore === 'number' ? (
                          <button
                            onClick={() => {
                              setInspectedEnrollment(enr);
                              setInspectedDetailTab('exam');
                            }}
                            className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors border ${
                              enr.examScore >= (course.passingScore || 70)
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            }`}
                            title="點選檢視測驗答題明細與題目解析"
                          >
                            <span>{enr.examScore} 分</span>
                            <span>{enr.examScore >= (course.passingScore || 70) ? '(及格)' : '(不及格)'}</span>
                            <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            未測驗
                          </span>
                        )}
                      </td>

                      {/* Post Survey */}
                      <td className="py-3 px-2 text-center">
                        {enr.postSurveyCompleted || enr.surveyCompleted ? (
                          <button
                            onClick={() => {
                              setInspectedEnrollment(enr);
                              setInspectedDetailTab('post_survey');
                            }}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-bold text-[10px] transition-colors"
                            title="點選檢視滿意度調查回饋"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {enr.postSurveyRating || 5} ★
                            <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            未填寫
                          </span>
                        )}
                      </td>

                      {/* SMART Action Plan */}
                      <td className="py-3 px-2 text-center">
                        {plan || enr.actionPlanSubmitted ? (
                          <button
                            onClick={() => {
                              if (plan) {
                                setActiveSmartPlanModalTarget({ enrollment: enr, plan });
                              } else {
                                setInspectedEnrollment(enr);
                                setInspectedDetailTab('smart_plan');
                              }
                            }}
                            className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors border ${
                              plan?.status === 'manager_evaluated' || enr.actionPlanApproved
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                : plan?.status === 'self_evaluated'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                            title="點選開啟 SMART 表單與主管考評"
                          >
                            <Target className="w-3 h-3" />
                            {plan?.status === 'manager_evaluated' || enr.actionPlanApproved
                              ? `已考評 (${plan?.managerScore || 95}分)`
                              : plan?.status === 'self_evaluated'
                              ? '待主管考評'
                              : '已繳交目標'}
                            <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                            尚未填寫
                          </span>
                        )}
                      </td>

                      {/* Final Pass Status */}
                      <td className="py-3 px-3 text-center">
                        {isPassed ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                              <Award className="w-3 h-3 text-emerald-600" />
                              已達標完訓
                            </span>
                            <span className="text-[9px] text-emerald-600 font-mono mt-0.5">
                              {enr.certificateCode || 'FG-CERT-2026'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                              待達標
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {!enr.actionPlanSubmitted ? '待交SMART' : !enr.actionPlanApproved ? '待主管考評' : '待結算'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions & Reminders */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInspectedEnrollment(enr);
                              setInspectedDetailTab('pre_survey');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="查看全階段填答紀錄"
                          >
                            <Eye className="w-3 h-3" />
                            檢視填答
                          </button>

                          {!isPassed && (
                            <button
                              onClick={() => setReminderModalTarget([enr])}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                              title="發送催填提醒"
                            >
                              <Bell className="w-3 h-3" />
                              催填
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingStudentEnrollment(enr)}
                            className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="修改學員進度、分數與狀態"
                          >
                            <Edit3 className="w-3 h-3" />
                            修改
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget(enr)}
                            className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="移除此學員名額"
                          >
                            <Trash2 className="w-3 h-3" />
                            移除
                          </button>
                        </div>
                        {reminderHistory && (
                          <div className="text-[9px] text-emerald-600 mt-0.5">
                            {reminderHistory}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              總正取學員：<strong>{regularStudents.length} 人</strong>
            </span>
            <span>
              已完訓核發學分：<strong className="text-emerald-600">{stats.finalPassedCount} 人 ({stats.finalPassedPercent}%)</strong>
            </span>
            <span>
              待落實/催填中：<strong className="text-amber-600">{stats.needsReminderCount} 人</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            關閉總表
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL 1: BATCH / INDIVIDUAL REMINDER (催填作業視窗) */}
      {/* ========================================================================= */}
      {reminderModalTarget && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                研習進度催填作業 ({reminderModalTarget.length} 位同仁)
              </h3>
              <button
                onClick={() => setReminderModalTarget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Target names */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">催填發送對象：</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-24 overflow-y-auto flex flex-wrap gap-1.5">
                  {reminderModalTarget.map((t) => (
                    <span key={t.id} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[11px]">
                      {t.empName} ({t.empNo} · {t.department})
                    </span>
                  ))}
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">發送提醒管道：</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderChannels.teams}
                      onChange={(e) => setReminderChannels((p) => ({ ...p, teams: e.target.checked }))}
                      className="rounded text-indigo-600"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-medium text-slate-800">Teams 機器人</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderChannels.email}
                      onChange={(e) => setReminderChannels((p) => ({ ...p, email: e.target.checked }))}
                      className="rounded text-blue-600"
                    />
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium text-slate-800">Outlook Email</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderChannels.push}
                      onChange={(e) => setReminderChannels((p) => ({ ...p, push: e.target.checked }))}
                      className="rounded text-amber-600"
                    />
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-medium text-slate-800">系統即時推播</span>
                  </label>
                </div>
              </div>

              {/* Reminder Items */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">催填勾選要件：</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderItems.pre_survey}
                      onChange={(e) => setReminderItems((p) => ({ ...p, pre_survey: e.target.checked }))}
                      className="rounded text-indigo-600"
                    />
                    <span>課前需求問卷 (MS Forms)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderItems.video}
                      onChange={(e) => setReminderItems((p) => ({ ...p, video: e.target.checked }))}
                      className="rounded text-cyan-600"
                    />
                    <span>影音研習時數與防掛機驗證</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderItems.exam}
                      onChange={(e) => setReminderItems((p) => ({ ...p, exam: e.target.checked }))}
                      className="rounded text-amber-600"
                    />
                    <span>隨堂線上測驗及格標準</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderItems.post_survey}
                      onChange={(e) => setReminderItems((p) => ({ ...p, post_survey: e.target.checked }))}
                      className="rounded text-purple-600"
                    />
                    <span>課後滿意度調查回饋</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={reminderItems.smart_plan}
                      onChange={(e) => setReminderItems((p) => ({ ...p, smart_plan: e.target.checked }))}
                      className="rounded text-rose-600"
                    />
                    <span>SMART 行動計畫繳交 / 提醒主管進行現場考評</span>
                  </label>
                </div>
              </div>

              {/* Custom message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">通知內容備註：</label>
                <textarea
                  value={reminderCustomNote}
                  onChange={(e) => setReminderCustomNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setReminderModalTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium"
              >
                取消
              </button>
              <button
                onClick={() => handleSendReminder(reminderModalTarget)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                立即發送催填通知
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 2: DETAILED ANSWER INSPECTOR MODAL (詳細填答紀錄檢視) */}
      {/* ========================================================================= */}
      {inspectedEnrollment && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded text-[10px] font-bold">
                    學員詳細填答紀錄
                  </span>
                  <span className="text-xs text-slate-300">
                    {course.title}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  {inspectedEnrollment.empName} ({inspectedEnrollment.empNo}) · {inspectedEnrollment.department} {inspectedEnrollment.title}
                </h3>
              </div>

              <button
                onClick={() => setInspectedEnrollment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setInspectedDetailTab('pre_survey')}
                className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
                  inspectedDetailTab === 'pre_survey'
                    ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                1. 課前問卷填答
              </button>

              <button
                onClick={() => setInspectedDetailTab('video')}
                className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
                  inspectedDetailTab === 'video'
                    ? 'bg-white text-cyan-700 border-cyan-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                2. 影音與防掛機
              </button>

              <button
                onClick={() => setInspectedDetailTab('exam')}
                className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
                  inspectedDetailTab === 'exam'
                    ? 'bg-white text-amber-700 border-amber-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                3. 隨堂測驗考卷
              </button>

              <button
                onClick={() => setInspectedDetailTab('post_survey')}
                className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
                  inspectedDetailTab === 'post_survey'
                    ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                4. 課後滿意度
              </button>

              <button
                onClick={() => setInspectedDetailTab('smart_plan')}
                className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
                  inspectedDetailTab === 'smart_plan'
                    ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                5. SMART 行動計畫
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              
              {/* DETAIL 1: PRE SURVEY */}
              {inspectedDetailTab === 'pre_survey' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-indigo-900">課前需求調查問卷填答紀錄</span>
                      <p className="text-slate-500 mt-0.5">填答送出時間：{inspectedEnrollment.enrolledAt} · 狀態：{inspectedEnrollment.preSurveyCompleted ? '已完成' : '未完成'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px]">
                      MS Forms 整合
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        Q1. 您過去在工程排程與要徑管理方面之實務經驗程度為何？
                      </div>
                      <div className="p-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        【學員填答】：熟練 (經常負責專案排程與要徑追蹤)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        Q2. 您對本堂內部訓練課程最期待學習獲得的技能為？
                      </div>
                      <div className="p-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        【學員填答】：進度網圖要徑計算與寬裕時間分析、BIM 4D 施工模擬與界面碰撞排除
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        Q3. 您對目前所屬工務所之進度控制流程滿意程度 (1~5星)：
                      </div>
                      <div className="p-2 bg-white border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        【學員評分】：4 星 (良好)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        Q4. 您在現場施工進度管控上曾遭遇最棘手之問題為何？（開放簡答）
                      </div>
                      <div className="p-3 bg-white border border-indigo-100 rounded-lg text-xs text-slate-700 leading-relaxed italic">
                        「主要在於分包商工班出工人數與預排要徑落差大，導致連續壁與支撐開挖節點產生衝突，希望能多學習實際因應契約與滾動調整策略。」
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL 2: VIDEO & ANTI-CHEATING */}
              {inspectedDetailTab === 'video' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-cyan-900">影音研習與專注力防掛機查核總覽</span>
                      <p className="text-slate-500 mt-0.5">防掛機彈窗間隔：每 60 秒 · 逾時中斷：20 秒</p>
                    </div>
                    <span className="px-2.5 py-1 bg-cyan-600 text-white rounded-lg font-bold text-[11px]">
                      防弊防掛機通過
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xs text-slate-500 font-bold">累積觀看秒數</div>
                      <div className="text-xl font-black text-cyan-800 mt-1">
                        {inspectedEnrollment.videoWatchedSeconds || 580} 秒
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">要求門檻：180 秒</div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xs text-slate-500 font-bold">專注力彈窗驗證次數</div>
                      <div className="text-xl font-black text-emerald-600 mt-1">3 / 3 次</div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">零逾時違規</div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xs text-slate-500 font-bold">完看進度率</div>
                      <div className="text-xl font-black text-indigo-600 mt-1">100%</div>
                      <div className="text-[10px] text-indigo-600 mt-0.5">狀態：達標</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-800">防掛機即時驗證紀錄明細表：</div>
                    <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                        <span>第 1 次驗證 (觀看第 01:00)</span>
                        <span className="text-emerald-600 font-bold">✓ 3.2 秒內點擊響應 (通過)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                        <span>第 2 次驗證 (觀看第 02:00)</span>
                        <span className="text-emerald-600 font-bold">✓ 2.8 秒內點擊響應 (通過)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                        <span>第 3 次驗證 (觀看第 03:00)</span>
                        <span className="text-emerald-600 font-bold">✓ 4.1 秒內點擊響應 (通過)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL 3: EXAM */}
              {inspectedDetailTab === 'exam' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-900">隨堂線上測驗作答明細</span>
                      <p className="text-slate-500 mt-0.5">
                        測驗成績：<strong className="text-amber-800">{inspectedEnrollment.examScore || 90} 分</strong> · 及格門檻：{course.passingScore || 70} 分
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px]">
                      {(inspectedEnrollment.examScore || 90) >= (course.passingScore || 70) ? '及格通過' : '未達標'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Q1. 超高層深開挖工程中，關鍵要徑（Critical Path）之總寬裕時間（Total Float）為何？</span>
                        <span className="text-emerald-600 font-bold">得分：25/25 分</span>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        【學員答案】：等於 0 (正解)
                      </div>
                      <div className="text-[11px] text-indigo-700 bg-indigo-50/60 p-2 rounded-lg">
                        💡 <strong>解析：</strong>要徑上的作業活動因無任何寬裕時間，其延誤將直接導致整個工期展延。
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Q2. 當逆打鋼柱沉設精度垂直度超過容許標準時，最應優先採取之糾正措施為？</span>
                        <span className="text-emerald-600 font-bold">得分：25/25 分</span>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        【學員答案】：於灌漿初凝前以雙向雷射經緯儀調整校正微調螺栓 (正解)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Q3. 連續壁公母單元交接處發生滲水砂湧現象時之緊急止水灌漿處置原則：</span>
                        <span className="text-emerald-600 font-bold">得分：25/25 分</span>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        【學員答案】：壁體背面低壓化學灌漿結合正面導水管減壓引流 (正解)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Q4. 深基坑鄰近建物之傾斜儀警戒值通常設定為：</span>
                        <span className="text-emerald-600 font-bold">得分：15/25 分</span>
                      </div>
                      <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold flex items-center gap-2">
                        <span>【學員答案】：1/500 (正解：1/750 警戒，1/500 行動值)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL 4: POST SURVEY */}
              {inspectedDetailTab === 'post_survey' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-purple-900">課後滿意度調查問卷回饋</span>
                      <p className="text-slate-500 mt-0.5">
                        整體滿意度評分：<strong className="text-amber-500 font-black">{inspectedEnrollment.postSurveyRating || 5} ★</strong>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-[11px]">
                      滿意度 5.0 滿分
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        1. 本課程教材內容之實用性與案例深度評分：
                      </div>
                      <div className="p-2 bg-white border border-purple-100 rounded-lg text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        非常滿意 (5 星)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        2. 講師之專業表達能力與現場實務解說清晰度：
                      </div>
                      <div className="p-2 bg-white border border-purple-100 rounded-lg text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        非常滿意 (5 星)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        3. 研習教室設備、線上防弊系統與行政安排滿意度：
                      </div>
                      <div className="p-2 bg-white border border-purple-100 rounded-lg text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        非常滿意 (5 星)
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-slate-800">
                        4. 您對本課程或未來進階培訓有何寶貴建議？（質化回饋）
                      </div>
                      <div className="p-3 bg-white border border-purple-100 rounded-lg text-xs text-slate-700 leading-relaxed italic">
                        「講師分享之逆打鋼柱沉設精度微調案例非常震撼且受用，建議後續可增加一堂現場 3D BIM 碰撞演練工作坊！」
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL 5: SMART ACTION PLAN */}
              {inspectedDetailTab === 'smart_plan' && (
                <div className="space-y-4">
                  {(() => {
                    const plan = smartActionPlans.find(
                      (p) => p.empNo === inspectedEnrollment.empNo && (p.batchId === batch.id || p.courseId === course.id)
                    );

                    if (!plan && !inspectedEnrollment.actionPlanSubmitted) {
                      return (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">該同仁尚未送出 SMART 行動實踐計畫</p>
                          <p className="text-[11px] text-slate-400 mt-1">可點擊「催填提醒」通知同仁盡速登入設定落實目標</p>
                          <button
                            onClick={() => {
                              setInspectedEnrollment(null);
                              setReminderModalTarget([inspectedEnrollment]);
                            }}
                            className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            立即發送 SMART 催填通知
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-rose-900">SMART 行動實踐計畫內容與主管考評</span>
                            <p className="text-slate-500 mt-0.5">
                              落實天數：60 天 · 審核層級：直屬案主管 (工務所長/副所長)
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (plan) {
                                setActiveSmartPlanModalTarget({ enrollment: inspectedEnrollment, plan });
                              }
                            }}
                            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-rose-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            開啟完整表單視窗
                          </button>
                        </div>

                        {/* S-M-A-R-T 5 pillars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-xs text-blue-700 flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">S</span>
                              明確具體目標 (Specific)
                            </div>
                            <div className="text-xs text-slate-700 leading-relaxed">
                              {plan?.specificGoal || '於新北 HM6 案場全面導入 24 小時連續壁側向變位自動化電子水準儀與傾斜儀。'}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">M</span>
                              量化評估指標 (Measurable)
                            </div>
                            <div className="text-xs text-slate-700 leading-relaxed">
                              {plan?.measurableMetric || '即時監測數據傳輸率達 99.5%，若位移達警戒值 (15mm) 自動發出 Line 與 SMS 警報。'}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-xs text-purple-700 flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">A</span>
                              可達成之行動方案 (Achievable)
                            </div>
                            <div className="text-xs text-slate-700 leading-relaxed">
                              {plan?.achievableAction || '已與監測儀器包商完成介面整合，預計於開挖前 14 天完成系統校正。'}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-xs text-amber-700 flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">R</span>
                              工程關聯效益 (Relevant)
                            </div>
                            <div className="text-xs text-slate-700 leading-relaxed">
                              {plan?.relevantReason || '控制基坑安全，杜絕鄰房沈陷，保障建案如期如質零災害。'}
                            </div>
                          </div>
                        </div>

                        {/* Manager Evaluation card */}
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-emerald-600" />
                              直屬主管現場落實成效考評
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-xs">
                              考評得分：{plan?.managerScore || 95} 分 (特優)
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100">
                            <strong>【考評主管評語】({plan?.evaluatorName || '陳冠霖 經理'})：</strong>
                            <p className="mt-1 leading-relaxed">
                              {plan?.managerFeedback || '林組長規劃非常具體可行，切中超高層案場核心風險，實踐成果顯著，值得各案場推廣複製！'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                學員工號：<strong>{inspectedEnrollment.empNo}</strong> · 報名時間：{inspectedEnrollment.enrolledAt}
              </span>
              <button
                onClick={() => setInspectedEnrollment(null)}
                className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                返回學員總表
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 3: FULL SMART ACTION PLAN MODAL (完整 SMART 互動表單) */}
      {/* ========================================================================= */}
      {activeSmartPlanModalTarget && (
        <SmartActionPlanModal
          enrollment={activeSmartPlanModalTarget.enrollment}
          course={course}
          plan={activeSmartPlanModalTarget.plan}
          initialMode="view"
          onClose={() => setActiveSmartPlanModalTarget(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 4: FORCE ENROLL STUDENTS (後台強制置入學員 - 多人條件篩選) */}
      {/* ========================================================================= */}
      {isForceEnrollModalOpen && (
        <ForceEnrollStudentsModal
          course={course}
          batch={batch}
          isOpen={isForceEnrollModalOpen}
          onClose={() => setIsForceEnrollModalOpen(false)}
          onSuccess={() => {
            setActionNotice('已成功將選定之同仁強制置入本梯次研習名冊！');
            setTimeout(() => setActionNotice(null), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 5: EDIT STUDENT PROGRESS (修改學員進度與考評判定) */}
      {/* ========================================================================= */}
      {editingStudentEnrollment && (
        <EditStudentProgressModal
          enrollment={editingStudentEnrollment}
          isOpen={!!editingStudentEnrollment}
          onClose={() => setEditingStudentEnrollment(null)}
          onSuccess={() => {
            const displayName = editingStudentEnrollment.empName || (editingStudentEnrollment as any).employeeName || editingStudentEnrollment.empNo;
            setActionNotice(`學員【${displayName}】之各項研習進度已成功修改並儲存！`);
            setTimeout(() => setActionNotice(null), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 6: DELETE ENROLLMENT CONFIRMATION (刪除/移除學員名額確認) */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  確認自本梯次名冊中移除學員？
                </h4>
                <p className="text-xs text-slate-500">
                  即將移除學員【<strong>{deleteConfirmTarget.empName || (deleteConfirmTarget as any).employeeName || deleteConfirmTarget.empNo}</strong> ({deleteConfirmTarget.empNo || (deleteConfirmTarget as any).employeeNo})】，該學員所屬單位為「{deleteConfirmTarget.department}」。
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs text-left mt-2">
                  ⚠️ 移除後該員將不再列入本梯次名冊與考評名單中。如需重新排入，管理員隨時可使用「後台強制置入學員」再次加回。
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  取消保留
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = deleteEnrollment(deleteConfirmTarget.id);
                    setDeleteConfirmTarget(null);
                    setActionNotice(res.message);
                    setTimeout(() => setActionNotice(null), 4000);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  確認移除名額
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
