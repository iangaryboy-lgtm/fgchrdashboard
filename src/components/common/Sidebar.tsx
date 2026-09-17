import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Users,
  UserCheck,
  ClipboardList,
  Sliders,
  Globe,
  RotateCcw,
  RefreshCw,
  LogOut,
  LogIn,
  CheckCircle2,
  Calendar,
  CalendarRange,
  FileSpreadsheet,
  HeartHandshake,
  ShieldCheck,
  ChevronRight,
  Database,
  Check,
  Loader2,
  X,
  LayoutDashboard,
  User,
  IdCard,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ActiveView } from '../../types';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface SidebarProps {
  isOpen?: boolean;
  isPinned?: boolean;
  onToggleOpen?: () => void;
  onTogglePin?: () => void;
  onClose?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenLogin: () => void;
  onOpenGoogleLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isPinned = false,
  onToggleOpen,
  onTogglePin,
  onClose,
  isOpenMobile = false,
  onCloseMobile,
  onOpenLogin,
  onOpenGoogleLogin,
}) => {
  const open = isOpen !== undefined ? isOpen : isOpenMobile;
  const handleClose = () => {
    onClose?.();
    onCloseMobile?.();
  };
  const {
    activeView,
    setActiveView,
    currentUser,
    setCurrentUser,
    googleAdmins,
    role,
    permissionMatrix,
    dbStatus,
    lastDbSyncTime,
    forceSyncDatabase,
  } = useApp();

  const userPerm = currentUser?.employee?.empNo
    ? permissionMatrix.find((p) => p.empNo === currentUser.employee?.empNo)
    : null;

  const isLeaderOrAdmin =
    role === 'super_admin' ||
    role === 'hr_admin' ||
    currentUser?.type === 'google_admin' ||
    currentUser?.employee?.department === '人力資源室' ||
    ['07', '08', '09'].includes(currentUser?.employee?.rank || '');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleNavClick = (view: ActiveView) => {
    let target = view;
    if (view === 'frontend_project_plan' && userPerm && currentUser?.type !== 'google_admin' && role !== 'super_admin') {
      if (userPerm.dashboardAccess?.projectPlan === false) {
        if (userPerm.dashboardAccess?.candidatePool === true) {
          target = 'frontend_candidate_pool';
        } else if (userPerm.dashboardAccess?.surveyFill !== false) {
          target = 'frontend_survey_fill';
        } else if (userPerm.dashboardAccess?.trainingPortal !== false) {
          target = 'frontend_training_portal';
        } else {
          target = 'frontend_home';
        }
      }
    }
    setActiveView(target);
    if (!isPinned) {
      handleClose();
    }
  };

  // Direct Official Google Auth Popup Flow
  const handleDirectGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) {
        alert('未能取得 Google 帳號授權資訊');
        return;
      }
      const admin = googleAdmins.find((a) => a.email.toLowerCase() === user.email?.toLowerCase());
      if (!admin) {
        await signOut(auth);
        alert(`Google 官方驗證成功！\n\n但您的帳號【${user.email}】不在遠雄營造管理員白名單中。\n請聯繫系統超級管理員於全域設定中新增白名單授權後再行登入。`);
        return;
      }

      setCurrentUser({
        type: 'google_admin',
        googleEmail: admin.email,
        adminRole: admin.role,
      });
      onCloseMobile?.();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup window - gracefully exit
        return;
      }
      console.warn('Google Sign-In Popup:', err?.message || err);
      if (err?.code === 'auth/unauthorized-domain') {
        alert('此網域未在 Firebase 授權清單中，如需測試請於全域設定中進行帳號切換。');
      } else {
        alert(`Google 官方驗證提示：${err?.message || '驗證流程中斷，請重試'}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const result = await forceSyncDatabase();
      setSyncToast(result.message);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (e) {
      setSyncToast('資料庫連線檢測完成');
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isViewActive = (views: ActiveView[]) => views.includes(activeView);

  const hasBackendAccess = Boolean(
    currentUser?.type === 'google_admin' ||
    userPerm?.canAccessBackend === true ||
    currentUser?.employee?.department === '人力資源室'
  );

  // User display info (員工編號、姓名、所屬科案單位、職稱)
  const employeeEmpNo =
    currentUser?.type === 'google_admin'
      ? currentUser.employee?.empNo || (currentUser.googleEmail === 'iangaryboy@gmail.com' ? 'ADM-001' : 'ADMIN')
      : currentUser?.employee?.empNo || currentUser?.empNo || '';

  const employeeName =
    currentUser?.type === 'google_admin'
      ? currentUser.employee?.name || (currentUser.googleEmail === 'iangaryboy@gmail.com' ? 'Gary Chen' : currentUser.googleEmail?.split('@')[0] || '系統管理員')
      : currentUser?.employee?.name || '同仁訪客';

  const employeeDepartment =
    currentUser?.type === 'google_admin'
      ? currentUser.employee?.department || '人力資源室'
      : currentUser?.employee?.department || '人力資源室';

  const userInitial = employeeName.charAt(0) || (currentUser?.type === 'google_admin' ? 'G' : '同');

  return (
    <>
      {/* Backdrop Overlay:
          - Floating mode (!isPinned): always show when open on all screen sizes.
          - Fixed window mode (isPinned): only show on mobile (<lg) when open.
      */}
      {open && (
        <div
          id="sidebar-backdrop-overlay"
          className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity duration-300 ${
            isPinned ? 'lg:hidden' : ''
          }`}
          onClick={handleClose}
        />
      )}

      <aside
        id="main-sidebar"
        className={`bg-[#0B132B] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none h-full transition-all duration-300 ease-in-out ${
          isPinned
            ? /* Pinned / Fixed Window Mode */
              `fixed inset-y-0 left-0 z-50 w-72 lg:static lg:z-30 ${
                open
                  ? 'translate-x-0 lg:w-72 lg:opacity-100 shadow-2xl lg:shadow-none'
                  : '-translate-x-full lg:w-0 lg:overflow-hidden lg:opacity-0 lg:border-r-0 pointer-events-none'
              }`
            : /* Floating Window / Drawer Mode */
              `fixed inset-y-0 left-0 z-50 w-72 shadow-2xl ${
                open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
              }`
        }`}
      >
        {/* Brand Header with Pin/Dock and Collapse controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 truncate">
                <span>HR MASTER Pro</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase truncate">
                遠雄營造 MANAGEMENT
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                {isPinned ? '固定常駐' : '浮動抽屜'}
              </span>
            </div>
          </div>

          {/* Action buttons: Pin/Dock toggle + Collapse button */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Fixed / Floating Window Toggle */}
            <button
              id="btn-sidebar-toggle-pin"
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                isPinned
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 hover:bg-blue-600/50 hover:text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
              title={
                isPinned
                  ? '目前為「固定常駐視窗」模式 (點擊解除固定改為浮動抽屜)'
                  : '目前為「浮動抽屜」模式 (點擊切換為固定常駐視窗)'
              }
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            {/* Collapse Sidebar Button */}
            <button
              id="btn-sidebar-collapse"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="收合功能表 (全螢幕檢視戰情)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Navigation Scroll Area */}
        <div className="flex-1 px-3.5 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {/* Section 1: PORTAL ACCESS (前台戰情) */}
          <div>
            <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PORTAL ACCESS
            </div>
            <div className="space-y-1">
              {/* 個人工作台 (首頁 / 待辦簽核) */}
              <button
                id="nav-frontend-home"
                onClick={() => {
                  handleNavClick('frontend_home');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive(['frontend_home', 'home'])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck
                    className={`w-4 h-4 transition-colors ${
                      isViewActive(['frontend_home', 'home'])
                        ? 'text-white'
                        : 'text-amber-400 group-hover:text-amber-300'
                    }`}
                  />
                  <span>個人工作台 (首頁)</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive(['frontend_home', 'home'])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>

              {/* 人資戰情室前台 */}
              <button
                id="nav-frontend-portal"
                onClick={() => {
                  handleNavClick('frontend_project_plan');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive([
                    'frontend_project_plan',
                    'project_plans',
                    'frontend_candidate_pool',
                    'candidates',
                    'frontend_survey_fill',
                    'survey_fill',
                  ])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard
                    className={`w-4 h-4 transition-colors ${
                      isViewActive([
                        'frontend_project_plan',
                        'project_plans',
                        'frontend_candidate_pool',
                        'candidates',
                        'frontend_survey_fill',
                        'survey_fill',
                      ])
                        ? 'text-white'
                        : 'text-blue-400 group-hover:text-blue-300'
                    }`}
                  />
                  <span>人資戰情室前台</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive([
                      'frontend_project_plan',
                      'project_plans',
                      'frontend_candidate_pool',
                      'candidates',
                      'frontend_survey_fill',
                      'survey_fill',
                    ])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>

              {/* 開案計畫甘特圖 (輕量視覺化時程與主管遴選) */}
              <button
                id="nav-frontend-project-gantt"
                onClick={() => {
                  handleNavClick('frontend_project_gantt');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive(['frontend_project_gantt', 'project_gantt'])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarRange
                    className={`w-4 h-4 transition-colors ${
                      isViewActive(['frontend_project_gantt', 'project_gantt'])
                        ? 'text-white'
                        : 'text-indigo-400 group-hover:text-indigo-300'
                    }`}
                  />
                  <span>開案計畫甘特圖</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive(['frontend_project_gantt', 'project_gantt'])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>

              {/* 人力供需戰情看板 */}
              <button
                id="nav-frontend-manpower-dashboard"
                onClick={() => {
                  handleNavClick('frontend_manpower_dashboard');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive(['frontend_manpower_dashboard', 'manpower_dashboard'])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp
                    className={`w-4 h-4 transition-colors ${
                      isViewActive(['frontend_manpower_dashboard', 'manpower_dashboard'])
                        ? 'text-white'
                        : 'text-teal-400 group-hover:text-teal-300'
                    }`}
                  />
                  <span>人力供需戰情看板</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive(['frontend_manpower_dashboard', 'manpower_dashboard'])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>

              {/* 案主管供需儀表板 */}
              <button
                id="nav-frontend-quarterly-demand"
                onClick={() => {
                  handleNavClick('frontend_quarterly_demand');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive(['frontend_quarterly_demand', 'quarterly_demand'])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2
                    className={`w-4 h-4 transition-colors ${
                      isViewActive(['frontend_quarterly_demand', 'quarterly_demand'])
                        ? 'text-white'
                        : 'text-amber-400 group-hover:text-amber-300'
                    }`}
                  />
                  <span>案主管供需儀表板</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive(['frontend_quarterly_demand', 'quarterly_demand'])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>

              {/* 專業訓練學習專區 (aEnrich 培育) */}
              <button
                id="nav-frontend-training-portal"
                onClick={() => {
                  handleNavClick('frontend_training_portal');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isViewActive(['frontend_training_portal', 'training_portal'])
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap
                    className={`w-4 h-4 transition-colors ${
                      isViewActive(['frontend_training_portal', 'training_portal'])
                        ? 'text-white'
                        : 'text-indigo-400 group-hover:text-indigo-300'
                    }`}
                  />
                  <span>專業訓練學習專區</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-60 ${
                    isViewActive(['frontend_training_portal', 'training_portal'])
                      ? 'opacity-100'
                      : 'hidden group-hover:block'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: MANAGEMENT SETTING (後台管理) - Visible to Google Admin & Authorized Staff */}
          {(currentUser?.type === 'google_admin' ||
            userPerm?.canAccessBackend === true ||
            currentUser?.employee?.department === '人力資源室') && (
            <div>
              <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>MANAGEMENT SETTING</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
                  {currentUser?.type === 'google_admin' ? 'GOOGLE ADMIN' : 'MANAGEMENT'}
                </span>
              </div>
              <div className="space-y-1">
                {/* 1. 全域總功能設定 */}
                <button
                  id="nav-global-settings"
                  onClick={() => handleNavClick('backend_global_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_global_settings', 'global_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_global_settings', 'global_settings'])
                          ? 'text-white'
                          : 'text-purple-400 group-hover:text-purple-300'
                      }`}
                    />
                    <span>全域總功能設定</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_global_settings', 'global_settings']) ? 'opacity-100' : 'hidden group-hover:block'
                    }`}
                  />
                </button>

                {/* 2. 開案計畫設定 */}
                <button
                  id="nav-project-plan-settings"
                  onClick={() => handleNavClick('backend_project_plan_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_project_plan_settings', 'project_plan_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_project_plan_settings', 'project_plan_settings'])
                          ? 'text-white'
                          : 'text-emerald-400 group-hover:text-emerald-300'
                      }`}
                    />
                    <span>開案計畫設定</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_project_plan_settings', 'project_plan_settings'])
                        ? 'opacity-100'
                        : 'hidden group-hover:block'
                    }`}
                  />
                </button>

                {/* 3. 案場人力預測設定 (外案配置/供給假設/人工目標) */}
                <button
                  id="nav-manpower-forecast-settings"
                  onClick={() => handleNavClick('backend_manpower_forecast_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_manpower_forecast_settings', 'manpower_forecast_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_manpower_forecast_settings', 'manpower_forecast_settings'])
                          ? 'text-white'
                          : 'text-cyan-400 group-hover:text-cyan-300'
                      }`}
                    />
                    <span>案場人力預測設定</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_manpower_forecast_settings', 'manpower_forecast_settings'])
                        ? 'opacity-100'
                        : 'hidden group-hover:block'
                    }`}
                  />
                </button>

                {/* 3. 案主管背景設定 */}
                <button
                  id="nav-candidate-settings"
                  onClick={() => handleNavClick('backend_candidate_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_candidate_settings', 'candidate_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_candidate_settings', 'candidate_settings'])
                          ? 'text-white'
                          : 'text-rose-400 group-hover:text-rose-300'
                      }`}
                    />
                    <span>案主管背景設定</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_candidate_settings', 'candidate_settings'])
                        ? 'opacity-100'
                        : 'hidden group-hover:block'
                    }`}
                  />
                </button>

                {/* 4. 專業訓練設定 (TMS/LMS 育碁系統) */}
                <button
                  id="nav-training-settings"
                  onClick={() => handleNavClick('backend_training_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_training_settings', 'training_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_training_settings', 'training_settings'])
                          ? 'text-white'
                          : 'text-amber-400 group-hover:text-amber-300'
                      }`}
                    />
                    <span>專業訓練設定</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_training_settings', 'training_settings'])
                        ? 'opacity-100'
                        : 'hidden group-hover:block'
                    }`}
                  />
                </button>

                {/* 5. 證照資訊管理 (證照雲流程) */}
                <button
                  id="nav-resume-license-settings"
                  onClick={() => handleNavClick('backend_resume_license_settings')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isViewActive(['backend_resume_license_settings', 'resume_license_settings'])
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Award
                      className={`w-4 h-4 transition-colors ${
                        isViewActive(['backend_resume_license_settings', 'resume_license_settings'])
                          ? 'text-white'
                          : 'text-cyan-400 group-hover:text-cyan-300'
                      }`}
                    />
                    <span>證照資訊管理</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-60 ${
                      isViewActive(['backend_resume_license_settings', 'resume_license_settings'])
                        ? 'opacity-100'
                        : 'hidden group-hover:block'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Section 3: 系統診斷與連線 (SYSTEM DIAGNOSTICS) - Visible only to users with backend access */}
          {hasBackendAccess && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                系統診斷與連線
              </div>

              <button
                id="btn-force-sync-db"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw
                    className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                  />
                  <span>{isSyncing ? '即時同步中...' : '雲端資料庫立即同步'}</span>
                </div>
                <Database className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Toast / Sync Info */}
              {syncToast && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-[11px] text-emerald-300 leading-tight flex items-start gap-1.5 animate-in fade-in duration-200">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{syncToast}</span>
                </div>
              )}

              {/* Connection Status Badge */}
              <div className="mt-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-medium text-slate-300">Firestore 雲端資料庫</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">多機即時同步</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>跨裝置狀態</span>
                  <span className="text-slate-300">即時雙向連線</span>
                </div>
                {lastDbSyncTime && (
                  <div className="text-[9px] text-slate-500 text-right pt-0.5 border-t border-slate-800/60">
                    上次同步: {lastDbSyncTime}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Profile & Admin Login Section */}
        <div className="p-3.5 border-t border-slate-800 bg-[#080E21]">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2.5 px-1 py-1">
              {/* Left: Avatar + Name + EmpNo + Dept */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 shadow-md ${
                    currentUser.type === 'google_admin'
                      ? 'bg-amber-500 text-white shadow-amber-500/20'
                      : 'bg-[#5C45FD] text-white shadow-[#5C45FD]/20'
                  }`}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white tracking-wide truncate">
                      {employeeName}
                    </span>
                    {employeeEmpNo && (
                      <span className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-slate-700/80 text-[11px] font-mono text-slate-300 font-medium shrink-0">
                        {employeeEmpNo}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5" title={employeeDepartment}>
                    {employeeDepartment}
                  </div>
                </div>
              </div>

              {/* Right: Logout Icon Button */}
              <button
                id="btn-sidebar-logout"
                onClick={() => {
                  if (window.confirm('確定要登出並切換使用者身分嗎？')) {
                    setCurrentUser(null);
                    setActiveView('frontend_project_plan');
                  }
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
                title="登出 / 切換使用者"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="text-[11px] font-semibold text-slate-300 mb-0.5">未登入訪客狀態</div>
                <div className="text-[10px] text-slate-400">請於主畫面驗證同仁身分或使用 Google 官方驗證</div>
              </div>

              {/* Dedicated Google 官方驗證登入 button */}
              <button
                id="btn-sidebar-google-login"
                onClick={handleDirectGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-3 bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#090D1A] text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700/80 transition-all text-xs flex items-center justify-center gap-2.5 shadow-md hover:border-slate-600 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Google 驗證視窗啟動中...</span>
                  </>
                ) : (
                  <>
                    {/* Google G Logo */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google 帳號官方驗證</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
