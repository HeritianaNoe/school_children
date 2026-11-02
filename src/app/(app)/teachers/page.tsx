import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtAr } from "@/lib/format";

export default async function TeachersPage() {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const list = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Enseignants</h1>
          <p>{list.length} enseignant{list.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Taux horaire</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>{t.user.name}</td>
                <td className="muted">{t.user.email}</td>
                <td>{fmtAr(Number(t.hourlyRate))}</td>
                <td>
                  <Link href={`/teachers/${t.id}`} className="btn-ghost btn-sm">
                    Fiche
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
