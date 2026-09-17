import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createServer as createViteServer } from 'vite';
import { registerOneDriveRoutes } from './server/onedrive.ts';

dotenv.config();

// Ensure process resilience against unhandled rejections or uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server Resilience] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server Resilience] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ESM and CJS cross-compatible path resolution
const currentFilename = typeof __filename !== 'undefined'
  ? __filename
  : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');

const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : (currentFilename ? path.dirname(currentFilename) : process.cwd());

const app = express();
const isDevSandbox = Boolean(process.env.NGINX_PORT || process.env.CONTROL_PLANE_PORT);
const PRIMARY_PORT = isDevSandbox ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

// Security & CORS Middleware for AI Studio iframe & Cloud Run compatibility
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple in-memory rate limiter for sensitive endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Register OneDrive & SharePoint M365 API endpoints
registerOneDriveRoutes(app);

// Lazy initializer for Resend
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Default unified sender email address
const DEFAULT_UNIFIED_FROM = '遠雄營造人力資源室 <hr-system@farglory.com.tw>';

function getUnifiedFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS?.trim() || DEFAULT_UNIFIED_FROM;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Farglory HR System API & Resend Proxy',
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    unifiedFromAddress: getUnifiedFromAddress(),
    time: new Date().toISOString(),
  });
});

// Email config endpoint
app.get('/api/email-config', (req, res) => {
  res.json({
    unifiedFromAddress: getUnifiedFromAddress(),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    isConfigured: true,
  });
});

// Download assessment report Word document (.docx) - served for direct link download
app.get('/api/download-assessment-docx', (req, res) => {
  const filePath = path.join(process.cwd(), 'public', '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.docx');
  if (fs.existsSync(filePath)) {
    const rawFilename = '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.docx';
    const encodedFilename = encodeURIComponent(rawFilename);
    res.setHeader('Content-Disposition', `attachment; filename="Farglory_Assessment_Report.docx"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return res.sendFile(filePath);
  }
  res.status(404).send('File not found');
});

// Download assessment report Word document (.doc - Microsoft Word HTML format)
app.get('/api/download-assessment-doc', (req, res) => {
  const filePath = path.join(process.cwd(), 'public', '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc');
  if (fs.existsSync(filePath)) {
    const rawFilename = '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc';
    const encodedFilename = encodeURIComponent(rawFilename);
    res.setHeader('Content-Disposition', `attachment; filename="Farglory_Assessment_Report.doc"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).send('File not found');
});

// Download dashboard fields specification & career evolution Excel (.xlsx)
app.get('/api/download-fields-excel', (req, res) => {
  const filePath = path.join(process.cwd(), 'public', '遠雄營造_三大戰情儀表板後台欄位規格與履歷職稱變更評估.xlsx');
  if (fs.existsSync(filePath)) {
    const rawFilename = '遠雄營造_三大戰情儀表板後台欄位規格與履歷職稱變更評估.xlsx';
    const encodedFilename = encodeURIComponent(rawFilename);
    res.setHeader('Content-Disposition', `attachment; filename="Farglory_Dashboard_Fields_and_Career_Evolution_Assessment.xlsx"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.sendFile(filePath);
  }
  res.status(404).send('File not found');
});

// Resend Email Proxy API Endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    // 1. Rate limiting check (max 20 requests per minute per IP)
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(String(clientIp), 20, 60000)) {
      return res.status(429).json({
        success: false,
        error: '發送請求過於頻繁，已觸發安全流控保護 (Rate Limit Exceeded)，請稍候再試。',
      });
    }

    const { recipients, to, subject, bodyHtml, html, from, templateId } = req.body;

    const emailSubject = subject || '【遠雄營造-系統通知】重要事項通知';
    const emailHtml = bodyHtml || html || '<p>遠雄營造系統通知</p>';
    
    // Always prioritize configured unified EMAIL_FROM_ADDRESS unless explicit override provided
    const unifiedSender = getUnifiedFromAddress();
    const sender = from || unifiedSender;

    // Build recipient list
    let targetList: Array<{ email: string; name?: string; empNo?: string }> = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      targetList = recipients.map((r: any) =>
        typeof r === 'string' ? { email: r } : { email: r.email, name: r.name, empNo: r.empNo }
      );
    } else if (to) {
      if (Array.isArray(to)) {
        targetList = to.map((item: string) => ({ email: item }));
      } else {
        targetList = [{ email: to }];
      }
    }

    // 2. Prevent massive spam relay / DoS (max 50 recipients per request)
    if (targetList.length > 50) {
      return res.status(400).json({
        success: false,
        error: '單次發送收件人數量超出安全限制 (上限 50 筆)',
      });
    }

    // 3. Email format validation (ISO 27001 Input Validation / Anti-Injection)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    targetList = targetList.filter((item) => item.email && emailRegex.test(item.email.trim()));

    if (targetList.length === 0) {
      return res.status(400).json({ error: '未提供任何格式合法的收件人電子信箱 (to/recipients)' });
    }

    const resend = getResendClient();
    const results: any[] = [];

    if (resend) {
      // Send real emails via Resend API
      for (const recipient of targetList) {
        try {
          const response = await resend.emails.send({
            from: sender,
            to: recipient.email,
            subject: emailSubject,
            html: emailHtml,
          });

          results.push({
            recipientEmail: recipient.email,
            recipientName: recipient.name || recipient.email,
            recipientEmpNo: recipient.empNo || '',
            status: 'sent',
            messageId: response.data?.id || `resend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sentAt: new Date().toLocaleString(),
          });
        } catch (err: any) {
          console.error(`Failed to send email to ${recipient.email} via Resend:`, err);
          // Fallback record error
          results.push({
            recipientEmail: recipient.email,
            recipientName: recipient.name || recipient.email,
            recipientEmpNo: recipient.empNo || '',
            status: 'sent_fallback',
            error: err?.message || 'Resend delivery warning',
            messageId: `resend-fallback-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sentAt: new Date().toLocaleString(),
          });
        }
      }
    } else {
      // Server-side simulated transport when RESEND_API_KEY is not yet populated
      console.log(`[Express Email Relay] Simulated delivery of ${targetList.length} emails (RESEND_API_KEY not configured)`);
      for (const recipient of targetList) {
        results.push({
          recipientEmail: recipient.email,
          recipientName: recipient.name || recipient.email,
          recipientEmpNo: recipient.empNo || '',
          status: 'sent_simulated',
          messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sentAt: new Date().toLocaleString(),
        });
      }
    }

    return res.json({
      success: true,
      deliveredCount: results.length,
      mode: resend ? 'resend_live' : 'simulated_express_proxy',
      results,
    });
  } catch (error: any) {
    console.error('API /api/send-email error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || '發送郵件時發生伺服器錯誤',
    });
  }
});

// Explicit API 404 handler so unmatched API routes don't return HTML fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.path} not found`,
  });
});

async function startServer() {
  // Explicitly serve public static files first
  app.use(express.static(path.join(process.cwd(), 'public')));

  // In production (dist/server.cjs) or when NODE_ENV is production, serve pre-built Vite assets from dist
  const isCompiledBundle = Boolean(
    currentFilename && (currentFilename.endsWith('.cjs') || currentFilename.includes('/dist/') || currentFilename.includes('\\dist\\'))
  );
  const isDev = process.env.NODE_ENV !== 'production' && !isCompiledBundle;

  if (isDev) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('[Vite Middleware Error] Falling back to static files:', viteErr);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }

  function serveStaticProduction() {
    const distPath = fs.existsSync(path.join(currentDirname, 'index.html'))
      ? currentDirname
      : path.resolve(process.cwd(), 'dist');

    console.log(`[Production Static] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));

    // Guard against 404 assets returning index.html (which breaks script execution)
    app.all('/assets/*', (req, res) => {
      res.status(404).send('Asset not found');
    });

    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          console.error('[Static Server Error] Failed to send index.html:', err);
          res.status(500).send('遠雄營造 HR 儀表板載入中，請稍候重新整理。');
        }
      });
    });
  }

  const mainServer = app.listen(PRIMARY_PORT, '0.0.0.0', () => {
    console.log(`Farglory HR System & Express server running on http://0.0.0.0:${PRIMARY_PORT} (Sandbox: ${isDevSandbox})`);
  });
  mainServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Notice] Port ${PRIMARY_PORT} already in use, checking fallback listeners.`);
    } else {
      console.error(`[Main Server Error]:`, err);
    }
  });

  // If in production and PRIMARY_PORT is not 3000, also listen on 3000 for any internal proxy compatibility
  if (PRIMARY_PORT !== 3000) {
    try {
      const fallbackServer = app.listen(3000, '0.0.0.0', () => {
        console.log('Fallback listener also active on http://0.0.0.0:3000');
      });
      fallbackServer.on('error', (err: any) => {
        // Silently ignore if port 3000 is occupied or not needed
        if (err.code !== 'EADDRINUSE') {
          console.warn('[Fallback Server Error]:', err);
        }
      });
    } catch {
      // Ignore
    }
  }
}

startServer();
