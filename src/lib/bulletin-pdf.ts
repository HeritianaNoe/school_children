import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDateFull } from "./format";

export type BulletinPdfData = {
  matricule: string;
  firstName: string;
  lastName: string;
  classeName: string;
  year: string;
  overallAvg: number | null;
  subjectCount: number;
  terms: { name: string; rows: { name: string; avg: number | null }[] }[];
};

// Les polices standard du PDF n'acceptent que le jeu WinAnsi : tout autre caractère devient « ? ».
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

/** Construit le bulletin scolaire (A4, plusieurs pages si nécessaire). */
export async function buildBulletinPdf(d: BulletinPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Bulletin - ${d.matricule}`);
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
  const newPage = () => {
    page = pdf.addPage([PW, PH]);
    y = PH - 52;
  };
  const ensure = (h: number) => {
    if (y - h < BOTTOM) newPage();
  };

  // ── En-tête
  text("ÉTABLISSEMENT SCOLAIRE", M, y, 9, bold, GREY);
  y -= 30;
  text("BULLETIN", M, y, 22, bold);
  const date = `Date : ${fmtDateFull(new Date())}`;
  text(date, PW - M - font.widthOfTextAtSize(date, 10), y, 10, font, GREY);
  y -= 24;
  text(`Classe : ${d.classeName}   ·   Année : ${d.year}`, M, y, 11);
  y -= 18;
  text(`Élève : ${d.lastName.toUpperCase()} ${d.firstName}`, M, y, 11, bold);
  y -= 16;
  text(`Matricule : ${d.matricule}`, M, y, 10, font, GREY);
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 30;

  // ── Synthèse
  const boxW = (PW - 2 * M - 16) / 2;
  const box = (label: string, value: string, x: number) => {
    page.drawRectangle({ x, y: y - 50, width: boxW, height: 56, borderColor: LINE, borderWidth: 1 });
    text(label.toUpperCase(), x + 12, y - 8, 8, bold, GREY);
    text(value, x + 12, y - 38, 20, bold);
  };
  box("Moyenne générale", d.overallAvg != null ? `${d.overallAvg} / 20` : "—", M);
  box("Nombre de matières", String(d.subjectCount), M + boxW + 16);
  y -= 86;

  // ── Tableaux par période
  const avgX = PW - M - 110;
  for (const term of d.terms) {
    ensure(70);
    text(term.name, M, y, 12, bold);
    y -= 12;
    page.drawRectangle({ x: M, y: y - 20, width: PW - 2 * M, height: 22, color: HEAD_BG });
    text("MATIÈRE", M + 8, y - 13, 8, bold, GREY);
    text("MOYENNE", avgX, y - 13, 8, bold, GREY);
    y -= 22;

    if (term.rows.length === 0) {
      const msg = "Aucune note pour cette période.";
      text(msg, PW / 2 - font.widthOfTextAtSize(msg, 10) / 2, y - 18, 10, font, GREY);
      y -= 30;
    }
    for (const row of term.rows) {
      ensure(24);
      let name = safe(row.name);
      while (name.length > 1 && font.widthOfTextAtSize(name, 11) > avgX - M - 20) name = name.slice(0, -2) + "…";
      page.drawText(name, { x: M + 8, y: y - 16, size: 11, font, color: INK });
      text(row.avg != null ? `${row.avg} / 20` : "—", avgX, y - 16, 11);
      page.drawLine({ start: { x: M, y: y - 24 }, end: { x: PW - M, y: y - 24 }, thickness: 0.6, color: LINE });
      y -= 24;
    }
    y -= 22;
  }

  // ── Pied de page sur chaque page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const foot = `Document généré le ${fmtDateFull(new Date())} — Gestion scolaire — Page ${i + 1}/${pages.length}`;
    p.drawText(safe(foot), { x: PW / 2 - font.widthOfTextAtSize(safe(foot), 8) / 2, y: 34, size: 8, font, color: GREY });
  });

  return pdf.save();
}
