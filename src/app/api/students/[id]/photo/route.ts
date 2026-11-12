import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Sert la photo d'un élève (réservée aux utilisateurs connectés : personnel, enseignants, l'élève lui-même). */
export async function GET(_req: Request, { params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const photo = await prisma.studentPhoto.findUnique({
    where: { studentId: params.id },
    include: { student: { select: { userId: true } } },
  });
  if (!photo) return new Response("Photo introuvable", { status: 404 });

  const allowed = u.role !== "STUDENT" || u.id === photo.student.userId;
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      // Le paramètre ?v= change à chaque nouvelle photo : le cache navigateur peut donc être long
      "Cache-Control": "private, max-age=86400",
    },
  });
}
