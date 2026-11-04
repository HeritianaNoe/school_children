"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, fail } from "@/lib/flash";
import { mondayOf, isoDay, slotDate } from "@/lib/timetable";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z.object({
  courseId: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(1).max(6),
  startTime: z.string().regex(TIME),
  endTime: z.string().regex(TIME),
  room: z.string().trim().max(40).optional(),
});

/** Le retour ne peut viser que l'emploi du temps (évite les redirections ouvertes). */
const backPath = (fd: FormData) => {
  const b = String(fd.get("back") ?? "");
  return b.startsWith("/timetable") ? b : "/timetable";
};

async function parse(fd: FormData, back: string) {
  const p = slotSchema.safeParse({
    courseId: fd.get("courseId"),
    dayOfWeek: fd.get("dayOfWeek"),
    startTime: fd.get("startTime"),
    endTime: fd.get("endTime"),
    room: fd.get("room") || undefined,
  });
  if (!p.success) fail(back, "validation");
  if (p.data.endTime <= p.data.startTime) fail(back, "slot_times");
  return p.data;
}

/** Vérifie qu'aucun autre créneau de la même classe ou du même enseignant ne se chevauche. */
async function checkConflicts(
  d: { courseId: string; dayOfWeek: number; startTime: string; endTime: string },
  back: string,
  ignoreId?: string
) {
  const course = await prisma.course.findUnique({ where: { id: d.courseId } });
  if (!course) fail(back, "not_found");
  const overlap = {
    dayOfWeek: d.dayOfWeek,
    startTime: { lt: d.endTime },
    endTime: { gt: d.startTime },
    ...(ignoreId ? { id: { not: ignoreId } } : {}),
  };
  if (await prisma.timetableSlot.count({ where: { ...overlap, course: { classeId: course.classeId } } }))
    fail(back, "slot_class_busy");
  if (await prisma.timetableSlot.count({ where: { ...overlap, course: { teacherId: course.teacherId } } }))
    fail(back, "slot_teacher_busy");
}

export async function createSlot(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const back = backPath(fd);
  const d = await parse(fd, back);
  await checkConflicts(d, back);
  await prisma.timetableSlot.create({ data: { ...d, room: d.room || null } });
  revalidatePath("/timetable");
  done(back, "slot_created");
}

export async function updateSlot(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const back = backPath(fd);
  const id = String(fd.get("id") ?? "");
  const d = await parse(fd, back);
  await checkConflicts(d, back, id);
  await prisma.timetableSlot.update({ where: { id }, data: { ...d, room: d.room || null } });
  revalidatePath("/timetable");
  done(back, "slot_updated");
}

export async function deleteSlot(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const back = backPath(fd);
  await prisma.timetableSlot.delete({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/timetable");
  done(back, "slot_deleted");
}

/**
 * Crée les séances (appel des élèves / présence des enseignants) de la semaine à partir des créneaux de la vue affichée.
 * Une séance déjà existante (même cours, même heure de début) n'est jamais dupliquée.
 */
export async function generateSessions(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const vue = String(fd.get("vue") ?? "");
  const [kind, id] = vue.split(":");
  const monday = mondayOf(String(fd.get("semaine") ?? ""));
  const back = `/timetable?vue=${encodeURIComponent(vue)}&semaine=${isoDay(monday)}`;
  if (!id || (kind !== "c" && kind !== "t")) fail(back, "validation");

  const slots = await prisma.timetableSlot.findMany({
    where: { course: kind === "c" ? { classeId: id } : { teacherId: id } },
    include: { course: true },
  });
  const rows = slots.map((s) => ({
    courseId: s.courseId,
    teacherId: s.course.teacherId,
    startsAt: slotDate(monday, s.dayOfWeek, s.startTime),
    endsAt: slotDate(monday, s.dayOfWeek, s.endTime),
  }));
  const existing = await prisma.session.findMany({
    where: { courseId: { in: rows.map((r) => r.courseId) }, startsAt: { in: rows.map((r) => r.startsAt) } },
    select: { courseId: true, startsAt: true },
  });
  const key = (c: string, d: Date) => `${c}|${d.getTime()}`;
  const have = new Set(existing.map((e) => key(e.courseId, e.startsAt)));
  const toCreate = rows.filter((r) => !have.has(key(r.courseId, r.startsAt)));
  if (toCreate.length) await prisma.session.createMany({ data: toCreate });

  revalidatePath("/sessions");
  revalidatePath("/timetable");
  done(back, "sessions_generated");
}
