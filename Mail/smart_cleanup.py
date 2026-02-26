import os
from datetime import datetime, timedelta
from gmail_manager import get_gmail_service

# Liste des expéditeurs identifiés comme "Bruit" / Publicité / Notifications non critiques
# À ajuster selon vos préférences
NOISY_SENDERS = [
    'Amazon Business', 'Amazon.fr', 'GitHub', 'LinkedIn', 'Google Payments', 
    'Booking.com', 'Uber', 'Deliveroo', 'Newsletter', 'Promo', 'Offres'
]

def intelligent_cleanup(dry_run=True):
    """
    Nettoie la boîte mail des emails promotionnels ou notifications de plus de 3 mois.
    Si dry_run=True, il liste seulement sans supprimer.
    """
    service = get_gmail_service()
    if not service:
        return

    # Calcul de la date limite (3 mois)
    three_months_ago = (datetime.now() - timedelta(days=90)).strftime('%Y/%m/%d')
    
    print(f"🧹 Nettoyage Intelligent (Emails avant le {three_months_ago})...")
    if dry_run:
        print("⚠️  MODE SIMULATION (Aucune suppression réelle)")

    # Requête de recherche : 
    # Emails de plus de 3 mois provenant des expéditeurs bruyants
    # ET qui n'ont PAS été marqués comme 'Archive_AI' (on ne veut pas supprimer vos factures sauvées !)
    query = f"before:{three_months_ago} -label:Archive_AI (" + " OR ".join([f'from:"{s}"' for s in NOISY_SENDERS]) + ")"
    
    messages = []
    next_page = None
    while True:
        results = service.users().messages().list(userId='me', q=query, pageToken=next_page).execute()
        batch = results.get('messages', [])
        messages.extend(batch)
        next_page = results.get('nextPageToken')
        if not next_page or not batch: break

    if not messages:
        print("✅ Aucun email inutile trouvé pour cette période.")
        return

    print(f"--> {len(messages)} emails trouvés à traiter.")

    count = 0
    for msg_info in messages:
        try:
            # Récupérer les infos pour le log
            msg = service.users().messages().get(userId='me', id=msg_info['id'], format='metadata', metadataHeaders=['From', 'Subject', 'Date']).execute()
            headers = msg['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'Sans objet')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Inconnu')
            
            # CRITÈRE DE SÉCURITÉ SUPPLÉMENTAIRE : On ne supprime JAMAIS si le mot "Facture" est dans le sujet
            if "facture" in subject.lower() or "invoice" in subject.lower():
                print(f"🛡️  Protection : Facture détectée, on garde : {subject}")
                continue

            if dry_run:
                print(f"👀 À supprimer : [{sender}] {subject}")
            else:
                # Suppression (Mise à la corbeille au lieu de suppression définitive pour plus de sécurité)
                service.users().messages().trash(userId='me', id=msg_info['id']).execute()
                print(f"🗑️  Supprimé : [{sender}] {subject}")
            
            count += 1

        except Exception as e:
            print(f"❌ Erreur sur un message : {e}")

    print("\n" + "="*30)
    print(f"Opération terminée : {count} emails traités.")

if __name__ == '__main__':
    # On lance le nettoyage réel
    intelligent_cleanup(dry_run=False)
