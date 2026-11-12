import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateSlot } from "@/app/actions/timetable";
import SlotForm from "@/components/SlotForm";

export default async function EditSlotPage({
  params: paramsP,
  searchParams: searchParamsP,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vue?: string; semaine?: string }>;
}) {
  const params = await paramsP;
  const searchParams = await searchParamsP;
  await requireUser(["ADMIN", "DIRECTOR"]);
  const slot = await prisma.timetableSlot.findUnique({ where: { id: params.id } });
  if (!slot) notFound();

  const courses = await prisma.course.findMany({
    include: { subject: true, classe: true, teacher: { include: { user: true } } },
    orderBy: [{ classe: { name: "asc" } }, { subject: { name: "asc" } }],
  });
  const qs = new URLSearchParams();
  if (searchParams.vue) qs.set("vue", searchParams.vue);
  if (searchParams.semaine) qs.set("semaine", searchParams.semaine);
  const back = `/timetable${qs.toString() ? `?${qs}` : ""}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Modifier le créneau</h1>
        </div>
        <Link href={back} className="btn-secondary btn">
          ← Emploi du temps
        </Link>
      </div>
      <SlotForm
        action={updateSlot}
        back={back}
        submitLabel="Enregistrer"
        slot={slot}
        courses={courses.map((c) => ({
          id: c.id,
          label: `${c.classe.name} — ${c.subject.name} (${c.teacher.user.name})`,
        }))}
      />
    </>
  );
}
