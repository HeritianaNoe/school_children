import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Script inline placé dans <head> : applique le thème enregistré avant le rendu (évite le flash). */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='gris'||t==='vert'||t==='rouge'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
