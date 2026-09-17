import React, { useState, useEffect } from 'react';
import {
  Sliders,
  FileText,
  Video,
  HelpCircle,
  Star,
  Target,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  Settings,
  ShieldAlert,
  Clock,
  Award,
  Play,
  ExternalLink,
  Edit3,
  X,
  Layers,
  Save,
  BookOpen,
  Calendar,
  Users,
  Maximize2,
  Volume2,
  Tv,
  Film,
  RotateCcw,
  Check,
  Briefcase,
  ClipboardCheck,
  ListVideo,
  ChevronUp,
  ChevronDown,
  FolderPlus,
  FileSpreadsheet,
  Presentation,
  Cloud,
  FolderCheck,
  UploadCloud,
  UserPlus,
  Shuffle,
  Link2,
  ArrowRight,
} from 'lucide-react';
import {
  InternalCourse,
  CourseBatch,
  TrainingMaterial,
  TrainingSurveyConfig,
  TrainingExamConfig,
  InteractiveQuestion,
  ReviewLevel,
  CourseVideoChapter,
  CourseVideoConfig,
  CourseAssignmentConfig,
  AssignmentFileType,
  CourseEnrollment,
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import { MsFormsDesignerModal } from '../../common/MsFormsDesignerModal';
import { PdfViewerModal } from '../../common/PdfViewerModal';
import { BatchStudentProgressTrackerModal } from './BatchStudentProgressTrackerModal';
import { ForceEnrollStudentsModal } from './ForceEnrollStudentsModal';
import { AssignmentSubmissionModal } from '../../frontend/training/AssignmentSubmissionModal';
import { OneDriveAssignmentFolderModal } from '../../common/OneDriveAssignmentFolderModal';
import { TrainingExamPreviewModal } from '../../common/TrainingExamPreviewModal';
import {
  getStoredOneDriveShareUrl,
  saveStoredOneDriveShareUrl,
} from '../../../utils/assignmentDownloadHelper';
import {
  detectMaterialMediaType,
  formatTargetAudience,
  getYouTubeEmbedUrl,
  extractYouTubeVideoId,
  isMicrosoftVideoUrl,
  getMicrosoftVideoEmbedUrl,
  extractEmbedUrlFromIframe,
  isYouTubeUrl,
} from '../../../utils/trainingUtils';

interface BatchClassroomSettingsModalProps {
  course: InternalCourse;
  batch: CourseBatch;
  onSave: (updatedBatch: CourseBatch, updatedCourse?: Partial<InternalCourse>) => void;
  onClose: () => void;
}

export const BatchClassroomSettingsModal: React.FC<BatchClassroomSettingsModalProps> = ({
  course,
  batch,
  onSave,
  onClose,
}) => {
  const { trainingMaterials, instructors, employees } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'pre_survey' | 'materials' | 'video' | 'assignment' | 'exam' | 'post_survey' | 'action_plan' | 'student_tracker'
  >('pre_survey');

  // Sub-modals
  const [formsDesignerMode, setFormsDesignerMode] = useState<'pre_survey' | 'post_survey' | 'exam' | null>(null);
  const [pdfPreviewMaterial, setPdfPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSmartPlanPreviewModalOpen, setIsSmartPlanPreviewModalOpen] = useState(false);
  const [smartPreviewTab, setSmartPreviewTab] = useState<'goal' | 'self_eval' | 'manager_review'>('goal');
  const [isAssignmentPreviewModalOpen, setIsAssignmentPreviewModalOpen] = useState(false);
  const [isExamPreviewModalOpen, setIsExamPreviewModalOpen] = useState(false);

  // 1. Pre-Survey Settings
  const [hasPreSurvey, setHasPreSurvey] = useState<boolean>(
    (batch as any).classroomConfig?.hasPreSurvey ?? course.hasPreSurvey ?? true
  );
  const [preSurveyConfig, setPreSurveyConfig] = useState<TrainingSurveyConfig>(
    (batch as any).classroomConfig?.preSurveyConfig ||
      course.preSurveyConfig || {
        id: `pre-srv-${batch.id}`,
        title: `【${course.title}】${batch.batchName || batch.batchNo} 課前需求調查問卷`,
        type: 'pre_course',
        description: '請協助填寫您過去之施工實務背景與期許主題，以利講師調整授課重點。',
        questions: [
          {
            id: 'q-pre-1',
            title: '您過去在工程排程與要徑管理方面之實務經驗程度為何？',
            type: 'single_choice',
            options: ['初學者 (未接觸過)', '略具概念 (曾參與排程)', '熟練 (經常負責專案排程)', '專家 (具備講師或專案主管資歷)'],
            required: true,
          },
          {
            id: 'q-pre-2',
            title: '您對本堂內部訓練課程最期待學習獲得的技能為？',
            type: 'multiple_choice',
            options: [
              '進度網圖要徑計算與寬裕時間分析',
              '工期展延之爭議佐證與法規因應',
              'BIM 4D 施工模擬與界面碰撞排除',
              '滾動式排程與分包商出工人力協調',
            ],
            required: true,
          },
          {
            id: 'q-pre-3',
            title: '您對目前所屬工務所之進度控制流程滿意程度 (1~5星)：',
            type: 'rating_star',
            required: true,
          },
          {
            id: 'q-pre-4',
            title: '您在現場施工進度管控上曾遭遇最棘手之問題為何？（開放簡答）',
            type: 'open_text',
            required: false,
          },
        ],
      }
  );

  // 2. Classroom Materials
  const initialMaterialIds =
    (batch as any).classroomConfig?.materials?.map((m: any) => m.id) ||
    course.materials?.map((m) => m.id) ||
    [];
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>(initialMaterialIds);

  // 3. Video & Multi-Chapter Settings
  const defaultVideoConfig: CourseVideoConfig = (batch as any).classroomConfig?.videoConfig || course.videoConfig || {
    enabled: true,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
    requiredDurationSeconds: 180,
    popupIntervalSeconds: 60,
    popupTimeoutSeconds: 20,
  };
  const [videoEnabled, setVideoEnabled] = useState<boolean>(defaultVideoConfig.enabled ?? true);

  const initialChapters: CourseVideoChapter[] = defaultVideoConfig.chapters?.length
    ? defaultVideoConfig.chapters
    : [
        {
          id: `ch-${batch.id}-1`,
          chapterNo: 1,
          title: defaultVideoConfig.videoTitle || '第一章：課程主題實務解析與關鍵要點',
          sourceType: (defaultVideoConfig.sourceType || defaultVideoConfig.videoSource || 'youtube') as any,
          videoSource: (defaultVideoConfig.videoSource || defaultVideoConfig.sourceType || 'youtube') as any,
          videoUrl: defaultVideoConfig.videoUrl || 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
          durationSeconds: defaultVideoConfig.videoDurationSeconds || defaultVideoConfig.requiredDurationSeconds || 600,
          description: '課程核心概念、實務流程與關鍵工法解說',
          isRequired: true,
          requiredWatchPercent: 90,
        },
      ];

  const [chapters, setChapters] = useState<CourseVideoChapter[]>(initialChapters);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Selected chapter for preview and editing
  const currentActiveChapter = chapters[selectedChapterIdx] || chapters[0] || {
    id: 'default',
    title: '預覽影片',
    videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
    sourceType: 'youtube' as const,
    videoSource: 'youtube' as const,
    durationSeconds: 600,
  };

  const totalChaptersDurationSeconds = chapters.reduce((acc, ch) => acc + (ch.durationSeconds || 600), 0);
  const [requiredDurationSeconds, setRequiredDurationSeconds] = useState<number>(
    defaultVideoConfig.requiredDurationSeconds || Math.round(totalChaptersDurationSeconds * 0.9)
  );
  const [popupIntervalSeconds, setPopupIntervalSeconds] = useState<number>(defaultVideoConfig.popupIntervalSeconds || 60);
  const [popupTimeoutSeconds, setPopupTimeoutSeconds] = useState<number>(defaultVideoConfig.popupTimeoutSeconds || 20);

  // Handlers for Chapter Management
  const handleAddChapter = () => {
    const newIdx = chapters.length + 1;
    const newCh: CourseVideoChapter = {
      id: `ch-${batch.id}-${Date.now()}`,
      chapterNo: newIdx,
      title: `第 ${newIdx} 章：新影音章節單元`,
      sourceType: 'youtube',
      videoSource: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
      durationSeconds: 600,
      description: '請輸入此章節之研習重點或施工規範',
      isRequired: true,
      requiredWatchPercent: 90,
    };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setSelectedChapterIdx(updated.length - 1);
    setEditingChapterId(newCh.id);
  };

  const handleUpdateChapter = (id: string, patch: Partial<CourseVideoChapter>) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const updated = { ...ch, ...patch };
          if (patch.sourceType && !patch.videoSource) {
            updated.videoSource = patch.sourceType;
          }
          if (patch.videoSource && !patch.sourceType) {
            updated.sourceType = patch.videoSource;
          }
          return updated;
        }
        return ch;
      })
    );
  };

  const handleRemoveChapter = (id: string) => {
    if (chapters.length <= 1) {
      alert('研習教室至少需保留一部影音章節。');
      return;
    }
    const updated = chapters.filter((ch) => ch.id !== id);
    setChapters(updated);
    if (selectedChapterIdx >= updated.length) {
      setSelectedChapterIdx(Math.max(0, updated.length - 1));
    }
    if (editingChapterId === id) {
      setEditingChapterId(null);
    }
  };

  const handleMoveChapter = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...chapters];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    // re-index chapter numbers
    const reindexed = updated.map((ch, i) => ({ ...ch, chapterNo: i + 1 }));
    setChapters(reindexed);
    setSelectedChapterIdx(targetIdx);
  };

  const handleImportFromMaterials = () => {
    const videoMaterials = (course.materials || []).filter(
      (m) =>
        m.fileType === 'video' ||
        (m as any).type === 'video' ||
        detectMaterialMediaType(m) === 'youtube' ||
        detectMaterialMediaType(m) === 'teams_onedrive' ||
        detectMaterialMediaType(m) === 'video'
    );
    if (videoMaterials.length === 0) {
      alert('目前課程教材庫中尚無標記為影音或 YouTube/Teams 的教材項目。您可直接點擊「新增章節」手動填入網址。');
      return;
    }
    let addedCount = 0;
    const newChapters = [...chapters];
    videoMaterials.forEach((m) => {
      const exists = newChapters.some((c) => c.videoUrl === m.fileUrl);
      if (!exists) {
        addedCount++;
        const detectedType = detectMaterialMediaType(m);
        newChapters.push({
          id: `ch-mat-${m.id}-${Date.now()}`,
          chapterNo: newChapters.length + 1,
          title: `第 ${newChapters.length + 1} 章：${m.title}`,
          sourceType: detectedType === 'youtube' ? 'youtube' : detectedType === 'teams_onedrive' ? 'teams_onedrive' : 'upload',
          videoSource: detectedType === 'youtube' ? 'youtube' : detectedType === 'teams_onedrive' ? 'teams_onedrive' : 'upload',
          videoUrl: m.fileUrl,
          durationSeconds: 600,
          description: m.description || '由課程教材庫自動匯入之影音章節',
          isRequired: true,
          requiredWatchPercent: 90,
        });
      }
    });
    if (addedCount === 0) {
      alert('教材庫中的所有影音項目皆已存在於章節清單中。');
    } else {
      setChapters(newChapters);
      alert(`已成功從教材庫匯入 ${addedCount} 個影音章節！`);
    }
  };

  // Video Preview & Anti-cheating test states
  const [isVideoPreviewModalOpen, setIsVideoPreviewModalOpen] = useState(false);
  const [isTestPopupActive, setIsTestPopupActive] = useState(false);
  const [testPopupTimer, setTestPopupTimer] = useState<number>(20);
  const [isOneDriveFolderModalOpen, setIsOneDriveFolderModalOpen] = useState(false);

  // Anti-cheating test countdown effect
  useEffect(() => {
    let interval: any;
    if (isTestPopupActive && testPopupTimer > 0) {
      interval = setInterval(() => {
        setTestPopupTimer((prev) => {
          if (prev <= 1) {
            setIsTestPopupActive(false);
            alert('【防掛機測試】倒數逾時！在正式研習教室中，系統將自動中斷播放並記錄異常。');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestPopupActive, testPopupTimer]);

  // 3.5 Assignment & OneDrive Cloud Storage Settings
  const [hasAssignment, setHasAssignment] = useState<boolean>(
    (batch as any).classroomConfig?.hasAssignment ??
      (batch as any).classroomConfig?.assignmentConfig?.enabled ??
      course.hasAssignment ??
      course.assignmentConfig?.enabled ??
      true
  );
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    (batch as any).classroomConfig?.assignmentConfig?.title ||
      course.assignmentConfig?.title ||
      '【課後實務作業】施工工序要徑排程模擬與品質自主檢驗檢討報告'
  );
  const [assignmentDescription, setAssignmentDescription] = useState<string>(
    (batch as any).classroomConfig?.assignmentConfig?.description ||
      course.assignmentConfig?.description ||
      '請依據課堂所學之要徑工法與施工查核要點，結合目前案場實務狀況，繳交具體分析報告、試算表或施工圖說照片。'
  );
  const [assignmentGradingType, setAssignmentGradingType] = useState<'pass_fail' | 'score_100'>(
    (batch as any).classroomConfig?.assignmentConfig?.gradingType ||
      course.assignmentConfig?.gradingType ||
      'score_100'
  );
  const [assignmentPassingScore, setAssignmentPassingScore] = useState<number>(
    (batch as any).classroomConfig?.assignmentConfig?.passingScore ||
      course.assignmentConfig?.passingScore ||
      70
  );
  const [assignmentAllowedTypes, setAssignmentAllowedTypes] = useState<AssignmentFileType[]>(
    (batch as any).classroomConfig?.assignmentConfig?.allowedFileTypes ||
      course.assignmentConfig?.allowedFileTypes ||
      ['word', 'excel', 'powerpoint', 'pdf', 'image']
  );
  const [assignmentMaxFileSizeMB, setAssignmentMaxFileSizeMB] = useState<number>(
    (batch as any).classroomConfig?.assignmentConfig?.maxFileSizeMB ||
      course.assignmentConfig?.maxFileSizeMB ||
      50
  );
  const [assignmentReviewerEmpNo, setAssignmentReviewerEmpNo] = useState<string>(
    (batch as any).classroomConfig?.assignmentConfig?.reviewerEmpNo ||
      course.assignmentConfig?.reviewerEmpNo ||
      batch.primaryInstructorId ||
      instructors[0]?.empNo ||
      'FG1001'
  );
  const [assignmentOneDriveFolderPath, setAssignmentOneDriveFolderPath] = useState<string>(
    (batch as any).classroomConfig?.assignmentConfig?.oneDriveFolderPath ||
      course.assignmentConfig?.oneDriveFolderPath ||
      `OneDrive://建築工程處/專業訓練作業/2026/${batch.batchCode || course.courseCode || 'TR-ENG-2026'}/`
  );
  const [assignmentOneDriveShareUrl, setAssignmentOneDriveShareUrl] = useState<string>(
    (batch as any).classroomConfig?.assignmentConfig?.oneDriveShareUrl ||
      course.assignmentConfig?.oneDriveShareUrl ||
      getStoredOneDriveShareUrl(course.id, batch.batchNo) ||
      ''
  );
  const [assignmentDueDateDays, setAssignmentDueDateDays] = useState<number>(
    (batch as any).classroomConfig?.assignmentConfig?.dueDateDaysAfterCourse ||
      course.assignmentConfig?.dueDateDaysAfterCourse ||
      14
  );
  const [assignmentRequiredForCompletion, setAssignmentRequiredForCompletion] = useState<boolean>(
    (batch as any).classroomConfig?.assignmentConfig?.isRequiredForCompletion ??
      course.assignmentConfig?.isRequiredForCompletion ??
      true
  );

  // 4. Online Exam Settings
  const [hasPostTest, setHasPostTest] = useState<boolean>(
    (batch as any).classroomConfig?.hasPostTest ?? course.hasPostTest ?? true
  );
  const [passingScore, setPassingScore] = useState<number>(
    (batch as any).classroomConfig?.examConfig?.passingScore ?? course.passingScore ?? 70
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(
    (batch as any).classroomConfig?.examConfig?.maxAttempts ?? course.examConfig?.maxAttempts ?? 3
  );
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(
    (batch as any).classroomConfig?.examConfig?.shuffleQuestions ?? course.examConfig?.shuffleQuestions ?? false
  );
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(
    (batch as any).classroomConfig?.examConfig?.shuffleOptions ?? course.examConfig?.shuffleOptions ?? false
  );
  const [examConfig, setExamConfig] = useState<TrainingExamConfig>(
    (batch as any).classroomConfig?.examConfig ||
      course.examConfig || {
        id: `exam-${batch.id}`,
        title: `【${course.title}】隨堂線上測驗`,
        passingScore: 70,
        maxAttempts: 3,
        allowRetake: true,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        shuffleOptions: false,
        questions: [
          {
            id: 'ex-q-1',
            title: '在工程進度網圖（CPM）分析中，總浮時（Total Float）為零之作業路徑稱為？',
            type: 'single_choice',
            options: ['非關鍵路徑', '要徑 (Critical Path)', '虛作業路徑', '平行路徑'],
            correctAnswer: '要徑 (Critical Path)',
            correctOptionIndices: [1],
            points: 20,
            explanation: '要徑即為總工期最長且總浮時為零之關鍵作業鏈，任何延誤皆會直接導致竣工日期延宕。',
            required: true,
          },
          {
            id: 'ex-q-2',
            title: '下列何者屬於工期展延（EOT）申請之關鍵佐證文件？（多選）',
            type: 'multiple_choice',
            options: [
              '公共工程每日施工日誌與氣象局降雨證明',
              '業主變更設計指示書（VO）或停工聯絡單',
              '要徑影響分析（Time Impact Analysis）網圖報告',
              '工地個人工作日記',
            ],
            correctAnswer: [
              '公共工程每日施工日誌與氣象局降雨證明',
              '業主變更設計指示書（VO）或停工聯絡單',
              '要徑影響分析（Time Impact Analysis）網圖報告',
            ],
            correctOptionIndices: [0, 1, 2],
            points: 20,
            explanation: '每日施工日誌、業主書面指示與 TIA 要徑分析為法定具備證明力之展延佐證資料。',
            required: true,
          },
          {
            id: 'ex-q-3',
            title: '是非題：當工期進度落後時，採用「趕工（Crashing）」策略通常會額外增加直接成本。',
            type: 'true_false',
            options: ['是 (正確)', '否 (錯誤)'],
            correctAnswer: '是 (正確)',
            correctOptionIndices: [0],
            points: 20,
            explanation: '趕工通常涉及增加機具、人員加班或變更工法，因此會使直接成本上升。',
            required: true,
          },
          {
            id: 'ex-q-4',
            title: '【實務連連看】請將下列深開挖工法關鍵項目與其現場施工品質管制重點進行連線配對：',
            type: 'matching',
            points: 20,
            required: true,
            matchingScoringMode: 'partial',
            matchingPairs: [
              { id: 'pair-1', leftText: '逆打鋼柱', rightText: '垂直度偏差控制於 1/1000 內' },
              { id: 'pair-2', leftText: '連續壁接頭', rightText: '超音波槽檢垂直精度' },
              { id: 'pair-3', leftText: '抽水減壓井', rightText: '雙環即時觀測水頭差防湧砂' },
              { id: 'pair-4', leftText: '安全支撐系統', rightText: '油壓千斤頂施加預力與軸力監測' },
            ],
            explanation: '逆打鋼柱著重垂直精度、連續壁槽段需超音波檢驗、減壓井防砂湧、支撐需預力與軸力監測。',
          },
          {
            id: 'ex-q-5',
            title: '簡答題：請說明若遇到連續天候異常降雨，工務所主任應於幾日內向監造單位提送停工申請與因應對策？',
            type: 'open_text',
            points: 20,
            graderName: batch.primaryInstructorName || '授課講師/直屬主管',
            explanation: '依遠雄標準合約手冊，應於不可抗力事件發生後7日內具函提報相關佐證與工期影響評估報告。',
            required: true,
          },
        ],
      }
  );

  // 5. Post-Survey Settings
  const [hasPostSurvey, setHasPostSurvey] = useState<boolean>(
    (batch as any).classroomConfig?.hasPostSurvey ?? course.hasPostSurvey ?? true
  );
  const [postSurveyConfig, setPostSurveyConfig] = useState<TrainingSurveyConfig>(
    (batch as any).classroomConfig?.postSurveyConfig ||
      course.postSurveyConfig || {
        id: `post-srv-${batch.id}`,
        title: `【${course.title}】課後滿意度調查問卷`,
        type: 'post_satisfaction',
        description: '感謝您的熱情參與！請依據本次課程之師資教學、教材內容與實務助益提供客觀評分。',
        questions: [
          {
            id: 'post-q-1',
            title: '講師之專業素養、實務案例說明與解說清晰度評分 (1~5星)：',
            type: 'rating_star',
            required: true,
          },
          {
            id: 'post-q-2',
            title: '課程教材之實用性與現場工程管理之契合程度 (1~5星)：',
            type: 'rating_star',
            required: true,
          },
          {
            id: 'post-q-3',
            title: '您是否願意將本課程推薦給工務所同仁或新進儲備幹部？',
            type: 'single_choice',
            options: ['非常推薦 (9-10分)', '推薦 (7-8分)', '普通 (5-6分)', '不推薦 (4分以下)'],
            required: true,
          },
          {
            id: 'post-q-4',
            title: '對於本次研習課程或未來進階培訓主題，您有何具體建議？',
            type: 'open_text',
            required: false,
          },
        ],
      }
  );

  // 6. SMART Action Plan Settings
  const [hasSmartPlan, setHasSmartPlan] = useState<boolean>(
    (batch as any).classroomConfig?.hasSmartPlan ?? course.hasSmartPlan ?? true
  );
  const [smartPlanReviewLevel, setSmartPlanReviewLevel] = useState<ReviewLevel>(
    (batch as any).classroomConfig?.smartPlanReviewLevel || course.smartPlanReviewLevel || 'direct_manager'
  );
  const [smartPlanDaysLimit, setSmartPlanDaysLimit] = useState<number>(
    (batch as any).classroomConfig?.smartPlanDaysLimit || (course as any).smartPlanDaysLimit || 60
  );
  const [smartPlanPassingScore, setSmartPlanPassingScore] = useState<number>(
    (batch as any).classroomConfig?.smartPlanPassingScore || (course as any).smartPlanPassingScore || 80
  );

  // Default SMART rubrics items (CRUD-able)
  const defaultSmartRubrics = [
    {
      id: 'rubric-1',
      dimension: 'S (明確性 Specific)',
      target: '明確指出工程查驗工項、案場棟別樓層與改善施作區域',
      weight: 20,
    },
    {
      id: 'rubric-2',
      dimension: 'M (可衡量 Measurable)',
      target: '量化改善前後量測數值 (如裂縫寬度、高低差、垂直度或施工天數)',
      weight: 20,
    },
    {
      id: 'rubric-3',
      dimension: 'A (可達成 Achievable)',
      target: '工法變更或防墜措施具現場可執行性，並獲分包廠商同意配合',
      weight: 20,
    },
    {
      id: 'rubric-4',
      dimension: 'R (相關性 Relevant)',
      target: '切合本次專業訓練核心規範，對案場品質/安衛/工期有實質效益',
      weight: 20,
    },
    {
      id: 'rubric-5',
      dimension: 'T (時效性 Time-bound)',
      target: `於結訓後 ${smartPlanDaysLimit} 天內完成現場查驗拍照與自主追蹤結案`,
      weight: 20,
    },
  ];

  const [smartRubrics, setSmartRubrics] = useState(
    (batch as any).classroomConfig?.smartRubrics || (course as any).smartRubrics || defaultSmartRubrics
  );
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);

  // Force Enroll Modal state
  const [isForceEnrollModalOpen, setIsForceEnrollModalOpen] = useState(false);

  // Inline question editing states
  const [editingPreSurveyIdx, setEditingPreSurveyIdx] = useState<number | null>(null);
  const [editingPostSurveyIdx, setEditingPostSurveyIdx] = useState<number | null>(null);
  const [editingExamIdx, setEditingExamIdx] = useState<number | null>(null);

  // Custom batch materials state (CRUD-able)
  const [customMaterials, setCustomMaterials] = useState<TrainingMaterial[]>(
    (batch as any).classroomConfig?.customMaterials || []
  );
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatUrl, setNewMatUrl] = useState('');
  const [newMatType, setNewMatType] = useState<'pdf' | 'word' | 'excel' | 'powerpoint' | 'video'>('pdf');

  // Handle Save
  const handleSaveAll = () => {
    const selectedMaterials = trainingMaterials.filter((m) => selectedMaterialIds.includes(m.id));

    const reviewerInstructor = instructors.find(
      (inst) => (inst.empNo || inst.id) === assignmentReviewerEmpNo
    );

    const classroomConfig = {
      hasPreSurvey,
      preSurveyConfig: {
        ...preSurveyConfig,
        title: preSurveyConfig.title || `【${course.title}】課前需求調查問卷`,
      },
      materials: selectedMaterials,
      videoConfig: {
        enabled: videoEnabled,
        videoSource: currentActiveChapter.videoSource || currentActiveChapter.sourceType || 'youtube',
        sourceType: currentActiveChapter.sourceType || currentActiveChapter.videoSource || 'youtube',
        videoUrl: currentActiveChapter.videoUrl || 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
        videoTitle: currentActiveChapter.title,
        videoDurationSeconds: totalChaptersDurationSeconds,
        requiredDurationSeconds,
        requiredWatchPercent: 90,
        popupIntervalSeconds,
        popupTimeoutSeconds,
        chapters,
      },
      hasAssignment,
      assignmentConfig: {
        enabled: hasAssignment,
        title: assignmentTitle,
        description: assignmentDescription,
        gradingType: assignmentGradingType,
        passingScore: assignmentPassingScore,
        allowedFileTypes: assignmentAllowedTypes,
        maxFileSizeMB: assignmentMaxFileSizeMB,
        reviewerEmpNo: assignmentReviewerEmpNo,
        reviewerName: reviewerInstructor?.name || batch.primaryInstructorName || '陳冠霖',
        reviewerRole: reviewerInstructor?.title || reviewerInstructor?.department || '工務主管',
        oneDriveFolderPath: assignmentOneDriveFolderPath,
        oneDriveShareUrl: assignmentOneDriveShareUrl,
        dueDateDaysAfterCourse: assignmentDueDateDays,
        isRequiredForCompletion: assignmentRequiredForCompletion,
      },
      hasPostTest,
      examConfig: {
        ...examConfig,
        passingScore,
        maxAttempts,
        allowRetake: maxAttempts !== 1,
        shuffleQuestions,
        shuffleOptions,
      },
      hasPostSurvey,
      postSurveyConfig: {
        ...postSurveyConfig,
        title: postSurveyConfig.title || `【${course.title}】課後滿意度調查問卷`,
      },
      hasSmartPlan,
      smartPlanReviewLevel,
      smartPlanDaysLimit,
      smartPlanPassingScore,
      smartRubrics,
      customMaterials,
    };

    const updatedBatch: CourseBatch = {
      ...batch,
      classroomConfig,
    } as any;

    const updatedCourseData: Partial<InternalCourse> = {
      hasPreSurvey,
      preSurveyConfig: classroomConfig.preSurveyConfig,
      materials: [...selectedMaterials, ...customMaterials],
      videoConfig: classroomConfig.videoConfig,
      hasAssignment,
      assignmentConfig: classroomConfig.assignmentConfig,
      hasPostTest,
      passingScore,
      examConfig: classroomConfig.examConfig,
      hasPostSurvey,
      postSurveyConfig: classroomConfig.postSurveyConfig,
      hasSmartPlan,
      smartPlanReviewLevel,
      ...({
        smartPlanDaysLimit,
        smartPlanPassingScore,
        smartRubrics,
      } as any),
    };

    saveStoredOneDriveShareUrl(assignmentOneDriveShareUrl, course.id, batch.batchNo);
    onSave(updatedBatch, updatedCourseData);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 900);
  };

  // Add Question Quick Helper
  const handleAddQuestionToPreSurvey = (type: 'single_choice' | 'multiple_choice' | 'rating_star' | 'open_text') => {
    const newQ: InteractiveQuestion = {
      id: `q-pre-${Date.now()}`,
      title: type === 'rating_star' ? '整體評分題 (1~5星)：' : '請輸入問題題目內容...',
      type,
      required: true,
      options:
        type === 'single_choice'
          ? ['選項一', '選項二', '選項三']
          : type === 'multiple_choice'
          ? ['項目 A', '項目 B', '項目 C', '項目 D']
          : undefined,
    };
    setPreSurveyConfig((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded text-[10px] font-bold">
                梯次教室設定
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[10px]">
                {batch.batchCode || batch.id}
              </span>
              <span className="text-xs font-bold text-amber-300">
                {batch.batchName || batch.batchNo}
              </span>
            </div>
            <h2 className="text-base font-black text-white mt-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              【{course.title}】研習教室功能與防弊設定
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Info Summary Bar */}
        <div className="px-6 py-2.5 bg-indigo-50/60 border-b border-indigo-100 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              開課日期：<strong>{batch.startDate} ({batch.startTime}~{batch.endTime})</strong>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              講師：<strong>{batch.primaryInstructorName || '專業講師'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              時數/學分：<strong>{course.hours} hrs / {course.credits} 點</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-indigo-900 bg-white px-2.5 py-1 rounded-md border border-indigo-200 font-semibold shadow-2xs hidden lg:block">
              💡 前台學員完成報名後，將依此設定進入教室進行問卷、講義、影音與測驗作業
            </div>
            <button
              type="button"
              onClick={() => setIsForceEnrollModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              後台強制置入學員
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('pre_survey')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'pre_survey'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            1. 課前問卷 (MS Forms)
            {hasPreSurvey && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'materials'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            2. 講義與檔案庫
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {selectedMaterialIds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'video'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            3. 影音與防掛機防弊
            {videoEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'assignment'
                ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            4. 課後實務作業 (OneDrive)
            {hasAssignment && (
              <span className="w-2 h-2 rounded-full bg-sky-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'exam'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            5. 隨堂線上測驗
            {hasPostTest && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('post_survey')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'post_survey'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            6. 課後滿意度 (Forms)
          </button>

          <button
            onClick={() => setActiveTab('action_plan')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'action_plan'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            7. SMART 行動計畫
            {hasSmartPlan && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('student_tracker')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'student_tracker'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            8. 學員執行狀況與催填總表
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
              歷程追蹤
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-700 bg-white">
          {/* TAB 1: Pre-Survey Settings (MS Forms) */}
          {activeTab === 'pre_survey' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    啟用課前需求調查問卷 (MS Forms)
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    開啟後，報名本梯次之學員進入教室時，系統將優先引導填寫課前問卷，以蒐集施工現場經驗與學習期許。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPreSurvey}
                    onChange={(e) => setHasPreSurvey(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasPreSurvey ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">問卷名稱</label>
                      <input
                        type="text"
                        value={preSurveyConfig?.title || ''}
                        onChange={(e) =>
                          setPreSurveyConfig((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">引言與說明</label>
                      <input
                        type="text"
                        value={preSurveyConfig?.description || ''}
                        onChange={(e) =>
                          setPreSurveyConfig((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <span>問卷題目清單 ({preSurveyConfig.questions.length} 題)</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ: InteractiveQuestion = {
                            id: `pre-q-${Date.now()}`,
                            title: '新課前評估題目：請簡述您在相關工項的實務經驗與期待學習重點？',
                            type: 'open_text',
                            required: true,
                          };
                          setPreSurveyConfig((prev) => ({
                            ...prev,
                            questions: [...prev.questions, newQ],
                          }));
                          setEditingPreSurveyIdx(preSurveyConfig.questions.length);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新增問卷題目
                      </button>

                      <button
                        onClick={() => setFormsDesignerMode('pre_survey')}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        開啟 MS Forms 全功能設計器
                      </button>
                    </div>
                  </div>

                  {/* Question list cards */}
                  <div className="space-y-3">
                    {preSurveyConfig.questions.map((q, idx) => {
                      const isEditing = editingPreSurveyIdx === idx;
                      return (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors relative group"
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-700">編輯題目 #{idx + 1}</span>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={q.required}
                                      onChange={(e) => {
                                        const req = e.target.checked;
                                        setPreSurveyConfig((prev) => ({
                                          ...prev,
                                          questions: prev.questions.map((item, i) =>
                                            i === idx ? { ...item, required: req } : item
                                          ),
                                        }));
                                      }}
                                      className="rounded text-indigo-600"
                                    />
                                    必填
                                  </label>
                                  <select
                                    value={q.type}
                                    onChange={(e) => {
                                      const t = e.target.value as any;
                                      setPreSurveyConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx
                                            ? {
                                                ...item,
                                                type: t,
                                                options:
                                                  t === 'single_choice' || t === 'multiple_choice'
                                                    ? item.options || ['選項 1', '選項 2']
                                                    : undefined,
                                              }
                                            : item
                                        ),
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                                  >
                                    <option value="single_choice">單選題</option>
                                    <option value="multiple_choice">多選題</option>
                                    <option value="rating_star">1~5星評分</option>
                                    <option value="essay">開放式問答</option>
                                  </select>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={q.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPreSurveyConfig((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((item, i) =>
                                      i === idx ? { ...item, title: val } : item
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                placeholder="題目標題..."
                              />

                              {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-bold text-slate-600">選項列表 (一行一個)</label>
                                  <textarea
                                    value={q.options?.join('\n') || ''}
                                    onChange={(e) => {
                                      const opts = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                                      setPreSurveyConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx ? { ...item, options: opts } : item
                                        ),
                                      }));
                                    }}
                                    rows={3}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                                    placeholder="選項 1&#10;選項 2&#10;選項 3"
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingPreSurveyIdx(null)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
                                >
                                  完成題目修改
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                                    {q.type === 'single_choice'
                                      ? '單選題'
                                      : q.type === 'multiple_choice'
                                      ? '多選題'
                                      : q.type === 'rating_star'
                                      ? '1~5星評分'
                                      : '開放式問答'}
                                  </span>
                                  {q.required && (
                                    <span className="text-[10px] text-rose-500 font-bold">*必填</span>
                                  )}
                                </div>

                                <div className="font-bold text-slate-800 text-xs pl-7">{q.title}</div>

                                {q.options && q.options.length > 0 && (
                                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-500 mt-1">
                                    {q.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span>{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingPreSurveyIdx(idx)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                  title="編輯此題"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreSurveyConfig((prev) => ({
                                      ...prev,
                                      questions: prev.questions.filter((_, i) => i !== idx),
                                    }));
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                  title="刪除此題"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fast Add Question Row */}
                  <div className="p-3 bg-slate-100/70 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-medium">快速追加題目題型：</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddQuestionToPreSurvey('single_choice')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
                      >
                        + 單選題
                      </button>
                      <button
                        onClick={() => handleAddQuestionToPreSurvey('multiple_choice')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
                      >
                        + 多選題
                      </button>
                      <button
                        onClick={() => handleAddQuestionToPreSurvey('rating_star')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
                      >
                        + 評分星級
                      </button>
                      <button
                        onClick={() => handleAddQuestionToPreSurvey('open_text')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
                      >
                        + 簡答題
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  課前問卷已關閉。學員進入教室後可直接觀看講義教材與研習影音。
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Materials Selection & Previews */}
          {activeTab === 'materials' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">指派本梯次教室配套教材</h4>
                  <p className="text-xs text-slate-500">
                    勾選欲提供給已報名學員研讀之講義檔案（Word/Excel/PPT/PDF/YouTube），亦可直接新增本梯次專屬補充講義。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMaterial(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增專屬教材
                  </button>
                  <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                    已選 {selectedMaterialIds.length + customMaterials.length} 件教材
                  </span>
                </div>
              </div>

              {/* Add Custom Material Form */}
              {isAddingMaterial && (
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">新增本梯次專案補充教材</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingMaterial(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕ 取消
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">教材標題名稱 *</label>
                      <input
                        type="text"
                        value={newMatTitle}
                        onChange={(e) => setNewMatTitle(e.target.value)}
                        placeholder="例如：【工務作業指南】鋼筋綁紮與混凝土澆置自我檢查表"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">教材格式類型</label>
                      <select
                        value={newMatType}
                        onChange={(e) => setNewMatType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="pdf">PDF 講義文件</option>
                        <option value="word">Word 說明規約 (.docx)</option>
                        <option value="excel">Excel 試算自主查核表 (.xlsx)</option>
                        <option value="powerpoint">PowerPoint 簡報 (.pptx)</option>
                        <option value="video">MP4 / 影片檔</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">講義檔案/線上雲端連結 (URL) *</label>
                    <input
                      type="text"
                      value={newMatUrl}
                      onChange={(e) => setNewMatUrl(e.target.value)}
                      placeholder="https://... 或 OneDrive / SharePoint 共享連結"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newMatTitle.trim()) {
                          alert('請輸入教材標題名稱！');
                          return;
                        }
                        const newMat: TrainingMaterial = {
                          id: `mat-cust-${Date.now()}`,
                          title: newMatTitle.trim(),
                          category: '梯次專案教材',
                          categoryName: '梯次專案教材',
                          fileType: newMatType,
                          fileUrl: newMatUrl.trim() || 'https://example.com/handout.pdf',
                          fileSize: '3.5 MB',
                          version: '1.0',
                          uploadedAt: new Date().toISOString().split('T')[0],
                          uploadedBy: '系統管理員',
                          description: '由管理員於本梯次教室資訊中專屬增設之工程規範教材。',
                        };
                        setCustomMaterials((prev) => [...prev, newMat]);
                        setNewMatTitle('');
                        setNewMatUrl('');
                        setIsAddingMaterial(false);
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      儲存並新增至教材庫
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Materials List */}
              {customMaterials.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>本梯次專屬增設教材 ({customMaterials.length} 件)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customMaterials.map((mat, mIdx) => (
                      <div
                        key={mat.id}
                        className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                              {mat.fileType}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs mt-1">{mat.title}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{mat.fileUrl}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomMaterials((prev) => prev.filter((_, i) => i !== mIdx));
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            title="刪除此自訂教材"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-[11px]">
                          <span className="text-slate-400">專屬配套講義</span>
                          <button
                            type="button"
                            onClick={() => setPdfPreviewMaterial(mat)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            線上預覽
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trainingMaterials.map((mat) => {
                  const isSelected = selectedMaterialIds.includes(mat.id);
                  const detectedType = detectMaterialMediaType(mat);

                  return (
                    <div
                      key={mat.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/40 border-indigo-400 ring-1 ring-indigo-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterialIds((prev) => [...prev, mat.id]);
                            } else {
                              setSelectedMaterialIds((prev) => prev.filter((id) => id !== mat.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded"
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                detectedType === 'youtube'
                                  ? 'bg-red-50 text-red-700'
                                  : detectedType === 'video'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {detectedType === 'youtube' ? 'YouTube' : mat.fileType}
                            </span>
                            <span className="text-[10px] text-slate-400">{mat.categoryName}</span>
                          </div>

                          <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{mat.title}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {mat.description || '專業培訓講義資料。'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">大小：{mat.fileSize || '線上資源'}</span>
                        <button
                          onClick={() => setPdfPreviewMaterial(mat)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          線上預覽
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Video & Anti-Cheating Settings */}
          {activeTab === 'video' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-600" />
                    啟用線上影音研習與防掛機檢核
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    學員需觀看滿指定時數，並於彈出之專注力彈窗限時確認，否則自動暫停並強制退出教室。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoEnabled}
                    onChange={(e) => setVideoEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {videoEnabled && (
                <div className="space-y-5">
                  {/* CHAPTERS PLAYLIST MANAGER HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 rounded-xl border border-indigo-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                          <ListVideo className="w-4 h-4" />
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          多部影片章節清單與完整課程模組
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-full">
                          共 {chapters.length} 個章節 · 合計約 {Math.round(totalChaptersDurationSeconds / 60)} 分鐘
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-8">
                        可依研習進度劃分多個影片章節（支援 YouTube、微軟 Teams / OneDrive 錄影、MP4 影片），學員需依序或完整研習各章節。
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleImportFromMaterials}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:border-slate-300 transition-colors"
                        title="從左側課程教材庫中匯入已存在的影音項目"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
                        從教材庫匯入
                      </button>
                      <button
                        type="button"
                        onClick={handleAddChapter}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新增章節影片
                      </button>
                    </div>
                  </div>

                  {/* CHAPTER LIST & EDITING CARDS */}
                  <div className="space-y-3">
                    {chapters.map((ch, idx) => {
                      const isSelected = selectedChapterIdx === idx;
                      const isEditing = editingChapterId === ch.id;
                      const isYoutube = (ch.sourceType === 'youtube' || ch.videoSource === 'youtube') || isYouTubeUrl(ch.videoUrl);
                      const isTeams = (ch.sourceType === 'teams_onedrive' || ch.videoSource === 'teams_onedrive') || isMicrosoftVideoUrl(ch.videoUrl);

                      return (
                        <div
                          key={ch.id}
                          className={`rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Chapter Header Row */}
                          <div className="p-3.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Order & badge */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveChapter(idx, 'up')}
                                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                                  title="往上移"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === chapters.length - 1}
                                  onClick={() => handleMoveChapter(idx, 'down')}
                                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                                  title="往下移"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="w-6 h-6 rounded-md bg-slate-800 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {ch.title || `第 ${idx + 1} 章：未命名影片單元`}
                                  </span>
                                  {isYoutube && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                                      YouTube
                                    </span>
                                  )}
                                  {isTeams && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold flex items-center gap-1">
                                      <Briefcase className="w-2.5 h-2.5" />
                                      Teams / OneDrive
                                    </span>
                                  )}
                                  {!isYoutube && !isTeams && (
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                      MP4 影片檔
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                                    {Math.round((ch.durationSeconds || 600) / 60)} 分鐘 ({ch.durationSeconds || 600} 秒)
                                  </span>
                                  {ch.isRequired !== false && (
                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                      必修章節
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                                  {ch.videoUrl || '尚未設定影片網址'}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChapterIdx(idx);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <Play className="w-3 h-3" />
                                預覽此章
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingChapterId(isEditing ? null : ch.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                  isEditing
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <Edit3 className="w-3 h-3" />
                                {isEditing ? '收合' : '編輯'}
                              </button>

                              <button
                                type="button"
                                disabled={chapters.length <= 1}
                                onClick={() => handleRemoveChapter(ch.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-lg transition-colors"
                                title="刪除此章節"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Chapter Editor */}
                          {isEditing && (
                            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl space-y-3.5 animate-in fade-in duration-150">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    章節單元名稱
                                  </label>
                                  <input
                                    type="text"
                                    value={ch.title}
                                    onChange={(e) => handleUpdateChapter(ch.id, { title: e.target.value })}
                                    placeholder="例如：第一章：超高層深開挖逆打工法地盤改良重點"
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    影音串流來源
                                  </label>
                                  <select
                                    value={ch.sourceType || ch.videoSource || 'youtube'}
                                    onChange={(e) =>
                                      handleUpdateChapter(ch.id, {
                                        sourceType: e.target.value as any,
                                        videoSource: e.target.value as any,
                                      })
                                    }
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                  >
                                    <option value="youtube">YouTube 串流影音</option>
                                    <option value="teams_onedrive">微軟 Teams / OneDrive / Stream</option>
                                    <option value="upload">本地 MP4 影片串流</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-bold text-slate-700">
                                      影片 URL 連結 (或直接貼上 iframe 嵌入碼)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const text = await navigator.clipboard.readText();
                                          if (text) {
                                            const cleaned = extractEmbedUrlFromIframe(text) || text.trim();
                                            handleUpdateChapter(ch.id, { videoUrl: cleaned });
                                            if (isYouTubeUrl(cleaned)) {
                                              handleUpdateChapter(ch.id, { videoUrl: cleaned, sourceType: 'youtube', videoSource: 'youtube' });
                                            } else if (isMicrosoftVideoUrl(cleaned)) {
                                              handleUpdateChapter(ch.id, { videoUrl: cleaned, sourceType: 'teams_onedrive', videoSource: 'teams_onedrive' });
                                            }
                                          }
                                        } catch {
                                          // restricted
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                    >
                                      <ClipboardCheck className="w-3 h-3" />
                                      從剪貼簿貼上
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={ch.videoUrl}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const cleaned = extractEmbedUrlFromIframe(val) || val;
                                      handleUpdateChapter(ch.id, { videoUrl: cleaned });
                                    }}
                                    onPaste={(e) => {
                                      const pasted = e.clipboardData.getData('text');
                                      if (pasted) {
                                        e.preventDefault();
                                        const cleaned = extractEmbedUrlFromIframe(pasted) || pasted.trim();
                                        handleUpdateChapter(ch.id, { videoUrl: cleaned });
                                      }
                                    }}
                                    placeholder="https://www.youtube.com/watch?v=... 或 Teams 錄影連結"
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    章節時長 (秒)
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      value={ch.durationSeconds ?? 600}
                                      onChange={(e) =>
                                        handleUpdateChapter(ch.id, { durationSeconds: Number(e.target.value) })
                                      }
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-900"
                                    />
                                    <span className="text-[11px] text-slate-500 shrink-0 font-bold">
                                      ≈{Math.round((ch.durationSeconds || 600) / 60)}分
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  章節研習重點與說明 (選填)
                                </label>
                                <input
                                  type="text"
                                  value={ch.description || ''}
                                  onChange={(e) => handleUpdateChapter(ch.id, { description: e.target.value })}
                                  placeholder="簡述本單元之主要教學重點、標準作業程序或檢驗規範..."
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                                />
                              </div>

                              {/* Quick video presets for this chapter */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <Film className="w-3 h-3 text-indigo-600" />
                                  快速套用範例：
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateChapter(ch.id, {
                                      sourceType: 'youtube',
                                      videoSource: 'youtube',
                                      videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
                                      durationSeconds: 600,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700"
                                >
                                  要徑排程 (YouTube)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateChapter(ch.id, {
                                      sourceType: 'teams_onedrive',
                                      videoSource: 'teams_onedrive',
                                      videoUrl:
                                        'https://farglory.sharepoint.com/sites/engineering/_layouts/15/embed.aspx?UniqueId=teams-rec-iot-2026',
                                      durationSeconds: 900,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[10px] font-semibold text-indigo-700"
                                >
                                  Teams 智慧工區 (Stream)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateChapter(ch.id, {
                                      sourceType: 'upload',
                                      videoSource: 'upload',
                                      videoUrl:
                                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                                      durationSeconds: 480,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700"
                                >
                                  MP4 實務示範檔
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* LIVE VIDEO PREVIEW CONTAINER FOR CURRENT SELECTED CHAPTER */}
                  <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                            正在即時預覽：
                            <span className="text-amber-300">
                              {currentActiveChapter.title || `第 ${selectedChapterIdx + 1} 章`}
                            </span>
                            {isYouTubeUrl(currentActiveChapter.videoUrl) && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px]">
                                YouTube 串流就緒
                              </span>
                            )}
                            {isMicrosoftVideoUrl(currentActiveChapter.videoUrl) && (
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px]">
                                微軟 Teams / OneDrive 串流就緒
                              </span>
                            )}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            管理員可直接於此處切換預覽各章節播放，並測試防掛機彈窗效果。
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTestPopupTimer(popupTimeoutSeconds || 20);
                            setIsTestPopupActive(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                          title="測試防掛機彈窗效果"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-white" />
                          測試防掛機彈窗
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsVideoPreviewModalOpen(true)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          全螢幕預覽
                        </button>
                      </div>
                    </div>

                    {/* Actual Video Frame */}
                    <div className="relative aspect-video w-full max-h-[380px] bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                      {isYouTubeUrl(currentActiveChapter.videoUrl) && getYouTubeEmbedUrl(currentActiveChapter.videoUrl) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(currentActiveChapter.videoUrl) || ''}
                          title="課程影片預覽"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : isMicrosoftVideoUrl(currentActiveChapter.videoUrl) ? (
                        <iframe
                          src={getMicrosoftVideoEmbedUrl(currentActiveChapter.videoUrl) || currentActiveChapter.videoUrl}
                          title="微軟 Teams/OneDrive 課程影片預覽"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : currentActiveChapter.videoUrl ? (
                        <video
                          src={currentActiveChapter.videoUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80"
                        >
                          您的瀏覽器不支援 HTML5 影片播放。
                        </video>
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                            <Tv className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">尚未設定有效影片連結</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              請於上方章節清單中輸入 YouTube 網址或套用示範連結
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chapter switcher inside preview */}
                    {chapters.length > 1 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                        <button
                          type="button"
                          disabled={selectedChapterIdx === 0}
                          onClick={() => setSelectedChapterIdx(Math.max(0, selectedChapterIdx - 1))}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-200 font-bold flex items-center gap-1"
                        >
                          ← 上一章 ({selectedChapterIdx > 0 ? chapters[selectedChapterIdx - 1].title : ''})
                        </button>
                        <span className="text-slate-400 font-mono">
                          章節 {selectedChapterIdx + 1} / {chapters.length}
                        </span>
                        <button
                          type="button"
                          disabled={selectedChapterIdx === chapters.length - 1}
                          onClick={() => setSelectedChapterIdx(Math.min(chapters.length - 1, selectedChapterIdx + 1))}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-200 font-bold flex items-center gap-1"
                        >
                          下一章 ({selectedChapterIdx < chapters.length - 1 ? chapters[selectedChapterIdx + 1].title : ''}) →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Global Anti-cheating & Completion Thresholds */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      全課程影片防掛機防弊機制與完訓檢核門檻
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">
                          要求總觀看累積秒數 (秒)
                        </label>
                        <input
                          type="number"
                          value={requiredDurationSeconds ?? 0}
                          onChange={(e) => setRequiredDurationSeconds(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400">
                          目前設定約 {Math.round((requiredDurationSeconds || 0) / 60)} 分鐘 (章節總計約 {Math.round(totalChaptersDurationSeconds / 60)} 分鐘)
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">
                          防掛機在線偵測間隔 (秒)
                        </label>
                        <input
                          type="number"
                          value={popupIntervalSeconds ?? 0}
                          onChange={(e) => setPopupIntervalSeconds(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400">每隔 {popupIntervalSeconds} 秒彈跳確認窗</span>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">
                          彈窗逾時退出倒數 (秒)
                        </label>
                        <input
                          type="number"
                          value={popupTimeoutSeconds ?? 0}
                          onChange={(e) => setPopupTimeoutSeconds(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400">逾 {popupTimeoutSeconds} 秒未點擊強制退出</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Assignment & OneDrive Cloud Storage Settings */}
          {activeTab === 'assignment' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Main Switch Card */}
              <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    啟用課後實務作業與 OneDrive 雲端存檔 (Assignment & Cloud Sync)
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    學員需針對本梯次工程專題上傳實務作業（支援 Word / Excel / PPT / PDF / 施工照片），並由指定主管或講師線上批閱評分。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAssignment}
                    onChange={(e) => setHasAssignment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {hasAssignment && (
                <div className="space-y-5">
                  {/* Preset Templates and Preview Action Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        快速套用作業範本：
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentTitle('【課後實務作業】施工工序要徑排程模擬與進度網圖檢討報告');
                          setAssignmentDescription(
                            '請針對目前案場關鍵工項（如地下連續壁、逆打鋼柱或SRC結構吊裝），繪製 CPM 要徑排程網圖與時程壓縮趕工對策，並附上施工要徑影響評估說明。'
                          );
                          setAssignmentGradingType('score_100');
                          setAssignmentPassingScore(70);
                          setAssignmentAllowedTypes(['word', 'excel', 'powerpoint', 'pdf']);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        施工要徑排程
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentTitle('【課後實務作業】現場施工品質自主查驗缺失改善與履歷追蹤報告');
                          setAssignmentDescription(
                            '請挑選近期案場自主查核發現之結構/機電/防水缺失一則，依據課堂查核要點填寫改善前後對策分析表，並附上現場實測照片佐證。'
                          );
                          setAssignmentGradingType('score_100');
                          setAssignmentPassingScore(75);
                          setAssignmentAllowedTypes(['word', 'excel', 'pdf', 'image']);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        品質自主查驗
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentTitle('【課後實務作業】BIM 4D 施工界面碰撞排除與工法模擬分析');
                          setAssignmentDescription(
                            '請利用 Revit/Navisworks 匯出案場結構與管線之碰撞報告，提出至少 2 項具體界面修正方案與施工動線檢討。'
                          );
                          setAssignmentGradingType('pass_fail');
                          setAssignmentPassingScore(70);
                          setAssignmentAllowedTypes(['powerpoint', 'pdf', 'excel']);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        BIM 界面碰撞
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOneDriveFolderModalOpen(true)}
                        className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderCheck className="w-3.5 h-3.5 text-sky-600" />
                        檢視本梯次 OneDrive 雲端作業資料夾
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAssignmentPreviewModalOpen(true)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        模擬學員前台作業繳交畫面
                      </button>
                    </div>
                  </div>

                  {/* Basic Assignment Settings Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-sky-600" />
                        作業基本設定與完成要件
                      </h5>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={assignmentRequiredForCompletion}
                            onChange={(e) => setAssignmentRequiredForCompletion(e.target.checked)}
                            className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                          />
                          <span>結訓完訓必要條件 (須通過作業批閱方可核發結業學分)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          作業專題名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={assignmentTitle}
                          onChange={(e) => setAssignmentTitle(e.target.value)}
                          placeholder="例如：【課後實務作業】施工工序要徑排程模擬與進度檢討報告"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          繳交截止期限
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">課程結束後</span>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={assignmentDueDateDays}
                            onChange={(e) => setAssignmentDueDateDays(Number(e.target.value))}
                            className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center"
                          />
                          <span className="text-xs text-slate-500">天內繳交</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        作業題目指引與繳交規範說明 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                        placeholder="請詳細說明作業要求、撰寫格式、工程數據引用原則及成果評審指標..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sky-500 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Reviewer & Grading Mechanism Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reviewer Configuration */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        指定批閱評審人員
                      </h5>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          指定批閱講師 / 主管
                        </label>
                        <select
                          value={assignmentReviewerEmpNo}
                          onChange={(e) => setAssignmentReviewerEmpNo(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500"
                        >
                          <optgroup label="授課講師與內部師資">
                            {instructors.map((inst) => (
                              <option key={inst.id} value={inst.empNo || inst.id}>
                                {inst.name} ({inst.empNo || '內部講師'}) - {inst.title || inst.department || '專案講師'}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="工務部門主管與工程專家">
                            {employees.slice(0, 15).map((emp) => (
                              <option key={emp.id} value={emp.empNo}>
                                {emp.name} ({emp.empNo}) - {emp.department} {emp.title}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          系統將於學員上傳作業後自動派案至該人員之後台「作業批閱與考評中心」。
                        </span>
                      </div>
                    </div>

                    {/* Grading Mode & Passing Threshold */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        作業評分與及格機制
                      </h5>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            評分模式
                          </label>
                          <select
                            value={assignmentGradingType}
                            onChange={(e) => setAssignmentGradingType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            <option value="score_100">百分制評分 (0 ~ 100 分)</option>
                            <option value="pass_fail">合格審查制 (通過 / 未通過)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            及格標準分數
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={assignmentPassingScore}
                              onChange={(e) => setAssignmentPassingScore(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                            />
                            <span className="text-xs text-slate-500 font-bold">分</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Storage & File Formats Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FolderCheck className="w-4 h-4 text-sky-600" />
                      允許檔案格式與 Microsoft 365 / OneDrive 雲端歸檔路徑
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Allowed Formats */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2">
                          允許上傳之作業檔案類型
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { key: 'word' as AssignmentFileType, label: 'Word 文件', ext: '.docx, .doc', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                            { key: 'excel' as AssignmentFileType, label: 'Excel 試算表', ext: '.xlsx, .xls', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                            { key: 'powerpoint' as AssignmentFileType, label: 'PPT 簡報', ext: '.pptx, .ppt', icon: Presentation, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                            { key: 'pdf' as AssignmentFileType, label: 'PDF 檔案', ext: '.pdf', icon: FileText, color: 'text-red-600 bg-red-50 border-red-200' },
                            { key: 'image' as AssignmentFileType, label: '工程照片/圖說', ext: '.jpg, .png', icon: Eye, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                          ].map((fmt) => {
                            const isSelected = assignmentAllowedTypes.includes(fmt.key);
                            const IconComp = fmt.icon;
                            return (
                              <button
                                key={fmt.key}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    if (assignmentAllowedTypes.length > 1) {
                                      setAssignmentAllowedTypes(assignmentAllowedTypes.filter((t) => t !== fmt.key));
                                    }
                                  } else {
                                    setAssignmentAllowedTypes([...assignmentAllowedTypes, fmt.key]);
                                  }
                                }}
                                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                                  isSelected ? fmt.color + ' ring-1 ring-offset-1 ring-sky-500' : 'bg-slate-50 border-slate-200 opacity-60'
                                }`}
                              >
                                <IconComp className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-xs text-slate-900">{fmt.label}</div>
                                  <div className="text-[10px] text-slate-500">{fmt.ext}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* File size limit and OneDrive path */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            單一檔案大小上限 (MB)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={5}
                              max={200}
                              value={assignmentMaxFileSizeMB}
                              onChange={(e) => setAssignmentMaxFileSizeMB(Number(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                            />
                            <span className="text-xs text-slate-500">MB (建議上限 50MB)</span>
                          </div>
                        </div>

                        {/* Real Microsoft 365 / OneDrive Shared Link (Plan A) */}
                        <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                              <Cloud className="w-3.5 h-3.5 text-sky-600" />
                              遠雄 Microsoft 365 官方共用資料夾網址 (SharePoint / OneDrive Link)
                            </label>
                            {assignmentOneDriveShareUrl && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                已設定微軟直連連結
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={assignmentOneDriveShareUrl}
                              onChange={(e) => setAssignmentOneDriveShareUrl(e.target.value)}
                              placeholder="請貼上遠雄微軟 365 共用連結 (例如：https://farglorygroup-my.sharepoint.com/... 或 OneDrive 共用網址)"
                              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-xs font-mono text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (assignmentOneDriveShareUrl && assignmentOneDriveShareUrl.startsWith('http')) {
                                  window.open(assignmentOneDriveShareUrl, '_blank', 'noopener,noreferrer');
                                } else {
                                  alert('請先輸入有效的 http/https 微軟共用資料夾網址！');
                                }
                              }}
                              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              測試開啟真實微軟連結
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-600 space-y-1 bg-white/80 p-2.5 rounded-lg border border-sky-100">
                            <div className="font-bold text-sky-900 flex items-center gap-1">
                              <span>💡 微軟 365 共用資料夾建立與連結說明（方案 A）：</span>
                            </div>
                            <p className="text-slate-600">
                              1. 講師/主辦人請在遠雄 Microsoft 365 建立本梯次資料夾，點選「共用」並設定權限為 <strong>「遠雄組織內具備連結者皆可編輯」</strong>（或「要求檔案」）。
                            </p>
                            <p className="text-slate-600">
                              2. 將複製的共用連結貼入上方。學員繳交作業時將直接在新分頁開啟該真實微軟網頁，由微軟官方處理帳號登入與手機 Authenticator 雙重認證。
                            </p>
                          </div>
                        </div>

                        {/* Internal Directory Tag */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-700">
                              本梯次資料夾內部代碼識別
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentOneDriveFolderPath(
                                  `OneDrive://建築工程處/專業訓練作業/2026/${batch.batchCode || course.courseCode || 'TR-ENG-2026'}/`
                                );
                              }}
                              className="text-[10px] text-sky-600 hover:text-sky-800 font-bold"
                            >
                              恢復預設路徑代碼
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={assignmentOneDriveFolderPath}
                              onChange={(e) => setAssignmentOneDriveFolderPath(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => setIsOneDriveFolderModalOpen(true)}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FolderCheck className="w-3.5 h-3.5" />
                              作業管理清冊
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline Simulator / Student Experience Preview */}
                  <div className="bg-gradient-to-r from-sky-900 to-indigo-950 p-4 rounded-xl text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-sky-300" />
                        <div>
                          <h6 className="font-bold text-xs text-white">前台學員作業繳交介面即時預覽</h6>
                          <p className="text-[11px] text-sky-200">
                            學員登入前台研習教室後，將依上方之指引、格式與截止時間進行繳交。
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAssignmentPreviewModalOpen(true)}
                        className="px-3.5 py-1.5 bg-white text-sky-900 hover:bg-sky-50 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        全螢幕模擬繳交
                      </button>
                    </div>

                    <div className="mt-3 bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/20 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sky-300 font-bold">作業專題：</span>
                        <span className="font-semibold text-white ml-1">{assignmentTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-sky-100">
                        <span>批閱評審：<strong>{instructors.find((i) => (i.empNo || i.id) === assignmentReviewerEmpNo)?.name || batch.primaryInstructorName || '陳冠霖'}</strong></span>
                        <span>及格標準：<strong>{assignmentGradingType === 'score_100' ? `${assignmentPassingScore} 分` : '合格審查制'}</strong></span>
                        <span>格式：<strong>{assignmentAllowedTypes.join('、').toUpperCase()}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Online Exam Settings */}
          {activeTab === 'exam' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    啟用隨堂線上測驗 (自動閱卷與配分)
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    學員觀看影片後需進行測驗，達標及格分數方可結訓或進入後續滿意度調查。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPostTest}
                    onChange={(e) => setHasPostTest(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {hasPostTest && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">及格標準分數</label>
                      <input
                        type="number"
                        value={passingScore ?? 70}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                      <span className="text-[10px] text-slate-400">滿分 100 分</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">允許重測次數</label>
                      <select
                        value={maxAttempts ?? 3}
                        onChange={(e) => setMaxAttempts(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        <option value={1}>僅限 1 次 (不可重測)</option>
                        <option value={2}>最多 2 次</option>
                        <option value={3}>最多 3 次 (標準)</option>
                        <option value={5}>最多 5 次</option>
                        <option value={0}>無上限 (測驗通過為止)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">作答時限 (分鐘)</label>
                      <input
                        type="number"
                        value={examConfig.timeLimitMinutes ?? 30}
                        onChange={(e) =>
                          setExamConfig((prev) => ({ ...prev, timeLimitMinutes: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Anti-Cheating Randomization Settings (防同仁鄰座偷看作弊) */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">
                          線上隨堂防弊隨機設定 (杜絕同仁鄰座抄看答案)
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full font-bold border border-amber-300/60">
                        作弊防範機制
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors shadow-2xs">
                        <input
                          type="checkbox"
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                            題目順序隨機 (打散題序)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            同仁受測時題目順序隨機抽換，鄰座人員題號與出題順序皆不相同，無法邊考邊偷看。
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors shadow-2xs">
                        <input
                          type="checkbox"
                          checked={shuffleOptions}
                          onChange={(e) => setShuffleOptions(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Shuffle className="w-3.5 h-3.5 text-orange-600" />
                            選項順序隨機 (打散選項)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            單選/多選題選項隨機排列，防止學員死記 A/B/C/D 選項代號或透過選項位置作弊。
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="font-bold text-slate-900">
                      測驗題目與配分列表 ({examConfig.questions.length} 題 · 總分{' '}
                      {examConfig.questions.reduce((sum, q) => sum + (q.points || 0), 0)} 分)
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ: InteractiveQuestion = {
                            id: `exam-q-${Date.now()}`,
                            title: '新工程測驗題目：關於本課堂規範，下列敘述何者正確？',
                            type: 'single_choice',
                            required: true,
                            options: ['選項 A', '選項 B', '選項 C', '選項 D'],
                            correctAnswer: '選項 A',
                            points: 20,
                            explanation: '請參閱施工規範標準作業程序。',
                          };
                          setExamConfig((prev) => ({
                            ...prev,
                            questions: [...prev.questions, newQ],
                          }));
                          setEditingExamIdx(examConfig.questions.length);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新增選擇題
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newMatchingQ: InteractiveQuestion = {
                            id: `exam-q-${Date.now()}`,
                            title: '【連連看】請將下列左側工程項目與右側對應法規或品質查核重點進行點擊連線配對：',
                            type: 'matching',
                            required: true,
                            points: 20,
                            matchingScoringMode: 'partial',
                            matchingPairs: [
                              { id: `pair-${Date.now()}-1`, leftText: '逆打工法鋼柱', rightText: '垂直度精度達 1/1000' },
                              { id: `pair-${Date.now()}-2`, leftText: '連續壁接頭灌漿', rightText: '超音波垂直檢驗與槽底清理' },
                              { id: `pair-${Date.now()}-3`, leftText: '深開挖抽水減壓', rightText: '雙環觀測水頭差以防湧砂' },
                              { id: `pair-${Date.now()}-4`, leftText: '安全支撐系統', rightText: '油壓千斤頂施加預力與即時軸力監測' },
                            ],
                            explanation: '左側工法重點對應右側品質檢核項目，各項皆為現場查核要項。',
                          };
                          setExamConfig((prev) => ({
                            ...prev,
                            questions: [...prev.questions, newMatchingQ],
                          }));
                          setEditingExamIdx(examConfig.questions.length);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        新增連連看題型
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsExamPreviewModalOpen(true)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-200" />
                        預覽測驗畫面 (學員試答/即時閱卷)
                      </button>

                      <button
                        onClick={() => setFormsDesignerMode('exam')}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                        開啟 MS Forms 測驗設計器
                      </button>
                    </div>
                  </div>

                  {/* Exam Question Cards */}
                  <div className="space-y-3">
                    {examConfig.questions.map((q, idx) => {
                      const isEditing = editingExamIdx === idx;
                      return (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-amber-300 transition-colors"
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800">編輯測驗考題 #{idx + 1}</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-600">配分:</span>
                                    <input
                                      type="number"
                                      value={q.points || 25}
                                      onChange={(e) => {
                                        const p = Number(e.target.value);
                                        setExamConfig((prev) => ({
                                          ...prev,
                                          questions: prev.questions.map((item, i) =>
                                            i === idx ? { ...item, points: p } : item
                                          ),
                                        }));
                                      }}
                                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-center font-bold"
                                    />
                                    <span className="text-xs text-slate-500">分</span>
                                  </div>
                                  <select
                                    value={q.type}
                                    onChange={(e) => {
                                      const t = e.target.value as any;
                                      setExamConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx
                                            ? {
                                                ...item,
                                                type: t,
                                                options:
                                                  t === 'single_choice' || t === 'multiple_choice'
                                                    ? item.options || ['選項 A', '選項 B']
                                                    : undefined,
                                                matchingPairs:
                                                  t === 'matching'
                                                    ? item.matchingPairs && item.matchingPairs.length > 0
                                                      ? item.matchingPairs
                                                      : [
                                                          { id: 'p-1', leftText: '逆打工法鋼柱', rightText: '垂直度偏差控制於 1/1000 內' },
                                                          { id: 'p-2', leftText: '連續壁單元接頭', rightText: '超音波垂直檢驗與槽底抓渣' },
                                                          { id: 'p-3', leftText: '深開挖抽水減壓', rightText: '雙環觀測水頭差防湧砂' },
                                                          { id: 'p-4', leftText: '安全支撐系統', rightText: '千斤頂預力施加與軸力即時監控' },
                                                        ]
                                                    : item.matchingPairs,
                                                matchingScoringMode:
                                                  t === 'matching'
                                                    ? item.matchingScoringMode || 'partial'
                                                    : item.matchingScoringMode,
                                              }
                                            : item
                                        ),
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                                  >
                                    <option value="single_choice">單選題</option>
                                    <option value="multiple_choice">多選題</option>
                                    <option value="true_false">是非題</option>
                                    <option value="matching">🔗 連連看（點擊連線配對題）</option>
                                    <option value="essay">申論問答題</option>
                                  </select>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={q.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setExamConfig((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((item, i) =>
                                      i === idx ? { ...item, title: val } : item
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                placeholder="測驗考題題目或作答說明..."
                              />

                              {/* Matching (連連看) editing */}
                              {q.type === 'matching' && (
                                <div className="space-y-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
                                  {/* Scoring Mode Selector */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-indigo-950 mb-1.5 flex items-center gap-1.5">
                                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                                      連連看配分機制：
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <label
                                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                          (q.matchingScoringMode || 'partial') === 'all_or_nothing'
                                            ? 'bg-rose-50 border-rose-400 text-rose-950'
                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`matching-score-${idx}`}
                                          checked={q.matchingScoringMode === 'all_or_nothing'}
                                          onChange={() => {
                                            setExamConfig((prev) => ({
                                              ...prev,
                                              questions: prev.questions.map((item, i) =>
                                                i === idx ? { ...item, matchingScoringMode: 'all_or_nothing' } : item
                                              ),
                                            }));
                                          }}
                                          className="mt-0.5 text-rose-600"
                                        />
                                        <div>
                                          <span className="text-xs font-bold block">
                                            (1) 全對才給分 (整題 0 分 / 滿分)
                                          </span>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            整組連連看必須完全配對正確才給予該大題的分數，錯一題即整題 0 分。
                                          </p>
                                        </div>
                                      </label>

                                      <label
                                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                          (q.matchingScoringMode || 'partial') === 'partial'
                                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950'
                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`matching-score-${idx}`}
                                          checked={(q.matchingScoringMode || 'partial') === 'partial'}
                                          onChange={() => {
                                            setExamConfig((prev) => ({
                                              ...prev,
                                              questions: prev.questions.map((item, i) =>
                                                i === idx ? { ...item, matchingScoringMode: 'partial' } : item
                                              ),
                                            }));
                                          }}
                                          className="mt-0.5 text-indigo-600"
                                        />
                                        <div>
                                          <span className="text-xs font-bold block">
                                            (2) 按比例給分（部分得分）
                                          </span>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            最常見設定。例如總共 5 組配對，每配對正確一組給予相應比例分數，答對 3 組得 60% 分數。
                                          </p>
                                        </div>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Pairs list editing */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-bold text-slate-700">
                                        配對項目清單（左側項目 ↔ 右側對應正解，系統作答時右側將隨機洗牌）：
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const demoPairs = [
                                              { id: `p-${Date.now()}-1`, leftText: '逆打工法鋼柱', rightText: '垂直度偏差控制於 1/1000 內' },
                                              { id: `p-${Date.now()}-2`, leftText: '連續壁單元接頭', rightText: '超音波槽檢垂直精度與槽底清理' },
                                              { id: `p-${Date.now()}-3`, leftText: '深開挖抽水減壓', rightText: '雙環即時觀測水頭差防湧砂' },
                                              { id: `p-${Date.now()}-4`, leftText: '安全支撐系統', rightText: '千斤頂預力施加與軸力即時監控' },
                                            ];
                                            setExamConfig((prev) => ({
                                              ...prev,
                                              questions: prev.questions.map((item, i) =>
                                                i === idx ? { ...item, matchingPairs: demoPairs } : item
                                              ),
                                            }));
                                          }}
                                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                                        >
                                          帶入實務範例
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const curPairs = q.matchingPairs || [];
                                            const newPair = {
                                              id: `pair-${Date.now()}-${curPairs.length + 1}`,
                                              leftText: `新項目 ${curPairs.length + 1}`,
                                              rightText: `對應正解 ${curPairs.length + 1}`,
                                            };
                                            setExamConfig((prev) => ({
                                              ...prev,
                                              questions: prev.questions.map((item, i) =>
                                                i === idx ? { ...item, matchingPairs: [...curPairs, newPair] } : item
                                              ),
                                            }));
                                          }}
                                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3" />
                                          新增配對組
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      {(q.matchingPairs || []).map((pair, pIdx) => (
                                        <div
                                          key={pair.id || pIdx}
                                          className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200"
                                        >
                                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                            {pIdx + 1}
                                          </span>
                                          <input
                                            type="text"
                                            value={pair.leftText}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setExamConfig((prev) => ({
                                                ...prev,
                                                questions: prev.questions.map((item, i) =>
                                                  i === idx
                                                    ? {
                                                        ...item,
                                                        matchingPairs: item.matchingPairs?.map((p, pi) =>
                                                          pi === pIdx ? { ...p, leftText: val } : p
                                                        ),
                                                      }
                                                    : item
                                                ),
                                              }));
                                            }}
                                            placeholder="左側項目名稱..."
                                            className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded font-semibold text-slate-800"
                                          />
                                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                          <input
                                            type="text"
                                            value={pair.rightText}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setExamConfig((prev) => ({
                                                ...prev,
                                                questions: prev.questions.map((item, i) =>
                                                  i === idx
                                                    ? {
                                                        ...item,
                                                        matchingPairs: item.matchingPairs?.map((p, pi) =>
                                                          pi === pIdx ? { ...p, rightText: val } : p
                                                        ),
                                                      }
                                                    : item
                                                ),
                                              }));
                                            }}
                                            placeholder="右側對應標準正解..."
                                            className="flex-1 px-2.5 py-1 text-xs border border-emerald-300 bg-emerald-50/40 rounded font-semibold text-emerald-950"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setExamConfig((prev) => ({
                                                ...prev,
                                                questions: prev.questions.map((item, i) =>
                                                  i === idx
                                                    ? {
                                                        ...item,
                                                        matchingPairs: item.matchingPairs?.filter((_, pi) => pi !== pIdx),
                                                      }
                                                    : item
                                                ),
                                              }));
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                                            title="刪除此配對"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Options editing */}
                              {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'true_false') && (
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-bold text-slate-600">選項列表 (一行一個)</label>
                                  <textarea
                                    value={q.options?.join('\n') || ''}
                                    onChange={(e) => {
                                      const opts = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                                      setExamConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx ? { ...item, options: opts } : item
                                        ),
                                      }));
                                    }}
                                    rows={3}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                                    placeholder="選項 A&#10;選項 B&#10;選項 C"
                                  />
                                </div>
                              )}

                              {/* Correct Answer editing */}
                              {q.type !== 'matching' && (
                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                    標準正解答案
                                  </label>
                                  <input
                                    type="text"
                                    value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(',') : q.correctAnswer || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setExamConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx ? { ...item, correctAnswer: val } : item
                                        ),
                                      }));
                                    }}
                                    placeholder="填入標準正解文字（例如：選項 A）"
                                    className="w-full px-3 py-1.5 bg-emerald-50/60 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950"
                                  />
                                </div>
                              )}

                              {/* Explanation editing */}
                              <div>
                                <label className="block text-[11px] font-bold text-indigo-800 mb-1">
                                  解答解析與規範說明 (選填)
                                </label>
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExamConfig((prev) => ({
                                      ...prev,
                                      questions: prev.questions.map((item, i) =>
                                        i === idx ? { ...item, explanation: val } : item
                                      ),
                                    }));
                                  }}
                                  placeholder="答題後的提示與規範解析..."
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingExamIdx(null)}
                                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                                >
                                  完成題目修改
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                                    {q.type === 'single_choice'
                                      ? '單選題'
                                      : q.type === 'multiple_choice'
                                      ? '多選題'
                                      : q.type === 'true_false'
                                      ? '是非題'
                                      : q.type === 'matching'
                                      ? '🔗 連連看（點擊連線配對）'
                                      : '申論問答題'}
                                  </span>
                                  {q.type === 'matching' && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        q.matchingScoringMode === 'all_or_nothing'
                                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                      }`}
                                    >
                                      {q.matchingScoringMode === 'all_or_nothing'
                                        ? '全對才給分 (整題0/滿分)'
                                        : '按比例給分 (每組配對得分)'}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                                    配分：{q.points || 20} 分
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExamIdx(idx)}
                                    className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors"
                                    title="編輯此題"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExamConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                    title="刪除此題"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="font-bold text-slate-800 pl-7">{q.title}</div>

                              {/* Matching pairs preview */}
                              {q.type === 'matching' && q.matchingPairs && (
                                <div className="pl-7 space-y-1.5 pt-1">
                                  <div className="text-[11px] font-bold text-slate-500">
                                    配對正解清單（{q.matchingPairs.length} 組配對）：
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {q.matchingPairs.map((pair, pIdx) => (
                                      <div
                                        key={pair.id || pIdx}
                                        className="flex items-center gap-1.5 p-1.5 bg-white rounded border border-slate-200 text-[11px]"
                                      >
                                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {pIdx + 1}
                                        </span>
                                        <span className="font-bold text-slate-800">{pair.leftText}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="text-emerald-700 font-semibold">{pair.rightText}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {q.options && (
                                <div className="pl-7 space-y-1 text-[11px] text-slate-600">
                                  {q.options.map((opt, oIdx) => {
                                    const isCorrect = Array.isArray(q.correctAnswer)
                                      ? q.correctAnswer.includes(opt)
                                      : q.correctAnswer === opt;
                                    return (
                                      <div
                                        key={oIdx}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
                                          isCorrect ? 'bg-emerald-50 text-emerald-800 font-bold' : ''
                                        }`}
                                      >
                                        <span>{isCorrect ? '✓ [正解]' : '○'}</span>
                                        <span>{opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {q.explanation && (
                                <div className="pl-7 text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-lg mt-1">
                                  💡 <strong>解答解析：</strong>{q.explanation}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Post-Survey Settings */}
          {activeTab === 'post_survey' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-purple-600" />
                    啟用課後滿意度調查 (MS Forms)
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    學員完成測驗後，填寫課後滿意度調查問卷作為講師教學評估與訓練成效指標。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPostSurvey}
                    onChange={(e) => setHasPostSurvey(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {hasPostSurvey && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      滿意度問卷題目 ({postSurveyConfig.questions.length} 題)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ: InteractiveQuestion = {
                            id: `post-q-${Date.now()}`,
                            title: '新滿意度題目：對於本次課程內容在工程現場實務應用的助益程度評估？',
                            type: 'rating_star',
                            required: true,
                          };
                          setPostSurveyConfig((prev) => ({
                            ...prev,
                            questions: [...prev.questions, newQ],
                          }));
                          setEditingPostSurveyIdx(postSurveyConfig.questions.length);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新增滿意度題目
                      </button>

                      <button
                        onClick={() => setFormsDesignerMode('post_survey')}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                        開啟 MS Forms 滿意度設計器
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {postSurveyConfig.questions.map((q, idx) => {
                      const isEditing = editingPostSurveyIdx === idx;
                      return (
                        <div
                          key={q.id || idx}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-purple-300 transition-colors"
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-700">編輯滿意度題目 #{idx + 1}</span>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={q.required}
                                      onChange={(e) => {
                                        const req = e.target.checked;
                                        setPostSurveyConfig((prev) => ({
                                          ...prev,
                                          questions: prev.questions.map((item, i) =>
                                            i === idx ? { ...item, required: req } : item
                                          ),
                                        }));
                                      }}
                                      className="rounded text-purple-600"
                                    />
                                    必填
                                  </label>
                                  <select
                                    value={q.type}
                                    onChange={(e) => {
                                      const t = e.target.value as any;
                                      setPostSurveyConfig((prev) => ({
                                        ...prev,
                                        questions: prev.questions.map((item, i) =>
                                          i === idx ? { ...item, type: t } : item
                                        ),
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                                  >
                                    <option value="rating_star">1~5星滿意度評分</option>
                                    <option value="single_choice">單選題</option>
                                    <option value="multiple_choice">多選題</option>
                                    <option value="essay">開放式建言</option>
                                  </select>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={q.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPostSurveyConfig((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((item, i) =>
                                      i === idx ? { ...item, title: val } : item
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                                placeholder="題目標題..."
                              />

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingPostSurveyIdx(null)}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold"
                                >
                                  完成修改
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                                  {q.type === 'rating_star'
                                    ? '1~5星評分'
                                    : q.type === 'single_choice'
                                    ? '單選題'
                                    : q.type === 'multiple_choice'
                                    ? '多選題'
                                    : '開放式建言'}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">{q.title}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingPostSurveyIdx(idx)}
                                  className="p-1 text-slate-400 hover:text-purple-700 rounded transition-colors"
                                  title="編輯此題"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPostSurveyConfig((prev) => ({
                                      ...prev,
                                      questions: prev.questions.filter((_, i) => i !== idx),
                                    }));
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                  title="刪除此題"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SMART Action Plan */}
          {activeTab === 'action_plan' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-rose-600" />
                    啟用課後 SMART 行動實踐計畫
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    要求學員結業後設定 60 天工程落實目標 (S-M-A-R-T)，並由直屬主管/案主管進行現場成效考評。
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSmartPlan}
                    onChange={(e) => setHasSmartPlan(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {hasSmartPlan && (
                <div className="space-y-5">
                  {/* ADMIN CONFIGURATION PANEL FOR SMART PLAN */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-rose-600" />
                        SMART 行動計畫管理員參數與及格標準設定
                      </h5>
                      <span className="text-[10px] text-slate-500 font-normal">
                        此處設定將同步規範前端學員填寫表單與主管考評規準
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1. Review Level */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          考評與覆核主管層級指定
                        </label>
                        <select
                          value={smartPlanReviewLevel}
                          onChange={(e) => setSmartPlanReviewLevel(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="direct_manager">直屬案主管 (工務所長 / 副所長)</option>
                          <option value="dept_manager">部門主管 (營建部協理 / 工務協理)</option>
                          <option value="president">總經理 / 總裁</option>
                        </select>
                      </div>

                      {/* 2. Days Limit */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          行動方案實踐期限 (天數)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={7}
                            max={365}
                            value={smartPlanDaysLimit}
                            onChange={(e) => setSmartPlanDaysLimit(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-bold">天</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                          <span>快速選取：</span>
                          {[30, 60, 90, 120].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setSmartPlanDaysLimit(d)}
                              className={`px-1.5 py-0.2 rounded border ${
                                smartPlanDaysLimit === d
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {d}天
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Passing Score */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          主管考評及格分數標準 (分)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={50}
                            max={100}
                            value={smartPlanPassingScore}
                            onChange={(e) => setSmartPlanPassingScore(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-bold">分及格</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                          <span>常用標準：</span>
                          {[70, 75, 80, 85].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSmartPlanPassingScore(s)}
                              className={`px-1.5 py-0.2 rounded border ${
                                smartPlanPassingScore === s
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {s}分
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* S-M-A-R-T Rubrics CRUD Section */}
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-xs text-slate-800">
                            S-M-A-R-T 現場實踐查驗評核指標 (Rubrics)
                          </h6>
                          <span className="text-[10px] text-slate-500">
                            共 {smartRubrics.length} 項指標，主管將依此指標進行現場成效覆核
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newRubric = {
                                id: `rubric-${Date.now()}`,
                                dimension: '新指標 (自訂查驗項)',
                                target: '請填入本工程案場具體查驗與改善要求規範...',
                                weight: 20,
                              };
                              setSmartRubrics([...smartRubrics, newRubric]);
                              setEditingRubricId(newRubric.id);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            新增檢核指標
                          </button>

                          <button
                            type="button"
                            onClick={() => setSmartRubrics(defaultSmartRubrics)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] underline cursor-pointer"
                          >
                            恢復標準指標
                          </button>
                        </div>
                      </div>

                      {/* Rubrics List Cards */}
                      <div className="space-y-2">
                        {smartRubrics.map((r: any, rIdx: number) => {
                          const isEditing = editingRubricId === r.id;
                          return (
                            <div
                              key={r.id || rIdx}
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-rose-300 transition-colors flex items-start justify-between gap-3"
                            >
                              <div className="flex-1 space-y-1.5">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={r.dimension}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setSmartRubrics((prev: any[]) =>
                                            prev.map((item) => (item.id === r.id ? { ...item, dimension: val } : item))
                                          );
                                        }}
                                        placeholder="維度名稱，例如：S (明確性)"
                                        className="w-48 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                                      />
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500">權重:</span>
                                        <input
                                          type="number"
                                          value={r.weight || 20}
                                          onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setSmartRubrics((prev: any[]) =>
                                              prev.map((item) => (item.id === r.id ? { ...item, weight: val } : item))
                                            );
                                          }}
                                          className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-center"
                                        />
                                        <span className="text-xs text-slate-500">%</span>
                                      </div>
                                    </div>
                                    <textarea
                                      value={r.target}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSmartRubrics((prev: any[]) =>
                                          prev.map((item) => (item.id === r.id ? { ...item, target: val } : item))
                                        );
                                      }}
                                      rows={2}
                                      className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                                      placeholder="檢核標準之具體文字要求..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setEditingRubricId(null)}
                                      className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-bold"
                                    >
                                      完成編輯
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">
                                        {rIdx + 1}
                                      </span>
                                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                                        {r.dimension}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        配分權重：<strong>{r.weight || 20}%</strong>
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 pl-7 leading-relaxed font-medium">
                                      {r.target}
                                    </p>
                                  </>
                                )}
                              </div>

                              {!isEditing && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRubricId(r.id)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                    title="編輯此指標"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (smartRubrics.length <= 1) {
                                        alert('至少須保留一項 SMART 評核指標。');
                                        return;
                                      }
                                      setSmartRubrics(smartRubrics.filter((item: any) => item.id !== r.id));
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="刪除此指標"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* SMART FORM LIVE PREVIEW SECTION */}
                  <div className="p-5 bg-gradient-to-br from-rose-50/60 via-slate-50 to-indigo-50/50 rounded-2xl border-2 border-rose-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                            即時表單預覽
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-rose-600" />
                            SMART 表單畫面預覽與三階段情境模擬
                          </h4>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          即時預覽學員於前端所見之 S-M-A-R-T 五大填寫指標、60天自評回報與主管考評介面。
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSmartPlanPreviewModalOpen(true)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        開啟全螢幕互動預覽視窗
                      </button>
                    </div>

                    {/* Preview Mode Selector */}
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-rose-200 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setSmartPreviewTab('goal')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          smartPreviewTab === 'goal'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        階段一：學員設定 SMART 目標
                      </button>

                      <button
                        type="button"
                        onClick={() => setSmartPreviewTab('self_eval')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          smartPreviewTab === 'self_eval'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        階段二：學員 60 天成效自評
                      </button>

                      <button
                        type="button"
                        onClick={() => setSmartPreviewTab('manager_review')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          smartPreviewTab === 'manager_review'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        階段三：直屬主管現場考評
                      </button>
                    </div>

                    {/* EMBEDDED FORM CARD PREVIEW */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                      
                      {/* Banner */}
                      <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-rose-300">
                              【結訓行動實踐表單】{course.title}
                            </div>
                            <div className="text-sm font-black text-white">
                              {smartPreviewTab === 'goal'
                                ? '設定課後 60 天現場 SMART 落實指標'
                                : smartPreviewTab === 'self_eval'
                                ? '學員落實成效自我考評與量化數據回報'
                                : '直屬案主管現場考評核定與結訓評語'}
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-white/10 text-slate-200 border border-white/20 rounded-lg text-[11px] font-bold">
                          預覽模式 (Sample Preview)
                        </span>
                      </div>

                      {/* MODE 1: STUDENT GOAL SETTING */}
                      {smartPreviewTab === 'goal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in">
                          {/* S */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="font-bold text-xs text-blue-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                S
                              </span>
                              明確具體目標 (Specific)
                            </div>
                            <p className="text-[11px] text-slate-400">定義清楚欲落實於工務所之技術、工法或要徑管理策略</p>
                            <div className="p-2.5 bg-white border border-blue-100 rounded-lg text-xs text-slate-800 font-medium">
                              於新北 HM6 案場全面導入 24 小時連續壁側向變位自動化電子水準儀與傾斜儀。
                            </div>
                          </div>

                          {/* M */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="font-bold text-xs text-emerald-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                M
                              </span>
                              量化衡量指標 (Measurable)
                            </div>
                            <p className="text-[11px] text-slate-400">設定可量測驗證之 KPI、精準度或偏差容許率</p>
                            <div className="p-2.5 bg-white border border-emerald-100 rounded-lg text-xs text-slate-800 font-medium">
                              即時監測數據傳輸率達 99.5%，若位移達警戒值 (15mm) 自動發出 Line 與 SMS 警報。
                            </div>
                          </div>

                          {/* A */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="font-bold text-xs text-purple-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                                A
                              </span>
                              可行達成策略 (Achievable)
                            </div>
                            <p className="text-[11px] text-slate-400">列出達成目標所需之資源配合、協調會議或標準作業 SOP</p>
                            <div className="p-2.5 bg-white border border-purple-100 rounded-lg text-xs text-slate-800 font-medium">
                              已與監測儀器包商完成介面整合，預計於開挖前 14 天完成系統全尺度校正。
                            </div>
                          </div>

                          {/* R */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="font-bold text-xs text-amber-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                                R
                              </span>
                              工程關聯效益 (Relevant)
                            </div>
                            <p className="text-[11px] text-slate-400">說明該實踐目標與案場安全、進度控制及零災害之核心關聯</p>
                            <div className="p-2.5 bg-white border border-amber-100 rounded-lg text-xs text-slate-800 font-medium">
                              控制基坑安全，杜絕鄰房沈陷，保障建案如期如質零災害。
                            </div>
                          </div>

                          {/* T */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 md:col-span-2">
                            <div className="font-bold text-xs text-rose-700 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                                T
                              </span>
                              期限與落實承諾 (Time-bound)
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-rose-100 rounded-lg text-xs text-slate-800 font-medium">
                              <span>預計落實截止日：<strong>2026-10-15</strong> (結訓後 60 天)</span>
                              <span className="text-rose-600 font-bold">✓ 學員承諾確實執行現場實踐</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: STUDENT SELF EVALUATION */}
                      {smartPreviewTab === 'self_eval' && (
                        <div className="space-y-3.5 animate-in fade-in">
                          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                課後 60 天到期學員自我考評成果回報
                              </span>
                              <span className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs">
                                自評得分：92 分 (優等)
                              </span>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                                <strong>【實踐成果總結】：</strong>
                                <p className="text-slate-700 mt-0.5">
                                  已完成設備採購發包與現場測試，順利建置 24 小時自動化傳輸監控，開挖期間連續壁位移偏差全數小於 8mm (警戒值 15mm)，成效顯著。
                                </p>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                                <span className="text-slate-600">佐證附件：<strong>HM6案_連續壁自動化監測成果報告.pdf</strong> (2.4 MB)</span>
                                <span className="text-emerald-600 font-bold text-[11px]">✓ 已上傳至研習履歷</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 3: MANAGER REVIEW */}
                      {smartPreviewTab === 'manager_review' && (
                        <div className="space-y-3.5 animate-in fade-in">
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-emerald-600" />
                                直屬案主管 (工務所長) 現場落實考評與核決
                              </div>
                              <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                                考評成績：95 分 (特優 · 核發結訓學分)
                              </span>
                            </div>

                            <div className="p-3 bg-white border border-emerald-100 rounded-lg text-xs space-y-1.5">
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>考評主管評語 (陳冠霖 經理)：</span>
                                <span className="text-[11px] text-slate-400">考評日期：2026-08-25</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed italic">
                                「林組長規劃非常具體可行，能切中超高層案場核心風險，且現場實測數據與包商對齊精準，實踐成果顯著，值得各案場推廣複製！」
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Trainee Stage Execution Matrix & Reminders */}
          {activeTab === 'student_tracker' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    【{course.title}】{batch.batchName || batch.batchNo} 全體學員各階段執行狀況與催填總管
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    即時監控每位學員之課前問卷、影音研習時數(防掛機)、隨堂測驗、課後滿意度與 SMART 計畫落實狀態，並支援詳細填答調閱與一鍵催填提醒。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                    即時連線同步中
                  </span>
                </div>
              </div>

              {/* RENDER INLINE TRACKER */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <BatchStudentProgressTrackerModal
                  course={course}
                  batch={batch}
                  onClose={() => setActiveTab('action_plan')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {saveSuccessMsg && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                梯次教室設定已成功儲存並同步！
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveAll}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              儲存梯次教室設定
            </button>
          </div>
        </div>
      </div>

      {/* MS Forms Designer Sub-modal */}
      {formsDesignerMode && (
        <MsFormsDesignerModal
          mode={formsDesignerMode}
          courseTitle={course.title}
          initialSurvey={
            formsDesignerMode === 'pre_survey'
              ? preSurveyConfig
              : formsDesignerMode === 'post_survey'
              ? postSurveyConfig
              : undefined
          }
          initialExam={formsDesignerMode === 'exam' ? examConfig : undefined}
          onSaveSurvey={(survey) => {
            if (formsDesignerMode === 'pre_survey') {
              setPreSurveyConfig(survey);
            } else if (formsDesignerMode === 'post_survey') {
              setPostSurveyConfig(survey);
            }
            setFormsDesignerMode(null);
          }}
          onSaveExam={(exam) => {
            setExamConfig(exam);
            setPassingScore(exam.passingScore);
            setMaxAttempts(exam.maxAttempts);
            setFormsDesignerMode(null);
          }}
          onClose={() => setFormsDesignerMode(null)}
        />
      )}

      {/* PDF Material Previewer Modal */}
      {pdfPreviewMaterial && (
        <PdfViewerModal
          material={pdfPreviewMaterial}
          onClose={() => setPdfPreviewMaterial(null)}
        />
      )}

      {/* FULLSCREEN / DEDICATED VIDEO PREVIEW MODAL */}
      {isVideoPreviewModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    【影音章節全螢幕預覽】{currentActiveChapter.title || course.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    章節 {selectedChapterIdx + 1} / {chapters.length} | 來源：{isYouTubeUrl(currentActiveChapter.videoUrl) ? 'YouTube 影音' : isMicrosoftVideoUrl(currentActiveChapter.videoUrl) ? '微軟 Teams / OneDrive' : 'MP4 檔案'} | 累積總達標：{Math.round(requiredDurationSeconds / 60)} 分鐘
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTestPopupTimer(popupTimeoutSeconds || 20);
                    setIsTestPopupActive(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  模擬防掛機彈窗
                </button>
                <button
                  onClick={() => setIsVideoPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-black flex-1 flex flex-col items-center justify-center min-h-[440px]">
              {isYouTubeUrl(currentActiveChapter.videoUrl) && getYouTubeEmbedUrl(currentActiveChapter.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(currentActiveChapter.videoUrl, true) || ''}
                  title="全螢幕預覽"
                  className="w-full h-full min-h-[440px] aspect-video border-0 rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isMicrosoftVideoUrl(currentActiveChapter.videoUrl) ? (
                <iframe
                  src={getMicrosoftVideoEmbedUrl(currentActiveChapter.videoUrl) || currentActiveChapter.videoUrl}
                  title="微軟 Teams/OneDrive 全螢幕預覽"
                  className="w-full h-full min-h-[440px] aspect-video border-0 rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : currentActiveChapter.videoUrl ? (
                <video
                  src={currentActiveChapter.videoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[500px] object-contain rounded-lg"
                >
                  您的瀏覽器不支援 HTML5 影片播放。
                </video>
              ) : (
                <div className="text-center text-slate-400">
                  <p>未設定有效影音 URL</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                {chapters.length > 1 && (
                  <>
                    <button
                      type="button"
                      disabled={selectedChapterIdx === 0}
                      onClick={() => setSelectedChapterIdx(Math.max(0, selectedChapterIdx - 1))}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded font-bold"
                    >
                      ← 上一章
                    </button>
                    <span className="font-mono text-slate-300">
                      第 {selectedChapterIdx + 1} 章 / 共 {chapters.length} 章
                    </span>
                    <button
                      type="button"
                      disabled={selectedChapterIdx === chapters.length - 1}
                      onClick={() => setSelectedChapterIdx(Math.min(chapters.length - 1, selectedChapterIdx + 1))}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded font-bold"
                    >
                      下一章 →
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsVideoPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
              >
                關閉預覽
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANTI-CHEATING TEST POPUP SIMULATION */}
      {isTestPopupActive && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-amber-500 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold mb-2">
                防掛機專注力即時驗證 (模擬測試中)
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                您是否正在專注觀看研習課程？
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                為確保研習品質，請於倒數結束前點擊確認按鈕。逾時未確認將中斷研習。
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-red-600 font-mono">
                {testPopupTimer} <span className="text-xs font-bold text-slate-500">秒後中斷</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-1000"
                  style={{
                    width: `${((testPopupTimer) / (popupTimeoutSeconds || 20)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setIsTestPopupActive(false);
                alert('驗證成功！防掛機確認通過，繼續研習影音。');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              我正在專注研習中 (點擊確認)
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN SMART ACTION PLAN PREVIEW MODAL */}
      {isSmartPlanPreviewModalOpen && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                    全螢幕 SMART 表單預覽
                  </span>
                  <span className="text-xs text-slate-300">
                    {course.title} · {batch.batchName || batch.batchNo}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-400" />
                  SMART 行動計畫表單全流程模擬預覽
                </h3>
              </div>

              <button
                onClick={() => setIsSmartPlanPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSmartPreviewTab('goal')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    smartPreviewTab === 'goal'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 bg-white border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  階段一：學員 S-M-A-R-T 設定畫面
                </button>

                <button
                  type="button"
                  onClick={() => setSmartPreviewTab('self_eval')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    smartPreviewTab === 'self_eval'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 bg-white border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  階段二：學員 60 天自評與佐證
                </button>

                <button
                  type="button"
                  onClick={() => setSmartPreviewTab('manager_review')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    smartPreviewTab === 'manager_review'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 bg-white border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  階段三：直屬主管考評與核決
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                指定審核主管：<strong>{smartPlanReviewLevel === 'direct_manager' ? '直屬案主管 (工務所長)' : smartPlanReviewLevel === 'dept_manager' ? '部門主管 (營建部協理)' : '總經理 / 總裁'}</strong>
              </span>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {smartPreviewTab === 'goal' && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      學員端操作說明：結業後需於 7 日內登入設定 60 天現場 SMART 落實指標
                    </div>
                    <p className="text-[11px] text-slate-600">
                      所有填寫內容將自動同步至工務所行動實踐庫，並於 60 天後提醒學員自評與主管考評。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-blue-700 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">S</span>
                        明確具體目標 (Specific)
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                        於負責之新北 HM6 案場全面導入 24 小時連續壁側向變位自動化電子水準儀與傾斜儀，建立全自動數據預警。
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-emerald-700 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">M</span>
                        量化衡量指標 (Measurable)
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                        即時監測數據傳輸率達 99.5%，若位移達警戒值 (15mm) 自動於 3 分鐘內發出 Line 與 SMS 警報。
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-purple-700 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">A</span>
                        可行達成策略 (Achievable)
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                        已與監測儀器包商完成介面整合，預計於開挖前 14 天完成系統全尺度校正與人員操作培訓。
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-xs text-amber-700 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">R</span>
                        工程關聯效益 (Relevant)
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                        嚴格控制深基坑開挖安全，杜絕鄰房沈陷，保障建案如期如質零災害與公司信譽。
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {smartPreviewTab === 'self_eval' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        學員 60 天現場實踐成效自評回報表單
                      </h4>
                      <span className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-xs">
                        自評分數：92 分 (優等)
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-amber-100">
                        <strong>【落地實踐成果總結】：</strong>
                        <p className="text-slate-700 mt-1 leading-relaxed">
                          已於新北 HM6 案場開挖作業全面落實自動化監測，歷時 60 天共監控 48 處監測點，數據無中斷紀錄，成功預警 1 處局部支撐微量位移並即刻補強，未發生工進延誤。
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                        <span className="text-slate-700">佐證附件：<strong>HM6案_連續壁自動化監測成果報告.pdf</strong> (2.4 MB)</span>
                        <span className="text-emerald-600 font-bold">✓ 檔案上傳成功</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {smartPreviewTab === 'manager_review' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        直屬案主管 (工務所長 / 副所長) 現場考評與學分核決
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                        考評得分：95 分 (特優)
                      </span>
                    </div>

                    <div className="p-4 bg-white border border-emerald-100 rounded-xl text-xs space-y-2">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>考評主管評語：</span>
                        <span className="text-slate-400 text-[11px]">考評主管：陳冠霖 經理 · 2026-08-25</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                        「林組長規劃非常具體可行，切中超高層案場核心風險，實踐成果顯著，值得各案場推廣複製！准予核發教育訓練學分 2 點。」
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                💡 預覽畫面顯示為學員與主管操作介面樣板，實際資料將依各參訓同仁填寫內容自動呈現。
              </span>
              <button
                onClick={() => setIsSmartPlanPreviewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                關閉全螢幕預覽
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Interactive Preview Modal */}
      {isAssignmentPreviewModalOpen && (
        <AssignmentSubmissionModal
          course={{
            ...course,
            hasAssignment: true,
            assignmentConfig: {
              enabled: true,
              title: assignmentTitle,
              description: assignmentDescription,
              gradingType: assignmentGradingType,
              passingScore: assignmentPassingScore,
              allowedFileTypes: assignmentAllowedTypes,
              maxFileSizeMB: assignmentMaxFileSizeMB,
              reviewerEmpNo: assignmentReviewerEmpNo,
              reviewerName:
                instructors.find((i) => (i.empNo || i.id) === assignmentReviewerEmpNo)?.name ||
                batch.primaryInstructorName ||
                '陳冠霖',
              reviewerRole:
                instructors.find((i) => (i.empNo || i.id) === assignmentReviewerEmpNo)?.title ||
                '工務主管',
              oneDriveFolderPath: assignmentOneDriveFolderPath,
              dueDateDaysAfterCourse: assignmentDueDateDays,
              isRequiredForCompletion: assignmentRequiredForCompletion,
            },
          }}
          enrollment={{
            id: `sample-preview-${batch.id}`,
            courseId: course.id,
            batchId: batch.id,
            batchNo: batch.batchNo,
            empNo: 'FG-PREVIEW',
            empName: '陳工程師 (模擬預覽)',
            department: '建築工程處',
            title: '工程師',
            enrollmentType: 'self_enrolled',
            approvalStatus: 'approved',
            attendanceStatus: 'present',
            listType: 'regular',
            status: 'enrolled',
            enrolledAt: new Date().toISOString(),
            finalPassStatus: 'in_progress',
          }}
          onClose={() => setIsAssignmentPreviewModalOpen(false)}
        />
      )}
      {/* OneDrive Assignment Folder View Modal */}
      {isOneDriveFolderModalOpen && (
        <OneDriveAssignmentFolderModal
          isOpen={isOneDriveFolderModalOpen}
          onClose={() => setIsOneDriveFolderModalOpen(false)}
          course={{
            ...course,
            assignmentConfig: {
              enabled: true,
              title: assignmentTitle,
              description: assignmentDescription,
              gradingType: assignmentGradingType,
              passingScore: assignmentPassingScore,
              allowedFileTypes: assignmentAllowedTypes,
              maxFileSizeMB: assignmentMaxFileSizeMB,
              reviewerEmpNo: assignmentReviewerEmpNo,
              reviewerName:
                instructors.find((i) => (i.empNo || i.id) === assignmentReviewerEmpNo)?.name ||
                batch.primaryInstructorName ||
                '陳冠霖',
              reviewerRole:
                instructors.find((i) => (i.empNo || i.id) === assignmentReviewerEmpNo)?.title ||
                '工務主管',
              oneDriveFolderPath: assignmentOneDriveFolderPath,
              dueDateDaysAfterCourse: assignmentDueDateDays,
              isRequiredForCompletion: assignmentRequiredForCompletion,
            },
          }}
          batchNo={batch.batchNo}
          batchId={batch.id}
        />
      )}

      {/* Force Enroll Students Modal */}
      {isForceEnrollModalOpen && (
        <ForceEnrollStudentsModal
          isOpen={isForceEnrollModalOpen}
          courseId={course.id}
          courseTitle={course.title}
          batch={batch}
          onClose={() => setIsForceEnrollModalOpen(false)}
        />
      )}

      {/* Online Exam Interactive Preview Modal */}
      {isExamPreviewModalOpen && (
        <TrainingExamPreviewModal
          isOpen={isExamPreviewModalOpen}
          onClose={() => setIsExamPreviewModalOpen(false)}
          examConfig={{
            ...examConfig,
            passingScore,
            maxAttempts,
            shuffleQuestions,
            shuffleOptions,
          }}
          courseTitle={course.title}
          batchName={batch.batchName || batch.batchNo}
        />
      )}
    </div>
  );
};
