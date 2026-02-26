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
    year = filename.split('-')[0]
    
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

        if re.search(r'\d{2}/\d{2}', line):
            matches = re.findall(r'(?:\s|^)(\d[\d\s]*,\d{2})', line)
            if matches:
                 val = clean_price(matches[-1])
                 if val > 0.01 and val < 60000:
                     d_str = re.search(r'\d{2}/\d{2}', line).group()
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
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    if not os.path.exists(folder): return
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    
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

    with open('history_data.json', 'w') as jf:
        json.dump(history, jf, indent=2)
    print(f"TOTAL: {sum(t['amount'] for t in history):.2f}")

if __name__ == "__main__":
    main()
