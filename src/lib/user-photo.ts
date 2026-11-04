import { prisma } from "@/lib/prisma";
import type { PhotoResult } from "@/lib/photo";

type OkPhoto = Extract<PhotoResult, { ok: true }>;

/**
 * Enregistre ou supprime la photo d'un compte.
 * Un compte élève partage la photo de sa fiche élève (StudentPhoto) ; les autres comptes utilisent UserPhoto.
 */
export async function applyUserPhoto(userId: string, photo: OkPhoto, remove = false) {
  if (photo.empty && !remove) return;

  const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });

  if (student) {
    if (!photo.empty) {
      await prisma.studentPhoto.upsert({
        where: { studentId: student.id },
        create: { studentId: student.id, data: photo.data, mime: photo.mime },
        update: { data: photo.data, mime: photo.mime },
      });
      await prisma.student.update({
        where: { id: student.id },
        data: { photoUrl: `/api/students/${student.id}/photo?v=${Date.now()}` },
      });
    } else {
      await prisma.studentPhoto.deleteMany({ where: { studentId: student.id } });
      await prisma.student.update({ where: { id: student.id }, data: { photoUrl: null } });
    }
    return;
  }

  if (!photo.empty) {
    await prisma.userPhoto.upsert({
      where: { userId },
      create: { userId, data: photo.data, mime: photo.mime },
      update: { data: photo.data, mime: photo.mime },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { photoUrl: `/api/users/${userId}/photo?v=${Date.now()}` },
    });
  } else {
    await prisma.userPhoto.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { photoUrl: null } });
  }
}
