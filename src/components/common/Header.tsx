import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  UserCheck,
  Layers,
  RotateCcw,
  ClipboardList,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { LoginModal } from '../frontend/LoginModal';

interface HeaderProps {
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const {
    activeView,
    setActiveView,
    currentUser,
    setCurrentUser,
    resetToDefaultData,
    onlineUsersCount,
    employees,
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleOpenLogin = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSwitchToDemoUser = (empNo: string) => {
    const emp = employees.find((e) => e.empNo === empNo);
    if (emp) {
      setCurrentUser({
        type: 'employee',
        empNo: emp.empNo,
        employee: emp,
      });
    }
    setShowUserDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#1E293B] text-white border-b border-slate-700 shadow-md">
        {/* Top bar with Enterprise Brand & System Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo & System Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm tracking-wider shadow-sm">
                遠
              </div>
              <div className="flex items-center gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-tight">
                      遠雄營造
                    </span>
                    <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase hidden sm:inline">
                      HR INSIGHT
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-medium border border-blue-700/50">
                      Enterprise
                    </span>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-slate-300">{onlineUsersCount} 人在線同步</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right User & Utility Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Reset Button */}
              <button
                onClick={() => {
                  if (window.confirm('確定要將系統資料重設為官方公版 Demo 初始狀態嗎？')) {
                    resetToDefaultData();
                  }
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 rounded-lg transition-colors"
                title="重設為遠雄營造公版 Demo 數據"
              >
                <RotateCcw className="w-3 h-3 text-blue-400" />
                重設 Demo
              </button>

              {/* Current User Pill / Switcher */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/90 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.type === 'google_admin' ? 'G' : currentUser.employee?.name.slice(0, 1) || '同'}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-semibold text-white flex items-center gap-1">
                        {currentUser.type === 'google_admin' ? currentUser.googleEmail : currentUser.employee?.name}
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 leading-none">
                        {currentUser.type === 'google_admin'
                          ? `管理員 (${currentUser.adminRole})`
                          : `${currentUser.employee?.department} · ${currentUser.employee?.title}`}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown for switching roles */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#1E293B] rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-white">
                      <div className="px-3 py-2 border-b border-slate-700">
                        <p className="text-[11px] font-medium text-slate-400">目前登入身分</p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {currentUser.type === 'google_admin'
                            ? currentUser.googleEmail
                            : `${currentUser.employee?.name} (${currentUser.employee?.empNo})`}
                        </p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded font-medium border border-blue-700/50">
                          {currentUser.type === 'google_admin' ? '具有全系統最高後台權限' : '前台同仁白名單權限'}
                        </span>
                      </div>

                      <div className="p-1">
                        <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          快速切換身分示範
                        </p>
                        <button
                          onClick={() => {
                            setCurrentUser({
                              type: 'google_admin',
                              googleEmail: 'iangaryboy@gmail.com',
                              adminRole: 'SUPER_ADMIN',
                            });
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700/70 rounded-lg flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-semibold text-white">Gary (超級管理員)</span>
                            <span className="block text-[10px] text-slate-400">iangaryboy@gmail.com</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleSwitchToDemoUser('FG1016')}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700/70 rounded-lg flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="font-semibold text-white">蕭凱文 (人資主任)</span>
                            <span className="block text-[10px] text-slate-400">人力資源室 / 案主管遴選負責人</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleSwitchToDemoUser('FG1001')}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700/70 rounded-lg flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="font-semibold text-white">陳冠霖 (副理/案主管候選)</span>
                            <span className="block text-[10px] text-slate-400">工程一部 · HM2案</span>
                          </div>
                        </button>
                      </div>

                      <div className="border-t border-slate-700 p-1">
                        <button
                          onClick={() => {
                            handleOpenLogin();
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-950/40 rounded-lg font-medium flex items-center gap-2"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          驗證同仁資料登入 / 切換帳號
                        </button>
                        <button
                          onClick={() => {
                            setCurrentUser(null);
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg font-medium flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          登出目前帳號
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  身分驗證登入
                </button>
              )}
            </div>
          </div>
        </div>

        {/* High Density Sub Navigation Bar */}
        <div className="bg-[#0F172A] border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium">
              {/* Frontend Dashboards Section */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider hidden md:inline">
                  前台儀表
                </span>
                <button
                  onClick={() => setActiveView('frontend_project_plan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'frontend_project_plan' || activeView === 'project_plans'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  開案計畫儀表板
                </button>

                <button
                  onClick={() => setActiveView('frontend_candidate_pool')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'frontend_candidate_pool' || activeView === 'candidates'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  案主管人才庫儀表板
                </button>

                <button
                  onClick={() => setActiveView('frontend_quarterly_demand')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'frontend_quarterly_demand' || activeView === 'quarterly_demand'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  案主管供需儀表板
                </button>

                <button
                  onClick={() => setActiveView('frontend_survey_fill')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'frontend_survey_fill' || activeView === 'survey_fill'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  MS Forms 意願問卷
                </button>
              </div>

              <div className="h-4 w-px bg-slate-700 mx-1 sm:mx-2 shrink-0"></div>

              {/* Backend Settings Section */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider hidden md:inline">
                  後台管理
                </span>
                <button
                  onClick={() => setActiveView('backend_global_settings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'backend_global_settings' || activeView === 'global_settings'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  全域總功能設定
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-normal px-1.5 py-0.2 rounded border border-slate-700">
                    名單/組織/權限/信件
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('backend_candidate_settings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeView === 'backend_candidate_settings' || activeView === 'candidate_settings'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  案主管遴選儀表板後台設定
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-normal px-1.5 py-0.2 rounded border border-slate-700">
                    人才庫/開案計畫/問卷設定
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </>
  );
};

