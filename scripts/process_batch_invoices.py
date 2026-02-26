
import os
import fitz # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv
import json
import base64
import time
import glob
from pathlib import Path

# Load Environment Variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Configuration
SOURCE_DIR = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/01_ARCHIVES/Factures"
OUTPUT_DIR = "/Users/adambelal/Desktop/restaurant-os/processed_invoices"
EXCLUDED_DIRS = ['2018', '2020', '2021', '2022', 'Autres documents', 'Autres Documents']
TARGET_SUPPLIERS = ['METRO', 'COURTOIS', 'KRILL', 'POMONA', 'PASSION FROID', 'GRAND FRAIS']

# Safety: Create output dir
os.makedirs(OUTPUT_DIR, exist_ok=True)

if not API_KEY:
    print("❌ ERREUR: Clé API GEMINI non trouvée dans .env")
    print("Veuillez ajouter GEMINI_API_KEY=... dans votre fichier .env")
    exit(1)

genai.configure(api_key=API_KEY)

def is_eligible(root, filename):
    for excluded in EXCLUDED_DIRS:
        if excluded in root:
            return False
    filename_upper = filename.upper()
    for supplier in TARGET_SUPPLIERS:
        if supplier in filename_upper:
            return supplier
    return None

def pdf_page_to_base64(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        # Try to read first page. If mostly empty, read second?
        # For invoices, usually first page is enough.
        page = doc.load_page(0) 
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("jpeg")
        return base64.b64encode(img_data).decode('utf-8')
    except Exception as e:
        print(f"⚠️ PDF Read Error {pdf_path}: {e}")
        return None

def analyze_invoice(base64_image, supplier_hint):
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Tu es un assistant comptable précis. Analyse cette facture de {supplier_hint}.
    Extrais TOUS les articles un par un.
    
    Format JSON strict attendu:
    {{
        "supplierName": "{supplier_hint}",
        "date": "YYYY-MM-DD",
        "invoiceNo": "NUMERO",
        "totalAmount": 0.00,
        "items": [
           {{ "name": "Libellé exact", "quantity": 0.0, "unit": "kg/L/U", "unitPrice": 0.00, "totalPrice": 0.00 }}
        ]
    }}
    
    Règles:
    - Si "Colis" ou "C" -> unit: "U"
    - Si "KG" -> unit: "kg"
    - Si "L" -> unit: "L"
    - unitPrice doit être le prix unitaire HT
    """
    
    try:
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': base64_image},
            prompt
        ])
        return response.text
    except Exception as e:
        print(f"⚠️ Gemini Error: {e}")
        return None

def main():
    print(f"🚀 Scan: {SOURCE_DIR}")
    files_found = 0
    files_processed = 0
    files_skipped = 0
    errors = 0

    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            if not file.lower().endswith('.pdf'): continue
            
            supplier = is_eligible(root, file)
            if not supplier: continue
            
            files_found += 1
            
            # ID Unique based on filename
            safe_name = Path(file).stem.replace(" ", "_")
            output_file = os.path.join(OUTPUT_DIR, f"{safe_name}.json")
            
            # Skip if already processed
            if os.path.exists(output_file):
                # print(f"⏩ Déjà fait: {file}")
                files_skipped += 1
                continue
                
            print(f"\n🔄 Analyse ({files_processed + 1}): {file} [{supplier}]")
            
            # Rate limiting (Basic)
            time.sleep(1.5) 
            
            b64 = pdf_page_to_base64(os.path.join(root, file))
            if not b64:
                errors += 1
                continue
                
            json_text = analyze_invoice(b64, supplier)
            
            if json_text:
                try:
                    clean = json_text.replace('```json', '').replace('```', '')
                    data = json.loads(clean)
                    
                    # Validate basic checks 
                    if 'totalAmount' not in data:
                        print("⚠️ JSON invalide (pas de montant)")
                        errors += 1
                        continue

                    # Save
                    with open(output_file, 'w') as f:
                        json.dump(data, f, indent=2)
                        
                    print(f"   ✅ OK! {data.get('totalAmount')}€ - {len(data.get('items', []))} art.")
                    files_processed += 1
                    
                except Exception as e:
                    print(f"   ❌ JSON Parse Error: {e}")
                    # Save raw text for debug
                    with open(output_file + ".err", 'w') as f:
                        f.write(json_text)
                    errors += 1
            else:
                errors += 1

    print("\n--- TERMINÉ ---")
    print(f"Trouvés: {files_found}")
    print(f"Traités: {files_processed}")
    print(f"Ignorés (déjà faits): {files_skipped}")
    print(f"Erreurs: {errors}")

if __name__ == "__main__":
    main()
