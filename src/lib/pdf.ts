import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Row = Record<string, any>;

function fmtDate(v: any): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(v: any): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("fr-MG", { style: "currency", currency: "MGA", maximumFractionDigits: 0 }).format(n);
}

function header(doc: jsPDF, title: string) {
  doc.setFillColor(67, 56, 202); // indigo-600
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Gestion RH — Entreprise", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 20);
  doc.setTextColor(30, 41, 59);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Généré le ${new Date().toLocaleString("fr-FR")} — Page ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 7,
      { align: "center" },
    );
  }
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(67, 56, 202);
  doc.text(text, 14, y);
  doc.setDrawColor(199, 210, 254);
  doc.setLineWidth(0.4);
  doc.line(14, y + 1.5, 196, y + 1.5);
  return y + 8;
}

function kv(doc: jsPDF, y: number, label: string, value: string, xLabel = 14, xValue = 70): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(label, xLabel, y);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  const lines = doc.splitTextToSize(String(value ?? "—"), 120);
  doc.text(lines, xValue, y);
  return y + Math.max(6, lines.length * 4.5);
}

export function generateEmployePdf(row: Row, relations?: Record<string, { value: string; label: string }[]>) {
  const doc = new jsPDF();
  header(doc, "Fiche employé");

  let y = 38;
  y = sectionTitle(doc, y, "Identité");

  const nomComplet = `${row.prenom ?? ""} ${row.nom ?? ""}`.trim();
  y = kv(doc, y, "Nom complet", nomComplet || "—");
  y = kv(doc, y, "Matricule", row.matricule ?? "—");
  y = kv(doc, y, "Email", row.email ?? "—");
  y = kv(doc, y, "Téléphone", row.telephone ?? "—");
  y = kv(doc, y, "Sexe", row.sexe === "M" ? "Masculin" : row.sexe === "F" ? "Féminin" : "—");
  y = kv(doc, y, "Date de naissance", fmtDate(row.dateNaissance));
  y = kv(doc, y, "Adresse", row.adresse ?? "—");

  y += 4;
  y = sectionTitle(doc, y, "Situation professionnelle");
  const posteLabel =
    relations?.postes?.find((o) => o.value === String(row.posteId))?.label ??
    (row.poste?.intitule ?? "—");
  y = kv(doc, y, "Poste", posteLabel);
  y = kv(doc, y, "Statut", String(row.statut ?? "—").replace(/_/g, " "));
  y = kv(doc, y, "Date d'embauche", fmtDate(row.dateEmbauche));

  footer(doc);
  doc.save(`employe-${row.matricule || row.id}.pdf`);
}

export function generateContratPdf(row: Row, relations?: Record<string, { value: string; label: string }[]>) {
  const doc = new jsPDF();
  header(doc, "Détail du contrat");

  let y = 38;
  y = sectionTitle(doc, y, "Employé");
  const empLabel =
    relations?.employes?.find((o) => o.value === String(row.employeId))?.label ??
    (row.employe ? `${row.employe.nom} ${row.employe.prenom} (${row.employe.matricule})` : "—");
  y = kv(doc, y, "Employé", empLabel);

  y += 4;
  y = sectionTitle(doc, y, "Contrat");
  y = kv(doc, y, "Type de contrat", String(row.typeContrat ?? "—"));
  y = kv(doc, y, "Date de début", fmtDate(row.dateDebut));
  y = kv(doc, y, "Date de fin", row.dateFin ? fmtDate(row.dateFin) : "Indéterminée (CDI)");
  y = kv(doc, y, "Salaire actuel", fmtMoney(row.salaireActuel));

  footer(doc);
  doc.save(`contrat-${row.id}.pdf`);
}

export function generateCongePdf(row: Row, relations?: Record<string, { value: string; label: string }[]>) {
  const doc = new jsPDF();
  header(doc, "Fiche de congé");

  let y = 38;
  y = sectionTitle(doc, y, "Employé");
  const empLabel =
    relations?.employes?.find((o) => o.value === String(row.employeId))?.label ??
    (row.employe ? `${row.employe.nom} ${row.employe.prenom} (${row.employe.matricule})` : "—");
  y = kv(doc, y, "Employé", empLabel);

  y += 4;
  y = sectionTitle(doc, y, "Congé / Absence");
  const typeMap: Record<string, string> = {
    CONGE_PAYE: "Congé payé",
    MALADIE: "Maladie",
    MATERNITE: "Maternité",
    SANS_SOLDE: "Sans solde",
  };
  const statutMap: Record<string, string> = {
    EN_ATTENTE: "En attente",
    APPROUVE: "Approuvé",
    REFUSE: "Refusé",
  };
  y = kv(doc, y, "Type de congé", typeMap[row.typeConge] ?? String(row.typeConge ?? "—"));
  y = kv(doc, y, "Date de début", fmtDate(row.dateDebut));
  y = kv(doc, y, "Date de fin", fmtDate(row.dateFin));
  y = kv(doc, y, "Statut", statutMap[row.statut] ?? String(row.statut ?? "—"));
  if (row.motif) {
    y = kv(doc, y, "Motif", row.motif);
  }

  // Signature box
  y += 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(14, y, 80, 28);
  doc.rect(110, y, 80, 28);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Signature de l'employé", 16, y + 6);
  doc.text("Visa RH / Direction", 112, y + 6);

  footer(doc);
  doc.save(`conge-${row.id}.pdf`);
}

export function generateSanctionPdf(row: Row, relations?: Record<string, { value: string; label: string }[]>) {
  const doc = new jsPDF();
  header(doc, "Fiche de sanction / avertissement");

  let y = 38;
  y = sectionTitle(doc, y, "Employé");
  const empLabel =
    relations?.employes?.find((o) => o.value === String(row.employeId))?.label ??
    (row.employe ? `${row.employe.nom} ${row.employe.prenom} (${row.employe.matricule})` : "—");
  y = kv(doc, y, "Employé", empLabel);

  y += 4;
  y = sectionTitle(doc, y, "Sanction");
  const typeMap: Record<string, string> = {
    AVERTISSEMENT_ORAL: "Avertissement oral",
    AVERTISSEMENT_ECRIT: "Avertissement écrit",
    BLAME: "Blâme",
    MISE_A_PIED: "Mise à pied",
    RETENUE_SALAIRE: "Retenue sur salaire",
  };
  y = kv(doc, y, "Type", typeMap[row.type] ?? String(row.type ?? "—"));
  y = kv(doc, y, "Date", fmtDate(row.date));
  y = kv(doc, y, "Motif", row.motif ?? "—");
  y = kv(doc, y, "Statut", row.statut === "LEVE" ? "Levé" : "Actif");
  if (row.description) {
    y = kv(doc, y, "Description", row.description);
  }

  footer(doc);
  doc.save(`sanction-${row.id}.pdf`);
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function generatePaiePdf(row: Row, relations?: Record<string, { value: string; label: string }[]>) {
  const doc = new jsPDF();
  header(doc, "Bulletin de paie");

  let y = 38;
  y = sectionTitle(doc, y, "Employé");
  const empLabel =
    relations?.employes?.find((o) => o.value === String(row.employeId))?.label ??
    (row.employe ? `${row.employe.nom} ${row.employe.prenom} (${row.employe.matricule})` : "—");
  y = kv(doc, y, "Employé", empLabel);

  y += 4;
  y = sectionTitle(doc, y, "Période");
  const moisNum = Number(row.mois);
  const anneeLabel =
    relations?.annees?.find((o) => o.value === String(row.anneeId))?.label ??
    (row.annee?.annee != null ? String(row.annee.annee) : "—");
  y = kv(doc, y, "Mois", MOIS[moisNum - 1] ?? String(row.mois ?? "—"));
  y = kv(doc, y, "Année", anneeLabel);
  y = kv(doc, y, "Date de paiement", fmtDate(row.datePaiement));

  y += 4;
  y = sectionTitle(doc, y, "Rémunération");
  y = kv(doc, y, "Primes", fmtMoney(row.primes ?? 0));
  y = kv(doc, y, "Déductions", fmtMoney(row.deductions ?? 0));
  y = kv(doc, y, "Salaire net", fmtMoney(row.salaireNet));

  footer(doc);
  doc.save(`paie-${row.id}.pdf`);
}

// ───────────── Exports de tableaux (PDF paysage) ─────────────

const fmtShort = (v: any): string => {
  if (!v) return "—";
  const [y, m, d] = String(v).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const fmtDays = (n: number) => `${String(n).replace(".", ",")} j`;

const TABLE_STYLE = {
  styles: { fontSize: 9, cellPadding: 2.5, textColor: [30, 41, 59] as [number, number, number] },
  headStyles: { fillColor: [67, 56, 202] as [number, number, number], textColor: 255 },
  alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  margin: { left: 14, right: 14 },
};

const SANCTION_TYPES: Record<string, string> = {
  AVERTISSEMENT_ORAL: "Avertissement oral",
  AVERTISSEMENT_ECRIT: "Avertissement écrit",
  BLAME: "Blâme",
  MISE_A_PIED: "Mise à pied",
  RETENUE_SALAIRE: "Retenue sur salaire",
};

export function generateSanctionsListPdf(rows: Row[], q?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(doc, "Sanctions & Avertissements");

  const actives = rows.filter((r) => r.statut === "ACTIF").length;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${rows.length} enregistrement(s) dont ${actives} actif(s)${q ? ` — recherche : « ${q} »` : ""}`,
    14,
    36,
  );

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 40,
    head: [["Employé", "Type", "Date", "Motif", "Statut"]],
    body: rows.map((r) => [
      r.employe ? `${r.employe.prenom} ${r.employe.nom} (${r.employe.matricule})` : "—",
      SANCTION_TYPES[r.type] ?? String(r.type ?? "—"),
      fmtShort(r.date),
      r.motif ?? "—",
      r.statut === "LEVE" ? "Levé" : "Actif",
    ]),
  });

  footer(doc);
  doc.save("sanctions-avertissements.pdf");
}

export type SoldeRow = {
  nom: string;
  matricule: string;
  statut: string;
  dateEmbauche: string;
  mois: number;
  acquis: number;
  pris: number;
  enAttente: number;
  solde: number;
};

export function generateSoldesCongesPdf(rows: SoldeRow[], joursParMois: number) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(doc, "Soldes de congés");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${String(joursParMois).replace(".", ",")} jours acquis par mois de service — seuls les congés payés approuvés sont déduits.`,
    14,
    36,
  );

  const statutMap: Record<string, string> = {
    ACTIF: "Actif", EN_CONGE: "En congé", LICENCIE: "Licencié", DEMISSIONNAIRE: "Démissionnaire",
  };

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 40,
    head: [["Employé", "Statut", "Embauche", "Mois", "Acquis", "Pris", "En attente", "Solde"]],
    body: rows.map((r) => [
      `${r.nom} (${r.matricule})`,
      statutMap[r.statut] ?? r.statut,
      fmtShort(r.dateEmbauche),
      String(r.mois),
      fmtDays(r.acquis),
      fmtDays(r.pris),
      r.enAttente > 0 ? fmtDays(r.enAttente) : "—",
      fmtDays(r.solde),
    ]),
    columnStyles: {
      3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" },
      6: { halign: "right" }, 7: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (d) => {
      // Solde négatif en rouge
      if (d.section === "body" && d.column.index === 7 && rows[d.row.index]?.solde < 0) {
        d.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  footer(doc);
  doc.save("soldes-conges.pdf");
}

export function generatePaiesListPdf(rows: Row[], q?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(doc, "Paies");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${rows.length} enregistrement(s)${q ? ` — recherche : « ${q} »` : ""}`,
    14,
    36,
  );

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 40,
    head: [["Employé", "Mois", "Année", "Salaire net", "Primes", "Déductions", "Date paiement"]],
    body: rows.map((r) => {
      const emp = r.employe
        ? `${r.employe.prenom} ${r.employe.nom} (${r.employe.matricule})`
        : "—";
      const moisNum = Number(r.mois);
      const anneeLabel = r.annee?.annee != null ? String(r.annee.annee) : "—";
      return [
        emp,
        MOIS[moisNum - 1] ?? String(r.mois ?? "—"),
        anneeLabel,
        fmtMoney(r.salaireNet),
        fmtMoney(r.primes ?? 0),
        fmtMoney(r.deductions ?? 0),
        fmtShort(r.datePaiement),
      ];
    }),
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  footer(doc);
  doc.save("paies.pdf");
}

// ───────────── Employés & Prime d'ancienneté ─────────────

const STATUT_EMPLOYE: Record<string, string> = {
  ACTIF: "Actif", EN_CONGE: "En congé", LICENCIE: "Licencié", DEMISSIONNAIRE: "Démissionnaire",
};

export function generateEmployesListPdf(rows: Row[], q?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(doc, "Employés");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${rows.length} employé(s)${q ? ` — recherche : « ${q} »` : ""}`, 14, 36);

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 40,
    head: [["Nom & Prénom", "Matricule", "Poste", "Statut", "Email", "Téléphone", "Embauche"]],
    body: rows.map((r) => [
      `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "—",
      r.matricule ?? "—",
      r.poste?.intitule ?? "—",
      STATUT_EMPLOYE[r.statut] ?? String(r.statut ?? "—"),
      r.email ?? "—",
      r.telephone ?? "—",
      fmtShort(r.dateEmbauche),
    ]),
  });

  footer(doc);
  doc.save("employes.pdf");
}

export type PrimeRow = {
  nom: string;
  matricule: string;
  statut: string;
  dateEmbauche: string;
  annees: number;
  base: number | null;
  pourcentage: number | null;
  prime: number | null;
  total: number | null;
};

export function generatePrimeAnciennetePdf(rows: PrimeRow[], taux: number, q?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(doc, "Prime d'ancienneté");

  const totalPrimes = rows.reduce((t, r) => t + (r.prime ?? 0), 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${String(taux).replace(".", ",")} % du salaire de base par année complète — ${rows.length} employé(s) — total des primes : ${fmtMoney(totalPrimes)} / mois${q ? ` — recherche : « ${q} »` : ""}`,
    14,
    36,
  );

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 40,
    head: [["Employé", "Embauche", "Ancienneté", "Salaire de base", "Majoration", "Prime / mois", "Salaire avec prime"]],
    body: rows.map((r) => [
      `${r.nom} (${r.matricule})`,
      fmtShort(r.dateEmbauche),
      `${r.annees} an${r.annees > 1 ? "s" : ""}`,
      r.base !== null ? fmtMoney(r.base) : "Aucun contrat actif",
      r.pourcentage !== null ? `+${String(r.pourcentage).replace(".", ",")} %` : "—",
      r.prime !== null ? fmtMoney(r.prime) : "—",
      r.total !== null ? fmtMoney(r.total) : "—",
    ]),
    columnStyles: {
      2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" },
      5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" },
    },
  });

  footer(doc);
  doc.save("prime-anciennete.pdf");
}
