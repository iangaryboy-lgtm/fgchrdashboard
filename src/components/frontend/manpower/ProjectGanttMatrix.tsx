import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ProjectPlan, ManpowerFormulaConfig } from '../../../types';
import {
  QUARTERS_LIST,
  calculateSingleProjectDemand,
  getQuarterMidDate,
  BASE_SNAPSHOT_QUARTER,
} from '../../../utils/manpowerCalculator';

interface ProjectGanttMatrixProps {
  projectPlans: ProjectPlan[];
  selectedDept: string;
  selectedSection?: string;
  selectedRole?: string;
  selectedPhase?: string;
  selectedQuarter: string;
  config: ManpowerFormulaConfig;
  delayMonths: number;
  makeOrBuyRatio: number;
  onSelectProjectForLifecycle: (proj: ProjectPlan) => void;
  onSelectQuarter: (q: string) => void;
}

// Stage color mapping
const getStageBadgeStyle = (stageName: string, isActive: boolean) => {
  if (!isActive && stageName.includes('未開工')) {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-400',
      border: 'border-slate-200',
      label: '未動工',
    };
  }
  if (!isActive && stageName.includes('結案')) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-400',
      border: 'border-slate-200',
      label: '已結案',
    };
  }
  if (stageName.includes('案前')) {
    return {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      label: '案前籌劃',
    };
  }
  if (stageName.includes('地下') || stageName.includes('1FL前') || stageName.includes('開挖')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      label: '地下結構',
    };
  }
  if (stageName.includes('結構') || stageName.includes('2FL') || stageName.includes('6FL')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: '主體結構',
    };
  }
  if (stageName.includes('裝修') || stageName.includes('使照') || stageName.includes('景觀')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: '裝修使照',
    };
  }
  if (stageName.includes('交屋') || stageName.includes('管委會') || stageName.includes('售服')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: '交屋保固',
    };
  }
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: stageName,
  };
};

export const ProjectGanttMatrix: React.FC<ProjectGanttMatrixProps> = ({
  projectPlans,
  selectedDept,
  selectedSection = '全部科案',
  selectedRole = '全部職類',
  selectedPhase = '全部階段',
  selectedQuarter,
  config,
  delayMonths,
  makeOrBuyRatio,
  onSelectProjectForLifecycle,
  onSelectQuarter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  // Filter projects by department, section, and search query
  const filteredProjects = useMemo(() => {
    return projectPlans.filter((p) => {
      if (p.isTakedownActive === false) return false;
      if (selectedDept !== '全部' && selectedDept !== '全部單位' && (p.department || '二部') !== selectedDept) {
        return false;
      }
      if (
        selectedSection &&
        selectedSection !== '全部科案' &&
        selectedSection !== '全部科別' &&
        selectedSection !== '全部'
      ) {
        const secName = p.section || `${(p.region || '').slice(0, 3)}工區科`;
        if (p.section !== selectedSection && secName !== selectedSection) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = (p.projectCode || '').toLowerCase().includes(query);
        const matchRegion = (p.region || '').toLowerCase().includes(query);
        const matchDept = (p.department || '').toLowerCase().includes(query);
        const matchSec = (p.section || '').toLowerCase().includes(query);
        if (!matchCode && !matchRegion && !matchDept && !matchSec) return false;
      }
      return true;
    });
  }, [projectPlans, selectedDept, selectedSection, searchTerm]);

  // Precompute matrix cells for each project x quarter
  const matrixData = useMemo(() => {
    return filteredProjects.map((proj) => {
      const quarters = QUARTERS_LIST.map((quarter) => {
        const date = getQuarterMidDate(quarter);
        const result = calculateSingleProjectDemand(proj, date, config, delayMonths, makeOrBuyRatio);

        let roleValue = result.breakdown.total;
        if (selectedRole === '案主管') roleValue = result.breakdown.manager;
        else if (selectedRole === '建築') roleValue = result.breakdown.civil;
        else if (selectedRole === '機電') roleValue = result.breakdown.mep;
        else if (selectedRole === '職安') roleValue = result.breakdown.safety;
        else if (selectedRole === '營管') roleValue = result.breakdown.admin;

        return {
          quarter,
          stageName: result.stageName,
          isActive: result.isActive,
          total: Math.round(result.breakdown.total * 10) / 10,
          roleValue: Math.round(roleValue * 10) / 10,
          breakdown: result.breakdown,
        };
      });

      const isCurrentActive = quarters.find((q) => q.quarter === selectedQuarter)?.isActive || false;

      return {
        project: proj,
        quarters,
        isCurrentActive,
      };
    });
  }, [filteredProjects, config, delayMonths, makeOrBuyRatio, selectedQuarter, selectedRole]);

  // Phase filter & Active filter
  const displayedRows = useMemo(() => {
    let rows = matrixData;
    if (activeOnly) {
      rows = rows.filter((row) => row.isCurrentActive);
    }
    if (selectedPhase && selectedPhase !== '全部階段') {
      rows = rows.filter((row) => {
        const currentQ = row.quarters.find((q) => q.quarter === selectedQuarter);
        if (!currentQ) return false;
        const stageName = currentQ.stageName;
        return (
          (selectedPhase === '案前籌劃' && stageName.includes('案前')) ||
          (selectedPhase === '地下開挖與結構' &&
            (stageName.includes('地下') || stageName.includes('開挖') || stageName.includes('1FL前'))) ||
          (selectedPhase === '結構施工期' &&
            (stageName.includes('結構') || stageName.includes('2FL') || stageName.includes('6FL'))) ||
          (selectedPhase === '上部裝修與使照' &&
            (stageName.includes('裝修') || stageName.includes('使照') || stageName.includes('景觀'))) ||
          (selectedPhase === '收尾交屋與保固' &&
            (stageName.includes('交屋') || stageName.includes('管委會') || stageName.includes('售服')))
        );
      });
    }
    return rows;
  }, [matrixData, activeOnly, selectedPhase, selectedQuarter]);

  return (
    <div id="project-gantt-matrix-card" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                VISUAL 03
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                案場排程與人力甘特矩陣 (Project Schedule Gantt Matrix)
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            橫軸為 24 季工程期程，縱軸為案場；點擊任一案場名稱可檢視<b>單案生命週期全景 (Project Lifecycle View)</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋案號、區域、科別..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-40 sm:w-48"
            />
          </div>

          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              activeOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {activeOnly ? '僅顯示當季施工案' : '顯示全部案場'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg text-[11px] mb-3 border border-slate-100">
        <span className="font-semibold text-slate-600">階段標記:</span>
        <span className="flex items-center gap-1 text-cyan-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-100 border border-cyan-300"></span> 案前籌劃
        </span>
        <span className="flex items-center gap-1 text-indigo-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-300"></span> 地下結構
        </span>
        <span className="flex items-center gap-1 text-blue-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300"></span> 主體結構
        </span>
        <span className="flex items-center gap-1 text-amber-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300"></span> 裝修使照
        </span>
        <span className="flex items-center gap-1 text-emerald-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300"></span> 交屋保固
        </span>
        <span className="ml-auto text-slate-500 font-medium">
          {selectedRole !== '全部職類' ? (
            <span>目前顯示：<b>{selectedRole}</b> 職能需求 (人)</span>
          ) : (
            <span>數字代表該季案場總需求人力 (人)</span>
          )}
        </span>
      </div>

      {/* Gantt Matrix Table Container with Fixed Left Column and Scrollable Quarters */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[380px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-slate-100/90 sticky top-0 z-20 backdrop-blur-xs text-[11px] text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-30 bg-slate-100 p-2.5 min-w-[200px] border-r border-slate-200">
                案場識別 / 單位 / 轄科
              </th>
              <th className="p-2 min-w-[70px] text-center border-r border-slate-200">
                開工日
              </th>
              <th className="p-2 min-w-[70px] text-center border-r border-slate-200">
                使照日
              </th>
              {QUARTERS_LIST.map((quarter) => {
                const isSelected = quarter === selectedQuarter;
                const isBase = quarter === BASE_SNAPSHOT_QUARTER;
                return (
                  <th
                    key={quarter}
                    onClick={() => onSelectQuarter(quarter)}
                    className={`p-1.5 text-center min-w-[58px] cursor-pointer transition-colors border-r border-slate-200 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : isBase
                        ? 'bg-blue-100/80 text-blue-900 font-bold'
                        : 'hover:bg-slate-200'
                    }`}
                    title={isBase ? '2026Q3 現況基準點' : `點擊切換至 ${quarter}`}
                  >
                    <div>{quarter}</div>
                    {isBase && !isSelected && (
                      <div className="text-[9px] text-blue-700">★基準</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={QUARTERS_LIST.length + 3} className="text-center py-8 text-slate-400">
                  查無符合條件之案場
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
                const proj = row.project;
                return (
                  <tr
                    key={proj.id || proj.projectCode}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Fixed Project Info Column */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-2.5 border-r border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            onClick={() => onSelectProjectForLifecycle(proj)}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-xs cursor-pointer truncate"
                            title="查看該案從開案到結案生命週期圖"
                          >
                            <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded text-[11px] border border-blue-200">
                              {proj.projectCode}
                            </span>
                            <span className="truncate">{proj.region}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {proj.department || '二部'}
                          </span>
                          {proj.section && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                              {proj.section}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="p-1.5 text-center text-[11px] text-slate-500 border-r border-slate-200 font-mono">
                      {proj.startWorkDate ? proj.startWorkDate.substring(0, 7) : '-'}
                    </td>
                    <td className="p-1.5 text-center text-[11px] text-slate-500 border-r border-slate-200 font-mono">
                      {proj.licenseFDate ? proj.licenseFDate.substring(0, 7) : '-'}
                    </td>

                    {/* Quarters Cells */}
                    {row.quarters.map((qItem) => {
                      const badge = getStageBadgeStyle(qItem.stageName, qItem.isActive);
                      const isSelectedQ = qItem.quarter === selectedQuarter;

                      return (
                        <td
                          key={qItem.quarter}
                          className={`p-1 text-center border-r border-slate-100 transition-colors ${
                            isSelectedQ ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {qItem.isActive || qItem.stageName.includes('案前') ? (
                            <div
                              onClick={() => onSelectProjectForLifecycle(proj)}
                              className={`py-1 px-0.5 rounded border text-[10px] font-medium transition-all hover:scale-105 cursor-pointer shadow-2xs ${badge.bg} ${badge.text} ${badge.border}`}
                              title={`${proj.projectCode} 在 ${qItem.quarter}: ${qItem.stageName} (需求 ${
                                selectedRole !== '全部職類' ? `${selectedRole} ${qItem.roleValue}` : qItem.total
                              } 人)`}
                            >
                              <div className="font-bold">
                                {selectedRole !== '全部職類' ? qItem.roleValue : qItem.total}人
                              </div>
                              <div className="text-[9px] opacity-80 truncate">{badge.label}</div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-300 py-2">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
