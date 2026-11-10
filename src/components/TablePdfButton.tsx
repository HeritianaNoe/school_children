"use client";

import { useState } from "react";
import Icon from "./Icons";

type Props = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  filename?: string;
};

/** Télécharge le contenu complet du tableau (toutes les pages) au format PDF. Généré dans le navigateur. */
export default function TablePdfButton({ title, subtitle, headers, rows, filename }: Props) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { buildTablePdf } = await import("@/lib/table-pdf");
      const bytes = await buildTablePdf({ title, subtitle, headers, rows });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = (filename ?? title)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      a.href = url;
      a.download = `${slug || "tableau"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="btn btn-sm" onClick={download} disabled={busy} title="Télécharger le tableau en PDF">
      <Icon name="fileText" size={15} />
      {busy ? "PDF…" : "PDF"}
    </button>
  );
}
