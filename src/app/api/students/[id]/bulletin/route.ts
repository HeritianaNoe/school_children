import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getBulletinData } from "@/lib/bulletin";
import { buildBulletinPdf } from "@/lib/bulletin-pdf";

export const dynamic = "force-dynamic";

/** Bulletin scolaire au format PDF (A4). Ajoutez ?inline=1 pour l'afficher dans le navigateur au lieu de le télécharger. */
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

  const { allSubjects, termSummaries, overallAvg } = await getBulletinData(s.id);

  const bytes = await buildBulletinPdf({
    matricule: s.matricule,
    firstName: s.firstName,
    lastName: s.lastName,
    classeName: s.classe.name,
    year: s.classe.schoolYear.name,
    overallAvg,
    subjectCount: allSubjects.length,
    terms: termSummaries.map(({ term, rows }) => ({
      name: term.name,
      rows: rows.map((r) => ({ name: r.name, avg: r.avg })),
    })),
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="bulletin-${s.matricule}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
