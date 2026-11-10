import Icon from "./Icons";

/**
 * Lien de téléchargement PDF : même icône et même aspect partout dans l'application
 * (le bouton de tableau `TablePdfButton` utilise la même icône « fileText »).
 */
export default function PdfLink({
  href,
  label = "PDF",
  title = "Télécharger en PDF",
  small = false,
}: {
  href: string;
  label?: string;
  title?: string;
  small?: boolean;
}) {
  return (
    <a href={href} className={small ? "btn btn-sm" : "btn"} title={title}>
      <Icon name="fileText" size={small ? 15 : 16} />
      {label}
    </a>
  );
}
