import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Search,
  BookOpen,
  Layout,
  Layers,
  CheckCircle2,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import { TrainingMaterial } from '../../types';
import { getPdfPreviewData } from '../../utils/trainingUtils';

interface PdfViewerModalProps {
  material: TrainingMaterial | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ material, onClose }) => {
  const pages = material ? getPdfPreviewData(material) : [];
  const totalPages = pages.length;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'sepia'>('light');
  const [viewMode, setViewMode] = useState<'page' | 'slide'>('page');

  // Keyboard navigation
  useEffect(() => {
    if (!material) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, isFullscreen, onClose, material]);

  if (!material) return null;

  const activePageData = pages[currentPage - 1] || pages[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (material.fileUrl && material.fileUrl.startsWith('http')) {
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = material.fileName || `${material.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`已開始下載 PDF 講義檔案「${material.fileName || material.title + '.pdf'}」！`);
    }
  };

  const isConverted = Boolean(material.convertedFrom);
  const origFormat = (material.convertedFrom || '').toUpperCase();

  return (
    <div className={`fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs transition-all ${isFullscreen ? 'p-0' : ''}`}>
      <div
        className={`bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-screen h-screen rounded-none border-0' : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Control Toolbar */}
        <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
          {/* File Title & Converted Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md" title={material.title}>
                  {material.title}
                </h3>
                {isConverted ? (
                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 text-blue-300 rounded text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-blue-300" />
                    由 {origFormat} 轉為 PDF
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded text-[10px] font-bold shrink-0">
                    PDF 標準講義
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {material.fileName || `${material.title}.pdf`} · 檔案大小: {material.fileSize || '3.2 MB'} · 類別: {material.categoryName || material.category}
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Page Navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                title="上一頁 (PageUp / ←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 text-xs font-mono font-semibold text-slate-200">
                <span>{currentPage}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                title="下一頁 (PageDown / →)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                disabled={zoomLevel <= 75}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 rounded transition-colors"
                title="縮小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-xs font-mono text-slate-300 min-w-[42px] text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
                disabled={zoomLevel >= 175}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 rounded transition-colors"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode & TOC Toggles */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setShowToc((v) => !v)}
                className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  showToc ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="切換章節目錄"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">目錄</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'page' ? 'slide' : 'page')}
                className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'slide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="切換講義/簡報模式"
              >
                <Layout className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{viewMode === 'page' ? '講義排版' : '投影片排版'}</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                if (themeMode === 'light') setThemeMode('sepia');
                else if (themeMode === 'sepia') setThemeMode('dark');
                else setThemeMode('light');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title={`切換閱讀色調 (目前: ${themeMode === 'light' ? '純白' : themeMode === 'sepia' ? '暖色' : '夜間'})`}
            >
              {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : themeMode === 'sepia' ? <BookOpen className="w-4 h-4 text-orange-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* Action Buttons: Download / Print / Fullscreen / Close */}
            <button
              onClick={handleDownload}
              className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
              title="下載 PDF 文件"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">下載 PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors hidden sm:flex items-center"
              title="列印文件"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title={isFullscreen ? '退出全螢幕' : '全螢幕檢視'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="關閉預覽"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden bg-slate-950">
          {/* Table of Contents Sidebar */}
          {showToc && (
            <aside className="w-64 sm:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋講義內容關鍵字..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 text-[11px] font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>章節目錄與縮圖 ({pages.length} 頁)</span>
                <span className="text-[10px] text-teal-400">點擊跳頁</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {pages.map((page, idx) => {
                  const isActive = currentPage === page.pageNumber;
                  const isMatch = searchQuery ? JSON.stringify(page).toLowerCase().includes(searchQuery.toLowerCase()) : true;

                  if (!isMatch) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page.pageNumber)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-teal-950/60 border-teal-500 text-teal-200 shadow-md ring-1 ring-teal-500/50'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          isActive ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {page.pageNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{page.chapterTitle}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {page.sections?.[0]?.heading || '專業工程圖文規範'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Document Meta Info Card */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>遠雄營造內部培訓數位浮水印</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {material.uploadedBy ? `編審 / 講師: ${material.uploadedBy}` : '遠雄營造總部訓練中心'}
                </p>
              </div>
            </aside>
          )}

          {/* Document Render Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className={`transition-transform duration-150 w-full ${
                viewMode === 'slide' ? 'max-w-4xl aspect-video' : 'max-w-3xl min-h-[960px]'
              }`}
            >
              {/* Actual Paper Document Layout */}
              <div
                className={`relative rounded-xl shadow-2xl p-8 sm:p-12 transition-colors duration-200 border ${
                  themeMode === 'light'
                    ? 'bg-white text-slate-900 border-slate-200'
                    : themeMode === 'sepia'
                    ? 'bg-[#fbf0d9] text-[#433422] border-[#e4d4b2]'
                    : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}
              >
                {/* Background Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none overflow-hidden rotate-[-25deg]">
                  <span className="text-6xl sm:text-7xl font-black uppercase tracking-widest text-center leading-relaxed">
                    FARGLORY TRAINING
                    <br />
                    遠雄營造 內部教材
                  </span>
                </div>

                {/* Header of PDF Page */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span className="font-bold tracking-wider text-slate-600 dark:text-slate-300">
                      遠雄營造工程教育訓練教材 (Farglory Construction TMS)
                    </span>
                  </div>
                  <div className="font-mono text-[11px]">
                    第 {activePageData.pageNumber} 頁 / 共 {totalPages} 頁
                  </div>
                </div>

                {/* Chapter Title */}
                <div className="mb-6">
                  <div className="inline-block px-2.5 py-1 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-md text-xs font-bold mb-2">
                    {activePageData.chapterTitle}
                  </div>
                </div>

                {/* Document Sections Content */}
                <div className="space-y-6">
                  {activePageData.sections?.map((sec: any, secIdx: number) => (
                    <div key={secIdx} className="space-y-3">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-600 rounded-full"></span>
                        {sec.heading}
                      </h4>

                      {sec.content && (
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90 font-normal text-justify">
                          {sec.content}
                        </p>
                      )}

                      {sec.highlight && (
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium leading-relaxed">
                          {sec.highlight}
                        </div>
                      )}

                      {/* Points List */}
                      {sec.points && sec.points.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {sec.points.map((pt: string, ptIdx: number) => (
                            <div key={ptIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Table Data */}
                      {sec.tableData && (
                        <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                                {sec.tableData.headers.map((h: string, hIdx: number) => (
                                  <th key={hIdx} className="p-2.5">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {sec.tableData.rows.map((row: string[], rIdx: number) => (
                                <tr
                                  key={rIdx}
                                  className={
                                    rIdx % 2 === 0
                                      ? 'bg-white dark:bg-slate-900/50'
                                      : 'bg-slate-50/70 dark:bg-slate-800/30'
                                  }
                                >
                                  {row.map((cell: string, cIdx: number) => (
                                    <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer of PDF Page */}
                <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>版權所有 © 2026 遠雄營造 (Farglory Construction) · 嚴禁未經授權對外散布</span>
                  <span className="font-mono">Doc ID: {material.id}</span>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Bar Controls */}
        <footer className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <span>使用鍵盤左右鍵 (← / →) 或 PageUp / PageDown 快速翻頁</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300">
              檢視比例: {zoomLevel}%
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-30"
            >
              下一頁 ➔
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
