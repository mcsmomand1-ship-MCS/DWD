import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContextCore";

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("language") === "fa" ? "fa" : "en";
    } catch {
      return "en";
    }
  });

  const setLang = useCallback((value) => {
    const next = typeof value === "function" ? value(lang) : value;
    const normalized = next === "fa" ? "fa" : "en";
    localStorage.setItem("language", normalized);
    setLangState(normalized);
  }, [lang]);

  useEffect(() => {
    const direction = lang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "fa" ? "prs" : "en";
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.documentElement.classList.toggle("rtl", lang === "fa");
    document.documentElement.classList.toggle("ltr", lang !== "fa");
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
