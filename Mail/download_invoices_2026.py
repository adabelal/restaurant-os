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

# Charger les variables d'environnement depuis la racine (../.env)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

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
            model='gemini-2.5-flash',
            contents=prompt
        )
        # Nettoyage du markdown json si présent
        cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(cleaned_text)
        return data
    except Exception as e:
        print(f"⚠️ Erreur AI: {e}")
        return None

def extract_text_from_pdf(pdf_data):
    try:
        reader = PdfReader(BytesIO(pdf_data))
        text = ""
        for i, page in enumerate(reader.pages):
            if i > 2: break # On lit un peu plus de pages pour l'AI
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

def sync_to_restaurant_os(data):
    """Envoie les données au webhook Interne de Restaurant-OS"""
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
        if response.status_code == 200 or response.status_code == 201:
            print(f"🚀 Synchro Restaurant-OS OK")
            return True
        else:
            print(f"❌ Erreur synchro: [{response.status_code}] {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur réseau synchro: {e}")
        return False

def sync_popina_to_restaurant_os(data):
    """Envoie les données de caisse Popina au webhook dédié"""
    raw_api_url = os.getenv("RESTAURANT_OS_API_URL") or "http://localhost:3000/api/webhooks/invoices"
    # Extraction de la base (ex: http://localhost:3000)
    import urllib.parse
    parsed = urllib.parse.urlparse(raw_api_url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    
    api_url = os.getenv("RESTAURANT_OS_POPINA_URL") or f"{base_url}/api/webhooks/popina"
    api_key = os.getenv("RESTAURANT_OS_API_KEY")
    
    if not api_url:
        print("⚠️ URL API Popina manquante. Sync ignorée.")
        return False

    headers = {
        "Content-Type": "application/json",
        "x-api-key": f"{api_key or ''}"
    }
    
    try:
        response = requests.post(api_url, json=data, headers=headers)
        if response.status_code == 200 or response.status_code == 201:
            print(f"🚀 Synchro Popina OK")
            return True
        else:
            print(f"❌ Erreur synchro Popina: [{response.status_code}] {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur réseau synchro Popina: {e}")
        return False

def mark_as_processed(service, msg_id):
    """Ajoute le label 'Archive_AI' au message pour ne plus le traiter."""
    label_name = "Archive_AI"
    try:
        # Trouver ou créer le label
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        label_id = next((l['id'] for l in labels if l['name'] == label_name), None)
        
        if not label_id:
            label_body = {'name': label_name, 'labelListVisibility': 'labelShow', 'messageListVisibility': 'show'}
            label = service.users().labels().create(userId='me', body=label_body).execute()
            label_id = label['id']
        
        # Appliquer le label
        service.users().messages().batchModify(
            userId='me',
            body={
                'ids': [msg_id],
                'addLabelIds': [label_id],
                'removeLabelIds': ['INBOX'] # On l'archive de la boîte de réception
            }
        ).execute()
    except Exception as e:
        print(f"⚠️ Erreur archivage Gmail: {e}")

def process_popina_reports(service):
    """Recherche et traite les rapports de fin de caisse Popina."""
    print("🔍 Recherche Gmail (Rapports Popina sans restriction de l'INBOX)...")
    query = '-label:Archive_AI subject:"Rapport de fin de caisse"'
    
    try:
        results = service.users().messages().list(userId='me', q=query).execute()
        messages = results.get('messages', [])
        
        if not messages:
            print("--> Aucun nouveau rapport Popina trouvé.")
            return
            
        print(f"--> {len(messages)} rapports Popina trouvés.")
        
        for msg_info in messages:
            msg = service.users().messages().get(userId='me', id=msg_info['id']).execute()
            payload = msg.get('payload', {})
            
            headers = payload.get('headers', [])
            email_date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
            sender = next((h['value'] for h in headers if h['name'] == 'From'), "Popina")
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "Rapport de fin de caisse")
            
            target_date = datetime.now()
            if email_date_str:
                target_date = email.utils.parsedate_to_datetime(email_date_str)

            html_content = ""
            parts = payload.get('parts', [])
            if not parts:
                parts = [payload]
            
            for part in parts:
                if part.get('mimeType') == 'text/html':
                    data = part.get('body', {}).get('data')
                    if data:
                        html_content = base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
                        break
            
            if not html_content:
                continue

            soup = BeautifulSoup(html_content, 'html.parser')
            text = soup.get_text(' ', strip=True) # Utiliser des espaces pour garder les données sur la même ligne logique
            
            # 1. Extraction du montant Espèces
            # Cherche "Espèces" suivi du montant principal et des centimes séparés par n'importe quoi (souvent virgule ou espace)
            especes_match = re.search(r'Esp.ces\s+([\d\s]+)[^\d]*(\d{2})', text, re.IGNORECASE)
            
            if especes_match:
                integer_part = especes_match.group(1).replace(' ', '')
                decimal_part = especes_match.group(2)
                amount = float(f"{integer_part}.{decimal_part}")
                
                # 2. Extraction de la date "Fin de service" dans le texte
                # Cherche un format DD/MM/YYYY HH:MM
                date_matches = re.findall(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2})', text)
                if date_matches:
                    # On prend généralement la dernière date (Fin de service)
                    try:
                        target_date = datetime.strptime(date_matches[-1], '%d/%m/%Y %H:%M')
                    except:
                        pass

                print(f"💰 Rapport Popina détecté : {target_date.strftime('%d/%m/%Y')} -> {amount}€")
                
                # Synchro
                sync_data = {
                    "date": target_date.isoformat(),
                    "amount": amount,
                    "description": f"Recette Popina Espèces ({target_date.strftime('%d/%m/%Y')})",
                    "messageId": msg_info['id'],
                    "sender": sender,
                    "subject": subject,
                    "type": "POPINA_REPORT"
                }
                success = sync_popina_to_restaurant_os(sync_data)
                
                # Archivage
                if success:
                    mark_as_processed(service, msg_info['id'])
                else:
                    print(f"⚠️  Echec sync pour ID: {msg_info['id']}, non marqué comme traité.")
            else:
                print(f"⚠️  Rapport Popina trouvé (ID: {msg_info['id']}) mais montant Espèces non détecté.")

    except Exception as e:
        print(f"❌ Erreur traitement Popina: {e}")

def download_and_upload_invoices():
    gmail_service = get_gmail_service()
    drive_service = get_drive_service()
    if not gmail_service or not drive_service:
        return

    print("🔍 Récupération de l'arborescence Drive...")
    root_folder_id = get_folder_id_from_path(drive_service, DRIVE_PATH)
    autres_folder_id = get_or_create_folder(drive_service, "Autres", root_folder_id)

    # NOUVEAU: Traitement Popina
    process_popina_reports(gmail_service)

    print("🔍 Recherche Gmail (Nouveaux messages 2026+ sans restriction INBOX)...")
    # Recherche large pour être sûr de ne rien rater
    query = '-label:Archive_AI after:2025/12/31 has:attachment filename:pdf'
    
    messages = []
    next_page = None
    while True:
        results = gmail_service.users().messages().list(userId='me', q=query, pageToken=next_page).execute()
        batch = results.get('messages', [])
        messages.extend(batch)
        next_page = results.get('nextPageToken')
        if not next_page: break
            
    print(f"--> {len(messages)} emails avec PDF trouvés. Analyse et Upload...")
    
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
            
            formatted_date = datetime.now().strftime('%Y_%m_%d')
            if email_date_str:
                dt = email.utils.parsedate_to_datetime(email_date_str)
                formatted_date = dt.strftime('%Y_%m_%d')

            parts = payload.get('parts', [])
            
            def get_attachments(parts_list):
                found = []
                for p in parts_list:
                    if p.get('parts'):
                        found.extend(get_attachments(p['parts']))
                    if p.get('filename') and p.get('body') and p.get('body').get('attachmentId'):
                        if p['filename'].lower().endswith('.pdf'):
                            found.append(p)
                return found

            attachments = get_attachments(parts)
            
            all_success = True
            for part in attachments:
                filename_orig = part['filename'].lower()
                att_id = part['body']['attachmentId']
                attachment = gmail_service.users().messages().attachments().get(
                    userId='me', messageId=msg_info['id'], id=att_id).execute()
                data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
                
                pdf_text = extract_text_from_pdf(data)
                
                # --- INTELLIGENCE ARTIFICIELLE ---
                ai_data = analyze_with_ai(pdf_text, sender, subject)
                
                if ai_data:
                    # Utilisation des données AI
                    tier = ai_data.get('supplier', 'INCONNU').upper().replace(' ', '_')
                    amount = str(ai_data.get('amount', '0.00'))
                    doc_type = ai_data.get('type', 'DOC')
                    invoice_date = ai_data.get('date', formatted_date).replace('-', '_')
                    print(f"🤖 AI Success: {tier} - {amount}€ ({doc_type})")
                else:
                    # Fallback Regex / Legacy
                    print("⚠️ AI Failed/Skipped, using Regex fallback")
                    tier = predict_tier_regex(sender, subject, pdf_text)
                    amount = extract_amount_regex(subject)
                    if amount == "0.00":
                        amount = extract_amount_regex(pdf_text)
                    
                    doc_type = "DOC"
                    if "avoir" in subject.lower() or "credit note" in pdf_text.lower():
                        doc_type = "AVOIR"
                    elif "facture" in subject.lower() or "invoice" in pdf_text.lower():
                        doc_type = "FACT"
                    elif "relevé" in subject.lower() or "releve" in pdf_text.lower():
                        doc_type = "RELEVE"
                    
                    invoice_date = formatted_date

                # Construction du nom de fichier final
                new_filename = f"{invoice_date}_{doc_type}_{tier}_{amount}.pdf"
                
                # Dossier cible
                is_financial = doc_type in ['FACT', 'AVOIR', 'RELEVE']
                target_folder = root_folder_id if is_financial else autres_folder_id
                
                # Upload si nouveau
                if not file_exists_on_drive(drive_service, target_folder, new_filename):
                    file_id = upload_to_drive(drive_service, target_folder, new_filename, data)
                    print(f"✅ Uploadé : {new_filename}")
                    uploaded_count += 1

                    # Synchro Restaurant-OS
                    if is_financial:
                        sync_data = {
                            "supplierName": tier,
                            "date": invoice_date.replace("_", "-"),
                            "invoiceNo": ai_data.get("invoiceNo") if ai_data else None,
                            "totalAmount": float(amount),
                            "scannedUrl": f"https://drive.google.com/file/d/{file_id}/view",
                            "items": [],
                            "emailMetadata": {
                                "messageId": msg_info['id'],
                                "subject": subject,
                                "sender": sender,
                                "type": "INVOICE"
                            }
                        }
                        if not sync_to_restaurant_os(sync_data):
                            all_success = False
                else:
                    print(f"⏭️  Déjà présent : {new_filename}")
                
            # Archivage après traitement (si au moins une PJ trouvée)
            if attachments and all_success:
                mark_as_processed(gmail_service, msg_info['id'])
                processed_count += 1
            elif attachments and not all_success:
                print(f"⚠️  Echec sync pour facture(s) du msg {msg_info['id']}, non marqué.")


        except Exception as e:
            print(f"❌ Erreur critique message {msg_info['id']}: {e}")

    print("\n" + "="*30)
    print(f"Terminé : {processed_count} emails traités, {uploaded_count} fichiers envoyés.")

if __name__ == '__main__':
    download_and_upload_invoices()
