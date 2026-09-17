import React, { useState } from 'react';
import {
  X,
  Award,
  Upload,
  User,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { EmployeeLicense, LicenseCategory } from '../../../types';

interface AddLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: LicenseCategory[] = [
  '品質管理',
  '職業安全衛生',
  '營造工程技術',
  '專業技師/建築師',
  '特種設備操作',
  '急救與防災',
  '綠建築/BIM',
  '其它專業',
];

export const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ isOpen, onClose }) => {
  const { employees, addEmployeeLicense, masterLicenses } = useApp();

  const [selectedEmpNo, setSelectedEmpNo] = useState(employees[0]?.empNo || '');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [category, setCategory] = useState<LicenseCategory>('品質管理');
  const [licenseName, setLicenseName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('行政院公共工程委員會');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');
  const [renewalRequired, setRenewalRequired] = useState(true);
  const [renewalIntervalYears, setRenewalIntervalYears] = useState(4);
  const [renewalDeadlineDate, setRenewalDeadlineDate] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentEmp = employees.find((e) => e.empNo === selectedEmpNo) || employees[0];

  const handleSelectMasterLicense = (masterId: string) => {
    setSelectedMasterId(masterId);
    if (!masterId) return;
    const master = masterLicenses.find((m) => m.id === masterId);
    if (master) {
      setCategory(master.category);
      setLicenseName(master.name);
      setIssuingAuthority(master.issuingAuthority);
      setHasExpiry(master.hasExpiry);
      setRenewalRequired(master.renewalRequired);
      if (master.renewalIntervalYears) {
        setRenewalIntervalYears(master.renewalIntervalYears);
      }
      if (master.validityYears && issueDate) {
        const issue = new Date(issueDate);
        issue.setFullYear(issue.getFullYear() + master.validityYears);
        setExpiryDate(issue.toISOString().slice(0, 10));
      }
      if (master.renewalIntervalYears && issueDate) {
        const renewal = new Date(issueDate);
        renewal.setFullYear(renewal.getFullYear() + master.renewalIntervalYears);
        setRenewalDeadlineDate(renewal.toISOString().slice(0, 10));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseName.trim()) {
      alert('請填寫證照名稱');
      return;
    }

    addEmployeeLicense({
      empNo: currentEmp.empNo,
      empName: currentEmp.name,
      department: currentEmp.department,
      title: currentEmp.title,
      licenseCategory: category,
      licenseName: licenseName.trim(),
      licenseNo: licenseNo.trim() || `LIC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthority: issuingAuthority.trim(),
      issueDate,
      hasExpiry,
      expiryDate: hasExpiry ? expiryDate : undefined,
      renewalRequired,
      renewalIntervalYears: renewalRequired ? renewalIntervalYears : undefined,
      renewalDeadlineDate: renewalRequired ? renewalDeadlineDate : undefined,
      status: 'valid',
      attachmentName: attachmentName || `${currentEmp.name}_${licenseName}.pdf`,
      attachmentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      notes: notes.trim(),
      verifiedBy: 'HR_ADMIN',
      verifiedAt: new Date().toISOString().slice(0, 10),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm">手動建立人員證照紀錄 (後台管理)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              指定同仁 <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmpNo}
              onChange={(e) => setSelectedEmpNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.empNo} value={emp.empNo}>
                  {emp.name} ({emp.empNo}) - {emp.department} {emp.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select from Standard License Catalog */}
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">從標準證照規格庫快速套用：</span>
              <span className="text-[11px] text-blue-600 font-medium">自動帶入發證機構與效期規範</span>
            </div>
            <select
              value={selectedMasterId}
              onChange={(e) => handleSelectMasterLicense(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 手動輸入或選擇標準規格 --</option>
              {masterLicenses.filter((m) => m.isActive).map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.category}] {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                證照類別 <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LicenseCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                證照完整名稱 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={licenseName}
                onChange={(e) => setLicenseName(e.target.value)}
                placeholder="例如：公共工程品質管理人員證書 (土建組)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

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
                placeholder="例如：QC-113-88992"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">發證單位 / 機關</label>
              <input
                type="text"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">取得日期</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">有效到期日</label>
              <input
                type="date"
                disabled={!hasExpiry}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 disabled:opacity-50 focus:outline-hidden focus:border-blue-500"
              />
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="checkbox"
                  id="hasExp"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="hasExp" className="text-[11px] text-slate-500">
                  有期限限制
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">回訓截止日期</label>
              <input
                type="date"
                disabled={!renewalRequired}
                value={renewalDeadlineDate}
                onChange={(e) => setRenewalDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 disabled:opacity-50 focus:outline-hidden focus:border-blue-500"
              />
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="checkbox"
                  id="reqRen"
                  checked={renewalRequired}
                  onChange={(e) => setRenewalRequired(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="reqRen" className="text-[11px] text-slate-500">
                  需定期回訓
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">備註說明</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：由人資直接登錄已查驗正本無誤..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              確認建立並歸檔
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
