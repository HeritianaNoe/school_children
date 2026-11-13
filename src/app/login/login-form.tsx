"use client";

import { useEffect, useRef } from "react";

export default function LoginForm({ error }: { error?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function clearForm() {
    formRef.current?.reset();
    if (emailRef.current) emailRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
  }

  useEffect(() => {
    clearForm();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) clearForm();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      clearForm();
    };
  }, []);

  // Après une erreur, vider le mot de passe
  useEffect(() => {
    if (error && passwordRef.current) passwordRef.current.value = "";
  }, [error]);

  return (
    <form ref={formRef} action="/api/auth/login" method="post" className="form-grid" autoComplete="off">
      <label>
        Adresse e-mail
        <input
          ref={emailRef}
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="prenom.nom@ecole.mg"
          defaultValue=""
        />
      </label>
      <label>
        Mot de passe
        <input
          ref={passwordRef}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          defaultValue=""
        />
      </label>
      <button type="submit" style={{ width: "100%", marginTop: 4 }}>
        Se connecter
      </button>
    </form>
  );
}
