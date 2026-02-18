
import os
import re
import pandas as pd

# CONFIGURATION
ROOT_DIR = '/Users/adambelal/Desktop/restaurant-os/OCR Mistral Banque'
OUTPUT_FILE = 'CLEAN_BANK_IMPORT.xlsx'

def parse_amount(val):
    if not val: return 0.0
    # Clean string: "1 200,50" -> 1200.50
    val = str(val).strip().replace(' ', '').replace('\xa0', '').replace(',', '.')
    # Remove non-numeric/dot/minus
    val = re.sub(r'[^\d\.\-]', '', val)
    try:
        return float(val)
    except:
        return 0.0

def parse_markdown_table(file_path):
    transactions = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    current_tx = None
    
    for line in lines:
        line = line.strip()
        # Look for table rows: | XX/XX | ... |
        if not line.startswith('|'): continue
        if 'DATE' in line.upper() and 'LIBELLE' in line.upper(): continue # Header
        if '---' in line: continue # Separator
        
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if not parts: continue
        
        # Heuristic: Column 0 is Date "dd/mm"
        col0 = parts[0]
        label = parts[1] if len(parts) > 1 else ""
        
        # Amounts usually at end. Debit usually Col -2, Credit Col -1
        # But sometimes columns shift.
        # Let's try last 2 cols as potential numbers
        debit = 0.0
        credit = 0.0
        
        last_val = parse_amount(parts[-1]) if len(parts) > 0 else 0
        penultimate_val = parse_amount(parts[-2]) if len(parts) > 1 else 0
        
        # Logic: Credit is usually positive bank balance (IN), Debit (OUT)
        # In bank statements: Credit column is usually last, Debit is before.
        if last_val != 0: credit = last_val
        if penultimate_val != 0: debit = penultimate_val
        
        # Is this a new row (Date present)?
        if re.match(r'^\d{2}/\d{2}$', col0):
            # Save previous
            if current_tx: transactions.append(current_tx)
            
            # Start new
            current_tx = {
                'Date': col0,
                'Label': label,
                'Debit': debit,
                'Credit': credit,
                'Raw': line
            }
        elif current_tx:
            # Append label if continuous text
            if label: current_tx['Label'] += " " + label
            # Accumulate amounts if spread across lines
            if debit != 0: current_tx['Debit'] += debit
            if credit != 0: current_tx['Credit'] += credit
            
    # Add last
    if current_tx: transactions.append(current_tx)
    
    return transactions

def main():
    print(f"🚀 Scanning {ROOT_DIR}...")
    
    all_months = {} # Key: "YYYY-MM", Value: [rows]
    
    for root, dirs, files in os.walk(ROOT_DIR):
        for file in files:
            if file == 'markdown.md':
                # Parent folder name often has date: "BPBFC 20230531.pdf"
                folder_name = os.path.basename(root)
                md_path = os.path.join(root, file)
                
                # Extract YYYYMMDD
                match = re.search(r'(\d{8})', folder_name)
                if match:
                    date_str = match.group(1) # 20230531
                    month_key = f"{date_str[:4]}-{date_str[4:6]}" # 2023-05
                    
                    print(f"📄 Found {month_key} in {folder_name}")
                    
                    rows = parse_markdown_table(md_path)
                    if rows:
                        if month_key not in all_months: all_months[month_key] = []
                        # Add Year to Date for clarity
                        for r in rows:
                            r['FullDate'] = f"{r['Date']}/{date_str[:4]}"
                        all_months[month_key].extend(rows)
                else:
                    print(f"⚠️ Skipped {folder_name} (No YYYYMMDD in name)")

    if not all_months:
        print("❌ No data found.")
        return

    # Write Excel
    out_path = os.path.join(os.getcwd(), OUTPUT_FILE)
    with pd.ExcelWriter(out_path, engine='openpyxl') as writer:
        for month in sorted(all_months.keys()):
            df = pd.DataFrame(all_months[month])
            # Reorder
            cols = ['FullDate', 'Label', 'Debit', 'Credit', 'Raw']
            df = df[[c for c in cols if c in df.columns]]
            df.to_excel(writer, sheet_name=month, index=False)
            print(f"✅ Sheet {month}: {len(df)} transactions")
            
    print(f"\n✨ FILE GENERATED: {out_path}")
    print("👉 Open this Excel file, verify amounts, then tell me 'It's good'!")

if __name__ == "__main__":
    main()
