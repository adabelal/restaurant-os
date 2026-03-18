# 🚀 Guide de Déploiement : Worker Gmail/Drive sur Easypanel

Ce document explique comment déployer le robot d'analyse Gmail sur votre serveur Hetzner (Easypanel) et assurer sa synchronisation avec l'interface **Restaurant-OS**.

## 1. Préparation des Fichiers
Vérifiez que les fichiers suivants sont présents dans votre dossier `/Mail` :
- `download_invoices_2026.py` (Le script principal modifié pour la synchro)
- `gmail_manager.py` (Gestion de la connexion Google)
- `credentials.json` (Vos identifiants API Google)
- `token.json` (Votre jeton d'accès généré sur votre Mac)
- `Dockerfile` (Configuration pour Easypanel)
- `requirements.txt` (Dépendances Python)

## 2. Configuration sur Easypanel

1.  **Création du Service** : 
    *   Dans Easypanel, créez un nouveau service de type **App**.
    *   Liez votre dépôt GitHub `restaurant-os`.
    *   Définissez le **Root Directory** sur `Mail`.
    *   Easypanel détectera automatiquement le `Dockerfile`.

2.  **Variables d'Environnement** :
    Ajoutez les variables suivantes dans l'onglet **Environment Variables** de votre service sur Easypanel :
    *   `RESTAURANT_OS_API_URL` : `https://[VOTRE_DOMAINE_NEXTJS]/api/webhooks/invoices`
    *   `RESTAURANT_OS_API_KEY` : La valeur de `N8N_API_KEY` définie dans le fichier `.env` de votre application principale Restaurant-OS.
    *   `DATABASE_URL` : L'URL de connexion PostgreSQL (format `postgres://...`). Si présente, le worker écrit directement en DB.
    *   `GEMINI_API_KEY` : Votre clé API Google Gemini (déjà présente dans votre .env local).

3.  **Encodage des Secrets (Important)** :
    Comme votre dépôt est public, nous ne commitons pas les fichiers JSON sensibles. Vous devez les encoder et les ajouter dans Easypanel.
    
    *   Exécutez dans votre terminal Mac :
        ```bash
        base64 -i Mail/credentials.json | pbcopy
        ```
        -> Créez la variable `GMAIL_CREDENTIALS_BASE64` dans Easypanel et collez le contenu.

    *   Exécutez ensuite :
        ```bash
        base64 -i Mail/token.json | pbcopy
        ```
        -> Créez la variable `GMAIL_TOKEN_BASE64` dans Easypanel et collez le contenu.

4.  **Déploiement** :
    *   Lancez le déploiement ("Deploy").
    *   Le worker se lancera et restaurera vos tokens automatiquement au démarrage.

## 3. Maintenance
Si vous changez les accès Google ou si l'API expire, vous devrez :
1.  Relancer `python download_invoices_2026.py` localement sur votre Mac pour régénérer le `token.json`.
2.  Encoder le nouveau token (`base64 -i Mail/token.json | pbcopy`) et mettre à jour la variable `GMAIL_TOKEN_BASE64` dans Easypanel.

