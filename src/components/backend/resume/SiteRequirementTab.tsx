import React, { useState } from 'react';
import {
  Building,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SiteLicenseRequirement, LicenseCategory } from '../../../types';
import { LicenseWizardModal } from './LicenseWizardModal';

export const SiteRequirementTab: React.FC = () => {
  const {
    siteLicenseRequirements,
    employeeLicenses,
    addSiteRequirement,
    deleteSiteRequirement,
  } = useApp();

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [selectedReqForWizard, setSelectedReqForWizard] = useState<SiteLicenseRequirement | null>(null);

  // New Requirement Form State
  const [siteName, setSiteName] = useState('新莊副都心DH7案');
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>('品質管理');
  const [licenseName, setLicenseName] = useState('公共工程品質管理人員證書 (土建組)');
  const [requiredHeadcount, setRequiredHeadcount] = useState(2);
  const [mandatoryLegal, setMandatoryLegal] = useState(true);
  const [notes, setNotes] = useState('依法定營造業品管人員派駐規定');

  const sitesList = Array.from(new Set(siteLicenseRequirements.map((r) => r.siteName)));

  const filteredRequirements = siteLicenseRequirements.filter((req) => {
    return selectedSiteFilter === 'ALL' || req.siteName === selectedSiteFilter;
  });

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    addSiteRequirement({
      siteName: siteName.trim(),
      licenseCategory,
      licenseName: licenseName.trim(),
      requiredHeadcount: Number(requiredHeadcount),
      mandatoryLegal,
      notes: notes.trim(),
    });
    setIsAddReqOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black tracking-tight">公司 / 工地專案證照需求目標設定</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            依營造業法規與建案規模設定各案場法定派駐證照需求。系統自動計算持證缺額，並提供一鍵「證照篩選精靈」推薦派訓名單。
          </p>
        </div>

        <button
          onClick={() => setIsAddReqOpen(true)}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-400/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          新增案場需求目標
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">案場篩選：</span>
          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            <option value="ALL">全部專案案場 ({sitesList.length} 個案場)</option>
            {sitesList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          共列管 <strong className="text-slate-900">{filteredRequirements.length}</strong> 項證照標準
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">專案案場 / 公司名稱</th>
                <th className="px-4 py-3.5">目標證照類別</th>
                <th className="px-4 py-3.5">證照名稱規範</th>
                <th className="px-4 py-3.5 text-center">法定需求名額</th>
                <th className="px-4 py-3.5 text-center">現職持有合格數</th>
                <th className="px-4 py-3.5 text-center">合規 / 缺額狀態</th>
                <th className="px-4 py-3.5 text-right">智慧遴選與管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    尚無設定之案場證照需求
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((req) => {
                  // Real-time calculation of held licenses in company
                  const qualifiedCount = employeeLicenses.filter(
                    (l) =>
                      l.status === 'valid' &&
                      (l.licenseCategory === req.licenseCategory ||
                        l.licenseName.toLowerCase().includes(req.licenseName.toLowerCase()) ||
                        req.licenseName.toLowerCase().includes(l.licenseName.toLowerCase()))
                  ).length;

                  const gap = Math.max(0, req.requiredHeadcount - qualifiedCount);
                  const isSufficed = qualifiedCount >= req.requiredHeadcount;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.siteName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]">
                          {req.licenseCategory}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{req.licenseName}</div>
                        {req.notes && (
                          <div className="text-[11px] text-slate-400">{req.notes}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold font-mono text-sm text-slate-900">
                        {req.requiredHeadcount} <span className="text-[10px] font-normal text-slate-500">人</span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold font-mono text-sm text-emerald-700">
                        {qualifiedCount} <span className="text-[10px] font-normal text-slate-500">人</span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isSufficed ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            名額達標
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            缺額 {gap} 人
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReqForWizard(req)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            證照篩選精靈
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除 ${req.siteName} 的 ${req.licenseName} 需求設定嗎？`)) {
                                deleteSiteRequirement(req.id);
                              }
                            }}
                            title="刪除"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* Add Requirement Modal */}
      {isAddReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">新增案場法定證照需求設定</h3>
              </div>
              <button
                onClick={() => setIsAddReqOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  專案案場名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="例如：新莊副都心DH7住宅大樓案"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    證照類別 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="品質管理">品質管理</option>
                    <option value="職業安全衛生">職業安全衛生</option>
                    <option value="營造工程技術">營造工程技術</option>
                    <option value="專業技師/建築師">專業技師/建築師</option>
                    <option value="特種設備操作">特種設備操作</option>
                    <option value="急救與防災">急救與防災</option>
                    <option value="綠建築/BIM">綠建築/BIM</option>
                    <option value="其它專業">其它專業</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    法定需求名額 (人) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={requiredHeadcount}
                    onChange={(e) => setRequiredHeadcount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  證照名稱規範 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={licenseName}
                  onChange={(e) => setLicenseName(e.target.value)}
                  placeholder="例如：營造業甲種安全衛生業務主管"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">法令法規備註與查驗說明</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例如：依法規開工前需檢附在職名冊送備查..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddReqOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  確認建立案場目標
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Wizard Modal */}
      <LicenseWizardModal
        isOpen={!!selectedReqForWizard}
        onClose={() => setSelectedReqForWizard(null)}
        targetRequirement={selectedReqForWizard}
      />
    </div>
  );
};
