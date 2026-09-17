import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { EmployeeLicense, LicenseCategory } from '../../../types';

interface BatchImportLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_CSV = `員工編號,姓名,部門,職稱,證照類別,證照名稱,證照字號,發證單位,取得日期,有效到期日,是否回訓
FG-001,林志遠,工務一部,專案經理,品質管理,公共工程品質管理人員證書 (土建組),QC-111-98762,行政院公共工程委員會,2022-04-10,2026-04-09,是
FG-002,張建業,工務一部,副理,職業安全衛生,營造業甲種安全衛生業務主管,OSH-A-2023-881,勞動部職安署,2023-01-15,2027-01-14,是
FG-003,王雅萍,工務二部,組長,營造工程技術,工地主任執業證書,SITE-DIR-2021-004,內政部營建署,2021-08-20,2025-08-19,是`;

export const BatchImportLicenseModal: React.FC<BatchImportLicenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { batchImportLicenses } = useApp();
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [parseResult, setParseResult] = useState<{
    successCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '遠雄證照與履歷匯入範本.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCsvContent(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleProcessImport = () => {
    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      alert('請輸入或貼上包含表頭及至少一筆資料之 CSV 內容');
      return;
    }

    const imported: EmployeeLicense[] = [];
    const errors: string[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 6) {
        errors.push(`第 ${i + 1} 行：欄位數不足 (${lines[i]})`);
        continue;
      }

      const [
        empNo,
        empName,
        department,
        title,
        licenseCategory,
        licenseName,
        licenseNo,
        issuingAuthority,
        issueDate,
        expiryDate,
        isRenewal,
      ] = cols;

      imported.push({
        id: `lic-imp-${Date.now()}-${i}`,
        empNo: empNo || `FG-00${i}`,
        empName: empName || '匯入同仁',
        department: department || '工程部',
        title: title || '工程師',
        licenseCategory: (licenseCategory as LicenseCategory) || '品質管理',
        licenseName: licenseName || '專業證照',
        licenseNo: licenseNo || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        issuingAuthority: issuingAuthority || '相關主管機關',
        issueDate: issueDate || new Date().toISOString().slice(0, 10),
        hasExpiry: !!expiryDate,
        expiryDate: expiryDate || undefined,
        renewalRequired: isRenewal === '是' || isRenewal === 'true',
        renewalIntervalYears: 4,
        status: 'valid',
        attachmentName: `${empName}_證書影本.pdf`,
        attachmentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
        verifiedBy: 'HR_BATCH_IMPORT',
        verifiedAt: new Date().toISOString().slice(0, 10),
      });
    }

    if (imported.length > 0) {
      batchImportLicenses(imported);
    }

    setParseResult({
      successCount: imported.length,
      errors,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm">批次匯入人員證照與履歷清冊 (CSV/Excel)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              支援以標準逗號分隔格式 (CSV) 快速建立全集團同仁專業證照與回訓紀錄。
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              下載標準範本
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 text-center">
            <label className="cursor-pointer flex flex-col items-center">
              <Upload className="w-7 h-7 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">選擇 CSV 檔案直接上傳</span>
              <span className="text-[10px] text-slate-400">或直接於下方文字框貼上 CSV 資料</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CSV 資料預覽與編輯區</label>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {parseResult && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                parseResult.errors.length === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>成功匯入 {parseResult.successCount} 筆人員證照紀錄！</span>
              </div>
              {parseResult.errors.length > 0 && (
                <div className="mt-2 space-y-0.5 text-rose-700">
                  <span className="font-bold block">發現以下異常未匯入：</span>
                  {parseResult.errors.map((err, idx) => (
                    <p key={idx} className="font-mono text-[11px]">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              {parseResult ? '完成並關閉' : '取消'}
            </button>
            <button
              type="button"
              onClick={handleProcessImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              執行解析與批次匯入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
