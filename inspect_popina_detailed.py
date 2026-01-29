import pandas as pd
import json

file_path = "/Users/adambelal/Desktop/restaurant-os/popina_export_accounting_40116_20251001_20260125_25b805d5.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    sheet_name = xl.sheet_names[0]
    df = xl.parse(sheet_name)
    
    # Get the column mapping: index -> name
    col_mapping = {i: col for i, col in enumerate(df.columns)}
    
    # Get first 5 rows but only first 15 columns
    data_preview = df.iloc[:10, :15].to_dict(orient='records')
    
    print(json.dumps({
        "sheet": sheet_name,
        "column_mapping": col_mapping,
        "preview": data_preview
    }, indent=2, default=str))
except Exception as e:
    print(json.dumps({"error": str(e)}))
