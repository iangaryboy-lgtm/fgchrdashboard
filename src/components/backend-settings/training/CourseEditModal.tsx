import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Video,
  CheckCircle2,
  Award,
  Star,
  Sparkles,
  Users,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  HelpCircle,
  Eye,
  Sliders,
  Settings,
  ShieldAlert,
  Calendar,
  Layers,
  X,
  Target,
  Edit3,
  Play,
  Maximize2,
  Film,
  Check,
  Tv,
  ClipboardCheck,
  ListVideo,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  FileSpreadsheet,
  Presentation,
  Cloud,
  FolderSync,
  Briefcase,
  Share2,
  Search,
  CheckSquare,
  Square,
  FolderOpen,
} from 'lucide-react';
import {
  InternalCourse,
  TrainingCategory,
  Instructor,
  TrainingMaterial,
  TrainingSurveyConfig,
  TrainingExamConfig,
  ReviewLevel,
  CourseVideoChapter,
  CourseAssignmentConfig,
  AssignmentFileType,
} from '../../../types';
import { MsFormsDesignerModal } from '../../common/MsFormsDesignerModal';
import { PdfViewerModal } from '../../common/PdfViewerModal';
import { TrainingExamPreviewModal } from '../../common/TrainingExamPreviewModal';
import {
  detectMaterialMediaType,
  formatTargetAudience,
  getYouTubeEmbedUrl,
  extractYouTubeVideoId,
  extractEmbedUrlFromIframe,
  isMicrosoftVideoUrl,
  getMicrosoftVideoEmbedUrl,
  isYouTubeUrl,
} from '../../../utils/trainingUtils';

interface CourseEditModalProps {
  course: InternalCourse | null;
  categories: TrainingCategory[];
  instructors: Instructor[];
  materials: TrainingMaterial[];
  onSave: (courseData: Partial<InternalCourse>) => void;
  onClose: () => void;
}

export const CourseEditModal: React.FC<CourseEditModalProps> = ({
  course,
  categories,
  instructors,
  materials,
  onSave,
  onClose,
}) => {
  const isEditing = !!course;

  // Active configuration sub-tab
  const [activeTab, setActiveTab] = useState<
    'basic' | 'materials' | 'video' | 'assignment' | 'pre_survey' | 'exam' | 'post_survey' | 'action_plan'
  >('basic');

  // Sub-modal states for MS Forms designer & PDF Viewer
  const [activeFormsModal, setActiveFormsModal] = useState<
    'pre_survey' | 'post_survey' | 'exam' | null
  >(null);
  const [isExamPreviewModalOpen, setIsExamPreviewModalOpen] = useState(false);
  const [pdfPreviewMaterial, setPdfPreviewMaterial] = useState<TrainingMaterial | null>(null);

  // 1. Basic Fields
  const [courseCode, setCourseCode] = useState(
    course?.courseCode ||
      `TR-FG-${new Date().getFullYear()}-${String(Math.floor(10 + Math.random() * 90)).padStart(2, '0')}`
  );
  const [title, setTitle] = useState(course?.title || '');
  const [categoryId, setCategoryId] = useState(course?.categoryId || categories[0]?.id || '');
  const [structureType, setStructureType] = useState<'single' | 'blended'>(
    (course?.structureType as any) || 'single'
  );
  const [deliveryType, setDeliveryType] = useState<'physical' | 'online' | 'blended'>(
    (course?.deliveryType as any) || 'physical'
  );
  const [description, setDescription] = useState(course?.description || '');
  const [targetAudience, setTargetAudience] = useState(
    formatTargetAudience(course?.targetAudience) || '工務所所長、副所長、儲備案主管、全體工程人員'
  );
  const [hours, setHours] = useState(course?.hours || 4);
  const [credits, setCredits] = useState(course?.credits || 4);
  const [instructorId, setInstructorId] = useState(course?.instructorId || instructors[0]?.id || '');
  const [approvalRequired, setApprovalRequired] = useState(course?.approvalRequired || false);
  const [approvalLevel, setApprovalLevel] = useState<ReviewLevel>(
    (course?.approvalLevel as ReviewLevel) || 'direct_manager'
  );

  // 1.5 Assignment Configuration State (Requirement 2)
  const [hasAssignment, setHasAssignment] = useState<boolean>(
    course?.hasAssignment ?? !!course?.assignmentConfig?.enabled ?? true
  );
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    course?.assignmentConfig?.title ||
      '【課後實務作業】施工工序要徑排程模擬與品質自主檢驗檢討報告'
  );
  const [assignmentDescription, setAssignmentDescription] = useState<string>(
    course?.assignmentConfig?.description ||
      '請依據課堂所學之要徑工法與施工查核要點，結合目前案場實務狀況，繳交具體分析報告、試算表或施工圖說照片。'
  );
  const [assignmentGradingType, setAssignmentGradingType] = useState<'pass_fail' | 'score_100'>(
    course?.assignmentConfig?.gradingType || 'score_100'
  );
  const [assignmentPassingScore, setAssignmentPassingScore] = useState<number>(
    course?.assignmentConfig?.passingScore || 70
  );
  const [assignmentAllowedTypes, setAssignmentAllowedTypes] = useState<AssignmentFileType[]>(
    course?.assignmentConfig?.allowedFileTypes || ['word', 'excel', 'powerpoint', 'pdf', 'image']
  );
  const [assignmentMaxFileSizeMB, setAssignmentMaxFileSizeMB] = useState<number>(
    course?.assignmentConfig?.maxFileSizeMB || 50
  );
  const [assignmentReviewerEmpNo, setAssignmentReviewerEmpNo] = useState<string>(
    course?.assignmentConfig?.reviewerEmpNo || instructors[0]?.empNo || 'FG1001'
  );
  const [assignmentOneDriveFolderPath, setAssignmentOneDriveFolderPath] = useState<string>(
    course?.assignmentConfig?.oneDriveFolderPath ||
      `OneDrive://建築工程處/專業訓練作業/2026/${course?.courseCode || 'TR-ENG-2026'}/`
  );
  const [assignmentDueDateDays, setAssignmentDueDateDays] = useState<number>(
    course?.assignmentConfig?.dueDateDaysAfterCourse || 14
  );
  const [assignmentRequiredForCompletion, setAssignmentRequiredForCompletion] = useState<boolean>(
    course?.assignmentConfig?.isRequiredForCompletion ?? true
  );

  // 2. Materials
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>(
    course?.materials?.map((m) => m.id) || []
  );

  // 3. Multi-Chapter & Video Config
  const [videoEnabled, setVideoEnabled] = useState(course?.videoConfig?.enabled ?? (deliveryType === 'online' || deliveryType === 'blended'));
  const [videoType, setVideoType] = useState<'pre_study' | 'online_core'>(
    course?.videoConfig?.videoType || (deliveryType === 'physical' ? 'pre_study' : 'online_core')
  );

  const initialChapters: CourseVideoChapter[] = (course?.videoConfig?.chapters && course.videoConfig.chapters.length > 0)
    ? course.videoConfig.chapters
    : [
        {
          id: `ch-1-${Date.now()}`,
          chapterNo: 1,
          title: course?.videoConfig?.videoTitle || (course ? `${course.title} - 第一章：核心工法與概念剖析` : '第一章：核心工法與作業要點'),
          sourceType: (course?.videoConfig?.sourceType || 'youtube') as any,
          videoSource: (course?.videoConfig?.videoSource || 'youtube') as any,
          videoUrl: course?.videoConfig?.videoUrl || 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
          durationSeconds: course?.videoConfig?.videoDurationSeconds || 600,
          description: '課程核心實務要點、施工標準作業程序與關鍵安全檢核',
          isRequired: true,
          requiredWatchPercent: course?.videoConfig?.requiredWatchPercent || 90,
        },
      ];

  const [chapters, setChapters] = useState<CourseVideoChapter[]>(initialChapters);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);

  const [antiCheatingEnabled, setAntiCheatingEnabled] = useState(true);
  const [antiCheatingIntervalMinutes, setAntiCheatingIntervalMinutes] = useState(
    course?.videoConfig?.antiCheatingPromptIntervalMinutes || 5
  );
  const [antiCheatingTimeoutSeconds, setAntiCheatingTimeoutSeconds] = useState(
    course?.videoConfig?.antiCheatingResponseTimeoutSeconds || 30
  );

  // Active chapter accessor
  const activeChapter: CourseVideoChapter = chapters[selectedChapterIdx] || chapters[0] || {
    id: 'ch-default',
    chapterNo: 1,
    title: '第一章：課程研習單元',
    sourceType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
    durationSeconds: 600,
    requiredWatchPercent: 90,
  };

  // Chapter management handlers
  const handleAddChapter = () => {
    const nextNo = chapters.length + 1;
    const newCh: CourseVideoChapter = {
      id: `ch-${Date.now()}-${nextNo}`,
      chapterNo: nextNo,
      title: `第 ${nextNo} 章：新研習影片單元`,
      sourceType: 'youtube',
      videoSource: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
      durationSeconds: 600,
      description: '請輸入此章節之研習重點或學習檢核指引...',
      isRequired: true,
      requiredWatchPercent: 90,
    };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setSelectedChapterIdx(updated.length - 1);
  };

  const handleRemoveChapter = (indexToRemove: number) => {
    if (chapters.length <= 1) {
      alert('課程至少需保留一個影音章節！');
      return;
    }
    const updated = chapters
      .filter((_, idx) => idx !== indexToRemove)
      .map((ch, idx) => ({ ...ch, chapterNo: idx + 1 }));
    setChapters(updated);
    setSelectedChapterIdx(Math.max(0, Math.min(selectedChapterIdx, updated.length - 1)));
  };

  const handleUpdateActiveChapter = (fields: Partial<CourseVideoChapter>) => {
    setChapters((prev) =>
      prev.map((ch, idx) => (idx === selectedChapterIdx ? { ...ch, ...fields } : ch))
    );
  };

  const handleMoveChapter = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= chapters.length) return;
    const updated = [...chapters];
    const temp = updated[fromIdx];
    updated[fromIdx] = updated[toIdx];
    updated[toIdx] = temp;
    const renumbered = updated.map((ch, idx) => ({ ...ch, chapterNo: idx + 1 }));
    setChapters(renumbered);
    setSelectedChapterIdx(toIdx);
  };

  const handlePasteUrlToActiveChapter = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = extractEmbedUrlFromIframe(text) || text.trim();
        const updates: Partial<CourseVideoChapter> = { videoUrl: cleaned };
        if (isMicrosoftVideoUrl(cleaned) && activeChapter.sourceType !== 'teams_onedrive') {
          updates.sourceType = 'teams_onedrive';
          updates.videoSource = 'teams_onedrive';
        } else if (isYouTubeUrl(cleaned) && activeChapter.sourceType !== 'youtube') {
          updates.sourceType = 'youtube';
          updates.videoSource = 'youtube';
        }
        handleUpdateActiveChapter(updates);
      }
    } catch {
      // ignore
    }
  };

  // Video Preview & Teams/OneDrive playback states (matching CourseMaterialsTab)
  const [teamsPreviewMode, setTeamsPreviewMode] = useState<'embed' | 'simulation'>('embed');
  const [isVideoPreviewModalOpen, setIsVideoPreviewModalOpen] = useState(false);
  const [isTestPopupActive, setIsTestPopupActive] = useState(false);
  const [testPopupTimer, setTestPopupTimer] = useState<number>(30);

  // Material Library Import Modal States
  const [isMaterialImportModalOpen, setIsMaterialImportModalOpen] = useState(false);
  const [importTargetMode, setImportTargetMode] = useState<'current' | 'new'>('new');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<'video_stream' | 'all'>('video_stream');
  const [importSelectedMaterialIds, setImportSelectedMaterialIds] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Resolve source type from a TrainingMaterial item
  const resolveMaterialSourceType = (mat: TrainingMaterial): { sourceType: 'youtube' | 'teams_onedrive' | 'mp4'; videoUrl: string } => {
    const rawUrl = mat.fileUrl || '';
    const cleaned = extractEmbedUrlFromIframe(rawUrl) || rawUrl.trim();
    if (mat.fileType === 'teams_onedrive' || isMicrosoftVideoUrl(cleaned)) {
      return { sourceType: 'teams_onedrive', videoUrl: cleaned };
    }
    if (mat.fileType === 'youtube' || isYouTubeUrl(cleaned)) {
      return { sourceType: 'youtube', videoUrl: cleaned };
    }
    return { sourceType: 'mp4', videoUrl: cleaned };
  };

  // Import single material into currently active chapter
  const handleImportMaterialToActiveChapter = (mat: TrainingMaterial) => {
    const { sourceType, videoUrl } = resolveMaterialSourceType(mat);
    handleUpdateActiveChapter({
      title: mat.title || activeChapter.title,
      sourceType,
      videoSource: sourceType,
      videoUrl,
      durationSeconds: mat.videoDurationSeconds || activeChapter.durationSeconds || 600,
      description: mat.description || activeChapter.description,
    });
    setImportSuccessMessage(`已成功將教材「${mat.title}」帶入至第 ${selectedChapterIdx + 1} 章！`);
    setTimeout(() => setImportSuccessMessage(null), 3500);
    setIsMaterialImportModalOpen(false);
  };

  // Import single material as a brand new chapter
  const handleImportMaterialAsNewChapter = (mat: TrainingMaterial) => {
    const { sourceType, videoUrl } = resolveMaterialSourceType(mat);
    const nextNo = chapters.length + 1;
    const newCh: CourseVideoChapter = {
      id: `ch-${Date.now()}-${nextNo}`,
      chapterNo: nextNo,
      title: mat.title || `第 ${nextNo} 章：新影音單元`,
      sourceType,
      videoSource: sourceType,
      videoUrl,
      durationSeconds: mat.videoDurationSeconds || 600,
      description: mat.description || '請輸入此章節之研習重點或學習檢核指引...',
      isRequired: true,
      requiredWatchPercent: 90,
    };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setSelectedChapterIdx(updated.length - 1);
    setImportSuccessMessage(`已將教材「${mat.title}」新增為第 ${nextNo} 章！`);
    setTimeout(() => setImportSuccessMessage(null), 3500);
    setIsMaterialImportModalOpen(false);
  };

  // Batch import selected materials as new chapters
  const handleBatchImportMaterials = () => {
    if (importSelectedMaterialIds.length === 0) return;
    const chosen = (materials || []).filter((m) => importSelectedMaterialIds.includes(m.id));
    if (chosen.length === 0) return;

    let nextNo = chapters.length;
    const newChaptersList: CourseVideoChapter[] = chosen.map((mat) => {
      nextNo += 1;
      const { sourceType, videoUrl } = resolveMaterialSourceType(mat);
      return {
        id: `ch-${Date.now()}-${nextNo}-${Math.random().toString(36).substring(2, 5)}`,
        chapterNo: nextNo,
        title: mat.title || `第 ${nextNo} 章：${mat.category || '專業研習'}`,
        sourceType,
        videoSource: sourceType,
        videoUrl,
        durationSeconds: mat.videoDurationSeconds || 600,
        description: mat.description || '',
        isRequired: true,
        requiredWatchPercent: 90,
      };
    });

    const updated = [...chapters, ...newChaptersList];
    setChapters(updated);
    setSelectedChapterIdx(chapters.length);
    setImportSelectedMaterialIds([]);
    setImportSuccessMessage(`已成功批次從教材庫匯入 ${newChaptersList.length} 個影音章節！`);
    setTimeout(() => setImportSuccessMessage(null), 3500);
    setIsMaterialImportModalOpen(false);
  };

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

  // 4. Pre Survey Config
  const [hasPreSurvey, setHasPreSurvey] = useState(
    !!course?.preSurveyConfig || course?.hasPreTest || false
  );
  const [preSurveyConfig, setPreSurveyConfig] = useState<TrainingSurveyConfig | undefined>(
    course?.preSurveyConfig || {
      id: `pre-survey-${Date.now()}`,
      title: `【${course?.title || '本課程'}】課前學員背景與需求調查問卷`,
      type: 'pre_course',
      description: '請協助填寫您過去主持或參與相關工程之實務經驗，以利講師於課堂中深入剖析關鍵盲點。',
      questions: [
        {
          id: 'pre-q1',
          title: '您過去是否曾主導或參與過類似工程之案場施作經驗？',
          type: 'single_choice',
          required: true,
          options: ['是，主持過 2 案以上', '是，參與過 1 案', '否，尚未接觸過相關工法'],
        },
        {
          id: 'pre-q2',
          title: '目前案場施工階段，您最期望深入研討的實務主題是？(可複選)',
          type: 'multiple_choice',
          required: true,
          options: [
            '施工工序標準與常見品質缺失防杜',
            '關鍵工期網圖要徑排程與要徑壓縮策略',
            '工地突發異常與安全防護緊急應變SOP',
            '業主變更設計與工期展延合約索賠實務',
          ],
        },
        {
          id: 'pre-q3',
          title: '請留下您期望於課堂中請教講師之具體現場問題：',
          type: 'open_text',
          required: false,
        },
      ],
    }
  );

  // 5. Exam Config
  const [hasExam, setHasExam] = useState(
    !!course?.examConfig || course?.hasPostTest || true
  );
  const [examConfig, setExamConfig] = useState<TrainingExamConfig | undefined>(
    course?.examConfig || {
      id: `exam-${Date.now()}`,
      title: `【${course?.title || '本課程'}】隨堂線上專業能力測驗`,
      passingScore: course?.passingScore || 70,
      maxAttempts: 3,
      allowRetake: true,
      timeLimitMinutes: 30,
      questions: [
        {
          id: 'ex-q1',
          title: '於營造工程排程管理中，關鍵要徑（Critical Path）之正確定義為何？',
          type: 'single_choice',
          required: true,
          options: [
            '所耗工期最短的施工作業路徑',
            '總寬裕時間（Total Float）為零且決定整體工期之最長路徑',
            '工程發包金額最高的分包作業組合',
            '由結構體工程獨立組成的路徑',
          ],
          correctAnswer: '總寬裕時間（Total Float）為零且決定整體工期之最長路徑',
          points: 35,
          explanation: '關鍵要徑由總寬裕時間為零之作業串聯而成，決定專案之最短完成工期。',
        },
        {
          id: 'ex-q2',
          title: '下列哪些屬於案場主管在進行進度滾動式調整時之重要預警指標？(多選)',
          type: 'multiple_choice',
          required: true,
          options: [
            '要徑作業之自由寬裕度 (Free Float) 遭受侵蝕或延遲',
            '連續壁或逆打鋼柱沉降監測數值超越警報值',
            '當日氣溫高於攝氏35度',
            '預拌混凝土進場澆置檢驗合格率低於標準',
          ],
          correctAnswer: [
            '要徑作業之自由寬裕度 (Free Float) 遭受侵蝕或延遲',
            '連續壁或逆打鋼柱沉降監測數值超越警報值',
            '預拌混凝土進場澆置檢驗合格率低於標準',
          ],
          points: 35,
          explanation: '要徑寬裕度侵蝕、結構沉降超標與材料檢驗不合格均為工程管理之重大風險指標。',
        },
        {
          id: 'ex-q3',
          title: '請簡述若案場因變更設計造成要徑作業停工時，主管應於幾日內備妥佐證資料提出展延申請？並列舉核心應備文件。',
          type: 'open_text',
          required: true,
          points: 30,
          graderEmpNo: instructors[0]?.empNo || 'FG1001',
          graderName: instructors[0]?.name || '陳冠霖 經理',
          explanation: '應於事實發生後 7 日內提出書面通知，並備妥工程日誌、監造備忘錄、CPM要徑工期比對圖與現場相片。',
        },
      ],
    }
  );

  // 6. Post Survey Config
  const [hasPostSurvey, setHasPostSurvey] = useState(true);
  const [postSurveyConfig, setPostSurveyConfig] = useState<TrainingSurveyConfig | undefined>(
    course?.postSurveyConfig || {
      id: `post-survey-${Date.now()}`,
      title: `【${course?.title || '本課程'}】課後教學滿意度調查問卷`,
      type: 'post_satisfaction',
      description: '感謝您的熱情參與！請針對本次課程師資教學、教材實用性與數位學習平台體驗提供寶貴評分。',
      questions: [
        {
          id: 'ps-q1',
          title: '整體而言，本課程之專業實務內容對您目前工地管理與工程施作具備高度實用價值。',
          type: 'scale_1_5',
          required: true,
        },
        {
          id: 'ps-q2',
          title: '授課講師之教學表達生動清晰、實例解說詳盡且能充分解答學員現場提問。',
          type: 'scale_1_5',
          required: true,
        },
        {
          id: 'ps-q3',
          title: '您對本次課程與線上教材庫系統之整體滿意度星級評分：',
          type: 'rating_star',
          required: true,
        },
        {
          id: 'ps-q4',
          title: '請留下您對後續內部訓練規劃之寶貴建議或期望加開之專業主題：',
          type: 'open_text',
          required: false,
        },
      ],
    }
  );

  // 7. SMART Action Plan Config
  const [actionPlanRequired, setActionPlanRequired] = useState(
    course?.actionPlanRequired ?? course?.requireSmartActionPlan ?? true
  );
  const [actionPlanReviewLevel, setActionPlanReviewLevel] = useState<ReviewLevel>(
    (course?.actionPlanReviewLevel as ReviewLevel) || 'dept_manager'
  );
  const [actionPlanDaysToReview, setActionPlanDaysToReview] = useState<number>(
    course?.actionPlanDaysToReview || 60
  );

  // Save handler
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請填寫課程名稱！');
      return;
    }

    const matchedCategory = categories.find((c) => c.id === categoryId);
    const matchedInstructor = instructors.find((i) => i.id === instructorId);
    const linkedMaterials = materials.filter((m) => selectedMaterialIds.includes(m.id));

    const courseData: Partial<InternalCourse> = {
      courseCode,
      title,
      categoryId,
      categoryName: matchedCategory?.name || '專業訓練',
      structureType,
      deliveryType,
      deliveryMode:
        deliveryType === 'physical'
          ? 'in_person'
          : deliveryType === 'online'
          ? 'online'
          : 'blended',
      description,
      targetAudience,
      hours: Number(hours),
      credits: Number(credits),
      instructorId,
      instructorName: matchedInstructor?.name || '內部授課講師',
      instructorType: matchedInstructor?.type || 'internal',
      approvalRequired,
      approvalLevel,
      enrollmentApprovalType: approvalRequired ? approvalLevel : 'direct',

      // Materials
      materials: linkedMaterials,

      // Video & Multi-Chapter Configuration
      videoConfig: videoEnabled
        ? {
            enabled: true,
            videoType,
            sourceType: activeChapter.sourceType || 'youtube',
            videoSource: activeChapter.sourceType || 'youtube',
            videoUrl: activeChapter.videoUrl,
            videoTitle: activeChapter.title,
            videoDurationSeconds: chapters.reduce((sum, c) => sum + (c.durationSeconds || 600), 0),
            requiredWatchSeconds: chapters.reduce((sum, c) => sum + Math.round((c.durationSeconds || 600) * ((c.requiredWatchPercent || 90) / 100)), 0),
            requiredWatchPercent: activeChapter.requiredWatchPercent || 90,
            chapters: chapters.map((c, idx) => ({
              ...c,
              chapterNo: idx + 1,
              sourceType: c.sourceType || 'youtube',
              videoSource: c.sourceType || 'youtube',
              durationSeconds: Number(c.durationSeconds || 600),
              requiredWatchPercent: Number(c.requiredWatchPercent || 90),
            })),
            antiCheatingPromptIntervalMinutes: antiCheatingEnabled
              ? Number(antiCheatingIntervalMinutes)
              : undefined,
            antiCheatingResponseTimeoutSeconds: antiCheatingEnabled
              ? Number(antiCheatingTimeoutSeconds)
              : undefined,
          }
        : undefined,

      // Surveys & Exams
      hasPreTest: hasPreSurvey,
      preSurveyConfig: hasPreSurvey ? preSurveyConfig : undefined,
      hasPostTest: hasExam,
      examConfig: hasExam ? examConfig : undefined,
      passingScore: hasExam ? examConfig?.passingScore || 70 : undefined,
      postSurveyConfig: hasPostSurvey ? postSurveyConfig : undefined,

      // SMART Action Plan
      actionPlanRequired,
      requireSmartActionPlan: actionPlanRequired,
      actionPlanReviewLevel,
      actionPlanDaysToReview: Number(actionPlanDaysToReview),

      // Assignment Configuration (Requirement 2)
      hasAssignment,
      assignmentConfig: hasAssignment
        ? {
            enabled: true,
            title: assignmentTitle,
            description: assignmentDescription,
            gradingType: assignmentGradingType,
            passingScore: Number(assignmentPassingScore),
            allowedFileTypes: assignmentAllowedTypes,
            maxFileSizeMB: Number(assignmentMaxFileSizeMB),
            reviewerEmpNo: assignmentReviewerEmpNo,
            reviewerName:
              instructors.find((i) => i.empNo === assignmentReviewerEmpNo || i.id === assignmentReviewerEmpNo)?.name ||
              '陳冠霖 經理',
            reviewerRole: '指定批閱人 / 授課講師',
            oneDriveFolderPath: assignmentOneDriveFolderPath,
            dueDateDaysAfterCourse: Number(assignmentDueDateDays),
            isRequiredForCompletion: assignmentRequiredForCompletion,
          }
        : undefined,

      // Passing criteria
      passingCriteria: {
        requirePreSurvey: hasPreSurvey,
        minMaterialReadMinutes: linkedMaterials.length > 0 ? 10 : 0,
        minVideoWatchPercent: videoEnabled ? Number(activeChapter.requiredWatchPercent || 90) : 0,
        minAttendanceHours: deliveryType === 'online' ? 0 : Math.max(1, Number(hours) * 0.8),
        minExamScore: hasExam ? Number(examConfig?.passingScore || 70) : 0,
        requirePostSurvey: hasPostSurvey,
        requireActionPlan: actionPlanRequired,
        requireAssignment: hasAssignment && assignmentRequiredForCompletion,
      },
    };

    onSave(courseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                  {isEditing ? '編輯內部培訓課程' : '建立全新內部課程'}
                </span>
                <span className="text-xs font-mono text-slate-400">{courseCode}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {title || '請輸入課程名稱...'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-50/70 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs font-bold pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            基本與授課資訊
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'materials'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            課程補充教材 ({selectedMaterialIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'video'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            影片與防掛機設定
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'assignment'
                ? 'border-sky-600 text-sky-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5 text-sky-600" />
            課後實務作業與批閱 (OneDrive)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pre_survey')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'pre_survey'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            MS Forms 課前問卷
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'exam'
                ? 'border-emerald-600 text-emerald-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            MS Forms 隨堂測驗
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('post_survey')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'post_survey'
                ? 'border-purple-600 text-purple-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-purple-600" />
            MS Forms 課後滿意度
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('action_plan')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'action_plan'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            課後 SMART 行動計畫
          </button>
        </div>

        {/* Tab Content Form Body */}
        <form onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    課程代碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseCode || ''}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    課程名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 【高階專案主管】超高層深開挖與逆打工法全解析"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    訓練類別 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">課程結構</label>
                  <select
                    value={structureType || 'single'}
                    onChange={(e) => setStructureType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
                  >
                    <option value="single">單堂獨立課程</option>
                    <option value="blended">混成式套裝學程</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">授課屬性</label>
                  <select
                    value={deliveryType || 'physical'}
                    onChange={(e) => {
                      const dt = e.target.value as any;
                      setDeliveryType(dt);
                      if (dt === 'online') {
                        setVideoEnabled(true);
                        setVideoType('online_core');
                      } else if (dt === 'physical') {
                        setVideoType('pre_study');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white font-bold text-blue-700"
                  >
                    <option value="physical">實體課程 (現場教學 + 課前預習)</option>
                    <option value="online">線上數位課程 (影音 + 線上測驗)</option>
                    <option value="blended">混成模式 (實體面授 + 線上學習)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  課程說明與學習目標大綱
                </label>
                <textarea
                  rows={3}
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="詳細說明本課程培訓重點、關鍵學習效益、工法法規依據..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    指定主要講師
                  </label>
                  <select
                    value={instructorId || ''}
                    onChange={(e) => setInstructorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.organization} · {inst.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    目標培訓對象
                  </label>
                  <input
                    type="text"
                    value={targetAudience || ''}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="例: 工務所長、儲備案主管"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    研習時數 (小時)
                  </label>
                  <input
                    type="number"
                    value={hours ?? 4}
                    onChange={(e) => setHours(Number(e.target.value))}
                    min="0.5"
                    step="0.5"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    職能認證學分 (點)
                  </label>
                  <input
                    type="number"
                    value={credits ?? 4}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-center text-indigo-700"
                  />
                </div>
              </div>

              {/* Approval Settings */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      學員報名簽核關卡設定
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      若啟用簽核，同仁報名後需經指定層級主管核准始得正式納入正取名冊
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalRequired}
                      onChange={(e) => setApprovalRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {approvalRequired && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">簽核審查主管層級：</span>
                    <select
                      value={approvalLevel || 'direct_manager'}
                      onChange={(e) => setApprovalLevel(e.target.value as ReviewLevel)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-blue-900"
                    >
                      <option value="direct_manager">直屬主管 (Direct Manager)</option>
                      <option value="dept_manager">部室主管 (Department Head)</option>
                      <option value="president">總經理室專案核准 (General Manager)</option>
                      <option value="chairman">董事長特助室/董事長親核 (Chairman)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MATERIALS BINDING & INSTANT PREVIEW */}
          {activeTab === 'materials' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    勾選關聯補充教材 (支援 Word / Excel / PPT / PDF 瀏覽器直接觀看)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    所選教材將自動於前台「研習教室」提供學員直接線上預覽與研讀
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  已選取 {selectedMaterialIds.length} 份教材
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                {materials.map((mat) => {
                  const isSelected = selectedMaterialIds.includes(mat.id);
                  const isPdf = detectMaterialMediaType(mat) === 'pdf' || mat.convertedFrom;

                  return (
                    <div
                      key={mat.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <label className="flex items-start gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterialIds([...selectedMaterialIds, mat.id]);
                            } else {
                              setSelectedMaterialIds(
                                selectedMaterialIds.filter((id) => id !== mat.id)
                              );
                            }
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[9px] font-black uppercase">
                              {mat.convertedFrom ? `${mat.convertedFrom} ➔ PDF` : mat.fileType}
                            </span>
                            <h5 className="text-xs font-bold text-slate-800 leading-tight">
                              {mat.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {mat.description || '專業課程講義教材'}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            大小: {mat.fileSize || '3.5 MB'} · 版本: {mat.version}
                          </span>
                        </div>
                      </label>

                      {/* Instant Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPdfPreviewMaterial(mat)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-blue-600 flex items-center gap-1 shrink-0 shadow-2xs"
                        title="在瀏覽器直接預覽講義"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        線上預覽
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-CHAPTER VIDEO & ANTI-CHEATING SETTINGS */}
          {activeTab === 'video' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-blue-600" />
                      課程多章節影音模組配置 (Multi-Chapter Video Modules)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      可新增多部影片／多章節，支援 YouTube、微軟 Teams/Stream 錄影與 MP4 影片，打造完整系列課程
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoEnabled}
                      onChange={(e) => setVideoEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {videoEnabled && (
                  <div className="pt-3 border-t border-slate-200 space-y-4">
                    {/* Video General Usage Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          影片整體授課用途設定
                        </label>
                        <select
                          value={videoType || 'online_core'}
                          onChange={(e) => setVideoType(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                        >
                          <option value="pre_study">
                            實體課程 · 正式課程前課前預習影音 (Pre-study)
                          </option>
                          <option value="online_core">
                            線上數位課程 · 主要研習觀看內容 (Online Core)
                          </option>
                        </select>
                      </div>

                      {importSuccessMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
                          <div className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{importSuccessMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setImportSuccessMessage(null)}
                            className="text-emerald-500 hover:text-emerald-700 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs flex-wrap gap-2">
                        <div>
                          <div className="font-bold text-blue-900 flex items-center gap-1">
                            <ListVideo className="w-4 h-4 text-blue-600" />
                            章節總數：{chapters.length} 部影片
                          </div>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            總時長合計：{Math.round(chapters.reduce((sum, c) => sum + (c.durationSeconds || 600), 0) / 60)} 分鐘
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImportTargetMode('new');
                              setIsMaterialImportModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="可直接選取教材庫中微軟 Teams 錄影、OneDrive 影音或 YouTube 轉換為章節"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            從教材庫匯入
                          </button>
                          <button
                            type="button"
                            onClick={handleAddChapter}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            新增空白章節
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CHAPTERS WORKSPACE: TWO COLUMNS (Left: Playlist, Right: Active Chapter Editor) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Chapter Playlist */}
                      <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            章節單元播放清單
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setImportTargetMode('new');
                                setIsMaterialImportModalOpen(true);
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors cursor-pointer border border-indigo-200"
                              title="從教材庫匯入教材"
                            >
                              <FolderOpen className="w-3 h-3 text-indigo-600" />
                              匯入教材
                            </button>
                            <button
                              type="button"
                              onClick={handleAddChapter}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> 新增
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {chapters.map((ch, idx) => {
                            const isSelected = selectedChapterIdx === idx;
                            return (
                              <div
                                key={ch.id || idx}
                                onClick={() => setSelectedChapterIdx(idx)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer text-left space-y-1 ${
                                  isSelected
                                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className={`w-5 h-5 rounded-md text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {ch.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveChapter(idx, 'up');
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                                      title="上移"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === chapters.length - 1}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveChapter(idx, 'down');
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                                      title="下移"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveChapter(idx);
                                      }}
                                      className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                                      title="刪除章節"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-500 ml-6.5">
                                  <span>
                                    {ch.sourceType === 'youtube'
                                      ? 'YouTube'
                                      : ch.sourceType === 'teams_onedrive'
                                      ? 'Teams'
                                      : 'MP4'}
                                  </span>
                                  <span>·</span>
                                  <span>{Math.round((ch.durationSeconds || 600) / 60)} 分鐘</span>
                                  <span>·</span>
                                  <span>門檻 {ch.requiredWatchPercent || 90}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Active Chapter Detail Editor */}
                      <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h5 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            編輯第 {selectedChapterIdx + 1} 章詳細影音參數
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            ID: {activeChapter.id}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            章節名稱與單元主題
                          </label>
                          <input
                            type="text"
                            value={activeChapter.title || ''}
                            onChange={(e) => handleUpdateActiveChapter({ title: e.target.value })}
                            placeholder="例如：第一章：要徑工法與關鍵里程碑排程實務"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              影片串流來源形式
                            </label>
                            <select
                              value={activeChapter.sourceType || activeChapter.videoSource || 'youtube'}
                              onChange={(e) =>
                                handleUpdateActiveChapter({
                                  sourceType: e.target.value as any,
                                  videoSource: e.target.value as any,
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                            >
                              <option value="youtube">掛載 YouTube 影音 (直接串流播放)</option>
                              <option value="teams_onedrive">微軟 Teams 錄影 / OneDrive Stream</option>
                              <option value="mp4">直接上傳 / MP4 影片檔案連結</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              章節時長 (秒數 / 分鐘)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={activeChapter.durationSeconds ?? 600}
                                onChange={(e) =>
                                  handleUpdateActiveChapter({
                                    durationSeconds: Number(e.target.value),
                                  })
                                }
                                min="30"
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-center"
                              />
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                秒 ({Math.round((activeChapter.durationSeconds || 600) / 60)} 分)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Microsoft Teams / OneDrive Guidance box matching CourseMaterialsTab */}
                        {(activeChapter.sourceType === 'teams_onedrive' ||
                          isMicrosoftVideoUrl(activeChapter.videoUrl)) && (
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="p-1 bg-indigo-600 text-white rounded-md">
                                <Briefcase className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-indigo-950">
                                微軟 Teams 錄影 / OneDrive 影音掛載說明
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                                支援 Stream、SharePoint、OneDrive 與 iframe
                              </span>
                            </div>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">
                              在微軟 Teams 或 OneDrive 影片點選「共用」或「複製連結」（權限設為組織內可檢視），直接貼入此處，系統會自動轉譯為內嵌播放格式，同 YouTube 掛載般在學員教室流暢播放！
                            </p>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="text-[11px] text-slate-600 font-medium">快速填入示範：</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateActiveChapter({
                                    sourceType: 'teams_onedrive',
                                    videoSource: 'teams_onedrive',
                                    videoUrl:
                                      'https://farglory.sharepoint.com/sites/engineering/_layouts/15/embed.aspx?UniqueId=teams-rec-iot-2026',
                                    title:
                                      activeChapter.title ||
                                      '【微軟 Teams 錄影】建築智慧工區 IoT 監控與環境感測連線實務',
                                  })
                                }
                                className="px-2 py-0.5 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Teams 智慧工區會議錄影
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateActiveChapter({
                                    sourceType: 'teams_onedrive',
                                    videoSource: 'teams_onedrive',
                                    videoUrl:
                                      'https://1drv.ms/v/c/farglory-bim-4d-sim-2026?action=embedview',
                                    title:
                                      activeChapter.title ||
                                      '【OneDrive 影音】BIM 4D 施工模擬與介面衝突排除精華',
                                  })
                                }
                                className="px-2 py-0.5 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                OneDrive BIM 模擬影片
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              {activeChapter.sourceType === 'youtube'
                                ? 'YouTube 影片網址 / ID'
                                : activeChapter.sourceType === 'teams_onedrive'
                                ? 'Teams 錄影 / OneDrive 影片分享連結或內嵌代碼'
                                : '影片網址 / 串流 Embed URL'}{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setImportTargetMode('current');
                                  setIsMaterialImportModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                title="從教材庫挑選影片資料自動帶入當前章節"
                              >
                                <FolderOpen className="w-3 h-3 text-indigo-600" />
                                從教材庫挑選帶入
                              </button>
                              <button
                                type="button"
                                onClick={handlePasteUrlToActiveChapter}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                <ClipboardCheck className="w-3 h-3" />
                                從剪貼簿貼上網址
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={activeChapter.videoUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const cleaned = extractEmbedUrlFromIframe(val) || val;
                              const updates: Partial<CourseVideoChapter> = { videoUrl: cleaned };
                              if (isMicrosoftVideoUrl(cleaned) && activeChapter.sourceType !== 'teams_onedrive') {
                                updates.sourceType = 'teams_onedrive';
                                updates.videoSource = 'teams_onedrive';
                              } else if (isYouTubeUrl(cleaned) && activeChapter.sourceType !== 'youtube') {
                                updates.sourceType = 'youtube';
                                updates.videoSource = 'youtube';
                              }
                              handleUpdateActiveChapter(updates);
                            }}
                            onPaste={(e) => {
                              const pasted = e.clipboardData.getData('text');
                              if (pasted) {
                                e.preventDefault();
                                const cleaned = extractEmbedUrlFromIframe(pasted) || pasted.trim();
                                const updates: Partial<CourseVideoChapter> = { videoUrl: cleaned };
                                if (isMicrosoftVideoUrl(cleaned) && activeChapter.sourceType !== 'teams_onedrive') {
                                  updates.sourceType = 'teams_onedrive';
                                  updates.videoSource = 'teams_onedrive';
                                } else if (isYouTubeUrl(cleaned) && activeChapter.sourceType !== 'youtube') {
                                  updates.sourceType = 'youtube';
                                  updates.videoSource = 'youtube';
                                }
                                handleUpdateActiveChapter(updates);
                              }
                            }}
                            placeholder="例如: https://farglorygroup-my.sharepoint.com/.../stream.aspx 或 Teams 錄影連結"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              章節完訓觀看比例門檻 (%)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={activeChapter.requiredWatchPercent ?? 90}
                                onChange={(e) =>
                                  handleUpdateActiveChapter({
                                    requiredWatchPercent: Number(e.target.value),
                                  })
                                }
                                min="50"
                                max="100"
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-center text-blue-700"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              章節研習重點簡述
                            </label>
                            <input
                              type="text"
                              value={activeChapter.description || ''}
                              onChange={(e) =>
                                handleUpdateActiveChapter({ description: e.target.value })
                              }
                              placeholder="例如：施工標準作業程序與關鍵安全檢核"
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Quick preset buttons for active chapter */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Film className="w-3 h-3 text-blue-600" />
                            快捷示範影音：
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActiveChapter({
                                sourceType: 'teams_onedrive',
                                videoSource: 'teams_onedrive',
                                videoUrl:
                                  'https://farglory.sharepoint.com/sites/engineering/_layouts/15/embed.aspx?UniqueId=teams-rec-iot-2026',
                                title:
                                  activeChapter.title ||
                                  '建築智慧工區 IoT 監控與環境感測連線實務 (Teams 錄影)',
                              })
                            }
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[10px] font-medium text-indigo-800 transition-colors"
                          >
                            Teams 會議錄影 (微軟)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActiveChapter({
                                sourceType: 'teams_onedrive',
                                videoSource: 'teams_onedrive',
                                videoUrl:
                                  'https://1drv.ms/v/c/farglory-bim-4d-sim-2026?action=embedview',
                                title:
                                  activeChapter.title ||
                                  'BIM 4D 施工模擬與介面衝突排除精華 (OneDrive)',
                              })
                            }
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[10px] font-medium text-indigo-800 transition-colors"
                          >
                            OneDrive 模擬 (微軟)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActiveChapter({
                                sourceType: 'youtube',
                                videoSource: 'youtube',
                                videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
                                title: activeChapter.title || '工程排程要徑計算解析',
                              })
                            }
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors"
                          >
                            排程要徑 (YouTube)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActiveChapter({
                                sourceType: 'mp4',
                                videoSource: 'mp4',
                                videoUrl:
                                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                              })
                            }
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors"
                          >
                            MP4 測試影片
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* LIVE VIDEO PLAYER PREVIEW (Matching CourseMaterialsTab structure) */}
                    <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                              章節影音即時預覽 (第 {selectedChapterIdx + 1} 章：{activeChapter.title})
                              {activeChapter.sourceType === 'youtube' &&
                                extractYouTubeVideoId(activeChapter.videoUrl) && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px]">
                                    YouTube (ID: {extractYouTubeVideoId(activeChapter.videoUrl)})
                                  </span>
                                )}
                              {(activeChapter.sourceType === 'teams_onedrive' ||
                                isMicrosoftVideoUrl(activeChapter.videoUrl)) && (
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px] flex items-center gap-1">
                                  <Briefcase className="w-2.5 h-2.5" />
                                  Teams 錄影 / OneDrive 串流
                                </span>
                              )}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              管理者可切換不同章節直接試播，並測試防掛機彈窗機制或全螢幕視圖
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTestPopupTimer(antiCheatingTimeoutSeconds || 30);
                              setIsTestPopupActive(true);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-white" />
                            測試防掛機彈窗
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsVideoPreviewModalOpen(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                            全螢幕預覽
                          </button>
                        </div>
                      </div>

                      {/* Teams/OneDrive Mode Switcher matching CourseMaterialsTab */}
                      {(activeChapter.sourceType === 'teams_onedrive' ||
                        isMicrosoftVideoUrl(activeChapter.videoUrl)) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTeamsPreviewMode('embed')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                teamsPreviewMode === 'embed'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <Briefcase className="w-3 h-3" />
                              微軟內嵌串流 (SharePoint / Stream)
                            </button>
                            <button
                              type="button"
                              onClick={() => setTeamsPreviewMode('simulation')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                teamsPreviewMode === 'simulation'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              系統高畫質模擬播放 (免登入測試)
                            </button>
                          </div>

                          {activeChapter.videoUrl && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeChapter.videoUrl || '');
                                  alert('已成功複製影片連結至剪貼簿！');
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                              >
                                <Share2 className="w-3 h-3" />
                                複製連結
                              </button>
                              <a
                                href={activeChapter.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <ExternalLink className="w-3 h-3" />
                                在新分頁直接播放 (微軟原廠完整體驗) ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video Container Frame */}
                      <div className="relative aspect-video w-full max-h-[380px] bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                        {activeChapter.sourceType === 'youtube' &&
                        getYouTubeEmbedUrl(activeChapter.videoUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(activeChapter.videoUrl) || ''}
                            title={activeChapter.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : activeChapter.sourceType === 'teams_onedrive' ||
                          isMicrosoftVideoUrl(activeChapter.videoUrl) ? (
                          teamsPreviewMode === 'simulation' ? (
                            <video
                              controls
                              autoPlay
                              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                              className="w-full h-full object-contain"
                            >
                              您的瀏覽器不支援 HTML5 影片播放。
                            </video>
                          ) : activeChapter.videoUrl ? (
                            <iframe
                              src={
                                getMicrosoftVideoEmbedUrl(activeChapter.videoUrl) ||
                                activeChapter.videoUrl
                              }
                              title={activeChapter.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                              allowFullScreen
                            />
                          ) : (
                            <div className="p-8 text-center space-y-2 text-slate-400">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                <Briefcase className="w-5 h-5 text-indigo-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-300">
                                請輸入微軟 Teams 錄影 / OneDrive 影片分享網址
                              </p>
                              <p className="text-[11px] text-slate-500">
                                可直接點選上方「Teams 智慧工區會議錄影」快速載入範例
                              </p>
                            </div>
                          )
                        ) : activeChapter.videoUrl?.endsWith('.mp4') ||
                          activeChapter.sourceType === 'mp4' ? (
                          <video
                            src={activeChapter.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                            poster="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80"
                          >
                            您的瀏覽器不支援 HTML5 影片播放。
                          </video>
                        ) : (
                          <div className="p-8 text-center space-y-2 text-slate-400">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                              <Tv className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-300">尚未設定有效影音連結</p>
                            <p className="text-[11px] text-slate-500">
                              請於上方輸入影片網址，或點選「從教材庫挑選帶入」快速選擇影片
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Informational Guidance & Troubleshooting for Teams/OneDrive */}
                      {(activeChapter.sourceType === 'teams_onedrive' ||
                        isMicrosoftVideoUrl(activeChapter.videoUrl)) && (
                        <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1">
                                <Briefcase className="w-2.5 h-2.5" />
                                微軟 Teams / OneDrive 企業雲端串流
                              </span>
                              <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 支援 Stream 播放器與多畫質切換
                              </span>
                            </div>

                            {activeChapter.videoUrl && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={activeChapter.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  在微軟雲端開啟
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/50 rounded-lg text-slate-300 text-[11px] leading-relaxed space-y-1">
                            <div className="font-bold text-indigo-300 flex items-center gap-1">
                              <span>💡 影片播放排障提示：</span>
                            </div>
                            <p>
                              1. <strong>瀏覽器 Cookie 限制</strong>：微軟 SharePoint / OneDrive 含有嚴格的企業安全性保護，若您的瀏覽器封鎖第三方 Cookie 或未登入 Microsoft 365，請點擊上方<strong>【在新分頁直接播放】</strong>即可正常觀看。
                            </p>
                            <p>
                              2. <strong>取得最佳內嵌代碼</strong>：若想獲得 100% 最佳內嵌體驗，可在微軟 Teams / Stream 影片中點選<strong>「共用 (Share)」➜「內嵌代碼 (Embed)」</strong>，將產生的網址貼入上方。
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Anti-Cheating & Attention Check Pop-up Setting */}
                    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-amber-700" />
                          <div>
                            <h5 className="text-xs font-bold text-amber-900">
                              防作弊／防掛機專注度確認彈跳視窗機制 (Anti-Cheating Liveness Check)
                            </h5>
                            <p className="text-[11px] text-amber-800">
                              播放過程中定期跳出互動確認視窗，逾時未按確認將自動中斷暫停並跳出影片
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={antiCheatingEnabled}
                            onChange={(e) => setAntiCheatingEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-amber-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      {antiCheatingEnabled && (
                        <div className="pt-2 border-t border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-amber-900 mb-1">
                              中間彈出確認視窗間隔 (分鐘)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={antiCheatingIntervalMinutes ?? 5}
                                onChange={(e) =>
                                  setAntiCheatingIntervalMinutes(Number(e.target.value))
                                }
                                min="1"
                                max="60"
                                className="w-20 px-2 py-1 bg-white border border-amber-300 rounded font-black text-center text-amber-900"
                              />
                              <span className="text-amber-800">
                                分鐘 (例如每 5 分鐘跳出一次)
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-amber-900 mb-1">
                              彈窗確認有效應答時限 (秒)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={antiCheatingTimeoutSeconds ?? 30}
                                onChange={(e) =>
                                  setAntiCheatingTimeoutSeconds(Number(e.target.value))
                                }
                                min="5"
                                max="120"
                                className="w-20 px-2 py-1 bg-white border border-amber-300 rounded font-black text-center text-amber-900"
                              />
                              <span className="text-amber-800">
                                秒內需點擊確認 (逾時即自動中斷退出)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3.5: ASSIGNMENT & ONEDRIVE (Requirement 2) */}
          {activeTab === 'assignment' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    課後實務作業繳交、指定批閱人與 OneDrive 雲端儲存設定
                  </h4>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    支援 Word、Excel、PPT、PDF 與施工圖片檔案類型，設定 OneDrive 自動歸檔路徑並支援即時線上預覽批閱
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAssignment}
                    onChange={(e) => setHasAssignment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sky-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {hasAssignment && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  {/* Title & Prompt */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        實務作業專題標題 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        placeholder="例如：【實務專題】深開挖工法關鍵要徑排程與要徑壓縮策略分析報告"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        完訓必要條件設定
                      </label>
                      <div className="flex items-center gap-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={assignmentRequiredForCompletion}
                            onChange={(e) => setAssignmentRequiredForCompletion(e.target.checked)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span>須通過作業批閱方可完訓結業</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        作業繳交指引與實務說明
                      </label>
                      <textarea
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                        rows={3}
                        placeholder="請詳細說明作業要求、工法規範、數據格式與預期產出成果..."
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 text-slate-800 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Designated Reviewer & Grading Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        指定批閱評審人員 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={assignmentReviewerEmpNo}
                        onChange={(e) => setAssignmentReviewerEmpNo(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        {instructors.map((inst) => (
                          <option key={inst.id || inst.empNo} value={inst.empNo || inst.id}>
                            {inst.name} ({inst.empNo || '內部講師'}) - {inst.department || '工務主管'}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        批閱人員將可於前台專業訓練專區與講師專區即時預覽並批改
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        評分考評機制
                      </label>
                      <select
                        value={assignmentGradingType}
                        onChange={(e) => setAssignmentGradingType(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value="score_100">百分制評分 (0-100分，可設及格線)</option>
                        <option value="pass_fail">合格審查制 (通過 / 不通過 / 退回重修)</option>
                      </select>
                    </div>

                    {assignmentGradingType === 'score_100' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          及格分數門檻 (分)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={assignmentPassingScore}
                          onChange={(e) => setAssignmentPassingScore(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* Allowed File Formats (Word, Excel, PPT, PDF, Image) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      允許繳交之檔案格式 (可單選或複選)：
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { id: 'word', label: 'Word 文件', ext: '.docx, .doc', icon: FileText, color: 'text-blue-600' },
                        { id: 'excel', label: 'Excel 試算表', ext: '.xlsx, .xls', icon: FileSpreadsheet, color: 'text-emerald-600' },
                        { id: 'powerpoint', label: 'PowerPoint 簡報', ext: '.pptx, .ppt', icon: Presentation, color: 'text-orange-600' },
                        { id: 'pdf', label: 'PDF 技術文件', ext: '.pdf', icon: FileText, color: 'text-rose-600' },
                        { id: 'image', label: '現場照片/圖片', ext: '.jpg, .png', icon: Sparkles, color: 'text-indigo-600' },
                      ].map((item) => {
                        const isChecked = assignmentAllowedTypes.includes(item.id as any);
                        const Icon = item.icon;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              if (isChecked) {
                                if (assignmentAllowedTypes.length <= 1) {
                                  alert('至少需指定一種允許的作業檔案類型！');
                                  return;
                                }
                                setAssignmentAllowedTypes(assignmentAllowedTypes.filter((t) => t !== item.id));
                              } else {
                                setAssignmentAllowedTypes([...assignmentAllowedTypes, item.id as any]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-2xs'
                                : 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Icon className={`w-4 h-4 ${isChecked ? item.color : 'text-slate-400'}`} />
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                isChecked ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-300'
                              }`}>
                                {isChecked && '✓'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {item.ext}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OneDrive Cloud Folder Path Configuration */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Cloud className="w-4 h-4 text-sky-600" />
                        指定 OneDrive / SharePoint 雲端儲存資料夾位置 <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignmentOneDriveFolderPath(
                            `OneDrive://建築工程處/專業訓練作業/2026/${courseCode || 'TR-ENG-2026'}/`
                          )
                        }
                        className="text-[10px] text-sky-600 hover:underline font-semibold"
                      >
                        恢復預設路徑格式
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={assignmentOneDriveFolderPath}
                        onChange={(e) => setAssignmentOneDriveFolderPath(e.target.value)}
                        placeholder="例如：OneDrive://建築工程處/專業訓練作業/2026/TR-ENG-2026-01/"
                        className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 text-slate-900 pr-24"
                      />
                      <span className="absolute right-3 top-2.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        雲端自動同步中
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      學員於前台繳交作業時，系統將自動寫入該 OneDrive 路徑，並維持無縫線上預覽與權限控管。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MS FORMS PRE-SURVEY */}
          {activeTab === 'pre_survey' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    MS Forms 課前學員需求問卷
                  </h4>
                  <p className="text-[11px] text-blue-800">
                    同 MS Forms 設定方式：可自訂單選、多選、評分量表、問答題與必填條件
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFormsModal('pre_survey')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  開啟 MS Forms 設計器
                </button>
              </div>

              {/* Pre Survey Questions Preview */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h5 className="text-xs font-bold text-slate-800">
                  問卷標題：{preSurveyConfig?.title}
                </h5>
                <p className="text-xs text-slate-500">{preSurveyConfig?.description}</p>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {preSurveyConfig?.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-lg text-xs">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {q.title}
                      </span>
                      {q.options && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {q.options.map((opt, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MS FORMS EXAM CONFIG */}
          {activeTab === 'exam' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    MS Forms 隨堂線上測驗設定
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    同 MS Forms 設定：可自訂每題配分、標準解答、答題解析、問答人工閱卷主管指派與重測次數限制
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExamPreviewModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-200" />
                    預覽測驗畫面 (試答/閱卷)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormsModal('exam')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    開啟 MS Forms 測驗設計器
                  </button>
                </div>
              </div>

              {/* Exam Rules Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">及格門檻</span>
                  <span className="text-sm font-black text-emerald-600">
                    {examConfig?.passingScore || 70} 分
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">允許重測次數</span>
                  <span className="text-sm font-bold text-slate-800">
                    {examConfig?.maxAttempts === 0 ? '無上限 ∞' : `${examConfig?.maxAttempts} 次`}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">作答時限</span>
                  <span className="text-sm font-bold text-slate-800">
                    {examConfig?.timeLimitMinutes || 30} 分鐘
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">測驗總配分</span>
                  <span className="text-sm font-black text-amber-600">
                    {examConfig?.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 100} 分
                  </span>
                </div>
              </div>

              {/* Exam Questions Preview */}
              <div className="space-y-2">
                {examConfig?.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {q.title}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-black text-[10px]">
                        {q.points || 25} 分
                      </span>
                    </div>
                    {q.correctAnswer && (
                      <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded">
                        標準正解: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join('、') : q.correctAnswer}
                      </div>
                    )}
                    {q.graderName && (
                      <div className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded">
                        問答閱卷批改人員: <strong>{q.graderName}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MS FORMS POST SURVEY */}
          {activeTab === 'post_survey' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-purple-600" />
                    MS Forms 課後滿意度調查問卷
                  </h4>
                  <p className="text-[11px] text-purple-800">
                    同 MS Forms 設定：星級評分、1-5分量表滿意度評估、文字建議
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFormsModal('post_survey')}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  開啟 MS Forms 滿意度設計器
                </button>
              </div>

              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                <h5 className="text-xs font-bold text-slate-800">{postSurveyConfig?.title}</h5>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {postSurveyConfig?.questions.map((q, idx) => (
                    <div key={q.id} className="p-2.5 bg-slate-50 rounded-lg text-xs">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {q.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SMART ACTION PLAN */}
          {activeTab === 'action_plan' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      課後 SMART 行動計畫與多層級主管考核評分
                    </h4>
                    <p className="text-[11px] text-indigo-800">
                      完訓後系統自動跳出，引導同仁依據知識項目填報具體、可衡量、有期限之實踐計畫
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionPlanRequired}
                      onChange={(e) => setActionPlanRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-indigo-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {actionPlanRequired && (
                  <div className="pt-3 border-t border-indigo-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-indigo-950 mb-1">
                        主管考評層級設定條件
                      </label>
                      <select
                        value={actionPlanReviewLevel || 'direct_manager'}
                        onChange={(e) => setActionPlanReviewLevel(e.target.value as ReviewLevel)}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900"
                      >
                        <option value="direct_manager">直屬主管評分 (Direct Manager)</option>
                        <option value="dept_manager">部室主管評分 (Department Head)</option>
                        <option value="president">總經理室專案核評 (General Manager)</option>
                        <option value="chairman">董事長特助/董事長親核 (Chairman)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-indigo-950 mb-1">
                        課後追蹤自評與主管考核週期
                      </label>
                      <select
                        value={actionPlanDaysToReview ?? 60}
                        onChange={(e) => setActionPlanDaysToReview(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900"
                      >
                        <option value={30}>課後 30 天 (快速成效檢核)</option>
                        <option value={60}>課後 60 天 (標準案場實踐循環)</option>
                        <option value={90}>課後 90 天 (一季度專案成效)</option>
                        <option value={180}>課後 180 天 (半年度重大里程碑)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SMART Principle Card Checklist */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">SMART 五大構面填寫指引：</h5>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-blue-600 block">S (Specific)</span>
                    <span className="text-slate-600">學習項目與具體目標</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-emerald-600 block">M (Measurable)</span>
                    <span className="text-slate-600">量化指標與驗收標準</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-amber-600 block">A (Achievable)</span>
                    <span className="text-slate-600">可行之行動方案步驟</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-purple-600 block">R (Relevant)</span>
                    <span className="text-slate-600">案場品質與工期關聯</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-rose-600 block">T (Time-bound)</span>
                    <span className="text-slate-600">明確之達成期限</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * 所有設定將即時同步至前台班級研習教室與評核模組
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all shadow-blue-500/20"
              >
                {isEditing ? '儲存課程變更' : '立即建立內部課程'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MS Forms Designer Modal Sub-dialog */}
      {activeFormsModal && (
        <MsFormsDesignerModal
          mode={activeFormsModal}
          courseTitle={title}
          initialSurvey={
            activeFormsModal === 'pre_survey' ? preSurveyConfig : postSurveyConfig
          }
          initialExam={examConfig}
          onSaveSurvey={(survey) => {
            if (activeFormsModal === 'pre_survey') {
              setPreSurveyConfig(survey);
              setHasPreSurvey(true);
            } else {
              setPostSurveyConfig(survey);
              setHasPostSurvey(true);
            }
          }}
          onSaveExam={(exam) => {
            setExamConfig(exam);
            setHasExam(true);
          }}
          onClose={() => setActiveFormsModal(null)}
        />
      )}

      {/* Online Exam Interactive Preview Modal */}
      {isExamPreviewModalOpen && examConfig && (
        <TrainingExamPreviewModal
          isOpen={isExamPreviewModalOpen}
          onClose={() => setIsExamPreviewModalOpen(false)}
          examConfig={examConfig}
          courseTitle={title}
        />
      )}

      {/* PDF High-Fidelity Viewer Modal for Materials */}
      {pdfPreviewMaterial && (
        <PdfViewerModal
          material={pdfPreviewMaterial}
          onClose={() => setPdfPreviewMaterial(null)}
        />
      )}

      {/* FULLSCREEN / DEDICATED VIDEO PREVIEW MODAL */}
      {isVideoPreviewModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    【課程影音全螢幕預覽】{title || '未命名課程'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    目前播放：第 {selectedChapterIdx + 1} 章 · {activeChapter.title} | 門檻：{activeChapter.requiredWatchPercent || 90}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Chapter selector in preview */}
                {chapters.length > 1 && (
                  <select
                    value={selectedChapterIdx}
                    onChange={(e) => setSelectedChapterIdx(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-bold"
                  >
                    {chapters.map((ch, idx) => (
                      <option key={ch.id || idx} value={idx}>
                        第 {idx + 1} 章: {ch.title}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTestPopupTimer(antiCheatingTimeoutSeconds || 30);
                    setIsTestPopupActive(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  模擬防掛機彈窗
                </button>
                <button
                  type="button"
                  onClick={() => setIsVideoPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-black flex-1 flex flex-col items-center justify-center min-h-[420px]">
              {(activeChapter.sourceType === 'teams_onedrive' ||
                isMicrosoftVideoUrl(activeChapter.videoUrl)) && (
                <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTeamsPreviewMode('embed')}
                      className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                        teamsPreviewMode === 'embed'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      微軟內嵌串流
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamsPreviewMode('simulation')}
                      className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                        teamsPreviewMode === 'simulation'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      高畫質模擬播放 (免登入)
                    </button>
                  </div>
                  {activeChapter.videoUrl && (
                    <a
                      href={activeChapter.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      微軟雲端原廠新分頁播放 ↗
                    </a>
                  )}
                </div>
              )}

              {activeChapter.sourceType === 'youtube' && getYouTubeEmbedUrl(activeChapter.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeChapter.videoUrl, true) || ''}
                  title={activeChapter.title}
                  className="w-full h-full min-h-[420px] aspect-video border-0 rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeChapter.sourceType === 'teams_onedrive' ||
                isMicrosoftVideoUrl(activeChapter.videoUrl) ? (
                teamsPreviewMode === 'simulation' ? (
                  <video
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    controls
                    autoPlay
                    className="w-full max-h-[500px] object-contain rounded-lg"
                  >
                    您的瀏覽器不支援 HTML5 影片播放。
                  </video>
                ) : activeChapter.videoUrl ? (
                  <iframe
                    src={
                      getMicrosoftVideoEmbedUrl(activeChapter.videoUrl) || activeChapter.videoUrl
                    }
                    title={activeChapter.title}
                    className="w-full h-full min-h-[420px] aspect-video border-0 rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <p>未設定有效影音 URL</p>
                  </div>
                )
              ) : activeChapter.videoUrl?.endsWith('.mp4') || activeChapter.sourceType === 'mp4' ? (
                <video
                  src={activeChapter.videoUrl}
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
              <span>💡 正式研習環境下，系統將依設定每隔 {antiCheatingIntervalMinutes} 分鐘觸發防掛機驗證</span>
              <button
                type="button"
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
                防掛機專注度即時驗證 (模擬測試中)
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                您是否正在專注觀看研習課程？
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                為確保研習品質，請於倒數結束前點擊確認按鈕。逾時未確認將中斷研習並跳出視窗。
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
                    width: `${((testPopupTimer) / (antiCheatingTimeoutSeconds || 30)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
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

      {/* MATERIAL LIBRARY IMPORT MODAL (直接從教材庫匯入) */}
      {isMaterialImportModalOpen && (
        <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    從課程教材庫直接匯入
                    <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-normal">
                      支援微軟 Teams / OneDrive 錄影 / YouTube
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    選取現有教材庫資源，一鍵無縫帶入至本課程之「影片與防掛機設定」中
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMaterialImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Mode Switcher & Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Import Target Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    匯入目標位置：
                  </span>
                  <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setImportTargetMode('new')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                        importTargetMode === 'new'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      新增為全新章節 (可多選)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTargetMode('current')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                        importTargetMode === 'current'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      帶入目前第 {selectedChapterIdx + 1} 章
                    </button>
                  </div>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMaterialTypeFilter('video_stream')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      materialTypeFilter === 'video_stream'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    僅顯示影音串流教材
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialTypeFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      materialTypeFilter === 'all'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    全部教材庫項目
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="搜尋教材名稱、關鍵字或 URL (如 Teams, OneDrive, BIM, 施工)..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                  {materialSearch && (
                    <button
                      type="button"
                      onClick={() => setMaterialSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={materialCategoryFilter}
                    onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
                  >
                    <option value="all">全部分類範疇</option>
                    <option value="建築工程">建築工程</option>
                    <option value="施工安全">施工安全</option>
                    <option value="機電系統">機電系統</option>
                    <option value="品質管理">品質管理</option>
                    <option value="智慧建築">智慧建築 / BIM</option>
                    <option value="法規與合約">法規與合約</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Materials List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[55vh]">
              {(() => {
                const filtered = (materials || []).filter((mat) => {
                  const matchSearch =
                    !materialSearch ||
                    mat.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
                    mat.description?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                    mat.fileUrl?.toLowerCase().includes(materialSearch.toLowerCase());

                  const matchCategory =
                    materialCategoryFilter === 'all' || mat.category === materialCategoryFilter;

                  const isStream =
                    mat.fileType === 'teams_onedrive' ||
                    mat.fileType === 'youtube' ||
                    isMicrosoftVideoUrl(mat.fileUrl || '') ||
                    isYouTubeUrl(mat.fileUrl || '');

                  const matchType = materialTypeFilter === 'all' || isStream;

                  return matchSearch && matchCategory && matchType;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-600">無符合條件之教材庫項目</p>
                      <p className="text-xs text-slate-400">
                        請調整上方關鍵字或切換為「全部教材庫項目」進行查找
                      </p>
                    </div>
                  );
                }

                return filtered.map((mat) => {
                  const isChecked = importSelectedMaterialIds.includes(mat.id);
                  const isMsVideo =
                    mat.fileType === 'teams_onedrive' || isMicrosoftVideoUrl(mat.fileUrl || '');
                  const isYtVideo =
                    mat.fileType === 'youtube' || isYouTubeUrl(mat.fileUrl || '');

                  return (
                    <div
                      key={mat.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {importTargetMode === 'new' && (
                          <button
                            type="button"
                            onClick={() => {
                              setImportSelectedMaterialIds((prev) =>
                                prev.includes(mat.id)
                                  ? prev.filter((id) => id !== mat.id)
                                  : [...prev, mat.id]
                              );
                            }}
                            className="mt-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{mat.title}</span>
                            {isMsVideo && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                                <Briefcase className="w-2.5 h-2.5" />
                                Teams 錄影 / OneDrive 串流
                              </span>
                            )}
                            {isYtVideo && (
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-white" />
                                YouTube 串流
                              </span>
                            )}
                            {mat.fileType === 'mp4' && !isMsVideo && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                MP4 影片檔案
                              </span>
                            )}
                            {mat.fileType === 'pdf' && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                                PDF 講義
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded">
                              {mat.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {mat.description || '無詳細說明'}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            {mat.videoDurationSeconds ? (
                              <span>時長：約 {Math.round(mat.videoDurationSeconds / 60)} 分鐘</span>
                            ) : null}
                            <span className="font-mono truncate max-w-xs">{mat.fileUrl}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {importTargetMode === 'current' ? (
                          <button
                            type="button"
                            onClick={() => handleImportMaterialToActiveChapter(mat)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            帶入第 {selectedChapterIdx + 1} 章
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleImportMaterialAsNewChapter(mat)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            新增為新章節
                          </button>
                        )}
                        {mat.fileUrl && (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="開啟原始教材連結"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
              <div>
                {importTargetMode === 'new' && importSelectedMaterialIds.length > 0 ? (
                  <span className="font-bold text-indigo-700">
                    已選取 {importSelectedMaterialIds.length} 個教材項目
                  </span>
                ) : (
                  <span className="text-slate-500">
                    共收錄 {(materials || []).length} 個教材庫項目
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportSelectedMaterialIds([]);
                    setIsMaterialImportModalOpen(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  取消
                </button>
                {importTargetMode === 'new' && (
                  <button
                    type="button"
                    disabled={importSelectedMaterialIds.length === 0}
                    onClick={handleBatchImportMaterials}
                    className={`px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      importSelectedMaterialIds.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    批次匯入選取項目 ({importSelectedMaterialIds.length})
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
