# Utiliser une image Python légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système pour le fuseau horaire
RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ=Europe/Paris

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les librairies Python
RUN pip install --no-cache-dir -r requirements.txt

# Ne COPIEZ PAS les fichiers JSON sensibles si votre repo est public
# COPY credentials.json .
# COPY token.json .

# Créer un script de démarrage qui restaure les secrets depuis les variables d'environnement
RUN echo '#!/bin/bash\n\
if [ -n "$GMAIL_CREDENTIALS_BASE64" ]; then\n\
  echo "$GMAIL_CREDENTIALS_BASE64" | base64 -d > credentials.json\n\
  echo "✅ credentials.json restauré depuis ENV"\n\
fi\n\
if [ -n "$GMAIL_TOKEN_BASE64" ]; then\n\
  echo "$GMAIL_TOKEN_BASE64" | base64 -d > token.json\n\
  echo "✅ token.json restauré depuis ENV"\n\
fi\n\
\n\
while true; do\n\
  echo "--- Lancement du scan Gmail $(date) ---"\n\
  python download_invoices_2026.py\n\
  echo "--- Scan terminé. Prochain passage dans 12h ---"\n\
  sleep 43200\n\
done' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Lancer la boucle
CMD ["/app/entrypoint.sh"]
