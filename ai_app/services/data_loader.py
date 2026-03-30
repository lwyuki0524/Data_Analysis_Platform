import sqlite3
import pandas as pd

class DataLoader:
    def __init__(self, db_path: str = "../web_app/database.sqlite"):
        self.db_path = db_path

    def _get_file_path_from_db(self, dataset_id: str) -> str:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT file_path FROM datasets WHERE id = ?",
            (dataset_id,)
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise ValueError(f"Dataset {dataset_id} not found")

        return row[0]

    def load(self, dataset_id: str):
        try:
            file_path = self._get_file_path_from_db(dataset_id)
        except:
            return None
        
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)
        elif file_path.endswith(".json"):
            df = pd.read_json(file_path)
        else:
            raise ValueError("Unsupported format")
        return df