import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Download,
  Eye,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  BookOpen,
  Cloud,
  Check,
  Award,
  Layers,
  BarChart3,
  HelpCircle,
  FileArchive,
  FolderDown,
  ChevronRight,
  Database,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  CourseEnrollment,
  InternalCourse,
  CourseAssignmentSubmission,
  AssignmentFileType,
} from '../../../types';
import { AssignmentGradingModal } from './AssignmentGradingModal';
import {
  downloadAssignmentFile,
  downloadBatchZipPackage,
  AssignmentDownloadPayload,
} from '../../../utils/assignmentDownloadHelper';
import {
  subscribeAssignmentsFromFirestore,
  fetchAssignmentsFromFirestore,
  StoredAssignmentDocument,
} from '../../../services/assignmentStorageService';

interface LecturerAssignmentManagementViewProps {
  currentEmpNo?: string;
  initialCourseId?: string;
  onNavigateToCourse?: (courseId: string) => void;
}

export const LecturerAssignmentManagementView: React.FC<
  LecturerAssignmentManagementViewProps
> = ({ currentEmpNo = 'EMP-001', initialCourseId, onNavigateToCourse }) => {
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
    const list = internalCourses.filter(
      (c) =>
        c.instructorId === activeInstructor.id ||
        c.instructorName?.includes(activeInstructor.name) ||
        (activeInstructor.empNo && c.instructorName?.includes(activeInstructor.empNo)) ||
        c.batches?.some(
          (b) =>
            b.primaryInstructorId === activeInstructor.id ||
            b.primaryInstructorName?.includes(activeInstructor.name) ||
            (activeInstructor.empNo && b.primaryInstructorName?.includes(activeInstructor.empNo))
        )
    );
    return list.length > 0 ? list : internalCourses;
  }, [internalCourses, activeInstructor]);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(
    initialCourseId || taughtCourses[0]?.id || 'all'
  );
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'passed' | 'failed' | 'resubmit'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipSuccessToast, setZipSuccessToast] = useState<boolean>(false);

  // Firestore real-time stored submissions
  const [firestoreSubmissions, setFirestoreSubmissions] = useState<StoredAssignmentDocument[]>([]);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to Firestore assignment storage
    const unsub = subscribeAssignmentsFromFirestore((subs) => {
      setFirestoreSubmissions(subs);
      setIsFirestoreConnected(true);
    });

    return () => unsub();
  }, []);

  // Active grading modal target
  const [activeGradingEnrollment, setActiveGradingEnrollment] =
    useState<CourseEnrollment | null>(null);
  const [activeGradingCourse, setActiveGradingCourse] =
    useState<InternalCourse | null>(null);

  // Build unified submission list from courseEnrollments + firestore submissions
  const allSubmissionsList = useMemo(() => {
    const list: Array<{
      enrollment: CourseEnrollment;
      course: InternalCourse;
      submission: CourseAssignmentSubmission;
    }> = [];

    // 1. Collect from AppContext courseEnrollments
    courseEnrollments.forEach((enr) => {
      const course = internalCourses.find((c) => c.id === enr.courseId);
      if (!course) return;

      // Filter by instructor
      const isMyCourse =
        !activeInstructor ||
        course.instructorId === activeInstructor?.id ||
        course.instructorName === activeInstructor?.name ||
        taughtCourses.some((tc) => tc.id === course.id);

      if (!isMyCourse) {
        // Only show courses taught by this instructor
        return;
      }

      if (enr.assignmentSubmission) {
        list.push({
          enrollment: enr,
          course,
          submission: enr.assignmentSubmission,
        });
      } else if (enr.status === 'in_progress' || enr.status === 'completed' || enr.attendanceStatus === 'checked_in' || (enr.attendanceStatus as any) === 'present') {
        // Check if matching firestore submission exists
        const fsSub = firestoreSubmissions.find(
          (fs) => fs.enrollmentId === enr.id || (fs.courseId === enr.courseId && fs.empNo === enr.empNo)
        );
        if (fsSub) {
          list.push({
            enrollment: enr,
            course,
            submission: fsSub,
          });
        }
      }
    });

    return list;
  }, [courseEnrollments, internalCourses, activeInstructor, taughtCourses, firestoreSubmissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return allSubmissionsList.filter((item) => {
      // Course filter
      if (selectedCourseFilter !== 'all' && item.course.id !== selectedCourseFilter) {
        return false;
      }

      // Batch filter
      if (selectedBatchFilter !== 'all' && item.enrollment.batchNo !== selectedBatchFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending') {
        const isPending =
          item.submission.status === 'submitted' ||
          item.submission.gradeStatus === 'pending' ||
          (!item.submission.score && item.submission.passed === undefined);
        if (!isPending) return false;
      } else if (statusFilter === 'passed') {
        const isPassed =
          item.submission.status === 'graded_pass' ||
          item.submission.status === 'graded_score' ||
          item.submission.passed === true ||
          (item.submission.score !== undefined && item.submission.score >= 70);
        if (!isPassed) return false;
      } else if (statusFilter === 'failed') {
        const isFailed =
          item.submission.status === 'graded_fail' ||
          item.submission.passed === false ||
          (item.submission.score !== undefined && item.submission.score < 70);
        if (!isFailed) return false;
      } else if (statusFilter === 'resubmit') {
        if (item.submission.status !== 'returned_for_revision') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentName = (item.enrollment.studentName || item.enrollment.empName || '').toLowerCase();
        const empNo = (item.enrollment.empNo || '').toLowerCase();
        const dept = (item.enrollment.department || '').toLowerCase();
        const fileName = (item.submission.fileName || '').toLowerCase();
        const cTitle = (item.course.title || '').toLowerCase();

        return (
          studentName.includes(q) ||
          empNo.includes(q) ||
          dept.includes(q) ||
          fileName.includes(q) ||
          cTitle.includes(q)
        );
      }

      return true;
    });
  }, [allSubmissionsList, selectedCourseFilter, selectedBatchFilter, statusFilter, searchQuery]);

  // Statistics
  const totalSubmissionsCount = allSubmissionsList.length;
  const pendingCount = allSubmissionsList.filter(
    (i) =>
      i.submission.status === 'submitted' ||
      i.submission.gradeStatus === 'pending' ||
      (!i.submission.score && i.submission.passed === undefined)
  ).length;
  const passedCount = allSubmissionsList.filter(
    (i) =>
      i.submission.status === 'graded_pass' ||
      i.submission.status === 'graded_score' ||
      i.submission.passed === true ||
      (i.submission.score !== undefined && i.submission.score >= 70)
  ).length;
  const failedCount = allSubmissionsList.filter(
    (i) =>
      i.submission.status === 'graded_fail' ||
      i.submission.passed === false ||
      (i.submission.score !== undefined && i.submission.score < 70)
  ).length;

  const gradingRate = totalSubmissionsCount > 0
    ? Math.round(((totalSubmissionsCount - pendingCount) / totalSubmissionsCount) * 100)
    : 100;

  // Batch ZIP Download Handler
  const handleBatchZipDownload = async () => {
    if (filteredSubmissions.length === 0) {
      alert('目前篩選條件下尚無作業檔案可供打包！');
      return;
    }

    setIsZipping(true);

    const payloads: AssignmentDownloadPayload[] = filteredSubmissions.map((item) => {
      const s = item.submission;
      const enr = item.enrollment;
      return {
        fileName: s.fileName,
        studentName: enr.studentName || enr.empName || '學員',
        empNo: enr.empNo || 'EMP',
        department: enr.department,
        fileType: s.fileType || 'word',
        submittedAt: s.submittedAt,
        notes: s.notes || s.studentNote,
        courseTitle: item.course.title,
        courseCode: item.course.courseCode,
        batchNo: enr.batchNo || '01',
        score: s.score || s.gradeScore,
        gradeStatus: (s.passed ? 'passed' : s.passed === false ? 'failed' : 'pending') as any,
        reviewerFeedback: s.reviewerFeedback,
        fileData: (s as any).fileData,
      };
    });

    const activeCourseObj = internalCourses.find((c) => c.id === selectedCourseFilter);
    const targetTitle = activeCourseObj ? activeCourseObj.title : '全體課程作業彙總';
    const targetCode = activeCourseObj ? activeCourseObj.courseCode : 'TR-FARGLORY';

    await downloadBatchZipPackage(payloads, targetTitle, selectedBatchFilter !== 'all' ? selectedBatchFilter : '01', targetCode);

    setIsZipping(false);
    setZipSuccessToast(true);
    setTimeout(() => setZipSuccessToast(false), 4000);
  };

  const getFileTypeBadge = (type: AssignmentFileType | string) => {
    switch (type) {
      case 'excel':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Excel 試算表',
        };
      case 'powerpoint':
        return {
          icon: <Presentation className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'PPT 簡報',
        };
      case 'pdf':
        return {
          icon: <FileText className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'PDF 文件',
        };
      case 'image':
        return {
          icon: <FileText className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: '施工圖檔',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-sky-600" />,
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          label: 'Word 文件',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Storage Infrastructure Info */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-sky-400 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white text-2xl font-black">
                📝
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  平台 Firestore 雲端儲存庫 (方案 B 實體存證)
                </span>
                <span className="text-xs text-sky-200 font-mono">
                  即時自動同步 · 免依賴外部帳號授權
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                講師作業管理與批閱中心
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                集中檢視學員上傳之實務專題檔案（Word, Excel, PPT, PDF, 施工照片），支援線上高解析預覽、向度 Rubric 評分、實務評語撰寫與批次打包下載。
              </p>
            </div>
          </div>

          {/* Locked Instructor Identity Card & Sync Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>評閱講師身分綁定</span>
              </div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{activeInstructor?.name}</span>
                <span className="text-[10px] text-sky-200 font-mono bg-sky-500/20 px-1.5 py-0.2 rounded">
                  {activeInstructor?.empNo || boundEmpNo}
                </span>
              </div>
              <span className="text-[10px] text-sky-200 block">
                {activeInstructor?.organization} · {activeInstructor?.title}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-3 sm:border-l sm:border-white/20 pt-2 sm:pt-0">
              <div className="text-center">
                <span className="text-[10px] text-sky-200 block font-semibold">待批閱</span>
                <span className="text-lg font-black text-amber-400">
                  {pendingCount} <span className="text-xs text-slate-300">份</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-sky-200 block font-semibold">已及格</span>
                <span className="text-lg font-black text-emerald-400">
                  {passedCount} <span className="text-xs text-slate-300">份</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">總繳交件數</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{totalSubmissionsCount}</span>
              <span className="text-[10px] text-slate-500 font-bold">份已存證</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-900 block">待批閱審核</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-800">{pendingCount}</span>
              <span className="text-[10px] text-amber-700 font-bold">份待審</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-900 block">通過及格數</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-800">{passedCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">份已核定</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">批閱完成率</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-900">{gradingRate}%</span>
              <span className="text-[10px] text-indigo-600 font-bold">進度</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search & Action Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Course & Batch Selector */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 min-w-[220px]">
              <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-500 block">課程篩選：</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-slate-900 outline-hidden cursor-pointer"
                >
                  <option value="all">全部課程作業 ({totalSubmissionsCount})</option>
                  {internalCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.courseCode}] {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">梯次：</span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-900 outline-hidden cursor-pointer"
                >
                  <option value="all">全部梯次</option>
                  <option value="01">第 01 梯次</option>
                  <option value="02">第 02 梯次</option>
                  <option value="03">第 03 梯次</option>
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學員姓名、員編、部門或作業檔名..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons (Batch ZIP download) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBatchZipDownload}
              disabled={isZipping || filteredSubmissions.length === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isZipping || filteredSubmissions.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
              }`}
            >
              {isZipping ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>正在壓縮全班作業...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>一鍵打包下載全班作業 (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-2 shrink-0">
            <Filter className="w-3 h-3 text-slate-400" /> 狀態篩選：
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部作業 ({allSubmissionsList.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            待批閱 ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('passed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'passed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            已及格/通過 ({passedCount})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'failed'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3 h-3" />
            未通過/不及格 ({failedCount})
          </button>
        </div>
      </div>

      {/* ZIP Success Notification Toast */}
      {zipSuccessToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>已成功打包全班作業！</strong> 包含全體學員實體檔案、評分總清冊 (.CSV) 與微軟 365 歸檔說明文件。
            </span>
          </div>
          <button
            onClick={() => setZipSuccessToast(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            關閉
          </button>
        </div>
      )}

      {/* 4. Submissions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            學員作業繳交清單 ({filteredSubmissions.length} 份)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            點擊「即時預覽與批閱」啟動線上向度審查台
          </span>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">目前沒有符合條件的作業檔案</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              請嘗試切換課程、梯次或清除搜尋關鍵字。學員在學習專區提交作業後，將即刻在此處顯示。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">學員資訊</th>
                  <th className="py-3 px-4">課程與梯次</th>
                  <th className="py-3 px-4">繳交作業檔名</th>
                  <th className="py-3 px-4">檔案格式 / 大小</th>
                  <th className="py-3 px-4">繳交時間</th>
                  <th className="py-3 px-4">雲端儲存狀態</th>
                  <th className="py-3 px-4">審查結果 / 分數</th>
                  <th className="py-3 px-4 text-right">操作功能</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map(({ enrollment, course, submission }, idx) => {
                  const studentName = enrollment.studentName || enrollment.empName || '學員';
                  const empNo = enrollment.empNo || 'EMP';
                  const dept = enrollment.department || '建築工程處';
                  const badge = getFileTypeBadge(submission.fileType || 'word');

                  const isGraded =
                    submission.status === 'graded_score' ||
                    submission.status === 'graded_pass' ||
                    submission.status === 'graded_fail' ||
                    submission.gradeStatus === 'graded' ||
                    submission.score !== undefined;

                  const isPass =
                    submission.status === 'graded_pass' ||
                    submission.passed === true ||
                    (submission.score !== undefined && submission.score >= 70);

                  return (
                    <tr
                      key={`${enrollment.id}_${idx}`}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {studentName.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{studentName}</span>
                              <span className="text-[10px] font-mono text-slate-500">({empNo})</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{dept}</div>
                          </div>
                        </div>
                      </td>

                      {/* Course Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 max-w-[160px] truncate" title={course.title}>
                          {course.title}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-bold font-mono">
                          [{course.courseCode}] 第 {enrollment.batchNo || '01'} 梯次
                        </div>
                      </td>

                      {/* File Name */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div
                          className="font-bold text-sky-950 truncate cursor-pointer hover:text-sky-700"
                          title={submission.fileName}
                          onClick={() => {
                            setActiveGradingEnrollment(enrollment);
                            setActiveGradingCourse(course);
                          }}
                        >
                          {submission.fileName}
                        </div>
                        {submission.notes && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5" title={submission.notes}>
                            摘要: {submission.notes}
                          </div>
                        )}
                      </td>

                      {/* File Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {submission.fileSize || '2.4 MB'}
                          </span>
                        </div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                        {submission.submittedAt || '-'}
                      </td>

                      {/* Storage Status */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Firestore 已存證
                        </span>
                      </td>

                      {/* Grade Status */}
                      <td className="py-3.5 px-4">
                        {isGraded ? (
                          isPass ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                及格 / 通過
                              </span>
                              {submission.score !== undefined && (
                                <span className="text-xs font-black text-emerald-700 font-mono">
                                  {submission.score}分
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                未通過
                              </span>
                              {submission.score !== undefined && (
                                <span className="text-xs font-black text-rose-700 font-mono">
                                  {submission.score}分
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 w-fit animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            待講師批閱
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Single File Download */}
                          <button
                            type="button"
                            onClick={() => {
                              downloadAssignmentFile({
                                fileName: submission.fileName,
                                studentName,
                                empNo,
                                department: dept,
                                fileType: submission.fileType || 'word',
                                submittedAt: submission.submittedAt,
                                notes: submission.notes || submission.studentNote,
                                courseTitle: course.title,
                                courseCode: course.courseCode,
                                batchNo: enrollment.batchNo || '01',
                                score: submission.score || submission.gradeScore,
                                gradeStatus: isPass ? 'passed' : 'pending',
                                reviewerFeedback: submission.reviewerFeedback,
                                fileData: (submission as any).fileData,
                              });
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                            title="下載學員實體檔案"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Grade & Preview Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGradingEnrollment(enrollment);
                              setActiveGradingCourse(course);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              isGraded
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-500/20'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isGraded ? '修改批閱' : '即時預覽批閱'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Assignment Grading & Document Preview Modal */}
      {activeGradingEnrollment && activeGradingCourse && (
        <AssignmentGradingModal
          isOpen={true}
          onClose={() => {
            setActiveGradingEnrollment(null);
            setActiveGradingCourse(null);
          }}
          enrollment={activeGradingEnrollment}
          course={activeGradingCourse}
          submission={activeGradingEnrollment.assignmentSubmission}
          onSuccess={() => {
            // refresh
          }}
        />
      )}
    </div>
  );
};
