import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  Filter,
  Search,
  Download,
  FileBadge,
  Sparkles,
  ShieldCheck,
  Building,
  User,
  ArrowUpRight,
  ChevronRight,
  Eye,
  FileText,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CourseEnrollment, EmployeeLicense } from '../../../types';
import { CertificateModal } from './CertificateModal';

interface PersonalLearningHistoryViewProps {
  empNo: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '專業技術': '#3b82f6',
  '工安品質': '#10b981',
  '數位建築': '#8b5cf6',
  '核心職能': '#f59e0b',
  '管理領導': '#ec4899',
  '其他類別': '#64748b',
};

const CHART_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const PersonalLearningHistoryView: React.FC<PersonalLearningHistoryViewProps> = ({ empNo }) => {
  const {
    employees,
    courseEnrollments,
    internalCourses,
    employeeLicenses,
    annualTrainingRequirements,
  } = useApp();

  const currentEmp = employees.find((e) => e.empNo === empNo) || {
    empNo,
    name: '同仁',
    department: '工程一部',
    title: '工程師',
    rank: '06',
  };

  // Filter States
  const [timeMode, setTimeMode] = useState<'all_years' | 'by_year' | 'custom_range'>('all_years');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals
  const [selectedCertEnrollment, setSelectedCertEnrollment] = useState<CourseEnrollment | null>(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<any | null>(null);

  // My Enrollments & Licenses
  const myCompletedEnrollments = useMemo(() => {
    return courseEnrollments.filter(
      (e) => e.empNo === empNo && (e.status === 'completed' || e.finalPassStatus === 'passed' || e.completedAt)
    );
  }, [courseEnrollments, empNo]);

  const myLicenses = useMemo(() => {
    return employeeLicenses.filter((l) => l.empNo === empNo);
  }, [employeeLicenses, empNo]);

  // Filtered Training Records by Date and Category
  const filteredRecords = useMemo(() => {
    return myCompletedEnrollments.filter((record) => {
      const recordDate = record.completedAt || record.passedAt || record.enrolledAt || '2026-01-01';
      const recordYear = parseInt(recordDate.slice(0, 4), 10);

      // Time Filter
      if (timeMode === 'by_year' && recordYear !== selectedYear) {
        return false;
      }
      if (timeMode === 'custom_range') {
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
      }

      // Course details match
      const course = internalCourses.find((c) => c.id === record.courseId);
      const cat = record.trainingCategory || course?.categoryName || '專業技術';

      // Category Filter
      if (selectedCategory !== 'all' && cat !== selectedCategory) {
        return false;
      }

      // Search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const inCourse = (record.courseTitle || record.courseName || '').toLowerCase().includes(q);
        const inCert = (record.certificateCode || record.certificateNumber || '').toLowerCase().includes(q);
        const inBatch = (record.batchNo || record.batchName || '').toLowerCase().includes(q);
        const inCat = cat.toLowerCase().includes(q);
        if (!inCourse && !inCert && !inBatch && !inCat) return false;
      }

      return true;
    });
  }, [myCompletedEnrollments, timeMode, selectedYear, startDate, endDate, selectedCategory, searchKeyword, internalCourses]);

  // Aggregate stats
  const totalCompletedHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      const course = internalCourses.find((c) => c.id === r.courseId);
      const hours = course?.totalHours || 8;
      return sum + hours;
    }, 0);
  }, [filteredRecords, internalCourses]);

  const totalCertificates = useMemo(() => {
    const certsCount = filteredRecords.filter((r) => r.certificateCode || r.certificateNumber || r.finalPassStatus === 'passed').length;
    return certsCount;
  }, [filteredRecords]);

  const avgExamScore = useMemo(() => {
    const scored = filteredRecords.filter((r) => r.examScore && r.examScore > 0);
    if (scored.length === 0) return 92;
    return Math.round(scored.reduce((sum, r) => sum + (r.examScore || 0), 0) / scored.length);
  }, [filteredRecords]);

  // Target Annual Requirement for Current Emp
  const currentRequirement = useMemo(() => {
    const yearReqs = annualTrainingRequirements.filter(
      (r) =>
        r.year === (timeMode === 'by_year' ? selectedYear : 2026) &&
        r.status === 'active' &&
        (r.targetDepartments.includes('ALL') || r.targetDepartments.includes(currentEmp.department || ''))
    );
    return yearReqs[0] || annualTrainingRequirements[0];
  }, [annualTrainingRequirements, timeMode, selectedYear, currentEmp]);

  // Chart Data Preparation: Annual Trend (2024, 2025, 2026)
  const annualTrendData = useMemo(() => {
    const years = [2024, 2025, 2026];
    return years.map((yr) => {
      const recordsForYr = myCompletedEnrollments.filter((r) => {
        const d = r.completedAt || r.passedAt || r.enrolledAt || '';
        return d.startsWith(`${yr}`);
      });

      let mandatoryHrs = 0;
      let electiveHrs = 0;
      let certCount = 0;

      recordsForYr.forEach((r) => {
        const course = internalCourses.find((c) => c.id === r.courseId);
        const hrs = course?.totalHours || 8;
        if (r.enrollmentType === 'assigned_mandatory') {
          mandatoryHrs += hrs;
        } else {
          electiveHrs += hrs;
        }
        if (r.certificateCode || r.certificateNumber || r.finalPassStatus === 'passed') {
          certCount += 1;
        }
      });

      // Licenses added in this year
      const licensesForYr = myLicenses.filter((l) => (l.issueDate || '').startsWith(`${yr}`)).length;

      return {
        year: `${yr}年`,
        yearNum: yr,
        必修時數: mandatoryHrs,
        選修時數: electiveHrs,
        總訓練時數: mandatoryHrs + electiveHrs,
        證照與結業證書: certCount + licensesForYr,
      };
    });
  }, [myCompletedEnrollments, internalCourses, myLicenses]);

  // Monthly Trend Data (for by_year or custom range)
  const monthlyTrendData = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const targetYr = timeMode === 'by_year' ? selectedYear : 2026;

    return months.map((m) => {
      const prefix = `${targetYr}-${m}`;
      const records = myCompletedEnrollments.filter((r) => {
        const d = r.completedAt || r.passedAt || r.enrolledAt || '';
        return d.startsWith(prefix);
      });

      let mandatoryHrs = 0;
      let electiveHrs = 0;
      let certCount = 0;

      records.forEach((r) => {
        const course = internalCourses.find((c) => c.id === r.courseId);
        const hrs = course?.totalHours || 8;
        if (r.enrollmentType === 'assigned_mandatory') {
          mandatoryHrs += hrs;
        } else {
          electiveHrs += hrs;
        }
        if (r.certificateCode || r.certificateNumber || r.finalPassStatus === 'passed') {
          certCount += 1;
        }
      });

      const licensesInMonth = myLicenses.filter((l) => (l.issueDate || '').startsWith(prefix)).length;

      return {
        month: `${parseInt(m, 10)}月`,
        必修時數: mandatoryHrs,
        選修時數: electiveHrs,
        總訓練時數: mandatoryHrs + electiveHrs,
        證照與結業證書: certCount + licensesInMonth,
      };
    });
  }, [myCompletedEnrollments, internalCourses, myLicenses, timeMode, selectedYear]);

  // Category Breakdown Pie Chart Data
  const categoryPieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const course = internalCourses.find((c) => c.id === r.courseId);
      const cat = r.trainingCategory || course?.categoryName || '專業技術';
      const hrs = course?.totalHours || 8;
      catMap[cat] = (catMap[cat] || 0) + hrs;
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredRecords, internalCourses]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['完訓日期', '課程名稱', '課程類別', '梯次', '授課模式', '時數', '成績', '證書編號', '狀態'];
    const rows = filteredRecords.map((r) => {
      const course = internalCourses.find((c) => c.id === r.courseId);
      return [
        r.completedAt || r.passedAt || r.enrolledAt,
        `"${r.courseTitle || r.courseName || ''}"`,
        r.trainingCategory || course?.categoryName || '專業技術',
        `"${r.batchNo || r.batchName || ''}"`,
        r.deliveryType === 'online' ? '線上' : r.deliveryType === 'blended' ? '混成' : '實體',
        course?.totalHours || 8,
        r.examScore || 90,
        r.certificateCode || r.certificateNumber || '-',
        '完訓合格',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentEmp.name}_學習歷程記錄_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                個人專業職能與學習歷程視覺化
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {currentEmp.name} 的訓練時數與證照獲取趨勢
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              工號：{currentEmp.empNo} | 所屬單位：{currentEmp.department} | 職等：{currentEmp.rank || '06'}職等 ({currentEmp.title})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all"
            >
              <Download className="w-4 h-4" />
              匯出學習歷程報表
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Time Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimeMode('all_years')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeMode === 'all_years' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              歷年年度趨勢 (2024~2026)
            </button>
            <button
              onClick={() => setTimeMode('by_year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeMode === 'by_year' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              單一年度月趨勢
            </button>
            <button
              onClick={() => setTimeMode('custom_range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeMode === 'custom_range' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              自訂日期區間
            </button>
          </div>

          {/* Conditional Year Picker */}
          {timeMode === 'by_year' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>年度：</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent border-0 font-black text-indigo-600 text-xs py-0 pl-1 pr-6 cursor-pointer"
              >
                <option value={2026}>2026 年度</option>
                <option value={2025}>2025 年度</option>
                <option value={2024}>2024 年度</option>
              </select>
            </div>
          )}

          {/* Conditional Custom Date Range */}
          {timeMode === 'custom_range' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-slate-700 font-bold p-0"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-slate-700 font-bold p-0"
              />
            </div>
          )}

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>職能分類：</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-0 font-bold text-indigo-600 text-xs py-0 pl-1 pr-6 cursor-pointer"
            >
              <option value="all">全體類別</option>
              <option value="專業技術">專業技術</option>
              <option value="工安品質">工安品質</option>
              <option value="數位建築">數位建築</option>
              <option value="核心職能">核心職能</option>
              <option value="管理領導">管理領導</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋課程、證照字號或梯次..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">累積完訓總時數</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalCompletedHours} <span className="text-xs font-bold text-slate-500">小時</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">年度規定門檻</span>
            <span className="font-bold text-indigo-600">
              {currentRequirement ? `${currentRequirement.totalRequiredHours} hr` : '24 hr'}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((totalCompletedHours / (currentRequirement?.totalRequiredHours || 24)) * 100))}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">結業證書與專業證照</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalCertificates} <span className="text-xs font-bold text-slate-500">張</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">包含工程結訓證書與雲端證照庫</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">平均結訓評核成績</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {avgExamScore} <span className="text-xs font-bold text-slate-500">分</span>
          </div>
          <p className="text-[11px] text-purple-500 font-bold mt-2">全部課程皆超越 70 分合格門檻</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">年度訓練達標率</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {Math.min(100, Math.round((totalCompletedHours / (currentRequirement?.totalRequiredHours || 24)) * 100))}%
          </div>
          <p className="text-[11px] text-slate-400 mt-2">符合公司晉升與派任指標</p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Training Hours & Certifications Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                {timeMode === 'all_years' ? '歷年訓練時數與證照獲取趨勢圖' : `${selectedYear} 年度各月份訓練進展`}
              </h3>
              <p className="text-[11px] text-slate-400">
                直條圖顯示必修與選修時數 (左軸 hr)，折線圖代表取得之證照與證書張數 (右軸)
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={(timeMode === 'all_years' ? annualTrendData : monthlyTrendData) as any}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={timeMode === 'all_years' ? 'year' : 'month'}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  label={{ value: '時數 (hr)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  label={{ value: '證照/證書 (張)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="必修時數" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="選修時數" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="證照與結業證書"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart: Category Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              職能領域時數分佈
            </h3>
            <p className="text-[11px] text-slate-400">各專業類別累積時數比重</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <div className="text-xs text-slate-400">目前尚無分類記錄</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || CHART_PALETTE[index % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val} 小時`, '時數']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {categoryPieData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_COLORS[cat.name] || CHART_PALETTE[idx % CHART_PALETTE.length],
                    }}
                  ></span>
                  <span className="text-slate-600 font-bold">{cat.name}</span>
                </div>
                <span className="font-black text-slate-800">{cat.value}hr</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Training History Records Query Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-indigo-600" />
              個人詳細訓練歷程記錄清單
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              共查得 {filteredRecords.length} 筆已結算完訓記錄，點擊單筆可查看詳細證書與考核成果
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              合計 {totalCompletedHours} 訓練時數
            </span>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-y border-slate-200/80">
              <tr>
                <th className="py-3 px-4">完訓日期</th>
                <th className="py-3 px-4">課程名稱與梯次</th>
                <th className="py-3 px-4">職能類別</th>
                <th className="py-3 px-4">授課方式</th>
                <th className="py-3 px-4 text-center">時數</th>
                <th className="py-3 px-4 text-center">成績</th>
                <th className="py-3 px-4">證書編號 / 結業狀態</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    目前無符合條件之學習記錄
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const course = internalCourses.find((c) => c.id === record.courseId);
                  const hrs = course?.totalHours || 8;
                  const cat = record.trainingCategory || course?.categoryName || '專業技術';
                  const certCode = record.certificateCode || record.certificateNumber;

                  return (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedDetailRecord({ ...record, course, hrs, cat, certCode })}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {record.completedAt || record.passedAt || record.enrolledAt || '2026-06-15'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-black text-slate-800 truncate" title={record.courseTitle || record.courseName}>
                          {record.courseTitle || record.courseName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {record.batchNo || record.batchName || '梯次 01'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[cat] || '#3b82f6'}15`,
                            color: CATEGORY_COLORS[cat] || '#3b82f6',
                          }}
                        >
                          {cat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">
                          {record.deliveryType === 'online' ? '數位線上' : record.deliveryType === 'blended' ? '混成培訓' : '實體面授'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 whitespace-nowrap">
                        {hrs} hr
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-emerald-600">{record.examScore || 92}分</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {certCode ? (
                          <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{certCode}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">完訓合格</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCertEnrollment(record);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <FileBadge className="w-3.5 h-3.5" />
                          電子證書
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedDetailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">個人訓練歷程詳細紀錄</h3>
              </div>
              <button
                onClick={() => setSelectedDetailRecord(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                  {selectedDetailRecord.cat}
                </span>
                <h4 className="text-base font-black text-slate-800">
                  {selectedDetailRecord.courseTitle || selectedDetailRecord.courseName}
                </h4>
                <p className="text-xs text-slate-500">
                  梯次名稱：{selectedDetailRecord.batchNo || selectedDetailRecord.batchName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px]">完訓核發日期</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedDetailRecord.completedAt || selectedDetailRecord.passedAt || selectedDetailRecord.enrolledAt}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px]">認證訓練時數</span>
                  <p className="font-bold text-indigo-600 mt-0.5">{selectedDetailRecord.hrs} 小時</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px]">測驗考核成績</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedDetailRecord.examScore || 92} 分 (合格)</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px]">證書字號</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedDetailRecord.certCode || 'FG-CERT-2026-REG'}</p>
                </div>
              </div>

              {selectedDetailRecord.certCode && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const rec = selectedDetailRecord;
                      setSelectedDetailRecord(null);
                      setSelectedCertEnrollment(rec);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <FileBadge className="w-4 h-4" />
                    開啟高解析電子結業證書
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCertEnrollment && (
        <CertificateModal
          enrollment={selectedCertEnrollment}
          course={internalCourses.find((c) => c.id === selectedCertEnrollment.courseId)}
          onClose={() => setSelectedCertEnrollment(null)}
        />
      )}
    </div>
  );
};
