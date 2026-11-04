import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { defaultAvatarUrl } from "@/lib/avatar";
import { getSession } from "@/lib/session";
import { buildFichePdf } from "@/lib/fiche-pdf";

export const dynamic = "force-dynamic";

/** Avatar par défaut (PNG de /public/avatars) utilisé dans le PDF quand l'élève n'a pas de photo. */
async function defaultPhoto(sex: "M" | "F" | null, seed: string) {
  try {
    const file = path.join(process.cwd(), "public", defaultAvatarUrl(sex, seed));
    return { data: new Uint8Array(await readFile(file)), mime: "image/png" };
  } catch {
    return null; // fichier absent : le cadre reste vide
  }
}

/** Fiche d'inscription au format PDF (A4). Ajoutez ?inline=1 pour l'afficher dans le navigateur au lieu de la télécharger. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, classe: true, photo: true },
  });
  if (!s) return new Response("Élève introuvable", { status: 404 });

  // Fiche d'inscription : direction, enseignants, ou l'élève lui-même
  const direction = u.role === "ADMIN" || u.role === "DIRECTOR" || u.role === "TEACHER";
  if (!direction && !(u.role === "STUDENT" && s.userId === u.id)) {
    return new Response("Accès refusé", { status: 403 });
  }

  const bytes = await buildFichePdf({
    matricule: s.matricule,
    firstName: s.firstName,
    lastName: s.lastName,
    birthDate: s.birthDate,
    birthPlace: s.birthPlace,
    sex: s.sex,
    address: s.address,
    phone: s.phone,
    email: s.user.email,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    registeredAt: s.registeredAt,
    classeName: s.classe.name,
    year: s.classe.year,
    photo: s.photo ? { data: s.photo.data, mime: s.photo.mime } : await defaultPhoto(s.sex, s.id),
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="fiche-inscription-${s.matricule}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
