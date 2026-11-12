// Stockage des images envoyées (serveur uniquement)
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 Mo
const NAME_RE = /^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/;

export const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif",
};

// Détecte le vrai type d'après les premiers octets (le type MIME du client est falsifiable)
function sniff(b: Buffer): "png" | "jpg" | "webp" | "gif" | null {
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.length > 6 && ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6))) return "gif";
  return null;
}

export async function saveImage(file: File): Promise<{ name?: string; error?: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image trop lourde (2 Mo maximum)" };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: "Format invalide (PNG, JPG, WEBP ou GIF)" };
  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return { name };
}

export async function removeImage(name?: string | null) {
  if (!name || !NAME_RE.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

export async function readImage(name: string) {
  if (!NAME_RE.test(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}
