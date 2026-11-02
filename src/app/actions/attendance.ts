"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const studentSchema = z.object({
  sessionId: z.string(),
  rows: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      minutesLate: z.number().int().min(0).default(0),
      note: z.string().max(300).optional(),
    })
  ),
});

export async function saveStudentAttendance(input: unknown) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const { sessionId, rows } = studentSchema.parse(input);
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { teacher: true },
  });
  if (user.role === "TEACHER" && session.teacher.userId !== user.id) throw new Error("Forbidden");

  await prisma.$transaction([
    ...rows.map((r) =>
      prisma.studentAttendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        create: { sessionId, ...r },
        update: { status: r.status, minutesLate: r.minutesLate, note: r.note },
      })
    ),
    prisma.session.update({ where: { id: sessionId }, data: { status: "DONE" } }),
  ]);
  revalidatePath(`/sessions/${sessionId}`);
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
}
