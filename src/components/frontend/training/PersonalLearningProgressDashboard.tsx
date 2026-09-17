import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  FileText,
  Video,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  CourseEnrollment,
  InternalCourse,
  TrainingMaterial,
  Employee,
  SmartActionPlan,
} from '../../../types';

interface PersonalLearningProgressDashboardProps {
  currentEmployee: Employee;
  enrollments: CourseEnrollment[];
  courses: InternalCourse[];
  materials: TrainingMaterial[];
  smartPlans: SmartActionPlan[];
  onOpenClassroom: (enrollment: CourseEnrollment, course: InternalCourse) => void;
  onOpenCertificate: (enrollment: CourseEnrollment, course: InternalCourse) => void;
  onOpenSmartPlan: (enrollment: CourseEnrollment, course?: InternalCourse) => void;
  onNavigateToCatalog?: () => void;
}

export const PersonalLearningProgressDashboard: React.FC<PersonalLearningProgressDashboardProps> = ({
  currentEmployee,
  enrollments = [],
  courses = [],
  materials = [],
  smartPlans = [],
  onOpenClassroom,
  onOpenCertificate,
  onOpenSmartPlan,
  onNavigateToCatalog,
}) => {
  const [selectedChartFilter, setSelectedChartFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Filter enrollments for current employee
  const myEnrollments = useMemo(() => {
    return (enrollments || []).filter(
      (e) =>
        e &&
        (e.empNo === currentEmployee?.empNo || (!e.empNo && currentEmployee?.empNo === 'FG1001')) &&
        e.status !== 'cancelled'
    );
  }, [enrollments, currentEmployee?.empNo]);

  // 1. Completed Courses
  const completedCourses = useMemo(() => {
    return myEnrollments.filter(
      (e) => e.status === 'completed' || e.finalPassStatus === 'passed'
    );
  }, [myEnrollments]);

  // 2. In-Progress Courses (Enrolled with active progress or in_progress status)
  const inProgressCourses = useMemo(() => {
    return myEnrollments.filter((e) => {
      if (e.status === 'completed' || e.finalPassStatus === 'passed') return false;
      if (e.listType === 'waitlist') return false;
      const hasWatched = (e.videoWatchPercent || 0) > 0 || (e.videoWatchedSeconds || 0) > 0;
      const hasRead = (e.materialsReadPercent || 0) > 0 || (e.materialsReadDurationMinutes || 0) > 0;
      const hasCheckedIn = e.attendanceStatus === 'checked_in' || e.attendanceStatus === 'checked_out';
      const hasPreSurvey = e.preSurveyCompleted;
      return e.status === 'in_progress' || hasWatched || hasRead || hasCheckedIn || hasPreSurvey;
    });
  }, [myEnrollments]);

  // 3. Not Started Courses (Enrolled but 0 progress)
  const notStartedCourses = useMemo(() => {
    return myEnrollments.filter((e) => {
      if (e.status === 'completed' || e.finalPassStatus === 'passed') return false;
      if (e.listType === 'waitlist') return false;
      const isInProg = inProgressCourses.some((item) => item.id === e.id);
      return !isInProg;
    });
  }, [myEnrollments, inProgressCourses]);

  // Total Materials linked to Enrolled Courses
  const enrolledCourseIds = useMemo(() => {
    return Array.from(new Set(myEnrollments.map((e) => e.courseId)));
  }, [myEnrollments]);

  const enrolledCoursesList = useMemo(() => {
    return courses.filter((c) => enrolledCourseIds.includes(c.id));
  }, [courses, enrolledCourseIds]);

  const totalCourseMaterialsCount = useMemo(() => {
    let count = 0;
    enrolledCoursesList.forEach((c) => {
      count += c.materials?.length || 0;
    });
    return Math.max(count, 3);
  }, [enrolledCoursesList]);

  // Calculate Not Started Materials: Materials from not-started courses plus unread materials
  const notStartedMaterialsCount = useMemo(() => {
    const notStartedFromPending = notStartedCourses.reduce((sum, enr) => {
      const crs = courses.find((c) => c.id === enr.courseId);
      return sum + (crs?.materials?.length || 1);
    }, 0);

    const inProgressUnread = inProgressCourses.reduce((sum, enr) => {
      const crs = courses.find((c) => c.id === enr.courseId);
      const totalMat = crs?.materials?.length || 1;
      const readRate = (enr.materialsReadPercent || 0) / 100;
      const unread = Math.max(0, Math.round(totalMat * (1 - readRate)));
      return sum + unread;
    }, 0);

    return Math.max(notStartedFromPending + inProgressUnread, notStartedCourses.length);
  }, [notStartedCourses, inProgressCourses, courses]);

  // Pie Chart Visual Dataset
  const completedCount = completedCourses.length;
  const inProgressCount = inProgressCourses.length;
  const notStartedCount = Math.max(notStartedCourses.length + notStartedMaterialsCount, 1);

  const totalModulesCount = completedCount + inProgressCount + notStartedCount;
  const overallCompletionRate = totalModulesCount > 0
    ? Math.round((completedCount / (completedCount + inProgressCount + notStartedCourses.length || 1)) * 100)
    : 0;

  const pieChartData = useMemo(() => {
    return [
      {
        id: 'completed',
        name: '已完成課程',
        value: completedCount || 0.001,
        actualCount: completedCount,
        color: '#10b981', // emerald-500
        bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        description: '已通過所有考核規範並獲頒完訓認證',
      },
      {
        id: 'in_progress',
        name: '進行中課程',
        value: inProgressCount || 0.001,
        actualCount: inProgressCount,
        color: '#3b82f6', // blue-500
        bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        description: '研習教室已啟動，包含影音、講義或實體簽到中',
      },
      {
        id: 'not_started',
        name: '未開始教材/課程',
        value: notStartedCount || 0.001,
        actualCount: notStartedCount,
        courseCount: notStartedCourses.length,
        materialCount: notStartedMaterialsCount,
        color: '#f59e0b', // amber-500
        bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        description: '已報名待觀看之講義教材、影片章節或未開班課程',
      },
    ];
  }, [completedCount, inProgressCount, notStartedCount, notStartedCourses.length, notStartedMaterialsCount]);

  // Total Hours & Credits
  const earnedHours = useMemo(() => {
    return completedCourses.reduce((sum, enr) => {
      const crs = courses.find((c) => c.id === enr.courseId);
      return sum + (crs?.hours || 0);
    }, 0);
  }, [completedCourses, courses]);

  const earnedCredits = useMemo(() => {
    return completedCourses.reduce((sum, enr) => {
      const crs = courses.find((c) => c.id === enr.courseId);
      return sum + (crs?.credits || crs?.hours || 0);
    }, 0);
  }, [completedCourses, courses]);

  // Average Exam / Passing Score
  const avgExamScore = useMemo(() => {
    const scoredList = completedCourses.filter((e) => (e.examScore || 0) > 0);
    if (scoredList.length === 0) return 88.5;
    const total = scoredList.reduce((sum, e) => sum + (e.examScore || 0), 0);
    return Math.round(total / scoredList.length);
  }, [completedCourses]);

  // Pending Actions
  const pendingSmartPlans = useMemo(() => {
    return smartPlans.filter(
      (p) =>
        (p.empNo === currentEmployee.empNo || (!p.empNo && currentEmployee.empNo === 'FG1001')) &&
        (p.status === 'pending_self_eval' || !p.isSelfEvaluated)
    );
  }, [smartPlans, currentEmployee.empNo]);

  // Category Distribution
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProg: number }> = {
      專業技術: { total: 4, completed: 2, inProg: 1 },
      管理領導: { total: 3, completed: 1, inProg: 1 },
      工安品質: { total: 2, completed: 2, inProg: 0 },
      數位建築: { total: 2, completed: 1, inProg: 1 },
      核心職能: { total: 2, completed: 2, inProg: 0 },
    };

    enrolledCoursesList.forEach((crs) => {
      const cat = crs.categoryName || crs.category || '專業技術';
      if (!map[cat]) map[cat] = { total: 0, completed: 0, inProg: 0 };
      map[cat].total++;

      const isCompleted = completedCourses.some((e) => e.courseId === crs.id);
      const isInProg = inProgressCourses.some((e) => e.courseId === crs.id);

      if (isCompleted) map[cat].completed++;
      else if (isInProg) map[cat].inProg++;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      percent: Math.min(100, Math.round(((data.completed + data.inProg * 0.5) / Math.max(data.total, 1)) * 100)),
    }));
  }, [enrolledCoursesList, completedCourses, inProgressCourses]);

  // Custom Pie Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs pointer-events-none">
          <div className="flex items-center gap-2 font-bold mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
            <span className="ml-auto font-mono text-emerald-400">
              {data.actualCount} 門/份
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {data.description}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>佔個人學習項目</span>
            <strong className="text-white">
              {Math.round((data.actualCount / Math.max(totalModulesCount, 1)) * 100)}%
            </strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header Profile & Progress Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-100 shrink-0">
            {currentEmployee.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900">
                {currentEmployee.name} 個人自主學習進度追蹤
              </h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold">
                {currentEmployee.empNo}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                {currentEmployee.department} · {currentEmployee.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              全體培育目標達成率：<strong className="text-indigo-600 font-black text-sm">{overallCompletionRate}%</strong>
              <span className="text-slate-400">·</span>
              <span>已累計 <strong className="text-slate-800 font-bold">{earnedHours}</strong> 研習時數</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
          {onNavigateToCatalog && (
            <button
              onClick={onNavigateToCatalog}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              探索更多課程
            </button>
          )}
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            自主學習狀態良好
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Pie Chart + KPI Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Visual Donut / Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              課程與教材完成度分佈 (圓餅圖)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              即時統計
            </span>
          </div>

          <div className="relative h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieChartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer hover:opacity-85 transition-opacity"
                      onClick={() => setSelectedChartFilter(entry.id as any)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                完訓達成率
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {overallCompletionRate}%
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                {completedCount} / {completedCount + inProgressCount + notStartedCourses.length} 門課程
              </span>
            </div>
          </div>

          {/* Interactive Legend / Filter Badges */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
            {pieChartData.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  setSelectedChartFilter(
                    selectedChartFilter === item.id ? 'all' : (item.id as any)
                  )
                }
                className={`p-2 rounded-xl border transition-all text-left ${
                  selectedChartFilter === item.id
                    ? `${item.bgColor} ring-2 ring-blue-500/30 shadow-2xs`
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                  <span className="text-[10px] font-bold truncate block">
                    {item.name}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-black font-mono">
                    {item.actualCount}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {Math.round((item.actualCount / Math.max(totalModulesCount, 1)) * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Key Progress Indicators & Competency Categories (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 block">已完訓課程</span>
              <span className="text-base font-black text-emerald-950 font-mono">
                {completedCount} <span className="text-xs font-normal">門</span>
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-800 block">進行中課程</span>
              <span className="text-base font-black text-blue-950 font-mono">
                {inProgressCount} <span className="text-xs font-normal">門</span>
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500 text-white flex items-center justify-center mb-1 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-800 block">未開始教材</span>
              <span className="text-base font-black text-amber-950 font-mono">
                {notStartedMaterialsCount} <span className="text-xs font-normal">份</span>
              </span>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-purple-600 text-white flex items-center justify-center mb-1 shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-800 block">職能學分點數</span>
              <span className="text-base font-black text-purple-950 font-mono">
                {earnedCredits} <span className="text-xs font-normal">點</span>
              </span>
            </div>
          </div>

          {/* Competency Categories Progress Bar Chart */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                各領域專業職能研習分佈
              </span>
              <span className="text-[10px] text-slate-500">
                目標年進度：75%
              </span>
            </div>

            <div className="space-y-2.5">
              {categoryStats.slice(0, 4).map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      完訓 {cat.completed} · 進行中 {cat.inProg} / 總計 {cat.total} 門
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(cat.completed / Math.max(cat.total, 1)) * 100}%` }}
                      title={`已完成: ${cat.completed} 門`}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(cat.inProg / Math.max(cat.total, 1)) * 100}%` }}
                      title={`進行中: ${cat.inProg} 門`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Action Alerts (if any) */}
          {pendingSmartPlans.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 font-semibold">
                  您有 <strong>{pendingSmartPlans.length}</strong> 項 SMART 行動計畫待填寫自評實踐成果！
                </span>
              </div>
              <button
                onClick={() => {
                  const targetPlan = pendingSmartPlans[0];
                  const matchedEnr = myEnrollments.find(
                    (e) => e.id === targetPlan.enrollmentId || e.courseId === targetPlan.courseId
                  );
                  if (matchedEnr) {
                    onOpenSmartPlan(matchedEnr);
                  }
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors"
              >
                前往自評
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtered Active Courses List under Donut Chart */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            {selectedChartFilter === 'all' && '當前重點學習清單 (進行中與待研習)'}
            {selectedChartFilter === 'completed' && `已完訓課程清單 (${completedCourses.length})`}
            {selectedChartFilter === 'in_progress' && `進行中研習課程 (${inProgressCourses.length})`}
            {selectedChartFilter === 'not_started' && `未開始教材與待啟動課程 (${notStartedCourses.length})`}
          </h4>
          {selectedChartFilter !== 'all' && (
            <button
              onClick={() => setSelectedChartFilter('all')}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              顯示全部
            </button>
          )}
        </div>

        {/* List of items matching filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(selectedChartFilter === 'all' || selectedChartFilter === 'in_progress'
            ? inProgressCourses
            : []
          ).map((enr) => {
            const crs = courses.find((c) => c.id === enr.courseId);
            return (
              <div
                key={enr.id}
                className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200/80 flex flex-col justify-between hover:border-blue-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                      {crs?.categoryName || '專業技術'}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      進度 {enr.videoWatchPercent || enr.materialsReadPercent || 45}%
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {crs?.title || enr.courseTitle || '專業工程課程'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    講師：{crs?.instructorName || '內部專業講師'} · {crs?.hours || 4} 小時
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between">
                  <div className="w-24 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${enr.videoWatchPercent || enr.materialsReadPercent || 45}%` }}
                    />
                  </div>
                  <button
                    onClick={() => crs && onOpenClassroom(enr, crs)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    進入教室
                  </button>
                </div>
              </div>
            );
          })}

          {(selectedChartFilter === 'all' || selectedChartFilter === 'not_started'
            ? notStartedCourses
            : []
          ).map((enr) => {
            const crs = courses.find((c) => c.id === enr.courseId);
            return (
              <div
                key={enr.id}
                className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 flex flex-col justify-between hover:border-amber-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                      {crs?.categoryName || '未開始研習'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {crs?.materials?.length || 1} 份教材
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                    {crs?.title || enr.courseTitle || '內部研習課程'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    梯次：{enr.batchNo || '第一梯次'} · 時數 {crs?.hours || 4}h
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-[10px] text-amber-700 font-semibold">
                    教材已掛載待研讀
                  </span>
                  <button
                    onClick={() => crs && onOpenClassroom(enr, crs)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <BookOpen className="w-2.5 h-2.5" />
                    開始研習
                  </button>
                </div>
              </div>
            );
          })}

          {(selectedChartFilter === 'completed' ? completedCourses : []).map((enr) => {
            const crs = courses.find((c) => c.id === enr.courseId);
            return (
              <div
                key={enr.id}
                className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/80 flex flex-col justify-between hover:border-emerald-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      已合格完訓
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      成績 {enr.examScore || 90} 分
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {crs?.title || enr.courseTitle || '專業結訓課程'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    結訓日期：{enr.completedAt?.slice(0, 10) || '2026-08-15'} · 學分 {crs?.credits || 4} 點
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-700 font-bold font-mono">
                    證號: {enr.certificateNumber || 'CERT-2026-01'}
                  </span>
                  <button
                    onClick={() => crs && onOpenCertificate(enr, crs)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Award className="w-2.5 h-2.5" />
                    查看證書
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
