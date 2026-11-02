import "./globals.css";

export const metadata = {
  title: "Gestion Scolaire",
  description: "Application de gestion d'établissement scolaire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
