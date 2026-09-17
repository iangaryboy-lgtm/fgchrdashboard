import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  ClipboardList,
  GraduationCap,
  Sliders,
  Search,
  Filter,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  Check,
  X,
  UserCheck,
  Briefcase,
  Layers,
  Info,
  ArrowUpDown,
  Lock,
  Unlock,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee, PermissionMatrixItem } from '../../types';
import { PermissionConflictModal } from './PermissionConflictModal';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

export const DepartmentManagerPermissionMatrix: React.FC = () => {
  const {
    employees,
    permissionMatrix,
    updatePermissionItem,
    batchSetPermission,
    dashboards,
    orgTree,
    setCurrentUser,
    setActiveView,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedRankFilter, setSelectedRankFilter] = useState('ALL');
  const [onlyManagers, setOnlyManagers] = useState(true);
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  // Multi-selection for bulk operations
  const [selectedEmpNos, setSelectedEmpNos] = useState<string[]>([]);

  // Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('engineering_manager');

  // Toast feedback
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // Leaders identified from Org Tree
  const orgLeaderEmpNos = useMemo(() => {
    const leaderSet = new Set<string>();
    const leaderNameSet = new Set<string>();

    const traverse = (node: any) => {
      if (!node) return;
      if (node.leaderEmpNo) leaderSet.add(node.leaderEmpNo);
      if (node.leaderName) {
        // e.g. "林柏宏 (兼)" -> extract "林柏宏"
        const cleanName = node.leaderName.split('(')[0].split('/')[0].trim();
        leaderNameSet.add(cleanName);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };
    traverse(orgTree);

    // match by leaderName in employees
    employees.forEach((emp) => {
      if (leaderNameSet.has(emp.name.trim())) {
        leaderSet.add(emp.empNo);
      }
    });

    return leaderSet;
  }, [orgTree, employees]);

  // Determine if an employee is a Department Manager / Leader
  const isDepartmentManager = useCallback(
    (emp: Employee) => {
      if (orgLeaderEmpNos.has(emp.empNo)) return true;
      if (['07', '08', '09'].includes(emp.rank)) return true;
      const title = emp.title || '';
      return (
        title.includes('經理') ||
        title.includes('副理') ||
        title.includes('處長') ||
        title.includes('副處長') ||
        title.includes('組長') ||
        title.includes('棟組長') ||
        title.includes('主任') ||
        title.includes('室長') ||
        title.includes('總經理') ||
        title.includes('主管')
      );
    },
    [orgLeaderEmpNos]
  );

  // Get department list
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    // Order standard departments logically
    const ordered = [
      '總經理室',
      '工程一部',
      '工程二部',
      '土木部',
      '人力資源室',
      '工務企劃室',
    ];
    const result: string[] = [];
    ordered.forEach((d) => {
      if (depts.has(d)) result.push(d);
    });
    depts.forEach((d) => {
      if (!result.includes(d)) result.push(d);
    });
    return result;
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (onlyManagers && !isDepartmentManager(emp)) return false;
      if (selectedDeptFilter !== 'ALL' && emp.department !== selectedDeptFilter) return false;
      if (selectedRankFilter === '09' && emp.rank !== '09') return false;
      if (selectedRankFilter === '08' && emp.rank !== '08') return false;
      if (selectedRankFilter === '07' && emp.rank !== '07') return false;
      if (selectedRankFilter === '05_06' && !['05', '06'].includes(emp.rank)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchEmpNo = emp.empNo.toLowerCase().includes(q);
        const matchName = emp.name.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        const matchTitle = emp.title.toLowerCase().includes(q);
        const matchSection = (emp.section || '').toLowerCase().includes(q);
        if (!matchEmpNo && !matchName && !matchDept && !matchTitle && !matchSection) {
          return false;
        }
      }
      return true;
    });
  }, [employees, onlyManagers, isDepartmentManager, selectedDeptFilter, selectedRankFilter, searchTerm]);

  // Group filtered employees by department
  const employeesByDept = useMemo(() => {
    const map = new Map<string, Employee[]>();
    // initialize standard departments
    allDepartments.forEach((dept) => {
      if (selectedDeptFilter === 'ALL' || selectedDeptFilter === dept) {
        map.set(dept, []);
      }
    });

    filteredEmployees.forEach((emp) => {
      const dept = emp.department || '未分配部門';
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    });

    // Remove empty groups unless a specific department filter is applied
    const entries = Array.from(map.entries()).filter(([_, list]) => list.length > 0);
    return entries;
  }, [allDepartments, selectedDeptFilter, filteredEmployees]);

  // Quick lookup map for permissions
  const permMap = useMemo(() => {
    const map = new Map<string, PermissionMatrixItem>();
    permissionMatrix.forEach((p) => map.set(p.empNo, p));
    return map;
  }, [permissionMatrix]);

  // Helper to get permission for an employee
  const getEmployeePermission = useCallback(
    (emp: Employee): PermissionMatrixItem => {
      const existing = permMap.get(emp.empNo);
      if (existing) return existing;
      const isLeader = isDepartmentManager(emp);
      const isHR = emp.department === '人力資源室';
      return {
        empNo: emp.empNo,
        name: emp.name,
        department: emp.department,
        title: emp.title,
        canLogin: true,
        canAccessBackend: isHR || emp.rank === '09',
        dashboardAccess: {
          projectPlan: true,
          manpowerDashboard: true,
          candidatePool: isLeader,
          surveyFill: true,
          trainingPortal: true,
        },
      };
    },
    [permMap, isDepartmentManager]
  );

  // Toggle single permission for a manager
  const handleTogglePermission = useCallback(
    (emp: Employee, moduleKey: string, currentVal: boolean) => {
      const newVal = !currentVal;
      const perm = getEmployeePermission(emp);

      if (moduleKey === '__CAN_LOGIN__') {
        updatePermissionItem(emp.empNo, { canLogin: newVal });
        showToast(`已${newVal ? '開啟' : '關閉'}「${emp.name}」之系統前台登入權限`);
      } else if (moduleKey === '__CAN_ACCESS_BACKEND__') {
        updatePermissionItem(emp.empNo, { canAccessBackend: newVal });
        showToast(`已${newVal ? '開通' : '取消'}「${emp.name}」之管理後台存取權限`);
      } else {
        const nextDashboardAccess = {
          ...(perm.dashboardAccess || {}),
          [moduleKey]: newVal,
        };
        updatePermissionItem(emp.empNo, { dashboardAccess: nextDashboardAccess });

        const moduleLabel =
          dashboards.find((d) => d.id === moduleKey)?.name ||
          (moduleKey === 'manpowerDashboard'
            ? '人力供需戰情看板'
            : moduleKey === 'trainingPortal'
            ? '專業訓練學習專區'
            : moduleKey);
        showToast(`已${newVal ? '開通' : '取消'}「${emp.name}」之【${moduleLabel}】存取權限`);
      }
    },
    [getEmployeePermission, updatePermissionItem, dashboards, showToast]
  );

  // Department-level toggle for a specific module
  const handleDeptModuleToggle = useCallback(
    (deptEmployees: Employee[], moduleKey: string) => {
      const allAllowed = deptEmployees.every((emp) => {
        const p = getEmployeePermission(emp);
        if (moduleKey === '__CAN_LOGIN__') return p.canLogin;
        if (moduleKey === '__CAN_ACCESS_BACKEND__') return !!p.canAccessBackend;
        return p.dashboardAccess?.[moduleKey] !== false;
      });

      const nextAllowed = !allAllowed;
      const empNos = deptEmployees.map((e) => e.empNo);

      batchSetPermission(empNos, moduleKey, nextAllowed);
      showToast(`已批次${nextAllowed ? '開通' : '關閉'}本部 ${deptEmployees.length} 位同仁之指定權限`);
    },
    [getEmployeePermission, batchSetPermission, showToast]
  );

  // Department-level grant all / revoke all
  const handleDeptGrantAll = useCallback(
    (deptName: string, deptEmployees: Employee[], grantAll: boolean) => {
      const empNos = deptEmployees.map((e) => e.empNo);
      empNos.forEach((no) => {
        const emp = deptEmployees.find((e) => e.empNo === no);
        if (!emp) return;
        const currentPerm = getEmployeePermission(emp);
        const newAccess: Record<string, boolean> = {};

        dashboards.forEach((d) => {
          newAccess[d.id] = grantAll;
        });
        newAccess.projectPlan = grantAll;
        newAccess.manpowerDashboard = grantAll;
        newAccess.candidatePool = grantAll;
        newAccess.surveyFill = grantAll;
        newAccess.trainingPortal = grantAll;

        updatePermissionItem(no, {
          canLogin: grantAll ? true : currentPerm.canLogin,
          canAccessBackend: grantAll ? currentPerm.canAccessBackend : false,
          dashboardAccess: newAccess,
        });
      });

      showToast(`已將【${deptName}】${deptEmployees.length} 位主管全數${grantAll ? '授權全部儀表板' : '關閉儀表板權限'}`);
    },
    [dashboards, getEmployeePermission, updatePermissionItem, showToast]
  );

  // Row select toggle
  const handleToggleSelectEmp = useCallback((empNo: string) => {
    setSelectedEmpNos((prev) =>
      prev.includes(empNo) ? prev.filter((id) => id !== empNo) : [...prev, empNo]
    );
  }, []);

  const handleSelectAllFiltered = useCallback(() => {
    if (selectedEmpNos.length === filteredEmployees.length) {
      setSelectedEmpNos([]);
    } else {
      setSelectedEmpNos(filteredEmployees.map((e) => e.empNo));
    }
  }, [selectedEmpNos, filteredEmployees]);

  // Impersonate / preview as manager
  const handleImpersonateManager = useCallback(
    (emp: Employee) => {
      setCurrentUser({
        type: 'employee',
        role: 'employee',
        employee: emp,
      });
      setActiveView('frontend_home');
      showToast(`已切換模擬登入為「${emp.name} (${emp.title} / ${emp.department})」，正在前往前台工作台...`, 'info');
    },
    [setCurrentUser, setActiveView, showToast]
  );

  // Predefined Templates
  const TEMPLATES = [
    {
      id: 'engineering_manager',
      name: '工程處長 / 專案經理標配',
      description: '開案計畫(✓) + 人力戰情(✓) + 人才庫(✓) + 意願調查(✓) + 專業訓練(✓)',
      badge: '主力營建單位推薦',
      config: {
        canLogin: true,
        canAccessBackend: false,
        dashboardAccess: {
          projectPlan: true,
          manpowerDashboard: true,
          candidatePool: true,
          surveyFill: true,
          trainingPortal: true,
        },
      },
    },
    {
      id: 'site_supervisor',
      name: '案場主管 / 區棟組長標配',
      description: '人力戰情(✓) + 人才庫人選池(✓) + 意願調查(✓) + 專業訓練(✓)',
      badge: '基層主管推薦',
      config: {
        canLogin: true,
        canAccessBackend: false,
        dashboardAccess: {
          projectPlan: false,
          manpowerDashboard: true,
          candidatePool: true,
          surveyFill: true,
          trainingPortal: true,
        },
      },
    },
    {
      id: 'staff_admin',
      name: '人資幕僚 / 處級企劃高階',
      description: '所有儀表板全開(✓) + 後台管理系統(✓)',
      badge: '全功能管理員',
      config: {
        canLogin: true,
        canAccessBackend: true,
        dashboardAccess: {
          projectPlan: true,
          manpowerDashboard: true,
          candidatePool: true,
          surveyFill: true,
          trainingPortal: true,
        },
      },
    },
    {
      id: 'learning_only',
      name: '一般研習主管標配',
      description: '專業訓練學習專區(✓) + 意願填報(✓)',
      badge: '培育導向',
      config: {
        canLogin: true,
        canAccessBackend: false,
        dashboardAccess: {
          projectPlan: false,
          manpowerDashboard: false,
          candidatePool: false,
          surveyFill: true,
          trainingPortal: true,
        },
      },
    },
    {
      id: 'full_open',
      name: '一鍵全面開通 (全儀表板)',
      description: '開案計畫(✓) + 人力戰情(✓) + 人才庫(✓) + 意願問卷(✓) + 專業訓練(✓)',
      badge: '全視角查閱',
      config: {
        canLogin: true,
        canAccessBackend: false,
        dashboardAccess: {
          projectPlan: true,
          manpowerDashboard: true,
          candidatePool: true,
          surveyFill: true,
          trainingPortal: true,
        },
      },
    },
  ];

  // Apply Template
  const handleApplyTemplate = useCallback(() => {
    const template = TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    let targetEmpNos: string[] = [];
    if (templateTarget === 'selected') {
      targetEmpNos = selectedEmpNos;
    } else if (templateTarget === 'filtered') {
      targetEmpNos = filteredEmployees.map((e) => e.empNo);
    } else {
      targetEmpNos = employees.filter(isDepartmentManager).map((e) => e.empNo);
    }

    if (targetEmpNos.length === 0) {
      alert('請先勾選欲套用範本之主管！');
      return;
    }

    targetEmpNos.forEach((no) => {
      updatePermissionItem(no, {
        canLogin: template.config.canLogin,
        canAccessBackend: template.config.canAccessBackend,
        dashboardAccess: { ...template.config.dashboardAccess },
      });
    });

    setShowTemplateModal(false);
    showToast(`成功為 ${targetEmpNos.length} 位主管套用「${template.name}」權限設定！`);
    setSelectedEmpNos([]);
  }, [
    selectedTemplateId,
    templateTarget,
    selectedEmpNos,
    filteredEmployees,
    employees,
    isDepartmentManager,
    updatePermissionItem,
    showToast,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const totalManagers = employees.filter(isDepartmentManager).length;
    let loginAllowed = 0;
    let backendAllowed = 0;
    let projectPlanAllowed = 0;
    let manpowerDashboardAllowed = 0;
    let candidatePoolAllowed = 0;
    let surveyFillAllowed = 0;
    let trainingPortalAllowed = 0;

    employees
      .filter(isDepartmentManager)
      .forEach((emp) => {
        const p = getEmployeePermission(emp);
        if (p.canLogin) loginAllowed++;
        if (p.canAccessBackend) backendAllowed++;
        if (p.dashboardAccess?.projectPlan !== false) projectPlanAllowed++;
        if (p.dashboardAccess?.manpowerDashboard !== false) manpowerDashboardAllowed++;
        if (p.dashboardAccess?.candidatePool === true) candidatePoolAllowed++;
        if (p.dashboardAccess?.surveyFill !== false) surveyFillAllowed++;
        if (p.dashboardAccess?.trainingPortal !== false) trainingPortalAllowed++;
      });

    return {
      totalManagers,
      loginAllowed,
      backendAllowed,
      projectPlanAllowed,
      manpowerDashboardAllowed,
      candidatePoolAllowed,
      surveyFillAllowed,
      trainingPortalAllowed,
    };
  }, [employees, isDepartmentManager, getEmployeePermission]);

  // Columns definition
  const columns = useMemo(() => {
    return [
      {
        id: '__CAN_LOGIN__',
        label: '系統登入',
        desc: '允許登入前台系統',
        icon: <UserCheck className="w-3.5 h-3.5 text-blue-500" />,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        id: 'projectPlan',
        label: '開案計畫',
        desc: '待遴選案場、開案時程統計',
        icon: <Building2 className="w-3.5 h-3.5 text-cyan-600" />,
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      },
      {
        id: 'manpowerDashboard',
        label: '人力供需戰情',
        desc: '24季供需、職能長條圖、甘特矩陣',
        icon: <TrendingUp className="w-3.5 h-3.5 text-teal-600" />,
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      {
        id: 'candidatePool',
        label: '案主管人才庫',
        desc: '49位主管池、七大歷練年資',
        icon: <Users className="w-3.5 h-3.5 text-violet-600" />,
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      },
      {
        id: 'surveyFill',
        label: '意願調查問卷',
        desc: '工程調動、規模工法意向',
        icon: <ClipboardList className="w-3.5 h-3.5 text-amber-600" />,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        id: 'trainingPortal',
        label: '專業訓練專區',
        desc: 'aEnrich 培育地圖、雲端教材',
        icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        id: '__CAN_ACCESS_BACKEND__',
        label: '後台管理權',
        desc: '背景設定、全域設定等後台',
        icon: <Sliders className="w-3.5 h-3.5 text-rose-600" />,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    ];
  }, []);

  return (
    <div id="dept-manager-permission-matrix" className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              全域權限管理體系・視覺化勾選指派
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              各部門主管 儀表板模組權限矩陣
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              以部門與組織階層為架構，直接勾選指派各單位一二級主管（處長、經理、副理、主任、組長）對於各戰情儀表板模組之即時存取權限。支援部門級一鍵快速全開、權限範本批次套用與個人化開關。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-open-conflict-audit-1-5"
              onClick={() => setShowConflictModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-semibold shadow-md shadow-amber-500/10 transition-all cursor-pointer"
              title="執行與 1-3 權限白名單之連動及衝突偵測檢核"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              連動與衝突檢核室
            </button>

            <button
              id="btn-open-template-modal"
              onClick={() => {
                setTemplateTarget(selectedEmpNos.length > 0 ? 'selected' : 'filtered');
                setShowTemplateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              批次套用權限範本
              {selectedEmpNos.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                  {selectedEmpNos.length}人
                </span>
              )}
            </button>

            <button
              id="btn-expand-all-depts"
              onClick={() => setCollapsedDepts({})}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="展開全部部門區塊"
            >
              全部展開
            </button>
          </div>
        </div>

        {/* Real-time Persistence Alert Pill */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">即時生效與持久化</span>
            <span>・任何勾選變更皆已即時寫入系統資料庫與儲存空間，前台與各主管登入後立即依矩陣規則授權。</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            目前系統登入人員若為主管身分，將嚴格遵循此矩陣之各模組開關。
          </div>
        </div>
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>納管部門主管</span>
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {stats.totalManagers}
            <span className="text-xs font-normal text-slate-500 ml-1">位主管</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">覆蓋率 100%</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>開案計畫儀表板</span>
            <Building2 className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-cyan-700">
            {stats.projectPlanAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人開通</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            佔比 {Math.round((stats.projectPlanAllowed / (stats.totalManagers || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>人力供需戰情</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700">
            {stats.manpowerDashboardAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人開通</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            佔比 {Math.round((stats.manpowerDashboardAllowed / (stats.totalManagers || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>案主管人才庫</span>
            <Users className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div className="text-xl font-bold text-violet-700">
            {stats.candidatePoolAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人開通</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            佔比 {Math.round((stats.candidatePoolAllowed / (stats.totalManagers || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>意願調查問卷</span>
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">
            {stats.surveyFillAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人開通</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            佔比 {Math.round((stats.surveyFillAllowed / (stats.totalManagers || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>專業訓練專區</span>
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {stats.trainingPortalAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人開通</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            佔比 {Math.round((stats.trainingPortalAllowed / (stats.totalManagers || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>後台管理存取</span>
            <Sliders className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {stats.backendAllowed}
            <span className="text-xs font-normal text-slate-500 ml-1">人具權限</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">人資與高階主管</div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-manager"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋主管姓名、員編、職稱、科案代號..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>部門別：</span>
            </div>
            <select
              id="select-dept-filter"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">全部部門 ({allDepartments.length} 個單位)</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Rank Filter */}
            <select
              id="select-rank-filter"
              value={selectedRankFilter}
              onChange={(e) => setSelectedRankFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">全部主管職階</option>
              <option value="09">處長 / 副總 (Rank 09)</option>
              <option value="08">經理 (Rank 08)</option>
              <option value="07">副理 / 案主管 (Rank 07)</option>
              <option value="05_06">區棟組長 / 工程師主管 (Rank 05-06)</option>
            </select>

            {/* Manager only toggle */}
            <button
              id="btn-toggle-only-managers"
              onClick={() => setOnlyManagers(!onlyManagers)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                onlyManagers
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {onlyManagers ? '僅顯示部門主管' : '顯示部室全員'}
            </button>
          </div>
        </div>

        {/* Selected row summary & bulk trigger */}
        {selectedEmpNos.length > 0 && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>已勾選 {selectedEmpNos.length} 位主管</span>
              <button
                onClick={() => setSelectedEmpNos([])}
                className="text-slate-500 hover:text-slate-700 text-[11px] underline ml-2 cursor-pointer"
              >
                取消全選
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTemplateTarget('selected');
                  setShowTemplateModal(true);
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer"
              >
                套用權限範本至已勾選同仁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Visual Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 sticky top-0 z-20">
                <th className="py-3 px-3 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedEmpNos.length === filteredEmployees.length
                    }
                    onChange={handleSelectAllFiltered}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="全選目前篩選名單"
                  />
                </th>
                <th className="py-3 px-4 w-52">部門主管與職稱</th>
                <th className="py-3 px-3 w-28">科案單位</th>
                <th className="py-3 px-3 w-24">職階標籤</th>

                {/* Dashboard module columns */}
                {columns.map((col) => (
                  <th key={col.id} className="py-3 px-3 text-center min-w-[110px]">
                    <div className="inline-flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                        {col.icon}
                        <span>{col.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-normal mt-0.5 max-w-[100px] truncate" title={col.desc}>
                        {col.desc}
                      </span>
                    </div>
                  </th>
                ))}

                <th className="py-3 px-3 text-center w-28">操作與模擬</th>
              </tr>
            </thead>

            {/* Table Body - Grouped by Department */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {employeesByDept.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 5} className="py-12 text-center text-slate-400">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    無符合條件之部門主管名單，請調整搜尋或篩選條件。
                  </td>
                </tr>
              ) : (
                employeesByDept.map(([deptName, deptEmployees]) => {
                  const isCollapsed = !!collapsedDepts[deptName];

                  return (
                    <React.Fragment key={deptName}>
                      {/* Department Section Header Row */}
                      <tr className="bg-slate-100/80 border-y border-slate-200/80 text-slate-800 font-semibold select-none">
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() =>
                              setCollapsedDepts((prev) => ({
                                ...prev,
                                [deptName]: !prev[deptName],
                              }))
                            }
                            className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
                            title={isCollapsed ? '展開此部室' : '收合此部室'}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td colSpan={3} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                              {deptName}
                            </span>
                            <span className="text-slate-500 text-xs font-normal">
                              ({deptEmployees.length} 位同仁 / 主管)
                            </span>

                            {/* Department-level quick actions */}
                            <div className="inline-flex items-center gap-1.5 ml-3">
                              <button
                                onClick={() => handleDeptGrantAll(deptName, deptEmployees, true)}
                                className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="本部同仁儀表板全開"
                              >
                                本部全開
                              </button>
                              <button
                                onClick={() => handleDeptGrantAll(deptName, deptEmployees, false)}
                                className="px-2 py-0.5 rounded text-[11px] bg-slate-200/80 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
                                title="本部同仁儀表板全關"
                              >
                                本部全關
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Department-level Column Quick Checkboxes */}
                        {columns.map((col) => {
                          const allChecked = deptEmployees.every((emp) => {
                            const p = getEmployeePermission(emp);
                            if (col.id === '__CAN_LOGIN__') return p.canLogin;
                            if (col.id === '__CAN_ACCESS_BACKEND__') return !!p.canAccessBackend;
                            return p.dashboardAccess?.[col.id] !== false;
                          });
                          const someChecked =
                            !allChecked &&
                            deptEmployees.some((emp) => {
                              const p = getEmployeePermission(emp);
                              if (col.id === '__CAN_LOGIN__') return p.canLogin;
                              if (col.id === '__CAN_ACCESS_BACKEND__') return !!p.canAccessBackend;
                              return p.dashboardAccess?.[col.id] !== false;
                            });

                          return (
                            <td key={col.id} className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleDeptModuleToggle(deptEmployees, col.id)}
                                className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title={`點擊切換【${deptName}】全員之【${col.label}】權限`}
                              >
                                {allChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : someChecked ? (
                                  <MinusSquare className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2 px-3 text-center text-[10px] text-slate-400">
                          部室批次
                        </td>
                      </tr>

                      {/* Department Members / Managers Rows */}
                      {!isCollapsed &&
                        deptEmployees.map((emp) => {
                          const perm = getEmployeePermission(emp);
                          const isSelected = selectedEmpNos.includes(emp.empNo);
                          const isLeader = isDepartmentManager(emp);

                          return (
                            <tr
                              key={emp.empNo}
                              className={`hover:bg-blue-50/40 transition-colors ${
                                isSelected ? 'bg-blue-50/60' : ''
                              }`}
                            >
                              {/* Selection Checkbox */}
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectEmp(emp.empNo)}
                                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>

                              {/* Manager Name & Info */}
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0 border border-slate-200">
                                    {emp.name.slice(0, 1)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                      <span>{emp.name}</span>
                                      <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                                        {emp.empNo}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-medium">
                                      {emp.title || '主管'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Section */}
                              <td className="py-2.5 px-3 text-slate-700">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px]">
                                  {emp.section || emp.department}
                                </span>
                              </td>

                              {/* Rank Badge */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                      emp.rank === '09'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : emp.rank === '08'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : emp.rank === '07'
                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    Rank {emp.rank || '06'}
                                  </span>
                                  {isLeader && (
                                    <span className="text-[10px] text-amber-600 font-bold">
                                      ★
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Checkbox: System Login */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  id={`chk-login-${emp.empNo}`}
                                  onClick={() =>
                                    handleTogglePermission(emp, '__CAN_LOGIN__', perm.canLogin)
                                  }
                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                    perm.canLogin
                                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                                      : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                  }`}
                                  title={perm.canLogin ? '點擊關閉系統前台登入權限' : '點擊開通系統前台登入權限'}
                                >
                                  {perm.canLogin ? (
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>

                              {/* Checkbox: Project Plan Dashboard */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = perm.dashboardAccess?.projectPlan !== false;
                                  return (
                                    <button
                                      id={`chk-projectPlan-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(emp, 'projectPlan', isAllowed)
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-cyan-600 text-white shadow-xs shadow-cyan-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '開案計畫：已開通 (點擊關閉)' : '開案計畫：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Checkbox: Manpower Dashboard */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = perm.dashboardAccess?.manpowerDashboard !== false;
                                  return (
                                    <button
                                      id={`chk-manpowerDashboard-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(emp, 'manpowerDashboard', isAllowed)
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-teal-600 text-white shadow-xs shadow-teal-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '人力供需戰情：已開通 (點擊關閉)' : '人力供需戰情：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Checkbox: Candidate Pool Dashboard */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = perm.dashboardAccess?.candidatePool === true;
                                  return (
                                    <button
                                      id={`chk-candidatePool-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(emp, 'candidatePool', isAllowed)
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '人才庫：已開通 (點擊關閉)' : '人才庫：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Checkbox: Survey Fill */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = perm.dashboardAccess?.surveyFill !== false;
                                  return (
                                    <button
                                      id={`chk-surveyFill-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(emp, 'surveyFill', isAllowed)
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '意願問卷：已開通 (點擊關閉)' : '意願問卷：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Checkbox: Training Portal */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = perm.dashboardAccess?.trainingPortal !== false;
                                  return (
                                    <button
                                      id={`chk-trainingPortal-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(emp, 'trainingPortal', isAllowed)
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '專業訓練：已開通 (點擊關閉)' : '專業訓練：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Checkbox: Backend Access */}
                              <td className="py-2.5 px-3 text-center">
                                {(() => {
                                  const isAllowed = !!perm.canAccessBackend;
                                  return (
                                    <button
                                      id={`chk-backend-${emp.empNo}`}
                                      onClick={() =>
                                        handleTogglePermission(
                                          emp,
                                          '__CAN_ACCESS_BACKEND__',
                                          isAllowed
                                        )
                                      }
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        isAllowed
                                          ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/30'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                      }`}
                                      title={isAllowed ? '後台管理：已開通 (點擊關閉)' : '後台管理：未開通 (點擊開通)'}
                                    >
                                      {isAllowed ? (
                                        <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                                      ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                              </td>

                              {/* Actions: Impersonate Preview */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  id={`btn-impersonate-${emp.empNo}`}
                                  onClick={() => handleImpersonateManager(emp)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="以此主管身分登入，實地預覽其可見儀表板"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>模擬視角</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">顯示統計：</span>
            <span>
              共 {employeesByDept.length} 個部室單位、{filteredEmployees.length} 位同仁名單（其中部門主管佔{' '}
              {filteredEmployees.filter(isDepartmentManager).length} 位）
            </span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded bg-blue-600" />
            <span>開通</span>
            <span className="inline-block w-2.5 h-2.5 rounded bg-slate-200 ml-2" />
            <span>關閉</span>
          </div>
        </div>
      </div>

      {/* 5. Quick Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">批次套用主管權限範本</h3>
                  <p className="text-xs text-slate-300">
                    一鍵將企業標準角色權限配置套用至指定的主管群體
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Target Scope Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  1. 選擇套用目標範圍：
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTemplateTarget('selected')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      templateTarget === 'selected'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">已勾選的主管</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      ({selectedEmpNos.length} 位同仁)
                    </div>
                  </button>

                  <button
                    onClick={() => setTemplateTarget('filtered')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      templateTarget === 'filtered'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">目前篩選清單</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      ({filteredEmployees.length} 位同仁)
                    </div>
                  </button>

                  <button
                    onClick={() => setTemplateTarget('all')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      templateTarget === 'all'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">全體部門主管</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      ({stats.totalManagers} 位同仁)
                    </div>
                  </button>
                </div>
              </div>

              {/* Template Presets Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  2. 選擇標準權限範本：
                </label>
                <div className="space-y-2">
                  {TEMPLATES.map((tmpl) => {
                    const isChecked = selectedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="template_choice"
                              checked={isChecked}
                              onChange={() => setSelectedTemplateId(tmpl.id)}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="font-bold text-xs text-slate-900">{tmpl.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                              {tmpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>

                        {isChecked && (
                          <div className="shrink-0 text-blue-600">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                id="btn-confirm-apply-template"
                onClick={handleApplyTemplate}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                確認批次指派套用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Floating Feedback Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/80 flex items-center gap-3 text-xs max-w-md">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium">{toast.message}</div>
          </div>
        </div>
      )}

      {/* 7. Permission Conflict & Anomaly Audit Modal */}
      <PermissionConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
      />
    </div>
  );
};
