import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  HardHat,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ProjectPlan } from '../../../types';

export type ProjectStatusType = 'new' | 'underConstruction' | 'license';

interface ProjectStatusListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  quarterLabel: string;
  statusType: ProjectStatusType;
  projects: ProjectPlan[];
}

// 六都 + 其他縣市標籤清單
const SIX_CITIES_TABS = [
  '全部',
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '其他',
] as const;

export const ProjectStatusListModal: React.FC<ProjectStatusListModalProps> = ({
  isOpen,
  onClose,
  title,
  quarterLabel,
  statusType,
  projects,
}) => {
  const [selectedCityTab, setSelectedCityTab] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 規範化分類比對 (判斷專案落於哪一個六都或屬於其他)
  const getStandardCityGroup = (regionStr: string): string => {
    if (!regionStr) return '其他';
    if (regionStr.includes('台北') || regionStr.includes('臺北')) return '台北市';
    if (regionStr.includes('新北')) return '新北市';
    if (regionStr.includes('桃園')) return '桃園市';
    if (regionStr.includes('台中') || regionStr.includes('臺中')) return '台中市';
    if (regionStr.includes('台南') || regionStr.includes('臺南')) return '台南市';
    if (regionStr.includes('高雄')) return '高雄市';
    return '其他';
  };

  // 各六都之案數統計
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      全部: projects.length,
      台北市: 0,
      新北市: 0,
      桃園市: 0,
      台中市: 0,
      台南市: 0,
      高雄市: 0,
      其他: 0,
    };
    projects.forEach((p) => {
      const g = getStandardCityGroup(p.region);
      if (counts[g] !== undefined) {
        counts[g]++;
      } else {
        counts['其他']++;
      }
    });
    return counts;
  }, [projects]);

  // 篩選後清單
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 城市篩選
      if (selectedCityTab !== '全部') {
        const g = getStandardCityGroup(p.region);
        if (g !== selectedCityTab) return false;
      }
      // 關鍵字搜尋 (案號、區域、工法、規模等)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (p.projectCode || '').toLowerCase();
        const reg = (p.region || '').toLowerCase();
        const scale = (p.scaleType || '').toLowerCase();
        const tier = (p.scaleTier || '').toLowerCase();
        const method = (p.specialMethod || '').toLowerCase();
        return (
          code.includes(q) ||
          reg.includes(q) ||
          scale.includes(q) ||
          tier.includes(q) ||
          method.includes(q)
        );
      }
      return true;
    });
  }, [projects, selectedCityTab, searchQuery]);

  if (!isOpen) return null;

  // 狀態對應的色彩配置
  const statusTheme = {
    new: {
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      tagText: '新開案',
      headerBg: 'bg-blue-600',
      lightBg: 'bg-blue-50/50',
    },
    underConstruction: {
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      tagText: '在建案',
      headerBg: 'bg-slate-700',
      lightBg: 'bg-slate-50/50',
    },
    license: {
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      tagText: '使照案',
      headerBg: 'bg-emerald-600',
      lightBg: 'bg-emerald-50/50',
    },
  }[statusType];

  return (
    <div
      id="project-status-list-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${statusTheme.headerBg} text-white flex items-center justify-center shadow-xs`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {title}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusTheme.badgeBg}`}
                >
                  {statusTheme.tagText}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  基準：{quarterLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                共 {projects.length} 件建案 · 呈現規模級距、樓層結構、特殊條件與工法屬性
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 篩選控制器 (六都 + 其他 分頁切換列 & 關鍵字搜尋) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 六都 + 其他 分頁標籤 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {SIX_CITIES_TABS.map((city) => {
              const count = cityCounts[city] || 0;
              const isActive = selectedCityTab === city;
              return (
                <button
                  key={`city-tab-${city}`}
                  type="button"
                  onClick={() => setSelectedCityTab(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{city}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 快速搜尋 */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋案名、工法、屬性..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-400"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 專案卡片列表內容區 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-slate-50/50 flex-1">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((p) => {
              // 特殊屬性陣列整理
              const specialTags: { label: string; bg: string; text: string }[] = [];
              if (
                p.jointOrUrbanRenewal &&
                p.jointOrUrbanRenewal !== '無' &&
                p.jointOrUrbanRenewal !== '-'
              ) {
                specialTags.push({
                  label: p.jointOrUrbanRenewal,
                  bg: 'bg-amber-50 border-amber-200',
                  text: 'text-amber-800',
                });
              }
              if (
                p.defenseOrComprehensive &&
                p.defenseOrComprehensive !== '無' &&
                p.defenseOrComprehensive !== '-'
              ) {
                specialTags.push({
                  label: p.defenseOrComprehensive,
                  bg: 'bg-purple-50 border-purple-200',
                  text: 'text-purple-800',
                });
              }
              if (
                p.hazardAssessment &&
                p.hazardAssessment !== '無' &&
                p.hazardAssessment !== '-'
              ) {
                specialTags.push({
                  label: p.hazardAssessment,
                  bg: 'bg-rose-50 border-rose-200',
                  text: 'text-rose-800',
                });
              }
              if (
                p.specialMethod &&
                p.specialMethod !== '無' &&
                p.specialMethod !== '-'
              ) {
                specialTags.push({
                  label: `特殊工法: ${p.specialMethod}`,
                  bg: 'bg-indigo-50 border-indigo-200',
                  text: 'text-indigo-800',
                });
              }

              return (
                <div
                  key={`proj-item-${p.id || p.projectCode}`}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-3"
                >
                  {/* Top Bar: 案號、六都區域、規模級距、使照/開工時程 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-black text-slate-900 tracking-tight">
                        {p.projectCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {p.region || '未註記'}
                      </span>
                      {p.scaleTier && (
                        <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {p.scaleTier}
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                        {p.scaleType || '標準住宅'}
                      </span>
                    </div>

                    {/* 時程 */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {p.startWorkDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>開工：{p.startWorkDate}</span>
                        </div>
                      )}
                      {p.licenseFDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span>使照預定：{p.licenseFDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Content: 規模級距詳細數據 + 特殊屬性 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* 左欄：工程建築規模 */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg space-y-1.5 text-slate-700 border border-slate-100">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>工程建築規模</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">地下 / 地上層</span>
                          <span className="font-bold text-slate-800">
                            B{p.undergroundFloors || '0'} / {p.abovegroundFloors || '0'}F
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">總樓地板面積</span>
                          <span className="font-bold text-slate-800">
                            {p.totalFloorArea ? `${p.totalFloorArea.toLocaleString()} ㎡` : '尚未提供'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">棟數 / 戶數</span>
                          <span className="font-bold text-slate-800">
                            {p.buildingsCount || 1} 棟 / {p.unitsCount ? `${p.unitsCount} 戶` : '待定'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右欄：特殊屬性與工法 */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg space-y-1.5 border border-slate-100">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>特殊屬性與工法</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specialTags.length > 0 ? (
                          specialTags.map((tag, tIdx) => (
                            <span
                              key={`tag-${p.id}-${tIdx}`}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${tag.bg} ${tag.text}`}
                            >
                              {tag.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            常規工法標準案場 (無特殊合建/都更/深開挖條件)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: 案主管指派狀況 */}
                  <div className="flex items-center justify-between text-xs bg-blue-50/40 px-3 py-2 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-700">案主管派任：</span>
                      {p.matchedLeaderName ? (
                        <span className="font-black text-blue-900">
                          {p.matchedLeaderName} (工號: {p.matchedLeaderEmpNo || '—'})
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                          待遴選指派 (需求評估中)
                        </span>
                      )}
                    </div>
                    {p.openQuarter && (
                      <span className="text-[11px] text-slate-500">
                        預計開案季度：<strong className="text-slate-800">{p.openQuarter}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">
                此分類下無「{selectedCityTab}」的案場
              </p>
              <p className="text-xs text-slate-400 mt-1">請點選其他城市分頁或清除關鍵字搜尋</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500">
            顯示 {filteredProjects.length} 筆 (總共 {projects.length} 案)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
