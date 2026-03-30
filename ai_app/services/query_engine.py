from pathlib import Path
import pandas as pd
from engines.llm_adapter import OpenAIAdapter
from engines.mock_llm import MockLLMAdapter
from utils.safe_ops import validate_op
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(".env")


class QueryEngine:

    def __init__(self):
        self.llm = self.get_llm()

    def get_llm(self):
        mode = os.getenv("LLM_MODE", "mock")
        model = os.getenv("MODEL", "qwen2.5:3b")
        base_url=os.getenv("BASE_URL")
        api_key=os.getenv("LLM_API_KEY")

        if mode == "openai":
            return OpenAIAdapter(model=model, api_key=api_key)
        elif mode == "local":
            return OpenAIAdapter(model=model, base_url=base_url)

        return MockLLMAdapter()

    def _detect_columns(self, df: pd.DataFrame):
        numeric = df.select_dtypes(include="number").columns.tolist()
        categorical = df.select_dtypes(include="object").columns.tolist()

        date_cols = []
        for col in df.columns:
            try:
                pd.to_datetime(df[col])
                date_cols.append(col)
            except:
                pass

        return {
            "numeric": numeric,
            "categorical": categorical,
            "date": date_cols
        }

    def run(self, df: pd.DataFrame, question: str):

        schema = self._detect_columns(df)

        op = self.llm.generate_query(question)
        print("op=",op)
        validate_op(op)

        num_col = schema["numeric"][0] if schema["numeric"] else None
        cat_col = schema["categorical"][0] if schema["categorical"] else None
        date_col = schema["date"][0] if schema["date"] else None

        # 1. 最大值
        if op == "max" and num_col and cat_col:
            result = (
                df.groupby(cat_col)[num_col]
                .sum()
                .reset_index()
                .sort_values(num_col, ascending=False)
            )
            return result

        # 2. 平均
        elif op == "mean" and num_col:
            return df[num_col].mean().to_frame(name="mean").T

        # 3. 總和
        elif op == "sum" and num_col:
            return df[num_col].sum().to_frame(name="sum").T

        # 4. 趨勢
        elif op == "trend" and date_col and num_col:
            df[date_col] = pd.to_datetime(df[date_col])

            result = (
                df.groupby(date_col)[num_col]
                .sum()
                .reset_index()
                .sort_values(date_col)
            )
            return result

        # fallback
        return df.describe()