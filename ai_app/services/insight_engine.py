import pandas as pd

class InsightEngine:
    def generate(self, df):

        insights = []

        if df.empty:
            return {"insights": ["查無資料"]}

        cols = df.columns.tolist()

        # 至少要兩欄才做排名分析
        if len(cols) >= 2:
            try:
                df_sorted = df.sort_values(cols[1], ascending=False)

                top = df_sorted.iloc[0]

                label = str(top[cols[0]])
                value = top[cols[1]]

                insights.append(f"{label} 表現最佳（{cols[1]}={value}）")

            except Exception as e:
                insights.append("無法判斷最佳項目")

        # 趨勢判斷
        if len(cols) >= 2 and "date" in cols[0].lower():
            values = df.iloc[:, 1]

            if len(values) >= 2:
                if values.iloc[-1] > values.iloc[0]:
                    insights.append("整體呈現上升趨勢")
                else:
                    insights.append("整體呈現下降趨勢")

        # 分布
        if df.shape[0] > 5:
            insights.append("資料具有一定分布差異")

        return {"insights": insights}

    def identify_important_columns(self, df: pd.DataFrame) -> list[str]:
        important_columns = []
        for col in df.columns:
            # Skip columns with too many unique values (potential IDs or free text)
            if df[col].nunique() > len(df) * 0.8:  # More than 80% unique values
                continue

            # Prioritize numerical columns
            if pd.api.types.is_numeric_dtype(df[col]):
                important_columns.append(col)
            # Consider categorical columns with a reasonable number of unique values
            elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
                if 2 <= df[col].nunique() <= 50:  # Between 2 and 50 unique categories
                    important_columns.append(col)

        # If no important columns found, just return all columns (or first few)
        if not important_columns and not df.empty:
            return df.columns.tolist()[:5] # Return first 5 columns as a fallback
        return important_columns