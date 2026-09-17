import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { ProjectPlanDashboard } from './components/frontend/ProjectPlanDashboard';
import { ProjectGanttDashboard } from './components/frontend/ProjectGanttDashboard';
import { ManpowerDashboard } from './components/frontend/ManpowerDashboard';
import { CandidateTalentDashboard } from './components/frontend/CandidateTalentDashboard';
import { QuarterlyDemandDashboard } from './components/frontend/QuarterlyDemandDashboard';
import { SurveyFillView } from './components/frontend/SurveyFillView';
import { GlobalSettingsMain } from './components/global-settings/GlobalSettingsMain';
import { CandidateSettingsMain } from './components/backend-settings/CandidateSettingsMain';
import { ProjectPlanSettings } from './components/backend-settings/ProjectPlanSettings';
import { ManpowerPredictionSettings } from './components/backend-settings/ManpowerPredictionSettings';
import { TrainingSettingsMain } from './components/backend-settings/TrainingSettingsMain';
import { ResumeLicenseSettingsMain } from './components/backend/resume/ResumeLicenseSettingsMain';
import { TrainingPortal } from './components/frontend/TrainingPortal';
import { FrontendHomeDashboard } from './components/frontend/FrontendHomeDashboard';
import { EmployeeAuthCard } from './components/frontend/EmployeeAuthCard';
import { GoogleSignInModal } from './components/frontend/GoogleSignInModal';
import { LoginModal } from './components/frontend/LoginModal';
import { ShieldAlert, LogIn, Lock, PanelLeftOpen } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { safeStorage } from './utils/safeStorage';

const MainLayout: React.FC = () => {
  const { activeView, currentUser, setActiveView, role, permissionMatrix } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // Left Sidebar state: support collapsing in any state, and fixed window (pin) mode
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = safeStorage.getItem('farglory_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    const saved = safeStorage.getItem('farglory_sidebar_pinned');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleSidebarOpen = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      safeStorage.setItem('farglory_sidebar_open', String(next));
      return next;
    });
  };

  const toggleSidebarPinned = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      safeStorage.setItem('farglory_sidebar_pinned', String(next));
      return next;
    });
  };

  const userPerm = currentUser?.employee?.empNo
    ? permissionMatrix.find((p) => p.empNo === currentUser.employee?.empNo)
    : null;

  const isSuperAdmin = currentUser?.type === 'google_admin' || role === 'super_admin';

  // Permission guard check for backend settings
  const isAuthorizedForBackend =
    isSuperAdmin ||
    role === 'hr_admin' ||
    userPerm?.canAccessBackend === true ||
    currentUser?.employee?.department === '人力資源室';

  // Permission guard checks for frontend dashboards
  const hasProjectPlanAccess =
    isSuperAdmin || (userPerm ? userPerm.dashboardAccess?.projectPlan !== false : true);
  const hasManpowerDashboardAccess =
    isSuperAdmin || (userPerm ? (userPerm.dashboardAccess as any)?.manpowerDashboard !== false : true);
  const hasCandidatePoolAccess =
    isSuperAdmin ||
    (userPerm
      ? userPerm.dashboardAccess?.candidatePool === true
      : ['07', '08', '09'].includes(currentUser?.employee?.rank || '') ||
        currentUser?.employee?.department === '人力資源室');
  const hasSurveyFillAccess =
    isSuperAdmin || (userPerm ? userPerm.dashboardAccess?.surveyFill !== false : true);
  const hasTrainingPortalAccess =
    isSuperAdmin || (userPerm ? userPerm.dashboardAccess?.trainingPortal !== false : true);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] flex font-sans text-slate-800 selection:bg-blue-600 selection:text-white relative">
      {/* 1. Left Navigation Sidebar with collapse & fixed/floating window support */}
      <Sidebar
        isOpen={isSidebarOpen}
        isPinned={isSidebarPinned}
        onToggleOpen={toggleSidebarOpen}
        onTogglePin={toggleSidebarPinned}
        onClose={() => {
          setIsSidebarOpen(false);
          safeStorage.setItem('farglory_sidebar_open', 'false');
        }}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenGoogleLogin={() => setShowGoogleModal(true)}
      />

      {/* Floating edge trigger tab when sidebar is collapsed */}
      {!isSidebarOpen && (
        <button
          id="btn-floating-open-sidebar"
          onClick={() => {
            setIsSidebarOpen(true);
            safeStorage.setItem('farglory_sidebar_open', 'true');
          }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#0B132B]/95 hover:bg-blue-600 text-slate-300 hover:text-white px-1.5 py-3 rounded-r-xl border border-l-0 border-slate-700 shadow-2xl backdrop-blur-xs transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
          title="展開左側功能表 (點擊展開)"
        >
          <PanelLeftOpen className="w-4 h-4 text-blue-400 group-hover:text-white group-hover:scale-110 transition-transform" />
          <span className="text-[10px] [writing-mode:vertical-lr] tracking-widest font-semibold opacity-85 group-hover:opacity-100">
            功能表
          </span>
        </button>
      )}

      {/* 2. Right Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Row with dynamic tabs when authenticated */}
        <TopBar
          isSidebarOpen={isSidebarOpen}
          isSidebarPinned={isSidebarPinned}
          onToggleSidebar={toggleSidebarOpen}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenGoogleLogin={() => setShowGoogleModal(true)}
        />

        {/* Main Scrollable View Area */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 p-2.5 sm:p-4 md:p-6 lg:p-8 bg-[#F1F5F9]/60">
          {!currentUser ? (
            /* Unauthenticated Frontend View: Employee Identity Verification Card (Image 2) */
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-4 sm:py-6 px-2.5 sm:px-4">
              <EmployeeAuthCard onSuccess={() => setActiveView('frontend_project_plan')} />
            </div>
          ) : (
            <div
              id="print-content-container"
              className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0"
            >
              {(activeView === 'home' || activeView === 'frontend_home') && (
                <FrontendHomeDashboard />
              )}

              {(activeView === 'project_plans' || activeView === 'frontend_project_plan') &&
                (hasProjectPlanAccess ? (
                  <ProjectPlanDashboard />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">開案計畫儀表板 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      您目前的同仁/主管帳號尚未獲得【開案計畫儀表板】存取權限。系統管理者可於<strong>【全域總功能設定 ➜ 1-5. 部門主管權限矩陣】</strong>勾選為您開通。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'frontend_project_gantt' || activeView === 'project_gantt') &&
                (hasProjectPlanAccess ? (
                  <ProjectGanttDashboard />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">開案計畫甘特圖 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      您目前的同仁/主管帳號尚未獲得【開案計畫甘特圖】存取權限。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'manpower_dashboard' || activeView === 'frontend_manpower_dashboard') &&
                (hasManpowerDashboardAccess ? (
                  <ManpowerDashboard />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">人力供需戰情儀表板 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      您目前的同仁/主管帳號尚未獲得【人力供需戰情儀表板】存取權限。系統管理者可於<strong>【全域總功能設定 ➜ 1-5. 部門主管權限矩陣】</strong>勾選為您開通。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'candidates' || activeView === 'frontend_candidate_pool') &&
                (hasCandidatePoolAccess ? (
                  <CandidateTalentDashboard />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">案主管人才庫儀表板 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本儀表板專供受權之工程處長、專案經理與人資單位查閱人才庫人選池。系統管理者可於<strong>【全域總功能設定 ➜ 1-5. 部門主管權限矩陣】</strong>勾選為您開通。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'frontend_quarterly_demand' || activeView === 'quarterly_demand') && (
                <QuarterlyDemandDashboard />
              )}

              {(activeView === 'survey_fill' || activeView === 'frontend_survey_fill') &&
                (hasSurveyFillAccess ? (
                  <SurveyFillView />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">意願調查問卷 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      您目前的同仁/主管帳號尚未獲得【意願調查問卷】存取權限。系統管理者可於<strong>【全域總功能設定 ➜ 1-5. 部門主管權限矩陣】</strong>勾選為您開通。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'training_portal' || activeView === 'frontend_training_portal') &&
                (hasTrainingPortalAccess ? (
                  <TrainingPortal />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">專業訓練專區 存取受限</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      您目前的同仁/主管帳號尚未獲得【專業訓練學習專區】存取權限。系統管理者可於<strong>【全域總功能設定 ➜ 1-5. 部門主管權限矩陣】</strong>勾選為您開通。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveView('frontend_home')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        返回個人工作台 (首頁)
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'global_settings' || activeView === 'backend_global_settings') &&
                (isAuthorizedForBackend ? (
                  <GlobalSettingsMain />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">全域總功能設定 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本模組僅限具有 <strong>Google 管理員帳號 (如 iangaryboy@gmail.com)</strong> 或人資管理員身分之授權人員進入維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        使用 Google 管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_project_plan')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        返回開案計畫儀表板
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'candidate_settings' || activeView === 'backend_candidate_settings') &&
                (isAuthorizedForBackend ? (
                  <CandidateSettingsMain />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">案主管背景設定 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本後台提供人選庫、開案計畫排程與問卷表單設計，請切換至管理員角色以進行維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_candidate_pool')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        返回人才庫儀表板
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'project_plan_settings' || activeView === 'backend_project_plan_settings') &&
                (isAuthorizedForBackend ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <ProjectPlanSettings />
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">開案計畫設定 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本後台提供開案計畫排程與案別資料維護，請切換至管理員角色以進行維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_project_plan')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        返回開案計畫儀表板
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'manpower_forecast_settings' || activeView === 'backend_manpower_forecast_settings') &&
                (isAuthorizedForBackend ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <ManpowerPredictionSettings />
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">案場人力預測設定 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本後台提供外案配置公式、供給面留任推估與原人工目標計畫匯入維護，請切換至管理員角色以進行維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_manpower_dashboard')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        返回人力供需戰情看板
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'training_settings' || activeView === 'backend_training_settings') &&
                (isAuthorizedForBackend ? (
                  <TrainingSettingsMain />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">專業訓練設定 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本後台提供專業訓練類別、講師資料庫、課程教材管理與梯次排程維護，請切換至管理員角色以進行維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_training_portal')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        前往前台學習專區
                      </button>
                    </div>
                  </div>
                ))}

              {(activeView === 'resume_license_settings' || activeView === 'backend_resume_license_settings') &&
                (isAuthorizedForBackend ? (
                  <ResumeLicenseSettingsMain />
                ) : (
                  <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">證照資訊管理 權限管制</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      本後台提供全體同仁證照總庫、案場法定需求名額設定、智慧遴選派訓與到期自動發信預警，請切換至管理員角色以進行維護。
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setShowGoogleModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        管理員登入
                      </button>
                      <button
                        onClick={() => setActiveView('frontend_training_portal')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                      >
                        前往前台學習專區
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>

      {/* Google Sign-in Modal (Image 4) */}
      {showGoogleModal && (
        <GoogleSignInModal
          onClose={() => setShowGoogleModal(false)}
          onSuccess={() => {
            setShowGoogleModal(false);
          }}
        />
      )}

      {/* General Identity Switch / Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary
      fallbackTitle="遠雄營造 HR 儀表板 初始化異常"
      fallbackSubtitle="系統在載入全域狀態或資料庫連線時遭遇異常。已為您記錄詳細堆疊日誌，可點擊展開查看或複製診斷報告。"
    >
      <AppProvider>
        <ErrorBoundary
          fallbackTitle="儀表板畫面載入異常"
          fallbackSubtitle="畫面渲染時遭遇例外。此錯誤已被安全隔離，其他模組不受影響。可嘗試重新整理或重設快取修復。"
        >
          <MainLayout />
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  );
}
