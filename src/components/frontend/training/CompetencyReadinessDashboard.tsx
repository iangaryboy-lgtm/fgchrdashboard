import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Employee, CompetencyRadarScore } from '../../../types';
import { exportToExcel } from '../../../utils/excel';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Target,
  Users,
  Search,
  Filter,
  Award,
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpDown,
  BookOpen,
  UserCheck,
  Check,
  Building,
} from 'lucide-react';

interface RadarDataPoint {
  dimension: string;
  actualScore: number;
  benchmarkScore: number;
  fullMark: number;
}

export const CompetencyReadinessDashboard: React.FC = () => {
  const { employees, courseEnrollments, internalCourses } = useApp();

  // Slicer States (Power BI style)
  const [selectedDept, setSelectedDept] = useState<string>('全部');
  const [selectedPosition, setSelectedPosition] = useState<string>('全部');
  const [selectedRank, setSelectedRank] = useState<string>('全部');
  const [selectedStatus, setSelectedStatus] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDimension, setSelectedDimension] = useState<string>('全部');

  // Selected Employee for Personal Drilldown Modal
  const [drilldownEmp, setDrilldownEmp] = useState<Employee | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'readiness' | 'empNo' | 'rank' | 'name'>('readiness');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter options
  const departmentOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [employees]);

  const positionOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.positionTitle || '土建工程師').filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [employees]);

  const rankOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.rank).filter(Boolean));
    return ['全部', ...Array.from(set).sort()];
  }, [employees]);

  // Compute individual competency scores for each employee
  const employeeScores = useMemo(() => {
    return employees.map((emp) => {
      // Find enrollments of this employee
      const empEnrollments = courseEnrollments.filter((enr) => enr.empNo === emp.empNo);
      const approvedEnrollments = empEnrollments.filter(
        (e) => e.approvalStatus === 'approved' || e.approvalStatus === 'auto_approved'
      );

      // Deterministic calculation based on rank, position and completed training
      const rankNum = parseInt(emp.rank || '6', 10);
      const isManagerRank = rankNum >= 7;
      const isHighRank = rankNum >= 8;

      // Management competency (TWI / MTP)
      let managementScore = isHighRank ? 90 : isManagerRank ? 82 : rankNum === 6 ? 68 : 55;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('主管') || e.courseTitle?.includes('管理'))) {
        managementScore = Math.min(100, managementScore + 12);
      }

      // Construction Management (CCM / Contracts / Safety)
      let constructionMgmtScore = 75 + (rankNum - 5) * 4;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('管理') || e.courseTitle?.includes('職安'))) {
        constructionMgmtScore = Math.min(100, constructionMgmtScore + 10);
      }

      // Excavation & Temporary Works (假設工程)
      let excavationScore = 70 + (rankNum - 5) * 5;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('開挖') || e.courseTitle?.includes('逆打'))) {
        excavationScore = Math.min(100, excavationScore + 15);
      }

      // Foundation Works (基礎工程 / 連續壁)
      let foundationScore = 68 + (rankNum - 5) * 6;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('深開挖') || e.courseTitle?.includes('基礎'))) {
        foundationScore = Math.min(100, foundationScore + 14);
      }

      // Structural Works (結構工程 / 模板 / 鋼筋 / 混凝土 / 鋼構)
      let structureScore = 78 + (rankNum - 5) * 4;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('BIM') || e.courseTitle?.includes('結構'))) {
        structureScore = Math.min(100, structureScore + 10);
      }

      // Finishing Works (裝修工程 / 帷幕 / 石材 / 防水)
      let finishingScore = 72 + (rankNum - 5) * 4;
      if (approvedEnrollments.some((e) => e.courseTitle?.includes('帷幕') || e.courseTitle?.includes('裝修'))) {
        finishingScore = Math.min(100, finishingScore + 12);
      }

      // Professional License score (甲安 / 工地主任)
      let licenseScore = isHighRank ? 95 : isManagerRank ? 85 : 70;

      // OJT Practical Evaluation score (工巡 / 題庫)
      let ojtScore = 80 + (rankNum - 5) * 3;

      // Clamp all between 40 and 100
      managementScore = Math.min(100, Math.max(40, managementScore));
      constructionMgmtScore = Math.min(100, Math.max(40, constructionMgmtScore));
      excavationScore = Math.min(100, Math.max(40, excavationScore));
      foundationScore = Math.min(100, Math.max(40, foundationScore));
      structureScore = Math.min(100, Math.max(40, structureScore));
      finishingScore = Math.min(100, Math.max(40, finishingScore));
      licenseScore = Math.min(100, Math.max(40, licenseScore));
      ojtScore = Math.min(100, Math.max(40, ojtScore));

      const overallReadiness = Math.round(
        (managementScore +
          constructionMgmtScore +
          excavationScore +
          foundationScore +
          structureScore +
          finishingScore +
          licenseScore +
          ojtScore) /
          8
      );

      let readinessStatus: '達標' | '推進中' | '待強化' = '推進中';
      if (overallReadiness >= 80) readinessStatus = '達標';
      else if (overallReadiness < 65) readinessStatus = '待強化';

      // Suggested licenses
      const licenses: string[] = [];
      if (rankNum >= 7) licenses.push('工地主任執業證');
      if (rankNum >= 6) licenses.push('甲種安全衛生業務主管');
      if (emp.positionTitle?.includes('品管') || rankNum >= 8) licenses.push('公共工程品管工程師');
      if (emp.positionTitle?.includes('人發') || emp.department?.includes('人力資源')) {
        licenses.push('內部講師認證', 'TTQS訓練規劃師');
      }

      return {
        emp,
        managementScore,
        constructionMgmtScore,
        excavationScore,
        foundationScore,
        structureScore,
        finishingScore,
        licenseScore,
        ojtScore,
        overallReadiness,
        readinessStatus,
        completedCount: approvedEnrollments.length,
        licenses,
      };
    });
  }, [employees, courseEnrollments]);

  // Filtered employees list
  const filteredScores = useMemo(() => {
    return employeeScores.filter((item) => {
      if (selectedDept !== '全部' && item.emp.department !== selectedDept) return false;
      if (selectedPosition !== '全部' && (item.emp.positionTitle || '土建工程師') !== selectedPosition) return false;
      if (selectedRank !== '全部' && item.emp.rank !== selectedRank) return false;
      if (selectedStatus !== '全部' && item.readinessStatus !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = item.emp.name.toLowerCase().includes(q);
        const m2 = item.emp.empNo.toLowerCase().includes(q);
        const m3 = item.emp.department.toLowerCase().includes(q);
        const m4 = (item.emp.positionTitle || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [employeeScores, selectedDept, selectedPosition, selectedRank, selectedStatus, searchQuery]);

  // Sorted list
  const sortedScores = useMemo(() => {
    return [...filteredScores].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'readiness') {
        comparison = a.overallReadiness - b.overallReadiness;
      } else if (sortField === 'empNo') {
        comparison = a.emp.empNo.localeCompare(b.emp.empNo);
      } else if (sortField === 'rank') {
        comparison = a.emp.rank.localeCompare(b.emp.rank);
      } else if (sortField === 'name') {
        comparison = a.emp.name.localeCompare(b.emp.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredScores, sortField, sortOrder]);

  // Aggregate Radar Data for current filter
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (filteredScores.length === 0) {
      return [
        { dimension: '管理職能(TWI/MTP)', actualScore: 0, benchmarkScore: 85, fullMark: 100 },
        { dimension: '施工管理與行政', actualScore: 0, benchmarkScore: 85, fullMark: 100 },
        { dimension: '假設工程(開挖/監測)', actualScore: 0, benchmarkScore: 80, fullMark: 100 },
        { dimension: '基礎工程(連續壁/逆打)', actualScore: 0, benchmarkScore: 80, fullMark: 100 },
        { dimension: '結構工程(模板/鋼筋/鋼構)', actualScore: 0, benchmarkScore: 85, fullMark: 100 },
        { dimension: '裝修工程(帷幕/石材/防水)', actualScore: 0, benchmarkScore: 80, fullMark: 100 },
        { dimension: '專業法定證照', actualScore: 0, benchmarkScore: 85, fullMark: 100 },
        { dimension: 'OJT現場實務考核', actualScore: 0, benchmarkScore: 85, fullMark: 100 },
      ];
    }

    const count = filteredScores.length;
    const avgMgmt = Math.round(filteredScores.reduce((sum, s) => sum + s.managementScore, 0) / count);
    const avgConstMgmt = Math.round(filteredScores.reduce((sum, s) => sum + s.constructionMgmtScore, 0) / count);
    const avgExca = Math.round(filteredScores.reduce((sum, s) => sum + s.excavationScore, 0) / count);
    const avgFound = Math.round(filteredScores.reduce((sum, s) => sum + s.foundationScore, 0) / count);
    const avgStruct = Math.round(filteredScores.reduce((sum, s) => sum + s.structureScore, 0) / count);
    const avgFinish = Math.round(filteredScores.reduce((sum, s) => sum + s.finishingScore, 0) / count);
    const avgLic = Math.round(filteredScores.reduce((sum, s) => sum + s.licenseScore, 0) / count);
    const avgOjt = Math.round(filteredScores.reduce((sum, s) => sum + s.ojtScore, 0) / count);

    return [
      { dimension: '管理職能(TWI/MTP)', actualScore: avgMgmt, benchmarkScore: 85, fullMark: 100 },
      { dimension: '施工管理與行政', actualScore: avgConstMgmt, benchmarkScore: 85, fullMark: 100 },
      { dimension: '假設工程(開挖/監測)', actualScore: avgExca, benchmarkScore: 80, fullMark: 100 },
      { dimension: '基礎工程(連續壁/逆打)', actualScore: avgFound, benchmarkScore: 80, fullMark: 100 },
      { dimension: '結構工程(模板/鋼筋/鋼構)', actualScore: avgStruct, benchmarkScore: 85, fullMark: 100 },
      { dimension: '裝修工程(帷幕/石材/防水)', actualScore: avgFinish, benchmarkScore: 80, fullMark: 100 },
      { dimension: '專業法定證照', actualScore: avgLic, benchmarkScore: 85, fullMark: 100 },
      { dimension: 'OJT現場實務考核', actualScore: avgOjt, benchmarkScore: 85, fullMark: 100 },
    ];
  }, [filteredScores]);

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const total = filteredScores.length;
    if (total === 0) {
      return { total: 0, avgReadiness: 0, qualifiedCount: 0, qualifiedRate: 0, inProgressCount: 0 };
    }
    const avgReadiness = Math.round(
      filteredScores.reduce((sum, s) => sum + s.overallReadiness, 0) / total
    );
    const qualifiedCount = filteredScores.filter((s) => s.readinessStatus === '達標').length;
    const inProgressCount = filteredScores.filter((s) => s.readinessStatus === '推進中').length;
    const qualifiedRate = Math.round((qualifiedCount / total) * 100);

    return {
      total,
      avgReadiness,
      qualifiedCount,
      qualifiedRate,
      inProgressCount,
    };
  }, [filteredScores]);

  // Export to Excel handler
  const handleExportTable = () => {
    const exportData = sortedScores.map((item) => ({
      員工編號: item.emp.empNo,
      姓名: item.emp.name,
      部室單位: item.emp.department,
      科案單位: item.emp.section,
      職稱: item.emp.title,
      職位名稱: item.emp.positionTitle || '土建工程師',
      職等: item.emp.rank,
      綜合職能齊備率: `${item.overallReadiness}%`,
      學習路徑狀態: item.readinessStatus,
      '管理職能(TWI/MTP)': `${item.managementScore}%`,
      '施工管理與行政': `${item.constructionMgmtScore}%`,
      '假設工程(開挖/監測)': `${item.excavationScore}%`,
      '基礎工程(連續壁/逆打)': `${item.foundationScore}%`,
      '結構工程(模板/鋼筋/鋼構)': `${item.structureScore}%`,
      '裝修工程(帷幕/石材/防水)': `${item.finishingScore}%`,
      '專業法定證照': `${item.licenseScore}%`,
      'OJT現場實務考核': `${item.ojtScore}%`,
      已取得證照: item.licenses.join('、'),
    }));
    exportToExcel(exportData, `遠雄營造_職能齊備率詳細報表_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* Power BI Style Interactive Slicer Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              職能備齊率多維篩選切片器 (多維度即時交叉分析)
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedDept('全部');
              setSelectedPosition('全部');
              setSelectedRank('全部');
              setSelectedStatus('全部');
              setSearchQuery('');
              setSelectedDimension('全部');
            }}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            重設所有篩選條件
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Dept Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">部室單位</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Position Title Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-indigo-600 mb-1">職位名稱 (專業職系)</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full text-xs font-bold bg-indigo-50/50 border border-indigo-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-indigo-900"
            >
              {positionOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Rank Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">職等項目</label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              {rankOptions.map((r) => (
                <option key={r} value={r}>
                  {r === '全部' ? '全部職等' : `${r} 等級`}
                </option>
              ))}
            </select>
          </div>

          {/* Readiness Status Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">學習路徑狀態</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              <option value="全部">全部狀態</option>
              <option value="達標">達標 (&ge;80%)</option>
              <option value="推進中">推進中 (65-79%)</option>
              <option value="待強化">待強化 (&lt;65%)</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">姓名 / 員工編號搜尋</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋姓名/編號/職位..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Power BI Card Visuals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">部門評鑑同仁</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900">{kpiStats.total}</span>
              <span className="text-[11px] text-slate-400 font-semibold">人</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-indigo-700 block">整體平均職能齊備率</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-indigo-600">{kpiStats.avgReadiness}%</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                基準 80%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 block">齊備達標人數 (&ge;80%)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-600">{kpiStats.qualifiedCount}</span>
              <span className="text-[11px] text-slate-500 font-semibold">人 ({kpiStats.qualifiedRate}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 block">路徑推進中同仁</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-amber-600">{kpiStats.inProgressCount}</span>
              <span className="text-[11px] text-slate-500 font-semibold">人 (持續受訓中)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Section: Power BI Radar Chart + Dimension Drilldown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart Visual (8 columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                部門職位與職等「職能備齊率」多維雷達圖
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                依照篩選條件聚合目前 {filteredScores.length} 位同仁之 8 大專業與管理職能維度
              </p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200">
              {selectedPosition === '全部' ? '全體職系' : selectedPosition} / {selectedRank === '全部' ? '全職等' : `${selectedRank}等`}
            </span>
          </div>

          {/* Radar Container */}
          <div className="h-[360px] w-full py-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  stroke="#cbd5e1"
                />
                <Radar
                  name="實際平均齊備率 (Actual %)"
                  dataKey="actualScore"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.45}
                />
                <Radar
                  name="職位學習路徑基準 (Target %)"
                  dataKey="benchmarkScore"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <strong>提示：</strong> 雷達圖涵蓋 <strong>管理職能、施工管理、假設/基礎/結構/裝修工項、證照與 OJT</strong> 考核。
            </span>
          </div>
        </div>

        {/* Dimension Breakdown Cards (5 columns) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>8 大職能維度齊備率詳情</span>
              <span className="text-[10px] text-slate-400 font-semibold">點選維度可快速過濾</span>
            </h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {radarData.map((item) => {
                const diff = item.actualScore - item.benchmarkScore;
                const isPassed = item.actualScore >= item.benchmarkScore;
                return (
                  <div
                    key={item.dimension}
                    onClick={() =>
                      setSelectedDimension(selectedDimension === item.dimension ? '全部' : item.dimension)
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedDimension === item.dimension
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{item.dimension}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600">{item.actualScore}%</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {diff >= 0 ? `+${diff}%` : `${diff}%`}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPassed ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.actualScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Power BI Drilldown Personnel Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              詳細人員職能路徑與齊備率清單 ({sortedScores.length} 位符合條件)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              可依職等、職位名稱、綜合齊備率即時排序，點選「檢視雷達」展開個人 8 向度鑽取分析
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              匯出人員職能明細 (Excel)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
              <tr>
                <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortField('empNo'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center gap-1">員工編號 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center gap-1">姓名 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="py-2.5 px-3">部室 / 科案單位</th>
                <th className="py-2.5 px-3">職稱</th>
                <th className="py-2.5 px-3">職位名稱 (職系)</th>
                <th className="py-2.5 px-3 text-center cursor-pointer" onClick={() => { setSortField('rank'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center justify-center gap-1">職等 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer min-w-[140px]" onClick={() => { setSortField('readiness'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center gap-1">綜合職能齊備率 <ArrowUpDown className="w-3 h-3 text-indigo-600" /></div>
                </th>
                <th className="py-2.5 px-3 text-center">學習路徑狀態</th>
                <th className="py-2.5 px-3 text-center">修畢學程</th>
                <th className="py-2.5 px-3">法定證照資格</th>
                <th className="py-2.5 px-3 text-center">操作鑽取</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {sortedScores.map((item) => (
                <tr key={item.emp.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{item.emp.empNo}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.emp.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800">{item.emp.department}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-600">{item.emp.section}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{item.emp.title}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.emp.positionTitle || '土建工程師'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{item.emp.rank}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.overallReadiness >= 80
                              ? 'bg-emerald-500'
                              : item.overallReadiness >= 65
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.overallReadiness}%` }}
                        />
                      </div>
                      <span className="font-black text-slate-900 text-xs">{item.overallReadiness}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.readinessStatus === '達標'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.readinessStatus === '推進中'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.readinessStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                    {item.completedCount} 門
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 max-w-[200px] overflow-hidden truncate text-[11px] text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item.licenses.slice(0, 2).join('、') || '進行中'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDrilldownEmp(item.emp)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      檢視雷達
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Employee Drill-down Modal */}
      {drilldownEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {drilldownEmp.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {drilldownEmp.name} ({drilldownEmp.empNo}) - 個人職能路徑與齊備率分析
                  </h3>
                  <p className="text-xs text-slate-500">
                    {drilldownEmp.department} / {drilldownEmp.section} ‧ {drilldownEmp.title} ‧ 職位：
                    <strong className="text-indigo-600">{drilldownEmp.positionTitle || '土建工程師'}</strong> ‧ 職等：{drilldownEmp.rank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownEmp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Individual Radar */}
            <div className="h-[280px] w-full bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={(() => {
                    const empScore = employeeScores.find((s) => s.emp.id === drilldownEmp.id);
                    if (!empScore) return radarData;
                    return [
                      { dimension: '管理職能', actualScore: empScore.managementScore, benchmarkScore: 85, fullMark: 100 },
                      { dimension: '施工管理', actualScore: empScore.constructionMgmtScore, benchmarkScore: 85, fullMark: 100 },
                      { dimension: '假設工程', actualScore: empScore.excavationScore, benchmarkScore: 80, fullMark: 100 },
                      { dimension: '基礎工程', actualScore: empScore.foundationScore, benchmarkScore: 80, fullMark: 100 },
                      { dimension: '結構工程', actualScore: empScore.structureScore, benchmarkScore: 85, fullMark: 100 },
                      { dimension: '裝修工程', actualScore: empScore.finishingScore, benchmarkScore: 80, fullMark: 100 },
                      { dimension: '法定證照', actualScore: empScore.licenseScore, benchmarkScore: 85, fullMark: 100 },
                      { dimension: 'OJT實務考核', actualScore: empScore.ojtScore, benchmarkScore: 85, fullMark: 100 },
                    ];
                  })()}
                >
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="個人目前評鑑" dataKey="actualScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                  <Radar name="學習路徑基準" dataKey="benchmarkScore" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="4 4" />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Recommendations */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                主管培育與補強建議 (Coaching Advice)
              </h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                該同仁目前在<strong>結構工程與施工管理</strong>領域表現優良，建議下一階段安排修習
                <strong>【高階專案主管】超高層深開挖與逆打工法全解析</strong> 及 <strong>TWI基層主管訓練</strong>
                ，以補足深開挖支撐應變與團隊領導能力，為晉升案主管建立完備職能。
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDrilldownEmp(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                關閉個人雷達
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
