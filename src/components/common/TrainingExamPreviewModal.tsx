import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Monitor,
  Smartphone,
  Eye,
  FileText,
  Shuffle,
  HelpCircle,
  Send,
  UserCheck,
  Check,
  Sparkles,
  Link2,
} from 'lucide-react';
import { InteractiveQuestion, TrainingExamConfig } from '../../types';
import { ClickAndLineMatching, calculateMatchingScore } from './ClickAndLineMatching';

interface TrainingExamPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examConfig: TrainingExamConfig;
  courseTitle?: string;
  batchName?: string;
}

export const TrainingExamPreviewModal: React.FC<TrainingExamPreviewModalProps> = ({
  isOpen,
  onClose,
  examConfig,
  courseTitle = '專業訓練課程',
  batchName = '第 1 梯次',
}) => {
  if (!isOpen) return null;

  // View settings
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [viewPerspective, setViewPerspective] = useState<'student' | 'answer_key'>('student');

  // Anti-cheating randomization toggles in preview
  const [previewShuffleQuestions, setPreviewShuffleQuestions] = useState<boolean>(
    examConfig.shuffleQuestions ?? false
  );
  const [previewShuffleOptions, setPreviewShuffleOptions] = useState<boolean>(
    examConfig.shuffleOptions ?? false
  );
  const [shuffleSeed, setShuffleSeed] = useState<number>(1);

  // Student test submission state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [examPassed, setExamPassed] = useState<boolean>(false);
  const [questionScores, setQuestionScores] = useState<
    Record<string, { earned: number; max: number; isCorrect: boolean }>
  >({});

  // Countdown timer simulation (starts at timeLimitMinutes or 30 min)
  const initialSeconds = (examConfig.timeLimitMinutes || 30) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (timerRunning && !isSubmitted && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, isSubmitted, remainingSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset or re-randomize questions
  const displayedQuestions: InteractiveQuestion[] = useMemo(() => {
    const raw = examConfig.questions || [];
    let list = raw.map((q) => ({ ...q }));

    // 1. Shuffle questions if enabled
    if (previewShuffleQuestions) {
      // Deterministic or pseudorandom shuffle with seed
      list = [...list].sort(() => Math.random() - 0.5);
    }

    // 2. Shuffle options if enabled
    if (previewShuffleOptions) {
      list = list.map((q) => {
        if (
          (q.type === 'single_choice' || q.type === 'multiple_choice') &&
          q.options &&
          q.options.length > 1
        ) {
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
              : shuffled.find((item) => item.correct)?.text || q.correctAnswer;

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
  }, [examConfig, previewShuffleQuestions, previewShuffleOptions, shuffleSeed]);

  // Total possible points
  const totalMaxPoints = useMemo(() => {
    return displayedQuestions.reduce((sum, q) => sum + (q.points || 20), 0);
  }, [displayedQuestions]);

  // Handle user test submission
  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();

    let autoScore = 0;
    let totalPossibleAutoPoints = 0;
    const scoresMap: Record<string, { earned: number; max: number; isCorrect: boolean }> = {};

    displayedQuestions.forEach((q) => {
      const qPts = q.points || 20;

      if (q.type === 'single_choice' || q.type === 'true_false') {
        totalPossibleAutoPoints += qPts;
        const userChoice = userAnswers[q.id];
        const correctChoice = q.correctOptionIndices?.[0];
        let isCorrect = false;

        if (userChoice !== undefined) {
          if (correctChoice !== undefined && userChoice === correctChoice) {
            isCorrect = true;
          } else if (q.correctAnswer && q.options && q.options[userChoice] === q.correctAnswer) {
            isCorrect = true;
          }
        }

        const earned = isCorrect ? qPts : 0;
        autoScore += earned;
        scoresMap[q.id] = { earned, max: qPts, isCorrect };
      } else if (q.type === 'multiple_choice') {
        totalPossibleAutoPoints += qPts;
        const userChoices = (userAnswers[q.id] || []) as number[];
        const correctChoices = q.correctOptionIndices || [];
        let isCorrect = false;

        if (correctChoices.length > 0) {
          isCorrect =
            userChoices.length === correctChoices.length &&
            userChoices.every((val) => correctChoices.includes(val));
        } else if (Array.isArray(q.correctAnswer) && q.options) {
          const userOptionTexts = userChoices.map((i) => q.options![i]);
          isCorrect =
            userOptionTexts.length === q.correctAnswer.length &&
            userOptionTexts.every((text) => (q.correctAnswer as string[]).includes(text));
        }

        const earned = isCorrect ? qPts : 0;
        autoScore += earned;
        scoresMap[q.id] = { earned, max: qPts, isCorrect };
      } else if (q.type === 'matching') {
        totalPossibleAutoPoints += qPts;
        const userMatches = (userAnswers[q.id] || {}) as Record<string, string>;
        const { earnedScore } = calculateMatchingScore(
          q.matchingPairs || [],
          userMatches,
          q.matchingScoringMode || 'partial',
          qPts
        );
        autoScore += earnedScore;
        scoresMap[q.id] = { earned: earnedScore, max: qPts, isCorrect: earnedScore === qPts };
      } else if (q.type === 'open_text') {
        scoresMap[q.id] = { earned: 0, max: qPts, isCorrect: false };
      }
    });

    const scaledScore = Math.min(
      100,
      Math.round((autoScore / Math.max(totalPossibleAutoPoints, 1)) * 100)
    );
    const passThreshold = examConfig.passingScore || 70;
    const passed = scaledScore >= passThreshold;

    setCalculatedScore(scaledScore);
    setExamPassed(passed);
    setQuestionScores(scoresMap);
    setIsSubmitted(true);
    setTimerRunning(false);
  };

  // Reset exam test
  const handleResetTest = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setCalculatedScore(0);
    setQuestionScores({});
    setRemainingSeconds(initialSeconds);
    setTimerRunning(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full flex flex-col max-h-[94vh] overflow-hidden transition-all duration-300 ${
          deviceMode === 'mobile' ? 'max-w-[480px]' : 'max-w-5xl'
        }`}
      >
        {/* Top Control Bar (MS Forms Preview Style) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-purple-700/50 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Eye className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-500/40 border border-purple-300/40 text-purple-100 rounded text-[10px] font-extrabold tracking-wider uppercase">
                  測驗畫面即時預覽
                </span>
                <span className="text-[11px] text-purple-200 font-medium">
                  {batchName}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {examConfig.title || `${courseTitle} 隨堂測驗`}
              </h3>
            </div>
          </div>

          {/* Action buttons & controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Perspective Switcher */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setViewPerspective('student')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                  viewPerspective === 'student'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                學員試答視角
              </button>
              <button
                type="button"
                onClick={() => setViewPerspective('answer_key')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                  viewPerspective === 'answer_key'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                正解與題解視角
              </button>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-md transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-white/30 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="電腦版寬螢幕視角"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-md transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-white/30 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="手機行動裝置視角"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
              title="關閉預覽"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Randomization simulator toolbar */}
        <div className="px-5 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-indigo-950 flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
              防作弊出題模擬：
            </span>
            <label className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-indigo-200 cursor-pointer font-bold text-indigo-900 text-[11px] shadow-2xs">
              <input
                type="checkbox"
                checked={previewShuffleQuestions}
                onChange={(e) => setPreviewShuffleQuestions(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>題目順序隨機</span>
            </label>
            <label className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-indigo-200 cursor-pointer font-bold text-indigo-900 text-[11px] shadow-2xs">
              <input
                type="checkbox"
                checked={previewShuffleOptions}
                onChange={(e) => setPreviewShuffleOptions(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>選項順序隨機</span>
            </label>
            {(previewShuffleQuestions || previewShuffleOptions) && (
              <button
                type="button"
                onClick={() => setShuffleSeed((s) => s + 1)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                title="重新隨機排列考卷內容"
              >
                <RotateCcw className="w-3 h-3" />
                重新打散洗題
              </button>
            )}
          </div>

          {/* Test Status Indicators */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
              <Clock className="w-3 h-3 text-amber-600" />
              作答倒數：<strong className="text-amber-800 font-mono">{formatTimer(remainingSeconds)}</strong>
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
              及格標準：<strong className="text-emerald-700">{examConfig.passingScore || 70} 分</strong>
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
              總題數：<strong>{displayedQuestions.length} 題</strong>
            </span>
          </div>
        </div>

        {/* Modal Body Container (Adapts between Desktop and Phone Frame) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div
            className={`mx-auto transition-all ${
              deviceMode === 'mobile'
                ? 'w-full bg-white rounded-3xl p-4 shadow-xl border-4 border-slate-800 space-y-4'
                : 'w-full max-w-4xl space-y-5'
            }`}
          >
            {/* Mobile View Top Mock Header */}
            {deviceMode === 'mobile' && (
              <div className="w-full flex justify-center pb-2 border-b border-slate-100">
                <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" />
                </div>
              </div>
            )}

            {/* Exam Header Banner Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold">
                  【受測同仁線上隨堂測驗】
                </span>
                <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black rounded-full text-[11px]">
                  及格標準：{examConfig.passingScore || 70} 分 (滿分 100 分)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {examConfig.title || `${courseTitle} 隨堂測驗`}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-purple-100 pt-1 border-t border-purple-400/30">
                <span>⏱ 作答限時：{examConfig.timeLimitMinutes || 30} 分鐘</span>
                <span>
                  🔄 允許重測次數：
                  {examConfig.maxAttempts === 0 ? '無上限' : `${examConfig.maxAttempts || 3} 次`}
                </span>
                <span>📝 總題數：{displayedQuestions.length} 題</span>
              </div>
            </div>

            {/* Anti-Cheating Active Notification */}
            {(previewShuffleQuestions || previewShuffleOptions) && (
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 text-indigo-950 text-xs flex items-center gap-2 shadow-2xs">
                <Shuffle className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold">防作弊隨機防護機制已啟用：</span>
                  {previewShuffleQuestions && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px] mx-1">
                      題目順序隨機
                    </span>
                  )}
                  {previewShuffleOptions && (
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

            {/* Submitted Result Scorecard (When in Student mode after submission) */}
            {viewPerspective === 'student' && isSubmitted && (
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center space-y-2">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${
                      examPassed
                        ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50'
                        : 'bg-rose-100 text-rose-600 ring-8 ring-rose-50'
                    }`}
                  >
                    {examPassed ? (
                      <Award className="w-8 h-8" />
                    ) : (
                      <AlertCircle className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-bold block">
                      測驗試答結算得分
                    </span>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span
                        className={`text-4xl sm:text-5xl font-black ${
                          examPassed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {calculatedScore}
                      </span>
                      <span className="text-lg font-bold text-slate-400">/ 100 分</span>
                    </div>
                  </div>

                  <p
                    className={`text-xs font-bold ${
                      examPassed ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {examPassed
                      ? '恭喜您！成績達到及格標準，已順利通過隨堂線上測驗！'
                      : `測驗未達 ${examConfig.passingScore || 70} 分及格標準，建議複習教材並再次重試。`}
                  </p>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleResetTest}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重新模擬作答測驗
                    </button>
                  </div>
                </div>

                {/* Score breakdown per question */}
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <h5 className="font-bold text-slate-800 mb-2">題項作答分析明細：</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {displayedQuestions.map((q, idx) => {
                      const sc = questionScores[q.id];
                      return (
                        <div
                          key={q.id || idx}
                          className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center"
                        >
                          <span className="text-[10px] text-slate-500 block">
                            第 {idx + 1} 題 ({q.type === 'matching' ? '連連看' : q.type === 'open_text' ? '簡答' : '選擇'})
                          </span>
                          <span
                            className={`font-bold text-xs ${
                              q.type === 'open_text'
                                ? 'text-purple-600'
                                : (sc?.earned || 0) > 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {q.type === 'open_text'
                              ? '人工待閱'
                              : `${sc?.earned || 0} / ${sc?.max || q.points || 20} 分`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Questions Form or Review Container */}
            <form onSubmit={handleSubmitExam} className="space-y-4">
              {displayedQuestions.map((q, idx) => {
                const sc = questionScores[q.id];
                const isReview = viewPerspective === 'answer_key' || isSubmitted;

                return (
                  <div
                    key={q.id || idx}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-purple-300 transition-colors"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {q.type === 'single_choice'
                                ? '單選題'
                                : q.type === 'multiple_choice'
                                ? '多選題'
                                : q.type === 'true_false'
                                ? '是非題'
                                : q.type === 'matching'
                                ? '連連看配對題'
                                : '簡答論述題'}
                            </span>
                            {q.required && (
                              <span className="text-[10px] text-rose-500 font-bold">*必答</span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 leading-snug">
                            {q.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-[11px] font-bold">
                          配分：{q.points || 20} 分
                        </span>
                        {isReview && sc && q.type !== 'open_text' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sc.earned === sc.max
                                ? 'bg-emerald-100 text-emerald-800'
                                : sc.earned > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            得分：{sc.earned} 分
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Type: Single Choice & True/False */}
                    {(q.type === 'single_choice' || q.type === 'true_false') && (
                      <div className="ml-8 space-y-2 pt-1">
                        {(q.options || ['選項 A', '選項 B']).map((opt, optIdx) => {
                          const isChecked = userAnswers[q.id] === optIdx;
                          const isCorrectOption =
                            q.correctAnswer === opt ||
                            (q.correctOptionIndices && q.correctOptionIndices.includes(optIdx));

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                isReview
                                  ? isCorrectOption
                                    ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950'
                                    : isChecked
                                    ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                                    : 'bg-slate-50/60 border-slate-200 text-slate-700'
                                  : isChecked
                                  ? 'bg-purple-50 border-purple-500 font-bold text-purple-900 shadow-2xs'
                                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={isChecked}
                                onChange={() =>
                                  !isSubmitted &&
                                  viewPerspective === 'student' &&
                                  setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                }
                                disabled={isSubmitted || viewPerspective === 'answer_key'}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="flex-1">{opt}</span>
                              {isReview && isCorrectOption && (
                                <span className="text-[11px] text-emerald-700 font-black flex items-center gap-0.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  標準正解
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Question Type: Multiple Choice */}
                    {q.type === 'multiple_choice' && (
                      <div className="ml-8 space-y-2 pt-1">
                        {(q.options || ['選項 A', '選項 B', '選項 C', '選項 D']).map((opt, optIdx) => {
                          const currentSelected = (userAnswers[q.id] || []) as number[];
                          const isChecked = currentSelected.includes(optIdx);
                          const isCorrectOption =
                            (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)) ||
                            (q.correctOptionIndices && q.correctOptionIndices.includes(optIdx));

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                isReview
                                  ? isCorrectOption
                                    ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950'
                                    : isChecked
                                    ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                                    : 'bg-slate-50/60 border-slate-200 text-slate-700'
                                  : isChecked
                                  ? 'bg-purple-50 border-purple-500 font-bold text-purple-900 shadow-2xs'
                                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (isSubmitted || viewPerspective === 'answer_key') return;
                                  const updated = e.target.checked
                                    ? [...currentSelected, optIdx]
                                    : currentSelected.filter((i) => i !== optIdx);
                                  setUserAnswers((prev) => ({ ...prev, [q.id]: updated }));
                                }}
                                disabled={isSubmitted || viewPerspective === 'answer_key'}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="flex-1">{opt}</span>
                              {isReview && isCorrectOption && (
                                <span className="text-[11px] text-emerald-700 font-black flex items-center gap-0.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  標準正解
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Question Type: Matching (連連看：點擊連線配對) */}
                    {q.type === 'matching' && (
                      <div className="ml-8 pt-1">
                        <ClickAndLineMatching
                          questionId={`preview-${q.id}`}
                          pairs={q.matchingPairs || []}
                          scoringMode={q.matchingScoringMode || 'partial'}
                          points={q.points || 20}
                          value={
                            viewPerspective === 'answer_key'
                              ? (q.matchingPairs || []).reduce((acc, p) => {
                                  acc[p.id] = p.rightText;
                                  return acc;
                                }, {} as Record<string, string>)
                              : userAnswers[q.id] || {}
                          }
                          onChange={(matches) => {
                            if (!isSubmitted && viewPerspective === 'student') {
                              setUserAnswers((prev) => ({ ...prev, [q.id]: matches }));
                            }
                          }}
                          disabled={isSubmitted || viewPerspective === 'answer_key'}
                          showResult={isReview}
                          shuffleRightItems={viewPerspective !== 'answer_key'}
                        />
                      </div>
                    )}

                    {/* Question Type: Open Text */}
                    {q.type === 'open_text' && (
                      <div className="ml-8 space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={userAnswers[q.id] || ''}
                          onChange={(e) =>
                            !isSubmitted &&
                            viewPerspective === 'student' &&
                            setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          disabled={isSubmitted || viewPerspective === 'answer_key'}
                          placeholder="請在此輸入您的工程實務說明或因應對策..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 text-purple-700 font-bold">
                            <UserCheck className="w-3.5 h-3.5" />
                            本題為實務論述題，指派閱卷人：{q.graderName || '授課講師/直屬主管'}
                          </span>
                          <span>此題型由主考官於課後人工批改並核算積分</span>
                        </div>
                      </div>
                    )}

                    {/* Answer Key & Explanation Box */}
                    {isReview && q.explanation && (
                      <div className="ml-8 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1">
                        <div className="font-bold text-indigo-900 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                          工程法規與題解說明：
                        </div>
                        <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit Buttons in Student Mode */}
              {viewPerspective === 'student' && !isSubmitted && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">
                    💡 本測驗預覽支援即時試答與電腦自動閱卷算分，請確認各題作答後點擊交卷。
                  </span>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    繳交測驗卷並由系統即時判定成績
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            視角模式：
            <strong className="text-purple-700 ml-1">
              {viewPerspective === 'student' ? '學員作答模式' : '標準解答與題解檢視模式'}
            </strong>
            <span className="mx-2 text-slate-300">|</span>
            裝置：
            <strong className="text-slate-700 ml-1">
              {deviceMode === 'desktop' ? '電腦寬螢幕' : '手機行動版'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetTest}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold transition-colors shadow-2xs"
            >
              重設試答
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors shadow-2xs"
            >
              關閉預覽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
