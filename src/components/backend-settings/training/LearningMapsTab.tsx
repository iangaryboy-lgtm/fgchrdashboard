import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Map,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  Filter,
  Search,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Info,
  Check,
  X,
  FileText,
  RotateCcw,
  ListOrdered,
  Eye,
  ExternalLink,
  ClipboardCopy,
  FolderGit2,
  Clock,
  Target,
} from 'lucide-react';
import {
  LearningMap,
  CompetencyDefinitionItem,
  LearningPathRowItem,
} from '../../../types';
import {
  INITIAL_COMPETENCY_DEFINITIONS,
  INITIAL_LEARNING_PATH_MATRIX_ROWS,
} from '../../../data/competencyData';
import { exportToExcel } from '../../../utils/excel';

export const LearningMapsTab: React.FC = () => {
  const {
    learningMaps,
    addLearningMap,
    updateLearningMap,
    deleteLearningMap,
    internalCourses,
  } = useApp();

  // Primary sub-navigation tab
  const [subTab, setSubTab] = useState<'definitions' | 'path_matrix' | 'maps_legacy'>('definitions');

  // ==========================================
  // 1. Competency Definitions State
  // ==========================================
  const [competencies, setCompetencies] = useState<CompetencyDefinitionItem[]>(
    INITIAL_COMPETENCY_DEFINITIONS
  );
  const [compFilterPosition, setCompFilterPosition] = useState<string>('全部');
  const [compFilterRank, setCompFilterRank] = useState<string>('全部');
  const [compSearchQuery, setCompSearchQuery] = useState<string>('');

  // Add / Edit Competency Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<CompetencyDefinitionItem | null>(null);

  // Helper rank selectors for form
  const [compStartRank, setCompStartRank] = useState<string>('2');
  const [compEndRank, setCompEndRank] = useState<string>('7');

  const [compFormData, setCompFormData] = useState<Omit<CompetencyDefinitionItem, 'id'>>({
    stageGroup: '假設',
    category: '專業職能(二) 施工階段',
    subCategory: '',
    targetPosition: '土建工程人員',
    targetRankRange: '2職等至7職等',
    courseTypeCategory: '專業課程',
    definitions: [''],
    relatedCourseIds: [],
    relatedCourseTitles: [],
    relatedLicenses: [],
    ojtTrainingMethod: '依工程進度由工地主任規劃培訓項目 (開工前 3 個月內完成培訓)',
    ojtEvaluationMethod: '學術科題庫驗證 & 工巡驗證同仁專業能力程度',
    updatedAt: new Date().toISOString().slice(0, 10),
  });

  // ==========================================
  // 2. Learning Path Matrix State
  // ==========================================
  const [matrixRows, setMatrixRows] = useState<LearningPathRowItem[]>(
    INITIAL_LEARNING_PATH_MATRIX_ROWS
  );
  const [matrixFilterPosition, setMatrixFilterPosition] = useState<string>('土建工程人員');
  const [matrixFilterRankTier, setMatrixFilterRankTier] = useState<string>('全部');

  // Interactive Cell Drilldown Modal State (Click any cell/row)
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{
    row: LearningPathRowItem;
    stageKey: 'tier2to4' | 'tier5to7Prof' | 'tier5to7Leader' | 'tier5to7Manager' | 'all';
    stageTitle: string;
    stageRankRange: string;
    stageType: string;
    items: string[];
  } | null>(null);

  // Add / Edit Matrix Row Modal
  const [isMatrixRowModalOpen, setIsMatrixRowModalOpen] = useState(false);
  const [editingMatrixRow, setEditingMatrixRow] = useState<LearningPathRowItem | null>(null);
  const [matrixRowPosition, setMatrixRowPosition] = useState<string>('土建工程人員');
  const [matrixRowFormData, setMatrixRowFormData] = useState<Omit<LearningPathRowItem, 'id'>>({
    category: '專業職能(二) 施工階段',
    subCategory: '',
    stages: {
      tier2to4: [''],
      tier5to7Prof: [''],
      tier5to7Leader: [''],
      tier5to7Manager: [''],
    },
    notes: '',
  });

  // ==========================================
  // 3. Legacy Learning Maps State
  // ==========================================
  const [selectedMapId, setSelectedMapId] = useState<string>(learningMaps[0]?.id || '');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<LearningMap | null>(null);
  const [mapTitle, setMapTitle] = useState('');
  const [mapTargetRole, setMapTargetRole] = useState('');
  const [mapTargetRank, setMapTargetRank] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [mapMinCreditsRequired, setMapMinCreditsRequired] = useState(16);
  const [mapRequiredCourseIds, setMapRequiredCourseIds] = useState<string[]>([]);
  const [mapElectiveCourseIds, setMapElectiveCourseIds] = useState<string[]>([]);

  const activeMap = learningMaps.find((m) => m.id === selectedMapId) || learningMaps[0];

  // ----------------------------------------------------
  // Filters & Computations for Competencies
  // ----------------------------------------------------
  const filteredCompetencies = useMemo(() => {
    return competencies.filter((item) => {
      // Filter by Position
      if (compFilterPosition !== '全部' && item.targetPosition !== compFilterPosition) return false;

      // Filter by Rank
      if (compFilterRank !== '全部') {
        const rangeText = item.targetRankRange || '';
        if (compFilterRank === '2職等~4職等') {
          const isMatch =
            rangeText.includes('2') ||
            rangeText.includes('3') ||
            rangeText.includes('4') ||
            rangeText.includes('二') ||
            rangeText.includes('三') ||
            rangeText.includes('四');
          if (!isMatch) return false;
        } else if (compFilterRank === '5職等~7職等') {
          const isMatch =
            rangeText.includes('5') ||
            rangeText.includes('6') ||
            rangeText.includes('7') ||
            rangeText.includes('五') ||
            rangeText.includes('六') ||
            rangeText.includes('七');
          if (!isMatch) return false;
        } else if (compFilterRank === '2職等~7職等') {
          const isMatch =
            rangeText.includes('2~7') ||
            rangeText.includes('二~七') ||
            rangeText.includes('2職等至7職等');
          if (!isMatch) return false;
        } else if (compFilterRank === '7職等~9職等') {
          const isMatch =
            rangeText.includes('7') ||
            rangeText.includes('8') ||
            rangeText.includes('9') ||
            rangeText.includes('七') ||
            rangeText.includes('八') ||
            rangeText.includes('九');
          if (!isMatch) return false;
        } else {
          // Specific single rank like '2', '3', '4', '5', '6', '7', '8', '9'
          const numStr = compFilterRank.replace('職等', '').trim();
          const chineseMap: Record<string, string> = {
            '2': '二',
            '3': '三',
            '4': '四',
            '5': '五',
            '6': '六',
            '7': '七',
            '8': '八',
            '9': '九',
          };
          const chChar = chineseMap[numStr] || '';
          if (!rangeText.includes(numStr) && !(chChar && rangeText.includes(chChar))) {
            return false;
          }
        }
      }

      // Filter by Search Query
      if (compSearchQuery.trim()) {
        const q = compSearchQuery.toLowerCase().trim();
        const m1 = item.subCategory.toLowerCase().includes(q);
        const m2 = item.category.toLowerCase().includes(q);
        const m3 = item.stageGroup.toLowerCase().includes(q);
        const m4 = item.definitions.some((d) => d.toLowerCase().includes(q));
        const m5 = (item.relatedCourseTitles || []).some((c) => c.toLowerCase().includes(q));
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }
      return true;
    });
  }, [competencies, compFilterPosition, compFilterRank, compSearchQuery]);

  // Standard Position Options
  const positionOptionsList = [
    '全部',
    '土建工程人員',
    '機電工程人員',
    '工安管理人員',
    '人發訓練專員',
    '成控工程人員',
    '品管工程人員',
    '採購專案人員',
  ];

  // Standard Rank Filter Options
  const rankFilterOptionsList = [
    { label: '全部職等', value: '全部' },
    { label: '2職等至4職等 (基礎課程)', value: '2職等~4職等' },
    { label: '5職等至7職等 (專業/管理)', value: '5職等~7職等' },
    { label: '2職等至7職等 (全專業階段)', value: '2職等~7職等' },
    { label: '7職等至9職等 (高階主管)', value: '7職等~9職等' },
    { label: '2 職等 (助理工程員)', value: '2' },
    { label: '3 職等 (工程員)', value: '3' },
    { label: '4 職等 (助理工程師)', value: '4' },
    { label: '5 職等 (副工程師)', value: '5' },
    { label: '6 職等 (工程師)', value: '6' },
    { label: '7 職等 (正工程師/所長)', value: '7' },
    { label: '8 職等 (資深主管)', value: '8' },
    { label: '9 職等 (處部主管)', value: '9' },
  ];

  // Handle Competency Edit / Add
  const openAddCompModal = () => {
    setEditingComp(null);
    setCompStartRank('2');
    setCompEndRank('7');
    setCompFormData({
      stageGroup: '假設',
      category: '專業職能(二) 施工階段',
      subCategory: '',
      targetPosition: '土建工程人員',
      targetRankRange: '2職等至7職等 (二~七職等)',
      courseTypeCategory: '專業課程',
      definitions: [
        '1. 熟悉相關工項施工規範、施工要典與施工計劃製作',
        '2. 熟悉機具設備材料進場查驗與檢驗查核要點',
        '3. 施工品質管理要點與安衛各項作業規範',
      ],
      relatedCourseIds: [internalCourses[0]?.id || ''],
      relatedCourseTitles: [internalCourses[0]?.title || '【智慧建造】BIM 3D 介面衝突檢討與智慧工地管理'],
      relatedLicenses: ['工地主任'],
      ojtTrainingMethod: '依工程進度由工地主任規劃培訓項目 (開工前 3 個月內完成培訓)',
      ojtEvaluationMethod: '學術科題庫驗證 & 工巡驗證同仁專業能力程度',
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setIsCompModalOpen(true);
  };

  const openEditCompModal = (item: CompetencyDefinitionItem) => {
    setEditingComp(item);
    // Parse start and end rank from string if possible
    if (item.targetRankRange.includes('2') || item.targetRankRange.includes('二')) {
      setCompStartRank('2');
    } else if (item.targetRankRange.includes('5') || item.targetRankRange.includes('五')) {
      setCompStartRank('5');
    } else if (item.targetRankRange.includes('7') || item.targetRankRange.includes('七')) {
      setCompStartRank('7');
    }

    if (item.targetRankRange.includes('4') || item.targetRankRange.includes('四')) {
      setCompEndRank('4');
    } else if (item.targetRankRange.includes('7') || item.targetRankRange.includes('七')) {
      setCompEndRank('7');
    } else if (item.targetRankRange.includes('9') || item.targetRankRange.includes('九')) {
      setCompEndRank('9');
    }

    setCompFormData({
      stageGroup: item.stageGroup,
      category: item.category,
      subCategory: item.subCategory,
      targetPosition: item.targetPosition,
      targetRankRange: item.targetRankRange,
      courseTypeCategory: item.courseTypeCategory,
      definitions: [...item.definitions],
      relatedCourseIds: [...(item.relatedCourseIds || [])],
      relatedCourseTitles: [...(item.relatedCourseTitles || [])],
      relatedLicenses: [...(item.relatedLicenses || [])],
      ojtTrainingMethod: item.ojtTrainingMethod,
      ojtEvaluationMethod: item.ojtEvaluationMethod,
      updatedAt: item.updatedAt,
    });
    setIsCompModalOpen(true);
  };

  const applyRankPreset = (start: string, end: string, label: string) => {
    setCompStartRank(start);
    setCompEndRank(end);
    setCompFormData((prev) => ({
      ...prev,
      targetRankRange: `${start}職等至${end}職等 (${label})`,
    }));
  };

  const handleRankDropdownChange = (start: string, end: string) => {
    setCompStartRank(start);
    setCompEndRank(end);
    setCompFormData((prev) => ({
      ...prev,
      targetRankRange: `${start}職等至${end}職等`,
    }));
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compFormData.subCategory.trim()) return;

    if (editingComp) {
      setCompetencies((prev) =>
        prev.map((c) =>
          c.id === editingComp.id
            ? {
                ...compFormData,
                id: editingComp.id,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : c
        )
      );
    } else {
      const newItem: CompetencyDefinitionItem = {
        ...compFormData,
        id: `comp-def-${Date.now()}`,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setCompetencies((prev) => [newItem, ...prev]);
    }
    setIsCompModalOpen(false);
  };

  const handleDeleteComp = (id: string, name: string) => {
    if (window.confirm(`確定要刪除專業職能項目「${name}」及其定義嗎？`)) {
      setCompetencies((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleExportCompetencies = () => {
    const exportData = filteredCompetencies.map((item, idx) => ({
      項次: idx + 1,
      工項分組: item.stageGroup,
      職能類別: item.category,
      職能次項目: item.subCategory,
      適用職位: item.targetPosition,
      適用職等區間: item.targetRankRange,
      學程屬性: item.courseTypeCategory,
      各項專業職能定義條文: item.definitions.join('\n'),
      對應應修課程: (item.relatedCourseTitles || []).join('、'),
      對應專業證照: (item.relatedLicenses || []).join('、'),
      '施工階段(OJT)培訓方式': item.ojtTrainingMethod,
      '施工階段(OJT)評估方式': item.ojtEvaluationMethod,
      更新日期: item.updatedAt,
    }));
    exportToExcel(exportData, `遠雄營造_專業職能項目定義表_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportMatrix = () => {
    const exportData = matrixRows.map((row) => ({
      職能類別: row.category,
      管理與專業分級: row.subCategory,
      '2職等至4職等(助工員~助工師)[基礎課程]': row.stages.tier2to4.join(' / '),
      '5職等至7職等(副工程師~正工程師)[專業課程]': row.stages.tier5to7Prof.join(' / '),
      '5職等至7職等(儲備主管/棟組長)[管理課程-TWI]': row.stages.tier5to7Leader.join(' / '),
      '5職等至7職等(主任~副理)[管理課程-MTP]': row.stages.tier5to7Manager.join(' / '),
      備註說明: row.notes || '',
    }));
    exportToExcel(exportData, `遠雄營造_學習路徑對應表_${new Date().toISOString().slice(0, 10)}`);
  };

  // ----------------------------------------------------
  // Matrix Cell Drilldown Handler
  // ----------------------------------------------------
  const handleCellClick = (
    row: LearningPathRowItem,
    stageKey: 'tier2to4' | 'tier5to7Prof' | 'tier5to7Leader' | 'tier5to7Manager' | 'all',
    stageTitle: string,
    stageRankRange: string,
    stageType: string,
    items: string[]
  ) => {
    setSelectedMatrixCell({
      row,
      stageKey,
      stageTitle,
      stageRankRange,
      stageType,
      items,
    });
  };

  // ----------------------------------------------------
  // Legacy Map Handlers
  // ----------------------------------------------------
  const openAddMapModal = () => {
    setEditingMap(null);
    setMapTitle('');
    setMapTargetRole('案主管 (工務所長 / 副所長)');
    setMapTargetRank('2職等至7職等 (專員 / 副主任 / 主任 / 襄理)');
    setMapDescription('');
    setMapMinCreditsRequired(16);
    setMapRequiredCourseIds(internalCourses.slice(0, 2).map((c) => c.id));
    setMapElectiveCourseIds([]);
    setIsMapModalOpen(true);
  };

  const openEditMapModal = (map: LearningMap) => {
    setEditingMap(map);
    setMapTitle(map.title);
    setMapTargetRole(map.targetRole);
    setMapTargetRank(map.targetRank);
    setMapDescription(map.description);
    setMapMinCreditsRequired(map.minCreditsRequired);
    setMapRequiredCourseIds(map.requiredCourseIds || []);
    setMapElectiveCourseIds(map.electiveCourseIds || []);
    setIsMapModalOpen(true);
  };

  const handleSubmitMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapTitle.trim()) return;

    if (editingMap) {
      updateLearningMap(editingMap.id, {
        title: mapTitle,
        targetRole: mapTargetRole,
        targetRank: mapTargetRank,
        description: mapDescription,
        minCreditsRequired: Number(mapMinCreditsRequired),
        requiredCourseIds: mapRequiredCourseIds,
        electiveCourseIds: mapElectiveCourseIds,
      });
    } else {
      addLearningMap({
        title: mapTitle,
        targetRole: mapTargetRole,
        targetRank: mapTargetRank,
        description: mapDescription,
        minCreditsRequired: Number(mapMinCreditsRequired),
        requiredCourseIds: mapRequiredCourseIds,
        electiveCourseIds: mapElectiveCourseIds,
      });
    }
    setIsMapModalOpen(false);
  };

  const handleDeleteMap = (id: string, mapTitleStr: string) => {
    if (window.confirm(`確定要刪除學習地圖「${mapTitleStr}」嗎？`)) {
      deleteLearningMap(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-semibold shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">學習地圖與職能路徑管理中心</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              依據職位及職等建立標準職能表、定義專業職能規範、配置對象應修課程路徑與 OJT 驗證機制
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2 shrink-0">
          {subTab === 'definitions' && (
            <button
              onClick={openAddCompModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              設定新職能項目與定義
            </button>
          )}
          {subTab === 'path_matrix' && (
            <button
              onClick={handleExportMatrix}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              匯出路徑矩陣 Excel
            </button>
          )}
          {subTab === 'maps_legacy' && (
            <button
              onClick={openAddMapModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              建立新學程地圖
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Switcher (3 Tabs) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('definitions')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'definitions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          1. 設定職能項目 (各項專業職能定義表)
        </button>

        <button
          onClick={() => setSubTab('path_matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'path_matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          2. 學習路徑 (職位/職等矩陣與應修課程對應表)
        </button>

        <button
          onClick={() => setSubTab('maps_legacy')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'maps_legacy'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          3. 現行學程地圖 (學分與必選修門檻)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: COMPETENCY DEFINITIONS TABLE & CARDS (設定職能項目) */}
      {/* ========================================================================= */}
      {subTab === 'definitions' && (
        <div className="space-y-4">
          {/* Query Filter Toolbar (Dedicated to 『職位』 and 『職等』 as requested) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Keyword search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={compSearchQuery}
                  onChange={(e) => setCompSearchQuery(e.target.value)}
                  placeholder="搜尋職能項目/定義要點/課程..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 w-52 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Position Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  職位：
                </span>
                <select
                  value={compFilterPosition}
                  onChange={(e) => setCompFilterPosition(e.target.value)}
                  className="py-1.5 px-3 text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {positionOptionsList.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos === '全部' ? '全部職位' : pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rank Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  職等：
                </span>
                <select
                  value={compFilterRank}
                  onChange={(e) => setCompFilterRank(e.target.value)}
                  className="py-1.5 px-3 text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {rankFilterOptionsList.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {(compFilterPosition !== '全部' || compFilterRank !== '全部' || compSearchQuery) && (
                <button
                  onClick={() => {
                    setCompFilterPosition('全部');
                    setCompFilterRank('全部');
                    setCompSearchQuery('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  重設條件
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCompetencies}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                匯出職能表 Excel
              </button>
            </div>
          </div>

          {/* Competency Definitions Table & Bulleted List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                各項專業職能定義表 (依據職位與職等建立) - 共 {filteredCompetencies.length} 項工項標準
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                條列式高清定義對齊現場施工要點、題庫驗證與工巡評估標準
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredCompetencies.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">無符合篩選條件的職能項目</p>
                  <button
                    onClick={() => {
                      setCompFilterPosition('全部');
                      setCompFilterRank('全部');
                      setCompSearchQuery('');
                    }}
                    className="mt-2 text-xs text-indigo-600 hover:underline font-bold"
                  >
                    重設篩選條件
                  </button>
                </div>
              ) : (
                filteredCompetencies.map((comp, idx) => (
                  <div key={comp.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-3">
                    {/* Item Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {comp.stageGroup}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">|</span>
                        <span className="text-xs text-slate-600 font-bold">{comp.category}</span>
                        <span className="text-xs text-slate-400 font-semibold">/</span>
                        <h5 className="text-sm font-black text-slate-900">{comp.subCategory}</h5>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          {comp.targetPosition}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          {comp.targetRankRange}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditCompModal(comp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="編輯職能定義"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteComp(comp.id, comp.subCategory)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="刪除職能定義"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bulleted Definitions Box */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        各項專業職能定義 (條列式要點)：
                      </span>
                      <div className="space-y-1 text-xs text-slate-700 font-medium pl-1 leading-relaxed">
                        {comp.definitions.map((def, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold shrink-0">•</span>
                            <span>{def}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata row: Related Courses, Licenses, OJT Method & Evaluation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] pt-1">
                      {/* Courses & Licenses */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">對象應修課程 & 證照：</span>
                          <div className="space-y-1">
                            {comp.relatedCourseTitles && comp.relatedCourseTitles.length > 0 ? (
                              comp.relatedCourseTitles.map((title, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-1 mb-1"
                                >
                                  {title}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">尚無關聯課程</span>
                            )}
                          </div>
                        </div>
                        {comp.relatedLicenses && comp.relatedLicenses.length > 0 && (
                          <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center gap-1 text-amber-700 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            <span>必備證照：{comp.relatedLicenses.join('、')}</span>
                          </div>
                        )}
                      </div>

                      {/* OJT Training Method */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-bold block mb-1">施工階段 (OJT) 培訓方式：</span>
                        <p className="text-slate-700 leading-snug">{comp.ojtTrainingMethod}</p>
                      </div>

                      {/* OJT Evaluation Method */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-bold block mb-1">施工階段 (OJT) 評估方式：</span>
                        <p className="text-slate-700 leading-snug">{comp.ojtEvaluationMethod}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: LEARNING PATH 2D MATRIX (學習路徑對應表) */}
      {/* ========================================================================= */}
      {subTab === 'path_matrix' && (
        <div className="space-y-4">
          {/* Header Bar with Position & Rank Tier Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Position Option Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  目標職位體系：
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['土建工程人員', '機電工程人員', '工安管理人員', '人發訓練專員'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setMatrixFilterPosition(pos)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        matrixFilterPosition === pos
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank Tier Column Highlight Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  職等階梯聚焦：
                </span>
                <select
                  value={matrixFilterRankTier}
                  onChange={(e) => setMatrixFilterRankTier(e.target.value)}
                  className="py-1.5 px-2.5 text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="全部">全部職等階梯 (完整矩陣)</option>
                  <option value="tier2to4">『2』職等至『4』職等 (基礎課程)</option>
                  <option value="tier5to7Prof">『5』職等至『7』職等 (專業課程)</option>
                  <option value="tier5to7Leader">『5』職等至『7』職等 (管理課程 TWI)</option>
                  <option value="tier5to7Manager">『5』職等至『7』職等 (管理課程 MTP)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                點擊任一欄位或儲存格，立即展開對應之詳細培訓規範與課程清單
              </span>
            </div>
          </div>

          {/* High-Fidelity 2D Matrix Table with Clickable Cells */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold tracking-wider">
                  【{matrixFilterPosition}】職位與職等 - 專業職能學習地圖路徑對應表
                </h4>
              </div>
              <span className="text-[11px] text-indigo-200 font-semibold">
                依工程施工進度與管理階梯階梯式培育 (點選欄位查閱詳細規範)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                    <th className="py-3 px-3 w-36 border-r border-slate-200 bg-slate-200/70 text-left">
                      項目分類
                    </th>
                    <th className="py-3 px-3 w-40 border-r border-slate-200 bg-slate-200/50 text-left">
                      管理與專業分級
                    </th>
                    {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier2to4') && (
                      <th className="py-3 px-3 border-r border-slate-200 bg-blue-50/90 text-blue-900 w-1/4">
                        『2』職等至『4』職等 (助工員~助工師)
                        <span className="block text-[10px] text-blue-700 font-semibold mt-0.5">
                          【基礎課程】
                        </span>
                      </th>
                    )}
                    {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Prof') && (
                      <th className="py-3 px-3 border-r border-slate-200 bg-indigo-50/90 text-indigo-900 w-1/4">
                        『5』職等至『7』職等 (副工程師~正工程師)
                        <span className="block text-[10px] text-indigo-700 font-semibold mt-0.5">
                          【專業課程】
                        </span>
                      </th>
                    )}
                    {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Leader') && (
                      <th className="py-3 px-3 border-r border-slate-200 bg-amber-50/90 text-amber-900 w-1/4">
                        『5』職等至『7』職等 (儲備主管/棟組長)
                        <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                          【管理課程 (TWI)】
                        </span>
                      </th>
                    )}
                    {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Manager') && (
                      <th className="py-3 px-3 bg-purple-50/90 text-purple-900 w-1/4">
                        『5』職等至『7』職等 (主任~副理)
                        <span className="block text-[10px] text-purple-700 font-semibold mt-0.5">
                          【管理課程 (MTP)】
                        </span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                  {matrixRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Category cell */}
                      <td
                        onClick={() =>
                          handleCellClick(
                            row,
                            'all',
                            `${row.category} - ${row.subCategory}`,
                            '全職等區間 (2職等至7職等)',
                            '完整工項學程',
                            [
                              ...row.stages.tier2to4,
                              ...row.stages.tier5to7Prof,
                              ...row.stages.tier5to7Leader,
                              ...row.stages.tier5to7Manager,
                            ].filter(Boolean)
                          )
                        }
                        className="py-3 px-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40 cursor-pointer hover:bg-indigo-50/60 transition-colors group"
                        title="點擊查看此類別完整全階段學習路徑"
                      >
                        <div className="flex items-center justify-between">
                          <span>{row.category}</span>
                          <Eye className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </td>

                      {/* SubCategory cell */}
                      <td
                        onClick={() =>
                          handleCellClick(
                            row,
                            'all',
                            `${row.category} - ${row.subCategory}`,
                            '全職等區間 (2職等至7職等)',
                            '完整工項學程',
                            [
                              ...row.stages.tier2to4,
                              ...row.stages.tier5to7Prof,
                              ...row.stages.tier5to7Leader,
                              ...row.stages.tier5to7Manager,
                            ].filter(Boolean)
                          )
                        }
                        className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/20 cursor-pointer hover:bg-indigo-50/60 transition-colors group"
                        title="點擊查看此工項完整全階段學習路徑"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{row.subCategory}</span>
                          <Eye className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </td>

                      {/* Tier 2 to 4 (Basic) */}
                      {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier2to4') && (
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              'tier2to4',
                              `${row.subCategory} - 基礎培育模組`,
                              '『2』職等至『4』職等 (助工員~助工師)',
                              '基礎課程',
                              row.stages.tier2to4
                            )
                          }
                          className="py-3 px-3 border-r border-slate-200 align-top cursor-pointer hover:bg-blue-50/50 transition-colors group"
                          title="點擊查閱 2~4 職等詳細課程規範"
                        >
                          <ul className="space-y-1">
                            {row.stages.tier2to4.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-600 font-bold">•</span>
                                <span className="group-hover:text-blue-900 transition-colors">{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            點擊檢視詳細規範
                          </div>
                        </td>
                      )}

                      {/* Tier 5 to 7 (Professional) */}
                      {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Prof') && (
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              'tier5to7Prof',
                              `${row.subCategory} - 專業深造模組`,
                              '『5』職等至『7』職等 (副工程師~正工程師)',
                              '專業課程',
                              row.stages.tier5to7Prof
                            )
                          }
                          className="py-3 px-3 border-r border-slate-200 align-top cursor-pointer hover:bg-indigo-50/50 transition-colors group"
                          title="點擊查閱 5~7 職等專業詳細課程規範"
                        >
                          <ul className="space-y-1">
                            {row.stages.tier5to7Prof.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-indigo-600 font-bold">•</span>
                                <span className="group-hover:text-indigo-900 transition-colors">{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-[10px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            點擊檢視詳細規範
                          </div>
                        </td>
                      )}

                      {/* Tier 5 to 7 (Leader TWI) */}
                      {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Leader') && (
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              'tier5to7Leader',
                              `${row.subCategory} - 儲備主管與棟組長實務模組`,
                              '『5』職等至『7』職等 (儲備主管/棟組長)',
                              '管理課程 (TWI)',
                              row.stages.tier5to7Leader
                            )
                          }
                          className="py-3 px-3 border-r border-slate-200 align-top cursor-pointer hover:bg-amber-50/50 transition-colors group"
                          title="點擊查閱 5~7 職等 TWI 管理課程規範"
                        >
                          <ul className="space-y-1">
                            {row.stages.tier5to7Leader.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-600 font-bold">•</span>
                                <span className="group-hover:text-amber-900 transition-colors">{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-[10px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            點擊檢視詳細規範
                          </div>
                        </td>
                      )}

                      {/* Tier 5 to 7 (Manager MTP) */}
                      {(matrixFilterRankTier === '全部' || matrixFilterRankTier === 'tier5to7Manager') && (
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              'tier5to7Manager',
                              `${row.subCategory} - 案主管領導經營模組`,
                              '『5』職等至『7』職等 (主任~副理)',
                              '管理課程 (MTP)',
                              row.stages.tier5to7Manager
                            )
                          }
                          className="py-3 px-3 align-top cursor-pointer hover:bg-purple-50/50 transition-colors group"
                          title="點擊查閱 5~7 職等 MTP 管理課程規範"
                        >
                          <ul className="space-y-1">
                            {row.stages.tier5to7Manager.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-purple-600 font-bold">•</span>
                                <span className="group-hover:text-purple-900 transition-colors">{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-[10px] text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            點擊檢視詳細規範
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: LEGACY LEARNING MAPS (現行學程地圖與學分門檻) */}
      {/* ========================================================================= */}
      {subTab === 'maps_legacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              現行培育體系 ({learningMaps.length})
            </h4>

            {learningMaps.map((map) => {
              const isSelected = activeMap?.id === map.id;
              return (
                <div
                  key={map.id}
                  onClick={() => setSelectedMapId(map.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold">
                        {map.targetRole}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 mt-1.5">{map.title}</h5>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{map.description}</p>

                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100/80 text-[11px] text-slate-600">
                    <span>
                      必修: <strong>{map.requiredCourseIds?.length || 0}</strong> 門
                    </span>
                    <span>
                      選修: <strong>{map.electiveCourseIds?.length || 0}</strong> 門
                    </span>
                    <span>
                      門檻: <strong className="text-indigo-600">{map.minCreditsRequired} 學分</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Map Detail Canvas */}
          {activeMap && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-xs font-bold">
                      {activeMap.targetRole}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">適用職等：{activeMap.targetRank}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1.5">{activeMap.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activeMap.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditMapModal(activeMap)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="編輯學習地圖"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMap(activeMap.id, activeMap.title)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="刪除學習地圖"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Required Courses Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    核心必修課程模組 (需全數修畢及格)
                  </h4>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    共 {activeMap.requiredCourseIds?.length || 0} 門課
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeMap.requiredCourseIds?.map((cid) => {
                    const course = internalCourses.find((c) => c.id === cid);
                    if (!course) return null;
                    return (
                      <div
                        key={cid}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {course.courseCode}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {course.credits} 學分
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 mt-2">{course.title}</h5>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                          <span>{course.categoryName}</span>
                          <span>{course.hours} 小時</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Elective Courses Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    專業選修模組 (依個人職能缺口自由修習)
                  </h4>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    共 {activeMap.electiveCourseIds?.length || 0} 門課
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeMap.electiveCourseIds?.map((cid) => {
                    const course = internalCourses.find((c) => c.id === cid);
                    if (!course) return null;
                    return (
                      <div
                        key={cid}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {course.courseCode}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {course.credits} 學分
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 mt-2">{course.title}</h5>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                          <span>{course.categoryName}</span>
                          <span>{course.hours} 小時</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT COMPETENCY DEFINITION (With structured Position & Rank selects) */}
      {/* ========================================================================= */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {editingComp ? '編輯專業職能項目與定義' : '設定全新專業職能項目'}
              </h3>
              <button
                onClick={() => setIsCompModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComp} className="space-y-4">
              {/* Position and Rank Range with Structured Select Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100">
                {/* Position Option */}
                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    目標職位名稱 *
                  </label>
                  <select
                    value={compFormData.targetPosition}
                    onChange={(e) => setCompFormData({ ...compFormData, targetPosition: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="土建工程人員">土建工程人員</option>
                    <option value="機電工程人員">機電工程人員</option>
                    <option value="工安管理人員">工安管理人員</option>
                    <option value="人發訓練專員">人發訓練專員</option>
                    <option value="成控工程人員">成控工程人員</option>
                    <option value="品管工程人員">品管工程人員</option>
                    <option value="採購專案人員">採購專案人員</option>
                    <option value="專案主管 (所長/副所長)">專案主管 (所長/副所長)</option>
                  </select>
                </div>

                {/* Rank Option (Structured Dropdowns: e.g. 『2』職等至『4』職等) */}
                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    適用職等區間 (下拉選項) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={compStartRank}
                      onChange={(e) => handleRankDropdownChange(e.target.value, compEndRank)}
                      className="w-full px-2.5 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl text-indigo-900"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <option key={n} value={String(n)}>
                          『{n}』職等
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-bold text-slate-500">至</span>
                    <select
                      value={compEndRank}
                      onChange={(e) => handleRankDropdownChange(compStartRank, e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl text-indigo-900"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <option key={n} value={String(n)}>
                          『{n}』職等
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rank Preset Quick Select Chips */}
                <div className="sm:col-span-2 pt-1 border-t border-indigo-100/80">
                  <span className="text-[11px] font-bold text-indigo-900 block mb-1">
                    常用標準職等區間快捷套用：
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { start: '2', end: '4', label: '基礎課程 (助工員~助工師)' },
                      { start: '5', end: '7', label: '專業課程 (副工~正工)' },
                      { start: '5', end: '7', label: '管理TWI (儲備主管/棟組長)' },
                      { start: '5', end: '7', label: '管理MTP (主任~副理)' },
                      { start: '2', end: '7', label: '全專業階段' },
                      { start: '7', end: '9', label: '高階專案主管' },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => applyRankPreset(preset.start, preset.end, preset.label)}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-semibold transition-colors"
                      >
                        『{preset.start}』至『{preset.end}』等 - {preset.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group & SubCategory Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">工項分組</label>
                  <select
                    value={compFormData.stageGroup}
                    onChange={(e) => setCompFormData({ ...compFormData, stageGroup: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="假設">假設工程</option>
                    <option value="基礎">基礎工程</option>
                    <option value="結構">結構工程</option>
                    <option value="裝修">裝修工程</option>
                    <option value="中庭景觀/驗交屋">中庭景觀/驗交屋</option>
                    <option value="施工管理">施工管理</option>
                    <option value="職安管理">職安管理</option>
                    <option value="行政作業">行政作業</option>
                    <option value="管理職能(MA&組級)">管理職能(MA&組級)</option>
                    <option value="管理職能(科級)">管理職能(科級)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">專業職能項目名稱 *</label>
                  <input
                    type="text"
                    value={compFormData.subCategory}
                    onChange={(e) => setCompFormData({ ...compFormData, subCategory: e.target.value })}
                    placeholder="例：連續壁工程 / 開挖及支撐工程"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Definitions List */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    各項專業職能定義條文 (條列式要點) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCompFormData((prev) => ({
                        ...prev,
                        definitions: [...prev.definitions, `${prev.definitions.length + 1}. `],
                      }))
                    }
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    + 新增一條定義
                  </button>
                </div>

                {compFormData.definitions.map((def, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={def}
                      onChange={(e) => {
                        const newDefs = [...compFormData.definitions];
                        newDefs[dIdx] = e.target.value;
                        setCompFormData({ ...compFormData, definitions: newDefs });
                      }}
                      placeholder={`定義條文 ${dIdx + 1}`}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    {compFormData.definitions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCompFormData((prev) => ({
                            ...prev,
                            definitions: prev.definitions.filter((_, i) => i !== dIdx),
                          }))
                        }
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* OJT Method & Evaluation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">施工階段 (OJT) 培訓方式</label>
                  <textarea
                    rows={2}
                    value={compFormData.ojtTrainingMethod}
                    onChange={(e) => setCompFormData({ ...compFormData, ojtTrainingMethod: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">施工階段 (OJT) 評估方式</label>
                  <textarea
                    rows={2}
                    value={compFormData.ojtEvaluationMethod}
                    onChange={(e) => setCompFormData({ ...compFormData, ojtEvaluationMethod: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  儲存職能定義
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE LEARNING PATH CELL DETAIL (Triggered upon clicking any cell) */}
      {/* ========================================================================= */}
      {selectedMatrixCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-[11px] font-bold">
                    {matrixFilterPosition}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-bold">
                    {selectedMatrixCell.stageRankRange}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-bold">
                    {selectedMatrixCell.stageType}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  {selectedMatrixCell.stageTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  工項類別：{selectedMatrixCell.row.category} / 管理分級：{selectedMatrixCell.row.subCategory}
                </p>
              </div>

              <button
                onClick={() => setSelectedMatrixCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Course Requirements List */}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  本職等階段應修核心課程與工項主題模組：
                </h4>
                <div className="space-y-2">
                  {selectedMatrixCell.items.length === 0 ? (
                    <p className="text-xs text-slate-400">此職等階段無特定列管課程</p>
                  ) : (
                    selectedMatrixCell.items.map((itemStr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{itemStr}</h5>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                            考核形式：學術科題庫驗證、現場實務演練與主管考核及格
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Matched System Courses */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  系統智能匹配之遠雄內部對應培訓學程：
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {internalCourses.slice(0, 2).map((c) => (
                    <div key={c.id} className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {c.courseCode}
                        </span>
                        <span className="font-bold text-slate-500">{c.credits} 學分</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{c.title}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{c.hours} 小時 • {c.categoryName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OJT & Standards Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    施工階段 (OJT) 培訓期程：
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    依工程進度由工地主任規劃培訓項目，開工前 3 個月內完成培訓與施工計劃製作。
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    現場工巡與題庫驗證：
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    實施材料進場自主查驗表查核，工巡驗證同仁介面收邊與安衛規範落實度。
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const text = `【${selectedMatrixCell.stageTitle}】\n適用職等：${selectedMatrixCell.stageRankRange}\n應修課程：\n${selectedMatrixCell.items.join('\n')}`;
                  navigator.clipboard.writeText(text);
                  alert('已複製學習路徑指引至剪貼簿！');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-slate-600" />
                複製學習路徑指引
              </button>

              <button
                onClick={() => setSelectedMatrixCell(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                確認關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT LEGACY MAP */}
      {/* ========================================================================= */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {editingMap ? '編輯學習地圖' : '建立全新職能學習地圖'}
              </h3>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">地圖名稱 *</label>
                <input
                  type="text"
                  value={mapTitle}
                  onChange={(e) => setMapTitle(e.target.value)}
                  placeholder="例：2026 遠雄營造案主管黃金培育學程"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">目標職務/職位</label>
                  <input
                    type="text"
                    value={mapTargetRole}
                    onChange={(e) => setMapTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">適用職等</label>
                  <input
                    type="text"
                    value={mapTargetRank}
                    onChange={(e) => setMapTargetRank(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">培育目標與說明</label>
                <textarea
                  rows={3}
                  value={mapDescription}
                  onChange={(e) => setMapDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">最低結業學分門檻</label>
                <input
                  type="number"
                  value={mapMinCreditsRequired}
                  onChange={(e) => setMapMinCreditsRequired(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  儲存地圖
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
