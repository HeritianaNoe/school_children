import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDateFull, fmtUtcDate } from "./format";
import { SCHOOL_NAME, contractText } from "./contract-text";

export type ContractPdfData = {
  number: string;
  year: string;
  /** Colonnes DATE : lues en UTC */
  startDate: Date;
  endDate: Date;
  teacherName: string;
  email: string;
  phone: string | null;
  /** Libellé français du statut (Titulaire, Vacataire…) */
  status: string;
  hourlyRate: number;
  issuedAt: Date;
};

// Polices standard : seul le jeu WinAnsi est accepté (les autres caractères deviennent « ? »).
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

// Intl « fr-FR » sépare les milliers par une espace fine insécable (U+202F), absente de WinAnsi
const money = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/[\u202f\u00a0]/g, " ")} Ar`;

/** Contrat d'enseignement (A4). Modèle générique : à faire valider par la direction / un juriste avant usage. */
export async function buildContractPdf(d: ContractPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Contrat d'enseignement - ${d.teacherName} - ${d.year}`);
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const M = 56;
  const BOTTOM = 70;
  const maxW = PW - M * 2;
  const SIZE = 10.5;
  const LEAD = 15;

  let page: PDFPage = pdf.addPage([PW, PH]);
  let y = PH - 60;

  const newPage = () => {
    page = pdf.addPage([PW, PH]);
    y = PH - 60;
  };
  const ensure = (h: number) => {
    if (y - h < BOTTOM) newPage();
  };
  const draw = (t: string, x: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(t), { x, y, size, font: f, color });

  const wrap = (text: string, f: PDFFont, size: number, width: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of safe(text).split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  const paragraph = (text: string, f: PDFFont = font, indent = 0) => {
    for (const l of wrap(text, f, SIZE, maxW - indent)) {
      ensure(LEAD);
      draw(l, M + indent, SIZE, f);
      y -= LEAD;
    }
    y -= 4;
  };
  const article = (title: string, body: string[]) => {
    ensure(LEAD * 3);
    y -= 6;
    draw(title, M, 11, bold);
    y -= LEAD + 2;
    body.forEach((b) => paragraph(b));
  };

  // ── En-tête de l'établissement (nom, mention, date d'établissement)
  const issued = `Établi le ${fmtDateFull(d.issuedAt)}`;
  draw(SCHOOL_NAME.toUpperCase(), M, 17, bold);
  page.drawText(safe(issued), { x: PW - M - font.widthOfTextAtSize(safe(issued), 10), y, size: 10, font, color: GREY });
  y -= 15;
  draw("Établissement scolaire", M, 9.5, font, GREY);
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 1.5, color: INK });
  y -= 28;

  // ── Titre
  draw("CONTRAT D'ENSEIGNEMENT", M, 20, bold);
  y -= 22;
  draw(`Année scolaire ${d.year}  ·  N° ${d.number}`, M, 11, font, GREY);
  y -= 24;

  const text = contractText({
    year: d.year,
    status: d.status,
    rate: money(d.hourlyRate),
    start: fmtUtcDate(d.startDate),
    end: fmtUtcDate(d.endDate),
    teacherName: d.teacherName,
    email: d.email,
    phone: d.phone,
  });

  // ── Parties
  paragraph("Entre les soussignés :", bold);
  text.parties.forEach((t) => paragraph(t));
  paragraph("il a été convenu ce qui suit :", bold);

  // ── Articles
  text.articles.forEach((a) => article(a.title, a.body));

  // ── Signatures
  ensure(115);
  y -= 8;
  paragraph(`Fait à ____________________, le ${fmtDateFull(d.issuedAt)}, en deux exemplaires.`);
  y -= 10;
  const colW = (maxW - 24) / 2;
  draw("L'Enseignant(e)", M, 10, bold);
  draw("Pour l'Établissement", M + colW + 24, 10, bold);
  y -= 14;
  draw("(« Lu et approuvé »)", M, 8.5, font, GREY);
  draw("(Cachet et signature)", M + colW + 24, 8.5, font, GREY);
  y -= 48;
  page.drawLine({ start: { x: M, y }, end: { x: M + colW, y }, thickness: 0.8, color: GREY });
  page.drawLine({ start: { x: M + colW + 24, y }, end: { x: PW - M, y }, thickness: 0.8, color: GREY });

  // ── Pied de page sur chaque page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const foot = safe(`Contrat ${d.number} — page ${i + 1}/${pages.length} — ${SCHOOL_NAME}`);
    p.drawText(foot, { x: PW / 2 - font.widthOfTextAtSize(foot, 8) / 2, y: 34, size: 8, font, color: GREY });
  });

  return pdf.save();
}
