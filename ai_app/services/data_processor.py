import pandas as pd
from typing import Any, List


class DataProcessor:

    def clean(self, df: pd.DataFrame):
        df = df.copy()

        # 移除過多缺失
        df = df.dropna(thresh=len(df.columns) * 0.5)

        # 填補 numeric
        for col in df.select_dtypes(include="number").columns:
            df[col] = df[col].fillna(df[col].median())

        # 清理字串
        for col in df.select_dtypes(include="object").columns:
            df[col] = df[col].astype(str).str.strip()

        return df

    def filter_data(self, df: pd.DataFrame, column: str, operator: str, value: Any) -> pd.DataFrame:
        if column not in df.columns:
            print(f"Warning: Column '{column}' not found for filtering.")
            return df
        
        # Ensure value type matches column dtype for proper comparison
        try:
            if df[column].dtype == 'int64' or df[column].dtype == 'float64':
                value = type(df[column].iloc[0])(value)
        except Exception as e:
            print(f"Could not convert filter value to column type: {e}")
            pass

        if operator == "==":
            return df[df[column] == value]
        elif operator == "!=":
            return df[df[column] != value]
        elif operator == ">":
            return df[df[column] > value]
        elif operator == "<":
            return df[df[column] < value]
        elif operator == ">=":
            return df[df[column] >= value]
        elif operator == "<=":
            return df[df[column] <= value]
        else:
            print(f"Unsupported operator: {operator}")
            return df

    def group_and_aggregate(self, df: pd.DataFrame, columns: List[str], agg_func: str, agg_column: str, new_column_name: str) -> pd.DataFrame:
        if not all(col in df.columns for col in columns):
            print(f"Warning: One or more grouping columns {columns} not found.")
            return df
        if agg_column not in df.columns:
            print(f"Warning: Aggregate column '{agg_column}' not found.")
            return df

        # 執行聚合運算
        try:
            result = df.groupby(columns)[agg_column].agg(agg_func)
        except Exception as e:
            print(f"Error during aggregation: {e}")
            return df
        
        return result.to_frame(name=new_column_name).reset_index()
    

    def sort_data(self, df: pd.DataFrame, column: str, ascending: bool) -> pd.DataFrame:
        if column not in df.columns:
            print(f"Warning: Column '{column}' not found for sorting.")
            return df
        return df.sort_values(by=column, ascending=ascending)

    def select_columns(self, df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        if not all(col in df.columns for col in columns):
            print(f"Warning: One or more columns {columns} not found for selection.")
            return df
        return df[columns]
    
    def calculate_column(self, df: pd.DataFrame, new_column: str, expression: str) -> pd.DataFrame:
        try:
            df[new_column] = df.eval(expression)
            return df
        except Exception as e:
            print(f"Error calculating column '{new_column}' with expression '{expression}': {e}")
            return df

    def summarize(self, df: pd.DataFrame):
        return df.describe(include="all").to_dict()

    def profile(self, df: pd.DataFrame):

        profile = {
            "columns": list(df.columns),
            "numeric": [],
            "categorical": [],
            "date": []
        }

        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                profile["numeric"].append(col)
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                profile["date"].append(col)
            else:
                # 嘗試轉日期
                try:
                    pd.to_datetime(df[col])
                    profile["date"].append(col)
                except:
                    profile["categorical"].append(col)

        return profile