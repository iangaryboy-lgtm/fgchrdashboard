import React, { useState } from 'react';
import {
  X,
  Lock,
  Building,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Key,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Laptop,
  Check,
} from 'lucide-react';
import {
  M365AuthSession,
  getM365AuthSession,
  loginWithM365Account,
  switchNetworkEnvironment,
  logoutM365Account,
} from '../../services/m365AuthService';

export interface M365LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (session: M365AuthSession) => void;
  defaultEmail?: string;
  defaultEmpNo?: string;
  defaultUserName?: string;
  defaultDepartment?: string;
  intentAction?: string;
}

export const M365LoginModal: React.FC<M365LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail,
  defaultEmpNo = 'FG1001',
  defaultUserName = '陳鈺安',
  defaultDepartment = '建築工程處 工務部',
  intentAction = '上傳作業檔案至 OneDrive 可編輯資料夾',
}) => {
  const currentSession = getM365AuthSession();

  const [accountEmail, setAccountEmail] = useState(
    defaultEmail || currentSession.userAccount || `${defaultEmpNo.toLowerCase()}@farglorygroup.com.tw`
  );
  const [password, setPassword] = useState('••••••••••••');
  const [authStep, setAuthStep] = useState<'form' | 'mfa' | 'success'>('form');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mfaCode, setMfaCode] = useState('58');
  const [selectedEnv, setSelectedEnv] = useState<'corporate_domain' | 'external_network'>(
    currentSession.networkEnvironment
  );

  if (!isOpen) return null;

  const handleCorporateDomainQuickAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      const session = switchNetworkEnvironment('corporate_domain', {
        name: defaultUserName,
        empNo: defaultEmpNo,
        department: defaultDepartment,
        email: accountEmail,
      });
      setIsAuthenticating(false);
      setAuthStep('success');
      setTimeout(() => {
        if (onSuccess) onSuccess(session);
        onClose();
      }, 900);
    }, 600);
  };

  const handleM365LoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail) return;

    setIsAuthenticating(true);
    // Simulate Entra ID password verification -> 2FA prompt
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthStep('mfa');
    }, 700);
  };

  const handleVerifyMFA = async () => {
    setIsAuthenticating(true);
    setTimeout(async () => {
      const session = await loginWithM365Account(
        accountEmail,
        defaultUserName,
        defaultEmpNo,
        defaultDepartment
      );
      setIsAuthenticating(false);
      setAuthStep('success');
      setTimeout(() => {
        if (onSuccess) onSuccess(session);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Microsoft Official Style Brand Banner */}
        <div className="bg-[#0078D4] text-white p-5 text-left relative">
          <div className="flex items-center justify-between">
            {/* Microsoft 4-square logo */}
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-5 h-5 bg-white p-0.5 rounded-xs">
                <span className="bg-[#F25022] w-full h-full rounded-2xs"></span>
                <span className="bg-[#7FBA00] w-full h-full rounded-2xs"></span>
                <span className="bg-[#00A4EF] w-full h-full rounded-2xs"></span>
                <span className="bg-[#FFB900] w-full h-full rounded-2xs"></span>
              </div>
              <span className="font-bold text-sm tracking-wide">Microsoft 365</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base font-black text-white mt-3">
            遠雄集團 Microsoft 365 網域身分鑑權
          </h3>
          <p className="text-sky-100 text-xs mt-0.5">
            Azure Entra ID · 企業可編輯分享資料夾存取
          </p>
        </div>

        {/* Network Domain Mode Selector */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 text-xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
            <span>當前連線網路環境：</span>
            <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-mono">
              Farglory Corp Net
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedEnv('corporate_domain');
                handleCorporateDomainQuickAuth();
              }}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                selectedEnv === 'corporate_domain' && currentSession.isDomainJoined
                  ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 text-xs">
                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold">公司電腦 / 網域</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">
                已登入 M365，自動 SSO
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEnv('external_network')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                selectedEnv === 'external_network'
                  ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 text-xs">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold">外部非公司網域</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">
                需進行 M365 帳號登入
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 space-y-4 text-xs">
          {/* Action Context Info */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>目標操作：{intentAction}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              共用資料夾已設定為<strong>「組織內具連結之成員可編輯」</strong>。驗證身分後將立即解鎖 OneDrive 寫入與上傳權限。
            </p>
          </div>

          {authStep === 'form' && (
            <form onSubmit={handleM365LoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Microsoft 365 企業帳號 (遠雄 Email)：
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="name@farglorygroup.com.tw"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-mono">
                    Entra ID
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">企業密碼：</label>
                  <span className="text-[10px] text-sky-600">使用公司 AD 單一登入密碼</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 text-slate-800 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  取消
                </button>

                <button
                  type="submit"
                  disabled={isAuthenticating || !accountEmail}
                  className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在驗證網域帳號...</span>
                    </>
                  ) : (
                    <>
                      <span>登入並取得可編輯權限</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {authStep === 'mfa' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-black text-slate-900 text-xs">
                  Microsoft Authenticator 雙重認證
                </h4>
                <p className="text-[11px] text-slate-500">
                  請開啟您手機上的 Microsoft Authenticator 應用程式，並核准以下確認碼以完成外部網路登入：
                </p>
                <div className="py-2">
                  <span className="text-3xl font-black text-[#0078D4] font-mono tracking-widest bg-sky-50 px-4 py-1.5 rounded-xl border border-sky-200 inline-block shadow-inner">
                    {mfaCode}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  向 <span className="font-semibold text-slate-700">{accountEmail}</span> 發送推播通知
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthStep('form')}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  返回變更帳號
                </button>

                <button
                  type="button"
                  onClick={handleVerifyMFA}
                  disabled={isAuthenticating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>認證授權中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已在手機上完成核准</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {authStep === 'success' && (
            <div className="py-4 text-center space-y-2.5 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">
                Microsoft 365 網域認證成功！
              </h4>
              <p className="text-xs text-slate-600">
                已確認為遠雄組織成員，<strong>OneDrive 可編輯資料夾已授權</strong>，系統將自動返回執行上傳。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
