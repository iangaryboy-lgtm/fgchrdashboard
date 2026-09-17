import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileDown,
  Printer,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { exportElementToPdf, ExportPdfOptions, collectAllAppStyles } from '../../utils/pdfExport';
import { PdfPrintPreviewModal } from './PdfPrintPreviewModal';

export interface A3PrintPdfControllerProps {
  /** Target HTML Element ID to print / export */
  targetElementId: string;
  /** Document Title for the report */
  documentTitle: string;
  /** Subtitle / Metadata */
  subtitle?: string;
  /** Current Data Base Date or active filters description */
  baseDate?: string;
  /** Optional custom button label (defaults to '匯出PDF') */
  buttonLabel?: string;
  /** Visual button style */
  variant?: 'rose' | 'blue' | 'amber' | 'compact';
  /** Extra export options for direct PDF download */
  pdfOptions?: Partial<ExportPdfOptions>;
  /** Optional format badge */
  showBadge?: boolean;
}

export const A3PrintPdfController: React.FC<A3PrintPdfControllerProps> = ({
  targetElementId,
  documentTitle,
  subtitle,
  baseDate,
  buttonLabel = '匯出PDF',
  variant = 'rose',
  pdfOptions,
  showBadge = false,
}) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const buttonRef = useRef<HTMLDivElement>(null);
  const formattedFilename = `${documentTitle.replace(/\s+/g, '_')}_A3橫式_${baseDate || new Date().toISOString().slice(0, 10)}`;

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const getTargetElement = (): HTMLElement | null => {
    return (
      document.getElementById(targetElementId) ||
      document.getElementById('print-content-container') ||
      document.getElementById(targetElementId.replace('-content', '-root')) ||
      document.getElementById(targetElementId.replace('-root', '-content')) ||
      (document.querySelector(`[id*="${targetElementId}"]`) as HTMLElement | null)
    );
  };

  /**
   * Action 1: Direct Client-Side A3 PDF Download (Primary Action)
   */
  const handleDirectPdfDownload = async () => {
    setIsExporting(true);
    setToastMessage({ text: '正在擷取高解析 A3 橫向畫面並防斷頁分頁中...', type: 'info' });

    // Allow UI to settle
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const resolvedEl = getTargetElement();
      if (!resolvedEl) {
        throw new Error(`找不到儀表板元素: ${targetElementId}`);
      }

      const success = await exportElementToPdf(resolvedEl, {
        filename: formattedFilename,
        title: documentTitle,
        subtitle: subtitle || `資料基礎日：${baseDate || '今日'} · 內部決策專用`,
        landscape: true,
        paperSize: 'a3',
        fixedWidth: 1584,
        ...pdfOptions,
      });

      if (success) {
        setToastMessage({ text: 'A3 橫式 PDF 檔案已下載完成！', type: 'success' });
      } else {
        setToastMessage({
          text: '直接匯出未完成，請點擊下拉箭頭改用「瀏覽器原生列印」或「新分頁預覽」。',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setToastMessage({
        text: '直接匯出失敗，請點擊下拉箭頭改用「瀏覽器原生列印」或「新分頁預覽」。',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Action 2: Browser Native A3 Print / Save as PDF
   */
  const handleNativePrint = async () => {
    setToastMessage({ text: '正在喚起瀏覽器原生 A3 橫式列印視窗 (已套用版面最佳化)...', type: 'info' });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const originalTitle = document.title;
    document.title = formattedFilename;

    document.body.classList.add('print-layout-optimized-mode');
    const targetEl = getTargetElement();
    if (targetEl) {
      targetEl.classList.add('print-dashboard-container');
    }

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print error:', err);
      } finally {
        setTimeout(() => {
          document.body.classList.remove('print-layout-optimized-mode');
          document.title = originalTitle;
          setToastMessage({
            text: '若需儲存為 PDF，請在列印對話框中將目標印表機選擇為「另存為 PDF」。',
            type: 'success',
          });
        }, 800);
      }
    }, 150);
  };

  /**
   * Action 3: Isolated Popout Print Window
   * Clones target element into a clean, standalone popup window with all CSS styles,
   * completely stripped of all interactive controls, buttons, toolbars, and modals.
   */
  const handlePopoutPrint = async () => {
    setToastMessage({ text: '正在開啟純淨 A3 橫向獨立列印視窗...', type: 'info' });

    await new Promise((resolve) => setTimeout(resolve, 80));

    const targetEl = getTargetElement();
    if (!targetEl) {
      alert('找不到指定的儀表板區塊，請確認頁面已完全載入。');
      return;
    }

    // Clone element
    const cloned = targetEl.cloneNode(true) as HTMLElement;

    // Purge action controls, sliders, toolbars, non-print elements while preserving data stat buttons
    cloned
      .querySelectorAll(
        '.no-print, .print-hide, .hidden-for-pdf, [data-html2canvas-ignore="true"], .fixed, [role="dialog"], [role="menu"], input:not([type="checkbox"]), select, textarea, button.no-print, button.print-hide, button.print-action-btn, #btn-export-excel, #btn-prev-quarter, #btn-next-quarter, #quarter-timeline-slider'
      )
      .forEach((el) => {
        el.remove();
      });

    // Expand all inner scroll containers so nothing is clipped
    cloned
      .querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto, .overflow-auto')
      .forEach((el) => {
        el.style.overflow = 'visible';
        el.style.maxHeight = 'none';
        el.style.height = 'auto';
      });

    const printWin = window.open('', '_blank', 'width=1600,height=1000');
    if (!printWin) {
      alert('瀏覽器阻擋了快顯視窗，請允許開啟快顯視窗以使用獨立列印功能。');
      return;
    }

    // Collect all stylesheet links, style tags, and inlined Tailwind rules from current document
    const inlinedStyles = await collectAllAppStyles();
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <title>${formattedFilename}</title>
          ${styleTags}
          <style id="inlined-app-bundle-styles">
            ${inlinedStyles}
          </style>
          <style>
            @page {
              size: A3 landscape;
              margin: 10mm 8mm 18mm 8mm;
            }
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              width: 1540px !important;
              margin: 0 auto !important;
              padding: 16px !important;
              background-color: #F8FAFC !important;
              font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif !important;
              font-size: 12px !important;
            }
            .no-print, .print-hide, button {
              display: none !important;
            }
            [data-pdf-block="true"], .pdf-block, .bg-white.rounded-xl, .bg-white.rounded-2xl, tr, figure, .grid > div {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
            }
            table {
              page-break-inside: auto !important;
              break-inside: auto !important;
              width: 100% !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .print-action-bar {
              position: sticky;
              top: 0;
              z-index: 9999;
              background: #0B132B;
              color: white;
              padding: 10px 20px;
              border-radius: 8px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            @media print {
              .print-action-bar {
                display: none !important;
              }
              body {
                padding: 0 !important;
                background: white !important;
              }
            }
            .print-header-banner {
              background: #0B132B;
              color: white;
              padding: 10px 16px;
              border-radius: 8px;
              margin-bottom: 14px;
              border-bottom: 4px solid #D97706;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="print-action-bar no-print">
            <div style="font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px;">
              <span>遠雄營造 A3 橫式列印專用預覽</span>
              <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px;">
                紙張已鎖定：A3 橫向 (420mm × 297mm)
              </span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.print()" style="background: #E11D48; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                立即列印 / 存為 PDF
              </button>
              <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                關閉視窗
              </button>
            </div>
          </div>

          <div class="print-header-banner">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #F59E0B; color: #0F172A; font-weight: 900; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
                  A3 橫向決策專用
                </span>
                <span style="font-size: 15px; font-weight: 900;">${documentTitle}</span>
              </div>
              <div style="font-size: 11px; color: #CBD5E1; margin-top: 4px;">
                ${subtitle || `資料基礎日：${baseDate || '今日'} · 內部管理專用`}
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #94A3B8;">
              <div>遠雄營造 HR MASTER Pro 決策戰情室</div>
              <div style="color: #FBBF24; font-size: 10px; margin-top: 2px;">
                防腰斬切斷機制：已啟用 CSS break-inside: avoid
              </div>
            </div>
          </div>

          <div id="print-root">
            ${cloned.outerHTML}
          </div>

          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
              }, 400);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Button style classes
  const mainBtnColor =
    variant === 'rose'
      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white'
      : variant === 'amber'
      ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white'
      : variant === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300';

  return (
    <>
      {/* 匯出PDF 按鈕：直接執行檢視截斷點與版面遮罩 (已結合列印版面最佳化，無多餘選項) */}
      <div
        ref={buttonRef}
        data-html2canvas-ignore="true"
        className="no-print inline-flex items-center select-none"
      >
        <button
          type="button"
          id={`btn-direct-download-${targetElementId}`}
          onClick={() => setIsPreviewModalOpen(true)}
          disabled={isExporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer ${mainBtnColor}`}
          title="開啟檢視截斷點與版面遮罩 (結合列印版面最佳化與防腰斬保護)"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>產生 PDF 中...</span>
            </>
          ) : (
            <>
              <FileDown className="w-3.5 h-3.5" />
              <span>{buttonLabel}</span>
              {showBadge && (
                <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-mono bg-black/20 text-white/90 font-medium">
                  A3橫向
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* PDF 列印排版與截斷點檢測遮罩模式 (PdfPrintPreviewModal) */}
      <PdfPrintPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        targetElementId={targetElementId}
        documentTitle={documentTitle}
        subtitle={subtitle}
        baseDate={baseDate}
        pdfOptions={pdfOptions}
        onNativePrint={handleNativePrint}
      />

      {/* Floating Status Toast Portaled to document.body (Never appears in captures or print) */}
      {toastMessage &&
        createPortal(
          <div
            data-html2canvas-ignore="true"
            className="no-print fixed bottom-5 right-5 z-[99999] max-w-sm flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700 backdrop-blur-xs text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {toastMessage.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <X className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="leading-snug">{toastMessage.text}</span>
          </div>,
          document.body
        )}
    </>
  );
};
