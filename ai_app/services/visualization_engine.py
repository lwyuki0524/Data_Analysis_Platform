import altair as alt
import pandas as pd
from typing import Any, Dict

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

    def generate_chart(self, df: pd.DataFrame, chart_spec: Dict[str, Any]):
        if not chart_spec:
            return None

        chart_type = chart_spec.get("type")
        title = chart_spec.get("title", "Chart")
        x_axis = chart_spec.get("x_axis")
        y_axis = chart_spec.get("y_axis")
        color = chart_spec.get("color") # Optional for some charts

        if not x_axis or not y_axis:
            print("Warning: x_axis or y_axis not specified for chart.")
            return None

        x_axis = self.resolve_column(df, x_axis)
        y_axis = self.resolve_column(df, y_axis)

        x_type = self.infer_dtype(df[x_axis])
        y_type = self.infer_dtype(df[y_axis])

        base = alt.Chart(df).encode(
            x=alt.X(f"{x_axis}:{x_type}", axis=alt.Axis(title=x_axis)),
            y=alt.Y(f"{y_axis}:{y_type}", axis=alt.Axis(title=y_axis))
        ).properties(
            title=title
        )

        chart = None
        if chart_type == "bar_chart":
            if color:
                chart = base.mark_bar().encode(color=color)
            else:
                chart = base.mark_bar()
        elif chart_type == "line_chart":
            if color:
                chart = base.mark_line(point=True).encode(color=color)
            else:
                chart = base.mark_line(point=True)
        elif chart_type == "scatter_plot":
            if color:
                chart = base.mark_point().encode(color=color)
            else:
                chart = base.mark_point()
        elif chart_type == "pie_chart":
            # For pie charts, y_axis usually represents the values and x_axis the categories
            # Altair pie chart is a bit different, often uses theta for values and color for categories
            if y_axis and x_axis: # y_axis as value, x_axis as category/color
                chart = alt.Chart(df).encode(
                    theta=alt.Theta(field=y_axis, type="quantitative"),
                    color=alt.Color(field=x_axis, type="nominal", title=x_axis)
                ).mark_arc(outerRadius=120).properties(
                    title=title
                )
            else:
                return None
        else:
            print(f"Unsupported chart type: {chart_type}")
            return None

        return chart.to_json() # Return chart as JSON spec