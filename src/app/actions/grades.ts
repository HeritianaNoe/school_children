"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { STUDENT_ALERTS_TAG } from "@/lib/student-alerts";
import { prisma } from "@/lib/prisma";
import { requireUser, type SessionUser } from "@/lib/session";
import { parseDateInput } from "@/lib/format";
import { done, fail, forbidden } from "@/lib/flash";
import { ASSESSMENT_TYPE_LABEL } from "@/lib/labels";

const ROLES = ["TEACHER", "ADMIN", "DIRECTOR"] as const;

/** Un enseignant ne peut agir que sur ses propres cours ; l'administration sur tous. */
async function assertCourseAccess(user: SessionUser, courseId: string) {
  if (user.role !== "TEACHER") return;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: true },
  });
  if (!course || course.teacher.userId !== user.id) forbidden();
}

// ───────── Saisie des notes ─────────
function parseGrades(fd: FormData) {
  const rows = new Map<number, { studentId?: string; score?: string }>();
  for (const [key, value] of fd.entries()) {
    const m = /^rows\[(\d+)\]\.(studentId|score)$/.exec(key);
    if (!m) continue;
    const row = rows.get(Number(m[1])) ?? {};
    row[m[2] as "studentId" | "score"] = String(value ?? "").trim().replace(",", ".");
    rows.set(Number(m[1]), row);
  }
  return [...rows.values()].map((r) => ({
    studentId: r.studentId ?? "",
    score: r.score === undefined || r.score === "" ? null : Number(r.score),
  }));
}

const saveSchema = z.object({
  assessmentId: z.string().min(1),
  grades: z.array(
    z.object({ studentId: z.string().min(1), score: z.number().finite().min(0).nullable() })
  ),
});

export async function saveGrades(fd: FormData) {
  const user = await requireUser([...ROLES]);
  const assessmentId = String(fd.get("assessmentId") ?? "");
  const back = `/assessments/${assessmentId}`;
  const p = saveSchema.safeParse({ assessmentId, grades: parseGrades(fd) });
  if (!p.success) fail(back, "validation");

  const a = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!a) fail("/assessments", "not_found");
  await assertCourseAccess(user, a.courseId);
  if (p.data.grades.some((g) => g.score !== null && g.score > a.maxScore)) fail(back, "grade_above_max");

  await prisma.$transaction(
    p.data.grades.map((g) =>
      prisma.grade.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId: g.studentId } },
        create: { assessmentId, studentId: g.studentId, score: g.score },
        update: { score: g.score },
      })
    )
  );
  revalidateTag(STUDENT_ALERTS_TAG);
  revalidatePath(back);
  done(back, "grades_saved");
}

export async function deleteGrade(fd: FormData) {
  const user = await requireUser([...ROLES]);
  const gradeId = String(fd.get("gradeId") ?? "");
  const grade = await prisma.grade.findUnique({ where: { id: gradeId }, include: { assessment: true } });
  if (!grade) fail("/assessments", "not_found");
  await assertCourseAccess(user, grade.assessment.courseId);

  await prisma.grade.delete({ where: { id: gradeId } });
  revalidateTag(STUDENT_ALERTS_TAG);
  revalidatePath(`/students/${grade.studentId}`);
  done(`/assessments/${grade.assessmentId}`, "grade_deleted");
}

// ───────── Évaluations ─────────
const assessmentSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  type: z.enum(["HOMEWORK", "TEST", "EXAM"]),
  termId: z.string().min(1),
  maxScore: z.coerce.number().positive().max(1000),
  coefficient: z.coerce.number().positive().max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const readAssessment = (fd: FormData) =>
  assessmentSchema.safeParse({
    title: String(fd.get("title") ?? "").trim() || undefined,
    type: fd.get("type"),
    termId: fd.get("termId"),
    maxScore: fd.get("maxScore") || 20,
    coefficient: fd.get("coefficient") || 1,
    date: fd.get("date"),
  });

export async function createAssessment(fd: FormData) {
  const user = await requireUser([...ROLES]);
  const courseId = String(fd.get("courseId") ?? "");
  const p = readAssessment(fd);
  if (!p.success || !courseId) fail("/assessments/new", "validation");
  await assertCourseAccess(user, courseId);

  // Le titre n'est plus saisi : on utilise le type (Devoir, Interrogation, Examen)
  const title = p.data.title ?? ASSESSMENT_TYPE_LABEL[p.data.type];
  const a = await prisma.assessment.create({
    data: { ...p.data, title, courseId, date: parseDateInput(p.data.date) },
  });
  revalidateTag(STUDENT_ALERTS_TAG);
  revalidatePath("/assessments");
  done(`/assessments/${a.id}`, "assessment_created");
}

export async function updateAssessment(fd: FormData) {
  const user = await requireUser([...ROLES]);
  const id = String(fd.get("id") ?? "");
  const back = `/assessments/${id}/edit`;
  const current = await prisma.assessment.findUnique({ where: { id } });
  if (!current) fail("/assessments", "not_found");
  await assertCourseAccess(user, current.courseId);

  const p = readAssessment(fd);
  if (!p.success) fail(back, "validation");
  // On ne peut pas réduire la note maximale en dessous d'une note déjà saisie
  const above = await prisma.grade.count({ where: { assessmentId: id, score: { gt: p.data.maxScore } } });
  if (above > 0) fail(back, "grade_above_max");

  await prisma.assessment.update({
    where: { id },
    data: { ...p.data, date: parseDateInput(p.data.date) },
  });
  revalidateTag(STUDENT_ALERTS_TAG);
  revalidatePath("/assessments");
  done(`/assessments/${id}`, "assessment_updated");
}

export async function deleteAssessment(fd: FormData) {
  const user = await requireUser([...ROLES]);
  const id = String(fd.get("id") ?? "");
  const a = await prisma.assessment.findUnique({ where: { id } });
  if (!a) fail("/assessments", "not_found");
  await assertCourseAccess(user, a.courseId);

  await prisma.assessment.delete({ where: { id } }); // les notes associées sont supprimées en cascade
  revalidateTag(STUDENT_ALERTS_TAG);
  revalidatePath("/assessments");
  done("/assessments", "assessment_deleted");
}
