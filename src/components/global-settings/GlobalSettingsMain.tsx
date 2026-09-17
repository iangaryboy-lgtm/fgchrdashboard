import React, { useState } from 'react';
import { EmployeeDirectory } from './EmployeeDirectory';
import { OrgStructureTree } from './OrgStructureTree';
import { PermissionSettings } from './PermissionSettings';
import { EmailManager } from './EmailManager';
import { DepartmentManagerPermissionMatrix } from './DepartmentManagerPermissionMatrix';
import {
  Settings,
  Users,
  Network,
  ShieldCheck,
  Mail,
  Sliders,
} from 'lucide-react';

export const GlobalSettingsMain: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'1-1' | '1-2' | '1-3' | '1-4' | '1-5'>('1-5');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Global Settings Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              全域總功能設定
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              最高管理權限專區
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            維護全域同仁名冊資料庫、企業樹狀組織架構、Google管理員與登入白名單權限矩陣、系統郵件發送編輯
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('1-1')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '1-1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            1-1. 全員名單庫維護
          </button>

          <button
            onClick={() => setActiveSubTab('1-2')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '1-2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            1-2. 公司組織架構
          </button>

          <button
            onClick={() => setActiveSubTab('1-3')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '1-3'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            1-3. 權限設定 (白名單)
          </button>

          <button
            onClick={() => setActiveSubTab('1-4')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '1-4'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            1-4. 信件發送及內容編輯
          </button>

          <button
            id="tab-dept-manager-permissions"
            onClick={() => setActiveSubTab('1-5')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '1-5'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1-5. 部門主管權限矩陣
          </button>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === '1-1' && <EmployeeDirectory />}
        {activeSubTab === '1-2' && <OrgStructureTree />}
        {activeSubTab === '1-3' && <PermissionSettings onNavigateToManagerMatrix={() => setActiveSubTab('1-5')} />}
        {activeSubTab === '1-4' && <EmailManager />}
        {activeSubTab === '1-5' && <DepartmentManagerPermissionMatrix />}
      </div>
    </div>
  );
};

