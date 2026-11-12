import Link from "next/link";
import { studentImageUrl } from "@/lib/avatar";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { SEX_LABEL, NOMENCLATURE_LABEL } from "@/lib/labels";
import { fmtDateFull } from "@/lib/format";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function StudentsPage({
  searchParams: searchParamsP,
}: {
  searchParams: Promise<{ q?: string; classe?: string; page?: string }>;
}) {
  const searchParams = await searchParamsP;
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const q = (searchParams.q ?? "").trim();

  // Seule l'année scolaire courante est affichée (élèves et filtre par classe).
  // Sans année courante définie, on retombe sur toutes les années plutôt que d'afficher une liste vide.
  const currentYear = await prisma.schoolYear.findFirst({ where: { isCurrent: true } });
  const yearFilter = currentYear ? { schoolYearId: currentYear.id } : {};

  // Les classes et les élèves sont chargés en parallèle (une seule attente au lieu de deux)
  const classesPromise = prisma.classe.findMany({
    where: yearFilter,
    select: { id: true, name: true, schoolYear: { select: { name: true } } },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
  });
  const classeParam = searchParams.classe ?? "";

  const where = {
    classe: yearFilter,
    // Le filtre de classe est appliqué directement ; un identifiant d'une autre année ne renvoie simplement rien
    ...(classeParam ? { classeId: classeParam } : {}),
    ...(q
      ? {
          OR: [
            { lastName: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { matricule: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [classes, all] = await Promise.all([
    classesPromise,
    prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        sex: true,
        photoUrl: true,
        nomenclature: true,
        registeredAt: true,
        classe: { select: { name: true } },
        user: { select: { active: true } },
      },
      orderBy: [{ classe: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
  // Un ?classe=… d'une année passée (ancien lien, favori) est ignoré dans le filtre
  const classeId = classes.some((c) => c.id === classeParam) ? classeParam : "";
  const { items: list, page, totalPages, total } = paginate(all, searchParams.page);

  const classeLabel = classes.find((c) => c.id === classeId);
  const pdf = {
    title: "Élèves",
    subtitle: [
      `${total} élève${total > 1 ? "s" : ""}`,
      currentYear ? `Année : ${currentYear.name}` : "",
      classeLabel ? `Classe : ${classeLabel.name} (${classeLabel.schoolYear.name})` : "",
      q ? `Recherche : ${q}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    headers: ["Nom et prénom", "Sexe", "Classe", "Nomenclature", "Date d'inscription"],
    rows: all.map((s) => [
      `${s.lastName.toUpperCase()} ${s.firstName}`,
      s.sex ? SEX_LABEL[s.sex] : "—",
      s.classe.name,
      NOMENCLATURE_LABEL[s.nomenclature],
      fmtDateFull(s.registeredAt),
    ]),
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Élèves{currentYear ? ` — ${currentYear.name}` : ""}</h1>
          <p>
            {total} élève{total > 1 ? "s" : ""}
            {q || classeId ? " trouvé" + (total > 1 ? "s" : "") : ` inscrit${total > 1 ? "s" : ""}`}
          </p>
        </div>
        {isStaff(u.role) && (
          <Link href="/students/new" className="btn">
            <Icon name="plus" size={16} />
            Nouvelle inscription
          </Link>
        )}
      </div>

      <form method="get" className="filters">
        <label>
          Recherche
          <input name="q" defaultValue={q} placeholder="Nom, prénom ou matricule" />
        </label>
        <label>
          Classe
          <select name="classe" defaultValue={classeId}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.schoolYear.name})
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrer</button>
        {(q || classeId) && (
          <Link href="/students" className="btn-secondary btn">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom et prénom</th>
              <th>Sexe</th>
              <th>Classe</th>
              <th>Nomenclature</th>
              <th>Date d&apos;inscription</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} style={{ opacity: s.user.active ? 1 : 0.6 }}>
                <td>
                  <div className="row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={studentImageUrl(s)} alt="" className="thumb" />
                    <span>
                      {s.lastName.toUpperCase()} {s.firstName}
                    </span>
                    {!s.user.active && <span className="tag tag-muted">Compte inactif</span>}
                  </div>
                </td>
                <td>
                  {s.sex ? <span className={`tag ${s.sex}`}>{SEX_LABEL[s.sex]}</span> : "—"}
                </td>
                <td>{s.classe.name}</td>
                <td>{NOMENCLATURE_LABEL[s.nomenclature]}</td>
                <td>{fmtDateFull(s.registeredAt)}</td>
                <td>
                  <Link href={`/students/${s.id}`} className="btn-ghost btn-sm" title="Voir le dossier" aria-label="Voir le dossier">
                    <Icon name="eye" size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="muted">
                  {q || classeId ? "Aucun élève ne correspond à votre recherche." : "Aucun élève inscrit pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TableFooter path="/students" params={{ q, classe: classeId }} page={page} totalPages={totalPages} total={total} pdf={pdf} />
    </>
  );
}
