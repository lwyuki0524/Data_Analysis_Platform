INSIGHT_PROMPT = """
你是一個資料分析師。

請根據以下資料結果，給出 2~3 個重點洞察。

資料：
{data}

請用簡潔中文回答。
"""
    
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