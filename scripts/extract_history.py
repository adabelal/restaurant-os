import os
import re
import json
from pypdf import PdfReader

def parse_pdf(file_path):
    reader = PdfReader(file_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
    
    # Identify the year from the filename (e.g., 2026-01_...)
    filename = os.path.basename(file_path)
    year = filename.split('-')[0]
    
    transactions = []
    
    # Regex to find transaction lines
    # Pattern: Date(DD/MM) + Description + Date(DD/MM) + Date(DD/MM) + Amount(with €)
    # Example: 02/01 REMISE CB 5401547011 0926211 02/01 02/01  3 725,60 €
    # Example: 02/01 PRLV SEPA FMB 01EBTDS 02/01 02/01 - 291,83 €
    
    lines = full_text.split('\n')
    
    current_tx = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Look for a starting transaction line
        # Start with DD/MM
        match = re.match(r'^(\d{2}/\d{2})\s+(.*?)\s+(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+(-?\s?[\d\s]+,\d{2})\s?€', line)
        
        if match:
            if current_tx:
                transactions.append(current_tx)
            
            date_str = match.group(1) # DD/MM
            description = match.group(2)
            amount_str = match.group(5).replace(' ', '').replace(',', '.')
            
            # Format date as YYYY-MM-DD
            day, month = date_str.split('/')
            formatted_date = f"{year}-{month}-{day}T12:00:00Z"
            
            current_tx = {
                "date": formatted_date,
                "description": description,
                "amount": float(amount_str)
            }
        elif current_tx:
            # Check if this line is part of the description (indented or following)
            # Avoid lines that look like a new transaction or headers
            if "SOLDE" in line or "PAGE" in line.upper():
                transactions.append(current_tx)
                current_tx = None
            else:
                # Append extra info to description
                current_tx["description"] += " " + line
    
    if current_tx:
        transactions.append(current_tx)
        
    return transactions

def main():
    folder = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/Comptes"
    all_data = []
    
    files = [f for f in os.listdir(folder) if f.endswith('.pdf')]
    files.sort() # Process in order
    
    print(f"Found {len(files)} files.")
    
    for f in files:
        path = os.path.join(folder, f)
        try:
            txs = parse_pdf(path)
            all_data.extend(txs)
            print(f"Processed {f}: {len(txs)} transactions.")
        except Exception as e:
            print(f"Error processing {f}: {e}")
            
    with open('history_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
