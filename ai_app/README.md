## 1. 環境準備

### 1.1 Python 版本
- `Python >= 3.11`

### 1.2 依賴安裝
> 本專案 pyproject.toml 已列:
> - altair / fastapi / matplotlib / openai / openpyxl / pandas / pydantic / python-dotenv / python-multipart / uvicorn


在 ai_app 資料夾執行：
- `uv run`(同步環境)
- `.venv\Scripts\activate`(進入環境)
- `uv run uvicorn main:app --reload`(執行主程式)


## 2. .env 內容（必填）

建議在 .env：
- `LLM_MODE=openai` 或 `LLM_MODE=local`
- `MODEL=qwen2.5:3b`（預設）
- `LLM_API_KEY=你的 openai key`（openai 模式）
- `BASE_URL=http://本地或私有LLM服務`（local模式）

### 範例
```
LLM_MODE=openai
MODEL=gpt-4o-mini
LLM_API_KEY=sk-...
BASE_URL=http://localhost:8000
```


## 3. 啟動命令

在 ai_app 目錄執行：
- `uv run uvicorn main:app --reload`

驗證服務：
- `GET http://127.0.0.1:8000/health` → `{"status":"ok"}`

---

## 4. API 使用方式

### 4.1 註冊資料集
POST `http://127.0.0.1:8000/dataset/register`

Payload:
```json
{
  "dataset_id": "1"
}
```
（實際用 id 查 `datasets` 表）  
回傳:
```json
{ "dataset_id": "1" }
```

### 4.2 查詢問題
POST `http://127.0.0.1:8000/query`

Payload:
```json
{
  "dataset_id": "1",
  "question": "這季銷售趨勢如何？"
}
```

回傳：
- `answer`: LLM 產出的洞察
- `chart`: 由 `VisualizationEngine` 產生（可能 `null`）
- `table`: `result_df` 前 50 列

---

## 5. 常見問題

- OpenAI key 未設定、`LLM_MODE` 錯誤。
- dataset load 失敗：`dataset_id` 不存在或 sqlite 路徑不對。
- 解析失敗：LLM 輸出非標準 JSON，`generate_plan` 捕獲後退回 `{"steps":[], "chart":None}`。
- 如果要純本機測試可用 mock_llm.py 改寫 `Orchestrator` 的 LLM 實例。
