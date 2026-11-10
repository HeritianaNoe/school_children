import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type TablePdfData = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
};

// Polices standard : seul le jeu WinAnsi est accepté, le reste devient « ? ».
const WIN_ANSI_EXTRA = "’‘“”–—…œŒ€•";
const REPLACE: Record<string, string> = { "→": "->", "←": "<-", "≤": "<=", "≥": ">=", "×": "x" };
export const pdfSafe = (t: string) =>
  [...String(t ?? "").replace(/[\u202f\u2009\u00a0]/g, " ").replace(/[\r\n\t]+/g, " ")]
    .map((ch) => {
      if (REPLACE[ch]) return REPLACE[ch];
      const c = ch.charCodeAt(0);
      return (c >= 0x20 && c <= 0x7e) || (c >= 0xa1 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch) ? ch : "?";
    })
    .join("");

const INK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.4, 0.45, 0.53);
const LINE = rgb(0.82, 0.85, 0.9);
const HEAD_BG = rgb(0.93, 0.95, 0.98);
const BRAND = rgb(0.11, 0.31, 0.85);

export function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  const push = () => {
    out.push(line);
    line = "";
  };
  for (const word of text.split(" ")) {
    let w = word;
    // Mot plus long que la colonne : découpe caractère par caractère
    while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
      let cut = w.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--;
      if (line) push();
      out.push(w.slice(0, cut));
      w = w.slice(cut);
    }
    const attempt = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(attempt, size) <= maxW) line = attempt;
    else {
      if (line) push();
      line = w;
    }
  }
  if (line || out.length === 0) push();
  return out;
}

/** Génère un PDF A4 (portrait, ou paysage si le tableau a beaucoup de colonnes) à partir d'un tableau de texte. */
export async function buildTablePdf(d: TablePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfSafe(d.title));
  pdf.setProducer("Gestion scolaire");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const landscape = d.headers.length > 5;
  const PW = landscape ? 841.89 : 595.28;
  const PH = landscape ? 595.28 : 841.89;
  const M = 40;
  const TOP = PH - 44;
  const BOTTOM = 48;
  const SIZE = 9;
  const LH = 11.5;
  const PAD_X = 6;
  const PAD_Y = 5;
  const usable = PW - 2 * M;

  const headers = d.headers.map(pdfSafe);
  const rows = d.rows.map((r) => d.headers.map((_, i) => pdfSafe(r[i] ?? "")));

  // Largeur des colonnes : proportionnelle au contenu, bornée, puis ajustée à la page
  const natural = headers.map((h, i) => {
    let m = bold.widthOfTextAtSize(h, SIZE);
    for (const r of rows) m = Math.max(m, font.widthOfTextAtSize(r[i], SIZE));
    return Math.min(m + 2 * PAD_X, 230);
  });
  const sum = natural.reduce((a, b) => a + b, 0);
  const widths = natural.map((w) => (w / sum) * usable);

  let page: PDFPage = pdf.addPage([PW, PH]);
  let y = TOP;
  const pages: PDFPage[] = [page];

  page.drawText("École lumière", { x: M, y, size: 8, font: bold, color: BRAND });
  y -= 18;
  page.drawText(pdfSafe(d.title), { x: M, y, size: 16, font: bold, color: INK });
  y -= 15;
  if (d.subtitle) {
    for (const l of wrap(pdfSafe(d.subtitle), font, 9, usable)) {
      page.drawText(l, { x: M, y, size: 9, font, color: GREY });
      y -= 12;
    }
  }
  y -= 8;

  const drawHeader = () => {
    const h = LH + 2 * PAD_Y;
    page.drawRectangle({ x: M, y: y - h, width: usable, height: h, color: HEAD_BG });
    let x = M;
    headers.forEach((t, i) => {
      page.drawText(wrap(t, bold, SIZE, widths[i] - 2 * PAD_X)[0], { x: x + PAD_X, y: y - PAD_Y - 9, size: SIZE, font: bold, color: INK });
      x += widths[i];
    });
    y -= h;
  };
  drawHeader();

  if (rows.length === 0) {
    page.drawText("Aucune donnée.", { x: M + PAD_X, y: y - 20, size: SIZE, font, color: GREY });
  }

  for (const r of rows) {
    const cells = r.map((t, i) => wrap(t, font, SIZE, widths[i] - 2 * PAD_X));
    const lines = Math.max(...cells.map((c) => c.length));
    const h = lines * LH + 2 * PAD_Y;
    if (y - h < BOTTOM) {
      page = pdf.addPage([PW, PH]);
      pages.push(page);
      y = TOP;
      drawHeader();
    }
    let x = M;
    cells.forEach((c, i) => {
      c.forEach((l, k) => page.drawText(l, { x: x + PAD_X, y: y - PAD_Y - 9 - k * LH, size: SIZE, font, color: INK }));
      x += widths[i];
    });
    y -= h;
    page.drawLine({ start: { x: M, y }, end: { x: M + usable, y }, thickness: 0.5, color: LINE });
  }

  const stamp = new Date().toLocaleDateString("fr-FR");
  pages.forEach((p, i) => {
    p.drawText(`${rows.length} ligne${rows.length > 1 ? "s" : ""} - généré le ${pdfSafe(stamp)}`, { x: M, y: 24, size: 8, font, color: GREY });
    const label = `Page ${i + 1} / ${pages.length}`;
    p.drawText(label, { x: PW - M - font.widthOfTextAtSize(label, 8), y: 24, size: 8, font, color: GREY });
  });

  return pdf.save();
}
