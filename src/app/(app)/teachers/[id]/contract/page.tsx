import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { forbidden } from "@/lib/flash";
import { fmtAr, fmtDateFull, fmtUtcDate } from "@/lib/format";
import { TEACHER_STATUS_LABEL } from "@/lib/labels";
import { SCHOOL_NAME, contractText } from "@/lib/contract-text";
import { renewContract } from "@/app/actions/contracts";
import PdfLink from "@/components/PdfLink";
import PrintButton from "@/components/PrintButton";

/** Contrat d'enseignement d'un enseignant : page à part, imprimable (en-tête de l'école, date, signatures). */
export default async function TeacherContractPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { c?: string };
}) {
  const me = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const t = await prisma.teacher.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!t) notFound();
  if (me.role === "TEACHER" && t.userId !== me.id) forbidden(); // un enseignant ne voit que son contrat
  const canManage = me.role !== "TEACHER";
  const back = canManage ? `/teachers/${t.id}` : "/dashboard";

  const [contracts, currentYear] = await Promise.all([
    prisma.teacherContract.findMany({
      where: { teacherId: t.id },
      include: { schoolYear: true },
      orderBy: { schoolYear: { startDate: "desc" } },
    }),
    prisma.schoolYear.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } }),
  ]);
  // ?c=<id> : un contrat précis (historique) ; sinon celui de l'année courante
  const contract =
    contracts.find((c) => c.id === searchParams.c) ?? contracts.find((c) => c.schoolYear.isCurrent) ?? null;

  const header = (
    <div className="page-header no-print">
      <div>
        <h1>Contrat d&apos;enseignement</h1>
        <p>{t.user.name}{contract ? ` — ${contract.schoolYear.name}` : ""}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {contract && <PdfLink href={`/api/contracts/${contract.id}`} />}
        {contract && <PrintButton label="Imprimer" />}
        {canManage && currentYear && (!contract || contract.schoolYear.id === currentYear.id) && (
          <form action={renewContract}>
            <input type="hidden" name="teacherId" value={t.id} />
            <button type="submit" className="btn-secondary">{contract ? "Actualiser le contrat" : "Générer le contrat"}</button>
          </form>
        )}
        <Link href={back} className="btn-secondary btn">← Retour</Link>
      </div>
    </div>
  );

  if (!contract) {
    return (
      <>
        {header}
        <p className="muted">
          {currentYear ? "Aucun contrat pour l'année scolaire courante." : "Aucune année scolaire courante définie."}
        </p>
      </>
    );
  }

  const text = contractText({
    year: contract.schoolYear.name,
    status: TEACHER_STATUS_LABEL[contract.status] ?? contract.status,
    rate: fmtAr(Number(contract.hourlyRate)),
    start: fmtUtcDate(contract.startDate),
    end: fmtUtcDate(contract.endDate),
    teacherName: t.user.name,
    email: t.user.email,
    phone: t.user.phone,
  });
  const outdated =
    canManage &&
    contract.schoolYear.isCurrent &&
    (Number(contract.hourlyRate) !== Number(t.hourlyRate) || contract.status !== t.status);
  const past = contracts.filter((c) => c.id !== contract.id);

  return (
    <>
      {header}
      {outdated && (
        <p className="muted no-print">
          Le taux horaire ou le statut de l&apos;enseignant a changé depuis la génération du contrat : utilisez « Actualiser le contrat ».
        </p>
      )}

      <article className="fiche">
        {/* En-tête de l'école + date d'établissement */}
        <header className="fiche-header" style={{ alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.02em" }}>{SCHOOL_NAME.toUpperCase()}</div>
            <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>Établissement scolaire</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
            <div className="muted">Établi le</div>
            <strong>{fmtDateFull(contract.updatedAt)}</strong>
          </div>
        </header>

        <h1 style={{ fontSize: "1.4rem", margin: "0 0 4px" }}>CONTRAT D&apos;ENSEIGNEMENT</h1>
        <p className="muted" style={{ margin: "0 0 24px" }}>
          Année scolaire <strong>{contract.schoolYear.name}</strong> · N° <strong>{contract.number}</strong>
        </p>

        <p><strong>Entre les soussignés :</strong></p>
        {text.parties.map((p) => <p key={p}>{p}</p>)}
        <p><strong>il a été convenu ce qui suit :</strong></p>

        {text.articles.map((a) => (
          <section key={a.title} style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 6, color: "#0f172a" }}>{a.title}</h3>
            {a.body.map((b) => <p key={b} style={{ margin: "0 0 6px" }}>{b}</p>)}
          </section>
        ))}

        <p style={{ marginTop: 32 }}>
          Fait à ____________________, le {fmtDateFull(contract.updatedAt)}, en deux exemplaires.
        </p>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, fontSize: "0.9rem" }}>
          <div>
            <strong>L&apos;Enseignant(e)</strong>
            <div className="muted" style={{ fontSize: "0.8rem" }}>« Lu et approuvé »</div>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 56, marginTop: 8 }} />
          </div>
          <div>
            <strong>Pour l&apos;Établissement</strong>
            <div className="muted" style={{ fontSize: "0.8rem" }}>Cachet et signature</div>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 56, marginTop: 8 }} />
          </div>
        </div>
      </article>

      {past.length > 0 && (
        <div className="no-print" style={{ marginTop: 28 }}>
          <h3>Autres contrats</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {past.map((c) => (
              <Link key={c.id} href={`/teachers/${t.id}/contract?c=${c.id}`} className="btn-secondary btn btn-sm">
                {c.schoolYear.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
