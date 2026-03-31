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
    

    
    def generate_dashboard_charts(self, df: pd.DataFrame, columns: List[str]) -> List[Union[ChartWidget, KpiWidget]]:
        widgets: List[Union[ChartWidget, KpiWidget]] = []

        # Generate KPIs for numerical columns
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                series = df[col].dropna()
                if series.empty:
                    continue

                # 基本統計量
                total = series.sum()
                average = series.mean()
                maximum = series.max()
                minimum = series.min()
                
                n = len(series)
                mid_point = n // 2

                # 1. 總計趨勢：前後半部比較 (反映總量變化)
                trend_total = "N/A"
                if n > 1:
                    first_half_sum = series.iloc[:mid_point].sum()
                    second_half_sum = series.iloc[mid_point:].sum()
                    if first_half_sum != 0:
                        diff = ((second_half_sum - first_half_sum) / abs(first_half_sum)) * 100
                        trend_total = f"{diff:+.1f}%"
                
                # 2. 平均趨勢：整體平均 vs 近期平均 (最後 20% 的數據)
                trend_avg = "N/A"
                recent_count = max(1, n // 5)
                recent_avg = series.iloc[-recent_count:].mean()
                if average != 0:
                    diff = ((recent_avg - average) / abs(average)) * 100
                    trend_avg = f"{diff:+.1f}%"

                # 3. 最大值趨勢：是否為近期突破
                # 比較最後一個 window 是否包含最大值
                trend_max = "新高" if series.iloc[-recent_count:].max() >= maximum else "持平"

                # 4. 最小值趨勢：是否創低
                trend_min = "新低" if series.iloc[-recent_count:].min() <= minimum else "持平"

                widgets.append(KpiWidget(
                    title=f"總計 {col}",
                    value=f"{total:.2f}",
                    trend=trend_total,
                    type="kpi"
                ))
                widgets.append(KpiWidget(
                    title=f"平均 {col}",
                    value=f"{average:.2f}",
                    trend=trend_avg, # Reusing the same trend for simplicity
                    type="kpi"
                ))
                widgets.append(KpiWidget(
                    title=f"最大 {col}",
                    value=f"{maximum:.2f}",
                    trend=trend_max,
                    type="kpi"
                ))
                widgets.append(KpiWidget(
                    title=f"最小 {col}",
                    value=f"{minimum:.2f}",
                    trend=trend_min,
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