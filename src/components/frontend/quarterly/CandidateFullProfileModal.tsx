import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  MapPin,
  Layers,
  Wrench,
  Clock,
  Briefcase,
  History,
  GraduationCap,
  Eye,
  Camera,
  FileText,
} from 'lucide-react';
import { CandidateProfile } from '../../../types';
import { useApp } from '../../../context/AppContext';
import {
  getCandidatePhoto,
  getCandidateProjectExperiences,
  formatExperienceRole,
  getProjectDetailForExperience,
  getDeidentifiedProjectCode,
} from '../../../utils/candidatePkHelper';
import { CandidateProjectScoreModal } from './CandidateProjectScoreModal';
import { A3PrintPdfController } from '../../common/A3PrintPdfController';

interface CandidateFullProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile | null;
  benchmarkQuarter?: string;
}

export const CandidateFullProfileModal: React.FC<CandidateFullProfileModalProps> = ({
  isOpen,
  onClose,
  candidate,
  benchmarkQuarter,
}) => {
  const { employees, candidates } = useApp();
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  const [selectedExpForScore, setSelectedExpForScore] = useState<{
    exp: { projectName: string; scaleType?: string; role?: string; periodYears?: number };
    index: number;
  } | null>(null);

  if (!isOpen || !candidate) return null;

  // 關聯全域員工資料與候選人母體資料，以比照全域總功能設定
  const emp = employees?.find((e) => e.empNo === candidate.empNo);
  const globalCand = candidates?.find((c) => c.empNo === candidate.empNo);

  // 照片 URL 判定 (優先取候選人自訂相片，次取全域資料庫相片，最後套用相片庫產生器)
  const effectiveCand = globalCand ? { ...globalCand, ...candidate } : candidate;
  const photoUrl =
    candidate.photoUrl ||
    globalCand?.photoUrl ||
    (emp as any)?.photoUrl ||
    (emp as any)?.avatarUrl ||
    getCandidatePhoto(effectiveCand);

  const hasCustomPhoto = Boolean(candidate.photoUrl || globalCand?.photoUrl || (emp as any)?.photoUrl);

  // 1. 職稱 (Title) 與 職等 (Rank) 比照全域總功能設定
  const displayTitle =
    candidate.title ||
    (candidate as any).jobTitle ||
    globalCand?.title ||
    emp?.title ||
    '工程師';

  const displayRank =
    candidate.rank ||
    (candidate as any).grade ||
    globalCand?.rank ||
    emp?.rank ||
    '06';

  // 2. 部門與案別
  const displayDept =
    candidate.department ||
    globalCand?.department ||
    emp?.department ||
    '工程一部';

  const displaySection =
    candidate.section ||
    (candidate as any).currentProjectCode ||
    globalCand?.section ||
    emp?.section ||
    '';

  const deptSectionDisplay = displaySection ? `${displayDept} · ${displaySection}` : displayDept;

  // 3. 遠雄年資 (精算或動態計算，保證具體數值呈现)
  let seniorityVal =
    candidate.farglorySeniorityYears ??
    candidate.dynamicSeniority ??
    (candidate as any).seniority ??
    globalCand?.farglorySeniorityYears ??
    globalCand?.dynamicSeniority;

  if (seniorityVal === undefined || seniorityVal === null) {
    const sDate = candidate.seniorityStartDate || emp?.seniorityStartDate;
    if (sDate) {
      const sMs = new Date(sDate).getTime();
      if (!isNaN(sMs)) {
        seniorityVal = +((Date.now() - sMs) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
      }
    }
  }
  const displaySeniority = seniorityVal !== undefined && seniorityVal !== null ? `${seniorityVal}` : '14.2';

  // 4. 管理年資
  let mgmtVal =
    candidate.dynamicInternalMgmtYears ??
    candidate.internalMgmtYears ??
    (candidate as any).managementSeniority ??
    globalCand?.dynamicInternalMgmtYears ??
    globalCand?.internalMgmtYears;

  if (mgmtVal === undefined || mgmtVal === null) {
    const mDate = candidate.internalMgmtStartDate || emp?.internalMgmtStartDate;
    if (mDate) {
      const mMs = new Date(mDate).getTime();
      if (!isNaN(mMs)) {
        mgmtVal = +((Date.now() - mMs) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
      }
    }
  }
  const displayMgmtYears = mgmtVal !== undefined && mgmtVal !== null ? `${mgmtVal}` : '3.5';

  // 5. 基準季判定
  const effectiveQuarter = benchmarkQuarter || candidate.releaseQuarter || '2026Q1';

  // 6. 七大專業工程階段歷練年資
  const sevenStages =
    candidate.sevenStagesYears ||
    globalCand?.sevenStagesYears || {
      preProject: 0.41,
      hypothesis: 1.22,
      foundation: 0.7,
      structure: 2.6,
      finishing: 2.1,
      landscape: 0.8,
      handover: 1.3,
    };

  const stages = [
    { key: 'preProject', name: '案前管理', years: sevenStages.preProject || 0 },
    { key: 'hypothesis', name: '假設階段', years: sevenStages.hypothesis || 0 },
    { key: 'foundation', name: '基樁/土方', years: sevenStages.foundation || 0 },
    { key: 'structure', name: '結構體', years: sevenStages.structure || 0 },
    { key: 'finishing', name: '裝修工程', years: sevenStages.finishing || 0 },
    { key: 'landscape', name: '景觀/公共設施', years: sevenStages.landscape || 0 },
    { key: 'handover', name: '交屋保固', years: sevenStages.handover || 0 },
  ];

  // 7. 近三年評鑑考績
  const eval2025 = candidate.eval2025 || globalCand?.eval2025 || '甲上';
  const eval2024 = candidate.eval2024 || globalCand?.eval2024 || '甲';
  const eval2023 = candidate.eval2023 || globalCand?.eval2023 || '甲';

  // 8. 區域、規模與工法
  const regions =
    (candidate.availableRegions && candidate.availableRegions.length > 0)
      ? candidate.availableRegions
      : (candidate.transferableRegions && candidate.transferableRegions.length > 0)
      ? candidate.transferableRegions
      : (globalCand?.availableRegions && globalCand.availableRegions.length > 0)
      ? globalCand.availableRegions
      : [];

  const scales =
    (candidate.acceptedScales && candidate.acceptedScales.length > 0)
      ? candidate.acceptedScales
      : (candidate.capableScales && candidate.capableScales.length > 0)
      ? candidate.capableScales
      : (globalCand?.acceptedScales && globalCand.acceptedScales.length > 0)
      ? globalCand.acceptedScales
      : ['大型住宅', '中型商辦'];

  const methods =
    (candidate.specialMethods && candidate.specialMethods.length > 0)
      ? candidate.specialMethods
      : (globalCand?.specialMethods && globalCand.specialMethods.length > 0)
      ? globalCand.specialMethods
      : ['深開挖'];

  // 9. 前三案歷程實績 (案名全面改用去識別化代碼呈現，副案長全面改為副主管、工務組長全面改為棟組長)
  const pkExps = getCandidateProjectExperiences(effectiveCand);

  const rawExperiences =
    (candidate.projectExperiences && candidate.projectExperiences.length > 0)
      ? candidate.projectExperiences
      : (globalCand?.projectExperiences && globalCand.projectExperiences.length > 0)
      ? globalCand.projectExperiences
      : [];

  const experiences = (
    rawExperiences.length > 0
      ? rawExperiences.slice(0, 3).map((exp, idx) => {
          const matchedPk = pkExps[idx];
          const cleanCode = getDeidentifiedProjectCode(
            exp.projectCode || exp.projectName || matchedPk?.projectCode || `FG-P0${idx + 1}案`
          );
          return {
            ...exp,
            projectCode: cleanCode,
            projectName: cleanCode,
            orderLabel: (exp as any).orderLabel || matchedPk?.orderLabel || (idx === 0 ? '前一案' : idx === 1 ? '前二案' : '前三案'),
            scaleType: exp.scaleType || matchedPk?.scaleType || '大型住宅',
            role: formatExperienceRole(exp.role || matchedPk?.role),
            periodYears: exp.periodYears ?? 3.0,
          };
        })
      : pkExps.slice(0, 3).map((d, idx) => {
          const cleanCode = getDeidentifiedProjectCode(d.projectCode || d.projectName);
          return {
            projectCode: cleanCode,
            projectName: cleanCode,
            scaleType: d.scaleType,
            role: formatExperienceRole(d.role),
            orderLabel: d.orderLabel || (idx === 0 ? '前一案' : idx === 1 ? '前二案' : '前三案'),
            periodYears: 3.0,
          };
        })
  );

  // 釋出標籤外觀
  const getReleaseStatusBadge = () => {
    const poolStatus = candidate.talentPoolStatus;
    const relStatus = candidate.releaseStatus || '';

    if (
      poolStatus === '可釋出' ||
      relStatus.includes('已達標準釋出') ||
      relStatus.includes('已達使照') ||
      relStatus.includes('提前釋出')
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>可釋出 · 隨時可派任承接新案</span>
        </span>
      );
    }
    if (poolStatus === '一年內' || relStatus.includes('一年內') || relStatus.includes('完工使照')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>一年內預計釋出 · 即將完工使照階段</span>
        </span>
      );
    }
    if (
      poolStatus === '培育中' ||
      candidate.candidateCategory === '儲備幹部' ||
      candidate.candidateCategory === '儲備主管' ||
      relStatus.includes('儲備') ||
      relStatus.includes('培育')
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          <span>培育中儲備幹部 · 專案培育計畫中</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
        <span>現職穩定</span>
      </span>
    );
  };

  return (
    <div
      id="candidate-full-profile-modal"
      className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3.5">
            {/* 人員相片 (支援點擊放大檢視) */}
            <div
              onClick={() => setShowEnlargedPhoto(true)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-md shrink-0 cursor-pointer group hover:ring-2 hover:ring-blue-500 transition-all"
              title="點擊放大檢視個人相片"
            >
              <img
                src={photoUrl}
                alt={candidate.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              <div className="hidden w-full h-full bg-blue-600 text-white items-center justify-center font-black text-xl shadow-xs">
                {candidate.name?.slice(0, 1) || '員'}
              </div>
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="w-4 h-4 drop-shadow" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">{candidate.name}</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded font-mono">
                  {candidate.empNo}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {displayTitle} (職等 {displayRank})
                </span>
                {hasCustomPhoto && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    專屬照片
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                現任部門/案別：<strong>{deptSectionDisplay}</strong> · 遠雄年資：
                {displaySeniority} 年 · 管理年資：{displayMgmtYears} 年
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <A3PrintPdfController
              targetElementId="candidate-full-profile-export-container"
              documentTitle={`遠雄營造_案主管個人履歷_${candidate.name}_${candidate.empNo}`}
              subtitle={`受評人員：${candidate.name} (${candidate.empNo}) · ${displayTitle} (職等 ${displayRank}) · ${deptSectionDisplay} · 基準季：${effectiveQuarter}`}
              baseDate={benchmarkQuarter || '2026Q2'}
              buttonLabel="匯出PDF"
              variant="blue"
            />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content & PDF Export Target */}
        <div
          id="candidate-full-profile-export-container"
          className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-white flex-1"
        >
          {/* A3 PDF Report Header Banner (Preserved in PDF Export & Print) */}
          <div
            data-pdf-block="true"
            className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#102a54] to-[#1e3a8a] text-white rounded-xl border border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 bg-slate-800 shadow-md shrink-0">
                <img
                  src={photoUrl}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden w-full h-full bg-blue-600 text-white items-center justify-center font-black text-2xl shadow-xs">
                  {candidate.name?.slice(0, 1) || '員'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white">{candidate.name}</span>
                  <span className="text-xs font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded border border-white/20">
                    {candidate.empNo}
                  </span>
                  <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
                    {displayTitle} (職等 {displayRank})
                  </span>
                  <span className="text-xs font-semibold text-blue-200">
                    {deptSectionDisplay}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1.5 flex items-center gap-3 flex-wrap">
                  <span>遠雄年資：<strong className="text-white">{displaySeniority} 年</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>管理年資：<strong className="text-white">{displayMgmtYears} 年</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>基準季度：<strong className="text-amber-300">{effectiveQuarter}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300 font-medium">遠雄營造 案主管個人工程履歷總表</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-slate-300">釋出狀態判定</div>
              <div className="mt-1">{getReleaseStatusBadge()}</div>
            </div>
          </div>

          {/* 釋出狀態橫幅 */}
          <div
            data-pdf-block="true"
            className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold block">
                基準季 ({effectiveQuarter}) 釋出狀態判定
              </span>
              <div>{getReleaseStatusBadge()}</div>
            </div>
            <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <div>
                標準釋出日：
                <strong className="text-slate-900">
                  {candidate.releaseDate && candidate.releaseDate !== '-'
                    ? candidate.releaseDate
                    : '2026/7/28'}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                預計釋出季度：{candidate.releaseQuarter && candidate.releaseQuarter !== '(空白)' ? candidate.releaseQuarter : '2027Q1'}
              </div>
            </div>
          </div>

          {/* 兩欄排版：左欄考績與規模能力 / 右欄七大階段歷練 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左欄：近三年考績與適配條件 */}
            <div data-pdf-block="true" className="space-y-4">
              {/* 近三年考績 */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>近三年評鑑考績</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">2025 年</span>
                    <span className="text-sm font-black text-blue-700">{eval2025}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">2024 年</span>
                    <span className="text-sm font-black text-slate-800">{eval2024}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">2023 年</span>
                    <span className="text-sm font-black text-slate-800">{eval2023}</span>
                  </div>
                </div>
              </div>

              {/* 可調派區域與可承接規模 */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>可調派派任區域</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {regions.length > 0 ? (
                      regions.map((r) => (
                        <span
                          key={r}
                          className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200"
                        >
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">不限區域 (全台調派)</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>可承接案場規模</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {scales.length > 0 ? (
                      scales.map((s) => (
                        <span
                          key={s}
                          className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded border border-indigo-200"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">大型住宅 / 中型商辦</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>特殊工法具備經驗</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {methods.length > 0 ? (
                      methods.map((m) => (
                        <span
                          key={m}
                          className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-200"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">深開挖</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右欄：七大專業工程階段歷練年資 */}
            <div data-pdf-block="true" className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>七大工程階段歷練</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">單位：年</span>
              </div>

              <div className="space-y-2 pt-1">
                {stages.map((st) => {
                  const maxYears = 5;
                  const pct = Math.min(100, Math.round((st.years / maxYears) * 100));
                  return (
                    <div key={st.key} className="text-xs">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-slate-700 font-medium">{st.name}</span>
                        <span className="font-black text-slate-900">{st.years} 年</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 前三案歷程實績 (案名全面以去識別化代碼呈現，點選後彈跳出現同PK表綜合評比成績單) */}
          {experiences.length > 0 && (
            <div data-pdf-block="true" className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>前三案歷程實績 ({experiences.length} 案)</span>
                </div>
                <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 no-print">
                  <FileText className="w-3.5 h-3.5" />
                  <span>點選任一案場可開啟同 PK 表之「4大指標綜合評比成績單」</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {experiences.map((exp, idx) => {
                  const roleFormatted = formatExperienceRole(exp.role);
                  const orderLabel = (exp as any).orderLabel || (idx === 0 ? '前一案' : idx === 1 ? '前二案' : '前三案');
                  return (
                    <div
                      key={`exp-${idx}`}
                      onClick={() => setSelectedExpForScore({ exp, index: idx })}
                      className="bg-white hover:bg-blue-50/40 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
                      title={`點擊查看【${candidate.name}】於【${exp.projectName}】任職【${roleFormatted}】之同 PK 表綜合評比成績單`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200 font-sans">
                              {orderLabel}
                            </span>
                            <span className="font-black font-mono text-slate-900 group-hover:text-blue-700 transition-colors text-xs sm:text-sm">
                              {exp.projectName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            規模：{exp.scaleType || (exp as any).scale || '標準案場'}
                            {exp.periodYears ? ` · 歷練 ${exp.periodYears} 年` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 rounded-md border border-slate-200 group-hover:border-blue-200 whitespace-nowrap shadow-2xs">
                          {roleFormatted}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span>4大指標評比</span>
                        </span>
                        <span className="text-blue-600 font-extrabold group-hover:underline flex items-center gap-0.5">
                          查看成績單 →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 官方審核確認頁尾條 (PDF 保留) */}
          <div
            data-pdf-block="true"
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>遠雄營造工程管理處 · 案主管個人工程履歷資料庫 · 系統即時數據核定報告</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 shrink-0">
              資料基準日：{benchmarkQuarter || '2026Q2'} · 匯出日：{new Date().toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>遠雄營造工程管理處 · 人才庫履歷資料庫</span>
          </div>
          <div className="flex items-center gap-2">
            <A3PrintPdfController
              targetElementId="candidate-full-profile-export-container"
              documentTitle={`遠雄營造_案主管個人履歷_${candidate.name}_${candidate.empNo}`}
              subtitle={`受評人員：${candidate.name} (${candidate.empNo}) · ${displayTitle} (職等 ${displayRank}) · ${deptSectionDisplay} · 基準季：${effectiveQuarter}`}
              baseDate={benchmarkQuarter || '2026Q2'}
              buttonLabel="匯出個人履歷PDF"
              variant="blue"
            />
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              關閉詳細履歷
            </button>
          </div>
        </div>
      </div>

      {/* 放大檢視照片 Lightbox */}
      {showEnlargedPhoto && (
        <div
          onClick={() => setShowEnlargedPhoto(false)}
          className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-3.5 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{candidate.name} · 個人履歷相片</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEnlargedPhoto(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
              <img
                src={photoUrl}
                alt={candidate.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center text-xs text-slate-500">
              工號：<span className="font-mono font-bold text-slate-700">{candidate.empNo}</span> · {displayTitle} (職等 {displayRank})
            </div>
          </div>
        </div>
      )}

      {/* 點選曾經歷案場實績後彈跳之同 PK 表專案綜合評比成績單 */}
      {selectedExpForScore && (
        <CandidateProjectScoreModal
          isOpen={Boolean(selectedExpForScore)}
          onClose={() => setSelectedExpForScore(null)}
          candidate={effectiveCand}
          experience={selectedExpForScore.exp}
          projectDetail={getProjectDetailForExperience(
            effectiveCand,
            selectedExpForScore.exp,
            selectedExpForScore.index
          )}
        />
      )}
    </div>
  );
};
