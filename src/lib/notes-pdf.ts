import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDate, fmtDateFull } from "./format";

export type NotesPdfEntry = {
  title: string;
  term: string;
  date: Date;
  score: number;
  maxScore: number;
  coefficient: number;
};

export type NotesPdfSubject = {
  name: string;
  avg: number | null;
  entries: NotesPdfEntry[];
};

export type NotesPdfData = {
  matricule: string;
  firstName: string;
  lastName: string;
  classeName: string;
  year: string;
  subjects: NotesPdfSubject[];
};

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

/** Relevé de notes par matière (A4). */
export async function buildNotesPdf(d: NotesPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Notes - ${d.matricule}`);
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const BOTTOM = 60;
  let page: PDFPage = pdf.addPage([PW, PH]);
  let y = PH - 52;

  const text = (t: string, x: number, yy: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(t), { x, y: yy, size, font: f, color });
  const ensure = (h: number) => {
    if (y - h < BOTTOM) {
      page = pdf.addPage([PW, PH]);
      y = PH - 52;
    }
  };

  text("ÉTABLISSEMENT SCOLAIRE", M, y, 9, bold, GREY);
  y -= 28;
  text("NOTES PAR MATIÈRE", M, y, 20, bold);
  const date = `Date : ${fmtDateFull(new Date())}`;
  text(date, PW - M - font.widthOfTextAtSize(date, 10), y, 10, font, GREY);
  y -= 22;
  text(`Classe : ${d.classeName}   ·   Année : ${d.year}`, M, y, 11);
  y -= 16;
  text(`Élève : ${d.lastName.toUpperCase()} ${d.firstName}`, M, y, 11, bold);
  y -= 14;
  text(`Matricule : ${d.matricule}`, M, y, 10, font, GREY);
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 28;

  if (d.subjects.length === 0) {
    text("Aucune note enregistrée.", M, y, 11, font, GREY);
  }

  for (const subject of d.subjects) {
    ensure(80);
    text(subject.name, M, y, 12, bold);
    const avgLabel = subject.avg != null ? `${subject.avg} / 20` : "—";
    text(avgLabel, PW - M - bold.widthOfTextAtSize(avgLabel, 12), y, 12, bold);
    y -= 10;
    page.drawRectangle({ x: M, y: y - 18, width: PW - 2 * M, height: 20, color: HEAD_BG });
    text("ÉVALUATION", M + 6, y - 12, 8, bold, GREY);
    text("PÉRIODE", M + 200, y - 12, 8, bold, GREY);
    text("DATE", M + 310, y - 12, 8, bold, GREY);
    text("NOTE", PW - M - 70, y - 12, 8, bold, GREY);
    y -= 22;

    for (const e of subject.entries) {
      ensure(20);
      let title = safe(e.title);
      if (font.widthOfTextAtSize(title, 10) > 180) {
        while (font.widthOfTextAtSize(title + "…", 10) > 180 && title.length > 3) title = title.slice(0, -1);
        title += "…";
      }
      text(title, M + 6, y - 12, 10);
      text(e.term, M + 200, y - 12, 9, font, GREY);
      text(fmtDate(e.date), M + 310, y - 12, 9, font, GREY);
      const note = `${e.score} / ${e.maxScore}`;
      text(note, PW - M - 70, y - 12, 10);
      y -= 18;
      page.drawLine({ start: { x: M, y: y + 2 }, end: { x: PW - M, y: y + 2 }, thickness: 0.4, color: LINE });
    }
    y -= 16;
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(safe(`Page ${i + 1} / ${pages.length}`), {
      x: M,
      y: 28,
      size: 9,
      font,
      color: GREY,
    });
  });

  return pdf.save();
}
