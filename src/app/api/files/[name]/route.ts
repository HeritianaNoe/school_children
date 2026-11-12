import { MIME, readImage } from "@/lib/uploads";

// Sert les photos envoyées (public/uploads) : le middleware exige déjà d'être connecté.
// Une route est nécessaire car `next start` ne sert pas les fichiers ajoutés dans public/ après le build.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const data = await readImage(name);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[name.split(".").pop()!] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
