import React, { useState } from 'react';
import {
  FolderKanban,
  GraduationCap,
  BookOpen,
  FolderOpen,
  ExternalLink,
  Map,
  Sparkles,
} from 'lucide-react';
import { TrainingCategoriesTab } from './training/TrainingCategoriesTab';
import { InstructorsTab } from './training/InstructorsTab';
import { InternalCoursesTab } from './training/InternalCoursesTab';
import { CourseMaterialsTab } from './training/CourseMaterialsTab';
import { ExternalCoursesTab } from './training/ExternalCoursesTab';
import { LearningMapsTab } from './training/LearningMapsTab';
import { AnnualTrainingRequirementsTab } from './training/AnnualTrainingRequirementsTab';
import { Calendar } from 'lucide-react';

export const TrainingSettingsMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'annual_requirements' | 'courses' | 'materials' | 'instructors' | 'categories' | 'external' | 'learning_maps'
  >('annual_requirements');

  const tabs = [
    {
      id: 'annual_requirements',
      name: '年度訓練規定',
      icon: Calendar,
      badge: '時數與規定設定',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'courses',
      name: '內部訓練課程',
      icon: BookOpen,
      badge: '核心排課',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'materials',
      name: '課程教材庫',
      icon: FolderOpen,
      badge: '教材管理',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'instructors',
      name: '講師資料庫',
      icon: GraduationCap,
      badge: '內外部師資',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'categories',
      name: '訓練類別設定',
      icon: FolderKanban,
      badge: '職能分類',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'external',
      name: '外訓審查與記錄',
      icon: ExternalLink,
      badge: '費用補助',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'learning_maps',
      name: '學習地圖與職能路徑',
      icon: Map,
      badge: '案主管專案',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                育碁 aEnrich 級企業大學培訓架構
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              專業訓練設定與人資管理中心
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              全方位維護遠雄營造同仁職能培訓體系，支援實體/線上/混成課程梯次排定、教材庫雲端掛載、講師歷年授課評鑑、正取/候補自動遞補與電子結業證書核發。
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive ? 'bg-white/20 text-white' : tab.badgeColor
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Active Tab */}
      <div className="transition-all duration-150">
        {activeTab === 'annual_requirements' && <AnnualTrainingRequirementsTab />}
        {activeTab === 'categories' && <TrainingCategoriesTab />}
        {activeTab === 'instructors' && <InstructorsTab />}
        {activeTab === 'courses' && <InternalCoursesTab />}
        {activeTab === 'materials' && <CourseMaterialsTab />}
        {activeTab === 'external' && <ExternalCoursesTab />}
        {activeTab === 'learning_maps' && <LearningMapsTab />}
      </div>
    </div>
  );
};
