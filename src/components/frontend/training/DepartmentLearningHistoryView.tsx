import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
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
  Users,
  Building2,
  ChevronRight,
  Eye,
  UserCheck,
  Layers,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CourseEnrollment } from '../../../types';
import { CertificateModal } from './CertificateModal';
import { PersonalLearningHistoryView } from './PersonalLearningHistoryView';

const CATEGORY_COLORS: Record<string, string> = {
  '專業技術': '#3b82f6',
  '工安品質': '#10b981',
  '數位建築': '#8b5cf6',
  '核心職能': '#f59e0b',
  '管理領導': '#ec4899',
  '其他類別': '#64748b',
};

const CHART_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const DepartmentLearningHistoryView: React.FC = () => {
  const {
    employees,
    courseEnrollments,
    internalCourses,
    employeeLicenses,
    annualTrainingRequirements,
    currentUser,
  } = useApp();

  // Selected Department Filter
  const [selectedDept, setSelectedDept] = useState<string>('工程一部');

  // Drilldown to specific employee
  const [drilldownEmpNo, setDrilldownEmpNo] = useState<string | null>(null);

  // Time filters
  const [timeMode, setTimeMode] = useState<'all_years' | 'by_year' | 'custom_range'>('all_years');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals
  const [selectedCertEnrollment, setSelectedCertEnrollment] = useState<CourseEnrollment | null>(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<any | null>(null);

  // Department options from employee list
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Team employees in selected department
  const deptEmployees = useMemo(() => {
    if (selectedDept === 'ALL') return employees;
    return employees.filter((e) => e.department === selectedDept);
  }, [employees, selectedDept]);

  const deptEmpNos = useMemo(() => new Set(deptEmployees.map((e) => e.empNo)), [deptEmployees]);

  // Completed enrollments for department members
  const deptCompletedEnrollments = useMemo(() => {
    return courseEnrollments.filter(
      (e) =>
        deptEmpNos.has(e.empNo) &&
        (e.status === 'completed' || e.finalPassStatus === 'passed' || e.completedAt)
    );
  }, [courseEnrollments, deptEmpNos]);

  // Filtered department records
  const filteredRecords = useMemo(() => {
    return deptCompletedEnrollments.filter((record) => {
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

      // Course category match
      const course = internalCourses.find((c) => c.id === record.courseId);
      const cat = record.trainingCategory || course?.categoryName || '專業技術';

      if (selectedCategory !== 'all' && cat !== selectedCategory) {
        return false;
      }

      // Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const inEmp = (record.empName || '').toLowerCase().includes(q) || (record.empNo || '').toLowerCase().includes(q);
        const inCourse = (record.courseTitle || record.courseName || '').toLowerCase().includes(q);
        const inCert = (record.certificateCode || record.certificateNumber || '').toLowerCase().includes(q);
        const inCat = cat.toLowerCase().includes(q);
        if (!inEmp && !inCourse && !inCert && !inCat) return false;
      }

      return true;
    });
  }, [deptCompletedEnrollments, timeMode, selectedYear, startDate, endDate, selectedCategory, searchKeyword, internalCourses]);

  // Aggregate Stats
  const totalDeptHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      const course = internalCourses.find((c) => c.id === r.courseId);
      return sum + (course?.totalHours || 8);
    }, 0);
  }, [filteredRecords, internalCourses]);

  const avgHoursPerEmp = useMemo(() => {
    if (deptEmployees.length === 0) return 0;
    return Math.round((totalDeptHours / deptEmployees.length) * 10) / 10;
  }, [totalDeptHours, deptEmployees]);

  const totalDeptCertificates = useMemo(() => {
    return filteredRecords.filter((r) => r.certificateCode || r.certificateNumber || r.finalPassStatus === 'passed').length;
  }, [filteredRecords]);

  // Department Annual Requirement
  const deptRequirement = useMemo(() => {
    const yr = timeMode === 'by_year' ? selectedYear : 2026;
    const match = annualTrainingRequirements.find(
      (r) =>
        r.year === yr &&
        r.status === 'active' &&
        (r.targetDepartments.includes('ALL') || r.targetDepartments.includes(selectedDept))
    );
    return match || annualTrainingRequirements[0];
  }, [annualTrainingRequirements, timeMode, selectedYear, selectedDept]);

  // Annual Trend Data for Department
  const deptAnnualTrendData = useMemo(() => {
    const years = [2024, 2025, 2026];
    return years.map((yr) => {
      const recordsForYr = deptCompletedEnrollments.filter((r) => {
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

      // Licenses for department
      const licensesForYr = employeeLicenses.filter(
        (l) => deptEmpNos.has(l.empNo) && (l.issueDate || '').startsWith(`${yr}`)
      ).length;

      return {
        year: `${yr}年`,
        yearNum: yr,
        必修時數: mandatoryHrs,
        選修時數: electiveHrs,
        總訓練時數: mandatoryHrs + electiveHrs,
        證照與結業證書: certCount + licensesForYr,
      };
    });
  }, [deptCompletedEnrollments, internalCourses, employeeLicenses, deptEmpNos]);

  // Monthly Trend Data for Department
  const deptMonthlyTrendData = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const targetYr = timeMode === 'by_year' ? selectedYear : 2026;

    return months.map((m) => {
      const prefix = `${targetYr}-${m}`;
      const records = deptCompletedEnrollments.filter((r) => {
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

      const licensesInMonth = employeeLicenses.filter(
        (l) => deptEmpNos.has(l.empNo) && (l.issueDate || '').startsWith(prefix)
      ).length;

      return {
        month: `${parseInt(m, 10)}月`,
        必修時數: mandatoryHrs,
        選修時數: electiveHrs,
        總訓練時數: mandatoryHrs + electiveHrs,
        證照與結業證書: certCount + licensesInMonth,
      };
    });
  }, [deptCompletedEnrollments, internalCourses, employeeLicenses, deptEmpNos, timeMode, selectedYear]);

  // Member Hours Ranking Chart Data
  const memberRankingData = useMemo(() => {
    return deptEmployees.map((emp) => {
      const records = filteredRecords.filter((r) => r.empNo === emp.empNo);
      const hours = records.reduce((sum, r) => {
        const c = internalCourses.find((course) => course.id === r.courseId);
        return sum + (c?.totalHours || 8);
      }, 0);
      const certs = records.filter((r) => r.certificateCode || r.certificateNumber || r.finalPassStatus === 'passed').length;

      return {
        empNo: emp.empNo,
        name: emp.name,
        rank: emp.rank || '06',
        title: emp.title || '工程師',
        已完訓時數: hours,
        證照張數: certs,
        達標規定時數: deptRequirement?.totalRequiredHours || 24,
      };
    }).sort((a, b) => b.已完訓時數 - a.已完訓時數);
  }, [deptEmployees, filteredRecords, internalCourses, deptRequirement]);

  // Category Pie Data for Department
  const categoryPieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const c = internalCourses.find((course) => course.id === r.courseId);
      const cat = r.trainingCategory || c?.categoryName || '專業技術';
      const hrs = c?.totalHours || 8;
      map[cat] = (map[cat] || 0) + hrs;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredRecords, internalCourses]);

  // Export Department CSV
  const handleExportDeptCSV = () => {
    const headers = ['同仁工號', '同仁姓名', '部門', '完訓日期', '課程名稱', '課程類別', '梯次', '授課模式', '時數', '成績', '證書字號'];
    const rows = filteredRecords.map((r) => {
      const course = internalCourses.find((c) => c.id === r.courseId);
      return [
        r.empNo,
        `"${r.empName || ''}"`,
        r.department || selectedDept,
        r.completedAt || r.passedAt || r.enrolledAt,
        `"${r.courseTitle || r.courseName || ''}"`,
        r.trainingCategory || course?.categoryName || '專業技術',
        `"${r.batchNo || r.batchName || ''}"`,
        r.deliveryType === 'online' ? '線上' : r.deliveryType === 'blended' ? '混成' : '實體',
        course?.totalHours || 8,
        r.examScore || 90,
        r.certificateCode || r.certificateNumber || '-',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedDept}_部門訓練歷程報表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If drilling down into specific employee, render their full interactive visual view with back button!
  if (drilldownEmpNo) {
    const member = employees.find((e) => e.empNo === drilldownEmpNo);
    return (
      <div className="space-y-6">
        {/* Back to Department Overview Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrilldownEmpNo(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              返回 {selectedDept} 整體學習趨勢
            </button>
            <span className="text-slate-300">|</span>
            <div className="text-xs font-black text-slate-800 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                同仁個人穿透檢視
              </span>
              <span>{member?.name} ({member?.empNo})</span>
              <span className="text-slate-400 font-normal">{member?.department} {member?.title}</span>
            </div>
          </div>

          {/* Switch to another member dropdown */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>切換同仁：</span>
            <select
              value={drilldownEmpNo}
              onChange={(e) => setDrilldownEmpNo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 py-1 pl-2 pr-6 cursor-pointer"
            >
              {deptEmployees.map((emp) => (
                <option key={emp.empNo} value={emp.empNo}>
                  {emp.name} ({emp.empNo} - {emp.title})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Render the Personal Learning History for this employee */}
        <PersonalLearningHistoryView empNo={drilldownEmpNo} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                主管培育與部門訓練歷程視覺化
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {selectedDept === 'ALL' ? '全公司各單位' : selectedDept} 訓練時數與證照獲取趨勢
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              即時掌握團隊同仁訓練時數累積、必修完訓達成率與證照獲取軌跡，支援個別同仁穿透檢視與詳細歷程調閱。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportDeptCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all"
            >
              <Download className="w-4 h-4" />
              匯出部門歷程報表
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-200/80">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>檢視部門：</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent border-0 font-black text-indigo-700 text-xs py-0 pl-1 pr-6 cursor-pointer"
            >
              <option value="ALL">全部部門總覽</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Time Mode Toggle */}
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

          {/* Year Picker */}
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

          {/* Custom Date Range */}
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
            placeholder="搜尋同仁姓名、工號或課程..."
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
            <span className="text-xs font-bold">部門完訓總時數</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalDeptHours} <span className="text-xs font-bold text-slate-500">小時</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">部門全體同仁完訓累積工時</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">部門人均訓練時數</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {avgHoursPerEmp} <span className="text-xs font-bold text-slate-500">小時/人</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            轄下在職人員共 {deptEmployees.length} 人
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">部門證照與結業證書</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalDeptCertificates} <span className="text-xs font-bold text-slate-500">張</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">包含內部結訓與法定證照</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">部門年度達標預估</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {deptRequirement
              ? `${Math.min(100, Math.round((avgHoursPerEmp / (deptRequirement.totalRequiredHours || 24)) * 100))}%`
              : '92%'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">對應年度訓練規定門檻</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                {selectedDept} - {timeMode === 'all_years' ? '歷年訓練時數與證照獲取趨勢圖' : `${selectedYear} 年度各月趨勢`}
              </h3>
              <p className="text-[11px] text-slate-400">
                直條圖為部門必修與選修累積時數 (左軸 hr)，折線圖為部門獲證總量 (右軸 張)
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={(timeMode === 'all_years' ? deptAnnualTrendData : deptMonthlyTrendData) as any}
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

        {/* Competency Distribution Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              部門職能培訓領域分佈
            </h3>
            <p className="text-[11px] text-slate-400">部門同仁累積時數之專業屬性比重</p>
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

      {/* Team Member Drilldown Quick Cards / Ranking */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              轄下同仁完訓進度與個別穿透視覺化
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              點擊任一同仁卡片，即可切換進入其個人專屬學習歷程視覺化圖表與證書細部清單
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            共 {deptEmployees.length} 位同仁
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {memberRankingData.map((m) => {
            const pct = Math.min(100, Math.round((m.已完訓時數 / m.達標規定時數) * 100));
            return (
              <div
                key={m.empNo}
                onClick={() => setDrilldownEmpNo(m.empNo)}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md bg-white hover:bg-indigo-50/20 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm">
                      {m.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        {m.name}
                        <span className="text-[10px] text-slate-400 font-normal">({m.empNo})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.rank} 職等 | {m.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-600">{m.已完訓時數} hr</span>
                    <span className="text-[10px] text-slate-400 block">/ {m.達標規定時數} hr</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">年度完訓達標率</span>
                    <span className={`font-bold ${pct >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    獲證 {m.證照張數} 張
                  </span>
                  <span className="text-indigo-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    穿透個別圖表 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Team Training Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-indigo-600" />
              部門同仁詳細訓練歷程記錄
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              共查得 {filteredRecords.length} 筆完訓考核記錄
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-y border-slate-200/80">
              <tr>
                <th className="py-3 px-4">完訓日期</th>
                <th className="py-3 px-4">同仁姓名 / 工號</th>
                <th className="py-3 px-4">職等 / 職稱</th>
                <th className="py-3 px-4">課程名稱與梯次</th>
                <th className="py-3 px-4">職能類別</th>
                <th className="py-3 px-4 text-center">時數</th>
                <th className="py-3 px-4 text-center">成績</th>
                <th className="py-3 px-4">證書字號</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    目前無符合條件之部門學習記錄
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{record.empName}</div>
                        <div className="text-[10px] text-slate-400">{record.empNo}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {record.rank ? `${record.rank}職等` : ''} {record.title}
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
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 whitespace-nowrap">
                        {hrs} hr
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-emerald-600">{record.examScore || 92}分</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {certCode ? (
                          <span className="font-bold text-indigo-700">{certCode}</span>
                        ) : (
                          <span className="text-slate-400">完訓合格</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrilldownEmpNo(record.empNo);
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            穿透圖表
                          </button>
                          {certCode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCertEnrollment(record);
                              }}
                              className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px]"
                            >
                              證書
                            </button>
                          )}
                        </div>
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
                <h3 className="text-sm font-bold">同仁訓練歷程詳細考核成果</h3>
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
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                    {selectedDetailRecord.cat}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {selectedDetailRecord.empName} ({selectedDetailRecord.empNo})
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-800">
                  {selectedDetailRecord.courseTitle || selectedDetailRecord.courseName}
                </h4>
                <p className="text-xs text-slate-500">
                  梯次：{selectedDetailRecord.batchNo || selectedDetailRecord.batchName}
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
                  <span className="text-slate-400 text-[11px]">結訓評核成績</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedDetailRecord.examScore || 92} 分 (合格)</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px]">證書字號</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedDetailRecord.certCode || 'FG-CERT-2026-REG'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    const emp = selectedDetailRecord.empNo;
                    setSelectedDetailRecord(null);
                    setDrilldownEmpNo(emp);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  穿透查看此同仁完整歷程
                </button>
                {selectedDetailRecord.certCode && (
                  <button
                    onClick={() => {
                      const rec = selectedDetailRecord;
                      setSelectedDetailRecord(null);
                      setSelectedCertEnrollment(rec);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileBadge className="w-4 h-4" />
                    查看電子證書
                  </button>
                )}
              </div>
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
