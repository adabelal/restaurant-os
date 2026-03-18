import os
import re
import base64
import sys
import shutil
import json
from io import BytesIO
import email.utils
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import requests
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Charger les variables d'environnement
local_env = os.path.join(os.path.dirname(__file__), '.env')
parent_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')

if os.path.exists(local_env):
    load_dotenv(local_env)
else:
    load_dotenv(parent_env)

from gmail_manager import get_gmail_service, get_drive_service

# Import de la librairie d'analyse PDF
try:
    from pypdf import PdfReader
except ImportError:
    print("Erreur: Module pypdf manquant.")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Erreur: Module beautifulsoup4 manquant.")
    sys.exit(1)

# Import Google GenAI (Nouveau package)
try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("⚠️ Module google-genai manquant. Le mode AI sera désactivé.")

# Configuration Drive
DRIVE_PATH = ["01_ARCHIVES", "Factures", "2026"]

# --- REGLES D'EXCLUSION (Filtres anti-bruit) ---
SKIP_KEYWORDS = [
    "offre d'emploi", "recrutement", "newsletter", "publicité", 
    "facture impayée", "votre commande", "confirmation d'inscription"
]
SKIP_SENDERS = [
    "no-reply@", "noreply@", "newsletter@", "spam@", "marketing@"
]

# Mapping des Tiers (Fallback manuel)
TIERS_MAPPING_FALLBACK = {
    'metro': 'METRO',
    'courtois': 'COURTOIS',
    'passion': 'PASSIONFROID',
    'passionfroid': 'PASSIONFROID',
    'episaveur': 'EPISAVEURS',
    'krill': 'KRILL',
    'bourgogne produits frais': 'BOURGOGNE_PRODUITS_FRAIS',
    'bpf': 'BOURGOGNE_PRODUITS_FRAIS',
    'amazon': 'AMAZON',
    'google': 'GOOGLE',
    'butagaz': 'BUTAGAZ',
    'grand frais': 'GRAND_FRAIS',
    'pascault': 'PASCAULT',
    'sacem': 'SACEM',
    'spre': 'SPRE',
    'edf': 'EDF',
    'orange': 'ORANGE',
    'sfr': 'SFR',
    'free': 'FREE',
    'uber': 'UBER',
    'deliveroo': 'DELIVEROO',
    'urssaf': 'URSSAF',
    'impots': 'DGFIP',
    'dgfip': 'DGFIP',
    'github': 'GITHUB',
    'hetzner': 'HETZNER',
    'ovh': 'OVH',
    'hostinger': 'HOSTINGER',
    'action': 'ACTION',
    'boulanger': 'BOULANGER',
    'verdin': 'GUILLAUME_VERDIN'
}

def clean_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)

def extract_amount_regex(text):
    match = re.search(r'(\d+[\.,]\d{2})\s?(?:€|EUR|euros)', text, re.IGNORECASE)
    if match:
        return match.group(1).replace(',', '.')
    return "0.00"

def predict_tier_regex(sender, subject, content=""):
    search_text = (sender + " " + subject + " " + content).lower()
    for key, value in TIERS_MAPPING_FALLBACK.items():
        if key in search_text:
            return value
    if '<' in sender:
        name = sender.split('<')[0].strip().replace('"', '')
        if not name:
            name = sender.split('<')[1].split('@')[0]
    else:
        name = sender
    return clean_filename(name).upper().replace(' ', '_')

def analyze_with_ai(text_content, sender_info, subject_info):
    """Utilise Gemini pour extraire les données structurées."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not HAS_GEMINI or not api_key:
        return None

    client = genai.Client(api_key=api_key)

    prompt = f"""
    Tu es un assistant comptable expert. Analyse le texte suivant extrait d'une facture ou d'un email.
    
    Contexte:
    - Expéditeur: {sender_info}
    - Sujet: {subject_info}
    
    Texte du document:
    {text_content[:15000]} (tronqué si trop long)

    Instructions:
    1. Identifie le fournisseur (Normalisé, MAJUSCULES, ex: 'METRO', 'UBER_EATS').
    2. Identifie la date de la facture (Format YYYY-MM-DD). Si introuvable, utilise la date d'aujourd'hui.
    3. Extrait le montant TOTAL TTC (nombre décimal).
    4. Détermine le type de document : 'FACT' (Facture), 'AVOIR', 'RELEVE' (Relevé mensuel), 'DOC' (Autre).
    
    Réponds UNIQUEMENT avec un objet JSON valide, sans markdown.
    Format attendu:
    {{
        "supplier": "NOM_FOURNISSEUR",
        "date": "YYYY-MM-DD",
        "amount": 0.00,
        "type": "FACT"
    }}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(cleaned_text)
        return data
    except Exception as e:
        print(f"⚠️ Erreur AI: {e}")
        return None

def analyze_music_proposal_with_ai(text_content, sender_info, subject_info):
    """Utilise Gemini pour extraire les données d'un groupe de musique."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not HAS_GEMINI or not api_key:
        return None

    client = genai.Client(api_key=api_key)

    prompt = f"""
    Tu es un agent artistique chargé de qualifier les propositions de groupes de musique.
    Analyse le texte suivant qui est une proposition de concert.
    
    Contexte:
    - Expéditeur: {sender_info}
    - Sujet: {subject_info}
    
    Texte de l'email:
    {text_content[:15000]}

    Instructions:
    1. Identifie le NOM du groupe ou de l'artiste.
    2. Identifie le STYLE de musique de manière TRÈS simplifiée (ex: Pop/Rock, Rock, Jazz, Reggae, DJ Set, Electro, Inconnu). 
       Si c'est un mélange, choisis les 1 ou 2 catégories dominantes séparées par un slash.
    3. Extrait les CONTACTS : Nom, Email, Téléphone.
    4. Extrait TOUS les LIENS de présentation (Youtube, Spotify, Instagram, Vimeo, Soundcloud, etc.).
    5. Fais un résumé TRÈS court (1 phrase) de la proposition.
    
    Réponds UNIQUEMENT avec un objet JSON valide.
    Format attendu:
    {{
        "bandName": "NOM",
        "style": "STYLE_SIMPLIFIE",
        "contactName": "NOM_CONTACT",
        "contactEmail": "EMAIL",
        "contactPhone": "TEL",
        "socialLinks": ["URL1", "URL2"],
        "summary": "RESUME"
    }}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(cleaned_text)
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                return None
        return data
    except Exception as e:
        print(f"⚠️ Erreur AI Musique: {e}")
        return None

def extract_text_from_pdf(pdf_data):
    try:
        reader = PdfReader(BytesIO(pdf_data))
        text = ""
        for i, page in enumerate(reader.pages):
            if i > 2: break
            text += page.extract_text() or ""
        return text
    except Exception:
        return ""

def get_or_create_folder(drive_service, folder_name, parent_id=None):
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    
    if files:
        return files[0]['id']
    else:
        print(f"Création du dossier Drive : {folder_name}")
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
        folder = drive_service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')

def get_folder_id_from_path(drive_service, path_list):
    parent_id = None
    for folder_name in path_list:
        parent_id = get_or_create_folder(drive_service, folder_name, parent_id)
    return parent_id

def file_exists_on_drive(drive_service, folder_id, filename):
    query = f"name = '{filename}' and '{folder_id}' in parents and trashed = false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    return len(results.get('files', [])) > 0

def upload_to_drive(drive_service, folder_id, filename, data):
    media = MediaIoBaseUpload(BytesIO(data), mimetype='application/pdf')
    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    file = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    return file.get('id')

def get_db_connection():
    """Crée une connexion à PostgreSQL si DATABASE_URL est présent."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None
    try:
        # psycopg2 accepte directement l'URL (format postgres://...)
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"⚠️ Erreur de connexion DB: {e}")
        return None

def sync_to_restaurant_os(data):
    """Envoie les données au webhook Interne OU écrit directement en DB"""
    # 1. Tentative de Synchro Directe en Base de Données (Priorité "Tout sur serveur")
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            
            # Upsert Fournisseur (Supplier)
            supplier_name = data.get("supplierName")
            cur.execute('INSERT INTO "Supplier" (id, name) VALUES (gen_random_uuid()::text, %s) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', (supplier_name,))
            supplier_id = cur.fetchone()[0]
            
            # Créer PurchaseOrder
            cur.execute('''
                INSERT INTO "PurchaseOrder" (
                    id, "supplierId", date, "invoiceNo", "totalAmount", status, "scannedUrl", "paymentMethod", "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) RETURNING id
            ''', (
                supplier_id, 
                data.get("date"), 
                None, # invoiceNo non extrait par le script simple
                data.get("totalAmount"), 
                'VALIDATED' if data.get("isFinancial") else 'DRAFT',
                data.get("scannedUrl"),
                None # paymentMethod
            ))
            purchase_order_id = cur.fetchone()[0]
            
            # Enregistrer dans ProcessedMail
            metadata = data.get("emailMetadata", {})
            cur.execute('''
                INSERT INTO "ProcessedMail" (
                    id, "messageId", subject, sender, date, type, status, amount, "targetId", "fileUrl", "fileName"
                ) VALUES (
                    gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT ("messageId") DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount
            ''', (
                metadata.get("messageId"),
                metadata.get("subject", "Sans objet"),
                metadata.get("sender", "Inconnu"),
                data.get("date"),
                "INVOICE" if data.get("isFinancial") else "DOCUMENT",
                "SUCCESS",
                data.get("totalAmount"),
                purchase_order_id,
                data.get("scannedUrl"),
                data.get("fileName")
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            print(f"🚀 Synchro DB OK (Facture)")
            return True
        except Exception as e:
            print(f"❌ Erreur DB Facture: {e}")
            if conn: conn.rollback()
            # On laisse le code continuer vers le webhook en cas d'erreur DB
    
    # 2. Fallback Webhook (Si DB indisponible ou erreur)
    api_url = os.getenv("RESTAURANT_OS_API_URL")
    api_key = os.getenv("RESTAURANT_OS_API_KEY")
    
    if not api_url:
        print("⚠️  URL API manquante (RESTAURANT_OS_API_URL). Sync ignorée.")
        return False

    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {api_key or ''}"
    }
    
    try:
        response = requests.post(api_url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"🚀 Synchro Restaurant-OS OK")
            return True
        else:
            print(f"❌ Erreur synchro: [{response.status_code}] {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur réseau synchro: {e}")
        return False

def sync_music_proposal_to_restaurant_os(data):
    """Envoie une proposition de groupe au webhook OU écrit directement en DB"""
    # 1. Tentative Directe en DB
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO "MusicBandProposal" (
                    id, "bandName", style, "contactName", "contactEmail", "contactPhone", "fullDescription", "emailDate", "messageId", status, "createdAt", "updatedAt", "videoLinks"
                ) VALUES (
                    gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s
                ) ON CONFLICT ("messageId") DO NOTHING
            ''', (
                data.get("bandName"),
                data.get("style"),
                data.get("contactName"),
                data.get("contactEmail"),
                data.get("contactPhone"),
                data.get("fullDescription"),
                data.get("emailDate"),
                data.get("messageId"),
                "PENDING",
                data.get("videoLinks", [])
            ))
            conn.commit()
            cur.close()
            conn.close()
            print(f"🎸 Synchro DB OK (Musique)")
            return True
        except Exception as e:
            print(f"❌ Erreur DB Musique: {e}")
            if conn: conn.rollback()
    
    # 2. Fallback Webhook
    raw_api_url = os.getenv("RESTAURANT_OS_API_URL")
    if not raw_api_url:
        return False

    import urllib.parse
    parsed = urllib.parse.urlparse(raw_api_url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    api_url = f"{base_url}/api/webhooks/music-proposals"
    
    api_key = os.getenv("RESTAURANT_OS_API_KEY")

    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {api_key or ''}"
    }
    
    try:
        response = requests.post(api_url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"🎸 Synchro Musique OK")
            return True
        else:
            print(f"❌ Erreur synchro Musique: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur réseau Musique: {e}")
        return False

def sync_popina_to_restaurant_os(data):
    """Envoie les données de caisse Popina au webhook dédié"""
    raw_api_url = os.getenv("RESTAURANT_OS_API_URL")
    import urllib.parse
    parsed = urllib.parse.urlparse(raw_api_url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    api_url = os.getenv("RESTAURANT_OS_POPINA_URL") or f"{base_url}/api/webhooks/popina"
    api_key = os.getenv("RESTAURANT_OS_API_KEY")
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": f"{api_key or ''}"
    }
    
    try:
        response = requests.post(api_url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"🚀 Synchro Popina OK")
            return True
        else:
            print(f"❌ Erreur synchro Popina: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur réseau Popina: {e}")
        return False

def mark_as_processed(service, msg_id):
    """Ajoute le label 'Archive_AI' au message pour ne plus le traiter."""
    label_name = "Archive_AI"
    try:
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        label_id = next((l['id'] for l in labels if l['name'] == label_name), None)
        
        if not label_id:
            label_body = {'name': label_name, 'labelListVisibility': 'labelShow', 'messageListVisibility': 'show'}
            label = service.users().labels().create(userId='me', body=label_body).execute()
            label_id = label['id']
        
        service.users().messages().batchModify(
            userId='me',
            body={
                'ids': [msg_id],
                'addLabelIds': [label_id],
                'removeLabelIds': ['INBOX']
            }
        ).execute()
    except Exception as e:
        print(f"⚠️ Erreur archivage Gmail: {e}")

def download_and_upload_invoices():
    gmail_service = get_gmail_service()
    drive_service = get_drive_service()
    if not gmail_service or not drive_service:
        return

    print("🔍 Récupération de l'arborescence Drive...")
    root_folder_id = get_folder_id_from_path(drive_service, DRIVE_PATH)
    autres_folder_id = get_or_create_folder(drive_service, "Autres", root_folder_id)

    # 1. SCAN DES FACTURES ET DOCUMENTS
    print("\n--- 📝 SCAN FACTURES & DOCUMENTS ---")
    query_docs = '-label:Archive_AI after:2025/12/31 has:attachment filename:pdf'
    
    messages = []
    next_page = None
    while True:
        results = gmail_service.users().messages().list(userId='me', q=query_docs, pageToken=next_page).execute()
        batch = results.get('messages', [])
        messages.extend(batch)
        next_page = results.get('nextPageToken')
        if not next_page: break
            
    print(f"--> {len(messages)} emails de facturation trouvés.")
    
    processed_count = 0
    uploaded_count = 0
    
    for msg_info in messages:
        try:
            msg = gmail_service.users().messages().get(userId='me', id=msg_info['id']).execute()
            payload = msg.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'Sans objet')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Inconnu')
            email_date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
            
            dt = datetime.now()
            if email_date_str:
                dt = email.utils.parsedate_to_datetime(email_date_str)
            
            formatted_date = dt.strftime('%Y_%m_%d')
            parts = payload.get('parts', [])
            
            def get_attachments(parts_list):
                found = []
                for p in parts_list:
                    if p.get('parts'): found.extend(get_attachments(p['parts']))
                    if p.get('filename') and p.get('body') and p.get('body').get('attachmentId'):
                        if p['filename'].lower().endswith('.pdf'): found.append(p)
                return found

            attachments = get_attachments(parts)
            all_success = True
            for part in attachments:
                att_id = part['body']['attachmentId']
                attachment = gmail_service.users().messages().attachments().get(
                    userId='me', messageId=msg_info['id'], id=att_id).execute()
                data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
                
                pdf_text = extract_text_from_pdf(data)
                ai_data = analyze_with_ai(pdf_text, sender, subject)
                
                if ai_data:
                    tier = ai_data.get('supplier', 'INCONNU').upper().replace(' ', '_')
                    amount = str(ai_data.get('amount', '0.00'))
                    doc_type = ai_data.get('type', 'DOC')
                    invoice_date = ai_data.get('date', dt.strftime('%Y-%m-%d')).replace('-', '_')
                else:
                    tier = predict_tier_regex(sender, subject, pdf_text)
                    amount = extract_amount_regex(subject) or extract_amount_regex(pdf_text)
                    doc_type = "DOC"
                    invoice_date = formatted_date

                new_filename = f"{invoice_date}_{doc_type}_{tier}_{amount}.pdf"
                is_financial = doc_type in ['FACT', 'AVOIR', 'RELEVE']
                target_folder = root_folder_id if is_financial else autres_folder_id
                
                if not file_exists_on_drive(drive_service, target_folder, new_filename):
                    file_id = upload_to_drive(drive_service, target_folder, new_filename, data)
                    uploaded_count += 1
                    sync_data = {
                        "supplierName": tier,
                        "date": invoice_date.replace("_", "-"),
                        "totalAmount": float(amount),
                        "scannedUrl": f"https://drive.google.com/file/d/{file_id}/view",
                        "fileName": new_filename,
                        "isFinancial": is_financial,
                        "emailMetadata": {"messageId": msg_info['id'], "subject": subject, "sender": sender}
                    }
                    if not sync_to_restaurant_os(sync_data): all_success = False
            
            if attachments and all_success:
                mark_as_processed(gmail_service, msg_info['id'])
                processed_count += 1
        except Exception as e:
            print(f"❌ Erreur document: {e}")

    # 2. SCAN DES PROPOSITIONS MUSICALES
    print("\n--- 🎸 SCAN PROPOSITIONS MUSICALES ---")
    query_music = '-label:Archive_AI after:2025/12/31 (concert OR groupe OR booking OR musique OR musicien OR "proposition musicale")'
    
    results = gmail_service.users().messages().list(userId='me', q=query_music).execute()
    music_messages = results.get('messages', [])
    
    for msg_info in music_messages:
        try:
            msg = gmail_service.users().messages().get(userId='me', id=msg_info['id'], format='full').execute()
            headers = msg.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'Sans objet')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Inconnu')
            date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
            dt = email.utils.parsedate_to_datetime(date_str) if date_str else datetime.now()

            # --- APPLICATION DES REGLES D'EXCLUSION ---
            skip_mail = False
            full_content_for_skip = (subject + " " + sender).lower()
            
            # Vérifier l'expéditeur
            for s in SKIP_SENDERS:
                if s.lower() in sender.lower():
                    skip_mail = True
                    break
            
            # Vérifier les mots-clés dans l'objet
            if not skip_mail:
                for k in SKIP_KEYWORDS:
                    if k.lower() in subject.lower():
                        skip_mail = True
                        break
            
            if skip_mail:
                print(f"⏭️  Email ignoré (filtre) : {subject}")
                mark_as_processed(gmail_service, msg_info['id'])
                continue

            def get_body(payload):
                text = ""
                if 'body' in payload and 'data' in payload['body']:
                    text += base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
                if 'parts' in payload:
                    for part in payload['parts']:
                        text += get_body(part)
                return text

            body_raw = get_body(msg.get('payload', {}))
            if "<html" in body_raw.lower():
                body_text = BeautifulSoup(body_raw, 'html.parser').get_text(separator='\n')
            else:
                body_text = body_raw
            
            print(f"🎸 Analyse proposition: {subject}")
            band_info = analyze_music_proposal_with_ai(body_text, sender, subject)
            
            if band_info:
                sync_data = {
                    "bandName": band_info.get("bandName"),
                    "style": band_info.get("style"),
                    "contactName": band_info.get("contactName"),
                    "contactEmail": band_info.get("contactEmail"),
                    "contactPhone": band_info.get("contactPhone"),
                    "videoLinks": band_info.get("socialLinks", []), # On garde le nom du champ pour la compat DB
                    "fullDescription": body_text,
                    "emailDate": dt.isoformat(),
                    "messageId": msg_info['id']
                }
                if sync_music_proposal_to_restaurant_os(sync_data):
                    mark_as_processed(gmail_service, msg_info['id'])
                    print(f"✅ Proposition sync: {band_info.get('bandName')}")
        except Exception as e:
            print(f"❌ Erreur musique: {e}")

    print(f"\nTerminé : {processed_count} factures, {uploaded_count} uploads.")

if __name__ == '__main__':
    download_and_upload_invoices()
