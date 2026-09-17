import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { Building2, Layers, ExternalLink, Sparkles, Briefcase, Filter } from 'lucide-react';
import { QuarterSummaryData } from '../../../types';

interface UnitConfigurationChartProps {
  currentQuarterData: QuarterSummaryData | null;
  selectedDept: string;
  onSelectDept: (dept: string) => void;
  selectedSection?: string;
  selectedRole?: string;
  onSelectRole?: (role: string) => void;
  onOpenRankPyramid: (dept: string) => void;
}

const DEPARTMENTS_LIST = ['二部', '三部', '五部', '六部', '七部'];
const ROLES_ORDER = ['案主管', '建築土建', '機電工程', '職安管理', '外業營管'];

const ROLE_COLORS: Record<string, string> = {
  案主管: '#3b82f6',
  建築土建: '#10b981',
  機電工程: '#f59e0b',
  職安管理: '#ec4899',
  外業營管: '#8b5cf6',
};

export const UnitConfigurationChart: React.FC<UnitConfigurationChartProps> = ({
  currentQuarterData,
  selectedDept,
  onSelectDept,
  selectedSection = '全部科案',
  selectedRole = '全部職類',
  onSelectRole,
  onOpenRankPyramid,
}) => {
  // Toggle between Role-first view (欄位為各職位) and Dept-first view (欄位為各部室)
  const [viewDimension, setViewDimension] = useState<'byRole' | 'byDept'>('byRole');

  // Filter project details according to currently selected Department & Section
  const filteredDetails = React.useMemo(() => {
    if (!currentQuarterData) return [];
    return currentQuarterData.projectDetails.filter((p) => {
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
      return true;
    });
  }, [currentQuarterData, selectedDept, selectedSection]);

  // 1. Data when X-axis = 各職位 (Requested: 欄位是各職位，所有長條圖上需要標註數值)
  const roleChartData = React.useMemo(() => {
    let manager = 0;
    let civil = 0;
    let mep = 0;
    let safety = 0;
    let admin = 0;

    filteredDetails.forEach((p) => {
      manager += p.calculated.manager;
      civil += p.calculated.civil;
      mep += p.calculated.mep;
      safety += p.calculated.safety;
      admin += p.calculated.admin;
    });

    const total = manager + civil + mep + safety + admin;

    return [
      {
        role: '案主管',
        roleKey: '案主管',
        value: Math.round(manager * 10) / 10,
        percent: total > 0 ? Math.round((manager / total) * 1000) / 10 : 0,
        color: ROLE_COLORS['案主管'],
      },
      {
        role: '建築土建',
        roleKey: '建築',
        value: Math.round(civil * 10) / 10,
        percent: total > 0 ? Math.round((civil / total) * 1000) / 10 : 0,
        color: ROLE_COLORS['建築土建'],
      },
      {
        role: '機電工程',
        roleKey: '機電',
        value: Math.round(mep * 10) / 10,
        percent: total > 0 ? Math.round((mep / total) * 1000) / 10 : 0,
        color: ROLE_COLORS['機電工程'],
      },
      {
        role: '職安管理',
        roleKey: '職安',
        value: Math.round(safety * 10) / 10,
        percent: total > 0 ? Math.round((safety / total) * 1000) / 10 : 0,
        color: ROLE_COLORS['職安管理'],
      },
      {
        role: '外業營管',
        roleKey: '營管',
        value: Math.round(admin * 10) / 10,
        percent: total > 0 ? Math.round((admin / total) * 1000) / 10 : 0,
        color: ROLE_COLORS['外業營管'],
      },
    ];
  }, [filteredDetails]);

  // 2. Data when X-axis = 各部室 (with total data label on top of stack)
  const departmentChartData = React.useMemo(() => {
    return DEPARTMENTS_LIST.map((dept) => {
      let manager = 0;
      let civil = 0;
      let mep = 0;
      let safety = 0;
      let admin = 0;
      let projectCount = 0;

      if (currentQuarterData) {
        currentQuarterData.projectDetails.forEach((p) => {
          if ((p.department || '二部') === dept) {
            manager += p.calculated.manager;
            civil += p.calculated.civil;
            mep += p.calculated.mep;
            safety += p.calculated.safety;
            admin += p.calculated.admin;
            if (p.isActive) {
              projectCount += 1;
            }
          }
        });
      }

      const total = manager + civil + mep + safety + admin;

      return {
        department: dept,
        manager: Math.round(manager * 10) / 10,
        civil: Math.round(civil * 10) / 10,
        mep: Math.round(mep * 10) / 10,
        safety: Math.round(safety * 10) / 10,
        admin: Math.round(admin * 10) / 10,
        total: Math.round(total * 10) / 10,
        projectCount,
      };
    });
  }, [currentQuarterData]);

  // Tooltip for Role-first view
  const RoleTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[180px]">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
          <span className="font-bold text-sm" style={{ color: item.color }}>
            {item.role}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            {item.percent}%
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-300">配置需求：</span>
            <span className="font-bold text-white font-mono text-sm">{item.value} 人</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>篩選單位：</span>
            <span>{selectedDept} {selectedSection !== '全部科案' ? `· ${selectedSection}` : ''}</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-blue-400 text-center font-medium pt-1.5 border-t border-slate-800">
          點擊此職位長條可進行全域跨圖表篩選
        </div>
      </div>
    );
  };

  // Tooltip for Dept-first view
  const DeptTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = departmentChartData.find((d) => d.department === label);
    if (!item) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[190px]">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
          <span className="font-bold text-sm text-blue-300">{label}</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            活躍案場: {item.projectCount} 案
          </span>
        </div>
        <div className="space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-blue-300">案主管:</span>
            <span className="font-semibold">{item.manager} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-300">建築土建:</span>
            <span className="font-semibold">{item.civil} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-300">機電工程:</span>
            <span className="font-semibold">{item.mep} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pink-300">職安管理:</span>
            <span className="font-semibold">{item.safety} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-300">外業營管:</span>
            <span className="font-semibold">{item.admin} 人</span>
          </div>
          <div className="pt-1.5 border-t border-slate-700 flex justify-between font-bold text-white text-sm">
            <span>總需求:</span>
            <span>{item.total} 人</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-blue-400 text-center font-medium">
          點擊可篩選全圖表，或使用上方按鈕鑽取職等結構
        </div>
      </div>
    );
  };

  const handleRoleBarClick = (roleName: string) => {
    if (!onSelectRole) return;
    const mapped = roleName === '建築土建' ? '建築' : roleName === '機電工程' ? '機電' : roleName === '職安管理' ? '職安' : roleName === '外業營管' ? '營管' : roleName;
    if (selectedRole === mapped) {
      onSelectRole('全部職類');
    } else {
      onSelectRole(mapped);
    }
  };

  const totalFilteredDemand = roleChartData.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div id="unit-configuration-card" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                VISUAL 02
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                單位人力配置與職能拆解 (Cross-Filtering)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Dimension Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setViewDimension('byRole')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewDimension === 'byRole'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="欄位以各職位展開"
              >
                各職位欄位
              </button>
              <button
                onClick={() => setViewDimension('byDept')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewDimension === 'byDept'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="欄位以部室展開"
              >
                部室單位欄位
              </button>
            </div>

            <button
              onClick={() => onOpenRankPyramid(selectedDept === '全部' || selectedDept === '全部單位' ? '全部單位' : selectedDept)}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="查看該單位 2-3職等/4職等/5-7職等 黃金比例鑽取分析"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">鑽取職等</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <p>
            {viewDimension === 'byRole' ? (
              <span>
                目前顯示：<b>{selectedDept}</b> {selectedSection !== '全部科案' ? `· ${selectedSection}` : ''} 各職能需求分佈（點擊柱體即時聯動篩選）
              </span>
            ) : (
              <span>
                各工務部室人力配置堆疊（點擊長條即時篩選特定部室）
              </span>
            )}
          </p>
          <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            合計: {Math.round(totalFilteredDemand * 10) / 10} 人
          </span>
        </div>

        {/* 1. Primary Requested View: 欄位是各職位，所有長條圖上標註數值 */}
        {viewDimension === 'byRole' ? (
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roleChartData}
                margin={{ top: 24, right: 10, left: -20, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activeLabel !== undefined && state.activeLabel !== null) {
                    handleRoleBarClick(String(state.activeLabel));
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="role"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit="人"
                />
                <Tooltip content={<RoleTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                >
                  {roleChartData.map((entry) => {
                    const isSelected =
                      selectedRole === entry.roleKey ||
                      (selectedRole === '全部職類' ? false : selectedRole === entry.role);
                    const isAnyRoleSelected = selectedRole !== '全部職類';
                    return (
                      <Cell
                        key={`cell-${entry.role}`}
                        fill={entry.color}
                        fillOpacity={isAnyRoleSelected ? (isSelected ? 1.0 : 0.35) : 0.9}
                        stroke={isSelected ? '#1e293b' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                  {/* Explicit Data Label on all bars */}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="#1e293b"
                    fontSize={11}
                    fontWeight={700}
                    formatter={(val: any) => (Number(val) > 0 ? `${val} 人` : '0 人')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* 2. Dept Dimension View: 欄位為各部室，所有長條圖上方標註數值 */
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentChartData}
                margin={{ top: 24, right: 10, left: -20, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    const clickedDept = String(state.activeLabel);
                    onSelectDept(selectedDept === clickedDept ? '全部單位' : clickedDept);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit="人"
                />
                <Tooltip content={<DeptTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '6px', fontSize: '11px' }}
                />

                <Bar dataKey="manager" name="案主管" stackId="unitStack" fill="#3b82f6" />
                <Bar dataKey="civil" name="建築土建" stackId="unitStack" fill="#10b981" />
                <Bar dataKey="mep" name="機電" stackId="unitStack" fill="#f59e0b" />
                <Bar dataKey="safety" name="職安" stackId="unitStack" fill="#ec4899" />
                <Bar dataKey="admin" name="營管" stackId="unitStack" fill="#8b5cf6">
                  {/* Label on top of the stack */}
                  <LabelList
                    dataKey="total"
                    position="top"
                    fill="#1e293b"
                    fontSize={11}
                    fontWeight={700}
                    formatter={(val: any) => (Number(val) > 0 ? `${val} 人` : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Select Buttons: Role & Department Fast Cross-Filter */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span>職位快速連動:</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {['全部職類', '案主管', '建築', '機電', '職安', '營管'].map((r) => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => onSelectRole && onSelectRole(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
