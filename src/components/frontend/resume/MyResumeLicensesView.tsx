import React, { useState } from 'react';
import {
  Award,
  GraduationCap,
  Building,
  Plus,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Tag,
  ChevronRight,
  Eye,
  FileBadge,
  RotateCw,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AddResumeLicenseModal } from './AddResumeLicenseModal';
import { RenewLicenseModal } from './RenewLicenseModal';
import { EmployeeLicense } from '../../../types';
import { PersonalLearningHistoryView } from '../training/PersonalLearningHistoryView';
import { getCandidatePhoto } from '../../../utils/candidatePkHelper';

interface MyResumeLicensesViewProps {
  empNo: string;
}

export const MyResumeLicensesView: React.FC<MyResumeLicensesViewProps> = ({ empNo }) => {
  const { employees, employeeLicenses, resumeDetails, candidates } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'learning_charts'>('profile');

  const currentEmp = employees.find((e) => e.empNo === empNo) || employees[0];
  const currentCandidate = candidates.find((c) => c.empNo === empNo);
  const userPhoto =
    currentCandidate?.photoUrl ||
    (currentEmp as any)?.photoUrl ||
    (currentCandidate
      ? getCandidatePhoto(currentCandidate)
      : currentEmp
      ? getCandidatePhoto({ empNo: currentEmp.empNo, name: currentEmp.name } as any)
      : null);
  const myLicenses = employeeLicenses.filter((l) => l.empNo === empNo);
  const myResume = resumeDetails[empNo] || {
    empNo,
    name: currentEmp?.name || '',
    department: currentEmp?.department || '',
    title: currentEmp?.title || '',
    skillTags: ['品管工程', '工安稽核', '工程排程'],
    educationList: [
      {
        id: 'edu-01',
        school: '國立成功大學',
        major: '土木工程學系',
        degree: '學士',
        gradYear: '2016',
        status: '畢業',
      },
    ],
    workHistory: [],
    projectHistory: [],
    licenses: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  // Merge projects from candidate profile or resume details
  const candidateProjects =
    currentCandidate?.projectExperiences && currentCandidate.projectExperiences.length > 0
      ? currentCandidate.projectExperiences.map((p, idx) => ({
          id: `cand-p-${idx}`,
          projectName: p.projectName,
          scaleType: p.scaleType,
          role: p.role,
          startDate: '2022-03',
          endDate: '2025-12',
          specialMethods: currentCandidate.specialMethods || ['深開挖', '連續壁'],
          responsibilities: `歷練年資約 ${p.periodYears || 2} 年，主導案場工務管控與要徑施工抽查。`,
        }))
      : myResume.projectHistory || [];

  // Education list (backed by resumeDetails / employee profile)
  const educationList =
    myResume.educationList && myResume.educationList.length > 0
      ? myResume.educationList
      : [
          {
            id: 'edu-def',
            school: '國立成功大學',
            major: '土木工程學系',
            degree: '學士',
            gradYear: '2016',
            status: '畢業',
          },
        ];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [renewTargetLicense, setRenewTargetLicense] = useState<EmployeeLicense | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  const validLicenses = myLicenses.filter((l) => l.status === 'valid');
  const expiringLicenses = myLicenses.filter((l) => l.status === 'expiring_soon');
  const pendingReviewLicenses = myLicenses.filter((l) => l.status === 'pending_review');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/25 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg relative">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={currentEmp?.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`${userPhoto ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
              >
                {currentEmp?.name ? currentEmp.name.charAt(0) : '員'}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{currentEmp?.name}</h1>
                <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold rounded-lg">
                  {currentEmp?.empNo}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  已綁定登入同仁履歷雲
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 font-medium">
                {currentEmp?.department} · {currentEmp?.title} · 到職日：
                {currentEmp?.seniorityStartDate || currentEmp?.birthday || '2019-03-15'}
              </p>

              {/* Skill Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {(myResume.skillTags || ['品管工程', '工安稽核']).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white/15 border border-white/20 text-white text-[11px] font-bold rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button: 新增證照 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              新增證照
            </button>
          </div>
        </div>

        {/* Metric Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-center">
            <span className="text-[10px] text-blue-200 block font-medium">持有專業證照數</span>
            <span className="text-lg font-black text-white">{myLicenses.length} 張</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-center">
            <span className="text-[10px] text-emerald-200 block font-medium">有效驗證合格</span>
            <span className="text-lg font-black text-emerald-300">{validLicenses.length} 張</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-center">
            <span className="text-[10px] text-amber-200 block font-medium">即將到期/需回訓</span>
            <span className="text-lg font-black text-amber-300">{expiringLicenses.length} 張</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-center">
            <span className="text-[10px] text-indigo-200 block font-medium">歷練重大建案 (後台帶入)</span>
            <span className="text-lg font-black text-indigo-200">
              {candidateProjects.length} 案
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>履歷與持有證照</span>
        </button>

        <button
          onClick={() => setActiveSubTab('learning_charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'learning_charts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>學習歷程視覺化與詳細記錄</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
            Recharts
          </span>
        </button>
      </div>

      {/* Render Learning Charts Tab */}
      {activeSubTab === 'learning_charts' ? (
        <PersonalLearningHistoryView empNo={empNo} />
      ) : (
        /* Main Grid: Left Column (Licenses - 7 cols) & Right Column (Projects & Education - 5 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: LICENSES & CERTIFICATES (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">個人專業證照清單</h3>
                  <p className="text-xs text-slate-500">
                    法定案場資格、品管、職安主管、營造技術士及回訓換照追蹤
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                + 登錄新證照
              </button>
            </div>

            {myLicenses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileBadge className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">尚無登錄之證照紀錄</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  點擊上方「+ 登錄新證照」或「新增證照」即可快速依標準規格庫自主申報
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  立即申報第一張證照
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myLicenses.map((lic) => {
                  const isValid = lic.status === 'valid';
                  const isExpiring = lic.status === 'expiring_soon';
                  const isPending = lic.status === 'pending_review';

                  return (
                    <div
                      key={lic.id}
                      className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
                              isValid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isExpiring
                                ? 'bg-amber-100 text-amber-800'
                                : isPending
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <FileBadge className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">
                                {lic.licenseName}
                              </h4>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                                {lic.licenseCategory}
                              </span>
                              {isValid && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  有效合規
                                </span>
                              )}
                              {isExpiring && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  即將到期需回訓
                                </span>
                              )}
                              {isPending && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  主管/人資審核中
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 font-mono mt-1">
                              字號：<span className="font-bold text-slate-900">{lic.licenseNo}</span> · 發證：
                              {lic.issuingAuthority}
                            </p>
                          </div>
                        </div>

                        {/* Card Actions: Manual Renew & View Attachment */}
                        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                          {lic.attachmentUrl && (
                            <button
                              onClick={() => setPreviewAttachmentUrl(lic.attachmentUrl || null)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              檢視影本
                            </button>
                          )}

                          {/* 手動更新回訓並取得日期資訊 */}
                          <button
                            onClick={() => setRenewTargetLicense(lic)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95"
                          >
                            <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                            手動更新回訓
                          </button>
                        </div>
                      </div>

                      {/* License Date & Expiry Breakdown Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            取得 / 初訓結訓日期
                          </span>
                          <span className="font-bold text-slate-800 font-mono">
                            {lic.issueDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            有效到期日
                          </span>
                          <span
                            className={`font-bold font-mono ${
                              isExpiring
                                ? 'text-amber-700'
                                : lic.hasExpiry
                                ? 'text-slate-800'
                                : 'text-emerald-700'
                            }`}
                          >
                            {lic.hasExpiry ? lic.expiryDate || '未註明' : '永久有效 (無到期限制)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            法定回訓週期與截止日
                          </span>
                          <span className="font-bold text-indigo-700 font-mono">
                            {lic.renewalRequired
                              ? lic.renewalDeadlineDate
                                ? `每 ${lic.renewalIntervalYears || 4} 年 (至 ${lic.renewalDeadlineDate})`
                                : `每 ${lic.renewalIntervalYears || 4} 年回訓`
                              : '無須定期回訓'}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Renewal History log if any */}
                      {lic.notes && (
                        <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                          <strong>說明與紀錄：</strong> {lic.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: PROJECTS & EDUCATION (5 cols - STRICTLY READ-ONLY LOADED FROM BACKEND) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section: 工程專案實績 (由後台更新人員資料時一併帶入，不可自行修正) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">工程專案實績</h3>
                  <p className="text-xs text-slate-500">主導及歷練之大型住宅/商辦/廠辦</p>
                </div>
              </div>

              {/* Read-Only Badge: 不可自行修正 */}
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                <Lock className="w-3 h-3 text-slate-400" />
                後台資料帶入 · 唯讀
              </span>
            </div>

            {candidateProjects.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-600">尚無專案實績紀錄</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  由後台人資專案資料庫統一分派與建檔
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidateProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900">{proj.projectName}</h4>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md shrink-0">
                        {proj.scaleType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800">職務：{proj.role}</span>
                      <span className="text-slate-300">|</span>
                      <span>
                        {proj.startDate} ~ {proj.endDate}
                      </span>
                    </div>

                    {proj.specialMethods && proj.specialMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.specialMethods.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold rounded-md"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {proj.responsibilities && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                        {proj.responsibilities}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: 最高學歷與背景 (由後台更新人員資料時一併帶入，不可自行修正) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">最高學歷與背景</h3>
                  <p className="text-xs text-slate-500">公司核准之最高學歷證書</p>
                </div>
              </div>

              {/* Read-Only Badge: 不可自行修正 */}
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                <Lock className="w-3 h-3 text-slate-400" />
                後台資料帶入 · 唯讀
              </span>
            </div>

            <div className="space-y-2">
              {educationList.map((edu) => (
                <div
                  key={edu.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-black text-slate-900">
                      {edu.school} · {edu.major}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {edu.degree} · 畢業年度：{edu.gradYear} ({edu.status})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
                    已核備
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Add License Modal */}
      <AddResumeLicenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        empNo={empNo}
      />

      {/* Manual Renew License Modal */}
      <RenewLicenseModal
        isOpen={!!renewTargetLicense}
        onClose={() => setRenewTargetLicense(null)}
        license={renewTargetLicense}
      />

      {/* Attachment Preview Modal */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold">證照附件影像預覽</span>
              </div>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <img
                src={previewAttachmentUrl}
                alt="證照影本"
                referrerPolicy="no-referrer"
                className="max-h-96 rounded-2xl object-cover border border-slate-200 shadow-md"
              />
              <p className="text-xs text-slate-500 mt-4">
                遠雄營造 證照雲安全存證系統 · 浮水印已加密保護
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
