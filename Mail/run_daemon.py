import os
import time
import base64
import sys
from datetime import datetime
import subprocess

# Configuration
SLEEP_INTERVAL = 43200  # 12 heures en secondes

def restore_secrets():
    """Restaure les fichiers JSON depuis les variables d'environnement."""
    try:
        creds_b64 = os.environ.get("GMAIL_CREDENTIALS_BASE64")
        if creds_b64:
            with open("credentials.json", "wb") as f:
                f.write(base64.b64decode(creds_b64))
            print("✅ credentials.json restauré.")
        else:
            print("⚠️ PAS DE GMAIL_CREDENTIALS_BASE64 ! (Peut-être en local ?)")

        token_b64 = os.environ.get("GMAIL_TOKEN_BASE64")
        if token_b64:
            with open("token.json", "wb") as f:
                f.write(base64.b64decode(token_b64))
            print("✅ token.json restauré.")
        else:
            print("⚠️ PAS DE GMAIL_TOKEN_BASE64 ! (Peut-être en local ?)")

    except Exception as e:
        print(f"❌ Erreur critique lors de la restauration des secrets : {e}")
        sys.exit(1)

def run_task():
    """Lance le script principal."""
    try:
        print(f"\n--- Lancement du scan : {datetime.now()} ---")
        # On appelle le script en tant que sous-processus pour isoler les erreurs
        subprocess.run([sys.executable, "download_invoices_2026.py"], check=False)
        print("--- Fin du scan ---")
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution du script : {e}")

def main():
    print("🤖 Démarrage du Daemon Mail Automation...")
    
    # 1. Restaurer les secrets au démarrage
    restore_secrets()

    # 2. Boucle infinie
    while True:
        run_task()
        
        print(f"💤 Pause de {SLEEP_INTERVAL/3600} heures...")
        time.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    main()
