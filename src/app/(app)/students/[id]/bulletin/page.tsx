import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { forbidden } from "@/lib/flash";
import { fmtDate } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import { getBulletinData } from "@/lib/bulletin";

export default async function StudentBulletinPage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: { include: { schoolYear: true } } },
  });
  if (!s) notFound();
  if (u.role === "STUDENT" && s.userId !== u.id) forbidden();

  const { allSubjects, termSummaries, overallAvg } = await getBulletinData(s.id);

  return (
    <>
      <div className="page-header no-print">
        <div>
          <h1>Bulletin scolaire</h1>
          <p>
            {s.lastName.toUpperCase()} {s.firstName} · {s.matricule}
          </p>
        </div>
        <Link href={`/students/${s.id}`} className="btn-secondary btn">
          ← Dossier de l'élève
        </Link>
      </div>

      <article className="fiche" style={{ maxWidth: 920 }}>
        <header className="fiche-header">
          <div>
            <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>ÉTABLISSEMENT SCOLAIRE</div>
            <h1>BULLETIN</h1>
            <p>Classe : <strong>{s.classe.name}</strong> · Année : <strong>{s.classe.schoolYear.name}</strong></p>
            <p>Élève : <strong>{s.lastName.toUpperCase()} {s.firstName}</strong></p>
          </div>
          <div className="muted">Date : {fmtDate(new Date())}</div>
        </header>

        <div className="grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="label">Moyenne générale</div>
            <div className="value">{overallAvg ?? "—"}{overallAvg != null && <span style={{ fontSize: "0.9rem" }}>/20</span>}</div>
          </div>
          <div className="stat-card">
            <div className="label">Nombre de matières</div>
            <div className="value">{allSubjects.length}</div>
          </div>
        </div>

        {termSummaries.map(({ term, rows }) => (
          <div key={term.id} style={{ marginBottom: 28 }}>
            <h3 style={{ marginBottom: 12 }}>{term.name}</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.avg ?? "—"} / 20</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="muted" style={{ textAlign: "center", padding: 18 }}>
                        Aucune note pour cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </article>

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
        <a href={`/api/students/${s.id}/bulletin`} className="btn">
          PDF
        </a>
        <PrintButton label="Imprimer" />
      </div>
    </>
  );
}
