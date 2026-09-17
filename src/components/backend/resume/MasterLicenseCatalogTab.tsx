import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  Tag,
  Check,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { MasterLicenseDefinition, LicenseCategory } from '../../../types';

const CATEGORIES: LicenseCategory[] = [
  '品質管理',
  '職業安全衛生',
  '營造工程技術',
  '特種設備操作',
  '急救與防災',
  '綠建築/BIM',
  '專業技師/建築師',
  '其它專業',
];

export const MasterLicenseCatalogTab: React.FC = () => {
  const { masterLicenses, addMasterLicense, updateMasterLicense, deleteMasterLicense, employeeLicenses } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<MasterLicenseDefinition | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<MasterLicenseDefinition>>({
    code: '',
    name: '',
    category: '品質管理',
    issuingAuthority: '',
    validityYears: 4,
    hasExpiry: true,
    renewalRequired: true,
    renewalIntervalYears: 4,
    renewalHours: 36,
    renewalNotes: '',
    mandatoryRoles: [],
    companySubsidyRule: '',
    isActive: true,
  });

  const [roleInput, setRoleInput] = useState('');

  // Stats
  const stats = useMemo(() => {
    const total = masterLicenses.length;
    const active = masterLicenses.filter((l) => l.isActive).length;
    const qcCount = masterLicenses.filter((l) => l.category === '品質管理').length;
    const oshCount = masterLicenses.filter((l) => l.category === '職業安全衛生').length;
    const cmCount = masterLicenses.filter((l) => l.category === '營造工程技術').length;
    return { total, active, qcCount, oshCount, cmCount };
  }, [masterLicenses]);

  // Filtered master licenses
  const filteredList = useMemo(() => {
    return masterLicenses.filter((lic) => {
      const matchSearch =
        lic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.mandatoryRoles?.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || lic.category === selectedCategory;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && lic.isActive) ||
        (statusFilter === 'inactive' && !lic.isActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [masterLicenses, searchTerm, selectedCategory, statusFilter]);

  const handleOpenAdd = () => {
    setEditingLicense(null);
    setFormData({
      code: `LIC-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: '品質管理',
      issuingAuthority: '行政院公共工程委員會',
      validityYears: 4,
      hasExpiry: true,
      renewalRequired: true,
      renewalIntervalYears: 4,
      renewalHours: 36,
      renewalNotes: '取得證書後每4年應取得回訓證明總計36小時以上。',
      mandatoryRoles: ['品管工程師'],
      companySubsidyRule: '公司全額補助派訓與公假受訓。',
      isActive: true,
    });
    setRoleInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lic: MasterLicenseDefinition) => {
    setEditingLicense(lic);
    setFormData({
      code: lic.code,
      name: lic.name,
      category: lic.category,
      issuingAuthority: lic.issuingAuthority,
      validityYears: lic.validityYears ?? (lic.hasExpiry ? 4 : 0),
      hasExpiry: lic.hasExpiry,
      renewalRequired: lic.renewalRequired,
      renewalIntervalYears: lic.renewalIntervalYears ?? 4,
      renewalHours: lic.renewalHours ?? 12,
      renewalNotes: lic.renewalNotes || '',
      mandatoryRoles: lic.mandatoryRoles || [],
      companySubsidyRule: lic.companySubsidyRule || '',
      isActive: lic.isActive,
    });
    setRoleInput('');
    setIsModalOpen(true);
  };

  const handleAddRole = () => {
    if (!roleInput.trim()) return;
    const current = formData.mandatoryRoles || [];
    if (!current.includes(roleInput.trim())) {
      setFormData({ ...formData, mandatoryRoles: [...current, roleInput.trim()] });
    }
    setRoleInput('');
  };

  const handleRemoveRole = (role: string) => {
    setFormData({
      ...formData,
      mandatoryRoles: (formData.mandatoryRoles || []).filter((r) => r !== role),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.code?.trim()) {
      alert('請填寫證照代碼與證照名稱');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      category: formData.category || '品質管理',
      issuingAuthority: formData.issuingAuthority?.trim() || '相關認可機構',
      validityYears: formData.hasExpiry ? Number(formData.validityYears) || 4 : undefined,
      hasExpiry: !!formData.hasExpiry,
      renewalRequired: !!formData.renewalRequired,
      renewalIntervalYears: formData.renewalRequired ? Number(formData.renewalIntervalYears) || 4 : undefined,
      renewalHours: formData.renewalRequired ? Number(formData.renewalHours) || 0 : undefined,
      renewalNotes: formData.renewalNotes?.trim() || '',
      mandatoryRoles: formData.mandatoryRoles || [],
      companySubsidyRule: formData.companySubsidyRule?.trim() || '',
      isActive: formData.isActive !== false,
    };

    if (editingLicense) {
      updateMasterLicense(editingLicense.id, payload);
    } else {
      addMasterLicense(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const holderCount = employeeLicenses.filter((l) => l.licenseName === name).length;
    let msg = `確定要刪除標準證照「${name}」嗎？`;
    if (holderCount > 0) {
      msg = `目前有 ${holderCount} 位同仁持有此項證照。確定仍要自規格庫中刪除嗎？（同仁現有紀錄仍會保留）`;
    }
    if (confirm(msg)) {
      deleteMasterLicense(id);
    }
  };

  const handleToggleActive = (lic: MasterLicenseDefinition) => {
    updateMasterLicense(lic.id, { isActive: !lic.isActive });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>標準證照規格</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total} <span className="text-xs font-normal text-slate-400">項</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {stats.active} 項啟用中
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>品質管理類</span>
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-700">{stats.qcCount} <span className="text-xs font-normal text-slate-400">項</span></div>
          <div className="text-[11px] text-slate-500 mt-1">品管主管 / 土建 / 機電</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>職業安全衛生類</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.oshCount} <span className="text-xs font-normal text-slate-400">項</span></div>
          <div className="text-[11px] text-slate-500 mt-1">甲/乙安衛、技術士</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>營造工程技術類</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats.cmCount} <span className="text-xs font-normal text-slate-400">項</span></div>
          <div className="text-[11px] text-slate-500 mt-1">工地主任 / 技檢甲乙級</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-100 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              規格庫驅動
            </div>
            <p className="text-[11px] text-blue-100 mt-1">
              建立標準化證照後，前台登錄、工地名額需求與派訓將自動聯動。
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mt-2 w-full py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            新增標準證照
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋證照名稱、代碼、發證單位或職缺..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Status Filter and Add Button */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部狀態 ({masterLicenses.length})</option>
              <option value="active">僅顯示啟用中 ({masterLicenses.filter((l) => l.isActive).length})</option>
              <option value="inactive">僅顯示已停用 ({masterLicenses.filter((l) => !l.isActive).length})</option>
            </select>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              新增標準證照
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部類別 ({masterLicenses.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = masterLicenses.filter((l) => l.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Licenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">證照規格清單</h3>
            <span className="text-xs text-slate-400">共 {filteredList.length} 筆規格定義</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">代碼 / 證照名稱</th>
                <th className="py-3 px-3">專業分類</th>
                <th className="py-3 px-3">頒發機關</th>
                <th className="py-3 px-3">效期 / 回訓規定</th>
                <th className="py-3 px-3">法定對應職缺</th>
                <th className="py-3 px-3">公司補助與津貼</th>
                <th className="py-3 px-3 text-center">持有人數</th>
                <th className="py-3 px-3 text-center">狀態</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-medium">無符合篩選條件之標準證照</p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs"
                    >
                      ＋ 新增第一筆證照規格
                    </button>
                  </td>
                </tr>
              ) : (
                filteredList.map((lic) => {
                  const holderCount = employeeLicenses.filter((l) => l.licenseName === lic.name).length;

                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{lic.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {lic.code}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md inline-block">
                          {lic.category}
                        </span>
                      </td>

                      {/* Issuing Authority */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-medium">{lic.issuingAuthority}</div>
                      </td>

                      {/* Expiry & Renewal */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {lic.hasExpiry ? (
                              <span>效期 {lic.validityYears} 年</span>
                            ) : (
                              <span className="text-emerald-700">永久有效</span>
                            )}
                          </div>
                          {lic.renewalRequired ? (
                            <div className="text-[11px] text-amber-700 font-medium">
                              每 {lic.renewalIntervalYears} 年回訓 {lic.renewalHours ? `(${lic.renewalHours}hr)` : ''}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">無需回訓</div>
                          )}
                        </div>
                      </td>

                      {/* Mandatory Roles */}
                      <td className="py-3.5 px-3 max-w-xs">
                        {lic.mandatoryRoles && lic.mandatoryRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {lic.mandatoryRoles.map((role, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded text-[10px] font-medium"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">未設定</span>
                        )}
                      </td>

                      {/* Company Subsidy Rule */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-slate-600 text-[11px] line-clamp-2" title={lic.companySubsidyRule}>
                          {lic.companySubsidyRule || '依照公司一般教育訓練辦法'}
                        </div>
                      </td>

                      {/* Holder count */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            holderCount > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {holderCount} 人
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(lic)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            lic.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {lic.isActive ? '啟用中' : '已停用'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(lic)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="編輯證照規格"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lic.id, lic.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Master License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingLicense ? '編輯標準證照規格' : '新增標準證照規格'}
                  </h3>
                  <p className="text-xs text-slate-500">定義標準證照之發證機關、效期、回訓規則與對應職缺</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    證照代碼 (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：QC-CIVIL 或 OSH-A01"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    專業分類 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  標準證照全名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：公共工程品質管理人員證書 (土建組)"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  頒發單位 / 發證機關 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：行政院公共工程委員會、勞動部職業安全衛生署"
                  value={formData.issuingAuthority || ''}
                  onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Expiry and Renewal Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">證書有效期限限制</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasExpiry}
                      onChange={(e) => setFormData({ ...formData, hasExpiry: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      {formData.hasExpiry ? '有期限' : '永久有效'}
                    </span>
                  </label>
                </div>

                {formData.hasExpiry && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      有效年限 (年)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formData.validityYears ?? 4}
                      onChange={(e) => setFormData({ ...formData, validityYears: parseInt(e.target.value, 10) || 4 })}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                )}

                <div className="border-t border-slate-200/80 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">定期回訓 / 複訓要求</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.renewalRequired}
                        onChange={(e) => setFormData({ ...formData, renewalRequired: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      <span className="ml-2 text-xs font-semibold text-slate-700">
                        {formData.renewalRequired ? '需回訓' : '免回訓'}
                      </span>
                    </label>
                  </div>

                  {formData.renewalRequired && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          回訓週期 (年)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={formData.renewalIntervalYears ?? 4}
                          onChange={(e) => setFormData({ ...formData, renewalIntervalYears: parseInt(e.target.value, 10) || 4 })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          法定回訓時數 (小時)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={formData.renewalHours ?? 36}
                          onChange={(e) => setFormData({ ...formData, renewalHours: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          回訓法規規定說明
                        </label>
                        <input
                          type="text"
                          placeholder="例如：取得證書後每4年應取得回訓證明總計36小時以上"
                          value={formData.renewalNotes || ''}
                          onChange={(e) => setFormData({ ...formData, renewalNotes: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mandatory Roles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  法定對應工務/案場職缺 (標籤)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="輸入職稱後按新增，例如：品管工程師、專任工程人員"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRole();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    新增標籤
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {(formData.mandatoryRoles || []).length === 0 ? (
                    <span className="text-[11px] text-slate-400">尚未加入對應職缺</span>
                  ) : (
                    formData.mandatoryRoles?.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role)}
                          className="text-blue-500 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Company Subsidy Rule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  公司補助與津貼獎勵政策說明
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：公假派訓，公司全額補助學費與換證規費；派駐工地品管崗位每月核發加給 3,000 元。"
                  value={formData.companySubsidyRule || ''}
                  onChange={(e) => setFormData({ ...formData, companySubsidyRule: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">規格啟用狀態</div>
                  <div className="text-[11px] text-slate-500">停用後，前台新增證照與智慧派訓將不會推薦此項目</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  儲存證照規格
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
