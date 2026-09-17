import html2canvasPro from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  landscape?: boolean;
  paperSize?: 'a3' | 'a4';
  fixedWidth?: number; // Fixed layout width in px (default 1584px for A3 landscape)
  blockSelector?: string; // Optional custom selector for page-break boundary blocks
}

export interface PdfCutPointInfo {
  pageIndex: number; // 0, 1, 2...
  cutY: number;      // canvas Y
  domY: number;      // DOM Y relative to targetElement top
  reason: string;    // Human-readable explanation of how the cut point was selected
  isCleanCut: boolean;
}

export interface PdfCardBlock {
  id: string;
  title: string;
  isRow: boolean;
  top: number;       // DOM top px relative to targetElement
  bottom: number;    // DOM bottom px relative to targetElement
  height: number;    // DOM height px
  startY: number;    // Canvas top px
  endY: number;      // Canvas bottom px
  pageIndex: number; // 0-indexed page number where this block resides
  el?: HTMLElement;
}

export interface MagneticSnapResult {
  snappedY: number;
  snappedDomY: number;
  card: PdfCardBlock;
  position: 'top' | 'bottom';
  label: string;
}

export interface PdfPagePreview {
  pageNumber: number;
  startSliceY: number;
  endSliceY: number;
  sliceHeight: number;
  dataUrl: string;       // Sliced content canvas
  a3DataUrl: string;     // Complete A3 page preview with header & footer
  heightMm: number;
  startDomY: number;
  endDomY: number;
}

export interface PdfLayoutAnalysis {
  canvas: HTMLCanvasElement;
  fullCanvasDataUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  domWidth: number;
  domHeight: number;
  scale: number;
  cutPoints: number[]; // Canvas Y cut coordinates
  domCutPoints: number[]; // DOM Y cut coordinates
  defaultCutPoints: number[]; // Initial smart calculated cut points for reset
  cutPointInfos: PdfCutPointInfo[];
  cards: PdfCardBlock[]; // Identified discrete dashboard cards and blocks
  totalPages: number;
  pages: PdfPagePreview[];
  filename: string;
  title: string;
  subtitle: string;
  paperSize: 'a3' | 'a4';
  landscape: boolean;
  contentWidthMm: number;
  headerHeightMm: number;
  footerHeightMm: number;
  marginMm: number;
  targetElement: HTMLElement;
  maxPageHeightCanvas: number;
  maxPageHeightDom: number;
}

/**
 * Resolve target element from an ID string or HTMLElement reference
 */
export function resolveTargetElement(elementIdOrElement: string | HTMLElement): HTMLElement | null {
  if (typeof elementIdOrElement !== 'string') return elementIdOrElement;

  return (
    document.getElementById(elementIdOrElement) ||
    document.getElementById('print-content-container') ||
    document.getElementById(elementIdOrElement.replace('-content', '-root')) ||
    document.getElementById(elementIdOrElement.replace('-root', '-content')) ||
    (document.querySelector(`[id*="${elementIdOrElement}"]`) as HTMLElement | null)
  );
}

/**
 * Creates the Chinese-rendered header banner canvas element
 */
export function createHeaderCanvasElement(
  title: string,
  subtitle: string
): HTMLCanvasElement | null {
  const hCanvas = document.createElement('canvas');
  const scale = 2;
  hCanvas.width = 1600 * scale;
  hCanvas.height = 56 * scale;
  const ctx = hCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);

  // Background Navy
  ctx.fillStyle = '#0B132B';
  ctx.fillRect(0, 0, 1600, 56);

  // Amber bottom accent line
  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 52, 1600, 4);

  // Logo / Brand
  ctx.font = 'bold 15px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('FARGLORY | HR MASTER Pro', 16, 26);

  // Title
  ctx.font = 'bold 13px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#E2E8F0';
  const headerTitle = title.length > 45 ? title.slice(0, 45) + '...' : title;
  ctx.fillText(`· ${headerTitle}`, 260, 26);

  // Timestamp
  ctx.font = '11px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#CBD5E1';
  ctx.textAlign = 'right';
  const dateStr =
    new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
    ' ' +
    new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`機密文件 · ${dateStr}`, 1584, 26);

  // Subtitle
  ctx.font = '11px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'left';
  ctx.fillText(subtitle, 16, 44);

  return hCanvas;
}

/**
 * Creates the Chinese-rendered header banner canvas Data URL
 */
export function createHeaderCanvas(
  title: string,
  subtitle: string
): string | null {
  const canvas = createHeaderCanvasElement(title, subtitle);
  return canvas ? canvas.toDataURL('image/png') : null;
}

/**
 * Creates the Chinese-rendered footer bar canvas element
 */
export function createFooterCanvasElement(
  pageNum: number,
  totalPages: number
): HTMLCanvasElement | null {
  const fCanvas = document.createElement('canvas');
  const scale = 2;
  fCanvas.width = 1600 * scale;
  fCanvas.height = 28 * scale;
  const ctx = fCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);

  // Top divider line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(1600, 2);
  ctx.stroke();

  // Disclaimer text
  ctx.font = '10px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText('本文件僅供遠雄營造內部管理決策與專案會議使用，未經授權嚴禁外流或拷貝。', 4, 18);

  // Page number
  ctx.font = 'bold 11px "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'right';
  ctx.fillText(`第 ${pageNum} 頁 / 共 ${totalPages} 頁`, 1584, 18);

  return fCanvas;
}

/**
 * Creates the Chinese-rendered footer bar canvas Data URL
 */
export function createFooterCanvas(
  pageNum: number,
  totalPages: number
): string | null {
  const canvas = createFooterCanvasElement(pageNum, totalPages);
  return canvas ? canvas.toDataURL('image/png') : null;
}

let cachedCollectedCss: string | null = null;

/**
 * Collects and compiles all CSS stylesheets present in the document.
 * In production Vite builds, CSS is bundled into external files like `/assets/index-[hash].css`.
 * When html2canvas creates an isolated iframe, these external stylesheets fail to load synchronously,
 * causing the exported PDF or preview canvas to lose all Tailwind styles.
 * By extracting and inlining the CSS rules, we guarantee 100% style retention in both dev and production.
 */
export async function collectAllAppStyles(): Promise<string> {
  if (cachedCollectedCss && cachedCollectedCss.length > 500) {
    return cachedCollectedCss;
  }

  const cssChunks: string[] = [];

  // 1. Read directly from document.styleSheets
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules && sheet.cssRules.length > 0) {
          let sheetCss = '';
          for (let j = 0; j < sheet.cssRules.length; j++) {
            sheetCss += sheet.cssRules[j].cssText + '\n';
          }
          if (sheetCss.trim()) {
            cssChunks.push(sheetCss);
            continue;
          }
        }
      } catch {
        // Cross-origin SecurityError or locked stylesheet
      }

      // If cssRules was inaccessible and sheet has href, fetch it
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          if (res.ok) {
            const text = await res.text();
            cssChunks.push(text);
          }
        } catch {
          // Ignore fetch errors for external CDNs
        }
      }
    }
  } catch (e) {
    console.warn('Error reading document.styleSheets:', e);
  }

  // 2. Inline <style> tags in document.head or body
  try {
    const styleTags = document.querySelectorAll('style');
    styleTags.forEach((s) => {
      if (s.id !== '__pdf_export_inlined_styles__' && s.textContent && s.textContent.trim()) {
        cssChunks.push(s.textContent);
      }
    });
  } catch {}

  // 3. Check for any <link rel="stylesheet"> that wasn't included yet
  try {
    const linkTags = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    for (const link of Array.from(linkTags)) {
      if (link.href && !cssChunks.some((chunk) => chunk.includes(link.href))) {
        try {
          const res = await fetch(link.href);
          if (res.ok) {
            const text = await res.text();
            cssChunks.push(text);
          }
        } catch {
          // Ignore
        }
      }
    }
  } catch {}

  const result = cssChunks.join('\n\n');
  if (result.trim().length > 100) {
    cachedCollectedCss = result;
  }
  return result;
}

/**
 * Extracts a descriptive, human-readable title for a detected card or table block
 */
export function extractCardTitle(el: HTMLElement, isRow: boolean, index: number): string {
  if (isRow) {
    const cells = el.querySelectorAll('td, th');
    const text = (cells[1]?.textContent || cells[0]?.textContent || '').trim();
    if (text) {
      return text.length > 24 ? text.slice(0, 24) + '...' : text;
    }
    return `資料第 ${index + 1} 列`;
  }

  // Check known dashboard sections first
  const fullText = (el.innerText || el.textContent || '').slice(0, 300);
  if (fullText.includes('開案計畫 儀表板') || (fullText.includes('開案計畫') && fullText.includes('資料基礎日'))) {
    return '開案計畫 標頭與篩選控制器';
  }
  if (fullText.includes('待遴選案場') && (fullText.includes('待開案年度') || fullText.includes('C-45'))) {
    return '待遴選案場核心指標與開案年度';
  }
  if (fullText.includes('工程時程分佈矩陣') || fullText.includes('時程分佈矩陣')) {
    return '工程時程分佈矩陣看板';
  }
  if (fullText.includes('工程類型統計')) {
    return '工程類型統計 (住宅/廠辦/商辦/專案)';
  }
  if (fullText.includes('六都建築統計') || fullText.includes('六都工程分佈')) {
    return '六都建築統計看板';
  }
  if (
    fullText.includes('開案計畫與遴選倒數清冊') ||
    fullText.includes('待遴選專案清冊') ||
    fullText.includes('待遴選案場清冊') ||
    fullText.includes('專案代碼')
  ) {
    return '開案計畫與遴選倒數清冊資料清單';
  }
  if (fullText.includes('案主管供需 核心戰情') || fullText.includes('主管供需現況')) {
    return '案主管供需現況戰情指標';
  }
  if (fullText.includes('季度主管供需甘特圖') || fullText.includes('季度時程甘特圖')) {
    return '季度主管供需甘特圖與時程矩陣';
  }
  if (fullText.includes('候選人才戰情') || fullText.includes('人才庫')) {
    return '候選人才戰情看板';
  }

  // Heading check
  const heading = el.querySelector('h1, h2, h3, h4, [role="heading"]');
  if (heading && heading.textContent?.trim()) {
    const text = heading.textContent.trim().replace(/\s+/g, ' ');
    return text.length > 26 ? text.slice(0, 26) + '...' : text;
  }

  // Strong / bold text check
  const boldSpan = el.querySelector('.font-bold, .font-extrabold');
  if (boldSpan && boldSpan.textContent?.trim()) {
    const text = boldSpan.textContent.trim().replace(/\s+/g, ' ');
    if (text.length > 2 && text.length < 28) {
      return text;
    }
  }

  return `卡片看板區塊 #${index + 1}`;
}

/**
 * Searches for the nearest magnetic snapping point (card top or bottom gap)
 */
export function findMagneticSnapPoint(
  canvasY: number,
  cards: PdfCardBlock[],
  scale: number,
  thresholdPx: number = 36
): MagneticSnapResult | null {
  if (!cards || cards.length === 0) return null;
  const thresholdCanvas = thresholdPx * scale;
  let closest: MagneticSnapResult | null = null;
  let minDiff = Infinity;

  // Major cards take priority over individual small table rows
  const majorCards = cards.filter((c) => !c.isRow);
  const targetList = majorCards.length > 0 ? majorCards : cards;

  for (const card of targetList) {
    // 1. Snapping to top of card (card cleanly moves to next page)
    const topGap = Math.max(0, card.startY - 10);
    const diffTop = Math.abs(canvasY - topGap);
    if (diffTop <= thresholdCanvas && diffTop < minDiff) {
      minDiff = diffTop;
      closest = {
        snappedY: topGap,
        snappedDomY: Math.round(topGap / scale),
        card,
        position: 'top',
        label: `磁吸對齊：【${card.title}】頂部（卡片自動整塊移至下一頁）`,
      };
    }

    // 2. Snapping to bottom of card (card stays fully on current page)
    const bottomGap = card.endY + 10;
    const diffBottom = Math.abs(canvasY - bottomGap);
    if (diffBottom <= thresholdCanvas && diffBottom < minDiff) {
      minDiff = diffBottom;
      closest = {
        snappedY: bottomGap,
        snappedDomY: Math.round(bottomGap / scale),
        card,
        position: 'bottom',
        label: `磁吸對齊：【${card.title}】底部（卡片保留於本頁完整呈現）`,
      };
    }
  }

  return closest;
}

/**
 * Automatically adjusts all existing cut points so they magnetically align with card gaps
 */
export function autoSnapCutPointsToCards(analysis: PdfLayoutAnalysis): number[] {
  const { cutPoints, cards, scale, canvasHeight } = analysis;
  if (!cards || cards.length === 0 || cutPoints.length <= 2) return cutPoints;

  const newCuts: number[] = [0];

  for (let i = 1; i < cutPoints.length - 1; i++) {
    const rawCut = cutPoints[i];
    const snap = findMagneticSnapPoint(rawCut, cards, scale, 75);
    if (snap) {
      newCuts.push(snap.snappedY);
    } else {
      let bestY = rawCut;
      let minGapDiff = Infinity;
      for (const card of cards.filter((c) => !c.isRow)) {
        const topDiff = Math.abs(card.startY - 10 - rawCut);
        if (topDiff < minGapDiff) {
          minGapDiff = topDiff;
          bestY = Math.max(0, card.startY - 10);
        }
        const bottomDiff = Math.abs(card.endY + 10 - rawCut);
        if (bottomDiff < minGapDiff) {
          minGapDiff = bottomDiff;
          bestY = card.endY + 10;
        }
      }
      newCuts.push(bestY);
    }
  }

  newCuts.push(canvasHeight);
  return Array.from(new Set(newCuts)).sort((a, b) => a - b);
}

/**
 * Analyzes the layout of targetElement, computes cut points avoiding block/row breaks,
 * and generates page previews for the preview overlay modal.
 */
export async function analyzePdfLayout(
  elementIdOrElement: string | HTMLElement,
  options: ExportPdfOptions = {}
): Promise<PdfLayoutAnalysis> {
  const targetElement = resolveTargetElement(elementIdOrElement);

  if (!targetElement) {
    console.error('Target element not found for PDF layout analysis:', elementIdOrElement);
    throw new Error('找不到欲匯出之儀表板畫面區塊');
  }

  const {
    filename = `遠雄營造_人資戰情報告_${new Date().toISOString().slice(0, 10)}`,
    title = '遠雄營造 HR MASTER Pro 決策戰情報告',
    subtitle = `匯出日期：${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} · 內部決策專用`,
    landscape = true,
    paperSize = 'a3',
    fixedWidth = 1584,
  } = options;

  // Store original element styles to restore afterwards
  const originalWidth = targetElement.style.width;
  const originalMinWidth = targetElement.style.minWidth;
  const originalMaxWidth = targetElement.style.maxWidth;
  const originalOverflow = targetElement.style.overflow;
  const originalHeight = targetElement.style.height;
  const originalMaxHeight = targetElement.style.maxHeight;
  let savedInnerStyles: { el: HTMLElement; overflow: string; maxHeight: string; height: string }[] = [];

  try {
    // 1. Temporarily apply fixed A3 width and remove scroll/height clipping
    targetElement.classList.add('pdf-measuring-mode');
    document.body.classList.add('print-layout-optimized-mode');
    targetElement.style.width = `${fixedWidth}px`;
    targetElement.style.minWidth = `${fixedWidth}px`;
    targetElement.style.maxWidth = `${fixedWidth}px`;
    targetElement.style.overflow = 'visible';
    targetElement.style.maxHeight = 'none';
    targetElement.style.height = 'auto';

    // Also expand any internal scroll containers inside targetElement during measurement
    const internalScrollables = Array.from(
      targetElement.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-x-auto, .overflow-auto')
    );
    savedInnerStyles = internalScrollables.map((el) => ({
      el,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    }));
    internalScrollables.forEach((el) => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
    });

    // Allow browser layout to settle at the fixed width
    await new Promise((resolve) => setTimeout(resolve, 80));

    const rootRect = targetElement.getBoundingClientRect();

    // 2. Scan and identify discrete blocks that should NOT be split across pages
    const tableRows = Array.from(
      targetElement.querySelectorAll<HTMLElement>('table tbody tr, tr.pdf-block-avoid')
    );

    const potentialCards = Array.from(
      targetElement.querySelectorAll<HTMLElement>(
        '.pdf-block-avoid, [data-pdf-block="true"], .pdf-block, .print-avoid-break, .bg-white.rounded-xl, .bg-white.rounded-2xl'
      )
    ).filter((el) => {
      if (el.tagName === 'TR' || el.tagName === 'TBODY' || el.tagName === 'THEAD' || el.tagName === 'TABLE') {
        return false;
      }
      const rowsInside = el.querySelectorAll('tbody tr');
      if (rowsInside.length > 1) {
        return false;
      }
      return true;
    });

    const measuredBlocks = [
      ...potentialCards.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          isRow: false,
          top: r.top - rootRect.top,
          bottom: r.bottom - rootRect.top,
          height: r.height,
        };
      }),
      ...tableRows.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          isRow: true,
          top: r.top - rootRect.top,
          bottom: r.bottom - rootRect.top,
          height: r.height,
        };
      }),
    ]
      .filter((b) => b.height > 12)
      .sort((a, b) => a.top - b.top);

    // 3. Collect and inline all styles to ensure 100% CSS retention in production (Vite bundles)
    const allCss = await collectAllAppStyles();
    let tempStyleEl: HTMLStyleElement | null = null;
    if (allCss.trim()) {
      tempStyleEl = document.createElement('style');
      tempStyleEl.id = '__pdf_export_inlined_styles__';
      tempStyleEl.setAttribute('type', 'text/css');
      tempStyleEl.textContent = allCss;
      document.head.appendChild(tempStyleEl);
    }

    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 4. Render element to high-resolution canvas with html2canvas-pro
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvasPro(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#F8FAFC',
        windowWidth: fixedWidth,
        width: fixedWidth,
        ignoreElements: (el: Element) => {
          if (el === targetElement || el.contains(targetElement)) {
            return false;
          }
          if (
            el.classList?.contains('no-print') ||
            el.classList?.contains('print-hide') ||
            el.classList?.contains('guide-panel') ||
            el.classList?.contains('guide-card') ||
            el.getAttribute?.('data-guide-panel') === 'true' ||
            el.getAttribute?.('data-html2canvas-ignore') === 'true'
          ) {
            return true;
          }
          if (!targetElement.contains(el)) {
            if (
              el.getAttribute?.('role') === 'menu' ||
              el.classList?.contains('toast-container')
            ) {
              return true;
            }
          }
          return false;
        },
        onclone: (clonedDoc, clonedElement) => {
          if (!clonedElement) return;

          // Crucial for production: Guarantee all styles are injected synchronously into the clone
          if (allCss.trim()) {
            let cloneStyle = clonedDoc.getElementById('__pdf_export_inlined_styles__');
            if (!cloneStyle) {
              cloneStyle = clonedDoc.createElement('style');
              cloneStyle.id = '__pdf_export_inlined_styles__';
              cloneStyle.setAttribute('type', 'text/css');
              cloneStyle.textContent = allCss;
              (clonedDoc.head || clonedDoc.documentElement).appendChild(cloneStyle);
            }
          }

          // Force standard typography and neutral background
          if (clonedDoc.body) {
            clonedDoc.body.style.backgroundColor = '#F8FAFC';
            clonedDoc.body.style.fontFamily =
              '"Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          }

          clonedElement.style.width = `${fixedWidth}px`;
          clonedElement.style.minWidth = `${fixedWidth}px`;
          clonedElement.style.maxWidth = `${fixedWidth}px`;
          clonedElement.style.overflow = 'visible';
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.height = 'auto';

          let parent = clonedElement.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.overflow = 'visible';
            parent.style.maxHeight = 'none';
            parent = parent.parentElement;
          }

          const ignored = clonedElement.querySelectorAll(
            '.no-print, .print-hide, .guide-panel, .guide-card, [data-guide-panel="true"], [data-html2canvas-ignore="true"]'
          );
          ignored.forEach((el) => el.remove());

          const scrollables = clonedElement.querySelectorAll<HTMLElement>(
            '.overflow-x-auto, .overflow-y-auto, .overflow-auto'
          );
          scrollables.forEach((el) => {
            el.style.overflow = 'visible';
            el.style.maxHeight = 'none';
          });
        },
      });
    } finally {
      if (tempStyleEl) {
        try {
          tempStyleEl.remove();
        } catch {}
      }
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('未能成功擷取畫面圖像');
    }

    // 5. Calculate A3 Landscape Printable Dimensions
    const isA3 = paperSize === 'a3';
    const pdfWidth = isA3 ? (landscape ? 420 : 297) : (landscape ? 297 : 210);
    const pdfHeight = isA3 ? (landscape ? 297 : 420) : (landscape ? 210 : 297);

    const marginMm = 12;
    const contentWidthMm = pdfWidth - marginMm * 2; // 396mm for A3
    const headerHeightMm = 14;
    const footerHeightMm = 8;
    const availableHeightMm = pdfHeight - marginMm * 2 - headerHeightMm - footerHeightMm; // ~251mm for A3

    const domHeight = rootRect.height > 0 ? rootRect.height : canvas.height / 2;
    const canvasScale = canvas.height / domHeight;

    const canvasBlocks = measuredBlocks.map((b) => ({
      ...b,
      startY: b.top * canvasScale,
      endY: b.bottom * canvasScale,
    }));

    const maxPageHeightCanvas = (availableHeightMm / contentWidthMm) * canvas.width;
    const maxPageHeightDom = Math.round(maxPageHeightCanvas / canvasScale);

    // 5. Intelligent Block-Aware Page Cut Calculation
    const cutPoints: number[] = [0];
    const cutPointInfos: PdfCutPointInfo[] = [];
    let currentY = 0;
    let pageCountIndex = 0;

    while (currentY < canvas.height - 20) {
      const idealCutY = currentY + maxPageHeightCanvas;
      if (idealCutY >= canvas.height - 15) {
        cutPoints.push(canvas.height);
        break;
      }

      const intersectingBlocks = canvasBlocks.filter(
        (b) => b.startY < idealCutY && b.endY > idealCutY
      );

      let chosenCutY = idealCutY;
      let foundCleanCut = false;
      let cutReason = '達到單頁 A3 橫向最佳高度';

      const minProgress = Math.max(80, maxPageHeightCanvas * 0.15);

      // Check for atomic cards (charts, stat panels) that straddle idealCutY
      const candidateCards = intersectingBlocks.filter(
        (b) => !b.isRow && b.startY >= currentY + minProgress && (b.endY - b.startY) <= maxPageHeightCanvas
      );

      if (candidateCards.length > 0) {
        candidateCards.sort((a, b) => a.startY - b.startY);
        const cardToAvoid = candidateCards[0];
        if (cardToAvoid.startY - 12 >= currentY + minProgress) {
          chosenCutY = cardToAvoid.startY - 12;
          foundCleanCut = true;
          cutReason = '避開完整資訊卡片/圖表區塊邊界，確保整張卡片移至下一頁完整呈現';
        }
      }

      // Inside a tall table or group: look for table rows (<tr>)
      const targetThreshold = foundCleanCut ? chosenCutY : idealCutY;
      const validFittingRows = canvasBlocks.filter(
        (b) => b.isRow && b.startY >= currentY + 30 && b.endY <= targetThreshold
      );

      if (validFittingRows.length > 0) {
        const lastRow = validFittingRows[validFittingRows.length - 1];
        const cutsThroughRow = canvasBlocks.some(
          (b) => b.isRow && b.startY < targetThreshold && b.endY > targetThreshold
        );
        if (cutsThroughRow || (!foundCleanCut && lastRow.endY >= currentY + minProgress)) {
          chosenCutY = lastRow.endY + 2;
          foundCleanCut = true;
          cutReason = '精確定位於表格資料列（<tr>）縫隙間隔，防止文字或單行跨頁被截斷';
        }
      }

      if (!foundCleanCut) {
        const straddlingRow = canvasBlocks.find(
          (b) => b.isRow && b.startY < idealCutY && b.endY > idealCutY
        );
        if (straddlingRow && straddlingRow.startY >= currentY + minProgress) {
          chosenCutY = straddlingRow.startY - 4;
          foundCleanCut = true;
          cutReason = '避開表格行內文字中線，於該列上方平滑換頁';
        }
      }

      if (chosenCutY <= currentY + 60) {
        chosenCutY = idealCutY;
        cutReason = '頁面安全推進預設邊界';
      }

      const cutFloor = Math.floor(chosenCutY);
      cutPoints.push(cutFloor);

      cutPointInfos.push({
        pageIndex: pageCountIndex,
        cutY: cutFloor,
        domY: Math.round(cutFloor / canvasScale),
        reason: cutReason,
        isCleanCut: foundCleanCut,
      });

      pageCountIndex++;
      currentY = cutFloor;
    }

    const totalPages = cutPoints.length - 1;
    const domCutPoints = cutPoints.map((c) => Math.round(c / canvasScale));

    // 6. Generate Page Previews (Individual Slices & Full A3 Simulated Sheets)
    const headerCanvas = createHeaderCanvasElement(title, subtitle);
    const pages: PdfPagePreview[] = [];

    for (let i = 0; i < totalPages; i++) {
      const startSliceY = cutPoints[i];
      const endSliceY = cutPoints[i + 1];
      const sliceHeight = endSliceY - startSliceY;

      // Slice Canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.max(1, sliceHeight);
      const sliceCtx = sliceCanvas.getContext('2d');

      if (sliceCtx && sliceHeight > 0) {
        sliceCtx.fillStyle = '#F8FAFC';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceHeight);
        sliceCtx.drawImage(
          canvas,
          0,
          startSliceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
      }

      const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const renderedSliceHeightMm = (sliceHeight / canvas.width) * contentWidthMm;

      // Full A3 Sheet Canvas (Simulating the exact PDF page)
      const a3Canvas = document.createElement('canvas');
      const a3Scale = 1.5;
      const a3PxWidth = Math.round(pdfWidth * 4 * a3Scale);
      const a3PxHeight = Math.round(pdfHeight * 4 * a3Scale);
      a3Canvas.width = a3PxWidth;
      a3Canvas.height = a3PxHeight;
      const a3Ctx = a3Canvas.getContext('2d');

      if (a3Ctx) {
        // Page background
        a3Ctx.fillStyle = '#F8FAFC';
        a3Ctx.fillRect(0, 0, a3PxWidth, a3PxHeight);

        // Synchronous direct canvas-to-canvas draw for Header
        if (headerCanvas) {
          const hWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
          const hHeightPx = (headerHeightMm / pdfHeight) * a3PxHeight;
          const mLeftPx = (marginMm / pdfWidth) * a3PxWidth;
          const mTopPx = (marginMm / pdfHeight) * a3PxHeight;
          a3Ctx.drawImage(
            headerCanvas,
            0,
            0,
            headerCanvas.width,
            headerCanvas.height,
            mLeftPx,
            mTopPx,
            hWidthPx,
            hHeightPx
          );
        }

        // Synchronous direct canvas-to-canvas draw for Content Slice
        if (sliceHeight > 0) {
          const cWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
          const cHeightPx = (renderedSliceHeightMm / pdfHeight) * a3PxHeight;
          const cLeftPx = (marginMm / pdfWidth) * a3PxWidth;
          const cTopPx = ((marginMm + headerHeightMm + 2) / pdfHeight) * a3PxHeight;
          a3Ctx.drawImage(
            sliceCanvas,
            0,
            0,
            sliceCanvas.width,
            sliceCanvas.height,
            cLeftPx,
            cTopPx,
            cWidthPx,
            cHeightPx
          );
        }

        // Synchronous direct canvas-to-canvas draw for Footer
        const footerCanvas = createFooterCanvasElement(i + 1, totalPages);
        if (footerCanvas) {
          const fWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
          const fHeightPx = (footerHeightMm / pdfHeight) * a3PxHeight;
          const fLeftPx = (marginMm / pdfWidth) * a3PxWidth;
          const fTopPx = ((pdfHeight - marginMm - footerHeightMm + 2) / pdfHeight) * a3PxHeight;
          a3Ctx.drawImage(
            footerCanvas,
            0,
            0,
            footerCanvas.width,
            footerCanvas.height,
            fLeftPx,
            fTopPx,
            fWidthPx,
            fHeightPx
          );
        }
      }

      pages.push({
        pageNumber: i + 1,
        startSliceY,
        endSliceY,
        sliceHeight,
        dataUrl: sliceDataUrl,
        a3DataUrl: a3Canvas.toDataURL('image/jpeg', 0.88),
        heightMm: renderedSliceHeightMm,
        startDomY: Math.round(startSliceY / canvasScale),
        endDomY: Math.round(endSliceY / canvasScale),
      });
    }

    // Build structured cards with assigned pages
    const cards: PdfCardBlock[] = measuredBlocks.map((b, idx) => {
      const startY = b.top * canvasScale;
      const endY = b.bottom * canvasScale;
      const centerY = (startY + endY) / 2;
      let pageIndex = 0;
      for (let p = 0; p < totalPages; p++) {
        if (centerY >= cutPoints[p] && (p === totalPages - 1 || centerY < cutPoints[p + 1])) {
          pageIndex = p;
          break;
        }
      }
      return {
        id: b.el.id || `pdf-card-block-${idx}`,
        title: extractCardTitle(b.el, b.isRow, idx),
        isRow: b.isRow,
        top: b.top,
        bottom: b.bottom,
        height: b.height,
        startY,
        endY,
        pageIndex,
        el: b.el,
      };
    });

    // Mark the page starters on target element for CSS print
    try {
      targetElement.querySelectorAll('.pdf-break-before, [data-pdf-page-break="true"]').forEach((el) => {
        el.classList.remove('pdf-break-before');
        el.removeAttribute('data-pdf-page-break');
      });
      for (let p = 1; p < totalPages; p++) {
        const firstCardOfPage = cards.find((c) => c.pageIndex === p && !c.isRow);
        if (firstCardOfPage && firstCardOfPage.el) {
          firstCardOfPage.el.classList.add('pdf-break-before');
          firstCardOfPage.el.setAttribute('data-pdf-page-break', 'true');
        }
      }
    } catch (e) {
      console.warn('DOM page-break class injection error:', e);
    }

    return {
      canvas,
      fullCanvasDataUrl: canvas.toDataURL('image/jpeg', 0.85),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      domWidth: rootRect.width || fixedWidth,
      domHeight,
      scale: canvasScale,
      cutPoints,
      domCutPoints,
      defaultCutPoints: [...cutPoints],
      cutPointInfos,
      cards,
      totalPages,
      pages,
      filename,
      title,
      subtitle,
      paperSize,
      landscape,
      contentWidthMm,
      headerHeightMm,
      footerHeightMm,
      marginMm,
      targetElement,
      maxPageHeightCanvas,
      maxPageHeightDom,
    };
  } finally {
    // Restore original styles on internal scroll containers
    if (savedInnerStyles && savedInnerStyles.length > 0) {
      savedInnerStyles.forEach((s) => {
        try {
          s.el.style.overflow = s.overflow;
          s.el.style.maxHeight = s.maxHeight;
          s.el.style.height = s.height;
        } catch {}
      });
    }

    // Restore original styles on target element
    document.body.classList.remove('print-layout-optimized-mode');
    targetElement.classList.remove('pdf-measuring-mode');
    targetElement.style.width = originalWidth;
    targetElement.style.minWidth = originalMinWidth;
    targetElement.style.maxWidth = originalMaxWidth;
    targetElement.style.overflow = originalOverflow;
    targetElement.style.maxHeight = originalMaxHeight;
    targetElement.style.height = originalHeight;
  }
}

/**
 * Recomputes pages and previews when user manually modifies cut points
 */
export function recomputePagesFromCutPoints(
  analysis: PdfLayoutAnalysis,
  newCutPoints: number[],
  customReasons?: Record<number, string>
): PdfLayoutAnalysis {
  const {
    canvas,
    canvasWidth,
    canvasHeight,
    contentWidthMm,
    headerHeightMm,
    footerHeightMm,
    marginMm,
    paperSize,
    landscape,
    scale: canvasScale,
    title,
    subtitle,
  } = analysis;

  // Ensure cutPoints are sorted, valid, start with 0 and end with canvasHeight
  const rawPoints = newCutPoints
    .map((p) => Math.max(0, Math.min(canvasHeight, Math.round(p))))
    .filter((p) => !isNaN(p));

  const uniqueSorted = Array.from(new Set(rawPoints)).sort((a, b) => a - b);
  if (uniqueSorted.length === 0 || uniqueSorted[0] !== 0) {
    uniqueSorted.unshift(0);
  }
  if (uniqueSorted[uniqueSorted.length - 1] !== canvasHeight) {
    uniqueSorted.push(canvasHeight);
  }

  // Filter out any slices that are too minuscule (< 30px) except the edges
  const cleaned: number[] = [0];
  for (let k = 1; k < uniqueSorted.length; k++) {
    const pt = uniqueSorted[k];
    if (k === uniqueSorted.length - 1) {
      cleaned.push(canvasHeight);
    } else if (pt - cleaned[cleaned.length - 1] >= 40) {
      cleaned.push(pt);
    }
  }

  const totalPages = Math.max(1, cleaned.length - 1);
  const domCutPoints = cleaned.map((c) => Math.round(c / canvasScale));

  const isA3 = paperSize === 'a3';
  const pdfWidth = isA3 ? (landscape ? 420 : 297) : (landscape ? 297 : 210);
  const pdfHeight = isA3 ? (landscape ? 297 : 420) : (landscape ? 210 : 297);

  const headerCanvas = createHeaderCanvasElement(title, subtitle);
  const pages: PdfPagePreview[] = [];
  const cutPointInfos: PdfCutPointInfo[] = [];

  for (let i = 0; i < totalPages; i++) {
    const startSliceY = cleaned[i];
    const endSliceY = cleaned[i + 1];
    const sliceHeight = Math.max(1, endSliceY - startSliceY);

    // Slice Canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvasWidth;
    sliceCanvas.height = sliceHeight;
    const sliceCtx = sliceCanvas.getContext('2d');

    if (sliceCtx) {
      sliceCtx.fillStyle = '#F8FAFC';
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceHeight);
      sliceCtx.drawImage(
        canvas,
        0,
        startSliceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );
    }

    const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);
    const renderedSliceHeightMm = (sliceHeight / canvas.width) * contentWidthMm;

    // Full A3 Sheet Canvas (Simulating the exact PDF page)
    const a3Canvas = document.createElement('canvas');
    const a3Scale = 1.5;
    const a3PxWidth = Math.round(pdfWidth * 4 * a3Scale);
    const a3PxHeight = Math.round(pdfHeight * 4 * a3Scale);
    a3Canvas.width = a3PxWidth;
    a3Canvas.height = a3PxHeight;
    const a3Ctx = a3Canvas.getContext('2d');

    if (a3Ctx) {
      a3Ctx.fillStyle = '#F8FAFC';
      a3Ctx.fillRect(0, 0, a3PxWidth, a3PxHeight);

      // Synchronous direct canvas-to-canvas draw for Header
      if (headerCanvas) {
        const hWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
        const hHeightPx = (headerHeightMm / pdfHeight) * a3PxHeight;
        const mLeftPx = (marginMm / pdfWidth) * a3PxWidth;
        const mTopPx = (marginMm / pdfHeight) * a3PxHeight;
        a3Ctx.drawImage(
          headerCanvas,
          0,
          0,
          headerCanvas.width,
          headerCanvas.height,
          mLeftPx,
          mTopPx,
          hWidthPx,
          hHeightPx
        );
      }

      // Synchronous direct canvas-to-canvas draw for Content Slice
      if (sliceHeight > 0) {
        const cWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
        const cHeightPx = (renderedSliceHeightMm / pdfHeight) * a3PxHeight;
        const cLeftPx = (marginMm / pdfWidth) * a3PxWidth;
        const cTopPx = ((marginMm + headerHeightMm + 2) / pdfHeight) * a3PxHeight;
        a3Ctx.drawImage(
          sliceCanvas,
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height,
          cLeftPx,
          cTopPx,
          cWidthPx,
          cHeightPx
        );
      }

      // Synchronous direct canvas-to-canvas draw for Footer
      const footerCanvas = createFooterCanvasElement(i + 1, totalPages);
      if (footerCanvas) {
        const fWidthPx = (contentWidthMm / pdfWidth) * a3PxWidth;
        const fHeightPx = (footerHeightMm / pdfHeight) * a3PxHeight;
        const fLeftPx = (marginMm / pdfWidth) * a3PxWidth;
        const fTopPx = ((pdfHeight - marginMm - footerHeightMm + 2) / pdfHeight) * a3PxHeight;
        a3Ctx.drawImage(
          footerCanvas,
          0,
          0,
          footerCanvas.width,
          footerCanvas.height,
          fLeftPx,
          fTopPx,
          fWidthPx,
          fHeightPx
        );
      }
    }

    pages.push({
      pageNumber: i + 1,
      startSliceY,
      endSliceY,
      sliceHeight,
      dataUrl: sliceDataUrl,
      a3DataUrl: a3Canvas.toDataURL('image/jpeg', 0.88),
      heightMm: renderedSliceHeightMm,
      startDomY: Math.round(startSliceY / canvasScale),
      endDomY: Math.round(endSliceY / canvasScale),
    });

    if (i < totalPages - 1) {
      const isCustomReason = customReasons?.[i];
      cutPointInfos.push({
        pageIndex: i,
        cutY: endSliceY,
        domY: Math.round(endSliceY / canvasScale),
        reason: isCustomReason || '人工拖曳自訂切頁截斷位置',
        isCleanCut: true,
      });
    }
  }

  // Update card page assignment based on new cut points
  const updatedCards: PdfCardBlock[] = (analysis.cards || []).map((card) => {
    const centerY = (card.startY + card.endY) / 2;
    let pageIdx = 0;
    for (let p = 0; p < totalPages; p++) {
      if (centerY >= cleaned[p] && (p === totalPages - 1 || centerY < cleaned[p + 1])) {
        pageIdx = p;
        break;
      }
    }
    return {
      ...card,
      pageIndex: pageIdx,
    };
  });

  // Re-inject page break markers to target element DOM
  try {
    if (analysis.targetElement) {
      analysis.targetElement
        .querySelectorAll('.pdf-break-before, [data-pdf-page-break="true"]')
        .forEach((el) => {
          el.classList.remove('pdf-break-before');
          el.removeAttribute('data-pdf-page-break');
        });

      for (let p = 1; p < totalPages; p++) {
        const firstCardOfPage = updatedCards.find((c) => c.pageIndex === p && !c.isRow);
        if (firstCardOfPage && firstCardOfPage.el) {
          firstCardOfPage.el.classList.add('pdf-break-before');
          firstCardOfPage.el.setAttribute('data-pdf-page-break', 'true');
        }
      }
    }
  } catch (e) {
    console.warn('DOM page-break class injection error in recompute:', e);
  }

  return {
    ...analysis,
    cutPoints: cleaned,
    domCutPoints,
    cutPointInfos,
    cards: updatedCards,
    totalPages,
    pages,
  };
}

/**
 * Generates and downloads an A3 PDF directly from precomputed layout analysis
 */
export async function generatePdfFromAnalysis(
  analysis: PdfLayoutAnalysis
): Promise<boolean> {
  const {
    canvas,
    cutPoints,
    totalPages,
    filename,
    title,
    subtitle,
    paperSize,
    landscape,
    contentWidthMm,
    headerHeightMm,
    footerHeightMm,
    marginMm,
  } = analysis;

  const orientation = landscape ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
    compress: true,
  });

  const isA3 = paperSize === 'a3';
  const pdfHeight = isA3 ? (landscape ? 297 : 420) : (landscape ? 210 : 297);

  const headerDataUrl = createHeaderCanvas(title, subtitle);

  const drawHeaderFooter = (pageNum: number) => {
    if (headerDataUrl) {
      pdf.addImage(headerDataUrl, 'PNG', marginMm, marginMm, contentWidthMm, headerHeightMm);
    }
    const footerDataUrl = createFooterCanvas(pageNum, totalPages);
    if (footerDataUrl) {
      pdf.addImage(footerDataUrl, 'PNG', marginMm, pdfHeight - marginMm, contentWidthMm, 6);
    }
  };

  for (let i = 0; i < totalPages; i++) {
    const startSliceY = cutPoints[i];
    const endSliceY = cutPoints[i + 1];
    const sliceHeight = endSliceY - startSliceY;

    if (sliceHeight <= 0) continue;

    if (i > 0) {
      pdf.addPage(paperSize, orientation);
    }

    drawHeaderFooter(i + 1);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const sliceCtx = sliceCanvas.getContext('2d');

    if (sliceCtx) {
      sliceCtx.fillStyle = '#F8FAFC';
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceHeight);
      sliceCtx.drawImage(
        canvas,
        0,
        startSliceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );
    }

    const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
    const renderedSliceHeightMm = (sliceHeight / canvas.width) * contentWidthMm;

    pdf.addImage(
      sliceDataUrl,
      'JPEG',
      marginMm,
      marginMm + headerHeightMm + 2,
      contentWidthMm,
      renderedSliceHeightMm,
      undefined,
      'FAST'
    );
  }

  pdf.save(`${filename}.pdf`);
  return true;
}

/**
 * Capture an HTML element as screenshot and export it to an A3 Landscape formatted PDF report.
 */
export async function exportElementToPdf(
  elementIdOrElement: string | HTMLElement,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  try {
    const analysis = await analyzePdfLayout(elementIdOrElement, options);
    return await generatePdfFromAnalysis(analysis);
  } catch (error) {
    console.error('Error generating A3 PDF:', error);
    alert('PDF 匯出過程中發生異常，請重試或使用瀏覽器列印功能。');
    return false;
  }
}
