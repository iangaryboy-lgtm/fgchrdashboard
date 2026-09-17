import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Minus, Square, UserPlus, ShieldCheck, Check, Globe, Sparkles } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface GoogleSignInModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ onClose, onSuccess }) => {
  const { setCurrentUser, googleAdmins } = useApp();
  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<string | null>(null);

  // Real Google Firebase Auth Popup
  const handleFirebaseGooglePopup = async () => {
    setIsSigningIn('google_popup');
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) {
        throw new Error('未能取得 Google 帳號資訊');
      }
      const admin = googleAdmins.find((a) => a.email.toLowerCase() === user.email?.toLowerCase());
      if (!admin) {
        await auth.signOut();
        setErrorMsg(
          `Google 驗證成功，但帳號【${user.email}】不在管理員白名單中。請聯繫系統超級管理員於全域設定加入授權。`
        );
        setIsSigningIn(null);
        return;
      }

      setCurrentUser({
        type: 'google_admin',
        googleEmail: admin.email,
        adminRole: admin.role,
      });
      setIsSigningIn(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed or cancelled popup window intentionally
        setErrorMsg(null);
      } else if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/operation-not-allowed') {
        setErrorMsg('此環境無法直接彈出 Google OAuth，請由下方清單直接選擇授權管理員登入。');
      } else {
        console.warn('Google Sign-In Popup Notice:', err?.message || err);
        setErrorMsg(err.message || 'Google 驗證失敗，請重試或由下方選擇白名單帳號');
      }
      setIsSigningIn(null);
    }
  };

  const handleSelectAccount = (email: string, name: string) => {
    setIsSigningIn(email);
    setErrorMsg(null);

    const admin = googleAdmins.find((a) => a.email.toLowerCase() === email.toLowerCase());

    setTimeout(() => {
      if (!admin) {
        setIsSigningIn(null);
        setErrorMsg(`Google 安全驗證拒絕：帳號【${email}】未具有管理員授權，無法進入後台管理。請聯繫超級管理員新增白名單。`);
        return;
      }

      setCurrentUser({
        type: 'google_admin',
        googleEmail: admin.email,
        adminRole: admin.role,
      });
      setIsSigningIn(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 500);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = customEmail.trim().toLowerCase();
    if (!clean) {
      setErrorMsg('請輸入有效的 Google 電子郵件帳號');
      return;
    }
    const admin = googleAdmins.find((a) => a.email.toLowerCase() === clean);
    if (!admin) {
      setErrorMsg(`Google 安全驗證拒絕：查無 Google 帳號【${clean}】之管理員權限。請確認帳號或由超級管理員於全域設定新增。`);
      return;
    }

    setIsSigningIn(clean);
    setTimeout(() => {
      setCurrentUser({
        type: 'google_admin',
        googleEmail: admin.email,
        adminRole: admin.role,
      });
      setIsSigningIn(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Window Mockup matching Chrome Google Sign-In Window */}
      <div className="w-full max-w-[490px] bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col font-sans select-none text-slate-800">
        {/* Chrome Window Title Bar */}
        <div className="bg-[#EAEAEA] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2 truncate">
            {/* Google G icon */}
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
            <span className="font-normal text-slate-700 text-[11px] truncate">
              登入 - Google 帳戶 - Google Chrome
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <button
              onClick={onClose}
              className="hover:bg-slate-300 p-0.5 rounded transition-colors"
              title="最小化"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-slate-300 p-0.5 rounded transition-colors"
              title="最大化"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-rose-500 hover:text-white p-0.5 rounded transition-colors"
              title="關閉"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chrome Address Bar Simulation */}
        <div className="bg-[#F1F3F4] border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px]">🔒</span>
          </div>
          <div className="flex-1 bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] text-slate-600 font-mono truncate">
            accounts.google.com/v3/signin/accountchooser?client_id=791707572295-gen-lang-client-0051402027.firebaseapp.com
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 flex-1 bg-white">
          {/* Google Header */}
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-sm font-medium text-slate-700">使用 Google 帳戶登入</span>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mb-1">
            選擇管理員帳戶
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            以遠雄營造管理員身份繼續前往人資戰情室後台
          </p>

          {/* Real Google Auth Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleFirebaseGooglePopup}
              disabled={isSigningIn !== null}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{isSigningIn === 'google_popup' ? 'Google 驗證中...' : '使用 Google 官方視窗驗證登入'}</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">或從白名單快速切換</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Accounts List */}
          {!showOtherAccount ? (
            <div className="border-t border-slate-200 divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {googleAdmins.map((admin) => {
                const isSuper = admin.role === 'SUPER_ADMIN';
                const initial = admin.name?.slice(0, 2) || admin.email.charAt(0).toUpperCase();
                return (
                  <button
                    key={admin.email}
                    type="button"
                    onClick={() => handleSelectAccount(admin.email, admin.name)}
                    disabled={isSigningIn !== null}
                    className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar circle */}
                      <div
                        className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border text-white ${
                          isSuper ? 'bg-amber-600 border-amber-400' : 'bg-blue-600 border-blue-400'
                        }`}
                      >
                        {admin.email === 'iangaryboy@gmail.com' ? (
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                            alt="Yuan Chen"
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{admin.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 font-bold border rounded ${
                              isSuper
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {admin.role === 'SUPER_ADMIN'
                              ? '超級管理員'
                              : admin.role === 'HR_ADMIN'
                              ? '人資管理員'
                              : '檢視管理員'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {admin.email}
                        </div>
                      </div>
                    </div>

                    {isSigningIn === admin.email ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        登入 →
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Option: 輸入其他 Google 帳戶 */}
              <button
                type="button"
                onClick={() => setShowOtherAccount(true)}
                className="w-full py-2.5 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  輸入其他 Google 帳戶進行驗證
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  輸入 Google 管理員電子郵件地址
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtherAccount(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                >
                  ← 返回選擇帳戶
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  下一步 / 驗證登入
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-200 px-6 py-2.5 bg-[#FAFAFA] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 hover:text-slate-800 cursor-pointer">
            <span>繁體中文</span>
            <span>▼</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 cursor-pointer">說明</span>
            <span className="hover:text-slate-800 cursor-pointer">隱私權設定</span>
            <span className="hover:text-slate-800 cursor-pointer">條款</span>
          </div>
        </div>
      </div>
    </div>
  );
};
