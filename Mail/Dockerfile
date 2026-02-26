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

# Copier le code source Python
COPY gmail_manager.py .
COPY download_invoices_2026.py .
COPY analyze_inbox.py .
COPY smart_cleanup.py .

# Copier le script de démon
COPY run_daemon.py .

# Utiliser le démon Python pour gérer la boucle d'exécution de manière robuste
CMD ["python", "run_daemon.py"]
