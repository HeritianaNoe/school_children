import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { weekRange } from "@/lib/dates";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";

export default async function Dashboard() {
  const u = await requireUser();
  const staff = isStaff(u.role);
  const { start, end } = weekRange();

  const [notifs, announcements] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const stats = staff
    ? [
        { label: "Élèves inscrits", icon: "graduation" as const, value: await prisma.student.count(), href: "/students" },
        { label: "Classes", icon: "school" as const, value: await prisma.classe.count(), href: "/classes" },
        { label: "Matières", icon: "book" as const, value: await prisma.subject.count(), href: "/subjects" },
        {
          label: "Enseignants",
          icon: "presentation" as const,
          value: await prisma.user.count({ where: { role: "TEACHER" } }),
          href: "/teachers",
        },
        {
          label: "Séances de la semaine",
          icon: "calendarCheck" as const,
          value: await prisma.session.count({ where: { startsAt: { gte: start, lt: end } } }),
          href: "/sessions",
        },
        {
          label: "Absences d'élèves (semaine)",
          icon: "alert" as const,
          value: await prisma.studentAttendance.count({
            where: { status: "ABSENT", session: { startsAt: { gte: start, lt: end } } },
          }),
          href: "/sessions",
        },
        { label: "Évaluations", icon: "clipboard" as const, value: await prisma.assessment.count(), href: "/assessments" },
      ]
    : null;

  const perClass = staff
    ? await prisma.classe.findMany({
        include: { _count: { select: { students: true } } },
        orderBy: [{ year: "desc" }, { name: "asc" }],
      })
    : [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Bonjour, {u.name}</h1>
          <p>Tableau de bord de l&apos;établissement</p>
        </div>
        {staff && (
          <Link href="/students/new" className="btn">
            <Icon name="plus" size={16} />
            Inscrire un élève
          </Link>
        )}
      </div>

      {stats && (
        <div className="grid">
          {stats.map((s) => (
            <Link href={s.href} key={s.label} className="stat-card" style={{ color: "inherit", textDecoration: "none" }}>
              <span className="stat-icon">
                <Icon name={s.icon} size={22} />
              </span>
              <div className="stat-body">
                <div className="label">{s.label}</div>
                <div className="value">{s.value}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Annonces publiées — liens vers /announcements */}
      <div style={{ margin: "24px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Annonces</h2>
        <Link href="/announcements" className="btn-ghost btn-sm">
          Toutes les annonces
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>
      {announcements.length === 0 ? (
        <p className="muted">Aucune annonce publiée pour le moment.</p>
      ) : (
        announcements.map((a) => (
          <Link
            key={a.id}
            href="/announcements"
            className="card"
            style={{ display: "block", color: "inherit", textDecoration: "none", borderLeft: "4px solid var(--primary)" }}
          >
            <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 4 }}>
              {a.author.name} · {a.createdAt.toLocaleString("fr-FR")}
            </div>
            <strong>{a.title}</strong>
            <div style={{ marginTop: 6, fontSize: "0.92rem" }}>
              {a.body.slice(0, 160)}
              {a.body.length > 160 ? "…" : ""}
            </div>
          </Link>
        ))
      )}

      <div className="card" style={{ borderLeft: "4px solid #f59e0b", margin: "20px 0" }}>
        <strong>Mot de passe initial</strong>
        {staff ? (
          <>
            <p style={{ margin: "8px 0 12px" }}>
              Les comptes créés utilisent un mot de passe initial. Invitez chaque utilisateur à le modifier dès sa première
              connexion (menu « Mon compte »).
            </p>
            <div className="row" style={{ gap: 20 }}>
              <div>
                <strong>Élèves :</strong> <code>{DEFAULT_PASSWORDS.STUDENT}</code>
              </div>
              <div>
                <strong>Enseignants / administration :</strong> <code>{DEFAULT_PASSWORDS.STAFF}</code>
              </div>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: "8px 0 12px" }}>
              Si vous utilisez encore le mot de passe initial communiqué par l&apos;établissement, modifiez-le dès maintenant
              pour sécuriser votre compte.
            </p>
            <Link href="/account" className="btn-ghost btn-sm">
              Changer mon mot de passe
              <Icon name="arrowRight" size={14} />
            </Link>
          </>
        )}
      </div>

      {staff && perClass.length > 0 && (
        <>
          <h2>Effectif par classe</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Année scolaire</th>
                  <th>Élèves</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {perClass.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td className="muted">{c.year}</td>
                    <td>{c._count.students}</td>
                    <td>
                      <Link href={`/classes/${c.id}`} className="btn-ghost btn-sm" title="Gérer">
                        <Icon name="eye" size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Notifications récentes</h2>
      {notifs.length === 0 && <p className="muted">Aucune notification.</p>}
      {notifs.map((n) => (
        <div key={n.id} className={`card ${n.readAt ? "" : "unread"}`}>
          <strong>{n.title}</strong>
          <div style={{ marginTop: 4 }}>{n.body}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: "0.8rem" }}>
            {n.createdAt.toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <Link href="/notifications" className="btn-ghost btn-sm">
          Voir toutes les notifications
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </>
  );
}
