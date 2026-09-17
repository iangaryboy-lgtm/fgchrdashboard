import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CandidateProfile, ReleaseStatus, CandidateCategory, Employee } from '../../types';
import { parseDelimitedText, calculateAge, calculateYearsDifference, formatYears, formatAge, formatDecimal } from '../../utils/parser';
import { exportToExcel } from '../../utils/excel';
import { getCandidatePhoto } from '../../utils/candidatePkHelper';
import {
  Users,
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Edit2,
  X,
  AlertCircle,
  Sparkles,
  Info,
  UserPlus,
  CheckCircle2,
  Building2,
  Filter,
  Check,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  ClipboardPaste,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  AlertTriangle,
  Eye,
  Camera,
  Image,
  FolderUp,
  Link,
} from 'lucide-react';

export interface ParsedDetailsItem {
  empNo: string;
  internalMgmtStartDate?: string;
  completedProjectsCount?: number;
  releaseStatus?: ReleaseStatus;
  releaseDate?: string;
  releaseQuarter?: string;
  candidateCategory?: CandidateCategory;
  isMatched: boolean;
  matchedCandidate: CandidateProfile | null;
}

export interface ParsedProjectsItem {
  empNo: string;
  projectName: string;
  scaleType: string;
  role?: string;
  periodYears?: number;
  isMatched: boolean;
  matchedCandidate: CandidateProfile | null;
}

export interface ParsedEvalsItem {
  empNo: string;
  year: string;
  score: string;
  isMatched: boolean;
  matchedCandidate: CandidateProfile | null;
}

export interface ParsedPhotoFileItem {
  id: string;
  fileName: string;
  matchedEmpNo: string | null;
  matchedName: string | null;
  currentTitle?: string;
  currentDept?: string;
  dataUrl: string;
  isMatched: boolean;
  fileSizeKb: number;
}

export interface ParsedPhotoUrlItem {
  id: string;
  empNo: string;
  name?: string;
  photoUrl: string;
  isMatched: boolean;
  matchedCandidate: CandidateProfile | null;
}

export const CandidatePoolSettings: React.FC = () => {
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    batchImportCandidates,
    batchUpdateCandidateDetails,
    batchUpdateCandidateProjects,
    batchUpdateCandidateEvaluations,
    batchUpdateCandidatePhotos,
    clearAllCandidates,
    employees,
  } = useApp();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const singlePhotoFileInputRef = useRef<HTMLInputElement>(null);
  const batchPhotoFileInputRef = useRef<HTMLInputElement>(null);

  const scrollTable = (offset: number) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('全部');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('全部');

  // Step Modals
  const [activeStepModal, setActiveStepModal] = useState<
    '2-1-1' | '2-1-2' | '2-1-3' | '2-1-4' | 'edit_single' | 'batch_photos' | 'quick_photo' | null
  >(null);

  // Quick photo state
  const [quickPhotoCand, setQuickPhotoCand] = useState<CandidateProfile | null>(null);
  const [quickPhotoInput, setQuickPhotoInput] = useState<string>('');

  // Batch photos state
  const [photoImportTab, setPhotoImportTab] = useState<'files' | 'urls'>('files');
  const [photoFilesList, setPhotoFilesList] = useState<ParsedPhotoFileItem[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [photoUrlsRawText, setPhotoUrlsRawText] = useState('');
  const [photoUrlsPreviewList, setPhotoUrlsPreviewList] = useState<ParsedPhotoUrlItem[]>([]);
  const [photoBatchSuccessMsg, setPhotoBatchSuccessMsg] = useState<string | null>(null);
  const [photoBatchErrorMsg, setPhotoBatchErrorMsg] = useState<string | null>(null);

  // Secondary Confirmation Modal State for Steps 2-1-2, 2-1-3, 2-1-4
  const [confirmBatchModal, setConfirmBatchModal] = useState<'2-1-2' | '2-1-3' | '2-1-4' | null>(null);
  const [detailsPreviewList, setDetailsPreviewList] = useState<ParsedDetailsItem[]>([]);
  const [projectsPreviewList, setProjectsPreviewList] = useState<ParsedProjectsItem[]>([]);
  const [evalsPreviewList, setEvalsPreviewList] = useState<ParsedEvalsItem[]>([]);

  // 2-1-1 Picker modal state
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerDept, setPickerDept] = useState('全部');
  const [selectedEmpNos, setSelectedEmpNos] = useState<string[]>([]);
  const [pickerNotice, setPickerNotice] = useState<string | null>(null);

  // 2-1-2 Batch candidate details
  const [detailsRawText, setDetailsRawText] = useState('');
  const [detailsParseError, setDetailsParseError] = useState<string | null>(null);
  const [detailsSuccessMsg, setDetailsSuccessMsg] = useState<string | null>(null);

  // 2-1-3 Batch completed projects
  const [projectsRawText, setProjectsRawText] = useState('');
  const [projectsParseError, setProjectsParseError] = useState<string | null>(null);
  const [projectsSuccessMsg, setProjectsSuccessMsg] = useState<string | null>(null);

  // 2-1-4 Batch performance evaluations
  const [evalsRawText, setEvalsRawText] = useState('');
  const [evalsParseError, setEvalsParseError] = useState<string | null>(null);
  const [evalsSuccessMsg, setEvalsSuccessMsg] = useState<string | null>(null);

  // Single Add / Edit Form State
  const [editingCandidate, setEditingCandidate] = useState<CandidateProfile | null>(null);
  const [formData, setFormData] = useState<CandidateProfile>({
    empNo: 'FG1020',
    name: '張新民',
    department: '工程一部',
    section: 'HM2案',
    title: '副理',
    rank: '07',
    currentProject: '新案統籌',
    farglorySeniorityYears: 12,
    internalMgmtYears: 6,
    completedProjectsCount: 2,
    releaseStatus: '現任主管-已達標準釋出',
    releaseDate: '2026-11-15',
    releaseQuarter: '2026Q4',
    candidateCategory: '現任主管',
    availableRegions: ['北區', '中區'],
    specialMethods: ['深開挖', '帷幕牆'],
    eval2025: '甲上',
    eval2024: '甲',
    eval2023: '甲',
    sevenStagesYears: {
      preProject: 2.15,
      hypothesis: 1.8,
      foundation: 3.25,
      structure: 4.5,
      finishing: 3.1,
      landscape: 1.2,
      handover: 1.5,
    },
  });

  // Set of existing candidate empNos
  const existingCandidateEmpNos = useMemo(() => {
    return new Set(candidates.map((c) => c.empNo));
  }, [candidates]);

  // Unique departments from global employees
  const employeeDepts = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);
    return ['全部', ...list];
  }, [employees]);

  // Candidate departments
  const candidateDepts = useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.department).filter((d): d is string => Boolean(d))));
    return ['全部', ...list];
  }, [candidates]);

  // Filtered employees for 2-1-1 picker
  const filteredEmployeesForPicker = useMemo(() => {
    return employees.filter((emp) => {
      if (pickerDept !== '全部' && emp.department !== pickerDept) return false;
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase();
        const m1 = emp.name.toLowerCase().includes(q);
        const m2 = emp.empNo.toLowerCase().includes(q);
        const m3 = emp.department.toLowerCase().includes(q);
        const m4 = emp.title.toLowerCase().includes(q);
        const m5 = emp.rank.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }
      return true;
    });
  }, [employees, pickerDept, pickerSearch]);

  // Helper to convert Employee to CandidateProfile with auto-calculation
  const convertEmployeeToCandidate = (emp: Employee): CandidateProfile => {
    const isManager = ['07', '08', '09'].includes(emp.rank);
    const category: CandidateCategory = isManager
      ? '現任主管'
      : ['05', '06'].includes(emp.rank)
      ? '儲備主管'
      : '儲備幹部';

    const status: ReleaseStatus = isManager
      ? '現任主管-已達標準釋出'
      : category === '儲備主管'
      ? '儲備主管-待任用評估'
      : '儲備幹部-待任用評估';

    // Auto-calculate Age and Seniority based on 2026-06-17 reference
    const calculatedAge = emp.birthday ? calculateAge(emp.birthday, '2026-06-17') : undefined;
    const calculatedSeniority = emp.seniorityStartDate
      ? calculateYearsDifference(emp.seniorityStartDate, '2026-06-17', 2)
      : isManager
      ? 8.5
      : 4.0;

    const calculatedInternalMgmtYears = emp.internalMgmtStartDate
      ? calculateYearsDifference(emp.internalMgmtStartDate, '2026-06-17', 2)
      : isManager
      ? Math.max(1, Math.round(calculatedSeniority * 0.6 * 100) / 100)
      : 0;

    return {
      empNo: emp.empNo,
      name: emp.name,
      department: emp.department,
      section: emp.section || '-',
      rank: emp.rank,
      title: emp.title,
      birthday: emp.birthday,
      age: calculatedAge,
      seniorityStartDate: emp.seniorityStartDate,
      internalMgmtStartDate: emp.internalMgmtStartDate,
      currentProject: isManager ? '主力案場統籌' : '-',
      farglorySeniorityYears: calculatedSeniority,
      internalMgmtYears: calculatedInternalMgmtYears,
      completedProjectsCount: isManager ? 2 : 0,
      releaseStatus: status,
      releaseDate: isManager ? '2026/12/15' : '-',
      releaseQuarter: isManager ? '2026Q4' : '(空白)',
      candidateCategory: category,
      availableRegions: ['北區', '中區'],
      specialMethods: ['深開挖'],
      acceptedScales: ['中型住宅', '大型住宅'],
      eval2025: '甲',
      eval2024: '甲',
      eval2023: '甲',
      evaluations: {
        '2025': '甲',
        '2024': '甲',
        '2023': '甲',
      },
      sevenStagesYears: {
        preProject: 1.5,
        hypothesis: 1.2,
        foundation: 2.0,
        structure: 3.5,
        finishing: 2.5,
        landscape: 0.8,
        handover: 1.0,
      },
      projectExperiences: isManager
        ? [
            {
              projectName: `${emp.name}負責代表案A`,
              scaleType: '大型住宅',
              role: '案主管',
              periodYears: 2.5,
            },
          ]
        : [],
    };
  };

  // 2-1-1 Single Add
  const handleImportSingleFromPicker = (emp: Employee) => {
    if (existingCandidateEmpNos.has(emp.empNo)) {
      setPickerNotice(`${emp.name} (${emp.empNo}) 已經在候選人庫中！`);
      return;
    }
    const newCand = convertEmployeeToCandidate(emp);
    addCandidate(newCand);
    setPickerNotice(`成功匯入 ${emp.name} (${emp.empNo})！`);
  };

  // 2-1-1 Batch Import Selected
  const handleBatchImportSelected = () => {
    if (selectedEmpNos.length === 0) return;
    const toImport = employees
      .filter((e) => selectedEmpNos.includes(e.empNo) && !existingCandidateEmpNos.has(e.empNo))
      .map(convertEmployeeToCandidate);

    if (toImport.length > 0) {
      batchImportCandidates(toImport);
      setPickerNotice(`成功匯入 ${toImport.length} 位人員至案主管人選庫！`);
      setSelectedEmpNos([]);
      setTimeout(() => {
        setActiveStepModal(null);
        setPickerNotice(null);
      }, 1000);
    }
  };

  // 2-1-1 Select All
  const handleToggleSelectAllPicker = () => {
    const eligibleEmpNos = filteredEmployeesForPicker
      .filter((e) => !existingCandidateEmpNos.has(e.empNo))
      .map((e) => e.empNo);

    if (selectedEmpNos.length === eligibleEmpNos.length) {
      setSelectedEmpNos([]);
    } else {
      setSelectedEmpNos(eligibleEmpNos);
    }
  };

  // 2-1-2 Parse & Preview Candidate Details
  const handleProcessDetailsImport = () => {
    setDetailsParseError(null);
    setDetailsSuccessMsg(null);
    if (!detailsRawText.trim()) {
      setDetailsParseError('請貼入案主管相關資料');
      return;
    }

    try {
      const rows = parseDelimitedText(detailsRawText);
      if (rows.length === 0) {
        setDetailsParseError('未發現有效的資料列');
        return;
      }

      // Check header
      const startIdx =
        rows[0][0]?.includes('編號') || rows[0][0]?.toLowerCase().includes('emp') ? 1 : 0;

      const records: ParsedDetailsItem[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] || r[0].trim() === '') continue;

        const empNo = r[0].trim().toUpperCase();
        const internalMgmtStartDate = r[1]?.trim() || undefined;
        const completedProjectsCount = r[2] ? parseInt(r[2].trim()) : undefined;
        const releaseStatus = r[3]?.trim() as ReleaseStatus;
        const releaseDate = r[4]?.trim() || undefined;
        const releaseQuarter = r[5]?.trim() || undefined;
        const candidateCategory = r[6]?.trim() as CandidateCategory;

        const matched = candidates.find((c) => c.empNo.trim().toUpperCase() === empNo) || null;

        records.push({
          empNo,
          internalMgmtStartDate,
          completedProjectsCount,
          releaseStatus,
          releaseDate,
          releaseQuarter,
          candidateCategory,
          isMatched: !!matched,
          matchedCandidate: matched,
        });
      }

      if (records.length === 0) {
        setDetailsParseError('未能解析出有效資料列');
        return;
      }

      setDetailsPreviewList(records);
      setConfirmBatchModal('2-1-2');
    } catch (err: any) {
      setDetailsParseError(`解析出錯：${err?.message || '格式異常'}`);
    }
  };

  // 2-1-2 Commit Candidate Details
  const handleCommitDetailsImport = () => {
    if (detailsPreviewList.length === 0) return;
    const validRecords = detailsPreviewList.map(({ isMatched, matchedCandidate, ...rest }) => rest);
    const count = batchUpdateCandidateDetails(validRecords);
    setConfirmBatchModal(null);
    setActiveStepModal(null);
    setDetailsRawText('');
    setDetailsSuccessMsg(`成功批次更新 ${count} 位案主管的詳細背景與釋出資料！`);
    setTimeout(() => setDetailsSuccessMsg(null), 3500);
  };

  // 2-1-3 Parse & Preview Completed Projects
  const handleProcessProjectsImport = () => {
    setProjectsParseError(null);
    setProjectsSuccessMsg(null);
    if (!projectsRawText.trim()) {
      setProjectsParseError('請貼入案主管完案資料');
      return;
    }

    try {
      const rows = parseDelimitedText(projectsRawText);
      if (rows.length === 0) {
        setProjectsParseError('未發現有效的資料列');
        return;
      }

      const startIdx =
        rows[0][0]?.includes('編號') || rows[0][0]?.toLowerCase().includes('emp') ? 1 : 0;

      const records: ParsedProjectsItem[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] || r[0].trim() === '') continue;

        const empNo = r[0].trim().toUpperCase();
        const projectName = r[1]?.trim() || '專案案場';
        const scaleType = r[2]?.trim() || '大型住宅';
        const role = r[3]?.trim() || '專案人員';
        const periodYears = r[4] ? parseFloat(r[4].trim()) : 1.5;

        const matched = candidates.find((c) => c.empNo.trim().toUpperCase() === empNo) || null;

        records.push({
          empNo,
          projectName,
          scaleType,
          role,
          periodYears,
          isMatched: !!matched,
          matchedCandidate: matched,
        });
      }

      if (records.length === 0) {
        setProjectsParseError('未能解析出有效專案資料');
        return;
      }

      setProjectsPreviewList(records);
      setConfirmBatchModal('2-1-3');
    } catch (err: any) {
      setProjectsParseError(`解析出錯：${err?.message || '格式異常'}`);
    }
  };

  // 2-1-3 Commit Completed Projects
  const handleCommitProjectsImport = () => {
    if (projectsPreviewList.length === 0) return;
    const validRecords = projectsPreviewList.map(({ isMatched, matchedCandidate, ...rest }) => rest);
    const count = batchUpdateCandidateProjects(validRecords);
    setConfirmBatchModal(null);
    setActiveStepModal(null);
    setProjectsRawText('');
    setProjectsSuccessMsg(`成功匯入 ${validRecords.length} 筆經歷案場至 ${count} 位案主管歷練資料庫！`);
    setTimeout(() => setProjectsSuccessMsg(null), 3500);
  };

  // 2-1-4 Parse & Preview Performance Evaluations
  const handleProcessEvalsImport = () => {
    setEvalsParseError(null);
    setEvalsSuccessMsg(null);
    if (!evalsRawText.trim()) {
      setEvalsParseError('請貼入考績資料');
      return;
    }

    try {
      const rows = parseDelimitedText(evalsRawText);
      if (rows.length === 0) {
        setEvalsParseError('未發現有效的資料列');
        return;
      }

      const startIdx =
        rows[0][0]?.includes('編號') || rows[0][0]?.toLowerCase().includes('emp') ? 1 : 0;

      const records: ParsedEvalsItem[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] || r[0].trim() === '') continue;

        const empNo = r[0].trim().toUpperCase();
        const year = r[1]?.trim().replace('年', '') || '2025';
        const score = r[2]?.trim() || '甲';

        const matched = candidates.find((c) => c.empNo.trim().toUpperCase() === empNo) || null;

        records.push({
          empNo,
          year,
          score,
          isMatched: !!matched,
          matchedCandidate: matched,
        });
      }

      if (records.length === 0) {
        setEvalsParseError('未能解析出有效考績資料');
        return;
      }

      setEvalsPreviewList(records);
      setConfirmBatchModal('2-1-4');
    } catch (err: any) {
      setEvalsParseError(`解析出錯：${err?.message || '格式異常'}`);
    }
  };

  // 2-1-4 Commit Performance Evaluations
  const handleCommitEvalsImport = () => {
    if (evalsPreviewList.length === 0) return;
    const validRecords = evalsPreviewList.map(({ isMatched, matchedCandidate, ...rest }) => rest);
    const count = batchUpdateCandidateEvaluations(validRecords);
    setConfirmBatchModal(null);
    setActiveStepModal(null);
    setEvalsRawText('');
    setEvalsSuccessMsg(`成功匯入 ${validRecords.length} 筆多年度考績記錄至 ${count} 位人選！`);
    setTimeout(() => setEvalsSuccessMsg(null), 3500);
  };

  // Photo Management Handlers
  const handleOpenQuickPhoto = (cand: CandidateProfile) => {
    setQuickPhotoCand(cand);
    setQuickPhotoInput(cand.photoUrl || '');
    setActiveStepModal('quick_photo');
  };

  const handleSaveQuickPhoto = () => {
    if (quickPhotoCand) {
      updateCandidate(quickPhotoCand.empNo, { photoUrl: quickPhotoInput.trim() });
      setActiveStepModal(null);
      setQuickPhotoCand(null);
    }
  };

  const handlePhotoFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsReadingFiles(true);
    setPhotoBatchErrorMsg(null);
    setPhotoBatchSuccessMsg(null);

    const newItems: ParsedPhotoFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const rawBaseName = file.name.replace(/\.[^/.]+$/, '').trim();

      // Match candidate:
      // 1. Exact empNo
      let matched = candidates.find(
        (c) => c.empNo.toLowerCase() === rawBaseName.toLowerCase()
      );
      // 2. Contains empNo
      if (!matched) {
        matched = candidates.find((c) =>
          rawBaseName.toUpperCase().includes(c.empNo.toUpperCase())
        );
      }
      // 3. Match candidate name
      if (!matched) {
        matched = candidates.find(
          (c) => c.name && rawBaseName.includes(c.name.trim())
        );
      }

      // Read file to Base64
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        newItems.push({
          id: `${file.name}-${i}-${Date.now()}`,
          fileName: file.name,
          matchedEmpNo: matched ? matched.empNo : null,
          matchedName: matched ? (matched.name || matched.empNo) : null,
          currentTitle: matched ? matched.title : undefined,
          currentDept: matched ? matched.department : undefined,
          dataUrl,
          isMatched: !!matched,
          fileSizeKb: Math.round(file.size / 1024),
        });
      }
    }

    setPhotoFilesList((prev) => [...prev, ...newItems]);
    setIsReadingFiles(false);
  };

  const handleAssignCandToFile = (itemId: string, targetEmpNo: string) => {
    setPhotoFilesList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const cand = candidates.find((c) => c.empNo === targetEmpNo);
          return {
            ...item,
            matchedEmpNo: cand ? cand.empNo : null,
            matchedName: cand ? (cand.name || cand.empNo) : null,
            currentTitle: cand ? cand.title : undefined,
            currentDept: cand ? cand.department : undefined,
            isMatched: !!cand,
          };
        }
        return item;
      })
    );
  };

  const handleRemovePhotoFile = (itemId: string) => {
    setPhotoFilesList((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleApplyBatchPhotoFiles = () => {
    const validItems = photoFilesList.filter((item) => item.isMatched && item.matchedEmpNo);
    if (validItems.length === 0) {
      setPhotoBatchErrorMsg('目前無成功匹配的主管照片可套用，請確認檔案命名或手動指定對應人員');
      return;
    }

    const records = validItems.map((item) => ({
      empNo: item.matchedEmpNo!,
      photoUrl: item.dataUrl,
    }));

    const count = batchUpdateCandidatePhotos(records);
    setPhotoBatchSuccessMsg(`成功匯入並更新 ${count} 位案主管的照片！`);
    setTimeout(() => {
      setActiveStepModal(null);
      setPhotoFilesList([]);
      setPhotoBatchSuccessMsg(null);
    }, 1800);
  };

  const handleParsePhotoUrls = () => {
    setPhotoBatchErrorMsg(null);
    setPhotoBatchSuccessMsg(null);
    if (!photoUrlsRawText.trim()) {
      setPhotoBatchErrorMsg('請先貼入工號與照片網址資料');
      return;
    }

    const lines = photoUrlsRawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: ParsedPhotoUrlItem[] = [];

    lines.forEach((line, index) => {
      let parts = line.split(/\t|,|;/).map((s) => s.trim()).filter(Boolean);
      if (parts.length === 1 && line.includes('http')) {
        parts = line.split(/\s+/).map((s) => s.trim()).filter(Boolean);
      }

      let empNo = '';
      let name: string | undefined = undefined;
      let url = '';

      if (parts.length >= 3) {
        empNo = parts[0];
        name = parts[1];
        url = parts[2];
      } else if (parts.length === 2) {
        empNo = parts[0];
        url = parts[1];
      } else if (parts.length === 1) {
        url = parts[0];
      }

      const cand = candidates.find(
        (c) =>
          c.empNo.toLowerCase() === empNo.toLowerCase() ||
          (name && c.name === name) ||
          c.name === empNo
      );

      parsed.push({
        id: `url-${index}-${Date.now()}`,
        empNo: cand ? cand.empNo : empNo,
        name: cand ? cand.name : name,
        photoUrl: url,
        isMatched: !!cand,
        matchedCandidate: cand || null,
      });
    });

    setPhotoUrlsPreviewList(parsed);
  };

  const handleApplyBatchPhotoUrls = () => {
    const validItems = photoUrlsPreviewList.filter((item) => item.isMatched && item.matchedCandidate);
    if (validItems.length === 0) {
      setPhotoBatchErrorMsg('目前無成功匹配的主管照片網址可套用');
      return;
    }

    const records = validItems.map((item) => ({
      empNo: item.empNo,
      photoUrl: item.photoUrl,
    }));

    const count = batchUpdateCandidatePhotos(records);
    setPhotoBatchSuccessMsg(`成功匯入並更新 ${count} 位案主管的照片網址！`);
    setTimeout(() => {
      setActiveStepModal(null);
      setPhotoUrlsPreviewList([]);
      setPhotoUrlsRawText('');
      setPhotoBatchSuccessMsg(null);
    }, 1800);
  };

  const handleFillPhotoUrlsExample = () => {
    const sample = [
      'FG1002\t林柏宏\thttps://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=380&fit=crop&crop=face',
      'FG1008\t李俊毅\thttps://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=380&fit=crop&crop=face',
      'FG1001\t陳冠霖\thttps://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=380&fit=crop&crop=face',
    ].join('\n');
    setPhotoUrlsRawText(sample);
  };

  // Filtered Candidates for Table
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedDeptFilter !== '全部' && c.department !== selectedDeptFilter) return false;
      if (selectedCategoryFilter !== '全部' && c.candidateCategory !== selectedCategoryFilter)
        return false;

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const m1 = c.name?.toLowerCase().includes(q);
        const m2 = c.empNo.toLowerCase().includes(q);
        const m3 = c.department?.toLowerCase().includes(q);
        const m4 = c.section?.toLowerCase().includes(q);
        const m5 = c.currentProject?.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }
      return true;
    });
  }, [candidates, selectedDeptFilter, selectedCategoryFilter, searchKeyword]);

  // Export
  const handleExportExcel = () => {
    const exportData = filteredCandidates.map((c) => ({
      員工編號: c.empNo,
      姓名: c.name,
      部室: c.department,
      科案: c.section,
      職等: c.rank,
      職稱: c.title,
      年齡: c.age || '-',
      遠營年資: c.farglorySeniorityYears,
      內部管理年資: c.internalMgmtYears,
      完案數: c.completedProjectsCount,
      釋出狀態: c.releaseStatus,
      標準釋出日: c.releaseDate,
      釋出季度: c.releaseQuarter,
      人選分類: c.candidateCategory,
      '2025考績': c.evaluations?.['2025'] || c.eval2025,
      '2024考績': c.evaluations?.['2024'] || c.eval2024,
      '2023考績': c.evaluations?.['2023'] || c.eval2023,
    }));
    exportToExcel(
      exportData,
      `遠雄營造_案主管人選庫後台資料_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-4">
      {/* 4-Step Action Workflow Cards Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600/60 text-blue-200 text-xs font-bold font-mono">
                案主管背景設定
              </span>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                2-1. 人選庫設定
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              遵循標準 4 步驟設定流程：挑選全域名冊 ➔ 貼入主管背景 ➔ 貼入完案歷練 ➔ 貼入考績數據
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPhotoBatchSuccessMsg(null);
                setPhotoBatchErrorMsg(null);
                setPhotoFilesList([]);
                setPhotoUrlsRawText('');
                setPhotoUrlsPreviewList([]);
                setActiveStepModal('batch_photos');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-sm border border-violet-400/40 transition-all active:scale-95 cursor-pointer"
              title="支援多張本機圖檔批次辨識上傳或 Excel 貼上網址"
            >
              <Camera className="w-3.5 h-3.5 text-violet-200" />
              <span>整批匯入照片</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              匯出 Excel
            </button>
            <button
              onClick={() => {
                if (window.confirm('確定要全數清空候選人人選庫嗎？此操作不可逆！')) {
                  clearAllCandidates();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空人選庫
            </button>
          </div>
        </div>

        {/* The 4 Workflow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Step 2-1-1 */}
          <div
            onClick={() => {
              setPickerSearch('');
              setPickerDept('全部');
              setSelectedEmpNos([]);
              setPickerNotice(null);
              setActiveStepModal('2-1-1');
            }}
            className="group bg-slate-800/80 hover:bg-blue-900/60 p-3.5 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500 text-white">
                  步驟 2-1-1
                </span>
                <UserPlus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2 group-hover:text-blue-300">
                從全域名單挑選匯入
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                搜尋全域員工名冊，自動計算年齡、遠營年資與管理職等後匯入人選庫。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-300 font-semibold">
              <span>開啟選單匯入</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2-1-2 */}
          <div
            onClick={() => {
              setDetailsRawText('');
              setDetailsParseError(null);
              setDetailsSuccessMsg(null);
              setActiveStepModal('2-1-2');
            }}
            className="group bg-slate-800/80 hover:bg-indigo-900/60 p-3.5 rounded-xl border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500 text-white">
                  步驟 2-1-2
                </span>
                <ClipboardPaste className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2 group-hover:text-indigo-300">
                批次貼入案主管相關資料
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                以員工編號為基準：內部管理年資起算日/完案數/釋出狀態/標準釋出日/季度/分類。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
              <span>貼入主管背景</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2-1-3 */}
          <div
            onClick={() => {
              setProjectsRawText('');
              setProjectsParseError(null);
              setProjectsSuccessMsg(null);
              setActiveStepModal('2-1-3');
            }}
            className="group bg-slate-800/80 hover:bg-teal-900/60 p-3.5 rounded-xl border border-slate-700 hover:border-teal-500 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500 text-white">
                  步驟 2-1-3
                </span>
                <Building2 className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2 group-hover:text-teal-300">
                批次貼入案主管完案資料
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                以員工編號為基準，支援匯入多筆經歷案場名稱、案場類型、擔任職務與工法。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-teal-300 font-semibold">
              <span>貼入經歷案場</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2-1-4 */}
          <div
            onClick={() => {
              setEvalsRawText('');
              setEvalsParseError(null);
              setEvalsSuccessMsg(null);
              setActiveStepModal('2-1-4');
            }}
            className="group bg-slate-800/80 hover:bg-amber-900/60 p-3.5 rounded-xl border border-slate-700 hover:border-amber-500 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-white">
                  步驟 2-1-4
                </span>
                <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-white mt-2 group-hover:text-amber-300">
                批次貼入考績資料
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                以員工編號為基準，批次匯入多年度考績等第與分數（如2025、2024、2023等）。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
              <span>貼入考績分數</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Photo Management Sub-Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-400/30 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              主管照片功能
            </span>
            <span className="text-[11px] text-slate-300">
              支援「單人點擊清冊頭像快速換照」或「整批匯入照片（檔名自動對應工號/姓名 或 Excel網址貼上）」，上傳後全系統即時同步。
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhotoBatchSuccessMsg(null);
              setPhotoBatchErrorMsg(null);
              setPhotoFilesList([]);
              setPhotoUrlsRawText('');
              setPhotoUrlsPreviewList([]);
              setActiveStepModal('batch_photos');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-200 hover:text-white bg-purple-900/50 hover:bg-purple-800/80 rounded-lg border border-purple-500/40 transition-colors cursor-pointer"
          >
            <FolderUp className="w-3.5 h-3.5 text-purple-400" />
            <span>開啟整批照片匯入中心</span>
          </button>
        </div>
      </div>

      {/* Filter & Candidate Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋姓名/工號/科案/現職..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none w-52"
              />
            </div>

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              {candidateDepts.map((d) => (
                <option key={d} value={d}>
                  部室：{d}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              <option value="全部">人選分類：全部</option>
              <option value="現任主管">現任主管</option>
              <option value="曾任主管">曾任主管</option>
              <option value="儲備主管">儲備主管</option>
              <option value="儲備幹部">儲備幹部</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 font-medium hidden sm:inline">
              目前顯示：<strong className="text-blue-600 font-mono">{filteredCandidates.length}</strong> / {candidates.length} 人
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => scrollTable(-350)}
                className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1 shadow-xs transition-colors"
                title="向左平移"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">向左</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium px-1 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                <span>左右滑動瀏覽</span>
              </span>
              <button
                type="button"
                onClick={() => scrollTable(350)}
                className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1 shadow-xs transition-colors"
                title="向右平移"
              >
                <span className="hidden md:inline">向右</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Candidate Table with smooth horizontal scroll and sticky columns */}
        <div ref={tableContainerRef} className="overflow-x-auto relative">
          <table className="min-w-[1900px] w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3 w-[80px] min-w-[80px] sticky left-0 z-20 bg-slate-100 border-r border-slate-200">
                  工號
                </th>
                <th className="py-3 px-3 w-[170px] min-w-[170px] sticky left-[80px] z-20 bg-slate-100 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  姓名 / 照片
                </th>
                <th className="py-3 px-3.5 w-[110px] min-w-[110px]">部室</th>
                <th className="py-3 px-3.5 w-[120px] min-w-[120px]">科案</th>
                <th className="py-3 px-3.5 w-[130px] min-w-[130px]">現職案場</th>
                <th className="py-3 px-3.5 w-[130px] min-w-[130px]">職稱 / 等第</th>
                <th className="py-3 px-3.5 w-[70px] min-w-[70px] text-center">年齡</th>
                <th className="py-3 px-3.5 w-[95px] min-w-[95px] text-center">遠營年資</th>
                <th className="py-3 px-3.5 w-[115px] min-w-[115px] text-center bg-indigo-50/60 text-indigo-900">
                  內部年資起算日
                </th>
                <th className="py-3 px-3.5 w-[110px] min-w-[110px] text-center bg-indigo-50/80 text-indigo-950">
                  內部管理年資
                </th>
                <th className="py-3 px-3.5 w-[80px] min-w-[80px] text-center">完案數</th>
                <th className="py-3 px-3.5 w-[190px] min-w-[190px]">釋出狀態</th>
                <th className="py-3 px-3.5 w-[115px] min-w-[115px]">標準釋出日</th>
                <th className="py-3 px-3.5 w-[90px] min-w-[90px] text-center">釋出季度</th>
                <th className="py-3 px-3.5 w-[100px] min-w-[100px] text-center">人選分類</th>
                <th className="py-3 px-3.5 w-[130px] min-w-[130px]">可調動區域</th>
                <th className="py-3 px-3.5 w-[85px] min-w-[85px] text-center bg-blue-50/60 text-blue-900">
                  2025考績
                </th>
                <th className="py-3 px-3.5 w-[85px] min-w-[85px] text-center bg-blue-50/60 text-blue-900">
                  2024考績
                </th>
                <th className="py-3 px-3.5 w-[85px] min-w-[85px] text-center bg-blue-50/60 text-blue-900">
                  2023考績
                </th>
                <th className="py-3 px-3.5 w-[85px] min-w-[85px] text-center sticky right-0 z-20 bg-slate-100 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-14 text-center text-slate-400">
                    人選庫目前尚無符合篩選條件之人員資料
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => (
                  <tr key={cand.empNo} className="hover:bg-blue-50/40 transition-colors group">
                    {/* Sticky Column 1: 工號 */}
                    <td className="py-2 px-3 w-[80px] min-w-[80px] sticky left-0 z-10 bg-white group-hover:bg-blue-50/90 font-mono font-bold text-blue-600 border-r border-slate-100">
                      {cand.empNo}
                    </td>

                    {/* Sticky Column 2: 姓名與照片 */}
                    <td className="py-1.5 px-3 w-[170px] min-w-[170px] sticky left-[80px] z-10 bg-white group-hover:bg-blue-50/90 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() => handleOpenQuickPhoto(cand)}
                          className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer group/avatar hover:ring-2 hover:ring-purple-500 transition-all shadow-2xs"
                          title="點擊更換照片"
                        >
                          <img
                            src={getCandidatePhoto(cand)}
                            alt={cand.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block font-bold text-slate-900 leading-snug">{cand.name}</span>
                          {cand.photoUrl ? (
                            <span className="inline-block text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded font-medium leading-tight border border-emerald-200/60">
                              已換照
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickPhoto(cand)}
                              className="text-[9px] text-slate-400 hover:text-purple-600 hover:underline block leading-tight cursor-pointer"
                            >
                              設定照片
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 部室 */}
                    <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] text-slate-700 font-medium">
                      {cand.department || '-'}
                    </td>

                    {/* 科案 */}
                    <td className="py-2.5 px-3.5 w-[120px] min-w-[120px] text-slate-600 font-mono">
                      {cand.section || '-'}
                    </td>

                    {/* 現職案場 */}
                    <td className="py-2.5 px-3.5 w-[130px] min-w-[130px] text-slate-700">
                      {cand.currentProject || '-'}
                    </td>

                    {/* 職稱 / 等第 */}
                    <td className="py-2.5 px-3.5 w-[130px] min-w-[130px]">
                      <span className="font-semibold text-slate-800">{cand.title}</span>
                      <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold border border-slate-200">
                        {cand.rank}等
                      </span>
                    </td>

                    {/* 年齡 */}
                    <td className="py-2.5 px-3.5 w-[70px] min-w-[70px] text-center font-mono font-bold text-slate-700">
                      {formatAge(cand.age ?? cand.birthday)}
                    </td>

                    {/* 遠營年資 */}
                    <td className="py-2.5 px-3.5 w-[95px] min-w-[95px] text-center font-mono text-slate-700 font-semibold">
                      {cand.seniorityStartDate
                        ? `${formatYears(calculateYearsDifference(cand.seniorityStartDate, '2026-06-17', 2))} 年`
                        : `${formatYears(cand.farglorySeniorityYears, 2)} 年`}
                    </td>

                    {/* 內部年資起算日 */}
                    <td className="py-2.5 px-3.5 w-[115px] min-w-[115px] text-center font-mono text-[11px] bg-indigo-50/20">
                      {cand.internalMgmtStartDate && cand.internalMgmtStartDate !== '-' ? (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-200">
                          {cand.internalMgmtStartDate}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 內部管理年資 (依照起算日基準計算) */}
                    <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">
                      {cand.internalMgmtStartDate && cand.internalMgmtStartDate !== '-'
                        ? `${formatYears(calculateYearsDifference(cand.internalMgmtStartDate, '2026-06-17', 2))} 年`
                        : `${formatYears(cand.internalMgmtYears ?? 0, 2)} 年`}
                    </td>

                    {/* 完案數 */}
                    <td className="py-2.5 px-3.5 w-[80px] min-w-[80px] text-center font-mono font-bold text-emerald-600">
                      {cand.completedProjectsCount}
                    </td>

                    {/* 釋出狀態 */}
                    <td className="py-2.5 px-3.5 w-[190px] min-w-[190px]">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                          cand.releaseStatus.includes('已達')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cand.releaseStatus.includes('尚未')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {cand.releaseStatus}
                      </span>
                    </td>

                    {/* 標準釋出日 */}
                    <td className="py-2.5 px-3.5 w-[115px] min-w-[115px] font-mono text-slate-600 text-[11px]">
                      {cand.releaseDate || '-'}
                    </td>

                    {/* 釋出季度 */}
                    <td className="py-2.5 px-3.5 w-[90px] min-w-[90px] text-center font-mono font-bold text-slate-700">
                      {cand.releaseQuarter || '-'}
                    </td>

                    {/* 人選分類 */}
                    <td className="py-2.5 px-3.5 w-[100px] min-w-[100px] text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px] border border-slate-200">
                        {cand.candidateCategory}
                      </span>
                    </td>

                    {/* 可調動區域 */}
                    <td className="py-2.5 px-3.5 w-[130px] min-w-[130px]">
                      <div className="flex flex-wrap gap-1">
                        {cand.availableRegions && cand.availableRegions.length > 0 ? (
                          cand.availableRegions.map((reg) => (
                            <span
                              key={reg}
                              className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded border border-slate-200"
                            >
                              {reg}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">未設定</span>
                        )}
                      </div>
                    </td>

                    {/* 2025考績 */}
                    <td className="py-2.5 px-3.5 w-[85px] min-w-[85px] text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          (cand.evaluations?.['2025'] || cand.eval2025) === '甲上' ||
                          (cand.evaluations?.['2025'] || cand.eval2025) === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cand.evaluations?.['2025'] || cand.eval2025 || '-'}
                      </span>
                    </td>

                    {/* 2024考績 */}
                    <td className="py-2.5 px-3.5 w-[85px] min-w-[85px] text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          (cand.evaluations?.['2024'] || cand.eval2024) === '甲上' ||
                          (cand.evaluations?.['2024'] || cand.eval2024) === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cand.evaluations?.['2024'] || cand.eval2024 || '-'}
                      </span>
                    </td>

                    {/* 2023考績 */}
                    <td className="py-2.5 px-3.5 w-[85px] min-w-[85px] text-center font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          (cand.evaluations?.['2023'] || cand.eval2023) === '甲上' ||
                          (cand.evaluations?.['2023'] || cand.eval2023) === '優'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cand.evaluations?.['2023'] || cand.eval2023 || '-'}
                      </span>
                    </td>

                    {/* Sticky Column Right: 操作 */}
                    <td className="py-2.5 px-3.5 w-[85px] min-w-[85px] text-center sticky right-0 z-10 bg-white group-hover:bg-blue-50/90 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCandidate(cand);
                            setFormData({ ...cand });
                            setActiveStepModal('edit_single');
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="編輯資料"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`確定要將 ${cand.name} (${cand.empNo}) 從人選庫中移除嗎？`)) {
                              deleteCandidate(cand.empNo);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors"
                          title="刪除人選"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL 2-1-1: 從全域名單挑選匯入
         ======================================================== */}
      {activeStepModal === '2-1-1' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/20 text-blue-100">
                  步驟 2-1-1
                </span>
                <h3 className="text-base font-bold flex items-center gap-2 mt-1">
                  <UserPlus className="w-5 h-5 text-blue-200" />
                  從全域人員名單庫挑選匯入人選庫
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  系統將自動自同仁資料帶入生日計算年齡、自遠營起算日計算公司年資，並依職等預設管理分類
                </p>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pickerNotice && (
              <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {pickerNotice}
              </div>
            )}

            {/* Filter controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="輸入員工編號、姓名、部門關鍵字搜尋..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <select
                  value={pickerDept}
                  onChange={(e) => setPickerDept(e.target.value)}
                  className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  {employeeDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAllPicker}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
                >
                  全選未匯入同仁
                </button>
              </div>
            </div>

            {/* Employee List Table */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[420px]">
              {filteredEmployeesForPicker.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">查無符合搜尋條件之同仁</div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">選取</th>
                      <th className="py-2.5 px-3">工號</th>
                      <th className="py-2.5 px-3">姓名</th>
                      <th className="py-2.5 px-3">部室 / 科案</th>
                      <th className="py-2.5 px-3">職稱 / 職等</th>
                      <th className="py-2.5 px-3 text-center">自動計算年齡</th>
                      <th className="py-2.5 px-3 text-center">自動計算遠營年資</th>
                      <th className="py-2.5 px-3 text-center">人選庫狀態</th>
                      <th className="py-2.5 px-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployeesForPicker.map((emp) => {
                      const isAlready = existingCandidateEmpNos.has(emp.empNo);
                      const isSelected = selectedEmpNos.includes(emp.empNo);
                      const age = emp.birthday ? calculateAge(emp.birthday, '2026-06-17') : '-';
                      const seniority = emp.seniorityStartDate
                        ? formatYears(calculateYearsDifference(emp.seniorityStartDate, '2026-06-17', 2))
                        : '-';

                      return (
                        <tr
                          key={emp.empNo}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isSelected ? 'bg-blue-50/80' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAlready}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedEmpNos((prev) =>
                                  prev.includes(emp.empNo)
                                    ? prev.filter((id) => id !== emp.empNo)
                                    : [...prev, emp.empNo]
                                );
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-30"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{emp.empNo}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{emp.name}</td>
                          <td className="py-2 px-3">
                            <div className="font-medium">{emp.department}</div>
                            <div className="text-[10px] text-slate-400">{emp.section}</div>
                          </td>
                          <td className="py-2 px-3">
                            {emp.title} <span className="font-mono text-slate-500">({emp.rank}等)</span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                            {age} 歲
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-700">
                            {seniority} 年
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isAlready ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <Check className="w-3 h-3" /> 已在人選庫
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                未匯入
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              disabled={isAlready}
                              onClick={() => handleImportSingleFromPicker(emp)}
                              className="px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-30 rounded border border-blue-200 transition-colors"
                            >
                              匯入
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                已選取 <strong className="text-blue-600">{selectedEmpNos.length}</strong> 位同仁
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStepModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  關閉
                </button>
                <button
                  type="button"
                  disabled={selectedEmpNos.length === 0}
                  onClick={handleBatchImportSelected}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  匯入所選同仁 ({selectedEmpNos.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2-1-2: 批次貼入案主管相關資料
         ======================================================== */}
      {activeStepModal === '2-1-2' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  步驟 2-1-2
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <ClipboardPaste className="w-5 h-5 text-indigo-600" />
                  批次貼入案主管相關資料 (以員工編號為基準)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  貼入格式（支援 Excel 直接複製 Tab 分隔）：<br />
                  <code className="text-indigo-600 font-mono font-bold">
                    員工編號 / 內部管理年資起算日 / 完案數 / 釋出狀態 / 標準釋出日 / 釋出季度 / 人選分類
                  </code>
                </p>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {detailsParseError}
              </div>
            )}

            {/* Quick Fill Template */}
            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-indigo-900">範例格式 (點擊快速套用)：</span>
                <button
                  type="button"
                  onClick={() => {
                    setDetailsRawText(
                      `FG1001\t2020-03-01\t3\t現任主管-已達標準釋出\t2026-11-15\t2026Q4\t現任主管\nFG1002\t2022-07-01\t1\t現任主管-尚未達釋出條件\t2028-04-14\t2028Q2\t現任主管\nFG1003\t2023-01-15\t0\t儲備主管-待任用評估\t-\t(空白)\t儲備主管`
                    );
                  }}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] transition-colors"
                >
                  填入範例資料
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto p-2 bg-white rounded border border-indigo-200">
{`FG1001\t2020-03-01\t3\t現任主管-已達標準釋出\t2026-11-15\t2026Q4\t現任主管
FG1002\t2022-07-01\t1\t現任主管-尚未達釋出條件\t2028-04-14\t2028Q2\t現任主管`}
              </pre>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                貼入文字資料 (可直接從 Excel 框選欄位複製後貼上)：
              </label>
              <textarea
                value={detailsRawText}
                onChange={(e) => setDetailsRawText(e.target.value)}
                placeholder="貼入範例：&#10;FG1001&#9;2020-03-01&#9;3&#9;現任主管-已達標準釋出&#9;2026-11-15&#9;2026Q4&#9;現任主管"
                rows={7}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStepModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleProcessDetailsImport}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                解析並預覽確認 (下一步)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRMATION MODAL 2-1-2: 案主管背景資料二次確認
         ======================================================== */}
      {confirmBatchModal === '2-1-2' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  步驟 2-1-2：資料確認與人選庫比對
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  確認主管背景資料及員工編號比對
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  請確認以下解析之資料內容，系統已自動與 2-1-1 案主管人選庫名冊進行員工編號核對。
                </p>
              </div>
              <button onClick={() => setConfirmBatchModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matching Stats & Alerts */}
            {(() => {
              const unmatchedCount = detailsPreviewList.filter((d) => !d.isMatched).length;
              const matchedCount = detailsPreviewList.filter((d) => d.isMatched).length;

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      總解析筆數：<strong className="font-mono text-slate-900">{detailsPreviewList.length}</strong> 筆
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      比對成功 (已在 2-1-1 人選庫)：<strong className="font-mono">{matchedCount}</strong> 筆
                    </span>
                    {unmatchedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        比對失敗 (未在 2-1-1 人選庫)：<strong className="font-mono">{unmatchedCount}</strong> 筆
                      </span>
                    )}
                  </div>

                  {unmatchedCount > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>員工編號比對錯誤警示：偵測到 {unmatchedCount} 筆資料無法與 2-1-1 已匯入之案主管人選庫名單比對！</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed pl-6">
                        未比對成功之員工編號在人選庫中找不到對應人選，將無法關聯寫入其檔案。建議您：確認員工編號是否貼入正確，或先至【步驟 2-1-1 從全域名單挑選匯入】將該人員加入人選庫名單後再進行批次貼入。
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Preview Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl max-h-[360px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2 px-3 text-center">人選庫比對</th>
                    <th className="py-2 px-3">員工編號</th>
                    <th className="py-2 px-3">對應人選姓名 / 部門</th>
                    <th className="py-2 px-3">管理年資起算日</th>
                    <th className="py-2 px-3 text-center">完案數</th>
                    <th className="py-2 px-3">釋出狀態</th>
                    <th className="py-2 px-3">標準釋出日</th>
                    <th className="py-2 px-3">釋出季度</th>
                    <th className="py-2 px-3">人選分類</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap text-slate-700">
                  {detailsPreviewList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.isMatched ? 'hover:bg-indigo-50/30' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                    >
                      <td className="py-2 px-3 text-center">
                        {item.isMatched ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> 已比對
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center justify-center gap-1 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> 未在 2-1-1
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-3 font-mono font-bold ${item.isMatched ? 'text-indigo-700' : 'text-rose-700'}`}>
                        {item.empNo}
                      </td>
                      <td className="py-2 px-3">
                        {item.matchedCandidate ? (
                          <span className="font-semibold text-slate-900">
                            {item.matchedCandidate.name}{' '}
                            <span className="text-slate-500 text-[11px]">({item.matchedCandidate.department})</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 italic font-medium">⚠️ 人選庫無此人員 (無法更新)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">{item.internalMgmtStartDate || '-'}</td>
                      <td className="py-2 px-3 text-center font-mono">{item.completedProjectsCount ?? '-'}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{item.releaseStatus || '-'}</span>
                      </td>
                      <td className="py-2 px-3 font-mono">{item.releaseDate || '-'}</td>
                      <td className="py-2 px-3 font-mono">{item.releaseQuarter || '-'}</td>
                      <td className="py-2 px-3 font-semibold">{item.candidateCategory || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                返回修改文字
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmBatchModal(null);
                    setActiveStepModal(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  放棄匯入
                </button>
                <button
                  type="button"
                  onClick={handleCommitDetailsImport}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確認無誤，執行批次更新 ({detailsPreviewList.filter((d) => d.isMatched).length} 筆有效)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2-1-3: 批次貼入案主管完案資料
         ======================================================== */}
      {activeStepModal === '2-1-3' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  步驟 2-1-3
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  批次貼入案主管完案資料 (支援多筆經歷案場)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  以員工編號為基準，貼入經歷案場名稱、案場類型(如：住宅、商辦、廠辦、飯店等)：<br />
                  <code className="text-teal-700 font-mono font-bold">
                    員工編號 / 經歷案場名稱 / 案場類型 / 擔任職務 / 經歷年數
                  </code>
                </p>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectsParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {projectsParseError}
              </div>
            )}

            {/* Quick Fill Template */}
            <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-teal-900">範例格式 (點擊快速套用)：</span>
                <button
                  type="button"
                  onClick={() => {
                    setProjectsRawText(
                      `FG1001\t遠雄明德案\t大型住宅\t案主管\t2.5\nFG1001\t遠雄左岸紫金園\t大型住宅\t現場主任\t3.0\nFG1002\t遠雄金融中心\t中型商辦\t副主任\t2.0\nFG1002\t遠雄新未來\t中型住宅\t案主管\t2.2`
                    );
                  }}
                  className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[11px] transition-colors"
                >
                  填入範例資料
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto p-2 bg-white rounded border border-teal-200">
{`FG1001\t遠雄明德案\t大型住宅\t案主管\t2.5
FG1001\t遠雄左岸紫金園\t大型住宅\t現場主任\t3.0
FG1002\t遠雄金融中心\t中型商辦\t副主任\t2.0`}
              </pre>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                貼入經歷案場資料 (支援同工號多筆重複貼入)：
              </label>
              <textarea
                value={projectsRawText}
                onChange={(e) => setProjectsRawText(e.target.value)}
                placeholder="貼入範例：&#10;FG1001&#9;遠雄明德案&#9;大型住宅&#9;案主管&#9;2.5"
                rows={7}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStepModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleProcessProjectsImport}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                解析並預覽確認 (下一步)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRMATION MODAL 2-1-3: 案主管完案資料二次確認
         ======================================================== */}
      {confirmBatchModal === '2-1-3' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800">
                  步驟 2-1-3：資料確認與人選庫比對
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  確認經歷案場資料及員工編號比對
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  請確認以下解析之經歷案場清冊，系統已自動比對 2-1-1 案主管人選庫。
                </p>
              </div>
              <button onClick={() => setConfirmBatchModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matching Stats & Alerts */}
            {(() => {
              const unmatchedCount = projectsPreviewList.filter((d) => !d.isMatched).length;
              const matchedCount = projectsPreviewList.filter((d) => d.isMatched).length;

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      總解析案場：<strong className="font-mono text-slate-900">{projectsPreviewList.length}</strong> 筆
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      比對成功 (已在 2-1-1 人選庫)：<strong className="font-mono">{matchedCount}</strong> 筆
                    </span>
                    {unmatchedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        比對失敗 (未在 2-1-1 人選庫)：<strong className="font-mono">{unmatchedCount}</strong> 筆
                      </span>
                    )}
                  </div>

                  {unmatchedCount > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>員工編號比對錯誤警示：偵測到 {unmatchedCount} 筆專案資料無法與 2-1-1 已匯入之案主管人選庫名單比對！</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed pl-6">
                        未比對成功之員工編號在人選庫中找不到對應人選，將無法歸屬寫入。建議您：確認員工編號是否正確，或先至【步驟 2-1-1 從全域名單挑選匯入】將該人員加入人選庫。
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Preview Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl max-h-[360px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2 px-3 text-center">人選庫比對</th>
                    <th className="py-2 px-3">員工編號</th>
                    <th className="py-2 px-3">對應人選姓名 / 部門</th>
                    <th className="py-2 px-3">經歷案場名稱</th>
                    <th className="py-2 px-3">案場類型</th>
                    <th className="py-2 px-3">擔任職務</th>
                    <th className="py-2 px-3 text-right">經歷年數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap text-slate-700">
                  {projectsPreviewList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.isMatched ? 'hover:bg-teal-50/30' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                    >
                      <td className="py-2 px-3 text-center">
                        {item.isMatched ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> 已比對
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center justify-center gap-1 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> 未在 2-1-1
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-3 font-mono font-bold ${item.isMatched ? 'text-teal-700' : 'text-rose-700'}`}>
                        {item.empNo}
                      </td>
                      <td className="py-2 px-3">
                        {item.matchedCandidate ? (
                          <span className="font-semibold text-slate-900">
                            {item.matchedCandidate.name}{' '}
                            <span className="text-slate-500 text-[11px]">({item.matchedCandidate.department})</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 italic font-medium">⚠️ 人選庫無此人員</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.projectName}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium">{item.scaleType}</span>
                      </td>
                      <td className="py-2 px-3">{item.role || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">{item.periodYears ?? '-'} 年</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                返回修改文字
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmBatchModal(null);
                    setActiveStepModal(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  放棄匯入
                </button>
                <button
                  type="button"
                  onClick={handleCommitProjectsImport}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確認無誤，執行匯入 ({projectsPreviewList.filter((d) => d.isMatched).length} 筆有效)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2-1-4: 批次貼入人選庫人員考績資料
         ======================================================== */}
      {activeStepModal === '2-1-4' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  步驟 2-1-4
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Award className="w-5 h-5 text-amber-600" />
                  批次貼入人選庫人員考績資料 (支援多年度考績)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  以員工編號為基準，貼入各年度之考績等第或分數（如 2025、2024、2023、2022等）：<br />
                  <code className="text-amber-700 font-mono font-bold">
                    員工編號 / 考績年度 / 考績等第或分數
                  </code>
                </p>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {evalsParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {evalsParseError}
              </div>
            )}

            {/* Quick Fill Template */}
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900">範例格式 (點擊快速套用)：</span>
                <button
                  type="button"
                  onClick={() => {
                    setEvalsRawText(
                      `FG1001\t2025\t甲上\nFG1001\t2024\t甲\nFG1001\t2023\t甲\nFG1002\t2025\t甲\nFG1002\t2024\t乙上\nFG1002\t2023\t甲\nFG1003\t2025\t優\nFG1003\t2024\t甲上`
                    );
                  }}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition-colors"
                >
                  填入範例資料
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto p-2 bg-white rounded border border-amber-200">
{`FG1001\t2025\t甲上
FG1001\t2024\t甲
FG1001\t2023\t甲
FG1002\t2025\t甲`}
              </pre>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                貼入多年度考績資料 (同一員工可貼入多列不同年度考績)：
              </label>
              <textarea
                value={evalsRawText}
                onChange={(e) => setEvalsRawText(e.target.value)}
                placeholder="貼入範例：&#10;FG1001&#9;2025&#9;甲上&#10;FG1001&#9;2024&#9;甲"
                rows={7}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStepModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleProcessEvalsImport}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                解析並預覽確認 (下一步)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRMATION MODAL 2-1-4: 考績資料二次確認
         ======================================================== */}
      {confirmBatchModal === '2-1-4' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  步驟 2-1-4：資料確認與人選庫比對
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <Award className="w-5 h-5 text-amber-600" />
                  確認考績資料及員工編號比對
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  請確認以下解析之考績資料，系統已自動比對 2-1-1 案主管人選庫名單。
                </p>
              </div>
              <button onClick={() => setConfirmBatchModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matching Stats & Alerts */}
            {(() => {
              const unmatchedCount = evalsPreviewList.filter((d) => !d.isMatched).length;
              const matchedCount = evalsPreviewList.filter((d) => d.isMatched).length;

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      總解析考績：<strong className="font-mono text-slate-900">{evalsPreviewList.length}</strong> 筆
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      比對成功 (已在 2-1-1 人選庫)：<strong className="font-mono">{matchedCount}</strong> 筆
                    </span>
                    {unmatchedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        比對失敗 (未在 2-1-1 人選庫)：<strong className="font-mono">{unmatchedCount}</strong> 筆
                      </span>
                    )}
                  </div>

                  {unmatchedCount > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>員工編號比對錯誤警示：偵測到 {unmatchedCount} 筆考績資料無法與 2-1-1 已匯入之案主管人選庫名單比對！</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed pl-6">
                        未比對成功之員工編號在人選庫中找不到對應人選，將無法寫入其考績記錄。建議您：確認員工編號是否正確，或先至【步驟 2-1-1 從全域名單挑選匯入】將該人員加入人選庫。
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Preview Table */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl max-h-[360px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2 px-3 text-center">人選庫比對</th>
                    <th className="py-2 px-3">員工編號</th>
                    <th className="py-2 px-3">對應人選姓名 / 部門</th>
                    <th className="py-2 px-3">考績年度</th>
                    <th className="py-2 px-3">考績等第 / 分數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap text-slate-700">
                  {evalsPreviewList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.isMatched ? 'hover:bg-amber-50/30' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                    >
                      <td className="py-2 px-3 text-center">
                        {item.isMatched ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> 已比對
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center justify-center gap-1 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> 未在 2-1-1
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-3 font-mono font-bold ${item.isMatched ? 'text-amber-700' : 'text-rose-700'}`}>
                        {item.empNo}
                      </td>
                      <td className="py-2 px-3">
                        {item.matchedCandidate ? (
                          <span className="font-semibold text-slate-900">
                            {item.matchedCandidate.name}{' '}
                            <span className="text-slate-500 text-[11px]">({item.matchedCandidate.department})</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 italic font-medium">⚠️ 人選庫無此人員</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold">{item.year} 年</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-xs">
                          {item.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                返回修改文字
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmBatchModal(null);
                    setActiveStepModal(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  放棄匯入
                </button>
                <button
                  type="button"
                  onClick={handleCommitEvalsImport}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確認無誤，執行匯入 ({evalsPreviewList.filter((d) => d.isMatched).length} 筆有效)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 編輯單一人選資料
         ======================================================== */}
      {activeStepModal === 'edit_single' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                編輯候選人資料 · {formData.name} ({formData.empNo})
              </h3>
              <button
                onClick={() => setActiveStepModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingCandidate) {
                  updateCandidate(editingCandidate.empNo, formData);
                  setActiveStepModal(null);
                }
              }}
              className="space-y-3"
            >
              {/* 主管照片設定 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-slate-200 shrink-0 shadow-xs">
                  <img
                    src={formData.photoUrl || (editingCandidate ? getCandidatePhoto(editingCandidate) : '')}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      主管照片設定
                    </label>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        清除自訂照片
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>上傳圖檔</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setFormData({ ...formData, photoUrl: reader.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="或貼入圖片網址 (URL)..."
                      value={formData.photoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] border border-slate-300 rounded-md bg-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">員工編號</label>
                  <input
                    type="text"
                    disabled
                    value={formData.empNo}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">部室</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">科案</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">職等</label>
                  <input
                    type="text"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">職稱</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">人選分類</label>
                  <select
                    value={formData.candidateCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, candidateCategory: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                  >
                    <option value="現任主管">現任主管</option>
                    <option value="曾任主管">曾任主管</option>
                    <option value="儲備主管">儲備主管</option>
                    <option value="儲備幹部">儲備幹部</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    遠營年資起算日 (YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={formData.seniorityStartDate || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const calculatedSeniority = newDate
                        ? calculateYearsDifference(newDate, '2026-06-17', 2)
                        : formData.farglorySeniorityYears;
                      setFormData({
                        ...formData,
                        seniorityStartDate: newDate,
                        farglorySeniorityYears: calculatedSeniority,
                      });
                    }}
                    placeholder="例如：2012-09-01"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1">
                    內部管理年資起算日 (YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={formData.internalMgmtStartDate || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const calculatedMgmtYears = newDate
                        ? calculateYearsDifference(newDate, '2026-06-17', 2)
                        : formData.internalMgmtYears;
                      setFormData({
                        ...formData,
                        internalMgmtStartDate: newDate,
                        internalMgmtYears: calculatedMgmtYears,
                      });
                    }}
                    placeholder="例如：2019-03-01"
                    className="w-full px-3 py-1.5 text-xs border border-indigo-300 bg-indigo-50/30 rounded-lg font-mono outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">遠營年資(年)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.farglorySeniorityYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        farglorySeniorityYears: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1">
                    內部管理年資(年)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.internalMgmtYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        internalMgmtYears: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-indigo-300 bg-indigo-50/30 font-bold text-indigo-700 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">完案數</label>
                  <input
                    type="number"
                    value={formData.completedProjectsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        completedProjectsCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">釋出狀態</label>
                <select
                  value={formData.releaseStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, releaseStatus: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                >
                  <option value="現任主管-尚未達釋出條件">現任主管-尚未達釋出條件</option>
                  <option value="現任主管-已達標準釋出">現任主管-已達標準釋出</option>
                  <option value="現任主管-已達使照提前釋出">現任主管-已達使照提前釋出</option>
                  <option value="現任主管-已達下架啟動釋出">現任主管-已達下架啟動釋出</option>
                  <option value="曾任主管-可列入遴選評估">曾任主管-可列入遴選評估</option>
                  <option value="儲備主管-待任用評估">儲備主管-待任用評估</option>
                  <option value="儲備幹部-待任用評估">儲備幹部-待任用評估</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">標準釋出日</label>
                  <input
                    type="text"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">釋出季度</label>
                  <input
                    type="text"
                    value={formData.releaseQuarter}
                    onChange={(e) => setFormData({ ...formData, releaseQuarter: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStepModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  儲存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 單人快速更換照片 (quick_photo)
         ======================================================== */}
      {activeStepModal === 'quick_photo' && quickPhotoCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    更換主管個人照片
                  </h3>
                  <p className="text-xs text-slate-500">
                    {quickPhotoCand.name} · {quickPhotoCand.empNo} ({quickPhotoCand.department || '無部室'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStepModal(null);
                  setQuickPhotoCand(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center py-2 space-y-3">
              {/* 大尺寸預覽照片 */}
              <div className="relative w-28 h-36 rounded-xl overflow-hidden border-2 border-purple-200 shadow-md bg-slate-100 group">
                <img
                  src={quickPhotoInput || getCandidatePhoto(quickPhotoCand)}
                  alt={quickPhotoCand.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div
                  onClick={() => singlePhotoFileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-semibold">點擊更換圖檔</span>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={singlePhotoFileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (reader.result) {
                        setQuickPhotoInput(reader.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="w-full space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => singlePhotoFileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>上傳本機圖檔</span>
                  </button>
                  {quickPhotoInput && (
                    <button
                      type="button"
                      onClick={() => setQuickPhotoInput('')}
                      className="py-2 px-3 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      title="恢復預設大頭照"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    或直接輸入外部照片網址 (URL)：
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={quickPhotoInput}
                    onChange={(e) => setQuickPhotoInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveStepModal(null);
                  setQuickPhotoCand(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPhoto}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                確認儲存照片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 整批匯入案主管照片 (batch_photos)
         ======================================================== */}
      {activeStepModal === 'batch_photos' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 text-slate-800 max-h-[92vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                    照片批次匯入中心
                  </span>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    整批匯入案主管照片
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  支援「批次選取本機圖檔 (智慧檔名精準對應)」與「Excel 複製兩欄貼上網址」兩種整批匯入模式
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStepModal(null);
                  setPhotoBatchSuccessMsg(null);
                  setPhotoBatchErrorMsg(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPhotoImportTab('files');
                  setPhotoBatchErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  photoImportTab === 'files'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FolderUp className="w-4 h-4" />
                <span>① 本機圖檔批次上傳 (推薦 · 智慧檔名對應)</span>
                {photoFilesList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {photoFilesList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhotoImportTab('urls');
                  setPhotoBatchErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  photoImportTab === 'urls'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>② Excel 複製欄位貼上網址</span>
                {photoUrlsPreviewList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {photoUrlsPreviewList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Notification messages */}
            {photoBatchErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{photoBatchErrorMsg}</span>
              </div>
            )}
            {photoBatchSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 shrink-0 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{photoBatchSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* TAB 1: 圖檔批次上傳 (智慧檔名對應) */}
              {photoImportTab === 'files' && (
                <div className="space-y-4">
                  {/* Detailed Operation Instructions Card */}
                  <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold flex items-center gap-2 text-purple-900 text-sm">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>【本機圖檔批次匯入】作業方式說明：</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
                      <li>
                        <strong>檔案命名規則：</strong>請將照片圖檔命名為主管的<strong>「工號」</strong>（如 <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-purple-900 font-bold">FG1002.jpg</code>）、或<strong>「姓名」</strong>（如 <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-bold">林柏宏.jpg</code>）、或<strong>「工號_姓名」</strong>（如 <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-purple-900 font-bold">FG1002_林柏宏.png</code>）。
                      </li>
                      <li>
                        <strong>支援多檔選取：</strong>點擊下方大按鈕，於檔案對話框中按 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]">Ctrl+A</kbd> 或框選多張照片一次開啟（支援 JPG, PNG, WEBP, GIF）。
                      </li>
                      <li>
                        <strong>智慧自動配對：</strong>系統會自動解析檔名並與人選庫候選人比對，即時產生縮圖預覽與配對人員。
                      </li>
                      <li>
                        <strong>可手動校正指派：</strong>若檔名有打錯未自動匹配，可在預覽列表的下拉選單中直接指定對應主管。
                      </li>
                      <li>
                        <strong>確認整批套用：</strong>點擊右下方「確認整批套用」，即可同步儲存至候選人人選庫、人才庫總表、PK 評比與開案計畫！
                      </li>
                    </ul>
                  </div>

                  {/* Drop / Select Zone */}
                  <div
                    onClick={() => batchPhotoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={batchPhotoFileInputRef}
                      className="hidden"
                      onChange={(e) => handlePhotoFilesSelect(e.target.files)}
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <FolderUp className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-sm text-slate-800 group-hover:text-purple-700">
                        點擊選擇多張照片圖檔（支援批次多選）
                      </div>
                      <p className="text-xs text-slate-500">
                        支援 JPG、PNG、WEBP 等常見圖片格式，檔名請以主管工號或姓名命名
                      </p>
                    </div>
                  </div>

                  {isReadingFiles && (
                    <div className="py-4 text-center text-xs text-purple-600 flex items-center justify-center gap-2 font-medium">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>正在讀取並解析圖檔中，請稍候...</span>
                    </div>
                  )}

                  {/* Uploaded Files Table / Grid */}
                  {photoFilesList.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-700">
                          已讀取 <span className="text-purple-600 font-mono font-extrabold">{photoFilesList.length}</span> 張照片
                          （成功匹配{' '}
                          <span className="text-emerald-600 font-mono font-extrabold">
                            {photoFilesList.filter((i) => i.isMatched).length}
                          </span>{' '}
                          位主管，
                          <span className="text-amber-600 font-mono font-extrabold">
                            {photoFilesList.filter((i) => !i.isMatched).length}
                          </span>{' '}
                          筆待確認）
                        </div>
                        <button
                          type="button"
                          onClick={() => setPhotoFilesList([])}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        >
                          清空已選清單
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                        {photoFilesList.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                                <img
                                  src={item.dataUrl}
                                  alt={item.fileName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {item.fileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.fileSizeKb} KB
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.isMatched ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      已精準對應：{item.matchedEmpNo} {item.matchedName} ({item.currentTitle || item.currentDept || '案主管'})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      檔名未自動對應，請下拉手動指定
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Manual Assign Select */}
                              <select
                                value={item.matchedEmpNo || ''}
                                onChange={(e) => handleAssignCandToFile(item.id, e.target.value)}
                                className={`text-xs py-1.5 px-2.5 rounded-lg border outline-none font-medium ${
                                  item.isMatched
                                    ? 'border-slate-300 bg-slate-50 text-slate-700'
                                    : 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                                }`}
                              >
                                <option value="">-- 手動指定主管 --</option>
                                {candidates.map((c) => (
                                  <option key={c.empNo} value={c.empNo}>
                                    {c.empNo} {c.name} ({c.title || c.department})
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemovePhotoFile(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="移除此照片"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Excel 貼上網址 */}
              {photoImportTab === 'urls' && (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold flex items-center justify-between text-blue-900 text-sm">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span>【Excel 複製貼上網址】作業方式說明：</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFillPhotoUrlsExample}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-300 text-xs transition-colors cursor-pointer"
                      >
                        填入範例資料測試
                      </button>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
                      <li>
                        <strong>支援兩欄格式：</strong><code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 font-bold">員工編號 [Tab] 照片網址URL</code>
                      </li>
                      <li>
                        <strong>支援三欄格式：</strong><code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 font-bold">員工編號 [Tab] 姓名 [Tab] 照片網址URL</code>
                      </li>
                      <li>直接在 Excel 中選取兩欄或三欄範圍，按 <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]">Ctrl+C</kbd> 複製後貼入下方欄位，點擊「解析網址資料」進行比對。</li>
                    </ul>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        貼入 Excel 複製內容：
                      </label>
                      {photoUrlsRawText && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrlsRawText('');
                            setPhotoUrlsPreviewList([]);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          清除文字
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={photoUrlsRawText}
                      onChange={(e) => setPhotoUrlsRawText(e.target.value)}
                      placeholder={`範例格式：\nFG1002\t林柏宏\thttps://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=380&fit=crop&crop=face\nFG1008\t李俊毅\thttps://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=380&fit=crop&crop=face`}
                      className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleParsePhotoUrls}
                        className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        解析網址資料
                      </button>
                    </div>
                  </div>

                  {/* Preview of Parsed URLs */}
                  {photoUrlsPreviewList.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        解析結果：共 <span className="text-purple-600 font-mono">{photoUrlsPreviewList.length}</span> 筆
                        （成功比對到候選人：
                        <span className="text-emerald-600 font-mono">
                          {photoUrlsPreviewList.filter((d) => d.isMatched).length}
                        </span>{' '}
                        筆）
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-60 overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 w-16 text-center">預覽</th>
                              <th className="py-2 px-3 w-28">工號 / 姓名</th>
                              <th className="py-2 px-3">照片網址</th>
                              <th className="py-2 px-3 w-28 text-center">比對狀態</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {photoUrlsPreviewList.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="py-1.5 px-3 text-center">
                                  <div className="w-8 h-10 rounded overflow-hidden border border-slate-200 bg-slate-100 mx-auto">
                                    <img
                                      src={item.photoUrl}
                                      alt={item.empNo}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </td>
                                <td className="py-1.5 px-3">
                                  <span className="font-mono font-bold text-blue-600">{item.empNo}</span>
                                  {item.matchedCandidate?.name && (
                                    <span className="ml-1.5 font-bold text-slate-800">
                                      {item.matchedCandidate.name}
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-xs">
                                  {item.photoUrl}
                                </td>
                                <td className="py-1.5 px-3 text-center">
                                  {item.isMatched ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      匹配成功
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      無此人選
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveStepModal(null);
                  setPhotoBatchSuccessMsg(null);
                  setPhotoBatchErrorMsg(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                關閉視窗
              </button>

              <div className="flex items-center gap-2">
                {photoImportTab === 'files' ? (
                  <button
                    type="button"
                    onClick={handleApplyBatchPhotoFiles}
                    disabled={photoFilesList.filter((i) => i.isMatched).length === 0}
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      確認整批套用 (已匹配{' '}
                      {photoFilesList.filter((i) => i.isMatched).length} 位主管)
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyBatchPhotoUrls}
                    disabled={photoUrlsPreviewList.filter((i) => i.isMatched).length === 0}
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      確認整批套用 (已匹配{' '}
                      {photoUrlsPreviewList.filter((i) => i.isMatched).length} 位主管)
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
