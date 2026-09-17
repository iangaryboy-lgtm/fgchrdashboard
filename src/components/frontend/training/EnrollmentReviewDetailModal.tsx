import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  GraduationCap,
  Calendar,
  Building,
  Award,
  BookOpen,
  MapPin,
  FileText,
  ShieldCheck,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  Send,
  Layers,
  Lock,
  FileLock2,
  Archive,
  Hash,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CourseEnrollment, InternalCourse } from '../../../types';

interface EnrollmentReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: CourseEnrollment | null;
  onApprove?: (id: string, comment: string) => void;
  onReject?: (id: string, comment: string) => void;
}

export const EnrollmentReviewDetailModal: React.FC<
  EnrollmentReviewDetailModalProps
> = ({ isOpen, onClose, enrollment, onApprove, onReject }) => {
  const {
    employees,
    internalCourses,
    employeeLicenses,
    candidates,
    approveEnrollment,
    currentUser,
  } = useApp();

  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !enrollment) return null;

  // Match corresponding employee, course, candidate and licenses
  const applicant = employees.find((e) => e.empNo === enrollment.empNo);
  const course: InternalCourse | undefined = internalCourses.find(
    (c) => c.id === enrollment.courseId
  );
  const applicantLicenses = employeeLicenses.filter(
    (l) => l.empNo === enrollment.empNo
  );
  const candidateInfo = candidates.find((c) => c.empNo === enrollment.empNo);
  const matchedBatch = course?.batches?.find((b) => b.id === enrollment.batchId);

  // Status flags
  const isApproved =
    enrollment.approvalStatus === 'approved' ||
    enrollment.approvalStatus === 'auto_approved';
  const isRejected = enrollment.approvalStatus === 'rejected';
  
  // A form is locked and archived if it has already been approved, rejected, or explicitly marked archived
  const isLockedAndArchived =
    isApproved ||
    isRejected ||
    enrollment.isArchived === true ||
    Boolean(enrollment.completedApprovalAt);

  const isPending = !isLockedAndArchived && (enrollment.approvalStatus === 'pending' || enrollment.listType === 'pending_approval');

  // Quick comments templates for pending review
  const quickComments = [
    '准予參訓，請準時出席並落實課後 SMART 實踐指標。',
    '符合案主管關鍵職能培育路徑，全力支持參訓。',
    '經評估工區現況，同意排開外業行程出席研習。',
    '案場要徑工進正值關鍵期，建議改選次一梯次或線上數位修習。',
  ];

  const handleApprove = () => {
    if (isLockedAndArchived) return;
    setIsSubmitting(true);
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const approverEmpNo =
      currentUser?.employee?.empNo || currentUser?.empNo || 'MGR-001';
    const comment = reviewComment.trim() || '准予參訓，符合案主管關鍵職能培育路徑，全力支持參訓。';

    if (onApprove) {
      onApprove(enrollment.id, comment);
    } else {
      approveEnrollment(enrollment.id, true, approverEmpNo, approverName, comment);
    }

    setActionSuccessMsg('已完成核准簽核並正式歸檔！本表單已轉為唯讀存證狀態。');
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const handleReject = () => {
    if (isLockedAndArchived) return;
    setIsSubmitting(true);
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const approverEmpNo =
      currentUser?.employee?.empNo || currentUser?.empNo || 'MGR-001';
    const comment = reviewComment.trim() || '工程案場排程衝突，請改選其他梯次';

    if (onReject) {
      onReject(enrollment.id, comment);
    } else {
      approveEnrollment(enrollment.id, false, approverEmpNo, approverName, comment);
    }

    setActionSuccessMsg('已完成駁回簽核並歸檔記錄。');
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccessMsg(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300">
              {isLockedAndArchived ? (
                <FileLock2 className="w-5 h-5 text-amber-300" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">
                  課程報名申請審查明細
                </h3>
                {isPending && (
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    待主管簽核
                  </span>
                )}
                {isApproved && (
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-md flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                    已核准參訓 (已歸檔)
                  </span>
                )}
                {isRejected && (
                  <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-md flex items-center gap-1 shadow-2xs">
                    <XCircle className="w-3 h-3" />
                    已駁回申請 (已歸檔)
                  </span>
                )}
                {isLockedAndArchived && (
                  <span className="px-2 py-0.5 bg-white/15 text-slate-200 text-[10px] font-bold rounded-md flex items-center gap-1 border border-white/20">
                    <Lock className="w-2.5 h-2.5 text-amber-300" />
                    唯讀封存
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                報名流水號：{enrollment.id} · 申請時間：{enrollment.enrolledAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* ARCHIVED / LOCKED PROMINENT BANNER (If already reviewed & archived) */}
          {isLockedAndArchived && (
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-700 flex items-start gap-3 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                    已簽核完成並歸檔表單（不可再修改）
                  </h5>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                    ARCHIVED-READONLY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  本申請單已於{' '}
                  <strong className="text-white font-semibold">
                    {enrollment.approvedAt || enrollment.completedApprovalAt || '2026-08-08 14:30'}
                  </strong>{' '}
                  由主管完成審查簽核並正式歸檔。依企業簽核規範，已封存為唯讀憑證紀錄，不可再變更簽核結果或修改內容。
                </p>
              </div>
            </div>
          )}

          {/* Section 1: 申請同仁個人資歷檔案卡 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {enrollment.empName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      {enrollment.empName}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {enrollment.empNo}
                    </span>
                    {candidateInfo && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        案主管候選人 (儲備梯隊)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {enrollment.department} · {enrollment.section || '工務部'} · {enrollment.title} (職等：{enrollment.rank || applicant?.rank || '06'})
                  </p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block font-semibold">到職年資</span>
                <span className="font-bold text-slate-700">
                  {applicant?.seniorityStartDate
                    ? `${applicant.seniorityStartDate} 到職`
                    : '歷練滿 5 年'}
                </span>
              </div>
            </div>

            {/* Applicant Licenses & Skill Badges */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                同仁目前持有之專業資格與法定證照：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {applicantLicenses.length > 0 ? (
                  applicantLicenses.map((lic) => (
                    <span
                      key={lic.id}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <Award className="w-3 h-3 text-amber-500" />
                      {lic.licenseName}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    已具備工務基礎專業歷練，持續修習累積高階案主管必修學分中
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: 研習課程與梯次詳細規格 */}
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-bold">
                    {course?.category || enrollment.trainingCategory || '專業技術'}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {course?.courseCode || 'TR-ENG-2026'}
                  </span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-md text-[10px] font-semibold border border-blue-200">
                    {course?.deliveryMode === 'in_person'
                      ? '實體面授'
                      : course?.deliveryMode === 'online'
                      ? '線上數位'
                      : '混成教學'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-1.5">
                  {enrollment.courseTitle || course?.title}
                </h4>
              </div>

              <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                <span className="text-[10px] text-slate-400 block font-semibold">培訓時數 / 學分</span>
                <span className="text-sm font-black text-blue-700">
                  {course?.hours || 8} 小時 / {course?.credits || 2} 學分
                </span>
              </div>
            </div>

            {/* Batch & Instructor info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-blue-200/60 text-slate-700">
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-semibold">報名梯次</span>
                <span className="font-bold text-slate-900">
                  {enrollment.batchNo || matchedBatch?.batchName || '第 01 梯次'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-semibold">授課講師</span>
                <span className="font-bold text-slate-900">
                  {course?.instructorName || '內部資深副總 / 專業技師'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-semibold">開課日期與時段</span>
                <span className="font-bold text-slate-900">
                  {matchedBatch?.startDate || '2026-10-15'} ({matchedBatch?.startTime || '09:00'} ~ {matchedBatch?.endTime || '17:00'})
                </span>
              </div>
            </div>

            {/* Location & Quota */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  <strong>上課地點：</strong>
                  {matchedBatch?.location || '遠雄營造總部 12F 第一訓練教室'}
                </span>
              </div>
              <div>
                <strong>報名席次現況：</strong>
                <span className="text-emerald-700 font-bold ml-1">
                  正取 {matchedBatch?.maxParticipants ? `${matchedBatch.maxParticipants - 3}/${matchedBatch.maxParticipants}` : '名額充裕'}
                </span>
              </div>
            </div>

            {/* Course Outcomes & Description */}
            {course?.description && (
              <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">課程大綱與培訓目標：</span>
                <p className="leading-relaxed bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  {course.description}
                </p>
              </div>
            )}
          </div>

          {/* Section 3: 報名動機與申報資訊 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                報名性質與動機說明
              </span>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                {enrollment.enrollmentType === 'assigned_mandatory'
                  ? '主管指派 (必修培訓)'
                  : '同仁自主選課報名'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              {enrollment.enrollmentType === 'assigned_mandatory'
                ? '此課程為公司案主管晉升核心職能地圖所列之必修項目，由主管或人資主動納入年度學習計畫。'
                : '同仁主動申請修習本梯次專業課程，以強化個人在現場工務管理、品管查核與跨包商介面協調之實務能力。'}
            </div>
          </div>

          {/* Section 4: 簽核歷程 / 主管審查作業區 */}
          <div
            className={`p-4 rounded-2xl border space-y-3.5 ${
              isLockedAndArchived
                ? 'bg-slate-100/90 border-slate-300'
                : 'bg-amber-50/80 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4
                className={`font-black flex items-center gap-1.5 ${
                  isLockedAndArchived ? 'text-slate-900' : 'text-amber-950'
                }`}
              >
                {isLockedAndArchived ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    主管簽核決策紀錄與電子存證（已歸檔唯讀）
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    主管簽核審查紀錄與批核作業
                  </>
                )}
              </h4>
              <span
                className={`text-[10px] font-bold ${
                  isLockedAndArchived ? 'text-slate-500' : 'text-amber-800'
                }`}
              >
                審核單位：直屬專案主管 / 部門主管
              </span>
            </div>

            {/* Case A: Already locked and archived -> Display official signed audit record only */}
            {isLockedAndArchived ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">
                        簽核審查結果
                      </span>
                      <span
                        className={`font-black text-xs ${
                          isApproved ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isApproved ? '✅ 已核准參訓 (通過簽核)' : '❌ 已駁回申請 (未通過)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">
                        簽核主管
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {enrollment.approverName || '陳冠霖 經理'}{' '}
                        <span className="text-slate-400 font-mono text-[10px]">
                          ({enrollment.approverEmpNo || 'FG1001'})
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">
                        簽核時間戳記
                      </span>
                      <span className="font-mono text-slate-700 text-xs font-semibold">
                        {enrollment.approvedAt ||
                          enrollment.completedApprovalAt ||
                          '2026-08-08 14:30'}
                      </span>
                    </div>
                  </div>

                  {/* Comment & Feedback display */}
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      主管簽核核決意見與評語：
                    </span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium leading-relaxed">
                      💬「
                      {enrollment.approverComment ||
                        (isApproved
                          ? '准予參訓，符合高階案主管關鍵工法必修路徑，請準時出席並落實課後 SMART 實踐指標。'
                          : '工程案場排程衝突，請改選其他梯次。')}
                      」
                    </div>
                  </div>
                </div>

                {/* Audit Security & Non-tamper Notice */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/70 px-3 py-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>
                      存證防偽編號：
                      <strong className="font-mono text-slate-700">
                        SIGN-{enrollment.id.toUpperCase()}-VERIFIED-SEALED
                      </strong>
                    </span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    歸檔狀態：已鎖定存查 (不可修改)
                  </span>
                </div>
              </div>
            ) : (
              /* Case B: Pending Review -> Display comment input & action buttons */
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    主管簽核審核意見 / 備註：
                  </label>

                  {/* Quick comment chips */}
                  <div className="flex flex-wrap gap-1">
                    {quickComments.map((qc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewComment(qc)}
                        className="px-2 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 text-slate-700 text-[10px] font-medium rounded-lg text-left transition-colors"
                      >
                        + {qc}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="請輸入簽核說明或給予同仁之學習期許..."
                    className="w-full px-3.5 py-2 bg-white border border-amber-300/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                {/* Action Success Toast */}
                {actionSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {actionSuccessMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {isLockedAndArchived ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>本表單已完成簽核歸檔，處於唯讀存證狀態</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
            >
              暫時關閉
            </button>
          )}

          {isLockedAndArchived ? (
            /* Locked state: Only close button */
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black shadow-xs transition-colors"
            >
              關閉明細
            </button>
          ) : (
            /* Pending state: Show Reject and Approve buttons */
            <div className="flex items-center gap-2.5">
              {/* Reject button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                駁回報名申請
              </button>

              {/* Approve button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    核准參訓 (通過簽核並歸檔)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
