# 💎 個人財務視覺化儀表板 (Personal Finance Dashboard)

> 基於 **React 18 + TypeScript + Tailwind CSS + Vite** 打造的現代 Fintech 風格個人財務儀表板。  
> 支援即時連線 **Google 試算表 (LINE Bot 記帳數據)**，自帶 **Demo 示範模式**，並支援透過 **Cloudflare Pages** 免費全球 CDN 部署。

[![Deploy with Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=flat&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ 核心特色

- 🏛️ **Revolut & Stripe 頂級金融美學**：極簡白底搭配翡翠綠（Teal）與冷靛藍（Indigo）重音，高呼吸感、1px 髮絲邊框與 Authoritative 數據層次。
- 🎭 **內建 Demo 示範模式**：初次進入或分享給朋友時，預設顯示完整的擬真消費資料，保護隱私不外洩真實帳目。
- ☁️ **Google 試算表安全即時連線**：
  - 透過 Google Apps Script `doGet` 安全 API 即時讀取 LINE Bot 記帳明細與月度彙總。
  - 金鑰與 Web App URL 僅儲存於使用者本地瀏覽器（`localStorage`），零伺服器外流風險。
- 📊 **月度支出走勢（雙視圖自由切換）**：
  - **柱狀分佈 (Bar)**：頂部圓角柱體，將「當月進行中」以專屬樣式獨立呈現，避免折線圖產生斷崖失真感。
  - **平滑趨勢 (Area)**：張力校正的自然平滑曲線與微光漸層。
- 🍩 **消費類別分佈甜甜圈圖**：
  - 懸浮 Glassmorphism 數據卡片。
  - **圖表 Drill-down 連動**：點擊扇區或類別標籤，下方明細立即無縫篩選該分類！
- 📅 **專屬「每月花費分析」分頁**：
  - 全年月份各類別堆疊柱狀圖（Stacked Bar Chart），一眼洞察消費結構跨月變化。
  - 月份摘要卡片 Grid（各月總額 + 前三大開銷類別小進度條）。
- ⏱️ **本月消費進度感知 (Burn Rate)**：
  - 顯示當月已過天數百分比、日均開銷速度（NT$/天）與月底推估結算額。
  - 自動對比「近半年平均生活水準」，超標時自動以橘/紅溫和提醒。
- 💡 **生活消費純演算洞察**：
  - 不耗費 AI API，前端純演算法自動推算「週末 vs 平日開銷比」、「最花錢的一天」與「類別月增減變化」。
- 🛡️ **日常模式開關**：
  - 一鍵排除單筆 ≥ NT$5,000 的非固定大額支出（如保費、出國、買 3C），還原純粹的三餐生活現金流。
- 📱 **手機版 RWD 完美適配**：響應式精簡 Header、自動吸頂 Tab 導覽，手機操作流暢不跑版。

---

## 🏗️ 專案結構

```text
account_web/
├── public/
│   └── _redirects             # Cloudflare Pages SPA 路由跳轉設定
├── src/
│   ├── components/
│   │   ├── Header.tsx         # 頂部導覽、連線燈號與記一筆按鈕
│   │   ├── MetricCards.tsx    # 4 大金融核心指標卡
│   │   ├── BurnRateCard.tsx   # 本月進度條、日均花費與月底預估
│   │   ├── InsightsPanel.tsx  # 消費生活自動分析洞察
│   │   ├── ExpenseCharts.tsx  # 柱狀/走勢圖 + 類別分佈甜甜圈圖 (可 Drill-down)
│   │   ├── FilterBar.tsx      # 多維度搜尋、月份選單與日常模式開關
│   │   ├── TransactionList.tsx# 記帳明細列表與分頁
│   │   ├── MonthlyBreakdownPage.tsx # 每月花費分析獨立頁面 (堆疊柱狀圖)
│   │   ├── SyncModal.tsx      # Google Apps Script 連線設定彈窗
│   │   └── AddRecordModal.tsx # 本地手動記一筆彈窗
│   ├── types/
│   │   └── finance.ts         # TypeScript 核心資料介面定義
│   ├── utils/
│   │   ├── gasApi.ts          # Google Apps Script 雲端同步與時區正規化
│   │   ├── demoData.ts        # 內建 50+ 筆 Demo 示範記帳假資料
│   │   └── storage.ts         # LocalStorage 本地持久化與版本自動遷移
│   ├── App.tsx                # 主程式入口與狀態管理
│   ├── main.tsx               # React DOM 渲染
│   └── index.css              # Tailwind CSS 與自訂微光陰影
├── .gitignore                 # 排除 node_modules、dist 與私密試算表
├── index.html                 # HTML 骨架
├── package.json               # 專案依賴與腳本
├── tailwind.config.js         # Tailwind 樣式設定
├── tsconfig.json              # TypeScript 編譯設定
└── vite.config.ts             # Vite 打包配置
```

---

## 🚀 本地開發指南

### 1. 複製專案與安裝依賴
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd personal-finance-dashboard
npm install
```

### 2. 啟動本地開發伺服器
```bash
npm run dev
```
啟動後瀏覽器打開 `http://localhost:5173` 即可即時預覽。

### 3. 編譯生產環境檔案 (Build)
```bash
npm run build
```
產出的正式靜態檔案將儲存在 `dist/` 目錄中。

---

## ☁️ Cloudflare Pages 自動部署設定 (CI/CD)

本專案強烈建議透過 **GitHub + Cloudflare Pages** 連動，每次你修改程式碼推送到 GitHub，網站就會在 30 秒內全自動編譯發布！

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 進入 **Workers & Pages** ➜ 點選 **Create** ➜ 切換到 **Pages**。
3. 點選 **Connect to Git（連線至 Git）**。
4. 選取你的 GitHub 倉庫。
5. 填寫建置設定（Build Settings）：
   - **Framework preset（框架預設）**：選擇 **`Vite`**
   - **Build command（建置指令）**：`npm run build`
   - **Build output directory（輸出目錄）**：`dist`
6. 點擊 **Save and Deploy（儲存並部署）** 即可！

---

## 🔒 隱私與安全性 (Security & Privacy)

1. **零資料上傳**：本專案為純前端（Client-side SPA），你的任何記帳資料、試算表內容均**不會**儲存在 Cloudflare 或任何第三方伺服器。
2. **私密資料隔離**：本專案已在 `.gitignore` 中嚴格排除 `*.xlsx`、`*.csv` 與敏感檔案，絕不會將個人財務明細誤推至 GitHub 公開倉庫。
3. **金鑰本地化**：Google Apps Script 的 `API_SECRET_TOKEN` 與 Web App 網址僅儲存於使用者個人的手機/電腦 `localStorage` 中。

---

## 📄 授權條款

本專案採 [MIT License](LICENSE) 授權開源，歡迎自由使用與修改。
