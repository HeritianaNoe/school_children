import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function Students() {
  await requireUser(["ADMIN", "DIRECTOR", "TEACHER"]);
  const list = await prisma.student.findMany({
    include: { user: true, classe: true },
    orderBy: [{ classe: { name: "asc" } }, { user: { name: "asc" } }],
  });
  return (
    <>
      <h1>Mpianatra</h1>
      <table>
        <thead><tr><th>Matricule</th><th>Anarana</th><th>Classe</th><th></th></tr></thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id}><td>{s.matricule}</td><td>{s.user.name}</td><td>{s.classe.name}</td>
              <td><Link href={`/students/${s.id}`}>Fiche</Link></td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
