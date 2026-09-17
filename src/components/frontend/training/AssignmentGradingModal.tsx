import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Building,
  Cloud,
  ExternalLink,
  Download,
  Eye,
  Star,
  Send,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
  Image as ImageIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import {
  CourseEnrollment,
  InternalCourse,
  CourseAssignmentSubmission,
  CourseAssignmentConfig,
  AssignmentFileType,
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import { downloadAssignmentFile } from '../../../utils/assignmentDownloadHelper';
import { updateAssignmentGradingInFirestore } from '../../../services/assignmentStorageService';

interface AssignmentGradingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  enrollment: CourseEnrollment;
  course: InternalCourse;
  submission?: CourseAssignmentSubmission;
  onGraded?: (updatedSubmission: CourseAssignmentSubmission) => void;
  onSuccess?: () => void;
}

export const AssignmentGradingModal: React.FC<AssignmentGradingModalProps> = ({
  isOpen = true,
  onClose,
  enrollment,
  course,
  submission,
  onGraded,
  onSuccess,
}) => {
  const { currentUser, instructors, updateEnrollmentProgress } = useApp();

  // Active submission data (fallback to mock if not yet submitted)
  const currentSubmission: CourseAssignmentSubmission = submission ||
    enrollment.assignmentSubmission || {
      id: `sub-${enrollment.id}`,
      enrollmentId: enrollment.id,
      courseId: course.id,
      batchId: enrollment.batchId,
      empNo: enrollment.empNo,
      empName: enrollment.empName,
      department: enrollment.department,
      submittedAt: new Date().toISOString(),
      fileName: 'BIM_4D_施工排程要徑模擬與分包商排程檢討報告_陳冠霖.xlsx',
      fileSize: '4.8 MB',
      fileType: 'excel',
      fileUrl: 'https://farglory-my.sharepoint.com/:x:/r/personal/eng_farglory_com/Documents/2026-Assignments/BIM_4D_Report.xlsx',
      oneDriveSavedPath: course.assignmentConfig?.oneDriveFolderPath || 'OneDrive://建築工程處/專業訓練作業/2026/TR-ENG-01/BIM_4D_Report.xlsx',
      oneDriveSyncStatus: 'synced',
      studentNote: '已依據課堂所學之 CPM 要徑法與 4D 施工模擬規範，重新計算連續壁與逆打鋼柱之自由寬裕度，並提出 3 項要徑壓縮方案。',
      status: 'submitted',
    };

  const config: CourseAssignmentConfig = course.assignmentConfig || {
    enabled: true,
    title: '【實務專題作業】施工要徑排程與要徑壓縮策略分析報告',
    description: '請依據目前案場施工階段，運用 CPM 關鍵要徑法進行進度排程模擬，並繳交分析報告或試算表。',
    gradingType: 'score_100',
    passingScore: 70,
    allowedFileTypes: ['word', 'excel', 'powerpoint', 'pdf', 'image'],
    reviewerEmpNo: course.instructorId || 'FG1001',
    reviewerName: course.instructorName || '陳冠霖 經理',
    reviewerRole: '授課講師 / 專業審查人',
    oneDriveFolderPath: 'OneDrive://建築工程處/專業訓練作業/2026/TR-ENG-2026-01/',
    dueDateDaysAfterCourse: 14,
    isRequiredForCompletion: true,
  };

  // Reviewer Info
  const reviewerName =
    currentUser?.employee?.name || currentUser?.name || config.reviewerName || '陳冠霖 經理';
  const reviewerEmpNo =
    currentUser?.employee?.empNo || currentUser?.empNo || config.reviewerEmpNo || 'FG1001';

  // State for grading
  const [gradeStatus, setGradeStatus] = useState<
    'graded_pass' | 'graded_fail' | 'graded_score' | 'returned_for_revision'
  >(
    currentSubmission.status === 'submitted'
      ? config.gradingType === 'score_100'
        ? 'graded_score'
        : 'graded_pass'
      : (currentSubmission.status as any)
  );

  const [score, setScore] = useState<number>(
    currentSubmission.score ?? (config.passingScore ? Math.max(88, config.passingScore) : 88)
  );

  const [reviewerFeedback, setReviewerFeedback] = useState<string>(
    currentSubmission.reviewerFeedback ||
      '該作業論述詳盡，CPM 關鍵要徑計算精確，並針對連續壁開挖與分包商出工瓶頸提出具體之施工排程因應對策，實務可行性極高，符合考核標準。'
  );

  // Rubric Checklist state
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    r1: 35, // 核心工法與理論正確性 (滿分 35)
    r2: 30, // 案場實務應用與數據完整性 (滿分 30)
    r3: 25, // 解決方案與效益評估 (滿分 25)
    r4: 10, // 格式規範與排版 (滿分 10)
  });

  // Preview interactive state
  const [activeSheetTab, setActiveSheetTab] = useState<'sheet1' | 'sheet2' | 'sheet3'>('sheet1');
  const [activePptSlide, setActivePptSlide] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveGrading = () => {
    setIsSubmitting(true);
    const isPass =
      config.gradingType === 'score_100'
        ? score >= (config.passingScore || 70)
        : gradeStatus === 'graded_pass';

    const updated: CourseAssignmentSubmission = {
      ...currentSubmission,
      status: gradeStatus,
      score: config.gradingType === 'score_100' ? score : undefined,
      passed: isPass,
      reviewedAt: new Date().toISOString(),
      reviewerEmpNo,
      reviewerName,
      reviewerFeedback,
      rubricScores,
    };

    // Update enrollment in AppContext
    updateEnrollmentProgress(enrollment.id, {
      assignmentSubmitted: true,
      assignmentPassed: isPass,
      assignmentScore: config.gradingType === 'score_100' ? score : undefined,
      assignmentSubmission: updated,
      // Check if all passing criteria met
      finalPassStatus: isPass ? 'passed' : enrollment.finalPassStatus,
    });

    // Save to Firestore Storage Service
    if (currentSubmission.id) {
      updateAssignmentGradingInFirestore(currentSubmission.id, {
        gradeScore: config.gradingType === 'score_100' ? score : undefined,
        gradeResult: isPass ? 'pass' : 'fail',
        status: gradeStatus,
        gradeStatus: 'graded',
        reviewerFeedback,
        rubricScores,
        reviewerName,
        reviewerEmpNo,
      }).catch((err) => console.warn('Firestore grade update:', err));
    }

    if (onGraded) {
      onGraded(updated);
    }
    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      setIsSubmitting(false);
      alert(`已成功完成作業批閱！\n學員：${enrollment.studentName || enrollment.empName}\n評定結果：${isPass ? '合格通過' : '未通過'}${config.gradingType === 'score_100' ? ` (${score} 分)` : ''}`);
      onClose();
    }, 400);
  };

  const detectedFileType: AssignmentFileType = currentSubmission.fileType || 'excel';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <FileCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                  {course.courseCode} · 作業批閱
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  {enrollment.batchNo || '第一梯次'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  OneDrive 雲端即時預覽
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {config.title || course.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Submission Meta Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">繳交學員：</span>
              <strong className="text-slate-900 font-bold">
                {enrollment.empName} ({enrollment.empNo})
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">所屬單位：</span>
              <span className="text-slate-800 font-medium">
                {enrollment.department} · {enrollment.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">繳交時間：</span>
              <span className="text-slate-800 font-mono">
                {currentSubmission.submittedAt?.replace('T', ' ').slice(0, 16)}
              </span>
            </div>
          </div>

          {/* OneDrive Cloud Saved Path Tag */}
          <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-[11px] font-medium">
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            <span>OneDrive 儲存路徑：</span>
            <code className="font-mono text-sky-950 text-[10px] bg-sky-100/70 px-1.5 py-0.5 rounded">
              {currentSubmission.oneDriveSavedPath}
            </code>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="雲端同步正常" />
          </div>
        </div>

        {/* Modal Main Content: Split Grid (Left: Full Document Preview, Right: Grading & Feedback Panel) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ================= LEFT: DOCUMENT PREVIEW (7 COLS) ================= */}
          <div className="lg:col-span-7 p-5 flex flex-col bg-slate-900/5 space-y-4">
            {/* Document Header & Toolbar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl text-white ${
                    detectedFileType === 'excel'
                      ? 'bg-emerald-600'
                      : detectedFileType === 'powerpoint'
                      ? 'bg-orange-600'
                      : detectedFileType === 'word'
                      ? 'bg-blue-600'
                      : detectedFileType === 'pdf'
                      ? 'bg-rose-600'
                      : 'bg-indigo-600'
                  }`}
                >
                  {detectedFileType === 'excel' ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : detectedFileType === 'powerpoint' ? (
                    <Presentation className="w-5 h-5" />
                  ) : detectedFileType === 'word' ? (
                    <FileText className="w-5 h-5" />
                  ) : detectedFileType === 'pdf' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate max-w-sm">
                    {currentSubmission.fileName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>檔案大小：{currentSubmission.fileSize}</span>
                    <span>·</span>
                    <span className="uppercase font-bold text-slate-700">
                      {detectedFileType}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      已通過 OneDrive 安全掃描
                    </span>
                  </div>
                </div>
              </div>

              {/* View/Download Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={currentSubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  title="在 Microsoft 365 開啟"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  365 開啟
                </a>
                <button
                  type="button"
                  onClick={() => {
                    downloadAssignmentFile({
                      fileName: currentSubmission.fileName,
                      studentName: enrollment.studentName || enrollment.empName || '學員',
                      empNo: enrollment.empNo || 'FG1001',
                      department: enrollment.department || '建築工程處',
                      fileType: (currentSubmission.fileType as any) || 'word',
                      submittedAt: currentSubmission.submittedAt,
                      notes: currentSubmission.notes || currentSubmission.studentNote,
                      courseTitle: course.title,
                      courseCode: course.courseCode,
                      batchNo: enrollment.batchNo || '01',
                    });
                  }}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  title="下載學員作業實體檔案"
                >
                  <Download className="w-3.5 h-3.5" />
                  下載實體作業檔
                </button>
              </div>
            </div>

            {/* Student Submission Note / Preface */}
            {currentSubmission.studentNote && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
                <span className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  學員繳交備註與心得說明：
                </span>
                <p className="leading-relaxed text-slate-700">
                  {currentSubmission.studentNote}
                </p>
              </div>
            )}

            {/* Render High-Fidelity Document Preview according to File Type */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden min-h-[420px]">
              {/* EXCEL PREVIEW */}
              {detectedFileType === 'excel' && (
                <div className="flex-1 flex flex-col">
                  {/* Sheet Tabs */}
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setActiveSheetTab('sheet1')}
                      className={`px-3 py-1 rounded-t-lg font-bold transition-colors ${
                        activeSheetTab === 'sheet1'
                          ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      1. CPM要徑工期推算表
                    </button>
                    <button
                      onClick={() => setActiveSheetTab('sheet2')}
                      className={`px-3 py-1 rounded-t-lg font-bold transition-colors ${
                        activeSheetTab === 'sheet2'
                          ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      2. 連續壁監測沉陷數據
                    </button>
                    <button
                      onClick={() => setActiveSheetTab('sheet3')}
                      className={`px-3 py-1 rounded-t-lg font-bold transition-colors ${
                        activeSheetTab === 'sheet3'
                          ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      3. 分包商出工人力平衡表
                    </button>
                  </div>

                  {/* Sheet Grid Table Content */}
                  <div className="flex-1 p-3 overflow-x-auto text-[11px]">
                    {activeSheetTab === 'sheet1' && (
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-emerald-50/80 text-emerald-950 font-bold border-b border-emerald-200">
                            <th className="p-2 border border-slate-200">作業項目代碼</th>
                            <th className="p-2 border border-slate-200">作業說明</th>
                            <th className="p-2 border border-slate-200 text-center">預估工期(天)</th>
                            <th className="p-2 border border-slate-200 text-center">最早開始 (ES)</th>
                            <th className="p-2 border border-slate-200 text-center">最遲完成 (LF)</th>
                            <th className="p-2 border border-slate-200 text-center">總寬裕 (TF)</th>
                            <th className="p-2 border border-slate-200 text-center">是否為關鍵要徑</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="bg-red-50/40 font-bold text-red-900">
                            <td className="p-2 border border-slate-200 font-mono">ACT-01</td>
                            <td className="p-2 border border-slate-200">連續壁導溝放樣與施作</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">14</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 1</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 14</td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-red-600 font-bold">0</td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">★ 是 (要徑)</span>
                            </td>
                          </tr>
                          <tr className="bg-red-50/40 font-bold text-red-900">
                            <td className="p-2 border border-slate-200 font-mono">ACT-02</td>
                            <td className="p-2 border border-slate-200">第一層土方開挖及第一階支撐</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">21</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 15</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 35</td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-red-600 font-bold">0</td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">★ 是 (要徑)</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-mono">ACT-03</td>
                            <td className="p-2 border border-slate-200">觀測系統水位計與傾度管埋設</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">7</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 10</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 25</td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-emerald-600 font-bold">8</td>
                            <td className="p-2 border border-slate-200 text-center text-slate-400">否 (非要徑)</td>
                          </tr>
                          <tr className="bg-red-50/40 font-bold text-red-900">
                            <td className="p-2 border border-slate-200 font-mono">ACT-04</td>
                            <td className="p-2 border border-slate-200">第二層深開挖與逆打鋼柱吊裝</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">28</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 36</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 63</td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-red-600 font-bold">0</td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">★ 是 (要徑)</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-mono">ACT-05</td>
                            <td className="p-2 border border-slate-200">降水抽水井試運轉與水壓觀測</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">10</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 20</td>
                            <td className="p-2 border border-slate-200 text-center font-mono">Day 40</td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-emerald-600 font-bold">10</td>
                            <td className="p-2 border border-slate-200 text-center text-slate-400">否 (非要徑)</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {activeSheetTab === 'sheet2' && (
                      <div className="space-y-3 p-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                            <span className="text-[10px] text-slate-500 block">沉陷警戒值</span>
                            <strong className="text-sm font-bold text-slate-900 font-mono">-25.0 mm</strong>
                          </div>
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                            <span className="text-[10px] text-emerald-700 block">現場實測最大值</span>
                            <strong className="text-sm font-bold text-emerald-900 font-mono">-11.4 mm</strong>
                          </div>
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <span className="text-[10px] text-blue-700 block">安全係數判讀</span>
                            <strong className="text-sm font-bold text-blue-900">安全 (FS &gt; 2.1)</strong>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          監測點 SM-01 ~ SM-08 連續7日沉陷速率維持於 0.2mm/day 以下，符合開挖安全管制指標。
                        </p>
                      </div>
                    )}

                    {activeSheetTab === 'sheet3' && (
                      <div className="p-3 text-xs text-slate-700 space-y-2">
                        <p className="font-bold text-slate-900">分包商出工規劃平衡與工時分析：</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>鋼構組裝工班：常態出工 12 人 / 每日，預估作業工時 288 工時。</li>
                          <li>土方開挖卡車清運：日均 45 車次，搭配洗車台自動感應沖洗設備。</li>
                          <li>安全支撐施加預力：每階支撐預力施加至設計值 80% 並記錄油壓表數據。</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WORD / PDF PREVIEW */}
              {(detectedFileType === 'word' || detectedFileType === 'pdf') && (
                <div className="flex-1 p-6 space-y-4 text-xs text-slate-800 leading-relaxed overflow-y-auto">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-sm font-black text-slate-900">
                      【專題報告】深開挖工法關鍵界面管理與工期壓縮方案實務分析
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                      撰寫同仁：{enrollment.empName} · 繳交梯次：{enrollment.batchNo || '第一梯次'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs bg-slate-100 p-1.5 rounded">
                      一、工程背景與開挖現況說明
                    </h3>
                    <p className="text-slate-700">
                      本案場位於新北市精華區，周邊臨近捷運線與既有老舊住宅，開挖深度達地下五層 (GL -18.5m)，採用連續壁厚度 90cm 搭配五階安全支撐系統。要徑作業緊扣於第三階與第四階開挖時程。
                    </p>

                    <h3 className="font-bold text-slate-900 text-xs bg-slate-100 p-1.5 rounded">
                      二、要徑工期壓縮與關鍵防護策略
                    </h3>
                    <p className="text-slate-700">
                      1. <strong>雙斜撐模組化預組裝</strong>：於地面層完成預力支撐組裝，節省基坑內部吊裝鎖固時間約 4 個工作天。
                    </p>
                    <p className="text-slate-700">
                      2. <strong>自動化連續壁水壓與位移監測</strong>：導入 IoT 連續感測，遇警報即時通知，避免傳統人工測讀之延宕。
                    </p>
                  </div>
                </div>
              )}

              {/* PPT PREVIEW */}
              {detectedFileType === 'powerpoint' && (
                <div className="flex-1 flex flex-col">
                  <div className="bg-slate-800 text-white p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span className="font-mono">Slide {activePptSlide} / 4</span>
                        <span className="text-orange-400 font-bold">BIM 4D 專題簡報</span>
                      </div>
                      {activePptSlide === 1 && (
                        <div className="space-y-2 py-6 text-center">
                          <h2 className="text-base font-black text-white">
                            BIM 4D 施工排程要徑模擬與界面整合
                          </h2>
                          <p className="text-xs text-slate-300">
                            報告人：{enrollment.empName} ({enrollment.department})
                          </p>
                        </div>
                      )}
                      {activePptSlide === 2 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-amber-400">
                            4D 碰撞檢討與工序干涉排除
                          </h3>
                          <ul className="text-xs text-slate-200 space-y-1.5 pl-4 list-disc">
                            <li>塔吊迴轉半徑與鄰房高壓電線防護安全距離分析</li>
                            <li>地下室逆打鋼柱與樑鋼筋穿束碰撞點共 24 處預先調整</li>
                          </ul>
                        </div>
                      )}
                      {activePptSlide >= 3 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-emerald-400">
                            工期與成本效益評估
                          </h3>
                          <p className="text-xs text-slate-200">
                            透過預先排程模擬，預估可降低現場打鑿返工率 85%，縮短關鍵工期 12 工作天。
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-700 pt-3 mt-4">
                      <button
                        onClick={() => setActivePptSlide((p) => Math.max(1, p - 1))}
                        disabled={activePptSlide === 1}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs rounded-lg"
                      >
                        上一頁
                      </button>
                      <span className="text-xs text-slate-400">
                        簡報投影片預覽
                      </span>
                      <button
                        onClick={() => setActivePptSlide((p) => Math.min(4, p + 1))}
                        disabled={activePptSlide === 4}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs rounded-lg"
                      >
                        下一頁
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGE PREVIEW */}
              {detectedFileType === 'image' && (
                <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-100">
                  <div className="w-full max-h-72 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-300">
                    <div className="text-center p-6 text-white space-y-2">
                      <ImageIcon className="w-12 h-12 mx-auto text-blue-400" />
                      <p className="text-xs font-bold">{currentSubmission.fileName}</p>
                      <p className="text-[10px] text-slate-300">案場深開挖現場量測與施工記錄照片 (高解析)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT: REVIEW & GRADING ACTION PANEL (5 COLS) ================= */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-5 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileCheckIcon className="w-4 h-4 text-blue-600" />
                  批閱評核與回饋意見
                </h4>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  評分制：{config.gradingType === 'score_100' ? '百分制 (0~100)' : '通過 / 不通過 (合格制)'}
                </span>
              </div>

              {/* Designated Reviewer Tag */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {reviewerName.slice(0, 1)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">指定批閱人</span>
                    <strong className="text-slate-900 font-bold">{reviewerName}</strong>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                  {config.reviewerRole || '授課講師 / 專任審查'}
                </span>
              </div>

              {/* Grading Status Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  批閱核定結果：
                </label>
                {config.gradingType === 'pass_fail' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGradeStatus('graded_pass')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        gradeStatus === 'graded_pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      合格通過
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeStatus('graded_fail')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        gradeStatus === 'graded_fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      未達標準
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeStatus('returned_for_revision')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        gradeStatus === 'returned_for_revision'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      退回重修
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-950">
                          百分制評定得分 (及格標準：{config.passingScore || 70}分)：
                        </span>
                        <span className="text-lg font-black font-mono text-blue-700">
                          {score} <span className="text-xs font-normal">分</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex items-center justify-between text-[10px] text-blue-600 font-semibold">
                        <span>0分</span>
                        <span>及格標準 {config.passingScore || 70}分</span>
                        <span>100分</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rubrics Criteria Breakdown */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block">
                  各項專業指標評分 (Rubrics)：
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">1. CPM理論推導與數據準確度</span>
                    <strong className="font-mono text-slate-900">{rubricScores.r1} / 35</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">2. 案場深開挖實務應用度</span>
                    <strong className="font-mono text-slate-900">{rubricScores.r2} / 30</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">3. 要徑壓縮對策與效益分析</span>
                    <strong className="font-mono text-slate-900">{rubricScores.r3} / 25</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">4. 報告格式與排版規範</span>
                    <strong className="font-mono text-slate-900">{rubricScores.r4} / 10</strong>
                  </div>
                </div>
              </div>

              {/* Reviewer Feedback Comment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  講師批閱評語與輔導建議：
                </label>
                <textarea
                  value={reviewerFeedback}
                  onChange={(e) => setReviewerFeedback(e.target.value)}
                  rows={4}
                  placeholder="請輸入給予同仁之實務評語、優點與建議精進方向..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                取消關閉
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveGrading}
                className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? '批閱送出中...' : '核定並送出批閱結果'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
