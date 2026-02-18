import os.path
import base64
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Si modification des scopes, supprimer le fichier token.json
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly', 
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive.file'
]

def get_gmail_service():
    """Affiche l'authentification et retourne le service Gmail."""
    creds = None
    # Le fichier token.json stocke les tokens d'accès et de rafraîchissement de l'utilisateur.
    # Il est créé automatiquement lors de la première complétion du flux d'autorisation.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # Si il n'y a pas d'identifiants valides disponibles, laisser l'utilisateur se connecter.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("ERREUR: Le fichier 'credentials.json' est introuvable.")
                print("Veuillez suivre les instructions du README.md pour le créer.")
                return None

            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Sauvegarder les identifiants pour la prochaine exécution
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('gmail', 'v1', credentials=creds)
        return service
    except HttpError as error:
        print(f'Une erreur est survenue (Gmail): {error}')
        return None

def get_drive_service():
    """Affiche l'authentification et retourne le service Drive."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("ERREUR: Le fichier 'credentials.json' est introuvable.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except HttpError as error:
        print(f'Une erreur est survenue (Drive): {error}')
        return None

def list_messages(service, query='label:INBOX', max_results=10):
    """Liste les messages de la boîte de réception de l'utilisateur."""
    try:
        results = service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
        messages = results.get('messages', [])

        if not messages:
            print('Aucun message trouvé.')
            return

        print('Messages:')
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            payload = msg.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = next((header['value'] for header in headers if header['name'] == 'Subject'), 'Sans objet')
            sender = next((header['value'] for header in headers if header['name'] == 'From'), 'Inconnu')
            
            print(f"- [{sender}] {subject}")

    except HttpError as error:
        print(f'Une erreur est survenue: {error}')

def main():
    print("Connexion à Gmail...")
    service = get_gmail_service()
    if service:
        print("Connexion réussie !")
        print("-" * 20)
        list_messages(service, max_results=5)

if __name__ == '__main__':
    main()
