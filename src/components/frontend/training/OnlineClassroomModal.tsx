import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  CheckCircle2,
  FileText,
  HelpCircle,
  Star,
  Award,
  Download,
  Sparkles,
  ExternalLink,
  Eye,
  Clock,
  ShieldAlert,
  UserCheck,
  Target,
  RefreshCw,
  Briefcase,
  ListVideo,
  Check,
  ChevronRight,
  ChevronLeft,
  Layers,
  Lock,
  Info,
  Shuffle,
  Link2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CourseEnrollment,
  InternalCourse,
  TrainingMaterial,
  InteractiveQuestion,
  CourseVideoChapter,
  CourseVideoConfig,
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import {
  detectMaterialMediaType,
  getYouTubeEmbedUrl,
  extractYouTubeVideoId,
  isMicrosoftVideoUrl,
  getMicrosoftVideoEmbedUrl,
  isOneDriveDocUrl,
  detectOneDriveDocType,
} from '../../../utils/trainingUtils';
import { ClickAndLineMatching, calculateMatchingScore } from '../../common/ClickAndLineMatching';
import { PdfViewerModal } from '../../common/PdfViewerModal';
import { OneDriveDocumentViewerModal } from '../../common/OneDriveDocumentViewerModal';
import { SmartActionPlanModal } from './SmartActionPlanModal';
import { CertificateModal } from './CertificateModal';
import { CircularProgressBar } from './CircularProgressBar';
import { Cloud, FileSpreadsheet, Presentation, FileBadge } from 'lucide-react';

interface OnlineClassroomModalProps {
  enrollment: CourseEnrollment;
  course?: InternalCourse;
  onClose: () => void;
  isOpen?: boolean;
  onComplete?: () => void;
}

export const OnlineClassroomModal: React.FC<OnlineClassroomModalProps> = ({
  enrollment,
  course,
  onClose,
}) => {
  const { updateEnrollmentProgress } = useApp();

  // Resolve batch-specific classroom configuration if configured by Admin in 教室設定
  const matchedBatch = course.batches?.find((b) => b.id === enrollment.batchId);
  const batchClassroom = (matchedBatch as any)?.classroomConfig;

  const effectiveHasPreSurvey = batchClassroom?.hasPreSurvey ?? course.hasPreSurvey ?? true;
  const effectivePreSurveyConfig = batchClassroom?.preSurveyConfig || course.preSurveyConfig;
  const effectiveMaterials = batchClassroom?.materials || course.materials || [];
  const effectiveVideoConfig: CourseVideoConfig = batchClassroom?.videoConfig || course.videoConfig || {
    requiredDurationSeconds: 180,
    popupIntervalSeconds: 60,
    popupTimeoutSeconds: 20,
    videoSource: (effectiveMaterials?.find(
      (m: any) => detectMaterialMediaType(m) === 'youtube' || extractYouTubeVideoId(m.fileUrl)
    )?.fileUrl ? 'youtube' : 'upload') as 'upload' | 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
  };
  const effectiveHasPostTest = batchClassroom?.hasPostTest ?? course.hasPostTest ?? true;
  const effectiveExamConfig = batchClassroom?.examConfig || course.examConfig;
  const effectiveHasPostSurvey = batchClassroom?.hasPostSurvey ?? course.hasPostSurvey ?? true;
  const effectivePostSurveyConfig = batchClassroom?.postSurveyConfig || course.postSurveyConfig;

  // Active tab state: 'pre_survey' | 'video' | 'materials' | 'exam' | 'post_survey'
  const hasPreSurvey = !!effectiveHasPreSurvey && !!effectivePreSurveyConfig?.questions?.length;
  const [activeTab, setActiveTab] = useState<
    'pre_survey' | 'video' | 'materials' | 'exam' | 'post_survey'
  >(hasPreSurvey && !enrollment.preSurveyCompleted ? 'pre_survey' : 'video');

  const [pdfPreviewMaterial, setPdfPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [oneDriveDocMaterial, setOneDriveDocMaterial] = useState<TrainingMaterial | null>(null);
  const [isSmartPlanModalOpen, setIsSmartPlanModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [autoDownloadPdf, setAutoDownloadPdf] = useState(false);

  // Video Config & Chapters Playlist resolution
  const videoConfig = effectiveVideoConfig;

  const resolvedChapters: CourseVideoChapter[] = (videoConfig.chapters && videoConfig.chapters.length > 0)
    ? videoConfig.chapters
    : [
        {
          id: `ch-default-1`,
          chapterNo: 1,
          title: videoConfig.videoTitle || course.title || '第一章：核心實務觀念與工法解析',
          sourceType: (videoConfig.sourceType || videoConfig.videoSource || 'youtube') as any,
          videoSource: (videoConfig.videoSource || videoConfig.sourceType || 'youtube') as any,
          videoUrl: videoConfig.videoUrl || 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
          durationSeconds: videoConfig.videoDurationSeconds || videoConfig.requiredDurationSeconds || 600,
          description: '課程核心實務要點、施工標準作業程序與關鍵安全檢核',
          isRequired: true,
          requiredWatchPercent: 90,
        },
      ];

  const [chapters, setChapters] = useState<CourseVideoChapter[]>(resolvedChapters);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Chapter Progress Map: Record<string, { watchedSeconds: number; completed: boolean; completedAt?: string }>
  const initialChapterProgress = enrollment.chapterProgress || {};
  const [chapterProgressMap, setChapterProgressMap] = useState<
    Record<string, { watchedSeconds: number; completed: boolean; completedAt?: string }>
  >(() => {
    const map: Record<string, { watchedSeconds: number; completed: boolean; completedAt?: string }> = { ...initialChapterProgress };
    resolvedChapters.forEach((ch) => {
      if (!map[ch.id]) {
        // If whole enrollment is 100% video completed, initialize chapters as completed
        const isOverallDone = (enrollment.videoWatchPercent || 0) >= 100;
        map[ch.id] = {
          watchedSeconds: isOverallDone ? (ch.durationSeconds || 600) : 0,
          completed: isOverallDone,
          completedAt: isOverallDone ? new Date().toISOString() : undefined,
        };
      }
    });
    return map;
  });

  const activeChapter: CourseVideoChapter = chapters[activeChapterIdx] || chapters[0] || {
    id: 'ch-fallback',
    chapterNo: 1,
    title: '研習影音單元',
    videoUrl: 'https://www.youtube.com/watch?v=kYJvPoxnN1o',
    sourceType: 'youtube',
    durationSeconds: 600,
  };

  const cumulativeWatchedSeconds = Object.values(chapterProgressMap).reduce(
    (sum: number, val: { watchedSeconds?: number; completed?: boolean } | undefined) => sum + (val?.watchedSeconds || 0),
    0
  );

  const completedChaptersCount = chapters.filter((ch) => chapterProgressMap[ch.id]?.completed).length;
  const isAllChaptersCompleted = chapters.length > 0 && completedChaptersCount === chapters.length;

  const currentChapterProgress = chapterProgressMap[activeChapter.id] || {
    watchedSeconds: 0,
    completed: false,
  };
  const currentChapterDuration = activeChapter.durationSeconds || 600;
  const currentChapterRequiredSeconds = Math.round(currentChapterDuration * ((activeChapter.requiredWatchPercent || 90) / 100));
  const currentChapterPercent = Math.min(
    100,
    Math.round(((currentChapterProgress.watchedSeconds || 0) / currentChapterDuration) * 100)
  );

  // Overall video progress percent
  const videoProgressPercent = isAllChaptersCompleted
    ? 100
    : Math.min(100, Math.round((completedChaptersCount / Math.max(chapters.length, 1)) * 100));

  // Video progress state
  const [isPlaying, setIsPlaying] = useState(false);

  // Anti-cheating popup state
  const [isLivenessModalOpen, setIsLivenessModalOpen] = useState(false);
  const [livenessCountdown, setLivenessCountdown] = useState(videoConfig.popupTimeoutSeconds || 20);
  const [secondsSinceLastCheck, setSecondsSinceLastCheck] = useState(0);

  // Media embed resolution for current active chapter
  const rawVideoUrl = activeChapter.videoUrl || videoConfig.videoUrl || 'https://www.youtube.com/watch?v=kYJvPoxnN1o';
  const ytEmbedUrl = getYouTubeEmbedUrl(rawVideoUrl, true);
  const msEmbedUrl = isMicrosoftVideoUrl(rawVideoUrl) ? getMicrosoftVideoEmbedUrl(rawVideoUrl) : null;
  const isYouTubeVideo = !!ytEmbedUrl;
  const isMicrosoftVideo = !!msEmbedUrl;
  const [teamsClassroomMode, setTeamsClassroomMode] = useState<'embed' | 'simulation'>('embed');

  // Pre-Survey State
  const preQuestions: InteractiveQuestion[] = effectivePreSurveyConfig?.questions || [
    {
      id: 'pre-q-1',
      title: '您過去在工程排程與要徑管理方面之實務經驗程度為何？',
      type: 'single_choice',
      options: ['初學者 (未接觸過)', '略具概念 (曾參與排程)', '熟練 (經常負責專案排程)', '專家 (具備講師或專案主管資歷)'],
      required: true,
    },
    {
      id: 'pre-q-2',
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
      id: 'pre-q-3',
      title: '您對目前所屬工務所之進度控制流程滿意程度 (1~5星)：',
      type: 'rating_star',
      required: true,
    },
  ];
  const [preAnswers, setPreAnswers] = useState<Record<string, any>>({});
  const [preSurveySubmitted, setPreSurveySubmitted] = useState(enrollment.preSurveyCompleted || false);

  // Default Exam Questions (includes Matching 連連看)
  const defaultExamQuestions: InteractiveQuestion[] = [
    {
      id: 'exam-q-1',
      title: '於營造工程排程管理中，關鍵要徑（Critical Path）之標準定義為何？',
      type: 'single_choice',
      options: [
        '所耗工期最短的施工作業路徑',
        '總寬裕時間（Total Float）為零且決定整體工期之最長作業路徑',
        '成本預算最高的施工作業組合',
        '僅由分包商獨立負責執行的路徑',
      ],
      correctOptionIndices: [1],
      correctAnswer: '總寬裕時間（Total Float）為零且決定整體工期之最長作業路徑',
      points: 20,
      required: true,
      explanation: '關鍵要徑為網圖中總浮時為零、時程最長且決定專案總完工日之作業路徑。',
    },
    {
      id: 'exam-q-2',
      title: '案主管於現場進行進度網圖滾動式調整時，主要之風險預警指標為？',
      type: 'single_choice',
      options: [
        '當天出工工人之便當數量',
        '每日天候晴雨變化紀錄',
        '關鍵要徑作業之自由寬裕度（Free Float）受到壓縮或延誤',
        '預拌混凝土車進場頻率',
      ],
      correctOptionIndices: [2],
      correctAnswer: '關鍵要徑作業之自由寬裕度（Free Float）受到壓縮或延誤',
      points: 20,
      required: true,
      explanation: '要徑作業若產生工期延誤將直接衝擊整體專案完工里程碑。',
    },
    {
      id: 'exam-q-3',
      title: '工程要徑遭遇不可抗力展延時，案主管應於發生事實後幾日內提出書面申請並檢附佐證？',
      type: 'single_choice',
      options: ['7 日內', '14 日內', '30 日內', '完工驗收前一次提出'],
      correctOptionIndices: [0],
      correctAnswer: '7 日內',
      points: 20,
      required: true,
      explanation: '依遠雄營造工程管理規章，工期展延應於事故事實發生後 7 日內備妥佐證呈報。',
    },
    {
      id: 'exam-q-4-matching',
      title: '【連連看實務配對】請將左側深開挖與逆打工法之關鍵工項，點擊連線至右側對應之管制標準與查核重點：',
      type: 'matching',
      points: 20,
      required: true,
      matchingScoringMode: 'partial',
      matchingPairs: [
        { id: 'p-1', leftText: '逆打工法鋼柱', rightText: '垂直度偏差控制於 1/1000 內' },
        { id: 'p-2', leftText: '連續壁單元接頭', rightText: '超音波垂直檢驗與槽底抓渣' },
        { id: 'p-3', leftText: '深開挖抽水減壓', rightText: '雙環觀測水頭差防湧砂' },
        { id: 'p-4', leftText: '安全支撐系統', rightText: '千斤頂預力施加與軸力即時監控' },
      ],
      explanation: '此四項工項為深開挖與逆打工法中最關鍵的施工安全管制指標。',
    },
    {
      id: 'exam-q-5',
      title: '【實務簡答/論述】請簡述當結構體工程因連日豪大雨導致關鍵要徑落後 5 天時，您將採取何種趕工或工序重疊方案以追回工期？',
      type: 'open_text',
      points: 20,
      required: true,
      graderName: effectiveExamConfig?.graderName || '營造工程部 李協理',
    },
  ];

  const examAllowedAttempts = effectiveExamConfig?.maxAttempts ?? effectiveExamConfig?.allowedAttempts ?? 3;
  const [examAttemptCount, setExamAttemptCount] = useState(enrollment.examScore ? 1 : 0);
  const [examSubmitted, setExamSubmitted] = useState(!!enrollment.examScore);
  const [examScore, setExamScore] = useState(enrollment.examScore || 0);
  const [examAnswers, setExamAnswers] = useState<Record<string, any>>({});
  const [hasEssayPending, setHasEssayPending] = useState(false);

  // Randomize exam questions and options based on shuffleQuestions & shuffleOptions
  const examQuestions: InteractiveQuestion[] = React.useMemo(() => {
    const rawList: InteractiveQuestion[] =
      effectiveExamConfig?.questions && effectiveExamConfig.questions.length > 0
        ? effectiveExamConfig.questions
        : defaultExamQuestions;

    let list = rawList.map((q) => ({ ...q }));

    // 1. Shuffle question order if enabled
    if (effectiveExamConfig?.shuffleQuestions) {
      list = [...list].sort(() => Math.random() - 0.5);
    }

    // 2. Shuffle options order if enabled
    if (effectiveExamConfig?.shuffleOptions) {
      list = list.map((q) => {
        if ((q.type === 'single_choice' || q.type === 'multiple_choice') && q.options && q.options.length > 1) {
          const originalOptions = q.options;
          const isOptionCorrect = (opt: string, idx: number) => {
            if (q.correctAnswer) {
              if (Array.isArray(q.correctAnswer)) {
                return q.correctAnswer.includes(opt);
              }
              return q.correctAnswer === opt;
            }
            if (q.correctOptionIndices) {
              return q.correctOptionIndices.includes(idx);
            }
            return false;
          };

          const mapped = originalOptions.map((opt, idx) => ({
            text: opt,
            correct: isOptionCorrect(opt, idx),
          }));

          const shuffled = [...mapped].sort(() => Math.random() - 0.5);
          const newOptions = shuffled.map((item) => item.text);
          const newIndices = shuffled
            .map((item, idx) => (item.correct ? idx : -1))
            .filter((idx) => idx !== -1);
          const newCorrectAnswer =
            q.type === 'multiple_choice'
              ? shuffled.filter((item) => item.correct).map((item) => item.text)
              : (shuffled.find((item) => item.correct)?.text || q.correctAnswer);

          return {
            ...q,
            options: newOptions,
            correctOptionIndices: newIndices,
            correctAnswer: newCorrectAnswer,
          };
        }
        return q;
      });
    }

    return list;
  }, [effectiveExamConfig, examAttemptCount]);

  // Post-Survey State
  const postQuestions: InteractiveQuestion[] = effectivePostSurveyConfig?.questions || [
    {
      id: 'post-q-1',
      title: '講師之教學內容實務性、專業度與表達清晰度評分 (1~5星)：',
      type: 'rating_star',
      required: true,
    },
    {
      id: 'post-q-2',
      title: '教材編排結構與數位線上學習教室操作流暢度評分 (1~5星)：',
      type: 'rating_star',
      required: true,
    },
    {
      id: 'post-q-3',
      title: '本課程對於您在現職工務所管理或專案推動之實質助益程度：',
      type: 'single_choice',
      options: ['非常有幫助，能立即導入現場', '有實質幫助，部分技巧可應用', '普通，需視工地條件而定', '幫助有限'],
      required: true,
    },
    {
      id: 'post-q-4',
      title: '請留下您對本課程之寶貴意見或建議開辦之進階訓練主題：',
      type: 'open_text',
      required: false,
    },
  ];
  const [postAnswers, setPostAnswers] = useState<Record<string, any>>({
    'post-q-1': 5,
    'post-q-2': 5,
    'post-q-3': '非常有幫助，能立即導入現場',
    'post-q-4': '課程內容非常豐富紮實，建議後續可加開 BIM 4D 軟體實機操作專題班！',
  });
  const [postSurveySubmitted, setPostSurveySubmitted] = useState(enrollment.surveyCompleted || false);

  // Video playback timer & anti-cheating interval for active chapter
  useEffect(() => {
    let timer: any;
    if (isPlaying && !isLivenessModalOpen) {
      timer = setInterval(() => {
        setChapterProgressMap((prev) => {
          const chId = activeChapter.id;
          const curr = prev[chId] || { watchedSeconds: 0, completed: false };
          const nextSec = curr.watchedSeconds + 1;
          const reqSec = Math.round((activeChapter.durationSeconds || 600) * ((activeChapter.requiredWatchPercent || 90) / 100));
          const isDone = curr.completed || nextSec >= reqSec;

          const updatedMap = {
            ...prev,
            [chId]: {
              watchedSeconds: nextSec,
              completed: isDone,
              completedAt: isDone ? (curr.completedAt || new Date().toISOString()) : undefined,
            },
          };

          // Check if all chapters are done
          const allDone = chapters.every((c) => updatedMap[c.id]?.completed);
          const doneCount = chapters.filter((c) => updatedMap[c.id]?.completed).length;
          const overallPct = allDone ? 100 : Math.min(100, Math.round((doneCount / Math.max(chapters.length, 1)) * 100));

          updateEnrollmentProgress(enrollment.id, {
            chapterProgress: updatedMap,
            videoWatchPercent: overallPct,
          });

          return updatedMap;
        });

        setSecondsSinceLastCheck((prev) => {
          const next = prev + 1;
          const interval = videoConfig.popupIntervalSeconds || 60;
          if (next >= interval) {
            // Trigger anti-cheating popup
            setIsPlaying(false);
            setIsLivenessModalOpen(true);
            setLivenessCountdown(videoConfig.popupTimeoutSeconds || 20);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isLivenessModalOpen, activeChapter, videoConfig, enrollment.id, chapters, updateEnrollmentProgress]);

  // Anti-cheating countdown timer
  useEffect(() => {
    let countdownTimer: any;
    if (isLivenessModalOpen) {
      countdownTimer = setInterval(() => {
        setLivenessCountdown((prev) => {
          if (prev <= 1) {
            // Timeout reached! Close the video and kick user out to protect integrity
            setIsLivenessModalOpen(false);
            setIsPlaying(false);
            alert('【專注力檢核逾時】因您未於時限內按下「確認在線」，系統已自動暫停並退出播放視窗，請重新進入點擊播放繼續累計研習時數。');
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [isLivenessModalOpen, onClose]);

  // Handle Liveness check confirmation
  const handleConfirmLiveness = () => {
    setIsLivenessModalOpen(false);
    setSecondsSinceLastCheck(0);
    setIsPlaying(true);
  };

  // Switch to next chapter
  const handleNextChapter = () => {
    if (activeChapterIdx < chapters.length - 1) {
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  // Complete current chapter instantly
  const handleCompleteCurrentChapter = () => {
    const chId = activeChapter.id;
    const dur = activeChapter.durationSeconds || 600;
    const updatedMap = {
      ...chapterProgressMap,
      [chId]: {
        watchedSeconds: dur,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    };
    setChapterProgressMap(updatedMap);
    const allDone = chapters.every((c) => updatedMap[c.id]?.completed);
    const doneCount = chapters.filter((c) => updatedMap[c.id]?.completed).length;
    const overallPct = allDone ? 100 : Math.min(100, Math.round((doneCount / Math.max(chapters.length, 1)) * 100));

    updateEnrollmentProgress(enrollment.id, {
      chapterProgress: updatedMap,
      videoWatchPercent: overallPct,
    });

    if (activeChapterIdx < chapters.length - 1) {
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  // Complete ALL chapters instantly
  const handleCompleteAllChapters = () => {
    const updatedMap: Record<string, { watchedSeconds: number; completed: boolean; completedAt?: string }> = {};
    chapters.forEach((c) => {
      updatedMap[c.id] = {
        watchedSeconds: c.durationSeconds || 600,
        completed: true,
        completedAt: new Date().toISOString(),
      };
    });
    setChapterProgressMap(updatedMap);
    setIsPlaying(false);
    updateEnrollmentProgress(enrollment.id, {
      chapterProgress: updatedMap,
      videoWatchPercent: 100,
    });
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Submit Pre-Survey
  const handlePreSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPreSurveySubmitted(true);
    updateEnrollmentProgress(enrollment.id, {
      preSurveyCompleted: true,
    });
    alert('課前需求問卷已成功送出！現已為您解鎖數位影音研習。');
    setActiveTab('video');
  };

  // Submit Exam
  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let autoScore = 0;
    let totalPossibleAutoPoints = 0;
    let hasEssay = false;

    examQuestions.forEach((q) => {
      const qPts = q.points || 20;
      if (q.type === 'single_choice' || q.type === 'true_false') {
        totalPossibleAutoPoints += qPts;
        const userChoice = examAnswers[q.id];
        const correctChoice = q.correctOptionIndices?.[0];
        if (userChoice !== undefined) {
          if (correctChoice !== undefined && userChoice === correctChoice) {
            autoScore += qPts;
          } else if (q.correctAnswer && q.options && q.options[userChoice] === q.correctAnswer) {
            autoScore += qPts;
          }
        }
      } else if (q.type === 'multiple_choice') {
        totalPossibleAutoPoints += qPts;
        const userChoices = (examAnswers[q.id] || []) as number[];
        const correctChoices = q.correctOptionIndices || [];
        let isMatch = false;
        if (correctChoices.length > 0) {
          isMatch =
            userChoices.length === correctChoices.length &&
            userChoices.every((val) => correctChoices.includes(val));
        } else if (Array.isArray(q.correctAnswer) && q.options) {
          const userOptionTexts = userChoices.map((i) => q.options![i]);
          isMatch =
            userOptionTexts.length === q.correctAnswer.length &&
            userOptionTexts.every((text) => (q.correctAnswer as string[]).includes(text));
        }
        if (isMatch) {
          autoScore += qPts;
        }
      } else if (q.type === 'matching') {
        totalPossibleAutoPoints += qPts;
        const userMatches = (examAnswers[q.id] || {}) as Record<string, string>;
        const { earnedScore } = calculateMatchingScore(
          q.matchingPairs || [],
          userMatches,
          q.matchingScoringMode || 'partial',
          qPts
        );
        autoScore += earnedScore;
      } else if (q.type === 'open_text') {
        hasEssay = true;
      }
    });

    const finalCalculatedScore = Math.min(100, Math.round((autoScore / Math.max(totalPossibleAutoPoints, 1)) * 100));
    const passThreshold = course.examConfig?.passingScore || course.passingScore || 70;
    const isPassed = finalCalculatedScore >= passThreshold;

    setExamScore(finalCalculatedScore);
    setExamSubmitted(true);
    setExamAttemptCount((prev) => prev + 1);
    setHasEssayPending(hasEssay);

    updateEnrollmentProgress(enrollment.id, {
      examScore: finalCalculatedScore,
      examCompleted: true,
      videoWatchPercent: 100,
    });

    if (isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Submit Post-Survey
  const handlePostSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPostSurveySubmitted(true);
    updateEnrollmentProgress(enrollment.id, {
      surveyCompleted: true,
      status: 'completed',
    });
    alert('感謝您的寶貴回饋！滿意度問卷已成功送達教學品保小組，課程研習全數達標！');
    if (course.requireSmartActionPlan) {
      setIsSmartPlanModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">
                數位線上研習教室
              </span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold uppercase font-mono">
                {course.courseCode}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              梯次：{enrollment.batchName || enrollment.batchNo} · 及格門檻：{course.passingScore || 70} 分 · 研習時數：{course.hours} 小時 · 章節總數：{chapters.length} 部
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(enrollment.status === 'completed' || videoProgressPercent >= 90) && (
              <button
                type="button"
                onClick={() => {
                  setAutoDownloadPdf(false);
                  setIsCertificateModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FileBadge className="w-3.5 h-3.5" />
                <span>電子完訓證書 (PDF)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2 pt-2 overflow-x-auto">
          {hasPreSurvey && (
            <button
              onClick={() => setActiveTab('pre_survey')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'pre_survey'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              課前需求問卷 {preSurveySubmitted && '✓'}
            </button>
          )}

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            線上影音課程 ({completedChaptersCount}/{chapters.length} 章 · {videoProgressPercent}%)
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'materials'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            講義與補充教材 ({effectiveMaterials?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'exam'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            課後線上測驗 {examSubmitted && `(${examScore}分)`}
          </button>

          <button
            onClick={() => setActiveTab('post_survey')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'post_survey'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            課後滿意度問卷 {postSurveySubmitted && '✓'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* TAB 1: PRE-SURVEY */}
          {activeTab === 'pre_survey' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {course.preSurveyConfig?.title || '課前學習需求與背景問卷'}
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  {course.preSurveyConfig?.description || '本問卷旨在了解學員背景與學習期待，請依實際情況作答。'}
                </p>
              </div>

              {preSurveySubmitted ? (
                <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">課前問卷已完成填寫！</h4>
                  <p className="text-xs text-emerald-700">感謝您的反饋，您隨時可以前往影音教室進行研習。</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('video')}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    前往影音研習教室 →
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePreSurveySubmit} className="space-y-4">
                  {preQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">
                            {q.title} {q.required && <span className="text-red-500">*</span>}
                          </h5>
                        </div>
                      </div>

                      {/* Single Choice */}
                      {q.type === 'single_choice' && (
                        <div className="space-y-1.5 ml-7">
                          {q.options?.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                                preAnswers[q.id] === optIdx
                                  ? 'bg-white border-blue-500 font-semibold text-blue-900 ring-1 ring-blue-500'
                                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`pre-${q.id}`}
                                required={q.required}
                                checked={preAnswers[q.id] === optIdx}
                                onChange={() => setPreAnswers({ ...preAnswers, [q.id]: optIdx })}
                                className="w-3.5 h-3.5 text-blue-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1.5 ml-7">
                          {q.options?.map((opt, optIdx) => {
                            const current = (preAnswers[q.id] || []) as number[];
                            const isChecked = current.includes(optIdx);
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                                  isChecked
                                    ? 'bg-white border-blue-500 font-semibold text-blue-900 ring-1 ring-blue-500'
                                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPreAnswers({ ...preAnswers, [q.id]: [...current, optIdx] });
                                    } else {
                                      setPreAnswers({
                                        ...preAnswers,
                                        [q.id]: current.filter((x) => x !== optIdx),
                                      });
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Rating */}
                      {(q.type === 'rating_star' || q.type === 'scale_1_5' || q.type === 'rating') && (
                        <div className="flex items-center gap-2 ml-7">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPreAnswers({ ...preAnswers, [q.id]: s })}
                              className="p-1 focus:outline-hidden cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  (preAnswers[q.id] || 0) >= s
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-semibold text-slate-700 ml-2">
                            {preAnswers[q.id] ? `${preAnswers[q.id]} 顆星` : '請點選評分'}
                          </span>
                        </div>
                      )}

                      {/* Open Text */}
                      {q.type === 'open_text' && (
                        <div className="ml-7">
                          <textarea
                            rows={2}
                            required={q.required}
                            value={preAnswers[q.id] || ''}
                            onChange={(e) => setPreAnswers({ ...preAnswers, [q.id]: e.target.value })}
                            placeholder="請填寫您的看法與想法..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:bg-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    送出課前需求問卷並前往研習
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-CHAPTER VIDEO PLAYBACK & ANTI-CHEATING TRACKING */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Anti-Cheating & Chapter Overview Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 rounded-xl border border-indigo-100 text-xs">
                <div className="flex items-center gap-2 text-indigo-950 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>防掛機檢測：每隔 {videoConfig.popupIntervalSeconds || 60} 秒彈跳在線專注力確認 · 逾 {videoConfig.popupTimeoutSeconds || 20} 秒未響應中斷</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-800">
                  <span className="flex items-center gap-1 font-bold">
                    <ListVideo className="w-3.5 h-3.5 text-indigo-600" />
                    章節進度：{completedChaptersCount} / {chapters.length} 章完訓
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    累計觀看：{cumulativeWatchedSeconds} 秒
                  </span>
                </div>
              </div>

              {/* Microsoft Teams / OneDrive Helper Action Bar */}
              {isMicrosoftVideo && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-950 p-2.5 rounded-xl border border-indigo-800 text-xs text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-600 rounded text-[10px] font-bold flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      微軟 Teams 錄影 / Stream
                    </span>
                    <button
                      type="button"
                      onClick={() => setTeamsClassroomMode('embed')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        teamsClassroomMode === 'embed'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800'
                      }`}
                    >
                      內嵌串流
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamsClassroomMode('simulation')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        teamsClassroomMode === 'simulation'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800'
                      }`}
                    >
                      系統模擬播放
                    </button>
                  </div>

                  <a
                    href={rawVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md flex items-center gap-1.5 transition-colors shadow-xs text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    在新分頁直接播放 (微軟原廠完整體驗) ↗
                  </a>
                </div>
              )}

              {/* TWO-COLUMN PLAYBACK WORKSPACE (Left: Video player + active chapter info; Right: Playlist) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left 2 Cols: Main Player & Active Chapter Controls */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Video Player Container */}
                  <div className="aspect-video bg-black rounded-2xl flex flex-col items-center justify-between shadow-xl relative overflow-hidden text-white border border-slate-800">
                    {isYouTubeVideo ? (
                      <iframe
                        src={ytEmbedUrl}
                        title={activeChapter.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : isMicrosoftVideo ? (
                      teamsClassroomMode === 'embed' ? (
                        <iframe
                          src={msEmbedUrl || rawVideoUrl}
                          title={activeChapter.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          controls
                          autoPlay={isPlaying}
                          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : rawVideoUrl?.endsWith('.mp4') ? (
                      <video
                        controls
                        autoPlay={isPlaying}
                        src={rawVideoUrl}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-between p-6">
                        <div className="w-full flex items-center justify-between text-xs text-slate-300">
                          <span className="font-semibold truncate max-w-[80%]">{activeChapter.title}</span>
                          <span className="px-2 py-0.5 bg-blue-600/80 rounded-md text-[10px] font-bold">
                            線上學習監控中
                          </span>
                        </div>

                        <div className="text-center space-y-2">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                          </button>
                          <p className="text-xs text-slate-300">
                            {isPlaying ? '現正播放研習影片 (進度持續採計中)...' : '點擊以繼續播放觀看'}
                          </p>
                        </div>

                        <div className="text-xs text-slate-400">
                          本章研習：{Math.round(currentChapterDuration / 60)} 分鐘 · 章節進度：{currentChapterPercent}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Chapter Details & Playback Controls Bar */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Chapter Circular Progress Ring */}
                        <div className="shrink-0 mt-0.5">
                          <CircularProgressBar
                            progress={currentChapterPercent}
                            size={42}
                            strokeWidth={4}
                            completed={currentChapterProgress.completed}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-slate-800 text-white font-mono text-xs font-bold rounded">
                              第 {activeChapterIdx + 1} 章
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {activeChapter.title}
                            </h4>
                            {currentChapterProgress.completed ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                本章已完訓
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold">
                                閱讀進度 {currentChapterPercent}%
                              </span>
                            )}
                          </div>
                          {activeChapter.description && (
                            <p className="text-xs text-slate-600 mt-1">
                              {activeChapter.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isPlaying ? '暫停計時' : '啟動研習計時'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCompleteCurrentChapter}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="標記完成此章節並跳至下一章"
                        >
                          <Check className="w-3.5 h-3.5" />
                          完訓此章
                        </button>
                      </div>
                    </div>

                    {/* Chapter Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>
                          章節觀看時數：{currentChapterProgress.watchedSeconds || 0} 秒 / {currentChapterDuration} 秒 (達標門檻 {currentChapterRequiredSeconds} 秒)
                        </span>
                        <span className="font-bold text-slate-700">{currentChapterPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${currentChapterPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick navigation buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                      <button
                        type="button"
                        disabled={activeChapterIdx === 0}
                        onClick={() => setActiveChapterIdx(Math.max(0, activeChapterIdx - 1))}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        上一章
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteAllChapters}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ 一鍵全課程章節達標 (100%)
                      </button>

                      <button
                        type="button"
                        disabled={activeChapterIdx === chapters.length - 1}
                        onClick={handleNextChapter}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        下一章
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Chapter Playlist / Progress Matrix */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                        <ListVideo className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">課程影音章節播放清單</h4>
                        <p className="text-[10px] text-slate-500">共 {chapters.length} 個單元 · 需全數完訓</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-full">
                      {completedChaptersCount}/{chapters.length}
                    </span>
                  </div>

                  {/* Playlist Items */}
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[440px] pr-1">
                    {chapters.map((ch, idx) => {
                      const isActive = activeChapterIdx === idx;
                      const prog = chapterProgressMap[ch.id] || { watchedSeconds: 0, completed: false };
                      const dur = ch.durationSeconds || 600;
                      const pct = Math.min(100, Math.round(((prog.watchedSeconds || 0) / dur) * 100));
                      const isYoutube = (ch.sourceType === 'youtube' || ch.videoSource === 'youtube') || extractYouTubeVideoId(ch.videoUrl);
                      const isTeams = (ch.sourceType === 'teams_onedrive' || ch.videoSource === 'teams_onedrive') || isMicrosoftVideoUrl(ch.videoUrl);

                      return (
                        <div
                          key={ch.id}
                          onClick={() => setActiveChapterIdx(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                            isActive
                              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                              : prog.completed
                              ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Chapter Circular Progress Bar */}
                              <div className="shrink-0 mt-0.5">
                                <CircularProgressBar
                                  progress={pct}
                                  size={30}
                                  strokeWidth={3.5}
                                  completed={prog.completed}
                                />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                                  {ch.title}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                  <span>{Math.round(dur / 60)} 分鐘</span>
                                  <span>·</span>
                                  {isYoutube && <span className="text-red-600 font-bold">YouTube</span>}
                                  {isTeams && <span className="text-indigo-600 font-bold">Teams/Stream</span>}
                                  {!isYoutube && !isTeams && <span>MP4 影片</span>}
                                </div>
                              </div>
                            </div>

                            {prog.completed ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold shrink-0">
                                已完訓
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono shrink-0 font-bold">
                                {pct}%
                              </span>
                            )}
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                prog.completed ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Lock Notification */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>全課程完訓檢核：</span>
                      <span className={isAllChaptersCompleted ? 'text-emerald-600' : 'text-amber-600'}>
                        {isAllChaptersCompleted ? '✓ 已全數達標' : `尚有 ${chapters.length - completedChaptersCount} 章未完成`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      💡 需觀看完畢所有章節達標後，即可解鎖「課後線上測驗」並進行結訓考評。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPLEMENTAL MATERIALS & PDF IN-BROWSER PREVIEW */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">本課程關聯講義與參考教材清單</h4>
                <span className="text-[11px] text-slate-500">支援 Word、Excel、PPT、PDF 線上預覽與轉檔模式</span>
              </div>

              <div className="space-y-2.5">
                {effectiveMaterials.map((mat: any) => {
                  const detectedType = detectMaterialMediaType(mat);
                  const isOneDrive = detectedType === 'onedrive_doc' || isOneDriveDocUrl(mat.fileUrl);
                  const oneDriveDocType = isOneDrive ? detectOneDriveDocType(mat.fileUrl, mat.title) : null;

                  return (
                    <div
                      key={mat.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-lg ${
                            isOneDrive
                              ? oneDriveDocType === 'word'
                                ? 'bg-blue-50 text-blue-600'
                                : oneDriveDocType === 'excel'
                                ? 'bg-emerald-50 text-emerald-600'
                                : oneDriveDocType === 'powerpoint'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-rose-50 text-rose-600'
                              : detectedType === 'youtube'
                              ? 'bg-red-50 text-red-600'
                              : detectedType === 'teams_onedrive'
                              ? 'bg-indigo-50 text-indigo-600'
                              : detectedType === 'video'
                              ? 'bg-purple-50 text-purple-600'
                              : detectedType === 'pdf'
                              ? 'bg-rose-50 text-rose-600'
                              : detectedType === 'office'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {isOneDrive ? (
                            oneDriveDocType === 'excel' ? (
                              <FileSpreadsheet className="w-5 h-5" />
                            ) : oneDriveDocType === 'powerpoint' ? (
                              <Presentation className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )
                          ) : detectedType === 'youtube' ? (
                            <Play className="w-5 h-5 fill-red-600" />
                          ) : detectedType === 'teams_onedrive' ? (
                            <Briefcase className="w-5 h-5" />
                          ) : detectedType === 'video' ? (
                            <Video className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900">{mat.title}</h5>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase">
                              {isOneDrive
                                ? `ONEDRIVE 365 (${oneDriveDocType?.toUpperCase()})`
                                : detectedType === 'teams_onedrive'
                                ? 'TEAMS / ONEDRIVE'
                                : detectedType.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            檔案大小：{mat.fileSize || (isOneDrive ? '微軟 365 雲端共享' : '線上文件')} · {mat.description || '課堂官方核定補充教材'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOneDrive ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="在新分頁以 Microsoft 365 企業帳號原生開啟"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              微軟 365 原生開啟
                            </a>
                            <button
                              type="button"
                              onClick={() => setOneDriveDocMaterial(mat)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="檢視雲端檔案資訊與共用設定"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>說明</span>
                            </button>
                          </div>
                        ) : detectedType === 'youtube' || detectedType === 'teams_onedrive' ? (
                          <button
                            onClick={() => setActiveTab('video')}
                            className={`px-3 py-1.5 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs ${
                              detectedType === 'youtube' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            線上播放影片
                          </button>
                        ) : detectedType === 'link' ? (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            開啟外部連結
                          </a>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setPdfPreviewMaterial(mat)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              瀏覽器直接預覽 (PDF)
                            </button>
                            <button
                              onClick={() => alert(`已下載「${mat.title}」教材原始檔。`)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="下載原始檔"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!effectiveMaterials || effectiveMaterials.length === 0) && (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    本課程目前無附帶教材檔案
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXAM EXECUTION & AUTO-SCORING */}
          {activeTab === 'exam' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {examSubmitted ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-4 shadow-xs">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      examScore >= (course.passingScore || 70)
                        ? 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50'
                        : 'bg-red-100 text-red-600 ring-4 ring-red-50'
                    }`}
                  >
                    <Award className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      測驗得分：{examScore} 分
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      及格標準：{course.passingScore || 70} 分 · 測驗次數：第 {examAttemptCount} 次 (上限：{examAllowedAttempts === 0 ? '無上限' : `${examAllowedAttempts} 次`})
                    </p>
                  </div>

                  {hasEssayPending && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-left">
                      <strong>問答題批改通知：</strong> 您的問答題已提交予批改閱卷人員（{course.examConfig?.graderName || '營造工程部 李協理'}），問答題成績評定後將併入最終成績履歷。
                    </div>
                  )}

                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {examScore >= (course.passingScore || 70)
                      ? '恭喜您通過本課程課後線上考核！已符合結業認證學分要求。'
                      : '未達及格標準，建議重新複習教材講義與影片後再次進行測驗。'}
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    {(examAllowedAttempts === 0 || examAttemptCount < examAllowedAttempts) && (
                      <button
                        onClick={() => {
                          setExamSubmitted(false);
                          setExamAnswers({});
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        重新測驗 ({examAllowedAttempts === 0 ? '不限次數' : `剩餘 ${examAllowedAttempts - examAttemptCount} 次`})
                      </button>
                    )}
                    {examScore >= (course.passingScore || 70) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAutoDownloadPdf(false);
                          setIsCertificateModalOpen(true);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <FileBadge className="w-4 h-4" />
                        查看電子完訓證書 (PDF)
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('post_survey')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      前往填寫課後滿意度問卷 →
                    </button>
                  </div>

                  {/* Exam Answers & Explanations Review */}
                  <div className="text-left mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      測驗考題作答明細與規範解析（含連連看正解檢視）：
                    </h5>

                    <div className="space-y-4">
                      {examQuestions.map((q, idx) => {
                        let isCorrect = false;
                        let earnedPts = 0;
                        const qPts = q.points || 20;

                        if (q.type === 'single_choice' || q.type === 'true_false') {
                          const userChoice = examAnswers[q.id];
                          const correctChoice = q.correctOptionIndices?.[0];
                          if (userChoice !== undefined) {
                            if (correctChoice !== undefined && userChoice === correctChoice) {
                              isCorrect = true;
                              earnedPts = qPts;
                            } else if (q.correctAnswer && q.options && q.options[userChoice] === q.correctAnswer) {
                              isCorrect = true;
                              earnedPts = qPts;
                            }
                          }
                        } else if (q.type === 'multiple_choice') {
                          const userChoices = (examAnswers[q.id] || []) as number[];
                          const correctChoices = q.correctOptionIndices || [];
                          if (correctChoices.length > 0) {
                            isCorrect =
                              userChoices.length === correctChoices.length &&
                              userChoices.every((val) => correctChoices.includes(val));
                          }
                          if (isCorrect) earnedPts = qPts;
                        } else if (q.type === 'matching') {
                          const userMatches = (examAnswers[q.id] || {}) as Record<string, string>;
                          const res = calculateMatchingScore(
                            q.matchingPairs || [],
                            userMatches,
                            q.matchingScoringMode || 'partial',
                            qPts
                          );
                          earnedPts = res.earnedScore;
                          isCorrect = res.earnedScore === qPts;
                        }

                        return (
                          <div
                            key={q.id || idx}
                            className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-xs text-slate-800">{q.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {q.type !== 'open_text' ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                      earnedPts > 0
                                        ? earnedPts === qPts
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    得分：{earnedPts} / {qPts} 分
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                                    待評分 (配分 {qPts} 分)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Matching in Review */}
                            {q.type === 'matching' && (
                              <div className="ml-7 pt-1">
                                <ClickAndLineMatching
                                  questionId={`review-${q.id}`}
                                  pairs={q.matchingPairs || []}
                                  scoringMode={q.matchingScoringMode || 'partial'}
                                  points={qPts}
                                  value={examAnswers[q.id] || {}}
                                  disabled={true}
                                  showResult={true}
                                  shuffleRightItems={false}
                                />
                              </div>
                            )}

                            {/* Single choice / True false review */}
                            {(q.type === 'single_choice' || q.type === 'true_false') && (
                              <div className="ml-7 space-y-1 text-xs">
                                <div className="text-slate-600">
                                  您的作答：
                                  <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                    {examAnswers[q.id] !== undefined && q.options
                                      ? q.options[examAnswers[q.id]]
                                      : '(未作答)'}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="text-emerald-700 font-semibold">
                                    標準答案：
                                    {q.correctAnswer ||
                                      (q.correctOptionIndices && q.options
                                        ? q.options[q.correctOptionIndices[0]]
                                        : '無')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Multiple choice review */}
                            {q.type === 'multiple_choice' && (
                              <div className="ml-7 space-y-1 text-xs">
                                <div className="text-slate-600">
                                  您的作答：
                                  <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                    {((examAnswers[q.id] || []) as number[])
                                      .map((i) => q.options?.[i])
                                      .filter(Boolean)
                                      .join('、 ') || '(未作答)'}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="text-emerald-700 font-semibold">
                                    標準答案：
                                    {(q.correctOptionIndices || [])
                                      .map((i) => q.options?.[i])
                                      .filter(Boolean)
                                      .join('、 ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Open text review */}
                            {q.type === 'open_text' && (
                              <div className="ml-7 space-y-1 text-xs">
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px]">
                                  {examAnswers[q.id] || '(未作答)'}
                                </div>
                                <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  指定批改閱卷人：{q.graderName || '營造工程部 協理'}
                                </div>
                              </div>
                            )}

                            {/* Explanation */}
                            {q.explanation && (
                              <div className="ml-7 p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900">
                                💡 <strong>規範與題解說明：</strong>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExamSubmit} className="space-y-5">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong>線上測驗說明：</strong> 本測驗由系統自動批改客觀題與連連看配對並計算總分。及格標準為 {course.passingScore || 70} 分。
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-200/80 text-purple-900 font-bold rounded text-[11px] shrink-0">
                        允許測驗：{examAllowedAttempts === 0 ? '無上限' : `${examAllowedAttempts} 次`}
                      </span>
                    </div>
                  </div>

                  {/* Anti-Cheating Randomization Notice */}
                  {(effectiveExamConfig?.shuffleQuestions || effectiveExamConfig?.shuffleOptions) && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 text-indigo-950 text-xs flex items-center gap-2 shadow-2xs">
                      <Shuffle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold">防作弊隨機防護機制已啟用：</span>
                        {effectiveExamConfig?.shuffleQuestions && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px] mx-1">
                            題目順序隨機
                          </span>
                        )}
                        {effectiveExamConfig?.shuffleOptions && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px] mx-1">
                            選項順序隨機
                          </span>
                        )}
                        <span className="text-slate-600 text-[11px]">
                          受測同仁之考卷排列順序皆不相同，可防範並排作弊與抄襲。
                        </span>
                      </div>
                    </div>
                  )}

                  {examQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 leading-snug">
                            {q.title} {q.required && <span className="text-red-500">*</span>}
                          </h5>
                        </div>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                          {q.points || 20} 分
                        </span>
                      </div>

                      {/* Matching (連連看：點擊連線配對題) */}
                      {q.type === 'matching' && (
                        <div className="ml-7 pt-1">
                          <ClickAndLineMatching
                            questionId={q.id}
                            pairs={q.matchingPairs || []}
                            scoringMode={q.matchingScoringMode || 'partial'}
                            points={q.points || 20}
                            value={examAnswers[q.id] || {}}
                            onChange={(matches) => {
                              setExamAnswers((prev) => ({
                                ...prev,
                                [q.id]: matches,
                              }));
                            }}
                            disabled={false}
                            showResult={false}
                            shuffleRightItems={true}
                          />
                        </div>
                      )}

                      {/* Single Choice or True/False */}
                      {(q.type === 'single_choice' || q.type === 'true_false') && (
                        <div className="space-y-2 ml-7">
                          {q.options?.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                examAnswers[q.id] === optIdx
                                  ? 'bg-white border-purple-600 ring-1 ring-purple-600 text-purple-900 font-semibold shadow-2xs'
                                  : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`exam-${q.id}`}
                                required={q.required}
                                checked={examAnswers[q.id] === optIdx}
                                onChange={() => setExamAnswers({ ...examAnswers, [q.id]: optIdx })}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2 ml-7">
                          {q.options?.map((opt, optIdx) => {
                            const current = (examAnswers[q.id] || []) as number[];
                            const isChecked = current.includes(optIdx);
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-white border-purple-600 ring-1 ring-purple-600 text-purple-900 font-semibold shadow-2xs'
                                    : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setExamAnswers({ ...examAnswers, [q.id]: [...current, optIdx] });
                                    } else {
                                      setExamAnswers({
                                        ...examAnswers,
                                        [q.id]: current.filter((x) => x !== optIdx),
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Open Text / Essay with Designated Grader */}
                      {q.type === 'open_text' && (
                        <div className="space-y-2 ml-7">
                          <textarea
                            rows={3}
                            required={q.required}
                            value={examAnswers[q.id] || ''}
                            onChange={(e) => setExamAnswers({ ...examAnswers, [q.id]: e.target.value })}
                            placeholder="請在此輸入您的申論或實務應變分析作答..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500"
                          />
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>本題由指定閱卷人員批改：{q.graderName || '營造工程部 協理'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    繳交測驗卷並由系統即時判定成績
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: POST-SURVEY */}
          {activeTab === 'post_survey' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  {course.postSurveyConfig?.title || '課後學習滿意度與實務成效問卷'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {course.postSurveyConfig?.description || '感謝您參與本次訓練，請提供寶貴滿意度回饋以利持續優化教學品質。'}
                </p>
              </div>

              {postSurveySubmitted ? (
                <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-emerald-950">🎉 恭喜已達成全部完訓條件！</h4>
                    <p className="text-xs text-emerald-700">課後滿意度問卷已成功填寫，系統已自動為您核發遠雄營造「專業訓練電子完訓證書」。</p>
                  </div>

                  {/* Certificate Quick Actions */}
                  <div className="p-4 bg-white/90 rounded-xl border border-emerald-200 shadow-2xs max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <FileBadge className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">遠雄營造 電子完訓證書</p>
                        <p className="text-[10px] text-slate-500">已登錄學員個人學習歷程檔案庫</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoDownloadPdf(false);
                          setIsCertificateModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <FileBadge className="w-3.5 h-3.5" />
                        檢視證書
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoDownloadPdf(true);
                          setIsCertificateModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下載 PDF
                      </button>
                    </div>
                  </div>

                  {course.requireSmartActionPlan && (
                    <button
                      type="button"
                      onClick={() => setIsSmartPlanModalOpen(true)}
                      className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Target className="w-4 h-4" />
                      填寫課後 SMART 實踐行動計畫
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handlePostSurveySubmit} className="space-y-4">
                  {postQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800">
                          {q.title} {q.required && <span className="text-red-500">*</span>}
                        </h5>
                      </div>

                      {/* Rating */}
                      {(q.type === 'rating_star' || q.type === 'scale_1_5' || q.type === 'rating') && (
                        <div className="flex items-center gap-2 ml-7">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPostAnswers({ ...postAnswers, [q.id]: s })}
                              className="p-1 focus:outline-hidden"
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${
                                  (postAnswers[q.id] || 0) >= s
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-semibold text-slate-700 ml-2">
                            {postAnswers[q.id] ? `${postAnswers[q.id]} 顆星 / 非常滿意` : '請點選評分'}
                          </span>
                        </div>
                      )}

                      {/* Single Choice */}
                      {q.type === 'single_choice' && (
                        <div className="space-y-1.5 ml-7">
                          {q.options?.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                                postAnswers[q.id] === opt
                                  ? 'bg-white border-blue-500 font-semibold text-blue-900 ring-1 ring-blue-500'
                                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`post-${q.id}`}
                                required={q.required}
                                checked={postAnswers[q.id] === opt}
                                onChange={() => setPostAnswers({ ...postAnswers, [q.id]: opt })}
                                className="w-3.5 h-3.5 text-blue-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Open Text */}
                      {q.type === 'open_text' && (
                        <div className="ml-7">
                          <textarea
                            rows={3}
                            value={postAnswers[q.id] || ''}
                            onChange={(e) => setPostAnswers({ ...postAnswers, [q.id]: e.target.value })}
                            placeholder="請在此填寫您的寶貴建議..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    送出課後滿意度問卷
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            完成影音研習、線上測驗與問卷後，系統自動核發學分與電子結業證書
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            關閉學習教室
          </button>
        </div>
      </div>

      {/* Anti-Cheating Liveness Check Popup */}
      {isLivenessModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-indigo-500 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto ring-4 ring-indigo-50 animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">學員在線防掛機確認</h3>
              <p className="text-xs text-slate-600 mt-1">
                為確保線上研習成效，請於 <span className="font-bold text-red-600 text-sm">{livenessCountdown}</span> 秒內點擊下方按鈕以繼續研習。
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-1000"
                style={{ width: `${(livenessCountdown / (videoConfig.popupTimeoutSeconds || 20)) * 100}%` }}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 text-left">
              若逾時未確認，系統將自動暫停計時並退出研習視窗。
            </div>

            <button
              onClick={handleConfirmLiveness}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-transform hover:scale-102"
            >
              ✓ 我正在專心研習，點此繼續觀看
            </button>
          </div>
        </div>
      )}

      {/* Embedded PDF Viewer Modal for Learners */}
      {pdfPreviewMaterial && (
        <PdfViewerModal
          material={pdfPreviewMaterial}
          onClose={() => setPdfPreviewMaterial(null)}
        />
      )}

      {/* OneDrive / SharePoint Document Viewer Modal for Learners */}
      {oneDriveDocMaterial && (
        <OneDriveDocumentViewerModal
          isOpen={!!oneDriveDocMaterial}
          material={oneDriveDocMaterial}
          onClose={() => setOneDriveDocMaterial(null)}
        />
      )}

      {/* SMART Action Plan Modal Trigger */}
      {isSmartPlanModalOpen && (
        <SmartActionPlanModal
          enrollment={enrollment}
          onClose={() => setIsSmartPlanModalOpen(false)}
        />
      )}

      {/* Official Electronic Certificate Modal with PDF Generation */}
      {isCertificateModalOpen && (
        <CertificateModal
          enrollment={enrollment}
          course={course}
          autoDownload={autoDownloadPdf}
          onClose={() => {
            setIsCertificateModalOpen(false);
            setAutoDownloadPdf(false);
          }}
        />
      )}
    </div>
  );
};
