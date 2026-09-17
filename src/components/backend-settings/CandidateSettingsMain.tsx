import React, { useState } from 'react';
import { CandidatePoolSettings } from './CandidatePoolSettings';
import { SurveyFormEditor } from './SurveyFormEditor';
import {
  SlidersHorizontal,
  Users,
  ClipboardList,
} from 'lucide-react';

export const CandidateSettingsMain: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'2-1' | '2-2'>('2-1');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              案主管人選背景設定
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              專案遴選模型後台
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            維護案主管人才庫資料庫與推薦及意願調查表單設定
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('2-1')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '2-1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2-1. 人選庫設定
          </button>

          <button
            onClick={() => setActiveSubTab('2-2')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === '2-2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            2-2. 推薦及意願調查表單設定
          </button>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === '2-1' && <CandidatePoolSettings />}
        {activeSubTab === '2-2' && <SurveyFormEditor />}
      </div>
    </div>
  );
};


