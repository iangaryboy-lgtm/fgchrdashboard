import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Presentation,
  FileSpreadsheet,
  Download,
  Building2,
  Globe,
} from 'lucide-react';
import {
  detectOneDriveDocType,
} from '../../utils/trainingUtils';

export interface OneDriveDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    id?: string;
    title: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: string;
    version?: string;
    category?: string;
    categoryName?: string;
    description?: string;
    uploadedBy?: string;
    uploadedAt?: string;
    convertedFrom?: string;
  } | null;
}

export const OneDriveDocumentViewerModal: React.FC<OneDriveDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !material) return null;

  const docType = detectOneDriveDocType(material.fileUrl, material.title, material.fileType);

  const handleCopyLink = () => {
    if (material.fileUrl) {
      navigator.clipboard.writeText(material.fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeOpen = () => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (material.fileUrl && material.fileUrl.startsWith('http')) {
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = material.fileName || `${material.title}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      handleNativeOpen();
    }
  };

  // Get Brand Badge styling
  const getDocTypeBadge = () => {
    switch (docType) {
      case 'word':
        return {
          label: 'Microsoft Word',
          color: 'bg-blue-600 text-white',
          icon: FileText,
        };
      case 'excel':
        return {
          label: 'Microsoft Excel',
          color: 'bg-emerald-600 text-white',
          icon: FileSpreadsheet,
        };
      case 'powerpoint':
        return {
          label: 'Microsoft PowerPoint',
          color: 'bg-orange-600 text-white',
          icon: Presentation,
        };
      case 'pdf':
      default:
        return {
          label: '雲端掛載文件 / PDF',
          color: 'bg-indigo-600 text-white',
          icon: Globe,
        };
    }
  };

  const badge = getDocTypeBadge();
  const IconComponent = badge.icon;

  return (
    <div
      id="onedrive-doc-viewer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6 transition-all"
    >
      <div
        id="onedrive-doc-viewer-container"
        className={`bg-slate-900 text-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all border border-slate-700 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-3xl max-h-[90vh]'
        }`}
      >
        {/* Top Header */}
        <header className="bg-slate-950 px-4 py-3.5 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-4">
            <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  {badge.label}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
                  {material.category || material.categoryName || '專業訓練教材'}
                </span>
                {material.version && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 font-mono">
                    {material.version}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-1" title={material.title}>
                {material.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {material.fileUrl && (
              <button
                type="button"
                id="btn-copy-onedrive-link-top"
                onClick={handleCopyLink}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                title="複製檔案共用連結"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? '已複製連結' : '複製連結'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-toggle-fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title={isFullscreen ? '還原視窗' : '全螢幕檢視'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="btn-close-onedrive-modal"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 transition"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body: Only upper description and forward button */}
        <div className="flex-1 bg-slate-900 overflow-y-auto p-5 sm:p-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>微軟 365 企業雲端掛載來源</span>
                </div>
                <h3 className="text-xl font-bold text-white leading-snug">
                  {material.fileName || material.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  本教材已連結至遠雄集團微軟 365 / SharePoint 雲端伺服器。因企業資訊安全政策（X-Frame-Options 跨網域防護），微軟禁止在外部系統框架內直接內嵌。請使用下方按鈕於微軟官方原生環境開啟閱讀。
                </p>

                {/* File Metadata Tags */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  {material.fileSize && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      檔案大小：<strong className="text-white">{material.fileSize}</strong>
                    </span>
                  )}
                  {material.uploadedBy && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      上傳/提供：<strong className="text-white">{material.uploadedBy}</strong>
                    </span>
                  )}
                  {material.uploadedAt && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      掛載時間：<strong className="text-white">{material.uploadedAt}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-64 shrink-0">
                <button
                  type="button"
                  id="btn-main-open-native-m365"
                  onClick={handleNativeOpen}
                  className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/40 transition group cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition" />
                  <span>前往微軟 365 原生開啟</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-sub-copy-link"
                    onClick={handleCopyLink}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? '已複製' : '複製網址'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-sub-download"
                    onClick={handleDownload}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>下載檔案</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cloud Link Path Display */}
            {material.fileUrl && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs">
                <span className="text-slate-500 shrink-0">雲端網址：</span>
                <span className="text-slate-400 font-mono truncate select-all bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex-1">
                  {material.fileUrl}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>遠雄營造專業訓練學習系統 · 微軟 365 雲端檔案整合</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition"
          >
            關閉視窗
          </button>
        </footer>
      </div>
    </div>
  );
};
