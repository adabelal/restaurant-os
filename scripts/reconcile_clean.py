import os
import re
import json
from pypdf import PdfReader

def clean_price(s):
    if not s: return 0.0
    if len(s) > 1 and s.startswith('0') and s[1] in ' \t0123456789':
        if s[1] != ',':
             parts = s.split()
             if len(parts) > 1: return clean_price(parts[-1])
             return 0.0
    s_clean = s.replace(' ', '').replace(',', '.')
    s_clean = "".join(c for c in s_clean if c.isdigit() or c in '.-')
    try: return float(s_clean)
    except: return 0.0

def process_month(path):
    reader = PdfReader(path)
    filename = os.path.basename(path)
    # Extract year: handle both '2026-01_Extrait...' and 'Extrait Septembre 2024...'
    year_match = re.search(r'(20\d{2})', filename)
    year = year_match.group(1) if year_match else "2024"
    
    full_text = ""
    for page in reader.pages: full_text += page.extract_text() + "\n"
    
    # 1. Balances
    bals = re.findall(r'SOLDE\s+(CREDITEUR|DEBITEUR)\s+AU\s+(\d{2}/\d{2}/\d{2,4})\*?\s+([\d\s]+,\d{2})', full_text)
    if len(bals) < 2: return None
    
    start_m, end_m = bals[0], bals[-1]
    s_val = clean_price(start_m[2])
    if start_m[0] == "DEBITEUR": s_val = -s_val
    e_val = clean_price(end_m[2])
    if end_m[0] == "DEBITEUR": e_val = -e_val
    target_delta = round(e_val - s_val, 2)
    
    # 2. Transactions
    candidates = []
    
    KW_CREDIT = ['REMISE', 'DEPOT', 'VERSEMENT', 'VIREMENT DE M ADAM', 'CAPITAL', 'RMBT', 'AVOIR']
    KW_DEBIT  = ['PRLV', 'RETRAIT', 'RET DAB', 'CB*', 'LCL', 'SFG', 'URSSAF', 'DGFIP', 'METRO', 'EDF', 'LOYER', 'SCI', 
                 'ORANGE', 'SFR', 'BOUYGUES', 'COURTOIS', 'BRAKE', 'PRO A PRO', 'TRANSGOURMET', 'CARREFOUR', 'LECLERC',
                 'INTERMARCHE', 'ALDI', 'LIDL', 'TOTAL', 'ESSO', 'SHELL', 'STATION', 'PEAGE', 'SNCF', 'AMAZON', 
                 'GOOGLE', 'APPLE', 'FACEBOOK', 'PAYFIT', 'ALAN', 'QONTO', 'SHINE', 'CARD']

    for line in full_text.split('\n'):
        line = line.strip()
        if "SOLDE" in line or "TOTAL" in line: continue
        if re.search(r'\d{2}/\d{2}/\d{4}', line): continue
        if re.search(r'\d{2}\.\d{2}\.\d{4}', line): continue
        # Exclude SEPA detail section lines (format: FOURNISSEUR FR74ZZZ... montant €DD/MM)
        if re.search(r'FR\d+ZZZ', line): continue
        if re.search(r'DETAIL DE VOS', line): continue

        if re.match(r'^\d{2}/\d{2}', line):
            matches = re.findall(r'(?:\s|^)(\d[\d\s]*,\d{2})', line)
            if matches:
                 val = clean_price(matches[-1])
                 if val > 0.01 and val < 60000:
                     d_str = re.match(r'^\d{2}/\d{2}', line).group()
                     day, month = d_str.split('/')
                     
                     # Default Sign Heuristic
                     sign = -1 # Assume Expense default
                     u = line.upper()
                     if any(k in u for k in KW_CREDIT): sign = 1
                     elif any(k in u for k in KW_DEBIT) or "-" in line: sign = -1
                     
                     candidates.append({
                         "date": f"{year}-{month}-{day}T12:00:00Z",
                         "description": line,
                         "amount": round(val * sign, 2)
                     })

    # 3. Force Reconciliation
    current_delta = sum(c['amount'] for c in candidates)
    diff = round(target_delta - current_delta, 2)
    
    if abs(diff) > 0.01:
        # Check if single flip works (User's fix logic)
        flipped = False
        for c in candidates:
            # If flipping sign (c['amount'] * -1) fixes the diff
            # NewDelta = Current - Amount + (-Amount) = Current - 2*Amount
            # We want NewDelta == Target => Current - 2*Amount == Target => 2*Amount == Current - Target => 2*Amount == -Diff
            if abs(2 * c['amount'] + diff) < 0.05:
                c['amount'] = -c['amount']
                flipped = True
                break
        
        if not flipped:
            # Add Adjustment Line
            candidates.append({
                "date": f"{year}-{end_m[1].split('/')[1]}-{end_m[1].split('/')[0]}T12:00:00Z",
                "description": f"AJUSTEMENT AUTOMATIQUE ({filename})",
                "amount": diff
            })

    return {"txs": candidates, "start": s_val}

def main():
    # Try multiple possible folder locations (in priority order)
    folders_to_try = [
        "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/FINANCE/Banque",
        "/Users/adambelal/Library/CloudStorage/GoogleDrive-siwa.bleury@gmail.com/Mon Drive/iCloud Siwa/Relevés bancaires/Comptes",
    ]
    folder = None
    for f in folders_to_try:
        if os.path.exists(f):
            folder = f
            break
    if not folder:
        print("ERROR: No bank statement folder found.")
        return
    print(f"Reading from: {folder}")
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf') and not f.startswith('.')])
    print(f"Found {len(files)} PDF files.")
    
    history = []
    
    # Init
    if files:
        res0 = process_month(os.path.join(folder, files[0]))
        if res0:
             history.append({"date": "2023-05-30T00:00:00Z", "description": "SOLDE INITIAL", "amount": res0['start']})
    
    for f in files:
        res = process_month(os.path.join(folder, f))
        if res:
            history.extend(res['txs'])

    # Global deduplication (same transaction can appear on boundary of 2 months)
    seen_keys = set()
    deduped = []
    for t in history:
        key = (t['date'][:10], round(t['amount'], 2), t['description'].strip())
        if key not in seen_keys:
            seen_keys.add(key)
            deduped.append(t)
    removed = len(history) - len(deduped)
    print(f"Deduplication: removed {removed} exact duplicates → {len(deduped)} transactions remain.")

    with open('history_data.json', 'w') as jf:
        json.dump(deduped, jf, indent=2)
    print(f"TOTAL: {sum(t['amount'] for t in deduped):.2f}")

if __name__ == "__main__":
    main()
