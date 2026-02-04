from pypdf import PdfReader
import re
import json
import os

def clean_price(s):
    if not s: return 0.0
    s = s.replace(' ', '').replace(',', '.')
    try: return float(s)
    except: return 0.0

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    files = sorted([f for f in os.listdir(folder) if f.endswith('.pdf')])
    
    for f in files:
        reader = PdfReader(os.path.join(folder, f))
        text = "\n".join([p.extract_text() for p in reader.pages])
        bals = re.findall(r'SOLDE\s+(?:CREDITEUR|DEBITEUR)\s+AU\s+[\d/]+\*?\s+([\d\s.]*,\d{2})', text, re.I)
        if len(bals) >= 2:
            s, e = clean_price(bals[0]), clean_price(bals[-1])
            if "DEBITEUR" in text.split(bals[0])[0].upper().split('\n')[-1]: s = -s
            if "DEBITEUR" in text.split(bals[-1])[0].upper().split('\n')[-1]: e = -e
            target = round(e - s, 2)
            
            # Simple heuristic sum
            current_sum = 0
            for line in text.split('\n'):
                if re.match(r'^\d{2}/\d{2}', line.strip()):
                    p = re.findall(r'(\d[\d\s.]*,\d{2})', line)
                    if p:
                        v = clean_price(p[-1])
                        # Sign guess
                        sign = -1
                        if any(k in line.upper() for k in ['REMISE', 'DEPOT', 'VERSEMENT', 'ADAM']): sign = 1
                        current_sum += v * sign
            
            print(f"{f:<40} | PDF: {target:>10.2f} | MySum: {current_sum:>10.2f} | Diff: {target - current_sum:>10.2f}")

main()
