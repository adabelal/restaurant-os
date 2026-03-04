# Restaurant-OS - Contexte & Règles Projet (CAG)

## 📌 1. Vision et Objectif du Projet
**Nom :** Restaurant-OS
**Cible Actuelle :** Usage exclusif pour l'établissement "SIWA Bleury".
**Vision Long Terme :** Architecture pensée pour être *scalable* et potentiellement commercialisable à l'avenir en tant que solution SaaS multi-restaurants. 
**Rôle de l'IA (Gemini) :** Gemini est le cœur intelligent du projet. Il agit comme :
  - Assistant développeur (génération de code, refactoring, audit).
  - Moteur d'extraction de données au sein de l'app (lecture de factures, OCR intelligent).
  - Outil d'analyse financière et prédictive pour le restaurant.

## 📁 2. Organisation des Fichiers & Code source
- **Code Source (Next.js, Scripts) :** Doit rester sur le disque dur local (`/Users/adambelal/Desktop/restaurant-os`) et  synchronisé via **Git/GitHub**. *Ne jamais déplacer le dossier de code sur Google Drive* (problèmes de synchronisation avec `node_modules` et Git).
- **Documents Métier (Factures, Contrats, RH) :** **Google Drive** est l'unique source de vérité et base de données documentaire. Les fichiers générés, scannés ou téléchargés y sont classés méthodiquement.
- **Conventions Git (définies pour l'IA) :** 
  - `feat/nom-fonctionnalite` (Nouvelle feature)
  - `fix/nom-bug` (Correction de bug)
  - `refactor/nom-composant` (Optimisation de code existant)
  - `chore/mise-a-jour` (Tâches de maintenance, dépendances)

## 🛠 3. Stack Technique & Architecture
- **Framework Front/Back :** Next.js (App Router) - *Server Components par défaut*.
- **Langage :** TypeScript (Mode Strict activé).
- **Base de données :** PostgreSQL (hébergé sur serveur dédié `46.224.148.12`).
- **ORM :** Prisma.
- **Authentification :** NextAuth.js (Sécurisé par rôles : STAFF, MANAGER, ADMIN).
- **Déploiement :** Easypanel pour le backend et les scripts Python (Serveur Hetzner). Netlify/Vercel pour les fronts web publics si besoin.

## 🎨 4. Design System (Frontend & UI)
Architecture visuelle **Premium, Moderne et Épurée**.
- **Bibliothèque Front-end Centrale :** **shadcn/ui** (Radix UI) combiné avec **Tailwind CSS**.
- **Gestion d'État :** Utilisation privilégiée des Hooks natifs (`useState`, `useContext`) et de l'état serveur via URL/Server Components. (Zustand pourra être introduit si la complexité l'exige, mais on garde les choses simples).
- **Thème Visuel (Dark/Light mode natif) :**
  - Utilisation STRICTE des variables CSS Tailwind (`bg-background`, `text-foreground`, `bg-card`). Ne JAMAIS hardcoder de couleurs (ex: `#FFFFFF` ou `text-black`).
  - **Identité SIWA :** *Siwa Red* (`--primary`) et *Siwa Gold* (`--accent`).
- **Effets Premium :** Utilisation prioritaire du **Glassmorphism** via la classe utilitaire personnalisée `.glass` (`backdrop-blur-md bg-white/70 dark:bg-black/50 border-white/20`).

## ⚙️ 5. Automatisations & Workflow API
- **Abandon de n8n :** Pour simplifier l'architecture, **n8n n'est plus l'outil recommandé**. Les automatisations complexes sont gérées par des **scripts Python autonomes** ou des **Tâches Next.js (Cron jobs / API Routes)** connectés directement à l'API Gemini et Google APIs.
- **Objectif du Workflow Mail/Drive :**
  1. Script Python lit les mails entrants via l'API Gmail.
  2. Extrait les PDFs attachés.
  3. Appelle l'API **Gemini** pour lire le PDF, extraire (Fournisseur, Date, Montant, Type : FACTURE, AVOIR).
  4. Renomme le fichier avec la convention : `YYYY-MM-DD_Type_Fournisseur_Montant.pdf`.
  5. Upload le fichier organisé dans Google Drive via l'API Drive.
  6. (Optionnel/Futur) Met à jour la base de données PostgreSQL via Prisma/API interne.

## 🔐 6. Règles de Backend et Base de données (Directives IA)
L'IA doit **toujours** respecter ces règles de sécurité et de logique métier lors de la génération de code :
1. **Soft Delete :** Ne jamais générer de code qui supprime physiquement (`.delete()`) une donnée sensible (Utilisateur, Facture, Transaction). Toujours utiliser des flags `isActive: false` ou un statut `ARCHIVED`.
2. **Server Actions :** Toutes les mutations de base de données depuis l'interface client Next.js doivent passer par des **Server Actions** (`"use server"`) sécurisées.
3. **Validation Zod :** Toutes les données entrantes (formulaires, APIs) doivent être validées via un schéma `zod` avant d'interagir avec Prisma.
4. **Authentification Globale :** Les API routes et les pages doivent impérativement vérifier l'authentification (`getServerSession`) et le rôle de l'utilisateur.
5. **Logs Sécurisés :** Ne JAMAIS faire de `console.log()` contenant des clés privées, mots de passe, ou informations bancaires en clair.

---
*Ce fichier (`CONTEXT.md` ou CAG) doit être lu par l'IA au début de chaque session complexe pour s'imprégner des directives techniques et métier de Restaurant-OS.*

## 🚨 7. Troubleshooting & Erreurs Connues (Directives IA)

Afin d'économiser du temps et des tokens, l'IA doit appliquer ces correctifs connus face aux erreurs fréquentes :

1. **Erreur Prisma "EPERM" ou "Operation not permitted"**
   - *Symptôme :* Lors de l'exécution de `npx prisma migrate dev` ou `npx prisma db push`, npm/prisma crashe avec une erreur de permission sur le cache ou un blocage macOS.
   - *Symptôme 2 :* `Error code: P1012` (La propriété `url` n'est plus supportée). Cela arrive quand npx lance Prisma v7 par défaut au lieu de la v5 du projet.
   - *Solution (Contournement IA) :* 
     - Toujours forcer la version locale du projet : **`npx prisma@5.22.0 db push`** ou **`npx prisma@5.22.0 generate`**.
     - Ne jamais utiliser `migrate dev` si les permissions bloquent systématiquement la création du shadow database ou du dossier temp, privilégier `db push` ponctuellement en dev.

2. **Erreur NPM Cache "root-owned files" (EPERM ~/.npm)**
   - *Symptôme :* npm refuse d'installer ou d'exécuter un package car le dossier `~/.npm` appartient à `root` (dû à un ancien `sudo npm`).
   - *Solution :* Il faut demander à l'utilisateur d'exécuter manuellement dans son terminal : `sudo chown -R $(id -u):$(id -g) ~/.npm ~/.cache`. *(L'IA ne peut pas le faire car cela requiert le mot de passe sudo).*

3. **Environnement d'exécution macOS (Desktop vs Workspace)**
   - *Problème :* Le projet est actuellement sur `/Users/adambelal/Desktop/restaurant-os`. Sur macOS, les dossiers Bureau (Desktop), Documents et Téléchargements sont protégés par le système (TCC - Transparency, Consent, and Control). Cela provoque des erreurs silencieuses de lecture/écriture pour les terminaux et les scripts (notamment EPERM sur `ls`, `fts_read`, ou l'exécution de binaires node_modules).
   - *Recommandation Globale :* Déplacer le projet dans un dossier non restrictif comme `/Users/adambelal/Projects/restaurant-os` ou utiliser le dossier par défaut de l'agent Antigravity. Cela éliminera 90% des erreurs `"Operation not permitted"` liées à l'OS.
