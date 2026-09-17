import React from 'react';
import {
  X,
  TrendingUp,
  Calendar,
  ShieldCheck,
  DollarSign,
  HardHat,
  FileText,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { CandidateProfile, ProjectExpDetail } from '../../../types';
import { formatExperienceRole, getDeidentifiedProjectCode } from '../../../utils/candidatePkHelper';
import { A3PrintPdfController } from '../../common/A3PrintPdfController';

interface CandidateProjectScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  experience: {
    projectName: string;
    scaleType?: string;
    role?: string;
    periodYears?: number;
  };
  projectDetail: ProjectExpDetail;
}

export const CandidateProjectScoreModal: React.FC<CandidateProjectScoreModalProps> = ({
  isOpen,
  onClose,
  candidate,
  experience,
  projectDetail,
}) => {
  if (!isOpen) return null;

  const roleName = formatExperienceRole(experience.role || projectDetail.role);
  const profitRate = projectDetail.profitRate ?? 6.5;
  const isHighProfit = profitRate >= 5.0;
  const isNegativeProfit = profitRate < 0;

  return (
    <div
      id="candidate-project-score-modal"
      className="fixed inset-0 z-75 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="candidate-project-score-export-container"
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂端標題列：清楚顯示人員名稱、案場名稱和職稱 */}
        <div
          data-pdf-block="true"
          className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/25 text-blue-200 border border-blue-400/40">
                  <FileText className="w-3.5 h-3.5 text-blue-300" />
                  專案實績綜合評比成績單
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                  擔任職稱：{roleName}
                </span>
                {projectDetail.orderLabel && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/20">
                    {projectDetail.orderLabel}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  同主管遴選 PK 總表標準
                </span>
              </div>

              {/* 核心主標題：人員、案場名稱、職稱 */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center flex-wrap gap-2.5">
                <span className="text-white drop-shadow-xs">{candidate.name}</span>
                <span className="text-blue-300 text-sm sm:text-base font-medium">
                  ({candidate.title || '案主管'} · 職等 {candidate.rank || '07'})
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-300 font-extrabold flex items-center gap-1.5 font-mono">
                  <Building2 className="w-5 h-5 text-amber-300 inline-block" />
                  {getDeidentifiedProjectCode(experience.projectName)}
                </span>
                <span className="text-xs sm:text-sm font-extrabold px-2.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                  {roleName}
                </span>
              </h2>

              {/* 次要規格與歷練資訊 */}
              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span>
                  案場規模：
                  <strong className="text-white font-semibold">
                    {experience.scaleType || projectDetail.scaleType || '大型案'}
                  </strong>
                </span>
                {experience.periodYears !== undefined && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span>
                      歷練年資：
                      <strong className="text-white font-semibold">{experience.periodYears} 年</strong>
                    </span>
                  </>
                )}
                <span className="text-slate-500">•</span>
                <span>
                  所屬單位：
                  <span className="text-slate-200 font-medium">
                    {candidate.department} {candidate.section ? `/ ${candidate.section}` : ''}
                  </span>
                </span>
              </div>
            </div>

            {/* 控制器與關閉按鈕 */}
            <div className="flex items-center gap-2 shrink-0">
              <A3PrintPdfController
                targetElementId="candidate-project-score-export-container"
                documentTitle={`遠雄營造_專案實績成績單_${candidate.name}_${getDeidentifiedProjectCode(experience.projectName)}`}
                subtitle={`受評主管：${candidate.name} (${candidate.empNo}) · 職稱：${roleName} · 案名：${getDeidentifiedProjectCode(experience.projectName)} · 4大專案指標綜合評比`}
                baseDate={candidate.releaseQuarter || '2026Q2'}
                buttonLabel="匯出PDF"
                variant="amber"
              />
              <button
                id="close-project-score-modal"
                data-html2canvas-ignore="true"
                onClick={onClose}
                className="no-print p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden cursor-pointer"
                aria-label="關閉彈跳視窗"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 彈跳視窗主體內容 */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto bg-slate-50/50">
          {/* ① 財務營運指標：自負盈虧淨利率 (同 PK 表新增項目) */}
          <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">自負盈虧淨利率（前三案歷練完工淨利率）</h3>
              </div>
              <span className="text-xs text-slate-500">財務考核指標 · 門檻標準 5.0%</span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${
                    isNegativeProfit
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : isHighProfit
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight">
                    {profitRate > 0 ? `+${profitRate.toFixed(1)}%` : `${profitRate.toFixed(1)}%`}
                  </span>
                  {isHighProfit && (
                    <span className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-black shadow-xs">
                      5%↑ 達標優良
                    </span>
                  )}
                  {!isHighProfit && !isNegativeProfit && (
                    <span className="px-2 py-1 rounded bg-amber-600 text-white text-xs font-black shadow-xs">
                      ＜5% 基準
                    </span>
                  )}
                  {isNegativeProfit && (
                    <span className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-black shadow-xs">
                      負值 需改善
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-800">
                    {candidate.name} 於【{getDeidentifiedProjectCode(experience.projectName)}】任職【{roleName}】之完工結案自負盈虧核定值。
                  </p>
                  <p className="text-slate-500">
                    考核評語：
                    {isHighProfit
                      ? '成本控管得宜，獲利達成率優異，為團隊創造超額收益。'
                      : isNegativeProfit
                      ? '受工期追加或外部環境影響導致毛利負向，需加強風險控管。'
                      : '符合營造專案正常自負盈虧區間，執行穩定。'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ② 綜合評比 (4大專案指標) 總體橫幅 */}
          <div data-pdf-block="true" className="bg-[#102a54] text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600/40 text-blue-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg tracking-wide">綜合評比 (4大專案指標成績)</h3>
                <p className="text-xs text-blue-200/80">
                  依據工程進度、品質監理、成本管理、職安監理與法律事件核定
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-white/10 text-xs font-mono font-bold text-white border border-white/20">
                {projectDetail.projectCode} · {projectDetail.orderLabel || '歷練案場'}
              </span>
            </div>
          </div>

          {/* 4大專案指標詳細內容 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 指標 1: 工程進度 */}
            <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">一、工程進度</h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">使照與交屋</span>
              </div>

              {/* 使照進度 (F) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>使照進度 (F)</span>
                  <span className="text-slate-500 font-normal">總工期: {projectDetail.licenseProgress.totalDays} 天</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">超前 / 落後</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        projectDetail.licenseProgress.diffDays >= 0 ? 'text-blue-700' : 'text-rose-700'
                      }`}
                    >
                      {projectDetail.licenseProgress.diffDays >= 0
                        ? `+${projectDetail.licenseProgress.diffDays} 天`
                        : `${projectDetail.licenseProgress.diffDays} 天`}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">達成率</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {projectDetail.licenseProgress.achievementRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 交屋達 90% 進度 (F+165天) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>交屋達 90% 進度 (F+165天)</span>
                  <span className="text-slate-500 font-normal">
                    戶數: {projectDetail.handoverProgress.handoverUnits} 戶
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">完成進度天數</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        projectDetail.handoverProgress.diffDays >= 0 ? 'text-blue-700' : 'text-rose-700'
                      }`}
                    >
                      {projectDetail.handoverProgress.diffDays >= 0
                        ? `+${projectDetail.handoverProgress.diffDays} 天 (超前)`
                        : `${projectDetail.handoverProgress.diffDays} 天 (落後)`}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">實際 / 目標日</span>
                    <span className="font-mono font-medium text-slate-700 truncate block">
                      {projectDetail.handoverProgress.actualDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 指標 2: 品質監理 */}
            <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">二、品質監理</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">全案平均：</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {projectDetail.qualitySupervisionScore} 分
                  </span>
                </div>
              </div>

              {/* 近三年客訴率 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">近三年客訴率 (%)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-1 px-2">年度</th>
                        <th className="py-1 px-2 text-right">目標率</th>
                        <th className="py-1 px-2 text-right">實際率</th>
                        <th className="py-1 px-2 text-right">客訴件數/總戶數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectDetail.complaintRates.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-1 px-2 font-medium text-slate-700">{c.year}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-500">{c.target}%</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-800">
                            {c.actual !== undefined && (c.actual as any) !== '-' ? `${c.actual}%` : '-'}
                          </td>
                          <td className="py-1 px-2 text-right font-mono text-slate-600">{c.detailCount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 指標 3: 成本管理 */}
            <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">三、成本管理</h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">追加率控管</span>
              </div>

              {/* 追加率與金額 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/60">
                  <span className="text-slate-500 block text-[11px]">全案累計追加金額</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    NT$ {projectDetail.totalAdditionAmount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/60">
                  <span className="text-slate-500 block text-[11px]">全案累計追加率</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {(projectDetail.totalAdditionRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 近三年營造追加率 */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-slate-700">近三年營造追加率 (%)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-1 px-2">年度</th>
                        <th className="py-1 px-2 text-right">目標率</th>
                        <th className="py-1 px-2 text-right">實際率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectDetail.costAdditionRates.map((ca, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-1 px-2 font-medium text-slate-700">{ca.year}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-500">{ca.target}%</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-800">
                            {ca.actual !== undefined && (ca.actual as any) !== '-' ? `${ca.actual}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 指標 4: 職安監理與法律事件 */}
            <div data-pdf-block="true" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-orange-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">四、職安監理 & 法律事件</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">職安平均：</span>
                  <span className="font-mono font-black text-slate-800 text-sm">
                    {projectDetail.safetySupervisionScore} 分
                  </span>
                </div>
              </div>

              {/* 違規處罰 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/60">
                  <span className="text-slate-500 block text-[11px]">職安中心停工次數</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {projectDetail.safetySuspensionsCount === '-' ? '0 次 (無停工)' : `${projectDetail.safetySuspensionsCount} 次`}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/60">
                  <span className="text-slate-500 block text-[11px]">裁罰金額</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {projectDetail.safetyFinesAmount > 0
                      ? `NT$ ${projectDetail.safetyFinesAmount.toLocaleString()}`
                      : 'NT$ 0 (無罰款)'}
                  </span>
                </div>
              </div>

              {/* 法律事件 */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>專案法律裁罰與訴訟事件</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  {projectDetail.legalEvents && projectDetail.legalEvents !== '-' ? (
                    <span className="text-amber-800 font-medium">{projectDetail.legalEvents}</span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      本專案履歷無相關工程訴訟或重大裁罰記錄。
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕區 */}
        <div data-pdf-block="true" className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>遠雄營造工程履歷暨主管遴選評估資料庫 · 即時數據連線驗證</span>
          </div>
          <div className="flex items-center gap-2">
            <A3PrintPdfController
              targetElementId="candidate-project-score-export-container"
              documentTitle={`遠雄營造_專案實績成績單_${candidate.name}_${getDeidentifiedProjectCode(experience.projectName)}`}
              subtitle={`受評主管：${candidate.name} (${candidate.empNo}) · 職稱：${roleName} · 案名：${getDeidentifiedProjectCode(experience.projectName)} · 4大專案指標綜合評比`}
              baseDate={candidate.releaseQuarter || '2026Q2'}
              buttonLabel="匯出成績單PDF"
              variant="amber"
            />
            <button
              data-html2canvas-ignore="true"
              onClick={onClose}
              className="no-print px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              關閉成績單
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
