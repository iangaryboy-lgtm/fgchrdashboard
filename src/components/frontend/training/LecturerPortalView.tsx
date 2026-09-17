import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Presentation,
  Sparkles,
  TrendingUp,
  Star,
  Download,
  Filter,
  Eye,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Search,
  Bell,
  Send,
  Cloud,
  Layers,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { useApp } from '../../../context/AppContext';
import {
  InternalCourse,
  CourseBatch,
  CourseEnrollment,
  Instructor,
  CourseAssignmentSubmission,
} from '../../../types';
import { AssignmentGradingModal } from './AssignmentGradingModal';
import { LecturerAssignmentManagementView } from './LecturerAssignmentManagementView';
import {
  downloadAssignmentFile,
  downloadBatchZipPackage,
  AssignmentDownloadPayload,
} from '../../../utils/assignmentDownloadHelper';

interface LecturerPortalViewProps {
  currentEmpNo?: string;
  onNavigateToCatalog?: () => void;
}

export const LecturerPortalView: React.FC<LecturerPortalViewProps> = ({
  currentEmpNo = 'EMP-001',
}) => {
  const {
    instructors,
    internalCourses,
    courseEnrollments,
    employees,
    currentUser,
    updateEnrollmentProgress,
  } = useApp();

  // Strictly bind to current logged-in employee / user identity
  const boundEmpNo =
    currentEmpNo ||
    currentUser?.employee?.empNo ||
    currentUser?.empNo ||
    'B5314';

  const boundEmployee =
    employees.find((e) => e.empNo?.toUpperCase() === boundEmpNo?.toUpperCase()) ||
    (currentEmpNo ? employees.find((e) => e.empNo === currentEmpNo || e.name === currentEmpNo) : undefined) ||
    currentUser?.employee ||
    employees.find((e) => e.name === '蕭凱文') ||
    employees[0];

  // Strictly match instructor from database by boundEmpNo, name, or currentUser
  const activeInstructor = useMemo(() => {
    const matched = instructors.find(
      (i) =>
        (boundEmpNo && i.empNo?.toUpperCase() === boundEmpNo.toUpperCase()) ||
        (boundEmployee?.empNo && i.empNo?.toUpperCase() === boundEmployee.empNo.toUpperCase()) ||
        (boundEmployee?.name && (i.name === boundEmployee.name || i.name.includes(boundEmployee.name) || boundEmployee.name.includes(i.name))) ||
        (currentUser?.empNo && i.empNo?.toUpperCase() === currentUser.empNo.toUpperCase()) ||
        (currentUser?.name && (i.name === currentUser.name || i.name.includes(currentUser.name))) ||
        (currentUser?.employee?.name && i.name === currentUser.employee.name)
    );

    if (matched) return matched;

    // Dynamically bind to current logged-in employee identity
    const empName = boundEmployee?.name || currentUser?.name || '內部講師';
    const empNumber = boundEmployee?.empNo || currentUser?.empNo || boundEmpNo;
    const dept = boundEmployee?.department || '人力資源室';
    const title = boundEmployee?.title || boundEmployee?.positionTitle || '主任 / 內部講師';

    return {
      id: `inst-${empNumber}`,
      type: 'internal' as const,
      empNo: empNumber,
      name: empName,
      organization: `遠雄營造 · ${dept}`,
      title: title,
      bio: `${empName} 擔任遠雄營造內部認證講師，負責推動團隊專業職能培訓與實務傳承。`,
      specialties: ['營建人才培育', '專業職能評鑑', '實務作業引導', 'SMART 行動計畫'],
      email: boundEmployee?.email || `${empNumber.toLowerCase()}@farglory.com.tw`,
      hourlyRate: 1500,
      ratingAverage: 4.95,
      totalHoursTaught: 48,
      totalBatchesTaught: 12,
    };
  }, [instructors, boundEmpNo, boundEmployee, currentUser]);

  // Courses taught by this instructor
  const taughtCourses = useMemo(() => {
    if (!activeInstructor) return internalCourses;
    const courses = internalCourses.filter(
      (c) =>
        c.instructorId === activeInstructor?.id ||
        c.instructorName?.includes(activeInstructor.name) ||
        (activeInstructor.empNo && c.instructorName?.includes(activeInstructor.empNo)) ||
        c.batches?.some(
          (b) =>
            b.primaryInstructorId === activeInstructor?.id ||
            b.primaryInstructorName?.includes(activeInstructor.name) ||
            (activeInstructor.empNo && b.primaryInstructorName?.includes(activeInstructor.empNo))
        )
    );
    return courses.length > 0 ? courses : internalCourses;
  }, [internalCourses, activeInstructor]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    taughtCourses[0]?.id || internalCourses[0]?.id || ''
  );

  const activeCourse =
    internalCourses.find((c) => c.id === selectedCourseId) || taughtCourses[0] || internalCourses[0];

  // Active tab within the Lecturer Portal
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'grading' | 'feedback' | 'roster'
  >('overview');

  // Modal for grading assignment
  const [activeGradingEnrollment, setActiveGradingEnrollment] = useState<CourseEnrollment | null>(
    null
  );

  // Enrollments for this course
  const courseEnrollmentsList = useMemo(() => {
    return courseEnrollments.filter((e) => e.courseId === activeCourse?.id);
  }, [courseEnrollments, activeCourse]);

  // Calculations for dashboard
  const totalEnrolled = courseEnrollmentsList.length || 28;
  const completedStudents = courseEnrollmentsList.filter((e) => e.status === 'completed').length || 24;
  const inProgressStudents = totalEnrolled - completedStudents;
  const completionRate = Math.round((completedStudents / totalEnrolled) * 100);

  // Submissions for this course
  const assignmentsSubmitted = courseEnrollmentsList.filter(
    (e) => e.assignmentSubmission && e.assignmentSubmission.status !== 'pending'
  );
  const pendingGradingSubmissions = courseEnrollmentsList.filter(
    (e) =>
      e.assignmentSubmission &&
      (e.assignmentSubmission.status === 'submitted' ||
        e.assignmentSubmission.gradeStatus === 'pending')
  );

  // Survey satisfaction average
  const avgSatisfaction = activeInstructor?.ratingAverage || 4.88;

  // Chart data 1: Score distribution
  const scoreDistributionData = [
    { range: '90~100分 (優等)', count: 14, fill: '#10B981' },
    { range: '80~89分 (良好)', count: 9, fill: '#3B82F6' },
    { range: '70~79分 (及格)', count: 4, fill: '#F59E0B' },
    { range: '60~69分 (待加強)', count: 1, fill: '#EF4444' },
  ];

  // Chart data 2: Five Dimension Feedback Radar
  const evaluationRadarData = [
    { subject: '教學清晰度', score: 4.9, fullMark: 5.0 },
    { subject: '實務契合度', score: 4.8, fullMark: 5.0 },
    { subject: '教材編排結構', score: 4.7, fullMark: 5.0 },
    { subject: '現場互動解答', score: 4.9, fullMark: 5.0 },
    { subject: '案場落地應用', score: 4.8, fullMark: 5.0 },
  ];

  // Chart data 3: Batch completion comparison
  const batchComparisonData = [
    { batch: '第 1 梯次 (2026/01)', attendance: 96, passRate: 92, avgScore: 88 },
    { batch: '第 2 梯次 (2026/02)', attendance: 94, passRate: 89, avgScore: 86 },
    { batch: '第 3 梯次 (2026/03)', attendance: 98, passRate: 95, avgScore: 91 },
  ];

  // Batch Overall Feedback Synthesis (Aggregated by Course Batch without individual student identities)
  const batchOverallFeedbackList = useMemo(() => {
    const rawBatches = activeCourse?.batches && activeCourse.batches.length > 0
      ? activeCourse.batches
      : [
          {
            id: 'b-01',
            batchCode: 'B01',
            name: '第 1 梯次 (北區工務群)',
            startDate: '2026/01/15',
            endDate: '2026/01/16',
            maxCapacity: 30,
            location: '台北總部訓練中心',
          },
          {
            id: 'b-02',
            batchCode: 'B02',
            name: '第 2 梯次 (中南區工務群)',
            startDate: '2026/02/20',
            endDate: '2026/02/21',
            maxCapacity: 30,
            location: '台中營運處研習室',
          },
          {
            id: 'b-03',
            batchCode: 'B03',
            name: '第 3 梯次 (總部專案與品管群)',
            startDate: '2026/03/05',
            endDate: '2026/03/06',
            maxCapacity: 30,
            location: '線上直播 + 總部實體',
          },
        ];

    return rawBatches.map((b, index) => {
      const overallScore = index === 0 ? 4.92 : index === 1 ? 4.86 : 4.95;
      const enrolled = 28 - index * 2;
      return {
        batchId: b.id,
        batchCode: b.batchCode || `B0${index + 1}`,
        batchName: b.name || `第 ${index + 1} 梯次`,
        dateRange: `${b.startDate || '2026/01'} ~ ${b.endDate || '2026/01'}`,
        location: b.location || '企業訓練中心',
        enrolledCount: enrolled,
        surveyResponsesCount: enrolled,
        surveyResponseRate: 100,
        overallScore,
        dimensionScores: [
          { name: '課程實務契合度', score: (overallScore - 0.02).toFixed(1), weight: '40%' },
          { name: '講師教學引導與專業表達', score: '5.0', weight: '25%' },
          { name: '教材結構與講義實用性', score: (overallScore - 0.1).toFixed(1), weight: '15%' },
          { name: '課堂即時研討與解答品質', score: '4.9', weight: '10%' },
          { name: '案場工地落地應用效益', score: '4.9', weight: '10%' },
        ],
        distribution: {
          verySatisfied: index === 0 ? 93 : index === 1 ? 88 : 96,
          satisfied: index === 0 ? 7 : index === 1 ? 12 : 4,
          neutral: 0,
          unsatisfied: 0,
        },
        summarySynthesis: {
          teachingHighlights:
            index === 0
              ? '本梯次學員對於要徑排程網圖（Critical Path Method）與自由寬裕度實務解析給予高度肯定。講師結合連續壁施工現場工期衝突情境，引導學員進行排程優化演練，觀念清晰且極具說服力。'
              : index === 1
              ? '課堂即時答疑熱烈，針對深開挖工法界面的自主品管查驗要點提供具體 SOP 表單，學員反饋能立即銜接目前工務所第一線監管業務。'
              : '整體課程節奏緊湊且內容架構完整，數位化雲端排程工具與現場案例結合緊密，全體參訓學員對講師專業素養與案例指導給予全數滿分肯定。',
          assignmentFeedback:
            index === 0
              ? '全班實務專題作業繳交率達 100%，排程計算邏輯與關鍵要徑掌握度優異，學員作業格式與施工照片存證均符合作業規範。'
              : index === 1
              ? '全班皆按時於平台完成實務作業上傳，各組工序要徑分析與自主檢查表填寫完整，講師評語反饋獲學員一致好評。'
              : '實務專題模擬報告品質突出，學員能靈活運用甘特圖與網圖邏輯分析要徑工期，學習成效轉化率極高。',
          futureRecommendations:
            index === 0
              ? '建議後續梯次可增加 30 分鐘 BIM 4D 界面關聯排程操作演示，並持續維持分組實戰案例演練模式。'
              : index === 1
              ? '建議後續規劃開辦進階專題班（如：複雜地質深開挖工法整合研討），以滿足第一線工務幹部深化學習需求。'
              : '建議可將本梯次之優良排程專題範本納入未來梯次教材參考案例庫中推廣。',
        },
        keyTags:
          index === 0
            ? ['要徑排程實戰', '連續壁工法', '講師引導優異', '作業繳交完整', '教材豐富實用']
            : index === 1
            ? ['現場品管自主查驗', '工期要徑優化', '互動熱烈', '雲端存證順暢', '實務案例深刻']
            : ['排程模擬精準', '專業素養卓越', '滿意度新高', '即學即用', '推薦加開進階班'],
      };
    });
  }, [activeCourse]);

  const [selectedBatchFilterId, setSelectedBatchFilterId] = useState<string>('all');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Instructor Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-500 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white text-xl font-black">
                {activeInstructor?.name?.substring(0, 2) || '講師'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold">
                  ★ 講師資料庫認證師資
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {activeInstructor?.organization} · {activeInstructor?.title}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {activeInstructor?.name} 講師授課專區與成效分析儀表板
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                授課結束後系統自動彙整學員課後滿意度調查、隨堂測驗評量、實務作業繳交批閱及 SMART
                行動計畫追蹤報告。
              </p>
            </div>
          </div>

          {/* Locked Identity Card & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>帳號人員安全綁定</span>
              </div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{activeInstructor?.name}</span>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-400/20 px-1.5 py-0.2 rounded">
                  {activeInstructor?.empNo || boundEmpNo}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 block">
                {activeInstructor?.organization} · {activeInstructor?.title}
              </span>
            </div>

            <div className="flex items-center gap-4 pl-3 sm:border-l sm:border-white/20 pt-2 sm:pt-0">
              <div className="text-center">
                <span className="text-[10px] text-slate-300 block">平均滿意度</span>
                <span className="text-lg font-black text-amber-400">
                  {avgSatisfaction} <span className="text-xs text-slate-300">/ 5.0</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-300 block">累計授課</span>
                <span className="text-lg font-black text-white">
                  {activeInstructor?.totalHoursTaught || 24}{' '}
                  <span className="text-xs text-slate-300">hrs</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Course Selection Bar & Sub Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-500 font-bold block">目前分析課程：</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full max-w-lg bg-slate-50 text-slate-900 text-xs font-black px-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {internalCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.courseCode}] {c.title} ({c.hours}小時 · {c.categoryName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            授課總結與關鍵指標
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            多維分析圖表
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 relative ${
              activeTab === 'grading'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500" />
            作業管理與批閱
            {pendingGradingSubmissions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {pendingGradingSubmissions.length} 待批
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'feedback'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
            學員滿意度回饋 (梯次整體分析)
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            學員名冊與完訓檢核
          </button>
        </div>
      </div>

      {/* 3. Post-Course Notification Card Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-blue-950 block">
              【授課結束通知】{activeCourse.title} 研習結訓報告已自動生成
            </span>
            <p className="text-blue-800 text-[11px] mt-0.5">
              問卷填答率達 100%，實務作業繳交共 {assignmentsSubmitted.length} 份，您可直接切換至「作業管理與批閱」進行線上文檔預覽與評分審核。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('grading')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            進入作業管理與批閱 ({pendingGradingSubmissions.length} 待審)
          </button>
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">授課滿意度平均</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{avgSatisfaction}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0 (滿分)</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                高於公司全體平均 0.24 分
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">課程完訓合格率</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{completionRate}%</span>
                <span className="text-xs text-slate-400 font-bold">
                  ({completedStudents}/{totalEnrolled} 人)
                </span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                通過門檻達標標準
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">實務作業繳交進度</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {assignmentsSubmitted.length} / {totalEnrolled}
                </span>
                <span className="text-xs text-slate-400 font-bold">人繳交</span>
              </div>
              <div className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                已自動同步 OneDrive 備份
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">測驗平均成績</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">88.5</span>
                <span className="text-xs text-slate-400 font-bold">分 (及格70)</span>
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                課前vs課後成長 +26.4%
              </div>
            </div>
          </div>

          {/* Course Summary & Key Highlights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Course Info & Radar Dimensions */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  教學品質評鑑五大維度雷達分析
                </h3>
                <span className="text-[11px] text-slate-400">來源：MS Forms 課後滿意度調查問卷</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={evaluationRadarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#CBD5E1" />
                    <Radar
                      name="本課程得分"
                      dataKey="score"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2 text-center text-[11px]">
                {evaluationRadarData.map((d) => (
                  <div key={d.subject} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block truncate">{d.subject}</span>
                    <span className="font-black text-indigo-600 text-xs">{d.score} / 5.0</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Score distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  學員測驗成績級距分佈
                </h3>
                <span className="text-[11px] text-slate-400">及格線 70分</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistributionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="range" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {scoreDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
                <strong>成績摘要：</strong> 90% 以上學員達 80 分以上之熟練水準，測驗題目掌握度極高。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MULTI-DIMENSIONAL ANALYTICS ================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch comparison */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                各開班梯次成效趨勢比較 (出席率 vs 通過率 vs 平均分)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="batch" tick={{ fontSize: 10 }} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="attendance" name="實體/線上出席率 (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="passRate" name="完訓合格率 (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgScore" name="測驗平均分數 (分)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Teaching Hours Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                講師歷年授課領域與時數分佈
              </h3>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '工程排程與要徑管理', value: 38, fill: '#4F46E5' },
                        { name: '深開挖與連續壁工法', value: 26, fill: '#3B82F6' },
                        { name: '案場品質自主檢驗', value: 20, fill: '#10B981' },
                        { name: '勞安與風險防範', value: 16, fill: '#F59E0B' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#4F46E5" />
                      <Cell fill="#3B82F6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ASSIGNMENT GRADING (ONLINE PREVIEW & GRADING) ================= */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <LecturerAssignmentManagementView
            currentEmpNo={currentEmpNo}
            initialCourseId={activeCourse?.id}
          />
        </div>
      )}

      {/* ================= TAB 4: STUDENT SATISFACTION FEEDBACK (BATCH-LEVEL OVERALL SYNTHESIS) ================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-600 text-white font-bold rounded-lg text-[10px]">
                  梯次整體回饋模式
                </span>
                <h4 className="font-black text-purple-950 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  {activeCourse.title} 課後各梯次整體滿意度與教學成效回饋
                </h4>
              </div>
              <p className="text-purple-800 text-xs mt-1 leading-relaxed">
                本區依據各課程梯次之問卷調查結果進行全體綜合量化指標分析與質化摘要整合，不顯示個別人員詳細回應文字，協助講師精準掌握各梯次整體成效與精進方向。
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3.5 py-2 bg-white text-purple-900 border border-purple-300 font-bold rounded-xl text-xs shadow-xs text-center">
                <span className="text-[10px] text-purple-600 block">各梯次平均總分</span>
                <span className="text-base font-black text-purple-700">4.91 / 5.0</span>
              </div>
            </div>
          </div>

          {/* Batch Selector Filter */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                梯次切換：
              </span>
              <button
                type="button"
                onClick={() => setSelectedBatchFilterId('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedBatchFilterId === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                全部梯次總覽 ({batchOverallFeedbackList.length})
              </button>
              {batchOverallFeedbackList.map((batch) => (
                <button
                  key={batch.batchId}
                  type="button"
                  onClick={() => setSelectedBatchFilterId(batch.batchId)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedBatchFilterId === batch.batchId
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {batch.batchName} ({batch.overallScore}分)
                </button>
              ))}
            </div>
            <div className="text-slate-500 text-xs font-semibold">
              問卷總回收率：<span className="text-emerald-600 font-bold">100%</span>
            </div>
          </div>

          {/* Batch Overall Cards List */}
          <div className="space-y-6">
            {batchOverallFeedbackList
              .filter((b) => selectedBatchFilterId === 'all' || b.batchId === selectedBatchFilterId)
              .map((batch) => (
                <div
                  key={batch.batchId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Batch Card Header */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-purple-500 text-white font-mono font-bold text-xs rounded-md">
                          {batch.batchCode}
                        </span>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          {batch.batchName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                        <span>開課日期：{batch.dateRange}</span>
                        <span>研習地點：{batch.location}</span>
                        <span>參訓同仁：{batch.enrolledCount} 人 (問卷回收率 100%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                      <div className="text-right">
                        <span className="text-[10px] text-purple-200 block font-bold">梯次整體滿意度</span>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-2xl font-black text-amber-400">{batch.overallScore}</span>
                          <span className="text-xs text-slate-300 font-bold">/ 5.0</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] text-emerald-300 font-bold text-right">卓越等級</span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Body: Quantitative Dimensions + Qualitative Synthesis */}
                  <div className="p-6 space-y-6">
                    {/* Dimension Scores and Distribution Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left 7 cols: 5 Dimensions Bars */}
                      <div className="lg:col-span-7 space-y-3.5">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                          五大教學指標評鑑分析
                        </h4>
                        <div className="space-y-2.5">
                          {batch.dimensionScores.map((dim, idx) => {
                            const scoreNum = parseFloat(dim.score);
                            const percent = (scoreNum / 5.0) * 100;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    {dim.name}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      (權重 {dim.weight})
                                    </span>
                                  </span>
                                  <span className="font-mono font-black text-purple-700">
                                    {dim.score} / 5.0
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right 5 cols: Satisfaction Level Distribution */}
                      <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          問卷等級分佈比例
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              非常滿意 (5星)
                            </span>
                            <span className="font-bold text-emerald-700">
                              {batch.distribution.verySatisfied}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              滿意 (4星)
                            </span>
                            <span className="font-bold text-blue-700">
                              {batch.distribution.satisfied}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              普通 (3星)
                            </span>
                            <span className="font-bold text-slate-500">
                              {batch.distribution.neutral}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              待加強 (1-2星)
                            </span>
                            <span className="font-bold text-slate-500">
                              {batch.distribution.unsatisfied}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>滿意度正向率</span>
                          <span className="font-black text-emerald-600 text-xs">100% 正向肯定</span>
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Overall Feedback Synthesis Modules */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        本梯次整體質化回饋綜合摘要 (Overall Synthesis)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Teaching Highlights */}
                        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-purple-900 font-black text-xs">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            教學亮點與成效
                          </div>
                          <p className="text-xs text-purple-950 leading-relaxed font-medium">
                            {batch.summarySynthesis.teachingHighlights}
                          </p>
                        </div>

                        {/* 2. Assignment & Practice Feedback */}
                        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                            實務作業與演練反饋
                          </div>
                          <p className="text-xs text-blue-950 leading-relaxed font-medium">
                            {batch.summarySynthesis.assignmentFeedback}
                          </p>
                        </div>

                        {/* 3. Future Recommendations */}
                        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            未來梯次優化與延伸建議
                          </div>
                          <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                            {batch.summarySynthesis.futureRecommendations}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Batch Consensus Tags */}
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-bold">梯次整體共識標籤：</span>
                      {batch.keyTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: STUDENT ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">
              全體學員完訓檢核總表 ({courseEnrollmentsList.length} 人)
            </h4>
            <button
              onClick={() => alert('已匯出全體學員授課成績與完訓總表 Excel！')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              匯出總表
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">學員姓名</th>
                  <th className="py-3 px-4">工號</th>
                  <th className="py-3 px-4">部門</th>
                  <th className="py-3 px-4">影音觀看 / 出席</th>
                  <th className="py-3 px-4">隨堂測驗分數</th>
                  <th className="py-3 px-4">實務作業狀態</th>
                  <th className="py-3 px-4">課後問卷</th>
                  <th className="py-3 px-4">完訓總判定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseEnrollmentsList.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {enr.studentName || '學員同仁'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{enr.empNo || 'EMP-001'}</td>
                    <td className="py-3 px-4 text-slate-600">{enr.department || '建築工程處'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600">
                        {enr.watchedDurationMinutes ? `${enr.watchedDurationMinutes}分 (100%)` : '已簽到出席'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {enr.examScore !== undefined ? `${enr.examScore} 分` : '85 分'}
                    </td>
                    <td className="py-3 px-4">
                      {enr.assignmentSubmission ? (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded font-bold text-[10px]">
                          已繳交 ({enr.assignmentSubmission.fileType?.toUpperCase()})
                        </span>
                      ) : (
                        <span className="text-slate-400">未繳交</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 font-bold">✓ 已填寫</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                        合格結業
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Grading Modal */}
      {activeGradingEnrollment && (
        <AssignmentGradingModal
          enrollment={activeGradingEnrollment}
          course={activeCourse}
          onClose={() => setActiveGradingEnrollment(null)}
          onSuccess={() => {
            setActiveGradingEnrollment(null);
          }}
        />
      )}
    </div>
  );
};
