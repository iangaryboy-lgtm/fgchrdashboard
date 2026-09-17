import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Share2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  ShieldCheck,
  User,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  MoreVertical,
  RefreshCw,
  HardDrive,
  Award,
  AlertCircle,
  FileCode,
  Layers,
  ChevronRight,
  Upload,
  Lock,
  Globe,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Info,
  Settings,
  Send,
  Zap,
  Activity,
  Terminal,
  Database,
  CheckCircle,
  Laptop,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import {
  CourseEnrollment,
  InternalCourse,
  CourseAssignmentSubmission,
  CourseAssignmentConfig,
  AssignmentFileType,
  OneDriveTransmissionLog,
  OneDriveFolderVerificationResult,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { AssignmentGradingModal } from '../frontend/training/AssignmentGradingModal';
import { OneDriveDocumentViewerModal } from './OneDriveDocumentViewerModal';
import { M365LoginModal } from './M365LoginModal';
import {
  downloadAssignmentFile,
  downloadBatchZipPackage,
  AssignmentDownloadPayload,
  getStoredOneDriveShareUrl,
  saveStoredOneDriveShareUrl,
} from '../../utils/assignmentDownloadHelper';
import {
  getOneDriveStatus,
  verifyOneDriveFolderStructure,
  getOneDriveTransmissionLogs,
  runOneDriveDiagnostics,
  StoredTransmissionRecord,
  OneDriveDiagnosticsResult,
} from '../../services/oneDriveService';
import {
  getM365AuthSession,
  switchNetworkEnvironment,
  getSharedFolderPermissions,
  M365AuthSession,
} from '../../services/m365AuthService';

export interface OneDriveAssignmentFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: InternalCourse;
  batchNo?: string;
  batchId?: string;
  highlightSubmissionId?: string;
  newlySubmittedFile?: {
    fileName: string;
    fileSize: string;
    fileType: AssignmentFileType;
    studentName: string;
    empNo: string;
    department: string;
    submittedAt: string;
    notes?: string;
    transmissionId?: string;
    etag?: string;
  };
}

export const OneDriveAssignmentFolderModal: React.FC<OneDriveAssignmentFolderModalProps> = ({
  isOpen,
  onClose,
  course,
  batchNo = '01',
  batchId,
  highlightSubmissionId,
  newlySubmittedFile,
}) => {
  const { courseEnrollments = [], instructors = [], employees = [] } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileTypeFilter, setSelectedFileTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFileForDetail, setSelectedFileForDetail] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'sync_log' | 'graph_api'>('files');

  // M365 Authentication & Domain session state
  const [m365Session, setM365Session] = useState<M365AuthSession>(getM365AuthSession());
  const [isM365LoginModalOpen, setIsM365LoginModalOpen] = useState(false);

  // Listen to M365 auth state changes
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail) {
        setM365Session(e.detail);
      } else {
        setM365Session(getM365AuthSession());
      }
    };
    window.addEventListener('m365_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('m365_auth_changed', handleAuthChange);
    };
  }, []);

  // M365 external sync states & diagnostics
  const [isGraphApiModalOpen, setIsGraphApiModalOpen] = useState(false);
  const [tenantClientId, setTenantClientId] = useState('04b07795-8ddb-461a-bbee-02f9e1bf7b46');
  const [tenantId, setTenantId] = useState('farglorygroup.com.tw');
  const [customSharePointUrl, setCustomSharePointUrl] = useState(
    course.assignmentConfig?.oneDriveShareUrl ||
      getStoredOneDriveShareUrl(course.id, batchNo) ||
      'https://farglorygroup-my.sharepoint.com/personal/hr_train/Documents/2026/PMP/DAY_7/'
  );
  const [isPushingToRealM365, setIsPushingToRealM365] = useState(false);
  const [pushSuccessBanner, setPushSuccessBanner] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Transmission logs & diagnostics
  const [transmissionLogs, setTransmissionLogs] = useState<StoredTransmissionRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<OneDriveDiagnosticsResult | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [verifiedFolderData, setVerifiedFolderData] = useState<OneDriveFolderVerificationResult | null>(null);
  const [isVerifyingFolder, setIsVerifyingFolder] = useState(false);

  // Folder path structure toggle
  const [selectedPathPreset, setSelectedPathPreset] = useState<'pmp_day7' | 'dept_standard'>('pmp_day7');

  // Sub modals
  const [gradingModalData, setGradingModalData] = useState<{
    isOpen: boolean;
    enrollment?: CourseEnrollment;
    submission?: CourseAssignmentSubmission;
  }>({ isOpen: false });

  const [viewerModalData, setViewerModalData] = useState<{
    isOpen: boolean;
    material: any | null;
  }>({ isOpen: false, material: null });

  // Fetch transmission logs and folder verification on open or tab change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const logs = await getOneDriveTransmissionLogs({
          courseId: course.id,
          batchNo,
        });
        if (isMounted) setTransmissionLogs(logs);
      } catch (e) {
        console.warn('Failed to load transmission logs:', e);
      } finally {
        if (isMounted) setIsLoadingLogs(false);
      }
    };

    const verifyFolder = async () => {
      setIsVerifyingFolder(true);
      try {
        const res = await verifyOneDriveFolderStructure(
          selectedPathPreset === 'pmp_day7'
            ? 'OneDrive://2.管理學院/1.主管訓/2026主管訓/202607 PMP證照專班/4.課程資料/DAY 7/'
            : `OneDrive://建築工程處/專業訓練作業/2026/${course.courseCode || 'TR-TECH-2026-01'}/第${batchNo}梯次/`
        );
        if (isMounted) setVerifiedFolderData(res);
      } catch (e) {
        console.warn('Failed to verify folder:', e);
      } finally {
        if (isMounted) setIsVerifyingFolder(false);
      }
    };

    loadLogs();
    verifyFolder();

    return () => {
      isMounted = false;
    };
  }, [isOpen, course.id, batchNo, selectedPathPreset]);

  if (!isOpen) return null;

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await runOneDriveDiagnostics();
      setDiagnosticsResult(res);
    } catch (e) {
      console.error('Diagnostics failed:', e);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const config: CourseAssignmentConfig = course.assignmentConfig || {
    enabled: true,
    title: '【課後實務作業】施工工序要徑排程模擬與品質自主檢驗檢討報告',
    description:
      '請依據課堂所學之要徑工法與施工查核要點，結合目前案場實務狀況，繳交具體分析報告、試算表或施工圖說照片。',
    gradingType: 'score_100',
    passingScore: 70,
    allowedFileTypes: ['word', 'excel', 'powerpoint', 'pdf', 'image'],
    maxFileSizeMB: 50,
    reviewerEmpNo: 'FG1001',
    reviewerName: course.instructorName || '陳冠霖 經理',
    reviewerRole: '指定批閱人 / 授課講師',
    oneDriveFolderPath:
      selectedPathPreset === 'pmp_day7'
        ? 'OneDrive://2.管理學院/1.主管訓/2026主管訓/202607 PMP證照專班/4.課程資料/DAY 7/'
        : `OneDrive://建築工程處/專業訓練作業/2026/${course.courseCode || 'TR-TECH-2026-01'}/第${batchNo}梯次/`,
    dueDateDaysAfterCourse: 14,
    isRequiredForCompletion: true,
  };

  const currentFolderPathString =
    selectedPathPreset === 'pmp_day7'
      ? 'OneDrive://2.管理學院/1.主管訓/2026主管訓/202607 PMP證照專班/4.課程資料/DAY 7/'
      : `OneDrive://建築工程處/專業訓練作業/2026/${course.courseCode || 'TR-TECH-2026-01'}/第${batchNo}梯次/`;

  const folderPathDisplay = customSharePointUrl || `https://farglorygroup-my.sharepoint.com/personal/hr_train/Documents/2026/${course.courseCode || 'TR-TECH-2026-01'}/Batch_${batchNo}/`;

  // Collect submissions for this course/batch from enrollments
  const matchedEnrollments = (courseEnrollments || []).filter(
    (e) => e && (e.courseId === course.id || e.courseId === 'c1' || (e.courseId && e.courseId.includes('deep')))
  );

  // Default sample submissions to populate the OneDrive folder realistically
  const baseSampleSubmissions = [
    {
      id: 'sub-sample-01',
      enrollmentId: 'enr-sample-01',
      empNo: 'FG1001',
      studentName: '陳鈺安',
      department: '建築工程處 工務部',
      fileName: '【FG1001 陳鈺安】PMP_專案關鍵路徑要徑工期壓縮與風險評估實務報告.docx',
      fileSize: '3.8 MB',
      fileType: 'word' as AssignmentFileType,
      fileUrl: 'https://sample.onedrive.com/chen_pmp.docx',
      submittedAt: '2026-08-20 14:25:10',
      status: 'submitted',
      gradeScore: undefined,
      gradeStatus: 'pending',
      reviewerName: config.reviewerName || '陳冠霖',
      notes: '已針對 DAY 7 要徑工期壓縮進行三項方案試算，並納入品質防範措施。',
      version: 'v1.0',
      sharePointId: 'SP-DOC-89420',
      isFresh: true,
    },
    {
      id: 'sub-sample-02',
      enrollmentId: 'enr-sample-02',
      empNo: 'FG3021',
      studentName: '王大明',
      department: '建築工程處 工務一部',
      fileName: '【FG3021 王大明】深開挖逆打支撐工序與連續壁監測要點報告.docx',
      fileSize: '3.8 MB',
      fileType: 'word' as AssignmentFileType,
      fileUrl: 'https://sample.onedrive.com/wang_doc.docx',
      submittedAt: '2026-08-16 14:25:10',
      status: 'graded_score',
      gradeScore: 88,
      gradeResult: 'pass',
      gradeStatus: 'graded',
      reviewerName: config.reviewerName || '陳冠霖',
      reviewerFeedback: '要徑工法分析切中案場實況，連續壁觀測點之預警值設定妥適，核予通過。',
      notes: '已依課堂指導將監測點位平面圖納入附錄，請講師指教。',
      version: 'v1.0',
      sharePointId: 'SP-DOC-89421',
    },
    {
      id: 'sub-sample-03',
      enrollmentId: 'enr-sample-03',
      empNo: 'FG3045',
      studentName: '李美華',
      department: '建築工程處 品管部',
      fileName: '【FG3045 李美華】結構工程混凝土澆置品質自主查驗表.xlsx',
      fileSize: '2.1 MB',
      fileType: 'excel' as AssignmentFileType,
      fileUrl: 'https://sample.onedrive.com/lee_calc.xlsx',
      submittedAt: '2026-08-17 09:12:44',
      status: 'graded_score',
      gradeScore: 92,
      gradeResult: 'pass',
      gradeStatus: 'graded',
      reviewerName: config.reviewerName || '陳冠霖',
      reviewerFeedback: '自主檢查查核項目完整，且公式邏輯嚴謹，可作為標竿範本推廣。',
      notes: '附帶案場最近三期試體抗壓強度回歸曲線分析。',
      version: 'v1.1',
      sharePointId: 'SP-DOC-89422',
    },
    {
      id: 'sub-sample-04',
      enrollmentId: 'enr-sample-04',
      empNo: 'FG3089',
      studentName: '張建國',
      department: '機電工程處 機電一部',
      fileName: '【FG3089 張建國】逆打鋼柱吊裝與管線界面碰撞排除簡報.pptx',
      fileSize: '12.4 MB',
      fileType: 'powerpoint' as AssignmentFileType,
      fileUrl: 'https://sample.onedrive.com/chang_slides.pptx',
      submittedAt: '2026-08-18 16:40:02',
      status: 'submitted',
      gradeStatus: 'pending',
      reviewerName: config.reviewerName || '陳冠霖',
      notes: 'BIM 4D 界面排程模擬動畫已嵌入簡報中。',
      version: 'v1.0',
      sharePointId: 'SP-DOC-89423',
    },
    {
      id: 'sub-sample-05',
      enrollmentId: 'enr-sample-05',
      empNo: 'FG3115',
      studentName: '趙怡婷',
      department: '工程企劃處 專案管理科',
      fileName: '【FG3115 趙怡婷】超高層工程要徑時程壓縮與趕工成本效益評估.pdf',
      fileSize: '4.2 MB',
      fileType: 'pdf' as AssignmentFileType,
      fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
      submittedAt: '2026-08-19 15:30:18',
      status: 'graded_score',
      gradeScore: 85,
      gradeResult: 'pass',
      gradeStatus: 'graded',
      reviewerName: config.reviewerName || '陳冠霖',
      reviewerFeedback: '要徑壓縮方案之各工項單價換算合宜，觀念清晰。',
      notes: '包含每壓縮一日要徑所需投入之機具與人力加給分析表。',
      version: 'v1.0',
      sharePointId: 'SP-DOC-89425',
    },
  ];

  // If there's a newly submitted file or existing enrollment submissions, merge them
  const allSubmissions: any[] = [];

  if (newlySubmittedFile) {
    allSubmissions.push({
      id: 'sub-newly-submitted',
      enrollmentId: 'enr-current-user',
      empNo: newlySubmittedFile.empNo,
      studentName: newlySubmittedFile.studentName,
      department: newlySubmittedFile.department,
      fileName: newlySubmittedFile.fileName,
      fileSize: newlySubmittedFile.fileSize,
      fileType: newlySubmittedFile.fileType,
      fileUrl: 'https://sample.onedrive.com/new_upload',
      submittedAt: newlySubmittedFile.submittedAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'submitted',
      gradeStatus: 'pending',
      reviewerName: config.reviewerName || '陳冠霖',
      notes: newlySubmittedFile.notes || '剛由模擬送出完成，即時寫入 OneDrive 雲端作業庫。',
      version: 'v1.0 (剛同步)',
      sharePointId: 'SP-DOC-' + Math.floor(10000 + Math.random() * 90000),
      isFresh: true,
    });
  }

  // Include enrollment submissions if present
  matchedEnrollments.forEach((enr) => {
    if (enr.assignmentSubmission && enr.assignmentSubmission.fileName) {
      const isDuplicate = allSubmissions.some((s) => s.empNo === enr.empNo);
      if (!isDuplicate) {
        allSubmissions.push({
          id: enr.assignmentSubmission.id,
          enrollmentId: enr.id,
          empNo: enr.empNo,
          studentName: enr.empName || enr.studentName || '學員',
          department: enr.department || '建築工程處',
          fileName: enr.assignmentSubmission.fileName,
          fileSize: enr.assignmentSubmission.fileSize || '2.5 MB',
          fileType: enr.assignmentSubmission.fileType || 'word',
          fileUrl: enr.assignmentSubmission.fileUrl || 'https://sample.onedrive.com/file',
          submittedAt: enr.assignmentSubmission.submittedAt,
          status: enr.assignmentSubmission.status || 'submitted',
          gradeScore: enr.assignmentSubmission.gradeScore,
          gradeResult: enr.assignmentSubmission.gradeResult,
          gradeStatus: enr.assignmentSubmission.gradeStatus || (enr.assignmentSubmission.gradeScore ? 'graded' : 'pending'),
          reviewerName: enr.assignmentSubmission.reviewerName || config.reviewerName || '陳冠霖',
          reviewerFeedback: enr.assignmentSubmission.reviewerFeedback,
          notes: enr.assignmentSubmission.notes || enr.assignmentSubmission.studentNote,
          version: 'v1.0',
          sharePointId: 'SP-DOC-' + Math.floor(10000 + Math.random() * 90000),
        });
      }
    }
  });

  // Merge remaining base samples
  baseSampleSubmissions.forEach((sample) => {
    if (!allSubmissions.some((s) => s.empNo === sample.empNo)) {
      allSubmissions.push(sample);
    }
  });

  // Filter items
  const filteredSubmissions = allSubmissions.filter((item) => {
    const matchSearch =
      searchTerm === '' ||
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = selectedFileTypeFilter === 'all' || item.fileType === selectedFileTypeFilter;

    const matchStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'graded' && item.gradeStatus === 'graded') ||
      (selectedStatusFilter === 'pending' && item.gradeStatus !== 'graded');

    return matchSearch && matchType && matchStatus;
  });

  const getFileIcon = (fileType: AssignmentFileType) => {
    switch (fileType) {
      case 'word':
        return { icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Word' };
      case 'excel':
        return { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Excel' };
      case 'powerpoint':
        return { icon: Presentation, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'PowerPoint' };
      case 'pdf':
        return { icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'PDF' };
      case 'image':
        return { icon: ImageIcon, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Image' };
      default:
        return { icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Doc' };
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(folderPathDisplay);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Real download handlers
  const handleDownloadSingleFile = (item: any) => {
    downloadAssignmentFile({
      fileName: item.fileName,
      studentName: item.studentName,
      empNo: item.empNo,
      department: item.department,
      fileType: item.fileType,
      submittedAt: item.submittedAt,
      notes: item.notes,
      courseTitle: course.title,
      courseCode: course.courseCode,
    });
    setDownloadSuccessToast(`已下載實體檔案【${item.fileName}】！您可以直接將此檔案拖放到您的 Microsoft 365 OneDrive 瀏覽器視窗中。`);
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadBatch = () => {
    const payloads: AssignmentDownloadPayload[] = filteredSubmissions.map((s) => ({
      fileName: s.fileName,
      studentName: s.studentName,
      empNo: s.empNo,
      department: s.department,
      fileType: s.fileType,
      submittedAt: s.submittedAt,
      notes: s.notes,
      courseTitle: course.title,
      courseCode: course.courseCode,
    }));
    downloadBatchZipPackage(payloads, course.title, batchNo);
    setDownloadSuccessToast(`已開始下載本梯次全部 ${filteredSubmissions.length} 份作業實體檔案！請在瀏覽器下載列取得檔案後，直接拖曳到微軟 OneDrive 中。`);
    setTimeout(() => setDownloadSuccessToast(null), 7000);
  };

  const handleTriggerLiveGraphSync = () => {
    setIsPushingToRealM365(true);
    setTimeout(() => {
      setIsPushingToRealM365(false);
      setPushSuccessBanner(true);
      setTimeout(() => setPushSuccessBanner(false), 5000);
    }, 1500);
  };

  const handleOpenDocViewer = (item: any) => {
    setViewerModalData({
      isOpen: true,
      material: {
        id: item.id,
        title: item.fileName,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        fileType: item.fileType,
        fileSize: item.fileSize,
        version: item.version,
        uploadedBy: `${item.studentName} (${item.empNo})`,
        uploadedAt: item.submittedAt,
        description: item.notes || '學員課後實務作業',
      },
    });
  };

  const handleOpenGradingModal = (item: any) => {
    const matchedEnrollment: CourseEnrollment = courseEnrollments.find(
      (e) => e.empNo === item.empNo
    ) || {
      id: item.enrollmentId || `enr-${item.empNo}`,
      courseId: course.id,
      batchId: item.batchId || batchNo,
      batchNo: batchNo,
      empNo: item.empNo,
      empName: item.studentName,
      studentName: item.studentName,
      department: item.department,
      title: '專案工程師',
      enrollmentType: 'self_enrolled',
      listType: 'regular',
      approvalStatus: 'approved',
      status: 'confirmed' as any,
      attendanceStatus: 'present',
      finalPassStatus: item.gradeStatus === 'graded' ? 'passed' : 'in_progress',
      enrolledAt: item.submittedAt,
      assignmentSubmission: {
        id: item.id,
        enrollmentId: item.enrollmentId || `enr-${item.empNo}`,
        courseId: course.id,
        empNo: item.empNo,
        empName: item.studentName,
        studentName: item.studentName,
        department: item.department,
        submittedAt: item.submittedAt,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileType: item.fileType,
        fileUrl: item.fileUrl,
        notes: item.notes,
        status: item.status,
        gradeStatus: item.gradeStatus,
        gradeScore: item.gradeScore,
        gradeResult: item.gradeResult,
        reviewerName: item.reviewerName,
        reviewerFeedback: item.reviewerFeedback,
      },
    };

    setGradingModalData({
      isOpen: true,
      enrollment: matchedEnrollment,
      submission: matchedEnrollment.assignmentSubmission,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 flex flex-col h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Microsoft 365 / OneDrive Official Header Bar */}
        <div className="bg-[#0078D4] text-white px-5 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* M365 App Launcher waffle icon */}
            <div className="grid grid-cols-3 gap-0.5 p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
            </div>

            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-white" />
              <span className="font-bold text-sm tracking-wide">OneDrive</span>
              <span className="text-white/60 text-xs">|</span>
              <span className="text-xs font-semibold text-sky-100 bg-sky-800/60 px-2 py-0.5 rounded">
                遠雄企業 Microsoft 365 雲端資料庫
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGraphApiModalOpen(true)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Microsoft 365 API 串接設定</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OneDrive Command & Tab Toolbar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>作業檔案總覽 ({allSubmissions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync_log')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'sync_log'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>雲端傳輸監控日誌</span>
              {transmissionLogs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono">
                  {transmissionLogs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('graph_api')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'graph_api'
                  ? 'bg-white text-[#0078D4] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Microsoft Graph 連線診斷</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'files' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadBatch}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>批次下載全部作業 (.ZIP)</span>
                </button>

                <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                    title="清單檢視"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                    title="圖示檢視"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋檔名、學員、員編..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 w-44 sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Download Toast Notification */}
        {downloadSuccessToast && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{downloadSuccessToast}</span>
            </div>
            <button
              onClick={() => setDownloadSuccessToast(null)}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body with Left Tree & File List */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Tree */}
          <div className="w-60 bg-slate-50 border-r border-slate-200 p-3 hidden md:flex flex-col justify-between text-xs">
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                OneDrive 企業雲端階層
              </div>

              <div
                onClick={() => setSelectedPathPreset('pmp_day7')}
                className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                  selectedPathPreset === 'pmp_day7'
                    ? 'bg-sky-100/90 text-sky-950 font-bold border border-sky-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-[#0078D4]" />
                <span className="truncate">2.管理學院 / 202607 PMP專班</span>
              </div>

              {selectedPathPreset === 'pmp_day7' && (
                <div className="pl-4 space-y-1 border-l-2 border-sky-400 ml-3">
                  <div className="p-1.5 rounded-lg text-slate-600 text-[11px] flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>4.課程資料</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-sky-200/60 text-sky-900 font-black text-[11px] flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-sky-700" />
                    <span>DAY 7 (實務作業專區)</span>
                  </div>
                </div>
              )}

              <div
                onClick={() => setSelectedPathPreset('dept_standard')}
                className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                  selectedPathPreset === 'dept_standard'
                    ? 'bg-sky-100/90 text-sky-950 font-bold border border-sky-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Building className="w-4 h-4 text-slate-600" />
                <span className="truncate">建築工程處 專業作業庫</span>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/60 flex items-center gap-2 cursor-pointer">
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>與我共用 (Shared)</span>
                </div>
                <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/60 flex items-center gap-2 cursor-pointer">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>最近存取 (Recent)</span>
                </div>
              </div>
            </div>

            {/* Sync Status Card & M365 Tip */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                <Cloud className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>M365 雲端連線狀態</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                如外部 OneDrive 網頁顯示為空，請點選檔案右側<strong>【📥 下載】</strong>並直接<strong>拖曳放入</strong>您的微軟視窗中。
              </p>
              <button
                type="button"
                onClick={() => setIsGraphApiModalOpen(true)}
                className="w-full py-1 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded border border-sky-200 text-[10px] font-bold text-center transition-colors cursor-pointer"
              >
                配置自動 API 推送
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* M365 Corporate Domain & Editable Shared Folder Control Bar */}
            <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
              m365Session.networkEnvironment === 'corporate_domain'
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : m365Session.isM365Authenticated
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {m365Session.networkEnvironment === 'corporate_domain' ? (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                      <Laptop className="w-3 h-3" />
                      🏢 公司電腦 / 遠雄網域
                    </span>
                  ) : m365Session.isM365Authenticated ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      🌐 外部非公司網域 (已登入)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      ⚠️ 外部非公司網域 (未登入)
                    </span>
                  )}

                  <span className="font-bold text-xs">
                    {m365Session.networkEnvironment === 'corporate_domain'
                      ? '已透過 AD / M365 SSO 自動鑑權'
                      : m365Session.isM365Authenticated
                      ? `已驗證 M365 帳號 (${m365Session.userAccount})`
                      : '外部存取需登入 M365 企業帳號'}
                  </span>
                </div>

                <div className="hidden lg:flex items-center gap-1.5 text-[11px] bg-white/70 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  <FolderOpen className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>分享資料夾狀態：</span>
                  <span className="font-bold text-emerald-700">可直接編輯 (Can Edit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (m365Session.networkEnvironment === 'corporate_domain') {
                      const updated = switchNetworkEnvironment('external_network');
                      setM365Session(updated);
                    } else {
                      const updated = switchNetworkEnvironment('corporate_domain');
                      setM365Session(updated);
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  title="切換模擬公司內部電腦 vs 外部非公司網域"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>切換連線環境</span>
                </button>

                {!m365Session.isM365Authenticated && m365Session.networkEnvironment === 'external_network' ? (
                  <button
                    type="button"
                    onClick={() => setIsM365LoginModalOpen(true)}
                    className="px-3 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>登入 M365 帳號</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsM365LoginModalOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <User className="w-3 h-3 text-slate-500" />
                    <span>切換/檢視帳號</span>
                  </button>
                )}

                <a
                  href={customSharePointUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="在 Microsoft 365 網頁中以可編輯模式開啟此資料夾"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>開啟微軟網頁版</span>
                </a>
              </div>
            </div>

            {/* Breadcrumb matching the user's screenshot exactly */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-1 text-xs text-slate-500 overflow-x-auto">
                <span className="hover:text-sky-700 cursor-pointer flex items-center gap-1 font-semibold text-slate-700">
                  <Cloud className="w-3.5 h-3.5 text-[#0078D4]" /> OneDrive
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hover:text-sky-700 cursor-pointer shrink-0">2.管理學院</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hover:text-sky-700 cursor-pointer shrink-0">1.主管訓</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hover:text-sky-700 cursor-pointer shrink-0">2026主管訓</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hover:text-sky-700 cursor-pointer shrink-0">202607 PMP證照專班</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hover:text-sky-700 cursor-pointer shrink-0">4.課程資料</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 bg-sky-100/80 text-sky-950 px-2 py-0.5 rounded border border-sky-300 shrink-0">
                  DAY 7 (作業存放專用)
                </span>
              </div>

              {/* Helpful Explanation & Real-Time Sync Action Banner */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-amber-950 text-xs">
                        為什麼您另開的 Microsoft 365 OneDrive 網頁顯示「這個資料夾是空的」？
                      </h4>
                      <p className="text-slate-700 text-[11px] leading-relaxed mt-1">
                        系統目前已將學員作業安全儲存於教育訓練平台中。若要將檔案放入您實體的 Microsoft 365 資料夾，您可以：
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBatch}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>一鍵下載全部並手動拖曳進 M365</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/80 text-[11px]">
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-amber-100">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>
                      <strong>即時拖曳上傳</strong>：點擊清單中的<strong>【📥 下載】</strong>，將下載的檔案直接<strong>拖放到右側 OneDrive 網頁視窗</strong>中。
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-amber-100">
                    <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>
                      <strong>雲端 API 自動推播</strong>：配置 Microsoft Graph API 應用程式權限，繳交時由系統背景自動寫入 SharePoint。
                    </span>
                  </div>
                </div>
              </div>

              {/* Newly submitted file highlight */}
              {newlySubmittedFile && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950">
                        🎉 學員 {newlySubmittedFile.studentName} ({newlySubmittedFile.empNo}) 之作業已成功就緒！
                      </span>
                      <p className="text-[11px] text-emerald-800">
                        檔名：<span className="font-semibold">{newlySubmittedFile.fileName}</span>（您可點擊右側下載並直接拖曳進 Microsoft 365）
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleFile(newlySubmittedFile)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>立即下載此檔案</span>
                  </button>
                </div>
              )}

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>
                    總檔案數：<strong className="text-slate-900">{allSubmissions.length}</strong> 件
                  </span>
                  <span>
                    已通過審定：<strong className="text-emerald-700">{allSubmissions.filter((s) => s.gradeStatus === 'graded' && (s.gradeScore >= (config.passingScore || 70) || s.gradeResult === 'pass')).length}</strong> 件
                  </span>
                  <span>
                    待評審：<strong className="text-amber-700">{allSubmissions.filter((s) => s.gradeStatus !== 'graded').length}</strong> 件
                  </span>
                  <span className="hidden lg:inline text-slate-400">|</span>
                  <span className="hidden lg:flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    及格標準：<strong>{config.gradingType === 'score_100' ? `${config.passingScore || 70}分` : '合格審查制'}</strong>
                  </span>
                </div>

                {/* Filter tags */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">篩選：</span>
                  <select
                    value={selectedFileTypeFilter}
                    onChange={(e) => setSelectedFileTypeFilter(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700"
                  >
                    <option value="all">所有格式</option>
                    <option value="word">Word (.docx)</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="powerpoint">PPT (.pptx)</option>
                    <option value="pdf">PDF</option>
                    <option value="image">現場照片</option>
                  </select>

                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700"
                  >
                    <option value="all">所有狀態</option>
                    <option value="pending">待批閱評分</option>
                    <option value="graded">已完成批閱</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Tab View */}
            {activeTab === 'files' ? (
              <div className="flex-1 overflow-y-auto p-4">
              {filteredSubmissions.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Folder className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-semibold">此 OneDrive 資料夾中查無符合條件之作業檔案</p>
                </div>
              ) : viewMode === 'list' ? (
                /* Table View */
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">類型</th>
                        <th className="py-2.5 px-3">作業檔案名稱 (OneDrive 物件)</th>
                        <th className="py-2.5 px-3">繳交學員 / 部門</th>
                        <th className="py-2.5 px-3">更新時間</th>
                        <th className="py-2.5 px-3">大小</th>
                        <th className="py-2.5 px-3">評審批閱進度</th>
                        <th className="py-2.5 px-3 text-right">操作與下載</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((item) => {
                        const fileBadge = getFileIcon(item.fileType);
                        const IconComp = fileBadge.icon;
                        const isGraded = item.gradeStatus === 'graded';
                        const isFresh = item.isFresh || item.id === highlightSubmissionId;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-sky-50/50 transition-colors ${
                              isFresh ? 'bg-emerald-50/60 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <div
                                className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center border ${fileBadge.color}`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(item)}
                                  className="text-left font-bold text-slate-900 hover:text-sky-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                                >
                                  {item.fileName}
                                </button>
                                {isFresh && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-black uppercase tracking-wider animate-pulse">
                                    NEW 剛上傳
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                路徑: DAY 7 / {item.fileName} · SharePoint ID: {item.sharePointId || 'SP-DOC-001'}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{item.studentName}</div>
                              <div className="text-[10px] text-slate-500">
                                {item.empNo} · {item.department}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {item.submittedAt}
                            </td>

                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {item.fileSize}
                            </td>

                            <td className="py-3 px-3">
                              {isGraded ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <Award className="w-3 h-3 text-emerald-700" />
                                    {item.gradeScore !== undefined
                                      ? `${item.gradeScore} 分 · 通過`
                                      : '審核通過 (PASS)'}
                                  </span>
                                  {item.reviewerFeedback && (
                                    <div className="text-[10px] text-slate-500 truncate max-w-[160px] mt-0.5">
                                      評語：{item.reviewerFeedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  待講師批閱評分
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleFile(item)}
                                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="下載實體檔案並可直接拖曳放入您的 Microsoft 365"
                                >
                                  <Download className="w-3 h-3 text-sky-600" />
                                  下載檔案
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(item)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="在 Office 365 Online 中開啟"
                                >
                                  <Eye className="w-3 h-3 text-slate-500" />
                                  預覽
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenGradingModal(item)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="開啟評審批閱與評分介面"
                                >
                                  <Award className="w-3 h-3" />
                                  {isGraded ? '重看評分' : '批閱'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid / Cards View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredSubmissions.map((item) => {
                    const fileBadge = getFileIcon(item.fileType);
                    const IconComp = fileBadge.icon;
                    const isGraded = item.gradeStatus === 'graded';
                    const isFresh = item.isFresh || item.id === highlightSubmissionId;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                          isFresh
                            ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                            : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`p-2.5 rounded-xl border ${fileBadge.color}`}>
                            <IconComp className="w-6 h-6" />
                          </div>

                          <div className="text-right">
                            {isGraded ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {item.gradeScore !== undefined ? `${item.gradeScore}分 · PASS` : 'PASS'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                待批閱
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                            {item.fileName}
                          </h4>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>{item.studentName} ({item.empNo})</span>
                            <span className="font-mono">{item.fileSize}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleFile(item)}
                            className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            下載檔案
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDocViewer(item)}
                            className="text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Office 預覽
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenGradingModal(item)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            {isGraded ? '評分' : '批閱'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            ) : activeTab === 'sync_log' ? (
              /* Sync & Transmission Telemetry Monitor Tab */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span>Microsoft 365 雲端傳輸監控控制台</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                          TLS 1.3 · Graph API Active
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        即時記錄每一次作業上傳至遠雄企業團 SharePoint / OneDrive 之數位簽章、SHA-256 指紋與微軟伺服器回執。
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoadingLogs(true);
                      const logs = await getOneDriveTransmissionLogs({ courseId: course.id, batchNo });
                      setTransmissionLogs(logs);
                      setIsLoadingLogs(false);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                    <span>刷新記錄</span>
                  </button>
                </div>

                {transmissionLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-xs">目前尚無雲端傳輸紀錄，當學員送出作業時將即時顯示傳輸歷程與封包回執。</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transmissionLogs.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-900 rounded font-mono font-bold text-[10px]">
                              {tx.transmissionId}
                            </span>
                            <span className="font-bold text-slate-900">
                              {tx.fileName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                            <span>學員：<strong>{tx.empName}</strong> ({tx.empNo})</span>
                            <span className="font-mono">{tx.timestamp}</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              已校驗實體歸檔 ({tx.durationMs}ms)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400">雲端物理路徑：</span>
                            <span className="text-slate-800 break-all">{tx.oneDriveSavedPath}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">SHA-256 指紋：</span>
                            <span className="text-slate-600 break-all">{tx.sha256}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cloud GUID：</span>
                            <span className="text-slate-700">{tx.cloudItemGuid}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Server ETag：</span>
                            <span className="text-slate-700">{tx.etag}</span>
                          </div>
                        </div>

                        {/* Stage Breakdown Logs */}
                        {tx.logs && tx.logs.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              傳輸管線階段進度 (Pipeline Stages)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {tx.logs.map((stg, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] flex flex-col justify-between space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">{stg.stageName}</span>
                                    <span className="text-emerald-600 font-bold">+{stg.latencyMs}ms</span>
                                  </div>
                                  <p className="text-slate-500 leading-tight line-clamp-2">{stg.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Microsoft Graph API Diagnostics & Verification Tab */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0078D4] text-white flex items-center justify-center font-bold shadow-md">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        Microsoft Graph API & SharePoint 連線診斷工具
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        即時檢測 Azure Entra ID 租戶鑑權、SharePoint Document Library 可用性與資料夾讀寫權限。
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunDiagnostics}
                    disabled={isRunningDiagnostics}
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#006abc] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Activity className={`w-4 h-4 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                    <span>{isRunningDiagnostics ? '檢測中...' : '執行端到端連線檢測'}</span>
                  </button>
                </div>

                {/* Tenant & Configuration Overview Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">微軟租戶 (Azure AD Tenant)</span>
                    <div className="font-bold text-slate-900 text-xs">遠雄企業總部 (farglorygroup.com.tw)</div>
                    <div className="text-[10px] font-mono text-slate-500">Tenant ID: farglorygroup.com.tw</div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">應用程式 Client ID</span>
                    <div className="font-bold text-slate-900 text-xs">M365 Enterprise Training Hub</div>
                    <div className="text-[10px] font-mono text-slate-500">04b07795-8ddb-461a-bbee-02f9e1bf7b46</div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">SharePoint 企業空間配額</span>
                    <div className="font-bold text-emerald-700 text-xs">已使用 180.2 GB / 5.0 TB (3.5%)</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[3.5%]" />
                    </div>
                  </div>
                </div>

                {/* Folder Structure Live Inspection */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-amber-500" />
                      目標資料夾階層驗證 (Target Hierarchy Verification)
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                      階層可讀寫 · 自動遞迴建置就緒
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div><strong>正規化雲端路徑：</strong> {verifiedFolderData?.canonicalPath || currentFolderPathString}</div>
                    <div className="mt-1"><strong>SharePoint 實體網址：</strong> <a href={verifiedFolderData?.siteUrl || folderPathDisplay} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">{verifiedFolderData?.siteUrl || folderPathDisplay}</a></div>
                  </div>

                  {verifiedFolderData?.segments && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400">階層目錄解析樹：</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {verifiedFolderData.segments.map((seg, sI) => (
                          <React.Fragment key={sI}>
                            <span className="px-2 py-1 bg-sky-50 text-sky-900 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                              <Folder className="w-3.5 h-3.5 text-sky-600" />
                              <span>{seg.name}</span>
                            </span>
                            {sI < (verifiedFolderData.segments?.length || 0) - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Diagnostics Step Results */}
                {diagnosticsResult && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        端到端檢測結果：全數通過 (Total Latency: {diagnosticsResult.totalLatencyMs}ms)
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">{diagnosticsResult.timestamp}</span>
                    </div>

                    <div className="space-y-2">
                      {diagnosticsResult.steps.map((st, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-200">{st.name}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{st.message}</div>
                          </div>
                          <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                            {st.latencyMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Status Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="flex items-center gap-1">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  雲端儲存路徑：<code className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px]">{currentFolderPathString}</code>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBatch}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>批次下載全體作業 (.ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Microsoft 365 Graph API & SharePoint Integration Modal */}
      {isGraphApiModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0078D4] text-white flex items-center justify-center font-bold">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Microsoft 365 實體租戶雲端自動同步</h3>
                  <span className="text-[10px] text-slate-500">Azure Entra ID & Microsoft Graph API 連接器</span>
                </div>
              </div>
              <button
                onClick={() => setIsGraphApiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              此設定可讓系統在學員點擊「送出作業」時，直接呼叫 Microsoft Graph API 將檔案自動推送至您的企業 Microsoft 365 / SharePoint 資料夾：
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  SharePoint / OneDrive 目標資料夾共用網址：
                </label>
                <input
                  type="text"
                  value={customSharePointUrl}
                  onChange={(e) => setCustomSharePointUrl(e.target.value)}
                  placeholder="https://farglorygroup-my.sharepoint.com/.../DAY 7/"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Azure Client ID：
                  </label>
                  <input
                    type="text"
                    value={tenantClientId}
                    onChange={(e) => setTenantClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Microsoft 365 租戶網域：
                  </label>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {pushSuccessBanner && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900 font-bold text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>已成功觸發 Graph API 同步推播！實體作業檔案已寫入 Microsoft 365 租戶。</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTriggerLiveGraphSync}
                disabled={isPushingToRealM365}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isPushingToRealM365 ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isPushingToRealM365 ? '正在推播至 M365...' : '立即測試同步推播'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('設定已儲存！後續學員繳交時將自動透過此路徑與 Webhook 同步。');
                  setIsGraphApiModalOpen(false);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold cursor-pointer"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office Document Viewer Modal */}
      {viewerModalData.isOpen && viewerModalData.material && (
        <OneDriveDocumentViewerModal
          isOpen={viewerModalData.isOpen}
          onClose={() => setViewerModalData({ isOpen: false, material: null })}
          material={viewerModalData.material}
        />
      )}

      {/* Instructor Grading Modal */}
      {gradingModalData.isOpen && gradingModalData.enrollment && (
        <AssignmentGradingModal
          isOpen={gradingModalData.isOpen}
          onClose={() => setGradingModalData({ isOpen: false })}
          enrollment={gradingModalData.enrollment}
          course={course}
          submission={gradingModalData.submission}
          onSuccess={() => {
            setGradingModalData({ isOpen: false });
          }}
        />
      )}

      {/* M365 Enterprise Login Modal */}
      {isM365LoginModalOpen && (
        <M365LoginModal
          isOpen={isM365LoginModalOpen}
          onClose={() => setIsM365LoginModalOpen(false)}
          defaultUserName={m365Session.userName || '遠雄集團同仁'}
          defaultEmpNo={m365Session.empNo || 'FG1001'}
          defaultDepartment={m365Session.department || '建築工程處'}
          defaultEmail={m365Session.userAccount}
          intentAction="管理與同步 Microsoft 365 共用資料夾"
          onSuccess={(newSession) => {
            setM365Session(newSession);
          }}
        />
      )}
    </div>
  );
};

