import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Zap,
  Check,
  X,
  User,
  Building2,
  Search,
  ExternalLink,
  ArrowRight,
  Info,
  Sliders,
  UserCheck,
  SlidersHorizontal,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee, PermissionMatrixItem } from '../../types';

export type ConflictType =
  | 'LOGIN_FORBIDDEN_BUT_DASHBOARD_ENABLED' // 1-3 設為禁止登入，但 1-5 卻勾選了儀表板
  | 'LOGIN_ALLOWED_BUT_NO_DASHBOARDS' // 1-3 允許登入，但 1-5 所有儀表板皆被關閉 (登入後無可看內容)
  | 'GOOGLE_ADMIN_PRIVILEGE_OVERRIDE' // 1-3(1) 是 Google 管理員，1-5 雖取消勾選但因特權仍全部可見
  | 'DEPT_OR_TITLE_DESYNC' // 權限矩陣記載的部門職稱與最新員工名冊不一致
  | 'ORG_LEADER_NOT_IN_WHITELIST'; // 組織圖上標註的主管尚未加入白名單矩陣

export interface ConflictItem {
  id: string;
  type: ConflictType;
  severity: 'high' | 'warning' | 'info';
  empNo: string;
  name: string;
  department: string;
  title: string;
  titleDesc: string;
  explanation: string;
  impact: string;
  suggestedFix: string;
  fixAction?: () => void;
  fixLabel?: string;
  secondaryFixAction?: () => void;
  secondaryFixLabel?: string;
}

interface PermissionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: '1-3' | '1-5') => void;
}

export const PermissionConflictModal: React.FC<PermissionConflictModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const {
    employees,
    permissionMatrix,
    googleAdmins,
    orgTree,
    dashboards,
    updatePermissionItem,
    addEmployeesToWhitelist,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | ConflictType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [fixedNotice, setFixedNotice] = useState<string | null>(null);

  // Inspector state
  const [inspectorEmpNo, setInspectorEmpNo] = useState<string>('');

  // 1. Traverse OrgTree to gather leaders
  const orgLeaders = useMemo(() => {
    const list: { empNo: string; name: string; dept: string; title: string }[] = [];
    const seen = new Set<string>();

    const traverse = (node: any, currentDept: string) => {
      if (!node) return;
      const deptName = node.name || currentDept;
      if (node.leaderEmpNo && !seen.has(node.leaderEmpNo)) {
        seen.add(node.leaderEmpNo);
        list.push({
          empNo: node.leaderEmpNo,
          name: node.leaderName || '主管',
          dept: deptName,
          title: node.title || '單位主管',
        });
      } else if (node.leaderName) {
        const cleanName = node.leaderName.split('(')[0].split('/')[0].trim();
        const matched = employees.find((e) => e.name.trim() === cleanName);
        if (matched && !seen.has(matched.empNo)) {
          seen.add(matched.empNo);
          list.push({
            empNo: matched.empNo,
            name: matched.name,
            dept: matched.department || deptName,
            title: matched.title || '單位主管',
          });
        }
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((c: any) => traverse(c, deptName));
      }
    };
    traverse(orgTree, '遠雄營造');
    return list;
  }, [orgTree, employees]);

  // Quick lookup maps
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.empNo, e));
    return map;
  }, [employees]);

  const permissionMap = useMemo(() => {
    const map = new Map<string, PermissionMatrixItem>();
    permissionMatrix.forEach((p) => map.set(p.empNo, p));
    return map;
  }, [permissionMatrix]);

  const googleAdminEmails = useMemo(() => {
    const set = new Set<string>();
    googleAdmins.forEach((a) => {
      if (a.role === 'SUPER_ADMIN' || a.role === 'HR_ADMIN') {
        set.add(a.email.toLowerCase().trim());
      }
    });
    return set;
  }, [googleAdmins]);

  // 2. Compute All Conflicts
  const conflictList = useMemo(() => {
    const conflicts: ConflictItem[] = [];

    // Check 1: 登入矛盾 (canLogin = false 但有開通儀表板)
    permissionMatrix.forEach((p) => {
      const activeDashboards = Object.entries(p.dashboardAccess || {}).filter(
        ([_, allowed]) => allowed === true
      );

      if (p.canLogin === false && activeDashboards.length > 0) {
        conflicts.push({
          id: `login_mismatch_${p.empNo}`,
          type: 'LOGIN_FORBIDDEN_BUT_DASHBOARD_ENABLED',
          severity: 'high',
          empNo: p.empNo,
          name: p.name,
          department: p.department,
          title: p.title,
          titleDesc: '【登入矛盾】1-3 禁止登入系統，但 1-5 卻開通了戰情模組',
          explanation: `在 1-3 權限設定中「可登入系統」開關為關閉狀態，但在 1-5 卻勾選開通了 ${activeDashboards.length} 個戰情模組。該人員在前台將無法通過登入白名單驗證，所有模組授權皆無法生效。`,
          impact: '該主管登入時將被系統擋在門外，無法進入前台使用被指派之儀表板。',
          suggestedFix: '若該人員應具備存取權，請開啟「可登入系統」；若已停權，請關閉所有儀表板。',
          fixLabel: '一鍵恢復登入權限',
          fixAction: () => {
            updatePermissionItem(p.empNo, { canLogin: true });
            setFixedNotice(`已成功恢復「${p.name}」的前台登入權限！`);
          },
          secondaryFixLabel: '關閉所有模組',
          secondaryFixAction: () => {
            const closed: Record<string, boolean> = {};
            Object.keys(p.dashboardAccess || {}).forEach((k) => (closed[k] = false));
            updatePermissionItem(p.empNo, { dashboardAccess: closed });
            setFixedNotice(`已成功清除「${p.name}」之儀表板勾選以保持一致！`);
          },
        });
      }

      // Check 2: 允許登入，但 1-5 所有儀表板皆為 false
      if (p.canLogin === true && activeDashboards.length === 0) {
        conflicts.push({
          id: `empty_dashboards_${p.empNo}`,
          type: 'LOGIN_ALLOWED_BUT_NO_DASHBOARDS',
          severity: 'warning',
          empNo: p.empNo,
          name: p.name,
          department: p.department,
          title: p.title,
          titleDesc: '【空白授權】1-3 允許登入，但 1-5 未開放任何戰情儀表板',
          explanation: `該主管具備登入白名單資格，但在 1-5 部門主管權限矩陣中，其所有儀表板（開案計畫、案主管人才庫、意願問卷、專業訓練）皆未勾選或已全部關閉。`,
          impact: '主管登入前台後，頂部與側邊導覽列將無任何戰情模組可點選，或點入時會顯示「存取受限」警示。',
          suggestedFix: '建議至少開通「開案計畫儀表板」與「專業訓練學習專區」等通用基礎模組。',
          fixLabel: '開通通用模組 (開案+學習+問卷)',
          fixAction: () => {
            updatePermissionItem(p.empNo, {
              dashboardAccess: {
                projectPlan: true,
                manpowerDashboard: true,
                candidatePool: ['07', '08', '09'].includes(
                  employeeMap.get(p.empNo)?.rank || ''
                ),
                surveyFill: true,
                trainingPortal: true,
              },
            });
            setFixedNotice(`已成功為「${p.name}」開通基礎通用戰情模組！`);
          },
        });
      }

      // Check 3: 特權覆蓋提醒 (已在 1-3(1) 被設為 Google 最高管理員/HR 管理員，但 1-5 取消了勾選)
      const emp = employeeMap.get(p.empNo);
      const isGoogleAdmin = emp?.email && googleAdminEmails.has(emp.email.toLowerCase().trim());
      const hasUncheckedDash = Object.values(p.dashboardAccess || {}).some((v) => v === false);
      if (isGoogleAdmin && hasUncheckedDash) {
        conflicts.push({
          id: `admin_override_${p.empNo}`,
          type: 'GOOGLE_ADMIN_PRIVILEGE_OVERRIDE',
          severity: 'info',
          empNo: p.empNo,
          name: p.name,
          department: p.department,
          title: p.title,
          titleDesc: '【特權覆蓋】此主管登記為 Google 管理員，1-5 勾選將被管理員特權覆蓋',
          explanation: `同仁在 1-3(1) 的 Google 管理員名冊中登記為最高管理員／HR 管理員。依系統安全規則，管理員登入時自動具備全系統後台與所有儀表板存取特權。即便在 1-5 取消勾選，該人員前台依然可以查看所有儀表板。`,
          impact: '在 1-5 的取消勾選對此管理員不生效，可能導致管理者產生「設定沒有發揮作用」的疑惑。',
          suggestedFix: '若需真正限制該同仁權限，須先於 1-3(1) 移除其 Google 管理員身分；或在 1-5 全數勾選以使顯示與實際特權一致。',
          fixLabel: '補齊 1-5 勾選為全開',
          fixAction: () => {
            updatePermissionItem(p.empNo, {
              canAccessBackend: true,
              dashboardAccess: {
                projectPlan: true,
                manpowerDashboard: true,
                candidatePool: true,
                surveyFill: true,
                trainingPortal: true,
              },
            });
            setFixedNotice(`已將「${p.name}」之 1-5 模組勾選補齊，與管理員特權完全一致！`);
          },
        });
      }

      // Check 4: 部門/職稱異動不同步 (與 1-1 員工名冊資料存在落差)
      if (emp && (emp.department !== p.department || emp.title !== p.title)) {
        conflicts.push({
          id: `desync_${p.empNo}`,
          type: 'DEPT_OR_TITLE_DESYNC',
          severity: 'warning',
          empNo: p.empNo,
          name: p.name,
          department: p.department,
          title: p.title,
          titleDesc: '【資料不同步】權限矩陣之部門職稱與 1-1 員工名冊不一致',
          explanation: `1-1 員工名冊為「${emp.department} / ${emp.title}」，但 1-3 與 1-5 權限矩陣仍記載為舊資料「${p.department} / ${p.title}」。`,
          impact: '在 1-5 部門分組檢視時可能會分類至錯誤的部門群組。',
          suggestedFix: '點擊立即同步，將權限矩陣自動對齊 1-1 最新人事資料。',
          fixLabel: '立即同步最新人事資料',
          fixAction: () => {
            updatePermissionItem(p.empNo, {
              name: emp.name,
              department: emp.department,
              title: emp.title,
            });
            setFixedNotice(`已將「${p.name}」更新為最新部門職稱：${emp.department} - ${emp.title}`);
          },
        });
      }
    });

    // Check 5: 組織架構樹上的主管尚未加入登入白名單
    orgLeaders.forEach((leader) => {
      const p = permissionMap.get(leader.empNo);
      if (!p) {
        conflicts.push({
          id: `missing_leader_${leader.empNo}`,
          type: 'ORG_LEADER_NOT_IN_WHITELIST',
          severity: 'high',
          empNo: leader.empNo,
          name: leader.name,
          department: leader.dept,
          title: leader.title,
          titleDesc: '【名單缺漏】組織架構主管尚未登記於登入白名單矩陣中',
          explanation: `同仁為組織架構圖 (1-2) 載明之單位主管（${leader.dept} - ${leader.name}），但尚未加入 1-3 之登入白名單與權限矩陣。`,
          impact: '該單位主管無法登入前台系統使用開案計畫或人才庫戰情室。',
          suggestedFix: '一鍵將主管加入白名單，自動開通對應主管模組權限。',
          fixLabel: '一鍵加入登入白名單',
          fixAction: () => {
            addEmployeesToWhitelist([leader.empNo]);
            setFixedNotice(`已將組織主管「${leader.name}」成功補入登入白名單與權限矩陣！`);
          },
        });
      }
    });

    return conflicts;
  }, [
    permissionMatrix,
    employeeMap,
    googleAdminEmails,
    orgLeaders,
    permissionMap,
    updatePermissionItem,
    addEmployeesToWhitelist,
  ]);

  // Filtered conflicts based on tab & search
  const filteredConflicts = useMemo(() => {
    return conflictList.filter((c) => {
      if (activeFilter !== 'ALL' && c.type !== activeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const m1 = c.name.toLowerCase().includes(q);
        const m2 = c.empNo.toLowerCase().includes(q);
        const m3 = c.department.toLowerCase().includes(q);
        const m4 = c.titleDesc.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [conflictList, activeFilter, searchTerm]);

  // Batch fix all safe issues (Data desync + missing leaders + login forbidden contradiction)
  const handleFixAllSafeIssues = () => {
    let fixCount = 0;
    conflictList.forEach((c) => {
      if (c.type === 'DEPT_OR_TITLE_DESYNC' || c.type === 'ORG_LEADER_NOT_IN_WHITELIST') {
        c.fixAction?.();
        fixCount++;
      }
    });
    setFixedNotice(`已自動一鍵安全修復 ${fixCount} 筆資料同步與主管白名單項目！`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  權限設定 (1-3) 與 部門主管矩陣 (1-5) 連動及衝突偵測檢核室
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  即時雙向連動中
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                兩邊功能共用單一資料源 (permissionMatrix)，本診斷器即時檢測設定矛盾、特權覆蓋與資料不同步。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        {fixedNotice && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {fixedNotice}
            </span>
            <button
              onClick={() => setFixedNotice(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Metrics Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block">白名單總同仁數</span>
            <span className="text-lg font-bold text-slate-800">{permissionMatrix.length} 人</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">1-3 & 1-5 共用</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block">高風險矛盾衝突</span>
            <span
              className={`text-lg font-bold ${
                conflictList.filter((c) => c.severity === 'high').length > 0
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}
            >
              {conflictList.filter((c) => c.severity === 'high').length} 件
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">登入或名單衝突</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block">授權警示與同步</span>
            <span className="text-lg font-bold text-amber-600">
              {conflictList.filter((c) => c.severity === 'warning').length} 件
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">空白或人事落差</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block">特權覆蓋提示</span>
            <span className="text-lg font-bold text-blue-600">
              {conflictList.filter((c) => c.severity === 'info').length} 件
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Google 最高管理員</span>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部檢測 ({conflictList.length})
            </button>
            <button
              onClick={() => setActiveFilter('LOGIN_FORBIDDEN_BUT_DASHBOARD_ENABLED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'LOGIN_FORBIDDEN_BUT_DASHBOARD_ENABLED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              登入矛盾 (
              {
                conflictList.filter(
                  (c) => c.type === 'LOGIN_FORBIDDEN_BUT_DASHBOARD_ENABLED'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setActiveFilter('LOGIN_ALLOWED_BUT_NO_DASHBOARDS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'LOGIN_ALLOWED_BUT_NO_DASHBOARDS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              空白授權 (
              {
                conflictList.filter((c) => c.type === 'LOGIN_ALLOWED_BUT_NO_DASHBOARDS')
                  .length
              }
              )
            </button>
            <button
              onClick={() => setActiveFilter('ORG_LEADER_NOT_IN_WHITELIST')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'ORG_LEADER_NOT_IN_WHITELIST'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              主管缺漏 (
              {
                conflictList.filter((c) => c.type === 'ORG_LEADER_NOT_IN_WHITELIST')
                  .length
              }
              )
            </button>
            <button
              onClick={() => setActiveFilter('DEPT_OR_TITLE_DESYNC')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'DEPT_OR_TITLE_DESYNC'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              人事未同步 (
              {
                conflictList.filter((c) => c.type === 'DEPT_OR_TITLE_DESYNC')
                  .length
              }
              )
            </button>
          </div>

          {/* Search & Batch Fix */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名/工號/問題..."
                className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg w-44 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {conflictList.length > 0 && (
              <button
                id="btn-fix-all-safe-issues"
                onClick={handleFixAllSafeIssues}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="自動執行人事資料同步與組織主管補入白名單"
              >
                <Zap className="w-3.5 h-3.5" />
                安全項目一鍵修復
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Issue Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {filteredConflicts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                完美！當前沒有偵測到任何權限衝突或一致性異常
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                「1-3. 權限設定 (白名單)」與「1-5. 部門主管權限矩陣」完全同步，所有人員登入權限、戰情模組指派與組織主管名冊皆正確連動且邏輯嚴謹。
              </p>
            </div>
          ) : (
            filteredConflicts.map((c) => {
              const borderTheme =
                c.severity === 'high'
                  ? 'border-rose-200 bg-rose-50/20'
                  : c.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-blue-200 bg-blue-50/20';

              const badgeTheme =
                c.severity === 'high'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : c.severity === 'warning'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300';

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border ${borderTheme} bg-white shadow-2xs space-y-3 transition-all hover:shadow-xs`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeTheme}`}
                        >
                          {c.severity === 'high'
                            ? '高風險矛盾'
                            : c.severity === 'warning'
                            ? '授權注意'
                            : '特權提醒'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{c.titleDesc}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1 text-slate-800 font-bold">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {c.name} ({c.empNo})
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3.5 h-3.5" />
                          {c.department} - {c.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.fixAction && (
                        <button
                          onClick={c.fixAction}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {c.fixLabel || '立即修復'}
                        </button>
                      )}
                      {c.secondaryFixAction && (
                        <button
                          onClick={c.secondaryFixAction}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {c.secondaryFixLabel}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200/80">
                    <div className="text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">原因分析：</strong> {c.explanation}
                    </div>
                    <div className="text-rose-700">
                      <strong>實際影響：</strong> {c.impact}
                    </div>
                    <div className="text-slate-600">
                      <strong>建議處理：</strong> {c.suggestedFix}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Interactive Permission Inspector Section */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                即時人員權限判定驗證器 (Permission Inspector)
              </h4>
              <span className="text-[11px] text-slate-400">
                點選或輸入任一同仁工號，模擬驗證其在 1-3 與 1-5 中的雙向判定結果
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={inspectorEmpNo}
                onChange={(e) => setInspectorEmpNo(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none w-64"
              >
                <option value="">-- 請選擇欲檢測之同仁 / 主管 --</option>
                {permissionMatrix.map((p) => (
                  <option key={p.empNo} value={p.empNo}>
                    {p.name} ({p.empNo}) - {p.department} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            {inspectorEmpNo && (
              (() => {
                const p = permissionMatrix.find((item) => item.empNo === inspectorEmpNo);
                const emp = employees.find((e) => e.empNo === inspectorEmpNo);
                if (!p) return null;

                const isGoogleAdmin =
                  emp?.email && googleAdminEmails.has(emp.email.toLowerCase().trim());
                const isRank09 = emp?.rank === '09';
                const isHR = emp?.department === '人力資源室';

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">1-3 登入白名單</span>
                        <span
                          className={`font-bold flex items-center gap-1 mt-0.5 ${
                            p.canLogin ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {p.canLogin ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {p.canLogin ? '允許登入' : '禁止登入'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">1-3 後台管理設定</span>
                        <span
                          className={`font-bold flex items-center gap-1 mt-0.5 ${
                            p.canAccessBackend || isGoogleAdmin || isHR
                              ? 'text-indigo-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {p.canAccessBackend || isGoogleAdmin || isHR ? '有權限' : '無後台權限'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Google 特權身分</span>
                        <span
                          className={`font-bold flex items-center gap-1 mt-0.5 ${
                            isGoogleAdmin ? 'text-amber-600' : 'text-slate-500'
                          }`}
                        >
                          {isGoogleAdmin ? '最高/HR特權' : '一般同仁'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">最終前台存取結論</span>
                        <span
                          className={`font-bold mt-0.5 ${
                            !p.canLogin ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {!p.canLogin ? '被擋在門外' : '可正常進入前台'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        1-5 部門主管矩陣模組開通狀態 (前台導覽列可視狀況)：
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span>開案計畫儀表板</span>
                          <span
                            className={`font-bold text-[11px] ${
                              isGoogleAdmin || p.dashboardAccess?.projectPlan !== false
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isGoogleAdmin || p.dashboardAccess?.projectPlan !== false
                              ? '已開通'
                              : '關閉'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span>人力供需戰情</span>
                          <span
                            className={`font-bold text-[11px] ${
                              isGoogleAdmin || p.dashboardAccess?.manpowerDashboard !== false
                                ? 'text-teal-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isGoogleAdmin || p.dashboardAccess?.manpowerDashboard !== false
                              ? '已開通'
                              : '關閉'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span>案主管人才庫</span>
                          <span
                            className={`font-bold text-[11px] ${
                              isGoogleAdmin || p.dashboardAccess?.candidatePool === true
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isGoogleAdmin || p.dashboardAccess?.candidatePool === true
                              ? '已開通'
                              : '關閉'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span>意願問卷填報</span>
                          <span
                            className={`font-bold text-[11px] ${
                              isGoogleAdmin || p.dashboardAccess?.surveyFill !== false
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isGoogleAdmin || p.dashboardAccess?.surveyFill !== false
                              ? '已開通'
                              : '關閉'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span>專業訓練專區</span>
                          <span
                            className={`font-bold text-[11px] ${
                              isGoogleAdmin || p.dashboardAccess?.trainingPortal !== false
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isGoogleAdmin || p.dashboardAccess?.trainingPortal !== false
                              ? '已開通'
                              : '關閉'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-blue-500" />
            <span>
              1-3 與 1-5 皆寫入相同 Firestore 與 LocalStorage 矩陣，本工具可隨時進行一致性診斷與修復。
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab('1-3');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                >
                  前往 1-3 白名單
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab('1-5');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  前往 1-5 主管矩陣
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors"
            >
              關閉檢核室
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
