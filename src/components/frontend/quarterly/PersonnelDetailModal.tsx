import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Search,
  CheckCircle2,
  Clock,
  GraduationCap,
  ChevronRight,
  Filter,
  UserCheck,
  Building2,
  Calendar,
  Award,
  HardHat,
} from 'lucide-react';
import { CandidateProfile, QuarterDemandStats } from '../../../types';
import { CandidateFullProfileModal } from './CandidateFullProfileModal';
import { useApp } from '../../../context/AppContext';
import { getCandidatePhoto } from '../../../utils/candidatePkHelper';

interface PersonnelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quarterStats: QuarterDemandStats;
  initialTab?: TalentTab;
}

export type TalentTab = 'available' | 'withinOneYear' | 'inTraining' | 'stableOnDuty';

export const PersonnelDetailModal: React.FC<PersonnelDetailModalProps> = ({
  isOpen,
  onClose,
  quarterStats,
  initialTab = 'available',
}) => {
  const { employees, candidates } = useApp();
  const [activeTab, setActiveTab] = useState<TalentTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  // 取得各類別候選人清單
  const availableList = quarterStats.availableCandidates || [];
  const withinOneYearList = quarterStats.withinOneYearCandidates || [];
  const inTrainingList = quarterStats.inTrainingCandidates || [];
  const stableOnDutyList = quarterStats.stableOnDutyCandidates || [];

  // 取得當前 Tab 人員
  const currentList = useMemo(() => {
    let list: CandidateProfile[] = [];
    if (activeTab === 'available') list = availableList;
    else if (activeTab === 'withinOneYear') list = withinOneYearList;
    else if (activeTab === 'inTraining') list = inTrainingList;
    else if (activeTab === 'stableOnDuty') list = stableOnDutyList;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.empNo.toLowerCase().includes(q) ||
        (c.department || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q)
    );
  }, [activeTab, availableList, withinOneYearList, inTrainingList, stableOnDutyList, searchQuery]);

  // 動態計算釋出狀態文字與標籤樣式
  const getDetailedReleaseStatus = (c: CandidateProfile, tab: TalentTab) => {
    if (tab === 'available') {
      return {
        label: '現任主管 · 已達標準釋出',
        subText: `標準釋出日已屆至 (${c.releaseDate || '無固定限制'})，可即時受派接任新案`,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
      };
    }
    if (tab === 'withinOneYear') {
      return {
        label: '現任主管 · 預計1年內釋出',
        subText: `預定釋出日：${c.releaseDate || c.expectedAvailableQuarter || '未來四季內'} (案場收尾/使照交屋中)`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Clock,
      };
    }
    if (tab === 'stableOnDuty') {
      return {
        label: '現任主管 · 工區帶案中',
        subText: c.currentProject ? `現任負責專案：${c.currentProject} (預計釋出日：${c.releaseDate || '施工穩定'})` : '在建工區施工中，釋出期程在1年以上',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        icon: HardHat,
      };
    }
    return {
      label: '儲備幹部 · 培育進程中',
      subText: '參與案主管培訓與職能評量，待考核通過即可納入指派名單',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: GraduationCap,
    };
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        id="personnel-detail-modal"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {quarterStats.quarter} 人才庫詳細名冊
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    基準季度：{quarterStats.quarter}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  點選人員卡片可檢視完整履歷、七大工程歷練、適配規模與歷史實績
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

          {/* 3 大分頁 Tabs 控制列 */}
          <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 border-b border-transparent">
              {/* Tab 1: 可供應人才庫 */}
              <button
                type="button"
                onClick={() => setActiveTab('available')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'available'
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>可供應人才庫</span>
                <span
                  className={`text-xs px-2 py-0.2 rounded-full font-black ${
                    activeTab === 'available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {availableList.length} 人
                </span>
              </button>

              {/* Tab 2: 一年度預計釋出 */}
              <button
                type="button"
                onClick={() => setActiveTab('withinOneYear')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'withinOneYear'
                    ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>一年度預計釋出</span>
                <span
                  className={`text-xs px-2 py-0.2 rounded-full font-black ${
                    activeTab === 'withinOneYear'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {withinOneYearList.length} 人
                </span>
              </button>

              {/* Tab 3: 培育中儲備幹部 */}
              <button
                type="button"
                onClick={() => setActiveTab('inTraining')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'inTraining'
                    ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>培育中儲備幹部</span>
                <span
                  className={`text-xs px-2 py-0.2 rounded-full font-black ${
                    activeTab === 'inTraining'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {inTrainingList.length} 人
                </span>
              </button>

              {/* Tab 4: 現任在案主管 (工區帶案穩定中) */}
              <button
                type="button"
                onClick={() => setActiveTab('stableOnDuty')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'stableOnDuty'
                    ? 'border-slate-700 text-slate-900 bg-slate-100/70 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                }`}
              >
                <HardHat className="w-4 h-4 text-slate-700" />
                <span>現任在案主管</span>
                <span
                  className={`text-xs px-2 py-0.2 rounded-full font-black ${
                    activeTab === 'stableOnDuty'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stableOnDutyList.length} 人
                </span>
              </button>
            </div>

            {/* 關鍵字搜尋 */}
            <div className="relative min-w-[200px] mb-2 sm:mb-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋姓名、工號、部門..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

          {/* 人員列表區 */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/50 flex-1">
            {currentList.length > 0 ? (
              currentList.map((c) => {
                const emp = employees?.find((e) => e.empNo === c.empNo);
                const globalCand = candidates?.find((gc) => gc.empNo === c.empNo);

                const displayTitle = c.title || (c as any).jobTitle || globalCand?.title || emp?.title || '工程師';
                const displayRank = c.rank || (c as any).grade || globalCand?.rank || emp?.rank || '06';

                let seniority = c.farglorySeniorityYears ?? c.dynamicSeniority ?? (c as any).seniority ?? globalCand?.farglorySeniorityYears;
                if (seniority === undefined && emp?.seniorityStartDate) {
                  const sMs = new Date(emp.seniorityStartDate).getTime();
                  if (!isNaN(sMs)) seniority = +((Date.now() - sMs) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
                }
                const displaySeniority = seniority !== undefined ? `${seniority}` : '14.2';

                const mgmtYears = c.dynamicInternalMgmtYears ?? c.internalMgmtYears ?? (c as any).managementSeniority ?? globalCand?.dynamicInternalMgmtYears ?? 0;

                const statusInfo = getDetailedReleaseStatus(c, activeTab);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={`cand-card-${c.id || c.empNo}`}
                    onClick={() => setSelectedCandidate(c)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* 左側：人員基本標籤與現職 */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs shrink-0 relative group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                        <img
                          src={c.photoUrl || (globalCand && globalCand.photoUrl) || getCandidatePhoto(globalCand || c)}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="hidden w-full h-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-black text-base items-center justify-center transition-colors">
                          {c.name.slice(0, 1)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {c.name}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {c.empNo}
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {displayTitle} (職等 {displayRank})
                          </span>
                          {c.eval2025 && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Award className="w-3 h-3" />
                              2025: {c.eval2025}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>
                            現職：<strong className="text-slate-700">{c.department || emp?.department || '工務部'}</strong>
                          </span>
                          <span>·</span>
                          <span>遠雄年資：{displaySeniority} 年</span>
                          <span>·</span>
                          <span>管理年資：{mgmtYears} 年</span>
                        </div>
                      </div>
                    </div>

                    {/* 中間與右側：釋出狀態說明與查看詳情按鈕 */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
                      <div className="text-left sm:text-right space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                        <p className="text-[11px] text-slate-500 max-w-xs">{statusInfo.subText}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(c);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>完整履歷</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">查無符合條件的人選</p>
                <p className="text-xs text-slate-400 mt-1">請切換其他人才類別分頁或重新輸入關鍵字</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
            <span className="text-xs text-slate-500">
              顯示 {currentList.length} 人 (總人才池：{quarterStats.totalTalentPoolCount} 人)
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

      {/* 人員詳細資訊 Modal (點選人員後開啟) */}
      {selectedCandidate && (
        <CandidateFullProfileModal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
          benchmarkQuarter={quarterStats.quarter}
        />
      )}
    </>
  );
};
