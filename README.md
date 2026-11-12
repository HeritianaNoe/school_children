# Gestion scolaire — École lumière

Application de gestion d'établissement scolaire avec Next.js, React, TypeScript, Prisma et PostgreSQL.

## Prérequis
- Node.js 20 ou supérieur
- PostgreSQL 14 ou supérieur

## Installation

```bash
npm install
cp .env.example .env
```

Modifiez `DATABASE_URL` dans `.env` pour correspondre à votre base PostgreSQL et remplacez `AUTH_SECRET` par une clé aléatoire longue.

```bash
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrez http://localhost:3000.

## Commandes utiles
- `npm run dev` : démarrer en développement
- `npm run build` : générer Prisma puis compiler Next.js
- `npm run typecheck` : vérifier les types TypeScript
- `npm run db:push` : synchroniser le schéma avec PostgreSQL
- `npm run db:seed` : charger les données de démonstration
- `npm run db:studio` : ouvrir Prisma Studio

Après le seed, les comptes de démonstration sont :
- Personnel (administrateur, direction, gestionnaire et enseignants) : mot de passe `password123`
- Élèves : mot de passe `eleve123`

Les adresses e-mail de démonstration sont définies dans `prisma/seed.ts`. Changez les mots de passe après la première connexion.
