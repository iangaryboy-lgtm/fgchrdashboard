import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Building,
  User,
  Key,
  FolderTree,
} from 'lucide-react';
import { OrgTreePickerModal } from '../common/OrgTreePickerModal';
import { OrgNode } from '../../types';

interface LoginModalProps {
  onClose: () => void;
}

/**
 * Extract departments from OrgNode
 */
function extractOrgDeptNames(tree: OrgNode): string[] {
  const names = new Set<string>();
  const traverse = (node: OrgNode) => {
    if (!node) return;
    if (
      node.level === 'department' ||
      node.level === '部室' ||
      node.level === 'division' ||
      node.level === '處級' ||
      node.level === 'president' ||
      node.level === '總經理' ||
      node.level === 'board'
    ) {
      if (node.name) names.add(node.name);
    }
    if (node.children) node.children.forEach(traverse);
  };
  if (tree) traverse(tree);
  return Array.from(names);
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { employees, permissionMatrix, setCurrentUser, googleAdmins, orgTree } = useApp();

  const [activeTab, setActiveTab] = useState<'employee' | 'google'>('employee');

  // Employee login inputs
  const [empNo, setEmpNo] = useState('');
  const [name, setName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [pin, setPin] = useState('');
  const [showOrgTreeModal, setShowOrgTreeModal] = useState(false);

  // Google login inputs
  const [googleEmail, setGoogleEmail] = useState('iangaryboy@gmail.com');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extract unique departments from orgTree and employees
  const departments = useMemo(() => {
    const list = new Set<string>(extractOrgDeptNames(orgTree));
    const standards = ['人力資源室', '工程一部', '工程二部', '土木部', '工務企劃室', '總經理室'];
    standards.forEach((s) => list.add(s));
    employees.forEach((e) => {
      if (e.department) list.add(e.department);
    });
    return Array.from(list).filter(Boolean);
  }, [orgTree, employees]);

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmpNo = empNo.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanDept = selectedDept.trim();

    if (!cleanEmpNo || !cleanName || !cleanDept) {
      setErrorMsg('請完整輸入員工編號、同仁姓名並選擇部室單位');
      return;
    }

    // Match in employee directory with org-aware tolerance
    const emp = employees.find((item) => {
      if (item.empNo.toUpperCase() !== cleanEmpNo || item.name !== cleanName) return false;
      const d = item.department.trim();
      if (d === cleanDept) return true;
      if (cleanDept.includes(d) || d.includes(cleanDept)) return true;
      if (cleanDept.includes('工程一部') && d.includes('工程一部')) return true;
      if (cleanDept.includes('工程二部') && d.includes('工程二部')) return true;
      if (cleanDept.includes('土木') && d.includes('土木')) return true;
      if (cleanDept.includes('人資') && d.includes('人資')) return true;
      if (cleanDept.includes('企劃') && d.includes('企劃')) return true;
      return false;
    });

    if (!emp) {
      setErrorMsg('驗證失敗：查無符合之同仁資料，請確認員工編號、姓名與所屬組織部室是否正確');
      return;
    }

    // Check PIN if provided
    if (pin && emp.pin && emp.pin !== pin) {
      setErrorMsg('預設 PIN 碼輸入不符，請重新確認');
      return;
    }

    // Check permission whitelist
    const perm = permissionMatrix.find((p) => p.empNo === emp.empNo);
    if (!perm || !perm.canLogin) {
      setErrorMsg('您目前未在系統可登入人員白名單內，請洽詢人力資源室管理員開通權限');
      return;
    }

    setSuccessMsg(`身分驗證成功！歡迎 ${emp.name} (${emp.title}) 登入系統`);
    setTimeout(() => {
      setCurrentUser({
        type: 'employee',
        empNo: emp.empNo,
        employee: emp,
      });
      onClose();
    }, 600);
  };

  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = googleEmail.trim().toLowerCase();
    const admin = googleAdmins.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!admin) {
      setErrorMsg('該 Google 帳號尚未獲授權管理員權限，請確認帳號或請超級管理員新增');
      return;
    }

    setSuccessMsg(`Google 管理員身分驗證成功：${admin.name} (${admin.role})`);
    setTimeout(() => {
      setCurrentUser({
        type: 'google_admin',
        googleEmail: admin.email,
        adminRole: admin.role,
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-[#1E293B] p-5 text-white relative border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-xs">
              遠
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">遠雄營造 · 系統登入端</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                請驗證同仁身分或使用 Google 管理員帳號登入
              </p>
            </div>
          </div>

          {/* Login Type Tabs */}
          <div className="flex mt-4 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => {
                setActiveTab('employee');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'employee'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              前台同仁身分驗證
            </button>
            <button
              onClick={() => {
                setActiveTab('google');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Google 管理員帳號
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {errorMsg && (
            <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'employee' ? (
            <form onSubmit={handleEmployeeLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  員工編號 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={empNo}
                    onChange={(e) => setEmpNo(e.target.value)}
                    placeholder="例：FG1001 或 FG1016"
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  同仁姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入中文全名 (例：陳冠霖)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    部室單位 (請選擇所屬組織樹部室) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOrgTreeModal(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <FolderTree className="w-3 h-3" />
                    組織樹選取
                  </button>
                </div>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full pl-8.5 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-800"
                    required
                  >
                    <option value="">-- 請選擇組織樹部室單位 --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    預設 PIN 碼 (4碼)
                  </label>
                  <span className="text-[10px] text-slate-400">初始預設為 1234 / 2345 等</span>
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4 碼數字 PIN"
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tracking-widest text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                驗證身分並登入
              </button>
            </form>
          ) : (
            <form onSubmit={handleGoogleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google 管理員電子信箱
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="例：iangaryboy@gmail.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-slate-800"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1.5 text-[11px]">目前系統已授權之管理員：</p>
                <ul className="space-y-1">
                  {googleAdmins.map((adm) => (
                    <li key={adm.email} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-700">{adm.email}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold font-mono">
                        {adm.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                以 Google 管理員身分登入
              </button>
            </form>
          )}
        </div>
      </div>

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

