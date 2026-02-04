import os
import re
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

def main():
    path = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes/2023-07_Extrait_Compte_32521140221.pdf"
    if not os.path.exists(path):
        print("File not found")
        return

    reader = PdfReader(path)
    full_text = "\n".join([p.extract_text() for p in reader.pages])
    
    print("--- RAW FIRST 40 LINES ---")
    for i, line in enumerate(full_text.split('\n')[:40]):
        print(f"{i}: {line}")

    print("\n--- CANDIDATES ---")
    for line in full_text.split('\n'):
        line = line.strip()
        if "SOLDE" in line or "TOTAL" in line: continue
        if re.search(r'\d{2}/\d{2}/\d{4}', line): continue # Skip detail lines
        if re.search(r'\d{2}\.\d{2}\.\d{4}', line): continue

        if re.search(r'\d{2}/\d{2}', line):
            matches = re.findall(r'(?:\s|^)(\d[\d\s]*,\d{2})', line)
            if matches:
                 val = clean_price(matches[-1])
                 if val > 0.01 and val < 60000:
                     print(f"[{matches[-1]}] -> {val} | LINE: {line}")

if __name__ == "__main__":
    main()
