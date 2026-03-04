import os
from gmail_manager import get_gmail_service

def fetch_popina():
    service = get_gmail_service()
    if not service:
        return
    # Recherche d'un mail Popina
    query = 'subject:"Rapport de fin de caisse"'
    results = service.users().messages().list(userId='me', q=query, maxResults=3).execute()
    messages = results.get('messages', [])
    
    if not messages:
        print("Aucun email trouvé")
        return
        
    for msg_info in messages:
        print(f"Fetch msg: {msg_info['id']}")
        msg = service.users().messages().get(userId='me', id=msg_info['id']).execute()
        payload = msg.get('payload', {})
        headers = payload.get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
        print(f"Subject: {subject}")
        print("Snippet:")
        print(msg.get('snippet', ''))
        
        # Extract body
        parts = payload.get('parts', [])
        if not parts:
            parts = [payload]
            
        import base64
        for part in parts:
            if part.get('mimeType') == 'text/plain' or part.get('mimeType') == 'text/html':
                data = part.get('body', {}).get('data')
                if data:
                    text = base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
                    print(f"--- PART {part.get('mimeType')} ---")
                    print(text[:1000])

if __name__ == '__main__':
    fetch_popina()
