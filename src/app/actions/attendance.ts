"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { done, forbidden } from "@/lib/flash";

const studentSchema = z.object({
  sessionId: z.string(),
  rows: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      minutesLate: z.coerce.number().int().min(0).default(0),
      note: z.string().max(300).optional(),
    })
  ),
});

function parseStudentAttendanceRows(input: unknown) {
  if (input instanceof FormData) {
    const rows = new Map<number, Record<string, string>>();
    for (const [key, value] of input.entries()) {
      const match = /^rows\[(\d+)\]\.(studentId|status|minutesLate|note)$/.exec(String(key));
      if (!match) continue;
      const index = Number(match[1]);
      const field = match[2];
      const row = rows.get(index) ?? {};
      row[field] = String(value ?? "");
      rows.set(index, row);
    }

    return [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => ({
        studentId: String(row.studentId ?? ""),
        status: (row.status as any) || "PRESENT",
        minutesLate: Number(row.minutesLate || 0),
        note: row.note || undefined,
      }));
  }

  const raw = (input as Record<string, unknown>) ?? {};
  const rows = Array.isArray(raw.rows) ? raw.rows : [];
  return rows.map((row: any) => ({
    studentId: String(row.studentId ?? ""),
    status: String(row.status ?? "PRESENT"),
    minutesLate: Number(row.minutesLate ?? 0),
    note: row.note ? String(row.note) : undefined,
  }));
}

export async function saveStudentAttendance(input: unknown) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const sessionId = input instanceof FormData ? String(input.get("sessionId") ?? "") : String((input as any)?.sessionId ?? "");
  const rows = parseStudentAttendanceRows(input);
  const { sessionId: validSessionId, rows: validRows } = studentSchema.parse({ sessionId, rows });
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: validSessionId },
    include: { teacher: true },
  });
  if (user.role === "TEACHER" && session.teacher.userId !== user.id) forbidden();

  await prisma.$transaction([
    ...validRows.map((r) =>
      prisma.studentAttendance.upsert({
        where: { sessionId_studentId: { sessionId: validSessionId, studentId: r.studentId } },
        create: { sessionId: validSessionId, ...r },
        update: { status: r.status, minutesLate: r.minutesLate, note: r.note },
      })
    ),
    prisma.session.update({ where: { id: validSessionId }, data: { status: "DONE" } }),
  ]);
  revalidatePath(`/sessions/${validSessionId}`);
  done(`/sessions/${validSessionId}`, "attendance_saved");
}

export async function saveAttendance(input: unknown) {
  return saveStudentAttendance(input);
}

const teacherSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  arrivedAt: z.string().optional(),
  leftAt: z.string().optional(),
  note: z.string().max(300).optional(),
});

export async function saveTeacherAttendance(fd: FormData) {
  await requireUser(["ADMIN", "DIRECTOR"]);
  const d = teacherSchema.parse(Object.fromEntries(fd));
  const s = await prisma.session.findUniqueOrThrow({ where: { id: d.sessionId } });
  const data = {
    status: d.status,
    arrivedAt: d.arrivedAt ? new Date(d.arrivedAt) : null,
    leftAt: d.leftAt ? new Date(d.leftAt) : null,
    note: d.note || null,
  };
  await prisma.teacherAttendance.upsert({
    where: { sessionId: d.sessionId },
    create: { sessionId: d.sessionId, teacherId: s.teacherId, ...data },
    update: data,
  });
  revalidatePath(`/sessions/${d.sessionId}`);
  done(`/sessions/${d.sessionId}`, "teacher_attendance_saved");
}
