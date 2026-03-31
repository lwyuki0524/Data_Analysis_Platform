from abc import ABC, abstractmethod
import time
from typing import Any, Dict, List, Optional
from openai import OpenAI
from google import genai
from google.genai import types
import json

def get_plan_system_prompt(INSERT_COLUMN_LIST_HERE:Optional[str] = ""):
    PLAN_SYSTEM_PROMPT = f"""
You are a data analysis assistant.
Your task is to analyze the user's question, plan data processing steps, and determine if a chart is needed. 

### DATA SCHEMA (CRITICAL)
The ONLY available columns in the dataset are:
{INSERT_COLUMN_LIST_HERE}""" + """
### STRICT COLUMN CONSTRAINT
1. You MUST use the column names EXACTLY as they appear in the DATA SCHEMA above.
2. Case-sensitivity matters: "Sales" is NOT the same as "sales". Use the exact casing provided.
3. Do NOT invent, translate, or guess column names.
4. If a processing step (e.g., group_by) creates a `new_column_name`, you may use that new name in subsequent steps or the chart.

### AVAILABLE TOOLS
- filter(column: str, operator: str, value: Any): operator: '==', '!=', '>', '<', '>=', '<='
- group_by(columns: List[str], agg_func: str, agg_column: str, new_column_name: str): agg_func: 'sum', 'mean', 'max', 'min', 'count'
- sort(column: str, ascending: bool)
- select_columns(columns: List[str])
- calculate_column(new_column: str, expression: str)

### CHART TYPES (if needed)
- bar_chart: Categorical comparison.
- line_chart: Time series or trends.
- scatter_plot: Relationships between two numerical variables.
- pie_chart: Proportions.

### OUTPUT FORMAT
Output ONLY a valid JSON. No explanations. No markdown blocks outside the JSON.
{
  "steps": [
    {"tool": "filter", "params": {"column": "EXACT_COLUMN_NAME", "operator": ">", "value": 1000}}
    {"tool": "group_by", "params": {"columns": [EXACT_COLUMN_NAME], "agg_func": "sum", "agg_column": "Sales", "new_column_name": NEW_COLUMN_NAME}},
    {"tool": "sort", "params": {"column": EXACT_COLUMN_NAME, "ascending": false}}
  ],
  "chart": {
    "type": "bar_chart",
    "title": "Chart Title",
    "x_axis": "EXACT_COLUMN_NAME",
    "y_axis": "EXACT_COLUMN_NAME_OR_NEW_COLUMN"
  }
}

If no chart is needed, set `chart` to null. If no steps are needed, set `steps` to [].

### FINAL WARNING
Failure to use exact column names from the provided schema will result in a system error. Double-check capitalization before outputting.
"""
    return PLAN_SYSTEM_PROMPT

INSIGHT_SYSTEM_PROMPT = """
你是一個資料分析助手，你的任務是從提供的資料中提取關鍵洞察並以簡潔的中文說明。
提供的資料是一個 Pandas DataFrame 的 JSON 格式摘要。

請根據以下資料生成洞察：
"""

class LLMAdapter(ABC):

    @abstractmethod
    def generate_plan(self, prompt: str, dataframe_head_json: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_insight(self, dataframe_summary_json: str) -> str:
        pass


class OpenAIAdapter(LLMAdapter):

    def __init__(self, model: str, mode:str = "local", api_key: Optional[str] = "", base_url: Optional[str] = None):
        if not base_url:
            base_url = None
        
        if mode in ["local", "openai"]:
            self.client = OpenAI(api_key=api_key, base_url=base_url)
        elif mode in ["google_genai"]:
            self.client = genai.Client(api_key=api_key)
        
        self.model = model
        self.mode = mode

    def generate_plan(self, prompt: str, dataframe_head_json: str, df_columns:Optional[list] = [] ) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": get_plan_system_prompt(df_columns)},
            {"role": "user", "content": f"使用者問題: {prompt}\n\n資料框前幾行:\n{dataframe_head_json}"}
        ]
        
        try:
            if self.mode in ["google_genai"]:
                completion = self.client.models.generate_content(
                    model=self.model,
                    config=types.GenerateContentConfig(system_instruction=get_plan_system_prompt(df_columns), temperature=0),
                    contents=[
                        types.Content(
                            role='user',
                            parts=[types.Part.from_text(text=f"使用者問題: {prompt}\n\n資料框前幾行:\n{dataframe_head_json}")]
                        )
                    ]
                )
                raw_text = completion.text.strip()
                print("generate_plan raw_text=",raw_text)
                return json.loads(raw_text)
            else:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0,
                    response_format={"type": "json_object"}
                )
                raw_text = completion.choices[0].message.content.strip()
                print("generate_plan raw_text=",raw_text)
                return json.loads(raw_text)
        except Exception as e:
            print(f"[LLM ERROR - generate_plan] {e}")
            return {"steps": [], "chart": None}

    def generate_insight(self, dataframe_summary_json: str) -> str:
        messages = [
            {"role": "system", "content": INSIGHT_SYSTEM_PROMPT},
            {"role": "user", "content": dataframe_summary_json}
        ]

        try:
            if self.mode in ["google_genai"]:
                completion = self.client.models.generate_content(
                    model=self.model,
                    config=types.GenerateContentConfig(system_instruction=INSIGHT_SYSTEM_PROMPT, temperature=0, max_output_tokens=500),
                    contents=[
                        types.Content(
                            role='user',
                            parts=[types.Part.from_text(text=dataframe_summary_json)]
                        )
                    ]
                )
                return completion.text.strip()
            else:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0,
                    max_tokens=500, # Allow more tokens for insights
                )
                return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"[LLM ERROR - generate_insight] {e}")
            return "無法生成洞察。"




# PLAN_SYSTEM_PROMPT = """
# You are a data analysis assistant.
# Based on the user's question, your task is to plan a series of data processing steps and determine whether a chart is required.
# You must output a structured JSON response containing `steps` (data operations) and `chart` (chart information, if needed).

# Available data processing tools:
# - filter(column: str, operator: str, value: Any): Filter the DataFrame based on a condition.
#   - operator: '==', '!=', '>', '<', '>=', '<='
# - group_by(columns: List[str], agg_func: str, agg_column: str, new_column_name: str): Group by one or more columns and perform aggregation.
#   - agg_func: 'sum', 'mean', 'max', 'min', 'count'
# - sort(column: str, ascending: bool): Sort by a column.
# - select_columns(columns: List[str]): Select specific columns.
# - calculate_column(new_column: str, expression: str): Create a new column based on an expression.

# Available chart types (if needed):
# - bar_chart: Bar chart, suitable for comparing categorical data.
# - line_chart: Line chart, suitable for time series or trend analysis.
# - scatter_plot: Scatter plot, suitable for showing relationships between two numerical variables.
# - pie_chart: Pie chart, suitable for showing proportions of a whole.

# JSON output format example:
# {
#   "steps": [
#     {"tool": "filter", "params": {"column": "Sales", "operator": ">", "value": 1000}},
#     {"tool": "group_by", "params": {"columns": ["Product Category"], "agg_func": "sum", "agg_column": "Sales", "new_column_name": "Total Sales"}},
#     {"tool": "sort", "params": {"column": "Total Sales", "ascending": false}}
#   ],
#   "chart": {
#     "type": "bar_chart",
#     "title": "Total Sales by Product Category",
#     "x_axis": "Product Category",
#     "y_axis": "Total Sales"
#   }
# }

# The column names must exactly match the original DataFrame columns, including capitalization. Do NOT translate or modify column names into other languages.
# If no chart is needed, the `chart` field should be `null` or omitted.
# If no processing steps are required, `steps` should be an empty list `[]`.
# You must output only JSON, without any additional text or explanation.
# """