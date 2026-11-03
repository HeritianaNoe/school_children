import type { ErrKey } from "./messages";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 Mo

export type PhotoResult =
  | { ok: true; empty: true }
  | { ok: true; empty: false; data: Buffer; mime: "image/jpeg" | "image/png" }
  | { ok: false; key: ErrKey };

/** Lit et valide la photo envoyée (JPG/PNG, 2 Mo max). Le type est détecté d'après le contenu du fichier. */
export async function readPhoto(fd: FormData, field = "photo"): Promise<PhotoResult> {
  const v = fd.get(field);
  if (!v || typeof v === "string" || v.size === 0) return { ok: true, empty: true };
  if (v.size > MAX_PHOTO_BYTES) return { ok: false, key: "photo_too_big" };

  const data = Buffer.from(await v.arrayBuffer());
  const isJpeg = data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const isPng =
    data.length > 8 &&
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isJpeg && !isPng) return { ok: false, key: "photo_invalid" };
  return { ok: true, empty: false, data, mime: isPng ? "image/png" : "image/jpeg" };
}
