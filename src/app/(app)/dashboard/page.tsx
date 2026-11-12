import Link from "next/link";
import Icon from "@/components/Icons";
import { prisma } from "@/lib/prisma";
import { requireUser, isStaff } from "@/lib/session";
import { weekRange } from "@/lib/dates";
import { DEFAULT_PASSWORDS } from "@/lib/default-passwords";
import { paginate } from "@/lib/paginate";
import TableFooter from "@/components/TableFooter";

export default async function Dashboard({ searchParams: searchParamsP }: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await searchParamsP;
  const u = await requireUser();
  const staff = isStaff(u.role);
  const { start, end } = weekRange();

  // Réclamations non clôturées : toutes pour le personnel, uniquement les siennes sinon
  const reclWhere = {
    status: { not: "CLOSED" },
    ...(staff ? {} : { authorId: u.id }),
  };

  // Toutes les requêtes partent en même temps (avant : 4 étapes l'une après l'autre = 4 allers-retours à la base)
  const [notifs, announcements, reclTotal, reclamations, counts, perClass] = await Promise.all([
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
    prisma.reclamation.count({ where: reclWhere }),
    prisma.reclamation.findMany({
      where: reclWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    staff
      ? Promise.all([
          prisma.student.count(),
          prisma.classe.count(),
          prisma.subject.count(),
          prisma.user.count({ where: { role: "TEACHER" } }),
          prisma.session.count({ where: { startsAt: { gte: start, lt: end } } }),
          prisma.studentAttendance.count({
            where: { status: "ABSENT", session: { startsAt: { gte: start, lt: end } } },
          }),
          prisma.assessment.count(),
        ])
      : Promise.resolve([0, 0, 0, 0, 0, 0, 0]),
    staff
      ? prisma.classe.findMany({
          select: { id: true, name: true, schoolYear: { select: { name: true } }, _count: { select: { students: true } } },
          orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);
  const [nStudents, nClasses, nSubjects, nTeachers, nSessions, nAbsences, nAssessments] = counts;

  const stats = staff
    ? [
        { label: "Élèves inscrits", icon: "graduation" as const, value: nStudents, href: "/students" },
        { label: "Classes", icon: "school" as const, value: nClasses, href: "/classes" },
        { label: "Matières", icon: "book" as const, value: nSubjects, href: "/subjects" },
        {
          label: "Enseignants",
          icon: "presentation" as const,
          value: nTeachers,
          href: "/teachers",
        },
        {
          label: "Séances de la semaine",
          icon: "calendarCheck" as const,
          value: nSessions,
          href: "/sessions",
        },
        {
          label: "Absences d'élèves (semaine)",
          icon: "alert" as const,
          value: nAbsences,
          href: "/sessions",
        },
        { label: "Évaluations", icon: "clipboard" as const, value: nAssessments, href: "/assessments" },
        { label: "Réclamations en attente", icon: "alert" as const, value: reclTotal, href: "/reclamations" },
      ]
    : null;

  const perClassPage = paginate(perClass, searchParams.page);

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

      {/* Réclamations non clôturées — affichées seulement s'il y en a */}
      {reclamations.length > 0 && (
        <>
          <div style={{ margin: "24px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>
              Réclamations{" "}
              <span className="tag tag-success" style={{ verticalAlign: "middle" }}>
                {reclTotal}
              </span>
            </h2>
            <Link href="/reclamations" className="btn-ghost btn-sm">
              Toutes les réclamations
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {reclamations.map((r) => (
            <Link
              key={r.id}
              href="/reclamations"
              className="card"
              style={{ display: "block", color: "inherit", textDecoration: "none", borderLeft: "4px solid #f59e0b" }}
            >
              <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 4 }}>
                {r.authorId === u.id ? "Vous" : r.author.name} · {r.createdAt.toLocaleString("fr-FR")} ·{" "}
                {r.status === "IN_PROGRESS" ? "En cours" : "Ouverte"}
              </div>
              <strong>{r.subject}</strong>
              <div style={{ marginTop: 6, fontSize: "0.92rem" }}>
                {r.body.slice(0, 160)}
                {r.body.length > 160 ? "…" : ""}
              </div>
              {r.response && (
                <div style={{ marginTop: 6, fontSize: "0.88rem" }} className="muted">
                  Réponse : {r.response.slice(0, 120)}
                  {r.response.length > 120 ? "…" : ""}
                </div>
              )}
            </Link>
          ))}
        </>
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
              connexion.
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
                {perClassPage.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td className="muted">{c.schoolYear.name}</td>
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
          <TableFooter
            path="/dashboard"
            page={perClassPage.page}
            totalPages={perClassPage.totalPages}
            total={perClassPage.total}
            pdf={{
              title: "Effectif par classe",
              subtitle: `${perClass.length} classe${perClass.length > 1 ? "s" : ""}`,
              headers: ["Classe", "Année scolaire", "Élèves"],
              rows: perClass.map((c) => [c.name, c.schoolYear.name, String(c._count.students)]),
            }}
          />
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
