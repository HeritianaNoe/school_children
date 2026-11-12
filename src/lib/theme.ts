export type ThemeId = "defaut" | "gris" | "vert" | "rouge";

/** `navy` / `primary` / `soft` ne servent qu'à l'aperçu de la page Paramètres > Apparence. */
export const THEMES: { id: ThemeId; label: string; hint: string; navy: string; primary: string; soft: string }[] = [
  { id: "defaut", label: "Par défaut", hint: "Bleu et marine", navy: "#0f172a", primary: "#1d4ed8", soft: "#eef4ff" },
  { id: "gris", label: "Gris foncé", hint: "Sobre et neutre", navy: "#1f2328", primary: "#374151", soft: "#f1f2f4" },
  { id: "vert", label: "Vert foncé", hint: "Calme et naturel", navy: "#0a2416", primary: "#166534", soft: "#ecf8f0" },
  { id: "rouge", label: "Rouge foncé", hint: "Chaleureux et marqué", navy: "#2a0d0d", primary: "#991b1b", soft: "#fdeeee" },
];

export const THEME_STORAGE_KEY = "ecole-theme";

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === "defaut") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
}
