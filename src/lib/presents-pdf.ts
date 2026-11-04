import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { fmtDateFull } from "./format";

export type PresentsPdfImage = { key: string; data: Uint8Array; mime: string };
export type PresentsPdfData = {
  dateLabel: string;
  classeLabel: string;
  sessions: {
    title: string;
    subtitle: string;
    called: boolean;
    rows: { name: string; status: string; minutesLate: number; image: PresentsPdfImage | null }[];
  }[];
};

// Polices standard : seul le jeu WinAnsi est accepté, le reste devient « ? ».
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
const GREEN = rgb(0.09, 0.4, 0.2);
const AMBER = rgb(0.57, 0.25, 0.06);

/** Liste des élèves présents (A4, plusieurs pages si nécessaire). */
export async function buildPresentsPdf(d: PresentsPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Élèves présents - ${d.dateLabel}`);
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const BOTTOM = 60;
  const ROW = 32;
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

  // Les images sont intégrées une seule fois (même avatar utilisé par plusieurs élèves)
  const images = new Map<string, PDFImage | null>();
  const getImage = async (img: PresentsPdfImage | null) => {
    if (!img) return null;
    if (images.has(img.key)) return images.get(img.key)!;
    let out: PDFImage | null = null;
    try {
      out = img.mime === "image/png" ? await pdf.embedPng(img.data) : await pdf.embedJpg(img.data);
    } catch {
      out = null; // image illisible : la cellule reste vide
    }
    images.set(img.key, out);
    return out;
  };

  // ── En-tête
  text("ÉTABLISSEMENT SCOLAIRE", M, y, 9, bold, GREY);
  y -= 30;
  text("ÉLÈVES PRÉSENTS", M, y, 22, bold);
  y -= 22;
  text(`Date : ${d.dateLabel}   ·   ${d.classeLabel}`, M, y, 11);
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 28;

  const colPhoto = M + 8;
  const colName = M + 56;
  const colStatus = PW - M - 170;
  const colLate = PW - M - 70;

  if (d.sessions.length === 0) {
    text("Aucune séance ce jour-là.", M, y, 11, font, GREY);
  }

  for (const s of d.sessions) {
    ensure(110);
    text(s.title, M, y, 12, bold);
    y -= 15;
    text(s.subtitle, M, y, 9.5, font, GREY);
    y -= 14;

    if (!s.called || s.rows.length === 0) {
      text(!s.called ? "L'appel n'a pas encore été effectué." : "Aucun élève présent.", M, y - 4, 10, font, GREY);
      y -= 34;
      continue;
    }

    const header = () => {
      page.drawRectangle({ x: M, y: y - 20, width: PW - 2 * M, height: 22, color: HEAD_BG });
      text("PHOTO", colPhoto, y - 13, 8, bold, GREY);
      text("ÉLÈVE", colName, y - 13, 8, bold, GREY);
      text("STATUT", colStatus, y - 13, 8, bold, GREY);
      text("RETARD", colLate, y - 13, 8, bold, GREY);
      y -= 22;
    };
    header();

    for (const r of s.rows) {
      if (y - ROW < BOTTOM) {
        ensure(ROW + 30);
        header();
      }
      const img = await getImage(r.image);
      if (img) {
        const k = Math.min(24 / img.width, 24 / img.height);
        page.drawImage(img, { x: colPhoto, y: y - ROW + 4, width: img.width * k, height: img.height * k });
      }
      let name = safe(r.name);
      while (name.length > 1 && font.widthOfTextAtSize(name, 11) > colStatus - colName - 10) name = name.slice(0, -2) + "…";
      page.drawText(name, { x: colName, y: y - 19, size: 11, font, color: INK });
      text(r.status, colStatus, y - 19, 10, bold, r.status === "En retard" ? AMBER : GREEN);
      text(r.minutesLate > 0 ? `${r.minutesLate} min` : "—", colLate, y - 19, 11);
      page.drawLine({ start: { x: M, y: y - ROW }, end: { x: PW - M, y: y - ROW }, thickness: 0.6, color: LINE });
      y -= ROW;
    }
    y -= 22;
  }

  // ── Pied de page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const foot = `Document généré le ${fmtDateFull(new Date())} — Gestion scolaire — Page ${i + 1}/${pages.length}`;
    p.drawText(safe(foot), { x: PW / 2 - font.widthOfTextAtSize(safe(foot), 8) / 2, y: 34, size: 8, font, color: GREY });
  });

  return pdf.save();
}
