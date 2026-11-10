import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateClasse, deleteClasse, addCourse, updateCourse, deleteCourse } from "@/app/actions/classes";
import ConfirmButton from "@/components/ConfirmButton";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function ClassePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { histo?: string; cpage?: string; spage?: string };
}) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  // Ouverte depuis « Historique des années » : consultation seule, aucune modification possible
  const readOnly = searchParams.histo === "1";
  const c = await prisma.classe.findUnique({
    where: { id: params.id },
    include: {
      schoolYear: true,
      students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      courses: {
        include: { subject: true, teacher: { include: { user: true } }, _count: { select: { sessions: true, assessments: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
  });
  if (!c) notFound();

  const [schoolYears, subjects, teachers] = await Promise.all([
    prisma.schoolYear.findMany({ orderBy: { startDate: "desc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);
  const used = new Set(c.courses.map((x) => x.subjectId));
  const coursesP = paginate(c.courses, searchParams.cpage);
  const studentsP = paginate(c.students, searchParams.spage);
  const keep = { histo: readOnly ? "1" : undefined };
  const coursesPdf = {
    title: `Matières enseignées - ${c.name} (${c.schoolYear.name})`,
    subtitle: `${c.courses.length} matière${c.courses.length > 1 ? "s" : ""}`,
    headers: ["Matière", "Enseignant", "Coefficient", "Séances", "Évaluations"],
    rows: c.courses.map((co) => [
      co.subject.name,
      co.teacher.user.name,
      String(co.coefficient),
      String(co._count.sessions),
      String(co._count.assessments),
    ]),
  };
  const studentsPdf = {
    title: `Élèves - ${c.name} (${c.schoolYear.name})`,
    subtitle: `${c.students.length} élève${c.students.length > 1 ? "s" : ""}`,
    headers: ["Matricule", "Nom et prénom"],
    rows: c.students.map((st) => [st.matricule, `${st.lastName.toUpperCase()} ${st.firstName}`]),
  };
  const available = subjects.filter((s) => !used.has(s.id));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            {c.name} <span className="muted">({c.schoolYear.name})</span>
          </h1>
          <p>
            {c.students.length} élève{c.students.length > 1 ? "s" : ""} · {c.courses.length} matière
            {c.courses.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href={readOnly ? "/school-years" : "/classes"} className="btn-secondary btn">
          {readOnly ? "← Historique des années" : "← Toutes les classes"}
        </Link>
      </div>

      {!readOnly && (
      <form action={updateClasse} className="form-section" style={{ maxWidth: 900 }}>
        <h3>Informations de la classe</h3>
        <input type="hidden" name="id" value={c.id} />
        <div className="form-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 0.7fr auto", alignItems: "end" }}>
          <label>
            Nom de la classe *
            <input name="name" required maxLength={50} defaultValue={c.name} />
          </label>
          <label>
            Année scolaire *
            <select name="schoolYearId" required defaultValue={c.schoolYearId}>
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.isCurrent ? " (courante)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Salle
            <input name="roomNumber" maxLength={20} defaultValue={c.roomNumber ?? ""} />
          </label>
          <label>
            Capacité
            <input name="capacity" type="number" min={1} max={500} defaultValue={c.capacity ?? ""} />
          </label>
          <button type="submit">Enregistrer</button>
        </div>
      </form>
      )}

      <h2>Matières enseignées</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matière</th>
              <th>Enseignant</th>
              <th>Coefficient</th>
              <th>Séances</th>
              <th>Évaluations</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {coursesP.items.map((co) => (
              <tr key={co.id}>
                <td>
                  <strong>{co.subject.name}</strong>
                </td>
                {readOnly ? (
                  <>
                    <td>{co.teacher.user.name}</td>
                    <td>{co.coefficient}</td>
                  </>
                ) : (
                <td colSpan={2}>
                  <form action={updateCourse} className="inline-form">
                    <input type="hidden" name="id" value={co.id} />
                    <select name="teacherId" defaultValue={co.teacherId} aria-label="Enseignant">
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user.name}
                        </option>
                      ))}
                    </select>
                    <input
                      name="coefficient"
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue={co.coefficient}
                      style={{ width: 80 }}
                      aria-label="Coefficient"
                    />
                    <button type="submit" className="btn-secondary btn-sm">
                      Enregistrer
                    </button>
                  </form>
                </td>
                )}
                <td>{co._count.sessions}</td>
                <td>{co._count.assessments}</td>
                {!readOnly && (
                <td>
                  <form action={deleteCourse}>
                    <input type="hidden" name="id" value={co.id} />
                    <ConfirmButton
                      message={`Retirer la matière « ${co.subject.name} » de la classe ${c.name} ?`}
                      disabled={co._count.sessions + co._count.assessments > 0}
                    >
                      Retirer
                    </ConfirmButton>
                  </form>
                </td>
                )}
              </tr>
            ))}
            {c.courses.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucune matière n&apos;est encore associée à cette classe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TableFooter
        path={`/classes/${c.id}`}
        pageParam="cpage"
        params={{ ...keep, spage: searchParams.spage }}
        page={coursesP.page}
        totalPages={coursesP.totalPages}
        total={coursesP.total}
        pdf={coursesPdf}
      />
      {!readOnly && (
      <p className="muted" style={{ marginTop: 6 }}>
        Une matière ne peut être retirée que si aucune séance ni évaluation n&apos;y est liée.
      </p>
      )}

      {readOnly ? null : available.length > 0 && teachers.length > 0 ? (
        <form action={addCourse} className="form-section" style={{ marginTop: 16 }}>
          <h3>Ajouter une matière à la classe</h3>
          <input type="hidden" name="classeId" value={c.id} />
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr)) auto", alignItems: "end" }}>
            <label>
              Matière *
              <select name="subjectId" required>
                <option value="">— Choisir —</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Enseignant *
              <select name="teacherId" required>
                <option value="">— Choisir —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Coefficient *
              <input name="coefficient" type="number" step="0.5" min="0.5" defaultValue={1} required />
            </label>
            <button type="submit">Ajouter</button>
          </div>
        </form>
      ) : (
        <p className="muted" style={{ marginTop: 16 }}>
          {subjects.length === 0 ? (
            <>
              Aucune matière n&apos;existe encore : <Link href="/subjects">créez-en une</Link> pour l&apos;associer à cette
              classe.
            </>
          ) : teachers.length === 0 ? (
            "Aucun enseignant n'est enregistré : une matière ne peut pas être associée sans enseignant."
          ) : (
            "Toutes les matières existantes sont déjà associées à cette classe."
          )}
        </p>
      )}

      <h2>Élèves de la classe</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom et prénom</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {studentsP.items.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.matricule}</strong>
                </td>
                <td>
                  {s.lastName.toUpperCase()} {s.firstName}
                </td>
                <td>
                  <Link href={`/students/${s.id}`} className="btn-ghost btn-sm">
                    Voir le dossier
                  </Link>
                </td>
              </tr>
            ))}
            {c.students.length === 0 && (
              <tr>
                <td colSpan={3} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Aucun élève dans cette classe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TableFooter
        path={`/classes/${c.id}`}
        pageParam="spage"
        params={{ ...keep, cpage: searchParams.cpage }}
        page={studentsP.page}
        totalPages={studentsP.totalPages}
        total={studentsP.total}
        pdf={studentsPdf}
      />

      {!readOnly && (
      <div className="card danger-zone" style={{ marginTop: 32 }}>
        <strong>Supprimer cette classe</strong>
        <p className="muted" style={{ margin: "6px 0 12px" }}>
          Possible uniquement si la classe ne contient aucun élève et si aucune séance ni évaluation n&apos;y est liée.
        </p>
        <form action={deleteClasse}>
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton message={`Supprimer la classe ${c.name} (${c.schoolYear.name}) ? Cette action est irréversible.`}>
            Supprimer la classe
          </ConfirmButton>
        </form>
      </div>
      )}
    </>
  );
}
