# Utiliser une image de base officielle Node.js légère
FROM node:20-alpine AS base

ARG RESEND_API_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Installer les dépendances nécessaires (openssl pour Prisma)
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm install

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Construire l'application Next.js
# On skip le type checking pour accélérer le build en prod
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --- Étape de Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Installer openssl aussi pour le runner
RUN apk add --no-cache openssl

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers construits depuis l'étape précédente
COPY --from=base /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./

# Copier le dossier Prisma pour les commandes db push
COPY --from=base --chown=nextjs:nodejs /app/prisma ./prisma

# Passer à l'utilisateur non-root
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME 0.0.0.0

# Lancement direct du serveur pour éviter les blocages de health-check
CMD ["node", "server.js"]
