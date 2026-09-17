import React, { useState, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  Upload,
  Video,
  FileCode,
  Globe,
  Eye,
  ExternalLink,
  BookOpen,
  Sparkles,
  Download,
  FolderOpen,
  Play,
  CheckCircle2,
  Layers,
  HelpCircle,
  FileType,
  ArrowRight,
  RefreshCw,
  Clock,
  Briefcase,
  Share2,
  ClipboardCheck,
  FileSpreadsheet,
  Presentation,
  Cloud,
} from 'lucide-react';
import { TrainingMaterial } from '../../../types';
import {
  detectMaterialMediaType,
  getYouTubeEmbedUrl,
  extractYouTubeVideoId,
  isYouTubeUrl,
  isMicrosoftVideoUrl,
  getMicrosoftVideoEmbedUrl,
  extractEmbedUrlFromIframe,
  convertOfficeFileToPdf,
  getPdfPreviewData,
  isOneDriveDocUrl,
  detectOneDriveDocType,
  getOneDriveDocEmbedUrl,
} from '../../../utils/trainingUtils';
import { PdfViewerModal } from '../../common/PdfViewerModal';
import { OneDriveDocumentViewerModal } from '../../common/OneDriveDocumentViewerModal';

export const CourseMaterialsTab: React.FC = () => {
  const {
    trainingMaterials,
    addTrainingMaterial,
    updateTrainingMaterial,
    deleteTrainingMaterial,
    internalCourses,
    trainingCategories,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Previewer modals
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [pdfModalMaterial, setPdfModalMaterial] = useState<TrainingMaterial | null>(null);
  const [oneDriveModalMaterial, setOneDriveModalMaterial] = useState<TrainingMaterial | null>(null);
  const [teamsPreviewMode, setTeamsPreviewMode] = useState<'embed' | 'simulation'>('embed');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<string>('youtube');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('YouTube 線上串流');
  const [categoryName, setCategoryName] = useState('專業技術');
  const [description, setDescription] = useState('');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(1200);

  // Drag and Drop & Conversion States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatusText, setConversionStatusText] = useState('');
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingMaterial(null);
    setTitle('');
    setFileType('onedrive_doc');
    setFileUrl('https://farglory-my.sharepoint.com/:w:/r/personal/eng_farglory_com/Documents/sop-standard-guide.docx?action=embedview');
    setFileSize('1.8 MB (OneDrive Word)');
    setCategoryName(trainingCategories[0]?.name || '專業技術');
    setDescription('');
    setVideoDurationSeconds(1200);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: TrainingMaterial) => {
    setEditingMaterial(mat);
    setTitle(mat.title || '');
    setFileType(mat.fileType || 'youtube');
    setFileUrl(mat.fileUrl || '');
    setFileSize(mat.fileSize || '線上資源');
    setCategoryName(mat.categoryName || mat.category || '專業技術');
    setDescription(mat.description || '');
    setVideoDurationSeconds(mat.videoDurationSeconds ?? 1200);
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: string) => {
    setFileType(newType);
    if (newType === 'onedrive_doc') {
      if (!fileUrl || (!fileUrl.includes('sharepoint') && !fileUrl.includes('1drv.ms') && !fileUrl.includes('onedrive'))) {
        setFileUrl('https://farglory-my.sharepoint.com/:w:/r/personal/eng_farglory_com/Documents/sop-standard-guide.docx?action=embedview');
      }
      setFileSize('1.8 MB (OneDrive 雲端文件)');
    } else if (newType === 'youtube') {
      if (!fileUrl || !fileUrl.includes('youtu')) {
        setFileUrl('https://www.youtube.com/watch?v=kYJvPoxnN1o');
      }
      setFileSize('YouTube 線上串流');
    } else if (newType === 'teams_onedrive') {
      if (!fileUrl || (!fileUrl.includes('sharepoint') && !fileUrl.includes('1drv.ms') && !fileUrl.includes('onedrive') && !fileUrl.includes('teams'))) {
        setFileUrl('https://farglory.sharepoint.com/sites/engineering/_layouts/15/embed.aspx?UniqueId=teams-rec-iot-2026');
      }
      setFileSize('微軟 Teams 錄影 / OneDrive 雲端串流');
    } else if (newType === 'video') {
      if (!fileUrl || fileUrl.includes('youtu')) {
        setFileUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      }
      setFileSize('110 MB');
    } else if (newType === 'pdf') {
      if (!fileUrl || fileUrl.includes('youtu')) {
        setFileUrl('https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf');
      }
      setFileSize('4.5 MB');
    } else if (newType === 'office') {
      setFileSize('3.2 MB (自動轉為 PDF)');
    } else if (newType === 'link') {
      setFileSize('外部網頁連結');
    }
  };

  const handleApplySampleOneDriveDoc = (sampleUrl: string, sampleTitle: string, sampleSize: string) => {
    setFileType('onedrive_doc');
    setFileUrl(sampleUrl);
    setFileSize(sampleSize);
    setTitle(sampleTitle);
  };

  const handleApplySampleYouTube = (sampleUrl: string, sampleTitle?: string) => {
    setFileType('youtube');
    setFileUrl(sampleUrl);
    setFileSize('YouTube 線上串流');
    if (sampleTitle && !title) {
      setTitle(sampleTitle);
    }
  };

  const handleApplySampleMicrosoft = (sampleUrl: string, sampleTitle?: string) => {
    setFileType('teams_onedrive');
    setFileUrl(sampleUrl);
    setFileSize('微軟 Teams 錄影 / OneDrive 企業串流');
    if (sampleTitle && !title) {
      setTitle(sampleTitle);
    }
  };

  // Convert File Process
  const processUploadedFile = (fileName: string, fileSizeStr?: string, category: string = '專業技術') => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isOffice = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(ext);

    setIsConverting(true);
    setConversionProgress(15);
    setConversionStatusText(
      isOffice
        ? `正在讀取 Office 文件「${fileName}」並分析投影片/試算表版面排版結構...`
        : `正在解析 PDF 文件「${fileName}」並建立即時線上預覽索引...`
    );

    setTimeout(() => {
      setConversionProgress(55);
      setConversionStatusText(
        isOffice
          ? `執行 Office 轉 PDF 向量引擎轉換 (嵌入字型、圖表與高清公式樣式)...`
          : `正在最佳化 PDF 講義頁面渲染流...`
      );

      setTimeout(() => {
        setConversionProgress(90);
        setConversionStatusText(`正在產出標準 PDF 教材並建立章節目錄索引...`);

        setTimeout(() => {
          setConversionProgress(100);

          if (isOffice) {
            const converted = convertOfficeFileToPdf({
              name: fileName,
              size: fileSizeStr || '3.5 MB (已轉為標準 PDF)',
              category,
              categoryName: category,
            });

            addTrainingMaterial(converted);
            setConvertedNotice(`已成功將 Office「${fileName}」自動轉檔為「${converted.fileName}」，支援即時線上預覽！`);
          } else {
            const baseName = fileName.replace(/\.pdf$/i, '');
            const pdfData = {
              title: baseName,
              fileName: fileName,
              fileSize: fileSizeStr || '4.2 MB',
              fileType: 'pdf',
              fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
              category,
              categoryName: category,
              version: 'v1.0',
              description: `遠雄工程專業講義教材「${baseName}」，支援線上全頁預覽、縮放與目錄導覽。`,
              uploadedAt: new Date().toISOString().split('T')[0],
              uploadedBy: '工務教育部 (系統管理員)',
              pdfPageCount: 3,
            };
            addTrainingMaterial(pdfData);
            setConvertedNotice(`已成功上傳 PDF 講義「${fileName}」！可立即點擊預覽。`);
          }

          setIsConverting(false);
          setConversionProgress(0);
          setTimeout(() => setConvertedNotice(null), 6000);
        }, 400);
      }, 500);
    }, 500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      processUploadedFile(file.name, sizeStr, categoryName);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      processUploadedFile(file.name, sizeStr, categoryName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isOffice = fileType === 'office';
    const isVid = fileType === 'video' || fileType === 'youtube' || !!extractYouTubeVideoId(fileUrl);

    if (isOffice) {
      // Auto convert office input to PDF
      const converted = convertOfficeFileToPdf({
        name: title.endsWith('.pptx') || title.endsWith('.docx') || title.endsWith('.xlsx') ? title : `${title}.pptx`,
        category: categoryName,
        categoryName,
        url: fileUrl || undefined,
      });

      if (editingMaterial) {
        updateTrainingMaterial(editingMaterial.id, {
          ...converted,
          title,
          categoryName,
          category: categoryName,
          description: description || converted.description,
        });
      } else {
        addTrainingMaterial({
          ...converted,
          title,
          categoryName,
          category: categoryName,
          description: description || converted.description,
        });
      }
    } else {
      if (editingMaterial) {
        updateTrainingMaterial(editingMaterial.id, {
          title,
          fileType,
          fileUrl,
          fileSize,
          categoryName,
          category: categoryName,
          description,
          videoDurationSeconds: isVid ? Number(videoDurationSeconds) : undefined,
        });
      } else {
        addTrainingMaterial({
          title,
          fileType,
          fileUrl,
          fileSize,
          categoryName,
          category: categoryName,
          description,
          videoDurationSeconds: isVid ? Number(videoDurationSeconds) : undefined,
        });
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, matTitle: string) => {
    if (window.confirm(`確定要刪除教材「${matTitle}」嗎？已綁定此教材的課程將無法預覽。`)) {
      deleteTrainingMaterial(id);
    }
  };

  const filtered = trainingMaterials.filter((mat) => {
    if (selectedType !== 'all') {
      const detected = detectMaterialMediaType(mat);
      if (selectedType === 'onedrive_doc' && detected !== 'onedrive_doc' && !isOneDriveDocUrl(mat.fileUrl)) return false;
      if (selectedType === 'youtube' && detected !== 'youtube') return false;
      if (selectedType === 'teams_onedrive' && detected !== 'teams_onedrive') return false;
      if (selectedType === 'video' && detected !== 'video') return false;
      if (selectedType === 'pdf' && detected !== 'pdf') return false;
      if (selectedType === 'office' && detected !== 'office' && !mat.convertedFrom) return false;
      if (selectedType === 'scorm' && detected !== 'scorm') return false;
      if (selectedType === 'link' && detected !== 'link') return false;
    }
    if (selectedCategory !== 'all' && (mat.categoryName || mat.category) !== selectedCategory) {
      return false;
    }
    if (
      searchTerm &&
      !mat.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(mat.categoryName || mat.category)?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getIconForType = (mat: TrainingMaterial) => {
    const detected = detectMaterialMediaType(mat);
    if (detected === 'onedrive_doc' || isOneDriveDocUrl(mat.fileUrl)) {
      const docType = detectOneDriveDocType(mat.fileUrl, mat.title);
      switch (docType) {
        case 'word':
          return (
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          );
        case 'excel':
          return (
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          );
        case 'powerpoint':
          return (
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200 shrink-0">
              <Presentation className="w-4 h-4" />
            </div>
          );
        case 'pdf':
        default:
          return (
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          );
      }
    }

    switch (detected) {
      case 'youtube':
        return (
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
            <Play className="w-4 h-4 fill-red-600" />
          </div>
        );
      case 'teams_onedrive':
        return (
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'video':
        return (
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0">
            <Video className="w-4 h-4" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'office':
        return (
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'scorm':
        return (
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
        );
      case 'link':
      default:
        return (
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleOpenMaterial = (mat: TrainingMaterial) => {
    const detected = detectMaterialMediaType(mat);
    if (detected === 'onedrive_doc' || isOneDriveDocUrl(mat.fileUrl)) {
      setOneDriveModalMaterial(mat);
    } else if (detected === 'pdf' || mat.convertedFrom) {
      setPdfModalMaterial(mat);
    } else {
      setPreviewMaterial(mat);
    }
  };

  // Preview detection
  const previewMediaType = previewMaterial ? detectMaterialMediaType(previewMaterial) : 'pdf';
  const previewYtEmbedUrl = previewMaterial ? getYouTubeEmbedUrl(previewMaterial.fileUrl, true) : null;
  const previewMsEmbedUrl = previewMaterial ? getMicrosoftVideoEmbedUrl(previewMaterial.fileUrl) : null;

  // Form previews
  const formYtEmbedUrl = getYouTubeEmbedUrl(fileUrl, false);
  const formMsEmbedUrl = isMicrosoftVideoUrl(fileUrl) ? getMicrosoftVideoEmbedUrl(fileUrl) : null;
  const formOneDriveEmbedUrl = isOneDriveDocUrl(fileUrl) ? getOneDriveDocEmbedUrl(fileUrl) : null;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 font-semibold">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">課程教材庫管理</h3>
            <p className="text-xs text-slate-500">
              支援 PDF 講義線上直接預覽、Word / Excel / PPT 自動轉 PDF、YouTube 影音串流及 SCORM 互動教材
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            上傳 Office (自動轉 PDF)
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            手動新增教材 / YouTube
          </button>
        </div>
      </div>

      {/* Office to PDF Conversion Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 transition-all duration-200 ${
          isDragging
            ? 'bg-blue-50/80 border-blue-500 shadow-lg scale-[1.005]'
            : 'bg-slate-50/70 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isConverting ? (
          <div className="max-w-md mx-auto py-2 text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Office 轉 PDF 智能排版引擎處理中...</h4>
            <p className="text-xs text-slate-500">{conversionStatusText}</p>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">{conversionProgress}%</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    PDF 講義預覽 & Word / Excel / PPT 自動轉 PDF 專區
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
                    智能轉檔支援
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  拖曳檔案至此或點擊按鈕，上傳 Word (.docx)、Excel (.xlsx)、PPT (.pptx) 將自動轉為標準高解析 PDF 講義，並可在系統內直接線上全螢幕翻頁預覽！
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => processUploadedFile('2026_遠雄營造鋼骨帷幕牆組裝精度管控與風雨試驗.pptx', '15.4 MB', '專業技術')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                示範轉檔 PPT 簡報
              </button>
              <button
                type="button"
                onClick={() => processUploadedFile('工程進度要徑法(CPM)影響工期計算與索賠模型.xlsx', '2.8 MB', '法規合約')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                示範轉檔 Excel 表格
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                瀏覽選取電腦檔案
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Converted Success Notice Banner */}
      {convertedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{convertedNotice}</span>
          </div>
          <button
            onClick={() => setConvertedNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜尋教材名稱、分類、PDF 或影音連結..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">檔案類型：</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">全部類型</option>
            <option value="onedrive_doc">☁️ 微軟 OneDrive 雲端文件 (Word/Excel/PPT/PDF)</option>
            <option value="pdf">📄 PDF 講義 (支援線上預覽)</option>
            <option value="youtube">▶️ YouTube 影音影片</option>
            <option value="teams_onedrive">💼 微軟 Teams / OneDrive 串流</option>
            <option value="video">🎥 MP4 影音課程</option>
            <option value="office">📊 Office 轉 PDF 講義</option>
            <option value="scorm">🧩 SCORM 互動教材</option>
            <option value="link">🌐 外部網頁 / 雲端連結</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">類別：</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">全部類別</option>
            {trainingCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mat) => {
          // Count linked courses
          const linkedCourses = internalCourses.filter((c) =>
            c.materials?.some((m) => m.id === mat.id)
          );
          const detectedType = detectMaterialMediaType(mat);
          const isOneDrive = detectedType === 'onedrive_doc' || isOneDriveDocUrl(mat.fileUrl);
          const oneDriveDocType = isOneDrive ? detectOneDriveDocType(mat.fileUrl, mat.title) : null;
          const isPdf = detectedType === 'pdf' || !!mat.convertedFrom;

          return (
            <div
              key={mat.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  {getIconForType(mat)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isOneDrive ? (
                        oneDriveDocType === 'word' ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            OneDrive Word 文件
                          </span>
                        ) : oneDriveDocType === 'excel' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <FileSpreadsheet className="w-2.5 h-2.5" />
                            OneDrive Excel 試算表
                          </span>
                        ) : oneDriveDocType === 'powerpoint' ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Presentation className="w-2.5 h-2.5" />
                            OneDrive PPT 簡報
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            OneDrive PDF 圖說
                          </span>
                        )
                      ) : detectedType === 'youtube' ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-red-700" />
                          YouTube 影音
                        </span>
                      ) : detectedType === 'teams_onedrive' ? (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          Teams / OneDrive 串流
                        </span>
                      ) : detectedType === 'video' ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold">
                          MP4 影音
                        </span>
                      ) : isPdf ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          PDF 講義 (可線上預覽)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">
                          {mat.fileType}
                        </span>
                      )}

                      {mat.convertedFrom && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                          由 {mat.convertedFrom.toUpperCase()} 轉為 PDF
                        </span>
                      )}

                      {(mat.categoryName || mat.category) && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md text-[10px] font-semibold">
                          {mat.categoryName || mat.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1 truncate" title={mat.title}>
                      {mat.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {mat.description || '暫無教材備註說明'}
                </p>

                {/* Meta details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>檔案: {isOneDrive ? '微軟 OneDrive 雲端掛載' : detectedType === 'youtube' ? 'YouTube 串流' : detectedType === 'teams_onedrive' ? 'Teams/OneDrive 雲端串流' : mat.fileSize || 'PDF 文件'}</span>
                  <span>建立: {mat.uploadedAt || '2026-03-01'}</span>
                </div>

                {isOneDrive && (
                  <div className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-800 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-sky-600" />
                      支援微軟 365 雲端內嵌與高清閱讀模式
                    </span>
                    <span className="text-[10px] uppercase font-mono">{oneDriveDocType}</span>
                  </div>
                )}

                {isPdf && !isOneDrive && (
                  <div className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-rose-600" />
                      支援高解析 PDF 線上閱讀與縮放翻頁
                    </span>
                    <span>3 頁講義</span>
                  </div>
                )}

                {(detectedType === 'video' || detectedType === 'youtube' || detectedType === 'teams_onedrive') && (
                  <div
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center justify-between ${
                      detectedType === 'youtube'
                        ? 'text-red-700 bg-red-50/70 border-red-200'
                        : detectedType === 'teams_onedrive'
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                        : 'text-purple-700 bg-purple-50 border-purple-100'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {detectedType === 'youtube' ? (
                        <Play className="w-3 h-3 fill-red-600" />
                      ) : detectedType === 'teams_onedrive' ? (
                        <Briefcase className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <Video className="w-3 h-3" />
                      )}
                      線上即時串流播放
                    </span>
                    <span>{mat.videoDurationSeconds ? `${Math.round(mat.videoDurationSeconds / 60)} 分鐘` : '完整單元'}</span>
                  </div>
                )}

                {/* Linked courses info */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">目前使用課程：</span>
                  {linkedCourses.length > 0 ? (
                    <span className="text-teal-700 font-medium"> {linkedCourses.length} 堂課程綁定中</span>
                  ) : (
                    <span className="text-slate-400"> 尚未綁定課程</span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenMaterial(mat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors text-white ${
                    isOneDrive
                      ? 'bg-sky-700 hover:bg-sky-800'
                      : detectedType === 'youtube'
                      ? 'bg-red-600 hover:bg-red-700'
                      : detectedType === 'teams_onedrive'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : detectedType === 'video'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : isPdf
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {isOneDrive ? (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      線上閱讀 (OneDrive / 365)
                    </>
                  ) : detectedType === 'youtube' || detectedType === 'video' || detectedType === 'teams_onedrive' ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      立即播放影片
                    </>
                  ) : isPdf ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      線上預覽 PDF 講義
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      教材預覽
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(mat)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                    title="編輯教材"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id, mat.title)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="刪除教材"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">查無符合條件的課程教材</p>
          <p className="text-xs text-slate-400 mt-1">請點擊上方按鈕上傳 Office 轉 PDF、掛載 YouTube 影片或新增教材</p>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfModalMaterial && (
        <PdfViewerModal material={pdfModalMaterial} onClose={() => setPdfModalMaterial(null)} />
      )}

      {/* OneDrive / SharePoint Document Viewer Modal */}
      {oneDriveModalMaterial && (
        <OneDriveDocumentViewerModal
          isOpen={!!oneDriveModalMaterial}
          material={oneDriveModalMaterial}
          onClose={() => setOneDriveModalMaterial(null)}
        />
      )}

      {/* Video & External Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {getIconForType(previewMaterial)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewMaterial.title}</h3>
                  <p className="text-xs text-slate-500">
                    類型：{previewMediaType.toUpperCase()} · 分類：{previewMaterial.categoryName || previewMaterial.category || '專業訓練'}
                    {previewMaterial.fileSize && ` · 大小/來源：${previewMaterial.fileSize}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 flex-1 overflow-y-auto bg-slate-950 text-white flex flex-col items-center justify-center min-h-[420px]">
              {/* YouTube Video Player */}
              {previewMediaType === 'youtube' || previewYtEmbedUrl ? (
                <div className="w-full max-w-3xl space-y-4">
                  <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
                    <iframe
                      src={previewYtEmbedUrl || 'https://www.youtube.com/embed/kYJvPoxnN1o?autoplay=1&rel=0'}
                      title={previewMaterial.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-white" />
                          YouTube 官方即時串流播放
                        </span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 支援全螢幕 / 畫質切換
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1.5 leading-relaxed">
                        {previewMaterial.description || '本 YouTube 影音教材已成功掛載至遠雄專業訓練系統，學員可於線上教室進行播放研習。'}
                      </p>
                    </div>

                    <a
                      href={previewMaterial.fileUrl.startsWith('http') ? previewMaterial.fileUrl : `https://www.youtube.com/watch?v=${extractYouTubeVideoId(previewMaterial.fileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      在新視窗以 YouTube 開啟
                    </a>
                  </div>
                </div>
              ) : previewMediaType === 'teams_onedrive' || previewMsEmbedUrl ? (
                /* Microsoft Teams / OneDrive / Stream Video Player */
                <div className="w-full max-w-3xl space-y-4">
                  {/* Controls & Mode Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs text-white">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTeamsPreviewMode('embed')}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                          teamsPreviewMode === 'embed'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        微軟內嵌串流 (SharePoint / Stream)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamsPreviewMode('simulation')}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                          teamsPreviewMode === 'simulation'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        系統高畫質模擬播放 (免登入測試)
                      </button>
                    </div>

                    <a
                      href={previewMaterial.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      在新分頁直接播放 (微軟原廠完整體驗) ↗
                    </a>
                  </div>

                  {/* Player Canvas */}
                  <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
                    {teamsPreviewMode === 'embed' ? (
                      <iframe
                        src={previewMsEmbedUrl || previewMaterial.fileUrl}
                        title={previewMaterial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        autoPlay
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        className="w-full h-full object-contain"
                      >
                        您的瀏覽器不支援 HTML5 影片播放。
                      </video>
                    )}
                  </div>

                  {/* Informational Guidance & Troubleshooting Box */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5" />
                            微軟 Teams / OneDrive 企業雲端串流
                          </span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 支援 Stream 播放器與多畫質切換
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1.5 leading-relaxed">
                          {previewMaterial.description || '本教材採用微軟 Teams 會議錄影 / OneDrive 雲端影音串流技術，已與企業 Office 365 帳號整合，學員可於系統線上無縫觀看。'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(previewMaterial.fileUrl);
                            alert('已成功複製影片連結至剪貼簿！');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          複製連結
                        </button>
                        <a
                          href={previewMaterial.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          在微軟雲端開啟
                        </a>
                      </div>
                    </div>

                    {/* Troubleshooting Tips */}
                    <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-slate-300 text-[11px] leading-relaxed space-y-1">
                      <div className="font-bold text-indigo-300 flex items-center gap-1">
                        <span>💡 影片播放排障提示：</span>
                      </div>
                      <p>
                        1. <strong>瀏覽器 Cookie 限制</strong>：微軟 SharePoint / OneDrive 含有嚴格的企業安全性保護，若您的瀏覽器封鎖第三方 Cookie 或未登入 Microsoft 365，請點擊上方<strong>【在新分頁直接播放】</strong>即可正常觀看。
                      </p>
                      <p>
                        2. <strong>取得最佳內嵌代碼</strong>：若想獲得 100% 最佳內嵌體驗，可在微軟 Teams / Stream 影片中點選<strong>「共用 (Share)」➜「內嵌代碼 (Embed)」</strong>，將產生的網址貼入教材網址中。
                      </p>
                    </div>
                  </div>
                </div>
              ) : previewMediaType === 'video' ? (
                /* MP4 / HTML5 Video Player */
                <div className="w-full max-w-3xl space-y-4">
                  <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                    <video
                      controls
                      autoPlay
                      src={previewMaterial.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                      className="w-full h-full object-contain"
                    >
                      您的瀏覽器不支援 HTML5 影片播放。
                    </video>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-purple-400 font-bold">高畫質 MP4 影音課程</span>
                      <p className="text-slate-400 mt-0.5">{previewMaterial.description || '線上影音教材 (支援學員觀看進度記錄與分段測驗檢核)'}</p>
                    </div>
                    {previewMaterial.fileUrl?.startsWith('http') && (
                      <a
                        href={previewMaterial.fileUrl}
                        download
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下載原始影片
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* External Link / Web Resource */
                <div className="w-full max-w-xl bg-white text-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Globe className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{previewMaterial.title}</h4>
                        <span className="text-xs text-slate-400">外部學習資源 / 雲端連結</span>
                      </div>
                    </div>
                    {previewMaterial.fileUrl && (
                      <a
                        href={previewMaterial.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        前往外部網頁連結
                      </a>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-800 mb-2">連結網址：</p>
                    <p className="text-teal-700 font-mono break-all">{previewMaterial.fileUrl || '未設定外部連結'}</p>
                    <p className="font-semibold text-slate-800 mt-3 mb-1">內容說明：</p>
                    <p>{previewMaterial.description || '外部研習資源與線上知識庫'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                教材識別碼：<code className="font-mono text-slate-700">{previewMaterial.id}</code>
              </span>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                關閉預覽
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                {editingMaterial ? '編輯教材設定' : '新增課程教材 (支援 PDF & YouTube)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  教材名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 超高層深開挖工法與連續壁實務施工手冊.pdf"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500 focus:bg-white font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">檔案格式類型</label>
                  <select
                    value={fileType || 'youtube'}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="onedrive_doc">☁️ 微軟 OneDrive / SharePoint 雲端文件 (Word/Excel/PPT/PDF 線上掛載)</option>
                    <option value="pdf">📄 PDF 講義文檔 (支援線上預覽)</option>
                    <option value="office">📊 Office 簡報/文件 (Word/Excel/PPT - 自動轉為 PDF)</option>
                    <option value="youtube">▶️ YouTube 影音影片 (可線上即時播放)</option>
                    <option value="teams_onedrive">💼 微軟 Teams 會議錄影 / OneDrive / Stream 影音 (企業雲端串流)</option>
                    <option value="video">🎥 MP4 影音課程 (本機或雲端影音)</option>
                    <option value="scorm">🧩 SCORM 互動數位模組</option>
                    <option value="link">🌐 外部網頁 / 雲端共用連結</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">所屬訓練類別</label>
                  <select
                    value={categoryName || ''}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    {trainingCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OneDrive Documents Specific Notice & Quick Samples */}
              {fileType === 'onedrive_doc' && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2.5 text-xs text-sky-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-sky-800">
                      <Cloud className="w-3.5 h-3.5 text-sky-600" />
                      微軟 OneDrive / SharePoint 雲端文件掛載說明
                    </span>
                    <span className="text-[11px] text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded font-medium">支援 Word · Excel · PPT · PDF</span>
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    在微軟 OneDrive 或 SharePoint 中點選檔案「共用 / 複製連結」，貼入此處即可直接在專業訓練專區與學員教室內進行高畫質線上閱讀、翻頁、全螢幕與試算表結構解析！
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] text-slate-600 font-medium">快速填入範例：</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleOneDriveDoc(
                          'https://farglory-my.sharepoint.com/:w:/r/personal/eng_farglory_com/Documents/sop-standard-guide.docx?action=embedview',
                          '【Word 規範】建築工地地下連續壁與深開挖安全防護標準作業程序 (SOP)',
                          '1.8 MB (OneDrive Word)'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      Word 施工 SOP
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleOneDriveDoc(
                          'https://farglory-my.sharepoint.com/:x:/r/personal/eng_farglory_com/Documents/structural-calculation-sheet.xlsx?action=embedview',
                          '【Excel 試算表】鋼骨結構吊裝受力與風壓即時計算模型',
                          '2.4 MB (OneDrive Excel)'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-2.5 h-2.5" />
                      Excel 結構試算表
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleOneDriveDoc(
                          'https://farglory-my.sharepoint.com/:p:/r/personal/eng_farglory_com/Documents/high-altitude-safety-briefing.pptx?action=embedview',
                          '【PPT 簡報】高空作業與防墜安全防護措施實務培訓教材',
                          '6.8 MB (OneDrive PPT)'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Presentation className="w-2.5 h-2.5" />
                      PPT 安全簡報
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleOneDriveDoc(
                          'https://farglory-my.sharepoint.com/:b:/r/personal/eng_farglory_com/Documents/concrete-compression-test-report.pdf?action=embedview',
                          '【PDF 圖說】自充填混凝土 (SCC) 坍流度與 28 天抗壓強度試驗報告',
                          '3.5 MB (OneDrive PDF)'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      PDF 試驗報告
                    </button>
                  </div>
                </div>
              )}

              {/* Office to PDF Notice */}
              {fileType === 'office' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Office 智能轉檔提示
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    您選擇了 Office 格式（Word/Excel/PPT），系統在儲存時將自動為您轉換為標準向量 PDF 講義檔案，方便學員於各裝置線上即時預覽。
                  </p>
                </div>
              )}

              {/* YouTube Specific Notice & Sample Buttons */}
              {fileType === 'youtube' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-red-700">
                      <Play className="w-3.5 h-3.5 fill-red-600" />
                      YouTube 影音掛載說明
                    </span>
                    <span className="text-[11px] text-red-600">支援 watch?v=、youtu.be、shorts 格式</span>
                  </div>
                  <p className="text-[11px] text-red-700/90 leading-relaxed">
                    輸入 YouTube 影片連結後，系統將自動解析影片 ID 並在前台學習教室與預覽視窗提供無縫串流播放。
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-600">快速填入示範：</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleYouTube(
                          'https://www.youtube.com/watch?v=kYJvPoxnN1o',
                          '超高層深開挖工法與連續壁實務施工紀實'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded text-[10px] font-semibold transition-colors"
                    >
                      深開挖施工紀實
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleYouTube(
                          'https://www.youtube.com/watch?v=6v2L2UGZJAM',
                          '工程進度要徑管理 (CPM) 實務精華'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded text-[10px] font-semibold transition-colors"
                    >
                      工程要徑管理
                    </button>
                  </div>
                </div>
              )}

              {/* Microsoft Teams / OneDrive Specific Notice & Sample Buttons */}
              {fileType === 'teams_onedrive' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs text-indigo-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-indigo-700">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      微軟 Teams 錄影 / OneDrive 影音掛載說明
                    </span>
                    <span className="text-[11px] text-indigo-600">支援 Stream、SharePoint、OneDrive 與 iframe 語法</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    在微軟 Teams 或 OneDrive 影片點選「共用」或「複製連結」（權限設為組織內可檢視），直接貼入此處，系統會自動轉譯為內嵌播放格式，同 YouTube 掛載般在學員教室流暢播放！
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] text-slate-600">快速填入示範：</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleMicrosoft(
                          'https://farglory.sharepoint.com/sites/engineering/_layouts/15/embed.aspx?UniqueId=teams-rec-iot-2026',
                          '【微軟 Teams 錄影】建築智慧工區 IoT 監控與環境感測連線實務'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-semibold transition-colors"
                    >
                      Teams 智慧工區會議錄影
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplySampleMicrosoft(
                          'https://1drv.ms/v/c/farglory-bim-4d-sim-2026?action=embedview',
                          '【OneDrive 影音】BIM 4D 施工模擬與介面衝突排除精華'
                        )
                      }
                      className="px-2 py-0.5 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-semibold transition-colors"
                    >
                      OneDrive BIM 模擬影片
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {fileType === 'youtube'
                      ? 'YouTube 影片網址 / ID'
                      : fileType === 'teams_onedrive'
                      ? 'Teams 錄影 / OneDrive 影片分享連結或內嵌代碼'
                      : '檔案儲存 URL / 雲端連結'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          const cleaned = extractEmbedUrlFromIframe(text) || text.trim();
                          setFileUrl(cleaned);
                          if (isYouTubeUrl(cleaned) && fileType !== 'youtube') {
                            setFileType('youtube');
                          } else if (isMicrosoftVideoUrl(cleaned) && fileType !== 'teams_onedrive') {
                            setFileType('teams_onedrive');
                          }
                        }
                      } catch {
                        // clipboard API might be restricted in some iframe contexts
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    <ClipboardCheck className="w-3 h-3" />
                    從剪貼簿貼上
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={fileUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = extractEmbedUrlFromIframe(val) || val;
                    setFileUrl(cleaned);
                    if (isYouTubeUrl(cleaned) && fileType !== 'youtube') {
                      setFileType('youtube');
                    } else if (isMicrosoftVideoUrl(cleaned) && fileType !== 'teams_onedrive') {
                      setFileType('teams_onedrive');
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      e.preventDefault();
                      const cleaned = extractEmbedUrlFromIframe(pasted) || pasted.trim();
                      setFileUrl(cleaned);
                      if (isYouTubeUrl(cleaned) && fileType !== 'youtube') {
                        setFileType('youtube');
                      } else if (isMicrosoftVideoUrl(cleaned) && fileType !== 'teams_onedrive') {
                        setFileType('teams_onedrive');
                      }
                    }
                  }}
                  placeholder={
                    fileType === 'youtube'
                      ? 'https://www.youtube.com/watch?v=... 或 https://youtu.be/...'
                      : fileType === 'teams_onedrive'
                      ? 'https://...sharepoint.com/... 或 https://1drv.ms/... 或直接貼上 <iframe src="..."></iframe>'
                      : 'https://raw.githubusercontent.com/... 或內部 PDF 路徑'
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500 focus:bg-white font-mono text-slate-800"
                />
              </div>

              {/* Instant YouTube Preview in Form */}
              {fileType === 'youtube' && formYtEmbedUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    即時播放驗證預覽 (YouTube 影片已成功解析)：
                  </span>
                  <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner border border-slate-200">
                    <iframe
                      src={formYtEmbedUrl}
                      title="YouTube Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Instant Teams / OneDrive Video Preview in Form */}
              {fileType === 'teams_onedrive' && formMsEmbedUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    即時播放驗證預覽 (微軟 Teams / OneDrive 影片已成功解析)：
                  </span>
                  <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner border border-slate-200">
                    <iframe
                      src={formMsEmbedUrl}
                      title="Microsoft Stream / OneDrive Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Instant OneDrive Document Embed Preview in Form */}
              {fileType === 'onedrive_doc' && formOneDriveEmbedUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    微軟 365 雲端文件掛載即時解析成功：
                  </span>
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <span className="font-bold text-sky-900 block truncate max-w-[320px]">
                          {title || '微軟 OneDrive 雲端文件'}
                        </span>
                        <span className="text-[11px] text-sky-700 font-mono truncate block max-w-[320px]">
                          {formOneDriveEmbedUrl}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-sky-200/80 text-sky-900 font-bold rounded text-[10px]">
                      {detectOneDriveDocType(fileUrl, title).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {fileType === 'youtube' ? '來源標註' : fileType === 'teams_onedrive' ? '雲端來源' : '檔案大小'}
                  </label>
                  <input
                    type="text"
                    value={fileSize || ''}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="例: 4.8 MB (PDF)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>

                {(fileType === 'video' || fileType === 'youtube' || fileType === 'teams_onedrive') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">影片長度 (秒數)</label>
                    <input
                      type="number"
                      value={videoDurationSeconds ?? 1200}
                      onChange={(e) => setVideoDurationSeconds(Number(e.target.value))}
                      placeholder="1200"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">教材說明 / 學習指引</label>
                <textarea
                  rows={3}
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="說明此教材主要單元內容、課前預習章節與重點學習目標..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {editingMaterial ? '儲存變更' : '立即新增教材'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
