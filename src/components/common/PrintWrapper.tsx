import React, { useEffect, useId, forwardRef } from 'react';

export interface PrintWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  /** Document Title when printed */
  documentTitle?: string;
}

/**
 * PrintWrapper - 專用儀表板列印隔離與樣式注入包裝器
 *
 * 核心功能：
 * 1. 隔離儀表板內部複雜狀態，避免干擾全域系統列印樣式
 * 2. 於列印觸發 (beforeprint) 時自動動態注入專屬 @media print 樣式，鎖定寬度為 A3 橫向 (1480px)
 * 3. 確保所有的儀表板卡片 (div.bg-white) 具備 break-inside: avoid-page 與 display: inline-block
 * 4. 列印時嚴格隱藏側邊欄、頂端功能列、浮動視窗、彈窗遮罩與按鈕，確保僅有當前儀表板內容被輸出
 */
export const PrintWrapper = forwardRef<HTMLDivElement, PrintWrapperProps>(
  (
    {
      children,
      id = 'print-content-container',
      className = '',
      documentTitle,
    },
    ref
  ) => {
    const styleId = useId().replace(/:/g, '-');

    useEffect(() => {
      // 注入專屬隔離樣式，確保不受任何外層狀態或全域樣式污染
      const existingStyle = document.getElementById(`style-print-wrapper-${styleId}`);
      if (!existingStyle) {
        const styleEl = document.createElement('style');
        styleEl.id = `style-print-wrapper-${styleId}`;
        styleEl.innerHTML = `
          @media print {
            @page {
              size: A3 landscape;
              margin: 10mm 8mm 18mm 8mm;
            }

            /* 確保目標容器為唯一強制顯式呈現的主體 */
            #${id} {
              display: block !important;
              visibility: visible !important;
              width: 1480px !important;
              min-width: 1480px !important;
              max-width: 1480px !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: visible !important;
              position: static !important;
              background: transparent !important;
            }

            /* 所有儀表板卡片與區塊防斷頁與緩衝空間 (排除表格標籤) */
            #${id} div.bg-white:not(tr):not(td),
            #${id} .bg-white.rounded-xl:not(tr),
            #${id} .bg-white.rounded-2xl:not(tr),
            #${id} .pdf-block-avoid:not(tr):not(thead):not(tbody):not(td):not(th),
            #${id} [data-pdf-block="true"]:not(tr):not(tbody):not(thead) {
              break-inside: avoid-page !important;
              page-break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              display: inline-block !important;
              width: 100% !important;
              margin-top: 0 !important;
              margin-bottom: 20px !important;
              padding-bottom: 8px !important;
              box-sizing: border-box !important;
            }

            /* 表格防腰斬與跨頁平滑過渡 */
            #${id} table {
              border-collapse: collapse !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
              width: 100% !important;
              margin-top: 4px !important;
              margin-bottom: 16px !important;
            }

            #${id} thead {
              display: table-header-group !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid-page !important;
            }

            #${id} tbody {
              display: table-row-group !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
            }

            #${id} tr.pdf-block-avoid,
            #${id} .pdf-block-avoid tr,
            #${id} tr {
              display: table-row !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              break-after: auto !important;
              break-before: auto !important;
              height: auto !important;
            }

            #${id} td,
            #${id} th,
            #${id} tr.pdf-block-avoid > td,
            #${id} tr.pdf-block-avoid > th {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              padding-top: 8px !important;
              padding-bottom: 8px !important;
              vertical-align: middle !important;
            }

            /* 隱藏可能存在的任何浮動視窗、遮罩、彈窗或選單 */
            .fixed,
            [role="dialog"],
            [role="menu"],
            .backdrop-blur-xs,
            .backdrop-blur-sm,
            .backdrop-blur,
            aside,
            nav,
            header,
            .no-print,
            .print-hide {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
          }
        `;
        document.head.appendChild(styleEl);
      }

      // 監聽列印事件以設置自訂標題與狀態標記
      const handleBeforePrint = () => {
        document.body.classList.add('print-mode-active');
        if (documentTitle) {
          document.body.setAttribute('data-original-title', document.title);
          document.title = documentTitle;
        }
      };

      const handleAfterPrint = () => {
        document.body.classList.remove('print-mode-active');
        const orig = document.body.getAttribute('data-original-title');
        if (orig) {
          document.title = orig;
          document.body.removeAttribute('data-original-title');
        }
      };

      window.addEventListener('beforeprint', handleBeforePrint);
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
        const styleEl = document.getElementById(`style-print-wrapper-${styleId}`);
        if (styleEl) {
          styleEl.remove();
        }
      };
    }, [id, styleId, documentTitle]);

    return (
      <div ref={ref} id={id} className={`print-wrapper w-full ${className}`}>
        {children}
      </div>
    );
  }
);

PrintWrapper.displayName = 'PrintWrapper';

