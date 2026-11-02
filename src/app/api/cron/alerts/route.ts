import { NextResponse } from "next/server";
import { runStudentAlerts, runTeacherAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await runStudentAlerts();
  await runTeacherAlerts();
  return NextResponse.json({ ok: true });
}
