# Guide de Déploiement : Restaurant-OS & Bot Python sur Easypanel (Hetzner)

Puisque nous avons supprimé la complexité de N8N, l'architecture serveur sur Hetzner via Easypanel est maintenant extrêmement propre et composée de **deux services parallèles** qui communiquent de façon sécurisée.

## 🚀 Architecture Cible
1. **Service 1 : "restaurant-os-web"** (L'application Next.js ERP)
2. **Service 2 : "restaurant-os-mail-bot"** (Le démon Python qui analyse les factures + IA)

Les deux peuvent tourner séparément et de manière isolée. L'avantage est qu'en cas de bug de l'ERP, le bot continue de tourner, et vice-versa.

---

## 🛠 Étape 1 : Déploiement du Backend/Web (Next.js)

1. Dans **Easypanel**, clique sur "Create App" et choisis "App".
2. **Nom :** `restaurant-os-app`
3. **Source :** Utilise Github (Lien de ton repo).
4. **Build Type :** Choisis **Dockerfile**. Le système détectera automatiquement le fichier `Dockerfile` à la racine de ton dossier.
5. **Variables d'environnement (.env) :**
   Copie dedans tes clés sensibles :
   ```env
   DATABASE_URL="postgres://ton_user:ton_pass@46.224.148.12:5432/restaurant-os"
   NEXTAUTH_URL="https://ton_domaine.com"
   NEXTAUTH_SECRET="7f5e3d..."
   RESEND_API_KEY="re_..."
   RESTAURANT_OS_API_KEY="super-secret-key-12345"
   ```
6. **Deploy :** Lance le build. Le container exposera le port `3000`. Easypanel l'attachera automatiquement au domaine que tu configureras.

---

## 🤖 Étape 2 : Déploiement du Bot Factures (Python)

1. Toujours dans **Easypanel**, crée une NOUVELLE app.
2. **Nom :** `restaurant-os-bot`
3. **Source :** Le même repo Github.
4. **Build Type :** Dockerfile. MAIS ici, indique **Chemin du Dockerfile : `Mail/Dockerfile`**.
   *Ceci dira à Easypanel de compiler uniquement l'environnement Python.*
5. **Variables d'environnement (.env) :**
   ```env
   # Plus besoin de N8N !
   GEMINI_API_KEY="AIzaSy..."
   
   # La route de communication avec ton App Next.js (Mets le bon domaine une fois l'Étape 1 finie)
   RESTAURANT_OS_API_URL="https://app.siwa-bleury.fr/api/finance/import-invoice"
   RESTAURANT_OS_API_KEY="super-secret-key-12345"
   ```
6. **Sécurité Google Drive (Tokens) :** 
   Pour que le script Python tourne sur serveur, il doit avoir accès aux fichiers `credentials.json` et `token.json` de ton compte Google.
   *   **Stratégie Sécurisée :** Au lieu de les envoyer sur Github, utilise la feature "Mounts" (Volumes) de Easypanel pour injecter le vrai fichier `token.json` directement dans le dossier `/app/` du container.
7. **Deploy :** Lance le build. Ce container ne gère pas de trafic web (pas de port à exposer), il vit en "background" (démon) et exécute son code toutes les heures.

---

## ✅ Étape 3 : Tests et Vérifications
- Envoie une facture sur ton Gmail.
- Le bot Python (Service 2) scanne ses mails.
- Il télécharge le PDF et l'envoie à Gemini.
- Gemini extrait (Fournisseur, 120.00€, FACT, Metro).
- Le bot insère le PDF dans ton Google Drive.
- Le bot fait un `POST` sécurisé vers `https://app.siwa-bleury.fr/api/finance/import-invoice`.
- Le Next.js valide la clé (`super-secret-key-12345`).
- Il insère directement le fichier dans ta base de données PostgreSQL "Achats/PurchaseOrder".

🚀 **À toi de jouer sur Hetzner !**
