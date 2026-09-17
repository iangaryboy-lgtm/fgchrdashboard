import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  PieChart,
  RefreshCw,
  FileCheck,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../../context/AppContext';
import {
  EmployeeLicense,
  SiteLicenseRequirement,
  MasterLicenseDefinition,
  LicenseCategory,
} from '../../../types';

export const LicenseReportExportTab: React.FC = () => {
  const {
    employees,
    employeeLicenses,
    siteLicenseRequirements,
    masterLicenses,
  } = useApp();

  // Active sub-view in reports
  const [subView, setSubView] = useState<'department' | 'project' | 'license_catalog' | 'expiry_details'>('department');

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedExpiryWindow, setSelectedExpiryWindow] = useState<'ALL' | 'EXPIRED' | '30DAYS' | '60DAYS' | '90DAYS' | 'VALID'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Departments List
  const departmentsList = useMemo(() => {
    const fromEmps = employees.map((e) => e.department).filter(Boolean);
    const fromLics = employeeLicenses.map((l) => l.department).filter(Boolean);
    return Array.from(new Set([...fromEmps, ...fromLics])).sort();
  }, [employees, employeeLicenses]);

  // Categories List
  const categoriesList: LicenseCategory[] = [
    '品質管理',
    '職業安全衛生',
    '營造工程技術',
    '專業技師/建築師',
    '特種設備操作',
    '急救與防災',
    '綠建築/BIM',
    '其它專業',
  ];

  // Current Date for calculations
  const today = new Date();

  // Helper to calculate days remaining
  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 9999;
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Overall Company Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalEmps = employees.filter((e) => e.status !== '離職').length || 1;
    const totalLicenses = employeeLicenses.length;
    
    const uniqueLicensedEmps = new Set(
      employeeLicenses.filter((l) => l.status === 'valid' || l.status === 'expiring_soon').map((l) => l.empNo)
    ).size;

    const overallHoldRate = Math.round((uniqueLicensedEmps / totalEmps) * 100);
    const avgLicensesPerEmp = (totalLicenses / totalEmps).toFixed(1);

    const validCount = employeeLicenses.filter((l) => l.status === 'valid').length;
    
    // Count expiring soon within 90 days
    const expiring90DaysCount = employeeLicenses.filter((l) => {
      if (l.status === 'expired') return false;
      const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
      return days >= 0 && days <= 90;
    }).length;

    // Expired
    const expiredCount = employeeLicenses.filter((l) => {
      if (l.status === 'expired') return true;
      const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
      return days < 0;
    }).length;

    // Site compliance rate
    const totalReqCount = siteLicenseRequirements.reduce((sum, r) => sum + r.requiredCount, 0) || 1;
    const totalCurrentCount = siteLicenseRequirements.reduce((sum, r) => sum + Math.min(r.currentCount, r.requiredCount), 0);
    const siteComplianceRate = Math.round((totalCurrentCount / totalReqCount) * 100);

    const siteShortageCount = siteLicenseRequirements.filter((r) => r.currentCount < r.requiredCount).length;

    return {
      totalEmps,
      totalLicenses,
      uniqueLicensedEmps,
      overallHoldRate,
      avgLicensesPerEmp,
      validCount,
      expiring90DaysCount,
      expiredCount,
      siteComplianceRate,
      siteShortageCount,
    };
  }, [employees, employeeLicenses, siteLicenseRequirements]);

  // 2. Department Statistics Aggregation
  const departmentStats = useMemo(() => {
    return departmentsList.map((dept) => {
      const deptEmps = employees.filter((e) => e.department === dept && e.status !== '離職');
      const deptHeadcount = deptEmps.length;
      const deptEmpNos = new Set(deptEmps.map((e) => e.empNo));

      // Licenses held by members of this department
      const deptLicenses = employeeLicenses.filter(
        (l) => l.department === dept || deptEmpNos.has(l.empNo)
      );

      const uniqueLicensedEmps = new Set(
        deptLicenses.filter((l) => l.status === 'valid' || l.status === 'expiring_soon').map((l) => l.empNo)
      ).size;

      const holdRate = deptHeadcount > 0 ? Math.round((uniqueLicensedEmps / deptHeadcount) * 100) : 0;
      const avgLicenses = deptHeadcount > 0 ? (deptLicenses.length / deptHeadcount).toFixed(1) : '0';

      const validCount = deptLicenses.filter((l) => l.status === 'valid').length;
      
      const expiring90Count = deptLicenses.filter((l) => {
        if (l.status === 'expired') return false;
        const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return days >= 0 && days <= 90;
      }).length;

      const expiredCount = deptLicenses.filter((l) => {
        if (l.status === 'expired') return true;
        const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return days < 0;
      }).length;

      // Key categories count
      const qcCount = deptLicenses.filter((l) => l.licenseCategory === '品質管理').length;
      const oshCount = deptLicenses.filter((l) => l.licenseCategory === '職業安全衛生').length;
      const techCount = deptLicenses.filter((l) => l.licenseCategory === '營造工程技術').length;
      const peCount = deptLicenses.filter((l) => l.licenseCategory === '專業技師/建築師').length;

      // Health evaluation
      let statusRating: '優良合規' | '良好' | '需預警強化' = '優良合規';
      if (expiredCount > 0 || expiring90Count >= 2 || holdRate < 50) {
        statusRating = '需預警強化';
      } else if (expiring90Count > 0 || holdRate < 75) {
        statusRating = '良好';
      }

      return {
        department: dept,
        headcount: deptHeadcount,
        licensedHeadcount: uniqueLicensedEmps,
        holdRate,
        totalLicenses: deptLicenses.length,
        avgLicenses,
        validCount,
        expiring90Count,
        expiredCount,
        qcCount,
        oshCount,
        techCount,
        peCount,
        statusRating,
      };
    });
  }, [departmentsList, employees, employeeLicenses]);

  // 3. Project / Site Statistics Aggregation
  const projectSiteStats = useMemo(() => {
    // Unique sites from siteLicenseRequirements + employee sections that represent sites
    const sites = Array.from(new Set(siteLicenseRequirements.map((r) => r.siteName)));

    return sites.map((siteName) => {
      const reqs = siteLicenseRequirements.filter((r) => r.siteName === siteName);
      const managingDept = reqs[0]?.department || '工務部';

      const totalRequired = reqs.reduce((sum, r) => sum + r.requiredCount, 0);
      const totalCurrent = reqs.reduce((sum, r) => sum + r.currentCount, 0);
      const metRate = totalRequired > 0 ? Math.round((Math.min(totalCurrent, totalRequired) / totalRequired) * 100) : 100;

      // Get assigned employees
      const assignedEmpNos = Array.from(new Set(reqs.flatMap((r) => r.assignedEmpNos || [])));
      const onSiteStaffCount = assignedEmpNos.length;

      // Check expiring licenses among assigned employees
      const siteLicenses = employeeLicenses.filter((l) => assignedEmpNos.includes(l.empNo));
      const expiring90Count = siteLicenses.filter((l) => {
        if (l.status === 'expired') return false;
        const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return days >= 0 && days <= 90;
      }).length;

      const expiredCount = siteLicenses.filter((l) => {
        if (l.status === 'expired') return true;
        const days = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return days < 0;
      }).length;

      // Shortages breakdown
      const shortages = reqs
        .filter((r) => r.currentCount < r.requiredCount)
        .map((r) => `${r.licenseName} (缺 ${r.requiredCount - r.currentCount} 人)`);

      const isShortage = shortages.length > 0;
      const statusLabel = isShortage
        ? '法定缺額待補'
        : expiring90Count > 0
        ? '需安排在職回訓'
        : '法定配置合規';

      return {
        siteName,
        managingDept,
        onSiteStaffCount,
        totalRequired,
        totalCurrent,
        metRate,
        shortageCount: shortages.length,
        shortageDetails: shortages.join('； ') || '無缺額 (配置充足)',
        expiring90Count,
        expiredCount,
        statusLabel,
        requirements: reqs,
      };
    });
  }, [siteLicenseRequirements, employeeLicenses]);

  // 4. Master License Catalog Statistics Aggregation
  const licenseCatalogStats = useMemo(() => {
    const totalEmpsCount = employees.filter((e) => e.status !== '離職').length || 1;

    return masterLicenses.map((mLic) => {
      const matchedLicenses = employeeLicenses.filter(
        (l) => l.licenseName.trim().toLowerCase() === mLic.name.trim().toLowerCase() || l.licenseCategory === mLic.category && l.licenseName.includes(mLic.name.slice(0, 4))
      );

      const totalHolders = matchedLicenses.length;
      const holderRate = Math.round((totalHolders / totalEmpsCount) * 100);

      const validCount = matchedLicenses.filter((l) => l.status === 'valid').length;

      const expiring30 = matchedLicenses.filter((l) => {
        const d = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return d >= 0 && d <= 30;
      }).length;

      const expiring60 = matchedLicenses.filter((l) => {
        const d = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return d > 30 && d <= 60;
      }).length;

      const expiring90 = matchedLicenses.filter((l) => {
        const d = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return d > 60 && d <= 90;
      }).length;

      const expiredCount = matchedLicenses.filter((l) => {
        if (l.status === 'expired') return true;
        const d = getDaysRemaining(l.expiryDate || l.renewalDeadlineDate);
        return d < 0;
      }).length;

      return {
        id: mLic.id,
        code: mLic.code,
        name: mLic.name,
        category: mLic.category,
        issuingAuthority: mLic.issuingAuthority,
        validityYears: mLic.validityYears || '永久有效',
        renewalRequired: mLic.renewalRequired ? `每 ${mLic.renewalIntervalYears || 3} 年 / ${mLic.renewalHours || 6} 小時` : '免回訓',
        totalHolders,
        holderRate,
        validCount,
        expiring30,
        expiring60,
        expiring90,
        totalExpiring90: expiring30 + expiring60 + expiring90,
        expiredCount,
      };
    });
  }, [masterLicenses, employeeLicenses, employees]);

  // 5. Expiry & Renewal Details List
  const expiryAuditList = useMemo(() => {
    return employeeLicenses.map((lic) => {
      const days = getDaysRemaining(lic.expiryDate || lic.renewalDeadlineDate);
      
      let windowStatus: 'EXPIRED' | '30DAYS' | '60DAYS' | '90DAYS' | 'VALID' = 'VALID';
      let statusLabel = '效期正常';
      let urgencyLevel: 'high' | 'medium' | 'normal' = 'normal';

      if (days < 0 || lic.status === 'expired') {
        windowStatus = 'EXPIRED';
        statusLabel = `已過期 (${Math.abs(days)} 天)`;
        urgencyLevel = 'high';
      } else if (days <= 30) {
        windowStatus = '30DAYS';
        statusLabel = `30天內到期 (剩 ${days} 天)`;
        urgencyLevel = 'high';
      } else if (days <= 60) {
        windowStatus = '60DAYS';
        statusLabel = `60天內到期 (剩 ${days} 天)`;
        urgencyLevel = 'medium';
      } else if (days <= 90) {
        windowStatus = '90DAYS';
        statusLabel = `90天內到期 (剩 ${days} 天)`;
        urgencyLevel = 'medium';
      }

      const emp = employees.find((e) => e.empNo === lic.empNo);
      const masterLic = masterLicenses.find((m) => m.name === lic.licenseName);

      return {
        ...lic,
        empSection: emp?.section || '-',
        daysRemaining: days,
        windowStatus,
        statusLabel,
        urgencyLevel,
        renewalRule: masterLic?.renewalRequired
          ? `每${masterLic.renewalIntervalYears || 3}年回訓${masterLic.renewalHours || 6}hr`
          : lic.renewalRequired
          ? `每${lic.renewalIntervalYears || 3}年定期回訓`
          : '永久有效免回訓',
      };
    });
  }, [employeeLicenses, employees, masterLicenses]);

  // Filtered Expiry Audit List
  const filteredExpiryList = useMemo(() => {
    return expiryAuditList.filter((item) => {
      const matchDept = selectedDeptFilter === 'ALL' || item.department === selectedDeptFilter;
      const matchCat = selectedCategoryFilter === 'ALL' || item.licenseCategory === selectedCategoryFilter;
      
      let matchWindow = true;
      if (selectedExpiryWindow === 'EXPIRED') matchWindow = item.windowStatus === 'EXPIRED';
      else if (selectedExpiryWindow === '30DAYS') matchWindow = item.windowStatus === '30DAYS' || item.windowStatus === 'EXPIRED';
      else if (selectedExpiryWindow === '60DAYS') matchWindow = item.windowStatus === '30DAYS' || item.windowStatus === '60DAYS' || item.windowStatus === 'EXPIRED';
      else if (selectedExpiryWindow === '90DAYS') matchWindow = item.windowStatus !== 'VALID';
      else if (selectedExpiryWindow === 'VALID') matchWindow = item.windowStatus === 'VALID';

      const matchSearch =
        item.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.licenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase());

      return matchDept && matchCat && matchWindow && matchSearch;
    });
  }, [expiryAuditList, selectedDeptFilter, selectedCategoryFilter, selectedExpiryWindow, searchTerm]);

  // ================= EXCEL EXPORT FUNCTIONS =================

  // 1. Export Comprehensive Multi-Sheet Excel Report
  const handleExportFullExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary KPI Sheet
      const summaryData = [
        { 指標名稱: '全公司在職員工人數', 數值: `${summaryMetrics.totalEmps} 人`, 說明: '扣除離職人員之目前編制總人數' },
        { 指標名稱: '全公司登錄納管證照總數', 數值: `${summaryMetrics.totalLicenses} 張`, 說明: '涵蓋各類工程、品管、安衛、技術士證照' },
        { 指標名稱: '持有合格證照人數', 數值: `${summaryMetrics.uniqueLicensedEmps} 人`, 說明: '至少持有一張有效/合規證照之同仁數' },
        { 指標名稱: '全公司平均證照持有率', 數值: `${summaryMetrics.overallHoldRate}%`, 說明: '持證人數佔總編制人數百分比' },
        { 指標名稱: '人均持證數量', 數值: `${summaryMetrics.avgLicensesPerEmp} 張/人`, 說明: '證照總數 / 總在職人數' },
        { 指標名稱: '有效合格證照數', 數值: `${summaryMetrics.validCount} 張`, 說明: '效期正常且合規之證照' },
        { 指標名稱: '90天內即將到期 / 需回訓數', 數值: `${summaryMetrics.expiring90DaysCount} 張`, 說明: '應於90天內完成在職講習或換證作業' },
        { 指標名稱: '已逾期失效證照數', 數值: `${summaryMetrics.expiredCount} 張`, 說明: '已過有效期限需立即安排複訓補件' },
        { 指標名稱: '專案工地法定配置達標率', 數值: `${summaryMetrics.siteComplianceRate}%`, 說明: '各案場法規要求證照實際派駐達標比例' },
        { 指標名稱: '存在法定缺額之案場數', 數值: `${summaryMetrics.siteShortageCount} 個案場`, 說明: '需啟動智慧篩選推薦派訓支援' },
        { 指標名稱: '報表匯出產製時間', 數值: new Date().toLocaleString('zh-TW'), 說明: '遠雄營造 履歷與證照管理雲' },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, '全公司總覽KPI');

      // Sheet 2: Department Statistics Sheet
      const deptData = departmentStats.map((d) => ({
        部門名稱: d.department,
        在職人數: d.headcount,
        持證人數: d.licensedHeadcount,
        證照持有率: `${d.holdRate}%`,
        總證照張數: d.totalLicenses,
        人均持證數: d.avgLicenses,
        有效合格數: d.validCount,
        '90天內到期(需回訓)': d.expiring90Count,
        已過期數: d.expiredCount,
        品管類證照數: d.qcCount,
        職安衛類證照數: d.oshCount,
        營造技術類證照數: d.techCount,
        技師建築師證照數: d.peCount,
        合規評等: d.statusRating,
      }));
      const wsDept = XLSX.utils.json_to_sheet(deptData);
      wsDept['!cols'] = [
        { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDept, '各部門持證率與到期統計');

      // Sheet 3: Project / Site Compliance Sheet
      const siteData = projectSiteStats.map((s) => ({
        專案案場名稱: s.siteName,
        管理部室: s.managingDept,
        現場進駐人數: s.onSiteStaffCount,
        法定需求總額: s.totalRequired,
        實際持有配置: s.totalCurrent,
        配置達成率: `${s.metRate}%`,
        缺額項數: s.shortageCount,
        缺額證照明細與警示: s.shortageDetails,
        '90天內即將到期人員數': s.expiring90Count,
        已過期人員數: s.expiredCount,
        案場合規狀態: s.statusLabel,
      }));
      const wsSite = XLSX.utils.json_to_sheet(siteData);
      wsSite['!cols'] = [
        { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 16 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSite, '專案案場配置與缺額統計');

      // Sheet 4: Master License Catalog Distribution Sheet
      const licData = licenseCatalogStats.map((l) => ({
        證照代碼: l.code,
        標準證照名稱: l.name,
        證照類別: l.category,
        發證機關: l.issuingAuthority,
        有效年限: l.validityYears,
        法定回訓規定: l.renewalRequired,
        全公司持有總人數: l.totalHolders,
        '佔比(覆蓋率)': `${l.holderRate}%`,
        有效合格數: l.validCount,
        '30天內到期': l.expiring30,
        '60天內到期': l.expiring60,
        '90天內到期': l.expiring90,
        '90天內到期總計': l.totalExpiring90,
        已逾期失效數: l.expiredCount,
      }));
      const wsLic = XLSX.utils.json_to_sheet(licData);
      wsLic['!cols'] = [
        { wch: 14 }, { wch: 35 }, { wch: 16 }, { wch: 28 }, { wch: 12 },
        { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, wsLic, '證照項目分佈與效期統計');

      // Sheet 5: Expiry & Renewal Warning Detail Sheet
      const expiryDetailData = expiryAuditList.map((e) => ({
        員工編號: e.empNo,
        同仁姓名: e.empName,
        所屬部門: e.department,
        所屬案場科組: e.empSection,
        現任職稱: e.title,
        證照類別: e.licenseCategory,
        證照名稱: e.licenseName,
        證書字號: e.licenseNo,
        發證機關: e.issuingAuthority,
        取得日期: e.issueDate || '-',
        有效到期日: e.expiryDate || '-',
        下次回訓期限: e.renewalDeadlineDate || '-',
        剩餘天數: e.daysRemaining === 9999 ? '永久' : `${e.daysRemaining} 天`,
        效期預警狀態: e.statusLabel,
        回訓規定: e.renewalRule,
      }));
      const wsExpiry = XLSX.utils.json_to_sheet(expiryDetailData);
      wsExpiry['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 12 },
        { wch: 16 }, { wch: 32 }, { wch: 22 }, { wch: 25 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 24 }
      ];
      XLSX.utils.book_append_sheet(wb, wsExpiry, '到期與回訓人員總明細');

      // Write file
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      XLSX.writeFile(wb, `遠雄營造_全公司證照持有率與到期統計完整報表_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Current Filtered Expiry Warning List
  const handleExportFilteredExpiryList = () => {
    const exportData = filteredExpiryList.map((e) => ({
      員工編號: e.empNo,
      同仁姓名: e.empName,
      所屬部門: e.department,
      所屬案場科組: e.empSection,
      職稱: e.title,
      證照類別: e.licenseCategory,
      證照名稱: e.licenseName,
      證書字號: e.licenseNo,
      有效到期日: e.expiryDate || '-',
      下次回訓期限: e.renewalDeadlineDate || '-',
      剩餘天數: e.daysRemaining === 9999 ? '永久' : `${e.daysRemaining} 天`,
      狀態說明: e.statusLabel,
      回訓規定與時數: e.renewalRule,
      審核狀態: e.status === 'valid' ? '有效合格' : e.status === 'pending_review' ? '待審核' : '待回訓',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '證照到期回訓清冊');
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    XLSX.writeFile(wb, `證照到期與回訓清冊_${selectedDeptFilter}_${dateStr}.xlsx`);
  };

  // 3. Export Department Summary Only
  const handleExportDepartmentOnly = () => {
    const deptData = departmentStats.map((d) => ({
      部門名稱: d.department,
      在職人數: d.headcount,
      持證人數: d.licensedHeadcount,
      證照持有率: `${d.holdRate}%`,
      總證照張數: d.totalLicenses,
      人均持證數: d.avgLicenses,
      有效合格數: d.validCount,
      '90天內到期(需回訓)': d.expiring90Count,
      已過期數: d.expiredCount,
      品管類證照數: d.qcCount,
      職安衛類證照數: d.oshCount,
      營造技術類證照數: d.techCount,
      技師建築師證照數: d.peCount,
      合規評等: d.statusRating,
    }));
    const ws = XLSX.utils.json_to_sheet(deptData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '部門證照統計');
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    XLSX.writeFile(wb, `各部門證照持有率與到期統計_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Export Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xs border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-black flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              HR 統計與報表匯出中心
            </span>
            <span className="text-xs text-slate-400">支援多工作表全格式 Excel (.xlsx)</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            全公司各部門與專案證照持有率 · 到期回訓統計報表
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            提供 HR 與高階主管即時掌握全公司各部門在職持證覆蓋率、各建案案場法定配置合規性、90 天內即將到期回訓預警名冊，並支援一鍵匯出多維度 Excel 分析報表。
          </p>
        </div>

        {/* Primary Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportFullExcel}
            disabled={isExporting}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            title="匯出包含總覽KPI、各部門統計、專案案場配置、證照項目分佈、到期人員名冊的5大工作表完整Excel"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>📊 匯出全方位完整 Excel 報表 (5大工作表)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">全公司持證率</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600">
            {summaryMetrics.overallHoldRate}%
          </p>
          <p className="text-[10px] text-slate-400">
            {summaryMetrics.uniqueLicensedEmps} / {summaryMetrics.totalEmps} 人有證照
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">納管證照總量</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900">
            {summaryMetrics.totalLicenses} <span className="text-xs font-normal text-slate-500">張</span>
          </p>
          <p className="text-[10px] text-slate-400">
            人均持證 {summaryMetrics.avgLicensesPerEmp} 張
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold">有效合規證照</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {summaryMetrics.validCount} <span className="text-xs font-normal text-emerald-600">張</span>
          </p>
          <p className="text-[10px] text-emerald-600/80 font-medium">
            效期正常無虞
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">90天內即將到期</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">
            {summaryMetrics.expiring90DaysCount} <span className="text-xs font-normal text-amber-600">張</span>
          </p>
          <p className="text-[10px] text-amber-600/80 font-medium">
            應安排回訓講習
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">已逾期失效證照</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700">
            {summaryMetrics.expiredCount} <span className="text-xs font-normal text-rose-600">張</span>
          </p>
          <p className="text-[10px] text-rose-600/80 font-medium">
            需立即補件/複訓
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-bold">專案案場配置率</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-900">
            {summaryMetrics.siteComplianceRate}%
          </p>
          <p className="text-[10px] text-purple-700 font-medium">
            {summaryMetrics.siteShortageCount > 0 ? `${summaryMetrics.siteShortageCount} 案場有缺額` : '全案場配置達標'}
          </p>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubView('department')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              subView === 'department'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            1. 各部門證照持有率與到期概況 ({departmentStats.length})
          </button>

          <button
            onClick={() => setSubView('project')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              subView === 'project'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            2. 各專案案場配置與缺額統計 ({projectSiteStats.length})
          </button>

          <button
            onClick={() => setSubView('license_catalog')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              subView === 'license_catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            3. 各證照項目分佈統計 ({licenseCatalogStats.length})
          </button>

          <button
            onClick={() => setSubView('expiry_details')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              subView === 'expiry_details'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-xs'
                : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            4. 到期與過期人員明細清單 ({filteredExpiryList.length})
          </button>
        </div>

        {/* View-Specific Quick Action */}
        <div className="flex items-center gap-2">
          {subView === 'department' && (
            <button
              onClick={handleExportDepartmentOnly}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              匯出部門統計 Excel
            </button>
          )}

          {subView === 'expiry_details' && (
            <button
              onClick={handleExportFilteredExpiryList}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              匯出目前篩選之回訓名單 Excel ({filteredExpiryList.length} 筆)
            </button>
          )}
        </div>
      </div>

      {/* ================= SUB-VIEW 1: DEPARTMENT STATISTICS ================= */}
      {subView === 'department' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">各部室單位在職人員證照涵蓋率與效期分析表</span>
            </div>
            <div className="text-xs text-slate-500">
              共統計 <strong className="text-slate-900">{departmentStats.length}</strong> 個部室處組單位
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">部室單位名稱</th>
                    <th className="px-3 py-3.5 text-center">在職人數</th>
                    <th className="px-3 py-3.5 text-center">持證人數</th>
                    <th className="px-4 py-3.5">證照覆蓋率</th>
                    <th className="px-3 py-3.5 text-center">總持證數</th>
                    <th className="px-3 py-3.5 text-center">人均張數</th>
                    <th className="px-3 py-3.5 text-center">有效合格</th>
                    <th className="px-3 py-3.5 text-center">90天內到期</th>
                    <th className="px-3 py-3.5 text-center">已過期</th>
                    <th className="px-4 py-3.5">關鍵證照分佈 (品管/安衛/營造)</th>
                    <th className="px-4 py-3.5 text-center">合規評等</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentStats.map((d) => (
                    <tr key={d.department} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {d.department}
                      </td>
                      <td className="px-3 py-3.5 text-center font-medium text-slate-700">{d.headcount} 人</td>
                      <td className="px-3 py-3.5 text-center font-bold text-blue-700">{d.licensedHeadcount} 人</td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className={d.holdRate >= 80 ? 'text-emerald-700' : d.holdRate >= 50 ? 'text-blue-700' : 'text-amber-700'}>
                              {d.holdRate}%
                            </span>
                            <span className="text-slate-400 font-normal">{d.licensedHeadcount}/{d.headcount}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                d.holdRate >= 80 ? 'bg-emerald-500' : d.holdRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${d.holdRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900">{d.totalLicenses} 張</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-600">{d.avgLicenses}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[11px]">
                          {d.validCount}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {d.expiring90Count > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-black text-[11px] animate-pulse">
                            {d.expiring90Count}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {d.expiredCount > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-black text-[11px]">
                            {d.expiredCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold" title="品質管理類">
                            品管 {d.qcCount}
                          </span>
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold" title="職業安全衛生類">
                            安衛 {d.oshCount}
                          </span>
                          <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold" title="營造技術/技師類">
                            營造/技師 {d.techCount + d.peCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                            d.statusRating === '優良合規'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.statusRating === '良好'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.statusRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-VIEW 2: PROJECT / SITE COMPLIANCE ================= */}
      {subView === 'project' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">各專案案場法定證照配置目標達成與缺額總覽</span>
            </div>
            <div className="text-xs text-slate-500">
              共列管 <strong className="text-slate-900">{projectSiteStats.length}</strong> 個主要建案工地案場
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectSiteStats.map((site) => (
              <div
                key={site.siteName}
                className={`bg-white p-5 rounded-3xl border shadow-xs space-y-3 transition-all ${
                  site.shortageCount > 0
                    ? 'border-rose-300 bg-rose-50/10 ring-1 ring-rose-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                        {site.managingDept}
                      </span>
                      <span className="text-xs text-slate-500">進駐 {site.onSiteStaffCount} 人</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{site.siteName}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${
                      site.shortageCount > 0
                        ? 'bg-rose-100 text-rose-800'
                        : site.expiring90Count > 0
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {site.statusLabel}
                  </span>
                </div>

                {/* Metric Progress */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">法定證照配置率：</span>
                    <span className={`font-black ${site.metRate >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {site.totalCurrent} / {site.totalRequired} 項 ({site.metRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${site.metRate >= 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(site.metRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Requirements Breakdown List */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">各項法定證照配置明細：</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {site.requirements.map((req) => {
                      const isMet = req.currentCount >= req.requiredCount;
                      return (
                        <div
                          key={req.id}
                          className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${
                            isMet
                              ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isMet ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="font-medium truncate">{req.licenseName}</span>
                          </div>
                          <span className="font-bold shrink-0">
                            {req.currentCount} / {req.requiredCount} 名
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Bottom Warning */}
                {(site.expiring90Count > 0 || site.expiredCount > 0) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      現場持證人員中：<strong>{site.expiring90Count} 人 90 天內需回訓</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SUB-VIEW 3: MASTER LICENSE CATALOG ================= */}
      {subView === 'license_catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">標準證照規格庫持有人數分佈與效期總表</span>
            </div>
            <div className="text-xs text-slate-500">
              全公司共納管 <strong className="text-slate-900">{licenseCatalogStats.length}</strong> 項標準證照項目
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">證照代碼 / 項目名稱</th>
                    <th className="px-3 py-3.5">專業類別</th>
                    <th className="px-3 py-3.5">發證主管機關</th>
                    <th className="px-3 py-3.5">法定回訓規範</th>
                    <th className="px-3 py-3.5 text-center">全公司持有人數</th>
                    <th className="px-3 py-3.5 text-center">員工覆蓋率</th>
                    <th className="px-3 py-3.5 text-center">有效合格</th>
                    <th className="px-3 py-3.5 text-center">30天到期</th>
                    <th className="px-3 py-3.5 text-center">60天到期</th>
                    <th className="px-3 py-3.5 text-center">90天到期</th>
                    <th className="px-3 py-3.5 text-center">已過期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenseCatalogStats.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{lic.name}</div>
                        <span className="text-[10px] font-mono text-slate-400">{lic.code}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                          {lic.category}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 text-[11px]">{lic.issuingAuthority}</td>
                      <td className="px-3 py-3.5 text-slate-600 text-[11px]">{lic.renewalRequired}</td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900">{lic.totalHolders} 人</td>
                      <td className="px-3 py-3.5 text-center font-bold text-indigo-600">{lic.holderRate}%</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[11px]">
                          {lic.validCount}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {lic.expiring30 > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-black text-[11px] animate-pulse">
                            {lic.expiring30}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {lic.expiring60 > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[11px]">
                            {lic.expiring60}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {lic.expiring90 > 0 ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[11px]">
                            {lic.expiring90}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {lic.expiredCount > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-black text-[11px]">
                            {lic.expiredCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-VIEW 4: EXPIRY DETAILS AUDIT ================= */}
      {subView === 'expiry_details' && (
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋同仁姓名、工號、部門或證照名稱..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">全部部門</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">全部證照類別</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Expiry Window Filter */}
              <select
                value={selectedExpiryWindow}
                onChange={(e) => setSelectedExpiryWindow(e.target.value as any)}
                className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-black text-amber-900 focus:outline-hidden"
              >
                <option value="ALL">全部效期範圍</option>
                <option value="90DAYS">⚠️ 90天內到期 + 已過期 (需回訓)</option>
                <option value="60DAYS">🔔 60天內到期 + 已過期</option>
                <option value="30DAYS">🚨 30天內緊急到期 + 已過期</option>
                <option value="EXPIRED">❌ 僅已過期失效名冊</option>
                <option value="VALID">✅ 僅效期正常名冊</option>
              </select>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">同仁基本資料</th>
                    <th className="px-3 py-3.5">所屬部門 / 案場</th>
                    <th className="px-4 py-3.5">證照名稱與字號</th>
                    <th className="px-3 py-3.5">證照類別</th>
                    <th className="px-3 py-3.5">有效到期日</th>
                    <th className="px-3 py-3.5">下次回訓期限</th>
                    <th className="px-3 py-3.5 text-center">剩餘天數</th>
                    <th className="px-3 py-3.5">效期預警狀態</th>
                    <th className="px-4 py-3.5">回訓規範說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpiryList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        符合目前篩選條件之到期或需回訓資料為空
                      </td>
                    </tr>
                  ) : (
                    filteredExpiryList.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          item.windowStatus === 'EXPIRED'
                            ? 'bg-rose-50/30'
                            : item.windowStatus === '30DAYS'
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{item.empName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{item.empNo} · {item.title}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="font-medium text-slate-800">{item.department}</div>
                          <span className="text-[10px] text-slate-400">{item.empSection}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{item.licenseName}</div>
                          <span className="text-[10px] font-mono text-slate-500">{item.licenseNo}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                            {item.licenseCategory}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-slate-700">{item.expiryDate || '永久有效'}</td>
                        <td className="px-3 py-3.5 font-mono text-indigo-700">{item.renewalDeadlineDate || '-'}</td>
                        <td className="px-3 py-3.5 text-center">
                          {item.daysRemaining === 9999 ? (
                            <span className="text-slate-400">永久</span>
                          ) : item.daysRemaining < 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[10px]">
                              逾期 {Math.abs(item.daysRemaining)} 天
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                item.daysRemaining <= 30
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.daysRemaining <= 60
                                  ? 'bg-amber-100 text-amber-900'
                                  : item.daysRemaining <= 90
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              剩 {item.daysRemaining} 天
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.windowStatus === 'EXPIRED'
                                ? 'bg-rose-600 text-white'
                                : item.windowStatus === '30DAYS'
                                ? 'bg-rose-100 text-rose-800'
                                : item.windowStatus === '60DAYS'
                                ? 'bg-amber-100 text-amber-900'
                                : item.windowStatus === '90DAYS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px] max-w-[200px] truncate" title={item.renewalRule}>
                          {item.renewalRule}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
