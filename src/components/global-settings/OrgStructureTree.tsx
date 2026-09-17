import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgNode, OrgLevel, Employee } from '../../types';
import {
  Network,
  ChevronRight,
  ChevronDown,
  User,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Building,
  Users,
  Shield,
  Layers,
  FolderTree,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

export const OrgStructureTree: React.FC = () => {
  const { orgTree, updateOrgNode, addOrgNode, deleteOrgNode, employees } = useApp();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'org-root': true,
    'org-president': true,
    'org-div-1': true,
    'org-div-2': true,
    'org-div-3': true,
    'org-div-4': true,
    'org-1': true,
    'org-2': true,
    'org-3': true,
    'org-4': true,
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [addingChildUnder, setAddingChildUnder] = useState<OrgNode | null>(null);

  // Form state for node edit / create
  const [nodeName, setNodeName] = useState('');
  const [nodeLevel, setNodeLevel] = useState<OrgLevel>('科案');
  const [leaderEmpNo, setLeaderEmpNo] = useState<string>('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderTitle, setLeaderTitle] = useState('');

  // Search inside modal for employee picker
  const [empPickerSearch, setEmpPickerSearch] = useState('');
  const [isManualLeaderEntry, setIsManualLeaderEntry] = useState(false);

  // Filter employees for the picker inside modal
  const filteredEmployeesForPicker = useMemo(() => {
    const q = empPickerSearch.trim().toLowerCase();
    if (!q) return employees.slice(0, 100);
    return employees
      .filter(
        (emp) =>
          emp.name.toLowerCase().includes(q) ||
          emp.empNo.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q) ||
          (emp.section && emp.section.toLowerCase().includes(q)) ||
          emp.title.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [employees, empPickerSearch]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (tree: OrgNode | OrgNode[]) => {
    const map: Record<string, boolean> = {};
    const traverse = (n: OrgNode) => {
      if (!n) return;
      map[n.id] = true;
      if (n.children && Array.isArray(n.children)) {
        n.children.forEach(traverse);
      }
    };
    if (Array.isArray(tree)) {
      tree.forEach(traverse);
    } else if (tree) {
      traverse(tree);
    }
    setExpandedNodes(map);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // When selecting an employee from global roster
  const handleSelectEmployee = (emp: Employee) => {
    setLeaderEmpNo(emp.empNo);
    setLeaderName(emp.name);
    setLeaderTitle(emp.title); // Directly auto-populate employee title
  };

  const handleClearLeader = () => {
    setLeaderEmpNo('');
    setLeaderName('');
    setLeaderTitle('');
  };

  const handleOpenEdit = (node: OrgNode) => {
    setEditingNode(node);
    setAddingChildUnder(null);
    setNodeName(node.name);
    setNodeLevel(node.level);
    setLeaderEmpNo(node.leaderEmpNo || '');
    setLeaderName(node.leaderName || '');
    setLeaderTitle(node.leaderTitle || '');
    setEmpPickerSearch('');
    setIsManualLeaderEntry(!node.leaderEmpNo && !!node.leaderName);
  };

  const handleOpenAddChild = (parent: OrgNode) => {
    setAddingChildUnder(parent);
    setEditingNode(null);
    setNodeName('');
    setNodeLevel(
      parent.level === '董事長'
        ? '總經理'
        : parent.level === '總經理'
        ? '處級'
        : parent.level === '處級'
        ? '部室'
        : '科案'
    );
    setLeaderEmpNo('');
    setLeaderName('');
    setLeaderTitle('');
    setEmpPickerSearch('');
    setIsManualLeaderEntry(false);
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    const payload: Partial<OrgNode> = {
      name: nodeName.trim(),
      level: nodeLevel,
      leaderEmpNo: leaderEmpNo.trim() || undefined,
      leaderName: leaderName.trim() || undefined,
      leaderTitle: leaderTitle.trim() || undefined,
    };

    if (editingNode) {
      updateOrgNode(editingNode.id, payload);
      setEditingNode(null);
    } else if (addingChildUnder) {
      addOrgNode(addingChildUnder.id, payload);
      // Ensure parent expanded
      setExpandedNodes((prev) => ({ ...prev, [addingChildUnder.id]: true }));
      setAddingChildUnder(null);
    }
  };

  // Render recursive tree node
  const renderTreeNode = (node: OrgNode, depth: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    // Count direct employees in this unit
    const directEmpCount = employees.filter(
      (e) => e.department === node.name || e.section === node.name
    ).length;

    // Highlight search match
    const q = searchKeyword.trim().toLowerCase();
    const isMatched =
      q &&
      (node.name.toLowerCase().includes(q) ||
        (node.leaderName && node.leaderName.toLowerCase().includes(q)) ||
        (node.leaderEmpNo && node.leaderEmpNo.toLowerCase().includes(q)) ||
        (node.leaderTitle && node.leaderTitle.toLowerCase().includes(q)));

    // Node badge colors based on level
    let levelBadgeBg = 'bg-slate-100 text-slate-700';
    let borderAccent = 'border-slate-200';
    if (node.level === '董事長' || node.level === 'board') {
      levelBadgeBg = 'bg-amber-100 text-amber-900 font-extrabold';
      borderAccent = 'border-amber-400 bg-amber-50/40';
    } else if (node.level === '總經理' || node.level === 'president') {
      levelBadgeBg = 'bg-sky-100 text-sky-900 font-bold';
      borderAccent = 'border-sky-400 bg-sky-50/40';
    } else if (node.level === '處級' || node.level === 'division') {
      levelBadgeBg = 'bg-teal-100 text-teal-900 font-semibold';
      borderAccent = 'border-teal-300';
    } else if (node.level === '部室' || node.level === 'department') {
      levelBadgeBg = 'bg-indigo-100 text-indigo-900';
      borderAccent = 'border-indigo-200';
    } else if (node.level === '科案' || node.level === 'section') {
      levelBadgeBg = 'bg-emerald-50 text-emerald-800';
      borderAccent = 'border-emerald-200';
    }

    return (
      <div key={node.id} className="relative select-none">
        {/* Node Box */}
        <div
          className={`flex items-center justify-between p-3 my-1.5 rounded-xl border ${borderAccent} ${
            isMatched ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white'
          } hover:shadow-xs transition-all`}
          style={{ marginLeft: `${depth * 28}px` }}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-slate-300">●</span>
            )}

            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${levelBadgeBg}`}>
              {node.level}
            </span>

            <span className="text-xs font-bold text-slate-900 tracking-tight">{node.name}</span>

            {node.leaderName ? (
              <span className="text-xs text-slate-700 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-500 text-[11px]">主管：</span>
                <strong className="text-slate-900 font-bold">{node.leaderName}</strong>
                {node.leaderEmpNo && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                    {node.leaderEmpNo}
                  </span>
                )}
                {node.leaderTitle && (
                  <span className="text-[11px] text-slate-600 font-medium">
                    · {node.leaderTitle}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic px-2 py-0.5 rounded bg-slate-50 border border-dashed border-slate-200">
                尚未指派負責主管
              </span>
            )}

            {directEmpCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                {directEmpCount} 人
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => handleOpenAddChild(node)}
              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              title="新增下層組織節點"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleOpenEdit(node)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="編輯節點與指派負責主管"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {depth > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`確定要刪除組織節點【${node.name}】及其下屬單位嗎？`)) {
                    deleteOrgNode(node.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="刪除節點"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Render Children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 border-l-2 border-slate-200 ml-4 pl-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            企業樹狀從屬組織架構
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            設定各層級單位與負責主管，主管可直接自<strong>全域同仁名冊資料庫</strong>搜尋選取並自動帶入人員職稱
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋單位名稱、主管姓名或員編..."
              className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 w-56 bg-white outline-none"
            />
          </div>

          <button
            onClick={() => expandAll(orgTree)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
          >
            全部展開
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
          >
            全部收合
          </button>
        </div>
      </div>

      {/* Interactive Tree Body */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          {Array.isArray(orgTree)
            ? orgTree.map((rootNode) => renderTreeNode(rootNode, 0))
            : orgTree
            ? renderTreeNode(orgTree, 0)
            : null}
        </div>
      </div>

      {/* Edit or Add Child Node Modal */}
      {(editingNode || addingChildUnder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-600" />
                  {editingNode
                    ? `編輯組織節點：${editingNode.name}`
                    : `在【${addingChildUnder?.name}】下新增子單位`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  設定單位層級與指派負責主管，可直接由全域同仁資料庫即時選取
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingNode(null);
                  setAddingChildUnder(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNode} className="space-y-4">
              {/* Unit Name & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    單位名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="例：工程一部 或 HM2案 (桃園龜山廠辦)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    單位層級 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nodeLevel}
                    onChange={(e) => setNodeLevel(e.target.value as OrgLevel)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="董事長">董事長 (最高層級)</option>
                    <option value="總經理">總經理 (總經理室)</option>
                    <option value="處級">處級 (工務部/管理處)</option>
                    <option value="部室">部室 (工程部/企劃室)</option>
                    <option value="科案">科案 (案場/組)</option>
                  </select>
                </div>
              </div>

              {/* Responsible Leader Section with Global Employee Selector */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-slate-900">
                      單位負責主管指派 (全域同仁名冊資料庫)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualLeaderEntry(!isManualLeaderEntry)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {isManualLeaderEntry ? '切換為從名冊庫挑選' : '切換為自訂手動輸入'}
                  </button>
                </div>

                {!isManualLeaderEntry ? (
                  <div className="space-y-3">
                    {/* Selected Leader Summary Chip / Card */}
                    {leaderName ? (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {leaderName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{leaderName}</span>
                              {leaderEmpNo && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                  {leaderEmpNo}
                                </span>
                              )}
                              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                已自動帶入職稱：{leaderTitle || '無'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              已連結至全域同仁資料庫，職稱與人事資料保持連動
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearLeader}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium"
                        >
                          清除重選
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center">
                        <p className="text-xs text-slate-500">
                          尚未指派負責主管，請在下方清單搜尋並選擇同仁
                        </p>
                      </div>
                    )}

                    {/* Employee Picker Search & List */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={empPickerSearch}
                          onChange={(e) => setEmpPickerSearch(e.target.value)}
                          placeholder="搜尋同仁姓名、員工編號 (如 FG1001)、所屬部室或職稱..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white outline-none"
                        />
                      </div>

                      {/* Filtered Employees Dropdown/List */}
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-2xs">
                        {filteredEmployeesForPicker.length > 0 ? (
                          filteredEmployeesForPicker.map((emp) => {
                            const isSelected =
                              leaderEmpNo === emp.empNo ||
                              (!leaderEmpNo && leaderName === emp.name);
                            return (
                              <button
                                key={emp.id || emp.empNo}
                                type="button"
                                onClick={() => handleSelectEmployee(emp)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50/70 transition-colors ${
                                  isSelected ? 'bg-blue-50/90 font-bold text-blue-900' : 'text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {emp.empNo}
                                  </span>
                                  <span className="font-bold text-slate-900">{emp.name}</span>
                                  <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                                    {emp.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    ({emp.department} {emp.section ? `· ${emp.section}` : ''})
                                  </span>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">
                            找不到符合「{empPickerSearch}」條件的同仁
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Manual input fallback */
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          負責主管姓名
                        </label>
                        <input
                          type="text"
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          placeholder="例：陳冠霖"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          主管員工編號 (選填)
                        </label>
                        <input
                          type="text"
                          value={leaderEmpNo}
                          onChange={(e) => setLeaderEmpNo(e.target.value)}
                          placeholder="例：FG1001"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Leader Title Fine-tuning (Automatically populated, but allows customized suffixes like '兼任處長') */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      主管顯示職稱 <span className="text-slate-400 font-normal">(由名冊自動帶入，亦可自訂微調)</span>
                    </span>
                    {leaderTitle && (
                      <span className="text-[10px] text-blue-600 font-semibold">
                        已自動帶入：{leaderTitle}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={leaderTitle}
                    onChange={(e) => setLeaderTitle(e.target.value)}
                    placeholder="例：經理 / 副理 / 副總經理 (兼)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNode(null);
                    setAddingChildUnder(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

