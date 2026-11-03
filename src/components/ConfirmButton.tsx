"use client";

import type { ReactNode } from "react";

/** Bouton de soumission qui demande une confirmation avant d'envoyer le formulaire. */
export default function ConfirmButton({
  message,
  children,
  className = "btn-danger btn-sm",
  disabled,
  form,
  title,
}: {
  message: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  form?: string;
  title?: string;
}) {
  return (
    <button
      type="submit"
      form={form}
      className={className}
      disabled={disabled}
      title={title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
