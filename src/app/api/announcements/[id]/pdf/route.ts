import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildAnnouncementPdf } from "@/lib/announcement-pdf";

export const dynamic = "force-dynamic";

/** PDF d'une annonce. Ajoutez ?inline=1 pour l'afficher dans le navigateur. */
export async function GET(req: Request, { params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const a = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true, email: true } } },
  });
  if (!a) return new Response("Annonce introuvable", { status: 404 });

  const staff = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "MANAGER";
  if (!a.published && !staff) {
    return new Response("Accès refusé", { status: 403 });
  }

  const bytes = await buildAnnouncementPdf({
    title: a.title,
    body: a.body,
    authorName: a.author.name,
    authorEmail: a.author.email,
    createdAt: a.createdAt,
    published: a.published,
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const safeName = a.title
    .slice(0, 40)
    .replace(/[^\w\s\-àâäéèêëïîôùûüç]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "annonce";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="annonce-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
