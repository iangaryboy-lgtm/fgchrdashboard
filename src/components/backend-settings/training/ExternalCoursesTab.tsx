import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  DollarSign,
  FileCheck,
  Search,
  Users,
  Award,
  Filter,
} from 'lucide-react';
import { ExternalTrainingApplication } from '../../../types';

export const ExternalCoursesTab: React.FC = () => {
  const {
    externalApplications,
    approveExternalApplication,
    addExternalApplication,
    employees,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form states
  const [selectedEmpNo, setSelectedEmpNo] = useState(employees[0]?.empNo || '');
  const [courseTitle, setCourseTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(8);
  const [fee, setFee] = useState(6000);
  const [companySubsidyFee, setCompanySubsidyFee] = useState(6000);
  const [learningObjective, setLearningObjective] = useState('');

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.empNo === selectedEmpNo);
    if (!emp || !courseTitle.trim()) return;

    addExternalApplication({
      empNo: emp.empNo,
      empName: emp.name,
      department: emp.department,
      title: emp.title,
      courseTitle,
      organizer,
      startDate,
      endDate,
      hours: Number(hours),
      fee: Number(fee),
      companySubsidyFee: Number(companySubsidyFee),
      learningObjective,
      status: 'pending',
    });

    setIsApplyModalOpen(false);
  };

  const filtered = externalApplications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (
      searchTerm &&
      !app.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !app.empName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !app.organizer.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 font-semibold">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">外訓申請與補助審查</h3>
            <p className="text-xs text-slate-500">
              同仁參與外界專業機構培訓、執照認證、研討會之補助審核與心得回報管理
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          代填外訓申請單
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜尋課程名稱、同仁姓名、主辦機構..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">審核狀態：</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">全部狀態</option>
            <option value="pending">待審核中</option>
            <option value="approved">核准補助</option>
            <option value="completed">已結訓繳交心得</option>
            <option value="rejected">已退件</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">申請同仁</th>
              <th className="py-3 px-4">外訓課程名稱 / 主辦機構</th>
              <th className="py-3 px-4">培訓日期 / 時數</th>
              <th className="py-3 px-4 text-right">費用 / 補助金額</th>
              <th className="py-3 px-4 text-center">簽核狀態</th>
              <th className="py-3 px-4 text-right">審核操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{app.empName}</div>
                  <div className="text-[10px] text-slate-500">
                    {app.empNo} · {app.department}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{app.courseTitle}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    {app.organizer}
                  </div>
                  {app.learningObjective && (
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      學習目的：{app.learningObjective}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  <div>
                    {app.startDate} {app.startDate !== app.endDate && `~ ${app.endDate}`}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium">{app.hours} 小時</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-slate-900">NT$ {Number(app.companySubsidyFee || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">總學費 NT$ {Number(app.fee || 0).toLocaleString()}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  {app.status === 'pending' ? (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[11px]">
                      待主管審核
                    </span>
                  ) : app.status === 'approved' ? (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[11px]">
                      已核准 (受訓中)
                    </span>
                  ) : app.status === 'completed' ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
                      結訓核銷完成
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[11px]">
                      已退件
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {app.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => approveExternalApplication(app.id, true, 'ADM-001', '同意全額補助外訓')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] transition-colors"
                      >
                        核准補助
                      </button>
                      <button
                        onClick={() => approveExternalApplication(app.id, false, 'ADM-001', '業務關聯度不足')}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md font-medium text-[11px]"
                      >
                        退件
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">已結案</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  查無符合條件的外訓申請紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-600" />
                新增同仁外訓申請單
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  受訓同仁 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmpNo}
                  onChange={(e) => setSelectedEmpNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.empNo} value={emp.empNo}>
                      {emp.name} ({emp.empNo}) - {emp.department} {emp.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  外訓課程名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="例: LEED AP 綠建築國際執照認證實務班"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  主辦機構 / 培訓單位 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="例: 台灣綠建築學會 / 中華民國工程重機械協會"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">開課起始日</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">結訓日期</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">培訓時數</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">課程總學費</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">申請公司補助</label>
                  <input
                    type="number"
                    value={companySubsidyFee}
                    onChange={(e) => setCompanySubsidyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">學習目的與業務關聯說明</label>
                <textarea
                  rows={2}
                  value={learningObjective}
                  onChange={(e) => setLearningObjective(e.target.value)}
                  placeholder="說明同仁受訓後如何應用於工程工地管理與技能回饋..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                >
                  送出申請
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
