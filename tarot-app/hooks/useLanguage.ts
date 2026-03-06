import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Language, TarotData } from "../types/tarot";

// Import tarot data
import enData from "../data/en-tarot-template.json";
import trData from "../data/tr-tarot-template.json";
import deData from "../data/de-tarot-template.json";
import esData from "../data/es-tarot-template.json";

const tarotDataMap: Record<Language, TarotData> = {
  en: enData as TarotData,
  tr: trData as TarotData,
  de: deData as TarotData,
  es: esData as TarotData,
};

export function useLanguage() {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(
    (i18n.language as Language) || "en"
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      i18n.changeLanguage(lang);
      setLanguageState(lang);
    },
    [i18n]
  );

  const tarotData = tarotDataMap[language];

  return {
    language,
    setLanguage,
    tarotData,
  };
}
