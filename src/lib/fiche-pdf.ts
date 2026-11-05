import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { fmtDateFull } from "./format";
import { SEX_LABEL_LONG } from "./labels";

export type FicheData = {
  matricule: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  birthPlace: string | null;
  sex: "M" | "F" | null;
  address: string | null;
  phone: string | null;
  email: string;
  parentName: string | null;
  parentPhone: string | null;
  registeredAt: Date;
  classeName: string;
  year: string;
  nomenclature: string;
  photo: { data: Uint8Array; mime: string } | null;
};

// Les polices standard du PDF n'acceptent que le jeu WinAnsi (accents français inclus) :
// tout autre caractère est remplacé par « ? » pour éviter une erreur d'encodage.
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

/** Construit la fiche d'inscription (A4) et renvoie le contenu du PDF. */
export async function buildFichePdf(s: FicheData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Fiche d'inscription - ${s.matricule}`);
  pdf.setProducer("Gestion scolaire");
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 48; // marge
  const W = page.getWidth();
  const text = (t: string, x: number, y: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(t), { x, y, size, font: f, color });

  // ── En-tête
  text("ÉTABLISSEMENT SCOLAIRE", M, 790, 9, bold, GREY);
  text("FICHE D'INSCRIPTION", M, 762, 22, bold);
  text(`Année scolaire : ${s.year}`, M, 736, 11);
  text(`Matricule : ${s.matricule}`, M, 718, 11, bold);

  // ── Photo (cadre 100 × 125 pt)
  const px = W - M - 100;
  const py = 700;
  page.drawRectangle({ x: px, y: py, width: 100, height: 125, borderColor: LINE, borderWidth: 1 });
  let photoDrawn = false;
  if (s.photo) {
    try {
      const img = s.photo.mime === "image/png" ? await pdf.embedPng(s.photo.data) : await pdf.embedJpg(s.photo.data);
      const k = Math.min(98 / img.width, 123 / img.height);
      const w = img.width * k;
      const h = img.height * k;
      page.drawImage(img, { x: px + (100 - w) / 2, y: py + (125 - h) / 2, width: w, height: h });
      photoDrawn = true;
    } catch {
      /* image illisible : on laisse le cadre vide */
    }
  }
  if (!photoDrawn) {
    const label = "Photo";
    text(label, px + 50 - font.widthOfTextAtSize(label, 10) / 2, py + 60, 10, font, GREY);
  }

  page.drawLine({ start: { x: M, y: 690 }, end: { x: W - M, y: 690 }, thickness: 1.5, color: INK });

  // ── Sections
  let y = 660;
  const colW = (W - 2 * M - 24) / 2;

  const section = (title: string) => {
    text(title, M, y, 12, bold);
    y -= 24;
  };
  const field = (label: string, value: string, col: 0 | 1 | "full") => {
    const x = col === 1 ? M + colW + 24 : M;
    const width = col === "full" ? W - 2 * M : colW;
    text(label.toUpperCase(), x, y, 7.5, bold, GREY);
    // la valeur est tronquée si elle dépasse la largeur de la colonne
    let v = safe(value || "—");
    while (v.length > 1 && font.widthOfTextAtSize(v, 11) > width) v = v.slice(0, -2) + "…";
    page.drawText(v, { x, y: y - 15, size: 11, font, color: INK });
    page.drawLine({ start: { x, y: y - 21 }, end: { x: x + width, y: y - 21 }, thickness: 0.6, color: LINE });
    if (col !== 0) y -= 42;
  };

  section("Identité de l'élève");
  field("Nom", s.lastName.toUpperCase(), 0);
  field("Prénom", s.firstName, 1);
  field("Date de naissance", fmtDateFull(s.birthDate), 0);
  field("Lieu de naissance", s.birthPlace ?? "", 1);
  field("Sexe", s.sex ? SEX_LABEL_LONG[s.sex] : "", 0);
  field("Date d'inscription", fmtDateFull(s.registeredAt), 1);

  y -= 8;
  section("Coordonnées");
  field("Adresse", s.address ?? "", "full");
  field("Téléphone de l'élève", s.phone ?? "", 0);
  field("Adresse e-mail", s.email, 1);

  y -= 8;
  section("Parent / tuteur");
  field("Nom du parent ou tuteur", s.parentName ?? "", 0);
  field("Téléphone du parent", s.parentPhone ?? "", 1);

  y -= 8;
  section("Scolarité");
  field("Classe", s.classeName, 0);
  field("Année scolaire", s.year, 1);
  field("Nomenclature", s.nomenclature, "full");

  // ── Signatures
  const sy = 130;
  text("Signature du parent ou tuteur", M, sy, 9, font, GREY);
  page.drawLine({ start: { x: M, y: sy - 46 }, end: { x: M + colW, y: sy - 46 }, thickness: 0.8, color: GREY });
  text("Cachet et signature de l'établissement", M + colW + 24, sy, 9, font, GREY);
  page.drawLine({ start: { x: M + colW + 24, y: sy - 46 }, end: { x: W - M, y: sy - 46 }, thickness: 0.8, color: GREY });

  const foot = `Document généré le ${fmtDateFull(new Date())} — Gestion scolaire`;
  text(foot, W / 2 - font.widthOfTextAtSize(safe(foot), 8) / 2, 34, 8, font, GREY);

  return pdf.save();
}
