# Full Refactoring & Sécurité - Plan d'Implémentation

> **Pour l'Agent :** SKILL REQUISE : Utiliser la compétence `executing-plans` (si disponible) pour implémenter ce plan tâche par tâche.

**Objectif :** Refonte unifiée du projet ciblant la sécurité des Server Actions, la cohérence du mode sombre (UI/UX), et les performances React (mémorisation de lecture).
**Architecture :** 
1. Utilitaires `lib/safe-action.ts` pour créer un wrapper d'authentification robuste (RBAC) pour les Server Actions.
2. Refactoring des actions Prisma dans `actions.ts` via ce wrapper et l'API `React.cache()` pour optimiser les "Waterfalls".
3. Nettoyage des couleurs 'hardcodées' dans `tailwind.config.js` via les variables CSS Tailwind.
**Tech Stack :** Next.js 15 (App Router), React 19, TypeScript, NextAuth, Prisma, Tailwind CSS.

---

### Tâche 1 : Création du Wrapper de Sécurité (Safe Action)

**Fichiers :**
- Créer : `lib/safe-action.ts`

**Étape 1 : Écrire le test qui échoue**
*(Note : l'application n'ayant pas de suite de tests unitaire explicite au sein de jest/vitest configurée, l'étape logique est le typage TypeScript lui-même qui agira comme validateur de compilation).*

**Étape 2 : Lancer le test pour vérifier l'échec**
Commande : `npx tsc --noEmit` -> Attendu : FAIL (Fichier introuvable)

**Étape 3 : Écrire l'implémentation minimale**

```typescript
import { getServerSession } from "next-auth";

type ActionContext = {
  user: {
    id: string;
    role: string;
  };
};

type SafeActionHandler<TInput, TOutput> = (
  input: TInput,
  context: ActionContext
) => Promise<TOutput>;

const allowedRoles = ["STAFF", "MANAGER", "ADMIN"];

export async function safeAction<TInput, TOutput>(
  input: TInput,
  handler: SafeActionHandler<TInput, TOutput>
): Promise<TOutput | { error: string }> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return { error: "Non authentifié" };
    }

    const { role, id } = session.user as any; // Type assertion since default next-auth user doesn't have role

    if (!allowedRoles.includes(role || "USER")) { // Handle undefined safely initially, assuming actual DB has roles
        // If your project uses specific roles in JWT, add the check here. I am keeping it safe for standard next-auth
       return { error: "Permission refusée : Rôle insuffisant" };
    }

    return await handler(input, { user: { id: id || "unknown", role: role || "USER" } });
  } catch (error: any) {
    console.error("Erreur safeAction:", error);
    return { error: error.message || "Erreur interne du serveur" };
  }
}
```

**Étape 4 : Lancer le test pour vérifier le succès**
Commande : `npx tsc --noEmit` -> Attendu : PASS

**Étape 5 : Commit**
```bash
git add lib/safe-action.ts
git commit -m "feat: ajout du wrapper de sécurité pour server actions"
```

---

### Tâche 2 : Refactoring Global de la Configuration Tailwind (UI/UX)

**Fichiers :**
- Modifier : `tailwind.config.js`

**Étape 1 : Écrire le test qui échoue**
*(Validation au niveau du build CSS)*

**Étape 2 : Lancer le test pour vérifier l'échec**
*(Pas nécessaire ici de forcer l'échec, nous remplaçons les valeurs existantes).*

**Étape 3 : Écrire l'implémentation minimale**
*Modifier `tailwind.config.js` pour retirer le bloc des couleurs "siwa".*
Dans `tailwind.config.js`, retirez ou commentez ces lignes :
```javascript
        // siwa: {
        //   red: "#dc2626",
        //   gold: "#f59e0b",
        //   dark: "#18181b",
        // }
```

**Étape 4 : Lancer le test pour vérifier le succès**
Commande : `npm run build` ou vérification syntaxique.

**Étape 5 : Commit**
```bash
git add tailwind.config.js
git commit -m "refactor(ui): suppression des couleurs codées en dur pour cohérence du mode sombre"
```

---

### Tâche 3 : Optimisation des performances via React.cache (Waterfalls)

**Fichiers :**
- Modifier : `app/(authenticated)/music/actions.ts`

**Étape 1 : Écrire le test qui échoue**
*(Validation côté build de compilation).*

**Étape 3 : Écrire l'implémentation minimale**
*Ajouter l'import de `cache` en haut du fichier de vos requêtes Prisma existantes et wrapper vos fonctions de lecture.*

Ouvrir `app/(authenticated)/music/actions.ts`, ajouter au sommet :
```typescript
import { cache } from "react";
```

Et encapsuler `getBands` :
```typescript
export const getBands = cache(async () => {
    try {
        const bands = await prisma.musicBand.findMany({
            orderBy: { name: "asc" },
            include: {
                events: {
                    orderBy: { date: "desc" },
                    take: 5,
                },
            },
        })

        return bands.map(band => ({
            ...band,
            events: band.events.map(event => ({
                ...event,
                amount: Number(event.amount)
            }))
        }))
    } catch (error) {
        console.error("Failed to fetch bands:", error)
        return []
    }
});
```

Faire de même pour `getEvents` :
```typescript
export const getEvents = cache(async () => {
    try {
        const events = await prisma.musicEvent.findMany({
            orderBy: { date: "desc" },
            include: {
                band: true,
            },
        })

        return events.map(event => ({
            ...event,
            amount: Number(event.amount)
        }))
    } catch (error) {
        console.error("Failed to fetch events:", error)
        return []
    }
});
```

**Étape 4 : Lancer le test pour vérifier le succès**
Commande : `npx tsc --noEmit` -> Attendu : PASS

**Étape 5 : Commit**
```bash
git add app/\(authenticated\)/music/actions.ts
git commit -m "perf(react): implémentation du cache de mémorisation pour réduire les goulots BDD"
```

---

*(Les Tâches ultérieures intégreront les migrations complètes de chaque mutation vers `safeAction`, mais ce premier plan donne les bases.)*
