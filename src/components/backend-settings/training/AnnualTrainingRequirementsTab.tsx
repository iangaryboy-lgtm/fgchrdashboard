import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Users,
  Building2,
  Layers,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AnnualTrainingRequirement } from '../../../types';

export const AnnualTrainingRequirementsTab: React.FC = () => {
  const {
    annualTrainingRequirements,
    addAnnualRequirement,
    updateAnnualRequirement,
    deleteAnnualRequirement,
    duplicateAnnualRequirement,
    internalCourses,
    employees,
  } = useApp();

  // Filters & State
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<AnnualTrainingRequirement | null>(null);
  const [duplicateTargetYear, setDuplicateTargetYear] = useState<number>(new Date().getFullYear() + 1);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [targetDupId, setTargetDupId] = useState<string | null>(null);
  const [previewReq, setPreviewReq] = useState<AnnualTrainingRequirement | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    year: number;
    title: string;
    targetDepartments: string[];
    targetRanks: string[];
    targetJobTitles: string[];
    totalRequiredHours: number;
    mandatoryHours: number;
    mandatoryCourseIds: string[];
    electiveHours: number;
    minCredits: number;
    passCriteriaNotes: string;
    status: 'draft' | 'active' | 'archived';
  }>({
    year: new Date().getFullYear(),
    title: '',
    targetDepartments: ['工程一部', '工程二部'],
    targetRanks: ['06', '07'],
    targetJobTitles: ['工程師', '組長'],
    totalRequiredHours: 24,
    mandatoryHours: 16,
    mandatoryCourseIds: [],
    electiveHours: 8,
    minCredits: 12,
    passCriteriaNotes: '',
    status: 'active',
  });

  // Department and Rank options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  const rankOptions = ['03', '04', '05', '06', '07', '08', '09', '10'];

  const yearsAvailable = useMemo(() => {
    const set = new Set<number>();
    annualTrainingRequirements.forEach((r) => set.add(r.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [annualTrainingRequirements]);

  // Filtered Requirements
  const filteredRequirements = useMemo(() => {
    return annualTrainingRequirements.filter((req) => {
      if (selectedYear !== 'all' && req.year !== parseInt(selectedYear, 10)) {
        return false;
      }
      if (selectedStatus !== 'all' && req.status !== selectedStatus) {
        return false;
      }
      if (selectedDeptFilter !== 'all') {
        const isMatched = req.targetDepartments.includes('ALL') || req.targetDepartments.includes(selectedDeptFilter);
        if (!isMatched) return false;
      }
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const inTitle = req.title.toLowerCase().includes(q);
        const inDepts = req.targetDepartments.some((d) => d.toLowerCase().includes(q));
        const inRanks = req.targetRanks.some((r) => r.toLowerCase().includes(q));
        const inTitles = req.targetJobTitles.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDepts && !inRanks && !inTitles) return false;
      }
      return true;
    });
  }, [annualTrainingRequirements, selectedYear, selectedStatus, selectedDeptFilter, searchKeyword]);

  // Stats
  const activeCount = annualTrainingRequirements.filter((r) => r.status === 'active').length;
  const currentYearReqs = annualTrainingRequirements.filter((r) => r.year === new Date().getFullYear());
  const avgHours = currentYearReqs.length
    ? Math.round(currentYearReqs.reduce((sum, r) => sum + r.totalRequiredHours, 0) / currentYearReqs.length)
    : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingReq(null);
    setFormData({
      year: new Date().getFullYear(),
      title: `${new Date().getFullYear()} 年度 `,
      targetDepartments: ['工程一部', '工程二部'],
      targetRanks: ['06', '07'],
      targetJobTitles: ['工程師', '組長'],
      totalRequiredHours: 24,
      mandatoryHours: 16,
      mandatoryCourseIds: internalCourses.slice(0, 2).map((c) => c.id),
      electiveHours: 8,
      minCredits: 12,
      passCriteriaNotes: '請於年度結算日前完成必修與選修規定時數，並通過結訓評核。',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (req: AnnualTrainingRequirement) => {
    setEditingReq(req);
    setFormData({
      year: req.year,
      title: req.title,
      targetDepartments: req.targetDepartments,
      targetRanks: req.targetRanks,
      targetJobTitles: req.targetJobTitles,
      totalRequiredHours: req.totalRequiredHours,
      mandatoryHours: req.mandatoryHours,
      mandatoryCourseIds: req.mandatoryCourseIds,
      electiveHours: req.electiveHours,
      minCredits: req.minCredits || 0,
      passCriteriaNotes: req.passCriteriaNotes || '',
      status: req.status,
    });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('請填寫規定標題');
      return;
    }

    if (editingReq) {
      updateAnnualRequirement(editingReq.id, {
        ...formData,
      });
    } else {
      addAnnualRequirement({
        ...formData,
      });
    }
    setIsModalOpen(false);
  };

  // Handle Duplicate
  const handleExecuteDuplicate = () => {
    if (targetDupId) {
      duplicateAnnualRequirement(targetDupId, duplicateTargetYear);
      setIsDuplicateModalOpen(false);
      setTargetDupId(null);
    }
  };

  // Matched employees preview helper
  const getMatchedEmployees = (req: AnnualTrainingRequirement) => {
    return employees.filter((emp) => {
      const matchDept = req.targetDepartments.includes('ALL') || req.targetDepartments.includes(emp.department);
      const matchRank = req.targetRanks.includes('ALL') || (emp.rank && req.targetRanks.includes(emp.rank));
      const matchTitle =
        req.targetJobTitles.includes('ALL') ||
        req.targetJobTitles.includes('全體在職同仁') ||
        req.targetJobTitles.some((t) => emp.title && emp.title.includes(t));
      return matchDept && (matchRank || matchTitle);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Action Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">年度訓練規定設定與考核指標</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            依據年度方針、部門組織屬性與職等職級，彈性自訂年度各單位應修時數、指定必修課程、選修時數門檻及學分規定，並自動連結個人與主管培育歷程。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            新增年度規定
          </button>
        </div>
      </div>

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">總規定項目數</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{annualTrainingRequirements.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">涵蓋跨年度各單位培訓規範</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold">目前生效中規範</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">當前適用於同仁之受訓指標</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold">{new Date().getFullYear()} 平均規定時數</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700">{avgHours} <span className="text-xs font-normal">小時/人</span></div>
          <p className="text-[11px] text-slate-400 mt-1">依部門與職等層級平均</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold">必修課程庫總數</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700">{internalCourses.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">可供排定年度必選修之內部課程</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>年度：</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-0 font-bold text-indigo-600 focus:ring-0 text-xs py-0 pl-1 pr-5 cursor-pointer"
            >
              <option value="all">全部年度</option>
              {yearsAvailable.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr} 年度
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>適用部門：</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent border-0 font-bold text-indigo-600 focus:ring-0 text-xs py-0 pl-1 pr-5 cursor-pointer"
            >
              <option value="all">全部單位</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>狀態：</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-0 font-bold text-indigo-600 focus:ring-0 text-xs py-0 pl-1 pr-5 cursor-pointer"
            >
              <option value="all">全部狀態</option>
              <option value="active">啟用中 (Active)</option>
              <option value="draft">草稿 (Draft)</option>
              <option value="archived">已封存 (Archived)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋規定標題、職等或部門..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Requirements List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequirements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">查無符合條件的年度訓練規定</h3>
            <p className="text-xs text-slate-400">請嘗試調整篩選條件，或點擊「新增年度規定」以建立新指標。</p>
          </div>
        ) : (
          filteredRequirements.map((req) => {
            const matchedEmps = getMatchedEmployees(req);
            const mandatoryCourses = internalCourses.filter((c) => req.mandatoryCourseIds?.includes(c.id));

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md ${
                  req.status === 'active'
                    ? 'border-slate-200/90'
                    : req.status === 'draft'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/60 opacity-80 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Main Information */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black tracking-wide">
                        {req.year} 年度
                      </span>
                      <h3 className="text-base font-black text-slate-800 tracking-tight">{req.title}</h3>
                      {req.status === 'active' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          啟用中
                        </span>
                      )}
                      {req.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          草稿
                        </span>
                      )}
                      {req.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                          已封存
                        </span>
                      )}
                    </div>

                    {/* Target Scope Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          適用單位 / 部門
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {req.targetDepartments.map((dept, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white text-[11px] font-bold text-slate-700 border border-slate-200"
                            >
                              {dept === 'ALL' ? '全公司全單位' : dept}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          適用職等
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {req.targetRanks.map((rank, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white text-[11px] font-bold text-blue-700 border border-blue-200"
                            >
                              {rank === 'ALL' ? '全職等 (03~10)' : `${rank} 職等`}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          適用職稱 (符合 {matchedEmps.length} 人)
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {req.targetJobTitles.map((title, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white text-[11px] font-bold text-purple-700 border border-purple-200"
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hours Breakdown & Courses */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          總規定時數：
                          <span className="text-indigo-600 font-black text-sm">{req.totalRequiredHours} 小時</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          必修時數：
                          <span className="text-red-600 font-black text-sm">{req.mandatoryHours} 小時</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          選修時數：
                          <span className="text-teal-600 font-black text-sm">{req.electiveHours} 小時</span>
                        </div>
                        {req.minCredits && req.minCredits > 0 && (
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Award className="w-4 h-4 text-amber-500" />
                            最低學分：
                            <span className="text-amber-600 font-black text-sm">{req.minCredits} 學分</span>
                          </div>
                        )}
                      </div>

                      {/* Mandatory Courses List */}
                      {mandatoryCourses.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-400">指定必修課程：</span>
                          {mandatoryCourses.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-100 text-[11px] font-bold flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-500" />
                              {c.title} ({c.totalHours}hr)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pass Criteria Note */}
                      {req.passCriteriaNotes && (
                        <div className="text-xs text-slate-500 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100/60 leading-relaxed flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{req.passCriteriaNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <button
                      onClick={() => setPreviewReq(req)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="檢視符合受訓名單"
                    >
                      <Users className="w-3.5 h-3.5" />
                      名單預覽 ({matchedEmps.length})
                    </button>

                    <button
                      onClick={() => {
                        setTargetDupId(req.id);
                        setDuplicateTargetYear(req.year + 1);
                        setIsDuplicateModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="複製至其他年度"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      複製規定
                    </button>

                    <button
                      onClick={() => handleOpenEdit(req)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      編輯設定
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除「${req.title}」嗎？此操作無法復原。`)) {
                          deleteAnnualRequirement(req.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">{editingReq ? '編輯年度訓練規定' : '新增年度訓練規定'}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">年度 *</label>
                  <input
                    type="number"
                    required
                    min={2020}
                    max={2035}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">規定名稱 / 適用職能類別 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例：2026 年度外業工程師專業精進與工安品質規定"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">規定狀態</label>
                <div className="flex items-center gap-4">
                  {(['active', 'draft', 'archived'] as const).map((st) => (
                    <label key={st} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === st}
                        onChange={() => setFormData({ ...formData, status: st })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {st === 'active' ? '啟用中 (Active)' : st === 'draft' ? '草稿 (Draft)' : '封存 (Archived)'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Departments */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">適用部門 (可多選)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.targetDepartments.includes('ALL')) {
                        setFormData({ ...formData, targetDepartments: departmentOptions });
                      } else {
                        setFormData({ ...formData, targetDepartments: ['ALL'] });
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {formData.targetDepartments.includes('ALL') ? '切換為特定部門' : '設定為全公司 (ALL)'}
                  </button>
                </div>

                {formData.targetDepartments.includes('ALL') ? (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-800">
                    目前已設為「全公司全體部門適用」
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {departmentOptions.map((dept) => {
                      const isSelected = formData.targetDepartments.includes(dept);
                      return (
                        <label
                          key={dept}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  targetDepartments: formData.targetDepartments.filter((d) => d !== dept),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetDepartments: [...formData.targetDepartments, dept],
                                });
                              }
                            }}
                            className="hidden"
                          />
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span className="truncate">{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Target Ranks & Job Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">適用職等 (可多選)</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.targetRanks.includes('ALL')) {
                          setFormData({ ...formData, targetRanks: ['06', '07'] });
                        } else {
                          setFormData({ ...formData, targetRanks: ['ALL'] });
                        }
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {formData.targetRanks.includes('ALL') ? '指定職等' : '全職等 (ALL)'}
                    </button>
                  </div>
                  {formData.targetRanks.includes('ALL') ? (
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-xs font-bold text-blue-800">
                      全職等 (03~10) 均適用
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {rankOptions.map((rk) => {
                        const isSel = formData.targetRanks.includes(rk);
                        return (
                          <button
                            key={rk}
                            type="button"
                            onClick={() => {
                              if (isSel) {
                                setFormData({ ...formData, targetRanks: formData.targetRanks.filter((r) => r !== rk) });
                              } else {
                                setFormData({ ...formData, targetRanks: [...formData.targetRanks, rk] });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                              isSel ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {rk} 職等
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">適用職稱 (以逗號分隔)</label>
                  <input
                    type="text"
                    placeholder="例：工程師, 組長, 副主任"
                    value={formData.targetJobTitles.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetJobTitles: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">填寫「全體在職同仁」或「ALL」即代表不限職稱</p>
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  時數與學分規定門檻
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">總須完成時數 *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={200}
                      value={formData.totalRequiredHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setFormData({
                          ...formData,
                          totalRequiredHours: val,
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-red-600 mb-1">必修課程時數 *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={200}
                      value={formData.mandatoryHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setFormData({
                          ...formData,
                          mandatoryHours: val,
                          electiveHours: Math.max(0, formData.totalRequiredHours - val),
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold bg-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-600 mb-1">選修課程時數</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={formData.electiveHours}
                      onChange={(e) => setFormData({ ...formData, electiveHours: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-teal-200 text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-600 mb-1">最低學分數</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.minCredits}
                      onChange={(e) => setFormData({ ...formData, minCredits: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Courses Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  指定必修內部課程 (可勾選多門)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {internalCourses.map((course) => {
                    const isSelected = formData.mandatoryCourseIds.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                mandatoryCourseIds: formData.mandatoryCourseIds.filter((id) => id !== course.id),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                mandatoryCourseIds: [...formData.mandatoryCourseIds, course.id],
                              });
                            }
                          }}
                          className="mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1 text-[11px] leading-snug">
                          <p className="font-bold">{course.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">時數：{course.totalHours} 小時 | 學分：{course.credits || 1}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pass Criteria & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">考核與結訓標準說明</label>
                <textarea
                  rows={3}
                  placeholder="請詳述年度完訓結算條件，例如：結訓測驗需達 70 分、需繳交 SMART 行動計畫、列入年度考績門檻等..."
                  value={formData.passCriteriaNotes}
                  onChange={(e) => setFormData({ ...formData, passCriteriaNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all"
                >
                  {editingReq ? '儲存變更' : '確定新增規定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate to Next Year Modal */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Copy className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-800">複製年度訓練規定至新年</h3>
            </div>
            <p className="text-xs text-slate-500">
              系統將會以現有規定項目為基礎，建立一份新年度的草稿規定，供您直接進行微調與發布。
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">目標複製年度</label>
              <input
                type="number"
                min={2020}
                max={2035}
                value={duplicateTargetYear}
                onChange={(e) => setDuplicateTargetYear(parseInt(e.target.value, 10) || 2027)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleExecuteDuplicate}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                立即複製
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matched Employees Preview Modal */}
      {previewReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  受規範人員名冊預覽
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">{previewReq.title}</p>
              </div>
              <button
                onClick={() => setPreviewReq(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(() => {
                const emps = getMatchedEmployees(previewReq);
                if (emps.length === 0) {
                  return <div className="text-center py-6 text-xs text-slate-400">查無符合此條件的同仁</div>;
                }
                return (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {emps.map((emp) => (
                      <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                            {emp.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              {emp.name}
                              <span className="text-[10px] text-slate-400 font-normal">({emp.empNo})</span>
                              {emp.rank && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                  {emp.rank} 職等
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {emp.department} {emp.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-indigo-600">
                            應完成 {previewReq.totalRequiredHours} hr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewReq(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
