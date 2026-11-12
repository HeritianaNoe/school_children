import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Sert la photo de profil d'un utilisateur (un élève ne peut voir que la sienne). */
export async function GET(_req: Request, { params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const photo = await prisma.userPhoto.findUnique({ where: { userId: params.id } });
  if (!photo) return new Response("Photo introuvable", { status: 404 });

  if (u.role === "STUDENT" && u.id !== params.id) return new Response("Accès refusé", { status: 403 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
