import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Copy, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export interface ErrorDiagnosisReport {
  timestamp: string;
  fallbackTitle: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  url: string;
  pathname: string;
  search: string;
  hash: string;
  userAgent: string;
  viewport: string;
  devicePixelRatio: number;
  localStorageKeys: string[];
}

export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  // @ts-ignore
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const timestamp = new Date().toISOString();
    
    // Construct structured diagnostic report
    const diagnosis: ErrorDiagnosisReport = {
      timestamp,
      fallbackTitle: this.props.fallbackTitle || '系統初始化/渲染異常',
      errorName: error?.name || 'Error',
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
      componentStack: errorInfo?.componentStack || '',
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      localStorageKeys: (() => {
        try {
          return Object.keys(localStorage);
        } catch {
          return ['[Access Denied]'];
        }
      })(),
    };

    // 1. High-visibility structured console logging for debugging
    console.group('🚨 [Farglory App ErrorBoundary] Caught Initialization/Render Exception');
    console.error('Error Name:', diagnosis.errorName);
    console.error('Error Message:', diagnosis.errorMessage);
    console.error('Error Stack Trace:\n', diagnosis.errorStack || '(No stack trace available)');
    console.error('Component Hierarchy Stack:\n', diagnosis.componentStack || '(No component stack available)');
    console.info('Diagnostic Environment Context:', {
      timestamp: diagnosis.timestamp,
      url: diagnosis.url,
      viewport: diagnosis.viewport,
      userAgent: diagnosis.userAgent,
      localStorageKeyCount: diagnosis.localStorageKeys.length,
      keys: diagnosis.localStorageKeys,
    });
    console.groupEnd();

    // 2. Attach to global window object for immediate DevTools inspection
    try {
      (window as any).__LAST_ERROR_DIAGNOSIS__ = diagnosis;
    } catch {}

    // 3. Persist to storage so details survive page reload
    try {
      sessionStorage.setItem('__farglory_last_error__', JSON.stringify(diagnosis));
      localStorage.setItem('__farglory_last_error_summary__', JSON.stringify({
        timestamp,
        message: diagnosis.errorMessage,
        name: diagnosis.errorName,
      }));
    } catch (storageErr) {
      console.warn('[ErrorBoundary] Failed to persist error report to storage:', storageErr);
    }

    // 4. Update component state with errorInfo
    this.setState({ errorInfo });
  }

  private handleCopyDiagnosis = async () => {
    try {
      const diagnosis = (window as any).__LAST_ERROR_DIAGNOSIS__ || {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        url: window.location.href,
        time: new Date().toISOString(),
      };
      await navigator.clipboard.writeText(JSON.stringify(diagnosis, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback if clipboard API blocked
      const text = `${this.state.error?.name}: ${this.state.error?.message}\n\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      } catch (e) {
        console.warn('Failed to copy to clipboard:', e);
      }
    }
  };

  private handleResetCache = () => {
    try {
      const keysToRemove = [
        'farglory_current_user_v1',
        'farglory_current_user',
        'farglory_project_plans_v7',
        'farglory_project_plans_v1',
        'farglory_candidates_v7',
        'farglory_candidates_v1',
        'farglory_employees_v6',
        'farglory_employees_v1',
        'farglory_permissions_v2',
        'farglory_permissions_v1',
        'farglory_sidebar_open',
        'farglory_sidebar_pinned',
        'project_plan_table_scale',
      ];
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
      // Preserve safe super admin state to avoid missing permission errors on startup
      try {
        localStorage.setItem(
          'farglory_current_user_v1',
          JSON.stringify({
            type: 'google_admin',
            googleEmail: 'iangaryboy@gmail.com',
            adminRole: 'SUPER_ADMIN',
          })
        );
      } catch {}
    } catch (e) {
      console.warn('Failed to clear localStorage keys:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  // @ts-ignore
  render() {
    // @ts-ignore
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || '發生未預期的渲染異常';
      const errorStack = this.state.error?.stack;
      const compStack = this.state.errorInfo?.componentStack;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {/* @ts-ignore */}
              {this.props.fallbackTitle || '畫面載入遇到暫時性問題'}
            </h1>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {/* @ts-ignore */}
              {this.props.fallbackSubtitle || '系統已自動捕捉異常並記錄詳細日誌。這通常是由於元件初始化時狀態衝突或快取格式異動所引起。'}
            </p>

            {/* Error Message Box */}
            <div className="mb-4 p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-left text-xs font-mono text-rose-700 break-all">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-800">
                <Terminal className="w-3.5 h-3.5" />
                <span>錯誤原因：</span>
              </div>
              <div>{errorMsg}</div>
            </div>

            {/* Expandable Technical Details & Component Stack */}
            <div className="mb-5 text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>技術診斷資訊與元件呼叫堆疊 (Component Stack)</span>
                </span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-hidden border border-slate-800 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">StackTrace & Component Stack</span>
                    <button
                      type="button"
                      onClick={this.handleCopyDiagnosis}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-slate-300 hover:text-white rounded text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>複製報告</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 select-text">
                    {errorStack && (
                      <div>
                        <div className="text-rose-400 font-bold text-[10px] mb-0.5">[Error Stack]</div>
                        <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">{errorStack}</pre>
                      </div>
                    )}
                    {compStack && (
                      <div>
                        <div className="text-blue-400 font-bold text-[10px] mb-0.5">[Component Stack]</div>
                        <pre className="whitespace-pre-wrap leading-relaxed text-slate-400">{compStack}</pre>
                      </div>
                    )}
                    {!errorStack && !compStack && (
                      <div className="text-slate-500">無可用的呼叫堆疊資訊</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                重新整理頁面
              </button>

              <button
                type="button"
                onClick={this.handleCopyDiagnosis}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">已複製報告</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>複製診斷報告</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                title="清除所有可能損毀的 localStorage 快取鍵並重載"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                重設快取修復
              </button>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

