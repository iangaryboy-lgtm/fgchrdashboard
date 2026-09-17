import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. Register global window error & unhandledrejection handlers to capture any initialization issues
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.group('🚨 [Global Window Error Captured]');
    console.error('Message:', event.message);
    console.error('Source:', `${event.filename}:${event.lineno}:${event.colno}`);
    console.error('Error Object:', event.error);
    console.groupEnd();
    
    try {
      (window as any).__LAST_WINDOW_ERROR__ = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      };
    } catch {}
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.group('🚨 [Unhandled Promise Rejection Captured]');
    console.error('Reason:', event.reason);
    console.groupEnd();

    try {
      (window as any).__LAST_UNHANDLED_REJECTION__ = {
        reason: typeof event.reason === 'object' ? event.reason?.message || String(event.reason) : String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      };
    } catch {}
  });
}

import { safeStorage } from './utils/safeStorage';

// 2. Pre-mount Cache Validation: Safely clean any corrupt or malformed localStorage keys from prior builds
function validateAndCleanCorruptLocalStorageCache() {
  try {
    const keysToCheck = safeStorage.keys().filter(
      (k) => k.startsWith('farglory_') || k.startsWith('project_plan_')
    );

    for (const key of keysToCheck) {
      try {
        const raw = safeStorage.getItem(key);
        if (!raw) continue;

        if (raw === 'undefined' || raw === 'null') {
          console.warn(`[Cache Preflight] Removing malformed literal "${raw}" for key: ${key}`);
          safeStorage.removeItem(key);
          continue;
        }

        // If value starts with JSON object/array delimiter, verify validity
        if (raw.startsWith('{') || raw.startsWith('[')) {
          try {
            JSON.parse(raw);
          } catch (jsonErr) {
            console.warn(`[Cache Preflight] Removing JSON-corrupted key: ${key}`, jsonErr);
            safeStorage.removeItem(key);
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Cache Preflight] Cache scan skipped due to access restriction:', err);
  }
}

// Execute preflight cache audit safely
try {
  validateAndCleanCorruptLocalStorageCache();
} catch (err) {
  console.warn('[Cache Preflight] validateAndCleanCorruptLocalStorageCache non-fatal catch:', err);
}

// 3. Mount React Application with singleton root protection
try {
  const container = document.getElementById('root');
  if (container) {
    // Prevent duplicate root creation in Vite HMR dev server
    let root = (window as any).__farglory_react_root__;
    if (!root) {
      root = createRoot(container);
      (window as any).__farglory_react_root__ = root;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    console.info('🚀 [Farglory HR App] React 19 root successfully mounted at:', new Date().toISOString());
  } else {
    throw new Error('Root container element #root was not found in document DOM.');
  }
} catch (err: any) {
  console.group('🚨 [Fatal Application Mount Failure]');
  console.error('Error:', err);
  console.error('Stack:', err?.stack);
  console.groupEnd();

  const container = document.getElementById('root');
  if (container) {
    const safeErrorMsg = err?.message || '發生未預期的初始化錯誤';
    const safeStack = err?.stack || '(No stack trace available)';
    
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 20px; text-align: center;">
        <div style="max-width: 520px; width: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
          <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">遠雄營造 HR 儀表板 初始化異常</h2>
          <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 16px 0;">
            系統在啟動過程中遭遇例外錯誤，通常是由於快取版本不相容或腳本載入逾時引起。
          </p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 12px; margin-bottom: 16px; text-align: left; font-family: ui-monospace, monospace; font-size: 12px; color: #b91c1c; word-break: break-all;">
            <strong>錯誤原因：</strong> ${safeErrorMsg}
          </div>

          <details style="text-align: left; font-size: 11px; font-family: ui-monospace, monospace; background: #0f172a; color: #cbd5e1; border-radius: 8px; padding: 10px;">
            <summary style="cursor: pointer; font-weight: 600; color: #94a3b8; outline: none;">點擊展開詳細除錯堆疊 (Stack Trace)</summary>
            <pre style="margin-top: 8px; white-space: pre-wrap; word-break: break-all; max-height: 160px; overflow-y: auto;">${safeStack}</pre>
          </details>
        </div>
      </div>
    `;
  }
}

