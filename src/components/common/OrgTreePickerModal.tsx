import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgNode } from '../../types';
import {
  Network,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  FolderTree,
  User,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface OrgTreePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: { department: string; section: string; fullPath: string }) => void;
  initialDepartment?: string;
  initialSection?: string;
  title?: string;
}

interface FlattenedOrgItem {
  node: OrgNode;
  parentPath: OrgNode[];
  fullPathName: string;
  departmentName: string;
  sectionName: string;
  depth: number;
}

export const OrgTreePickerModal: React.FC<OrgTreePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialDepartment = '',
  initialSection = '',
  title = '組織架構樹狀選取器',
}) => {
  const { orgTree } = useApp();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({
    'org-root': true,
    'org-corp-1': true,
    'org-div-1': true,
    'org-div-2': true,
    'org-div-3': true,
    'org-div-4': true,
    'org-dept-101': true,
    'org-dept-102': true,
    'org-dept-201': true,
    'org-dept-202': true,
    'org-dept-401': true,
    'org-dept-402': true,
  });

  // Flatten tree for searching and mapping
  const flattenedList: FlattenedOrgItem[] = useMemo(() => {
    const list: FlattenedOrgItem[] = [];

    const traverse = (node: OrgNode, path: OrgNode[], depth: number) => {
      if (!node) return;
      const currentPath = [...path, node];

      // Determine resolved department & section for this node
      let deptName = '';
      let sectName = '';

      // Find department in ancestor chain
      const deptAncestor = [...currentPath].reverse().find(
        (n) =>
          n.level === 'department' ||
          n.level === '部室' ||
          (n.level === 'division' && !currentPath.some((p) => p.level === 'department' || p.level === '部室')) ||
          n.level === '處級'
      );

      if (deptAncestor) {
        deptName = deptAncestor.name;
      } else {
        deptName = node.name;
      }

      if (node.level === 'section' || node.level === '科案') {
        // If node name contains parenthetical remark like "AH1案 (台北信義)", extract or keep
        sectName = node.name;
      } else if (node.level === 'department' || node.level === '部室') {
        sectName = node.children && node.children.length > 0 ? node.children[0].name : '-';
      } else {
        sectName = '-';
      }

      list.push({
        node,
        parentPath: path,
        fullPathName: currentPath.map((n) => n.name).join(' > '),
        departmentName: deptName,
        sectionName: sectName,
        depth,
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => traverse(child, currentPath, depth + 1));
      }
    };

    if (orgTree) {
      traverse(orgTree, [], 0);
    }

    return list;
  }, [orgTree]);

  // Selected item information
  const currentSelectedItem = useMemo(() => {
    if (!selectedNodeId) return null;
    return flattenedList.find((item) => item.node.id === selectedNodeId) || null;
  }, [selectedNodeId, flattenedList]);

  // Expand / Collapse all
  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    flattenedList.forEach((item) => {
      map[item.node.id] = true;
    });
    setExpandedNodeIds(map);
  };

  const handleCollapseAll = () => {
    setExpandedNodeIds({});
  };

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Node click handler
  const handleSelectNode = (item: FlattenedOrgItem) => {
    setSelectedNodeId(item.node.id);
  };

  // Double click to confirm directly
  const handleDoubleClickNode = (item: FlattenedOrgItem) => {
    handleConfirmSelection(item);
  };

  const handleConfirmSelection = (itemToConfirm?: FlattenedOrgItem | null) => {
    const item = itemToConfirm || currentSelectedItem;
    if (!item) return;

    onSelect({
      department: item.departmentName,
      section: item.sectionName,
      fullPath: item.fullPathName,
    });
    onClose();
  };

  // Filtered tree nodes or search results
  const isSearching = searchKeyword.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchKeyword.trim().toLowerCase();
    return flattenedList.filter(
      (item) =>
        item.node.name.toLowerCase().includes(q) ||
        (item.node.code && item.node.code.toLowerCase().includes(q)) ||
        (item.node.leaderName && item.node.leaderName.toLowerCase().includes(q)) ||
        item.fullPathName.toLowerCase().includes(q)
    );
  }, [isSearching, searchKeyword, flattenedList]);

  if (!isOpen) return null;

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: OrgNode, path: OrgNode[], depth: number = 0) => {
    const isExpanded = !!expandedNodeIds[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;
    const currentPath = [...path, node];

    // Find the item for this node
    const item = flattenedList.find((it) => it.node.id === node.id);

    // Node badge style
    let levelBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
    let levelLabel = node.level as string;
    if (node.level === 'board' || node.level === '董事長') {
      levelBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      levelLabel = '董事長';
    } else if (node.level === 'president' || node.level === '總經理') {
      levelBadgeBg = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      levelLabel = '總經理';
    } else if (node.level === 'division' || node.level === '處級') {
      levelBadgeBg = 'bg-teal-100 text-teal-900 border-teal-300 font-semibold';
      levelLabel = '處級';
    } else if (node.level === 'department' || node.level === '部室') {
      levelBadgeBg = 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold';
      levelLabel = '部室';
    } else if (node.level === 'section' || node.level === '科案') {
      levelBadgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
      levelLabel = '科案';
    }

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => item && handleSelectNode(item)}
          onDoubleClick={() => item && handleDoubleClickNode(item)}
          className={`flex items-center justify-between py-1.5 px-2.5 my-0.5 rounded-lg border transition-all cursor-pointer ${
            isSelected
              ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-400 text-blue-950 font-medium'
              : 'border-transparent hover:bg-slate-100 hover:border-slate-200 text-slate-700'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 22 + 8)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-4 h-4 rounded hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-slate-300 shrink-0 text-xs">
                •
              </span>
            )}

            <span
              className={`px-1.5 py-0.2 rounded text-[10px] border shrink-0 ${levelBadgeBg}`}
            >
              {levelLabel}
            </span>

            <span className="text-xs font-semibold truncate">{node.name}</span>

            {node.code && (
              <span className="text-[10px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-100 shrink-0">
                {node.code}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.leaderName && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/60">
                <User className="w-3 h-3 text-slate-400" />
                {node.leaderName}
              </span>
            )}
            {isSelected && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                <Check className="w-3 h-3" /> 已選擇
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderTreeNode(child, currentPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                點選組織樹中的「部室」或「科案」節點，將自動連動填入單位資訊
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋部室單位、科案組別、工程代碼、主管姓名..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-2xs"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              全部展開
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              全部收合
            </button>
          </div>
        </div>

        {/* Tree / Search Body Container */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[460px] bg-slate-50/30">
          {isSearching ? (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 px-2 mb-2">
                搜尋結果共 {searchResults.length} 筆項目
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  找不到符合「{searchKeyword}」的組織或科案單位
                </div>
              ) : (
                searchResults.map((item) => {
                  const isSelected = selectedNodeId === item.node.id;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => handleSelectNode(item)}
                      onDoubleClick={() => handleDoubleClickNode(item)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.node.level}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {item.node.name}
                          </span>
                          {item.node.code && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 rounded">
                              {item.node.code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="text-slate-400">完整路徑:</span>
                          <span className="font-mono text-slate-600">{item.fullPathName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.node.leaderName && (
                          <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {item.node.leaderName}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> 已選取
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-2 border border-slate-200">
              {orgTree ? renderTreeNode(orgTree, []) : (
                <div className="text-center py-8 text-slate-400 text-xs">組織樹載入中...</div>
              )}
            </div>
          )}
        </div>

        {/* Selected Unit Preview & Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-600 shrink-0">當前選定單位：</span>
            {currentSelectedItem ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md border border-blue-200">
                  部室：{currentSelectedItem.departmentName}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-200">
                  科案：{currentSelectedItem.sectionName}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">尚未點選組織節點 (請於上方點選)</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!currentSelectedItem}
              onClick={() => handleConfirmSelection()}
              className={`px-5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                currentSelectedItem
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              確認帶入選取單位
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
