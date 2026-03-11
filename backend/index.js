require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Import language-specific prompts
const { getSystemMessage, buildSinglePrompt, buildPpfPrompt, buildYesNoPrompt, buildSoaPrompt, buildDestinysEmbracePrompt, buildLoveChoicePrompt, buildPathToLovePrompt, buildNewMoonPrompt, buildFullMoonPrompt, buildMbsPrompt, buildCelestialPrompt, buildCareerClarityPrompt, buildCareerPathGuidePrompt, buildNewBusinessPrompt, buildWealthFlowPrompt, getNatalPrompts } = require("./prompts");

const app = express();
app.use(cors());
app.use(express.json());

const logsDir = path.join(__dirname, "data");
const logsFilePath = path.join(logsDir, "premium-readings.json");

// Data folder base path
const dataBasePath = path.join(__dirname, "../tarot-app/data");
const backendDataPath = path.join(__dirname, "data");

// ============================================
// CARD DATA - byKey INDEX (cardKey based)
// ============================================

const supportedLanguages = ['tr', 'en', 'de', 'es'];

// Load tarot-template.json per language and create byKey index
const templateByLang = {};
const cardsByKey = {}; // Master index: cardKey -> card data (per language)

supportedLanguages.forEach(lang => {
  const templatePath = path.join(backendDataPath, lang, "tarot-template.json");
  try {
    const data = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    templateByLang[lang] = data;
    
    // Create byKey index for this language
    cardsByKey[lang] = {};
    data.cards.forEach(card => {
      const cardKey = card.image; // image field = cardKey
      cardsByKey[lang][cardKey] = card;
    });
    
    console.log(`✓ Loaded ${lang}/tarot-template.json (${data.cards.length} cards, byKey indexed)`);
  } catch (e) {
    console.warn(`✗ Could not load ${lang}/tarot-template.json:`, e.message);
  }
});

// Get card by cardKey
const getCardByKey = (cardKey, language = 'tr') => {
  return cardsByKey[language]?.[cardKey] || cardsByKey.tr?.[cardKey] || null;
};

// Get all cardKeys from template (canonical list)
const getCanonicalCardKeys = () => {
  const trTemplate = templateByLang.tr;
  if (!trTemplate) return [];
  return trTemplate.cards.map(card => card.image);
};

// ============================================
// DRIFT CHECKER - Verify data consistency
// ============================================

const runDriftChecker = () => {
  console.log('\n--- Drift Checker ---');
  const canonicalKeys = new Set(getCanonicalCardKeys());
  let hasErrors = false;
  
  // Check tendency.map.json for each language
  supportedLanguages.forEach(lang => {
    const tendencyData = tendencyMapByLang[lang];
    if (!tendencyData) {
      console.warn(`⚠️  ${lang}/tendency.map.json not loaded`);
      hasErrors = true;
      return;
    }
    
    const tendencyKeys = Object.keys(tendencyData).filter(k => !k.startsWith('_'));
    const missingInTendency = [...canonicalKeys].filter(k => !tendencyKeys.includes(k));
    const extraInTendency = tendencyKeys.filter(k => !canonicalKeys.has(k));
    
    if (missingInTendency.length > 0) {
      console.warn(`⚠️  ${lang}/tendency.map.json missing ${missingInTendency.length} keys`);
      hasErrors = true;
    }
    if (extraInTendency.length > 0) {
      console.warn(`⚠️  ${lang}/tendency.map.json has ${extraInTendency.length} extra keys`);
      hasErrors = true;
    }
  });
  
  // Check yesno-clarity.json for each language
  supportedLanguages.forEach(lang => {
    const clarityData = yesNoClarityByLangV2[lang];
    if (!clarityData) return;
    
    const clarityKeys = Object.keys(clarityData).filter(k => !k.startsWith('_'));
    const missingInClarity = [...canonicalKeys].filter(k => !clarityKeys.includes(k));
    const extraInClarity = clarityKeys.filter(k => !canonicalKeys.has(k));
    
    if (missingInClarity.length > 0) {
      console.warn(`⚠️  ${lang}/yesno-clarity.json missing ${missingInClarity.length} keys`);
      hasErrors = true;
    }
    if (extraInClarity.length > 0) {
      console.warn(`⚠️  ${lang}/yesno-clarity.json has ${extraInClarity.length} extra keys`);
      hasErrors = true;
    }
  });
  
  // Log impact distribution (using EN as reference, normalized values)
  const enTendencies = tendencyMapByLang.en || {};
  const tendencyKeys = Object.keys(enTendencies).filter(k => !k.startsWith('_'));
  const impactDist = { low: 0, standard: 0, high: 0 };
  const reversalStyleDist = { delay: 0, internal: 0, shadow: 0, imbalance: 0, blocked: 0 };
  
  tendencyKeys.forEach(key => {
    const tendency = enTendencies[key];
    if (tendency?.orientationImpact) {
      impactDist[tendency.orientationImpact] = (impactDist[tendency.orientationImpact] || 0) + 1;
    }
    if (tendency?.reversalStyle) {
      reversalStyleDist[tendency.reversalStyle] = (reversalStyleDist[tendency.reversalStyle] || 0) + 1;
    }
  });
  
  console.log(`📊 Impact distribution: low=${impactDist.low} | standard=${impactDist.standard} | high=${impactDist.high}`);
  console.log(`📊 ReversalStyle: delay=${reversalStyleDist.delay} | internal=${reversalStyleDist.internal} | shadow=${reversalStyleDist.shadow} | imbalance=${reversalStyleDist.imbalance} | blocked=${reversalStyleDist.blocked}`);
  
  if (!hasErrors) {
    console.log('✅ All cardKeys consistent across all data files!');
  }
  console.log('');
  
  return !hasErrors;
};

// ============================================
// YES/NO SYSTEM v2.0 - cardKey based
// ============================================

// Load tendency.map.json per language (cardKey based)
const tendencyMapByLang = {};
supportedLanguages.forEach(lang => {
  const tendencyPath = path.join(backendDataPath, lang, "tendency.map.json");
  try {
    tendencyMapByLang[lang] = JSON.parse(fs.readFileSync(tendencyPath, "utf8"));
    console.log(`✓ Loaded ${lang}/tendency.map.json (${Object.keys(tendencyMapByLang[lang]).length} cards)`);
  } catch (e) {
    console.warn(`✗ Could not load ${lang}/tendency.map.json:`, e.message);
  }
});

// Backward compatibility alias
const yesNoTendencies = tendencyMapByLang.en || {};

// Load yesno-clarity.json per language (cardKey based)
const yesNoClarityByLangV2 = {};
const clarityLanguages = ['tr', 'en', 'de', 'es'];

clarityLanguages.forEach(lang => {
  const clarityPath = path.join(backendDataPath, lang, "yesno-clarity.json");
  try {
    yesNoClarityByLangV2[lang] = JSON.parse(fs.readFileSync(clarityPath, "utf8"));
    console.log(`✓ Loaded ${lang}/yesno-clarity.json (cardKey based)`);
  } catch (e) {
    // Silent - file may not exist yet for this language
  }
});

// Fallback to TR if language not found
const yesNoClarity = yesNoClarityByLangV2.tr || {};

// Language-specific value mappings for tendency logic
const tendencyValueMaps = {
  baseTendency: {
    // Maps all language values to canonical EN values for logic
    'yes': 'yes', 'evet': 'yes', 'ja': 'yes', 'sí': 'yes',
    'strong_yes': 'strong_yes', 'güçlü_evet': 'strong_yes', 'stark_ja': 'strong_yes', 'fuerte_sí': 'strong_yes',
    'no': 'no', 'hayır': 'no', 'nein': 'no',
    'strong_no': 'strong_no', 'güçlü_hayır': 'strong_no', 'stark_nein': 'strong_no', 'fuerte_no': 'strong_no',
    'uncertain': 'uncertain', 'belirsiz': 'uncertain', 'unsicher': 'uncertain', 'incierto': 'uncertain'
  },
  orientationImpact: {
    'low': 'low', 'düşük': 'low', 'niedrig': 'low', 'bajo': 'low',
    'standard': 'standard', 'standart': 'standard', 'estándar': 'standard',
    'high': 'high', 'yüksek': 'high', 'hoch': 'high', 'alto': 'high'
  },
  reversalStyle: {
    'delay': 'delay', 'gecikme': 'delay', 'verzögerung': 'delay', 'retraso': 'delay',
    'internal': 'internal', 'içsel': 'internal', 'innerlich': 'internal', 'interno': 'internal',
    'shadow': 'shadow', 'gölge': 'shadow', 'schatten': 'shadow', 'sombra': 'shadow',
    'imbalance': 'imbalance', 'dengesizlik': 'imbalance', 'ungleichgewicht': 'imbalance', 'desequilibrio': 'imbalance',
    'blocked': 'blocked', 'tıkanık': 'blocked', 'blockiert': 'blocked', 'bloqueado': 'blocked'
  }
};

// Normalize tendency value to canonical EN
const normalizeTendencyValue = (value, type) => {
  return tendencyValueMaps[type]?.[value] || value;
};

// Get tendency data by cardKey (with language support)
const getYesNoTendency = (cardKey, language = 'en') => {
  const langMap = tendencyMapByLang[language] || tendencyMapByLang.en || {};
  return langMap[cardKey] || { baseTendency: "uncertain", orientationImpact: "standard", reversalStyle: "internal" };
};

// Get clarity data by cardKey (with language support)
const getYesNoClarityByKey = (cardKey, language = 'tr') => {
  const langClarity = yesNoClarityByLangV2[language] || yesNoClarityByLangV2.tr || {};
  return langClarity[cardKey] || { clarityWeight: 10, keywords: { general: ["enerji", "işaret"] } };
};

// Convert 5-level baseTendency to 3-level UI answer (handles all languages)
const tendencyToAnswer = (baseTendency) => {
  const normalized = normalizeTendencyValue(baseTendency, 'baseTendency');
  if (normalized === "strong_yes" || normalized === "yes") return "yes";
  if (normalized === "strong_no" || normalized === "no") return "no";
  return "uncertain";
};

// Calculate confidence with cardKey-based logic (handles all languages)
const calculateConfidenceV2 = (cardKey, orientation, language = 'en') => {
  const tendency = getYesNoTendency(cardKey, language);
  const clarityData = getYesNoClarityByKey(cardKey, language);
  
  // Normalize orientationImpact to canonical EN value
  const normalizedImpact = normalizeTendencyValue(tendency.orientationImpact, 'orientationImpact');
  
  // Impact-based modifier (low: -8, standard: -12, high: -18)
  const impactModifiers = { low: -8, standard: -12, high: -18 };
  const baseModifier = impactModifiers[normalizedImpact] || -12;
  
  // Upright: +8, Reversed: negative based on impact
  const orientationMod = orientation === "upright" ? 8 : baseModifier;
  const base = 55 + (clarityData.clarityWeight || 10) + orientationMod;
  
  // Normalize baseTendency to check if uncertain
  const normalizedTendency = normalizeTendencyValue(tendency.baseTendency, 'baseTendency');
  
  // Uncertain: 40-75, others: 45-90
  if (normalizedTendency === "uncertain") {
    return Math.min(75, Math.max(40, base));
  }
  return Math.min(90, Math.max(45, base));
};

// Get clarity label based on confidence
const getClarityLabel = (confidence, language) => {
  const labels = {
    tr: { high: "Net", medium: "Şartlı", low: "Belirsiz" },
    en: { high: "Clear", medium: "Conditional", low: "Uncertain" },
    de: { high: "Klar", medium: "Bedingt", low: "Unsicher" },
    es: { high: "Claro", medium: "Condicional", low: "Incierto" }
  };
  
  const lang = labels[language] || labels.en;
  if (confidence >= 75) return lang.high;
  if (confidence >= 55) return lang.medium;
  return lang.low;
};

// Get shortReason from clarity data (by cardKey and language)
const getShortReason = (cardKey, language, orientation) => {
  // Try language-specific clarity file first
  const langClarity = yesNoClarityByLangV2[language];
  if (langClarity?.[cardKey]?.shortReason?.[orientation]) {
    return langClarity[cardKey].shortReason[orientation];
  }
  // Fallback to Turkish
  const trClarity = yesNoClarityByLangV2.tr;
  if (trClarity?.[cardKey]?.shortReason?.[orientation]) {
    return trClarity[cardKey].shortReason[orientation];
  }
  return null;
};

// Legacy data for backward compatibility (will be removed later)
const yesNoClarityByLang = {};
const yesNoAnswersByLang = {};
// Note: supportedLanguages already declared above

// Get clarity data for a specific language (fallback to TR then EN)
const getYesNoClarityData = (language, cardName) => {
  if (yesNoClarityByLang[language] && yesNoClarityByLang[language][cardName]) {
    return yesNoClarityByLang[language][cardName];
  }
  if (yesNoClarityByLang.en && yesNoClarityByLang.en[cardName]) {
    return yesNoClarityByLang.en[cardName];
  }
  return null;
};

// Get Yes/No answer based on card, orientation and language
const getYesNoAnswer = (language, cardName, orientation) => {
  const langAnswers = yesNoAnswersByLang[language] || yesNoAnswersByLang.en;
  if (langAnswers && langAnswers[cardName] && langAnswers[cardName][orientation]) {
    return langAnswers[cardName][orientation];
  }
  // Fallback to simple rule (should not happen if data is correct)
  console.warn(`Answer not found for: ${language}/${cardName}/${orientation}`);
  return orientation === "upright" ? "yes" : "no";
};

const ensureLogsFile = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify([], null, 2), "utf8");
  }
};

const appendLog = (entry) => {
  ensureLogsFile();
  const raw = fs.readFileSync(logsFilePath, "utf8");
  const logs = raw ? JSON.parse(raw) : [];
  logs.push(entry);
  fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2), "utf8");
};

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageProfiles = {
  tr: {
    code: "tr",
    nativeName: "Türkçe",
    singleLabel: "Tek Kart",
    threeLabel: "Üç Kart",
    yesNoLabel: "Evet / Hayır",
    soaLabel: "Durum/Engel/Tavsiye",
    destinysEmbraceLabel: "Kaderin Kucağı",
    loveChoiceLabel: "Aşk Seçimi",
    pathToLoveLabel: "Aşka Giden Yol",
    newMoonLabel: "Yeni Ay Ritüeli",
    fullMoonLabel: "Dolunay Arınması",
    mbsLabel: "Zihin · Beden · Ruh",
    celestialLabel: "Kozmik Aydınlanma",
    careerClarityLabel: "Kariyer Netliği",
    careerPathGuideLabel: "Kariyer Yol Haritası",
    newBusinessLabel: "Yeni İş Keşfi",
    wealthFlowLabel: "Finansal Akış",
    tone: "Modern, psikolojik ve yüzleştirici yaz. Kısa ve net cümleler kur.",
    address: "Tüm metin 'sen' diliyle yazılacak. 'siz' kullanma.",
    singleRules:
      "Her zaman hem nextStep (1 cümle) hem journal (1 soru) üret. focusArea dışındaki alanlardan bahsetme. nextStep emir kipinde tek aksiyon olsun. journal tek soru işareti ile bitsin.",
    orientation: { upright: "Düz", reversed: "Ters" },
    yesNoAnswer: { yes: "Evet", no: "Hayır", uncertain: "Belirsiz" },
    clarityLabel: { high: "Net", medium: "Şartlı", low: "Belirsiz" },
    conditionMessage: "Koşullara göre netleşir",
  },
  en: {
    code: "en",
    nativeName: "English",
    singleLabel: "Single Card",
    threeLabel: "Three Cards",
    yesNoLabel: "Yes / No",
    soaLabel: "Situation/Obstacle/Advice",
    destinysEmbraceLabel: "Destiny's Embrace",
    loveChoiceLabel: "Love Choice",
    pathToLoveLabel: "Path to Love",
    newMoonLabel: "New Moon Ritual",
    fullMoonLabel: "Full Moon Release",
    mbsLabel: "Mind · Body · Spirit",
    celestialLabel: "Celestial Illumination",
    careerClarityLabel: "Career Clarity",
    careerPathGuideLabel: "Career Path Guide",
    newBusinessLabel: "New Business Exploration",
    wealthFlowLabel: "Wealth Flow",
    tone: "Write in a modern, direct, practical tone. Short, clear sentences.",
    address: "Use a direct 'you' voice throughout.",
    singleRules:
      "Always include nextStep (1 sentence) and journal (1 question). Do not mention areas outside focusArea. nextStep must be an imperative single action. journal must end with a single question mark.",
    orientation: { upright: "Upright", reversed: "Reversed" },
    yesNoAnswer: { yes: "Yes", no: "No", uncertain: "Uncertain" },
    clarityLabel: { high: "Clear", medium: "Conditional", low: "Uncertain" },
    conditionMessage: "May change depending on conditions",
  },
  de: {
    code: "de",
    nativeName: "Deutsch",
    singleLabel: "Einzelkarte",
    threeLabel: "Drei Karten",
    yesNoLabel: "Ja / Nein",
    soaLabel: "Situation/Hindernis/Rat",
    destinysEmbraceLabel: "Umarmung des Schicksals",
    loveChoiceLabel: "Liebeswahl",
    pathToLoveLabel: "Weg zur Liebe",
    newMoonLabel: "Neumond-Ritual",
    fullMoonLabel: "Vollmond-Freigabe",
    mbsLabel: "Geist · Körper · Seele",
    celestialLabel: "Himmlische Erleuchtung",
    careerClarityLabel: "Karriere-Klarheit",
    careerPathGuideLabel: "Karriere-Wegweiser",
    newBusinessLabel: "Neue Geschäftserkundung",
    wealthFlowLabel: "Vermögensfluss",
    tone: "Schreibe modern, klar und psychologisch präzise. Kurze Sätze.",
    address: "Direkte Anrede in der Du-Form.",
    singleRules:
      "Erzeuge immer nextStep (1 Satz) und journal (1 Frage). Sprich nur über focusArea. nextStep als klarer Imperativ mit einer Aktion. journal endet mit genau einem Fragezeichen.",
    orientation: { upright: "Aufrecht", reversed: "Umgekehrt" },
    yesNoAnswer: { yes: "Ja", no: "Nein", uncertain: "Unsicher" },
    clarityLabel: { high: "Klar", medium: "Bedingt", low: "Unsicher" },
    conditionMessage: "Kann sich je nach Bedingungen ändern",
  },
  es: {
    code: "es",
    nativeName: "Español",
    singleLabel: "Una carta",
    threeLabel: "Tres cartas",
    yesNoLabel: "Sí / No",
    soaLabel: "Situación/Obstáculo/Consejo",
    destinysEmbraceLabel: "Abrazo del Destino",
    loveChoiceLabel: "Elección de Amor",
    pathToLoveLabel: "Camino al Amor",
    newMoonLabel: "Ritual de Luna Nueva",
    fullMoonLabel: "Liberación de Luna Llena",
    mbsLabel: "Mente · Cuerpo · Espíritu",
    celestialLabel: "Iluminación Celestial",
    careerClarityLabel: "Claridad Profesional",
    careerPathGuideLabel: "Guía de Carrera",
    newBusinessLabel: "Exploración de Nuevo Negocio",
    wealthFlowLabel: "Flujo de Riqueza",
    tone: "Escribe con un tono moderno, directo y psicológico. Frases cortas.",
    address: "Usa la segunda persona (tú) en todo el texto.",
    singleRules:
      "Incluye siempre nextStep (1 frase) y journal (1 pregunta). No menciones áreas fuera de focusArea. nextStep debe ser un imperativo con una sola acción. journal termina con un solo signo de interrogación.",
    orientation: { upright: "Derecha", reversed: "Invertida" },
    yesNoAnswer: { yes: "Sí", no: "No", uncertain: "Incierto" },
    clarityLabel: { high: "Claro", medium: "Condicional", low: "Incierto" },
    conditionMessage: "Puede cambiar según las condiciones",
  },
};

const allowedFocusAreas = ["general", "love", "career", "spiritual"];
const allowedLanguages = ["tr", "en", "de", "es"];

// Prompts are now in separate files: backend/prompts/{tr,en,de,es}.js

// Calculate confidence for Yes/No (deterministic)
// clarityWeight tüm dillerde aynı
const calculateConfidence = (language, cardName, orientation) => {
  const clarityData = getYesNoClarityData(language, cardName) || { clarityWeight: 10 };
  const base = 55;
  const orientationAdj = orientation === "upright" ? 5 : -5;
  return Math.min(90, Math.max(55, base + clarityData.clarityWeight + orientationAdj));
};

// Get keywords for Yes/No explanation (fallback when shortReason not available)
const getYesNoKeywords = (cardName, language, focusArea) => {
  const clarityData = getYesNoClarityData(language, cardName);
  if (!clarityData || !clarityData.keywords) {
    return ["enerji", "işaret"];
  }
  return clarityData.keywords[focusArea] || clarityData.keywords.general || ["enerji", "işaret"];
};

// FREE Yes/No explanation templates (deterministic fallback)
const yesNoFreeTemplates = {
  tr: {
    upright: (kw1, kw2) => `Kart dik geldiği için yanıt Evet. ${kw1}, ${kw2} teması öne çıkıyor.`,
    reversed: (kw1, kw2) => `Kart ters geldiği için yanıt Hayır. ${kw1}, ${kw2} konusunda dikkat gerekiyor.`
  },
  en: {
    upright: (kw1, kw2) => `Card is upright, the answer is Yes. ${kw1}, ${kw2} theme emerges.`,
    reversed: (kw1, kw2) => `Card is reversed, the answer is No. Caution needed regarding ${kw1}, ${kw2}.`
  },
  de: {
    upright: (kw1, kw2) => `Die Karte ist aufrecht, die Antwort ist Ja. ${kw1}, ${kw2} Thema tritt hervor.`,
    reversed: (kw1, kw2) => `Die Karte ist umgekehrt, die Antwort ist Nein. Vorsicht bei ${kw1}, ${kw2}.`
  },
  es: {
    upright: (kw1, kw2) => `La carta está derecha, la respuesta es Sí. El tema de ${kw1}, ${kw2} emerge.`,
    reversed: (kw1, kw2) => `La carta está invertida, la respuesta es No. Precaución con ${kw1}, ${kw2}.`
  }
};

// System messages are now in separate files: backend/prompts/{tr,en,de,es}.js

const splitSentences = (text) => {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (!matches) {
    return [text.trim()].filter(Boolean);
  }
  return matches.map((s) => s.trim()).filter(Boolean);
};

const clampStory = (story) => {
  const sentences = splitSentences(story);
  if (sentences.length > 6) {
    return sentences.slice(0, 6).join(" ");
  }
  return story;
};

const detectJsonWrapperWarns = (content) => {
  const warns = [];
  const trimmed = (content || "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    warns.push("jsonNotTightBraces");
  }
  if (/here\s+is\s+the\s+json/i.test(trimmed) || /aşağıdaki\s+json/i.test(trimmed)) {
    warns.push("jsonWrapperText");
  }
  return warns;
};

const getQuestionMarkCount = (text) => (text.match(/\?/g) || []).length;

const journalWarns = (journal) => {
  const warns = [];
  const t = (journal || "").trim();
  if (!t) return ["journalEmpty"];
  if (!t.endsWith("?")) warns.push("journalNotEndingQuestionMark");
  const qCount = getQuestionMarkCount(t);
  if (qCount !== 1) warns.push(`journalQuestionMarkCount:${qCount}`);
  return warns;
};

const nextStepWarns = (nextStep) => {
  const warns = [];
  const t = (nextStep || "").trim();
  if (!t) return ["nextStepEmpty"];
  const sentenceCount = splitSentences(t).length;
  if (sentenceCount > 1) warns.push("nextStepMultiSentence");
  if (/[;,]/.test(t) || /\b(and|then|sonra|ve)\b/i.test(t)) {
    warns.push("nextStepMayBeMultiAction");
  }
  return warns;
};

const focusLeakWarns = ({ focusArea, text }) => {
  const warns = [];
  const t = (text || "").toLowerCase();
  const leakTerms = {
    love: ["love", "relationship", "partner", "aşk", "ilişki", "romantik", "liebe", "beziehung", "amor", "relación"],
    career: ["career", "job", "work", "kariyer", "iş", "meslek", "beruf", "arbeit", "carrera", "trabajo"],
    spiritual: ["spiritual", "soul", "inner", "ruhsal", "ruh", "içsel", "spirituell", "seele", "espiritual", "alma", "meditasyon", "farkındalık"],
  };
  ["love", "career", "spiritual"].forEach((area) => {
    if (area === focusArea) return;
    if (leakTerms[area].some((w) => t.includes(w))) {
      warns.push(`focusLeak:${area}`);
    }
  });
  return warns;
};

const validateSingle = (data) => {
  const required = ["title", "overall", "focusArea", "deepDive", "shadow", "nextStep", "journal"];
  if (!data || typeof data !== "object") return false;
  for (const key of required) {
    if (typeof data[key] !== "string" || !data[key].trim()) return false;
  }
  if (!data.journal.trim().endsWith("?")) return false;
  if (getQuestionMarkCount(data.journal.trim()) !== 1) return false;
  if (splitSentences(data.nextStep).length > 1) return false;
  return ["general", "love", "career", "spiritual"].includes(data.focusArea);
};

const validatePpf = (data, profile) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "throughline", "story", "beats", "choice", "keywords", "mood", "nextStep"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.throughline !== "string" || !data.throughline.trim()) return false;
  if (typeof data.story !== "string" || !data.story.trim()) return false;
  if (typeof data.mood !== "string" || !data.mood.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["past", "present", "future"].every((k) => typeof data.beats[k] === "string")) return false;
  if (!data.choice || typeof data.choice !== "object") return false;
  if (!["pathA", "pathB"].every((k) => typeof data.choice[k] === "string")) return false;
  if (!Array.isArray(data.keywords) || data.keywords.length !== 3) return false;
  if (!data.keywords.every((k) => typeof k === "string" && k.trim())) return false;
  if (/\s/.test(data.mood.trim())) return false;

  const sentenceCount = splitSentences(data.story).length;
  if (sentenceCount < 4) return false;
  return true;
};

const validateSoa = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "beats", "nextStep"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["situation", "obstacle", "advice"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  return true;
};

const validateDestinysEmbrace = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "beats", "nextStep", "keywords"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["destiny", "path", "union"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  if (!Array.isArray(data.keywords) || data.keywords.length !== 3) return false;
  if (!data.keywords.every((k) => typeof k === "string" && k.trim())) return false;

  return true;
};

const validateLoveChoice = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "beats", "decisionLens", "nextStep", "keywords"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.decisionLens !== "string" || !data.decisionLens.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  // 5 kart: optionA, optionA_outcome, optionB, optionB_outcome, advice
  if (!["optionA", "optionA_outcome", "optionB", "optionB_outcome", "advice"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  if (!Array.isArray(data.keywords) || data.keywords.length !== 3) return false;
  if (!data.keywords.every((k) => typeof k === "string" && k.trim())) return false;

  return true;
};

const validatePathToLove = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "beats", "strategy", "nextStep", "keywords"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.strategy !== "string" || !data.strategy.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  // 5 kart: self, block, need, action, potential
  if (!["self", "block", "need", "action", "potential"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  if (!Array.isArray(data.keywords) || data.keywords.length !== 3) return false;
  if (!data.keywords.every((k) => typeof k === "string" && k.trim())) return false;

  return true;
};

// ============================================
// SPIRITUAL SPREAD VALIDATORS
// ============================================

const validateNewMoon = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "ritualTheme", "beats", "affirmation", "nextStep", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.ritualTheme !== "string" || !data.ritualTheme.trim()) return false;
  if (typeof data.affirmation !== "string" || !data.affirmation.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["intention", "seed", "shadow", "support", "firstStep"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  return true;
};

const validateFullMoon = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "releaseTheme", "beats", "cleansingAdvice", "affirmation", "nextStep", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.releaseTheme !== "string" || !data.releaseTheme.trim()) return false;
  if (typeof data.cleansingAdvice !== "string" || !data.cleansingAdvice.trim()) return false;
  if (typeof data.affirmation !== "string" || !data.affirmation.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["illumination", "tension", "lesson", "release", "integration"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  return true;
};

const validateMbs = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "harmonyScore", "beats", "alignmentAdvice", "nextStep", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.harmonyScore !== "number" || data.harmonyScore < 0 || data.harmonyScore > 100) return false;
  if (typeof data.alignmentAdvice !== "string" || !data.alignmentAdvice.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["mind", "body", "spirit"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  return true;
};

const validateCelestial = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "celestialMessage", "beats", "omenKeywords", "nextStep", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.celestialMessage !== "string" || !data.celestialMessage.trim()) return false;
  if (typeof data.nextStep !== "string" || !data.nextStep.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["signal", "guidance", "integration"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  if (!Array.isArray(data.omenKeywords) || data.omenKeywords.length !== 3) return false;
  if (!data.omenKeywords.every((k) => typeof k === "string" && k.trim())) return false;

  return true;
};

// ============================================
// CAREER SPREAD VALIDATORS
// ============================================

const validateCareerClarity = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "throughline", "directionHint", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.throughline !== "string" || !data.throughline.trim()) return false;
  if (typeof data.directionHint !== "string" || !data.directionHint.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  return true;
};

const validateCareerPathGuide = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "beats", "directionHint", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.directionHint !== "string" || !data.directionHint.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  if (!data.beats || typeof data.beats !== "object") return false;
  if (!["strength", "opportunity", "direction"].every((k) => typeof data.beats[k] === "string" && data.beats[k].trim())) return false;

  return true;
};

const validateNewBusiness = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "strategy", "riskNote", "directionHint", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.strategy !== "string" || !data.strategy.trim()) return false;
  if (typeof data.riskNote !== "string" || !data.riskNote.trim()) return false;
  if (typeof data.directionHint !== "string" || !data.directionHint.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  return true;
};

const validateWealthFlow = (data) => {
  if (!data || typeof data !== "object") return false;
  const required = ["title", "overall", "flowInsight", "optimization", "directionHint", "journal"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) return false;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.overall !== "string" || !data.overall.trim()) return false;
  if (typeof data.flowInsight !== "string" || !data.flowInsight.trim()) return false;
  if (typeof data.optimization !== "string" || !data.optimization.trim()) return false;
  if (typeof data.directionHint !== "string" || !data.directionHint.trim()) return false;
  if (typeof data.journal !== "string" || !data.journal.trim()) return false;
  if (!data.journal.trim().endsWith("?")) return false;

  return true;
};

const parseJsonFromContent = (content) => {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : content;
  return JSON.parse(raw);
};

app.post("/api/reading", async (req, res) => {
  try {
    const { language, spread, card, cards } = req.body;
    
    // Debug log
    console.log("=== API REQUEST ===");
    console.log("Spread:", spread);
    console.log("Language:", language);
    console.log("Cards:", cards ? cards.length : "undefined");
    if (cards) {
      console.log("Card positions:", cards.map(c => c.position));
    }
    
    // Strict language validation
    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        error: "Invalid language",
        message: `Language must be one of: ${allowedLanguages.join(", ")}`,
        received: language,
      });
    }
    
    const profile = languageProfiles[language];
    const requestedFocusArea =
      (spread === "single_card" || spread === "yes_no") ? req.body.focusArea : null;
    const focusArea = allowedFocusAreas.includes(requestedFocusArea)
      ? requestedFocusArea
      : "general";
    
    // Gemstone-based premium: isPremium from body OR spread requires gems
    const deviceId = req.body.deviceId;
    const requestedPremium = req.body.isPremium === true;
    const isFreeSpread = isFreeTarotSpread(spread);
    
    // If premium requested (GPT yorum), check gemstone
    let isPremium = requestedPremium;
    if (isPremium && deviceId) {
      const gemCost = getSpreadGemCost(spread);
      const user = getSharedUser(deviceId);
      if (user.gemstoneBalance < gemCost) {
        return res.status(402).json({
          error: "INSUFFICIENT_GEMSTONES",
          message: "Yetersiz gemstone bakiyesi.",
          required: gemCost,
          balance: user.gemstoneBalance,
          spread,
        });
      }
      // Debit gemstones
      updateSharedUser(deviceId, { gemstoneBalance: user.gemstoneBalance - gemCost });
      console.log(`💎 Tarot [${spread}] -${gemCost}gs — ${deviceId.substring(0, 12)}...`);
    }
    
    // 3-5 kart spread'ler: gemstone zorunlu (FREE erisim yok)
    if (!isFreeSpread && !isPremium) {
      return res.status(403).json({
        error: "PREMIUM_REQUIRED",
        message: "Bu açılım için gemstone gereklidir.",
        spread,
        requiredGems: getSpreadGemCost(spread),
      });
    }
    
    // YES/NO SPREAD HANDLER - v2.0 (cardKey based)
    if (spread === "yes_no" && card) {
      // cardKey = image field from card data (e.g., "19_sun", "00_fool")
      const cardKey = card.image || card.cardKey || "";
      
      // v2: Get answer from baseTendency (independent of orientation)
      const tendency = getYesNoTendency(cardKey, language);
      const answer = tendencyToAnswer(tendency.baseTendency);
      
      // v2: Calculate confidence with orientation impact
      const confidence = calculateConfidenceV2(cardKey, card.orientation, language);
      const clarityLabel = getClarityLabel(confidence, language);
      
      const orientationLabel = card.orientation === "upright" 
        ? profile.orientation.upright 
        : profile.orientation.reversed;
      
      // Get clarity data for keywords and shortReason
      const clarityData = getYesNoClarityByKey(cardKey, language);
      const keywords = clarityData?.keywords?.[focusArea] || clarityData?.keywords?.general || [];
      
      // FREE: Deterministic response
      if (!isPremium) {
        // Get shortReason from cardKey-based clarity data
        let explanation = getShortReason(cardKey, language, card.orientation);
        
        if (!explanation) {
          // Fallback: Use legacy system or template
          const legacyClarityData = getYesNoClarityData(language, card.name);
          if (legacyClarityData?.shortReason?.[card.orientation]) {
            explanation = legacyClarityData.shortReason[card.orientation];
          } else {
            const kw = keywords.length >= 2 ? keywords : ["enerji", "işaret"];
            const template = yesNoFreeTemplates[language] || yesNoFreeTemplates.en;
            explanation = template[card.orientation](kw[0], kw[1]);
          }
        }
        
        const freeResponse = {
          title: `${card.name} — ${profile.yesNoLabel}`,
          focusArea,
          answer,
          confidence,
          clarityLabel,
          explanation,
          keywords,
          // v2: Additional info for UI
          baseTendency: tendency.baseTendency,
          answerMayChange: answer === "uncertain",
          conditionMessage: answer === "uncertain" ? profile.conditionMessage : null,
        };
        
        appendLog({
          timestamp: new Date().toISOString(),
          type: "yes_no_free_v2",
          language,
          focusArea,
          card: { name: card.name, image: cardKey, orientation: card.orientation },
          tendency: tendency.baseTendency,
          response: freeResponse,
        });
        
        return res.json(freeResponse);
      }
      
      // PREMIUM: GPT call for explanation
      const yesNoPrompt = buildYesNoPrompt(language, {
        profile,
        cardName: card.name,
        orientationLabel,
        focusArea,
        answer,
        confidence,
        clarityLabel,
        baseTendency: tendency.baseTendency,
        reversalStyle: card.orientation === "reversed" ? (tendency.reversalStyle || "internal") : null,
      });
      
      try {
        const systemMessage = getSystemMessage(language);
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: yesNoPrompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });
        
        const content = completion.choices[0]?.message?.content || "";
        const parsed = parseJsonFromContent(content);
        
        const premiumResponse = {
          title: `${card.name} — ${profile.yesNoLabel}`,
          focusArea,
          answer,
          confidence,
          clarityLabel,
          explanation: parsed.explanation || "No explanation available.",
          keywords,
          baseTendency: tendency.baseTendency,
          answerMayChange: answer === "uncertain",
          conditionMessage: answer === "uncertain" ? profile.conditionMessage : null,
        };
        
        appendLog({
          timestamp: new Date().toISOString(),
          type: "yes_no_premium_v2",
          language,
          focusArea,
          card: { name: card.name, image: cardKey, orientation: card.orientation },
          tendency: tendency.baseTendency,
          prompt: yesNoPrompt,
          rawResponse: content,
          response: premiumResponse,
        });
        
        return res.json(premiumResponse);
      } catch (error) {
        console.error("Yes/No Premium error:", error);
        // Fallback to FREE response on error
        let explanation = getShortReason(cardKey, language, card.orientation);
        if (!explanation) {
          const kw = keywords.length >= 2 ? keywords : ["enerji", "işaret"];
          const template = yesNoFreeTemplates[language] || yesNoFreeTemplates.en;
          explanation = template[card.orientation](kw[0], kw[1]);
        }
        
        return res.json({
          title: `${card.name} — ${profile.yesNoLabel}`,
          focusArea,
          answer,
          confidence,
          clarityLabel,
          explanation,
          keywords,
          baseTendency: tendency.baseTendency,
          answerMayChange: answer === "uncertain",
          conditionMessage: answer === "uncertain" ? profile.conditionMessage : null,
        });
      }
    }
    
    const structureId = spread === "single_card" ? "single_v15_minimal" : "ppf_v15_story";

    let prompt = "";

    // Helper to get reversalStyle for a card (normalized to EN)
    const getReversalStyleForCard = (cardObj) => {
      if (!cardObj || cardObj.orientation !== "reversed") return null;
      const cardKey = cardObj.image || cardObj.cardKey;
      const tendency = getYesNoTendency(cardKey, language);
      const reversalStyle = tendency.reversalStyle || "internal";
      return normalizeTendencyValue(reversalStyle, 'reversalStyle');
    };

    if (spread === "single_card" && card) {
      const orientationLabel =
        card.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      prompt = buildSinglePrompt(language, {
        profile,
        cardName: card.name,
        orientationLabel,
        focusArea,
        reversalStyle: getReversalStyleForCard(card),
      });
    } else if (spread === "past_present_future" && cards) {
      const past = cards.find((c) => c.position === "past");
      const present = cards.find((c) => c.position === "present");
      const future = cards.find((c) => c.position === "future");

      const pastOrientation =
        past?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const presentOrientation =
        present?.orientation === "upright"
          ? profile.orientation.upright
          : profile.orientation.reversed;
      const futureOrientation =
        future?.orientation === "upright"
          ? profile.orientation.upright
          : profile.orientation.reversed;

      prompt = buildPpfPrompt(language, {
        profile,
        pastCard: past?.name || "?",
        presentCard: present?.name || "?",
        futureCard: future?.name || "?",
        pastOrientation,
        presentOrientation,
        futureOrientation,
        pastReversalStyle: getReversalStyleForCard(past),
        presentReversalStyle: getReversalStyleForCard(present),
        futureReversalStyle: getReversalStyleForCard(future),
      });
    } else if (spread === "situation_obstacle_advice" && cards) {
      // SOA SPREAD HANDLER
      const situation = cards.find((c) => c.position === "situation");
      const obstacle = cards.find((c) => c.position === "obstacle");
      const advice = cards.find((c) => c.position === "advice");

      const situationOrientation =
        situation?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const obstacleOrientation =
        obstacle?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const adviceOrientation =
        advice?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildSoaPrompt(language, {
        profile,
        situationCard: situation?.name || "?",
        obstacleCard: obstacle?.name || "?",
        adviceCard: advice?.name || "?",
        situationOrientation,
        obstacleOrientation,
        adviceOrientation,
        situationReversalStyle: getReversalStyleForCard(situation),
        obstacleReversalStyle: getReversalStyleForCard(obstacle),
        adviceReversalStyle: getReversalStyleForCard(advice),
      });
    } else if (spread === "destinys_embrace" && cards) {
      // DESTINY'S EMBRACE HANDLER
      const destiny = cards.find((c) => c.position === "destiny");
      const path = cards.find((c) => c.position === "path");
      const union = cards.find((c) => c.position === "union");

      const destinyOrientation =
        destiny?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const pathOrientation =
        path?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const unionOrientation =
        union?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildDestinysEmbracePrompt(language, {
        profile,
        destinyCard: destiny?.name || "?",
        pathCard: path?.name || "?",
        unionCard: union?.name || "?",
        destinyOrientation,
        pathOrientation,
        unionOrientation,
        destinyReversalStyle: getReversalStyleForCard(destiny),
        pathReversalStyle: getReversalStyleForCard(path),
        unionReversalStyle: getReversalStyleForCard(union),
      });
    } else if (spread === "love_choice" && cards) {
      // LOVE CHOICE HANDLER - 5 cards
      const optionA = cards.find((c) => c.position === "optionA");
      const optionAOutcome = cards.find((c) => c.position === "optionA_outcome");
      const optionB = cards.find((c) => c.position === "optionB");
      const optionBOutcome = cards.find((c) => c.position === "optionB_outcome");
      const advice = cards.find((c) => c.position === "advice");

      const optionAOrientation =
        optionA?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const optionAOutcomeOrientation =
        optionAOutcome?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const optionBOrientation =
        optionB?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const optionBOutcomeOrientation =
        optionBOutcome?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const adviceOrientation =
        advice?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildLoveChoicePrompt(language, {
        profile,
        optionACard: optionA?.name || "?",
        optionAOutcomeCard: optionAOutcome?.name || "?",
        optionBCard: optionB?.name || "?",
        optionBOutcomeCard: optionBOutcome?.name || "?",
        adviceCard: advice?.name || "?",
        optionAOrientation,
        optionAOutcomeOrientation,
        optionBOrientation,
        optionBOutcomeOrientation,
        adviceOrientation,
        optionAReversalStyle: getReversalStyleForCard(optionA),
        optionAOutcomeReversalStyle: getReversalStyleForCard(optionAOutcome),
        optionBReversalStyle: getReversalStyleForCard(optionB),
        optionBOutcomeReversalStyle: getReversalStyleForCard(optionBOutcome),
        adviceReversalStyle: getReversalStyleForCard(advice),
      });
    } else if (spread === "path_to_love" && cards) {
      // PATH TO LOVE HANDLER - 5 cards
      const self = cards.find((c) => c.position === "self");
      const block = cards.find((c) => c.position === "block");
      const need = cards.find((c) => c.position === "need");
      const action = cards.find((c) => c.position === "action");
      const potential = cards.find((c) => c.position === "potential");

      const selfOrientation =
        self?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const blockOrientation =
        block?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const needOrientation =
        need?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const actionOrientation =
        action?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const potentialOrientation =
        potential?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildPathToLovePrompt(language, {
        profile,
        selfCard: self?.name || "?",
        blockCard: block?.name || "?",
        needCard: need?.name || "?",
        actionCard: action?.name || "?",
        potentialCard: potential?.name || "?",
        selfOrientation,
        blockOrientation,
        needOrientation,
        actionOrientation,
        potentialOrientation,
        selfReversalStyle: getReversalStyleForCard(self),
        blockReversalStyle: getReversalStyleForCard(block),
        needReversalStyle: getReversalStyleForCard(need),
        actionReversalStyle: getReversalStyleForCard(action),
        potentialReversalStyle: getReversalStyleForCard(potential),
      });
    } else if (spread === "new_moon_ritual" && cards) {
      // NEW MOON RITUAL HANDLER - 5 cards
      const intention = cards.find((c) => c.position === "intention");
      const seed = cards.find((c) => c.position === "seed");
      const shadow = cards.find((c) => c.position === "shadow");
      const support = cards.find((c) => c.position === "support");
      const firstStep = cards.find((c) => c.position === "firstStep");

      const intentionOrientation =
        intention?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const seedOrientation =
        seed?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const shadowOrientation =
        shadow?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const supportOrientation =
        support?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const firstStepOrientation =
        firstStep?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildNewMoonPrompt(language, {
        profile,
        intentionCard: intention?.name || "?",
        seedCard: seed?.name || "?",
        shadowCard: shadow?.name || "?",
        supportCard: support?.name || "?",
        firstStepCard: firstStep?.name || "?",
        intentionOrientation,
        seedOrientation,
        shadowOrientation,
        supportOrientation,
        firstStepOrientation,
        intentionReversalStyle: getReversalStyleForCard(intention),
        seedReversalStyle: getReversalStyleForCard(seed),
        shadowReversalStyle: getReversalStyleForCard(shadow),
        supportReversalStyle: getReversalStyleForCard(support),
        firstStepReversalStyle: getReversalStyleForCard(firstStep),
      });
    } else if (spread === "full_moon_release" && cards) {
      // FULL MOON RELEASE HANDLER - 5 cards
      const illumination = cards.find((c) => c.position === "illumination");
      const tension = cards.find((c) => c.position === "tension");
      const lesson = cards.find((c) => c.position === "lesson");
      const release = cards.find((c) => c.position === "release");
      const integration = cards.find((c) => c.position === "integration");

      const illuminationOrientation =
        illumination?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const tensionOrientation =
        tension?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const lessonOrientation =
        lesson?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const releaseOrientation =
        release?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const integrationOrientation =
        integration?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildFullMoonPrompt(language, {
        profile,
        illuminationCard: illumination?.name || "?",
        tensionCard: tension?.name || "?",
        lessonCard: lesson?.name || "?",
        releaseCard: release?.name || "?",
        integrationCard: integration?.name || "?",
        illuminationOrientation,
        tensionOrientation,
        lessonOrientation,
        releaseOrientation,
        integrationOrientation,
        illuminationReversalStyle: getReversalStyleForCard(illumination),
        tensionReversalStyle: getReversalStyleForCard(tension),
        lessonReversalStyle: getReversalStyleForCard(lesson),
        releaseReversalStyle: getReversalStyleForCard(release),
        integrationReversalStyle: getReversalStyleForCard(integration),
      });
    } else if (spread === "mind_body_spirit" && cards) {
      // MIND BODY SPIRIT HANDLER - 3 cards
      const mind = cards.find((c) => c.position === "mind");
      const body = cards.find((c) => c.position === "body");
      const spirit = cards.find((c) => c.position === "spirit");

      const mindOrientation =
        mind?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const bodyOrientation =
        body?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const spiritOrientation =
        spirit?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildMbsPrompt(language, {
        profile,
        mindCard: mind?.name || "?",
        bodyCard: body?.name || "?",
        spiritCard: spirit?.name || "?",
        mindOrientation,
        bodyOrientation,
        spiritOrientation,
        mindReversalStyle: getReversalStyleForCard(mind),
        bodyReversalStyle: getReversalStyleForCard(body),
        spiritReversalStyle: getReversalStyleForCard(spirit),
      });
    } else if (spread === "celestial_illumination" && cards) {
      // CELESTIAL ILLUMINATION HANDLER - 3 cards
      const signal = cards.find((c) => c.position === "signal");
      const guidance = cards.find((c) => c.position === "guidance");
      const integration = cards.find((c) => c.position === "integration");

      const signalOrientation =
        signal?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const guidanceOrientation =
        guidance?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const integrationOrientation =
        integration?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildCelestialPrompt(language, {
        profile,
        signalCard: signal?.name || "?",
        guidanceCard: guidance?.name || "?",
        integrationCard: integration?.name || "?",
        signalOrientation,
        guidanceOrientation,
        integrationOrientation,
        signalReversalStyle: getReversalStyleForCard(signal),
        guidanceReversalStyle: getReversalStyleForCard(guidance),
        integrationReversalStyle: getReversalStyleForCard(integration),
      });
    } else if (spread === "career_clarity" && cards) {
      // CAREER CLARITY HANDLER - 3 cards
      const current = cards.find((c) => c.position === "current");
      const challenge = cards.find((c) => c.position === "challenge");
      const clarity = cards.find((c) => c.position === "clarity");

      const currentOrientation =
        current?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const challengeOrientation =
        challenge?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const clarityOrientation =
        clarity?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildCareerClarityPrompt(language, {
        profile,
        currentCard: current?.name || "?",
        challengeCard: challenge?.name || "?",
        clarityCard: clarity?.name || "?",
        currentOrientation,
        challengeOrientation,
        clarityOrientation,
        currentReversalStyle: getReversalStyleForCard(current),
        challengeReversalStyle: getReversalStyleForCard(challenge),
        clarityReversalStyle: getReversalStyleForCard(clarity),
      });
    } else if (spread === "career_path_guide" && cards) {
      // CAREER PATH GUIDE HANDLER - 3 cards
      const strength = cards.find((c) => c.position === "strength");
      const opportunity = cards.find((c) => c.position === "opportunity");
      const direction = cards.find((c) => c.position === "direction");

      const strengthOrientation =
        strength?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const opportunityOrientation =
        opportunity?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const directionOrientation =
        direction?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildCareerPathGuidePrompt(language, {
        profile,
        strengthCard: strength?.name || "?",
        opportunityCard: opportunity?.name || "?",
        directionCard: direction?.name || "?",
        strengthOrientation,
        opportunityOrientation,
        directionOrientation,
        strengthReversalStyle: getReversalStyleForCard(strength),
        opportunityReversalStyle: getReversalStyleForCard(opportunity),
        directionReversalStyle: getReversalStyleForCard(direction),
      });
    } else if (spread === "new_business_exploration" && cards) {
      // NEW BUSINESS EXPLORATION HANDLER - 5 cards
      const idea = cards.find((c) => c.position === "idea");
      const foundation = cards.find((c) => c.position === "foundation");
      const challenge = cards.find((c) => c.position === "challenge");
      const opportunity = cards.find((c) => c.position === "opportunity");
      const shift = cards.find((c) => c.position === "shift");

      const ideaOrientation =
        idea?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const foundationOrientation =
        foundation?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const challengeOrientation =
        challenge?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const opportunityOrientation =
        opportunity?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const shiftOrientation =
        shift?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildNewBusinessPrompt(language, {
        profile,
        ideaCard: idea?.name || "?",
        foundationCard: foundation?.name || "?",
        challengeCard: challenge?.name || "?",
        opportunityCard: opportunity?.name || "?",
        shiftCard: shift?.name || "?",
        ideaOrientation,
        foundationOrientation,
        challengeOrientation,
        opportunityOrientation,
        shiftOrientation,
        ideaReversalStyle: getReversalStyleForCard(idea),
        foundationReversalStyle: getReversalStyleForCard(foundation),
        challengeReversalStyle: getReversalStyleForCard(challenge),
        opportunityReversalStyle: getReversalStyleForCard(opportunity),
        shiftReversalStyle: getReversalStyleForCard(shift),
      });
    } else if (spread === "wealth_flow" && cards) {
      // WEALTH FLOW HANDLER - 5 cards
      const income = cards.find((c) => c.position === "income");
      const block = cards.find((c) => c.position === "block");
      const resource = cards.find((c) => c.position === "resource");
      const growth = cards.find((c) => c.position === "growth");
      const balance = cards.find((c) => c.position === "balance");

      const incomeOrientation =
        income?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const blockOrientation =
        block?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const resourceOrientation =
        resource?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const growthOrientation =
        growth?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;
      const balanceOrientation =
        balance?.orientation === "upright" ? profile.orientation.upright : profile.orientation.reversed;

      prompt = buildWealthFlowPrompt(language, {
        profile,
        incomeCard: income?.name || "?",
        blockCard: block?.name || "?",
        resourceCard: resource?.name || "?",
        growthCard: growth?.name || "?",
        balanceCard: balance?.name || "?",
        incomeOrientation,
        blockOrientation,
        resourceOrientation,
        growthOrientation,
        balanceOrientation,
        incomeReversalStyle: getReversalStyleForCard(income),
        blockReversalStyle: getReversalStyleForCard(block),
        resourceReversalStyle: getReversalStyleForCard(resource),
        growthReversalStyle: getReversalStyleForCard(growth),
        balanceReversalStyle: getReversalStyleForCard(balance),
      });
    } else {
      return res.status(400).json({ error: "Invalid request" });
    }

    const callModel = async (systemMessage) => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });
      return completion.choices[0]?.message?.content || "";
    };

    const runAttempt = async (systemMessage) => {
      const content = await callModel(systemMessage);
      const parsed = parseJsonFromContent(content);
      if (spread === "past_present_future") {
        parsed.story = clampStory(parsed.story || "");
      }
      return { parsed, content };
    };

    let jsonResponse;
    let rawContent = "";
    const systemMessage = getSystemMessage(language);
    const retrySystemMessage = getSystemMessage(language, true);
    
    // Validation function based on spread type
    const getValidator = (spreadType) => {
      if (spreadType === "single_card") return validateSingle;
      if (spreadType === "situation_obstacle_advice") return validateSoa;
      if (spreadType === "destinys_embrace") return validateDestinysEmbrace;
      if (spreadType === "love_choice") return validateLoveChoice;
      if (spreadType === "path_to_love") return validatePathToLove;
      if (spreadType === "new_moon_ritual") return validateNewMoon;
      if (spreadType === "full_moon_release") return validateFullMoon;
      if (spreadType === "mind_body_spirit") return validateMbs;
      if (spreadType === "celestial_illumination") return validateCelestial;
      if (spreadType === "career_clarity") return validateCareerClarity;
      if (spreadType === "career_path_guide") return validateCareerPathGuide;
      if (spreadType === "new_business_exploration") return validateNewBusiness;
      if (spreadType === "wealth_flow") return validateWealthFlow;
      return (data) => validatePpf(data, profile);
    };

    try {
      const firstAttempt = await runAttempt(systemMessage);
      jsonResponse = firstAttempt.parsed;
      rawContent = firstAttempt.content;
      const validator = getValidator(spread);
      const valid = validator(jsonResponse);
      if (!valid) {
        const retryAttempt = await runAttempt(retrySystemMessage);
        jsonResponse = retryAttempt.parsed;
        rawContent = retryAttempt.content;
        const validRetry = validator(jsonResponse);
        if (!validRetry) {
          return res.status(500).json({ error: "Schema validation failed" });
        }
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const qualityWarns = [
      ...detectJsonWrapperWarns(rawContent),
    ];

    if (spread === "single_card") {
      qualityWarns.push(...journalWarns(jsonResponse.journal));
      qualityWarns.push(...nextStepWarns(jsonResponse.nextStep));
      const combinedText = [
        jsonResponse.overall,
        jsonResponse.deepDive,
        jsonResponse.shadow,
        jsonResponse.nextStep,
        jsonResponse.journal,
      ]
        .filter(Boolean)
        .join(" ");
      qualityWarns.push(...focusLeakWarns({ focusArea, text: combinedText }));
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      model: "gpt-4o",
      structureId,
      hasNextStep: spread === "single_card" ? Boolean(jsonResponse?.nextStep?.trim()) : null,
      hasJournal:
        spread === "single_card"
          ? Boolean(jsonResponse?.journal?.trim()) &&
            jsonResponse.journal.trim().endsWith("?")
          : null,
      qualityWarns: [...new Set(qualityWarns)],
      request: spread === "single_card"
        ? { language, spread, card, focusArea }
        : { language, spread, cards },
      response: jsonResponse,
    };

    if (spread === "single_card") {
      logEntry.focusArea = focusArea;
    }

    appendLog(logEntry);

    res.json(jsonResponse);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/logs/reset", (req, res) => {
  try {
    ensureLogsFile();
    fs.writeFileSync(logsFilePath, JSON.stringify([], null, 2), "utf8");
    res.json({ ok: true });
  } catch (error) {
    console.error("Reset logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FREE READING API - Deterministic readings
// ============================================

// Spread -> allowed focusAreas mapping
const spreadFocusMap = {
  single_card: ['general', 'love', 'career', 'spiritual'],
  yes_no: ['general', 'love', 'career', 'spiritual'],
  past_present_future: ['general'],
  situation_obstacle_advice: ['general'],
  destinys_embrace: ['love'],
  love_choice: ['love'],
  path_to_love: ['love'],
  career_clarity: ['career'],
  career_path_guide: ['career'],
  new_business_exploration: ['career'],
  wealth_flow: ['career'],
  new_moon_ritual: ['spiritual'],
  full_moon_release: ['spiritual'],
  mind_body_spirit: ['spiritual'],
  celestial_illumination: ['spiritual'],
};

// Spread -> required positions mapping
const spreadPositionMap = {
  single_card: [],
  yes_no: [],
  past_present_future: ['past', 'present', 'future'],
  situation_obstacle_advice: ['situation', 'obstacle', 'advice'],
  destinys_embrace: ['destiny', 'path', 'union'],
  love_choice: ['optionA', 'optionA_outcome', 'optionB', 'optionB_outcome', 'advice'],
  path_to_love: ['self', 'block', 'need', 'action', 'potential'],
  career_clarity: ['current', 'challenge', 'clarity'],
  career_path_guide: ['strength', 'opportunity', 'direction'],
  new_business_exploration: ['idea', 'foundation', 'challenge', 'opportunity', 'shift'],
  wealth_flow: ['income', 'block', 'resource', 'growth', 'balance'],
  new_moon_ritual: ['intention', 'seed', 'shadow', 'support', 'firstStep'],
  full_moon_release: ['illumination', 'tension', 'lesson', 'release', 'integration'],
  mind_body_spirit: ['mind', 'body', 'spirit'],
  celestial_illumination: ['signal', 'guidance', 'integration'],
};

// Validate spread request
const validateFreeRequest = (body) => {
  const warnings = [];
  const { language, spread, focusArea, cards } = body;
  
  // Validate language
  if (!supportedLanguages.includes(language)) {
    return { valid: false, error: `Invalid language: ${language}` };
  }
  
  // Validate spread
  if (!spreadFocusMap[spread]) {
    return { valid: false, error: `Invalid spread: ${spread}` };
  }
  
  // Validate focusArea (with fallback)
  const allowedFocus = spreadFocusMap[spread];
  let validFocusArea = focusArea;
  if (!allowedFocus.includes(focusArea)) {
    validFocusArea = allowedFocus[0]; // Default to first allowed
    warnings.push(`focusArea '${focusArea}' not allowed for ${spread}, defaulted to '${validFocusArea}'`);
  }
  
  // Validate cards array
  if (!Array.isArray(cards) || cards.length === 0) {
    return { valid: false, error: 'cards array is required' };
  }
  
  // Validate each card
  const requiredPositions = spreadPositionMap[spread];
  const canonicalKeys = getCanonicalCardKeys();
  
  for (const card of cards) {
    if (!card.cardKey && !card.image) {
      return { valid: false, error: 'Each card must have cardKey or image' };
    }
    
    const cardKey = card.cardKey || card.image;
    if (!canonicalKeys.includes(cardKey)) {
      warnings.push(`Unknown cardKey: ${cardKey}`);
    }
    
    if (!['upright', 'reversed'].includes(card.orientation)) {
      return { valid: false, error: `Invalid orientation: ${card.orientation}` };
    }
    
    // Validate position for multi-card spreads
    if (requiredPositions.length > 0 && !requiredPositions.includes(card.position)) {
      warnings.push(`Invalid position '${card.position}' for ${spread}`);
    }
  }
  
  return { valid: true, validFocusArea, warnings };
};

// Impact modifiers for confidence/clarity
const impactModifiers = {
  low: { upright: 5, reversed: -3 },      // Strong archetype: less penalty
  standard: { upright: 0, reversed: -6 }, // Normal
  high: { upright: -3, reversed: -10 }    // Uncertain: more penalty
};

// Clarity range constraints (user-friendly)
const clarityRange = { min: 50, max: 90 };

// POST /api/reading/free - Deterministic FREE reading
app.post("/api/reading/free", (req, res) => {
  const { language, spread, focusArea, cards } = req.body;
  
  // Validate request
  const validation = validateFreeRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  const { validFocusArea, warnings } = validation;
  
  try {
    // Process each card with impact data
    const cardReadings = cards.map(card => {
      const cardKey = card.cardKey || card.image;
      const cardData = getCardByKey(cardKey, language);
      
      if (!cardData) {
        return {
          position: card.position || null,
          cardKey,
          name: cardKey,
          orientation: card.orientation,
          meaning: "Card data not found",
          error: true
        };
      }
      
      // Get tendency data for this card (impact & reversalStyle)
      const tendency = getYesNoTendency(cardKey, language);
      const impact = normalizeTendencyValue(tendency.orientationImpact || 'standard', 'orientationImpact');
      const reversalStyle = normalizeTendencyValue(tendency.reversalStyle || 'internal', 'reversalStyle');
      
      // Get meaning based on orientation and focusArea
      const meaning = cardData.meanings?.[card.orientation]?.[validFocusArea] 
        || cardData.meanings?.[card.orientation]?.general
        || "Meaning not available";
      
      // Calculate clarity score using impact (range: 50-90)
      const baseClarity = card.orientation === 'upright' ? 78 : 62;
      const modifier = impactModifiers[impact]?.[card.orientation] || 0;
      const clarity = Math.min(clarityRange.max, Math.max(clarityRange.min, baseClarity + modifier));
      
      return {
        position: card.position || null,
        cardKey,
        name: cardData.name,
        orientation: card.orientation,
        meaning,
        clarity,
        // Impact metadata (for debugging/premium)
        impact,
        reversalStyle: card.orientation === 'reversed' ? reversalStyle : null,
        // Card metadata
        arcana: cardData.arcana,
        suit: cardData.suit,
        element: cardData.element
      };
    });
    
    // Calculate aggregate heuristics
    const reversedCount = cards.filter(c => c.orientation === 'reversed').length;
    const majorCount = cardReadings.filter(c => c.arcana === 'major').length;
    const avgClarity = Math.round(cardReadings.reduce((sum, c) => sum + (c.clarity || 70), 0) / cardReadings.length);
    
    // Count impact distribution in this reading
    const impactDist = { low: 0, standard: 0, high: 0 };
    cardReadings.forEach(c => {
      if (c.impact) impactDist[c.impact]++;
    });
    
    // Build response
    const response = {
      spread,
      focusArea: validFocusArea,
      language,
      cards: cardReadings,
      meta: {
        totalCards: cards.length,
        reversedCount,
        majorCount,
        avgClarity,
        impactDistribution: impactDist,
        timestamp: new Date().toISOString()
      }
    };
    
    // Add warnings if any
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    
    // Log for debugging
    console.log(`[FREE] ${spread} - ${language} - ${cards.length} cards - clarity: ${avgClarity}%`);
    
    res.json(response);
    
  } catch (error) {
    console.error('[FREE] Error:', error);
    res.status(500).json({ error: 'Failed to generate reading' });
  }
});

// ============================================
// CARDS API - Serve tarot card data
// ============================================

const _cardsHistoryMaps = {};
const getCardsHistoryMap = (lang = "tr") => {
  if (!_cardsHistoryMaps[lang]) {
    try {
      const historyPath = path.join(backendDataPath, lang, "cards_history.json");
      const historyData = JSON.parse(fs.readFileSync(historyPath, "utf8"));
      _cardsHistoryMaps[lang] = {};
      historyData.cards.forEach(c => { _cardsHistoryMaps[lang][c.image] = c; });
    } catch (e) {
      console.warn(`[Cards] Could not load ${lang}/cards_history.json:`, e.message);
      _cardsHistoryMaps[lang] = {};
    }
  }
  return _cardsHistoryMaps[lang];
};

const _cardsSymbolsMaps = {};
const getCardsSymbolsMap = (lang = "tr") => {
  if (!_cardsSymbolsMaps[lang]) {
    try {
      const p = path.join(backendDataPath, lang, "cards_symbols.json");
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      _cardsSymbolsMaps[lang] = {};
      d.cards.forEach(c => { _cardsSymbolsMaps[lang][c.image] = c.symbols; });
    } catch (e) {
      console.warn(`[Cards] Could not load ${lang}/cards_symbols.json:`, e.message);
      _cardsSymbolsMaps[lang] = {};
    }
  }
  return _cardsSymbolsMaps[lang];
};

const _cardsAffirmationsMaps = {};
const getCardsAffirmationsMap = (lang = "tr") => {
  if (!_cardsAffirmationsMaps[lang]) {
    try {
      const p = path.join(backendDataPath, lang, "cards_affirmations.json");
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      _cardsAffirmationsMaps[lang] = {};
      d.cards.forEach(c => { _cardsAffirmationsMaps[lang][c.image] = c.affirmation; });
    } catch (e) {
      console.warn(`[Cards] Could not load ${lang}/cards_affirmations.json:`, e.message);
      _cardsAffirmationsMaps[lang] = {};
    }
  }
  return _cardsAffirmationsMaps[lang];
};

app.get("/api/cards/:language", (req, res) => {
  const { language } = req.params;
  const validLangs = ["tr", "en", "de", "es"];
  
  if (!validLangs.includes(language)) {
    return res.status(400).json({ error: "Invalid language" });
  }
  
  try {
    const templatePath = path.join(backendDataPath, language, "tarot-template.json");
    const data = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    const historyMap = getCardsHistoryMap(language);
    const symbolsMap = getCardsSymbolsMap(language);
    const affirmationsMap = getCardsAffirmationsMap(language);

    // Normalize suit to English keys — handles Turkish/German/Spanish special chars
    const normalizeSuit = (s) => {
      if (!s) return null;
      const v = s.toLowerCase()
        .replace(/\u011f/g, "g")  // ğ
        .replace(/\u0131/g, "i")  // ı (dotless i)
        .replace(/\u015f/g, "s")  // ş
        .replace(/\u00e7/g, "c")  // ç
        .replace(/\u00f6/g, "o")  // ö
        .replace(/\u00fc/g, "u")  // ü
        .replace(/\u00e4/g, "a")  // ä
        .replace(/\u00e9/g, "e"); // é
      if (v === "wands"    || v === "degnek"  || v === "asa"    || v === "stabe"  || v.startsWith("wand"))  return "wands";
      if (v === "cups"     || v === "kupa"    || v === "kopa"   || v === "kelche" || v.startsWith("cup"))   return "cups";
      if (v === "swords"   || v === "kilic"   || v === "espadas"|| v === "schwerter" || v.startsWith("sword")) return "swords";
      if (v === "pentacles"|| v === "tilsim"  || v === "para"   || v === "munzen" || v === "oros" || v.startsWith("pent")) return "pentacles";
      return s;
    };

    const cards = data.cards.map(card => ({
      ...card,
      suit: normalizeSuit(card.suit),
      history: historyMap[card.image]?.history || null,
      symbols: symbolsMap[card.image] || [],
      affirmation: affirmationsMap[card.image] || null,
    }));

    res.json({ cards });
  } catch (error) {
    console.error(`Error loading cards for ${language}:`, error.message);
    res.status(500).json({ error: "Could not load card data" });
  }
});

// GET /api/cards/:image/readings?limit=5  — recent readings for a card (premium display)
app.get("/api/cards/:image/readings", (req, res) => {
  try {
    const { image } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    let readings = [];
    try {
      readings = JSON.parse(fs.readFileSync(logsFilePath, "utf8")) || [];
    } catch { readings = []; }

    const cardReadings = readings
      .filter(r => r.card?.image === image || r.cards?.some?.(c => c.image === image))
      .slice(-limit)
      .reverse()
      .map(r => ({
        type: r.type || "reading",
        focusArea: r.focusArea || null,
        timestamp: r.timestamp,
        orientation: r.card?.orientation || null,
      }));

    res.json({ success: true, cardImage: image, readings: cardReadings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// DREAM CODER MODULE + SHARED HELPERS
// ============================================
const dreamRouter = require("./dream-coder");
const { getUser: getSharedUser, updateUser: updateSharedUser, isPremium: isSharedPremium, TAROT_PRICES: SHARED_TAROT_PRICES } = dreamRouter.shared;
app.use("/api/dream", dreamRouter);

// ============================================
// CENTRAL USER API (shared across all modules)
// ============================================
app.get("/api/user/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) return res.status(400).json({ success: false, error: "deviceId gerekli" });
    const user = getSharedUser(deviceId);
    return res.json({
      success: true,
      deviceId,
      gemstoneBalance: user.gemstoneBalance,
      isPremiumSubscriber: user.isPremiumSubscriber || false,
      premiumPlan: user.premiumPlan || null,
      premiumExpiresAt: user.premiumExpiresAt || null,
      createdAt: user.createdAt,
      birthDate: user.birthDate || null,
      birthTime: user.birthTime || null,
      birthCity: user.birthCity || null,
      natalChart: user.natalChart || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/user/:deviceId/premium", (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) return res.status(400).json({ success: false, error: "deviceId gerekli" });
    const current = getSharedUser(deviceId);
    const requested = req.body?.isPremium;
    const nextPremium = typeof requested === "boolean" ? requested : !Boolean(current.isPremiumSubscriber);
    updateSharedUser(deviceId, {
      isPremiumSubscriber: nextPremium,
      premiumPlan: nextPremium ? "manual_debug" : null,
      premiumExpiresAt: nextPremium ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() : null,
    });
    const updated = getSharedUser(deviceId);
    return res.json({
      success: true,
      message: nextPremium ? "Premium aktif edildi." : "Premium kapatildi.",
      deviceId,
      isPremiumSubscriber: !!updated.isPremiumSubscriber,
      premiumPlan: updated.premiumPlan || null,
      premiumExpiresAt: updated.premiumExpiresAt || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// MOON ASTRO MODULE
// ============================================
const moonRouter = require("./moon");
app.use("/api/moon", moonRouter);

// ============================================
// HOROSCOPE MODULE (Daily Horoscope)
// ============================================
const horoscopeRouter = require("./horoscope");
app.use("/api/horoscope", horoscopeRouter);

// ============================================
// NATAL CHART API
// ============================================
const { calculateNatalChart } = require("./utils/moon");
const { createNatalChartRouter, MOCK_NATAL_CHART, NATAL_INTERPRET_COST } = require("./natal-chart");
const createTransitRouter = require("./natal-transit");
app.use("/api/natal", createNatalChartRouter({
  openai,
  calculateNatalChart,
  getUser: getSharedUser,
  updateUser: updateSharedUser,
  getNatalPrompts,
}));

app.use("/api/natal/transits", createTransitRouter({
  openai,
  getUser: getSharedUser,
  updateUser: updateSharedUser,
  isPremium: isSharedPremium,
  getFallbackNatalPlanets: () => MOCK_NATAL_CHART.planets,
}));

// ============================================
// TAROT GEMSTONE HELPER
// ============================================
// Spread tipine gore gemstone fiyati
const getSpreadGemCost = (spread) => {
  const singleSpreads = ["single_card", "yes_no"];
  const threeSpreads = ["past_present_future", "situation_obstacle_advice", "destinys_embrace", "mind_body_spirit", "celestial_illumination", "career_clarity", "career_path_guide"];
  const fiveSpreads = ["love_choice", "path_to_love", "new_moon_ritual", "full_moon_release", "new_business_exploration", "wealth_flow"];

  if (singleSpreads.includes(spread)) return SHARED_TAROT_PRICES.single || 6;
  if (threeSpreads.includes(spread)) return SHARED_TAROT_PRICES.three || 14;
  if (fiveSpreads.includes(spread)) return SHARED_TAROT_PRICES.five || 22;
  return SHARED_TAROT_PRICES.single || 6;
};

// FREE spreads (gemstone dusmuyor): tekli kart + yes/no (sadece FREE versiyonlari)
const isFreeTarotSpread = (spread) => {
  return spread === "single_card" || spread === "yes_no";
};

const PORT = process.env.PORT || 3001;

// Run drift checker before starting server
runDriftChecker();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`   Languages: ${supportedLanguages.join(', ')}`);
  console.log(`   Cards indexed: ${getCanonicalCardKeys().length}`);
  console.log(`   Dream Coder: mounted at /api/dream`);
  console.log(`   Moon Astro: mounted at /api/moon`);
  console.log(`   Horoscope: mounted at /api/horoscope`);
  console.log(`   Natal Chart: /api/natal/* (interpret: ${NATAL_INTERPRET_COST} gems)`);
});
