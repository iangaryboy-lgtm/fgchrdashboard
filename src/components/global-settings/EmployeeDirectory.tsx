import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, OrgNode } from '../../types';
import { parseDelimitedText, calculateYearsDifference } from '../../utils/parser';
import { exportToExcel } from '../../utils/excel';
import { OrgTreePickerModal } from '../common/OrgTreePickerModal';
import {
  Users,
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Edit2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Info,
  FolderTree,
  Network,
  ChevronDown,
  Building2,
} from 'lucide-react';

export const EmployeeDirectory: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, batchImportEmployees, clearAllEmployees, orgTree } = useApp();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDept, setSelectedDept] = useState('全部');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Batch paste state
  const [batchRawText, setBatchRawText] = useState('');
  const [batchDelimiter, setBatchDelimiter] = useState<string>('auto');
  const [batchParseError, setBatchParseError] = useState<string | null>(null);

  // Single Add / Edit Form State
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    empNo: '',
    name: '',
    department: '工程一部',
    section: 'HM2案',
    title: '工程師',
    positionTitle: '土建工程師',
    rank: '06',
    attribute: '外業',
    birthday: '1985-05-15',
    seniorityStartDate: '2015-06-01',
    pin: '1234',
    email: '',
    status: '在職',
  });

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return ['全部', ...Array.from(set).filter(Boolean)];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== '全部' && emp.department !== selectedDept) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const m1 = emp.name.toLowerCase().includes(q);
        const m2 = emp.empNo.toLowerCase().includes(q);
        const m3 = emp.department.toLowerCase().includes(q);
        const m4 = emp.section.toLowerCase().includes(q);
        const m5 = emp.title.toLowerCase().includes(q);
        const m6 = (emp.positionTitle || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5 && !m6) return false;
      }
      return true;
    });
  }, [employees, selectedDept, searchKeyword]);

  // Handle Batch Import Parse
  const handleProcessBatchImport = () => {
    setBatchParseError(null);
    if (!batchRawText.trim()) {
      setBatchParseError('請貼入名冊文字資料');
      return;
    }

    try {
      const customDelim = batchDelimiter === 'auto' ? undefined : batchDelimiter;
      const rows = parseDelimitedText(batchRawText, customDelim);

      if (rows.length === 0) {
        setBatchParseError('解析失敗：未發現有效的資料列');
        return;
      }

      // Check if first row is header
      const startIdx = rows[0][0]?.includes('編號') || rows[0][0]?.toLowerCase().includes('emp') ? 1 : 0;
      const imported: Employee[] = [];

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2 || !row[0]) continue;

        // Fields support either:
        // 12 columns: 員工編號、姓名、部室單位、科案單位、職稱、職位名稱、職等、屬性 (內/外業)、生日、遠營年資起算日、預設 PIN 碼、電子信箱
        // 11 columns (legacy): 員工編號、姓名、部室單位、科案單位、職稱、職等、屬性 (內/外業)、生日、遠營年資起算日、預設 PIN 碼、電子信箱
        const empNo = row[0].trim();
        const name = row[1]?.trim() || '未命名';
        const department = row[2]?.trim() || '工程一部';
        const section = row[3]?.trim() || '-';
        const title = row[4]?.trim() || '工程師';

        let positionTitle = '土建工程師';
        let rank = '06';
        let attribute: '內業' | '外業' = '外業';
        let birthday = '1985-01-01';
        let seniorityStartDate = '2015-01-01';
        let pin = '1234';
        let email = `${empNo.toLowerCase()}@farglory.com.tw`;

        if (row.length >= 12) {
          positionTitle = row[5]?.trim() || '土建工程師';
          rank = row[6]?.trim() || '06';
          attribute = (row[7]?.trim() === '內業' ? '內業' : '外業') as '內業' | '外業';
          birthday = row[8]?.trim() || '1985-01-01';
          seniorityStartDate = row[9]?.trim() || '2015-01-01';
          pin = row[10]?.trim() || '1234';
          email = row[11]?.trim() || `${empNo.toLowerCase()}@farglory.com.tw`;
        } else {
          // 11 columns legacy
          rank = row[5]?.trim() || '06';
          attribute = (row[6]?.trim() === '內業' ? '內業' : '外業') as '內業' | '外業';
          birthday = row[7]?.trim() || '1985-01-01';
          seniorityStartDate = row[8]?.trim() || '2015-01-01';
          pin = row[9]?.trim() || '1234';
          email = row[10]?.trim() || `${empNo.toLowerCase()}@farglory.com.tw`;
          // Auto derive positionTitle
          if (department.includes('人資') || department.includes('人力資源')) {
            positionTitle = '人發訓練專員';
          } else if (title.includes('機電')) {
            positionTitle = '機電工程師';
          } else if (title.includes('安') || department.includes('安')) {
            positionTitle = '工安工程師';
          } else if (department.includes('企劃') || title.includes('成控')) {
            positionTitle = '成控工程師';
          } else {
            positionTitle = '土建工程師';
          }
        }

        imported.push({
          id: `emp-imp-${Date.now()}-${i}`,
          empNo,
          name,
          department,
          section,
          title,
          positionTitle,
          rank,
          attribute,
          birthday,
          seniorityStartDate,
          pin,
          email,
          status: '在職',
        });
      }

      if (imported.length === 0) {
        setBatchParseError('未能解析出有效的員工資料，請確認每欄資料格式');
        return;
      }

      batchImportEmployees(imported);
      setShowBatchModal(false);
      setBatchRawText('');
    } catch (e: any) {
      setBatchParseError(`解析出錯：${e?.message || '格式異常'}`);
    }
  };

  const handleSaveSingleEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empNo || !formData.name) return;

    if (editingEmp) {
      updateEmployee(editingEmp.id, formData);
      setEditingEmp(null);
      setShowAddModal(false);
    } else {
      addEmployee(formData);
      setShowAddModal(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((e) => ({
      員工編號: e.empNo,
      姓名: e.name,
      部室單位: e.department,
      科案單位: e.section,
      職稱: e.title,
      職位名稱: e.positionTitle || '土建工程師',
      職等: e.rank,
      屬性: e.attribute,
      生日: e.birthday,
      遠營年資起算日: e.seniorityStartDate,
      預設PIN碼: e.pin,
      電子信箱: e.email,
      在職狀態: e.status,
    }));
    exportToExcel(exportData, `遠雄營造_全域同仁名冊_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleLoadSampleBatch = () => {
    setBatchRawText(
      `FG1050/周國華/工程一部/HM3案/副理/土建工程師/07/外業/1981-04-12/2009-08-01/1234/kuohua.chou@farglory.com.tw
FG1051/張銘德/工程二部/BH8案/經理/機電工程師/08/外業/1975-09-25/2002-03-15/2345/mingte.chang@farglory.com.tw
FG1052/李佳蓉/人力資源室/人資組/專員/人發訓練專員/06/內業/1990-11-03/2018-05-20/3456/chiarung.lee@farglory.com.tw`
    );
    setBatchDelimiter('/');
  };

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋姓名/編號/單位/職稱..."
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-52 bg-slate-50 focus:bg-white transition-all outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-700 outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Upload className="w-3 h-3 text-blue-600" />
            批次貼入名冊 (CSV/TSV/Slash)
          </button>

          <button
            onClick={() => {
              setFormData({
                empNo: `FG${1020 + employees.length}`,
                name: '',
                department: '工程一部',
                section: '新案組',
                title: '工程師',
                rank: '06',
                attribute: '外業',
                birthday: '1985-01-01',
                seniorityStartDate: '2015-01-01',
                pin: '1234',
                email: '',
                status: '在職',
              });
              setEditingEmp(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            新增單筆同仁
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            匯出 Excel
          </button>

          <button
            onClick={() => {
              if (window.confirm('確定要全數清除現有名單庫嗎？此動作將同時清空人才庫與權限白名單！')) {
                clearAllEmployees();
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="全數清除名單庫"
          >
            <Trash2 className="w-3 h-3" />
            全數清除
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            全域同仁名冊資料庫 ({filteredEmployees.length} 筆)
          </h3>
          <span className="text-[11px] text-slate-500">
            可隨時點擊編輯各同仁屬性，系統將同步關聯組織架構與人才庫
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200 z-10 whitespace-nowrap shadow-xs">
              <tr>
                <th className="py-2.5 px-3">員工編號</th>
                <th className="py-2.5 px-3">姓名</th>
                <th className="py-2.5 px-3">部室單位</th>
                <th className="py-2.5 px-3">科案單位</th>
                <th className="py-2.5 px-3">職稱</th>
                <th className="py-2.5 px-3">職位名稱</th>
                <th className="py-2.5 px-3 text-center">職等</th>
                <th className="py-2.5 px-3 text-center">屬性</th>
                <th className="py-2.5 px-3">生日</th>
                <th className="py-2.5 px-3">遠營年資起算</th>
                <th className="py-2.5 px-3 text-center">PIN碼</th>
                <th className="py-2.5 px-3">電子信箱</th>
                <th className="py-2.5 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-blue-600">{emp.empNo}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{emp.department}</td>
                  <td className="py-2 px-3 text-slate-600">{emp.section}</td>
                  <td className="py-2 px-3 text-slate-700">{emp.title}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {emp.positionTitle || '土建工程師'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold">{emp.rank}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        emp.attribute === '外業'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {emp.attribute}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">{emp.birthday}</td>
                  <td className="py-2 px-3 font-mono text-slate-500">{emp.seniorityStartDate}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-400">{emp.pin}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{emp.email}</td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingEmp(emp);
                          setFormData({
                            empNo: emp.empNo,
                            name: emp.name,
                            department: emp.department,
                            section: emp.section,
                            title: emp.title,
                            positionTitle: emp.positionTitle || '土建工程師',
                            rank: emp.rank,
                            attribute: emp.attribute,
                            birthday: emp.birthday,
                            seniorityStartDate: emp.seniorityStartDate,
                            pin: emp.pin,
                            email: emp.email,
                            status: emp.status,
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                        title="編輯同仁"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除同仁 ${emp.name} (${emp.empNo}) 嗎？`)) {
                            deleteEmployee(emp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="刪除同仁"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-600" />
                批次名冊檔案快速貼入匯入
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-4 h-4 text-sky-600" />
                欄位順序說明 (支援 CSV逗號 / TSV定位鍵 / 斜線 / 分號)：
              </p>
              <p className="font-mono text-[11px] text-sky-800">
                員工編號 / 姓名 / 部室單位 / 科案單位 / 職稱 / 職等 / 屬性(內/外業) / 生日 / 遠營年資起算日 / 預設PIN碼 / 電子信箱
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">分隔符號：</span>
                <select
                  value={batchDelimiter}
                  onChange={(e) => setBatchDelimiter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="auto">自動偵測 (Auto Detect)</option>
                  <option value="/">斜線分隔 (Slash /)</option>
                  <option value=",">逗號 (CSV ,)</option>
                  <option value="	">定位鍵 (TSV Tab)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                帶入示範資料
              </button>
            </div>

            <textarea
              rows={8}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder="請直接從 Excel 複製貼入或輸入名冊文字..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            ></textarea>

            {batchParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{batchParseError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleProcessBatchImport}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
              >
                確認解析並匯入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Single Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingEmp ? '編輯同仁屬性' : '新增單筆同仁'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">員工編號 *</label>
                  <input
                    type="text"
                    value={formData.empNo}
                    onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Unit Selection from Org Tree Toolbar */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-blue-900 min-w-0">
                  <FolderTree className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-blue-700">組織層級連動：</span>
                    <span className="font-bold text-slate-800 ml-1">
                      {formData.department || '(未選部室)'} / {formData.section || '(未選科案)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrgPicker(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
                >
                  <Network className="w-3.5 h-3.5" />
                  從組織樹選取
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">部室單位</label>
                    <button
                      type="button"
                      onClick={() => setShowOrgPicker(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                    >
                      <FolderTree className="w-3 h-3" /> 樹狀選取
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="例：工程一部 / 人力資源室"
                      className="w-full pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOrgPicker(true)}
                      title="開啟組織樹選取"
                      className="absolute right-2 top-2 text-slate-400 hover:text-blue-600"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">科案單位</label>
                    <button
                      type="button"
                      onClick={() => setShowOrgPicker(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                    >
                      <FolderTree className="w-3 h-3" /> 樹狀選取
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="例：HM2案 / 新案組"
                      className="w-full pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOrgPicker(true)}
                      title="開啟組織樹選取"
                      className="absolute right-2 top-2 text-slate-400 hover:text-blue-600"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">職稱</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">職位名稱 (專業職系) *</label>
                  <input
                    type="text"
                    value={formData.positionTitle || ''}
                    onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
                    placeholder="例：土建工程師"
                    className="w-full px-3 py-1.5 text-xs border border-indigo-300 bg-indigo-50/30 rounded-lg font-bold text-indigo-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">職等</label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="09">09 (總經理)</option>
                    <option value="08">08 (經理)</option>
                    <option value="07">07 (副理/主任)</option>
                    <option value="06">06 (工程師)</option>
                    <option value="05">05 (區棟組長)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">屬性</label>
                  <select
                    value={formData.attribute}
                    onChange={(e) => setFormData({ ...formData, attribute: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="外業">外業</option>
                    <option value="內業">內業</option>
                  </select>
                </div>
              </div>

              {/* Quick Select Position Title Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">常用職位快選：</span>
                {['土建工程師', '機電工程師', '人發訓練專員', '工安工程師', '成控工程師', '品管工程師', '採購專員', '規劃設計專員'].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, positionTitle: pos }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      formData.positionTitle === pos
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">生日</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">遠營年資起算日</label>
                  <input
                    type="date"
                    value={formData.seniorityStartDate}
                    onChange={(e) => setFormData({ ...formData, seniorityStartDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">預設 PIN 碼 (4碼)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">電子信箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
                >
                  儲存同仁資料
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Org Tree Picker Modal */}
      <OrgTreePickerModal
        isOpen={showOrgPicker}
        onClose={() => setShowOrgPicker(false)}
        initialDepartment={formData.department}
        initialSection={formData.section}
        title="組織架構樹狀選取 - 部室與科案單位"
        onSelect={({ department, section }) => {
          setFormData((prev) => ({
            ...prev,
            department: department || prev.department,
            section: section || prev.section,
          }));
        }}
      />
    </div>
  );
};
