import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileDown,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Info,
  GripHorizontal,
  MoveVertical,
  RotateCcw,
  Plus,
  Trash2,
  Hand,
  MousePointer,
  ArrowUp,
  ArrowDown,
  Sparkles,
  HelpCircle,
  EyeOff,
  Magnet,
  LayoutGrid,
} from 'lucide-react';
import {
  analyzePdfLayout,
  generatePdfFromAnalysis,
  recomputePagesFromCutPoints,
  findMagneticSnapPoint,
  autoSnapCutPointsToCards,
  PdfLayoutAnalysis,
  ExportPdfOptions,
  resolveTargetElement,
  PdfCardBlock,
  MagneticSnapResult,
} from '../../utils/pdfExport';

export interface PdfPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  documentTitle?: string;
  subtitle?: string;
  baseDate?: string;
  pdfOptions?: Partial<ExportPdfOptions>;
  onNativePrint?: () => void;
}

export const PdfPrintPreviewModal: React.FC<PdfPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  documentTitle = '遠雄營造HR戰情儀表板',
  subtitle,
  baseDate,
  pdfOptions,
  onNativePrint,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PdfLayoutAnalysis | null>(null);

  // View Mode: 'continuous' (with cut-point lines) | 'paged' (real A3 page by page)
  const [viewMode, setViewMode] = useState<'continuous' | 'paged'>('continuous');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // percentage: 50, 75, 100, 125
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Manual Drag & Adjustment States
  const [draggingCutIndex, setDraggingCutIndex] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isCustomized, setIsCustomized] = useState<boolean>(false);
  const [customReasons, setCustomReasons] = useState<Record<number, string>>({});
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  // Magnetic card snapping & layout boundary states
  const [enableMagneticSnap, setEnableMagneticSnap] = useState<boolean>(true);
  const [showCardBoundaries, setShowCardBoundaries] = useState<boolean>(true);
  const [showGuidePanel, setShowGuidePanel] = useState<boolean>(false); // 預設隱藏多餘引導面板 (結合列印版面最佳化)
  const [activeSnapResult, setActiveSnapResult] = useState<MagneticSnapResult | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [layoutNotice, setLayoutNotice] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const cutPointRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Auto-dismiss layout feedback notice
  useEffect(() => {
    if (layoutNotice) {
      const timer = setTimeout(() => setLayoutNotice(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [layoutNotice]);

  // Trigger analysis whenever modal is opened
  useEffect(() => {
    if (!isOpen) {
      setAnalysis(null);
      setIsLoading(true);
      setErrorMessage(null);
      setDownloadSuccess(false);
      setDraggingCutIndex(null);
      setDragCurrentY(null);
      setIsCustomized(false);
      setCustomReasons({});
      setActiveSnapResult(null);
      setHoveredCardId(null);
      setLayoutNotice(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const runAnalysis = async () => {
      try {
        const targetEl = resolveTargetElement(targetElementId);
        if (!targetEl) {
          throw new Error(`找不到儀表板畫面節點: ${targetElementId}`);
        }

        const result = await analyzePdfLayout(targetEl, {
          filename: `${documentTitle.replace(/\s+/g, '_')}_A3橫式_${baseDate || new Date().toISOString().slice(0, 10)}`,
          title: documentTitle,
          subtitle: subtitle || `資料基準日：${baseDate || '今日'} · 內部決策專用`,
          landscape: true,
          paperSize: 'a3',
          fixedWidth: 1584,
          ...pdfOptions,
        });

        if (isMounted) {
          setAnalysis(result);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('PDF layout analysis error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || '計算 PDF 列印排版與截斷點時發生異常');
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(runAnalysis, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, targetElementId, documentTitle, subtitle, baseDate, pdfOptions]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Download PDF
  const handleConfirmDownload = async () => {
    if (!analysis) return;
    setIsDownloading(true);
    try {
      const success = await generatePdfFromAnalysis(analysis);
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('下載 PDF 時發生錯誤，請重試。');
    } finally {
      setIsDownloading(false);
    }
  };

  // 列印版面最佳化原生列印 (結合隱藏多餘引導面板)
  const handlePrintOptimization = () => {
    if (onNativePrint) {
      onNativePrint();
      return;
    }
    document.body.classList.add('print-layout-optimized-mode');
    const targetEl = resolveTargetElement(targetElementId);
    if (targetEl) {
      targetEl.classList.add('print-dashboard-container');
    }
    const originalTitle = document.title;
    if (documentTitle) {
      document.title = `${documentTitle.replace(/\s+/g, '_')}_A3橫式_${baseDate || new Date().toISOString().slice(0, 10)}`;
    }
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print optimization error:', err);
      } finally {
        setTimeout(() => {
          document.body.classList.remove('print-layout-optimized-mode');
          document.title = originalTitle;
        }, 800);
      }
    }, 150);
  };

  // Scroll to a specific cut point in continuous mode
  const scrollToCutPoint = (index: number) => {
    setViewMode('continuous');
    setTimeout(() => {
      const el = cutPointRefs.current[index];
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // Dragging Handlers for Cut Points
  const handleCutPointerDown = (cutIndex: number, e: React.PointerEvent) => {
    if (!analysis) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingCutIndex(cutIndex);
    setDragCurrentY(analysis.cutPoints[cutIndex]);
  };

  const handleCutPointerMove = (cutIndex: number, e: React.PointerEvent) => {
    if (draggingCutIndex !== cutIndex || !analysis || !canvasWrapperRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, relY / rect.height));
    const canvasY = ratio * analysis.canvasHeight;

    // Boundaries: strictly between previous cut and next cut point with safe minimum gap
    const prevCut = analysis.cutPoints[cutIndex - 1];
    const nextCut = analysis.cutPoints[cutIndex + 1];
    const minGap = 40 * analysis.scale;

    let targetY = canvasY;
    let snap: MagneticSnapResult | null = null;

    // Magnetic Card Boundary Snapping
    if (enableMagneticSnap && analysis.cards && analysis.cards.length > 0) {
      snap = findMagneticSnapPoint(canvasY, analysis.cards, analysis.scale, 32);
      if (snap) {
        if (snap.snappedY >= prevCut + minGap && snap.snappedY <= nextCut - minGap) {
          targetY = snap.snappedY;
        } else {
          snap = null;
        }
      }
    }

    const clampedY = Math.max(prevCut + minGap, Math.min(nextCut - minGap, targetY));
    setDragCurrentY(clampedY);
    setActiveSnapResult(snap);
  };

  const handleCutPointerUp = (cutIndex: number, e: React.PointerEvent) => {
    if (draggingCutIndex !== cutIndex || dragCurrentY === null || !analysis) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const newCutPoints = [...analysis.cutPoints];
    newCutPoints[cutIndex] = Math.round(dragCurrentY);

    const targetDomY = Math.round(dragCurrentY / analysis.scale);
    const snapReason = activeSnapResult
      ? `${activeSnapResult.label} (Y: ${targetDomY}px)`
      : `人工拖曳自訂切頁截斷位置 (Y: ${targetDomY}px)`;

    const newReasons = {
      ...customReasons,
      [cutIndex - 1]: snapReason,
    };

    const updated = recomputePagesFromCutPoints(analysis, newCutPoints, newReasons);
    setAnalysis(updated);
    setCustomReasons(newReasons);
    setIsCustomized(true);
    setDraggingCutIndex(null);
    setDragCurrentY(null);
    setActiveSnapResult(null);
    setLayoutNotice('✓ 容器佈局已自動依輔助線重整分頁，確保各看板卡片完整無腰斬！');
  };

  // Magnetic snap a specific cut line to nearest card top or bottom
  const handleSnapCutToCard = (cutIndex: number, direction: 'top' | 'bottom') => {
    if (!analysis || !analysis.cards) return;
    const currentCutY = analysis.cutPoints[cutIndex];
    const prevCut = analysis.cutPoints[cutIndex - 1];
    const nextCut = analysis.cutPoints[cutIndex + 1];
    const minGap = 40 * analysis.scale;

    const majorCards = analysis.cards.filter((c) => !c.isRow);
    if (majorCards.length === 0) return;

    let targetY = currentCutY;
    let chosenCard: PdfCardBlock | null = null;

    if (direction === 'top') {
      // Find card located below cut line to snap to its top (sending it to next page)
      const cardsBelow = majorCards.filter((c) => c.startY >= currentCutY - 30);
      if (cardsBelow.length > 0) {
        chosenCard = cardsBelow[0];
        targetY = Math.max(0, chosenCard.startY - 10);
      }
    } else {
      // Find card located above cut line to snap to its bottom (keeping it in this page)
      const cardsAbove = majorCards.filter((c) => c.endY <= currentCutY + 30);
      if (cardsAbove.length > 0) {
        chosenCard = cardsAbove[cardsAbove.length - 1];
        targetY = chosenCard.endY + 10;
      }
    }

    if (chosenCard) {
      const clampedY = Math.max(prevCut + minGap, Math.min(nextCut - minGap, targetY));
      const newCutPoints = [...analysis.cutPoints];
      newCutPoints[cutIndex] = Math.round(clampedY);

      const targetDomY = Math.round(clampedY / analysis.scale);
      const newReasons = {
        ...customReasons,
        [cutIndex - 1]: `磁吸對齊：【${chosenCard.title}】${direction === 'top' ? '頂部 (換頁)' : '底部 (保留本頁)'} (Y: ${targetDomY}px)`,
      };

      const updated = recomputePagesFromCutPoints(analysis, newCutPoints, newReasons);
      setAnalysis(updated);
      setCustomReasons(newReasons);
      setIsCustomized(true);
      setLayoutNotice(`✓ 已吸附至【${chosenCard.title}】${direction === 'top' ? '頂部換頁' : '底部'}，容器排版已重新劃分！`);
    }
  };

  // Split cleanly right before a specific dashboard card
  const handleSplitBeforeCard = (card: PdfCardBlock) => {
    if (!analysis) return;
    const targetY = Math.max(40, card.startY - 10);

    let updatedCuts = [...analysis.cutPoints];
    let matchedCutIdx = -1;
    let minDiff = 140 * analysis.scale;

    for (let i = 1; i < analysis.cutPoints.length - 1; i++) {
      const diff = Math.abs(analysis.cutPoints[i] - targetY);
      if (diff < minDiff) {
        minDiff = diff;
        matchedCutIdx = i;
      }
    }

    if (matchedCutIdx !== -1) {
      updatedCuts[matchedCutIdx] = targetY;
    } else {
      updatedCuts.push(targetY);
      updatedCuts = Array.from(new Set(updatedCuts)).sort((a, b) => a - b);
    }

    const updated = recomputePagesFromCutPoints(analysis, updatedCuts, {
      ...customReasons,
      [Math.max(0, matchedCutIdx - 1)]: `在【${card.title}】前方完整換頁`,
    });
    setAnalysis(updated);
    setIsCustomized(true);
    setLayoutNotice(`✓ 已在【${card.title}】前設定換頁分割線，該卡片將自新頁面頂部開始！`);
  };

  // Auto-snap all cuts to nearest card gaps
  const handleAutoSnapAll = () => {
    if (!analysis) return;
    const snappedCuts = autoSnapCutPointsToCards(analysis);
    const updated = recomputePagesFromCutPoints(analysis, snappedCuts);
    setAnalysis(updated);
    setIsCustomized(true);
    setLayoutNotice('✓ 已將全部頁面分割線自動對齊至最近的看板縫隙，完全避開卡片內部！');
  };

  // Pixel Fine-Tuning for a Cut Point
  const handleFineTune = (cutIndex: number, deltaDomPx: number) => {
    if (!analysis) return;
    const deltaCanvas = deltaDomPx * analysis.scale;
    const currentY = analysis.cutPoints[cutIndex];
    const prevCut = analysis.cutPoints[cutIndex - 1];
    const nextCut = analysis.cutPoints[cutIndex + 1];
    const minGap = 40 * analysis.scale;

    const targetY = Math.max(prevCut + minGap, Math.min(nextCut - minGap, currentY + deltaCanvas));
    const newCutPoints = [...analysis.cutPoints];
    newCutPoints[cutIndex] = Math.round(targetY);

    const targetDomY = Math.round(targetY / analysis.scale);
    const newReasons = {
      ...customReasons,
      [cutIndex - 1]: `人工微調 (${deltaDomPx > 0 ? '+' : ''}${deltaDomPx}px) 至 Y: ${targetDomY}px`,
    };

    const updated = recomputePagesFromCutPoints(analysis, newCutPoints, newReasons);
    setAnalysis(updated);
    setCustomReasons(newReasons);
    setIsCustomized(true);
  };

  // Delete an interior Cut Point (merge pages)
  const handleDeleteCutPoint = (cutIndex: number) => {
    if (!analysis || analysis.totalPages <= 1) return;
    const newCutPoints = analysis.cutPoints.filter((_, idx) => idx !== cutIndex);
    const updated = recomputePagesFromCutPoints(analysis, newCutPoints);
    setAnalysis(updated);
    setIsCustomized(true);
  };

  // Insert a new Cut Point (split a page)
  const handleAddCutPoint = (pageIndex?: number) => {
    if (!analysis) return;
    let insertY = 0;
    if (typeof pageIndex === 'number' && pageIndex < analysis.totalPages) {
      const start = analysis.cutPoints[pageIndex];
      const end = analysis.cutPoints[pageIndex + 1];
      insertY = Math.round((start + end) / 2);
    } else {
      // Find the page with the largest height and split it
      let maxH = 0;
      let maxIdx = 0;
      for (let i = 0; i < analysis.totalPages; i++) {
        const h = analysis.cutPoints[i + 1] - analysis.cutPoints[i];
        if (h > maxH) {
          maxH = h;
          maxIdx = i;
        }
      }
      insertY = Math.round((analysis.cutPoints[maxIdx] + analysis.cutPoints[maxIdx + 1]) / 2);
    }

    const newCutPoints = [...analysis.cutPoints, insertY].sort((a, b) => a - b);
    const updated = recomputePagesFromCutPoints(analysis, newCutPoints);
    setAnalysis(updated);
    setIsCustomized(true);
  };

  // Reset to original smart cut points
  const handleResetToSmartCuts = () => {
    if (!analysis || !analysis.defaultCutPoints) return;
    const updated = recomputePagesFromCutPoints(analysis, analysis.defaultCutPoints);
    setAnalysis(updated);
    setCustomReasons({});
    setIsCustomized(false);
  };

  // Canvas Panning (Grab / Move whole view)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.cut-line-handle, button, .interactive-control')) {
      return;
    }
    if (isPanMode || e.button === 1 || e.shiftKey || e.altKey) {
      setIsPanning(true);
      if (scrollContainerRef.current) {
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: scrollContainerRef.current.scrollLeft,
          scrollTop: scrollContainerRef.current.scrollTop,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning && scrollContainerRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      data-html2canvas-ignore="true"
      className="no-print fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-150 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-modal-title"
    >
      {/* 頂部操作與排版檢測控制列 */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* 左側：標題與排版資訊 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="pdf-preview-modal-title" className="text-base font-extrabold text-white flex items-center gap-2">
                <span>PDF 列印截斷點與版面最佳化檢視</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold font-mono">
                  A3 橫向 (420mm × 297mm)
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  已結合列印版面最佳化
                </span>
              </h2>
              {analysis && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono">
                  共 {analysis.totalPages} 頁
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xl">
              {documentTitle} · {subtitle || `資料基準日：${baseDate || '今日'}`}
            </p>
          </div>
        </div>

        {/* 中間：檢視模式、操作工具與縮放控制器 */}
        {analysis && !isLoading && (
          <div className="flex items-center flex-wrap gap-2">
            {/* 模式切換器 */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('continuous')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'continuous'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title="檢視整張畫卷，可直接上下拖曳紅色截斷線自訂切頁位置"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>全卷切頁截斷點 (可拖曳)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('paged')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'paged'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title="逐頁檢視真實 A3 列印效果（含正式頁首標頭與頁尾頁碼）"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>A3 單頁翻閱 ({analysis.totalPages} 頁)</span>
              </button>
            </div>

            {/* 連續模式專屬工具列：磁吸、看板邊界、抓手平移、新增切頁點、還原智慧避斷 */}
            {viewMode === 'continuous' && (
              <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 gap-1">
                {/* 磁吸卡片縫隙開關 */}
                <button
                  type="button"
                  onClick={() => setEnableMagneticSnap((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    enableMagneticSnap
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  title="開啟/關閉拖曳時自動磁吸吸附卡片縫隙"
                >
                  <Magnet className="w-3.5 h-3.5" />
                  <span>磁吸縫隙: {enableMagneticSnap ? '開啟' : '關閉'}</span>
                </button>

                {/* 標記看板邊界開關 */}
                <button
                  type="button"
                  onClick={() => setShowCardBoundaries((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    showCardBoundaries
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  title="顯示/隱藏畫卷上的看板卡片邊界與歸屬頁次標籤"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>卡片標籤</span>
                </button>

                {/* 一鍵智慧吸附所有卡片 */}
                <button
                  type="button"
                  onClick={handleAutoSnapAll}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600/30 transition-all cursor-pointer border border-emerald-500/30"
                  title="自動將所有分頁輔助線對齊至卡片邊界，確保所有看板不被截斷"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">卡片智慧對齊</span>
                </button>

                <div className="w-px h-4 bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setIsPanMode((p) => !p)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isPanMode
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  title="切換抓手平移畫布模式（或可直接滾動檢視）"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>抓手</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddCutPoint()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-all cursor-pointer"
                  title="在當前高度最大的頁面中間插入一處新的切頁截斷點"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>插入線</span>
                </button>

                {isCustomized && (
                  <button
                    type="button"
                    onClick={handleResetToSmartCuts}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 transition-all cursor-pointer border border-amber-500/30"
                    title="放棄人工調整，恢復由系統自動計算的最佳表格防腰斬截斷點"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>還原</span>
                  </button>
                )}
              </div>
            )}

            {/* 縮放與引導面板控制器 */}
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                disabled={zoomLevel <= 40}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="縮小預覽"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[38px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                disabled={zoomLevel >= 150}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="放大預覽"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                title="恢復預設 100% 比例"
              >
                100%
              </button>

              <div className="w-px h-4 bg-slate-700 mx-1" />

              {/* 切換是否顯示輔助操作引導面板 */}
              <button
                type="button"
                onClick={() => setShowGuidePanel((s) => !s)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showGuidePanel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title={showGuidePanel ? '已展開操作提示，點擊可隱藏多餘引導面板' : '預設已最佳化隱藏多餘引導，點擊可展開操作提示'}
              >
                {showGuidePanel ? <EyeOff className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{showGuidePanel ? '隱藏引導' : '操作引導'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 右側：防斷狀態標記與匯出按鈕 */}
        <div className="flex items-center gap-2">
          {analysis && !isLoading && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all">
              {isCustomized ? (
                <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                  <MoveVertical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>已套用人工拖曳自訂切頁位置</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>系統智慧避斷：零文字腰斬</span>
                </div>
              )}
            </div>
          )}

          {/* 列印版面最佳化原生列印按鈕 */}
          <button
            type="button"
            id="btn-modal-print-layout-optimize"
            onClick={handlePrintOptimization}
            disabled={isLoading || isDownloading || !analysis}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="以 A3 橫向最佳化版面（自動隱藏多餘引導面板）呼叫列印或另存為 PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">版面最佳化列印</span>
            <span className="sm:hidden">列印</span>
          </button>

          {/* 確認匯出下載 PDF 按鈕 */}
          <button
            type="button"
            id="btn-modal-confirm-download-pdf"
            onClick={handleConfirmDownload}
            disabled={isLoading || isDownloading || !analysis}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white ring-1 ring-rose-400/50 hover:shadow-rose-600/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>生成 A3 PDF 中...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>下載成功！</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>確認無誤，立即下載 PDF</span>
              </>
            )}
          </button>

          {/* 關閉視窗按鈕 */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="關閉視窗 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 主預覽工作區 (雙欄結構：左側頁面快速導覽，右側畫布與截斷點) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Loading 狀態 */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                <Scissors className="w-8 h-8" />
              </div>
              <Loader2 className="w-6 h-6 animate-spin text-blue-400 absolute -top-1 -right-1" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">
              正在即時精算 A3 橫向排版與分頁截斷點...
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              系統正在遍歷表格資料列（<code className="text-rose-300 font-mono">tr</code>）與資訊卡片容器，智能搜尋最佳跨頁避斷點，確保文字與圖表絕不腰斬。
            </p>
          </div>
        )}

        {/* 錯誤狀態 */}
        {errorMessage && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-900/40 border border-rose-700 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">截斷點檢測未能完成</h3>
            <p className="text-sm text-rose-300 max-w-md mb-6">{errorMessage}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                關閉
              </button>
              {onNativePrint && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNativePrint();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>改用瀏覽器原生列印</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 成功載入預覽內容 */}
        {analysis && !isLoading && (
          <>
            {/* 左側：分頁索引與截斷點清單 (可收合導覽列) */}
            <aside className="w-64 sm:w-72 shrink-0 bg-slate-900/90 border-r border-slate-800 flex flex-col overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>分頁與截斷點導覽 ({analysis.totalPages} 頁)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {analysis.domHeight}px 高
                </span>
              </div>

              {/* 逐頁導航卡片 */}
              <div className="space-y-2.5">
                {analysis.pages.map((page, idx) => {
                  const isCutAfter = idx < analysis.cutPointInfos.length;
                  const cutInfo = isCutAfter ? analysis.cutPointInfos[idx] : null;
                  const pageHeightDom = page.endDomY - page.startDomY;
                  const isOverLimit = pageHeightDom > analysis.maxPageHeightDom;

                  return (
                    <div
                      key={`page-nav-${page.pageNumber}-${idx}`}
                      className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                        currentPage === page.pageNumber
                          ? 'border-blue-500/70 bg-blue-950/20'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                      }`}
                    >
                      {/* 頁面標頭資訊 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(page.pageNumber);
                          if (viewMode === 'continuous') {
                            scrollToCutPoint(idx);
                          }
                        }}
                        className="w-full flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center transition-colors ${
                              currentPage === page.pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white'
                            }`}
                          >
                            {page.pageNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                            第 {page.pageNumber} 頁
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono ${isOverLimit ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                          {pageHeightDom}px
                        </span>
                      </button>

                      {/* 該頁微縮圖點選 */}
                      <div
                        onClick={() => {
                          setCurrentPage(page.pageNumber);
                          if (viewMode === 'continuous') {
                            scrollToCutPoint(idx);
                          }
                        }}
                        className="w-full aspect-[420/297] rounded-lg border border-slate-700 bg-slate-950 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all relative group"
                        title={`點選切換至第 ${page.pageNumber} 頁`}
                      >
                        <img
                          src={page.a3DataUrl || page.dataUrl}
                          alt={`第 ${page.pageNumber} 頁縮圖`}
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* 若該頁下方有截斷點，提供微調連結與說明 */}
                      {cutInfo && (
                        <div className="pt-1.5 border-t border-slate-700/60 space-y-1">
                          <div
                            onClick={() => scrollToCutPoint(idx)}
                            className="flex items-start gap-1.5 text-[11px] text-rose-300 hover:text-rose-200 cursor-pointer"
                          >
                            <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="leading-tight">
                              <span className="font-bold">截斷點 #{idx + 1} (Y: {cutInfo.domY}px)</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{cutInfo.reason}</p>
                            </div>
                          </div>

                          {/* 快捷微調按鈕列 */}
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleFineTune(idx + 1, -10)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              title="截斷線向上微調 10px"
                            >
                              ▲ -10px
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollToCutPoint(idx)}
                              className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 font-bold cursor-pointer"
                              title="畫面滾動至此截斷點進行拖曳"
                            >
                              拖曳調整
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFineTune(idx + 1, 10)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              title="截斷線向下微調 10px"
                            >
                              ▼ +10px
                            </button>
                          </div>
                        </div>
                      )}
                      {/* 該頁所包含的看板卡片清單 */}
                      {analysis.cards && (
                        <div className="pt-1.5 border-t border-slate-700/50 space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <LayoutGrid className="w-3 h-3 text-blue-400" />
                              <span>本頁看板卡片：</span>
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {analysis.cards.filter((c) => !c.isRow && c.pageIndex === idx).length} 個區塊
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {analysis.cards
                              .filter((c) => !c.isRow && c.pageIndex === idx)
                              .map((c) => (
                                <div
                                  key={c.id}
                                  onMouseEnter={() => setHoveredCardId(c.id)}
                                  onMouseLeave={() => setHoveredCardId(null)}
                                  className="flex items-center justify-between text-[10px] text-slate-300 hover:text-white group/card rounded px-1 py-0.5 hover:bg-slate-800/80 transition-colors"
                                >
                                  <span className="truncate pr-1" title={c.title}>
                                    • {c.title}
                                  </span>
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSplitBeforeCard(c);
                                      }}
                                      className="opacity-0 group-hover/card:opacity-100 text-[9px] text-rose-300 hover:text-white px-1 py-0.2 rounded bg-rose-950/80 border border-rose-800/80 cursor-pointer shrink-0 font-bold"
                                      title="以此卡片作為新頁面開端"
                                    >
                                      換頁起點
                                    </button>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 智慧磁吸與換頁說明卡 (預設隱藏，與列印版面最佳化結合) */}
              {showGuidePanel && (
                <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/50 text-[11px] text-slate-400 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1 text-slate-300 font-bold">
                    <Magnet className="w-3.5 h-3.5 text-rose-400" />
                    <span>磁吸輔助線換頁提示</span>
                  </div>
                  <p className="leading-relaxed text-[10px]">
                    在右側畫卷拖曳<strong>頁面分割輔助線</strong>時，系統會自動<strong>磁吸卡片縫隙</strong>，並即時重排分頁佈局，保證卡片完整不被截斷。亦可直接點擊「吸附上卡片」或「吸附下卡片換頁」。
                  </p>
                </div>
              )}
            </aside>

            {/* 右側：主要預覽展示畫布 */}
            <main
              ref={scrollContainerRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              className={`flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 md:p-8 flex flex-col items-center select-none ${
                isPanMode ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            >
              {/* 模式 1: 全卷連續截斷點檢視 (附可拖曳截斷紅線、把手與微調按鈕) */}
              {viewMode === 'continuous' && (
                <div className="w-full flex flex-col items-center space-y-4">
                  {/* 頂部檢測狀態引導卡 (可依 showGuidePanel 折疊/展開，預設為簡潔版面最佳化模式) */}
                  {showGuidePanel ? (
                    <div className="w-full max-w-5xl bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>連續畫卷模式 · 共 {analysis.totalPages - 1} 處跨頁切點</span>
                            {isCustomized ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                已啟用人工自訂拖曳
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                系統智慧避斷中 (已避開文字行)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            可直接以滑鼠抓住紅色剪刀標籤<strong>上下拖曳調整截斷位置</strong>，或使用左右兩側的微調按鈕設定。
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddCutPoint()}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>新增切頁點</span>
                        </button>
                        {isCustomized && (
                          <button
                            type="button"
                            onClick={handleResetToSmartCuts}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>還原預設</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-5xl flex items-center justify-between px-2 py-1 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          已結合版面最佳化 (隱藏多餘面板)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          連續畫卷 · {analysis.totalPages - 1} 處切點 · 拖曳紅色標籤可微調
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddCutPoint()}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                        >
                          <Plus className="w-3 h-3 text-blue-400" />
                          <span>新增切點</span>
                        </button>
                        {isCustomized && (
                          <button
                            type="button"
                            onClick={handleResetToSmartCuts}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>還原</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 畫布本體容器 (完整無縫連續畫面，上覆可拖曳截斷線) */}
                  <div
                    ref={canvasWrapperRef}
                    className="relative bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300 select-none origin-top transition-all"
                    style={{
                      width: `${(1584 * zoomLevel) / 100}px`,
                      maxWidth: '100%',
                    }}
                  >
                    {/* 完整連續報表圖檔 (無縫底層) */}
                    <img
                      src={analysis.fullCanvasDataUrl}
                      alt="完整戰情報告連續內容"
                      className="w-full block bg-[#F8FAFC] pointer-events-none select-none"
                    />

                    {/* 看板卡片區塊邊界與頁面歸屬標籤覆層 */}
                    {showCardBoundaries && analysis.cards && (
                      <div className="absolute inset-0 pointer-events-none z-15">
                        {analysis.cards
                          .filter((c) => !c.isRow)
                          .map((card, cIdx) => {
                            const topPct = (card.startY / analysis.canvasHeight) * 100;
                            const heightPct =
                              ((card.endY - card.startY) / analysis.canvasHeight) * 100;
                            const isHovered = hoveredCardId === card.id;

                            // Distinct border accents per page
                            const pageColors = [
                              'border-blue-500/50 bg-blue-500/5 text-blue-300',
                              'border-emerald-500/50 bg-emerald-500/5 text-emerald-300',
                              'border-purple-500/50 bg-purple-500/5 text-purple-300',
                              'border-amber-500/50 bg-amber-500/5 text-amber-300',
                              'border-rose-500/50 bg-rose-500/5 text-rose-300',
                            ];
                            const pageColor = pageColors[card.pageIndex % pageColors.length];

                            return (
                              <div
                                key={card.id || `card-box-${cIdx}`}
                                className={`absolute left-3 right-3 rounded-xl border transition-all group/card-overlay ${
                                  isHovered
                                    ? 'border-blue-400 ring-2 ring-blue-400/40 bg-blue-500/10 shadow-lg'
                                    : 'border-slate-400/25 hover:border-slate-400/60'
                                }`}
                                style={{
                                  top: `${topPct}%`,
                                  height: `${heightPct}%`,
                                }}
                              >
                                {/* 左上角：卡片歸屬頁面與標題徽章 */}
                                <div className="absolute -top-3 left-3 pointer-events-auto flex items-center gap-1.5 shadow-md">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border backdrop-blur-md ${pageColor} flex items-center gap-1`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    第 {card.pageIndex + 1} 頁 · {card.title}
                                  </span>
                                </div>

                                {/* 右上角：從此卡片前換頁快捷鈕 */}
                                {card.pageIndex > 0 || cIdx > 0 ? (
                                  <div className="absolute -top-3.5 right-3 pointer-events-auto opacity-0 group-hover/card-overlay:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleSplitBeforeCard(card)}
                                      className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1 transition-all cursor-pointer"
                                      title="以此卡片頂部為新頁面起點"
                                    >
                                      <Scissors className="w-3 h-3" />
                                      <span>從此處換頁</span>
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* 各頁次區間左側水印標籤與安全高度提醒 */}
                    {analysis.pages.map((page, pIdx) => {
                      const topPercent = (page.startSliceY / analysis.canvasHeight) * 100;
                      const pageDomHeight = page.endDomY - page.startDomY;
                      const isOverLimit = pageDomHeight > analysis.maxPageHeightDom;

                      return (
                        <div
                          key={`page-ribbon-${page.pageNumber}`}
                          className="absolute left-4 z-20 pointer-events-none"
                          style={{ top: `calc(${topPercent}% + 12px)` }}
                        >
                          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1 rounded-lg border border-slate-700 shadow-md">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-mono text-xs font-black">
                              PAGE {page.pageNumber} / {analysis.totalPages}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (高度: {pageDomHeight}px)
                            </span>
                            {isOverLimit && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40">
                                ⚠️ 超出建議高度
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 互動式可拖曳頁面分割輔助線列表 */}
                    {Array.from({ length: analysis.totalPages - 1 }).map((_, i) => {
                      const cutIndex = i + 1;
                      const isDragging = draggingCutIndex === cutIndex;
                      const effectiveCanvasY =
                        isDragging && dragCurrentY !== null
                          ? dragCurrentY
                          : analysis.cutPoints[cutIndex];

                      const topPercent = (effectiveCanvasY / analysis.canvasHeight) * 100;
                      const effectiveDomY = Math.round(effectiveCanvasY / analysis.scale);
                      const prevCutY = analysis.cutPoints[cutIndex - 1];
                      const pageHeightDom = Math.round((effectiveCanvasY - prevCutY) / analysis.scale);
                      const isOverLimit = pageHeightDom > analysis.maxPageHeightDom;
                      const cutInfo = i < analysis.cutPointInfos.length ? analysis.cutPointInfos[i] : null;

                      return (
                        <div
                          key={`cut-point-line-${cutIndex}`}
                          ref={(el) => {
                            cutPointRefs.current[i] = el;
                          }}
                          className={`absolute left-0 right-0 z-30 transform -translate-y-1/2 transition-opacity ${
                            isDragging ? 'opacity-100 z-50' : 'opacity-95'
                          }`}
                          style={{ top: `${topPercent}%` }}
                        >
                          {/* 水平紅色高對比分割輔助虛線與導引光暈 */}
                          <div
                            className={`w-full relative flex items-center justify-center ${
                              isDragging
                                ? 'border-b-[3px] border-rose-600 shadow-[0_0_16px_rgba(225,29,72,0.9)]'
                                : 'border-b-2 border-dashed border-rose-500 hover:border-rose-600'
                            }`}
                          >
                            {/* 中央主拖曳把手膠囊 (支援 Pointer Events 拖曳與磁吸回饋) */}
                            <div
                              onPointerDown={(e) => handleCutPointerDown(cutIndex, e)}
                              onPointerMove={(e) => handleCutPointerMove(cutIndex, e)}
                              onPointerUp={(e) => handleCutPointerUp(cutIndex, e)}
                              className={`cut-line-handle interactive-control group cursor-row-resize select-none px-4 py-2 rounded-full shadow-2xl border-2 flex items-center gap-2.5 transition-all ${
                                isDragging
                                  ? 'bg-rose-700 text-white border-white scale-105 ring-4 ring-rose-500/50'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white border-white hover:scale-102'
                              }`}
                              title="按住此處上下拖曳，調整頁面分割輔助線；系統將自動磁吸卡片縫隙並即時重排分頁"
                            >
                              <GripHorizontal className="w-4 h-4 text-white/80" />
                              <Scissors className="w-3.5 h-3.5 text-white animate-pulse" />

                              <div className="flex items-center gap-1.5 font-black text-xs">
                                <span>分割輔助線 #{cutIndex}</span>
                                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-rose-100">
                                  Y: {effectiveDomY}px
                                </span>
                              </div>

                              {enableMagneticSnap && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-200 text-[10px] font-bold border border-rose-400/40">
                                  <Magnet className="w-3 h-3 text-rose-300" />
                                  <span>磁吸中</span>
                                </span>
                              )}

                              <span className="w-1 h-1 rounded-full bg-white/60" />

                              <span className="text-[11px] font-medium text-rose-100 hidden sm:inline">
                                第 {cutIndex} 頁高度: {pageHeightDom}px
                              </span>

                              {isOverLimit ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 font-bold">
                                  ⚠️ 超出建議高度
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950 font-bold hidden md:inline">
                                  ✓ 完整無截斷
                                </span>
                              )}

                              <MoveVertical className="w-3.5 h-3.5 text-rose-200" />
                            </div>

                            {/* 微調與快速操作面板 (浮動於輔助線右側) */}
                            <div className="absolute right-4 -translate-y-1/2 flex items-center gap-1 bg-slate-900/95 border border-slate-700 p-1 rounded-xl shadow-xl interactive-control">
                              {/* 快速磁吸至上方卡片底部 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSnapCutToCard(cutIndex, 'bottom');
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="磁吸吸附至上方卡片底部縫隙"
                              >
                                <ArrowUp className="w-3 h-3 text-blue-400" />
                                <span className="hidden xl:inline">吸附上卡片</span>
                              </button>

                              {/* 快速磁吸至下方卡片頂部(換頁) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSnapCutToCard(cutIndex, 'top');
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="磁吸吸附至下方卡片頂部，讓該卡片完整換至下一頁"
                              >
                                <ArrowDown className="w-3 h-3 text-emerald-400" />
                                <span className="hidden xl:inline">吸附下卡片換頁</span>
                              </button>

                              <div className="w-px h-3 bg-slate-700 mx-0.5" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFineTune(cutIndex, -5);
                                }}
                                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold cursor-pointer"
                                title="輔助線向上微調 5px"
                              >
                                ▲ -5px
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFineTune(cutIndex, 5);
                                }}
                                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold cursor-pointer"
                                title="輔助線向下微調 5px"
                              >
                                ▼ +5px
                              </button>

                              <div className="w-px h-3 bg-slate-700 mx-0.5" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCutPoint(cutIndex);
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
                                title="移除此分割輔助線（與後頁合併）"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 判定原因或拖曳中即時磁吸提示標籤 */}
                          <div className="mt-2 text-center pointer-events-none">
                            {isDragging ? (
                              activeSnapResult ? (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-2xl animate-pulse ring-2 ring-emerald-300">
                                  <Magnet className="w-4 h-4 text-emerald-200" />
                                  <span>{activeSnapResult.label}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-lg animate-bounce">
                                  <MoveVertical className="w-3.5 h-3.5" />
                                  <span>放開滑鼠即可自動調整容器分頁佈局</span>
                                </span>
                              )
                            ) : (
                              cutInfo && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-rose-100 text-rose-900 text-xs font-bold border border-rose-300 shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>{cutInfo.reason}</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 模式 2: 真實 A3 單頁翻閱檢視 (含頁首頁尾模擬) */}
              {viewMode === 'paged' && (
                <div className="w-full max-w-5xl flex flex-col items-center space-y-4">
                  {/* 單頁翻閱控制頂欄 */}
                  <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>上一頁</span>
                      </button>

                      <div className="flex items-center gap-1 px-2 font-mono text-sm font-bold text-white">
                        <span>第 {currentPage} 頁</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">共 {analysis.totalPages} 頁</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(analysis.totalPages, p + 1))}
                        disabled={currentPage >= analysis.totalPages}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                      >
                        <span>下一頁</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {Array.from({ length: analysis.totalPages }).map((_, i) => (
                        <button
                          key={`page-btn-${i + 1}`}
                          type="button"
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                            currentPage === i + 1
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* A3 單頁真實畫布呈現 (420mm x 297mm 比例) */}
                  <div
                    className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 relative transition-all"
                    style={{
                      aspectRatio: '420 / 297',
                      maxWidth: `${(1200 * zoomLevel) / 100}px`,
                    }}
                  >
                    <img
                      src={analysis.pages[currentPage - 1]?.a3DataUrl}
                      alt={`第 ${currentPage} 頁完整 A3 橫式列印預覽`}
                      className="w-full h-full object-contain bg-[#F8FAFC]"
                    />
                  </div>

                  <div className="text-center text-xs text-slate-400">
                    此預覽完全比照 A3 橫式 PDF 實體輸出，包含上方深藍色機密報告頁首與底部頁碼條。
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* 底部輔助工具列 */}
      <footer className="shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>版面防截斷檢測模式</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            全卷模式下可直接<strong>拖曳紅色截斷線</strong>微調切頁；確認滿意後點擊右上角「確認無誤，立即下載 PDF」。
          </span>
        </div>

        {/* 佈局即時調整反饋浮動提示 */}
        {layoutNotice && (
          <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
            <div className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-2xl border-2 border-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>{layoutNotice}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            關閉視窗 (Esc)
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
};
