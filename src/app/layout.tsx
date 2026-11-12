import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";
export const metadata = {
  title: "École lumière",
  description: "Application de gestion d'établissement scolaire — École lumière",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
