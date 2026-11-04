import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORDS } from "../src/lib/default-passwords";
import { runStudentAlerts, runTeacherAlerts } from "../src/lib/alerts";

const prisma = new PrismaClient();

function at(daysAgo: number, h: number, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORDS.STAFF, 10);
  const studentHash = await bcrypt.hash(DEFAULT_PASSWORDS.STUDENT, 10);

  await prisma.$transaction([
    prisma.reclamation.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.userPhoto.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.term.deleteMany(),
    prisma.studentAttendance.deleteMany(),
    prisma.teacherAttendance.deleteMany(),
    prisma.session.deleteMany(),
    prisma.payslip.deleteMany(),
    prisma.timetableSlot.deleteMany(),
    prisma.course.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.studentPhoto.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.classe.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Comptes de gestion : « Prénom Nom » + sexe (sert à choisir l'avatar par défaut)
  await prisma.user.createMany({
    data: [
      { email: "admin@ecole.mg", name: "Tiana Andrianaivo", role: "ADMIN", sex: "F", passwordHash: hash },
      { email: "directeur@ecole.mg", name: "Solofo Rakotomalala", role: "DIRECTOR", sex: "M", passwordHash: hash },
      { email: "manager@ecole.mg", name: "Naivo Razafindrakoto", role: "MANAGER", sex: "F", passwordHash: hash },
    ],
  });

  const mk = (email: string, name: string, rate: number, sex: "M" | "F") =>
    prisma.teacher.create({
      data: {
        hourlyRate: rate,
        user: { create: { email, name, role: "TEACHER", sex, passwordHash: hash } },
      },
    });

  // Enseignants
  const tMath = await mk("rakoto@ecole.mg", "Jean Rakoto", 8000, "M"); // Mathématiques — Prénom: Jean, Nom: Rakoto
  const tFr = await mk("rasoa@ecole.mg", "Marie Rasoa", 9000, "F"); // Français — Prénom: Marie, Nom: Rasoa
  const tMg = await mk("randrian@ecole.mg", "Hery Randrianarisoa", 8500, "M"); // Malagasy — Prénom: Hery, Nom: Randrianarisoa
  const tHist = await mk("rala@ecole.mg", "Voahirana Ralambo", 8200, "F"); // Histoire — Prénom: Voahirana, Nom: Ralambo

  const year = "2026-2027";
  const classeA = await prisma.classe.create({ data: { name: "6ème A", year } });
  const classeB = await prisma.classe.create({ data: { name: "5ème B", year } });

  // Matières
  const maths = await prisma.subject.create({ data: { name: "Mathématiques" } });
  const fr = await prisma.subject.create({ data: { name: "Français" } });
  const malagasy = await prisma.subject.create({ data: { name: "Malagasy" } });
  const histoire = await prisma.subject.create({ data: { name: "Histoire" } });

  // Cours 6ème A
  const cA_math = await prisma.course.create({
    data: { classeId: classeA.id, subjectId: maths.id, teacherId: tMath.id, coefficient: 3 },
  });
  const cA_fr = await prisma.course.create({
    data: { classeId: classeA.id, subjectId: fr.id, teacherId: tFr.id, coefficient: 2 },
  });
  const cA_mg = await prisma.course.create({
    data: { classeId: classeA.id, subjectId: malagasy.id, teacherId: tMg.id, coefficient: 2 },
  });
  const cA_hist = await prisma.course.create({
    data: { classeId: classeA.id, subjectId: histoire.id, teacherId: tHist.id, coefficient: 1.5 },
  });

  // Cours 5ème B
  const cB_math = await prisma.course.create({
    data: { classeId: classeB.id, subjectId: maths.id, teacherId: tMath.id, coefficient: 3 },
  });
  const cB_fr = await prisma.course.create({
    data: { classeId: classeB.id, subjectId: fr.id, teacherId: tFr.id, coefficient: 2 },
  });
  const cB_mg = await prisma.course.create({
    data: { classeId: classeB.id, subjectId: malagasy.id, teacherId: tMg.id, coefficient: 2 },
  });
  const cB_hist = await prisma.course.create({
    data: { classeId: classeB.id, subjectId: histoire.id, teacherId: tHist.id, coefficient: 1.5 },
  });

  const namesA = [
    ["Andry", "Randria"],
    ["Bodo", "Ravelo"],
    ["Chloé", "Rakoto"],
    ["Dina", "Rasoa"],
    ["Eric", "Andrianina"],
  ];
  const namesB = [
    ["Faly", "Hery"],
    ["Gaby", "Razafy"],
    ["Hery", "Ranaivo"],
    ["Iony", "Rabe"],
    ["Jao", "Rakotomalala"],
  ];

  async function createStudents(
    names: string[][],
    classeId: string,
    prefix: string,
    startIdx: number
  ) {
    const out = [];
    for (let i = 0; i < names.length; i++) {
      const [firstName, lastName] = names[i];
      const slug = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      out.push(
        await prisma.student.create({
          data: {
            matricule: `${prefix}-${String(startIdx + i).padStart(3, "0")}`,
            firstName,
            lastName,
            birthDate: new Date(2014, i % 12, 5 + i),
            birthPlace: "Antananarivo",
            sex: i % 2 === 0 ? "M" : "F",
            address: `Lot II ${10 + i} Antananarivo`,
            phone: `+261 34 00 00 ${String(startIdx + i).padStart(2, "0")}`,
            parentName: `Parent de ${firstName}`,
            parentPhone: `+261 32 11 22 ${String(startIdx + i).padStart(2, "0")}`,
            registeredAt: at(30 - i, 9),
            classe: { connect: { id: classeId } },
            user: {
              create: {
                email: `${slug}@ecole.mg`,
                name: `${firstName} ${lastName}`,
                role: "STUDENT",
                passwordHash: studentHash,
              },
            },
          },
        })
      );
    }
    return out;
  }

  const studentsA = await createStudents(namesA, classeA.id, "M26", 1);
  const studentsB = await createStudents(namesB, classeB.id, "M26", 6);

  // Année précédente (alimente « Historique des années ») : une classe archivée avec 2 matières et 3 élèves
  const classePrev = await prisma.classe.create({ data: { name: "6ème A", year: "2025-2026" } });
  await prisma.course.createMany({
    data: [
      { classeId: classePrev.id, subjectId: maths.id, teacherId: tMath.id, coefficient: 3 },
      { classeId: classePrev.id, subjectId: fr.id, teacherId: tFr.id, coefficient: 2 },
    ],
  });
  await createStudents(
    [
      ["Koto", "Rabary"],
      ["Lala", "Rasolofo"],
      ["Mika", "Andriamanana"],
    ],
    classePrev.id,
    "M25",
    1
  );

  // Emploi du temps hebdomadaire (lundi → vendredi, 2 plages par jour).
  // Dans une même plage, 6ème A et 5ème B ont des matières différentes (donc des enseignants différents) : aucun conflit.
  const coursesA = [cA_math, cA_fr, cA_mg, cA_hist];
  const coursesB = [cB_math, cB_fr, cB_mg, cB_hist];
  const periods = [
    ["08:00", "10:00"],
    ["10:15", "12:15"],
  ];
  const slots: { courseId: string; dayOfWeek: number; startTime: string; endTime: string; room: string }[] = [];
  for (let day = 1; day <= 5; day++) {
    periods.forEach(([startTime, endTime], p) => {
      const i = ((day - 1) * periods.length + p) % 4;
      slots.push({ courseId: coursesA[i].id, dayOfWeek: day, startTime, endTime, room: "Salle 1" });
      slots.push({ courseId: coursesB[(i + 1) % 4].id, dayOfWeek: day, startTime, endTime, room: "Salle 2" });
    });
  }
  await prisma.timetableSlot.createMany({ data: slots });

  // Séances : cycle des 8 cours (4 matières × 2 classes) sur 8 jours
  const courseCycle = [cA_math, cA_fr, cA_mg, cA_hist, cB_math, cB_fr, cB_mg, cB_hist];
  const teacherCycle = [tMath, tFr, tMg, tHist, tMath, tFr, tMg, tHist];
  const sessions: {
    s: { id: string; startsAt: Date };
    teacher: { id: string };
    idx: number;
    students: typeof studentsA;
  }[] = [];

  for (let d = 0; d < 8; d++) {
    const course = courseCycle[d];
    const teacher = teacherCycle[d];
    const students = d < 4 ? studentsA : studentsB;
    const s = await prisma.session.create({
      data: {
        courseId: course.id,
        teacherId: teacher.id,
        startsAt: at(d, 8),
        endsAt: at(d, 10),
        status: "DONE",
      },
    });
    sessions.push({ s, teacher, idx: d, students });
  }

  for (const { s, teacher, idx, students } of sessions) {
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
      teacher.id === tFr.id && idx % 2 === 1
        ? "LATE"
        : teacher.id === tMath.id && idx > 5
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

  for (const [course, title, students] of [
    [cA_math, "Interro 1", studentsA],
    [cA_fr, "Dictée 1", studentsA],
    [cA_mg, "Fanadinana 1", studentsA],
    [cA_hist, "Contrôle 1", studentsA],
    [cB_math, "Interro 1", studentsB],
    [cB_fr, "Dictée 1", studentsB],
    [cB_mg, "Fanadinana 1", studentsB],
    [cB_hist, "Contrôle 1", studentsB],
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
        score: i === students.length - 1 ? null : 8 + ((i * 7) % 12),
      })),
    });
  }

  await runStudentAlerts();
  await runTeacherAlerts();
  console.log(
    `Données de démonstration créées — 6ème A + 5ème B (+ 6ème A 2025-2026 archivée) · Math, Français, Malagasy, Histoire · emploi du temps (lun–ven)
  admin@ecole.mg (Tiana Andrianaivo) / ${DEFAULT_PASSWORDS.STAFF}
  directeur@ecole.mg (Solofo Rakotomalala) / ${DEFAULT_PASSWORDS.STAFF}
  manager@ecole.mg (Naivo Razafindrakoto) / ${DEFAULT_PASSWORDS.STAFF}
  Profs : rakoto, rasoa, randrian, rala @ecole.mg / ${DEFAULT_PASSWORDS.STAFF}
  Élèves : prenom@ecole.mg / ${DEFAULT_PASSWORDS.STUDENT}`
  );
}

main().finally(() => prisma.$disconnect());
