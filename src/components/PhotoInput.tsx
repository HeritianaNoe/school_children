"use client";

import { useState } from "react";

const MAX = 2 * 1024 * 1024;

/** Sélection de la photo d'identité avec aperçu et contrôle du format (JPG/PNG) et de la taille (2 Mo). */
export default function PhotoInput({
  currentUrl,
  fallbackUrl,
  label = "Photo de l'élève",
}: {
  currentUrl?: string | null;
  /** Avatar par défaut affiché tant qu'aucune photo n'est choisie */
  fallbackUrl?: string | null;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const shown = preview ?? currentUrl ?? fallbackUrl ?? null;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="Aperçu de la photo" className="photo-preview" />
      ) : (
        <div className="photo-preview photo-empty">Photo</div>
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        <label>
          {label} (JPG ou PNG, 2 Mo maximum)
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) {
                setPreview(null);
                setError("");
                return;
              }
              if (!["image/jpeg", "image/png"].includes(f.type)) {
                setError("Format non pris en charge : choisissez une image JPG ou PNG.");
              } else if (f.size > MAX) {
                setError("La photo dépasse 2 Mo : choisissez une image plus légère.");
              } else {
                setError("");
                setPreview(URL.createObjectURL(f));
                return;
              }
              e.target.value = "";
              setPreview(null);
            }}
          />
        </label>
        {!currentUrl && !preview && (
          <p className="muted" style={{ marginTop: 8 }}>
            Sans photo, un avatar par défaut est utilisé.
          </p>
        )}
        {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
