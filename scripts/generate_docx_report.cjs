const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const NAVY = '102A54';
const BLUE = '1E40AF';
const SLATE_DARK = '1E293B';
const SLATE_TEXT = '334155';
const SLATE_LIGHT = 'F1F5F9';
const BORDER_COLOR = 'CBD5E1';

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32, // 16pt
        color: NAVY,
        font: 'Microsoft JhengHei',
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: BLUE,
        font: 'Microsoft JhengHei',
      }),
    ],
  });
}

function createHeading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: SLATE_DARK,
        font: 'Microsoft JhengHei',
      }),
    ],
  });
}

function createBodyP(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80, line: 320 },
    children: [
      new TextRun({
        text,
        size: 21, // 10.5pt
        color: options.color || SLATE_TEXT,
        bold: options.bold || false,
        font: 'Microsoft JhengHei',
      }),
    ],
  });
}

// Universal hanging indent bullet to avoid XML numPr schema mismatch
function createBulletP(text, options = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 60, line: 300 },
    indent: { left: 480, hanging: 240 },
    children: [
      new TextRun({
        text: options.prefix || '• ',
        bold: true,
        size: 21,
        color: options.prefixColor || NAVY,
        font: 'Microsoft JhengHei',
      }),
      new TextRun({
        text,
        size: 21,
        color: SLATE_TEXT,
        font: 'Microsoft JhengHei',
      }),
    ],
  });
}

function createCallout(title, body) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: BLUE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            margins: { top: 140, bottom: 140, left: 200, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 22,
                    color: NAVY,
                    font: 'Microsoft JhengHei',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 300 },
                children: [
                  new TextRun({
                    text: body,
                    size: 20,
                    color: SLATE_TEXT,
                    font: 'Microsoft JhengHei',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCodeBlock(linesArray) {
  const paragraphs = linesArray.map((line) => {
    return new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({
          text: line,
          size: 19,
          color: '0F172A',
          font: 'Consolas',
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      left: { style: BorderStyle.SINGLE, size: 16, color: '64748B' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: paragraphs,
          }),
        ],
      }),
    ],
  });
}

// Build Document
const doc = new Document({
  creator: '遠雄營造人力資源室 / 工務企劃室',
  title: '遠雄營造 案主管儀表板前後台欄位對接與PK遴選作業評估建議書',
  description: '開案計畫儀表板、案主管人才庫儀表板、案主管供需儀表板之前後台欄位對接、批次匯入規格與現場PK遴選定案機制評估報告',
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: '遠雄營造 HR MASTER PRO · 案主管戰情系統評估報告',
                  size: 16,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '第 ',
                  size: 18,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
                new TextRun({
                  text: ' 頁 / 共 ',
                  size: 18,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 18,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
                new TextRun({
                  text: ' 頁 · 機密文件 請勿外流',
                  size: 18,
                  color: '94A3B8',
                  font: 'Microsoft JhengHei',
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title Block
        new Paragraph({
          spacing: { before: 0, after: 100 },
          children: [
            new TextRun({
              text: '【專案評估與規劃建議書】',
              bold: true,
              size: 24,
              color: BLUE,
              font: 'Microsoft JhengHei',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 80 },
          children: [
            new TextRun({
              text: '遠雄營造 案主管戰情儀表板前後台欄位對接',
              bold: true,
              size: 38,
              color: NAVY,
              font: 'Microsoft JhengHei',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: '與現場 PK 遴選作業評估建議書',
              bold: true,
              size: 38,
              color: NAVY,
              font: 'Microsoft JhengHei',
            }),
          ],
        }),

        // Metadata Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 22, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: SLATE_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '呈報主管 / 對象', bold: true, size: 19, color: SLATE_DARK, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  width: { size: 78, type: WidthType.PERCENTAGE },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '營造總經理室、工務部室主管、人力資源室、專案主管遴選委員會', size: 19, color: SLATE_TEXT, font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 22, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: SLATE_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '評估核心範疇', bold: true, size: 19, color: SLATE_DARK, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  width: { size: 78, type: WidthType.PERCENTAGE },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '① 開案計畫儀表板 ② 案主管人才庫儀表板 ③ 案主管供需儀表板 ④ 批次匯入規格 ⑤ 現場PK遴選定案作業', size: 19, color: SLATE_TEXT, font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 22, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: SLATE_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '出具報告日期', bold: true, size: 19, color: SLATE_DARK, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  width: { size: 78, type: WidthType.PERCENTAGE },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '2026 年 9 月 15 日', size: 19, color: SLATE_TEXT, font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 140, after: 140 } }),

        // Executive Summary Callout
        createCallout(
          '【執行摘要 (Executive Summary)】',
          '本評估報告旨在落實「依照實際可執行的功能進行開發，避免因虛擬假畫面導致誤判，確保正式上線可行」。針對遠雄營造現行三大核心戰情看板進行深度盤點，確立「後台批次匯入落地模式」與「案主管現場 PK 遴選定案機制」，讓前台儀表板所展示之工程績效、歷練年資與人選派任皆能由真實後台資料支撐，實現即時決策閉環。'
        ),

        // Section 1
        createHeading1('壹、 評估背景與系統落地核心指導原則'),
        createBodyP('先前為了向經營層展示前台儀表板之強大視覺互動性，前台已成功構建了「開案計畫總表」、「案主管人才庫交叉篩選」、「專案實績綜合評比成績單」、「主管 4 大指標 PK 決策總表」以及「5 年 20 季度供需平衡戰情看板」。'),
        createBodyP('為由前期展示階段順利推進至正式營運階段，必須嚴格落實前後台資料架構之完全對接，避免因「前台有展示但後台無欄位」造成正式上線時因無法維護而淪為空殼系統。本報告遵循三大指導原則：'),
        createBulletP('以實務可執行為唯一準繩：拒絕無法串接或完全虛擬之假資料，確保所有欄位均有明確之後台維護途徑與資料責任歸屬。', { prefix: '1. ' }),
        createBulletP('以後台「批次貼入／匯入 (Batch Import)」為主要推進途徑：考量現行 HR 與工務企劃室之 Excel 作業習慣，所有缺漏欄位優先設計為 Excel / TSV 批次貼入規格，大幅降低維護門檻。', { prefix: '2. ' }),
        createBulletP('建立「現場決策回寫」機制：案主管遴選會議時，系統應支援在 PK 畫面中直接選定主管，並即時雙向回寫開案計畫與人才庫狀態，完成真正的行政與決策一體化。', { prefix: '3. ' }),

        // Section 2
        createHeading1('貳、 三大前台儀表板與後台資訊對接檢視結果'),

        createHeading2('一、 開案計畫儀表板 (ProjectPlanDashboard)'),
        createBodyP('【前台展示資訊】：涵蓋案場代碼、區域、建築類型（住宅/廠辦/商辦/專案）、規模級距、樓地板面積、地上地下層數、戶數、重要日程（C-45 遴選日、C 建照日、C+75/90 開工日、使照日 F、F+150 標準釋出日）、合建都更、防綜案、危評案、特殊工法、售價造價，以及「派任主管工號與姓名標籤」。'),
        createBodyP('【後台現況】：後台已具備「ProjectPlanSettings (開案計畫設定)」，支援單筆編輯與大量 TSV 貼入匯入，工程規格對接率達 90%。'),
        createBodyP('【重大缺漏與風險】：後台開案計畫維護表單與批次匯入中，缺少「派任案主管 (matchedLeaderEmpNo, matchedLeaderName)」之輸入欄位。後台無法手動指定或鎖定某案場已定案之主管，導致前台只能顯示預設值或公式自動配對結果。'),

        createHeading2('二、 案主管人才庫儀表板 (CandidateTalentDashboard)'),
        createBodyP('【前台展示資訊】：涵蓋人員基本名冊、4 大維度交叉篩選、7 大工程階段歷練年資、近 3 年考績聯徵、個人履歷總表、主管相片、4 大專案指標評分 (50%/25%/25%)、前三案專案實績成績單（自負盈虧、使照與交屋工期達成率、客訴率、追加率、職安罰款與停工、法律事件）、調動意願與工法專長。'),
        createBodyP('【後台現況】：後台「CandidatePoolSettings」已具備基本步驟（挑選人員、管理年資與釋出狀態、經歷案場清單、年度考績、相片管理），對接率約 55%。'),
        createBodyP('【重大缺漏與風險】：目前後台完全缺少以下 4 組核心實務數據之維護欄位：'),
        createBulletP('七大工程階段歷練年資（案前/假設/基樁/結構/裝修/景觀/交屋），前台目前為系統假定值。', { prefix: '• ' }),
        createBulletP('遴選 4 大專案指標評分（工程經歷 50%、管理職能 25%、人格特質 25%、總分）。', { prefix: '• ' }),
        createBulletP('前三案工程細部成績單（自負盈虧淨利率、工期達成率、客訴率、營造追加金額與追加率、職安裁罰金額與停工次數、法律事件）。', { prefix: '• ' }),
        createBulletP('主管可調動區域、可接受規模與特殊工法之人工維護與校正欄位。', { prefix: '• ' }),

        createHeading2('三、 案主管供需儀表板 (QuarterlyDemandDashboard)'),
        createBodyP('【前台展示資訊】：涵蓋未來 5 年（20 季度）工程端主管總需求（新開案、在建案、使照案）與人才端供給梯隊（可釋出、一年內預計釋出、培育中儲備、現職穩定主管），並提供淨差額警示與點擊鑽取案場與人選名單。'),
        createBodyP('【後台現況】：供需數據由開案計畫時程與人才庫狀態聯徵演算，底層具備強健動態模型，對接率達 85%。'),
        createBodyP('【缺漏分析】：當遇有高層特殊調度政策（例如：特定年度暫緩新開案，或因外部專案需策略性外調主管）時，缺少「特定季度供需數值手動覆蓋 (Quarterly Overrides)」之微調介面。'),

        // Summary Comparison Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: NAVY },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '前台儀表板模組', bold: true, size: 20, color: 'FFFFFF', font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: NAVY },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '目前對接率', bold: true, size: 20, color: 'FFFFFF', font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: NAVY },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '現有後台對接狀態', bold: true, size: 20, color: 'FFFFFF', font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: NAVY },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '建議補足之關鍵缺漏', bold: true, size: 20, color: 'FFFFFF', font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '開案計畫儀表板', bold: true, size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '90%', bold: true, color: '059669', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'ProjectPlanSettings 支援規格與時程維護', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '派任主管工號與姓名 (matchedLeaderEmpNo / Name)', size: 19, color: 'DC2626', font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: '案主管人才庫儀表板', bold: true, size: 19, font: 'Microsoft JhengHei' })] }),
                    new Paragraph({ children: [new TextRun({ text: '(含成績單與PK表)', size: 17, color: '64748B', font: 'Microsoft JhengHei' })] }),
                  ],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '55%', bold: true, color: 'D97706', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'CandidatePoolSettings 支援基本年資/考績/相片', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '7大階段歷練年資、4大指標評分、前三案細部工程成績單、調動專長', size: 19, color: 'DC2626', font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '案主管供需儀表板', bold: true, size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '85%', bold: true, color: '059669', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '由開案計畫與人才庫動態聯徵計算，維護負擔低', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: '特殊季度供需數值手動微調覆蓋 (選填)', size: 19, font: 'Microsoft JhengHei' })] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 180, after: 180 } }),

        // Section 3
        createHeading1('參、 缺漏欄位之後台歸屬與「批次匯入」規格規劃'),
        createBodyP('為落實以「批次匯入」為主要資料維護方式之規劃，建議將缺漏欄位按模組分別置入於以下兩處後台設定介面：'),

        createHeading2('一、 【後台一：開案計畫設定】(ProjectPlanSettings) 欄位擴充'),
        createBodyP('在現行開案計畫設定之「批次貼入匯入」中，於文字欄位末端擴充派任主管資訊：'),
        createBulletP('matchedLeaderEmpNo：派任案主管員工編號 (例：FG1001)', { prefix: '1. ' }),
        createBulletP('matchedLeaderName：派任案主管姓名與職稱註記 (例：陳冠霖 (專案經理))', { prefix: '2. ' }),
        createBodyP('【批次貼入文字欄位順序規範】：'),
        createCodeBlock([
          '欄位順序規範 (以 Tab 或逗號分隔)：',
          '案別代碼 | 區域 | 遴選日 | 開工日 | 建照日 | 使照日 | 樓地板面積 | 地下層 | 地上層 | 棟數 | 戶數 | 合建都更 | 防綜案 | 危評案 | 特殊工法 | 售價 | 造價 | 規模類型 | 建築類型 | 開案年 | 開案季 | 所屬部室 | 科案 | 景觀VIP | 地下室面積 | 下架啟動 | [新增]派任主管工號 | [新增]派任主管姓名',
        ]),

        createHeading2('二、 【後台二：案主管背景設定】(CandidatePoolSettings) 規劃新增 3 個批次匯入模組'),

        createHeading3('1. 規劃新增【步驟 2-1-6：批次匯入七大階段歷練年資】'),
        createBodyP('用於支撐人才庫總表展開七大階段及個人履歷總表之精確歷練年資，每人一行：'),
        createCodeBlock([
          '員工編號    案前管理(年)  假設階段(年)  基坑土方(年)  結構體(年)  裝修(年)  景觀公設(年)  交屋(年)',
          'FG1001      0.5           1.2           0.8           2.5         2.0       0.8           1.2',
          'FG1002      0.3           1.0           1.2           3.0         1.8       0.6           1.0',
        ]),

        createHeading3('2. 規劃新增【步驟 2-1-7：批次匯入 4 大專案指標與前三案工程實績成績單】'),
        createBodyP('用於支撐 A3 橫式 PK 評選決策表與專案實績成績單。分為兩種維度：'),
        createBodyP('【維度 A：候選人 4 大指標 PK 評分總表 (每人一行)】：'),
        createCodeBlock([
          '員工編號    工程經歷分數(50%)  管理職能分數(25%)  人格特質分數(25%)  總分',
          'FG1001      48.5               22.0               21.5               92.0',
          'FG1002      45.0               23.5               20.0               88.5',
        ]),
        createBodyP('【維度 B：前三案細部工程實績成績單 (每人 1~3 行，每行代表一案)】：'),
        createCodeBlock([
          '員工編號 | 經歷案號 | 規模類型 | 擔任角色 | 序次標籤 | 自負盈虧淨利率% | 使照總工期天數 | 使照超前落後天數 | 使照達成率% | 交屋戶數比 | 品質監理分 | 近三年客訴率% | 營造追加率% | 累計追加金額 | 職安監理分 | 停工次數 | 罰款金額 | 法律事件說明',
          'FG1001   | FG-TY01案 | 大型廠辦 | 案主管   | 前一案   | 8.5%            | 1000           | +20             | 102.0%      | 320/320    | 92.5       | 0.8%          | 0.12%        | 11200000     | 93.5       | 0        | 0        | 無',
        ]),

        createHeading3('3. 擴充現有【步驟 2-1-2：批次更新人員背景資訊】'),
        createBodyP('在現有之工號、管理年資、完案數、釋出狀態與釋出日之基礎上，於後方追加調動意願與專長：'),
        createCodeBlock([
          '員工編號 | 內部管理起算日 | 完案數 | 釋出狀態 | 標準釋出日 | 釋出季度 | 人選分類 | [新增]可調動區域 | [新增]可承接規模 | [新增]特殊工法經驗',
          'FG1001   | 2018-05-01     | 5      | 現任主管-已達標準釋出 | 2026/7/28 | 2026Q3 | 現任主管 | 北區,中區 | 大型案,中型案 | 深開挖,帷幕牆',
        ]),

        // Section 4
        createHeading1('肆、 案主管 PK 遴選現場直接選定主管並置入案場之建議與作業流程'),

        createCallout(
          '【評估結論：極力強烈建議設立】',
          '在案主管 PK 遴選作業時設立「現場選定並置入該案場」功能，具備極高之實務管理價值。現行系統在比評完後僅能關閉或匯出 PDF，缺乏行政閉環；若增加現場選定按鈕與雙向回寫機制，將使本系統直接升級為「遠雄高階決策會議協同系統」，會議當場定案即完成全系統資料同步。'
        ),

        createHeading2('一、 完整現場作業流程設計 (5 步驟閉環)'),
        createBulletP('發起遴選：於開案計畫儀表板中，針對即將開案之案場（例：FG-TC01案，距離遴選剩餘 45 天）點擊【推薦主管評選 PK】按鈕。', { prefix: '步驟 1. ' }),
        createBulletP('現場審查：系統彈出 A3 橫式「3人版型 PK 決策總表」，投影至會議室，與會委員同步檢視候選人之 4 大指標、前三案成績單與 7 大階段歷練。', { prefix: '步驟 2. ' }),
        createBulletP('現場定案指派：經遴選委員會決議後，主席或 HR 秘書直接在選定之人選欄位下方點擊【★ 現場選定為本案主管】按鈕。', { prefix: '步驟 3. ' }),
        createBulletP('二次確認與備註紀錄：系統彈出確認對話框，核對案場與主管資訊，並可輸入會議紀錄備註（例：「經 2026/09 遴選委員會評選第一名全票通過」），點擊【確認定案派任】。', { prefix: '步驟 4. ' }),
        createBulletP('系統雙向回寫連動：系統自動於背景同步回寫兩大資料表，並更新前台三大儀表板。', { prefix: '步驟 5. ' }),

        createHeading2('二、 系統雙向回寫與連動機制 (Two-Way Sync)'),
        createBodyP('點擊定案後，系統將自動執行下列三項即時連動：'),
        createBulletP('回寫【開案計畫】(ProjectPlan)：將該案場之 matchedLeaderEmpNo 設為選定主管工號、matchedLeaderName 設為主管姓名，該案場標籤即時轉為「已派任：陳冠霖 (專案經理)」。', { prefix: '1. ' }),
        createBulletP('連動【人才庫資料】(CandidateProfile)：將該主管之現職案場 (currentProject) 更新為該新案場代碼，供需狀態標籤 (talentPoolStatus) 自動更新為「現職穩定 (新派任)」，並扣除其可釋出狀態，避免一人雙派。', { prefix: '2. ' }),
        createBulletP('連動【案主管供需儀表板】(QuarterlyDemandDashboard)：該案場對應季度之「新開案主管需求」立即與選定人選完成對沖配對，該季度的缺口警示紅燈立即消除轉為綠燈！', { prefix: '3. ' }),

        createHeading2('三、 防呆與稽核軌跡 (Audit Trail) 設計'),
        createBulletP('重複派任防呆：若該主管在其他案場之工期尚未達釋出條件，系統跳出黃色警示提示預計釋出日，由管理者確認是否進行提前調動。', { prefix: '• ' }),
        createBulletP('指派撤銷與變更機制：開案計畫設定中提供「更換主管」或「解除派任」功能，以因應特殊人事異動需求。', { prefix: '• ' }),
        createBulletP('自動產出遴選紀要 PDF：完成現場選定後，系統可自動匯出一張包含「案場規格、3 人 PK 成績、最終核定主管與會議備註」之《遠雄營造 案主管遴選核定決策紀要 A3 PDF》，可直接作為簽呈與歸檔依據。', { prefix: '• ' }),

        // Section 5
        createHeading1('伍、 執行步驟與推進排程建議'),
        createBodyP('為利儘速向主管回報並取得確認，建議後續分三階段依序推進：'),
        createBulletP('【第一階段：規格確認】向主管提報本建議書，確認缺漏欄位之定義（如 7 大階段、前三案成績單指標）與 Excel 批次貼入格式。', { prefix: '階段 1 (即刻)：' }),
        createBulletP('【第二階段：後台批次匯入擴充】在後台開案計畫與候選人設定中，實作上述批次貼入介面，並配置資料驗證與空值防禦機制。', { prefix: '階段 2 (第一週)：' }),
        createBulletP('【第三階段：PK 現場選定功能落地】在 CandidatePKModal 中加入「現場選定為本案主管」按鈕與雙向資料庫連動回寫，完成完整決策閉環。', { prefix: '階段 3 (第二週)：' }),

        new Paragraph({ spacing: { before: 240, after: 120 } }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: '遠雄營造 人力資源室 / 工務企劃室 謹呈',
              bold: true,
              size: 21,
              color: NAVY,
              font: 'Microsoft JhengHei',
            }),
          ],
        }),
      ],
    },
  ],
});

const chineseFilename = '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.docx';
const asciiFilename = 'Farglory_Talent_Dashboard_Assessment_Report.docx';

const outPathChinese = path.join(publicDir, chineseFilename);
const outPathAscii = path.join(publicDir, asciiFilename);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPathChinese, buffer);
  fs.writeFileSync(outPathAscii, buffer);
  console.log(`Document successfully regenerated (buffer length: ${buffer.length} bytes)`);
});
