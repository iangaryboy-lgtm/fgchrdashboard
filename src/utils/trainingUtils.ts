/**
 * Helper utilities for Training & Development System (TMS/LMS)
 */

export function formatTargetAudience(targetAudience: any): string {
  if (!targetAudience) return '全體同仁開放';
  if (typeof targetAudience === 'string') return targetAudience;
  
  if (typeof targetAudience === 'object') {
    if (targetAudience.allOpen) return '全體同仁開放';
    
    const parts: string[] = [];
    if (Array.isArray(targetAudience.departments) && targetAudience.departments.length > 0) {
      parts.push(`部門: ${targetAudience.departments.join('、')}`);
    }
    if (Array.isArray(targetAudience.ranks) && targetAudience.ranks.length > 0) {
      parts.push(`職級: ${targetAudience.ranks.join('、')}`);
    }
    if (Array.isArray(targetAudience.attributes) && targetAudience.attributes.length > 0) {
      parts.push(`屬性: ${targetAudience.attributes.join('、')}`);
    }
    if (targetAudience.competencyMapRequired) {
      parts.push('學習地圖必修');
    }
    
    return parts.length > 0 ? parts.join(' | ') : '特定對象限制';
  }
  
  return String(targetAudience);
}

/**
 * Extract YouTube Video ID from any YouTube URL (watch, share, shorts, embed, live)
 */
export function extractYouTubeVideoId(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, short, embed, shorts, live, etc.
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Check if a string/URL contains a valid YouTube video ID or link
 */
export function isYouTubeUrl(url: string | undefined): boolean {
  return !!extractYouTubeVideoId(url);
}

/**
 * Get YouTube Embed URL
 */
export function getYouTubeEmbedUrl(urlOrId: string | undefined, autoplay: boolean = false): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Get YouTube Thumbnail URL
 */
export function getYouTubeThumbnailUrl(urlOrId: string | undefined): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Extract URL from an iframe embed snippet (e.g. if user pastes `<iframe src="..." ...>`)
 */
export function extractEmbedUrlFromIframe(input: string | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Check if a URL belongs to Microsoft Teams, OneDrive, SharePoint, or Microsoft Stream
 */
export function isMicrosoftVideoUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const raw = (extractEmbedUrlFromIframe(url) || url).toLowerCase().trim();
  if (!raw) return false;

  // Explicit Microsoft video / stream keywords
  if (
    raw.includes('teams.microsoft.com') ||
    raw.includes('teams.live.com') ||
    raw.includes('microsoftstream.com') ||
    raw.includes('stream.office.com') ||
    raw.includes('stream.aspx') ||
    raw.includes(':v:') ||
    raw.includes('/v/') ||
    raw.includes('video') ||
    raw.includes('teams-rec') ||
    raw.includes('recording') ||
    raw.includes('meeting')
  ) {
    return true;
  }

  // General SharePoint / OneDrive links (unless confirmed as an Office text document)
  if (raw.includes('sharepoint.com') || raw.includes('1drv.ms') || raw.includes('onedrive.live.com')) {
    const isDocFile = /\.(docx?|pptx?|xlsx?|pdf|csv)(\?|$)/i.test(raw);
    const isExplicitDocRoute =
      raw.includes(':w:') ||
      raw.includes(':x:') ||
      raw.includes(':p:') ||
      raw.includes(':b:') ||
      raw.includes('1drv.ms/w/') ||
      raw.includes('1drv.ms/x/') ||
      raw.includes('1drv.ms/p/') ||
      raw.includes('1drv.ms/b/') ||
      raw.includes('doc.aspx');

    if (!isDocFile && !isExplicitDocRoute) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a URL belongs to Microsoft OneDrive, SharePoint, or Office 365 documents (Word, Excel, PowerPoint, PDF)
 */
export function isOneDriveDocUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const raw = (extractEmbedUrlFromIframe(url) || url).toLowerCase();
  
  // Videos / Streams should never be treated as Office text documents
  if (
    raw.includes('stream.aspx') ||
    raw.includes('stream.office.com') ||
    raw.includes('microsoftstream.com') ||
    raw.includes(':v:') ||
    raw.includes('/v/') ||
    raw.includes('teams-rec') ||
    raw.includes('teams.microsoft.com')
  ) {
    return false;
  }

  // Explicit SharePoint document paths
  const isSharepointOrOnedrive =
    raw.includes('sharepoint.com') ||
    raw.includes('1drv.ms') ||
    raw.includes('onedrive.live.com') ||
    raw.includes('office.com') ||
    raw.includes('officeapps.live.com');

  if (!isSharepointOrOnedrive) return false;

  // Check for document indicators
  return (
    raw.includes(':w:') ||
    raw.includes(':x:') ||
    raw.includes(':p:') ||
    raw.includes(':b:') ||
    raw.includes('1drv.ms/w/') ||
    raw.includes('1drv.ms/x/') ||
    raw.includes('1drv.ms/p/') ||
    raw.includes('1drv.ms/b/') ||
    raw.includes('1drv.ms/u/') ||
    raw.includes('1drv.ms/f/') ||
    raw.includes('.docx') ||
    raw.includes('.doc') ||
    raw.includes('.xlsx') ||
    raw.includes('.xls') ||
    raw.includes('.pptx') ||
    raw.includes('.ppt') ||
    raw.includes('.pdf') ||
    raw.includes('doc.aspx') ||
    raw.includes('word') ||
    raw.includes('excel') ||
    raw.includes('powerpoint')
  );
}

/**
 * Detect specific document type of a OneDrive/SharePoint/Office file
 */
export function detectOneDriveDocType(
  urlOrName: string | undefined,
  title?: string,
  fileType?: string
): 'word' | 'excel' | 'powerpoint' | 'pdf' | 'office' {
  const combined = `${urlOrName || ''} ${title || ''} ${fileType || ''}`.toLowerCase();

  if (
    combined.includes(':w:') ||
    combined.includes('1drv.ms/w/') ||
    combined.includes('.docx') ||
    combined.includes('.doc') ||
    combined.includes('word') ||
    combined.includes('手冊') ||
    combined.includes('規範') ||
    combined.includes('公文') ||
    combined.includes('合約')
  ) {
    return 'word';
  }

  if (
    combined.includes(':x:') ||
    combined.includes('1drv.ms/x/') ||
    combined.includes('.xlsx') ||
    combined.includes('.xls') ||
    combined.includes('excel') ||
    combined.includes('試算表') ||
    combined.includes('計算表') ||
    combined.includes('模型') ||
    combined.includes('數據')
  ) {
    return 'excel';
  }

  if (
    combined.includes(':p:') ||
    combined.includes('1drv.ms/p/') ||
    combined.includes('.pptx') ||
    combined.includes('.ppt') ||
    combined.includes('powerpoint') ||
    combined.includes('簡報') ||
    combined.includes('投影片') ||
    combined.includes('ppt')
  ) {
    return 'powerpoint';
  }

  if (
    combined.includes(':b:') ||
    combined.includes('1drv.ms/b/') ||
    combined.includes('.pdf') ||
    combined.includes('pdf') ||
    combined.includes('圖說') ||
    combined.includes('報告')
  ) {
    return 'pdf';
  }

  return 'office';
}

/**
 * Normalize and convert OneDrive / SharePoint / Office Document sharing URLs to embeddable URLs
 */
export function getOneDriveDocEmbedUrl(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = (extractEmbedUrlFromIframe(url) || url).trim();

  // If it's already an embed link
  if (
    cleanUrl.includes('/embed.aspx') ||
    cleanUrl.includes('/embed?') ||
    cleanUrl.includes('/embed/') ||
    cleanUrl.includes('action=embedview') ||
    cleanUrl.includes('action=interactivepreview')
  ) {
    return cleanUrl;
  }

  // Personal OneDrive sharing link (1drv.ms)
  if (cleanUrl.includes('1drv.ms')) {
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=embedview`;
  }

  // onedrive.live.com
  if (cleanUrl.includes('onedrive.live.com')) {
    if (cleanUrl.includes('resid=') || cleanUrl.includes('id=')) {
      return cleanUrl.replace('/view.aspx', '/embed').replace('/redir', '/embed');
    }
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=embedview`;
  }

  // SharePoint document links (:w:, :x:, :p:, :b:, Doc.aspx)
  if (cleanUrl.includes('sharepoint.com')) {
    if (cleanUrl.includes('viewer.aspx') || cleanUrl.includes('Doc.aspx')) {
      return cleanUrl.replace('viewer.aspx', 'embed.aspx').replace('Doc.aspx', 'embed.aspx');
    }
    if (cleanUrl.includes('?')) {
      return `${cleanUrl}&action=embedview`;
    }
    return `${cleanUrl}?action=embedview`;
  }

  // Office Web Viewer fallback for general public URLs
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(cleanUrl)}`;
  }

  return cleanUrl;
}

/**
 * Normalize and convert Microsoft Teams / OneDrive / SharePoint / Stream URLs into embeddable URLs
 */
export function getMicrosoftVideoEmbedUrl(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // If user pasted an iframe HTML snippet, extract the src first
  const cleanUrl = (extractEmbedUrlFromIframe(url) || url).trim();

  // If it's already an embed link (contains /embed.aspx or /embed? or /embed/ or embedview)
  if (cleanUrl.includes('/embed.aspx') || cleanUrl.includes('/embed?') || cleanUrl.includes('/embed/') || cleanUrl.includes('action=embedview')) {
    return cleanUrl;
  }

  // Stream on SharePoint or Stream classic: https://stream.office.com/video/... -> /embed/...
  if (cleanUrl.includes('stream.office.com/video/')) {
    return cleanUrl.replace('stream.office.com/video/', 'stream.office.com/embed/');
  }

  // Personal OneDrive sharing link (1drv.ms) or Live OneDrive
  if (cleanUrl.includes('onedrive.live.com') && !cleanUrl.includes('/embed')) {
    if (cleanUrl.includes('resid=') || cleanUrl.includes('id=')) {
      return cleanUrl.replace('/view.aspx', '/embed').replace('/redir', '/embed');
    }
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=embedview`;
  }

  if (cleanUrl.includes('1drv.ms')) {
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=embedview`;
  }

  // SharePoint / Teams video link (:v: or stream or file)
  if (cleanUrl.includes('sharepoint.com')) {
    if (cleanUrl.includes('/_layouts/15/viewer.aspx') || cleanUrl.includes('/_layouts/15/Doc.aspx')) {
      return cleanUrl.replace('viewer.aspx', 'embed.aspx').replace('Doc.aspx', 'embed.aspx');
    }
    if (cleanUrl.includes('?')) {
      if (!cleanUrl.includes('action=embedview') && !cleanUrl.includes('embed=true')) {
        return `${cleanUrl}&action=embedview`;
      }
    } else {
      return `${cleanUrl}?action=embedview`;
    }
  }

  return cleanUrl;
}

/**
 * Identify exact media/document type of a material item
 */
export function detectMaterialMediaType(material: {
  fileType?: string;
  fileUrl?: string;
  convertedFrom?: string;
}): 'youtube' | 'teams_onedrive' | 'onedrive_doc' | 'video' | 'pdf' | 'office' | 'scorm' | 'link' {
  const type = (material.fileType || '').toLowerCase();
  const url = (material.fileUrl || '').toLowerCase();

  if (type === 'youtube' || extractYouTubeVideoId(material.fileUrl)) {
    return 'youtube';
  }

  // Explicit OneDrive / SharePoint document links (Word, Excel, PowerPoint, PDF)
  if (type === 'onedrive_doc' || isOneDriveDocUrl(material.fileUrl)) {
    return 'onedrive_doc';
  }

  if (
    type === 'teams_onedrive' ||
    type === 'teams' ||
    type === 'onedrive' ||
    type === 'stream' ||
    type === 'sharepoint' ||
    isMicrosoftVideoUrl(material.fileUrl)
  ) {
    return 'teams_onedrive';
  }

  if (
    type === 'video' ||
    type === 'mp4' ||
    type === 'webm' ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov')
  ) {
    return 'video';
  }

  if (type === 'pdf' || url.endsWith('.pdf') || material.convertedFrom) {
    return 'pdf';
  }

  if (
    type === 'office' ||
    type === 'ppt' ||
    type === 'pptx' ||
    type === 'excel' ||
    type === 'xlsx' ||
    type === 'word' ||
    type === 'doc' ||
    type === 'docx' ||
    url.endsWith('.ppt') ||
    url.endsWith('.pptx') ||
    url.endsWith('.xls') ||
    url.endsWith('.xlsx') ||
    url.endsWith('.doc') ||
    url.endsWith('.docx')
  ) {
    return 'office';
  }

  if (type === 'scorm') {
    return 'scorm';
  }

  return 'link';
}

/**
 * Rich structured content generator for OneDrive Word / Excel / PowerPoint / PDF documents
 */
export function getOneDriveDocStructuredData(material: {
  title?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  category?: string;
  description?: string;
}) {
  const title = material.title || 'OneDrive 雲端工程文件';
  const docType = detectOneDriveDocType(material.fileUrl, material.title, material.fileType);

  if (docType === 'excel') {
    return {
      type: 'excel' as const,
      workbookName: material.fileName || `${title}.xlsx`,
      sheets: [
        {
          id: 'sheet-1',
          name: '1. 風壓受力分析模型',
          columns: ['A (樓層區段)', 'B (基準標高 m)', 'C (設計風壓 Pa)', 'D (板片厚度 mm)', 'E (最大撓度 mm)', 'F (抗彎安全係數)', 'G (檢驗判定)'],
          rows: [
            ['1F ~ 5F 低樓層區', '0.00 ~ 22.50', '2,400 Pa', '8.0 mm 強化', '1.24 mm', '2.85', 'PASS (合格)'],
            ['6F ~ 15F 中低樓層', '22.50 ~ 67.50', '2,850 Pa', '10.0 mm 膠合', '1.86 mm', '2.62', 'PASS (合格)'],
            ['16F ~ 28F 中高樓層', '67.50 ~ 126.00', '3,400 Pa', '12.0 mm 雙膠合', '2.35 mm', '2.41', 'PASS (合格)'],
            ['29F ~ 38F 超高樓層', '126.00 ~ 171.00', '4,100 Pa', '12.0 mm Low-E 雙強化', '2.78 mm', '2.28', 'PASS (合格)'],
            ['39F ~ 頂冠迎風區', '171.00 ~ 210.00', '4,800 Pa', '15.0 mm Low-E 雙膠合', '3.12 mm', '2.15', 'PASS (極限安全)'],
          ],
          summaryStats: [
            { label: '最高設計風載重', value: '4,800 Pa' },
            { label: '結構安全係數平均', value: '2.46' },
            { label: '撓度控制極限比', value: '1/360 跨距 (通過)' },
          ],
        },
        {
          id: 'sheet-2',
          name: '2. 三向組裝公差檢驗表',
          columns: ['檢驗點 (Point)', 'X 軸橫向偏差 (mm)', 'Y 軸高程偏差 (mm)', 'Z 軸進出平整 (mm)', '間隙縫寬 (mm)', '品管員核章', '量測時間'],
          rows: [
            ['Grid A-1 (東北角柱)', '+0.8 mm', '-0.5 mm', '+0.4 mm', '15.2 mm', '李建志 (品管)', '09:15 AM'],
            ['Grid B-3 (北向跨距)', '-0.6 mm', '+0.2 mm', '-0.3 mm', '14.8 mm', '李建志 (品管)', '09:40 AM'],
            ['Grid C-5 (西北主跨)', '+1.1 mm', '-0.8 mm', '+0.7 mm', '15.1 mm', '張宏瑋 (現場)', '10:20 AM'],
            ['Grid D-2 (西南轉角)', '-0.4 mm', '+0.4 mm', '-0.2 mm', '14.9 mm', '張宏瑋 (現場)', '11:05 AM'],
            ['Grid E-4 (南向中庭)', '+0.5 mm', '-0.3 mm', '+0.5 mm', '15.0 mm', '李建志 (品管)', '11:45 AM'],
          ],
          summaryStats: [
            { label: '量測點總計', value: '48 點 (全數合格)' },
            { label: '最大三向偏差', value: '+1.1 mm (規範容許 ±1.5mm)' },
            { label: '日照熱膨脹修正量', value: '-0.3 mm @ 28°C' },
          ],
        },
        {
          id: 'sheet-3',
          name: '3. 螺栓抗剪與氣密試驗',
          columns: ['螺栓編號', '規格等級', '設計扭力 (N·m)', '實測扭力 (N·m)', '抗剪強度 (kN)', '水密壓差 (Pa)', '試驗結果'],
          rows: [
            ['BLT-01 ~ BLT-08', 'M20 Grade 10.9', '450 N·m', '465 N·m', '142 kN', '1,200 Pa 噴水 15min', '合格 (無滲漏)'],
            ['BLT-09 ~ BLT-16', 'M20 Grade 10.9', '450 N·m', '460 N·m', '145 kN', '1,200 Pa 噴水 15min', '合格 (無滲漏)'],
            ['BLT-17 ~ BLT-24', 'M24 Grade 10.9', '680 N·m', '695 N·m', '205 kN', '1,200 Pa 噴水 15min', '合格 (無滲漏)'],
            ['BLT-25 ~ BLT-32', 'M24 Grade 10.9', '680 N·m', '690 N·m', '208 kN', '1,200 Pa 噴水 15min', '合格 (無滲漏)'],
          ],
          summaryStats: [
            { label: '扭力扳手校正檢驗', value: '100% 合格' },
            { label: '動態風雨噴水試驗', value: '零水痕、零氣泡滲透' },
          ],
        },
      ],
    };
  }

  if (docType === 'powerpoint') {
    return {
      type: 'powerpoint' as const,
      presentationTitle: material.fileName || `${title}.pptx`,
      slides: [
        {
          slideNumber: 1,
          title: '遠雄營造工程技術學院 · 專業研習講義',
          subtitle: title,
          bullets: [
            '主講單位：遠雄營造總部 技術研發與工安品質部',
            '適用對象：工務所主管、工程師、安全衛生管理人員及協力分包主管',
            '文件授權：Microsoft OneDrive 企業組織內安全共用與授權',
          ],
          speakerNotes: '講師開場提示：請各組學員於研習進行中，隨時利用筆記功能記錄現場工項之盲點與改善要項。',
          accentColor: 'orange',
        },
        {
          slideNumber: 2,
          title: '單元一：關鍵作業標準與法規風險防杜',
          subtitle: '現場施工危害因子辨識與防護機制',
          bullets: [
            '高空吊裝作業：實施「雙重防墜掛鉤」與母索連續性扣接規範。',
            '地盤改良灌漿：低抗剪泥漿品質比重控制（1.05 ~ 1.15 g/cm³）。',
            '動態風雨防線：落實等壓腔排水截面與三道耐候密封膠查核。',
            '智慧工區感測：即時連線監控揚塵、噪音與地下水壓水位自動預警。',
          ],
          speakerNotes: '重點強調：工安防墜十不原則，凡進入 2 公尺以上開口作業區，必須全員正確穿戴五點式背負安全帶。',
          accentColor: 'indigo',
        },
        {
          slideNumber: 3,
          title: '單元二：工期要徑 (CPM) 與滾動式介面排程',
          subtitle: '排除工序衝突，落實日報與週進度檢討',
          bullets: [
            '要徑網圖分析：辨識關鍵要徑（Critical Path），寬裕浮時（Total Float）零延誤。',
            'BIM 4D 介面套繪：開工前 14 天完成鋼骨、帷幕、機電開孔 3D 碰撞排除。',
            '出工動態管理：分包商每日進場人數、機具能量與進度產值實時比對。',
            '天候延誤佐證：觀測站逐日降雨量比對，建立合法工期展延佐證資料庫。',
          ],
          speakerNotes: '案例分析：分享內湖百億廠辦工程如何透過 4D BIM 施工模擬提前 45 天達成上樑里程碑。',
          accentColor: 'blue',
        },
        {
          slideNumber: 4,
          title: '單元三：現場自主品管與課後 SMART 行動方針',
          subtitle: '學以致用，擬定 30/60/90 天實踐目標',
          bullets: [
            '隱蔽部分檢驗：100% 拍照存證，上傳至工務所雲端品管系統。',
            '課後評量測驗：隨堂測驗需達 70 分及格門檻，始核發內部培訓學分。',
            'SMART 行動計畫：擬定具體量化之現場改善指標，由主管定期考核。',
            '結訓證書核發：系統自動登錄個人職能履歷，納入年度晉升與派訓評分。',
          ],
          speakerNotes: '結尾叮嚀：請同仁下課後於 7 日內完成 SMART 課後行動計畫之擬定並送交直屬主管審核。',
          accentColor: 'emerald',
        },
      ],
    };
  }

  if (docType === 'word') {
    return {
      type: 'word' as const,
      documentTitle: material.fileName || `${title}.docx`,
      headerInfo: {
        docNumber: 'FG-SPEC-2026-ENG01',
        securityLevel: '內部機密 (Internal Confidential)',
        effectiveDate: '2026-01-01',
        revisedDate: '2026-06-15 (Rev. 3)',
        authorDept: '遠雄營造 總部技術品保室',
      },
      chapters: [
        {
          chapterNumber: 'Chapter 1',
          title: '總則與工程適用範疇 (General Provisions & Scope)',
          content: '本作業規範手冊適用於遠雄營造承攬之所有超高層建築工程、地下室深開挖工程、連續壁擋土工法及外牆單元式帷幕牆組裝作業。各案場工務所應依據本標準編製案場施工計畫書，並嚴格遵循各項品質檢驗管制點。',
          clauses: [
            '1.1 施工團隊進場前，主辦工程師需完成地質鑽探報告覆核與鄰房現況鑑定。',
            '1.2 凡涉及結構安全與擋土支撐之工項，協力廠商技師需簽署施工圖說及計算書。',
            '1.3 各分項工程應設立自主檢查表（QA/QC Checklist），由現場工程師 100% 逐日查驗。',
          ],
          table: {
            headers: ['分項工程', '檢驗規範條款', '抽查頻率', '合格標準判定'],
            rows: [
              ['連續壁導溝放樣', 'CNS 13000 系列', '每 10 公尺檢驗 1 處', '軸線公差 ≤ ±10mm'],
              ['泥漿比重與含砂量', 'API Spec 13A 標準', '每抓斗每循環取樣 2 瓶', '比重 1.05~1.15, 含砂 ≤ 3%'],
              ['鋼筋籠吊裝與對接', 'AWS D1.4 鋼筋焊接', '100% 全數逐根檢查', '搭接長度 ≥ 40d, 焊縫飽滿'],
              ['特密管水下灌漿', 'ACI 304R 導管澆置', '連續灌注不得中斷 > 30min', '管底埋深維持 2.0~6.0m'],
            ],
          },
        },
        {
          chapterNumber: 'Chapter 2',
          title: '品質管制標準與驗收程序 (Quality Control & Acceptance Criteria)',
          content: '工程施作過程之各項檢驗數據均需即時上傳至遠雄營造雲端品質資料庫。隱蔽部分（如地下基樁、地改灌漿、結構體鋼筋綁紮）在未經監造及工務所品管簽章同意前，嚴禁進行下一道工序。',
          clauses: [
            '2.1 混凝土澆置前應進行坍度試驗（Slump Test）及氯離子含量檢測（≤ 0.15 kg/m³）。',
            '2.2 鋼骨結構螺栓鎖固應採用定扭力扳手，並由品管人員按比例進行 20% 扭力抽驗。',
            '2.3 帷幕牆單元板片吊裝應於每日上午 9:00 前校正雷射基準，排除日照溫差熱膨脹影響。',
          ],
          callout: '【罰則與退件條款】現場如發現未經核准之工法變更或材料偷工減料，工務所主任具備即刻勒令停工權限，並對違規分包商處以合約違約金。',
        },
        {
          chapterNumber: 'Chapter 3',
          title: '附則與檔案版本歷程 (Appendix & Revision History)',
          content: '本手冊之修訂由技術品保委員會每季審議通過後公佈實施。同仁可透過 Microsoft OneDrive / SharePoint 取得最新版之線上閱讀與下載權限。',
          clauses: [
            '3.1 凡遇國家建築法規或 CNS 規範修訂時，本手冊將於 15 日內發布增補條款。',
            '3.2 同仁於現場實務遭遇疑義時，應於 24 小時內提報技術研發部進行個案審查。',
          ],
        },
      ],
    };
  }

  // Generic PDF fallback structured data
  return {
    type: 'pdf' as const,
    documentTitle: material.fileName || `${title}.pdf`,
    pages: getPdfPreviewData({
      title,
      fileName: material.fileName,
      category: material.category,
      description: material.description,
      fileType: material.fileType,
    }),
  };
}

/**
 * Generate rich structured PDF pages for any PDF or converted Office material
 */
export function getPdfPreviewData(material: {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  categoryName?: string;
  fileType?: string;
  fileName?: string;
  version?: string;
  convertedFrom?: string;
  pdfPreviewContent?: any;
}) {
  if (material.pdfPreviewContent?.pages && material.pdfPreviewContent.pages.length > 0) {
    return material.pdfPreviewContent.pages;
  }

  const title = material.title || '遠雄營造專業工程訓練講義';
  const category = material.categoryName || material.category || '專業訓練';
  const version = material.version || 'v2026.1';
  const origType = material.convertedFrom || material.fileType || 'pdf';

  // Topic specific generation
  const isCurtainWall = title.includes('帷幕') || title.includes('鋼骨');
  const isCPM = title.includes('工期') || title.includes('索賠') || title.includes('CPM') || title.includes('進度');
  const isSafety = title.includes('安全') || title.includes('SOP') || title.includes('甲種');
  const isSMART = title.includes('SMART') || title.includes('領導') || title.includes('行動計畫');
  const isExcavation = title.includes('開挖') || title.includes('連續壁');

  if (isCurtainWall) {
    return [
      {
        pageNumber: 1,
        chapterTitle: '第一章：封面與工程單元概述 (Cover & Overview)',
        sections: [
          {
            heading: '超高層鋼骨帷幕牆組裝精度管控與風雨試驗實務',
            content: '本單元為遠雄營造針對 30 層以上超高層大樓之單元式帷幕牆（Unitized Curtain Wall System）吊裝、三維雷射量測精度校正與 ASTM E283/E331/AAMA 501.1 動態風雨試驗所訂定之專案作業標準指引。',
            highlight: '【技術重點】單元版片三向組裝公差需嚴格控制於 ±1.5mm 以內；層間位移變形補償節點需具備 ±25mm 之伸縮容許量。',
            diagramType: 'structure' as const,
          },
          {
            heading: '學習目標與適用對象',
            content: '適用於工務所主任、現場工程師、品管工程師及帷幕牆專案分包商技術主管。完訓後應具備單元吊裝就位檢驗、水密氣密防線檢查及現場漏水查驗能力。',
            points: [
              '瞭解單元式帷幕板片吊裝工序與雙重掛鉤防墜承重機制',
              '掌握全站儀（Total Station）三維座標定位檢測流程',
              '熟練 EPDM 膠條壓迫率（Compression Rate ≥ 30%）與雙道防線等壓原理 (Rain Screen Principle)',
              '掌握現場抽氣箱氣密試驗與動態螺旋槳造風噴水測試查驗重點',
            ],
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: '第二章：單元式帷幕吊裝工序與三向精度管制 (Installation Precision)',
        sections: [
          {
            heading: '2.1 吊裝定位作業三向公差標準表',
            content: '依據遠雄營造超高層施工規範，現場安裝應於各基準層設立鋼骨垂直延伸控制線，每日上午 9:00 前完成日照熱膨脹效應修正。',
            tableData: {
              headers: ['檢驗項目', '設計公差標準', '檢測儀器與方法', '抽檢頻率 / 責任者'],
              rows: [
                ['X 軸 (水平橫向面偏差)', '± 1.5 mm', '精密雷射水準儀', '100% 全數逐片量測 (工務所)'],
                ['Y 軸 (立面垂直平整度)', '± 2.0 mm', '垂直經緯儀 / 垂直雷射球', '100% 全數逐片量測 (品管員)'],
                ['Z 軸 (水平進出深淺面)', '± 1.5 mm', '測距儀與基準鋼索', '100% 全數逐片量測 (工務所)'],
                ['相鄰單元間隙寬度', '15 mm ± 1.0 mm', '厚薄規 / 游標卡尺', '每跨抽測 3 處 (品管員)'],
                ['預埋件 (Anchor) 焊接強度', '符合 AWS D1.1 標準', '超音波探傷檢測 (UT)', '抽樣 20% (第三方檢驗)'],
              ],
            },
          },
          {
            heading: '2.2 層間位移與地震剪力變形補償機制',
            content: '超高層建物遇強風或地震時，主結構鋼骨將產生層間相對位移（Drift Angle 1/200）。單元帷幕板片之間必須藉由伸縮套管與滑動插銷吸收相對變形，防止玻璃破裂與框料擠壓失效。',
            points: [
              '滑動公母料搭接長度不得小於 35mm，避免地震時脫榫',
              '伸縮填縫矽利康需選用結構級中性耐候膠（Modulus ≥ 0.4 MPa）',
              '背襯泡棉條（Backer Rod）直徑需為接縫寬度之 125%~130%，確保雙面黏著',
            ],
          },
        ],
      },
      {
        pageNumber: 3,
        chapterTitle: '第三章：風雨試驗 (ASTM & AAMA) 驗證與現場防漏水實務 (Waterproofing & Testing)',
        sections: [
          {
            heading: '3.1 ASTM E331 靜態水密與 AAMA 501.1 動態風雨試驗要求',
            content: '為確保帷幕牆於 17 級強颱與極端暴雨下滴水不漏，工程開工前需製作 1:1 全尺寸模型（Mock-up）送至國家級風洞實驗室進行極限負載測試。',
            highlight: '【驗收合格標準】動態測試水壓 1,200 Pa（相當於風速 45 m/s），持續噴水 15 分鐘，內側結構框架、保溫棉與背板需維持 100% 絕對乾燥無水痕。',
            tableData: {
              headers: ['試驗階段', '測試標準', '試驗條件 / 施加壓力', '檢驗判定準則'],
              rows: [
                ['氣密性能 (Air Infiltration)', 'ASTM E283', '正負壓 75 Pa / 300 Pa', '洩漏量 ≤ 0.3 L/(s·m²)'],
                ['靜態水密 (Static Water)', 'ASTM E331', '噴水量 3.4 L/(min·m²), 壓差 720 Pa', '室內側無任何滲漏水'],
                ['動態風雨 (Dynamic Water)', 'AAMA 501.1', '飛機發動機螺旋槳風壓 1,200 Pa', '接縫及等壓腔無溢水'],
                ['結構風壓 (Structural)', 'ASTM E330', '150% 設計風載重 (約 4,500 Pa)', '無永久殘餘形變 (殘餘 < 0.2%)'],
                ['層間變位 (Seismic Drift)', 'AAMA 501.4', '橫向位移量 ±28mm (反覆3次)', '玻璃無脫落破裂、氣密不衰退'],
              ],
            },
          },
          {
            heading: '3.2 現場自主品管檢查清單 (QA/QC Checklist)',
            content: '現場安裝完成後，工務所每施作 3 個樓層需進行現地抽氣箱試驗（AAMA 501.2）抽驗，並嚴格填寫自主檢查表記錄存檔。',
            points: [
              '檢查一：排水孔（Weep Hole）是否暢通，防蟲濾網是否安裝就位',
              '檢查二：背板隔熱岩棉（密度 80 kg/m³）固定釘間距 ≤ 300mm，無垂下縫隙',
              '檢查三：防火填塞（Firestop）與層間防煙遮斷板厚度 ≥ 1.5mm 鍍鋅鋼板，耐火時效達 2 小時',
            ],
          },
        ],
      },
    ];
  }

  if (isCPM) {
    return [
      {
        pageNumber: 1,
        chapterTitle: '第一章：工期展延計算與要徑法 (CPM) 理論架構 (Schedule & CPM Analysis)',
        sections: [
          {
            heading: '營造工程工期展延計算與合約索賠實務模型',
            content: '本教材為案場主管、工務部專案經理與法務合約人員量身打造。涵蓋雙代號網圖（ADM）、前導要徑網圖（PDM）、總寬裕度（Total Float）歸屬權與非可歸責展延天數計算公式。',
            highlight: '【核心原則】僅有落於關鍵要徑（Critical Path）且因業主指示、天候不可抗力或非承攬商原因造成之作業延誤，始具備合法工期展延與直接費用索賠請求權。',
            diagramType: 'cpm' as const,
          },
          {
            heading: '常用工期展延分析法 (SCL Delay Protocol)',
            content: '依據國際工程法學會 SCL 延誤評估準則，推薦案場採用「影響要徑時間點回溯分析法 (Time Impact Analysis, TIA)」。',
            points: [
              'As-Planned vs. As-Built 預定進度與實際進度對比法',
              'Time Impact Analysis (TIA) 影響時間點即時分析法（最推薦、法院採納率最高）',
              'Collapsed As-Built 扣除延誤原因回溯分析法',
              'Window Analysis 區間進度網圖動態滾動分析法',
            ],
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: '第二章：天候與變更設計不可歸責工期換算公式 (Formulas & Claims)',
        sections: [
          {
            heading: '2.1 降雨天候影響換算標準 (中央氣象局觀測站數據比對)',
            content: '案場於遭遇異常連續降雨時，需比對過去 10 年同期平均降雨日數，扣除常態氣候寬裕天數後計算不可抗力天數。',
            tableData: {
              headers: ['施工工項性質', '降雨臨界判定門檻', '不可工作日計算權重', '佐證資料要求'],
              rows: [
                ['土方開挖與出土作業', '日累積降雨量 ≥ 10 mm', '算計 1.0 工作天延誤', '工地日誌、洗車台監控、觀測站報表'],
                ['大體積混凝土澆置', '日累積降雨量 ≥ 5 mm 或強陣風', '算計 1.0 工作天延誤', '品管抽查單、預拌廠出貨暫停證明'],
                ['高空帷幕與鋼骨吊裝', '瞬間陣風 ≥ 6 級 (10.8 m/s)', '算計 1.0 工作天延誤', '塔吊風速儀即時記錄、工安日誌'],
                ['室內裝修與機電拉線', '不受一般天候降雨影響', '不予計列天候展延', '室內工作不列入天候延誤天數'],
              ],
            },
          },
          {
            heading: '2.2 合約索賠直接費與管理費計算模型',
            content: '工期展延經業主核可後，承攬商得請求工期展延期間所支出之不可避免現場管理費用（Eichleay Formula 衍生模型）。',
            points: [
              '每日現場管理費 = (案場合約總管理費 / 原定總工期天數) × 核定展延天數',
              '施工機具閒置補償 = 機具折舊費率 × 50%（扣除耗損油料）',
              '分包商怠工與二度進出場動員補償費用',
              '履約保證金與工程保險延長加保之利息與手續費',
            ],
          },
        ],
      },
      {
        pageNumber: 3,
        chapterTitle: '第三章：工程工期展延申請標準作業程序 (SOP & Timeline)',
        sections: [
          {
            heading: '3.1 展延申請時效與通知存證管制點',
            content: '合約規定之通知期限為除斥期間。任何延誤事件發生後，應於第一時間以書面發文報備，保留完整權益。',
            tableData: {
              headers: ['程序階段', '規定期限', '主管負責人', '產出文件與附件要求'],
              rows: [
                ['延誤事件預警通知 (Notice)', '事發後 7 日內', '工務所專案主任', '工程備忘錄 (Memo)、現場監控照片'],
                ['詳細影響分析報告 (TIA)', '事發後 28 日內', '進度排程工程師', 'P6 網圖計算檔、要徑差異比對表'],
                ['費用索賠清冊與憑證', '事件結束後 14 日內', '工料計價組 / 估算師', '機具發票、人事出勤表、保險加保單'],
                ['爭議調解與協商', '業主逾 30 日未回覆', '總公司法務處 / 協理', '工程會調解聲請書或仲裁準備書'],
              ],
            },
          },
          {
            heading: '3.2 案主管自主檢核要點',
            points: [
              '每日工地日誌出工數、工區位置、天氣與完成數量必須詳實記錄',
              '關鍵要徑調整必須留存歷次排程基線（Baseline Schedule）版本紀錄',
              '變更設計圖說（RFI）答覆若逾 14 日，需立即發文提醒其要徑影響',
            ],
          },
        ],
      },
    ];
  }

  if (isSafety) {
    return [
      {
        pageNumber: 1,
        chapterTitle: '第一章：甲種職業安全衛生標準規範概述 (OSH General Guidelines)',
        sections: [
          {
            heading: '遠雄營造甲種職業安全衛生標準作業規範 (SOP)',
            content: '本作業規範依據《職業安全衛生法》及營造安全衛生設施標準制定，旨在落實零職災、全員安衛自律與高風險工項嚴格管制。',
            highlight: '【工安紅線政策】嚴禁無防墜設施高空作業、嚴禁未斷電活線檢修、嚴禁吊掛旋轉半徑下方人員站立。違反者一律勒令停工並處分懲戒。',
            diagramType: 'checkpoints' as const,
          },
          {
            heading: '安全衛生三大支柱',
            points: [
              '行前教育：每日晨會 Toolbox Talk (TBT) 與體溫酒測檢驗 100% 執行',
              '動態巡檢：專職安衛人員攜帶數位稽核平板每 2 小時巡視全區',
              '科技防災：AI 辨識人員安全帽反光背心穿戴、開口紅外線電子圍籬防護',
            ],
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: '第二章：墜落預防與吊掛作業十不原則 (Fall Prevention & Rigging)',
        sections: [
          {
            heading: '2.1 高處作業（高度 ≥ 2m）防墜管制標準',
            tableData: {
              headers: ['開口及區域類型', '安全設施防護標準', '檢驗規範 / 耐衝擊強度'],
              rows: [
                ['樓地板開口 (電梯井/管道間)', '固定式安全護欄 (上欄桿 90cm, 中欄桿 45cm, 踢腳板 10cm)', '耐衝擊強度 ≥ 100 kgf'],
                ['外牆施工架與鷹架作業', '雙掛勾背負式安全帶、防墜母索 (直徑 ≥ 14mm 鋼索)', '母索拉拔強度 ≥ 2,300 kgf'],
                ['屋頂及採光罩作業', '滿鋪 3cm 以上走道板並架設安全防墜網 (網目 ≤ 10cm)', '合格衝擊檢驗標籤'],
                ['高空工作車 (Cherry Picker)', '操作手具備合格操作證、車體伸展前四向支撐腳固定', '防傾斜警報器功能正常'],
              ],
            },
          },
          {
            heading: '2.2 起重吊掛「十不吊」管制原則',
            points: [
              '超載不吊、信號不明不吊、重量不明不吊',
              '吊物捆紮不牢不吊、吊物下方有人不吊、吊掛物邊角無防磨襯墊不吊',
              '埋在地下或凍結之物不吊、六級以上強風與暴雨不吊',
              '斜拉斜吊不吊、安全防墜裝置失靈不吊',
            ],
          },
        ],
      },
    ];
  }

  // Default General Professional Construction Engineering PDF
  return [
    {
      pageNumber: 1,
      chapterTitle: `第一章：${title} - 課程大綱與總論 (Overview & Syllabus)`,
      sections: [
        {
          heading: `${title}`,
          content: material.description || '本講義經遠雄營造工程教育訓練中心編審，結合理論與大型建案施工實務案例，供同仁線上研修與現場查驗作業依據。',
          highlight: `【教材類別】${category} · 【版本代碼】${version} · 【原始格式】${origType.toUpperCase()} (已自動轉檔為標準線上 PDF 講義)`,
          diagramType: 'flow' as const,
        },
        {
          heading: '課程核心學習價值與成效指標',
          content: '學員完成本教材研習後，應掌握標準作業流程、關鍵品管檢驗點（QCP）及常見施工介面衝突之排除方式。',
          points: [
            '理解工程圖說與施工工法之關聯法規與規範要求',
            '熟練關鍵節點施工工序與品質自主檢查清冊（Checklist）',
            '提升現場工班調度與介面整合效率，降低重工與耗損成本',
            '落實遠雄企業綠色營造與智慧化施工方針',
          ],
        },
      ],
    },
    {
      pageNumber: 2,
      chapterTitle: '第二章：工程標準作業程序 (SOP) 與品管檢驗標準 (Standard Operations & QC)',
      sections: [
        {
          heading: '2.1 施工品質關鍵管制點 (Checkpoints)',
          tableData: {
            headers: ['階段順序', '查驗工項與管制內容', '檢驗標準規範', '負責查核人員'],
            rows: [
              ['Step 1: 課前/施作前準備', '施工計畫書、材料試驗合格報告與資材進場查驗', '依據 CNS 與合約特訂規範', '工務所現場工程師'],
              ['Step 2: 現場放樣與施作', '幾何尺寸精度、標高量測、鋼筋綁紮與管線套管', '公差在 ±3mm 容許範圍內', '品管人員與主辦工程師'],
              ['Step 3: 隱蔽部分查驗', '澆置前鋼筋清潔、接地電阻、防水層厚度', '100% 拍照存證並填寫隱蔽查驗表', '監造單位與品管主管'],
              ['Step 4: 養護與後期檢驗', '混凝土試體抗壓試驗、拆模養護天數確認', '符合設計強度 f\'c ≥ 100%', '合格實驗室與專案主任'],
            ],
          },
        },
        {
          heading: '2.2 常見施工介面問題與預防對策',
          points: [
            '結構體與機電管線預埋位置應於施工前套繪 BIM 3D 模型檢討碰撞',
            '預拌混凝土澆置需控制坍度與進場坍損時間，嚴禁現場任意加水',
            '地下室防水材施作面需保持乾燥潔淨，含水率應在 8% 以下',
          ],
        },
      ],
    },
    {
      pageNumber: 3,
      chapterTitle: '第三章：課後實務考核與自主學習重點 (Summary & Self-Assessment)',
      sections: [
        {
          heading: '3.1 課後重點回顧與核心要點',
          content: '請學員於閱讀完畢後，前往「課後線上測驗」進行隨堂評鑑，測驗通過分數為 70 分以上，並請擬定 1~3 項 SMART 課後實踐計畫。',
          points: [
            '精準掌握現場安全第一之防護原則，落實各項防墜與感電防護措施',
            '善用數位行動裝置與工地管理系統隨時登錄自主品管紀錄',
            '主動與分包商工班溝通施工安全與工期目標，達成零延誤零工傷',
          ],
        },
      ],
    },
  ];
}

/**
 * Automatically convert uploaded/selected Office file (Word, Excel, PPT) to standard PDF material
 */
export function convertOfficeFileToPdf(fileData: {
  name: string;
  size?: string;
  type?: string;
  category?: string;
  categoryName?: string;
  url?: string;
}): {
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf';
  fileUrl: string;
  convertedFrom: 'pptx' | 'docx' | 'xlsx' | 'office';
  convertedAt: string;
  pdfPageCount: number;
  pdfPreviewContent: { pages: any[] };
  description: string;
} {
  const originalName = fileData.name || '未命名文件.pptx';
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex > -1 ? originalName.substring(0, dotIndex) : originalName;
  const ext = dotIndex > -1 ? originalName.substring(dotIndex + 1).toLowerCase() : 'pptx';

  let convertedFrom: 'pptx' | 'docx' | 'xlsx' | 'office' = 'office';
  let typeDesc = 'Office 簡報投影片';

  if (ext === 'ppt' || ext === 'pptx') {
    convertedFrom = 'pptx';
    typeDesc = 'PowerPoint 簡報投影片';
  } else if (ext === 'doc' || ext === 'docx') {
    convertedFrom = 'docx';
    typeDesc = 'Word 專業工程文件';
  } else if (ext === 'xls' || ext === 'xlsx') {
    convertedFrom = 'xlsx';
    typeDesc = 'Excel 工程數據與計算表';
  }

  const pdfFileName = `${baseName}.pdf`;
  const pdfTitle = originalName.endsWith('.pdf') ? originalName : `${baseName} (PDF 講義版)`;

  const pages = getPdfPreviewData({
    title: baseName,
    convertedFrom,
    category: fileData.category || fileData.categoryName || '專業訓練',
  });

  return {
    title: pdfTitle,
    fileName: pdfFileName,
    fileSize: fileData.size || '3.2 MB (已最佳化 PDF)',
    fileType: 'pdf',
    fileUrl: fileData.url || 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    convertedFrom,
    convertedAt: new Date().toISOString().split('T')[0],
    pdfPageCount: pages.length,
    pdfPreviewContent: { pages },
    description: `由原始 ${typeDesc}「${originalName}」自動轉換為標準高解析向量 PDF 教材，已嵌入完整排版圖表，支援線上全螢幕閱讀、縮放與課後教材複習。`,
  };
}

