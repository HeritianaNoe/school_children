import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { loadDossier } from "@/lib/dossier";
import { buildDossierPdf } from "@/lib/dossier-pdf";

export const dynamic = "force-dynamic";

/** Dossier d'élève (présences, moyennes, notes, commentaires) en PDF A4. ?inline=1 pour l'afficher dans le navigateur. */
export async function GET(req: Request, { params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { classe: { include: { schoolYear: true } } },
  });
  if (!s) return new Response("Élève introuvable", { status: 404 });
  if (u.role === "STUDENT" && s.userId !== u.id) return new Response("Accès refusé", { status: 403 });

  // Les commentaires du personnel ne sont jamais montrés à l'élève
  const staffView = u.role !== "STUDENT";
  const { attendance, averages, grades, comments } = await loadDossier(s.id, staffView);

  const bytes = await buildDossierPdf({
    matricule: s.matricule,
    firstName: s.firstName,
    lastName: s.lastName,
    classeName: s.classe.name,
    year: s.classe.schoolYear.name,
    attendance,
    averages: averages.map(({ t, avg }) => ({ term: t.name, avg })),
    grades: grades.map((g) => ({
      date: g.assessment.date,
      subject: g.assessment.course.subject.name,
      title: g.assessment.title,
      score: `${g.score ?? "Abs."} / ${g.assessment.maxScore}`,
    })),
    comments: staffView ? comments.map((c) => ({ author: c.author.name, at: c.createdAt, body: c.body })) : null,
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="dossier-${s.matricule}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
