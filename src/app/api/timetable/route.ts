import { getSession } from "@/lib/session";
import { getTimetable } from "@/lib/timetable-data";
import { buildTimetablePdf } from "@/lib/timetable-pdf";

export const dynamic = "force-dynamic";

/** Emploi du temps hebdomadaire (PDF A4 paysage). ?vue=c:<classeId> | t:<teacherId> ; ?inline=1 pour l'afficher dans le navigateur. */
export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const url = new URL(req.url);
  const { byClass, title, slots } = await getTimetable(u, url.searchParams.get("vue"));
  if (!title) return new Response("Emploi du temps introuvable", { status: 404 });

  const bytes = await buildTimetablePdf({
    title: byClass ? `Classe : ${title}` : `Enseignant : ${title}`,
    slots: slots.map((s) => ({
      day: s.dayOfWeek,
      start: s.startTime,
      end: s.endTime,
      subject: s.course.subject.name,
      other: byClass ? s.course.teacher.user.name : s.course.classe.name,
      room: s.room,
    })),
  });

  const inline = url.searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="emploi-du-temps.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
