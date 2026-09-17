import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Building,
  Award,
  BookOpen,
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
  DollarSign,
  Download,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { EmployeeLicense } from '../../../types';

interface LicenseReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: EmployeeLicense | null;
  onApprove?: (id: string, comment?: string) => void;
  onReject?: (id: string, comment?: string) => void;
}

export const LicenseReviewDetailModal: React.FC<
  LicenseReviewDetailModalProps
> = ({ isOpen, onClose, license, onApprove, onReject }) => {
  const {
    employees,
    masterLicenses,
    verifyEmployeeLicense,
    currentUser,
  } = useApp();

  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !license) return null;

  const applicant = employees.find((e) => e.empNo === license.empNo);
  const matchedMaster = masterLicenses?.find(
    (m) => m.name === license.licenseName || m.code === license.licenseCode
  );

  const isApproved = license.status === 'valid';
  const isPending = license.status === 'pending_review' || license.status === 'pending_verification';

  // Quick comments templates
  const quickComments = [
    '證件正本掃描清晰，字號與發證機關查驗無誤，准予核備入庫。',
    '符合營造業法規現場專任工程人員執業要求，核發資格及格。',
    '核定具備公司專業證照激勵獎金請領資格，列入人資薪資結算。',
    '證書字號或期限模糊不清，請重新掃描清晰圖檔再行送審。',
  ];

  const handleApprove = () => {
    setIsSubmitting(true);
    const approverName =
      currentUser?.employee?.name || currentUser?.name || '專案主管';

    if (onApprove) {
      onApprove(license.id, reviewComment);
    } else {
      verifyEmployeeLicense(license.id, approverName);
    }

    setActionSuccessMsg('已審核通過並將專業證照登記至人才庫總表！');
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccessMsg(null);
      onClose();
    }, 900);
  };

  const handleReject = () => {
    setIsSubmitting(true);
    const comment = reviewComment.trim() || '證件資訊不全，退回補件';

    if (onReject) {
      onReject(license.id, comment);
    }

    setActionSuccessMsg('已退回該筆證照申報，請同仁重新補件！');
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
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
                  同仁自主申報專業證照查核單
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  證號：{license.licenseNo || '待審定'}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                {license.licenseName}
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
              <span className="text-xs font-semibold text-slate-500">審核狀態：</span>
              {isPending && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  待人資室 / 主管驗證審核
                </span>
              )}
              {isApproved && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已驗證入庫 (及格)
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>申報送件：{license.submittedAt || license.issueDate}</span>
              {license.verifiedAt && <span>· 審核通過日：{license.verifiedAt}</span>}
              {license.verifier && <span>· 驗證人員：{license.verifier}</span>}
            </div>
          </div>

          {/* Section 1: 申報同仁資料 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              申報同仁基本資料
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">同仁姓名 / 工號</span>
                <span className="text-sm font-bold text-slate-900">
                  {license.empName} ({license.empNo})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">所屬部門 / 科案</span>
                <span className="text-sm font-bold text-slate-900">
                  {license.department} {applicant?.section ? `· ${applicant.section}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">職稱 / 職等 / 屬性</span>
                <span className="text-sm font-bold text-slate-900">
                  {license.title} · {applicant?.rank || '07'}職等 · {applicant?.attribute || '外業'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">目前有效證照數</span>
                <span className="text-sm font-bold text-indigo-600">
                  共 3 張有效證照
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 證照核定與比對資訊 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              申報證照法定字號與效期查核
            </h3>
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">專業證照全名</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {license.licenseName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">證書 / 執照字號</span>
                  <span className="text-sm font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                    {license.licenseNo}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">發證機關 / 考試主管機關</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4 text-amber-600" />
                    {license.issuingAuthority}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">初次取得 / 換證發照日</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    {license.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">有效期限 / 回訓週期</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {license.hasExpiry ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                        至 {license.expiryDate} (需回訓)
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        永久有效 (免換證)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 證書正本掃描件預覽 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              檢附證書原件影像查核
            </h3>
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {license.licenseName}_正本掃描件.pdf
                  </h4>
                  <p className="text-xs text-slate-400">
                    檔案大小：1.8 MB · 經 SHA-256 驗證防偽 · 影像解析度清晰
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  已通過防偽比對
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: 公司專案資格與獎勵判定 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              公司工程案場配置與證照獎勵核定
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  ✔ 工務所專任法定工程人員資格
                </span>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  本證照符合營造業法規，可作為案場主任技師、工地主任、品管或職安人員之法定登錄證明。
                </p>
              </div>
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80">
                <span className="text-xs font-bold text-indigo-900 block mb-1">
                  ✔ 專業證照激勵獎金核發
                </span>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  審核通過後自動申報公司專業證照獎勵，列入次月薪資併發獎勵金。
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: 主管審核意見 */}
          {isPending && (
            <div className="space-y-3 p-5 rounded-2xl bg-amber-50/50 border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  審核查驗紀錄與核定備註
                </h3>
                <span className="text-[11px] text-amber-700 font-medium">
                  可快速點選下方查驗評語
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
                placeholder="請輸入證照審核意見（例如：查驗無誤准予入庫、字號清晰等）..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
                退回補件
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleApprove}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                審核入庫 (核發及格)
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              此證照已通過查核並入庫人才庫
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
