import os
import time
import base64
import sys
from datetime import datetime
import subprocess
import threading
from flask import Flask, request, jsonify
from gevent.pywsgi import WSGIServer

# Configuration
SLEEP_INTERVAL = 43200  # 12 heures en secondes
WEBHOOK_PORT = 5000

app = Flask(__name__)
task_lock = threading.Lock()
last_run_time = None

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
    """Lance le script principal de manière thread-safe."""
    global last_run_time
    with task_lock:
        try:
            print(f"\n--- Lancement du scan : {datetime.now()} ---")
            # On appelle le script en tant que sous-processus pour isoler les erreurs
            subprocess.run([sys.executable, "download_invoices_2026.py"], check=False)
            last_run_time = datetime.now()
            print("--- Fin du scan ---")
            return True
        except Exception as e:
            print(f"❌ Erreur lors de l'exécution du script : {e}")
            return False

@app.route('/webhook', methods=['POST'])
def webhook():
    """Point d'entrée pour forcer une synchronisation."""
    api_key = request.headers.get("x-api-key")
    valid_key = os.environ.get("RESTAURANT_OS_API_KEY")

    if not valid_key or api_key != valid_key:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    # Lancer la tâche dans un thread séparé pour ne pas bloquer la réponse HTTP
    thread = threading.Thread(target=run_task)
    thread.start()

    return jsonify({
        "success": True, 
        "message": "Synchronisation lancée en arrière-plan.",
        "last_run": last_run_time.isoformat() if last_run_time else None
    })

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "running",
        "last_run": last_run_time.isoformat() if last_run_time else None,
        "is_syncing": task_lock.locked()
    })

def daemon_loop():
    """Boucle infinie du démon."""
    print("🤖 Démarrage de la boucle du démon...")
    while True:
        run_task()
        print(f"💤 Pause de {SLEEP_INTERVAL/3600} heures...")
        time.sleep(SLEEP_INTERVAL)

def main():
    print("🤖 Démarrage du Daemon Mail Automation avec Webhook...")
    
    # 1. Restaurer les secrets au démarrage
    restore_secrets()

    # 2. Lancer la boucle du démon dans un thread séparé
    daemon_thread = threading.Thread(target=daemon_loop, daemon=True)
    daemon_thread.start()

    # 3. Lancer le serveur Flask (via gevent pour la prod)
    print(f"📡 Serveur Webhook actif sur le port {WEBHOOK_PORT}...")
    http_server = WSGIServer(('0.0.0.0', WEBHOOK_PORT), app)
    http_server.serve_forever()

if __name__ == "__main__":
    main()
