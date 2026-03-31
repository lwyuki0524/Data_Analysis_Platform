import altair as alt
import pandas as pd
from typing import Any, Dict, List, Union

from models.schemas import ChartWidget, KpiWidget, ChartDataPoint # Import the schemas

class VisualizationEngine:
    def infer_dtype(self, series: pd.Series):
        if pd.api.types.is_datetime64_any_dtype(series):
            return "T"  # temporal
        elif pd.api.types.is_numeric_dtype(series):
            return "Q"  # quantitative
        else:
            return "N"  # nominal
        
    
    def resolve_column(self, df: pd.DataFrame, name: str):
        # 1. 完全匹配 (優先權最高)
        if name in df.columns:
            return name

        # 將目標名稱轉為小寫，並去除前後空格
        target = name.lower().strip()
        
        # 建立一個「小寫對應原始名稱」的映射表
        column_map = {col.lower(): col for col in df.columns}

        # 2. 不區分大小寫的精確匹配
        if target in column_map:
            return column_map[target]

        # 3. 模糊匹配 (包含關係)
        for col_lower, original_col in column_map.items():
            if target in col_lower or col_lower in target:
                return original_col

        raise ValueError(f"無法解析欄位: {name}。現有欄位: {list(df.columns)}")

    def generate_dashboard_charts(self, df: pd.DataFrame, columns: List[str]) -> List[Union[ChartWidget, KpiWidget]]:
        widgets: List[Union[ChartWidget, KpiWidget]] = []

        # Generate KPIs for numerical columns
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                total = df[col].sum()
                average = df[col].mean()
                # Simple trend: compare first half vs second half mean
                mid_point = len(df) // 2
                if len(df) > 1:
                    first_half_mean = df[col].iloc[:mid_point].mean()
                    second_half_mean = df[col].iloc[mid_point:].mean()
                    if pd.isna(first_half_mean) or pd.isna(second_half_mean):
                        trend_str = "N/A"
                    elif first_half_mean != 0:
                        trend_diff = ((second_half_mean - first_half_mean) / first_half_mean) * 100
                        trend_str = f" {trend_diff:+.1f}%"
                    else:
                        trend_str = "N/A" # Avoid division by zero
                else:
                    trend_str = "N/A"

                widgets.append(KpiWidget(
                    title=f"總計 {col}",
                    value=f"{total:.2f}",
                    trend=trend_str,
                    type="kpi"
                ))
                widgets.append(KpiWidget(
                    title=f"平均 {col}",
                    value=f"{average:.2f}",
                    trend=trend_str, # Reusing the same trend for simplicity
                    type="kpi"
                ))

        # Generate charts
        numerical_cols = [col for col in columns if pd.api.types.is_numeric_dtype(df[col])]
        categorical_cols = [col for col in columns if not pd.api.types.is_numeric_dtype(df[col]) and df[col].nunique() > 1]

        # Bar charts for categorical vs numerical
        for cat_col in categorical_cols:
            for num_col in numerical_cols:
                chart_data_df = df.groupby(cat_col)[num_col].mean().reset_index()
                chart_data_df.columns = ["category", "value"]
                chart_title = f"{cat_col} 的 {num_col} 平均值"
                
                chart = alt.Chart(chart_data_df).mark_bar().encode(
                    x=alt.X("category:N", axis=alt.Axis(title=cat_col)),
                    y=alt.Y("value:Q", axis=alt.Axis(title=num_col))
                ).properties(title=chart_title).to_dict()

                widgets.append(ChartWidget(
                    title=chart_title,
                    type="bar", # Still provide type for general info
                    data=[ChartDataPoint(name=row["category"], value=row["value"]) for index, row in chart_data_df.iterrows()],
                    vega_lite_spec=chart
                ))
        
        # Histograms for single numerical columns (if no categorical pairs found or as additional insight)
        if not categorical_cols and numerical_cols: # If only numerical columns are selected
             for num_col in numerical_cols:
                if df[num_col].nunique() < 20: # Treat as categorical if few unique numerical values
                    chart_data_df = df[num_col].value_counts().reset_index()
                    chart_data_df.columns = ["category", "count"]
                    chart_title = f"{num_col} 分布"

                    chart = alt.Chart(chart_data_df).mark_bar().encode(
                        x=alt.X("category:N", axis=alt.Axis(title=num_col)),
                        y=alt.Y("count:Q", axis=alt.Axis(title="計數"))
                    ).properties(title=chart_title).to_dict()

                    widgets.append(ChartWidget(
                        title=chart_title,
                        type="bar",
                        data=[ChartDataPoint(name=row["category"], value=row["count"]) for index, row in chart_data_df.iterrows()],
                        vega_lite_spec=chart
                    ))
                else: # For continuous numerical, generate a line chart (or proper histogram with binning)
                    # For simplicity, let's create a simple line chart of values over index.
                    # For a real histogram, Altair's `bin=True` is needed on the encoding.
                    chart_data_df = df[num_col].reset_index()
                    chart_data_df.columns = ["index", "value"]
                    chart_title = f"{num_col} 趨勢 (依序)"

                    chart = alt.Chart(chart_data_df).mark_line().encode(
                        x=alt.X("index:O", axis=alt.Axis(title="索引")), # Ordinal for index
                        y=alt.Y("value:Q", axis=alt.Axis(title=num_col))
                    ).properties(title=chart_title).to_dict()

                    widgets.append(ChartWidget(
                        title=chart_title,
                        type="line",
                        data=[ChartDataPoint(name=row["index"], value=row["value"]) for index, row in chart_data_df.iterrows()],
                        vega_lite_spec=chart
                    ))

        return widgets