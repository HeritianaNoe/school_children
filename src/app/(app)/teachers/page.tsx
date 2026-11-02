import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtAr } from "@/lib/format";

export default async function Teachers() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const list = await prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } });
  return (
    <>
      <h1>Mpampianatra</h1>
      <table>
        <thead><tr><th>Anarana</th><th>Taux / ora</th><th></th></tr></thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id}><td>{t.user.name}</td><td>{fmtAr(Number(t.hourlyRate))}</td>
              <td><Link href={`/teachers/${t.id}`}>Fiche</Link></td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
