# Gestion École

Rafitra fitantanana sekoly (Next.js 14 + Prisma + PostgreSQL). Mitantana ny mpianatra, ny mpampianatra, ny classes sy matières, ny emploi du temps, ny séances sy présences, ny noty sy bulletin, ny karama, ny fanambarana (annonces), ny réclamations ary ny notifications automatique.

## Votoatiny

1. [Fametrahana](#1-fametrahana)
2. [Fidirana sy kaonty fanandramana](#2-fidirana-sy-kaonty-fanandramana)
3. [Ny sokajy (rôles)](#3-ny-sokajy-rôles)
4. [Ny azon'ny sokajy tsirairay atao](#4-ny-azonny-sokajy-tsirairay-atao)
5. [Tabilao fahazoan-dalana: pejy × sokajy](#5-tabilao-fahazoan-dalana-pejy--sokajy)
6. [Fomba fiasa mahazatra (workflow)](#6-fomba-fiasa-mahazatra-workflow)
7. [Fitaovana sy pejy lehibe](#7-fitaovana-sy-pejy-lehibe)
8. [Notification automatique](#8-notification-automatique)
9. [Fanamarihana](#9-fanamarihana)

---

Compte:
admin: admin@ecole.mg / password123 
directeur: directeur@ecole.mg / password123 
manager: manager@ecole.mg / password123
prof: rakoto@ecole.mg / password123
eleve: andry@ecole.mg / eleve123

## 1. Fametrahana

```bash
cp .env.example .env                  # ovay ny AUTH_SECRET sy CRON_SECRET
docker compose up -d                  # Postgres (na ampiasao ny DB misy anao)
npm install
npx prisma migrate dev --name init    # na: npm run db:push
npm run db:seed                       # mameno ny tahiry amin'ny angona fanandramana
npm run dev                           # http://localhost:3000
```

Variables ilaina ao amin'ny `.env`:

| Variable | Fampiasana |
|---|---|
| `DATABASE_URL` | Fifandraisana amin'ny PostgreSQL |
| `AUTH_SECRET` | Fanalahidy fanasonia ny cookie `session` (JWT, 7 andro). **Ovay amin'ny production.** |
| `CRON_SECRET` | Token fiarovana ny `/api/cron/alerts` |

> **Tandremo:** `npm run db:seed` dia **mamafa ny angona rehetra** (mpianatra, noty, séances…) alohan'ny hamerenany ny angona fanandramana. Aza ampiasaina amin'ny tahiry marina.

---

## 2. Fidirana sy kaonty fanandramana

Tsindrio ny `/login`, ampidiro ny **email** sy ny **teny miafina**. Mijanona mifandray 7 andro ny session raha tsy mivoaka (« Se déconnecter » ao ambany ny menu havia). Tsy afaka miditra ny kaonty tsy mavitrika (désactivé).

| Sokajy | Email | Teny miafina |
|---|---|---|
| Administrateur | `admin@ecole.mg` | `password123` |
| Directeur | `directeur@ecole.mg` | `password123` |
| Manager | `manager@ecole.mg` | `password123` |
| Enseignant | `rakoto@ecole.mg`, `rasoa@ecole.mg`, `randrian@ecole.mg`, `rala@ecole.mg` | `password123` |
| Élève | `andry@ecole.mg`, `bodo@ecole.mg`, `chloe@ecole.mg`, … (anarana voalohany @ecole.mg) | `eleve123` |

Teny miafina **default** ho an'ny kaonty vaovao: `eleve123` ho an'ny mpianatra, `password123` ho an'ny mpampianatra sy ny fitantanana. Hita ao amin'ny `/credentials` izy ireo (ho an'ny fitantanana ihany).

**Ovaina avy hatrany ny teny miafina** rehefa tafiditra voalohany: tsindrio ny anaranao ao ambany ny menu → « Modifier mon compte ».

---

## 3. Ny sokajy (rôles)

Misy sokajy **5**. Ny sokajy dia voafaritra rehefa mamorona kaonty ary ny rafitra ihany no mamaritra izay hita sy azo atao.

| Sokajy | Anarana amin'ny UI | Fohy |
|---|---|---|
| `ADMIN` | Administrateur | Fahefana feno. Ny hany afaka mitantana ny kaonty Administrateur hafa. |
| `DIRECTOR` | Directeur | Toy ny Administrateur amin'ny raharaha ara-pitsipi-pianarana, fa tsy mitantana ny kaonty Administrateur. |
| `MANAGER` | Manager | Fitantanana ara-pitantanana (utilisateurs, enseignants, annonces, réclamations). Tsy mikasika ny raharaha ara-pianarana (notes, séances, paie, élèves). |
| `TEACHER` | Enseignant | Mitantana ny séances sy noty **an'ny taranany ihany**; mijery ny paie-ny. |
| `STUDENT` | Élève | Mijery ny **tenany ihany** (dossier, noty, bulletin) sy ny emploi du temps/présents amin'ny classe-ny. |

Fanamarihana mahasoa:

- ADMIN + DIRECTOR + MANAGER = « **personnel / administration** » (`STAFF`).
- ADMIN + DIRECTOR = « **direction** » (afaka manoratra amin'ny angona ara-pianarana).
- ADMIN + DIRECTOR + TEACHER = « **pédagogie** » (mahita ny élèves, matières, notes, séances).

---

## 4. Ny azon'ny sokajy tsirairay atao

### 4.1 Administrateur (`ADMIN`)

Mahazo ny zavatra rehetra, ary indrindra:

- **Utilisateurs**: mamorona, manova, mamerina ny teny miafina, mampihatra/mampiato (activer/désactiver), mamafa ny kaonty rehetra, **anisan'izany ny kaonty Administrateur hafa**. Tsy afaka manafaingana ny tenany ho sokajy ambany, mampiato ny tenany na mamafa ny tenany.
- **Élèves**: Nouvelle inscription, fanovana, famafana, fiche d'inscription (PDF), commentaires.
- **Enseignants**: mamorona, mijery ny fiche (présences, commentaires, fiche de paie).
- **Classes**: manampy, manova, mamafa; mamaritra ny matières sy ny enseignant isaky ny classe.
- **Matières**, **Périodes** (trimestre/semestre): manampy, manova, mamafa.
- **Emploi du temps**: mamorona/manova/mamafa créneau (voafetra ny fifandonana classe na enseignant mitovy ora).
- **Séances**: mamorona séance, manova enseignant (remplacement), mamafa, manao appel, mandrakitra ny **présence an'ny enseignant** (ora tonga/lasa).
- **Notes et évaluations**: mamorona évaluation, mampiditra ny noty ho an'ny classe rehetra.
- **Paie**: mamorona ny fiche de paie isam-bolana ary manova ny statut (Brouillon → Validée → Payée).
- **Historique des années**, **Annonces**, **Réclamations**, **Mots de passe par défaut**, **Tableau de bord** feno.

### 4.2 Directeur (`DIRECTOR`)

Toy ny Administrateur ankoatra ny **kaonty Administrateur**: tsy afaka mamorona, manova, mijery ary mamafa kaonty Administrateur.

### 4.3 Manager (`MANAGER`)

Ao amin'ny menu hitany: Tableau de bord, Emploi du temps, Élèves présents, Annonces, Réclamations, **Classes**, **Périodes**, **Enseignants**, **Utilisateurs**.

- **Utilisateurs**: mamorona kaonty Directeur / Manager (tsy Administrateur), manova, mamerina teny miafina, mampihatra/mampiato. **Tsy afaka mamafa** kaonty mpianatra na mpampianatra, na kaonty Administrateur.
- **Enseignants**: mijery ny lisitra sy mamorona kaonty mpampianatra vaovao.
- **Annonces**: mamorona (publié na brouillon) sy mamafa.
- **Réclamations**: mahita **ny rehetra**, manova ny statut ary mamaly.
- **Classes**: mijery ny lisitra sy afaka manampy classe vaovao; ny pejy fitantanana ny anatin'ny classe (matières, enseignants, fanovana) dia ho an'ny ADMIN/DIRECTOR ihany.
- **Périodes**: mijery ihany (ny fanampiana/fanovana dia ho an'ny ADMIN/DIRECTOR).
- **Tableau de bord**: mahita ny statistika ankapobeny (élèves inscrits, classes, matières, enseignants, séances sy absences isan-kerinandro, évaluations, réclamations en attente) ary ny « Mots de passe par défaut ».
- **Tsy mahita:** Élèves (lisitra/fiche), Matières, Notes, Séances et présences, Paie, Historique des années, fiche mpampianatra.

### 4.4 Enseignant (`TEACHER`)

Ao amin'ny menu hitany: Tableau de bord, Emploi du temps, Élèves présents, Annonces, Réclamations, **Élèves**, **Matières**, **Notes et évaluations**, **Séances et présences**, **Paie**.

- **Emploi du temps**: ny taranany ihany; afaka mamiraka séance raha **ny azy** ihany.
- **Séances et présences**: ny séance **nirahina azy** ihany. Manao **appel** ny mpianatra (Présent / En retard / Absent / Justifié, minitra retard, remarque). Rehefa voatahiry ny appel dia lasa « Terminée » ny séance.
- **Notes et évaluations**: ny évaluation amin'ny cours-ny ihany; mamorona évaluation (Devoir, Interrogation, Examen), mampiditra/manova ny noty.
- **Élèves**: mijery ny lisitra sy ny fiche mpianatra, mamoaka ny fiche d'inscription (PDF) ary mandefa **commentaire** momba ny mpianatra.
- **Matières**: jerena fotsiny.
- **Paie** (« Ma paie »): mijery ny fiche de paie **tsy ho azy ihany**.
- **Tsy afaka:** mamorona/mamafa mpianatra, manova séance, mijery ny paie an'ny hafa, mijery utilisateurs, classes, enseignants.

### 4.5 Élève (`STUDENT`)

Ao amin'ny menu hitany: Tableau de bord, Emploi du temps, Élèves présents, Annonces, Réclamations ary « **Mon espace** ».

- **Mon dossier**, **Mes notes**, **Mon bulletin**: ny azy ihany (tsy afaka mijery an'ny mpianatra hafa). Azo alaina PDF: bulletin, relevé de notes, fiche d'inscription.
- **Emploi du temps**: ny an'ny classe-ny.
- **Élèves présents**: ny classe-ny ihany, sivanina araka ny daty (tsy misy sivana classe).
- **Réclamations**: afaka mamorona; tsy mahita afa-tsy ny azy.
- **Notifications**: mahazo fampandrenesana (ohatra retard na absence be loatra).
- **Annonces**: ireo « publiées » ihany.

---

## 5. Tabilao fahazoan-dalana: pejy × sokajy

`✔` = afaka manao feno · `👁` = jery fotsiny · `own` = ny azy/ny taranany ihany · `—` = tsy mahazo

| Pejy / Fiasa | ADMIN | DIRECTOR | MANAGER | TEACHER | STUDENT |
|---|:-:|:-:|:-:|:-:|:-:|
| Tableau de bord | ✔ (stats) | ✔ (stats) | ✔ (stats) | ✔ | ✔ |
| Emploi du temps (jery) | ✔ | ✔ | 👁 | own | own (classe) |
| Emploi du temps (manova) | ✔ | ✔ | — | — | — |
| Élèves présents | ✔ | ✔ | ✔ | ✔ | own (classe) |
| Annonces (jery) | ✔ | ✔ | ✔ | 👁 | 👁 |
| Annonces (mamorona / mamafa) | ✔ | ✔ | ✔ | — | — |
| Réclamations (mamorona) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Réclamations (jery rehetra, mamaly) | ✔ | ✔ | ✔ | own | own |
| Notifications, Mon compte | ✔ | ✔ | ✔ | ✔ | ✔ |
| Élèves (lisitra, fiche) | ✔ | ✔ | — | 👁 | own |
| Élèves (inscription, fanovana, famafana) | ✔ | ✔ | — | — | — |
| Commentaire momba mpianatra | ✔ | ✔ | — | ✔ | — |
| Mon dossier / Mes notes / Mon bulletin | — | — | — | — | ✔ |
| Classes | ✔ | ✔ | 👁 (+ manampy) | — | — |
| Matières | ✔ | ✔ | — | 👁 | — |
| Périodes | ✔ | ✔ | 👁 | — | — |
| Historique des années | ✔ | ✔ | — | — | — |
| Notes et évaluations | ✔ | ✔ | — | own | — |
| Séances et présences (appel) | ✔ | ✔ | — | own | — |
| Séances (créer, remplacer, supprimer) | ✔ | ✔ | — | — | — |
| Présence de l'enseignant | ✔ | ✔ | — | — | — |
| Enseignants (lisitra, manampy) | ✔ | ✔ | ✔ | — | — |
| Fiche enseignant + commentaire | ✔ | ✔ | — | — | — |
| Utilisateurs | ✔ (rehetra) | ✔ (afa-tsy ADMIN) | ✔ (afa-tsy ADMIN, tsy mamafa mpianatra/prof) | — | — |
| Paie | ✔ (mitantana) | ✔ (mitantana) | — | own | — |
| Mots de passe par défaut | ✔ | ✔ | ✔ | — | — |

---

## 6. Fomba fiasa mahazatra (workflow)

Ny filaharana atolotra rehefa manomboka taom-pianarana vaovao (ADMIN / DIRECTOR):

1. **Périodes**: ataovy ny trimestre/semestre (anarana + daty fanombohana/farany).
2. **Matières**: ampio ny taranja (Mathématiques, Français…).
3. **Enseignants**: mamorona ny mpampianatra (taux horaire ho an'ny paie).
4. **Classes**: ampio ny classe (ohatra `6ème A`, taona `2026-2027`), avy eo ao anatiny ny **cours** (matière + enseignant + coefficient).
5. **Élèves → Nouvelle inscription**: fenoy ny fiche mpianatra. Ny **matricule** dia automatique (`M26-001`, `M26-002`…). Ny kaonty (email + teny miafina `eleve123`) dia noforonina ho azy raha tsy omena. Azo apetraka ny sary sy ny **Date d'inscription** (default: androany).
6. **Emploi du temps**: mamorona ny créneaux isan-kerinandro (andro, ora, salle). Voasivana ny fifandonana (classe na enseignant mitovy ora).
7. **Séances**: noforonina avy amin'ny emploi du temps na amin'ny « Nouvelle séance ».
8. **Appel**: isaky ny séance, ny enseignant (na ADMIN/DIRECTOR) no mameno ny présence mpianatra.
9. **Notes**: mamorona évaluation ao amin'ny « Notes et évaluations » ary mampiditra ny noty.
10. **Bulletin / Paie**: azo alaina ny bulletin PDF isaky ny mpianatra; ny fiche de paie isam-bolana dia noforonina ao amin'ny « Paie ».

---

## 7. Fitaovana sy pejy lehibe

| Zavatra | Toerana | Fanamarihana |
|---|---|---|
| Tableau de bord | `/dashboard` | Stats (personnel), notifications, annonces, réclamations |
| Emploi du temps | `/timetable` | Sivana araka ny classe na enseignant; PDF; ADMIN/DIRECTOR no manova |
| Élèves présents | `/presents` | Lisitry ny mpianatra tonga isaky ny séance, araka ny daty sy classe. **Sary sy anarana (NOM Prénom) eo akaikin'ny iray hafa**. PDF sy famoahana |
| Élèves | `/students` | Tabilao: **Nom et prénom** (miaraka amin'ny sary), **Matricule**, **Sexe**, **Classe**, **Date d'inscription**. Fikarohana araka ny anarana/matricule sy sivana classe |
| Fiche mpianatra | `/students/[id]` | Présence 30 andro, salan'isa, commentaires, fiche d'inscription, bulletin |
| Noty | `/assessments`, `/assessments/[id]` | Évaluations + fampidirana noty |
| Séances sy appel | `/sessions`, `/sessions/[id]` | Présence mpianatra (+ mpampianatra ho an'ny direction) |
| Fiche mpampianatra | `/teachers/[id]` | Présence, commentaire, fiche de paie |
| Karama | `/payroll` | Ora tena nampianarina × taux horaire |
| Annonces | `/announcements` | Famoahana; PDF isaky ny annonce |
| Réclamations | `/reclamations` | Statut `OPEN` → `IN_PROGRESS` → `CLOSED` + valiny |
| Notifications | `/notifications` | Fampandrenesana manokana ho an'ny mpampiasa |
| Mon compte | `/account` | Fanovana teny miafina (8 litera farafahakeliny), finday, sary |
| Mot de passe par défaut | `/credentials` | ADMIN / DIRECTOR / MANAGER |

**Fikajiana ny paie:** ny séance « Terminée » ao anatin'ny volana ihany no tanisaina. Raha « Absent » na « Justifié » ny enseignant dia 0 minitra; raha misy ora tonga/lasa dia voafetra amin'izany ny fotoana nampianarina.

---

## 8. Notification automatique

Ny rafitra dia mamoaka fampandrenesana ho an'ny ADMIN/DIRECTOR (sy ny mpianatra voakasik'izany) rehefa mihoatra ny sakana:

| Karazana | Lanja default (`THRESHOLDS` ao amin'ny `src/lib/alerts.ts`) |
|---|---|
| Mpianatra tara matetika | ≥ 3 retards isan-kerinandro |
| Mpianatra tsy tonga matetika | ≥ 20 % absence amin'ny 30 andro (raha ≥ 10 séances) |
| Mpampianatra tara matetika | ≥ 3 retards isan-kerinandro |
| Mpampianatra tsy tonga matetika | ≥ 3 absences amin'ny 30 andro |

Fomba fandefasana:

- **Vercel**: `vercel.json` manana cron isan'andro (Alatsinainy–Zoma).
- **VPS**: crontab `0 17 * * 1-5 cd /app && npm run alerts`
- **Antsoina mivantana**: `curl -H "Authorization: Bearer $CRON_SECRET" https://ton-site/api/cron/alerts`

Tsy misy doublon na antsoina im-betsaka aza ny cron (idempotent).

---

## 9. Fanamarihana

- Apetraho `TZ=Indian/Antananarivo`: ny ora séance sy ny herinandro miankina amin'izany.
- Ny sary mpianatra sy mpampiasa dia tehirizina ao amin'ny tahiry (mandeha na amin'ny hébergement tsy manana kapila maharitra). Raha tsy misy sary dia misy avatar default voafidy araka ny lahy/vavy.
- Ny pejy rehetra dia voaaro: raha tsy tafiditra dia mivoaka mankany `/login`; raha tsy mahazo ny pejy dia averina any amin'ny Tableau de bord miaraka amin'ny hafatra « accès refusé ».
- Ny mpampiasa tsy mavitrika na voafafa dia voaroaka avy hatrany ny session-ny.