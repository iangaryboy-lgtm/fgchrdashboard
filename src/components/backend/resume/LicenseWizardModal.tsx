import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Building,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SiteLicenseRequirement, LicenseCategory, EmployeeLicense } from '../../../types';

interface LicenseWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRequirement?: SiteLicenseRequirement | null;
  onDispatchSuccess?: () => void;
}

export const LicenseWizardModal: React.FC<LicenseWizardModalProps> = ({
  isOpen,
  onClose,
  targetRequirement,
  onDispatchSuccess,
}) => {
  const {
    employees,
    employeeLicenses,
    resumeDetails,
    addDispatchTraining,
  } = useApp();

  const [selectedInstitute, setSelectedInstitute] = useState('財團法人台灣營建研究院');
  const [trainingStartDate, setTrainingStartDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [estimatedCost, setEstimatedCost] = useState(8500);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !targetRequirement) return null;

  // 1. Find employees who ALREADY hold the required license (Qualified / Expiring)
  const existingHolders = employeeLicenses.filter((lic) => {
    const isCategoryMatch = lic.licenseCategory === targetRequirement.licenseCategory;
    const isNameMatch =
      lic.licenseName.toLowerCase().includes(targetRequirement.licenseName.toLowerCase()) ||
      targetRequirement.licenseName.toLowerCase().includes(lic.licenseName.toLowerCase());
    return isCategoryMatch || isNameMatch;
  });

  const qualifiedHolders = existingHolders.filter((l) => l.status === 'valid');
  const expiringHolders = existingHolders.filter((l) => l.status === 'expiring_soon');

  // 2. Smart Recommendation Algorithm for Dispatch
  // Find employees who do NOT have this license yet, but have high match score based on department, seniority, and related skill tags
  const existingHolderEmpNos = new Set(existingHolders.map((h) => h.empNo));

  const recommendedCandidates = employees
    .filter((emp) => !existingHolderEmpNos.has(emp.empNo))
    .map((emp) => {
      let score = 50;
      const resume = resumeDetails[emp.empNo];

      // Department alignment
      if (emp.department.includes('工程') || emp.department.includes('工務')) score += 20;
      if (emp.department.includes('安衛') && targetRequirement.licenseCategory === '職業安全衛生') score += 25;
      if (emp.department.includes('品管') && targetRequirement.licenseCategory === '品質管理') score += 25;

      // Title seniority
      if (emp.title.includes('工程師') || emp.title.includes('副理') || emp.title.includes('經理')) score += 15;

      // Project experiences
      if (resume?.projectHistory && resume.projectHistory.length > 0) {
        score += Math.min(15, resume.projectHistory.length * 5);
      }

      return {
        employee: emp,
        score: Math.min(98, score),
        resume,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const handleQuickDispatch = (emp: typeof employees[0]) => {
    addDispatchTraining({
      empNo: emp.empNo,
      empName: emp.name,
      department: emp.department,
      title: emp.title,
      targetLicenseCategory: targetRequirement.licenseCategory,
      targetLicenseName: targetRequirement.licenseName,
      trainingInstitute: selectedInstitute,
      trainingStartDate,
      trainingEndDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      estimatedCost,
      status: 'in_training',
      dispatchedBy: 'HR_SYSTEM_WIZARD',
      dispatchedSiteName: targetRequirement.siteName,
    });

    setDispatchSuccessMsg(`已成功將【${emp.name}】指派進行【${targetRequirement.targetLicenseName || targetRequirement.licenseName}】專業培訓！`);
    setTimeout(() => {
      setDispatchSuccessMsg(null);
      if (onDispatchSuccess) onDispatchSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">證照篩選與案場派訓精靈</h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 text-[11px] font-bold rounded-md border border-amber-300/30">
                  智慧資格匹配
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                目標案場：<strong className="text-white">{targetRequirement.siteName}</strong> · 缺額目標：{targetRequirement.licenseName} (法定需求: {targetRequirement.requiredHeadcount} 人)
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {dispatchSuccessMsg && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* SECTION 1: QUALIFIED EMPLOYEES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900">
                  目前現職已持有此證照同仁 ({qualifiedHolders.length} 人)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">可直接調派或指派進駐案場</span>
            </div>

            {qualifiedHolders.length === 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>目前全體在庫人員中尚無有效持有本項證照者，建議啟動下方派訓精靈！</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qualifiedHolders.map((lic) => (
                  <div
                    key={lic.id}
                    className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{lic.empName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({lic.empNo})</span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          合格
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {lic.department} · {lic.title} · 到期：{lic.expiryDate || '永久有效'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: EXPIRING SOON HOLDERS */}
          {expiringHolders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black">
                  持有但即將到期 / 需安排回訓講習同仁 ({expiringHolders.length} 人)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expiringHolders.map((lic) => (
                  <div
                    key={lic.id}
                    className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-slate-900 text-xs">{lic.empName}</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        到期日：{lic.expiryDate} (回訓期限：{lic.renewalDeadlineDate || '儘速安排'})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const emp = employees.find((e) => e.empNo === lic.empNo);
                        if (emp) handleQuickDispatch(emp);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs"
                    >
                      安排回訓派訓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: RECOMMENDED CANDIDATES FOR TRAINING DISPATCH */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900">
                  系統智慧推薦派訓人選 (依工程經歷、部室與年資深度加權)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">點擊右側即可一鍵啟動派訓</span>
            </div>

            {/* Institute and budget settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">受訓機構</label>
                <select
                  value={selectedInstitute}
                  onChange={(e) => setSelectedInstitute(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="財團法人台灣營建研究院">財團法人台灣營建研究院</option>
                  <option value="中華民國職業安全衛生協會">中華民國職業安全衛生協會</option>
                  <option value="中國生產力中心 (CPC)">中國生產力中心 (CPC)</option>
                  <option value="內政部國土署認可機構">內政部國土署認可機構</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">預計開訓日期</label>
                <input
                  type="date"
                  value={trainingStartDate}
                  onChange={(e) => setTrainingStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                </input>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">預估公假與公費預算 (NTD)</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Candidates list */}
            <div className="space-y-3">
              {recommendedCandidates.map((cand) => (
                <div
                  key={cand.employee.empNo}
                  className="p-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                      {cand.score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{cand.employee.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({cand.employee.empNo})</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                          匹配度 {cand.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {cand.employee.department} · {cand.employee.title} · 到職：{cand.employee.hireDate}
                      </p>
                      {cand.resume?.skillTags && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cand.resume.skillTags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickDispatch(cand.employee)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    一鍵建立派訓
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            派訓建立後將自動列入「派訓中人員管理」，結訓考照合格後一鍵審核入庫。
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
