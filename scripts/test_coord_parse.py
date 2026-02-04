from pypdf import PdfReader
import re
import json
import os

def get_elements(page):
    elements = []
    def visitor(text, cm, tm, fd, fs):
        t = text.strip()
        if t:
            elements.append({
                "text": t,
                "x": tm[4],
                "y": tm[5]
            })
    page.extract_text(visitor_text=visitor)
    return elements

def parse_pdf(path):
    reader = PdfReader(path)
    filename = os.path.basename(path)
    year = filename.split('-')[0]
    
    all_txs = []
    
    # 1. Determine columns from page 1
    p1 = reader.pages[0]
    els = get_elements(p1)
    
    debit_x = None
    credit_x = None
    for e in els:
        if e["text"] == "DEBIT": debit_x = e["x"]
        if e["text"] == "CREDIT": credit_x = e["x"]
    
    if not debit_x: debit_x = 445.0 # Fallback
    if not credit_x: credit_x = 515.0 # Fallback
    
    print(f"[{filename}] Columns - Debit: {debit_x:.2f}, Credit: {credit_x:.2f}")

    # Process all pages
    for page in reader.pages:
        els = get_elements(page)
        # Group by Y (with some tolerance)
        rows = {}
        for e in els:
            y = round(e["y"], 1)
            if y not in rows: rows[y] = []
            rows[y].append(e)
        
        sorted_ys = sorted(rows.keys(), reverse=True)
        
        current_tx = None
        for y in sorted_ys:
            row_els = sorted(rows[y], key=lambda x: x["x"])
            full_line = " ".join([e["text"] for e in row_els])
            
            # Check if line starts with Date (DD/MM)
            match = re.search(r'^(\d{2}/\d{2})', full_line)
            if match:
                if current_tx: all_txs.append(current_tx)
                
                date_str = match.group(1)
                day, month = date_str.split('/')
                
                # Find amounts in this line
                amt = 0
                description = ""
                
                # Identifying amount based on X
                # We look for something like "X XXX,XX"
                line_amount = None
                
                for e in row_els:
                    # Clean the number
                    t = e["text"].replace(' ', '').replace(',', '.')
                    # Check if it's a price
                    if re.match(r'^-?[\d.]+$', t) and "." in t:
                        val = float(t)
                        # Check X position
                        # If closer to debit_x, it's negative
                        # If closer to credit_x, it's positive
                        dist_debit = abs(e["x"] - debit_x)
                        dist_credit = abs(e["x"] - credit_x)
                        
                        if dist_debit < dist_credit:
                            line_amount = -abs(val)
                        else:
                            line_amount = abs(val)
                    else:
                        description += e["text"] + " "
                
                if line_amount is not None:
                    current_tx = {
                        "date": f"{year}-{month}-{day}T12:00:00Z",
                        "description": description.strip(),
                        "amount": line_amount
                    }
                else:
                    current_tx = None
            elif current_tx:
                # Part of description
                # Filter out headers/footers
                if any(k in full_line.upper() for k in ["PAGE", "SOLDE", "TOTAL DES MOUVEMENTS", "DATE", "BANQUE POPULAIRE"]):
                    all_txs.append(current_tx)
                    current_tx = None
                else:
                    current_tx["description"] += " " + full_line

        if current_tx: all_txs.append(current_tx)

    return all_txs

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    
    # Let's test on 2023-06
    txs = parse_pdf(os.path.join(folder, "2023-06_Extrait_Compte_32521140221.pdf"))
    print(f"Total Found: {len(txs)}")
    print(f"Sum: {sum(t['amount'] for t in txs):.2f}")
    
    # Let's inspect first few
    for t in txs[:10]:
        print(t)

if __name__ == "__main__":
    main()
