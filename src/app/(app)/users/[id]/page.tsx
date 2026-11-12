import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/labels";
import { userImageUrl } from "@/lib/avatar";

export default async function UserDetailPage({ params: paramsP }: { params: Promise<{ id: string }> }) {
  const params = await paramsP;
  const me = await requireUser(["ADMIN", "DIRECTOR", "MANAGER"]);
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      student: { select: { id: true, matricule: true, sex: true, photoUrl: true, phone: true } },
      teacher: { select: { id: true } },
    },
  });
  if (!user) notFound();

  // Seul ADMIN voit les ADMIN (comme la page de modification)
  if (user.role === "ADMIN" && me.role !== "ADMIN") notFound();

  const phone = user.student ? user.student.phone : user.phone;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Détail de l&apos;utilisateur</h1>
          <p>
            {user.name} · {ROLE_LABEL[user.role] ?? user.role}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/users/${user.id}/edit`} className="btn">
            <Icon name="pencil" size={16} />
            Modifier
          </Link>
          <Link href="/users" className="btn-secondary btn">
            ← Retour à la liste
          </Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="row" style={{ marginBottom: 20, gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userImageUrl(user)}
            alt=""
            className="thumb"
            style={{ width: 72, height: 72 }}
          />
          <div>
            <strong style={{ fontSize: "1.1rem" }}>{user.name}</strong>
            <div style={{ marginTop: 4 }}>
              {user.active ? (
                <span className="tag tag-success">Actif</span>
              ) : (
                <span className="tag tag-muted">Inactif</span>
              )}
            </div>
          </div>
        </div>

        <div className="fiche-grid">
          <div className="fiche-field">
            <label>Adresse e-mail</label>
            <div>{user.email}</div>
          </div>
          <div className="fiche-field">
            <label>Téléphone</label>
            <div>{phone || "—"}</div>
          </div>
          <div className="fiche-field">
            <label>Rôle</label>
            <div>{ROLE_LABEL[user.role] ?? user.role}</div>
          </div>
          <div className="fiche-field">
            <label>Lien</label>
            <div>
              {user.student ? (
                <Link href={`/students/${user.student.id}`}>Élève {user.student.matricule}</Link>
              ) : user.teacher ? (
                <Link href={`/teachers/${user.teacher.id}`}>Fiche enseignant</Link>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
