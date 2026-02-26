from gmail_manager import get_gmail_service
from collections import Counter
from datetime import datetime
import email.utils

def analyze_inbox(max_scan=500):
    service = get_gmail_service()
    if not service:
        return

    print(f"Analyse des {max_scan} derniers emails de la boîte de réception...")
    
    # Récupérer la liste des messages (IDs seulement pour commencer)
    messages = []
    next_page_token = None
    
    # Pagination pour récupérer 'max_scan' messages
    while len(messages) < max_scan:
        results = service.users().messages().list(
            userId='me', 
            labelIds=['INBOX'], 
            maxResults=min(100, max_scan - len(messages)), # Batch de 100 max
            pageToken=next_page_token
        ).execute()
        
        batch = results.get('messages', [])
        messages.extend(batch)
        
        next_page_token = results.get('nextPageToken')
        if not next_page_token or not batch:
            break
            
    print(f"--> {len(messages)} emails trouvés. Récupération des détails (cela peut prendre un instant)...")

    senders = Counter()
    dates = []
    keywords = Counter()
    
    # Pour l'affichage progressif
    total = len(messages)
    
    for i, msg_info in enumerate(messages):
        # Format "compact" pour ne récupérer que les headers nécessaires (plus rapide)
        msg = service.users().messages().get(
            userId='me', 
            id=msg_info['id'], 
            format='metadata', 
            metadataHeaders=['From', 'Date', 'Subject']
        ).execute()
        
        headers = msg['payload']['headers']
        
        # Extraction Expéditeur
        sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Inconnu')
        # Simplification 'Nom <email>' -> 'email' ou 'Nom' pour le groupement
        if '<' in sender:
            # On extrait souvent l'email ou le nom. Prenons le nom s'il existe, sinon l'email.
            # Ex: "Amazon <no-reply@amazon.fr>" -> "Amazon"
            # Ex: "Google <no-reply@accounts.google.com>" -> "Google"
            sender_name = sender.split('<')[0].strip().replace('"', '')
            if not sender_name: # Si c'était juste "<email>"
                sender_name = sender.split('<')[1].strip('>')
        else:
            sender_name = sender
        
        senders[sender_name] += 1
        
        # Extraction Date
        date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
        if date_str:
            try:
                # Parsing
                parsed_date = email.utils.parsedate_to_datetime(date_str)
                # Normalisation : si la date n'a pas de timezone, on lui met UTC par défaut pour pouvoir comparer
                if parsed_date.tzinfo is None:
                    parsed_date = parsed_date.replace(tzinfo=datetime.timezone.utc)
                dates.append(parsed_date)
            except Exception as e:
                # On ignore silencieusement les dates mal formées pour ne pas bloquer l'audit
                pass

        # Analyse Sujet pour mots clés
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '').lower()
        if 'facture' in subject: keywords['Facture'] += 1
        elif 'commande' in subject or 'order' in subject: keywords['Commande'] += 1
        elif 'notif' in subject or 'alert' in subject: keywords['Notification'] += 1
        elif 'invitation' in subject: keywords['Invitation'] += 1
        
        if (i + 1) % 50 == 0:
            print(f"... analysé {i + 1}/{total}")

    # Rapport
    print("\n" + "="*40)
    print("RÉSULTAT DE L'AUDIT GMAIL")
    print("="*40)
    
    # Période
    if dates:
        dates.sort()
        do = dates[0].strftime('%d/%m/%Y')
        au = dates[-1].strftime('%d/%m/%Y')
        print(f"\nPériode analysée : Du {do} au {au}")
    
    # Top Expéditeurs
    print("\n📧 TOP 10 EXPÉDITEURS (VOLUMÉTRIE):")
    for sender, count in senders.most_common(10):
        print(f"  - {count:3d} : {sender}")

    # Catégories détectées
    print("\n🏷️  TYPES DÉTECTÉS (Estimation):")
    for k, v in keywords.most_common():
        print(f"  - {v:3d} : {k}")
        
    print("\n" + "="*40)

if __name__ == '__main__':
    analyze_inbox(max_scan=300) # Scan de 300 par défaut pour être rapide
