import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  Award,
  Upload,
  Calendar,
  Building,
  CheckCircle2,
  FileBadge,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { EmployeeLicense, MasterLicenseDefinition } from '../../../types';

interface RenewLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: EmployeeLicense | null;
}

export const RenewLicenseModal: React.FC<RenewLicenseModalProps> = ({
  isOpen,
  onClose,
  license,
}) => {
  const { masterLicenses, updateEmployeeLicense } = useApp();

  const [renewedIssueDate, setRenewedIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [trainingInstitute, setTrainingInstitute] = useState('財團法人台灣營建研究院');
  const [trainingHours, setTrainingHours] = useState<number>(36);
  const [renewalCertNo, setRenewalCertNo] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find corresponding master license definition
  const matchedMaster: MasterLicenseDefinition | undefined = masterLicenses?.find(
    (m) =>
      m.name.trim() === license?.licenseName.trim() ||
      m.category === license?.licenseCategory
  );

  // Validity and renewal interval from master or license
  const validityYears = matchedMaster?.validityYears ?? (license?.hasExpiry ? 4 : 0);
  const hasExpiry = matchedMaster?.hasExpiry ?? (license?.hasExpiry ?? true);
  const renewalIntervalYears =
    matchedMaster?.renewalIntervalYears ?? (license?.renewalIntervalYears || 4);
  const renewalRequired =
    matchedMaster?.renewalRequired ?? (license?.renewalRequired ?? true);

  // Automatically calculate new expiry date based on renewed issue date
  const computeNewExpiryDate = (dateStr: string): string => {
    if (!hasExpiry || !validityYears) return '';
    try {
      const d = new Date(dateStr);
      d.setFullYear(d.getFullYear() + validityYears);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Automatically calculate next renewal deadline based on renewed issue date
  const computeNewRenewalDeadline = (dateStr: string): string => {
    if (!renewalRequired || !renewalIntervalYears) return '';
    try {
      const d = new Date(dateStr);
      d.setFullYear(d.getFullYear() + renewalIntervalYears);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const calculatedNewExpiry = computeNewExpiryDate(renewedIssueDate);
  const calculatedNewRenewal = computeNewRenewalDeadline(renewedIssueDate);

  useEffect(() => {
    if (license) {
      setRenewalCertNo(license.licenseNo || '');
      setRenewedIssueDate(new Date().toISOString().slice(0, 10));
      if (matchedMaster?.renewalHours) {
        setTrainingHours(matchedMaster.renewalHours);
      }
      setNotes(`已完成回訓講習並取得結業證明，更新證照有效期限。`);
      setAttachmentName('');
      setSuccessMessage(null);
    }
  }, [license, matchedMaster]);

  if (!isOpen || !license) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date().toISOString().slice(0, 10);
    const newNotes = license.notes
      ? `${license.notes}\n[回訓更新 ${now}] 於 ${trainingInstitute} 完成 ${trainingHours} 小時回訓，新到期日：${calculatedNewExpiry || '永久有效'}。${notes}`
      : `[回訓更新 ${now}] 於 ${trainingInstitute} 完成 ${trainingHours} 小時回訓，新到期日：${calculatedNewExpiry || '永久有效'}。${notes}`;

    updateEmployeeLicense(license.id, {
      issueDate: renewedIssueDate,
      expiryDate: hasExpiry ? calculatedNewExpiry : undefined,
      renewalDeadlineDate: renewalRequired ? calculatedNewRenewal : undefined,
      status: 'valid',
      licenseNo: renewalCertNo.trim() || license.licenseNo,
      notes: newNotes,
      attachmentName:
        attachmentName || `${license.empName}_${license.licenseName}_回訓結業證明.pdf`,
      attachmentUrl:
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      verifiedBy: 'HR_AUTO_SYNC',
      verifiedAt: now,
    });

    setSuccessMessage('回訓與換照資訊已成功更新！證照效期與下次回訓時間已自動重新計算。');

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(null);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-600 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">專業證照回訓與換照更新</h3>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-md">
                  手動更新回訓
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                持有人：{license.empName} ({license.empNo}) · {license.department} {license.title}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Current License Summary Card */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-black rounded-md">
                  {license.licenseCategory}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-1">{license.licenseName}</h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                原字號：{license.licenseNo}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 text-xs text-slate-600">
              <div>
                <span className="text-[11px] text-slate-400 block">原取得日期</span>
                <span className="font-bold text-slate-800">{license.issueDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">原有效到期日</span>
                <span className="font-bold text-slate-800">
                  {license.hasExpiry ? license.expiryDate || '未註明' : '永久有效'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">法定回訓規定</span>
                <span className="font-bold text-amber-900">
                  {matchedMaster?.renewalNotes || `每 ${renewalIntervalYears} 年回訓換照`}
                </span>
              </div>
            </div>
          </div>

          {/* New Completion / Renewal Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                本次回訓完成 / 換照取得日期 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={renewedIssueDate}
                onChange={(e) => setRenewedIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                請選擇本次回訓結訓或新換發證書之生效日期
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                回訓培訓機構 / 承辦單位 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={trainingInstitute}
                onChange={(e) => setTrainingInstitute(e.target.value)}
                placeholder="例如：財團法人台灣營建研究院、中華民國職安協會"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Training Hours & New Cert No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                回訓研習時數 (小時) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="200"
                required
                value={trainingHours}
                onChange={(e) => setTrainingHours(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                新結業證明字號 / 換照新字號
              </label>
              <input
                type="text"
                value={renewalCertNo}
                onChange={(e) => setRenewalCertNo(e.target.value)}
                placeholder="若換發新字號請填寫，無則沿用原字號"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Auto-Calculated & Locked Result Box (不可手動修改) */}
          <div className="p-4 bg-blue-50/90 rounded-2xl border border-blue-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-blue-950">
                系統依證照母庫規範自動連動計算（鎖定唯讀，不可自行修改）：
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* New Expiry Date */}
              <div className="bg-white p-3 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>更新後之新有效到期日</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    自動帶出
                  </span>
                </div>
                <div className="text-sm font-black text-blue-900">
                  {hasExpiry ? (
                    calculatedNewExpiry || '計算中...'
                  ) : (
                    '永久有效 (無效期限制)'
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {hasExpiry
                    ? `依規格母庫效期 ${validityYears} 年自動計算`
                    : '國家技術士/永久資格'}
                </p>
              </div>

              {/* New Renewal Deadline */}
              <div className="bg-white p-3 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>更新後之下次回訓截止日</span>
                  <span className="text-indigo-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    自動帶出
                  </span>
                </div>
                <div className="text-sm font-black text-indigo-900">
                  {renewalRequired ? (
                    calculatedNewRenewal || '計算中...'
                  ) : (
                    '無需定期回訓'
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {renewalRequired
                    ? `依回訓週期 ${renewalIntervalYears} 年自動推進`
                    : '此證照無回訓要求'}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate File Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              上傳新證照 / 回訓結業證明影本 (PDF, JPG, PNG) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 p-4 rounded-2xl text-center transition-all">
              <input
                type="file"
                id="renew-cert-file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="renew-cert-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {attachmentName ? (
                    <span className="text-amber-700 font-black flex items-center gap-1">
                      <FileText className="w-4 h-4" /> {attachmentName}
                    </span>
                  ) : (
                    '點擊此處上傳結業證明或新證書掃描檔'
                  )}
                </div>
                <p className="text-[11px] text-slate-400">支援 PDF、JPG、PNG 檔案格式 (最大 15MB)</p>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">回訓申報備註</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="填寫回訓相關說明或主管核備資訊..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  確認更新回訓資訊
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
