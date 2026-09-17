import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  Eye,
  ShieldCheck,
  Building,
  UserCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { EmployeeLicense, LicenseCategory } from '../../../types';
import { AddLicenseModal } from './AddLicenseModal';
import { BatchImportLicenseModal } from './BatchImportLicenseModal';

interface LicenseDatabaseTabProps {
  onOpenDispatchModal?: (record?: any) => void;
}

export const LicenseDatabaseTab: React.FC<LicenseDatabaseTabProps> = ({ onOpenDispatchModal }) => {
  const {
    employeeLicenses,
    employees,
    deleteEmployeeLicense,
    verifyEmployeeLicense,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  // Departments list for filter
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  // Filtered Licenses
  const filteredLicenses = employeeLicenses.filter((lic) => {
    const matchSearch =
      lic.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.licenseNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = selectedCategory === 'ALL' || lic.licenseCategory === selectedCategory;
    const matchStat = selectedStatus === 'ALL' || lic.status === selectedStatus;
    const matchDept = selectedDept === 'ALL' || lic.department === selectedDept;

    return matchSearch && matchCat && matchStat && matchDept;
  });

  const validCount = employeeLicenses.filter((l) => l.status === 'valid').length;
  const expiringCount = employeeLicenses.filter((l) => l.status === 'expiring_soon').length;
  const expiredCount = employeeLicenses.filter((l) => l.status === 'expired').length;
  const pendingCount = employeeLicenses.filter((l) => l.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">總納管證照量</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{employeeLicenses.length} <span className="text-xs font-normal text-slate-500">張</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium">有效合規證照</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{validCount} <span className="text-xs font-normal text-emerald-600">張</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">即將到期 / 需回訓</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{expiringCount} <span className="text-xs font-normal text-amber-600">張</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 font-medium">待審核登錄 / 結訓</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{pendingCount} <span className="text-xs font-normal text-blue-600">件</span></p>
        </div>
      </div>

      {/* Control Action Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋同仁姓名、工號、證照名稱或字號..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">全部類別</option>
            <option value="品質管理">品質管理</option>
            <option value="職業安全衛生">職業安全衛生</option>
            <option value="營造工程技術">營造工程技術</option>
            <option value="專業技師/建築師">專業技師/建築師</option>
            <option value="特種設備操作">特種設備操作</option>
            <option value="急救與防災">急救與防災</option>
            <option value="綠建築/BIM">綠建築/BIM</option>
            <option value="其它專業">其它專業</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">全部狀態</option>
            <option value="valid">有效合格</option>
            <option value="expiring_soon">即將到期</option>
            <option value="expired">已過期失效</option>
            <option value="pending_review">待審核</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">全部部門</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            批次匯入資料
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            手動新增證照
          </button>
        </div>
      </div>

      {/* Main License Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">同仁資料</th>
                <th className="px-4 py-3.5">證照名稱與字號</th>
                <th className="px-4 py-3.5">證照類別</th>
                <th className="px-4 py-3.5">取得 / 到期日</th>
                <th className="px-4 py-3.5">回訓規範</th>
                <th className="px-4 py-3.5">合規狀態</th>
                <th className="px-4 py-3.5">證書影本</th>
                <th className="px-4 py-3.5 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    查無符合條件之證照紀錄
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const isValid = lic.status === 'valid';
                  const isExpiring = lic.status === 'expiring_soon';
                  const isExpired = lic.status === 'expired';
                  const isPending = lic.status === 'pending_review';

                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{lic.empName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {lic.empNo} · {lic.department}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{lic.licenseName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{lic.licenseNo}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]">
                          {lic.licenseCategory}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>取得：{lic.issueDate}</div>
                        {lic.expiryDate ? (
                          <div className={isExpiring ? 'text-amber-700 font-bold' : isExpired ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                            到期：{lic.expiryDate}
                          </div>
                        ) : (
                          <div className="text-slate-400">永久有效</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[11px]">
                        {lic.renewalRequired ? (
                          <div>
                            <span className="text-indigo-600 font-medium block">
                              每 {lic.renewalIntervalYears || 4} 年回訓
                            </span>
                            {lic.renewalDeadlineDate && (
                              <span className="text-slate-400">
                                期限：{lic.renewalDeadlineDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">免回訓</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isValid && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            有效合規
                          </span>
                        )}
                        {isExpiring && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            即將到期
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            已過期失效
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            自主登錄待審
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {lic.attachmentUrl ? (
                          <button
                            onClick={() => setPreviewAttachmentUrl(lic.attachmentUrl || null)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold rounded-lg flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            檢視影本
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">無附件</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => verifyEmployeeLicense(lic.id, 'HR_ADMIN')}
                              title="審核通過並歸檔"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              通過審核
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除 ${lic.empName} 的 ${lic.licenseName} 紀錄嗎？`)) {
                                deleteEmployeeLicense(lic.id);
                              }
                            }}
                            title="刪除"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddLicenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Batch Import Modal */}
      <BatchImportLicenseModal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} />

      {/* Attachment Preview Modal */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold">證照附件正本影本</span>
              </div>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <img
                src={previewAttachmentUrl}
                alt="證照影本"
                referrerPolicy="no-referrer"
                className="max-h-96 rounded-2xl object-cover border border-slate-200 shadow-md"
              />
              <p className="text-xs text-slate-500 mt-4">
                遠雄營造 證照雲安全存證系統 · 浮水印已加密保護
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
