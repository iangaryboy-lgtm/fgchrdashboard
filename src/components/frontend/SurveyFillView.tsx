import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  CheckCircle2,
  Star,
  Send,
  User,
  Building,
  Sparkles,
  ArrowUpDown,
  Check,
  RotateCcw,
} from 'lucide-react';

export const SurveyFillView: React.FC = () => {
  const { currentUser, surveyForm, submitSurveyResponse, employees } = useApp();

  // If user is employee, prefill; otherwise allow selecting or typing employee info
  const [empNo, setEmpNo] = useState(currentUser?.employee?.empNo || 'FG1001');
  const [empName, setEmpName] = useState(currentUser?.employee?.name || '陳冠霖');

  // Answers object: questionId -> value
  const [answers, setAnswers] = useState<Record<string, any>>({
    q1: ['可調動北區 (雙北、基隆、桃園、新竹)', '可調動中區 (苗栗、台中、彰化、南投)'],
    q2: ['可接受規模-大型 (總樓地板面積 > 10萬㎡ 或 > 30層)', '可接受規模-中型 (總樓地板面積 3萬~10萬㎡)'],
    q3: {
      '深開挖 (B4以上基坑工法)': '具備豐富經驗且有意願',
      '逆打工法 (Top-Down施工)': '具備基礎經驗',
      '超高層特殊帷幕牆工法': '具備豐富經驗且有意願',
      '危評/防綜/都更審查配合': '具備基礎經驗',
    },
    q4: ['獨立統籌大型代表作案場', '深化特殊複雜工法專業', '培養跨部室管理領導才能', '追求案場如期如質高額完工績效獎金'],
    q5: 5,
    q6: '期望能參與新竹及桃苗地區超高層都更案或大型廠辦之統籌規劃。',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleMultipleChoiceToggle = (qId: string, option: string) => {
    const currentList: string[] = answers[qId] || [];
    if (currentList.includes(option)) {
      setAnswers({ ...answers, [qId]: currentList.filter((o) => o !== option) });
    } else {
      setAnswers({ ...answers, [qId]: [...currentList, option] });
    }
  };

  const handleMatrixChange = (qId: string, row: string, col: string) => {
    const curMatrix = answers[qId] || {};
    setAnswers({
      ...answers,
      [qId]: {
        ...curMatrix,
        [row]: col,
      },
    });
  };

  const handleRankMove = (qId: string, index: number, direction: 'up' | 'down') => {
    const list: string[] = [...(answers[qId] || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setAnswers({ ...answers, [qId]: list });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedEmp = employees.find((emp) => emp.empNo === empNo.trim().toUpperCase());

    // Extract available regions from answers
    const regions: string[] = [];
    const q1Ans = answers.q1;
    if (Array.isArray(q1Ans)) {
      if (q1Ans.some((s) => s.includes('北區'))) regions.push('北區');
      if (q1Ans.some((s) => s.includes('中區'))) regions.push('中區');
      if (q1Ans.some((s) => s.includes('南區'))) regions.push('南區');
    }

    // Extract accepted scales from answers
    const scales: string[] = [];
    const q2Ans = answers.q2;
    if (Array.isArray(q2Ans)) {
      if (q2Ans.some((s) => s.includes('大型'))) scales.push('大型');
      if (q2Ans.some((s) => s.includes('中型'))) scales.push('中型');
      if (q2Ans.some((s) => s.includes('小型'))) scales.push('小型');
    }

    submitSurveyResponse({
      surveyId: surveyForm.id,
      surveyTitle: surveyForm.title,
      empNo: empNo.trim().toUpperCase(),
      empName: empName.trim(),
      department: matchedEmp?.department || currentUser?.employee?.department || '工務所',
      title: matchedEmp?.title || currentUser?.employee?.title || '案主管',
      availableRegions: regions.length > 0 ? regions : undefined,
      acceptedScales: scales.length > 0 ? scales : undefined,
      answers,
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">問卷回覆已成功送出</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              感謝 <strong className="text-slate-800">{empName}</strong> 同仁填報，您的可調動區域與工程規模意願已即時同步更新至「案主管人才庫儀表板」中。
            </p>
          </div>
          <div className="pt-3">
            <button
              onClick={() => setIsSubmitted(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新填寫或修改答案
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 text-slate-800">
      {/* Brand Header Card */}
      <div className="bg-white rounded-xl border-t-4 border-t-blue-600 border-x border-b border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <ClipboardList className="w-3 h-3" />
              線上意願調查問卷
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              發布日期：{surveyForm.createdAt}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {surveyForm.title}
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed">
            {surveyForm.description}
          </p>

          {/* Respondent identity check banner */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 flex-wrap">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium text-slate-600">填答同仁：</span>
              <input
                type="text"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="姓名"
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-slate-400 font-mono">工號：</span>
              <input
                type="text"
                value={empNo}
                onChange={(e) => setEmpNo(e.target.value)}
                placeholder="FG1001"
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-semibold text-slate-800 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-[11px] text-blue-700 bg-blue-50/80 border border-blue-200 px-2 py-0.5 rounded font-medium shrink-0">
              系統將依工號自動關聯人才庫檔案
            </span>
          </div>
        </div>
      </div>

      {/* Questionnaire Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {surveyForm.questions.map((q, idx) => {
          return (
            <div
              key={q.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-blue-600 font-mono">Q{idx + 1}.</span>
                  <h3 className="text-xs font-bold text-slate-800">{q.title}</h3>
                  {q.required && <span className="text-rose-500 font-bold text-xs">*</span>}
                </div>
                {q.description && (
                  <p className="text-[11px] text-slate-500 mt-1 pl-5">{q.description}</p>
                )}
              </div>

              {/* Multi Choice (q1, q2) */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="space-y-1.5 pt-0.5">
                  {q.options.map((opt) => {
                    const isSelected = (answers[q.id] || []).includes(opt);
                    return (
                      <label
                        key={opt}
                        onClick={() => handleMultipleChoiceToggle(q.id, opt)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-medium'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Single Matrix (q3) */}
              {q.type === 'single_matrix' && q.matrixRows && q.matrixCols && (
                <div className="overflow-x-auto pt-0.5 border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="py-2 px-3 text-left font-semibold text-slate-700">評估項目</th>
                        {q.matrixCols.map((col) => (
                          <th key={col} className="py-2 px-2 font-medium text-slate-600">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {q.matrixRows.map((row) => {
                        const curVal = answers[q.id]?.[row];
                        return (
                          <tr key={row} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-left font-medium text-slate-800">
                              {row}
                            </td>
                            {q.matrixCols!.map((col) => {
                              const isChecked = curVal === col;
                              return (
                                <td
                                  key={col}
                                  onClick={() => handleMatrixChange(q.id, row, col)}
                                  className="py-2.5 px-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`${q.id}-${row}`}
                                    checked={isChecked}
                                    onChange={() => handleMatrixChange(q.id, row, col)}
                                    className="text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Ranking (q4) */}
              {q.type === 'ranking' && (
                <div className="space-y-1.5 pt-0.5">
                  <p className="text-[11px] text-slate-400">點擊上下按鈕調整優先順序：</p>
                  {(answers[q.id] || q.options || []).map((opt: string, i: number) => (
                    <div
                      key={opt}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800">{opt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRankMove(q.id, i, 'up')}
                          disabled={i === 0}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          ▲ 上移
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRankMove(q.id, i, 'down')}
                          disabled={i === (answers[q.id]?.length || 0) - 1}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          ▼ 下移
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Star Rating (q5) */}
              {q.type === 'rating_star' && (
                <div className="pt-1 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (answers[q.id] || 0) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setAnswers({ ...answers, [q.id]: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            active ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-slate-600 ml-2 font-mono">
                    {answers[q.id] || 0} / 5 星
                  </span>
                </div>
              )}

              {/* Open text (q6) */}
              {q.type === 'open_text' && (
                <div className="pt-0.5">
                  <textarea
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="請輸入您的寶貴意見..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  ></textarea>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2 pb-6">
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-xs transition-all text-xs flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            送出意願調查問卷並同步人才庫
          </button>
        </div>
      </form>
    </div>
  );
};

