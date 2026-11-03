import { prisma } from "./prisma";
import { weekRange, weekKey } from "./dates";

// Seuils d'alerte modifiables
export const THRESHOLDS = {
  STUDENT_LATE_PER_WEEK: 3,
  STUDENT_ABSENT_RATE_30D: 0.2, // 20 %
  STUDENT_MIN_SESSIONS_30D: 10, // pas de taux calculé en dessous de 10 séances
  TEACHER_LATE_PER_WEEK: 3,
  TEACHER_ABSENT_PER_30D: 3,
};

async function adminIds() {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "DIRECTOR"] }, active: true },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

async function notify(
  userIds: string[],
  n: { type: string; title: string; body: string; key: string; data?: object }
) {
  if (!userIds.length) return;
  // skipDuplicates + dedupeKey unique => idempotent (la tâche planifiée peut s'exécuter plusieurs fois sans doublons)
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      dedupeKey: `${n.key}:${userId}`,
    })),
    skipDuplicates: true,
  });
}

export async function runStudentAlerts(now = new Date()) {
  const admins = await adminIds();
  const { start, end } = weekRange(now);
  const wk = weekKey(now);

  // 1) Retards répétés au cours de la semaine
  const lateGroups = await prisma.studentAttendance.groupBy({
    by: ["studentId"],
    where: { status: "LATE", session: { startsAt: { gte: start, lt: end } } },
    _count: { _all: true },
    having: { studentId: { _count: { gte: THRESHOLDS.STUDENT_LATE_PER_WEEK } } },
  });

  for (const g of lateGroups) {
    const st = await prisma.student.findUnique({ where: { id: g.studentId }, include: { user: true } });
    if (!st) continue;
    await notify([...admins, st.userId], {
      type: "STUDENT_LATE_WEEK",
      title: "Retards fréquents",
      body: `${st.user.name} a accumulé ${g._count._all} retard(s) cette semaine.`,
      key: `STU_LATE:${st.id}:${wk}`,
      data: { studentId: st.id, count: g._count._all },
    });
  }

  // 2) Absences fréquentes (30 derniers jours)
  const since = new Date(now.getTime() - 30 * 86400_000);
  const rows = await prisma.studentAttendance.groupBy({
    by: ["studentId", "status"],
    where: { session: { startsAt: { gte: since, lte: now } } },
    _count: { _all: true },
  });

  const agg = new Map<string, { total: number; absent: number }>();
  for (const r of rows) {
    const a = agg.get(r.studentId) ?? { total: 0, absent: 0 };
    a.total += r._count._all;
    if (r.status === "ABSENT") a.absent += r._count._all;
    agg.set(r.studentId, a);
  }

  for (const [studentId, a] of agg) {
    if (a.total < THRESHOLDS.STUDENT_MIN_SESSIONS_30D) continue;
    const rate = a.absent / a.total;
    if (rate < THRESHOLDS.STUDENT_ABSENT_RATE_30D) continue;
    const st = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!st) continue;
    await notify([...admins, st.userId], {
      type: "STUDENT_ABSENT_RATE",
      title: "Absences fréquentes",
      body: `${st.user.name} : ${a.absent} séance(s) manquée(s) sur ${a.total} (${Math.round(rate * 100)} %) au cours des 30 derniers jours.`,
      key: `STU_ABS:${studentId}:${wk}`,
      data: { studentId, rate },
    });
  }
}

export async function runTeacherAlerts(now = new Date()) {
  const admins = await adminIds();
  const { start, end } = weekRange(now);
  const wk = weekKey(now);

  const late = await prisma.teacherAttendance.groupBy({
    by: ["teacherId"],
    where: { status: "LATE", session: { startsAt: { gte: start, lt: end } } },
    _count: { _all: true },
    having: { teacherId: { _count: { gte: THRESHOLDS.TEACHER_LATE_PER_WEEK } } },
  });

  const since = new Date(now.getTime() - 30 * 86400_000);
  const absent = await prisma.teacherAttendance.groupBy({
    by: ["teacherId"],
    where: { status: "ABSENT", session: { startsAt: { gte: since, lte: now } } },
    _count: { _all: true },
    having: { teacherId: { _count: { gte: THRESHOLDS.TEACHER_ABSENT_PER_30D } } },
  });

  for (const g of late) {
    const t = await prisma.teacher.findUnique({ where: { id: g.teacherId }, include: { user: true } });
    if (!t) continue;
    await notify([...admins, t.userId], {
      type: "TEACHER_LATE_WEEK",
      title: "Enseignant souvent en retard",
      body: `${t.user.name} a accumulé ${g._count._all} retard(s) cette semaine.`,
      key: `TCH_LATE:${t.id}:${wk}`,
    });
  }
  for (const g of absent) {
    const t = await prisma.teacher.findUnique({ where: { id: g.teacherId }, include: { user: true } });
    if (!t) continue;
    await notify([...admins, t.userId], {
      type: "TEACHER_ABSENT",
      title: "Enseignant souvent absent",
      body: `${t.user.name} a été absent ${g._count._all} fois au cours des 30 derniers jours.`,
      key: `TCH_ABS:${t.id}:${wk}`,
    });
  }
}
