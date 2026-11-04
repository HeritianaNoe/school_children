import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { fmtDateFull } from "./format";
import { DAYS } from "./timetable";

export type TimetablePdfSlot = { day: number; start: string; end: string; subject: string; other: string; room: string | null };

const WIN_ANSI_EXTRA = "’‘“”–—…œŒ€•";
const safe = (t: string) =>
  [...t]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch) ? ch : "?";
    })
    .join("");

const INK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.4, 0.45, 0.53);
const LINE = rgb(0.78, 0.82, 0.88);
const HEAD_BG = rgb(0.93, 0.95, 0.98);
const ACCENT = rgb(0.15, 0.39, 0.92);

/** Emploi du temps hebdomadaire (A4 paysage). */
export async function buildTimetablePdf(d: { title: string; slots: TimetablePdfSlot[] }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Emploi du temps - ${d.title}`);
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const PW = 841.89;
  const PH = 595.28;
  const M = 36;
  const page = pdf.addPage([PW, PH]);

  const text = (t: string, x: number, y: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(t), { x, y, size, font: f, color });
  const fit = (t: string, size: number, maxW: number, f: PDFFont = font) => {
    let s = safe(t);
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    while (s.length > 3 && f.widthOfTextAtSize(s + "…", size) > maxW) s = s.slice(0, -1);
    return s + "…";
  };

  text("ÉTABLISSEMENT SCOLAIRE", M, PH - 40, 9, bold, GREY);
  text("EMPLOI DU TEMPS", M, PH - 66, 20, bold);
  const date = `Date : ${fmtDateFull(new Date())}`;
  text(date, PW - M - font.widthOfTextAtSize(date, 10), PH - 66, 10, font, GREY);
  text(d.title, M, PH - 84, 12, bold);
  page.drawLine({ start: { x: M, y: PH - 94 }, end: { x: PW - M, y: PH - 94 }, thickness: 1.5, color: INK });

  const top = PH - 106;
  const bottom = 40;
  const colW = (PW - 2 * M) / DAYS.length;
  const maxCount = Math.max(1, ...DAYS.map((day) => d.slots.filter((s) => s.day === day.n).length));
  const slotH = Math.min(58, (top - 24 - bottom) / maxCount);

  DAYS.forEach((day, i) => {
    const x = M + i * colW;
    page.drawRectangle({ x, y: top - 22, width: colW, height: 22, color: HEAD_BG, borderColor: LINE, borderWidth: 0.5 });
    text(day.label.toUpperCase(), x + 8, top - 15, 9, bold, GREY);
    let y = top - 22;
    for (const s of d.slots.filter((sl) => sl.day === day.n)) {
      page.drawRectangle({ x, y: y - slotH, width: colW, height: slotH, borderColor: LINE, borderWidth: 0.5 });
      page.drawRectangle({ x, y: y - slotH, width: 3, height: slotH, color: ACCENT });
      const w = colW - 16;
      text(`${s.start} – ${s.end}`, x + 9, y - 14, 9.5, bold);
      text(fit(s.subject, 10, w), x + 9, y - 28, 10);
      text(fit(`${s.other}${s.room ? ` · ${s.room}` : ""}`, 8.5, w), x + 9, y - 41, 8.5, font, GREY);
      y -= slotH;
    }
    if (!d.slots.some((sl) => sl.day === day.n)) {
      page.drawRectangle({ x, y: y - slotH, width: colW, height: slotH, borderColor: LINE, borderWidth: 0.5 });
      text("—", x + 9, y - 16, 10, font, GREY);
    }
  });

  return pdf.save();
}
