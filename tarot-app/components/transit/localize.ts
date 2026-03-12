import type {
  DetailedDriver,
  Milestone,
  Phase,
  RecurringTheme,
  RetrogradeWindow,
  TransitEvent,
  TransitTheme,
  V4Payload,
} from "./types";

type SupportedLanguage = "tr" | "en" | "de" | "es";

type CanonicalToken =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december"
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "ascendant"
  | "midheaven"
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile";

const TOKEN_ALIASES: Record<string, CanonicalToken> = {
  january: "january",
  ocak: "january",
  januar: "january",
  enero: "january",
  february: "february",
  subat: "february",
  februar: "february",
  febrero: "february",
  march: "march",
  mart: "march",
  marz: "march",
  marzo: "march",
  april: "april",
  nisan: "april",
  abril: "april",
  may: "may",
  mayis: "may",
  mai: "may",
  mayo: "may",
  june: "june",
  haziran: "june",
  juni: "june",
  junio: "june",
  july: "july",
  temmuz: "july",
  juli: "july",
  julio: "july",
  august: "august",
  agustos: "august",
  augusto: "august",
  agosto: "august",
  september: "september",
  eylul: "september",
  septiembre: "september",
  oktober: "october",
  october: "october",
  ekim: "october",
  octubre: "october",
  november: "november",
  kasim: "november",
  noviembre: "november",
  december: "december",
  aralik: "december",
  dezember: "december",
  diciembre: "december",
  sun: "sun",
  gunes: "sun",
  sonne: "sun",
  sol: "sun",
  moon: "moon",
  ay: "moon",
  mond: "moon",
  luna: "moon",
  mercury: "mercury",
  merkur: "mercury",
  mercurio: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
  saturno: "saturn",
  uranus: "uranus",
  urano: "uranus",
  neptune: "neptune",
  neptun: "neptune",
  neptuno: "neptune",
  pluto: "pluto",
  pluton: "pluto",
  plutonio: "pluto",
  ascendant: "ascendant",
  yukselen: "ascendant",
  aszendent: "ascendant",
  ascendente: "ascendant",
  mc: "midheaven",
  midheaven: "midheaven",
  conjunction: "conjunction",
  kavusum: "conjunction",
  konjunktion: "conjunction",
  conjuncion: "conjunction",
  opposition: "opposition",
  karsit: "opposition",
  oppositione: "opposition",
  oposicion: "opposition",
  trine: "trine",
  ucgen: "trine",
  trigono: "trine",
  square: "square",
  kare: "square",
  quadrat: "square",
  sextile: "sextile",
  sekstil: "sextile",
  sextil: "sextile",
  sextilo: "sextile",
};

const DISPLAY_BY_LANGUAGE: Record<SupportedLanguage, Record<CanonicalToken, string>> = {
  en: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    ascendant: "Ascendant",
    midheaven: "MC",
    conjunction: "Conjunction",
    opposition: "Opposition",
    trine: "Trine",
    square: "Square",
    sextile: "Sextile",
  },
  tr: {
    january: "Ocak",
    february: "Subat",
    march: "Mart",
    april: "Nisan",
    may: "Mayis",
    june: "Haziran",
    july: "Temmuz",
    august: "Agustos",
    september: "Eylul",
    october: "Ekim",
    november: "Kasim",
    december: "Aralik",
    sun: "Gunes",
    moon: "Ay",
    mercury: "Merkur",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptun",
    pluto: "Pluton",
    ascendant: "Yukselen",
    midheaven: "MC",
    conjunction: "Kavusum",
    opposition: "Karsit",
    trine: "Ucgen",
    square: "Kare",
    sextile: "Sekstil",
  },
  de: {
    january: "Januar",
    february: "Februar",
    march: "Marz",
    april: "April",
    may: "Mai",
    june: "Juni",
    july: "Juli",
    august: "August",
    september: "September",
    october: "Oktober",
    november: "November",
    december: "Dezember",
    sun: "Sonne",
    moon: "Mond",
    mercury: "Merkur",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptun",
    pluto: "Pluto",
    ascendant: "Aszendent",
    midheaven: "MC",
    conjunction: "Konjunktion",
    opposition: "Opposition",
    trine: "Trigon",
    square: "Quadrat",
    sextile: "Sextil",
  },
  es: {
    january: "Enero",
    february: "Febrero",
    march: "Marzo",
    april: "Abril",
    may: "Mayo",
    june: "Junio",
    july: "Julio",
    august: "Agosto",
    september: "Septiembre",
    october: "Octubre",
    november: "Noviembre",
    december: "Diciembre",
    sun: "Sol",
    moon: "Luna",
    mercury: "Mercurio",
    venus: "Venus",
    mars: "Marte",
    jupiter: "Jupiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Neptuno",
    pluto: "Pluton",
    ascendant: "Ascendente",
    midheaven: "MC",
    conjunction: "Conjuncion",
    opposition: "Oposicion",
    trine: "Trigono",
    square: "Cuadratura",
    sextile: "Sextil",
  },
};

function resolveLanguage(language?: string): SupportedLanguage {
  const base = String(language || "en").toLowerCase().split("-")[0];
  if (base === "tr" || base === "de" || base === "es") return base;
  return "en";
}

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function localizeWord(word: string, language: SupportedLanguage): string {
  const canonical = TOKEN_ALIASES[normalizeWord(word)];
  if (!canonical) return word;
  return DISPLAY_BY_LANGUAGE[language][canonical] || DISPLAY_BY_LANGUAGE.en[canonical] || word;
}

export function localizeTransitText(text: string | undefined | null, language?: string): string {
  if (!text) return text || "";
  const targetLanguage = resolveLanguage(language);
  if (targetLanguage === "tr") return text;
  return text.replace(/[A-Za-zÀ-ÿÇĞİÖŞÜçğıöşü]+/g, (match) => localizeWord(match, targetLanguage));
}

function mapEvent(event: TransitEvent, language?: string): TransitEvent {
  return {
    ...event,
    title: localizeTransitText(event.title, language),
    rangeText: localizeTransitText(event.rangeText, language),
  };
}

function mapPhase(phase: Phase, language?: string): Phase {
  return {
    ...phase,
    title: localizeTransitText(phase.title, language),
    window: localizeTransitText(phase.window, language),
  };
}

function mapTheme(theme: TransitTheme, language?: string): TransitTheme {
  return {
    ...theme,
    label: localizeTransitText(theme.label, language),
    window: localizeTransitText(theme.window, language),
    title: localizeTransitText(theme.title, language),
    events: theme.events?.map((event) => mapEvent(event, language)),
  };
}

function mapRetrogradeWindow(retro: RetrogradeWindow, language?: string): RetrogradeWindow {
  return {
    ...retro,
    planetLabel: localizeTransitText(retro.planetLabel, language),
    affectedThemes: (retro.affectedThemes || []).map((theme) => localizeTransitText(theme, language)),
  };
}

function mapMilestone(milestone: Milestone, language?: string): Milestone {
  return {
    ...milestone,
    title: localizeTransitText(milestone.title, language),
    window: localizeTransitText(milestone.window, language),
  };
}

function mapRecurringTheme(theme: RecurringTheme, language?: string): RecurringTheme {
  return {
    ...theme,
    label: localizeTransitText(theme.label, language),
    description: localizeTransitText(theme.description, language),
  };
}

function mapDriver(driver: DetailedDriver, language?: string): DetailedDriver {
  return {
    ...driver,
    title: localizeTransitText(driver.title, language),
    rangeText: localizeTransitText(driver.rangeText, language),
  };
}

export function localizeTransitPayload(payload: V4Payload, language?: string): V4Payload {
  return {
    ...payload,
    phases: (payload.phases || []).map((phase) => mapPhase(phase, language)),
    themes: (payload.themes || []).map((theme) => mapTheme(theme, language)),
    retrogradeWindows: (payload.retrogradeWindows || []).map((retro) => mapRetrogradeWindow(retro, language)),
    milestones: (payload.milestones || []).map((milestone) => mapMilestone(milestone, language)),
    recurringThemes: (payload.recurringThemes || []).map((theme) => mapRecurringTheme(theme, language)),
    detailedDrivers: (payload.detailedDrivers || []).map((driver) => mapDriver(driver, language)),
    background: (payload.background || []).map((event) => mapEvent(event, language)),
  };
}
