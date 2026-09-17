import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle2,
  Award,
  Calendar,
  Sparkles,
  UserCheck,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Send,
  Edit3,
  Lightbulb,
} from 'lucide-react';
import { SmartActionPlan, CourseEnrollment, InternalCourse } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface SmartActionPlanModalProps {
  enrollment: CourseEnrollment;
  course?: InternalCourse;
  plan?: SmartActionPlan;
  initialMode?: 'setup' | 'self_eval' | 'view' | 'manager';
  onClose: () => void;
}

export const SmartActionPlanModal: React.FC<SmartActionPlanModalProps> = ({
  enrollment,
  course,
  plan,
  initialMode = 'setup',
  onClose,
}) => {
  const {
    createSmartActionPlan,
    updateSmartActionPlan,
    selfEvaluateSmartActionPlan,
    evaluateSmartActionPlan,
    currentUser,
  } = useApp();

  // Determine current active mode
  const [activeMode, setActiveMode] = useState<'setup' | 'self_eval' | 'view' | 'manager'>(() => {
    if (initialMode) return initialMode;
    if (plan?.status === 'manager_evaluated' || plan?.status === 'completed') return 'view';
    if (plan?.status === 'self_evaluated') return 'view';
    if (plan) return 'self_eval';
    return 'setup';
  });

  // SMART Goal Form States
  const [specificGoal, setSpecificGoal] = useState(
    plan?.specificGoal || '於負責之工地導入關鍵要徑進度網圖滾動控制，降低工程界面衝突與要徑延誤風險。'
  );
  const [measurableMetric, setMeasurableMetric] = useState(
    plan?.measurableMetric || '每月要徑工期偏差率小於 2%，且每週工務進度會準點率達 95% 以上。'
  );
  const [achievableAction, setAchievableAction] = useState(
    plan?.achievableAction || '每週五前與三大主力分包商比對進度節點，運用 BIM 4D 模擬提前識別結構與機電碰撞。'
  );
  const [relevantImpact, setRelevantImpact] = useState(
    plan?.relevantImpact || '提升案主管全面掌控工期能力，如期如質完成建築執照申請與業主交屋節點。'
  );
  const [timeBoundDate, setTimeBoundDate] = useState(
    plan?.timeBoundDate || new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10)
  );
  const [evaluationPeriodDays, setEvaluationPeriodDays] = useState<number>(
    plan?.evaluationPeriodDays || course?.actionPlanDaysToReview || 60
  );
  const [evaluationScheduledDate, setEvaluationScheduledDate] = useState<string>(() => {
    if (plan?.evaluationScheduledDate) return plan.evaluationScheduledDate;
    const d = new Date();
    d.setDate(d.getDate() + (course?.actionPlanDaysToReview || 60));
    return d.toISOString().slice(0, 10);
  });

  // Self Evaluation Form States
  const [selfScore, setSelfScore] = useState<number>(plan?.selfScore || 92);
  const [selfAchievementSummary, setSelfAchievementSummary] = useState<string>(
    plan?.selfAchievementSummary ||
      '已於案場全區建立要徑控制網圖，並於每週五工務協調會落實追蹤，成功將要徑偏差率控制在 1.2%，未發生重大界面停工。'
  );
  const [selfMetricResult, setSelfMetricResult] = useState<string>(
    plan?.selfMetricResult || '進度準點率達 98.4%，提前 3 天完成地下室外牆防水分段抽驗驗收。'
  );
  const [selfChallengesFaced, setSelfChallengesFaced] = useState<string>(
    plan?.selfChallengesFaced || '初期水電與鋼結構分包商對 BIM 碰撞回報配合度不一，透過建立線上即時回報獎懲機制順利化解。'
  );
  const [selfNotes, setSelfNotes] = useState<string>(
    plan?.selfNotes || '透過本次研習與落地實踐，深刻體會案主管預先洞察要徑並與分包商對齊節奏的重要性。'
  );
  const [evidenceAttachmentName, setEvidenceAttachmentName] = useState<string>(
    plan?.evidenceAttachmentName || 'HM2案_要徑網圖滾動管制表_202608.pdf'
  );

  // Manager Evaluation Form States
  const [managerScore, setManagerScore] = useState<number>(plan?.managerScore || 95);
  const [managerFeedback, setManagerFeedback] = useState<string>(
    plan?.managerFeedback || '目標具體清晰，切中工地要徑工期痛點，實踐落地成效斐然，值得各案場複製推廣！'
  );

  // Quick Templates
  const applyTemplate = (type: 'cpm' | 'bim' | 'qc' | 'safety') => {
    if (type === 'cpm') {
      setSpecificGoal('於案場全面導入關鍵要徑進度網圖（CPM）滾動控制，降低工程界面衝突與工期延宕。');
      setMeasurableMetric('每月要徑工期偏差率小於 2%，且每週工務進度協調會準點率達 95% 以上。');
      setAchievableAction('每週五前與三大主力分包商比對進度節點，運用 4D 施工模擬提前預警。');
      setRelevantImpact('提升案主管掌控工期能力，確保如期取得使用執照與交屋節點。');
    } else if (type === 'bim') {
      setSpecificGoal('於地下室與標準層機電管線施作前，全面落實 BIM 3D 碰撞檢討與套圖自主審查。');
      setMeasurableMetric('結構穿梁套管預留孔零返工洗孔，機電與土建衝突修正率 100%。');
      setAchievableAction('召集機電、消防、空調三方分包每週進行 3D 模型套疊比對會議。');
      setRelevantImpact('減少管線打鑿重做費用，提升結構整體品質與美觀度。');
    } else if (type === 'qc') {
      setSpecificGoal('建立關鍵工項「自主檢查與隱蔽工程影像履歷化」，全面落實首件檢驗制度。');
      setMeasurableMetric('自主檢查表填報完整率 100%，外部品管抽驗合格率達 98% 以上。');
      setAchievableAction('指派責任工程師於鋼筋綁紮、灌漿前以平板拍照上傳品管雲端。');
      setRelevantImpact('強化遠雄營造建築品質品牌信任度，達成零漏水與零重大客訴。');
    } else if (type === 'safety') {
      setSpecificGoal('實施高處作業與深開挖「智慧電子危害告知與科技安衛巡檢」。');
      setMeasurableMetric('全案場零重大職安事故、開口防護與安全母索穿戴稽核合規率 100%。');
      setAchievableAction('每日出工前進行 TBM 工具箱會議，並以手機 App 即時通報不安全行為改善。');
      setRelevantImpact('落實安全第一之工安文化，守護同仁與勞工生命安全。');
    }
  };

  // Handle SMART Goal Submission
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan) {
      updateSmartActionPlan(plan.id, {
        specificGoal,
        measurableMetric,
        achievableAction,
        relevantImpact,
        timeBoundDate,
        evaluationPeriodDays,
        evaluationScheduledDate,
        status: plan.status === 'draft' ? 'in_progress' : plan.status,
      });
    } else {
      createSmartActionPlan({
        enrollmentId: enrollment.id,
        empNo: enrollment.empNo,
        empName: enrollment.empName,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        batchId: enrollment.batchId,
        department: enrollment.department,
        title: enrollment.title,
        specificGoal,
        measurableMetric,
        achievableAction,
        relevantImpact,
        timeBoundDate,
        evaluationPeriodDays,
        evaluationScheduledDate,
        status: 'in_progress',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
    alert('✅ SMART 實踐目標與行動計畫已成功送出！\n\n系統已為您登記，並將於指定時間開放「落地成效自評表單」。');
    onClose();
  };

  // Handle Self Evaluation Submission
  const handleSaveSelfEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const planId = plan?.id;
    if (!planId) {
      // If plan doesn't exist, create it first
      const newP = createSmartActionPlan({
        enrollmentId: enrollment.id,
        empNo: enrollment.empNo,
        empName: enrollment.empName,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        batchId: enrollment.batchId,
        department: enrollment.department,
        title: enrollment.title,
        specificGoal,
        measurableMetric,
        achievableAction,
        relevantImpact,
        timeBoundDate,
        evaluationScheduledDate,
        status: 'self_evaluated',
      });
      selfEvaluateSmartActionPlan(newP.id, {
        selfScore: Number(selfScore),
        selfAchievementSummary,
        selfMetricResult,
        selfChallengesFaced,
        selfNotes,
        evidenceAttachmentName,
      });
    } else {
      selfEvaluateSmartActionPlan(planId, {
        selfScore: Number(selfScore),
        selfAchievementSummary,
        selfMetricResult,
        selfChallengesFaced,
        selfNotes,
        evidenceAttachmentName,
      });
    }
    alert('🎉 實踐成效自評表單已成功送出！\n\n已同步發送通知至直屬主管「主管培育專區」進行成果考評。');
    onClose();
  };

  // Handle Manager Evaluation Submission
  const handleSaveManagerEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    evaluateSmartActionPlan(plan.id, {
      managerScore: Number(managerScore),
      managerFeedback,
      evaluatorEmpNo: currentUser?.employee?.empNo || currentUser?.empNo || 'MGR-001',
      evaluatorName: currentUser?.employee?.name || currentUser?.name || '專案主管',
      evaluatedAt: new Date().toISOString().slice(0, 10),
    });
    alert('✅ 主管評核已完成！已登載於同仁能力履歷與完訓考核庫。');
    onClose();
  };

  // Check if scheduled date is reached or passed
  const isScheduledReached = plan?.evaluationScheduledDate
    ? new Date(plan.evaluationScheduledDate).getTime() <= new Date().getTime()
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 my-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center font-black">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">SMART 落地實踐評鑑管理</h3>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md text-[10px] font-bold">
                  育碁 aEnrich 職能標準
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {enrollment.courseTitle} · 學員：<strong>{enrollment.empName}</strong> ({enrollment.empNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Workflow Navigation Sub-tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('setup')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'setup'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              1. 擬定 SMART 目標
              {plan && <CheckCircle2 className="w-3 h-3 text-emerald-300 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('self_eval')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'self_eval'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              2. 實踐成效自評表單
              {plan?.isSelfEvaluated && <CheckCircle2 className="w-3 h-3 text-emerald-300 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('view')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'view'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              3. 完整評鑑與主管覆核
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('manager')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'manager'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              主管審查模式
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* ================= MODE 1: SMART SETUP ================= */}
          {activeMode === 'setup' && (
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-start gap-3 text-blue-950">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">課後落地實踐 SMART 目標設定</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    請依據本門課程研習之核心工法與職能知識，擬定具體、可衡量、可行的實踐方案。送出後系統將排程於指定時間開放自評表單。
                  </p>
                </div>
              </div>

              {/* Template quick picks */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  快速套用工務精選實踐模板：
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('cpm')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    📅 要徑網圖(CPM)控制模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('bim')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    🏢 BIM 3D 碰撞檢討模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('qc')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    🔍 隱蔽工程影像履歷品管模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('safety')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    🦺 智慧科技安衛巡檢模板
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 pt-2">
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    S - Specific (具體明確目標) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={specificGoal}
                    onChange={(e) => setSpecificGoal(e.target.value)}
                    placeholder="具體說明打算在何專案或工務環節落實何種具體作法..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    M - Measurable (可量化衡量指標) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={measurableMetric}
                    onChange={(e) => setMeasurableMetric(e.target.value)}
                    placeholder="如何證明目標已達成？（例如：偏差率控制在X%、合格率達Y%）..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    A - Achievable (可行行動方案與關鍵步驟) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={achievableAction}
                    onChange={(e) => setAchievableAction(e.target.value)}
                    placeholder="預計採取的關鍵落實行動與分包介面協調作法..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    R - Relevant (業務與案場核心價值) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={relevantImpact}
                    onChange={(e) => setRelevantImpact(e.target.value)}
                    placeholder="對所屬工程處、工務所工進、品質或個人案主管職能之實質價值..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                    <label className="block font-black text-slate-900">
                      T - Time-bound (預計達成期限) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={timeBoundDate}
                      onChange={(e) => setTimeBoundDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-1">
                    <label className="block font-black text-indigo-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      指定自評表單開放時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={evaluationScheduledDate}
                      onChange={(e) => setEvaluationScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-bold text-indigo-900"
                    />
                    <span className="text-[10px] text-indigo-600 block">
                      系統將於此日期開放同仁填報落地自評表單。
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  設定完成並送出 SMART 實踐計畫
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE 2: SELF EVALUATION FORM ================= */}
          {activeMode === 'self_eval' && (
            <form onSubmit={handleSaveSelfEvaluation} className="space-y-4">
              {/* Top Banner Alert */}
              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-300 text-amber-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <Award className="w-4 h-4 text-amber-600" />
                  指定時間落地實踐成果自評表單
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  指定考核時間已到達！請回顧當初設定之目標，如實填報在案場的實踐成效、量化數據指標與個人自評成績。
                </p>
              </div>

              {/* Reference Original SMART Goal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-bold text-slate-700">原設定之 SMART 目標與衡量基準：</span>
                  <span className="text-[11px]">達成期限: {timeBoundDate}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-800 text-[11px]">
                  <div className="p-2 bg-white rounded-xl border border-slate-100">
                    <strong className="text-blue-700">S 具體目標：</strong> {specificGoal}
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100">
                    <strong className="text-emerald-700">M 衡量指標：</strong> {measurableMetric}
                  </div>
                </div>
              </div>

              {/* Self Evaluation Form Fields */}
              <div className="space-y-3.5 pt-1">
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    1. 落地實踐成果總結與具體事蹟 (Specific Outcome) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={selfAchievementSummary}
                    onChange={(e) => setSelfAchievementSummary(e.target.value)}
                    placeholder="請詳細說明課堂所學如何具體運用於案場現場，並達成了哪些成果..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    2. 量化指標實際達成數據 (Measurable Results) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={selfMetricResult}
                    onChange={(e) => setSelfMetricResult(e.target.value)}
                    placeholder="請列舉實質數據（如：要徑工期偏差控制率、抽檢合格率、成本節約等）..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    3. 實踐過程遭遇之瓶頸與因應對策 (Challenges & Solutions) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={selfChallengesFaced}
                    onChange={(e) => setSelfChallengesFaced(e.target.value)}
                    placeholder="遇到哪些分包界面或技術困難？如何透過跨組協調或創新方式化解？"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1">
                  <label className="block font-black text-slate-900">
                    4. 綜合心得與職能成長反思 (Reflection & Impact)
                  </label>
                  <textarea
                    rows={2}
                    value={selfNotes}
                    onChange={(e) => setSelfNotes(e.target.value)}
                    placeholder="本次實踐對您個人案主管職能培育與未來管理視野的啟發..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Score & Evidence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-amber-950">
                        同仁個人實踐自評成績 (Self Score) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-lg font-black text-amber-700">{selfScore} 分</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={selfScore}
                      onChange={(e) => setSelfScore(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                    <div className="flex justify-between text-[10px] text-amber-700 font-semibold">
                      <span>60分 (基本落實)</span>
                      <span>85分 (良好達標)</span>
                      <span>100分 (卓越創新)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <label className="block font-black text-slate-900">
                      佐證資料 / 工務成果紀錄
                    </label>
                    <input
                      type="text"
                      value={evidenceAttachmentName}
                      onChange={(e) => setEvidenceAttachmentName(e.target.value)}
                      placeholder="輸入佐證檔案名稱或工務日誌號碼..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      例如：HM2案_要徑網圖滾動管制表_202608.pdf
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  確認並送出自評評核表單
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE 3: VIEW SUMMARY & EVALUATION REPORT ================= */}
          {activeMode === 'view' && (
            <div className="space-y-4">
              {/* Header Status Seal */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 z-10">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                    {plan?.status === 'manager_evaluated' ? '主管考核完成 · 已歸檔' : '已完成自評 · 待主管考評'}
                  </span>
                  <h3 className="text-base font-black text-white">{enrollment.courseTitle}</h3>
                  <p className="text-xs text-slate-300">
                    填報同仁：{enrollment.empName} ({enrollment.empNo}) · {enrollment.department}
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-slate-300 block">同仁自評分數</span>
                    <span className="text-base font-black text-amber-300">
                      {plan?.selfScore || selfScore} 分
                    </span>
                  </div>
                  {plan?.managerScore && (
                    <div className="px-4 py-2 bg-indigo-500/30 backdrop-blur-md rounded-2xl border border-indigo-400/30 text-center">
                      <span className="text-[10px] text-indigo-200 block">主管核定分數</span>
                      <span className="text-base font-black text-emerald-300">
                        {plan.managerScore} 分
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Goal vs Self Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: SMART Goal */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    原始 SMART 實踐目標
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <strong className="text-slate-700">S 具體目標：</strong>
                      <p className="text-slate-600 mt-0.5">{plan?.specificGoal || specificGoal}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">M 衡量指標：</strong>
                      <p className="text-slate-600 mt-0.5">{plan?.measurableMetric || measurableMetric}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">A 行動步驟：</strong>
                      <p className="text-slate-600 mt-0.5">{plan?.achievableAction || achievableAction}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">R 預期效益：</strong>
                      <p className="text-slate-600 mt-0.5">{plan?.relevantImpact || relevantImpact}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Self Evaluation Results */}
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    落地實踐自評成效
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <strong className="text-amber-900">實踐成果事蹟：</strong>
                      <p className="text-slate-700 mt-0.5">{plan?.selfAchievementSummary || selfAchievementSummary}</p>
                    </div>
                    <div>
                      <strong className="text-amber-900">量化數據達成率：</strong>
                      <p className="text-slate-700 mt-0.5">{plan?.selfMetricResult || selfMetricResult}</p>
                    </div>
                    <div>
                      <strong className="text-amber-900">克服之瓶頸：</strong>
                      <p className="text-slate-700 mt-0.5">{plan?.selfChallengesFaced || selfChallengesFaced}</p>
                    </div>
                    <div>
                      <strong className="text-amber-900">自評送出時間：</strong>
                      <span className="text-slate-600 ml-1">{plan?.selfEvaluatedAt || '2026-08-30'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Feedback Box (If evaluated) */}
              {plan?.managerFeedback && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-emerald-950">
                    <span className="font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      直屬主管評核與回饋意見
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      考評主管：{plan.evaluatorName || '陳冠霖 經理'} · {plan.evaluatedAt}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 bg-white p-3 rounded-xl border border-emerald-100 leading-relaxed font-medium">
                    "{plan.managerFeedback}"
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  關閉明細
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE 4: MANAGER REVIEW ================= */}
          {activeMode === 'manager' && (
            <form onSubmit={handleSaveManagerEvaluation} className="space-y-4">
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-1 text-indigo-950">
                <div className="font-black text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  主管 60 天實踐落地考核打分
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  請審閱部屬同仁申報之 SMART 實踐目標與自評成果，依據現場落實度與職能展現給予考評與指導。
                </p>
              </div>

              {/* Reference of employee self evaluation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-bold">
                  <span>同仁申報與自評紀錄：</span>
                  <span className="text-amber-700">同仁自評：{selfScore} 分</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-700">
                  <p><strong>具體目標：</strong> {specificGoal}</p>
                  <p><strong>成果事蹟：</strong> {selfAchievementSummary}</p>
                  <p><strong>量化數據：</strong> {selfMetricResult}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-black text-slate-900">
                  主管核定評核成績 (1 ~ 100 分) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={managerScore}
                  onChange={(e) => setManagerScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl font-black text-xl text-indigo-700"
                />
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-black text-slate-900">
                  主管培育指導與評核評語 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={managerFeedback}
                  onChange={(e) => setManagerFeedback(e.target.value)}
                  placeholder="給予同仁具體肯定與後續職能成長指引..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確認核定評核成績並歸檔
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
