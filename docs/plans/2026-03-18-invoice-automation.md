# Automatisation des Factures - Plan d'Implémentation Avancé

> **Pour l'Agent :** SKILL REQUISE : Utiliser la compétence `executing-plans` (si disponible) pour implémenter ce plan tâche par tâche.

**Objectif :** Créer une fonctionnalité hybride pour téléverser, découper (via Gemini 2.0 Flash) et stocker (Google Drive + Prisma) des factures PDF. **NOUVEAUTÉ :** Utilisation de **Gemini Embedding 2** (`text-embedding-004`) pour générer des vecteurs sémantiques sur les factures extraites, permettant une recherche intelligente et une catégorisation avancée par la suite.
**Architecture :** Approche hybride Next.js App Router (UI) et Server Actions (Traitement). Sécurisation via NextAuth. Upload asynchrone en parallèle vers Google Drive (`googleapis`). Extraction robuste via Structured Outputs (Zod -> JSON Schema) avec Gemini 2.0 Flash. Stockage vectoriel dans PostgreSQL via l'extension `pgvector` et Prisma.
**Tech Stack :** Next.js 15, React 19, Prisma (PostgreSQL + pgvector), Gemini 2.0 Flash SDK, Googleapis, Zod, react-dropzone.

---

## 1. Plan d'Implémentation (Découpage TDD)

### Tâche 1 : Mise à jour de Prisma (Statuts + pgvector)
**Fichiers :**
- Modifier : `prisma/schema.prisma`
- Créer : `lib/validations/invoice.ts`

**Étape 1 : Mettre à jour schema.prisma pour supporter pgvector**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

enum InvoiceStatus {
  PENDING
  PROCESSED
  ERROR
}

model Invoice {
  id                 String   @id @default(cuid())
  date               DateTime
  supplierName       String
  amount             Decimal  @db.Decimal(10, 2)
  driveFileId        String?
  driveWebViewUrl    String?
  isSentToAccountant Boolean  @default(false)
  status             InvoiceStatus @default(PROCESSED)
  originalFileName   String?
  errorMessage       String?
  
  // Vector Embeddings (768 dimensions pour la recherche sémantique avec Gemini 2)
  embedding          Unsupported("vector(768)")?
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@index([date])
}
```

**Étape 2 : Lancer la migration Prisma**
Commande : `npx prisma migrate dev --name invoice_automation_with_embeddings`

**Étape 3 : Créer les validations Zod (`lib/validations/invoice.ts`)**
Créer le schéma Zod de la réponse attendue par Gemini (Tableau contenant Date, Tiers, Montant, Start_Page, End_Page, et **Description/Résumé détaillé** pour alimenter l'embedding).

### Tâche 2 : Service Google Drive (googleapis)
**Fichiers :**
- Créer : `lib/google-drive.ts`

**Étape 1 : Implémenter le service d'upload**
Utiliser `googleapis` pour envoyer le fichier `Buffer` sur Drive de façon sécurisée (avec les Scopes appropriés) et récupérer `webViewLink`.

### Tâche 3 : Service Gemini (Extraction + Embedding 2)
**Fichiers :**
- Créer : `lib/gemini-service.ts`

**Étape 1 : Extracteur Flash 2.0 avec Structured Outputs**
Appeler `gemini-2.0-flash` avec `responseSchema` pour forcer un rendu d'objets `Invoice`.

**Étape 2 : Générateur d'Embedding**
Ajouter une fonction `generateInvoiceEmbedding(text: string): Promise<number[]>` utilisant le modèle `text-embedding-004` (Gemini Embedding 2) pour convertir le texte concaténé de la facture (Tiers + Montant + Date + Résumé) en un vecteur de 768 dimensions.

### Tâche 4 : Server Action Orchestratrice
**Fichiers :**
- Créer : `app/actions/invoices.ts`

**Étape 1 : Implémenter le flux `processInvoiceDocument(formData: FormData)`**
1. Valider la session.
2. Parser le PDF via `gemini-2.0-flash`.
3. Découper le Buffer initial avec `pdf-lib`.
4. Pour chaque sous-facture :
   - Upload Google Drive (parallèle).
   - Génération de l'Embedding (parallèle via Gemini Embedding 2).
5. Sauvegarder dans Prisma avec requête SQL Raw forcée pour le vecteur si besoin (`prisma.$executeRaw`).

### Tâche 5 : Interface Frontend Intelligente
**Fichiers :**
- Créer/Modifier : `app/invoices/page.tsx`
- Créer : `components/invoices/invoice-upload.tsx`
- Créer : `components/invoices/invoice-table.tsx`

**Étape 1 : Créer la Dropzone**
Intégrer `react-dropzone`. Gérer le Hook pour appeler l'upload.

**Étape 2 : Créer le Tableau + Recherche Sémantique**
Afficher la table des factures. Prévoir une barre de recherche "sémantique" (qui convertira la requête utilisateur en embedding et cherchera les factures les plus proches via Postgres cosine similarity `ORDER BY embedding <=> query_embedding LIMIT 5`).
