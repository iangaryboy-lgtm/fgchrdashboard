import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileCheck,
  Building,
  User,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DispatchTrainingRecord } from '../../../types';

export const DispatchTrainingTab: React.FC = () => {
  const {
    dispatchTrainings,
    employees,
    completeAndVerifyDispatchTraining,
    deleteDispatchTraining,
  } = useApp();

  const [verifyRecord, setVerifyRecord] = useState<DispatchTrainingRecord | null>(null);
  const [resultLicenseNo, setResultLicenseNo] = useState('');
  const [completionNotes, setCompletionNotes] = useState('培訓完訓測驗通過，已驗證正本並建檔入庫');

  const inTrainingCount = dispatchTrainings.filter((d) => d.status === 'in_training').length;
  const examCount = dispatchTrainings.filter((d) => d.status === 'examining').length;
  const completedCount = dispatchTrainings.filter((d) => d.status === 'completed' || d.status === 'verified').length;

  const handleOpenVerifyModal = (record: DispatchTrainingRecord) => {
    setVerifyRecord(record);
    setResultLicenseNo(`LIC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleExecuteVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRecord) return;

    completeAndVerifyDispatchTraining(verifyRecord.id, {
      licenseNo: resultLicenseNo,
      notes: completionNotes,
      expiryDate: new Date(Date.now() + 4 * 365 * 86400000).toISOString().slice(0, 10),
      renewalDeadlineDate: new Date(Date.now() + 4 * 365 * 86400000).toISOString().slice(0, 10),
      renewalRequired: true,
      renewalIntervalYears: 4,
    });

    setVerifyRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 font-medium">受訓中人員</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{inTrainingCount} <span className="text-xs font-normal text-blue-600">人</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">考照中 / 待放榜</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{examCount} <span className="text-xs font-normal text-amber-600">人</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium">已結訓審核建檔</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{completedCount} <span className="text-xs font-normal text-emerald-600">人</span></p>
        </div>
      </div>

      {/* Dispatch Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900">派訓中人員管理與結訓審核流程</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            派訓結訓經審核後，系統將自動建檔並連動個人證照庫與案場名額
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">派訓同仁</th>
                <th className="px-4 py-3">目標考照 / 回訓項目</th>
                <th className="px-4 py-3">委任培訓機構</th>
                <th className="px-4 py-3">訓練起訖期間</th>
                <th className="px-4 py-3">派訓案場</th>
                <th className="px-4 py-3">公假 / 預算</th>
                <th className="px-4 py-3">受訓狀態</th>
                <th className="px-4 py-3 text-right">結訓審核入庫</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatchTrainings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    目前無派訓中紀錄
                  </td>
                </tr>
              ) : (
                dispatchTrainings.map((rec) => {
                  const isVerified = rec.status === 'verified';
                  const isInTraining = rec.status === 'in_training';
                  const isExam = rec.status === 'examining';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{rec.empName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.empNo} · {rec.department}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{rec.targetLicenseName}</div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          {rec.targetLicenseCategory}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {rec.trainingInstitute}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {rec.trainingStartDate} ~ {rec.trainingEndDate}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        {rec.dispatchedSiteName || '總部統一培育'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">
                        NT$ {(rec.tuitionFee ?? (rec as any).estimatedCost ?? 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5">
                        {isInTraining && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            受訓講習中
                          </span>
                        )}
                        {isExam && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            測驗考照中
                          </span>
                        )}
                        {isVerified && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            已結訓審核歸檔
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isVerified ? (
                            <button
                              onClick={() => handleOpenVerifyModal(rec)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              結訓審核入庫
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold">
                              已建檔完成
                            </span>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除此派訓紀錄嗎？`)) {
                                deleteDispatchTraining(rec.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completion & Verification Modal */}
      {verifyRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm">結訓考照審核與自動建檔</h3>
              </div>
              <button
                onClick={() => setVerifyRecord(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteVerification} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700">
                <span className="font-bold block text-blue-900">
                  受訓同仁：{verifyRecord.empName} ({verifyRecord.empNo})
                </span>
                <span>取得證照：{verifyRecord.targetLicenseName} ({verifyRecord.trainingInstitute})</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  核發證書編號 / 登錄字號 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resultLicenseNo}
                  onChange={(e) => setResultLicenseNo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">審核人與建檔備註</label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  核可並自動建立證照資料庫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
