import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDate, fmtDateFull } from "./format";
import { pdfSafe as safe, wrap } from "./table-pdf";

export type DossierPdfData = {
  matricule: string;
  firstName: string;
  lastName: string;
  classeName: string;
  year: string;
  attendance: { present: number; late: number; absent: number; excused: number };
  averages: { term: string; avg: number | null }[];
  grades: { date: Date; subject: string; title: string; score: string }[];
  /** null = section masquée (l'élève ne voit pas les commentaires du personnel) */
  comments: { author: string; at: Date; body: string }[] | null;
};

const INK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.4, 0.45, 0.53);
const LINE = rgb(0.78, 0.82, 0.88);
const HEAD_BG = rgb(0.93, 0.95, 0.98);

/** Dossier complet de l'élève (A4) : présences, moyennes, notes et commentaires. */
export async function buildDossierPdf(d: DossierPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(`Dossier - ${d.matricule}`));
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const TOP = PH - 52;
  const BOTTOM = 60;
  const W = PW - 2 * M;
  let page: PDFPage = pdf.addPage([PW, PH]);
  let y = TOP;

  const text = (t: string, x: number, yy: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(t), { x, y: yy, size, font: f, color });
  const right = (t: string, xr: number, yy: number, size: number, f: PDFFont = font, color = INK) =>
    text(t, xr - f.widthOfTextAtSize(safe(t), size), yy, size, f, color);
  const fit = (t: string, size: number, maxW: number, f: PDFFont = font) => {
    let s = safe(t);
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    while (s.length > 1 && f.widthOfTextAtSize(`${s}...`, size) > maxW) s = s.slice(0, -1);
    return `${s}...`;
  };
  /** Saute à la page suivante si `h` points ne tiennent plus ; renvoie true si une page a été ajoutée. */
  const ensure = (h: number) => {
    if (y - h >= BOTTOM) return false;
    page = pdf.addPage([PW, PH]);
    y = TOP;
    return true;
  };
  const section = (title: string) => {
    // Espace avant chaque section (sauf en haut d'une nouvelle page)
    if (!ensure(110)) y -= 30;
    text(title, M, y, 13, bold);
    y -= 10;
    page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.8, color: INK });
    y -= 22;
  };

  // ── En-tête ──
  text("ÉTABLISSEMENT SCOLAIRE", M, y, 9, bold, GREY);
  y -= 28;
  text("DOSSIER D'ÉLÈVE", M, y, 20, bold);
  right(`Date : ${fmtDateFull(new Date())}`, PW - M, y, 10, font, GREY);
  y -= 22;
  text(`Classe : ${d.classeName}   ·   Année : ${d.year}`, M, y, 11);
  y -= 16;
  text(`Élève : ${d.lastName.toUpperCase()} ${d.firstName}`, M, y, 11, bold);
  y -= 14;
  text(`Matricule : ${d.matricule}`, M, y, 10, font, GREY);
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 22;

  // ── Présence (30 derniers jours) ──
  section("Présence (30 derniers jours)");
  const cards = [
    ["Présences", d.attendance.present],
    ["Retards", d.attendance.late],
    ["Absences", d.attendance.absent],
    ["Absences justifiées", d.attendance.excused],
  ] as const;
  const gap = 10;
  const cw = (W - gap * (cards.length - 1)) / cards.length;
  ensure(70);
  cards.forEach(([label, value], i) => {
    const x = M + i * (cw + gap);
    page.drawRectangle({ x, y: y - 54, width: cw, height: 54, borderColor: LINE, borderWidth: 0.8, color: HEAD_BG });
    text(fit(label, 8.5, cw - 16), x + 10, y - 18, 8.5, font, GREY);
    text(String(value), x + 10, y - 42, 18, bold);
  });
  y -= 62;

  // ── Moyennes ──
  section("Moyennes");
  if (d.averages.length === 0) {
    text("Aucune période définie.", M, y, 10, font, GREY);
    y -= 18;
  }
  for (const a of d.averages) {
    ensure(28);
    text(a.term, M + 6, y - 17, 10);
    right(a.avg != null ? `${a.avg} / 20` : "—", PW - M - 6, y - 17, 10, bold);
    y -= 28;
    page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.4, color: LINE });
  }

  // ── Notes ──
  section("Notes");
  const gradesHead = () => {
    page.drawRectangle({ x: M, y: y - 26, width: W, height: 26, color: HEAD_BG });
    text("DATE", M + 6, y - 17, 8, bold, GREY);
    text("MATIÈRE", M + 100, y - 17, 8, bold, GREY);
    text("ÉVALUATION", M + 240, y - 17, 8, bold, GREY);
    right("NOTE", PW - M - 6, y - 17, 8, bold, GREY);
    y -= 30;
  };
  if (d.grades.length === 0) {
    text("Aucune note enregistrée.", M, y, 10, font, GREY);
    y -= 18;
  } else {
    ensure(70);
    gradesHead();
    for (const g of d.grades) {
      if (ensure(26)) gradesHead();
      text(fmtDate(g.date), M + 6, y - 17, 9, font, GREY);
      text(fit(g.subject, 10, 130), M + 100, y - 17, 10);
      text(fit(g.title, 10, 170), M + 240, y - 17, 10);
      right(g.score, PW - M - 6, y - 17, 10);
      y -= 26;
      page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.4, color: LINE });
    }
  }

  // ── Commentaires (personnel uniquement) ──
  if (d.comments) {
    section("Commentaires");
    if (d.comments.length === 0) {
      text("Aucun commentaire.", M, y, 10, font, GREY);
      y -= 18;
    }
    for (const c of d.comments) {
      ensure(64);
      text(`${c.author} · ${c.at.toLocaleString("fr-FR")}`, M, y, 9, font, GREY);
      y -= 18;
      for (const line of wrap(safe(c.body), font, 10, W - 12)) {
        ensure(16);
        text(line, M + 6, y, 10);
        y -= 15;
      }
      y -= 8;
      page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.4, color: LINE });
      y -= 22;
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(safe(`Page ${i + 1} / ${pages.length}`), { x: M, y: 28, size: 9, font, color: GREY });
  });

  return pdf.save();
}
