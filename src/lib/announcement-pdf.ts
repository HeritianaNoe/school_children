import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDateFull } from "./format";

export type AnnouncementPdfData = {
  title: string;
  body: string;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  published: boolean;
};

// Polices standard : seul le jeu WinAnsi est accepté.
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

/** Construit le PDF d'une annonce (A4). */
export async function buildAnnouncementPdf(d: AnnouncementPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Annonce - ${d.title}`);
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const BOTTOM = 60;
  const maxW = PW - M * 2;

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

  // Wrap text helper
  const wrap = (str: string, size: number, f: PDFFont, width: number): string[] => {
    const words = safe(str).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) <= width) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  // En-tête
  text("ÉTABLISSEMENT SCOLAIRE", M, y, 9, bold, GREY);
  y -= 28;
  text("ANNONCE", M, y, 22, bold);
  y -= 18;
  text(`Date : ${fmtDateFull(d.createdAt)}`, M, y, 11, font, GREY);
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 28;

  // Auteur
  text(`Auteur : ${d.authorName}`, M, y, 11, bold);
  y -= 16;
  text(d.authorEmail, M, y, 10, font, GREY);
  if (!d.published) {
    y -= 16;
    text("Statut : Brouillon", M, y, 10, bold, GREY);
  }
  y -= 24;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.5, color: LINE });
  y -= 28;

  // Titre
  const titleLines = wrap(d.title, 16, bold, maxW);
  for (const ln of titleLines) {
    ensure(22);
    text(ln, M, y, 16, bold);
    y -= 22;
  }
  y -= 12;

  // Corps (préserver les sauts de ligne)
  const paragraphs = d.body.split(/\n/);
  for (const para of paragraphs) {
    if (!para.trim()) {
      y -= 12;
      continue;
    }
    const lines = wrap(para, 11, font, maxW);
    for (const ln of lines) {
      ensure(16);
      text(ln, M, y, 11);
      y -= 16;
    }
    y -= 6;
  }

  // Pied de page
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
