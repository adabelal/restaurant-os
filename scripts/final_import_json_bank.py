
import os
import json
import pandas as pd
from datetime import datetime

ROOT_DIR = '/Users/adambelal/Desktop/restaurant-os/OCR Mistral Banque'
OUTPUT_FILE = 'FINAL_BANK_IMPORT_READY.xlsx'

def parse_date(date_str, year_context):
    if not date_str: return None
    
    # Try DD/MM/YYYY (Full date in JSON)
    try:
        return datetime.strptime(date_str, "%d/%m/%Y")
    except:
        pass
    
    # Try DD/MM (Partial) -> Force Year
    try:
        # Create a string "DD/MM/YYYY" first to handle leap years correctly
        full_date_str = f"{date_str}/{year_context}"
        return datetime.strptime(full_date_str, "%d/%m/%Y")
    except:
        # Try finding just day/month numbers
        import re
        m = re.match(r'(\d+)/(\d+)', date_str)
        if m:
            d, month = int(m.group(1)), int(m.group(2))
            try:
                return datetime(int(year_context), month, d)
            except:
                pass
        return None

def main():
    print(f"🚀 Scanning JSONs in {ROOT_DIR}...")
    
    all_txs = []
    files_processed = 0
    
    for root, dirs, files in os.walk(ROOT_DIR):
        for file in files:
            if file == 'document-annotation.json':
                json_path = os.path.join(root, file)
                folder_name = os.path.basename(root) # "BPBFC 20260131.pdf"
                
                # Extract year from filename as fallback context
                import re
                match = re.search(r'(\d{4})', folder_name)
                year_context = match.group(1) if match else "2023" # Fallback
                
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    releve = data.get('releve_bancaire', {})
                    if not releve: continue # Mistral formatting sometimes varies?
                    
                    txs = releve.get('transactions', [])
                    if not txs: continue
                    
                    print(f"📄 Processing {folder_name} ({len(txs)} txs)")
                    
                    for t in txs:
                        raw_date = t.get('date_operation')
                        date_obj = parse_date(raw_date, year_context)
                        
                        # Fallback: if date parsing failed, log it
                        if not date_obj:
                             print(f"   ⚠️ Bad Date: {raw_date} in {folder_name}")
                             continue

                        debit = float(t.get('debit', 0))
                        credit = float(t.get('credit', 0))
                        
                        amount = 0
                        category_hint = 'AUTRE'
                        
                        if credit > 0:
                            amount = credit
                            category_hint = 'RECETTE'
                        elif debit > 0:
                            amount = -debit # Negative for expenses
                            category_hint = 'ACHAT'
                            
                        if amount == 0: continue # Skip empty lines

                        all_txs.append({
                            'Date': date_obj,
                            'Libellé': t.get('libelle', ''),
                            'Montant': amount,
                            'SourceFile': folder_name,
                            'Type': 'IN' if amount > 0 else 'OUT'
                        })
                    
                    files_processed += 1
                        
                except Exception as e:
                    print(f"❌ Error reading {file}: {e}")

    if not all_txs:
        print("❌ No transactions found!")
        return

    # Convert to DataFrame
    df = pd.DataFrame(all_txs)
    
    # Sort by Date
    df = df.sort_values(by='Date')
    
    # Calculate Balance (Running Total)
    balance = 0
    running_bals = []
    for _, row in df.iterrows():
        balance += row['Montant']
        running_bals.append(round(balance, 2))
    
    df['Solde Progressif'] = running_bals
    
    # Export to one big sheet
    print(f"💾 Saving {len(df)} rows...")
    output_path = os.path.join(os.getcwd(), OUTPUT_FILE)
    df.to_excel(output_path, index=False)
    
    print(f"\n✨ FILE READY: {output_path}")
    print(f"💰 Solde Théorique Final : {balance:.2f} €")
    print("\n👉 Ouvre ce fichier, checke le solde final, et dis-moi 'GO IMPORT' !")

if __name__ == "__main__":
    main()
