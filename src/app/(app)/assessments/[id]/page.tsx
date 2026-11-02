import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import GradesForm from "@/components/GradesForm";

export default async function AssessmentPage({ params }: { params: { id: string } }) {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const a = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      course: { include: { subject: true, teacher: true, classe: { include: { students: { include: { user: true }, orderBy: { user: { name: "asc" } } } } } } },
      grades: true,
    },
  });
  if (!a) notFound();
  if (u.role === "TEACHER" && a.course.teacher.userId !== u.id) throw new Error("Forbidden");

  const g = new Map(a.grades.map((x) => [x.studentId, x.score]));
  const initial = a.course.classe.students.map((s) => ({
    studentId: s.id, name: s.user.name, score: g.get(s.id) == null ? "" : String(g.get(s.id)),
  }));
  return (
    <>
      <h1>{a.title}</h1>
      <p className="muted">{a.course.classe.name} · {a.course.subject.name} · coef {a.coefficient}</p>
      <GradesForm assessmentId={a.id} maxScore={a.maxScore} initial={initial} />
    </>
  );
}
