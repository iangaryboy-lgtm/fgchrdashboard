import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Award,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Star,
  CheckSquare,
  CircleDot,
  AlignLeft,
  Sliders,
  UserCheck,
  X,
  AlertCircle,
  Copy,
  Shuffle,
  Link2,
  Eye,
} from 'lucide-react';
import {
  InteractiveQuestion,
  InteractiveQuestionType,
  TrainingExamConfig,
  TrainingSurveyConfig,
  ReviewLevel,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { TrainingExamPreviewModal } from './TrainingExamPreviewModal';

interface MsFormsDesignerModalProps {
  mode: 'pre_survey' | 'post_survey' | 'exam';
  initialSurvey?: TrainingSurveyConfig;
  initialExam?: TrainingExamConfig;
  courseTitle?: string;
  onSaveSurvey?: (survey: TrainingSurveyConfig) => void;
  onSaveExam?: (exam: TrainingExamConfig) => void;
  onClose: () => void;
}

export const MsFormsDesignerModal: React.FC<MsFormsDesignerModalProps> = ({
  mode,
  initialSurvey,
  initialExam,
  courseTitle = '內部培訓課程',
  onSaveSurvey,
  onSaveExam,
  onClose,
}) => {
  const { instructors, employees } = useApp();

  // Title & description
  const [title, setTitle] = useState(
    mode === 'exam'
      ? initialExam?.title || `【${courseTitle}】隨堂線上測驗`
      : initialSurvey?.title ||
        (mode === 'pre_survey'
          ? `【${courseTitle}】課前學員需求調查問卷`
          : `【${courseTitle}】課後教學滿意度調查問卷`)
  );

  const [description, setDescription] = useState(
    initialSurvey?.description ||
      (mode === 'exam'
        ? '請於時限內完成測驗，送出後系統將即時進行自動閱卷判分。'
        : mode === 'pre_survey'
        ? '請協助填寫您過去之施工實務背景與期許主題，以利講師調整授課重點。'
        : '感謝您的熱情參與！請依據本次課程之師資教學、教材內容與實務助益提供評分。')
  );

  // Exam global settings
  const [passingScore, setPassingScore] = useState(initialExam?.passingScore ?? 70);
  const [allowRetake, setAllowRetake] = useState(
    initialExam?.allowRetake ?? (initialExam?.maxAttempts !== 1)
  );
  const [maxAttempts, setMaxAttempts] = useState(initialExam?.maxAttempts ?? 3); // 0 = unlimited, 1, 2, 3, 5
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialExam?.timeLimitMinutes ?? 30);
  const [shuffleQuestions, setShuffleQuestions] = useState(initialExam?.shuffleQuestions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState(initialExam?.shuffleOptions ?? true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Questions list
  const defaultQuestions: InteractiveQuestion[] =
    mode === 'exam'
      ? initialExam?.questions && initialExam.questions.length > 0
        ? initialExam.questions
        : [
            {
              id: 'q-1',
              title: '超高層深開挖逆打工法中，鋼柱垂直度容許偏差值標準通常為多少？',
              type: 'single_choice',
              required: true,
              options: ['1/100', '1/300', '1/1000 以內', '1/50'],
              correctAnswer: '1/1000 以內',
              points: 30,
              explanation: '逆打鋼柱要求極高垂直精度，依施工規範通常控制於 1/1000 以內。',
            },
            {
              id: 'q-2',
              title: '下列哪些是深開挖過程中地下水位異常突降的有效預防措施？(多選)',
              type: 'multiple_choice',
              required: true,
              options: [
                '基地外圍設置回灌井維持水頭',
                '加快土方開挖速度以爭取時效',
                '壁體槽段公母接頭超音波垂直檢驗',
                '實施深層高壓噴射地盤改良注漿 (JJM)',
              ],
              correctAnswer: [
                '基地外圍設置回灌井維持水頭',
                '壁體槽段公母接頭超音波垂直檢驗',
                '實施深層高壓噴射地盤改良注漿 (JJM)',
              ],
              points: 40,
              explanation: '回灌井、接頭施工品質控制與地盤改良注漿為防止鄰房沉陷之關鍵對策。',
            },
            {
              id: 'q-3',
              title: '請簡述若連續壁開挖面下方發生局部湧水砂湧現象時，現場首要緊急處置SOP為何？',
              type: 'open_text',
              required: true,
              points: 30,
              graderEmpNo: instructors[0]?.empNo || 'FG1002',
              graderName: instructors[0]?.name || '蔡孟宏 副理',
              explanation: '立即停止開挖、實施基坑回填或注水反壓平衡水頭差、啟動外部止水灌漿。',
            },
          ]
      : mode === 'pre_survey'
      ? initialSurvey?.questions && initialSurvey.questions.length > 0
        ? initialSurvey.questions
        : [
            {
              id: 'sq-1',
              title: '您過去是否曾主導或參與過地下 4 層以上深開挖或逆打工程？',
              type: 'single_choice',
              required: true,
              options: ['是，主持過 2 案以上', '是，參與過 1 案', '否，尚未接觸過逆打工法'],
            },
            {
              id: 'sq-2',
              title: '目前案場在施作階段，您最期望深入研討的實務主題是？(可複選)',
              type: 'multiple_choice',
              required: true,
              options: [
                '地下水降水水壓控制與減壓井配置',
                '壁體滲漏水緊急止水工法與灌漿SOP',
                '支撐預力監測與軸力即時告警系統',
                '鄰房沉陷保護與索賠防範措施',
              ],
            },
            {
              id: 'sq-3',
              title: '您對本次課程的具體期待或期望講師解答之現場疑難雜症：',
              type: 'open_text',
              required: false,
            },
          ]
      : initialSurvey?.questions && initialSurvey.questions.length > 0
      ? initialSurvey.questions
      : [
          {
            id: 'psq-1',
            title: '整體而言，本課程的專業技術知識對您目前案場施作具備高度實務助益。',
            type: 'scale_1_5',
            required: true,
          },
          {
            id: 'psq-2',
            title: '講師之教學表達清晰、實例解說生動且能充分解答學員提出的現場問題。',
            type: 'scale_1_5',
            required: true,
          },
          {
            id: 'psq-3',
            title: '您對本次課程與數位研習系統之整體滿意度星級評分：',
            type: 'rating_star',
            required: true,
          },
          {
            id: 'psq-4',
            title: '請留下您對後續內部訓練課程的寶貴建議或期望加開之主題：',
            type: 'open_text',
            required: false,
          },
        ];

  const [questions, setQuestions] = useState<InteractiveQuestion[]>(defaultQuestions);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    questions[0]?.id || null
  );

  // Total points calculation for exam mode
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // Add question
  const handleAddQuestion = (type: InteractiveQuestionType) => {
    const newId = `q-${Date.now()}`;
    let newQ: InteractiveQuestion = {
      id: newId,
      title:
        type === 'single_choice'
          ? '請輸入單選題題目內容...'
          : type === 'multiple_choice'
          ? '請輸入多選題題目內容...'
          : type === 'true_false'
          ? '請輸入是非判斷題題目內容...'
          : type === 'matching'
          ? '【連連看配對題】請點選左側項目並連線至右側對應答案：'
          : type === 'rating_star'
          ? '請針對本項指標進行星級評分：'
          : type === 'scale_1_5'
          ? '本課程內容符合現場工程管理需求與實務標準。'
          : '請詳細說明您的觀點或具體作法：',
      type,
      required: true,
      options:
        type === 'single_choice' || type === 'multiple_choice'
          ? ['選項 1', '選項 2', '選項 3', '選項 4']
          : type === 'true_false'
          ? ['是 (正確)', '否 (錯誤)']
          : undefined,
      matchingPairs:
        type === 'matching'
          ? [
              { id: 'p-1', leftText: '題目項目 1', rightText: '對應答案 1' },
              { id: 'p-2', leftText: '題目項目 2', rightText: '對應答案 2' },
              { id: 'p-3', leftText: '題目項目 3', rightText: '對應答案 3' },
              { id: 'p-4', leftText: '題目項目 4', rightText: '對應答案 4' },
            ]
          : undefined,
      matchingScoringMode: type === 'matching' ? 'partial' : undefined,
      points: mode === 'exam' ? 20 : undefined,
      correctAnswer:
        type === 'single_choice'
          ? '選項 1'
          : type === 'true_false'
          ? '是 (正確)'
          : type === 'multiple_choice'
          ? ['選項 1']
          : undefined,
      explanation: mode === 'exam' ? '此為解答之詳細說明與法規/規範出處...' : undefined,
      graderEmpNo:
        type === 'open_text' && mode === 'exam' ? instructors[0]?.empNo || 'FG1002' : undefined,
      graderName:
        type === 'open_text' && mode === 'exam' ? instructors[0]?.name || '內部授課講師' : undefined,
    };

    setQuestions([...questions, newQ]);
    setActiveQuestionId(newId);
  };

  // Update question
  const handleUpdateQuestion = (id: string, updates: Partial<InteractiveQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('問卷或測驗至少需保留 1 題！');
      return;
    }
    const filtered = questions.filter((q) => q.id !== id);
    setQuestions(filtered);
    if (activeQuestionId === id) {
      setActiveQuestionId(filtered[0]?.id || null);
    }
  };

  // Move question
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const newArr = [...questions];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setQuestions(newArr);
  };

  // Save handler
  const handleSave = () => {
    if (!title.trim()) {
      alert('請填寫問卷/測驗標題！');
      return;
    }

    if (mode === 'exam') {
      const examConfig: TrainingExamConfig = {
        id: initialExam?.id || `exam-${Date.now()}`,
        title,
        passingScore: Number(passingScore),
        maxAttempts: allowRetake ? Number(maxAttempts) : 1,
        allowRetake,
        timeLimitMinutes: Number(timeLimitMinutes),
        shuffleQuestions,
        shuffleOptions,
        questions,
      };
      if (onSaveExam) onSaveExam(examConfig);
    } else {
      const surveyConfig: TrainingSurveyConfig = {
        id: initialSurvey?.id || `survey-${Date.now()}`,
        title,
        type: mode,
        description,
        questions,
      };
      if (onSaveSurvey) onSaveSurvey(surveyConfig);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* MS Forms Style Top Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            mode === 'exam'
              ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 text-white'
              : mode === 'pre_survey'
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white'
              : 'bg-gradient-to-r from-purple-700 via-violet-700 to-purple-800 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              {mode === 'exam' ? (
                <Award className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white rounded text-[10px] font-extrabold uppercase tracking-wider">
                  {mode === 'exam'
                    ? 'MS Forms 互動測驗設計器'
                    : mode === 'pre_survey'
                    ? 'MS Forms 課前問卷設計器'
                    : 'MS Forms 課後滿意度問卷設計器'}
                </span>
                {mode === 'exam' && (
                  <span className="px-2 py-0.5 bg-amber-400 text-amber-950 font-black rounded text-[10px]">
                    總配分: {totalPoints} 分
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'exam' && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/30 shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-yellow-300" />
                預覽測驗畫面 (試答/閱卷)
              </button>
            )}

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Settings & Configuration Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入問卷或測驗標題..."
              className="w-full font-bold text-slate-800 bg-white px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {mode === 'exam' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-300 rounded-lg">
                <span className="text-slate-500 font-medium">及格標準:</span>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  min="40"
                  max="100"
                  className="w-12 text-center font-black text-emerald-600 bg-slate-50 rounded"
                />
                <span className="text-slate-500">分</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-300 rounded-lg">
                <span className="text-slate-500 font-medium">作答時限:</span>
                <input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  min="5"
                  max="180"
                  className="w-12 text-center font-bold text-slate-700 bg-slate-50 rounded"
                />
                <span className="text-slate-500">分鐘</span>
              </div>

              <div className="flex items-center gap-2 bg-white px-2.5 py-1 border border-slate-300 rounded-lg">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRetake}
                    onChange={(e) => setAllowRetake(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">允許重測</span>
                </label>
                {allowRetake && (
                  <select
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-semibold text-emerald-700"
                  >
                    <option value={0}>無上限 ∞</option>
                    <option value={2}>最多 2 次</option>
                    <option value={3}>最多 3 次</option>
                    <option value={5}>最多 5 次</option>
                  </select>
                )}
              </div>

              {/* Anti-Cheating Randomization Options */}
              <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 px-2.5 py-1 rounded-lg">
                <Shuffle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <label className="flex items-center gap-1 cursor-pointer text-indigo-900 font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>題目隨機</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-indigo-900 font-bold text-xs ml-1">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>選項隨機</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-[280px]">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="問卷引言與作答說明..."
                className="w-full text-slate-600 bg-white px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 text-xs"
              />
            </div>
          )}
        </div>

        {/* Content Body: Left Questions List, Right Active Question Editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 space-y-4">
          {/* Question Add Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              新增題目題型 (MS Forms 格式)：
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddQuestion('single_choice')}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <CircleDot className="w-3.5 h-3.5" />
                單選題
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                多選題
              </button>
              {mode === 'exam' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('true_false')}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    是非判斷題
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('matching')}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    連連看配對題
                  </button>
                </>
              )}
              {mode !== 'exam' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('rating_star')}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    星級評分
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('scale_1_5')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    1~5量表評分
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => handleAddQuestion('open_text')}
                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                {mode === 'exam' ? '問答/申論題' : '簡答/建言題'}
              </button>
            </div>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isSelected = activeQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`bg-white rounded-xl border transition-all p-5 shadow-xs ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase">
                        {q.type === 'single_choice'
                          ? '單選題'
                          : q.type === 'multiple_choice'
                          ? '多選題'
                          : q.type === 'true_false'
                          ? '是非題'
                          : q.type === 'matching'
                          ? '連連看配對題 (點擊連線)'
                          : q.type === 'rating_star'
                          ? '星級評分 (1-5★)'
                          : q.type === 'scale_1_5'
                          ? '滿意度量表 (1-5分)'
                          : mode === 'exam'
                          ? '問答/申論題 (人工閱卷)'
                          : '文字問答'}
                      </span>
                      {mode === 'exam' && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400 font-medium">配分:</span>
                          <input
                            type="number"
                            value={q.points || 0}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { points: Number(e.target.value) })
                            }
                            onClick={(e) => e.stopPropagation()}
                            min="0"
                            max="100"
                            className="w-14 px-2 py-0.5 bg-amber-50 border border-amber-300 rounded font-black text-amber-900 text-center"
                          />
                          <span className="text-slate-500 font-bold">分</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="上移題目"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="下移題目"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 ml-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { required: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span>必填</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-2"
                        title="刪除題目"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Title Input */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => handleUpdateQuestion(q.id, { title: e.target.value })}
                      placeholder="輸入題目問題內容..."
                      className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Question Options or Specific Controls */}
                  {(q.type === 'single_choice' ||
                    q.type === 'multiple_choice' ||
                    q.type === 'true_false') && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>選項清單 {mode === 'exam' && '（點擊前方勾選框直接設為【標準正解】）'}</span>
                        {q.type !== 'true_false' && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...(q.options || []), `新選項 ${(q.options?.length || 0) + 1}`];
                              handleUpdateQuestion(q.id, { options: newOpts });
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> 新增選項
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options?.map((opt, optIdx) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(opt)
                            : q.correctAnswer === opt;

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                mode === 'exam' && isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              {mode === 'exam' ? (
                                <button
                                  type="button"
                                  title="點擊設定為正確答案"
                                  onClick={() => {
                                    if (q.type === 'multiple_choice') {
                                      const currentList = Array.isArray(q.correctAnswer)
                                        ? [...q.correctAnswer]
                                        : [];
                                      const next = currentList.includes(opt)
                                        ? currentList.filter((o) => o !== opt)
                                        : [...currentList, opt];
                                      handleUpdateQuestion(q.id, { correctAnswer: next });
                                    } else {
                                      handleUpdateQuestion(q.id, { correctAnswer: opt });
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {isCorrect ? '✓' : optIdx + 1}
                                </button>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                              )}

                              <input
                                type="text"
                                value={opt}
                                disabled={q.type === 'true_false'}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  const oldVal = newOpts[optIdx];
                                  newOpts[optIdx] = e.target.value;
                                  let newCorrect = q.correctAnswer;
                                  if (Array.isArray(newCorrect)) {
                                    newCorrect = newCorrect.map((c) =>
                                      c === oldVal ? e.target.value : c
                                    );
                                  } else if (newCorrect === oldVal) {
                                    newCorrect = e.target.value;
                                  }
                                  handleUpdateQuestion(q.id, {
                                    options: newOpts,
                                    correctAnswer: newCorrect,
                                  });
                                }}
                                className="flex-1 text-xs bg-transparent border-0 focus:outline-hidden text-slate-800 font-medium"
                              />

                              {mode === 'exam' && isCorrect && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0">
                                  標準解答
                                </span>
                              )}

                              {q.type !== 'true_false' && (q.options?.length || 0) > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                    handleUpdateQuestion(q.id, { options: newOpts });
                                  }}
                                  className="text-slate-300 hover:text-red-500 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rating Star Preview */}
                  {q.type === 'rating_star' && (
                    <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="flex flex-col items-center gap-1 text-amber-500">
                          <Star className="w-6 h-6 fill-amber-400" />
                          <span className="text-[10px] font-bold text-amber-800">{star} 星</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1~5 Scale Preview */}
                  {q.type === 'scale_1_5' && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        {[
                          { score: 1, label: '非常不同意' },
                          { score: 2, label: '不同意' },
                          { score: 3, label: '普通' },
                          { score: 4, label: '同意' },
                          { score: 5, label: '非常同意' },
                        ].map((item) => (
                          <div
                            key={item.score}
                            className="p-2 bg-white rounded border border-slate-200 flex flex-col items-center"
                          >
                            <span className="font-bold text-slate-800">{item.score} 分</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Text / Essay Setting */}
                  {q.type === 'open_text' && (
                    <div className="mt-3 space-y-2">
                      <div className="w-full h-16 bg-slate-50 rounded-lg border border-dashed border-slate-300 p-2 text-xs text-slate-400">
                        學員於前台以多行文字作答區輸入答案...
                      </div>

                      {mode === 'exam' && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-purple-700" />
                            <span className="font-bold text-purple-900">
                              問答題批改閱卷指派人員：
                            </span>
                          </div>
                          <select
                            value={q.graderEmpNo || ''}
                            onChange={(e) => {
                              const emp = employees.find((em) => em.empNo === e.target.value);
                              const inst = instructors.find((i) => i.empNo === e.target.value);
                              const name = inst?.name || emp?.name || '指定批改人員';
                              handleUpdateQuestion(q.id, {
                                graderEmpNo: e.target.value,
                                graderName: `${name} (${e.target.value})`,
                              });
                            }}
                            className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg font-bold text-purple-900"
                          >
                            {instructors.map((inst) => (
                              <option key={inst.id} value={inst.empNo || inst.id}>
                                【授課講師】{inst.name} ({inst.organization})
                              </option>
                            ))}
                            {employees.slice(0, 10).map((emp) => (
                              <option key={emp.empNo} value={emp.empNo}>
                                【工務審查】{emp.name} ({emp.department} {emp.title})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matching Pairs (連連看：點擊連線配對題編輯區) */}
                  {q.type === 'matching' && (
                    <div className="mt-3 space-y-3 p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-purple-700" />
                          <span className="font-bold text-xs text-purple-900">
                            連連看配對項目設定（左側題目 ⟷ 右側對應答案）
                          </span>
                        </div>
                        {/* Scoring mode configuration */}
                        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-purple-200 text-xs">
                          <span className="text-slate-500 font-medium">配分機制:</span>
                          <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name={`scoring-${q.id}`}
                              checked={q.matchingScoringMode === 'all_or_nothing'}
                              onChange={() => handleUpdateQuestion(q.id, { matchingScoringMode: 'all_or_nothing' })}
                              className="text-purple-600"
                            />
                            <span>(1) 全對才給分</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer font-bold text-purple-700 ml-1">
                            <input
                              type="radio"
                              name={`scoring-${q.id}`}
                              checked={q.matchingScoringMode !== 'all_or_nothing'}
                              onChange={() => handleUpdateQuestion(q.id, { matchingScoringMode: 'partial' })}
                              className="text-purple-600"
                            />
                            <span>(2) 按比例給分 (部分得分)</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(q.matchingPairs || []).map((pair, pIdx) => (
                          <div key={pair.id || pIdx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {pIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={pair.leftText}
                              onChange={(e) => {
                                const newPairs = [...(q.matchingPairs || [])];
                                newPairs[pIdx] = { ...newPairs[pIdx], leftText: e.target.value };
                                handleUpdateQuestion(q.id, { matchingPairs: newPairs });
                              }}
                              placeholder="左側題目項目 (例如: 逆打工法鋼柱)..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-purple-500 font-medium text-slate-800"
                            />
                            <span className="text-purple-600 font-bold text-xs shrink-0">⟷</span>
                            <input
                              type="text"
                              value={pair.rightText}
                              onChange={(e) => {
                                const newPairs = [...(q.matchingPairs || [])];
                                newPairs[pIdx] = { ...newPairs[pIdx], rightText: e.target.value };
                                handleUpdateQuestion(q.id, { matchingPairs: newPairs });
                              }}
                              placeholder="右側正確配對 (例如: 垂直度偏差控制於 1/1000 內)..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-purple-500 font-medium text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if ((q.matchingPairs || []).length <= 2) {
                                  alert('連連看至少需保留 2 組配對！');
                                  return;
                                }
                                const newPairs = (q.matchingPairs || []).filter((_, i) => i !== pIdx);
                                handleUpdateQuestion(q.id, { matchingPairs: newPairs });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                              title="刪除此組配對"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newPairs = [
                              ...(q.matchingPairs || []),
                              {
                                id: `p-${Date.now()}-${(q.matchingPairs || []).length + 1}`,
                                leftText: `題目項目 ${(q.matchingPairs || []).length + 1}`,
                                rightText: `正確配對 ${(q.matchingPairs || []).length + 1}`,
                              },
                            ];
                            handleUpdateQuestion(q.id, { matchingPairs: newPairs });
                          }}
                          className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          新增一組配對
                        </button>
                        <span className="text-[11px] text-slate-500">
                          測驗時右側答案將自動打散排序，受測同仁點選左右項目即可拉出數位連線
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation for Exam */}
                  {mode === 'exam' && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        考題詳解與法規出處解析（測驗完畢後向學員展示）：
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { explanation: e.target.value })
                        }
                        placeholder="請輸入詳解說明、工程規範條文或計算推導..."
                        className="w-full text-xs bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white text-slate-700"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Save & Cancel Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            共 <strong className="text-slate-800 font-bold">{questions.length}</strong> 道題目
            {mode === 'exam' && (
              <>
                {' '}
                · 總配分{' '}
                <strong
                  className={`font-black ${
                    totalPoints === 100 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {totalPoints}
                </strong>{' '}
                分 (及格標準: {passingScore} 分)
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'exam' && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                預覽測驗畫面
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                mode === 'exam'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : mode === 'pre_survey'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
              }`}
            >
              儲存 MS Forms 設定
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Exam Preview Modal */}
      {isPreviewOpen && (
        <TrainingExamPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          examConfig={{
            id: initialExam?.id || `preview-${Date.now()}`,
            title,
            passingScore,
            maxAttempts,
            allowRetake,
            timeLimitMinutes,
            shuffleQuestions,
            shuffleOptions,
            questions,
          }}
          courseTitle={title}
        />
      )}
    </div>
  );
};
