import pandas as pd
import json

file_path = "/Users/adambelal/Desktop/Antigrav Resto OS data/caisse retraitée.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    sheets_info = {}
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name).head(5)
        sheets_info[sheet_name] = {
            "columns": df.columns.tolist(),
            "preview": df.to_dict(orient='records')
        }
    print(json.dumps(sheets_info, indent=2, default=str))
except Exception as e:
    print(json.dumps({"error": str(e)}))
