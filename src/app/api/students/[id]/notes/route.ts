import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildNotesPdf } from "@/lib/notes-pdf";

export const dynamic = "force-dynamic";

/** Relevé de notes par matière (PDF A4). ?inline=1 pour affichage navigateur. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const u = await getSession();
  if (!u) return new Response("Non authentifié", { status: 401 });

  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: { classe: { include: { schoolYear: true } } },
  });
  if (!s) return new Response("Élève introuvable", { status: 404 });
  if (u.role === "STUDENT" && s.userId !== u.id) return new Response("Accès refusé", { status: 403 });

  const grades = await prisma.grade.findMany({
    where: { studentId: s.id, score: { not: null } },
    orderBy: [{ assessment: { date: "desc" } }],
    include: {
      assessment: {
        include: {
          course: { include: { subject: true } },
          term: true,
        },
      },
    },
  });

  const bySubject = new Map<
    string,
    {
      name: string;
      entries: {
        title: string;
        term: string;
        date: Date;
        score: number;
        maxScore: number;
        coefficient: number;
      }[];
    }
  >();

  for (const g of grades) {
    const key = g.assessment.course.subjectId;
    const subject = bySubject.get(key) ?? {
      name: g.assessment.course.subject.name,
      entries: [],
    };
    subject.entries.push({
      title: g.assessment.title,
      term: g.assessment.term?.name ?? "—",
      date: g.assessment.date,
      score: g.score ?? 0,
      maxScore: g.assessment.maxScore,
      coefficient: g.assessment.coefficient,
    });
    bySubject.set(key, subject);
  }

  const subjects = [...bySubject.values()].map((subject) => {
    const total = subject.entries.reduce((sum, e) => sum + (e.score / e.maxScore) * 20, 0);
    const avg = subject.entries.length ? +(total / subject.entries.length).toFixed(2) : null;
    return { ...subject, avg };
  });

  const bytes = await buildNotesPdf({
    matricule: s.matricule,
    firstName: s.firstName,
    lastName: s.lastName,
    classeName: s.classe.name,
    year: s.classe.schoolYear.name,
    subjects,
  });

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="notes-${s.matricule}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
