import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtDate } from "@/lib/format";

export default async function Assessments() {
  const u = await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const list = await prisma.assessment.findMany({
    where: u.role === "TEACHER" ? { course: { teacher: { userId: u.id } } } : {},
    orderBy: { date: "desc" }, take: 60,
    include: { course: { include: { classe: true, subject: true } }, term: true },
  });
  return (
    <>
      <h1>Évaluations / Noty</h1>
      <p><Link href="/assessments/new">+ Évaluation vaovao</Link></p>
      <table>
        <thead><tr><th>Daty</th><th>Titre</th><th>Classe</th><th>Matière</th><th>Période</th><th>Coef</th><th></th></tr></thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id}>
              <td>{fmtDate(a.date)}</td><td>{a.title}</td><td>{a.course.classe.name}</td>
              <td>{a.course.subject.name}</td><td>{a.term.name}</td><td>{a.coefficient}</td>
              <td><Link href={`/assessments/${a.id}`}>Ampidiro ny noty</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
