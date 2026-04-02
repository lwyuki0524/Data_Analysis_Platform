## Data Analysis AI 平台專案全覽

此專案同時包含兩個主要子專案：
- ai_app：AI 分析服務（FastAPI，Python）
- web_app：前端管理 + API（Express + React + Vite + SQLite）

整體流程：
1. 前端上傳 / 選擇 dataset（CSV/xlsx/json） → 存入 database.sqlite
2. ai_app via /dataset/register 讀取資料、/dataset/{id}/columns回傳欄位
3. 提問 `/query` → `Orchestrator` 呼叫 `LLMAdapter`（OpenAI / Google / Mock）產生處理「Plan」
4. `ToolExecutor` 執行 `DataProcessor` 步驟，進行資料清洗、過濾、計算等轉換
5. `VisualizationEngine` 生成圖表 JSON / KPI
6. 回傳 answer/chart/table

---

## 資料結構

### ai_app/
- main.py：FastAPI 啟動
- `api/routes.py`：4 個主要端點
- `models/schemas.py`：Pydantic schema
- `services/`：
  - data_loader.py：從 `database.sqlite` 拿 path，讀 CSV/Excel/JSON
  - data_processor.py：clean、filter、group、sort、select、calc、summary、profile
  - tool_executor.py：讀 LLM step，執行 transform
  - visualization_engine.py：Altair chart / widget building
  - `insight_engine.py`（可檢視）
  - orchestrator.py：LLM → plan → executor → chart → insight
- `engines/`
  - llm_adapter.py：OpenAIAdapter + prompt template
  - mock_llm.py：簡易 mock 判詞

### web_app/
- server.ts：Express + Vite + DB init
- `backend/routes/*`：dataset/chat/dashboard API
- `backend/controllers/*`：具體資料庫邏輯
- `backend/db/database.ts`：SQLite schema
- `src/`：React UI
  - `pages`、`components`、`services/api.ts`

---

## 開發環境搭建

### 1 Python 服務（ai_app）
- 進入：`cd ai_app`
- 同步並進入虛擬環境
  - `uv run`
  - `.venv\Scripts\activate`
- 安裝新套件
  - `uv add [套件]`
- env：
  - 複製 `.env.example` → `.env`
  - 主要變數：
    - `LLM_MODE=local|openai|google_genai`
    - `MODEL=qwen2.5:3b`（預設）
    - `LLM_API_KEY=<你的金鑰>`
    - `BASE_URL=<若 local 需要 openai 端點>`
- 啟動
  - `uv run uvicorn main:app --reload`
- 健康檢查
  - `GET http://localhost:8000/health`

### 2 Web UI + Express API（web_app）
- 進入：`cd web_app`
- 安裝：`npm install`
- env：
  - `.env` 參考 .env.example
  - 可設定 `AI_APP_URL=http://localhost:8000`
- 啟動：`npm run dev`
- 開啟：`http://localhost:3000`

---

## 主要 API 端點（ai_app）

- `POST /dataset/register`
  - body: `{ "dataset_id": "1" }`
- `GET /dataset/{dataset_id}/columns`
  - 回傳 `{"columns":["col1","col2", ...]}`
- `POST /dashboard/create`
  - body: `{ "dataset_id": "1", "focus_fields":["colA","colB"] }`
  - 回傳含 `dashboard_config.widgets`
- `POST /query`
  - body: `{ "dataset_id":"1", "question":"2025年第一季營收趨勢?" }`
  - 回傳:
    - `answer`（LLM 洞察文）
    - `chart`（Altair JSON，web 端可顯示）
    - `table`（前 50 筆資料）

---

## 主要 API 端點（web_app）

- `POST /api/dataset/upload`：CSV/xlsx/json 上傳
- `GET /api/dataset`：列表
- `GET /api/dataset/:id`：單筆資訊
- `GET /api/dataset/:id/columns`：欄位
- `GET /api/dataset/:id/preview`：預覽前 20 筆
- `DELETE /api/dataset/:id`：刪除
- `POST /api/chat/query`（對應「聊天 + AI 查詢」、「與 ai_app /query 互動」）
- `POST /api/dashboard/create`

---

## 資料庫

- SQLite 檔：database.sqlite
- Tables:
  - `datasets`：id, name, file_path, source_type,...
  - `chat_rooms`、`chat_history`, `dashboards`
- ai_app 的 DataLoader 預設讀：`../web_app/database.sqlite`（相對路徑）

---

## 使用示例

1. 上傳 dataset（web UI 或 `POST /api/dataset/upload`）
2. 取得欄位 `GET /api/dataset/:id/columns`
3. 取「自然語言問題」
4. 呼叫 `POST http://localhost:3000/api/chat/query`（web_app 轉交 ai_app）
5. 回傳 chart + table + answer
6. 需要儀表板時呼叫 `POST .../api/dashboard/create`

---

## 重要設計要點

- LLM 生成「執行計畫」（`steps`）控制 `ToolExecutor` 轉換 DataFrame
- `VisualizationEngine` 既可生成 KPI 也可提供 Vega-Lite 圖表 object
- `DataLoader` 依 SQLite recorded file paths 讀實體檔

---