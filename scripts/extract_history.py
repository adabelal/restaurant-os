import os
import re
import json
from pypdf import PdfReader
from datetime import datetime

def parse_price(s):
    if not s: return 0.0
    s = s.replace(' ', '').replace(',', '.')
    s = "".join(c for c in s if c.isdigit() or c in '.-')
    try: return float(s)
    except: return 0.0

def parse_pdf(file_path):
    reader = PdfReader(file_path)
    filename = os.path.basename(file_path)
    year = filename.split('-')[0] if '-' in filename else "2023"
    full_text = ""
    for page in reader.pages: full_text += page.extract_text() + "\n"
    lines = full_text.split('\n')
    txs = []
    current_tx = None
    for line in lines:
        line = line.strip()
        match = re.search(r'^(\d{2}/\d{2})\s+(.*?)\s+(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+', line)
        if match:
            if current_tx: txs.append(current_tx)
            day, month = match.group(1).split('/')
            ref_part = match.group(2)
            rest = line[match.end():].strip()
            amts = re.findall(r'-?\s?[\d\s]+,\d{2}', rest)
            if amts:
                amount_str = amts[-1]
                if "-" in rest and "-" not in amount_str: amount_str = "-" + amount_str
                amount = parse_price(amount_str)
                desc = (ref_part + " " + rest.replace(amts[-1], "").replace("€", "").strip()).strip()
                desc_upper = desc.upper()
                is_negative = False
                if "-" in amount_str: is_negative = True
                else:
                    if any(k in desc_upper for k in ['CB****', 'RET DAB', 'RETRAIT', 'LOYER', 'METRO', 'URSSAF', 'EDF', 'BOURGOGNE', 'SONETRANS', 'COTIS', 'PRLV', 'FRAIS', 'DARTY', 'ACTION', 'BOUTIQUE ORANGE', 'COURTOIS', 'CASH', 'PAYFIT', 'GROUPAMA', 'ENGIE', 'SCI BAB', 'SIWA BLEURY', 'EPISAVEURS', 'L-ATELIER JEANNOT', 'DGFIP', 'TVA', 'IMPOT', 'ORDRE DE VIREMENT']):
                        is_negative = True
                    if "VIREMENT DE SARL SIWA" in desc_upper: is_negative = True
                    if "VIREMENT DE M ADAM BELAL" in desc_upper or "OUVERTURE CAPITAL" in desc_upper: is_negative = False
                    if any(k in desc_upper for k in ['REMISE CB', 'DEPOT AGENCE', 'VERSEMENT']): is_negative = False
                amount = -abs(amount) if is_negative else abs(amount)
                current_tx = {"date": f"{year}-{month}-{day}T12:00:00Z", "description": desc, "amount": amount}
        elif current_tx:
            if any(k in line.upper() for k in ["TOTAL", "SOLDE", "PAGE", "DATE"]):
                txs.append(current_tx)
                current_tx = None
            else:
                current_tx["description"] += " " + line
    if current_tx: txs.append(current_tx)
    return txs

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    all_transactions = []
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    for filename in files:
        all_transactions.extend(parse_pdf(os.path.join(folder, filename)))
    unique = []
    seen = set()
    for t in all_transactions:
        key = (t['date'], f"{t['amount']:.2f}", t['description'][:50])
        if key not in seen:
            unique.append(t)
            seen.add(key)
    with open('history_data.json', 'w') as f:
        json.dump(unique, f, indent=2)
    s = sum(tx['amount'] for tx in unique)
    print(f"Final Count: {len(unique)} | Final Sum: {s:.2f}")

if __name__ == "__main__":
    main()
