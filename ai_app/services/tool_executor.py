import pandas as pd
from typing import Any, Dict, List
from services.data_processor import DataProcessor
from services.visualization_engine import VisualizationEngine

class ToolExecutor:
    def __init__(self, data_processor: DataProcessor, visualization_engine: VisualizationEngine):
        self.data_processor = data_processor
        self.visualization_engine = visualization_engine

    def execute_step(self, df: pd.DataFrame, step: Dict[str, Any]) -> pd.DataFrame:
        tool_name = step.get("tool")
        params = step.get("params", {})

        if tool_name == "filter":
            return self.data_processor.filter_data(df, **params)
        elif tool_name == "group_by":
            return self.data_processor.group_and_aggregate(df, **params)
        elif tool_name == "sort":
            return self.data_processor.sort_data(df, **params)
        elif tool_name == "select_columns":
            return self.data_processor.select_columns(df, **params)
        elif tool_name == "calculate_column":
            return self.data_processor.calculate_column(df, **params)
        else:
            print(f"Unknown tool: {tool_name}")
            return df

    def execute_plan(self, df: pd.DataFrame, steps: List[Dict[str, Any]]) -> pd.DataFrame:
        current_df = df.copy()
        for step in steps:
            current_df = self.execute_step(current_df, step)
        return current_df
