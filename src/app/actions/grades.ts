"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const saveSchema = z.object({
  assessmentId: z.string(),
  grades: z.array(z.object({ studentId: z.string(), score: z.number().min(0).nullable() })),
});

export async function saveGrades(input: unknown) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const { assessmentId, grades } = saveSchema.parse(input);
  const a = await prisma.assessment.findUniqueOrThrow({
    where: { id: assessmentId },
    include: { course: { include: { teacher: true } } },
  });
  if (user.role === "TEACHER" && a.course.teacher.userId !== user.id) throw new Error("Forbidden");
  if (grades.some((g) => g.score !== null && g.score > a.maxScore))
    throw new Error(`Noty mihoatra ny ${a.maxScore}`);

  await prisma.$transaction(
    grades.map((g) =>
      prisma.grade.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId: g.studentId } },
        create: { assessmentId, ...g },
        update: { score: g.score },
      })
    )
  );
  revalidatePath(`/assessments/${assessmentId}`);
}

const createSchema = z.object({
  courseId: z.string(),
  termId: z.string(),
  title: z.string().min(1).max(120),
  type: z.enum(["HOMEWORK", "TEST", "EXAM"]),
  maxScore: z.coerce.number().positive().default(20),
  coefficient: z.coerce.number().positive().default(1),
  date: z.coerce.date(),
});

export async function createAssessment(fd: FormData) {
  const user = await requireUser(["TEACHER", "ADMIN", "DIRECTOR"]);
  const d = createSchema.parse(Object.fromEntries(fd));
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: d.courseId },
    include: { teacher: true },
  });
  if (user.role === "TEACHER" && course.teacher.userId !== user.id) throw new Error("Forbidden");
  const a = await prisma.assessment.create({ data: d });
  redirect(`/assessments/${a.id}`);
}
