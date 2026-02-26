
import os
import fitz # PyMuPDF
import google.generativeai as genai
from dotenv import load_dotenv
import json
import base64
from PIL import Image
import io

# Load Environment Variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ ERREUR: Clé API GEMINI non trouvée dans .env")
    exit(1)

genai.configure(api_key=API_KEY)

# Configuration
SOURCE_DIR = "/Users/adambelal/Library/CloudStorage/GoogleDrive-a.belal@siwa-bleury.fr/Mon Drive/01_ARCHIVES/Factures"
TARGET_SUPPLIERS = ['METRO', 'COURTOIS', 'KRILL'] # On teste ceux qu'on a trouvés

def get_sample_files():
    samples = {}
    for root, dirs, files in os.walk(SOURCE_DIR):
        if any(ex in root for ex in ['2018', '2020', '2021', '2022', 'Autres']):
            continue
            
        for file in files:
            if not file.lower().endswith('.pdf'): continue
            
            for supplier in TARGET_SUPPLIERS:
                if supplier not in samples and supplier in file.upper():
                    samples[supplier] = os.path.join(root, file)
                    
        if len(samples) == len(TARGET_SUPPLIERS):
            break
    return samples

def pdf_page_to_base64(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        page = doc.load_page(0) # First page only for test
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Zoom for better quality
        img_data = pix.tobytes("jpeg")
        return base64.b64encode(img_data).decode('utf-8')
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None

def analyze_with_gemini(base64_image):
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = """
    Tu es expert comptable. Analyse cette facture.
    Extrais les données au format JSON strict :
    {
        "supplierName": "NOM",
        "date": "YYYY-MM-DD",
        "totalAmount": 0.00,
        "items": [
           { "name": "Nom produit", "quantity": 0.0, "unit": "kg/L/U", "unitPrice": 0.00, "totalPrice": 0.00 }
        ]
    }
    Sois précis sur les quantités et unités.
    """
    
    response = model.generate_content([
        {'mime_type': 'image/jpeg', 'data': base64_image},
        prompt
    ])
    
    return response.text

# --- MAIN ---
print("🚀 Démarrage du Test d'Extraction...")

samples = get_sample_files()
print(f"📄 Factures trouvées pour le test : {len(samples)}")

for supplier, path in samples.items():
    print(f"\nScanning {supplier} -> {os.path.basename(path)}")
    b64 = pdf_page_to_base64(path)
    
    if b64:
        print("   🔍 Envoi à Gemini...")
        try:
            res = analyze_with_gemini(b64)
            # Cleanup Markdown
            clean_res = res.replace('```json', '').replace('```', '')
            data = json.loads(clean_res)
            
            print(f"   ✅ Succès ! Données extraites :")
            print(json.dumps(data, indent=4, ensure_ascii=False))
        except Exception as e:
            print(f"   ❌ Erreur d'analyse : {e}")
