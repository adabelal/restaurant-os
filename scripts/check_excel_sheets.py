import pandas as pd
import json

file_path = "/Users/adambelal/Desktop/Antigrav Resto OS data/caisse retraitée.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    info = []
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        info.append({
            "sheet": sheet_name,
            "columns": df.columns.tolist(),
            "sample_row": df.iloc[5].to_dict() if len(df) > 5 else None
        })
    print(json.dumps(info, indent=2, default=str))
except Exception as e:
    print(json.dumps({"error": str(e)}))
