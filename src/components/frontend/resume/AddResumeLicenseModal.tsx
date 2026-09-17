import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Upload,
  Calendar,
  Building,
  CheckCircle2,
  FileBadge,
  Sparkles,
  AlertCircle,
  FileText,
  ShieldCheck,
  Lock,
  Clock,
  Info,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { LicenseCategory, MasterLicenseDefinition } from '../../../types';

interface AddResumeLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  empNo: string;
  defaultTab?: string;
}

export const AddResumeLicenseModal: React.FC<AddResumeLicenseModalProps> = ({
  isOpen,
  onClose,
  empNo,
}) => {
  const { employees, masterLicenses, submitFrontendResumeLicense } = useApp();

  const currentEmp = employees.find((e) => e.empNo === empNo) || employees[0];

  // Default select first active master license
  const defaultMaster = masterLicenses?.find((m) => m.isActive) || masterLicenses?.[0];

  const [selectedMasterId, setSelectedMasterId] = useState<string>(
    defaultMaster?.id || ''
  );
  const [licenseNo, setLicenseNo] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [attachmentName, setAttachmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected master license details
  const currentMaster: MasterLicenseDefinition | undefined =
    masterLicenses?.find((m) => m.id === selectedMasterId) || defaultMaster;

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultMaster && !selectedMasterId) {
        setSelectedMasterId(defaultMaster.id);
      }
      setIssueDate(new Date().toISOString().slice(0, 10));
      setLicenseNo('');
      setAttachmentName('');
      setNotes('');
      setSuccessMessage(null);
    }
  }, [isOpen, defaultMaster]);

  if (!isOpen) return null;

  // Automatic calculation of Expiry Date based strictly on master specification
  const computeExpiryDate = (baseDate: string, master?: MasterLicenseDefinition): string => {
    if (!master || !master.hasExpiry || !master.validityYears) return '';
    try {
      const d = new Date(baseDate);
      d.setFullYear(d.getFullYear() + master.validityYears);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Automatic calculation of Next Renewal Deadline based strictly on master specification
  const computeRenewalDeadline = (
    baseDate: string,
    master?: MasterLicenseDefinition
  ): string => {
    if (!master || !master.renewalRequired || !master.renewalIntervalYears) return '';
    try {
      const d = new Date(baseDate);
      d.setFullYear(d.getFullYear() + master.renewalIntervalYears);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const calculatedExpiryDate = computeExpiryDate(issueDate, currentMaster);
  const calculatedRenewalDeadline = computeRenewalDeadline(issueDate, currentMaster);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaster) {
      alert('請先選取欲申報之專業證照項目');
      return;
    }
    if (!licenseNo.trim()) {
      alert('請輸入證照字號或結業證書編號');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      empNo: currentEmp?.empNo || empNo,
      empName: currentEmp?.name || '同仁',
      department: currentEmp?.department || '工務部',
      title: currentEmp?.title || '工程師',
      licenseCategory: currentMaster.category,
      licenseName: currentMaster.name,
      licenseNo: licenseNo.trim(),
      issuingAuthority: currentMaster.issuingAuthority,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      hasExpiry: currentMaster.hasExpiry,
      expiryDate: currentMaster.hasExpiry ? calculatedExpiryDate : undefined,
      renewalRequired: currentMaster.renewalRequired,
      renewalIntervalYears: currentMaster.renewalRequired
        ? currentMaster.renewalIntervalYears
        : undefined,
      renewalDeadlineDate: currentMaster.renewalRequired
        ? calculatedRenewalDeadline
        : undefined,
      attachmentName:
        attachmentName || `${currentEmp?.name || '同仁'}_${currentMaster.name}影本.pdf`,
      attachmentUrl:
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      notes: notes.trim()
        ? `${notes.trim()} (依證照母庫規格自動帶出效期與回訓)`
        : '同仁前台自主申報，已由證照母庫自動計算效期與回訓。',
    };

    submitFrontendResumeLicense({
      empNo: currentEmp?.empNo || empNo,
      newLicense: payload,
    });

    setSuccessMessage('證照已成功登錄！系統已自動完成效期與回訓換算並送交人資審核。');
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(null);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">新增專業證照登錄</h3>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md">
                  自主申報
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                申報同仁：{currentEmp?.name} ({currentEmp?.empNo}) · {currentEmp?.department} {currentEmp?.title}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Step 1: Select Master License from Company Master Database */}
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                1. 選擇專業證照項目 (依公司證照規格母庫) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-500" />
                效期與回訓規範由母庫統一管制
              </span>
            </div>

            <select
              required
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              {masterLicenses
                ?.filter((m) => m.isActive)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.category}] {m.name} ({m.issuingAuthority})
                  </option>
                ))}
            </select>
          </div>

          {/* Master License Specification Summary (Read-Only Specs from Master) */}
          {currentMaster && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">證照分類 / 發證機關</span>
                  <p className="font-bold text-slate-800">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md mr-2 text-[10px]">
                      {currentMaster.category}
                    </span>
                    {currentMaster.issuingAuthority}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">法定效期規範</span>
                  <p className="font-black text-slate-900">
                    {currentMaster.hasExpiry
                      ? `${currentMaster.validityYears} 年效期制`
                      : '國家技術士 / 永久有效'}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>法定回訓規定：</strong>
                  {currentMaster.renewalNotes ||
                    (currentMaster.renewalRequired
                      ? `每 ${currentMaster.renewalIntervalYears} 年需回訓換照`
                      : '無特別回訓要求')}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Employee Inputs (License No & Issue Date) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                證照字號 / 編號 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="例如：QC-115-88992"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                取得 / 結訓日期 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                輸入取得結訓日期後，到期日與回訓期限將自動計算帶出
              </p>
            </div>
          </div>

          {/* Step 3: Locked Auto-Calculated Dates (不可自行輸入) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                依證照設定自動帶出（不可自行輸入 / 修改）：
              </span>
              <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 text-[10px] font-black rounded-md">
                系統自動換算鎖定
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Expiry Date (Locked / Auto-derived) */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">有效到期日</span>
                  <span className="text-emerald-700 font-black text-[10px] flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    自動帶出
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentMaster?.hasExpiry ? (
                    calculatedExpiryDate || '請先選擇取得日期'
                  ) : (
                    '永久有效 (無有效期限限制)'
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {currentMaster?.hasExpiry
                    ? `依母庫規範自動累加 ${currentMaster.validityYears} 年`
                    : '國家技術士 / 永久有效資格'}
                </p>
              </div>

              {/* Renewal Deadline (Locked / Auto-derived) */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">預計下次回訓 / 換照截止日</span>
                  <span className="text-indigo-700 font-black text-[10px] flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    自動帶出
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentMaster?.renewalRequired ? (
                    calculatedRenewalDeadline || '請先選擇取得日期'
                  ) : (
                    '無定期回訓限制'
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {currentMaster?.renewalRequired
                    ? `法定回訓週期：每 ${currentMaster.renewalIntervalYears} 年 (${currentMaster.renewalHours || 6} 小時)`
                    : '無特定回訓時數規範'}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate File Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              證書或結業證明影本上傳 (PDF, JPG, PNG) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-4 rounded-2xl text-center transition-all">
              <input
                type="file"
                id="license-cert-file-add"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="license-cert-file-add"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {attachmentName ? (
                    <span className="text-blue-600 font-black flex items-center gap-1">
                      <FileText className="w-4 h-4" /> {attachmentName}
                    </span>
                  ) : (
                    '點擊此處或拖曳上傳證書檔案'
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  支援單檔最高 15MB 清楚掃描檔或拍照圖檔
                </p>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">申報備註 (選填)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：115年度首梯結訓取得、已向工務主管報備等..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  資料送交中...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  確認登錄證照 (送審)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
