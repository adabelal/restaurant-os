
import csv
import pandas as pd
import os
from datetime import datetime

# CONFIGURATION
CSV_FILE = '/Users/adambelal/Desktop/restaurant-os/BPBFC_OP_20260218.csv'
TARGET_BALANCE = 9638.27 
OUTPUT_EXCEL = 'FINAL_IMPORT_READY.xlsx'

def parse_amount(val):
    if not val: return 0.0
    s = str(val).replace('\xa0', '').replace(' ', '').replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

def main():
    print(f"🚀 Lecture Manuelle CSV : {CSV_FILE}")
    
    transactions = []
    total_movements = 0.0
    min_date = None
    
    try:
        with open(CSV_FILE, 'r', encoding='latin1') as f:
            reader = csv.reader(f, delimiter=';')
            headers = next(reader)
            print(f"H: {headers}")
            
            # COLUMNS MAPPING (Manually Identified)
            # 0: Compte
            # 1: Date Compta
            # 2: Date Opération
            # 3: Libellé
            # 4: Référence
            # 5: Date Valeur
            # 6: Montant
            IDX_DATE = 2
            IDX_LIBELLE = 3
            IDX_MONTANT = 6
            
            for row in reader:
                if not row or len(row) < 7: continue
                
                # Date
                date_str = row[IDX_DATE]
                try:
                    date_obj = datetime.strptime(date_str, "%d/%m/%Y")
                except:
                    continue
                    
                if not min_date or date_obj < min_date:
                    min_date = date_obj
                
                # Amount
                amount_str = row[IDX_MONTANT]
                amount = parse_amount(amount_str)
                if amount == 0: continue
                
                # Libelle
                libelle = row[IDX_LIBELLE]
                
                total_movements += amount
                
                transactions.append({
                    'Date': date_obj,
                    'Libellé': libelle,
                    'Montant': amount,
                    'Type': 'IN' if amount > 0 else 'OUT',
                    'Source': 'CSV_RECENT'
                })
                
    except Exception as e:
        print(f"❌ Error Reading CSV: {e}")
        return

    print(f"✅ {len(transactions)} transactions extraites.")
    print(f"📉 Total Mouvements : {total_movements:.2f} €")
    
    # CALCUL SOLDE INITIAL
    if min_date:
        initial_balance = TARGET_BALANCE - total_movements
        print(f"🏁 Solde Initial (au {min_date.strftime('%d/%m/%Y')}) : {initial_balance:.2f} €")
        
        # Insert Initial Balance
        transactions.insert(0, {
            'Date': min_date,
            'Libellé': "SOLDE INITIAL (Reprise Historique)",
            'Montant': initial_balance,
            'Type': 'IN' if initial_balance > 0 else 'OUT', 
            'Source': 'REPRISE'
        })
    else:
        print("❌ Aucune date trouvée.")
        return

    # Export to Excel
    df_final = pd.DataFrame(transactions)
    
    # Add Running Balance
    b = 0
    bals = []
    for x in df_final['Montant']:
        b += x
        bals.append(round(b, 2))
    df_final['Solde Progressif'] = bals
    
    output_path = os.path.join(os.getcwd(), OUTPUT_EXCEL)
    df_final.to_excel(output_path, index=False)
    
    print(f"✨ Fichier Excel prêt : {output_path}")
    print(f"💰 Vérification Solde Final : {bals[-1]} € (Cible: {TARGET_BALANCE})")

if __name__ == "__main__":
    main()
