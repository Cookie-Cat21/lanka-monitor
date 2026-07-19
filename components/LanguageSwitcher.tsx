"use client";

import { useEffect, useState } from "react";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "si", label: "සිං" },
  { code: "ta", label: "தமி" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

const STORAGE_KEY = "lm_locale";

function getStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(STORAGE_KEY);
  return (LOCALES.find((l) => l.code === v)?.code ?? "en") as LocaleCode;
}

/**
 * Compact EN/සිං/தமி switcher.
 * Persists choice to localStorage and updates the <html lang> attribute so
 * Noto Sans Sinhala / Tamil fonts activate via the font variables set in layout.
 */
export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<LocaleCode>("en");

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  function choose(code: LocaleCode) {
    setLocale(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code === "si" ? "si" : code === "ta" ? "ta" : "en";
  }

  return (
    <div
      role="group"
      aria-label="Interface language"
      className="flex items-center gap-0.5 rounded-lg border border-panel-edge bg-ink/60 p-0.5"
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => choose(code)}
          aria-pressed={locale === code}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 ${
            locale === code
              ? "bg-panel text-zinc-100"
              : "text-text-dim hover:text-zinc-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
