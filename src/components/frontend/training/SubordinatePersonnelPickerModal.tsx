import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Filter,
  Check,
  UserCheck,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Employee, InternalCourse, CourseEnrollment } from '../../../types';

interface SubordinatePersonnelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subordinateEmployees: Employee[];
  managerEmployee: Employee;
  selectedEmpNo: string;
  onSelectEmployee: (employee: Employee) => void;
  course: InternalCourse;
  selectedBatchId: string;
  courseEnrollments: CourseEnrollment[];
  scopeTitle: string;
  scopeDescription: string;
}

export const SubordinatePersonnelPickerModal: React.FC<SubordinatePersonnelPickerModalProps> = ({
  isOpen,
  onClose,
  subordinateEmployees,
  managerEmployee,
  selectedEmpNo,
  onSelectEmployee,
  course,
  selectedBatchId,
  courseEnrollments,
  scopeTitle,
  scopeDescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedTitle, setSelectedTitle] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_ENROLLED' | 'ENROLLED' | 'COMPLETED'>('ALL');
  const [tempSelectedEmpNo, setTempSelectedEmpNo] = useState(selectedEmpNo);

  // Sync tempSelectedEmpNo when modal opens or selectedEmpNo changes
  React.useEffect(() => {
    setTempSelectedEmpNo(selectedEmpNo);
  }, [selectedEmpNo, isOpen]);

  // Extract unique departments and titles from subordinates
  const departments = useMemo(() => {
    const set = new Set<string>();
    subordinateEmployees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }, [subordinateEmployees]);

  const titles = useMemo(() => {
    const set = new Set<string>();
    subordinateEmployees.forEach((emp) => {
      if (emp.title) set.add(emp.title);
    });
    return Array.from(set).sort();
  }, [subordinateEmployees]);

  // Helper to get training status of an employee for this course
  const getEmployeeCourseStatus = useMemo(() => {
    return (empNo: string) => {
      const match = courseEnrollments.find(
        (e) => e.courseId === course.id && e.empNo === empNo && e.status !== 'cancelled'
      );
      if (!match) {
        return {
          code: 'not_enrolled',
          label: '尚未報名',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          badgeText: '可優先安排',
        };
      }
      if (match.status === 'completed' || (match.quizScore && match.quizScore >= 70)) {
        return {
          code: 'completed',
          label: '已完訓合格',
          color: 'text-purple-700 bg-purple-50 border-purple-200',
          badgeText: match.certificateNumber ? '已發證' : '已測驗合格',
        };
      }
      if (match.batchId === selectedBatchId) {
        if (match.listType === 'waitlist') {
          return {
            code: 'waitlist',
            label: '本梯次候補中',
            color: 'text-amber-700 bg-amber-50 border-amber-200',
            badgeText: `序號 第${match.waitlistRank || 1}位`,
          };
        }
        return {
          code: 'enrolled_this',
          label: '已報名本梯次',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          badgeText: '正取參訓',
        };
      }
      return {
        code: 'enrolled_other',
        label: '已報名其他梯次',
        color: 'text-slate-700 bg-slate-100 border-slate-200',
        badgeText: '其他時段',
      };
    };
  }, [courseEnrollments, course.id, selectedBatchId]);

  // Counts for status filter tabs
  const statusCounts = useMemo(() => {
    let notEnrolled = 0;
    let enrolled = 0;
    let completed = 0;
    subordinateEmployees.forEach((emp) => {
      const status = getEmployeeCourseStatus(emp.empNo);
      if (status.code === 'not_enrolled') notEnrolled++;
      else if (status.code === 'completed') completed++;
      else enrolled++;
    });
    return {
      all: subordinateEmployees.length,
      notEnrolled,
      enrolled,
      completed,
    };
  }, [subordinateEmployees, getEmployeeCourseStatus]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return subordinateEmployees.filter((emp) => {
      // 1. Keyword search
      if (q) {
        const matchName = (emp.name || '').toLowerCase().includes(q);
        const matchEmpNo = (emp.empNo || '').toLowerCase().includes(q);
        const matchDept = (emp.department || '').toLowerCase().includes(q);
        const matchSec = (emp.section || '').toLowerCase().includes(q);
        const matchTitle = (emp.title || '').toLowerCase().includes(q);
        const matchProj = (emp.currentProject || '').toLowerCase().includes(q);
        if (!matchName && !matchEmpNo && !matchDept && !matchSec && !matchTitle && !matchProj) {
          return false;
        }
      }

      // 2. Department filter
      if (selectedDept !== 'ALL') {
        if (emp.department !== selectedDept && emp.section !== selectedDept) {
          return false;
        }
      }

      // 3. Title filter
      if (selectedTitle !== 'ALL') {
        if (emp.title !== selectedTitle) {
          return false;
        }
      }

      // 4. Course status filter
      if (statusFilter !== 'ALL') {
        const st = getEmployeeCourseStatus(emp.empNo).code;
        if (statusFilter === 'NOT_ENROLLED' && st !== 'not_enrolled') return false;
        if (statusFilter === 'COMPLETED' && st !== 'completed') return false;
        if (statusFilter === 'ENROLLED' && (st === 'not_enrolled' || st === 'completed')) return false;
      }

      return true;
    });
  }, [subordinateEmployees, searchTerm, selectedDept, selectedTitle, statusFilter, getEmployeeCourseStatus]);

  const handleApply = () => {
    const chosen = subordinateEmployees.find((e) => e.empNo === tempSelectedEmpNo);
    if (chosen) {
      onSelectEmployee(chosen);
      onClose();
    }
  };

  const handleSelectImmediately = (emp: Employee) => {
    setTempSelectedEmpNo(emp.empNo);
    onSelectEmployee(emp);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="subordinate-personnel-picker-modal"
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                組織樹主管權限
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {scopeTitle}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              選擇報名同仁 (主管轄下人員篩選)
            </h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>操作主管：<strong className="text-white">{managerEmployee.name}</strong> ({managerEmployee.empNo})</span>
              <span className="text-slate-500">·</span>
              <span>{scopeDescription}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
            title="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Target Context Bar */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>目標課程：<strong className="font-bold">{course.title}</strong></span>
            <span className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] text-blue-700 font-bold">
              {course.courseCode}
            </span>
          </div>
          {/* Quick Select Self Button */}
          <button
            type="button"
            onClick={() => handleSelectImmediately(managerEmployee)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              tempSelectedEmpNo === managerEmployee.empNo
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            快速指定主管本人 ({managerEmployee.name})
            {tempSelectedEmpNo === managerEmployee.empNo && <Check className="w-3 h-3" />}
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Row 1: Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名、工號、部門、職稱、案場..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department selector */}
            <div className="sm:col-span-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">全部轄下部門 ({subordinateEmployees.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d} ({subordinateEmployees.filter((e) => e.department === d || e.section === d).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Title selector */}
            <div className="sm:col-span-3">
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">全部職稱</option>
                {titles.map((t) => (
                  <option key={t} value={t}>
                    {t} ({subordinateEmployees.filter((e) => e.title === t).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Status Tabs & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                研習狀態：
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                全部同仁 ({statusCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NOT_ENROLLED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  statusFilter === 'NOT_ENROLLED'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                尚未報名 ({statusCounts.notEnrolled})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ENROLLED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'ENROLLED'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                已報名參訓 ({statusCounts.enrolled})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-purple-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                }`}
              >
                已完訓合格 ({statusCounts.completed})
              </button>
            </div>

            {(searchTerm || selectedDept !== 'ALL' || selectedTitle !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('ALL');
                  setSelectedTitle('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                重設篩選條件
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-1">
            <span>
              符合條件同仁：<strong className="text-slate-800 font-bold">{filteredEmployees.length}</strong> 位
            </span>
            <span className="text-[11px] text-slate-400">
              ※ 點擊同仁卡片即可直接選取該員進行報名
            </span>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">無符合篩選條件的同仁</p>
              <p className="text-xs text-slate-400 mt-1">請嘗試變更搜尋關鍵字或清除狀態篩選條件</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('ALL');
                  setSelectedTitle('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100"
              >
                清除所有篩選條件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredEmployees.map((emp) => {
                const isSelected = tempSelectedEmpNo === emp.empNo;
                const isManager = emp.empNo === managerEmployee.empNo;
                const status = getEmployeeCourseStatus(emp.empNo);

                return (
                  <div
                    key={emp.empNo}
                    onClick={() => setTempSelectedEmpNo(emp.empNo)}
                    onDoubleClick={() => handleSelectImmediately(emp)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-xs'
                    }`}
                  >
                    {/* Top row: Avatar, Info, and Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : isManager
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {emp.name ? emp.name.slice(0, 1) : '同'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{emp.name}</h4>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {emp.empNo}
                            </span>
                            {isManager && (
                              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                                主管本人
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="flex items-center gap-1 text-slate-600 truncate">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              {emp.department || '未分配部門'}
                              {emp.section ? ` · ${emp.section}` : ''}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
                              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                              {emp.title || '同仁'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Course status tag */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${status.color}`}
                        >
                          {status.label}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{status.badgeText}</div>
                      </div>
                    </div>

                    {/* Bottom Action / Selection indicator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {emp.currentProject ? `現行案場：${emp.currentProject}` : '全職在職'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectImmediately(emp);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            已選定
                          </>
                        ) : (
                          '選取此同仁'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-700">
            {tempSelectedEmpNo ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">目前選定報名同仁：</span>
                {(() => {
                  const emp = subordinateEmployees.find((e) => e.empNo === tempSelectedEmpNo);
                  if (!emp) return <span>{tempSelectedEmpNo}</span>;
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      {emp.name} ({emp.empNo}) · {emp.department} {emp.title}
                      {emp.empNo === managerEmployee.empNo && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">
                          本人
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <span className="text-slate-400">請由上方清單選擇欲報名的同仁</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              確認套用並返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
