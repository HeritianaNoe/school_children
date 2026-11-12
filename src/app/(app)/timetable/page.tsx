import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DAYS, isoDay, mondayOf, slotDate } from "@/lib/timetable";
import { getTimetable } from "@/lib/timetable-data";
import { fmtDateFull } from "@/lib/format";
import { createSlot, deleteSlot, generateSessions } from "@/app/actions/timetable";
import Icon from "@/components/Icons";
import PdfLink from "@/components/PdfLink";
import ConfirmButton from "@/components/ConfirmButton";
import SlotForm from "@/components/SlotForm";

export default async function TimetablePage({ searchParams: searchParamsP }: { searchParams: Promise<{ vue?: string; semaine?: string }> }) {
  const searchParams = await searchParamsP;
  const u = await requireUser();
  const canManage = u.role === "ADMIN" || u.role === "DIRECTOR";
  const isStudent = u.role === "STUDENT";
  const isTeacher = u.role === "TEACHER";
  const canFilter = !isStudent && !isTeacher; // élève et enseignant : pas de filtre, uniquement leur emploi du temps

  const [classes, teachers] = !canFilter
    ? [[], []]
    : await Promise.all([
        prisma.classe.findMany({ include: { schoolYear: true }, orderBy: [{ schoolYear: { startDate: "desc" } }, { name: "asc" }] }),
        prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
      ]);

  const { vue, byClass, targetId, title, slots } = await getTimetable(u, searchParams.vue);
  const monday = mondayOf(searchParams.semaine);
  const semaine = isoDay(monday);

  // Séances déjà créées pour la semaine affichée : lien direct vers l'appel / la présence
  const sessions =
    !isStudent && slots.length
      ? await prisma.session.findMany({
          where: {
            courseId: { in: [...new Set(slots.map((s) => s.courseId))] },
            startsAt: { in: slots.map((s) => slotDate(monday, s.dayOfWeek, s.startTime)) },
          },
          select: { id: true, courseId: true, startsAt: true, teacher: { select: { userId: true } } },
        })
      : [];
  const sessionFor = (s: (typeof slots)[number]) => {
    const t = slotDate(monday, s.dayOfWeek, s.startTime).getTime();
    return sessions.find((x) => x.courseId === s.courseId && x.startsAt.getTime() === t);
  };

  const courseOptions =
    canManage && targetId
      ? (
          await prisma.course.findMany({
            where: byClass ? { classeId: targetId } : { teacherId: targetId },
            include: { subject: true, classe: true, teacher: { include: { user: true } } },
            orderBy: [{ classe: { name: "asc" } }, { subject: { name: "asc" } }],
          })
        ).map((c) => ({ id: c.id, label: `${c.classe.name} — ${c.subject.name} (${c.teacher.user.name})` }))
      : [];

  const shownTitle = title ?? (isStudent ? "Ma classe" : undefined);
  const back = `/timetable?vue=${encodeURIComponent(vue)}&semaine=${semaine}`;
  const weekEnd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Emploi du temps</h1>
          <p>{shownTitle ? `Programme hebdomadaire · ${shownTitle}` : "Programme hebdomadaire"}</p>
        </div>
        {!isStudent && (
          <Link href="/sessions" className="btn-secondary btn no-print">
            <Icon name="calendarCheck" size={16} />
            Séances et présences
          </Link>
        )}
      </div>

      {canFilter && (
        <form method="get" className="filters no-print">
          <label>
            Afficher
            <select name="vue" defaultValue={vue}>
              <optgroup label="Classes">
                {classes.map((c) => (
                  <option key={c.id} value={`c:${c.id}`}>
                    {c.name} ({c.schoolYear.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Enseignants">
                {teachers.map((t) => (
                  <option key={t.id} value={`t:${t.id}`}>
                    {t.user.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label>
            Semaine du
            <input type="date" name="semaine" defaultValue={semaine} />
          </label>
          <button type="submit">Afficher</button>
        </form>
      )}
      {!isStudent && (
        <p className="muted" style={{ marginTop: 0 }}>
          Semaine du {fmtDateFull(monday)} au {fmtDateFull(weekEnd)}
        </p>
      )}

      {canManage && targetId && (
        <div className="no-print">
          <h3>Ajouter un créneau</h3>
          {courseOptions.length === 0 ? (
            <p className="muted">Aucune matière n&apos;est rattachée à cette sélection : ajoutez-en depuis « Classes ».</p>
          ) : (
            <SlotForm action={createSlot} courses={courseOptions} back={back} submitLabel="Ajouter" />
          )}
        </div>
      )}

      {slots.length === 0 ? (
        <div className="card muted">Aucun créneau enregistré pour le moment.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          {DAYS.map((d) => {
            const list = slots.filter((s) => s.dayOfWeek === d.n);
            return (
              <div className="card" key={d.n} style={{ padding: 12 }}>
                <h3 style={{ margin: "0 0 10px" }}>{d.label}</h3>
                {list.length === 0 && <span className="muted">—</span>}
                <div className="stack" style={{ gap: 8 }}>
                  {list.map((s) => {
                    const ses = sessionFor(s);
                    const canOpen = !!ses && (u.role !== "TEACHER" || ses.teacher.userId === u.id);
                    return (
                      <div key={s.id} style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 8 }}>
                        <strong>
                          {s.startTime} – {s.endTime}
                        </strong>
                        <div>{s.course.subject.name}</div>
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {byClass ? s.course.teacher.user.name : s.course.classe.name}
                          {s.room ? ` · ${s.room}` : ""}
                        </div>
                        {canOpen && (
                          <Link href={`/sessions/${ses!.id}`} className="no-print" style={{ fontSize: "0.85rem" }}>
                            Appel / présence →
                          </Link>
                        )}
                        {canManage && (
                          <div className="row no-print" style={{ marginTop: 4 }}>
                            <Link
                              href={`/timetable/${s.id}/edit?vue=${encodeURIComponent(vue)}&semaine=${semaine}`}
                              className="btn-ghost btn-sm"
                              title="Modifier"
                              aria-label="Modifier"
                            >
                              <Icon name="pencil" size={16} />
                            </Link>
                            <form action={deleteSlot}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="back" value={back} />
                              <ConfirmButton
                                message={`Supprimer le créneau ${s.course.subject.name} (${s.startTime}–${s.endTime}) ?`}
                                className="btn-ghost btn-sm"
                                title="Supprimer"
                              >
                                <Icon name="trash" size={16} />
                              </ConfirmButton>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManage && slots.length > 0 && (
        <form action={generateSessions} className="card no-print" style={{ marginTop: 16 }}>
          <input type="hidden" name="vue" value={vue} />
          <input type="hidden" name="semaine" value={semaine} />
          <strong>Générer les séances de cette semaine</strong>
          <p className="muted" style={{ margin: "6px 0 12px" }}>
            Crée dans « Séances et présences » une séance par créneau (semaine du {fmtDateFull(monday)}), pour que l&apos;appel
            des élèves et la présence des enseignants puissent être saisis. Les séances déjà créées ne sont pas dupliquées.
          </p>
          <button type="submit" className="btn-secondary btn">
            Générer les séances
          </button>
        </form>
      )}

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
        <PdfLink href={`/api/timetable?vue=${encodeURIComponent(vue)}`} />
      </div>
    </>
  );
}
