import "./globals.css";
export const metadata = { title: "Gestion École" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="mg"><body>{children}</body></html>);
}
