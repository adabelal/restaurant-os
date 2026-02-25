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
