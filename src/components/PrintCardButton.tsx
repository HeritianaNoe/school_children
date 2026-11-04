"use client";

import { useRef } from "react";

/** Imprime uniquement la carte (`.card`) qui contient le bouton. */
export default function PrintCardButton({
  label = "Imprimer",
  className = "btn",
}: {
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const print = () => {
    const card = ref.current?.closest(".card");
    if (!card) return window.print();
    const root = document.documentElement;
    const cleanup = () => {
      card.classList.remove("print-target");
      root.classList.remove("print-one");
      window.removeEventListener("afterprint", cleanup);
    };
    card.classList.add("print-target");
    root.classList.add("print-one");
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return (
    <button ref={ref} type="button" className={className} onClick={print}>
      {label}
    </button>
  );
}
