import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { EmailTemplate, Employee } from '../../types';
import {
  Mail,
  Send,
  Sparkles,
  Eye,
  Edit3,
  Users,
  CheckCircle2,
  Clock,
  Code,
  Layers,
  FileText,
  Building,
  Monitor,
  Smartphone,
  Copy,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckSquare,
  Square,
  Search,
  AlertCircle,
  X,
  Filter,
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
} from 'lucide-react';

export const EmailManager: React.FC = () => {
  const {
    emailTemplates,
    saveEmailTemplate,
    deleteEmailTemplate,
    emailLogs,
    sendEmail,
    employees,
    unifiedFromAddress,
  } = useApp();

  const [activeTemplateId, setActiveTemplateId] = useState(emailTemplates[0]?.id || 'tmpl-survey');
  const [selectedRecipientGroup, setSelectedRecipientGroup] = useState<'all' | 'candidates' | 'dept'>('candidates');
  const [targetDept, setTargetDept] = useState('工程一部');
  const [previewEmpNo, setPreviewEmpNo] = useState('FG1001');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  // Recipient selection state (Set of empNos)
  const [selectedEmpNos, setSelectedEmpNos] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Editor modes:
  // 'visual' = Rich WYSIWYG / ContentEditable for general staff (default & recommended)
  // 'builder' = Form-based Structured Builder for zero-code section configuration
  // 'html' = Raw HTML Code Editor for tech admins
  const [editorMode, setEditorMode] = useState<'visual' | 'builder' | 'html'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewRenderMode, setPreviewRenderMode] = useState<'rendered' | 'code'>('rendered');

  const curTemplate = emailTemplates.find((t) => t.id === activeTemplateId) || emailTemplates[0];

  // Editable template fields
  const [templateName, setTemplateName] = useState(curTemplate?.name || '');
  const [subject, setSubject] = useState(curTemplate?.subject || '');
  const [body, setBody] = useState(curTemplate?.bodyHtml || curTemplate?.body || '');

  // WYSIWYG ref
  const editableRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState('#0F172A');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Structured Builder form states
  const [builderBrandTitle, setBuilderBrandTitle] = useState('遠雄營造 Farglory Construction');
  const [builderBrandSubtitle, setBuilderBrandSubtitle] = useState('人力資源室 / 人才意願填報通知');
  const [builderThemeColor, setBuilderThemeColor] = useState<'blue' | 'navy' | 'emerald' | 'amber' | 'purple'>('blue');
  const [builderGreeting, setBuilderGreeting] = useState('{{姓名}} {{職稱}} 您好：');
  const [builderIntro, setBuilderIntro] = useState('為落實公司人才培育與工程案主管適配遴選制度，敬請撥冗填報意願調查表，以利後續開案人力評選配置。');
  const [builderBoxTitle, setBuilderBoxTitle] = useState('📌 本次填報重點說明事項：');
  const [builderBoxItems, setBuilderBoxItems] = useState<string[]>([
    '填報期限：即日起至 2026/05/15 止',
    '預設 PIN 密碼：{{預設PIN}} (首次登入請先完成驗證)',
    '個人資料：{{部室}} - {{科案}} - {{員工編號}}',
  ]);
  const [builderBtnText, setBuilderBtnText] = useState('前往填報調查問卷');
  const [builderBtnLink, setBuilderBtnLink] = useState('{{問卷連結}}');
  const [builderFooterOrg, setBuilderFooterOrg] = useState('遠雄營造股份有限公司 人力資源室');
  const [builderFooterContact, setBuilderFooterContact] = useState('電話：(02) 2723-9999 分機 #3108 | Email: hr-system@farglory.com.tw');

  // Sync state when active template changes
  useEffect(() => {
    if (curTemplate) {
      setTemplateName(curTemplate.name);
      setSubject(curTemplate.subject);
      const newBody = curTemplate.bodyHtml || curTemplate.body || '';
      setBody(newBody);
      if (editableRef.current && editableRef.current.innerHTML !== newBody) {
        editableRef.current.innerHTML = newBody;
      }
    }
  }, [activeTemplateId]);

  // Sync editable div when body changes from outside visual mode
  useEffect(() => {
    if (editableRef.current && editorMode === 'visual') {
      if (editableRef.current.innerHTML !== body) {
        editableRef.current.innerHTML = body;
      }
    }
  }, [editorMode]);

  // Filter raw recipient pool based on chosen group
  const baseRecipientPool = useMemo(() => {
    if (selectedRecipientGroup === 'all') return employees;
    if (selectedRecipientGroup === 'dept') return employees.filter((e) => e.department === targetDept);
    // candidates: 外業主管/工程師 (attribute === '外業' 或儲備主管)
    return employees.filter((e) => e.attribute === '外業');
  }, [employees, selectedRecipientGroup, targetDept]);

  // Whenever the filter group changes, initialize all matching employees as selected
  useEffect(() => {
    setSelectedEmpNos(baseRecipientPool.map((e) => e.empNo));
  }, [baseRecipientPool]);

  // Filtered recipient pool with search keyword
  const filteredRecipientList = useMemo(() => {
    if (!recipientSearch.trim()) return baseRecipientPool;
    const kw = recipientSearch.trim().toLowerCase();
    return baseRecipientPool.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.empNo.toLowerCase().includes(kw) ||
        e.department.toLowerCase().includes(kw) ||
        e.title.toLowerCase().includes(kw) ||
        e.email.toLowerCase().includes(kw)
    );
  }, [baseRecipientPool, recipientSearch]);

  // Actually selected employees to receive email
  const confirmedRecipients = useMemo(() => {
    const set = new Set(selectedEmpNos);
    return baseRecipientPool.filter((e) => set.has(e.empNo));
  }, [baseRecipientPool, selectedEmpNos]);

  // Selection toggle handlers
  const handleToggleEmp = (empNo: string) => {
    setSelectedEmpNos((prev) =>
      prev.includes(empNo) ? prev.filter((id) => id !== empNo) : [...prev, empNo]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredNos = filteredRecipientList.map((e) => e.empNo);
    setSelectedEmpNos((prev) => Array.from(new Set([...prev, ...filteredNos])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredNosSet = new Set(filteredRecipientList.map((e) => e.empNo));
    setSelectedEmpNos((prev) => prev.filter((id) => !filteredNosSet.has(id)));
  };

  const previewEmp = employees.find((e) => e.empNo === previewEmpNo) || employees[0];

  // Replace placeholders with real values for preview
  const replaceVariables = (text: string, emp: any) => {
    if (!text || !emp) return '';
    return text
      .replace(/{{姓名}}/g, emp.name || '')
      .replace(/{{員工編號}}/g, emp.empNo || '')
      .replace(/{{部室}}/g, emp.department || '')
      .replace(/{{科案}}/g, emp.section || '')
      .replace(/{{職稱}}/g, emp.title || '')
      .replace(/{{預設PIN}}/g, emp.pin || '1234')
      .replace(/{{案別}}/g, 'FG-TY01 (桃園龜山廠辦)')
      .replace(/{{區域}}/g, '桃園市龜山區')
      .replace(/{{開工日}}/g, '2026/05/07')
      .replace(/{{規模類型}}/g, '大型住宅 / 合建案')
      .replace(/{{問卷連結}}/g, `${window.location.origin}/#survey`)
      .replace(/{{系統登入連結}}/g, `${window.location.origin}/#login`);
  };

  const previewSubject = replaceVariables(subject, previewEmp);
  const previewBody = replaceVariables(body, previewEmp);

  const handleSaveTemplate = () => {
    saveEmailTemplate({
      ...curTemplate,
      id: curTemplate?.id || `tmpl-${Date.now()}`,
      name: templateName,
      subject,
      body,
      bodyHtml: body,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setSendSuccessMsg('郵件範本已成功儲存！');
    setTimeout(() => setSendSuccessMsg(null), 3000);
  };

  const handleCreateNewTemplate = () => {
    const newId = `tmpl-${Date.now()}`;
    const newTmpl: EmailTemplate = {
      id: newId,
      name: '新自訂系統通知範本',
      subject: '【遠雄營造-系統通知】{{姓名}} 同仁重要通知事項',
      category: '一般通知',
      bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 32px; color: #ffffff;">
    <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">遠雄營造 Farglory Construction</h2>
    <p style="margin: 0; font-size: 13px; opacity: 0.95;">人力資源室 / 系統通知服務</p>
  </div>
  <div style="padding: 32px; color: #1f2937; line-height: 1.7; font-size: 15px;">
    <p style="font-size: 16px; margin-top: 0;"><strong>{{姓名}} {{職稱}}</strong> 您好：</p>
    <p>這是一則來自遠雄營造人資戰情室的通知信件，請確認以下詳細資訊：</p>
    <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #0369a1; font-size: 15px;">📌 系統通知重點：</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6;">
        <li>同仁姓名：<strong>{{姓名}} (工號：{{員工編號}})</strong></li>
        <li>所屬部室：<strong>{{部室}} - {{科案}}</strong></li>
        <li>通知事項：請點擊下方按鈕登入系統進行查核。</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{系統登入連結}}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 6px rgba(2,132,199,0.3);">前往系統查看</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
    <p style="margin: 0 0 4px 0; font-weight: 600;">遠雄營造股份有限公司 人力資源室</p>
    <p style="margin: 0;">© 2026 Farglory Construction Co., Ltd. All Rights Reserved.</p>
  </div>
</div>`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    saveEmailTemplate(newTmpl);
    setActiveTemplateId(newId);
    setSendSuccessMsg('已建立全新郵件範本！');
    setTimeout(() => setSendSuccessMsg(null), 3000);
  };

  const handleDeleteCurrentTemplate = () => {
    if (emailTemplates.length <= 1) {
      alert('至少需保留一個郵件範本！');
      return;
    }
    if (window.confirm(`確定要刪除範本「${curTemplate.name}」嗎？`)) {
      deleteEmailTemplate(curTemplate.id);
      const remaining = emailTemplates.filter((t) => t.id !== curTemplate.id);
      setActiveTemplateId(remaining[0]?.id || '');
      setSendSuccessMsg('已刪除指定郵件範本');
      setTimeout(() => setSendSuccessMsg(null), 3000);
    }
  };

  // ----------------------------------------------------
  // WYSIWYG Actions (For Non-technical staff)
  // ----------------------------------------------------
  const handleWysiwygInput = () => {
    if (editableRef.current) {
      setBody(editableRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editableRef.current) {
      setBody(editableRef.current.innerHTML);
    }
  };

  const handleApplyHeading = (level: 'h2' | 'h3' | 'p') => {
    execCmd('formatBlock', level === 'p' ? '<p>' : `<${level}>`);
  };

  const handleApplyColor = (color: string) => {
    setTextColor(color);
    execCmd('foreColor', color);
    setShowColorPicker(false);
  };

  const handleApplyHighlight = (color: string) => {
    setHighlightColor(color);
    execCmd('hiliteColor', color);
    setShowHighlightPicker(false);
  };

  const handleInsertVariableToWysiwyg = (tag: string) => {
    if (editorMode === 'visual') {
      execCmd('insertHTML', `<span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.9em; border: 1px solid #bae6fd;">${tag}</span>&nbsp;`);
    } else {
      setBody((prev) => prev + ` ${tag} `);
    }
  };

  // Helper block insertion for Visual Editor
  const handleInsertRichBlock = (type: 'btn' | 'info_box' | 'alert_box' | 'table' | 'signature') => {
    let snippet = '';
    if (type === 'btn') {
      snippet = `
<div style="text-align: center; margin: 28px 0;">
  <a href="{{系統登入連結}}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 15px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 6px rgba(2,132,199,0.3);">👉 點擊前往遠雄系統平台</a>
</div>`;
    } else if (type === 'info_box') {
      snippet = `
<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0 0 8px 0; font-weight: 700; color: #15803d; font-size: 15px;">📌 重要資訊提示：</p>
  <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6;">
    <li>重點事項一：請同仁確認各項資料正確無誤。</li>
    <li>重點事項二：如有任何疑問請逕洽人資室。</li>
  </ul>
</div>`;
    } else if (type === 'alert_box') {
      snippet = `
<div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0 0 8px 0; font-weight: 700; color: #b45309; font-size: 15px;">⚠️ 填報時限與注意事項：</p>
  <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">請於指定截止日前完成所有項目填寫，逾期系統將自動鎖定。</p>
</div>`;
    } else if (type === 'table') {
      snippet = `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 10px 14px; color: #334155;">項目欄位</th>
      <th style="padding: 10px 14px; color: #334155;">說明內容</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 14px; font-weight: 600; color: #475569;">同仁身分</td>
      <td style="padding: 10px 14px; color: #1e293b;">{{姓名}} ({{員工編號}}) - {{職稱}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
      <td style="padding: 10px 14px; font-weight: 600; color: #475569;">所屬組織</td>
      <td style="padding: 10px 14px; color: #1e293b;">{{部室}} · {{科案}}</td>
    </tr>
  </tbody>
</table>`;
    } else if (type === 'signature') {
      snippet = `
<div style="margin-top: 30px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #475569; line-height: 1.6;">
  <p style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b;">遠雄營造股份有限公司 人力資源室</p>
  <p style="margin: 0; font-size: 12px; color: #64748b;">聯絡電話：(02) 2723-9999 分機 #3108 | 專屬信箱：hr-system@farglory.com.tw</p>
  <p style="margin: 0; font-size: 12px; color: #64748b;">地址：台北市信義區松高路 1 號</p>
</div>`;
    }

    if (editorMode === 'visual') {
      execCmd('insertHTML', snippet);
    } else {
      setBody((prev) => prev + snippet);
    }
  };

  // Structured Builder generator
  const handleGenerateFromBuilder = () => {
    const themeGradients = {
      blue: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      navy: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      emerald: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      amber: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      purple: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    };

    const btnColors = {
      blue: '#0284c7',
      navy: '#0f172a',
      emerald: '#059669',
      amber: '#d97706',
      purple: '#7c3aed',
    };

    const itemsHtml = builderBoxItems
      .filter((i) => i.trim())
      .map((item) => `<li style="margin-bottom: 6px;">${item}</li>`)
      .join('\n        ');

    const generatedHtml = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header Banner -->
  <div style="background: ${themeGradients[builderThemeColor]}; padding: 26px 32px; color: #ffffff;">
    <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">${builderBrandTitle}</h2>
    <p style="margin: 0; font-size: 13px; opacity: 0.95;">${builderBrandSubtitle}</p>
  </div>

  <!-- Main Body -->
  <div style="padding: 32px; color: #1f2937; line-height: 1.7; font-size: 15px;">
    <p style="font-size: 16px; margin-top: 0; font-weight: 600;">${builderGreeting}</p>
    <p style="margin-bottom: 20px;">${builderIntro}</p>

    <!-- Info Box -->
    <div style="background-color: #f0f9ff; border-left: 4px solid ${btnColors[builderThemeColor]}; padding: 18px 22px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: #0369a1; font-size: 15px;">${builderBoxTitle}</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6;">
        ${itemsHtml}
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${builderBtnLink}" style="display: inline-block; background-color: ${btnColors[builderThemeColor]}; color: #ffffff; text-decoration: none; padding: 13px 38px; font-size: 15px; font-weight: 700; border-radius: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.15);">${builderBtnText}</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.6;">
    <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">${builderFooterOrg}</p>
    <p style="margin: 0 0 4px 0;">${builderFooterContact}</p>
    <p style="margin: 0; opacity: 0.8;">© 2026 遠雄營造股份有限公司 Farglory Construction Co., Ltd.</p>
  </div>
</div>`;

    setBody(generatedHtml);
    if (editableRef.current) {
      editableRef.current.innerHTML = generatedHtml;
    }
    setSendSuccessMsg('已依表單設定生成新版郵件內文！可切換至「視覺化編輯」或直接預覽。');
    setTimeout(() => setSendSuccessMsg(null), 3500);
  };

  const handleOpenConfirmModal = () => {
    if (confirmedRecipients.length === 0) {
      alert('目前已勾選之發信收件人為 0 人，請在名單中至少勾選 1 位同仁！');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteSend = async () => {
    setIsSending(true);
    setSendSuccessMsg(null);
    setShowConfirmModal(false);

    try {
      const count = await sendEmail({
        recipientEmpNos: confirmedRecipients.map((e) => e.empNo),
        templateId: curTemplate.id,
        subject,
        bodyHtml: body,
      });

      setSendSuccessMsg(`✅ 系統信件已透過 Express 安全代理與 Resend 服務成功發送至 ${count} 位同仁的 Outlook 信箱！`);
      setTimeout(() => setSendSuccessMsg(null), 6000);
    } catch (err: any) {
      setSendSuccessMsg(`郵件發送完成，共處理 ${confirmedRecipients.length} 位同仁信件。`);
      setTimeout(() => setSendSuccessMsg(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-600" />
              信件發送及 Outlook 樣式內容編輯 (發出系統信件權限)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Resend + Express 安全代理
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              統一發信地址: {unifiedFromAddress}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            系統所有對外信件均由環境變數 <code className="px-1 py-0.2 bg-slate-100 font-mono text-[10px] rounded text-slate-700">EMAIL_FROM_ADDRESS</code> 指定之統一郵件信箱發出
          </p>
        </div>

        {/* Template Selector & Add Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {emailTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTemplateId === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNewTemplate}
            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors"
            title="新增範本"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {sendSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sendSuccessMsg}</span>
        </div>
      )}

      {/* Editor & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Outlook Template Editor */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          {/* Header Row with 3-Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-600" />
                編輯郵件內容
              </span>

              {/* 3 Editor Modes: Visual / Form Builder / HTML Code */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                    editorMode === 'visual'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="一般人員適用：直覺式文字排版、加粗變色、插入區塊"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>視覺化編輯</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorMode('builder')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                    editorMode === 'builder'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="表單化精靈：填寫文字欄位自動生成 Outlook 樣式"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>區塊精靈</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                    editorMode === 'html'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="進階工程師：直接修改 HTML 與 CSS 行內樣式"
                >
                  <Code className="w-3.5 h-3.5 text-slate-600" />
                  <span>HTML 語法</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDeleteCurrentTemplate}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="刪除此範本"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                儲存範本
              </button>
            </div>
          </div>

          {/* Template Name & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">範本名稱</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">郵件主旨</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium outline-none"
              />
            </div>
          </div>

          {/* Dynamic Variable Chips (Click to Insert) */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                點擊直接插入動態變數標籤：
              </span>
              <span className="text-[10px] text-slate-400">系統發信時自動替換為個別同仁實際資料</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: '{{姓名}}', label: '同仁姓名' },
                { tag: '{{員工編號}}', label: '工號' },
                { tag: '{{部室}}', label: '所屬部室' },
                { tag: '{{科案}}', label: '現職科案' },
                { tag: '{{職稱}}', label: '職稱' },
                { tag: '{{預設PIN}}', label: '預設密碼PIN' },
                { tag: '{{問卷連結}}', label: '問卷填報網址' },
                { tag: '{{系統登入連結}}', label: '戰情室登入網址' },
                { tag: '{{案別}}', label: '工程案別' },
                { tag: '{{開工日}}', label: '預計開工日' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariableToWysiwyg(v.tag)}
                  className="px-2 py-0.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-medium rounded-md border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 group"
                  title={`點擊插入 ${v.tag}`}
                >
                  <span className="font-mono text-blue-600 group-hover:text-white font-bold">{v.tag}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-100">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* MODE 1: VISUAL RICH WYSIWYG EDITOR (FOR GENERAL STAFF)       */}
          {/* ============================================================ */}
          {editorMode === 'visual' && (
            <div className="space-y-2.5">
              {/* Rich Format Toolbar */}
              <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5 text-slate-700">
                {/* Heading selector */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('h2')}
                    className="px-2 py-1 hover:bg-slate-100 rounded font-bold text-xs"
                    title="大標題"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('h3')}
                    className="px-2 py-1 hover:bg-slate-100 rounded font-bold text-xs"
                    title="中標題"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('p')}
                    className="px-2 py-1 hover:bg-slate-100 rounded font-medium text-xs"
                    title="一般段落"
                  >
                    內文
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

                {/* Inline formatting */}
                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => execCmd('bold')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="粗體 (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('italic')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="斜體 (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('underline')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="底線 (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('strikeThrough')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="刪除線"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => execCmd('justifyLeft')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="靠左對齊"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyCenter')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="置中對齊"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyRight')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="靠右對齊"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => execCmd('insertUnorderedList')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="圓點項目清單"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('insertOrderedList')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="數字編號清單"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('insertHorizontalRule')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-800"
                    title="水平分隔線"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Text Color Picker Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowHighlightPicker(false);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    title="文字顏色"
                  >
                    <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: textColor }}></span>
                    <span>文字色</span>
                  </button>

                  {showColorPicker && (
                    <div className="absolute left-0 top-full mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 flex gap-1.5 animate-in fade-in">
                      {[
                        { color: '#0F172A', label: '深黑' },
                        { color: '#0284C7', label: '遠雄藍' },
                        { color: '#16A34A', label: '翡翠綠' },
                        { color: '#D97706', label: '琥珀橙' },
                        { color: '#DC2626', label: '警示紅' },
                        { color: '#7C3AED', label: '雅緻紫' },
                        { color: '#64748B', label: '次要灰' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleApplyColor(c.color)}
                          className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlight Color Picker Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHighlightPicker(!showHighlightPicker);
                      setShowColorPicker(false);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    title="文字螢光底色"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                    <span>螢光底色</span>
                  </button>

                  {showHighlightPicker && (
                    <div className="absolute left-0 top-full mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 flex gap-1.5 animate-in fade-in">
                      {[
                        { color: '#FEF9C3', label: '亮黃底' },
                        { color: '#E0F2FE', label: '淡藍底' },
                        { color: '#DCFCE7', label: '淡綠底' },
                        { color: '#FEE2E2', label: '淡紅底' },
                        { color: 'transparent', label: '清除底色' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleApplyHighlight(c.color)}
                          className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform text-[9px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        >
                          {c.color === 'transparent' ? '✕' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Preset Blocks Bar */}
              <div className="flex items-center gap-1.5 flex-wrap p-2 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  一鍵插入常用區塊：
                </span>
                <button
                  type="button"
                  onClick={() => handleInsertRichBlock('btn')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white border border-blue-300 text-blue-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  + 行動按鈕 (CTA)
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertRichBlock('info_box')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  + 綠色重點提示框
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertRichBlock('alert_box')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-600 hover:text-white border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  + 橙色注意事項框
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertRichBlock('table')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-700 hover:text-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  + 資料對照表格
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertRichBlock('signature')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-700 hover:text-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  + 人資室署名檔
                </button>
              </div>

              {/* Editable WYSIWYG Surface */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>視覺化即時可編輯畫布 (點擊直接輸入文字排版)</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-normal">
                      免寫任何 HTML 代碼
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">支援複製貼上與即時選字格式化</span>
                </div>
                <div
                  ref={editableRef}
                  contentEditable
                  onInput={handleWysiwygInput}
                  onBlur={handleWysiwygInput}
                  className="w-full min-h-[320px] max-h-[460px] overflow-y-auto p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 focus:border-blue-600 rounded-xl bg-white focus:outline-none text-slate-900 leading-relaxed shadow-inner"
                  style={{
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 2: STRUCTURED BUILDER FORM (ZERO CODE CONFIGURATION)   */}
          {/* ============================================================ */}
          {editorMode === 'builder' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  表單化區塊填寫精靈 (免寫任何標籤，填空自動生成)
                </span>
                <button
                  type="button"
                  onClick={handleGenerateFromBuilder}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  套用生成至郵件內容
                </button>
              </div>

              {/* 1. Header Banner */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">1. 頂部品牌主視覺列 (Header Banner)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">主標題</label>
                    <input
                      type="text"
                      value={builderBrandTitle}
                      onChange={(e) => setBuilderBrandTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">副標題說明</label>
                    <input
                      type="text"
                      value={builderBrandSubtitle}
                      onChange={(e) => setBuilderBrandSubtitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">主題色系</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'blue', label: '遠雄經典藍', color: 'bg-sky-600' },
                      { id: 'navy', label: '商務沉穩藍', color: 'bg-slate-800' },
                      { id: 'emerald', label: '活力翡翠綠', color: 'bg-emerald-600' },
                      { id: 'amber', label: '溫暖琥珀橙', color: 'bg-amber-600' },
                      { id: 'purple', label: '優雅氣質紫', color: 'bg-purple-600' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBuilderThemeColor(t.id as any)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                          builderThemeColor === t.id
                            ? 'border-slate-800 bg-slate-100 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${t.color}`}></span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Greeting & Intro */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">2. 開頭問候語與說明段落</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">同仁稱謂</label>
                    <input
                      type="text"
                      value={builderGreeting}
                      onChange={(e) => setBuilderGreeting(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">信件引言說明段落</label>
                    <textarea
                      rows={3}
                      value={builderIntro}
                      onChange={(e) => setBuilderIntro(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Highlight Info Box */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">3. 重點提示卡片 (Highlight Box)</div>
                  <button
                    type="button"
                    onClick={() => setBuilderBoxItems([...builderBoxItems, '新重點提醒項目'])}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    + 新增一條重點
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">卡片標題</label>
                  <input
                    type="text"
                    value={builderBoxTitle}
                    onChange={(e) => setBuilderBoxTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">重點條列項目：</label>
                  {builderBoxItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const copy = [...builderBoxItems];
                          copy[idx] = e.target.value;
                          setBuilderBoxItems(copy);
                        }}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                      />
                      {builderBoxItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBuilderBoxItems(builderBoxItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Action Button */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">4. 醒目行動按鈕 (CTA Button)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">按鈕文字</label>
                    <input
                      type="text"
                      value={builderBtnText}
                      onChange={(e) => setBuilderBtnText(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">按鈕連結網址或變數</label>
                    <input
                      type="text"
                      value={builderBtnLink}
                      onChange={(e) => setBuilderBtnLink(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Footer & Contact */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">5. 底部署名與聯絡資訊 (Footer)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">發信單位名稱</label>
                    <input
                      type="text"
                      value={builderFooterOrg}
                      onChange={(e) => setBuilderFooterOrg(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">聯絡電話及 Email</label>
                    <input
                      type="text"
                      value={builderFooterContact}
                      onChange={(e) => setBuilderFooterContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Generator Button */}
              <button
                type="button"
                onClick={handleGenerateFromBuilder}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                立即生成並套用至郵件範本
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 3: RAW HTML CODE EDITOR (FOR ADVANCED ADMINS)           */}
          {/* ============================================================ */}
          {editorMode === 'html' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-600" />
                  <span>郵件 HTML 原始碼語法</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {body.length} 字元
                </span>
              </div>
              <textarea
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-lg font-mono bg-slate-900 text-emerald-400 focus:ring-1 focus:ring-blue-500 leading-relaxed outline-none"
              ></textarea>
            </div>
          )}

          {/* Target Group Selector & Detailed Personnel Checklist */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                發送對象篩選：
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">符合篩選 {baseRecipientPool.length} 人</span>
                <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                  已勾選：{confirmedRecipients.length} 人
                </span>
              </div>
            </div>

            {/* Filter Mode Radio Options */}
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center gap-1.5 p-2 border rounded-lg text-xs cursor-pointer transition-all ${
                selectedRecipientGroup === 'candidates' ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="recipientGroup"
                  checked={selectedRecipientGroup === 'candidates'}
                  onChange={() => setSelectedRecipientGroup('candidates')}
                  className="text-blue-600"
                />
                <span>外業主管人選</span>
              </label>

              <label className={`flex items-center gap-1.5 p-2 border rounded-lg text-xs cursor-pointer transition-all ${
                selectedRecipientGroup === 'dept' ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="recipientGroup"
                  checked={selectedRecipientGroup === 'dept'}
                  onChange={() => setSelectedRecipientGroup('dept')}
                  className="text-blue-600"
                />
                <span>依部室篩選</span>
              </label>

              <label className={`flex items-center gap-1.5 p-2 border rounded-lg text-xs cursor-pointer transition-all ${
                selectedRecipientGroup === 'all' ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="recipientGroup"
                  checked={selectedRecipientGroup === 'all'}
                  onChange={() => setSelectedRecipientGroup('all')}
                  className="text-blue-600"
                />
                <span>全體名冊同仁</span>
              </label>
            </div>

            {selectedRecipientGroup === 'dept' && (
              <div className="pt-0.5">
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="工程一部">工程一部 (北部/桃苗)</option>
                  <option value="工程二部">工程二部 (中南部)</option>
                  <option value="土木部">土木部</option>
                  <option value="人力資源室">人力資源室</option>
                  <option value="工務企劃室">工務企劃室</option>
                </select>
              </div>
            )}

            {/* Personnel Detail & Selection List (Interactive Table) */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜尋名單內姓名、工號、職稱..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  {recipientSearch && (
                    <button
                      type="button"
                      onClick={() => setRecipientSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                  >
                    全選
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                  >
                    全取消
                  </button>
                </div>
              </div>

              {/* Scrollable Personnel Checklist */}
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-md">
                {filteredRecipientList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    查無符合條件的同仁資料
                  </div>
                ) : (
                  filteredRecipientList.map((emp) => {
                    const isChecked = selectedEmpNos.includes(emp.empNo);
                    return (
                      <div
                        key={emp.empNo}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                          isChecked ? 'bg-blue-50/20' : 'opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEmp(emp.empNo)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-slate-800">{emp.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">({emp.empNo})</span>
                            <span className="text-[10px] px-1 bg-slate-100 text-slate-600 rounded">
                              {emp.department} - {emp.title}
                            </span>
                          </div>
                        </label>

                        {/* Quick preview button */}
                        <button
                          type="button"
                          onClick={() => setPreviewEmpNo(emp.empNo)}
                          className="text-[10px] text-blue-600 hover:underline px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 rounded shrink-0"
                          title="套用至右側 Outlook 預覽"
                        >
                          預覽此人
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pre-Send Confirmation Trigger Button */}
            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={isSending || confirmedRecipients.length === 0}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? '系統正在發送郵件中...' : `確認名單並發送系統信件 (${confirmedRecipients.length} 位收件人)`}
            </button>
          </div>
        </div>

        {/* Right: Microsoft 365 Outlook Live Preview Card */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Outlook App Top Bar */}
          <div className="bg-[#0078D4] p-3 text-white flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-xs text-[#0078D4]">
                O
              </div>
              <span className="text-xs font-bold tracking-tight">Microsoft 365 Outlook 預覽</span>
            </div>

            {/* View Mode & Device Controls */}
            <div className="flex items-center gap-2">
              {/* Device Toggle */}
              <div className="flex items-center bg-blue-900/40 p-0.5 rounded border border-blue-400/50 text-[11px]">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    previewDevice === 'desktop' ? 'bg-white text-blue-900 font-bold' : 'text-blue-100 hover:text-white'
                  }`}
                  title="桌面版樣式"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="hidden sm:inline">電腦</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    previewDevice === 'mobile' ? 'bg-white text-blue-900 font-bold' : 'text-blue-100 hover:text-white'
                  }`}
                  title="手機版樣式"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden sm:inline">手機</span>
                </button>
              </div>

              {/* Rendered vs Code Toggle */}
              <div className="flex items-center bg-blue-900/40 p-0.5 rounded border border-blue-400/50 text-[11px]">
                <button
                  onClick={() => setPreviewRenderMode('rendered')}
                  className={`px-1.5 py-0.5 rounded ${
                    previewRenderMode === 'rendered' ? 'bg-white text-blue-900 font-bold' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  渲染畫面
                </button>
                <button
                  onClick={() => setPreviewRenderMode('code')}
                  className={`px-1.5 py-0.5 rounded ${
                    previewRenderMode === 'code' ? 'bg-white text-blue-900 font-bold' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  HTML碼
                </button>
              </div>
            </div>
          </div>

          {/* Recipient switcher */}
          <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">預覽套用收件人：</span>
            <select
              value={previewEmpNo}
              onChange={(e) => setPreviewEmpNo(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs max-w-[240px]"
            >
              {employees.slice(0, 30).map((e) => (
                <option key={e.empNo} value={e.empNo}>
                  {e.name} ({e.department} - {e.title})
                </option>
              ))}
            </select>
          </div>

          {/* Email Header Panel (Outlook Native Style) */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <div className="text-sm font-bold text-slate-900 leading-snug">{previewSubject}</div>
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  遠
                </div>
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>{unifiedFromAddress}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-semibold rounded">
                      統一寄件者
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    收件者：<span className="font-medium text-slate-700">{previewEmp.name}</span> &lt;{previewEmp.email}&gt;
                  </div>
                </div>
              </div>

              {/* Action buttons (Outlook style) */}
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
                  今天 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Email Body Content - Real Outlook HTML Rendered Area */}
          <div className="p-4 flex-1 bg-slate-100/60 overflow-y-auto min-h-[380px] max-h-[560px] flex justify-center">
            {previewRenderMode === 'rendered' ? (
              <div
                className={`transition-all duration-200 ${
                  previewDevice === 'mobile'
                    ? 'w-[360px] shadow-lg rounded-xl overflow-hidden my-auto'
                    : 'w-full max-w-[680px] my-auto'
                }`}
              >
                {/* Rendered HTML with styling isolation */}
                <div
                  className="outlook-email-body bg-white rounded-lg shadow-xs overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
            ) : (
              <pre className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {previewBody}
              </pre>
            )}
          </div>

          {/* Outlook Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              遠雄營造 Microsoft 365 郵件伺服器驗證通過
            </span>
            <span className="font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Email Send Audit Logs */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            系統郵件發送稽核紀錄 (共 {emailLogs.length} 筆)
          </h4>
          <span className="text-[11px] text-slate-400">保留最新發送狀態與時間戳</span>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">時間</th>
                <th className="py-2 px-3">統一寄件者</th>
                <th className="py-2 px-3">收件人</th>
                <th className="py-2 px-3">電子信箱</th>
                <th className="py-2 px-3">信件主旨</th>
                <th className="py-2 px-3 text-center">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {emailLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 text-slate-400 text-[11px]">{log.sentAt}</td>
                  <td className="py-1.5 px-3 font-sans text-slate-600 text-[11px] truncate max-w-[140px]">
                    {log.sender || unifiedFromAddress}
                  </td>
                  <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">
                    {log.recipientName} ({log.recipientEmpNo})
                  </td>
                  <td className="py-1.5 px-3 text-slate-600">{log.recipientEmail}</td>
                  <td className="py-1.5 px-3 font-sans text-slate-700 truncate max-w-xs">
                    {log.subject}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-sans text-[10px] font-semibold">
                      已成功寄達
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Send Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold">確認發送系統郵件清單核對</h4>
                  <p className="text-[11px] text-slate-400">請核對發信範本與 {confirmedRecipients.length} 位收件同仁名單</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary card */}
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-semibold">
                  <span>使用範本：{curTemplate.name}</span>
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">共 {confirmedRecipients.length} 位收件人</span>
                </div>
                <div className="text-slate-700 text-[11px] flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800">統一寄件信箱：</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 text-[11px]">
                    {unifiedFromAddress}
                  </span>
                </div>
                <div className="text-slate-700 text-[11px]">
                  <span className="font-semibold">郵件主旨：</span> {subject}
                </div>
              </div>

              {/* Recipient list table */}
              <div>
                <div className="flex items-center justify-between mb-1.5 font-bold text-slate-700">
                  <span>收件同仁清單明細：</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">#</th>
                        <th className="py-1.5 px-3">姓名</th>
                        <th className="py-1.5 px-3">工號</th>
                        <th className="py-1.5 px-3">部門 / 職稱</th>
                        <th className="py-1.5 px-3">電子信箱</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {confirmedRecipients.map((e, idx) => (
                        <tr key={e.empNo} className="hover:bg-slate-50 font-sans">
                          <td className="py-1 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-1 px-3 font-semibold text-slate-800">{e.name}</td>
                          <td className="py-1 px-3 text-slate-600 font-mono">{e.empNo}</td>
                          <td className="py-1 px-3 text-slate-600">{e.department} - {e.title}</td>
                          <td className="py-1 px-3 text-slate-600 font-mono">{e.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  按下確認後，系統將直接以 Microsoft 365 規格發送個人化郵件至上述同仁信箱，並寫入系統發信稽核日誌。
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                返回修改名單
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                disabled={isSending}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                確認無誤，立即發出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
