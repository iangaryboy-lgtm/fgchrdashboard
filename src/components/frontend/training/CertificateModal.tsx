import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Download, Printer, ShieldCheck, X, Check, Loader2, Sparkles, FileCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CourseEnrollment, InternalCourse } from '../../../types';
import { collectAllAppStyles } from '../../../utils/pdfExport';

interface CertificateModalProps {
  enrollment: CourseEnrollment;
  course?: InternalCourse;
  onClose: () => void;
  autoDownload?: boolean;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  enrollment,
  course,
  onClose,
  autoDownload = false,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const certNumber =
    enrollment.certificateNumber ||
    enrollment.certificateCode ||
    `FG-CERT-2026-${enrollment.empNo?.slice(-3) || '999'}${enrollment.id.slice(-3)}`;
  const issueDate = enrollment.completedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const qrVerifyUrl = `https://farglory.com.tw/verify/cert/${certNumber}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setDownloadSuccess(false);

      // Wait a tick to ensure SVG QR is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 200));

      const allCss = await collectAllAppStyles();

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5, // High-resolution export
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          if (allCss.trim()) {
            const style = clonedDoc.createElement('style');
            style.textContent = allCss;
            (clonedDoc.head || clonedDoc.documentElement).appendChild(style);
          }
        },
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      // Landscape A4 certificate (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Fit with small margin
      const margin = 8;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = pdfHeight - margin * 2;

      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);

      const fileName = `遠雄營造_結業證書_${enrollment.empName || '學員'}_${enrollment.courseTitle?.replace(/[\/\\:*?"<>|]/g, '_') || '專業研習'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('產生 PDF 結業證書時發生問題，請直接使用「列印」功能儲存為 PDF。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Auto trigger download if requested
  React.useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        {/* Header bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                遠雄營造 專業職能電子完訓證書
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-medium">
                  PDF 官方數位防偽簽章
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">證書字號：{certNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
              title="列印證書"
            >
              <Printer className="w-3.5 h-3.5" />
              列印
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-amber-50/40 flex items-center justify-center">
          <div
            ref={certificateRef}
            className="w-full bg-white border-8 border-double border-amber-700/70 p-8 rounded-2xl shadow-xl relative overflow-hidden text-center space-y-6"
            style={{ minHeight: '460px' }}
          >
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-700/80" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-700/80" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-700/80" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-700/80" />

            {/* Watermark bg logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-96 h-96 text-slate-900" />
            </div>

            {/* Title banner */}
            <div className="space-y-1 relative z-10">
              <div className="text-xs tracking-[0.25em] font-serif font-black text-slate-900 uppercase">
                FARGLORY CONSTRUCTION CO., LTD.
              </div>
              <div className="text-[11px] tracking-widest text-amber-800 font-bold">
                遠雄營造股份有限公司 · 培育發展學院
              </div>
              <h1 className="text-3xl font-black font-serif text-slate-950 pt-2 tracking-widest">
                結 業 證 書
              </h1>
              <p className="text-[10px] tracking-widest text-slate-400 font-mono">
                CERTIFICATE OF COMPLETION & PROFESSIONAL QUALIFICATION
              </p>
            </div>

            {/* Body Text */}
            <div className="space-y-3 py-2 text-slate-800 text-xs leading-relaxed max-w-xl mx-auto relative z-10">
              <p className="text-sm">
                茲證明同仁 <strong className="text-base text-slate-950 font-black underline underline-offset-4 decoration-amber-600">{enrollment.empName || '同仁'}</strong> 先生/女士
                （工號：<span className="font-mono font-bold text-slate-900">{enrollment.empNo}</span>）
              </p>
              <div className="text-slate-700 space-y-1">
                <p>
                  於 <strong className="text-slate-950 font-bold">{issueDate}</strong> 圓滿修畢
                </p>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-center my-2">
                  <span className="font-black text-indigo-950 text-base block font-serif tracking-wide">
                    「{enrollment.courseTitle}」
                  </span>
                  <div className="text-[11px] text-slate-600 font-medium mt-1">
                    課程代碼：{course?.courseCode || 'FG-TC-2026'} · 類別：{course?.categoryName || enrollment.trainingCategory || '工程專業技術'}
                  </div>
                </div>
                <p>
                  全案訓練總時數共計 <strong className="text-slate-950">{course?.hours || 4} 小時</strong>，核發職能學分 <strong className="text-slate-950">{course?.credits || 4} 點</strong>。經各章節影音研習、課堂互動及成果測驗評核成績及格，特頒此證以資表彰與證明。
                </p>
              </div>
            </div>

            {/* Seal and Signatures */}
            <div className="pt-4 border-t border-amber-200/80 grid grid-cols-3 items-end text-xs relative z-10">
              {/* Left: Certificate Metadata */}
              <div className="text-left space-y-1">
                <div className="text-[10px] text-slate-400">證書驗證編號：</div>
                <div className="font-mono font-bold text-slate-800 text-[11px]">{certNumber}</div>
                <div className="text-[10px] text-slate-400">核發日期：{issueDate}</div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  公司中央履歷數位連線查驗合格
                </div>
              </div>

              {/* Middle: Red Official Stamp / Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-22 h-22 rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center font-serif text-[10px] font-black p-1 rotate-[-5deg] shadow-sm select-none bg-red-50/30">
                  <span className="tracking-widest">遠雄營造</span>
                  <span className="text-[9px] scale-90">培育發展學院</span>
                  <span className="text-[8px] scale-75 text-red-700">★ 認證合格章 ★</span>
                </div>
              </div>

              {/* Right: QR Verification */}
              <div className="flex flex-col items-end space-y-1">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <QRCodeSVG value={qrVerifyUrl} size={60} level="M" />
                </div>
                <span className="text-[9px] text-slate-400">掃描 QR Code 線上查驗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            已即時同步登載於學員個人「專業訓練歷程」與職能發展資料庫
          </span>

          <div className="flex items-center gap-2.5">
            {downloadSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                PDF 下載完成！
              </span>
            )}

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                isGeneratingPdf
                  ? 'bg-amber-400 text-slate-900 cursor-wait'
                  : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  產生高畫質 PDF 檔中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  下載正式 PDF 完訓證書
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

