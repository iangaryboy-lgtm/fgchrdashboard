import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  CheckCircle2,
  XCircle,
  Award,
  Target,
  Clock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Eye,
  Calendar,
  Building,
  GraduationCap,
  BookOpen,
  FileCheck,
  RotateCcw,
  Check,
  Info,
  Lock,
  FileLock2,
  Radar as RadarIcon,
} from 'lucide-react';
import { SmartActionPlanModal } from './SmartActionPlanModal';
import { EnrollmentReviewDetailModal } from './EnrollmentReviewDetailModal';
import { CourseEnrollment, SmartActionPlan } from '../../../types';
import { DepartmentLearningHistoryView } from './DepartmentLearningHistoryView';
import { CompetencyReadinessDashboard } from './CompetencyReadinessDashboard';

export const ManagerCoachingView: React.FC = () => {
  const {
    employees,
    courseEnrollments,
    internalCourses,
    smartActionPlans,
    approveEnrollment,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'approvals' | 'smart_eval' | 'readiness_radar' | 'learning_history' | 'team_progress'
  >('approvals');

  // Approval table filter states
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'approved' | 'rejected' | 'all'
  >('pending');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState('all');

  // Selected Enrollment for Detail Review Modal
  const [selectedEnrollmentForModal, setSelectedEnrollmentForModal] =
    useState<CourseEnrollment | null>(null);

  // SMART Action Plan modal state
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<{
    enrollment: CourseEnrollment;
    plan: SmartActionPlan;
  } | null>(null);

  // Status Counts
  const pendingCount = courseEnrollments.filter(
    (e) => e.approvalStatus === 'pending' && e.status !== 'cancelled'
  ).length;

  const approvedCount = courseEnrollments.filter(
    (e) =>
      e.approvalStatus === 'approved' || e.approvalStatus === 'auto_approved'
  ).length;

  const rejectedCount = courseEnrollments.filter(
    (e) => e.approvalStatus === 'rejected'
  ).length;

  const allCount = courseEnrollments.length;

  // Filtered Enrollments List
  const filteredEnrollments = useMemo(() => {
    return courseEnrollments.filter((enr) => {
      // 1. Status Filter
      if (statusFilter === 'pending') {
        if (enr.approvalStatus !== 'pending' || enr.status === 'cancelled') {
          return false;
        }
      } else if (statusFilter === 'approved') {
        if (
          enr.approvalStatus !== 'approved' &&
          enr.approvalStatus !== 'auto_approved'
        ) {
          return false;
        }
      } else if (statusFilter === 'rejected') {
        if (enr.approvalStatus !== 'rejected') {
          return false;
        }
      }

      // 2. Department Filter
      if (
        selectedDepartment !== 'all' &&
        enr.department !== selectedDepartment
      ) {
        return false;
      }

      // 3. Enrollment Type Filter
      if (
        selectedEnrollmentType !== 'all' &&
        enr.enrollmentType !== selectedEnrollmentType
      ) {
        return false;
      }

      // 4. Search Keyword Filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const empMatch =
          enr.empName?.toLowerCase().includes(q) ||
          enr.empNo?.toLowerCase().includes(q);
        const courseMatch =
          enr.courseTitle?.toLowerCase().includes(q) ||
          enr.courseName?.toLowerCase().includes(q);
        const deptMatch = enr.department?.toLowerCase().includes(q);
        const batchMatch =
          enr.batchNo?.toLowerCase().includes(q) ||
          enr.batchName?.toLowerCase().includes(q);
        const approverMatch = enr.approverName?.toLowerCase().includes(q);

        if (
          !empMatch &&
          !courseMatch &&
          !deptMatch &&
          !batchMatch &&
          !approverMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    courseEnrollments,
    statusFilter,
    selectedDepartment,
    selectedEnrollmentType,
    searchKeyword,
  ]);

  // Plans needing evaluation
  const plansNeedingEval = smartActionPlans.filter(
    (p) => p.status === 'in_progress'
  );

  // Departments list for dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    courseEnrollments.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [courseEnrollments]);

  // Fast inline approve
  const handleQuickApprove = (
    e: React.MouseEvent,
    enrollmentId: string,
    empName: string
  ) => {
    e.stopPropagation();
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const approverEmpNo =
      currentUser?.employee?.empNo || currentUser?.empNo || 'MGR-001';
    approveEnrollment(enrollmentId, true, approverEmpNo, approverName);
  };

  // Fast inline reject
  const handleQuickReject = (
    e: React.MouseEvent,
    enrollmentId: string,
    empName: string
  ) => {
    e.stopPropagation();
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const approverEmpNo =
      currentUser?.employee?.empNo || currentUser?.empNo || 'MGR-001';
    approveEnrollment(enrollmentId, false, approverEmpNo, approverName);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                育碁 aEnrich 案主管梯隊培訓與職能教練體系
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              主管培訓與職能審查專區
            </h2>
            <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl leading-relaxed">
              全面審查部屬開課報名申請、查閱已簽核歷史檔案、評鑑課後 60 天 SMART
              實踐落地指標，並掌握部門同仁關鍵職能達標率，為未來案主管遴選提供客觀量化數據。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <span className="text-[10px] text-amber-200 block font-bold">
                待審核報名
              </span>
              <span className="text-xl font-black text-amber-300">
                {pendingCount} 筆
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <span className="text-[10px] text-emerald-200 block font-bold">
                已核准歷史
              </span>
              <span className="text-xl font-black text-emerald-300">
                {approvedCount} 筆
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <span className="text-[10px] text-indigo-200 block font-bold">
                SMART 評核
              </span>
              <span className="text-xl font-black text-white">
                {plansNeedingEval.length} 份
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'approvals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            同仁報名簽核審查 ({pendingCount} 待辦 / {allCount} 總量)
          </button>
          <button
            onClick={() => setActiveTab('readiness_radar')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'readiness_radar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RadarIcon className="w-3.5 h-3.5" />
            職能備齊率(雷達圖)
          </button>
          <button
            onClick={() => setActiveTab('smart_eval')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'smart_eval'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            SMART 實踐落地評鑑 ({plansNeedingEval.length})
          </button>
          <button
            onClick={() => setActiveTab('learning_history')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'learning_history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            學習歷程視覺化圖表
          </button>
          <button
            onClick={() => setActiveTab('team_progress')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'team_progress'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            部屬職能學習儀表板
          </button>
        </div>

        {activeTab === 'approvals' && (
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            💡 點擊任一列表資料即可開啟完整規格與同仁資歷，查閱後進行批核
          </div>
        )}
      </div>

      {/* TAB 1: APPROVALS & HISTORICAL AUDIT (同仁報名簽核審查) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Query Filter & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            {/* Top row: Status Filter Buttons & Counters */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  審核狀態：
                </span>

                {/* Status: Pending */}
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'pending'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  待簽核審查
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-slate-950 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                </button>

                {/* Status: Approved */}
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已核准參訓 (已簽核)
                  <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
                    {approvedCount}
                  </span>
                </button>

                {/* Status: Rejected */}
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  已駁回申請
                  <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
                    {rejectedCount}
                  </span>
                </button>

                {/* Status: All History */}
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部歷史紀錄
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                    {allCount}
                  </span>
                </button>
              </div>

              {/* Reset filter button */}
              {(searchKeyword ||
                selectedDepartment !== 'all' ||
                selectedEnrollmentType !== 'all' ||
                statusFilter !== 'pending') && (
                <button
                  onClick={() => {
                    setStatusFilter('pending');
                    setSearchKeyword('');
                    setSelectedDepartment('all');
                    setSelectedEnrollmentType('all');
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  重設搜尋條件
                </button>
              )}
            </div>

            {/* Bottom row: Search input + Select Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Keyword Search */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="輸入同仁姓名、工號 (如 FG1004)、課程名稱、梯次或簽核主管..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Department Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部所屬部室</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enrollment Type Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedEnrollmentType}
                  onChange={(e) => setSelectedEnrollmentType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部報名類型 (自主/派訓)</option>
                  <option value="self_enrolled">同仁自主報名</option>
                  <option value="assigned_mandatory">主管指派必修</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                符合篩選結果：共{' '}
                <strong className="text-blue-600 font-black">
                  {filteredEnrollments.length}
                </strong>{' '}
                筆申請資料
              </span>
              <span className="text-slate-500 text-[11px]">
                點擊任一行可開啟「完整課程規格、同仁資歷與簽核作業」明細
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3.5 px-4">申請同仁與資歷</th>
                    <th className="py-3.5 px-4">報名研習課程 / 梯次</th>
                    <th className="py-3.5 px-4">培訓規格 / 授課方式</th>
                    <th className="py-3.5 px-4">報名性質與時間</th>
                    <th className="py-3.5 px-4 text-center">簽核狀態</th>
                    <th className="py-3.5 px-4 text-right">審查作業</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((enr) => {
                    const course = internalCourses.find(
                      (c) => c.id === enr.courseId
                    );
                    const isPending =
                      enr.approvalStatus === 'pending' ||
                      enr.listType === 'pending_approval';
                    const isApproved =
                      enr.approvalStatus === 'approved' ||
                      enr.approvalStatus === 'auto_approved';
                    const isRejected = enr.approvalStatus === 'rejected';

                    return (
                      <tr
                        key={enr.id}
                        onClick={() => setSelectedEnrollmentForModal(enr)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      >
                        {/* 1. Applicant */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                              {enr.empName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 text-xs">
                                  {enr.empName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                                  {enr.empNo}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {enr.department} · {enr.section || '工務課'}{' '}
                                {enr.title}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Course & Batch */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                                {course?.category ||
                                  enr.trainingCategory ||
                                  '專業技術'}
                              </span>
                              <span className="font-black text-slate-800 text-xs group-hover:text-blue-600 transition-colors line-clamp-1">
                                {enr.courseTitle || course?.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {enr.batchNo || enr.batchName || '第 01 梯次'}
                            </div>
                          </div>
                        </td>

                        {/* 3. Specs & Delivery */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-bold text-slate-800 text-[11px]">
                            {course?.hours || 8} 小時 ·{' '}
                            <span className="text-indigo-600 font-black">
                              {course?.credits || 2} 職能學分
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {course?.deliveryMode === 'in_person'
                              ? '🏫 實體面授教室'
                              : course?.deliveryMode === 'online'
                              ? '💻 線上數位'
                              : '🌐 混成教學'}
                            {course?.instructorName &&
                              ` · ${course.instructorName}`}
                          </div>
                        </td>

                        {/* 4. Enrollment type & time */}
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                enr.enrollmentType === 'assigned_mandatory'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {enr.enrollmentType === 'assigned_mandatory'
                                ? '主管指派'
                                : '自主選課'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {enr.enrolledAt}
                          </div>
                        </td>

                        {/* 5. Approval Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full font-black text-[11px]">
                              <Clock className="w-3 h-3" />
                              待審核
                            </span>
                          )}
                          {isApproved && (
                            <div className="inline-block text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-black text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                已核准
                              </span>
                              {enr.approverName && (
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {enr.approverName}
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <div className="inline-block text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-full font-black text-[11px]">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                已駁回
                              </span>
                              {enr.approverName && (
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {enr.approverName}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail Button */}
                            {isPending ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEnrollmentForModal(enr);
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                                title="查看詳細資訊並進行簽核"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">
                                  審查明細
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEnrollmentForModal(enr);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                                title="查看已簽核歸檔表單（唯讀存證）"
                              >
                                <FileLock2 className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden md:inline">
                                  檢視已歸檔
                                </span>
                              </button>
                            )}

                            {/* Quick Approve / Reject for Pending */}
                            {isPending && (
                              <>
                                <button
                                  onClick={(e) =>
                                    handleQuickApprove(e, enr.id, enr.empName)
                                  }
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
                                  title="一鍵核准"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="hidden lg:inline">核准</span>
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleQuickReject(e, enr.id, enr.empName)
                                  }
                                  className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs transition-colors"
                                  title="駁回申請"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEnrollments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 space-y-2"
                      >
                        <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600 text-xs">
                          查無符合條件之課程報名審查紀錄
                        </p>
                        <p className="text-[11px] text-slate-400">
                          可切換上方狀態標籤（如「全部歷史紀錄」）或調整搜尋關鍵字
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMART EVALUATIONS */}
      {activeTab === 'smart_eval' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plansNeedingEval.map((plan) => {
              const enr = courseEnrollments.find(
                (e) => e.id === plan.enrollmentId
              );
              if (!enr) return null;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold">
                        {plan.empName} ({plan.empNo})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        預計達成日: {plan.timeBoundDate}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">
                      {plan.courseTitle}
                    </h4>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                      <div>
                        <strong className="text-slate-900">具體目標 (S)：</strong>
                        <span className="text-slate-600">
                          {plan.specificGoal}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-900">衡量指標 (M)：</strong>
                        <span className="text-slate-600">
                          {plan.measurableMetric}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      待主管考評打分
                    </span>
                    <button
                      onClick={() =>
                        setSelectedPlanForModal({ enrollment: enr, plan })
                      }
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      開啟實踐考評
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {plansNeedingEval.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">
                目前無待評核之 SMART 行動計畫
              </h4>
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPETENCY READINESS RADAR (POWER BI 雷達圖與鑽取分析) */}
      {activeTab === 'readiness_radar' && <CompetencyReadinessDashboard />}

      {/* TAB: DEPARTMENT & TEAM LEARNING HISTORY VISUALIZATION (RECHARTS) */}
      {activeTab === 'learning_history' && <DepartmentLearningHistoryView />}

      {/* TAB 3: TEAM PROGRESS DASHBOARD */}
      {activeTab === 'team_progress' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                部屬同仁專業訓練修習與案主管職能進度總覽
              </h3>
              <span className="text-xs text-slate-500">
                達標門檻：累計 24 職能學分及通過核心工法評核
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3.5 px-4">部屬同仁</th>
                  <th className="py-3.5 px-4">所屬部室 / 職稱</th>
                  <th className="py-3.5 px-4 text-center">已完訓門數</th>
                  <th className="py-3.5 px-4 text-center">累計職能學分</th>
                  <th className="py-3.5 px-4 text-center">案主管培育達標率</th>
                  <th className="py-3.5 px-4 text-center">人才梯隊狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.slice(0, 6).map((emp) => {
                  const empCompleted = courseEnrollments.filter(
                    (e) => e.empNo === emp.empNo && e.status === 'completed'
                  ).length;
                  const creditScore = empCompleted * 4 + 8;
                  const progressPct = Math.min(
                    100,
                    Math.round((creditScore / 24) * 100)
                  );

                  return (
                    <tr
                      key={emp.empNo}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {emp.name} ({emp.empNo})
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp.department} · {emp.title}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {empCompleted} 門
                      </td>
                      <td className="py-3 px-4 text-center font-black text-indigo-600">
                        {creditScore} 點
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="max-w-[120px] mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{progressPct}%</span>
                            <span>{creditScore}/24點</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                progressPct >= 80
                                  ? 'bg-emerald-500'
                                  : progressPct >= 50
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {progressPct >= 80 ? (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            案主管合格候選人
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium text-[10px]">
                            儲備培訓中
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Enrollment Review Detail Modal (點開看細節資訊再簽核) */}
      <EnrollmentReviewDetailModal
        isOpen={!!selectedEnrollmentForModal}
        onClose={() => setSelectedEnrollmentForModal(null)}
        enrollment={selectedEnrollmentForModal}
      />

      {/* Modal 2: SMART Action Plan Evaluation Modal */}
      {selectedPlanForModal && (
        <SmartActionPlanModal
          enrollment={selectedPlanForModal.enrollment}
          plan={selectedPlanForModal.plan}
          onClose={() => setSelectedPlanForModal(null)}
        />
      )}
    </div>
  );
};
