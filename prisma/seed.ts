import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { runStudentAlerts, runTeacherAlerts } from "../src/lib/alerts";

const prisma = new PrismaClient();

function at(daysAgo: number, h: number, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.term.deleteMany(),
    prisma.studentAttendance.deleteMany(),
    prisma.teacherAttendance.deleteMany(),
    prisma.session.deleteMany(),
    prisma.payslip.deleteMany(),
    prisma.course.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.classe.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.create({
    data: {
      email: "admin@ecole.mg",
      name: "Administrateur",
      role: "ADMIN",
      passwordHash: hash,
    },
  });

  const mk = (email: string, name: string, rate: number) =>
    prisma.teacher.create({
      data: {
        hourlyRate: rate,
        user: { create: { email, name, role: "TEACHER", passwordHash: hash } },
      },
    });
  const t1 = await mk("rakoto@ecole.mg", "Rakoto Jean", 8000);
  const t2 = await mk("rasoa@ecole.mg", "Rasoa Marie", 9000);

  const classe = await prisma.classe.create({ data: { name: "6ème A", year: "2026-2027" } });
  const maths = await prisma.subject.create({ data: { name: "Mathématiques" } });
  const fr = await prisma.subject.create({ data: { name: "Français" } });
  const c1 = await prisma.course.create({
    data: { classeId: classe.id, subjectId: maths.id, teacherId: t1.id, coefficient: 3 },
  });
  const c2 = await prisma.course.create({
    data: { classeId: classe.id, subjectId: fr.id, teacherId: t2.id, coefficient: 2 },
  });

  const names = [
    ["Andry", "Randria"],
    ["Bodo", "Ravelo"],
    ["Chloé", "Rakoto"],
    ["Dina", "Rasoa"],
    ["Eric", "Andrianina"],
    ["Faly", "Hery"],
    ["Gaby", "Razafy"],
    ["Hery", "Ranaivo"],
    ["Iony", "Rabe"],
    ["Jao", "Rakotomalala"],
  ];

  const students = [];
  for (let i = 0; i < names.length; i++) {
    const [firstName, lastName] = names[i];
    const slug = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    students.push(
      await prisma.student.create({
        data: {
          matricule: `M26-${String(i + 1).padStart(3, "0")}`,
          firstName,
          lastName,
          birthDate: new Date(2014, i % 12, 5 + i),
          birthPlace: "Antananarivo",
          sex: i % 2 === 0 ? "M" : "F",
          address: `Lot II ${10 + i} Antananarivo`,
          phone: `+261 34 00 00 ${String(i).padStart(2, "0")}`,
          parentName: `Parent de ${firstName}`,
          parentPhone: `+261 32 11 22 ${String(i).padStart(2, "0")}`,
          registeredAt: at(30 - i, 9),
          classe: { connect: { id: classe.id } },
          user: {
            create: {
              email: `${slug}@ecole.mg`,
              name: `${firstName} ${lastName}`,
              role: "STUDENT",
              passwordHash: hash,
            },
          },
        },
      })
    );
  }

  const sessions = [];
  for (let d = 0; d < 8; d++) {
    const course = d % 2 === 0 ? c1 : c2;
    const teacher = d % 2 === 0 ? t1 : t2;
    const s = await prisma.session.create({
      data: {
        courseId: course.id,
        teacherId: teacher.id,
        startsAt: at(d, 8),
        endsAt: at(d, 10),
        status: "DONE",
      },
    });
    sessions.push({ s, teacher, idx: d });
  }

  for (const { s, teacher, idx } of sessions) {
    await prisma.studentAttendance.createMany({
      data: students.map((st, i) => {
        let status: "PRESENT" | "LATE" | "ABSENT" = "PRESENT";
        if (i === 0 && idx < 4) status = "LATE";
        if (i === 1) status = "ABSENT";
        return {
          sessionId: s.id,
          studentId: st.id,
          status,
          minutesLate: status === "LATE" ? 15 : 0,
        };
      }),
    });
    const status =
      teacher.id === t2.id && idx % 2 === 1
        ? "LATE"
        : teacher.id === t1.id && idx > 3
          ? "ABSENT"
          : "PRESENT";
    await prisma.teacherAttendance.create({
      data: {
        sessionId: s.id,
        teacherId: teacher.id,
        status,
        arrivedAt: status === "LATE" ? new Date(s.startsAt.getTime() + 20 * 60000) : null,
      },
    });
  }

  const term = await prisma.term.create({
    data: { name: "Trimestre 1", startDate: at(60, 0), endDate: at(-60, 0) },
  });
  for (const [course, title] of [
    [c1, "Interro 1"],
    [c2, "Dictée 1"],
  ] as const) {
    const a = await prisma.assessment.create({
      data: {
        courseId: course.id,
        termId: term.id,
        title,
        type: "TEST",
        date: at(3, 0),
        coefficient: 1,
      },
    });
    await prisma.grade.createMany({
      data: students.map((st, i) => ({
        assessmentId: a.id,
        studentId: st.id,
        score: i === 9 ? null : 8 + ((i * 7) % 12),
      })),
    });
  }

  await runStudentAlerts();
  await runTeacherAlerts();
  console.log("Seed OK — admin@ecole.mg / password123");
}

main().finally(() => prisma.$disconnect());
