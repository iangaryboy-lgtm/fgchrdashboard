import React, { useState } from 'react';
import {
  Award,
  Building,
  Send,
  Bell,
  Sparkles,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Layers,
} from 'lucide-react';
import { MasterLicenseCatalogTab } from './MasterLicenseCatalogTab';
import { LicenseDatabaseTab } from './LicenseDatabaseTab';
import { SiteRequirementTab } from './SiteRequirementTab';
import { DispatchTrainingTab } from './DispatchTrainingTab';
import { LicenseNotificationTab } from './LicenseNotificationTab';
import { LicenseReportExportTab } from './LicenseReportExportTab';
import { useApp } from '../../../context/AppContext';

export const ResumeLicenseSettingsMain: React.FC = () => {
  const { masterLicenses, employeeLicenses, siteLicenseRequirements, dispatchTrainings } = useApp();

  const [activeTab, setActiveTab] = useState<
    'master_licenses' | 'database' | 'site_requirements' | 'dispatch' | 'notification' | 'reports_export'
  >('master_licenses');

  const pendingReviewCount = employeeLicenses.filter((l) => l.status === 'pending_review').length;
  const inTrainingCount = dispatchTrainings.filter((d) => d.status === 'in_training' || d.status === 'examining').length;
  const totalMasterCount = masterLicenses?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  證照資訊管理
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg">
                  證照雲架構
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                建立標準證照規格庫、維護人員證照總表、設定案場需求、智慧派訓審核與到期預警發信
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar - Sequential Order: 證照資料 -> 人員證照總表 -> 公司/工地需求 -> 派訓管理 -> 預警發信 */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('master_licenses')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'master_licenses'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. 證照資料
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">
              {totalMasterCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'database'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            2. 人員證照總表
            {pendingReviewCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black animate-pulse">
                {pendingReviewCount} 待審
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('site_requirements')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'site_requirements'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            3. 公司 / 工地需求設定
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dispatch'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            4. 派訓與結訓審核
            {inTrainingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] rounded-full font-black">
                {inTrainingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notification')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notification'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            5. 到期預警與發信設定
          </button>

          <button
            onClick={() => setActiveTab('reports_export')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports_export'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
            6. 統計報表與 Excel 匯出
          </button>
        </div>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'master_licenses' && <MasterLicenseCatalogTab />}
      {activeTab === 'database' && <LicenseDatabaseTab />}
      {activeTab === 'site_requirements' && <SiteRequirementTab />}
      {activeTab === 'dispatch' && <DispatchTrainingTab />}
      {activeTab === 'notification' && <LicenseNotificationTab />}
      {activeTab === 'reports_export' && <LicenseReportExportTab />}
    </div>
  );
};

