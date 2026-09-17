import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bell,
  Mail,
  Save,
  CheckCircle2,
  Send,
  AlertTriangle,
  Users,
  ShieldAlert,
  Clock,
  Sparkles,
  Eye,
  Edit3,
  Code,
  Layers,
  Monitor,
  Smartphone,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Minus,
  Palette,
  Highlighter,
  Sliders,
  Type,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Check,
  MousePointerClick,
  ExternalLink,
  Award,
  Calendar,
  Building,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// Predefined variables for License Notifications
const LICENSE_VARIABLES = [
  { key: '{同仁姓名}', label: '同仁姓名', desc: '例如：陳鈺安' },
  { key: '{同仁工號}', label: '同仁工號', desc: '例如：B7164' },
  { key: '{所屬部室}', label: '所屬部室', desc: '例如：工程一部' },
  { key: '{職稱}', label: '職稱', desc: '例如：專案經理' },
  { key: '{證照名稱}', label: '證照名稱', desc: '例如：公共工程品質管理人員證書 (土建組)' },
  { key: '{證照類別}', label: '證照類別', desc: '例如：品質管理' },
  { key: '{證照字號}', label: '證照字號', desc: '例如：QC-111-098273' },
  { key: '{發證機關}', label: '發證機關', desc: '例如：行政院公共工程委員會' },
  { key: '{取得日期}', label: '取得日期', desc: '例如：2021-04-15' },
  { key: '{有效到期日}', label: '有效到期日', desc: '例如：2026-06-30' },
  { key: '{剩餘天數}', label: '到期剩餘天數', desc: '例如：30' },
  { key: '{法定回訓規定}', label: '法定回訓規定', desc: '例如：每4年需取得回訓證明總計36小時以上' },
  { key: '{案場名稱}', label: '目前派駐案場', desc: '例如：DH7案-新莊副都心案' },
  { key: '{人資聯絡人}', label: '人資證照管理員', desc: '例如：遠雄營造人力資源室 (分機 #3108)' },
  { key: '{系統連結}', label: '前台證照登錄網址', desc: '例如：https://farglory-build.internal/license' },
];

const PALETTE_COLORS = [
  '#0F172A', // Slate 900
  '#2563EB', // Blue 600
  '#0D9488', // Teal 600
  '#16A34A', // Green 600
  '#D97706', // Amber 600
  '#DC2626', // Red 600
  '#7C3AED', // Purple 600
  '#475569', // Slate 600
];

const HIGHLIGHT_COLORS = [
  'transparent',
  '#FEF08A', // Yellow 200
  '#BAE6FD', // Sky 200
  '#BBF7D0', // Green 200
  '#FED7AA', // Orange 200
  '#FBCFE8', // Pink 200
];

const DEFAULT_BODY_HTML = `
<div style="font-family: 'Helvetica Neue', Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f1f5f9; padding: 28px 12px; margin: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 6px; text-transform: uppercase;">
          遠雄營造 專業證照雲端管理中心
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
          ⚠️ 專業技術證照【效期 / 回訓】到期預警通知
        </h1>
        <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.85;">
          系統檢核持證有效期限，請持證同仁及主管儘速確認並安排換證回訓
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px; color: #334155; font-size: 14px; line-height: 1.7;">
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
          親愛的 <span style="color: #2563eb;">{同仁姓名}</span> 同仁 ({職稱} / {所屬部室}) 您好：
        </p>

        <p style="margin-bottom: 20px;">
          依據工程法規與公司專業證照雲端管理規範，系統檢核您所持有之專業證照將於 <b style="color: #dc2626; font-size: 16px;">{剩餘天數} 天後到期</b>。為確保案場法定配置合法合規及個人專業資格有效性，特發送本預警通知。
        </p>

        <!-- License Info Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; width: 110px; font-weight: bold;">證照名稱：</td>
            <td style="padding: 6px 12px; font-size: 14px; color: #0f172a; font-weight: bold;">{證照名稱}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">證照字號：</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #334155; font-family: monospace;">{證照字號}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">頒發機構：</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #334155;">{發證機關}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">有效到期日：</td>
            <td style="padding: 6px 12px; font-size: 14px; color: #dc2626; font-weight: bold;">{有效到期日} (剩餘約 {剩餘天數} 天)</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">法規回訓說明：</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #d97706; font-weight: 600;">{法定回訓規定}</td>
          </tr>
        </table>

        <!-- Notice Points -->
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: bold; color: #92400e; font-size: 13px; margin-bottom: 8px;">
            📌 換證與回訓辦理指引：
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
            <li>如您已完成回訓或取得新換發證書，請儘速登入系統前台完成【新增證照】影本上傳登錄。</li>
            <li>如需公司公假派訓與學費補助，請逕向部室主管提出培訓申請或與人力資源室證照窗口聯繫。</li>
            <li>逾期未完成換證可能影響工地品管、安衛等法定職務掛牌資格，請務必掌握時效。</li>
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="{系統連結}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 14px; padding: 12px 32px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
            登入系統查閱與登錄新證照 →
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 28px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
        <div style="font-weight: bold; color: #334155; margin-bottom: 4px;">
          遠雄營造股份有限公司 人力資源室 (證照與教育訓練管理組)
        </div>
        <div>
          服務專線：(02) 2723-9999 分機 #3108 | 專屬信箱：hr-license@farglory.com.tw
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
          ※ 本郵件由遠雄營造數位培育與證照雲端系統自動發送，請勿直接回覆。
        </div>
      </td>
    </tr>
  </table>
</div>
`;

export const LicenseNotificationTab: React.FC = () => {
  const {
    licenseNotificationConfig,
    updateLicenseNotificationConfig,
    employeeLicenses,
    masterLicenses,
    sendEmail,
    employees,
  } = useApp();

  // Rules & Configuration State
  const [enabled, setEnabled] = useState(licenseNotificationConfig?.enabled ?? true);
  const [advanceDaysInput, setAdvanceDaysInput] = useState(
    licenseNotificationConfig?.advanceDays?.join(', ') || '90, 60, 30, 7'
  );
  const [notifyEmployee, setNotifyEmployee] = useState(
    licenseNotificationConfig?.notifyEmployee ?? true
  );
  const [notifyManager, setNotifyManager] = useState(
    licenseNotificationConfig?.notifyManager ?? true
  );
  const [notifyHrAdmin, setNotifyHrAdmin] = useState(
    licenseNotificationConfig?.notifyHrAdmin ?? true
  );
  const [hrAdminEmails, setHrAdminEmails] = useState(
    licenseNotificationConfig?.hrAdminEmails?.join(', ') || 'hr-license@farglory-build.com.tw'
  );

  // Email Content State
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState(
    licenseNotificationConfig?.emailSubjectTemplate ||
      '【證照到期預警】同仁 {同仁姓名} 持有之「{證照名稱}」將於 {剩餘天數} 天後到期'
  );
  const [bodyHtml, setBodyHtml] = useState(
    licenseNotificationConfig?.emailBodyTemplate || DEFAULT_BODY_HTML
  );

  // Editor Sub-modes & Layout
  const [activeMainSection, setActiveMainSection] = useState<'editor' | 'rules' | 'test'>('editor');
  const [editorMode, setEditorMode] = useState<'visual' | 'builder' | 'html'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewRenderMode, setPreviewRenderMode] = useState<'rendered' | 'code'>('rendered');
  const [previewLicenseId, setPreviewLicenseId] = useState<string>(employeeLicenses[0]?.id || '');

  // WYSIWYG ref
  const editableRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState('#0F172A');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  // Structured Builder Mode form fields
  const [builderBrandTitle, setBuilderBrandTitle] = useState('遠雄營造 專業證照雲端管理中心');
  const [builderBrandSubtitle, setBuilderBrandSubtitle] = useState('⚠️ 專業技術證照【效期 / 回訓】到期預警通知');
  const [builderThemeColor, setBuilderThemeColor] = useState<'blue' | 'navy' | 'amber' | 'crimson' | 'emerald'>('blue');
  const [builderGreeting, setBuilderGreeting] = useState('親愛的 {同仁姓名} 同仁 ({職稱} / {所屬部室}) 您好：');
  const [builderIntro, setBuilderIntro] = useState('依據工程法規與公司專業證照雲端管理規範，系統檢核您所持有之專業證照即將屆期，請儘速確認並安排換證回訓。');
  const [builderBoxTitle, setBuilderBoxTitle] = useState('📌 換證與回訓辦理指引：');
  const [builderBoxItems, setBuilderBoxItems] = useState<string[]>([
    '如您已完成回訓或取得新換發證書，請儘速登入系統前台完成【新增證照】影本上傳登錄。',
    '如需公司公假派訓與學費補助，請逕向部室主管提出培訓申請或與人力資源室證照窗口聯繫。',
    '逾期未完成換證可能影響工地品管、安衛等法定職務掛牌資格，請務必掌握時效。',
  ]);
  const [builderBtnText, setBuilderBtnText] = useState('登入系統查閱與登錄新證照 →');
  const [builderBtnLink, setBuilderBtnLink] = useState('{系統連結}');
  const [builderFooterOrg, setBuilderFooterOrg] = useState('遠雄營造股份有限公司 人力資源室 (證照與教育訓練管理組)');
  const [builderFooterContact, setBuilderFooterContact] = useState('電話：(02) 2723-9999 分機 #3108 | 專屬信箱：hr-license@farglory.com.tw');

  // Status & notifications
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('hr-test-license@farglory.com.tw');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);

  // Sync contentEditable div when entering visual mode or bodyHtml updates
  useEffect(() => {
    if (editableRef.current && editorMode === 'visual') {
      if (editableRef.current.innerHTML !== bodyHtml) {
        editableRef.current.innerHTML = bodyHtml;
      }
    }
  }, [editorMode]);

  // Find candidate for live preview
  const currentPreviewLic = useMemo(() => {
    return employeeLicenses.find((l) => l.id === previewLicenseId) || employeeLicenses[0];
  }, [employeeLicenses, previewLicenseId]);

  // Compute rendered HTML with dynamic variable replacement for preview
  const renderedPreviewHtml = useMemo(() => {
    if (!currentPreviewLic) return bodyHtml;

    const remainingDays = 30;
    const master = masterLicenses?.find((m) => m.name === currentPreviewLic.licenseName);

    return bodyHtml
      .replace(/{同仁姓名}/g, currentPreviewLic.empName || '陳鈺安')
      .replace(/{同仁工號}/g, currentPreviewLic.empNo || 'B7164')
      .replace(/{所屬部室}/g, currentPreviewLic.department || '工程一部')
      .replace(/{職稱}/g, currentPreviewLic.title || '專案經理')
      .replace(/{證照名稱}/g, currentPreviewLic.licenseName || '公共工程品質管理人員證書 (土建組)')
      .replace(/{證照類別}/g, currentPreviewLic.licenseCategory || '品質管理')
      .replace(/{證照字號}/g, currentPreviewLic.licenseNo || 'QC-111-098273')
      .replace(/{發證機關}/g, currentPreviewLic.issuingAuthority || '行政院公共工程委員會')
      .replace(/{取得日期}/g, currentPreviewLic.issueDate || '2021-04-15')
      .replace(/{有效到期日}/g, currentPreviewLic.expiryDate || '2026-06-30')
      .replace(/{剩餘天數}/g, String(remainingDays))
      .replace(
        /{法定回訓規定}/g,
        master?.renewalNotes || `每 ${currentPreviewLic.renewalIntervalYears || 4} 年應完成回訓`
      )
      .replace(/{案場名稱}/g, 'DH7案-新莊副都心案')
      .replace(/{人資聯絡人}/g, '遠雄營造人力資源室 (分機 #3108)')
      .replace(/{系統連結}/g, '#');
  }, [bodyHtml, currentPreviewLic, masterLicenses]);

  // Compute subject for preview
  const renderedPreviewSubject = useMemo(() => {
    if (!currentPreviewLic) return emailSubjectTemplate;
    return emailSubjectTemplate
      .replace(/{同仁姓名}/g, currentPreviewLic.empName || '陳鈺安')
      .replace(/{同仁工號}/g, currentPreviewLic.empNo || 'B7164')
      .replace(/{所屬部室}/g, currentPreviewLic.department || '工程一部')
      .replace(/{職稱}/g, currentPreviewLic.title || '專案經理')
      .replace(/{證照名稱}/g, currentPreviewLic.licenseName || '公共工程品質管理人員證書 (土建組)')
      .replace(/{證照字號}/g, currentPreviewLic.licenseNo || 'QC-111-098273')
      .replace(/{有效到期日}/g, currentPreviewLic.expiryDate || '2026-06-30')
      .replace(/{剩餘天數}/g, '30');
  }, [emailSubjectTemplate, currentPreviewLic]);

  // WYSIWYG command execution
  const executeCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editableRef.current) {
      setBodyHtml(editableRef.current.innerHTML);
    }
  };

  // Insert variable tag into content editable
  const insertVariable = (variableKey: string) => {
    if (editorMode === 'visual') {
      if (editableRef.current) {
        editableRef.current.focus();
        document.execCommand('insertText', false, variableKey);
        setBodyHtml(editableRef.current.innerHTML);
      }
    } else {
      setBodyHtml((prev) => prev + variableKey);
    }
    setShowVariableMenu(false);
  };

  // Re-generate HTML from Structured Builder form
  const handleGenerateFromBuilder = () => {
    const themeGradient =
      builderThemeColor === 'navy'
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : builderThemeColor === 'amber'
        ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)'
        : builderThemeColor === 'crimson'
        ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)'
        : builderThemeColor === 'emerald'
        ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)'
        : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)';

    const accentColor =
      builderThemeColor === 'navy'
        ? '#0f172a'
        : builderThemeColor === 'amber'
        ? '#d97706'
        : builderThemeColor === 'crimson'
        ? '#dc2626'
        : builderThemeColor === 'emerald'
        ? '#059669'
        : '#2563eb';

    const itemsHtml = builderBoxItems
      .filter((it) => it.trim())
      .map((it) => `<li style="margin-bottom: 6px;">${it}</li>`)
      .join('\n');

    const generatedHtml = `
<div style="font-family: 'Helvetica Neue', Arial, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background-color: #f1f5f9; padding: 28px 12px; margin: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
    <tr>
      <td style="background: ${themeGradient}; padding: 32px 28px; text-align: center; color: #ffffff;">
        <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 6px; text-transform: uppercase;">
          ${builderBrandTitle}
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
          ${builderBrandSubtitle}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px; color: #334155; font-size: 14px; line-height: 1.7;">
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
          ${builderGreeting}
        </p>
        <p style="margin-bottom: 20px;">
          ${builderIntro}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${accentColor}; border-radius: 10px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; width: 110px; font-weight: bold;">證照名稱：</td>
            <td style="padding: 6px 12px; font-size: 14px; color: #0f172a; font-weight: bold;">{證照名稱}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">證照字號：</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #334155; font-family: monospace;">{證照字號}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">有效到期日：</td>
            <td style="padding: 6px 12px; font-size: 14px; color: #dc2626; font-weight: bold;">{有效到期日} (剩餘約 {剩餘天數} 天)</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; color: #64748b; font-weight: bold;">法規回訓說明：</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #d97706; font-weight: 600;">{法定回訓規定}</td>
          </tr>
        </table>
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: bold; color: #92400e; font-size: 13px; margin-bottom: 8px;">
            ${builderBoxTitle}
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
            ${itemsHtml}
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="${builderBtnLink}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; font-weight: bold; font-size: 14px; padding: 12px 32px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);">
            ${builderBtnText}
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 28px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
        <div style="font-weight: bold; color: #334155; margin-bottom: 4px;">
          ${builderFooterOrg}
        </div>
        <div>
          ${builderFooterContact}
        </div>
      </td>
    </tr>
  </table>
</div>`;

    setBodyHtml(generatedHtml);
    setEditorMode('visual');
  };

  // Save settings handler
  const handleSaveAllConfig = () => {
    const days = advanceDaysInput
      .split(/[,，]/)
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d > 0);

    const emails = hrAdminEmails
      .split(/[,，]/)
      .map((e) => e.trim())
      .filter(Boolean);

    updateLicenseNotificationConfig({
      enabled,
      advanceDays: days.length ? days : [90, 60, 30, 7],
      notifyEmployee,
      notifyManager,
      notifyHrAdmin,
      hrAdminEmails: emails,
      emailSubjectTemplate,
      emailBodyTemplate: bodyHtml,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Send test email handler
  const handleSendTest = async () => {
    if (!testEmailTarget.trim()) {
      alert('請輸入測試收件電子郵件');
      return;
    }

    setIsSendingTest(true);
    setTestSentMsg(null);

    try {
      await sendEmail({
        to: testEmailTarget.trim(),
        subject: renderedPreviewSubject,
        html: renderedPreviewHtml,
        category: '證照到期預警測試',
      });

      setTestSentMsg(`✅ 已成功發送測試預警信件至 ${testEmailTarget}`);
      setTimeout(() => setTestSentMsg(null), 4000);
    } catch (err: any) {
      alert('發送測試失敗：' + (err?.message || '未知錯誤'));
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  證照到期預警與郵件內容編輯
                </h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 比照全域郵件編輯器規範
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                支援視覺化 WYSIWYG、零代碼區塊精靈、原始碼編輯與電腦/手機雙視窗即時預覽
              </p>
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl animate-in fade-in">
              <Check className="w-4 h-4" /> 預警與信件內容已儲存！
            </span>
          )}
          <button
            onClick={handleSaveAllConfig}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            儲存全部預警與信件設定
          </button>
        </div>
      </div>

      {/* Main Grid: Left Editor & Rules, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor Tabs (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub Navigation Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveMainSection('editor')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainSection === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                郵件內容編輯
              </button>
              <button
                onClick={() => setActiveMainSection('rules')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainSection === 'rules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                預警條件與收件對象
              </button>
              <button
                onClick={() => setActiveMainSection('test')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainSection === 'test'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                即時測試發送
              </button>
            </div>

            {activeMainSection === 'editor' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setEditorMode('visual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'visual'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  視覺化
                </button>
                <button
                  onClick={() => setEditorMode('builder')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'builder'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  區塊精靈
                </button>
                <button
                  onClick={() => setEditorMode('html')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'html'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  原始碼
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Email Editor */}
          {activeMainSection === 'editor' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Subject Line Input */}
              <div className="p-4 border-b border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  郵件主旨樣板 (Subject)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailSubjectTemplate}
                    onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="輸入信件主旨，支援 {同仁姓名}、{證照名稱}、{剩餘天數} 等變數"
                  />
                </div>
              </div>

              {/* Dynamic Variables Pill Bar */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>插入動態變數：</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {LICENSE_VARIABLES.slice(0, 6).map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      title={v.desc}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-2xs"
                    >
                      {v.label}
                    </button>
                  ))}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVariableMenu(!showVariableMenu)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1"
                    >
                      更多變數...
                    </button>
                    {showVariableMenu && (
                      <div className="absolute right-0 top-8 z-30 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in zoom-in-95">
                        <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
                          點擊即可插入當前游標處
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-0.5">
                          {LICENSE_VARIABLES.map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => insertVariable(v.key)}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 text-xs flex flex-col"
                            >
                              <span className="font-bold text-slate-800">{v.label} <code className="text-[10px] text-blue-600 font-normal">{v.key}</code></span>
                              <span className="text-[10px] text-slate-400">{v.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode A: Visual WYSIWYG Editor */}
              {editorMode === 'visual' && (
                <div>
                  {/* WYSIWYG Formatting Toolbar */}
                  <div className="p-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-700">
                    <button
                      type="button"
                      onClick={() => executeCmd('bold')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="粗體 (Bold)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('italic')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="斜體 (Italic)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('underline')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="底線 (Underline)"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('strikeThrough')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="刪除線"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => executeCmd('formatBlock', '<h2>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-xs font-bold transition-colors"
                      title="主標題"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('formatBlock', '<h3>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-xs font-bold transition-colors"
                      title="副標題"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('formatBlock', '<p>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-xs font-semibold transition-colors"
                      title="段落文字"
                    >
                      本文
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => executeCmd('justifyLeft')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="靠左對齊"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('justifyCenter')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="置中對齊"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('justifyRight')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="靠右對齊"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => executeCmd('insertUnorderedList')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="項目符號清單"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('insertOrderedList')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="編號清單"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCmd('insertHorizontalRule')}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="分隔線"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 mx-1" />

                    {/* Text Color Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                        title="文字顏色"
                      >
                        <Palette className="w-4 h-4" />
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-slate-400"
                          style={{ backgroundColor: textColor }}
                        />
                      </button>
                      {showColorPicker && (
                        <div className="absolute left-0 top-8 z-30 bg-white p-2 rounded-xl shadow-xl border border-slate-200 flex gap-1 animate-in fade-in">
                          {PALETTE_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setTextColor(c);
                                executeCmd('foreColor', c);
                                setShowColorPicker(false);
                              }}
                              className="w-5 h-5 rounded-full border border-slate-200 transition-transform hover:scale-110"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Highlight Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                        title="螢光筆標記"
                      >
                        <Highlighter className="w-4 h-4" />
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-slate-400"
                          style={{ backgroundColor: highlightColor === 'transparent' ? '#ffffff' : highlightColor }}
                        />
                      </button>
                      {showHighlightPicker && (
                        <div className="absolute left-0 top-8 z-30 bg-white p-2 rounded-xl shadow-xl border border-slate-200 flex gap-1 animate-in fade-in">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setHighlightColor(c);
                                executeCmd('hiliteColor', c);
                                setShowHighlightPicker(false);
                              }}
                              className="w-5 h-5 rounded-full border border-slate-200 transition-transform hover:scale-110"
                              style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('確定要還原為預設的專業預警郵件版型嗎？')) {
                          setBodyHtml(DEFAULT_BODY_HTML);
                          if (editableRef.current) editableRef.current.innerHTML = DEFAULT_BODY_HTML;
                        }
                      }}
                      className="ml-auto p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs flex items-center gap-1 font-bold transition-colors"
                      title="還原預設版型"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      還原範本
                    </button>
                  </div>

                  {/* WYSIWYG Editable Area */}
                  <div
                    ref={editableRef}
                    contentEditable
                    onInput={(e) => setBodyHtml(e.currentTarget.innerHTML)}
                    className="p-6 min-h-[420px] max-h-[560px] overflow-y-auto focus:outline-none bg-white text-slate-800 text-sm leading-relaxed"
                    style={{ minHeight: '420px' }}
                  />
                </div>
              )}

              {/* Mode B: Structured Builder Form */}
              {editorMode === 'builder' && (
                <div className="p-6 space-y-4 max-h-[560px] overflow-y-auto bg-slate-50/50">
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-900">區塊精靈模式 (Zero-Code Builder)</div>
                      <div className="text-[11px] text-blue-700">填妥下方表單設定後，點擊「套用並產生郵件 HTML」</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateFromBuilder}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      套用並產生郵件
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">主標題品牌字樣</label>
                      <input
                        type="text"
                        value={builderBrandTitle}
                        onChange={(e) => setBuilderBrandTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">副標題警示字樣</label>
                      <input
                        type="text"
                        value={builderBrandSubtitle}
                        onChange={(e) => setBuilderBrandSubtitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">主題色系風格</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'blue', name: '遠雄藍 (經典)', color: 'bg-blue-600' },
                        { id: 'navy', name: '深海湛藍', color: 'bg-slate-900' },
                        { id: 'amber', name: '預警琥珀橘', color: 'bg-amber-600' },
                        { id: 'crimson', name: '緊急緋紅', color: 'bg-rose-600' },
                        { id: 'emerald', name: '品管墨綠', color: 'bg-emerald-600' },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setBuilderThemeColor(th.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            builderThemeColor === th.id
                              ? 'bg-white border-blue-600 text-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${th.color}`} />
                          {th.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">問候語開頭</label>
                    <input
                      type="text"
                      value={builderGreeting}
                      onChange={(e) => setBuilderGreeting(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">前言說明段落</label>
                    <textarea
                      rows={2}
                      value={builderIntro}
                      onChange={(e) => setBuilderIntro(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-amber-900">換證指引重點條列</label>
                    <input
                      type="text"
                      value={builderBoxTitle}
                      onChange={(e) => setBuilderBoxTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold"
                    />
                    {builderBoxItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newArr = [...builderBoxItems];
                            newArr[idx] = e.target.value;
                            setBuilderBoxItems(newArr);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setBuilderBoxItems(builderBoxItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBuilderBoxItems([...builderBoxItems, '新增指引事項...'])}
                      className="text-xs text-amber-700 hover:underline font-bold"
                    >
                      ＋ 新增項目
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">行動呼籲按鈕文字</label>
                      <input
                        type="text"
                        value={builderBtnText}
                        onChange={(e) => setBuilderBtnText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">按鈕連結網址</label>
                      <input
                        type="text"
                        value={builderBtnLink}
                        onChange={(e) => setBuilderBtnLink(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGenerateFromBuilder}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      產生並套用至視覺化編輯器
                    </button>
                  </div>
                </div>
              )}

              {/* Mode C: Raw HTML Code Editor */}
              {editorMode === 'html' && (
                <div className="p-4 bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span>HTML SOURCE CODE</span>
                    <span>{bodyHtml.length} CHARS</span>
                  </div>
                  <textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    rows={18}
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 2: Rules & Notification Targets */}
          {activeMainSection === 'rules' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">自動預警發信總開關</h3>
                  <p className="text-xs text-slate-500">
                    啟用後，系統每日排程檢核證照有效日，符合條件者將自動寄送預警信
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  預警觸發天數 (以逗號分隔) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={advanceDaysInput}
                  onChange={(e) => setAdvanceDaysInput(e.target.value)}
                  placeholder="例如：90, 60, 30, 7"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 代表在證照到期前 90 天、60 天、30 天、7 天各觸發一次通知。
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  發信通知收件對象
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmployee}
                      onChange={(e) => setNotifyEmployee(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold">持證同仁本人 (To)</span>
                    <span className="text-slate-400 text-[11px]">發送至同仁登錄之公務電子信箱</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyManager}
                      onChange={(e) => setNotifyManager(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold">直屬部室主管 / 案主管 (CC)</span>
                    <span className="text-slate-400 text-[11px]">同步知會部門主管協助督導換證</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyHrAdmin}
                      onChange={(e) => setNotifyHrAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold">人資證照管理員 (BCC / CC)</span>
                    <span className="text-slate-400 text-[11px]">寄送副本至人資證照管理窗口</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  人資證照管理員電子信箱 (多筆請用逗號分隔)
                </label>
                <input
                  type="text"
                  value={hrAdminEmails}
                  onChange={(e) => setHrAdminEmails(e.target.value)}
                  placeholder="hr-license@farglory-build.com.tw, hr-cert@farglory.com.tw"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Section 3: Test Sending */}
          {activeMainSection === 'test' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <Send className="w-5 h-5 text-blue-600" />
                <span>即時發送測試信件</span>
              </div>
              <p className="text-xs text-slate-500">
                系統將套用當前選取的預覽同仁資料，即時產生完整 HTML 郵件並寄送至指定測試信箱。
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  測試收件者 Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  placeholder="hr-test-license@farglory.com.tw"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-700">測試信件內容預覽摘要：</div>
                <div className="text-slate-600">
                  <b>主旨：</b> {renderedPreviewSubject}
                </div>
                <div className="text-slate-600">
                  <b>套用同仁：</b> {currentPreviewLic?.empName} ({currentPreviewLic?.title}) - {currentPreviewLic?.licenseName}
                </div>
              </div>

              {testSentMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {testSentMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isSendingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    信件傳送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    立即發送測試預警信件
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Device Preview (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>即時效果雙預覽</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Device toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      previewDevice === 'desktop'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="電腦版寬度 (Desktop)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    電腦
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      previewDevice === 'mobile'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="手機版寬度 (Mobile)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    手機
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Selector for dynamic variable test */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                選擇模擬持證同仁 (測試變數替換)：
              </label>
              <select
                value={previewLicenseId}
                onChange={(e) => setPreviewLicenseId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {employeeLicenses.map((lic) => (
                  <option key={lic.id} value={lic.id}>
                    {lic.empName} ({lic.empNo}) - {lic.licenseName} [到期: {lic.expiryDate || '無期限'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Subject preview box */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="text-[10px] font-bold text-slate-400">EMAIL SUBJECT PREVIEW</div>
              <div className="font-bold text-slate-900 mt-0.5">{renderedPreviewSubject}</div>
            </div>

            {/* Frame Container */}
            <div className="bg-slate-100 p-4 rounded-2xl flex justify-center items-start overflow-x-auto min-h-[500px]">
              {previewDevice === 'desktop' ? (
                // Desktop Frame
                <div className="w-full bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden">
                  <div className="bg-slate-200 px-3 py-2 border-b border-slate-300 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-500 font-mono ml-2">
                      Farglory Mail Client - Desktop (100%)
                    </span>
                  </div>
                  <div
                    className="p-2 max-h-[520px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                  />
                </div>
              ) : (
                // Mobile Frame
                <div className="w-[340px] bg-slate-900 p-3 rounded-[36px] shadow-2xl border-4 border-slate-800">
                  {/* Notch */}
                  <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2" />
                  <div className="bg-white rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                    <div
                      className="p-1"
                      dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                    />
                  </div>
                  {/* Bottom bar */}
                  <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
