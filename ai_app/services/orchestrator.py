from pathlib import Path
from dotenv import load_dotenv
from services.visualization_engine import VisualizationEngine
from services.data_processor import DataProcessor
from services.tool_executor import ToolExecutor
from engines.llm_adapter import OpenAIAdapter
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(".env")

class Orchestrator:

    def __init__(self, loader):
        mode = os.getenv("LLM_MODE", "mock")
        model = os.getenv("MODEL", "qwen2.5:3b")
        base_url=os.getenv("BASE_URL")
        api_key=os.getenv("LLM_API_KEY")

        # print("model=",model)
        # print("base_url=",base_url)

        if mode == "openai":
            self.llm = OpenAIAdapter(model=model, api_key=api_key)
        elif mode=="local":
            self.llm = OpenAIAdapter(model=model, base_url=base_url)
        else:
            raise ValueError("請設定llm")

        self.loader = loader
        self.data_processor = DataProcessor()
        self.viz_engine = VisualizationEngine()
        
        self.executor = ToolExecutor(self.data_processor, self.viz_engine)

    def run(self, dataset_id: str, question: str):

        df = self.loader.load(dataset_id)

        if df is None:
            return {"answer": "數據集加載失敗。"}
        
        df = self.data_processor.clean(df)
        
        # 1️⃣ LLM → 計畫 (包含資料框前幾行)
        plan = self.llm.generate_plan(question, df.head().to_json(orient='records', force_ascii=False), df.columns.tolist())

        # 2️⃣ execute steps
        result_df = self.executor.execute_plan(df, plan.get("steps", []))

        # 3️⃣ chart（如果有）
        chart = None
        if plan.get("chart"):
            chart = self.viz_engine.generate_chart(result_df, plan["chart"])
            # print("chart=",chart)

        # 4️⃣ insight（LLM）
        insights = self.llm.generate_insight(result_df.to_json(orient='records', force_ascii=False))
        
        return {
            "answer": insights,
            "chart": chart,
            "table": result_df.head(50).to_dict(orient="records")
        }