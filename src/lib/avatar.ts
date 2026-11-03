/**
 * Avatars par défaut des élèves (fichiers dans /public/avatars).
 * Le choix est déterministe : un même élève garde toujours le même avatar.
 */
export const AVATARS = {
  F: ["/avatars/avatar2.png", "/avatars/avatar3.png"],
  M: ["/avatars/avatar4.png", "/avatars/avatar5.png"],
} as const;

const ALL = [...AVATARS.F, ...AVATARS.M];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Avatar selon le sexe de l'élève (tous les avatars si le sexe n'est pas renseigné). */
export function defaultAvatarUrl(sex: "M" | "F" | null | undefined, seed: string): string {
  const pool = sex ? AVATARS[sex] : ALL;
  return pool[hash(seed) % pool.length];
}

/** Photo de l'élève, ou son avatar par défaut. */
export function studentImageUrl(s: { id: string; sex: "M" | "F" | null; photoUrl: string | null }): string {
  return s.photoUrl ?? defaultAvatarUrl(s.sex, s.id);
}
