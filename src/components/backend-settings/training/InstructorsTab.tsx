import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  Star,
  Clock,
  BookOpen,
  Calendar,
  Building,
  UserCheck,
  UserPlus,
  ExternalLink,
  History,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import { Instructor, TeachingRecord } from '../../../types';

export const InstructorsTab: React.FC = () => {
  const { instructors, addInstructor, updateInstructor, deleteInstructor, employees, trainingCategories } = useApp();
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'internal' | 'external'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructorForHistory, setSelectedInstructorForHistory] = useState<Instructor | null>(null);

  // Filter states for teaching history drawer
  const [historyYearFilter, setHistoryYearFilter] = useState<string>('all');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Instructor | null>(null);

  // Form states
  const [type, setType] = useState<'internal' | 'external'>('internal');
  const [selectedEmpNo, setSelectedEmpNo] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expertiseTags, setExpertiseTags] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);

  // Handle selecting employee for internal instructor
  const handleEmployeeSelect = (empNo: string) => {
    setSelectedEmpNo(empNo);
    const emp = employees.find((e) => e.empNo === empNo);
    if (emp) {
      setName(emp.name);
      setOrganization('遠雄營造 - ' + emp.department);
      setTitle(emp.title);
      setEmail(emp.email || `${emp.empNo.toLowerCase()}@farglory.com.tw`);
      setPhone(emp.phone || '');
    }
  };

  const openAddModal = (presetType?: 'internal' | 'external') => {
    setEditingInst(null);
    const t = presetType || (activeTypeTab === 'external' ? 'external' : 'internal');
    setType(t);
    setSelectedEmpNo('');
    setName('');
    setOrganization(t === 'internal' ? '遠雄營造' : '');
    setTitle('');
    setEmail('');
    setPhone('');
    setExpertiseTags('');
    setBio('');
    setHourlyRate(t === 'external' ? 3000 : 1500);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (inst: Instructor) => {
    setEditingInst(inst);
    setType(inst.type);
    setSelectedEmpNo(inst.empNo || '');
    setName(inst.name);
    setOrganization(inst.organization || '');
    setTitle(inst.title || '');
    setEmail(inst.email || '');
    setPhone(inst.phone || '');
    setExpertiseTags((inst.expertise || []).join(', '));
    setBio(inst.bio || '');
    setHourlyRate(inst.hourlyRate);
    setIsActive(inst.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const expertiseArray = expertiseTags
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingInst) {
      updateInstructor(editingInst.id, {
        type,
        empNo: type === 'internal' ? selectedEmpNo : undefined,
        name,
        organization,
        title,
        email,
        phone,
        expertise: expertiseArray,
        bio,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        isActive,
      });
    } else {
      addInstructor({
        type,
        empNo: type === 'internal' ? selectedEmpNo : undefined,
        name,
        organization,
        title,
        email,
        phone,
        expertise: expertiseArray,
        bio,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        isActive,
        satisfactionScore: 5.0,
        totalTeachingHours: 0,
        teachingRecords: [],
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, instName: string) => {
    if (window.confirm(`確定要刪除講師「${instName}」嗎？`)) {
      deleteInstructor(id);
    }
  };

  const filtered = instructors
    .filter((inst) => {
      if (activeTypeTab !== 'all' && inst.type !== activeTypeTab) return false;
      const matchText =
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.organization && inst.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inst.title && inst.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inst.expertise && inst.expertise.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchText;
    });

  // Calculate filtered teaching records for selected instructor
  const getFilteredTeachingRecords = (records: TeachingRecord[] = []) => {
    return records.filter((r) => {
      const recordDate = r.date || r.startDate || '';
      if (historyYearFilter !== 'all' && !recordDate.startsWith(historyYearFilter)) return false;
      const cat = r.trainingCategory || r.categoryName || '';
      if (historyCategoryFilter !== 'all' && cat !== historyCategoryFilter) return false;
      return true;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-semibold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">講師資料庫管理</h3>
            <p className="text-xs text-slate-500">
              整合內部專業經理人與外部專家顧問，維護歷年授課時數與學員滿意度評鑑
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜尋講師姓名、服務單位、專長..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white w-48 sm:w-60 transition-colors"
            />
          </div>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增講師
          </button>
        </div>
      </div>

      {/* Tabs for Internal / External filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTypeTab('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTypeTab === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          全部講師 ({instructors.length})
        </button>
        <button
          onClick={() => setActiveTypeTab('internal')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTypeTab === 'internal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          內部講師 ({instructors.filter((i) => i.type === 'internal').length})
        </button>
        <button
          onClick={() => setActiveTypeTab('external')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTypeTab === 'external'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          外部講師 ({instructors.filter((i) => i.type === 'external').length})
        </button>
      </div>

      {/* Instructors List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inst) => {
          const recordsCount = inst.teachingRecords?.length || 0;
          return (
            <div
              key={inst.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                        inst.type === 'internal'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}
                    >
                      {inst.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{inst.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inst.type === 'internal'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {inst.type === 'internal' ? '內部講師' : '外部專家'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {inst.organization} {inst.title && `· ${inst.title}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {inst.expertise && inst.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {inst.expertise.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>累計授課：</span>
                    <span className="font-bold text-slate-800">{inst.totalTeachingHours || 0} 小時</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>滿意度：</span>
                    <span className="font-bold text-slate-800">
                      {inst.satisfactionScore ? `${inst.satisfactionScore.toFixed(1)} / 5.0` : '尚無評鑑'}
                    </span>
                  </div>
                </div>

                {inst.bio && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {inst.bio}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedInstructorForHistory(inst)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <History className="w-3.5 h-3.5" />
                  授課紀錄明細 ({recordsCount})
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(inst)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="編輯講師"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(inst.id, inst.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="刪除講師"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">查無符合條件的講師資料</p>
          <p className="text-xs text-slate-400 mt-1">請點擊上方按鈕新增內部主管或外部專家講師</p>
        </div>
      )}

      {/* Teaching History Drawer / Modal */}
      {selectedInstructorForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedInstructorForHistory.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{selectedInstructorForHistory.name} 講師授課歷程明細</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedInstructorForHistory.organization} · {selectedInstructorForHistory.title})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    累計授課 {selectedInstructorForHistory.totalTeachingHours || 0} 小時 · 平均滿意度 {selectedInstructorForHistory.satisfactionScore || 5.0} / 5.0
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstructorForHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Filter Sub-bar */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">年度篩選：</span>
                <select
                  value={historyYearFilter}
                  onChange={(e) => setHistoryYearFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
                >
                  <option value="all">全部年度</option>
                  <option value="2026">2026 年度</option>
                  <option value="2025">2025 年度</option>
                  <option value="2024">2024 年度</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">訓練類別：</span>
                <select
                  value={historyCategoryFilter}
                  onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
                >
                  <option value="all">全部類別</option>
                  {trainingCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">課程名稱</th>
                      <th className="py-2.5 px-3">訓練類別</th>
                      <th className="py-2.5 px-3">屬性</th>
                      <th className="py-2.5 px-3">梯次 / 日期</th>
                      <th className="py-2.5 px-3 text-center">授課時數</th>
                      <th className="py-2.5 px-3 text-center">學員人數</th>
                      <th className="py-2.5 px-3 text-center">滿意度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {getFilteredTeachingRecords(selectedInstructorForHistory.teachingRecords).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.courseTitle}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium border border-blue-100">
                            {rec.trainingCategory || rec.categoryName || '專業訓練'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              rec.deliveryType === 'physical'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {rec.deliveryType === 'physical' ? '實體課程' : '線上課程'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{rec.batchName}</div>
                          <div className="text-[10px] text-slate-400">{rec.date || rec.startDate}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{rec.hours} hrs</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{rec.attendeeCount || rec.studentCount || 0} 人</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {(rec.satisfactionScore || rec.ratingAverage) ? (rec.satisfactionScore || rec.ratingAverage)?.toFixed(1) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getFilteredTeachingRecords(selectedInstructorForHistory.teachingRecords).length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          查無符合篩選條件的授課紀錄
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedInstructorForHistory(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                {editingInst ? '編輯講師資料' : '新增講師'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">講師身分類別</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('internal');
                      setOrganization('遠雄營造');
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      type === 'internal'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    內部同仁講師 (從全域選取)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('external');
                      setSelectedEmpNo('');
                      setOrganization('');
                      setTitle('');
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      type === 'external'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    外部專家顧問
                  </button>
                </div>
              </div>

              {/* Internal picker */}
              {type === 'internal' && (
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-2">
                  <label className="block text-xs font-semibold text-blue-900">
                    從全域同仁名冊資料庫選取 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEmpNo}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    required={type === 'internal'}
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="">-- 請選擇同仁以自動帶入職稱與部門 --</option>
                    {employees.map((emp) => (
                      <option key={emp.empNo} value={emp.empNo}>
                        {emp.name} ({emp.empNo}) - {emp.department} {emp.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    講師姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: 林大明"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    職稱
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 資深專案經理 / 教授"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  服務單位 / 現職機構
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="例: 遠雄營造 - 工務一部 / 台灣大學土木研究所"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">聯絡 Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="instructor@example.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">聯絡電話</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  專長領域標籤 (以逗號或空格分隔)
                </label>
                <input
                  type="text"
                  value={expertiseTags}
                  onChange={(e) => setExpertiseTags(e.target.value)}
                  placeholder="例: 智慧建築, BIM, 成本控制, 案主管領導"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  鐘點費行情 (NTD/小時)
                </label>
                <input
                  type="number"
                  value={hourlyRate || ''}
                  onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例: 3000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">經歷簡介 / 獲獎榮譽</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="講師過往工程專案經驗、著作、學術背景或代表性得獎紀錄..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>啟用此講師 (可指派為開課講師)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  {editingInst ? '儲存變更' : '建立講師'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
