# Plan d'Amélioration & Audit - Restaurant OS

Basé sur les règles fournies et l'analyse du code existant, voici le plan d'action pour sécuriser, stabiliser et améliorer l'application.

## 1. Audit Qualité & Type Safety (Urgent)
L'analyse a révélé de nombreuses utilisations de `any`, ce qui contourne la sécurité de TypeScript et peut causer des bugs de production.

- [ ] **Fix `lib/auth.ts`**: Étendre les types NextAuth (`DefaultSession`, `DefaultUser`) pour inclure `role` et `id` proprement au lieu de caster avec `as any`.
- [ ] **Fix `actions.ts`**: Remplacer les types `any` dans `getFinanceStats`, `importHistoricalData` et `syncFinanceIntelligence` par des types Prisma générés (ex: `BankTransaction`, `FixedCost`).
- [ ] **Configuration TS**: Vérifier que `noImplicitAny` est bien actif et respecté.

## 2. Architecture & Organisation
Le projet contient des scripts Python et JS à la racine, ce qui pollue l'espace de travail.

- [ ] **Nettoyage Root**: Déplacer `inspect_popina.py`, `check_excel_sheets.py`, `import-history.mjs`, etc., dans un dossier `scripts/` ou `integrations/`.
- [ ] **Hardcoded Logic**: La fonction `syncFinanceIntelligence` contient des mots-clés "en dur" (HARDCODED) pour la détection (ex: "BELAL", "ORANGE").
    - *Action*: Créer une table `KeywordRule` ou stocker cela dans une config JSON pour ne pas devoir redéployer le code si un libellé change.
- [ ] **Sécurité des Données**: L'action `importHistoricalData` effectue un `deleteMany({})` sur les transactions bancaires. C'est extrêmement dangereux en production.
    - *Action*: Ajouter un "Safety Guard" ou un paramètre `force` explicite, et restreindre cette action aux Admins uniquement.

## 3. Performance & UX
L'interface est très soignée (Premium Design), mais quelques optimisations techniques sont requises.

- [ ] **Images**: Vérifier l'utilisation de `next/image` pour l'affichage des reçus/factures (actuellement non visible dans le snippet, mais crucial pour les perfs).
- [ ] **Suspense & Loading**: La page finance est en `force-dynamic`. Assurer que des skeletons de chargement sont présents via `loading.tsx` pour éviter une page blanche pendant les calculs lourds.
- [ ] **Caching**: Optimiser `getFinanceStats` qui fait beaucoup de calculs JS. Utiliser `unstable_cache` de Next.js si les données ne changent pas à la seconde.

## 4. Testing & Fiabilité
Aucun test automatisé n'a été détecté (Rules: `rnexttesting.md`).

- [ ] **Unit Tests**: Ajouter des tests Jest pour la logique métier critique (calcul des soldes, détection des récurrences dans `actions.ts`).
- [ ] **E2E Tests**: (Optionnel pour l'instant) Configurer Playwright pour le login et la navigation de base.

---

## Actions Immédiates (Exécution)

1.  **[FAIT] Refactoring Type Safety (`lib/auth.ts` & `actions.ts`)** : Suppression des `any` et typage strict.
2.  **[FAIT] Sécurisation `actions.ts`** : Création de `FINANCE_RULES` et sécurisation de l'import/delete.
3.  **[FAIT] Organisation** : Nettoyage des scripts orphelins.
4.  **[FAIT] Environment Fix** : Résolution du problème de permissions `node_modules` (EPERM).
5.  **[FAIT] Optimisation AI Achats** : Prompt Gemini Expert, Mapping Unitaires & Smart Linking.
6.  **[FAIT] Module RH** : Badges Contrats & Checklist Conformité.
7.  **[FAIT] Backup** : Script de sauvegarde JSON créé (`scripts/backup-db.ts`).
