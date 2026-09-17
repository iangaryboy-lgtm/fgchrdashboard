const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>遠雄營造 案主管戰情儀表板前後台欄位對接與現場PK遴選作業評估建議書</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 210mm 297mm;
    margin: 25mm 25mm 25mm 25mm;
  }
  body {
    font-family: '微軟正黑體', 'Microsoft JhengHei', 'PingFang TC', sans-serif;
    color: #1e293b;
    line-height: 1.7;
    font-size: 11pt;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }
  .container {
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .doc-badge {
    color: #1e40af;
    font-size: 13pt;
    font-weight: bold;
    margin-bottom: 8px;
  }
  h1.doc-title {
    color: #102a54;
    font-size: 22pt;
    line-height: 1.3;
    font-weight: 800;
    margin: 0 0 24px 0;
    border-bottom: 3px solid #102a54;
    padding-bottom: 16px;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }
  .meta-table th, .meta-table td {
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    font-size: 10.5pt;
  }
  .meta-table th {
    background-color: #f1f5f9;
    color: #0f172a;
    width: 22%;
    text-align: left;
    font-weight: bold;
  }
  .callout {
    background-color: #f8fafc;
    border-left: 5px solid #1e40af;
    padding: 16px 20px;
    margin: 24px 0;
    border-radius: 4px;
  }
  .callout-title {
    font-weight: bold;
    color: #102a54;
    font-size: 11.5pt;
    margin-bottom: 8px;
  }
  h2 {
    color: #102a54;
    font-size: 16pt;
    margin-top: 36px;
    margin-bottom: 16px;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 8px;
  }
  h3 {
    color: #1e40af;
    font-size: 13pt;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  h4 {
    color: #334155;
    font-size: 11.5pt;
    margin-top: 18px;
    margin-bottom: 8px;
  }
  p {
    margin: 10px 0;
    text-align: justify;
  }
  ul, ol {
    margin: 8px 0 16px 24px;
    padding: 0;
  }
  li {
    margin-bottom: 8px;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 10px 12px;
    font-size: 10pt;
  }
  table.data-table th {
    background-color: #102a54;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
  }
  .code-box {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #64748b;
    padding: 14px 16px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    color: #0f172a;
    overflow-x: auto;
    margin: 14px 0;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .tag-green { color: #059669; font-weight: bold; }
  .tag-orange { color: #d97706; font-weight: bold; }
  .tag-red { color: #dc2626; font-weight: bold; }
  .footer-sign {
    text-align: right;
    margin-top: 50px;
    font-weight: bold;
    color: #102a54;
    font-size: 12pt;
  }
  .download-bar {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .download-btn {
    background-color: #2563eb;
    color: white;
    text-decoration: none;
    font-weight: bold;
    padding: 10px 18px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    font-size: 10.5pt;
  }
  .download-btn:hover {
    background-color: #1d4ed8;
  }
  .download-btn-secondary {
    background-color: #059669;
  }
  .download-btn-secondary:hover {
    background-color: #047857;
  }
  @media print {
    .download-bar { display: none; }
    .container { max-width: 100%; padding: 0; }
  }
</style>
</head>
<body>

<div class="container">

  <!-- Download Navigation Toolbar (Visible in Browser) -->
  <div class="download-bar">
    <div>
      <div style="font-size: 14pt; font-weight: bold; margin-bottom: 4px;">遠雄營造 案主管戰情系統評估建議書</div>
      <div style="font-size: 9.5pt; color: #94a3b8;">請點選右側按鈕立即下載 Word 檔或直接於本頁列印呈報</div>
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="/api/download-assessment-docx" download="遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.docx" class="download-btn">
        📥 下載標準 Word 檔 (.docx)
      </a>
      <a href="/遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc" download="遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc" class="download-btn download-btn-secondary">
        📄 下載相容版 Word 檔 (.doc)
      </a>
      <button onclick="window.print()" class="download-btn" style="background-color: #475569;">
        🖨️ 列印 / 存為 PDF
      </button>
    </div>
  </div>

  <div class="doc-badge">【專案評估與規劃建議書】</div>
  <h1 class="doc-title">遠雄營造 案主管戰情儀表板前後台欄位對接<br>與現場 PK 遴選作業評估建議書</h1>

  <table class="meta-table">
    <tr>
      <th>呈報主管 / 對象</th>
      <td>營造總經理室、工務部室主管、人力資源室、專案主管遴選委員會</td>
    </tr>
    <tr>
      <th>評估核心範疇</th>
      <td>① 開案計畫儀表板 ② 案主管人才庫儀表板 ③ 案主管供需儀表板 ④ 批次匯入規格 ⑤ 現場PK遴選定案作業</td>
    </tr>
    <tr>
      <th>出具報告日期</th>
      <td>2026 年 9 月 15 日</td>
    </tr>
  </table>

  <div class="callout">
    <div class="callout-title">【執行摘要 (Executive Summary)】</div>
    <div>本評估報告旨在落實「依照實際可執行的功能進行開發，避免因虛擬假畫面導致誤判，確保正式上線可行」。針對遠雄營造現行三大核心戰情看板進行深度盤點，確立「後台批次匯入落地模式」與「案主管現場 PK 遴選定案機制」，讓前台儀表板所展示之工程績效、歷練年資與人選派任皆能由真實後台資料支撐，實現即時決策閉環。</div>
  </div>

  <h2>壹、 評估背景與系統落地核心指導原則</h2>
  <p>先前為了向經營層展示前台儀表板之強大視覺互動性，前台已成功構建了「開案計畫總表」、「案主管人才庫交叉篩選」、「專案實績綜合評比成績單」、「主管 4 大指標 PK 決策總表」以及「5 年 20 季度供需平衡戰情看板」。</p>
  <p>為由前期展示階段順利推進至正式營運階段，必須嚴格落實前後台資料架構之完全對接，避免因「前台有展示但後台無欄位」造成正式上線時因無法維護而淪為空殼系統。本報告遵循三大指導原則：</p>
  <ul>
    <li><strong>1. 以實務可執行為唯一準繩：</strong>拒絕無法串接或完全虛擬之假資料，確保所有欄位均有明確之後台維護途徑與資料責任歸屬。</li>
    <li><strong>2. 以後台「批次貼入／匯入 (Batch Import)」為主要推進途徑：</strong>考量現行 HR 與工務企劃室之 Excel 作業習慣，所有缺漏欄位優先設計為 Excel / TSV 批次貼入規格，大幅降低維護門檻。</li>
    <li><strong>3. 建立「現場決策回寫」機制：</strong>案主管遴選會議時，系統應支援在 PK 畫面中直接選定主管，並即時雙向回寫開案計畫與人才庫狀態，完成真正的行政與決策一體化。</li>
  </ul>

  <h2>貳、 三大前台儀表板與後台資訊對接檢視結果</h2>

  <h3>一、 開案計畫儀表板 (ProjectPlanDashboard)</h3>
  <p><strong>【前台展示資訊】：</strong>涵蓋案場代碼、區域、建築類型（住宅/廠辦/商辦/專案）、規模級距、樓地板面積、地上地下層數、戶數、重要日程（C-45 遴選日、C 建照日、C+75/90 開工日、使照日 F、F+150 標準釋出日）、合建都更、防綜案、危評案、特殊工法、售價造價，以及「派任主管工號與姓名標籤」。</p>
  <p><strong>【後台現況】：</strong>後台已具備「ProjectPlanSettings (開案計畫設定)」，支援單筆編輯與大量 TSV 貼入匯入，工程規格對接率達 90%。</p>
  <p><strong>【重大缺漏與風險】：</strong>後台開案計畫維護表單與批次匯入中，缺少「派任案主管 (matchedLeaderEmpNo, matchedLeaderName)」之輸入欄位。後台無法手動指定或鎖定某案場已定案之主管，導致前台只能顯示預設值或公式自動配對結果。</p>

  <h3>二、 案主管人才庫儀表板 (CandidateTalentDashboard)</h3>
  <p><strong>【前台展示資訊】：</strong>涵蓋人員基本名冊、4 大維度交叉篩選、7 大工程階段歷練年資、近 3 年考績聯徵、個人履歷總表、主管相片、4 大專案指標評分 (50%/25%/25%)、前三案專案實績成績單（自負盈虧、使照與交屋工期達成率、客訴率、追加率、職安罰款與停工、法律事件）、調動意願與工法專長。</p>
  <p><strong>【後台現況】：</strong>後台「CandidatePoolSettings」已具備基本步驟（挑選人員、管理年資與釋出狀態、經歷案場清單、年度考績、相片管理），對接率約 55%。</p>
  <p><strong>【重大缺漏與風險】：</strong>目前後台完全缺少以下 4 組核心實務數據之維護欄位：</p>
  <ul>
    <li>• 七大工程階段歷練年資（案前/假設/基樁/結構/裝修/景觀/交屋），前台目前為系統假定值。</li>
    <li>• 遴選 4 大專案指標評分（工程經歷 50%、管理職能 25%、人格特質 25%、總分）。</li>
    <li>• 前三案工程細部成績單（自負盈虧淨利率、工期達成率、客訴率、營造追加金額與追加率、職安裁罰金額與停工次數、法律事件）。</li>
    <li>• 主管可調動區域、可接受規模與特殊工法之人工維護與校正欄位。</li>
  </ul>

  <h3>三、 案主管供需儀表板 (QuarterlyDemandDashboard)</h3>
  <p><strong>【前台展示資訊】：</strong>涵蓋未來 5 年（20 季度）工程端主管總需求（新開案、在建案、使照案）與人才端供給梯隊（可釋出、一年內預計釋出、培育中儲備、現職穩定主管），並提供淨差額警示與點擊鑽取案場與人選名單。</p>
  <p><strong>【後台現況】：</strong>供需數據由開案計畫時程與人才庫狀態聯徵演算，底層具備強健動態模型，對接率達 85%。</p>
  <p><strong>【缺漏分析】：</strong>當遇有高層特殊調度政策（例如：特定年度暫緩新開案，或因外部專案需策略性外調主管）時，缺少「特定季度供需數值手動覆蓋 (Quarterly Overrides)」之微調介面。</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>前台儀表板模組</th>
        <th>目前對接率</th>
        <th>現有後台對接狀態</th>
        <th>建議補足之關鍵缺漏</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>開案計畫儀表板</strong></td>
        <td class="tag-green" align="center">90%</td>
        <td>ProjectPlanSettings 支援規格與時程維護</td>
        <td class="tag-red">派任主管工號與姓名 (matchedLeaderEmpNo / Name)</td>
      </tr>
      <tr>
        <td><strong>案主管人才庫儀表板</strong><br><span style="font-size: 8.5pt; color: #64748b;">(含成績單與PK表)</span></td>
        <td class="tag-orange" align="center">55%</td>
        <td>CandidatePoolSettings 支援基本年資/考績/相片</td>
        <td class="tag-red">7大階段歷練年資、4大指標評分、前三案細部工程成績單、調動專長</td>
      </tr>
      <tr>
        <td><strong>案主管供需儀表板</strong></td>
        <td class="tag-green" align="center">85%</td>
        <td>由開案計畫與人才庫動態聯徵計算，維護負擔低</td>
        <td>特殊季度供需數值手動微調覆蓋 (選填)</td>
      </tr>
    </tbody>
  </table>

  <h2>參、 缺漏欄位之後台歸屬與「批次匯入」規格規劃</h2>
  <p>為落實以「批次匯入」為主要資料維護方式之規劃，建議將缺漏欄位按模組分別置入於以下兩處後台設定介面：</p>

  <h3>一、 【後台一：開案計畫設定】(ProjectPlanSettings) 欄位擴充</h3>
  <p>在現行開案計畫設定之「批次貼入匯入」中，於文字欄位末端擴充派任主管資訊：</p>
  <ul>
    <li>1. <strong>matchedLeaderEmpNo</strong>：派任案主管員工編號 (例：FG1001)</li>
    <li>2. <strong>matchedLeaderName</strong>：派任案主管姓名與職稱註記 (例：陳冠霖 (專案經理))</li>
  </ul>
  <div class="code-box">欄位順序規範 (以 Tab 或逗號分隔)：
案別代碼 | 區域 | 遴選日 | 開工日 | 建照日 | 使照日 | 樓地板面積 | 地下層 | 地上層 | 棟數 | 戶數 | 合建都更 | 防綜案 | 危評案 | 特殊工法 | 售價 | 造價 | 規模類型 | 建築類型 | 開案年 | 開案季 | 所屬部室 | 科案 | 景觀VIP | 地下室面積 | 下架啟動 | [新增]派任主管工號 | [新增]派任主管姓名</div>

  <h3>二、 【後台二：案主管背景設定】(CandidatePoolSettings) 規劃新增 3 個批次匯入模組</h3>

  <h4>1. 規劃新增【步驟 2-1-6：批次匯入七大階段歷練年資】</h4>
  <p>用於支撐人才庫總表展開七大階段及個人履歷總表之精確歷練年資，每人一行：</p>
  <div class="code-box">員工編號    案前管理(年)  假設階段(年)  基坑土方(年)  結構體(年)  裝修(年)  景觀公設(年)  交屋(年)
FG1001      0.5           1.2           0.8           2.5         2.0       0.8           1.2
FG1002      0.3           1.0           1.2           3.0         1.8       0.6           1.0</div>

  <h4>2. 規劃新增【步驟 2-1-7：批次匯入 4 大專案指標與前三案工程實績成績單】</h4>
  <p>用於支撐 A3 橫式 PK 評選決策表與專案實績成績單。分為兩種維度：</p>
  <p><strong>【維度 A：候選人 4 大指標 PK 評分總表 (每人一行)】：</strong></p>
  <div class="code-box">員工編號    工程經歷分數(50%)  管理職能分數(25%)  人格特質分數(25%)  總分
FG1001      48.5               22.0               21.5               92.0
FG1002      45.0               23.5               20.0               88.5</div>

  <p><strong>【維度 B：前三案細部工程實績成績單 (每人 1~3 行，每行代表一案)】：</strong></p>
  <div class="code-box">員工編號 | 經歷案號 | 規模類型 | 擔任角色 | 序次標籤 | 自負盈虧淨利率% | 使照總工期天數 | 使照超前落後天數 | 使照達成率% | 交屋戶數比 | 品質監理分 | 近三年客訴率% | 營造追加率% | 累計追加金額 | 職安監理分 | 停工次數 | 罰款金額 | 法律事件說明
FG1001   | FG-TY01案 | 大型廠辦 | 案主管   | 前一案   | 8.5%            | 1000           | +20             | 102.0%      | 320/320    | 92.5       | 0.8%          | 0.12%        | 11200000     | 93.5       | 0        | 0        | 無</div>

  <h4>3. 擴充現有【步驟 2-1-2：批次更新人員背景資訊】</h4>
  <p>在現有之工號、管理年資、完案數、釋出狀態與釋出日之基礎上，於後方追加調動意願與專長：</p>
  <div class="code-box">員工編號 | 內部管理起算日 | 完案數 | 釋出狀態 | 標準釋出日 | 釋出季度 | 人選分類 | [新增]可調動區域 | [新增]可承接規模 | [新增]特殊工法經驗
FG1001   | 2018-05-01     | 5      | 現任主管-已達標準釋出 | 2026/7/28 | 2026Q3 | 現任主管 | 北區,中區 | 大型案,中型案 | 深開挖,帷幕牆</div>

  <h2>肆、 案主管 PK 遴選現場直接選定主管並置入案場之建議與作業流程</h2>
  <div class="callout">
    <div class="callout-title">【評估結論：極力強烈建議設立】</div>
    <div>在案主管 PK 遴選作業時設立「現場選定並置入該案場」功能，具備極高之實務管理價值。現行系統在比評完後僅能關閉或匯出 PDF，缺乏行政閉環；若增加現場選定按鈕與雙向回寫機制，將使本系統直接升級為「遠雄高階決策會議協同系統」，會議當場定案即完成全系統資料同步。</div>
  </div>

  <h3>一、 完整現場作業流程設計 (5 步驟閉環)</h3>
  <ul>
    <li><strong>步驟 1. 發起遴選：</strong>於開案計畫儀表板中，針對即將開案之案場（例：FG-TC01案，距離遴選剩餘 45 天）點擊【推薦主管評選 PK】按鈕。</li>
    <li><strong>步驟 2. 現場審查：</strong>系統彈出 A3 橫式「3人版型 PK 決策總表」，投影至會議室，與會委員同步檢視候選人之 4 大指標、前三案成績單與 7 大階段歷練。</li>
    <li><strong>步驟 3. 現場定案指派：</strong>經遴選委員會決議後，主席或 HR 秘書直接在選定之人選欄位下方點擊【★ 現場選定為本案主管】按鈕。</li>
    <li><strong>步驟 4. 二次確認與備註紀錄：</strong>系統彈出確認對話框，核對案場與主管資訊，並可輸入會議紀錄備註（例：「經 2026/09 遴選委員會評選第一名全票通過」），點擊【確認定案派任】。</li>
    <li><strong>步驟 5. 系統雙向回寫連動：</strong>系統自動於背景同步回寫兩大資料表，並更新前台三大儀表板。</li>
  </ul>

  <h3>二、 系統雙向回寫與連動機制 (Two-Way Sync)</h3>
  <p>點擊定案後，系統將自動執行下列三項即時連動：</p>
  <ul>
    <li>1. <strong>回寫【開案計畫】(ProjectPlan)：</strong>將該案場之 matchedLeaderEmpNo 設為選定主管工號、matchedLeaderName 設為主管姓名，該案場標籤即時轉為「已派任：陳冠霖 (專案經理)」。</li>
    <li>2. <strong>連動【人才庫資料】(CandidateProfile)：</strong>將該主管之現職案場 (currentProject) 更新為該新案場代碼，供需狀態標籤 (talentPoolStatus) 自動更新為「現職穩定 (新派任)」，並扣除其可釋出狀態，避免一人雙派。</li>
    <li>3. <strong>連動【案主管供需儀表板】(QuarterlyDemandDashboard)：</strong>該案場對應季度之「新開案主管需求」立即與選定人選完成對沖配對，該季度的缺口警示紅燈立即消除轉為綠燈！</li>
  </ul>

  <h3>三、 防呆與稽核軌跡 (Audit Trail) 設計</h3>
  <ul>
    <li>• <strong>重複派任防呆：</strong>若該主管在其他案場之工期尚未達釋出條件，系統跳出黃色警示提示預計釋出日，由管理者確認是否進行提前調動。</li>
    <li>• <strong>指派撤銷與變更機制：</strong>開案計畫設定中提供「更換主管」或「解除派任」功能，以因應特殊人事異動需求。</li>
    <li>• <strong>自動產出遴選紀要 PDF：</strong>完成現場選定後，系統可自動匯出一張包含「案場規格、3 人 PK 成績、最終核定主管與會議備註」之《遠雄營造 案主管遴選核定決策紀要 A3 PDF》，可直接作為簽呈與歸檔依據。</li>
  </ul>

  <h2>伍、 執行步驟與推進排程建議</h2>
  <p>為利儘速向主管回報並取得確認，建議後續分三階段依序推進：</p>
  <ul>
    <li><strong>階段 1 (即刻)：【第一階段：規格確認】</strong>向主管提報本建議書，確認缺漏欄位之定義（如 7 大階段、前三案成績單指標）與 Excel 批次貼入格式。</li>
    <li><strong>階段 2 (第一週)：【第二階段：後台批次匯入擴充】</strong>在後台開案計畫與候選人設定中，實作上述批次貼入介面，並配置資料驗證與空值防禦機制。</li>
    <li><strong>階段 3 (第二週)：【第三階段：PK 現場選定功能落地】</strong>在 CandidatePKModal 中加入「現場選定為本案主管」按鈕與雙向資料庫連動回寫，完成完整決策閉環。</li>
  </ul>

  <div class="footer-sign">
    遠雄營造 人力資源室 / 工務企劃室 謹呈
  </div>

</div>

</body>
</html>
`;

// Write to public/download-report.html and public/遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc
fs.writeFileSync(path.join(publicDir, 'download-report.html'), htmlContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, '遠雄營造_案主管儀表板前後台欄位對接與PK遴選作業評估建議書.doc'), htmlContent, 'utf-8');
console.log('Successfully generated download-report.html and .doc file');
