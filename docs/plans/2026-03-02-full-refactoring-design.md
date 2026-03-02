---
name: Full Refactoring & Sécurité
date: 2026-03-02
---

# Conception : Refactorisation de Sécurité, d'UI/UX et de Performances React

Ce document détaille l'approche unifiée pour améliorer `restaurant-os` sur les 3 axes identifiés sans introduire de régression fonctionnelle.

## 1. Sécurité (Auth & Server Actions)
**Problématique :** Les Server Actions (ex: `createBand`, `updateEventStatus`) accèdent à Prisma sans vérifier la session ou le rôle de l'utilisateur, permettant à quiconque connaissant l'endpoint d'altérer la base de données.
**Solution recommandée (Wrapper Pattern) :** 
Nous allons créer un utilitaire `lib/safe-action.ts`. Au lieu d'écrire des Server Actions nues, toutes les mutations passeront par ce wrapper.
*Comportements :*
- Récupère `getServerSession()` de NextAuth.
- Vérifie si l'utilisateur possède l'un des rôles autorisés (STAFF, MANAGER, ADMIN), sinon retourne un objet d'erreur standard (403 Forbidden).
- Si autorisé, on exécute l'action et la logique Zod.

## 2. Refonte Fondation UI/UX (Tailwind & Thème)
**Problématique :** Des hexadécimaux sont "hardcodés" dans `tailwind.config.js` (`siwa.red`, `siwa.gold`, `siwa.dark`). Ce n'est pas scalable et brise la logique d'inversion des couleurs du mode nuit (Dark Mode).
**Solution recommandée (Variables CSS Dynamiques) :**
- Supprimer le bloc de clés hardcodées `siwa` du fichier de configuration Tailwind.
- Utiliser la sémantique de base de `shadcn/ui` (ex: `--primary`, `--accent`) définie dans `app/globals.css`.
- Vérifier que la classe utilitaire personnalisée `.glass` (`glassmorphism`) utilise bien le système opacity de Tailwind (ex: `bg-background/80` au lieu de `bg-white/70`).

## 3. Boost de Performances React (Waterfalls & Cache)
**Problématique :** Les fonctions de lecture (`getBands`, `getEvents`) dans `actions.ts` ne sont pas mémorisées (absence de `React.cache`) et interrogent la totalité des données d'une table, ce qui engendre des chutes de performances (LCP ralenti par un goulot d'étranglement BDD).
**Solution recommandée :**
- L'API moderne de Next.js (App Router) utilise le système natif `fetch` pour la mémorisation (Request Memoization), mais pour Prisma, nous devons wrapper nos appels avec la fonction `cache` de l'import React (`import { cache } from 'react'`).
- Limiter les requêtes avec des instructions `select` pour n'extraire de la BDD que les colonnes indispensables à l'UI, réduisant drastiquement le Payload de Sérialisation (Network IO).
- Supprimer les imports clients futiles et implémenter `Suspense` là où des données BDD asynchrones sont nécessaires côté server components.

---

**Question de validation (Brainstorming Check) :**
*Cette conception architecturale vous semble-t-elle convenir en vue d'attaquer les travaux ? (Si c'est le cas, je déclencherai la compétence `writing-plans` pour te dresser le plan actionnable !)*
