import os
import psycopg2
from dotenv import load_dotenv

# Charger les variables d'environnement
local_env = os.path.join(os.path.dirname(__file__), '.env')
parent_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')

if os.path.exists(local_env):
    load_dotenv(local_env)
else:
    load_dotenv(parent_env)

def test_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL manquante.")
        return

    try:
        print(f"Connexion à {db_url.split('@')[-1]}...")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Tester gen_random_uuid
        cur.execute("SELECT gen_random_uuid();")
        uuid = cur.fetchone()[0]
        print(f"✅ Connexion réussie ! UUID généré : {uuid}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    test_connection()
