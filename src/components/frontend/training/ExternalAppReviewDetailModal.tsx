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
  Archive,
  Hash,
  Briefcase,
  DollarSign,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ExternalCourseApplication } from '../../../types';

interface ExternalAppReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ExternalCourseApplication | null;
  onApprove?: (id: string, comment?: string) => void;
  onReject?: (id: string, comment?: string) => void;
}

export const ExternalAppReviewDetailModal: React.FC<
  ExternalAppReviewDetailModalProps
> = ({ isOpen, onClose, application, onApprove, onReject }) => {
  const {
    employees,
    approveExternalApplication,
    currentUser,
  } = useApp();

  const [reviewComment, setReviewComment] = useState('');
  const [approvedGrantAmount, setApprovedGrantAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !application) return null;

  const applicant = employees.find((e) => e.empNo === application.empNo);
  const isApproved = application.approvalStatus === 'approved';
  const isRejected = application.approvalStatus === 'rejected';
  const isPending = application.approvalStatus === 'pending';

  // Quick comments templates
  const quickComments = [
    '符合案場專業工程實務需求，核准公差派訓並全額補助學費。',
    '同意申請，受訓完畢請於 14 日內提交受訓心得報告並辦理費用核銷。',
    '配合公司 ESG 永續建築與專案認證方針，全力支持參訓。',
    '經評估現階段案場工進與培訓預算，建議改採線上自修或次年度再行申報。',
  ];

  const handleApprove = () => {
    setIsSubmitting(true);
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const comment = reviewComment.trim() || '符合案場專業工程實務需求，核准公差派訓並全額補助學費。';

    if (onApprove) {
      onApprove(application.id, comment);
    } else {
      approveExternalApplication(application.id, true, approverName);
    }

    setActionSuccessMsg('已完成外訓補助與公差核准簽核！');
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccessMsg(null);
      onClose();
    }, 900);
  };

  const handleReject = () => {
    setIsSubmitting(true);
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';
    const comment = reviewComment.trim() || '工期排程衝突，暫緩派訓';

    if (onReject) {
      onReject(application.id, comment);
    } else {
      approveExternalApplication(application.id, false, approverName);
    }

    setActionSuccessMsg('已完成駁回簽核！');
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccessMsg(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  外部機構研習與公差補助審核單
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  單號：EXT-{application.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                {application.courseName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-600 text-white px-6 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-150 shrink-0">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Badge Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">表單狀態：</span>
              {isPending && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  待主管審核 (審批中)
                </span>
              )}
              {isApproved && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已核准補助 (公差派訓)
                </span>
              )}
              {isRejected && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  已駁回申請
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>呈報時間：{application.appliedAt}</span>
              {application.approvedAt && <span>· 核定時間：{application.approvedAt}</span>}
              {application.approverName && <span>· 審核主管：{application.approverName}</span>}
            </div>
          </div>

          {/* Section 1: 申請同仁基本資料 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              申請同仁基本資料
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">同仁姓名 / 工號</span>
                <span className="text-sm font-bold text-slate-900">
                  {application.empName} ({application.empNo})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">所屬部門 / 科案</span>
                <span className="text-sm font-bold text-slate-900">
                  {application.department} {applicant?.section ? `· ${applicant.section}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">職稱 / 職等 / 屬性</span>
                <span className="text-sm font-bold text-slate-900">
                  {application.title} · {applicant?.rank || '06'}職等 · {applicant?.attribute || '內業'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">年度外訓補助剩餘額度</span>
                <span className="text-sm font-bold text-emerald-600">
                  $30,000 / $30,000 (充裕)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 外訓課程與機構詳情 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              外訓機構與研習資訊
            </h3>
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">開課機構 / 授權單位</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4 text-purple-600" />
                    {application.provider}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">訓練類別 / 領域</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {application.trainingCategory || '專業工程技術 / ESG 永續建築'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">受訓起訖日期</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    {application.startDate} ~ {application.endDate}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">總研習時數</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {application.hours} 小時 (約 {Math.ceil((application.hours || 8) / 8)} 工作天)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">請假假別</span>
                  <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    公差假 (派訓全薪)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 費用補助明細與核定 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              費用補助預算與核銷項目
            </h3>
            <div className="bg-purple-50/40 p-4 sm:p-5 rounded-2xl border border-purple-200/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-600">申請補助全額：</span>
                  <span className="text-xl font-black text-purple-900 ml-1">
                    NT$ {application.fee?.toLocaleString() || 0} 元
                  </span>
                  <span className="text-xs text-purple-700 ml-2 font-medium">
                    (含報名費、課程教材與認證測驗費)
                  </span>
                </div>
                <div className="text-xs font-semibold bg-white px-3 py-1.5 rounded-xl border border-purple-200 text-purple-800 shadow-2xs">
                  核銷依據：完訓取得結訓證書與發票後，檢據辦理公帳核銷
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: 參訓原因與效益評估 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              申請原因、工程案場關聯與預期效益
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                <strong className="text-slate-900">【申請說明與動機】：</strong>
                {application.reason || '配合工程案場關鍵技術引進與總部永續方針，精進現場專業管理能力。'}
              </p>
              <p>
                <strong className="text-slate-900">【結訓承諾與技術移轉】：</strong>
                完訓後將於部室月會舉辦 30 分鐘技術分享，並將關鍵管理表單範本回饋至工務知識庫。
              </p>
            </div>
          </div>

          {/* Section 5: 主管簽核決策與評語 (若未核決或檢視中) */}
          {isPending && (
            <div className="space-y-3 p-5 rounded-2xl bg-amber-50/50 border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  主管審核意見與核決評語
                </h3>
                <span className="text-[11px] text-amber-700 font-medium">
                  可快速點選下方範本或自行輸入
                </span>
              </div>

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickComments.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReviewComment(t)}
                    className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-700 border border-amber-200/80 transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="請輸入主管簽核審查意見（例如：核准全額補助派訓、要求完訓後繳交心得與發票等）..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            關閉檢視
          </button>

          {isPending ? (
            <div className="flex items-center gap-3">
              <button
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 active:scale-95 disabled:opacity-50"
              >
                駁回申請
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleApprove}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                核准外訓與費用補助
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              本表單已完成審核程序
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
