import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Users,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CourseBatch, InternalCourse } from '../../../types';

interface ForceEnrollStudentsModalProps {
  course?: InternalCourse;
  courseId?: string;
  courseTitle?: string;
  batch: CourseBatch;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ForceEnrollStudentsModal: React.FC<ForceEnrollStudentsModalProps> = ({
  course,
  courseId,
  courseTitle,
  batch,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const effectiveCourseId = course?.id || courseId || '';
  const effectiveCourseTitle = course?.title || courseTitle || '';
  const { employees, courseEnrollments, forceEnrollBatchStudents } = useApp();

  // Filter states (matching Global Settings)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedAttribute, setSelectedAttribute] = useState('ALL'); // ALL, 內業, 外業
  const [selectedJobCategory, setSelectedJobCategory] = useState('ALL'); // ALL, 主管職, 工程師職, 一般人員
  const [enrolledStatusFilter, setEnrolledStatusFilter] = useState<'not_enrolled' | 'all' | 'enrolled'>('not_enrolled');

  // Selected employee IDs for batch enrollment
  const [selectedEmpNos, setSelectedEmpNos] = useState<string[]>([]);

  // Enrollment configuration
  const [enrollmentType, setEnrollmentType] = useState<'assigned_mandatory' | 'self_enrolled'>('assigned_mandatory');
  const [listType, setListType] = useState<'regular' | 'waitlist'>('regular');
  const [assignmentNote, setAssignmentNote] = useState('');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set of employee numbers already enrolled in this batch
  const alreadyEnrolledEmpNos = useMemo(() => {
    return new Set(
      courseEnrollments
        .filter((e) => e.batchId === batch.id && e.status !== 'cancelled')
        .map((e) => (e.empNo || (e as any).employeeNo || '').trim().toUpperCase())
    );
  }, [courseEnrollments, batch.id]);

  // Unique departments list derived from employees
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      const dept = emp.department || (emp as any).unit;
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(kw);
        const matchNo = emp.empNo?.toLowerCase().includes(kw);
        const matchDept = (emp.department || (emp as any).unit || '').toLowerCase().includes(kw);
        const matchTitle = (emp.title || (emp as any).position || '').toLowerCase().includes(kw);
        if (!matchName && !matchNo && !matchDept && !matchTitle) return false;
      }

      // 2. Department
      if (selectedDepartment !== 'ALL') {
        const dept = emp.department || (emp as any).unit;
        if (dept !== selectedDepartment) return false;
      }

      // 3. Job Attribute (內業/外業)
      if (selectedAttribute !== 'ALL') {
        const attr = (emp as any).jobAttribute || emp.attribute || (emp.department?.includes('工務') ? '外業' : '內業');
        if (attr !== selectedAttribute) return false;
      }

      // 4. Job Category (主管職 / 工程師職 / 一般人員)
      if (selectedJobCategory !== 'ALL') {
        const title = emp.title || (emp as any).position || '';
        if (selectedJobCategory === '主管職') {
          const isManager = title.includes('長') || title.includes('經理') || title.includes('協理') || title.includes('總監') || title.includes('副理') || title.includes('襄理');
          if (!isManager) return false;
        } else if (selectedJobCategory === '工程師職') {
          const isEngineer = title.includes('工程師') || title.includes('工務');
          if (!isEngineer) return false;
        } else if (selectedJobCategory === '一般人員') {
          const isManager = title.includes('長') || title.includes('經理') || title.includes('協理') || title.includes('總監') || title.includes('副理') || title.includes('襄理');
          if (isManager) return false;
        }
      }

      // 5. Enrolled status filter
      const isEnrolled = alreadyEnrolledEmpNos.has((emp.empNo || '').trim().toUpperCase());
      if (enrolledStatusFilter === 'not_enrolled' && isEnrolled) return false;
      if (enrolledStatusFilter === 'enrolled' && !isEnrolled) return false;

      return true;
    });
  }, [employees, searchKeyword, selectedDepartment, selectedAttribute, selectedJobCategory, enrolledStatusFilter, alreadyEnrolledEmpNos]);

  // Candidates that can be selected (not yet enrolled)
  const selectableCandidates = useMemo(() => {
    return filteredEmployees.filter((emp) => !alreadyEnrolledEmpNos.has((emp.empNo || '').trim().toUpperCase()));
  }, [filteredEmployees, alreadyEnrolledEmpNos]);

  // Toggle single employee
  const handleToggleSelect = (empNo: string) => {
    if (alreadyEnrolledEmpNos.has((empNo || '').trim().toUpperCase())) return;
    setSelectedEmpNos((prev) =>
      prev.includes(empNo) ? prev.filter((id) => id !== empNo) : [...prev, empNo]
    );
  };

  // Toggle select all in current filtered view
  const handleSelectAllVisible = () => {
    const selectableNos = selectableCandidates.map((e) => e.empNo);
    const allSelected = selectableNos.every((no) => selectedEmpNos.includes(no));

    if (allSelected) {
      setSelectedEmpNos((prev) => prev.filter((no) => !selectableNos.includes(no)));
    } else {
      setSelectedEmpNos((prev) => Array.from(new Set([...prev, ...selectableNos])));
    }
  };

  // Submit batch force enrollment
  const handleConfirmEnroll = () => {
    if (selectedEmpNos.length === 0) {
      setFeedbackMsg({ type: 'error', text: '請至少勾選一位同仁進行置入' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = forceEnrollBatchStudents(
        effectiveCourseId,
        batch.id,
        selectedEmpNos,
        enrollmentType,
        listType
      );

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message });
        setSelectedEmpNos([]);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || '置入學員失敗，請重試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  後台強制置入學員 (多人條件篩選指派)
                </h3>
                <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold rounded">
                  {batch.batchNo ? `第 ${batch.batchNo} 梯次` : batch.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                課程：【{effectiveCourseTitle}】· 依全域組織架構、部門、職位屬性或關鍵字篩選並批次置入正取名冊
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500 text-white animate-in slide-in-from-top'
                : 'bg-rose-500 text-white animate-in slide-in-from-top'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* SECTION 1: GLOBAL FILTERING BAR */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                全域條件篩選與快速搜尋 (依照組織總設定)
              </span>
              <span className="text-[11px] text-slate-500">
                符合篩選名單：<strong className="text-slate-900 font-mono">{filteredEmployees.length}</strong> 人
                （其中未在班可選取：<strong className="text-indigo-600 font-mono">{selectableCandidates.length}</strong> 人）
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* Keyword */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜尋姓名、工號、部門或職稱..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500"
                >
                  <option value="ALL">全部部室單位</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Attribute (內外業) */}
              <div>
                <select
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500"
                >
                  <option value="ALL">全體職位屬性</option>
                  <option value="外業">工務外業 (工地現場)</option>
                  <option value="內業">技術內業 (總部/行政)</option>
                </select>
              </div>

              {/* Job Category (職階) */}
              <div>
                <select
                  value={selectedJobCategory}
                  onChange={(e) => setSelectedJobCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500"
                >
                  <option value="ALL">全體職等職位</option>
                  <option value="主管職">主管職 (經理/所長/主任)</option>
                  <option value="工程師職">工程師職 (工務/技工)</option>
                  <option value="一般人員">專員與行政同仁</option>
                </select>
              </div>
            </div>

            {/* Sub Filter Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold">在班狀態：</span>
                <button
                  type="button"
                  onClick={() => setEnrolledStatusFilter('not_enrolled')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                    enrolledStatusFilter === 'not_enrolled'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  尚未在此班 (可加入)
                </button>
                <button
                  type="button"
                  onClick={() => setEnrolledStatusFilter('enrolled')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                    enrolledStatusFilter === 'enrolled'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  已在班學員 ({alreadyEnrolledEmpNos.size})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrolledStatusFilter('all')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                    enrolledStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  全部同仁
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  disabled={selectableCandidates.length === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {selectableCandidates.length > 0 &&
                  selectableCandidates.every((e) => selectedEmpNos.includes(e.empNo)) ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      取消全選
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      全選可置入 ({selectableCandidates.length})
                    </>
                  )}
                </button>

                {selectedEmpNos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedEmpNos([])}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    清空已選 ({selectedEmpNos.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: EMPLOYEE LIST TABLE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10 font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">選取</th>
                    <th className="p-3">工號</th>
                    <th className="p-3">姓名</th>
                    <th className="p-3">部室單位</th>
                    <th className="p-3">職稱 / 職位</th>
                    <th className="p-3">屬性</th>
                    <th className="p-3 text-right">本班狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        查無符合篩選條件之同仁
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isEnrolled = alreadyEnrolledEmpNos.has(emp.empNo);
                      const isChecked = selectedEmpNos.includes(emp.empNo);

                      return (
                        <tr
                          key={emp.id || emp.empNo}
                          onClick={() => {
                            if (!isEnrolled) handleToggleSelect(emp.empNo);
                          }}
                          className={`transition-colors ${
                            isEnrolled
                              ? 'bg-slate-50/60 opacity-60 cursor-not-allowed'
                              : isChecked
                              ? 'bg-indigo-50/60 hover:bg-indigo-50 cursor-pointer'
                              : 'hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isEnrolled ? (
                              <span className="w-4 h-4 inline-block rounded bg-slate-200 border border-slate-300"></span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelect(emp.empNo)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">{emp.empNo}</td>
                          <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                          <td className="p-3 text-slate-600 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {emp.department || (emp as any).unit || '營建工務'}
                          </td>
                          <td className="p-3 text-slate-700">{emp.title || (emp as any).position || '同仁'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                emp.attribute === '外業' || (emp as any).jobAttribute === '外業' || emp.department?.includes('工務')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {emp.attribute || (emp as any).jobAttribute || (emp.department?.includes('工務') ? '外業' : '內業')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isEnrolled ? (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                已在班
                              </span>
                            ) : isChecked ? (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded text-[11px]">
                                待置入
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">未選取</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: ENROLLMENT CONFIGURATION ATTRIBUTES */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                報名屬性
              </label>
              <select
                value={enrollmentType}
                onChange={(e) => setEnrollmentType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="assigned_mandatory">公司指派必修 (強制指派)</option>
                <option value="self_enrolled">管理員代為報名 (一般選修)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                名額席位
              </label>
              <select
                value={listType}
                onChange={(e) => setListType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="regular">正取席位 (自動核准入班)</option>
                <option value="waitlist">候補名單 (依序排隊)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                置入備註 / 派訓說明 (選填)
              </label>
              <input
                type="text"
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="例如：營建處 2026 專案主管必修考核要求"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              已勾選待置入：
            </span>
            <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg font-mono text-xs shadow-2xs">
              {selectedEmpNos.length} 位同仁
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              disabled={selectedEmpNos.length === 0 || isSubmitting}
              onClick={handleConfirmEnroll}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting
                ? '正在置入學員中...'
                : `確認強制置入 (${selectedEmpNos.length} 位同仁)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
