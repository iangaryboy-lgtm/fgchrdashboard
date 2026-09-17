import React, { useState } from 'react';
import {
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  Award,
  Video,
  FileCheck,
  Target,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { CourseEnrollment } from '../../../types';

interface EditStudentProgressModalProps {
  enrollment: CourseEnrollment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditStudentProgressModal: React.FC<EditStudentProgressModalProps> = ({
  enrollment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateEnrollment } = useApp();

  // Local states for editing
  const [attendanceStatus, setAttendanceStatus] = useState(enrollment.attendanceStatus || 'not_checked_in');
  const [checkInTime, setCheckInTime] = useState(enrollment.checkInTime || '');
  const [videoWatchPercent, setVideoWatchPercent] = useState<number>(enrollment.videoWatchPercent ?? 0);
  const [materialsReadPercent, setMaterialsReadPercent] = useState<number>(enrollment.materialsReadPercent ?? 0);
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(enrollment.surveyCompleted ?? false);
  const [examScore, setExamScore] = useState<number>(
    enrollment.examScores && enrollment.examScores.length > 0 ? enrollment.examScores[0].score : 0
  );
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(
    (enrollment as any).assignmentSubmitted ?? false
  );
  const [assignmentScore, setAssignmentScore] = useState<number>(
    (enrollment as any).assignmentScore ?? 80
  );
  const [finalPassStatus, setFinalPassStatus] = useState(enrollment.finalPassStatus || 'in_progress');
  const [isCertified, setIsCertified] = useState<boolean>(enrollment.isCertified ?? false);
  const [certificateCode, setCertificateCode] = useState(enrollment.certificateCode || '');
  const [adminNote, setAdminNote] = useState((enrollment as any).adminNote || '');

  // Feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const updatedExamScores = [
        {
          attemptNo: 1,
          score: examScore,
          passed: examScore >= 70,
          completedAt: new Date().toISOString().slice(0, 10),
        },
      ];

      const updates: Partial<CourseEnrollment> = {
        attendanceStatus: attendanceStatus as any,
        checkInTime: attendanceStatus === 'checked_in' ? (checkInTime || new Date().toISOString().replace('T', ' ').slice(0, 19)) : undefined,
        videoWatchPercent,
        materialsReadPercent,
        surveyCompleted,
        examScores: updatedExamScores,
        finalPassStatus: finalPassStatus as any,
        isCertified,
        certificateCode: isCertified
          ? certificateCode || `FG-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined,
        ...({
          assignmentSubmitted,
          assignmentScore,
          adminNote,
          lastModifiedByAdminAt: new Date().toISOString(),
        } as any),
      };

      updateEnrollment(enrollment.id, updates);
      setFeedback({ type: 'success', text: '學員研習紀錄與考評狀態已成功更新！' });
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || '儲存失敗，請重試' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  修改學員研習進度與考評判定
                </h3>
                <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold rounded">
                  {enrollment.empNo || (enrollment as any).employeeNo}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>學員：<strong>{enrollment.empName || (enrollment as any).employeeName || enrollment.empNo}</strong></span>
                <span>· 部門：{enrollment.department}</span>
                <span>· 梯次：{enrollment.batchName || `第 ${enrollment.batchNo} 梯次`}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* SECTION 1: ATTENDANCE */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              課堂簽到出席狀態
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">出席狀態</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="checked_in">✓ 已簽到出席 (Checked-in)</option>
                  <option value="not_checked_in">尚未簽到 (Not Checked-in)</option>
                  <option value="excused_absence">公假 / 請假 (Excused)</option>
                  <option value="unexcused_absence">缺席 / 曠課 (Absent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">簽到記錄時間</label>
                <input
                  type="text"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  placeholder="2026-06-20 08:52:10"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LEARNING PROGRESS & VIDEO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-emerald-600" />
              影音章節研習與教材進度
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  影片研習完看率 (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={videoWatchPercent}
                  onChange={(e) => setVideoWatchPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-400">大於等於 90% 即符合格門檻</span>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  教材講義閱讀率 (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={materialsReadPercent}
                  onChange={(e) => setMaterialsReadPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  問卷填寫狀況
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={surveyCompleted}
                    onChange={(e) => setSurveyCompleted(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>已完成課後滿意度調查</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: EXAM & ASSIGNMENT */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-600" />
              測驗成績與課後實務作業
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  線上隨堂測驗分數 (分)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={examScore}
                  onChange={(e) => setExamScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400">及格標準為 70 分</span>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  實務作業繳交
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={assignmentSubmitted}
                    onChange={(e) => setAssignmentSubmitted(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>已上傳 OneDrive 作業</span>
                </label>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-bold mb-1">
                  作業審閱評分 (分)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={assignmentScore}
                  onChange={(e) => setAssignmentScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: FINAL CERTIFICATION */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-200 space-y-3">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              最終結訓認定與證書核發
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-700 font-bold mb-1">完訓狀態</label>
                <select
                  value={finalPassStatus}
                  onChange={(e) => setFinalPassStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="passed">合格結業 (Passed)</option>
                  <option value="in_progress">進行中 (In Progress)</option>
                  <option value="failed">未達合格標準 (Failed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-bold mb-1">核發結業證書</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>核准發放電子證書</span>
                </label>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-bold mb-1">證書字號</label>
                <input
                  type="text"
                  value={certificateCode}
                  onChange={(e) => setCertificateCode(e.target.value)}
                  placeholder="FG-CERT-2026-XXXXXX"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">管理員備註</label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="手動調整之原因或特准備註..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  );
};
