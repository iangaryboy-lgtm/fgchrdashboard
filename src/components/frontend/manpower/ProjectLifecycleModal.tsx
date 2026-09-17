import React from 'react';
import {
  X,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Shield,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProjectPlan, ManpowerFormulaConfig } from '../../../types';
import {
  calculateProjectLifecycle,
  calculateProjectMilestones,
} from '../../../utils/manpowerCalculator';

interface ProjectLifecycleModalProps {
  project: ProjectPlan | null;
  isOpen: boolean;
  onClose: () => void;
  config: ManpowerFormulaConfig;
  delayMonths: number;
}

export const ProjectLifecycleModal: React.FC<ProjectLifecycleModalProps> = ({
  project,
  isOpen,
  onClose,
  config,
  delayMonths,
}) => {
  if (!isOpen || !project) return null;

  const milestones = calculateProjectMilestones(project, config, delayMonths);
  const lifecycleData = calculateProjectLifecycle(project, config, delayMonths);

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return '-';
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                  {project.projectCode}
                </span>
                <span className="text-xs text-blue-300 font-medium">
                  {project.department || '二部'} / {project.section || '工務一科'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {project.region} - 單案 24 季人力配置生命週期分析
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Project Specifications Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div>
              <span className="text-slate-400">建物規模:</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                地上 {project.abovegroundFloors}F / 地下 {project.undergroundFloors}F
              </div>
            </div>
            <div>
              <span className="text-slate-400">總樓地板面積:</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {project.totalFloorArea ? `${project.totalFloorArea.toLocaleString()} ㎡` : '未載明'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">戶數 / 棟數:</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {project.unitsCount || '-'} 戶 / {project.buildingsCount || 1} 棟
              </div>
            </div>
            <div>
              <span className="text-slate-400">特殊工程屬性:</span>
              <div className="font-medium text-slate-700 mt-0.5 flex items-center gap-1 flex-wrap">
                {project.jointOrUrbanRenewal && project.jointOrUrbanRenewal !== '無' && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                    {project.jointOrUrbanRenewal}
                  </span>
                )}
                {project.hazardAssessment && project.hazardAssessment !== '無' && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">
                    危評
                  </span>
                )}
                {project.specialMethod && project.specialMethod !== '無' && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">
                    {project.specialMethod}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Milestones Flow */}
          {milestones && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>工程節點排程推估 (含 What-If 延遲 {delayMonths} 個月)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
                  <div className="font-semibold text-cyan-800">案前啟動</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.preWorkDate)}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="font-semibold text-blue-800">開工動土</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.startDate)}</div>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="font-semibold text-indigo-800">1FL 出地面</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.fl1Date)}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="font-semibold text-blue-800">6FL 結構加速</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.fl6Date)}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="font-semibold text-amber-800">使照日 F</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.licenseFDate)}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="font-semibold text-emerald-800">交屋完成</div>
                  <div className="font-mono text-slate-600 mt-1">{formatDate(milestones.handoverDate)}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                  <div className="font-semibold text-slate-700">F+365 結案</div>
                  <div className="font-mono text-slate-500 mt-1">{formatDate(milestones.f365Date)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 24-Quarter Lifecycle Role Stack Area Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>24 季生命週期各職類需求曲線 (Lifecycle Staffing Curve)</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                階梯式人力配置：案前 → 主體結構高峰 → 裝修使照 → 交屋保固
              </span>
            </h4>

            <div className="h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lifecycleData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={1}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="人" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = lifecycleData.find((d) => d.quarter === label);
                      if (!item) return null;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-xl border border-slate-700">
                          <div className="font-bold text-sm text-blue-300 mb-1">
                            {label} - {item.stageName}
                          </div>
                          <div className="space-y-0.5">
                            <div>案主管: <b>{item.manager}</b> 人</div>
                            <div>建築土建: <b>{item.civil}</b> 人</div>
                            <div>機電工程: <b>{item.mep}</b> 人</div>
                            <div>職安管理: <b>{item.safety}</b> 人</div>
                            <div>外業營管: <b>{item.admin}</b> 人</div>
                            <div className="pt-1 mt-1 border-t border-slate-700 font-bold text-white">
                              合計需求: {item.total} 人
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="manager"
                    name="案主管"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                  />
                  <Area
                    type="monotone"
                    dataKey="civil"
                    name="建築土建"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                  />
                  <Area
                    type="monotone"
                    dataKey="mep"
                    name="機電工程"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                  />
                  <Area
                    type="monotone"
                    dataKey="safety"
                    name="職安管理"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                  />
                  <Area
                    type="monotone"
                    dataKey="admin"
                    name="外業營管"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
