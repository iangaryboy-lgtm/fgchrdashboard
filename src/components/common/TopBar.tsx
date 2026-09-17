import React from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, RotateCcw, Building2, CheckCircle2, HeartHandshake, FileSpreadsheet, Globe, User, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ActiveView } from '../../types';

interface TopBarProps {
  onOpenLogin: () => void;
  onOpenGoogleLogin?: () => void;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  isSidebarOpen?: boolean;
  isSidebarPinned?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenLogin,
  onOpenGoogleLogin,
  onToggleSidebar,
  onToggleMobileSidebar,
  isSidebarOpen = true,
  isSidebarPinned = false,
}) => {
  const handleToggle = onToggleSidebar || onToggleMobileSidebar;
  const {
    activeView,
    setActiveView,
    currentUser,
    setCurrentUser,
    permissionMatrix,
    role,
    resetToDefaultData,
  } = useApp();

  // Find user's permission
  const userPerm = currentUser?.employee?.empNo
    ? permissionMatrix.find((p) => p.empNo === currentUser.employee?.empNo)
    : null;

  const isLeaderOrAdmin =
    role === 'super_admin' ||
    role === 'hr_admin' ||
    currentUser?.type === 'google_admin' ||
    currentUser?.employee?.department === '人力資源室' ||
    ['07', '08', '09'].includes(currentUser?.employee?.rank || '');

  const isSuperAdmin = currentUser?.type === 'google_admin' || role === 'super_admin';

  // Determine which dashboard tabs to show on the top bar
  // 依使用者需求：上方工具列先留下「開案計畫儀表板」、「案主管人才庫儀表板」，其餘先隱藏
  const navTabs: {
    id: ActiveView;
    aliases: ActiveView[];
    label: string;
    icon?: React.ReactNode;
    visible: boolean;
  }[] = [
    {
      id: 'frontend_project_plan',
      aliases: ['frontend_project_plan', 'project_plans'],
      label: '開案計畫儀表板',
      visible: isSuperAdmin || (userPerm ? userPerm.dashboardAccess?.projectPlan !== false : true),
    },
    {
      id: 'frontend_candidate_pool',
      aliases: ['frontend_candidate_pool', 'candidates'],
      label: '案主管人才庫儀表板',
      visible: isSuperAdmin || (userPerm ? userPerm.dashboardAccess?.candidatePool === true : isLeaderOrAdmin),
    },
    {
      id: 'frontend_quarterly_demand',
      aliases: ['frontend_quarterly_demand', 'quarterly_demand'],
      label: '案主管供需儀表板',
      visible: true,
    },
  ];

  const isViewActive = (aliases: ActiveView[]) => aliases.includes(activeView);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <header id="main-topbar" className="flex flex-col shrink-0 select-none z-30 shadow-md">
      {/* 1. Top Thin Bar: FARGLORY | 人資儀表板戰情室 */}
      <div className="bg-[#060D1E] text-slate-300 px-3 sm:px-6 py-2 flex items-center justify-between border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {/* Universal sidebar menu toggle button */}
          <button
            id="btn-topbar-thin-toggle-sidebar"
            onClick={handleToggle}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
            title={isSidebarOpen ? '收合左側功能表' : '展開左側功能表'}
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-extrabold tracking-wider text-blue-400 text-xs">
            FARGLORY
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-200 font-medium text-xs">
            人資儀表板戰情室
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('確定要將系統資料重設為遠雄營造公版 Demo 初始狀態嗎？')) {
                resetToDefaultData();
              }
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            title="重設 Demo 數據"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">重設 Demo</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/50">
            {currentUser ? '已驗證登入' : '同仁前台'}
          </span>
        </div>
      </div>

      {/* 2. Main Header Row: 遠雄營造人資儀表板戰情室 + 導覽標籤 + 登出 */}
      <div className="bg-[#0B132B] text-white px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-800">
        {/* Left: Sidebar Toggle & Logo Box + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="btn-topbar-main-toggle-sidebar"
            onClick={handleToggle}
            className={`p-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              isSidebarOpen
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:bg-blue-600/50 hover:text-white'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={isSidebarOpen ? '收合左側功能表 (全螢幕戰情視窗)' : '展開左側功能表'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-blue-300" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-[11px] font-medium hidden sm:inline">
              {isSidebarOpen ? '收合選單' : '展開選單'}
            </span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
            遠
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-white tracking-tight leading-tight truncate">
              遠雄營造人資儀表板戰情室
            </h1>
          </div>
        </div>

        {/* Center / Right: Navigation Tabs */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {navTabs
              .filter((tab) => tab.visible)
              .map((tab) => {
                const active = isViewActive(tab.aliases);
                return (
                  <button
                    key={tab.id}
                    id={`top-tab-${tab.id}`}
                    onClick={() => setActiveView(tab.id)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-400'}`}></span>
                    {tab.label}
                  </button>
                );
              })}

            {/* Logout Crimson Button matching Image 3 */}
            <button
              id="btn-topbar-logout"
              onClick={handleLogout}
              className="ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors cursor-pointer"
              title="登出目前同仁身分"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              請於下方或左側選單驗證同仁身分
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
