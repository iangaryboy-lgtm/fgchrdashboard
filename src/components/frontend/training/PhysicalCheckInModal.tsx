import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { CourseEnrollment, CourseBatch } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface PhysicalCheckInModalProps {
  enrollment: CourseEnrollment;
  batch?: CourseBatch;
  onClose: () => void;
}

export const PhysicalCheckInModal: React.FC<PhysicalCheckInModalProps> = ({
  enrollment,
  batch,
  onClose,
}) => {
  const { checkInEnrollment } = useApp();
  const [activeMode, setActiveMode] = useState<'my_pass' | 'scan_onsite'>('my_pass');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(enrollment.attendanceStatus === 'checked_in');
  const [errorMsg, setErrorMsg] = useState('');

  // The QR pass payload for personal badge
  const qrPassPayload = JSON.stringify({
    enrollmentId: enrollment.id,
    empNo: enrollment.empNo,
    empName: enrollment.empName,
    batchId: enrollment.batchId,
    timestamp: Date.now(),
  });

  const handleSimulateScanOnSite = () => {
    // Check in the user
    checkInEnrollment(enrollment.id, 'qr_scan');
    setIsSuccess(true);
    setErrorMsg('');

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim() === '8888' || verificationCode.trim() === '2026' || verificationCode.trim().length >= 4) {
      checkInEnrollment(enrollment.id, 'verification_code');
      setIsSuccess(true);
      setErrorMsg('');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setErrorMsg('簽到驗證碼不正確，請確認現場投影螢幕顯示之 4 位數驗證碼。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">實體課程現場簽到報到</h3>
              <p className="text-[11px] text-slate-500">{enrollment.courseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveMode('my_pass')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'my_pass'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            學員個人專屬報到碼
          </button>
          <button
            onClick={() => setActiveMode('scan_onsite')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'scan_onsite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            掃描現場大螢幕 / 輸入碼
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isSuccess ? (
            /* Success confirmation screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">簽到報到成功！</h4>
                <p className="text-xs text-slate-500 mt-1">
                  已完成抵達驗證，出勤紀錄已即時傳送至人資培育系統
                </p>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs text-slate-700 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">學員姓名：</span>
                  <span className="font-bold text-slate-900">{enrollment.empName} ({enrollment.empNo})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">開課梯次：</span>
                  <span className="font-semibold text-slate-800">{enrollment.batchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">簽到時間：</span>
                  <span className="font-semibold text-emerald-700">
                    {new Date().toLocaleDateString('zh-TW')} {new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                確認並關閉
              </button>
            </div>
          ) : activeMode === 'my_pass' ? (
            /* Personal Pass QR */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
                <QRCodeSVG
                  value={qrPassPayload}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                    x: undefined,
                    y: undefined,
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {enrollment.empName} · {enrollment.department} {enrollment.title}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  請將此 QR 碼對準現場報到處掃描器，以完成抵達確認
                </span>
              </div>

              <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">助教/講師快速核銷：</span>
                <button
                  type="button"
                  onClick={handleSimulateScanOnSite}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  現場助教一鍵核銷
                </button>
              </div>
            </div>
          ) : (
            /* Scan Onsite / Enter code */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  實體教室簽到驗證
                </div>
                <p className="text-[11px] text-emerald-700">
                  請輸入教室大螢幕投影之「4位數簽到驗證碼」或點擊下方按鈕模擬相機掃碼。
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    現場 4 位數簽到驗證碼 (預設範例: 8888 或 2026)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="請輸入 4 位數驗證碼"
                    className="w-full px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  送出驗證並簽到
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px]">或使用相機掃描</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleSimulateScanOnSite}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Scan className="w-4 h-4 text-emerald-600" />
                模擬相機掃描教室大螢幕 QR Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
