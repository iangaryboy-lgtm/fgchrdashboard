import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SurveyQuestion, SurveyQuestionType, SurveyForm, SurveyResponse } from '../../types';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Eye,
  Settings,
  HelpCircle,
  FileText,
  Users,
  Copy,
  Save,
  Check,
  FolderOpen,
  Calendar,
  Layers,
  Search,
  Filter,
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Star,
  CheckSquare,
  ListOrdered,
  Type,
  Maximize2,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

export const SurveyFormEditor: React.FC = () => {
  const {
    surveyForms,
    activeSurveyId,
    setActiveSurveyId,
    addSurveyForm,
    updateSurveyForm,
    deleteSurveyForm,
    surveyResponses,
    surveyForm,
  } = useApp();

  // Top Tabs: 'editor' (題目編輯器) | 'responses' (填答回覆) | 'preview' (即時預覽)
  const [activeTab, setActiveTab] = useState<'editor' | 'responses' | 'preview'>('editor');

  // Currently selected form in the editor
  const [selectedFormId, setSelectedFormId] = useState<string>(activeSurveyId || surveyForms[0]?.id || 'survey-2026-01');

  // Find the form being edited
  const currentEditingForm = useMemo(() => {
    return surveyForms.find((f) => f.id === selectedFormId) || surveyForm;
  }, [surveyForms, selectedFormId, surveyForm]);

  // Form metadata editing states
  const [formTitle, setFormTitle] = useState(currentEditingForm.title);
  const [formDesc, setFormDesc] = useState(currentEditingForm.description);
  const [formCategory, setFormCategory] = useState(currentEditingForm.category || '人才意願調查');
  const [questions, setQuestions] = useState<SurveyQuestion[]>(currentEditingForm.questions);
  const [editingQId, setEditingQId] = useState<string | null>(null);

  // Sync state when switching selected form
  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
    const target = surveyForms.find((f) => f.id === formId);
    if (target) {
      setFormTitle(target.title);
      setFormDesc(target.description);
      setFormCategory(target.category || '人才意願調查');
      setQuestions(target.questions);
      setEditingQId(null);
    }
  };

  // Create New Form Modal / Mode
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormTemplate, setNewFormTemplate] = useState<'blank' | 'duplicate_current' | 'talent_pool'>('blank');

  // Save current form
  const handleSaveFormMeta = () => {
    updateSurveyForm(
      {
        title: formTitle,
        description: formDesc,
        category: formCategory,
        questions,
      },
      selectedFormId
    );
    alert(`問卷「${formTitle}」已成功儲存！`);
  };

  // Set this form as active portal form
  const handleSetAsActivePortalForm = () => {
    setActiveSurveyId(selectedFormId);
    updateSurveyForm({ isPublished: true }, selectedFormId);
    alert(`已將「${formTitle}」設為前台同仁填報之現行發布問卷！`);
  };

  // Handle Create New Form
  const handleCreateNewForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;

    let initialQuestions: SurveyQuestion[] = [];
    if (newFormTemplate === 'duplicate_current') {
      initialQuestions = JSON.parse(JSON.stringify(questions));
    } else if (newFormTemplate === 'talent_pool') {
      initialQuestions = [
        {
          id: `q_${Date.now()}_1`,
          title: '1. 可配合調動服務區域 (多選)',
          type: 'multiple_choice',
          required: true,
          options: ['可調動北區 (雙北、基隆、桃園、新竹)', '可調動中區 (苗栗、台中、彰化、南投)', '可調動南區 (雲林、嘉義、台南、高雄、屏東)'],
        },
        {
          id: `q_${Date.now()}_2`,
          title: '2. 意願承接開案規模 (多選)',
          type: 'multiple_choice',
          required: true,
          options: ['可接受規模-大型 (總樓地板面積 > 10萬㎡)', '可接受規模-中型 (3萬~10萬㎡)', '可接受規模-小型 (< 3萬㎡)'],
        },
        {
          id: `q_${Date.now()}_3`,
          title: '3. 綜合歷練與個人期許 (開放式問答)',
          type: 'open_text',
          required: false,
        },
      ];
    }

    const created = addSurveyForm({
      title: newFormName.trim(),
      description: newFormDesc.trim() || '請同仁詳實填報個人意向，本資料將作為未來開案遴選之核心依據。',
      category: '自訂問卷',
      questions: initialQuestions,
      isPublished: false,
    });

    setShowNewFormModal(false);
    setNewFormName('');
    setNewFormDesc('');
    setSelectedFormId(created.id);
    setFormTitle(created.title);
    setFormDesc(created.description);
    setFormCategory(created.category || '自訂問卷');
    setQuestions(created.questions);
  };

  // Handle Delete Form
  const handleDeleteForm = (id: string) => {
    if (surveyForms.length <= 1) {
      alert('系統至少須保留一份問卷表單，無法刪除！');
      return;
    }
    const target = surveyForms.find((f) => f.id === id);
    if (window.confirm(`確定要刪除問卷「${target?.title || id}」嗎？相關回覆仍會保留在歷史紀錄中。`)) {
      deleteSurveyForm(id);
      const remaining = surveyForms.filter((f) => f.id !== id);
      if (remaining[0]) {
        handleSelectForm(remaining[0].id);
      }
    }
  };

  // Question editing logic
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const list = [...questions];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setQuestions(list);
    updateSurveyForm({ questions: list }, selectedFormId);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('確定要刪除此題目嗎？')) {
      const list = questions.filter((q) => q.id !== id);
      setQuestions(list);
      updateSurveyForm({ questions: list }, selectedFormId);
    }
  };

  // New question form states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SurveyQuestionType>('multiple_choice');
  const [newOptionsText, setNewOptionsText] = useState('');
  const [newMatrixRowsText, setNewMatrixRowsText] = useState('');
  const [newMatrixColsText, setNewMatrixColsText] = useState('具備豐富經驗且有意願\n具備基礎經驗\n無經驗但具意願\n暫不考慮');
  const [newRequired, setNewRequired] = useState(true);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const opts = newOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const mRows = newMatrixRowsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const mCols = newMatrixColsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      required: newRequired,
      options: opts.length > 0 ? opts : undefined,
      matrixRows: mRows.length > 0 ? mRows : undefined,
      matrixCols: mCols.length > 0 ? mCols : undefined,
      maxRating: newType === 'rating_star' ? 5 : undefined,
    };

    const list = [...questions, newQ];
    setQuestions(list);
    updateSurveyForm({ questions: list }, selectedFormId);

    setNewTitle('');
    setNewOptionsText('');
    setNewMatrixRowsText('');
  };

  // -------------------------------------------------------------
  // (3-2) & (3-3) RESPONSES FILTERING & IMAGE-STYLE VISUALIZATION
  // -------------------------------------------------------------
  const [responseFilterSurveyTitle, setResponseFilterSurveyTitle] = useState<string>('ALL');
  const [responseSearchKeyword, setResponseSearchKeyword] = useState<string>('');
  const [responseViewStyle, setResponseViewStyle] = useState<'image_cards' | 'chart_summary' | 'table'>('image_cards');
  const [activeModalResponse, setActiveModalResponse] = useState<SurveyResponse | null>(null);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return surveyResponses.filter((resp) => {
      // Filter by survey title
      if (responseFilterSurveyTitle !== 'ALL') {
        const titleMatch =
          resp.surveyTitle === responseFilterSurveyTitle ||
          resp.surveyId === responseFilterSurveyTitle;
        if (!titleMatch) return false;
      }

      // Filter by keyword (EmpNo, Name, Department)
      if (responseSearchKeyword.trim()) {
        const kw = responseSearchKeyword.toLowerCase();
        const empNoMatch = resp.empNo.toLowerCase().includes(kw);
        const nameMatch = resp.empName.toLowerCase().includes(kw);
        const deptMatch = (resp.department || '').toLowerCase().includes(kw);
        if (!empNoMatch && !nameMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [surveyResponses, responseFilterSurveyTitle, responseSearchKeyword]);

  // Unique survey titles in responses
  const availableSurveyTitles = useMemo(() => {
    const set = new Set<string>();
    surveyForms.forEach((f) => set.add(f.title));
    surveyResponses.forEach((r) => {
      if (r.surveyTitle) set.add(r.surveyTitle);
    });
    return Array.from(set);
  }, [surveyForms, surveyResponses]);

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <ClipboardList className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-slate-800">
              2-3. MS Forms 表單題目與回覆維護
            </h3>
            {currentEditingForm.id === activeSurveyId && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                現行前台發布中
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            可選擇歷史儲存問卷或新增表單 · 多題型即時維護 · 問卷回覆以影像化卡片精緻呈現
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>題目編輯器</span>
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'responses'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>填答回覆</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'responses'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {surveyResponses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>前台預覽</span>
            </button>
          </div>

          {activeTab === 'editor' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetAsActivePortalForm}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                title="發布此問卷至前台供同仁填寫"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                發布至前台
              </button>
              <button
                onClick={handleSaveFormMeta}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                儲存表單
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-1. FORM SELECTOR & MANAGEMENT BAR (Appears on Editor & Preview Tabs) */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>選擇儲存表單：</span>
            </div>

            {/* Dropdown selector for saved survey forms */}
            <select
              value={selectedFormId}
              onChange={(e) => handleSelectForm(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none max-w-md min-w-[260px]"
            >
              {surveyForms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({form.questions.length} 題 · {form.createdAt}
                  {form.id === activeSurveyId ? ' · [前台發布中]' : ''})
                </option>
              ))}
            </select>

            <span className="text-[11px] text-slate-400 font-mono">
              共 {surveyForms.length} 份儲存表單
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNewFormModal(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              新增全新表單
            </button>

            <button
              onClick={() => handleDeleteForm(selectedFormId)}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              title="刪除此儲存表單"
            >
              <Trash2 className="w-3.5 h-3.5" />
              刪除此表單
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: QUESTION EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Form Settings & Questions List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Form Meta Block */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  問卷基本資訊設定
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  建立日期：{currentEditingForm.createdAt}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  問卷標題 *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="例：2026年度 案主管與儲備幹部工程意願調查表"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  問卷說明與指引文字
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  placeholder="請同仁詳實填報個人可調動區域、期望承接工程規模及特殊工法歷練意向..."
                ></textarea>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>分類標籤：{formCategory}</span>
                <span className="font-semibold text-blue-600">
                  當前包含 {questions.length} 個設定題目
                </span>
              </div>
            </div>

            {/* Questions list with drag/order and configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700">
                  題目清單 (共 {questions.length} 題)
                </span>
                <span className="text-[11px] text-slate-400">
                  可使用上下箭頭調整題目前後順序
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  目前尚未建立題目，請從右側「新增題目」面板加入問卷題目。
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {q.title}
                            </span>
                            {q.required && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-600 border border-rose-200 rounded font-semibold">
                                必填
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {q.type === 'multiple_choice'
                                ? '複選題'
                                : q.type === 'single_choice'
                                ? '單選題'
                                : q.type === 'single_matrix'
                                ? '單選矩陣'
                                : q.type === 'ranking'
                                ? '項目排序'
                                : q.type === 'rating_star'
                                ? '星級評分'
                                : '開放文字'}
                            </span>
                          </div>
                          {q.description && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-50 rounded"
                          title="上移"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-50 rounded"
                          title="下移"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question details preview */}
                    {q.options && (
                      <div className="pl-7 space-y-1 pt-1 border-t border-slate-50">
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">
                          設定選項：
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.matrixRows && (
                      <div className="pl-7 text-[11px] text-slate-600 pt-1 border-t border-slate-50">
                        <span className="font-semibold text-slate-500">
                          評估矩陣項目：
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.matrixRows.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-50/70 text-blue-800 border border-blue-100 rounded text-[10px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Add Question Panel */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 h-fit sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                新增題目至當前表單
              </h4>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                MS Forms 題庫
              </span>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  題目標題 *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例：您是否有意願參與中南部代表作開案？"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  題型類別 *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="multiple_choice">複選題 (Multiple Choice)</option>
                  <option value="single_choice">單選題 (Single Choice)</option>
                  <option value="single_matrix">單選矩陣題 (Single Matrix)</option>
                  <option value="ranking">項目排序題 (Ranking)</option>
                  <option value="rating_star">星級評分題 (Star Rating 1-5)</option>
                  <option value="open_text">開放文字題 (Open Text)</option>
                </select>
              </div>

              {/* Dynamic options inputs */}
              {(newType === 'multiple_choice' ||
                newType === 'single_choice' ||
                newType === 'ranking') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    選項清單 (一行一個選項) *
                  </label>
                  <textarea
                    rows={4}
                    value={newOptionsText}
                    onChange={(e) => setNewOptionsText(e.target.value)}
                    placeholder="選項 A (可調動北區)&#10;選項 B (可調動中區)&#10;選項 C (可調動南區)"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  ></textarea>
                </div>
              )}

              {newType === 'single_matrix' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      評估列項目 (一行一列) *
                    </label>
                    <textarea
                      rows={3}
                      value={newMatrixRowsText}
                      onChange={(e) => setNewMatrixRowsText(e.target.value)}
                      placeholder="深開挖 (B4以上基坑工法)&#10;逆打工法 (Top-Down施工)&#10;超高層特殊帷幕牆工法"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      評估欄項目 (一行一欄)
                    </label>
                    <textarea
                      rows={3}
                      value={newMatrixColsText}
                      onChange={(e) => setNewMatrixColsText(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label
                  htmlFor="req"
                  className="text-xs text-slate-700 font-semibold cursor-pointer select-none"
                >
                  設為必填題目
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                加入問卷題目
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3-2 & 3-3. TAB 2: RESPONSES VIEW (Filter by Survey Title + Image-style Cards) */}
      {/* ========================================================================= */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {/* Filtering Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* (3-2) Filter by Survey Title */}
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  問卷標題篩選：
                </span>
                <select
                  value={responseFilterSurveyTitle}
                  onChange={(e) => setResponseFilterSurveyTitle(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none max-w-md min-w-[240px]"
                >
                  <option value="ALL">全部問卷回覆 ({surveyResponses.length} 筆)</option>
                  {availableSurveyTitles.map((title) => {
                    const count = surveyResponses.filter(
                      (r) => r.surveyTitle === title || r.surveyId === title
                    ).length;
                    return (
                      <option key={title} value={title}>
                        {title} ({count} 筆回覆)
                      </option>
                    );
                  })}
                </select>

                {/* Keyword Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={responseSearchKeyword}
                    onChange={(e) => setResponseSearchKeyword(e.target.value)}
                    placeholder="搜尋姓名、工號、部室..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-48 bg-slate-50"
                  />
                </div>
              </div>

              {/* View Style Switcher (Image Cards / Table / Charts) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  onClick={() => setResponseViewStyle('image_cards')}
                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                    responseViewStyle === 'image_cards'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="以 MS Forms 影像化卡片呈現回覆紀錄"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>圖片卡片模式</span>
                </button>
                <button
                  onClick={() => setResponseViewStyle('chart_summary')}
                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                    responseViewStyle === 'chart_summary'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>統計圖表</span>
                </button>
                <button
                  onClick={() => setResponseViewStyle('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                    responseViewStyle === 'table'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>清單列表</span>
                </button>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span>
                  目前顯示：<strong>{filteredResponses.length}</strong> 筆填答紀錄
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  問卷母體：
                  {responseFilterSurveyTitle === 'ALL'
                    ? '全域所有問卷'
                    : responseFilterSurveyTitle}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                已全數完成人才庫意願標籤關聯
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* (3-3) VIEW MODE 1: IMAGE-STYLE / DOCUMENT SNAPSHOT CARDS */}
          {/* ========================================================================= */}
          {responseViewStyle === 'image_cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {filteredResponses.length === 0 ? (
                <div className="col-span-2 bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">查無符合條件的問卷回覆資料</p>
                  <p className="text-[11px]">請嘗試更換問卷標題篩選或清除搜尋關鍵字</p>
                </div>
              ) : (
                filteredResponses.map((res, index) => {
                  return (
                    <div
                      key={res.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Document Top Header / Watermark Bar (MS Forms official style) */}
                      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-3.5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                            MS Forms 填答紀錄
                          </span>
                          <span className="text-[11px] text-blue-100 font-mono truncate max-w-[200px]">
                            {res.surveyTitle || '2026年度 意願調查表'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-400/30">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            已核備
                          </span>
                          <button
                            onClick={() => setActiveModalResponse(res)}
                            className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded transition-colors"
                            title="全螢幕放大查看此問卷完整截圖"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Respondent Metadata Badge */}
                      <div className="p-4 space-y-3.5">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                              {res.empName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {res.empName}
                                </span>
                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {res.empNo}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {res.department || '工務所'} · {res.title || '案主管'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono text-[10px] text-slate-400">
                            <div>填報時間</div>
                            <div className="font-semibold text-slate-600 mt-0.5">
                              {res.submittedAt}
                            </div>
                          </div>
                        </div>

                        {/* Snapshot Content / Visualised Answers */}
                        <div className="space-y-3 text-xs">
                          {/* Q1: Regions */}
                          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              可配合調動區域 (Q1)
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-3">
                              {Array.isArray(res.answers?.q1) && res.answers.q1.length > 0 ? (
                                res.answers.q1.map((item: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px] border border-blue-200"
                                  >
                                    {item}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  {String(res.answers?.q1 || '無')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Q2: Project Scale */}
                          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              承接工程規模偏好 (Q2)
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-3">
                              {Array.isArray(res.answers?.q2) ? (
                                res.answers.q2.map((item: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium text-[11px] border border-indigo-100"
                                  >
                                    {item}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium text-[11px]">
                                  {String(res.answers?.q2 || '大型')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Q3: Matrix or Star Rating summary */}
                          {res.answers?.q3 && typeof res.answers.q3 === 'object' && (
                            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                特殊工法歷練意願與自評 (Q3 矩陣)
                              </div>
                              <div className="pl-3 space-y-1">
                                {Object.entries(res.answers.q3).slice(0, 3).map(([key, val], i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0"
                                  >
                                    <span className="text-slate-600 truncate max-w-[180px]">
                                      {key}
                                    </span>
                                    <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 text-[10px]">
                                      {String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Q5: Star Rating Display if present */}
                          {res.answers?.q5 && (
                            <div className="flex items-center justify-between px-3 py-1 bg-amber-50/50 rounded-lg border border-amber-200/50">
                              <span className="text-[11px] font-bold text-amber-900">
                                工作滿意度評分 (Q5)：
                              </span>
                              <div className="flex items-center gap-1 text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= Number(res.answers.q5)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs font-bold text-amber-800 ml-1">
                                  {res.answers.q5} / 5
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Q6 / Text feedback */}
                          {res.answers?.q6 && (
                            <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 text-[11px] text-slate-700 italic">
                              <span className="font-bold text-blue-900 not-italic block mb-0.5">
                                💬 同仁自評期許：
                              </span>
                              "{res.answers.q6}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {res.id}
                        </span>
                        <button
                          onClick={() => setActiveModalResponse(res)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          查看完整表單快照
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: CHART SUMMARY */}
          {responseViewStyle === 'chart_summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Q1. 可調動服務區域分佈統計 (共 {filteredResponses.length} 筆回覆)
                </h4>
                <div className="space-y-2 pt-2">
                  {['北區', '中區', '南區'].map((region) => {
                    const count = filteredResponses.filter((r) => {
                      const ans = r.answers?.q1;
                      if (Array.isArray(ans)) {
                        return ans.some((s: string) => s.includes(region));
                      }
                      return String(ans || '').includes(region);
                    }).length;
                    const percent =
                      filteredResponses.length > 0
                        ? Math.round((count / filteredResponses.length) * 100)
                        : 0;
                    return (
                      <div key={region} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{region} (雙北/桃竹/中南)</span>
                          <span>
                            {count} 人 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Q2. 期望承接開案規模分佈統計
                </h4>
                <div className="space-y-2 pt-2">
                  {[
                    { label: '大型 (>10萬㎡ 或 >30層)', key: '大型' },
                    { label: '中型 (3萬~10萬㎡)', key: '中型' },
                    { label: '小型 (<3萬㎡)', key: '小型' },
                  ].map((scale) => {
                    const count = filteredResponses.filter((r) => {
                      const ans = r.answers?.q2;
                      if (Array.isArray(ans)) {
                        return ans.some((s: string) => s.includes(scale.key));
                      }
                      return String(ans || '').includes(scale.key);
                    }).length;
                    const percent =
                      filteredResponses.length > 0
                        ? Math.round((count / filteredResponses.length) * 100)
                        : 0;
                    return (
                      <div key={scale.key} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{scale.label}</span>
                          <span>
                            {count} 人 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: TABLE LIST */}
          {responseViewStyle === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3">工號 / 姓名</th>
                      <th className="py-2.5 px-3">所屬部室 / 職稱</th>
                      <th className="py-2.5 px-3">問卷標題</th>
                      <th className="py-2.5 px-3">可調動區域 (Q1)</th>
                      <th className="py-2.5 px-3">承接規模 (Q2)</th>
                      <th className="py-2.5 px-3">填答時間</th>
                      <th className="py-2.5 px-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResponses.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{res.empName}</span>
                          <span className="font-mono text-slate-400 ml-1">({res.empNo})</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {res.department || '-'} · {res.title || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-blue-700 font-medium max-w-[200px] truncate">
                          {res.surveyTitle || '2026年度 意願調查表'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {Array.isArray(res.answers?.q1)
                            ? res.answers.q1.join('、')
                            : String(res.answers?.q1 || '-')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {Array.isArray(res.answers?.q2)
                            ? res.answers.q2.join('、')
                            : String(res.answers?.q2 || '-')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {res.submittedAt}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveModalResponse(res)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-[11px]"
                          >
                            檢視卡片
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 3: LIVE PREVIEW OF THE SURVEY AS SHOWN TO EMPLOYEES */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white space-y-2">
              <span className="px-2.5 py-0.5 bg-white/20 text-white rounded text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                MS Forms 線上填報即時預覽
              </span>
              <h2 className="text-xl font-bold">{formTitle}</h2>
              <p className="text-xs text-blue-100 leading-relaxed">{formDesc}</p>
            </div>

            <div className="p-6 space-y-5">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{q.title}</span>
                    {q.required && <span className="text-rose-500 font-bold">*</span>}
                  </div>

                  {q.description && (
                    <p className="text-[11px] text-slate-500 pl-7">{q.description}</p>
                  )}

                  {/* Render simulated controls */}
                  <div className="pl-7 pt-1 space-y-2">
                    {q.options &&
                      q.options.map((opt, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <input
                            type={q.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                            name={q.id}
                            disabled
                            className="rounded text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}

                    {q.matrixRows && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="p-2">工法項目</th>
                              {(q.matrixCols || ['具備豐富經驗', '具備基礎經驗', '無經驗']).map(
                                (c, ci) => (
                                  <th key={ci} className="p-2 text-center">
                                    {c}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {q.matrixRows.map((r, ri) => (
                              <tr key={ri}>
                                <td className="p-2 font-medium text-slate-800">{r}</td>
                                {(q.matrixCols || ['具備豐富經驗', '具備基礎經驗', '無經驗']).map(
                                  (_, ci) => (
                                    <td key={ci} className="p-2 text-center">
                                      <input type="radio" disabled name={`${q.id}_${ri}`} />
                                    </td>
                                  )
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {q.type === 'rating_star' && (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-5 h-5 fill-amber-300 text-amber-400" />
                        ))}
                        <span className="text-xs font-bold text-slate-500 ml-2">(1~5星)</span>
                      </div>
                    )}

                    {q.type === 'open_text' && (
                      <textarea
                        rows={3}
                        disabled
                        placeholder="填答者於此輸入文字回覆..."
                        className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-lg"
                      ></textarea>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW SURVEY FORM MODAL */}
      {/* ========================================================================= */}
      {showNewFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                新增全新 MS Forms 問卷表單
              </h3>
              <button
                onClick={() => setShowNewFormModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  問卷表單名稱 *
                </label>
                <input
                  type="text"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="例：2026Q4 特殊工法與跨區派駐意願調查"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  問卷指引與說明
                </label>
                <textarea
                  rows={2}
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  placeholder="請同仁詳實填報個人可調動區域與專長歷練..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  選擇初始範本架構
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="tmpl"
                      checked={newFormTemplate === 'talent_pool'}
                      onChange={() => setNewFormTemplate('talent_pool')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        案主管人才庫標準範本 (推薦)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        預設帶入服務區域、開案規模、特殊工法矩陣等標準題目
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="tmpl"
                      checked={newFormTemplate === 'duplicate_current'}
                      onChange={() => setNewFormTemplate('duplicate_current')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">複製當前正在編輯之表單題目</div>
                      <div className="text-[11px] text-slate-500">
                        完整拷貝「{formTitle}」包含之 {questions.length} 個題目
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="tmpl"
                      checked={newFormTemplate === 'blank'}
                      onChange={() => setNewFormTemplate('blank')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">空白表單</div>
                      <div className="text-[11px] text-slate-500">
                        從零開始自訂所有題目內容
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewFormModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  建立並開始編輯
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL-SCREEN IMAGE-STYLE RESPONSE SNAPSHOT MODAL */}
      {/* ========================================================================= */}
      {activeModalResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col">
            {/* Top Modal Action Bar */}
            <div className="bg-slate-900 text-white p-3.5 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold">
                  問卷填答紀錄卡片 (MS Forms 官方備存樣式)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  列印 / 存為PDF
                </button>
                <button
                  onClick={() => setActiveModalResponse(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (Authentic Form Style) */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/40">
              {/* Official Farglory Construction Header Banner */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-5 text-white relative overflow-hidden shadow-xs">
                <div className="relative z-10 space-y-1">
                  <div className="text-[11px] font-bold text-blue-200 tracking-wider">
                    遠雄營造股份有限公司 FARGLORY CONSTRUCTION
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {activeModalResponse.surveyTitle || '2026年度 案主管與儲備幹部工程意願調查表'}
                  </h3>
                  <div className="text-[11px] text-blue-100 pt-1 flex items-center gap-4 flex-wrap">
                    <span>
                      回覆序號：<strong>{activeModalResponse.id}</strong>
                    </span>
                    <span>
                      核備時間：<strong>{activeModalResponse.submittedAt}</strong>
                    </span>
                  </div>
                </div>

                {/* Watermark badge */}
                <div className="absolute right-4 bottom-2 opacity-15 text-5xl font-black select-none pointer-events-none">
                  FARGLORY
                </div>
              </div>

              {/* Respondent Identity Block */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">同仁姓名</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {activeModalResponse.empName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">員工編號</div>
                  <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                    {activeModalResponse.empNo}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">所屬部室</div>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {activeModalResponse.department || '工務所'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">現任職稱</div>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {activeModalResponse.title || '案主管'}
                  </div>
                </div>
              </div>

              {/* Questions and Answers in Full Detail */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  完整填答選項清單
                </h4>

                <div className="space-y-4">
                  {/* Q1 */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800">
                      1. 可配合調動之服務區域 (多選)
                    </div>
                    <div className="flex flex-wrap gap-2 pl-3">
                      {Array.isArray(activeModalResponse.answers?.q1) ? (
                        activeModalResponse.answers.q1.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded font-semibold border border-blue-200 text-xs"
                          >
                            ✓ {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600">{String(activeModalResponse.answers?.q1 || '')}</span>
                      )}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800">
                      2. 意願承接之開案規模與類型 (多選)
                    </div>
                    <div className="flex flex-wrap gap-2 pl-3">
                      {Array.isArray(activeModalResponse.answers?.q2) ? (
                        activeModalResponse.answers.q2.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded font-semibold border border-indigo-200 text-xs"
                          >
                            ✓ {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600">{String(activeModalResponse.answers?.q2 || '')}</span>
                      )}
                    </div>
                  </div>

                  {/* Q3 */}
                  {activeModalResponse.answers?.q3 && typeof activeModalResponse.answers.q3 === 'object' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">
                        3. 特殊工法歷練意願與經驗評估 (單選矩陣)
                      </div>
                      <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="p-2">工法項目</th>
                              <th className="p-2 text-right">評估結果</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.entries(activeModalResponse.answers.q3).map(([key, val], i) => (
                              <tr key={i}>
                                <td className="p-2 font-medium text-slate-800">{key}</td>
                                <td className="p-2 text-right">
                                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold border border-teal-200">
                                    {String(val)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Q4 */}
                  {activeModalResponse.answers?.q4 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">
                        4. 個人未來職涯發展重點排序 (項目排序)
                      </div>
                      <div className="pl-3 space-y-1">
                        {Array.isArray(activeModalResponse.answers.q4) ? (
                          activeModalResponse.answers.q4.map((item: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100"
                            >
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                                {i + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-600">{String(activeModalResponse.answers.q4)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Q5 */}
                  {activeModalResponse.answers?.q5 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">
                        5. 工作滿意度與公司資源支持評分 (星級評分)
                      </div>
                      <div className="pl-3 flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Number(activeModalResponse.answers.q5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-slate-700 ml-2">
                          {activeModalResponse.answers.q5} / 5 分滿意
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Q6 */}
                  {activeModalResponse.answers?.q6 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">
                        6. 其他職涯規劃或需公司協助事項 (開放式問答)
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed italic">
                        "{activeModalResponse.answers.q6}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Dismiss Button */}
            <div className="bg-white p-3.5 px-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModalResponse(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                關閉快照檢視
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
