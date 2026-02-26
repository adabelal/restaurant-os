from pypdf import PdfReader
import re

def test_month(path):
    reader = PdfReader(path)
    text = reader.pages[0].extract_text(layout=True)
    lines = text.split('\n')
    
    # Find columns
    header_line = ""
    for l in lines:
        if "DEBIT" in l and "CREDIT" in l:
            header_line = l
            break
            
    if not header_line:
        print("Header not found")
        return
        
    debit_idx = header_line.find("DEBIT")
    credit_idx = header_line.find("CREDIT")
    print(f"Debit header at: {debit_idx}, Credit at: {credit_idx}")
    
    for l in lines:
        if re.match(r'^\d{2}/\d{2}', l.strip()):
            prices = list(re.finditer(r'(\d[\d\s]*,\d{2})', l))
            if prices:
                p = prices[-1] # Take the main one
                print(f"Price: [{p.group(1):<15}] Index: {p.start():<3} | Line: {l.strip()[:60]}...")

test_month('/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes/2023-06_Extrait_Compte_32521140221.pdf')
