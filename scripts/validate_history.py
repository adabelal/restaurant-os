import os
import re
import json
from pypdf import PdfReader
import itertools

def clean_price(s):
    if not s: return 0.0
    s = s.replace(' ', '').replace(',', '.')
    s = "".join(c for c in s if c.isdigit() or c in '.-')
    try: return float(s)
    except: return 0.0

def parse_balances(text):
    # Matches: SOLDE CREDITEUR AU 30/06/2023* 9 680,76 
    # Or: SOLDE CREDITEUR AU 31/12/2025 16 123,25
    matches = re.finditer(r'SOLDE\s+(?:CREDITEUR|DEBITEUR)\s+AU\s+\d{2}/\d{2}/\d{2,4}\*?\s+([\d\s]+,\d{2})', text, re.IGNORECASE)
    results = []
    for m in matches:
        val = clean_price(m.group(1))
        if "DEBITEUR" in m.group(0).upper(): val = -val
        results.append(val)
    return results

def get_row_elements(page):
    elements = []
    def visitor(text, cm, tm, fd, fs):
        t = text.strip()
        if t:
            elements.append({"text": t, "x": tm[4], "y": tm[5]})
    page.extract_text(visitor_text=visitor)
    return elements

def extract_txs_coord(page, year, debit_x, credit_x):
    elements = get_row_elements(page)
    rows = {}
    for e in elements:
        y = round(e["y"], 1)
        found = False
        for ry in rows:
            if abs(y - ry) < 3.0:
                rows[ry].append(e)
                found = True
                break
        if not found: rows[y] = [e]
    
    sorted_ys = sorted(rows.keys(), reverse=True)
    txs = []
    current_tx = None
    
    for y in sorted_ys:
        row_els = sorted(rows[y], key=lambda x: x["x"])
        line_text = " ".join([e["text"] for e in row_els])
        
        # Date pattern at start
        m_date = re.match(r'^(\d{2}/\d{2})\b', line_text)
        if m_date:
            if current_tx: txs.append(current_tx)
            day, month = m_date.group(1).split('/')
            
            amount = None
            desc_parts = []
            
            # Find the amount based on X
            for e in row_els:
                t_clean = e["text"].replace(' ', '').replace(',', '.')
                if re.match(r'^-?\d+\.\d{2}$', t_clean):
                    val = float(t_clean)
                    # Check if it looks like a price (at least one dot and two decimals)
                    # Coordinates check
                    dist_deb = abs(e["x"] - debit_x)
                    dist_cre = abs(e["x"] - credit_x)
                    if dist_deb < dist_cre:
                        amount = -abs(val)
                    else:
                        amount = abs(val)
                else:
                    if not re.match(r'^\d{2}/\d{2}$', e["text"]):
                        desc_parts.append(e["text"])
            
            if amount is not None:
                current_tx = {
                    "date": f"{year}-{month}-{day}T12:00:00Z",
                    "description": " ".join(desc_parts),
                    "amount": round(amount, 2)
                }
            else:
                current_tx = None
        elif current_tx:
            # Check for multi-line description or termination
            if any(k in line_text.upper() for k in ["PAGE", "SOLDE", "TOTAL", "DATE", "BANQUE"]):
                txs.append(current_tx)
                current_tx = None
            else:
                current_tx["description"] += " " + line_text
                
    if current_tx: txs.append(current_tx)
    return txs

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    
    all_final_txs = []
    
    print(f"{'Fichier':<40} | {'Début':<10} | {'Fin (PDF)':<10} | {'Calculé':<10} | {'Statut'}")
    print("-" * 110)
    
    for f in files:
        reader = PdfReader(os.path.join(folder, f))
        year = f.split('-')[0]
        
        # 1. Detect columns from page 1 headers
        p1 = reader.pages[0]
        elements = get_row_elements(p1)
        debit_x, credit_x = 445.0, 515.0 # Pre-defaults
        for e in elements:
            if e["text"] == "DEBIT": debit_x = e["x"]
            if e["text"] == "CREDIT": credit_x = e["x"]
        
        # 2. Extract balances from full text
        full_text = "\n".join([p.extract_text() for p in reader.pages])
        bals = parse_balances(full_text)
        if len(bals) < 2:
            print(f"{f:<40} | {'ERR':<10} | {'ERR':<10} | {'N/A':<10} | MANQUE BALANCES")
            continue
        
        start_bal, end_bal = bals[0], bals[-1]
        
        # 3. Extract transactions from all pages
        month_txs = []
        for page in reader.pages:
            month_txs.extend(extract_txs_coord(page, year, debit_x, credit_x))
            
        # Deduplicate potential overlaps between pages if they exist
        unique_txs = []
        seen = set()
        for t in month_txs:
            key = (t['date'], t['amount'], t['description'][:30])
            if key not in seen:
                unique_txs.append(t)
                seen.add(key)
        
        calc_delta = sum(t['amount'] for t in unique_txs)
        calc_end = round(start_bal + calc_delta, 2)
        
        diff = round(end_bal - calc_end, 2)
        status = "✅ OK" if abs(diff) < 0.05 else f"❌ ERR (Diff: {diff})"
        
        print(f"{f:<40} | {start_bal:<10.2f} | {end_bal:<10.2f} | {calc_end:<10.2f} | {status}")
        all_final_txs.extend(unique_txs)

    # Output final state
    final_output = []
    # Add initial balance from first statement as a tx
    first_file = files[0]
    first_reader = PdfReader(os.path.join(folder, first_file))
    first_bals = parse_balances("\n".join([p.extract_text() for p in first_reader.pages]))
    if first_bals:
        final_output.append({
            "date": "2023-05-30T00:00:00Z",
            "description": "SOLDE INITIAL",
            "amount": first_bals[0]
        })
    
    # Deduplicate global list
    seen = set()
    for t in all_final_txs:
        key = (t['date'], t['amount'], t['description'][:50])
        if key not in seen:
            final_output.append(t)
            seen.add(key)
            
    with open('history_data.json', 'w') as jf:
        json.dump(final_output, jf, indent=2)
        
    print("-" * 110)
    print(f"TOTAL TRANSACTIONS: {len(final_output)}")
    print(f"FINAL CALCULATED BALANCE: {sum(t['amount'] for t in final_output):.2f} €")
    print(f"EXPECTED BALANCE: 5948.78 €")

if __name__ == "__main__":
    main()
