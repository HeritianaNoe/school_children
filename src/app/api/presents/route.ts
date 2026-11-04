import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { defaultAvatarUrl } from "@/lib/avatar";
import { fmtDateFull, fmtTime } from "@/lib/format";
import { ATTENDANCE_LABEL } from "@/lib/labels";
import { getPresents, parseDay } from "@/lib/presents";
import { buildPresentsPdf, type PresentsPdfImage } from "@/lib/presents-pdf";

export const dynamic = "force-dynamic";

/** Élèves présents au format PDF (A4). Paramètres : ?date=AAAA-MM-JJ&classe=<id>&session=<id> (facultatifs : classe et séance). Ajoutez &inline=1 pour l'afficher dans le navigateur. */
export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const url = new URL(req.url);
  const day = parseDay(url.searchParams.get("date"));
  let classeId = url.searchParams.get("classe") ?? "";
  if (u.role === "STUDENT") {
    // Élève : uniquement sa propre classe, quelle que soit l'URL demandée
    const own = await prisma.student.findUnique({ where: { userId: u.id }, select: { classeId: true } });
    if (!own) return new Response("Accès refusé", { status: 403 });
    classeId = own.classeId;
  }

  const sessionId = url.searchParams.get("session") || undefined;
  const { start, sessions } = await getPresents(day, classeId || undefined, sessionId);
  const classe = classeId ? await prisma.classe.findUnique({ where: { id: classeId } }) : null;

  // Photos téléversées des élèves concernés (une seule requête)
  const studentIds = [...new Set(sessions.flatMap((s) => s.present.map((a) => a.student.id)))];
  const photos = studentIds.length
    ? await prisma.studentPhoto.findMany({ where: { studentId: { in: studentIds } } })
    : [];
  const photoById = new Map(photos.map((p) => [p.studentId, p]));

  // Avatars par défaut (PNG de /public/avatars), lus une seule fois chacun
  const avatarCache = new Map<string, PresentsPdfImage | null>();
  const avatar = async (sex: "M" | "F" | null, id: string): Promise<PresentsPdfImage | null> => {
    const rel = defaultAvatarUrl(sex, id);
    if (!avatarCache.has(rel)) {
      try {
        const data = new Uint8Array(await readFile(path.join(process.cwd(), "public", rel)));
        avatarCache.set(rel, { key: `avatar:${rel}`, data, mime: "image/png" });
      } catch {
        avatarCache.set(rel, null);
      }
    }
    return avatarCache.get(rel)!;
  };

  const bytes = await buildPresentsPdf({
    dateLabel: fmtDateFull(start),
    classeLabel: classe ? `Classe : ${classe.name} (${classe.year})` : "Toutes les classes",
    sessions: await Promise.all(
      sessions.map(async (s) => ({
        title: `${s.course.subject.name} — ${s.course.classe.name}`,
        subtitle:
          `${fmtTime(s.startsAt)} – ${fmtTime(s.endsAt)} · ${s.teacher.user.name}` +
          (s.replacedTeacher ? ` (remplace ${s.replacedTeacher})` : "") +
          (s.called ? ` · ${s.present.length} présent${s.present.length > 1 ? "s" : ""}` : ""),
        called: s.called,
        rows: await Promise.all(
          s.present.map(async (a) => {
            const p = photoById.get(a.student.id);
            return {
              name: `${a.student.lastName.toUpperCase()} ${a.student.firstName}`,
              status: ATTENDANCE_LABEL[a.status] ?? a.status,
              minutesLate: a.minutesLate,
              image: p
                ? { key: `photo:${a.student.id}`, data: new Uint8Array(p.data), mime: p.mime }
                : await avatar(a.student.sex, a.student.id),
            };
          })
        ),
      }))
    ),
  });

  const inline = url.searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="eleves-presents-${day}${sessionId ? "-seance" : ""}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
