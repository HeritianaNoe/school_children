"use client";

import Icon from "./Icons";

/** Impression / enregistrement en PDF via le navigateur. Même icône « fileText » que les autres boutons PDF. */
export default function PrintButton({ label = "Imprimer / PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      <Icon name="fileText" size={16} />
      {label}
    </button>
  );
}
