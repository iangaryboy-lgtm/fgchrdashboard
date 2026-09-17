import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  UserCheck,
  Search,
  AlertCircle,
  CheckCircle2,
  Check,
  FolderTree,
  Building2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { OrgTreePickerModal } from '../common/OrgTreePickerModal';
import { OrgNode } from '../../types';

interface EmployeeAuthCardProps {
  onSuccess?: () => void;
  onOpenGoogleAdmin?: () => void;
}

interface OrgDeptOption {
  id: string;
  name: string;
  code?: string;
  level: string;
  levelLabel: string;
  fullPath: string;
  parentName?: string;
}

/**
 * Extract department and division units directly from the Organization Structure Tree.
 */
function extractDepartmentsFromOrgTree(tree: OrgNode): OrgDeptOption[] {
  const list: OrgDeptOption[] = [];
  const seen = new Set<string>();

  const traverse = (node: OrgNode, path: OrgNode[]) => {
    if (!node) return;
    const currentPath = [...path, node];
    const fullPath = currentPath.map((n) => n.name).join(' > ');

    let levelLabel = '部室單位';
    let isSelectableDept = false;

    if (node.level === 'department' || node.level === '部室') {
      levelLabel = '部室 / 工務所';
      isSelectableDept = true;
    } else if (node.level === 'division' || node.level === '處級') {
      levelLabel = '處級 / 工程處';
      isSelectableDept = true;
    } else if (node.level === 'president' || node.level === '總經理') {
      levelLabel = '總經理室';
      isSelectableDept = true;
    } else if (node.level === 'board' || node.level === '董事長') {
      levelLabel = '董事長室';
      isSelectableDept = true;
    } else if (node.children && node.children.length > 0) {
      levelLabel = '組織單位';
      isSelectableDept = true;
    }

    if (isSelectableDept && node.name && !seen.has(node.name)) {
      seen.add(node.name);
      list.push({
        id: node.id,
        name: node.name,
        code: node.code,
        level: node.level,
        levelLabel,
        fullPath,
        parentName: path.length > 0 ? path[path.length - 1].name : undefined,
      });
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child, currentPath));
    }
  };

  if (tree) {
    traverse(tree, []);
  }

  return list;
}

/**
 * Check if the selected department matches the employee's department,
 * accounting for org tree hierarchy and standard aliases.
 */
function isDepartmentMatched(
  selectedDept: string,
  empDept: string,
  empSection?: string,
  orgTree?: OrgNode
): boolean {
  if (!selectedDept || !empDept) return false;
  const sel = selectedDept.trim();
  const emp = empDept.trim();

  // Direct match
  if (sel === emp) return true;

  // Substring match (e.g. "建築營建工程處 (工程一部)" contains "工程一部")
  if (sel.includes(emp) || emp.includes(sel)) return true;

  // Core business unit keyword aliases
  const aliasKeywords = ['工程一部', '工程二部', '土木', '人力資源', '人資', '企劃', '總經理', '董事長'];
  for (const kw of aliasKeywords) {
    if (sel.includes(kw) && emp.includes(kw)) {
      return true;
    }
  }

  // Tree ancestry / descendant resolution
  if (orgTree) {
    let foundRelated = false;
    const checkTree = (node: OrgNode, path: string[]) => {
      const currentPath = [...path, node.name];
      const nodeName = node.name || '';
      const matchesSelected = nodeName.includes(sel) || sel.includes(nodeName);
      const matchesEmp =
        nodeName.includes(emp) ||
        emp.includes(nodeName) ||
        (empSection && (nodeName.includes(empSection) || empSection.includes(nodeName)));

      if (matchesSelected && matchesEmp) {
        foundRelated = true;
        return;
      }

      if (matchesSelected) {
        const checkDescendants = (n: OrgNode) => {
          if (
            n.name.includes(emp) ||
            emp.includes(n.name) ||
            (empSection && (n.name.includes(empSection) || empSection.includes(n.name)))
          ) {
            foundRelated = true;
          }
          if (n.children) n.children.forEach(checkDescendants);
        };
        if (node.children) node.children.forEach(checkDescendants);
      }

      if (matchesEmp) {
        if (currentPath.some((p) => p.includes(sel) || sel.includes(p))) {
          foundRelated = true;
        }
      }

      if (node.children) {
        node.children.forEach((child) => checkTree(child, currentPath));
      }
    };
    checkTree(orgTree, []);
    if (foundRelated) return true;
  }

  return false;
}

export const EmployeeAuthCard: React.FC<EmployeeAuthCardProps> = ({ onSuccess }) => {
  const { employees, permissionMatrix, setCurrentUser, setActiveView, orgTree } = useApp();

  const [empNo, setEmpNo] = useState('');
  const [name, setName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [showOrgTreeModal, setShowOrgTreeModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Extract department units directly from the Organization Structure Tree (orgTree)
  const treeDepartments = useMemo(() => {
    return extractDepartmentsFromOrgTree(orgTree);
  }, [orgTree]);

  // Fallback / merged departments list from orgTree & employees
  const allDepartmentOptions = useMemo(() => {
    const map = new Map<string, OrgDeptOption>();

    // 1. First add all departments from orgTree
    treeDepartments.forEach((item) => {
      map.set(item.name, item);
    });

    // 2. Standard company department aliases
    const standardAliases = [
      { name: '工程一部', levelLabel: '處級 / 工程一部', fullPath: '總經理室 > 建築營建工程處 (工程一部)' },
      { name: '工程二部', levelLabel: '處級 / 工程二部', fullPath: '總經理室 > 中南部營建工程處 (工程二部)' },
      { name: '土木部', levelLabel: '處級 / 土木工程處', fullPath: '總經理室 > 土木及特殊工程處' },
      { name: '人力資源室', levelLabel: '室級 / 幕僚單位', fullPath: '總經理室 > 總管理處 > 人力資源室' },
      { name: '工務企劃室', levelLabel: '室級 / 幕僚單位', fullPath: '總經理室 > 總管理處 > 工務企劃室' },
      { name: '總經理室', levelLabel: '總經理室', fullPath: '總經理室' },
    ];

    standardAliases.forEach((alias, idx) => {
      if (!map.has(alias.name)) {
        map.set(alias.name, {
          id: `std-dept-${idx}`,
          name: alias.name,
          level: 'department',
          levelLabel: alias.levelLabel,
          fullPath: alias.fullPath,
        });
      }
    });

    // 3. Add any custom department listed in employee records if not already present
    employees.forEach((emp) => {
      if (emp.department && !map.has(emp.department)) {
        map.set(emp.department, {
          id: `emp-dept-${emp.department}`,
          name: emp.department,
          level: 'department',
          levelLabel: '同仁名冊所屬單位',
          fullPath: emp.department,
        });
      }
    });

    return Array.from(map.values());
  }, [treeDepartments, employees]);

  const filteredDepts = useMemo(() => {
    if (!deptSearch.trim()) return allDepartmentOptions;
    const q = deptSearch.trim().toLowerCase();
    return allDepartmentOptions.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.fullPath.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q))
    );
  }, [allDepartmentOptions, deptSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsValidating(true);

    const cleanEmpNo = empNo.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanDept = selectedDept.trim();

    if (!cleanEmpNo || !cleanName || !cleanDept) {
      setErrorMsg('請完整填寫員工編號、同仁姓名並選擇所屬部室單位');
      setIsValidating(false);
      return;
    }

    setTimeout(() => {
      // Strict identity verification: must match empNo, name, and department in org tree
      const emp = employees.find(
        (item) =>
          item.empNo.toUpperCase() === cleanEmpNo &&
          item.name === cleanName &&
          isDepartmentMatched(cleanDept, item.department, item.section, orgTree)
      );

      if (!emp) {
        setErrorMsg('身分驗證失敗：查無相符之同仁資料，請確認員工編號、同仁姓名與所屬部室單位是否正確');
        setIsValidating(false);
        return;
      }

      // Check permission matrix
      const perm = permissionMatrix.find((p) => p.empNo === emp.empNo);
      if (perm && !perm.canLogin) {
        setErrorMsg('您目前未在系統可登入白名單內，請洽詢人力資源室管理員開通權限');
        setIsValidating(false);
        return;
      }

      setSuccessMsg(`身分驗證成功！歡迎 ${emp.name} 同仁 (${emp.title}) 登入系統`);

      const userSession = {
        type: 'employee' as const,
        empNo: emp.empNo,
        employee: emp,
      };

      if (rememberMe) {
        try {
          localStorage.setItem('farglory_current_user', JSON.stringify(userSession));
        } catch (err) {
          console.warn('Unable to persist session', err);
        }
      }

      setTimeout(() => {
        setCurrentUser(userSession);
        setActiveView('frontend_home');
        setIsValidating(false);
        if (onSuccess) onSuccess();
      }, 500);
    }, 450);
  };

  return (
    <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 font-sans select-none text-slate-800 animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Header Pill */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF2FE] text-[#4F46E5] text-xs font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
          遠營Forms表單
        </span>
      </div>

      {/* 2. Main Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-2xl">
          <UserCheck className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            驗證同仁資料 — 身分登入
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            請輸入個人資料並點選所屬組織樹之部室單位進行身分驗證
          </p>
        </div>
      </div>

      {/* Error Message Feedback */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Success Message Feedback */}
      {successMsg && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 1: 員工編號 (Employee ID) */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-800 mb-1.5">
            員工編號 (Employee ID) <span className="text-rose-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={empNo}
            onChange={(e) => {
              setEmpNo(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="請輸入您的員工編號"
            required
            autoComplete="off"
            className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 bg-white transition-all shadow-2xs font-mono uppercase"
          />
        </div>

        {/* Field 2: 同仁姓名 (Full Name) */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-slate-800 mb-1.5">
            同仁姓名 (Full Name) <span className="text-rose-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="請輸入您的姓名"
            required
            autoComplete="off"
            className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 bg-white transition-all shadow-2xs font-sans"
          />
        </div>

        {/* Field 3: 部室單位 (Using Org Structure Tree) */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-[13px] font-bold text-slate-800">
              部室單位 (所屬組織樹之部室/處級單位) <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowOrgTreeModal(true)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
            >
              <FolderTree className="w-3 h-3 text-indigo-600" />
              開啟組織架構樹選取
            </button>
          </div>

          <div
            onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
            className={`w-full px-4 py-3 text-xs sm:text-sm border rounded-xl flex items-center justify-between cursor-pointer bg-white transition-all shadow-2xs ${
              isDeptDropdownOpen
                ? 'border-indigo-500 ring-2 ring-indigo-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span
                className={
                  selectedDept ? 'text-slate-900 font-semibold truncate' : 'text-slate-400 font-normal'
                }
              >
                {selectedDept || '請由組織樹清單點選或搜尋「部室」層級單位'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <Search className="w-3.5 h-3.5" />
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Search Dropdown Menu with Org Tree Hierarchies */}
          {isDeptDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-30 p-2.5 space-y-2 animate-in fade-in duration-150">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="搜尋組織樹部室名稱、代碼..."
                  autoFocus
                  className="w-full pl-8.5 pr-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {filteredDepts.map((dept) => (
                  <button
                    key={dept.id || dept.name}
                    type="button"
                    onClick={() => {
                      setSelectedDept(dept.name);
                      setIsDeptDropdownOpen(false);
                      setDeptSearch('');
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-start justify-between hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors ${
                      selectedDept === dept.name
                        ? 'bg-indigo-50/80 font-bold text-indigo-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{dept.name}</span>
                        {dept.code && (
                          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-100 text-slate-600 rounded">
                            {dept.code}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded">
                          {dept.levelLabel}
                        </span>
                      </div>
                      {dept.fullPath && dept.fullPath !== dept.name && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                          <span>組織路徑：{dept.fullPath}</span>
                        </div>
                      )}
                    </div>
                    {selectedDept === dept.name && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
                {filteredDepts.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                    <p>查無符合之組織部室單位</p>
                    <button
                      type="button"
                      onClick={() => setShowOrgTreeModal(true)}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                    >
                      開啟視覺化組織架構樹選取
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Checkbox: 保持登入狀態 */}
        <div className="pt-1.5">
          <label className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-700 cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>保持登入狀態</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isValidating}
          className="w-full mt-4 py-3.5 bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#090D1A] text-white font-bold rounded-xl transition-all shadow-md text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          {isValidating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>驗證身分並登入</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Quick Access / Demonstration Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>快速身分切換與展示通道：</span>
            <span>點選即可快速載入</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const adminSession = {
                  type: 'google_admin' as const,
                  googleEmail: 'iangaryboy@gmail.com',
                  adminRole: 'SUPER_ADMIN' as const,
                };
                localStorage.setItem('farglory_current_user_v1', JSON.stringify(adminSession));
                setCurrentUser(adminSession);
                setActiveView('frontend_project_plan');
                if (onSuccess) onSuccess();
              }}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              超級管理員 (Gary)
            </button>

            <button
              type="button"
              onClick={() => {
                const emp = employees.find((e) => e.empNo === 'FG1001') || employees[0];
                if (emp) {
                  const userSession = {
                    type: 'employee' as const,
                    empNo: emp.empNo,
                    employee: emp,
                  };
                  localStorage.setItem('farglory_current_user_v1', JSON.stringify(userSession));
                  setCurrentUser(userSession);
                  setActiveView('frontend_project_plan');
                  if (onSuccess) onSuccess();
                }
              }}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              工程處主管 (陳冠霖)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const defaultAdmin = {
                type: 'google_admin' as const,
                googleEmail: 'iangaryboy@gmail.com',
                adminRole: 'SUPER_ADMIN' as const,
              };
              setCurrentUser(defaultAdmin);
              setActiveView('frontend_project_plan');
              if (onSuccess) onSuccess();
            }}
            className="w-full mt-1 py-2 text-xs text-slate-500 hover:text-blue-600 font-medium hover:underline text-center"
          >
            直接進入【開案計畫儀表板】戰情室 ➜
          </button>
        </div>
      </form>

      {/* Visual Organization Tree Picker Modal */}
      {showOrgTreeModal && (
        <OrgTreePickerModal
          isOpen={showOrgTreeModal}
          onClose={() => setShowOrgTreeModal(false)}
          title="選擇同仁所屬組織架構樹部室單位"
          initialDepartment={selectedDept}
          onSelect={({ department }) => {
            if (department) {
              setSelectedDept(department);
            }
            setShowOrgTreeModal(false);
            if (errorMsg) setErrorMsg(null);
          }}
        />
      )}
    </div>
  );
};
