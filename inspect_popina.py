import pandas as pd
import json
import sys

file_path = "/Users/adambelal/Desktop/restaurant-os/popina_export_accounting_40116_20251001_20260125_25b805d5.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    sheets_info = {}
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        # Get columns and first 10 rows
        sheets_info[sheet_name] = {
            "columns": df.columns.tolist(),
            "preview": df.head(10).to_dict(orient='records')
        }
    print(json.dumps(sheets_info, indent=2, default=str))
except Exception as e:
    print(json.dumps({"error": str(e)}))
