# Gestion École — Next.js 14 + Prisma + PostgreSQL

## Fametrahana
```bash
cp .env.example .env                  # ovay ny AUTH_SECRET sy CRON_SECRET
docker compose up -d                  # Postgres (na ampiasao ny DB misy anao)
npm install
npx prisma migrate dev --name init    # na: npm run db:push
npm run db:seed
npm run dev                           # http://localhost:3000
```
Compte seed (teny miafina `password123`): `admin@ecole.mg`, `rakoto@ecole.mg` (prof), `rasoa@ecole.mg` (prof), `andry@ecole.mg` (mpianatra).

Compte : admin@ecole.mg / password123

Tangy amin'ny UI: ny mot de passe par défaut ho an'ny mpianatra sy mpampianatra dia hita amin'ny page `/credentials` ary ho an'ny mpianatra dia `eleve123`, fa ho an'ny mpampianatra/admin dia `password123`.

## Fitaovana
| Zavatra | Toerana |
|---|---|
| Présence mpianatra / prof | `/sessions/[id]` |
| Noty | `/assessments`, `/assessments/[id]` |
| Fiche mpianatra (présence, salan'isa, commentaire) | `/students/[id]` |
| Fiche prof (présence, commentaire, payslip) | `/teachers/[id]` |
| Karama | `/payroll` |
| Notification | `/notifications` + cron `/api/cron/alerts` |

## Notification automatique
- Vercel: `vercel.json` efa manana cron isan'andro (Alatsinainy–Zoma).
- VPS: crontab `0 17 * * 1-5 cd /app && npm run alerts`
- Na antsoy: `curl -H "Authorization: Bearer $CRON_SECRET" https://ton-site/api/cron/alerts`
- Fetra: `src/lib/alerts.ts` → `THRESHOLDS`.

## Fanamarihana
- Apetraho `TZ=Indian/Antananarivo` (ora séance sy herinandro miankina amin'izany).
- Tsy mbola misy UI CRUD ho an'ny classe / mpianatra / prof / matière: ampiasao `npm run db:studio` na manaova pejy araka ny `seed.ts`.
- Ny rôle `PARENT` dia ao amin'ny enum fa tsy mbola manana pejy.
"# school_children" 
