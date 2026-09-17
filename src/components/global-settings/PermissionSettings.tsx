import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Plus,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  CheckCircle2,
  Check,
  X,
  Users,
  Sliders,
  ArrowRight,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { PermissionConflictModal } from './PermissionConflictModal';

interface PermissionSettingsProps {
  onNavigateToManagerMatrix?: () => void;
}

export const PermissionSettings: React.FC<PermissionSettingsProps> = ({ onNavigateToManagerMatrix }) => {
  const {
    permissionMatrix,
    updatePermissionItem,
    removePermissionItem,
    batchRemovePermissionItems,
    batchSetPermission,
    addEmployeesToWhitelist,
    googleAdmins,
    addGoogleAdmin,
    removeGoogleAdmin,
    dashboards,
    addDashboard,
    employees,
  } = useApp();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDept, setSelectedDept] = useState('全部');

  // Matrix selection & delete state
  const [selectedMatrixEmpNos, setSelectedMatrixEmpNos] = useState<string[]>([]);
  const [deletingEmp, setDeletingEmp] = useState<{ empNo: string; name: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Google Admin Form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'SUPER_ADMIN' | 'HR_ADMIN' | 'VIEWER'>('HR_ADMIN');

  // New Dashboard Column dynamic addition
  const [newDashboardId, setNewDashboardId] = useState('');
  const [newDashboardName, setNewDashboardName] = useState('');
  const [showAddDashModal, setShowAddDashModal] = useState(false);

  // Whitelist Modal state
  const [showAddWhitelistModal, setShowAddWhitelistModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [whitelistSearch, setWhitelistSearch] = useState('');
  const [whitelistDept, setWhitelistDept] = useState('全部');
  const [selectedEmpNos, setSelectedEmpNos] = useState<string[]>([]);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set(permissionMatrix.map((p) => p.department));
    return ['全部', ...Array.from(set).filter(Boolean)];
  }, [permissionMatrix]);

  const globalDepartments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return ['全部', ...Array.from(set).filter(Boolean)];
  }, [employees]);

  const filteredGlobalEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (whitelistDept !== '全部' && e.department !== whitelistDept) return false;
      if (whitelistSearch.trim()) {
        const q = whitelistSearch.toLowerCase();
        const m1 = e.name.toLowerCase().includes(q);
        const m2 = e.empNo.toLowerCase().includes(q);
        const m3 = (e.department || '').toLowerCase().includes(q);
        const m4 = (e.title || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [employees, whitelistDept, whitelistSearch]);

  const handleToggleSelectEmp = (empNo: string) => {
    setSelectedEmpNos((prev) =>
      prev.includes(empNo) ? prev.filter((id) => id !== empNo) : [...prev, empNo]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredNos = filteredGlobalEmployees.map((e) => e.empNo);
    const allSelected = allFilteredNos.every((no) => selectedEmpNos.includes(no));
    if (allSelected) {
      setSelectedEmpNos((prev) => prev.filter((no) => !allFilteredNos.includes(no)));
    } else {
      setSelectedEmpNos((prev) => Array.from(new Set([...prev, ...allFilteredNos])));
    }
  };

  const handleConfirmAddWhitelist = () => {
    if (selectedEmpNos.length === 0) return;
    addEmployeesToWhitelist(selectedEmpNos);
    setAddNotice(`成功將 ${selectedEmpNos.length} 位人員加入登入白名單與權限矩陣！`);
    setSelectedEmpNos([]);
    setTimeout(() => {
      setAddNotice(null);
      setShowAddWhitelistModal(false);
    }, 1200);
  };

  const filteredPermissions = useMemo(() => {
    return permissionMatrix.filter((p) => {
      if (selectedDept !== '全部' && p.department !== selectedDept) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const m1 = p.name.toLowerCase().includes(q);
        const m2 = p.empNo.toLowerCase().includes(q);
        const m3 = p.department.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [permissionMatrix, selectedDept, searchKeyword]);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;

    addGoogleAdmin({
      email: newAdminEmail.trim().toLowerCase(),
      name: newAdminName.trim(),
      role: newAdminRole,
      addedAt: new Date().toISOString().slice(0, 10),
    });

    setNewAdminEmail('');
    setNewAdminName('');
  };

  const handleCreateDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardId.trim() || !newDashboardName.trim()) return;
    addDashboard({
      id: newDashboardId.trim().toLowerCase(),
      name: newDashboardName.trim(),
      description: '自訂擴充儀表板',
      icon: 'LayoutDashboard',
      isDefault: false,
    });
    setNewDashboardId('');
    setNewDashboardName('');
    setShowAddDashModal(false);
  };

  const handleBatchToggleLogin = (enable: boolean) => {
    const ids = filteredPermissions.map((p) => p.empNo);
    batchSetPermission(ids, '__CAN_LOGIN__', enable);
  };

  const handleBatchToggleBackend = (enable: boolean) => {
    const ids = filteredPermissions.map((p) => p.empNo);
    batchSetPermission(ids, '__CAN_ACCESS_BACKEND__', enable);
  };

  const handleBatchToggleDashboard = (dashId: string, enable: boolean) => {
    const ids = filteredPermissions.map((p) => p.empNo);
    batchSetPermission(ids, dashId, enable);
  };

  return (
    <div className="space-y-6">
      {/* Quick Entry Banner to Visual Department Manager Matrix */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>視覺化快速指派：各部門主管儀表板模組權限矩陣</span>
              <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-semibold border border-blue-400/30">
                1-5 專區
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              直接依部門分類，以可視化勾選框快速指派各部門主管對於不同戰情儀表板（開案計畫、人才庫、意願調查、專業訓練）之存取權限。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-permission-conflict-detector"
            onClick={() => setShowConflictModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            權限連動與衝突偵測檢核
          </button>
          {onNavigateToManagerMatrix && (
            <button
              id="btn-goto-dept-matrix"
              onClick={onNavigateToManagerMatrix}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
            >
              前往部門主管矩陣 (1-5)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1-3(1) Google 帳號管理員設定 */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              (1) Google 帳號管理員設定 (全域總功能設定管理員)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              具有『全域總功能設定』及相關後台維護權限之 Google 帳號白名單
            </p>
          </div>
        </div>

        {/* Add Google Admin Form */}
        <form onSubmit={handleAddAdmin} className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Google 電子信箱 (例：user@gmail.com)"
            required
            className="px-3 py-1 text-xs border border-slate-300 rounded-lg w-60 font-mono focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="管理員姓名"
            required
            className="px-3 py-1 text-xs border border-slate-300 rounded-lg w-36 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <select
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value as any)}
            className="px-3 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="SUPER_ADMIN">超級管理員 (最高權限)</option>
            <option value="HR_ADMIN">人資管理員</option>
            <option value="VIEWER">檢視者</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新增授權管理員
          </button>
        </form>

        {/* Google Admin List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {googleAdmins.map((admin) => (
            <div
              key={admin.email}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">{admin.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded">
                    {admin.role === 'SUPER_ADMIN' ? '超級管理員' : admin.role === 'HR_ADMIN' ? '人資管理員' : '檢視者'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">{admin.email}</div>
              </div>
              {googleAdmins.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`確定要移除管理員 ${admin.email} 嗎？`)) {
                      removeGoogleAdmin(admin.email);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 1-3(2) 可登入人員白名單 Matrix */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              (2) 可登入人員白名單 與 各儀表板權限矩陣
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              左側為人員基本資料，上方為進入系統開關與各儀表板權限（支援動態擴充儀表板欄位）
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedEmpNos([]);
                setWhitelistSearch('');
                setWhitelistDept('全部');
                setShowAddWhitelistModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              從全域人員名單庫新增白名單人員
            </button>
            <button
              onClick={() => setShowAddDashModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              動態新增儀表板欄位
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter & Batch Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋名冊人員..."
                className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg w-40 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-1 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedMatrixEmpNos.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `確定要自可登入白名單與權限矩陣中移除選取的 ${selectedMatrixEmpNos.length} 位人員嗎？`
                    )
                  ) {
                    batchRemovePermissionItems(selectedMatrixEmpNos);
                    setActionNotice(
                      `已成功自權限矩陣移除 ${selectedMatrixEmpNos.length} 位同仁！`
                    );
                    setSelectedMatrixEmpNos([]);
                    setTimeout(() => setActionNotice(null), 3000);
                  }
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5 animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                批次刪除選取權限人員 ({selectedMatrixEmpNos.length})
              </button>
            )}

            <span className="text-slate-500 font-medium">批次授權：</span>
            <button
              onClick={() => handleBatchToggleLogin(true)}
              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded hover:bg-blue-100 transition-colors"
            >
              全體允許登入
            </button>
            <button
              onClick={() => handleBatchToggleLogin(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300 transition-colors"
            >
              全體關閉登入
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleBatchToggleBackend(true)}
              className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded hover:bg-emerald-100 transition-colors"
            >
              全體允許後台
            </button>
            <button
              onClick={() => handleBatchToggleBackend(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300 transition-colors"
            >
              全體關閉後台
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredPermissions.length > 0 &&
                      filteredPermissions.every((p) =>
                        selectedMatrixEmpNos.includes(p.empNo)
                      )
                    }
                    onChange={() => {
                      const filteredNos = filteredPermissions.map((p) => p.empNo);
                      const allSelected = filteredNos.every((no) =>
                        selectedMatrixEmpNos.includes(no)
                      );
                      if (allSelected) {
                        setSelectedMatrixEmpNos((prev) =>
                          prev.filter((no) => !filteredNos.includes(no))
                        );
                      } else {
                        setSelectedMatrixEmpNos((prev) =>
                          Array.from(new Set([...prev, ...filteredNos]))
                        );
                      }
                    }}
                    title="全選 / 取消全選目前篩選名單"
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">員工編號</th>
                <th className="py-2.5 px-3">姓名</th>
                <th className="py-2.5 px-3">部室單位</th>
                <th className="py-2.5 px-3">職稱</th>
                <th className="py-2.5 px-3 text-center bg-blue-50/50 text-blue-900 border-x border-slate-200">
                  <div className="flex flex-col items-center">
                    <span>可進入系統 (登入開關)</span>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-normal text-slate-500">
                      <button
                        onClick={() => handleBatchToggleLogin(true)}
                        className="hover:underline text-blue-600 font-semibold"
                      >
                        全開
                      </button>
                      <span>/</span>
                      <button
                        onClick={() => handleBatchToggleLogin(false)}
                        className="hover:underline text-rose-600 font-semibold"
                      >
                        全關
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center bg-emerald-50/40 text-emerald-900 border-r border-slate-200">
                  <div className="flex flex-col items-center">
                    <span>可登入後台</span>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-normal text-slate-500">
                      <button
                        onClick={() => handleBatchToggleBackend(true)}
                        className="hover:underline text-emerald-600 font-semibold"
                      >
                        全開
                      </button>
                      <span>/</span>
                      <button
                        onClick={() => handleBatchToggleBackend(false)}
                        className="hover:underline text-rose-600 font-semibold"
                      >
                        全關
                      </button>
                    </div>
                  </div>
                </th>
                {dashboards.map((dash) => (
                  <th key={dash.id} className="py-2.5 px-3 text-center border-r border-slate-200">
                    <div className="flex flex-col items-center">
                      <span>{dash.name}</span>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] font-normal text-slate-500">
                        <button
                          onClick={() => handleBatchToggleDashboard(dash.id, true)}
                          className="hover:underline text-blue-600 font-semibold"
                        >
                          全開
                        </button>
                        <span>/</span>
                        <button
                          onClick={() => handleBatchToggleDashboard(dash.id, false)}
                          className="hover:underline text-rose-600 font-semibold"
                        >
                          全關
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center text-slate-700 bg-slate-100/70">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredPermissions.map((perm) => {
                const isRowSelected = selectedMatrixEmpNos.includes(perm.empNo);
                return (
                  <tr
                    key={perm.empNo}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      isRowSelected ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => {
                          setSelectedMatrixEmpNos((prev) =>
                            prev.includes(perm.empNo)
                              ? prev.filter((no) => no !== perm.empNo)
                              : [...prev, perm.empNo]
                          );
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-600">{perm.empNo}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{perm.name}</td>
                    <td className="py-2 px-3">{perm.department}</td>
                    <td className="py-2 px-3 text-slate-500">{perm.title}</td>

                    {/* Master canLogin Switch */}
                    <td className="py-2 px-3 text-center bg-blue-50/20 border-x border-slate-200">
                      <button
                        onClick={() =>
                          updatePermissionItem(perm.empNo, { canLogin: !perm.canLogin })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          perm.canLogin
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                        }`}
                      >
                        {perm.canLogin ? (
                          <>
                            <Unlock className="w-3 h-3" /> 允許登入
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> 禁止
                          </>
                        )}
                      </button>
                    </td>

                    {/* canAccessBackend Switch */}
                    <td className="py-2 px-3 text-center bg-emerald-50/10 border-r border-slate-200">
                      <button
                        onClick={() =>
                          updatePermissionItem(perm.empNo, { canAccessBackend: !perm.canAccessBackend })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          perm.canAccessBackend
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                        }`}
                      >
                        {perm.canAccessBackend ? (
                          <>
                            <Unlock className="w-3 h-3" /> 允許登入
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> 禁止
                          </>
                        )}
                      </button>
                    </td>

                    {/* Dynamic Registered Dashboards checkboxes */}
                    {dashboards.map((dash) => {
                      const isAllowed = !!perm.dashboardAccess?.[dash.id];
                      return (
                        <td key={dash.id} className="py-2 px-3 text-center border-r border-slate-200">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            disabled={!perm.canLogin}
                            onChange={() => {
                              updatePermissionItem(perm.empNo, {
                                dashboardAccess: {
                                  ...(perm.dashboardAccess || {}),
                                  [dash.id]: !isAllowed,
                                },
                              });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-30"
                          />
                        </td>
                      );
                    })}

                    {/* Delete Permission Action */}
                    <td className="py-2 px-3 text-center bg-slate-50/40">
                      <button
                        type="button"
                        title={`自權限矩陣移除 ${perm.name} (${perm.empNo})`}
                        onClick={() => {
                          setDeletingEmp({ empNo: perm.empNo, name: perm.name });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>刪除權限</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Add Dashboard Modal */}
      {showAddDashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">動態擴充新儀表板權限欄位</h3>
            <p className="text-xs text-slate-500">
              新增自訂儀表板權限維度後，權限矩陣將即時新增一欄，供管理者勾選個別同仁之存取權限。
            </p>

            <form onSubmit={handleCreateDashboard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  儀表板 ID 代碼 (英文數字)
                </label>
                <input
                  type="text"
                  value={newDashboardId}
                  onChange={(e) => setNewDashboardId(e.target.value)}
                  placeholder="例：safety_dashboard 或 cost_analysis"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  儀表板顯示名稱
                </label>
                <input
                  type="text"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="例：工安巡檢儀表板 或 成本控制儀表"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDashModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  確認新增欄位
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Whitelist Picker Modal matching Image 2 */}
      {showAddWhitelistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-200" />
                  從「全域人員名單庫」新增可登入白名單人員
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  搜尋全公司同仁並手動加入可登入白名單，將自動增補至權限矩陣並啟用系統存取權
                </p>
              </div>
              <button
                onClick={() => setShowAddWhitelistModal(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification */}
            {addNotice && (
              <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {addNotice}
              </div>
            )}

            {/* Filter controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={whitelistSearch}
                    onChange={(e) => setWhitelistSearch(e.target.value)}
                    placeholder="輸入員工編號、姓名、部門關鍵字搜尋..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <select
                  value={whitelistDept}
                  onChange={(e) => setWhitelistDept(e.target.value)}
                  className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {globalDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
                >
                  全選 / 反選篩選結果 ({filteredGlobalEmployees.length})
                </button>
              </div>
            </div>

            {/* Employee List Table */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[420px]">
              {filteredGlobalEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  查無符合「{whitelistSearch}」之全域同仁資料
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">選擇</th>
                      <th className="py-2.5 px-3">員工編號</th>
                      <th className="py-2.5 px-3">姓名</th>
                      <th className="py-2.5 px-3">部室單位</th>
                      <th className="py-2.5 px-3">職稱 / 職等</th>
                      <th className="py-2.5 px-3 text-center">目前白名單狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGlobalEmployees.map((emp) => {
                      const isSelected = selectedEmpNos.includes(emp.empNo);
                      const inMatrix = permissionMatrix.find((p) => p.empNo === emp.empNo);
                      const isWhitelisted = inMatrix?.canLogin ?? false;

                      return (
                        <tr
                          key={emp.empNo}
                          onClick={() => handleToggleSelectEmp(emp.empNo)}
                          className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${
                            isSelected ? 'bg-blue-50/80 font-medium' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectEmp(emp.empNo)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">
                            {emp.empNo}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{emp.name}</td>
                          <td className="py-2 px-3">{emp.department}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {emp.title} {emp.rank ? `(${emp.rank}等)` : ''}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isWhitelisted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <Check className="w-3 h-3" /> 已在白名單
                              </span>
                            ) : inMatrix ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                尚未允許登入
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                未加入矩陣
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                已選取 <strong className="text-blue-600">{selectedEmpNos.length}</strong> 位同仁
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWhitelistModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={selectedEmpNos.length === 0}
                  onClick={handleConfirmAddWhitelist}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  加入所選人員至白名單 ({selectedEmpNos.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Permission Confirmation Modal */}
      {deletingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">移除權限白名單人員</h4>
                <p className="text-xs text-slate-500 font-mono">
                  {deletingEmp.empNo} - <span className="font-sans font-semibold text-slate-700">{deletingEmp.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              確定要從<strong>「可登入白名單與各儀表板權限矩陣」</strong>中刪除此同仁嗎？
              <br />
              <span className="text-[11px] text-slate-500 mt-1 block">
                （註：此操作僅移除該員之登入與儀表板存取授權，不會刪除「全域同仁名冊資料庫」中之員工基本檔案，日後可隨時重新加入白名單）
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingEmp(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  removePermissionItem(deletingEmp.empNo);
                  setSelectedMatrixEmpNos((prev) =>
                    prev.filter((id) => id !== deletingEmp.empNo)
                  );
                  setActionNotice(`已成功將 ${deletingEmp.name} (${deletingEmp.empNo}) 自權限矩陣與白名單移除！`);
                  setDeletingEmp(null);
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                確定刪除權限
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Conflict & Anomaly Audit Modal */}
      <PermissionConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onNavigateToTab={(tab) => {
          if (tab === '1-5' && onNavigateToManagerMatrix) {
            onNavigateToManagerMatrix();
          }
        }}
      />
    </div>
  );
};
