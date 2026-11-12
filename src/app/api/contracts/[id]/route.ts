import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildContractPdf } from "@/lib/contract-pdf";
import { TEACHER_STATUS_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Contrat d'enseignement (PDF A4). ?inline=1 l'affiche dans le navigateur au lieu de le télécharger. */
export async function GET(req: Request, { params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const c = await prisma.teacherContract.findUnique({
    where: { id: params.id },
    include: { teacher: { include: { user: true } }, schoolYear: true },
  });
  if (!c) return new Response("Contrat introuvable", { status: 404 });

  // Direction, ou l'enseignant concerné
  const direction = u.role === "ADMIN" || u.role === "DIRECTOR";
  if (!direction && !(u.role === "TEACHER" && c.teacher.userId === u.id)) {
    return new Response("Accès refusé", { status: 403 });
  }

  const bytes = await buildContractPdf({
    number: c.number,
    year: c.schoolYear.name,
    startDate: c.startDate,
    endDate: c.endDate,
    teacherName: c.teacher.user.name,
    email: c.teacher.user.email,
    phone: c.teacher.user.phone,
    status: TEACHER_STATUS_LABEL[c.status] ?? c.status,
    hourlyRate: Number(c.hourlyRate),
    issuedAt: c.updatedAt,
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="contrat-${slug(c.teacher.user.name)}-${c.schoolYear.name}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
