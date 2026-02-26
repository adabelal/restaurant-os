# 🤖 Rapport Complet : Automatisation Gmail & Drive pour Restaurant-OS

Ce document sert de mémoire technique et stratégique pour l'intégration de la gestion des mails dans l'écosystème **Restaurant-OS**.

## 📊 1. Analyse de la Boîte Mail (Audit du 04/02/2026)
L'analyse des 300 derniers emails a révélé les points suivants :
- **Volume** : ~300 mails/mois avec une forte concentration sur la facturation.
- **Top Fournisseurs** : METRO, BOURGOGNE PRODUITS FRAIS (BPF), KRILL, EPISAVEURS, COURTOIS, PASSIONFROID.
- **Types de documents** : Forte présence de factures hebdomadaires, de relevés bimensuels et de confirmations de commandes.

## 🎯 2. Objectifs du Projet
1.  **Centralisation** : Récupérer automatiquement toutes les pièces jointes 2026 vers le Drive.
2.  **Intelligence** : Ne pas se contenter de l'objet du mail, mais lire l'intérieur des PDF pour distinguer une facture d'un simple relevé ou d'un devis.
3.  **Standardisation** : Appliquer le format de nommage `YYYY_MM_DD_TYPE_TIERS_MONTANT.pdf`.
4.  **Autonomie** : Déployer sur le serveur Hetzner pour que le scan tourne H24 sans action humaine.

## ⚙️ 3. Architecture Technique Mise en Place
### Le moteur (Python + Google APIs)
- **`gmail_manager.py`** : Centralise la connexion Gmail (readonly + modify) et Drive (file).
- **`download_invoices_2026.py`** : 
    - Scanne uniquement le label `INBOX` (évite les mails envoyés à la comptable).
    - Exclut les mails ayant déjà le label `Archive_AI`.
    - Analyse le contenu via `pypdf` pour détecter le type (`FACT`, `RELEVE`, `AVOIR`, `DOC`).
    - Extrait le montant TTC du texte interne si absent de l'objet du mail.
    - Uploade sur Drive vers `01_ARCHIVES/Factures/2026` (ou `/Autres` pour les docs non financiers).
    - **Post-traitement** : Ajoute le label `Archive_AI` au mail pour ne plus jamais le retraiter (Gain de performance et sécurité anti-doublon).

### Le déploiement (Docker)
- **`Dockerfile`** : Prêt pour Easypanel. Il inclut une boucle `while` (entrypoint.sh) pour lancer le scan toutes les 12h.
- **Secrets** : Les fichiers `credentials.json` et `token.json` sont embarqués (indispensable car le serveur est "headless").

## 🛠 4. Suite du Plan dans Restaurant-OS
1.  **Déploiement Worker** : Création du service sur Easypanel.
2.  **Intégration Dashboard** : (Optionnel) Créer une route API dans Next.js pour lire le dossier Drive et afficher les dernières factures reçues directement dans le dashboard propriétaire.
3.  **Alertes** : Possibilité d'envoyer un message Slack/Discord/WhatsApp à chaque facture critique détectée.

---
*Ce système a été conçu pour être à la fois simple et évolutif vers une comptabilité automatisée.*
