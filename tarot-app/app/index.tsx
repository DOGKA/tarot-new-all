import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated,
  FlatList, Dimensions, Modal, ActivityIndicator, Image, ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useApp } from "../context/AppContext";
import { GradientBackground, Moon3D, Planet3D, Zodiac3D, StarField, GemstoneIcon } from "../components/ui";
import { getMoonIllumination } from "../utils/moon";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { Language } from "../types/tarot";
import type { MoonSlot, MoonApiResponse } from "../utils/moon";
import { getTimeUntilTransition } from "../utils/moon";
import { getCardHistory, SPREAD_LABELS, FOCUS_LABELS } from "../utils/cardHistory";
import type { CardDrawRecord } from "../utils/cardHistory";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 48;

function sameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatSlotTime(isoStr: string, todayLabel: string, tomorrowLabel: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (sameDay(d, now)) return `${todayLabel} ${time}`;
  if (sameDay(d, tomorrow)) return `${tomorrowLabel} ${time}`;
  const months = ["Oca","Sub","Mar","Nis","May","Haz","Tem","Agu","Eyl","Eki","Kas","Ara"];
  return `${d.getDate()} ${months[d.getMonth()]} ${time}`;
}

const ZODIAC_GRADIENTS: Record<string, string[]> = {
  aries:       ["rgba(255, 60, 30, 0.5)",  "rgba(180, 30, 10, 0.25)", "rgba(40, 10, 10, 0.95)"],
  taurus:      ["rgba(40, 180, 80, 0.45)", "rgba(20, 120, 50, 0.2)",  "rgba(10, 35, 20, 0.95)"],
  gemini:      ["rgba(255, 220, 50, 0.5)", "rgba(200, 160, 0, 0.2)",  "rgba(40, 35, 10, 0.95)"],
  cancer:      ["rgba(80, 160, 255, 0.5)", "rgba(40, 100, 200, 0.25)","rgba(10, 20, 50, 0.95)"],
  leo:         ["rgba(255, 150, 0, 0.5)",  "rgba(220, 100, 0, 0.25)", "rgba(45, 25, 5, 0.95)"],
  virgo:       ["rgba(120, 80, 200, 0.5)", "rgba(80, 50, 160, 0.25)", "rgba(25, 15, 45, 0.95)"],
  libra:       ["rgba(230, 180, 255, 0.45)","rgba(180, 120, 220, 0.2)","rgba(35, 20, 50, 0.95)"],
  scorpio:     ["rgba(180, 20, 20, 0.55)", "rgba(120, 10, 10, 0.3)",  "rgba(35, 5, 5, 0.95)"],
  sagittarius: ["rgba(255, 100, 20, 0.5)", "rgba(200, 60, 0, 0.25)",  "rgba(40, 20, 5, 0.95)"],
  capricorn:   ["rgba(100, 90, 70, 0.5)",  "rgba(70, 60, 45, 0.25)",  "rgba(25, 22, 18, 0.95)"],
  aquarius:    ["rgba(0, 200, 255, 0.5)",  "rgba(0, 130, 200, 0.25)", "rgba(5, 20, 40, 0.95)"],
  pisces:      ["rgba(140, 80, 220, 0.5)", "rgba(100, 50, 180, 0.25)","rgba(25, 10, 45, 0.95)"],
};
const DEFAULT_GRADIENT = ["rgba(168, 85, 247, 0.4)", "rgba(99, 102, 241, 0.2)", "rgba(25, 15, 50, 0.95)"];

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "tr", label: "TR", flag: "🇹🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

// ─── Types for admin status ───
interface MoonStatus {
  slotCount: number;
  generatedUntil: string;
  remainingMinutes: number;
  remainingHours: number;
  nextTransitionMinutes: number;
  isGenerating: boolean;
  languages: string[];
  // Buffer + cron
  bufferOk: boolean;
  slotsWithContent: number;
  cronEnabled: boolean;
  nextCronRun: string | null;
  lastCronRun: string | null;
  lastCronAction: string | null;
  lastCronRemainingHours: number | null;
  lastCronError: string | null;
  cronTotalRuns: number;
  slotList: Array<{
    id: string;
    start: string;
    end: string;
    phase: string;
    zodiac: string;
    planet: string;
    hasContent: boolean;
    isCurrent: boolean;
  }>;
  genProgress: { total: number; done: number; phase: string } | null;
}

interface HoroscopeStatus {
  cachedDates: string[];
  totalHoroscopes: number;
  hasToday: boolean;
  hasTomorrow: boolean;
  hasYesterday: boolean;
  lastUpdated: string | null;
  isGenerating: boolean;
  untilNextDayMinutes: number;
  untilNextDayHours: number;
  // Rolling-window buffer
  bufferOk: boolean;
  maxCachedDate: string | null;
  nextCronRun: string | null;
  // Cron log
  cronEnabled: boolean;
  lastCronRun: string | null;
  lastCronGenerated: string[];
  lastCronSkipped: string[];
  lastCronError: string | null;
  cronTotalRuns: number;
  // Per-date detail
  dateDetails: Record<string, { count: number; createdAt: string | null; role: string }>;
}

interface TransitStatus {
  hasCache: boolean;
  periods: Array<{
    months: number;
    createdAt: string;
    events: number;
    period: { start: string; end: string } | null;
  }>;
  methodSummary?: {
    title: string;
    steps: string[];
  };
  mockupSnapshot?: {
    generatedAt: string;
    natalPlanetCount: number;
    locationsUsed: Array<{
      city: string;
      latitude: number;
      longitude: number;
      utcOffset: number;
      timezone: string | null;
      startDate: string | null;
      endDate: string | null;
    }>;
    currentTransitPositions: Array<{
      planet: string;
      sign: string;
      degree: number;
      minute: number;
      retrograde: boolean;
    }>;
  };
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { language, setLanguage, isPremium, togglePremium, gemstoneBalance, deviceId, setUserSign } = useApp();

  const [moonData, setMoonData] = useState<MoonApiResponse | null>(null);
  const [moonLoading, setMoonLoading] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadDone = useRef(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  // Tarot Masası
  type TarotCardData = {
    id: number; name: string; image: string; arcana: string;
    number: string; suit: string | null; element: string;
    history: string | null;
    symbols: { symbol: string; meaning: string }[];
    affirmation: string | null;
    meanings: {
      upright: { general: string; love: string; career: string; spiritual: string };
      reversed: { general: string; love: string; career: string; spiritual: string };
    };
  };
  const [tarotMasaCards, setTarotMasaCards] = useState<TarotCardData[]>([]);
  const [tarotMasaLoading, setTarotMasaLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);
  const [cardDetailOrientation, setCardDetailOrientation] = useState<"upright" | "reversed">("upright");

  const [cardDrawHistory, setCardDrawHistory] = useState<CardDrawRecord[]>([]);

  const getSuitType = (suit: string): "fire" | "water" | "air" | "earth" | null => {
    if (!suit) return null;
    const v = suit.toLowerCase();
    if (v.includes("wand") || v.includes("egnek") || v.includes("basto") || v.includes("stab") || v.includes("bagu") || v.includes("asa")) return "fire";
    if (v.includes("cup") || v.includes("kupa") || v.includes("copa") || v.includes("kelch") || v.includes("coppe")) return "water";
    if (v.includes("sword") || v.includes("kilic") || v.includes("kil") || v.includes("espada") || v.includes("schwert") || v.includes("spade")) return "air";
    if (v.includes("pent") || v.includes("tilsim") || v.includes("ilsim") || v.includes("oro") || v.includes("munz") || v.includes("denaros") || v.includes("disco")) return "earth";
    return null;
  };

  const SUIT_ICON: Record<string, string> = { fire: "magic-staff", water: "cup", air: "sword-cross", earth: "star-four-points" };
  const SUIT_COLORS_MAP: Record<string, [string, string]> = {
    fire:  ["rgba(251,146,60,0.7)",  "rgba(160,50,0,0.95)"],
    water: ["rgba(56,189,248,0.7)",  "rgba(0,70,150,0.95)"],
    air:   ["rgba(148,163,184,0.7)", "rgba(20,40,70,0.95)"],
    earth: ["rgba(74,222,128,0.7)",  "rgba(0,70,25,0.95)"],
  };
  const SUIT_LABEL: Record<string, string> = { fire: t("suitWands"), water: t("suitCups"), air: t("suitSwords"), earth: t("suitPentacles") };

  const getCardIcon = (suit: string | null): string => suit ? (SUIT_ICON[getSuitType(suit) || ""] || "cards-outline") : "cards-outline";
  const getCardColors = (suit: string | null): [string, string] => suit
    ? (SUIT_COLORS_MAP[getSuitType(suit) || ""] || ["rgba(168,85,247,0.7)", "rgba(40,10,60,0.95)"])
    : ["rgba(168,85,247,0.7)", "rgba(40,10,60,0.95)"];

  const majorArcanaCards = useMemo(() => tarotMasaCards.filter(c => c.arcana === "major"), [tarotMasaCards]);

  const minorArcanaCards = useMemo(() => tarotMasaCards.filter(c => c.arcana === "minor"), [tarotMasaCards]);

  const extractSuit = (card: TarotCardData): string => {
    if (card.suit) return card.suit;
    const img = card.image?.toLowerCase() || "";
    if (img.includes("wand")) return "wands";
    if (img.includes("cup")) return "cups";
    if (img.includes("sword")) return "swords";
    if (img.includes("pent")) return "pentacles";
    return "other";
  };

  const minorArcanaSuits = useMemo(() => {
    const suitOrder = ["wands", "cups", "swords", "pentacles"];
    const suitMap: Record<string, TarotCardData[]> = {};
    minorArcanaCards.forEach(c => {
      const k = extractSuit(c);
      if (!suitMap[k]) suitMap[k] = [];
      suitMap[k].push(c);
    });
    return suitOrder
      .filter(s => suitMap[s]?.length > 0)
      .map(suit => {
        const suitType = getSuitType(suit);
        const label = suitType ? (SUIT_LABEL[suitType] || suit) : suit;
        const icon = SUIT_ICON[suitType || ""] || "cards-outline";
        return { suit, suitType, label, icon, cards: suitMap[suit] };
      });
  }, [minorArcanaCards]);

  const renderMasaCard = (card: TarotCardData) => {
    const colors = getCardColors(card.suit);
    return (
      <TouchableOpacity
        key={String(card.id)}
        style={styles.masaCardItem}
        activeOpacity={0.8}
        onPress={() => { setSelectedCard(card); setCardDetailOrientation("upright"); loadCardHistory(card.image); }}
      >
        <LinearGradient colors={colors} style={styles.masaCardTile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialCommunityIcons name="cards-outline" size={24} color="rgba(255,255,255,0.7)" />
          {card.number ? <Text style={styles.masaCardNumber}>{card.number}</Text> : null}
        </LinearGradient>
        <Text style={styles.masaCardName} numberOfLines={2}>{card.name}</Text>
      </TouchableOpacity>
    );
  };

  const loadCardHistory = async (image: string) => {
    try {
      const history = await getCardHistory(image);
      setCardDrawHistory(history);
    } catch {
      setCardDrawHistory([]);
    }
  };

  const fetchTarotMasaCards = async (lang?: string) => {
    setTarotMasaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cards/${lang || language}`);
      if (res.ok) {
        const data = await res.json();
        setTarotMasaCards(data.cards || []);
      }
    } catch (err) {
      console.warn("Tarot Masası fetch error:", err);
    } finally {
      setTarotMasaLoading(false);
    }
  };

  // Language dropdown
  const [langOpen, setLangOpen] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moonStatus, setMoonStatus] = useState<MoonStatus | null>(null);
  const [horoscopeStatus, setHoroscopeStatus] = useState<HoroscopeStatus | null>(null);
  const [transitStatus, setTransitStatus] = useState<TransitStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [slotListOpen, setSlotListOpen] = useState(true);

  // Natal chart — direct sign selection
  const ZODIAC_LIST = [
    { key: "aries", symbol: "♈" }, { key: "taurus", symbol: "♉" }, { key: "gemini", symbol: "♊" },
    { key: "cancer", symbol: "♋" }, { key: "leo", symbol: "♌" }, { key: "virgo", symbol: "♍" },
    { key: "libra", symbol: "♎" }, { key: "scorpio", symbol: "♏" }, { key: "sagittarius", symbol: "♐" },
    { key: "capricorn", symbol: "♑" }, { key: "aquarius", symbol: "♒" }, { key: "pisces", symbol: "♓" },
  ];
  const SIGN_ELEMENTS: Record<string, string> = {
    aries: "fire", taurus: "earth", gemini: "air", cancer: "water",
    leo: "fire", virgo: "earth", libra: "air", scorpio: "water",
    sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water",
  };
  const [natalSun, setNatalSun] = useState("sagittarius");
  const [natalMoon, setNatalMoon] = useState("aries");
  const [natalRising, setNatalRising] = useState<string | null>(null);
  const [natalLoading, setNatalLoading] = useState(false);
  const [natalSaved, setNatalSaved] = useState(false);

  const mockNatalData = {
    input: { birthDate: "2025-10-19", birthTime: "22:02:00", latitude: 39.83, longitude: 32.71, timezone: "Europe/Istanbul", houseSystem: "placidus" },
    planets: [
      { name: "sun", symbol: "☉", sign: "libra", degree: 26, minute: 38, house: 5, retrograde: false },
      { name: "moon", symbol: "☽", sign: "libra", degree: 7, minute: 36, house: 4, retrograde: false },
      { name: "mercury", symbol: "☿", sign: "scorpio", degree: 18, minute: 32, house: 5, retrograde: false },
      { name: "venus", symbol: "♀", sign: "libra", degree: 7, minute: 20, house: 4, retrograde: false },
      { name: "mars", symbol: "♂", sign: "scorpio", degree: 18, minute: 50, house: 5, retrograde: false },
      { name: "jupiter", symbol: "♃", sign: "cancer", degree: 24, minute: 18, house: 1, retrograde: false },
      { name: "saturn", symbol: "♄", sign: "pisces", degree: 26, minute: 27, house: 10, retrograde: true },
      { name: "uranus", symbol: "♅", sign: "gemini", degree: 0, minute: 42, house: 11, retrograde: true },
      { name: "neptune", symbol: "♆", sign: "aries", degree: 0, minute: 3, house: 10, retrograde: true },
      { name: "pluto", symbol: "♇", sign: "aquarius", degree: 1, minute: 22, house: 8, retrograde: false },
      { name: "north_node", symbol: "☊", sign: "pisces", degree: 17, minute: 57, house: 10, retrograde: true },
      { name: "south_node", symbol: "☋", sign: "virgo", degree: 17, minute: 57, house: 4, retrograde: false },
      { name: "black_moon", symbol: "⚸", sign: "scorpio", degree: 23, minute: 3, house: 5, retrograde: false },
      { name: "asc", symbol: "ASC", sign: "cancer", degree: 7, minute: 4, house: null, retrograde: false },
      { name: "mc", symbol: "MC", sign: "pisces", degree: 15, minute: 34, house: null, retrograde: false },
    ],
  };

  const LOADING_KEYS = ["moonLoading1", "moonLoading2", "moonLoading3", "moonLoading4", "moonLoading5", "moonLoading6"];

  const startLoadingAnim = () => {
    setLoadingMsgIdx(0);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: 45000,
      useNativeDriver: false,
    }).start();
    msgTimerRef.current = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % 6);
    }, 4000);
  };

  const stopLoadingAnim = () => {
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const fetchMoon = useCallback(async (lang: string, showLoading: boolean) => {
    try {
      if (showLoading) {
        setMoonLoading(true);
        startLoadingAnim();
      }
      const res = await fetch(`${API_BASE}/moon/current?lang=${lang}`);
      if (res.ok) {
        const data: MoonApiResponse = await res.json();
        setMoonData(data);
        setActiveSlotIndex(data.currentIndex || 0);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (data.nextTransition?.time) {
          const ms = getTimeUntilTransition(data.nextTransition.time);
          if (ms > 0 && ms < 86400000) {
            timerRef.current = setTimeout(() => fetchMoon(lang, false), ms + 1000);
          }
        }
      }
    } catch (err) {
      console.warn("Moon fetch error:", err);
    } finally {
      if (showLoading) {
        stopLoadingAnim();
        setMoonLoading(false);
      }
    }
  }, []);

  // Auto-scroll tabs when active slot changes
  useEffect(() => {
    if (tabScrollRef.current && activeSlotIndex >= 0) {
      const tabWidth = 90;
      const scrollX = Math.max(0, activeSlotIndex * (tabWidth + 6) - SCREEN_WIDTH / 2 + tabWidth / 2);
      tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeSlotIndex]);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchMoon(language, true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
  }, []);

  // Fetch natal data when deviceId ready
  useEffect(() => {
    if (deviceId) fetchNatalChart();
  }, [deviceId]);

  // Language switch — silent refetch
  useEffect(() => {
    if (initialLoadDone.current) {
      fetchMoon(language, false);
    }
  }, [language]);

  // Auto-load Tarot Masası cards on mount and language change
  useEffect(() => {
    fetchTarotMasaCards(language);
  }, [language]);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  // ─── Settings / Admin ───
  const fetchStatuses = async (silent = false) => {
    if (!silent) setStatusLoading(true);
    try {
      const [moonRes, horoscopeRes, transitRes] = await Promise.all([
        fetch(`${API_BASE}/moon/status`),
        fetch(`${API_BASE}/horoscope/status`),
        deviceId ? fetch(`${API_BASE}/natal/transits/${deviceId}/status`) : Promise.resolve(null as any),
      ]);
      if (moonRes.ok) setMoonStatus(await moonRes.json());
      if (horoscopeRes.ok) {
        const hs = await horoscopeRes.json();
        setHoroscopeStatus(hs);
        // Stop auto-refresh once generation is done
        if (!hs.isGenerating && autoRefreshRef.current) {
          clearInterval(autoRefreshRef.current);
          autoRefreshRef.current = null;
        }
      }
      if (transitRes?.ok) setTransitStatus(await transitRes.json());
    } catch (err) {
      console.warn("Status fetch error:", err);
    } finally {
      if (!silent) setStatusLoading(false);
    }
  };

  const openSettings = () => {
    setSettingsOpen(true);
    setActionResult(null);
    fetchStatuses();
    fetchNatalChart();
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  };

  // Start auto-refresh (4s) when generation is running
  const startAutoRefresh = () => {
    if (autoRefreshRef.current) return;
    autoRefreshRef.current = setInterval(() => fetchStatuses(true), 4000);
  };

  const fetchNatalChart = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${API_BASE}/natal/${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.chart) {
          const c = data.data.chart;
          setNatalSun(c.sunSign || "sagittarius");
          setNatalMoon(c.moonSign || "aries");
          setNatalRising(c.risingSign || null);
          setNatalSaved(true);
          if (c.sunSign) setUserSign(c.sunSign);
        }
      }
    } catch (err) {
      console.warn("Natal fetch error:", err);
    }
  };

  // Calculate element balance locally
  const calcElements = (sun: string, moon: string, rising: string | null) => {
    const counts = { fire: 0, earth: 0, air: 0, water: 0 };
    if (SIGN_ELEMENTS[sun]) counts[SIGN_ELEMENTS[sun] as keyof typeof counts] += 3;
    if (SIGN_ELEMENTS[moon]) counts[SIGN_ELEMENTS[moon] as keyof typeof counts] += 2;
    if (rising && SIGN_ELEMENTS[rising]) counts[SIGN_ELEMENTS[rising] as keyof typeof counts] += 1;
    const dominant = (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
    return { ...counts, dominant };
  };

  const saveNatalChart = async () => {
    if (!deviceId) return;
    setNatalLoading(true);
    setNatalSaved(false);
    try {
      const elements = calcElements(natalSun, natalMoon, natalRising);
      const chart = { sunSign: natalSun, moonSign: natalMoon, risingSign: natalRising, elements };

      const res = await fetch(`${API_BASE}/natal/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, chart }),
      });

      const data = await res.json();
      if (data.success) {
        setNatalSaved(true);
        setUserSign(natalSun);
      } else {
        setActionResult(data.error || "Kaydetme hatası");
      }
    } catch (err: any) {
      setActionResult(`Hata: ${err.message}`);
    } finally {
      setNatalLoading(false);
    }
  };

  const adminAction = async (action: string) => {
    setActionLoading(action);
    setActionResult(null);
    try {
      let res: Response;
      switch (action) {
        case "horoscope_generate":
          res = await fetch(`${API_BASE}/horoscope/generate`, { method: "POST", headers: { "Content-Type": "application/json" } });
          break;
        case "horoscope_delete":
          res = await fetch(`${API_BASE}/horoscope/cache`, { method: "DELETE" });
          break;
        case "moon_refresh":
          res = await fetch(`${API_BASE}/moon/current?lang=${language}`);
          break;
        case "moon_force_generate":
          res = await fetch(`${API_BASE}/moon/force-generate`, { method: "POST", headers: { "Content-Type": "application/json" } });
          break;
        case "moon_delete":
          res = await fetch(`${API_BASE}/moon/cache`, { method: "DELETE" });
          break;
        case "natal_delete":
          res = await fetch(`${API_BASE}/natal/interpret/${deviceId}`, { method: "DELETE" });
          break;
        case "transit_delete":
          res = await fetch(`${API_BASE}/natal/transits/${deviceId}`, { method: "DELETE" });
          break;
        default:
          return;
      }
      const data = await res.json();
      setActionResult(data.message || data.error || (data.success ? "✓" : "✗"));
      // Start auto-refresh and do immediate status fetch
      startAutoRefresh();
      setTimeout(() => fetchStatuses(true), 600);
    } catch (err: any) {
      setActionResult(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min} dk`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}s ${m}dk` : `${h}s`;
  };

  const slot = moonData?.currentSlot;

  const navigatePhase = (s: MoonSlot) => {
    if (!s?.content) return;
    router.push({ pathname: "/astro/phase", params: { phaseKey: s.phase.key, phaseName: s.phase.name, general: s.content.phase.general, ayna: s.content.phase.ayna } });
  };

  const navigateZodiac = (s: MoonSlot) => {
    if (!s?.content) return;
    router.push({ pathname: "/astro/zodiac", params: { zodiacKey: s.zodiac.key, zodiacName: s.zodiac.name, zodiacElement: s.zodiac.element, meaning: s.content.zodiac.meaning, firsat: s.content.zodiac.firsat, his: s.content.zodiac.his } });
  };

  const navigatePlanet = (s: MoonSlot) => {
    if (!s?.content) return;
    router.push({ pathname: "/astro/planet", params: { planetKey: s.planet.key, planetName: s.planet.name, planetDay: s.planet.day, meaning: s.content.planet.meaning, advice: s.content.planet.advice } });
  };

  const todayLabel = t("moonToday");
  const tomorrowLabel = t("moonTomorrow");
  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ═══ Top Bar — Unified Glass Strip ═══ */}
        <View style={styles.topBar}>
          <View style={styles.glassBar}>
            {/* Premium / Free */}
            <TouchableOpacity style={styles.barCell} onPress={togglePremium} activeOpacity={0.7}>
              <Text style={[styles.barText, isPremium && styles.barTextPremium]}>
                {isPremium ? "★ Premium" : "Free"}
              </Text>
            </TouchableOpacity>

            <View style={styles.barSep} />

            {/* Language */}
            <View>
              <TouchableOpacity style={styles.barCell} onPress={() => setLangOpen(!langOpen)} activeOpacity={0.7}>
                <Text style={styles.barFlag}>{currentLang.flag}</Text>
                <Text style={styles.barText}>{currentLang.label}</Text>
                <Text style={styles.barArrow}>{langOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {langOpen && (
                <View style={styles.langDropdown}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langDropdownItem, language === lang.code && styles.langDropdownItemActive]}
                      onPress={() => handleLanguageSelect(lang.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.langDropdownFlag}>{lang.flag}</Text>
                      <Text style={[styles.langDropdownText, language === lang.code && styles.langDropdownTextActive]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.barSep} />

            {/* Settings */}
            <TouchableOpacity style={styles.barCell} onPress={openSettings} activeOpacity={0.7}>
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>

            <View style={styles.barSep} />

            {/* Gemstone */}
            <View style={[styles.barCell, { gap: 4 }]}>
              <GemstoneIcon size={38} />
              <Text style={styles.barTextGem}>{gemstoneBalance}</Text>
            </View>

            <View style={styles.barSep} />

            {/* Market */}
            <TouchableOpacity style={styles.barCell} onPress={() => router.push("/market")} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cart-outline" size={18} color="#fbbf24" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ Title ═══ */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Astrolic</Text>
          <Text style={styles.appSubtitle}>Tarot & Dream</Text>
        </View>

        {/* ═══ Cards ═══ */}
        <View style={styles.cardsContainer}>
          {/* Tarot Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={["rgba(168, 85, 247, 0.3)", "rgba(99, 102, 241, 0.2)", "rgba(30, 20, 60, 0.8)"]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.cardTitle}>TAROT</Text>
              <Text style={styles.cardDescription}>{t("tarotWelcomeDesc")}</Text>
              <View style={styles.tarotGateRow}>
                <TouchableOpacity
                  style={styles.tarotGateCard}
                  activeOpacity={0.8}
                  onPress={() => router.push("/tarot?mode=free")}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🃏</Text>
                  <Text style={styles.tarotGateBtnTitle}>{t("tarotFreeTitle")}</Text>
                  <Text style={styles.tarotGateBtnSub}>{t("tarotFreeSubtitle")}</Text>
                  <Text style={styles.tarotGateBtnCount}>{t("tarotFreeCount")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tarotGateCard, styles.tarotGateCardPremium]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/tarot?mode=premium")}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🔮</Text>
                  <Text style={[styles.tarotGateBtnTitle, { color: "#c084fc" }]}>{t("tarotPremiumTitle")}</Text>
                  <Text style={[styles.tarotGateBtnSub, { color: "rgba(192,132,252,0.6)" }]}>{t("tarotPremiumSubtitle")}</Text>
                  <Text style={[styles.tarotGateBtnCount, { color: "rgba(192,132,252,0.5)" }]}>{t("tarotPremiumCount")}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Dream Coder Card */}
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push("/dream")}>
            <LinearGradient
              colors={["rgba(56, 189, 248, 0.3)", "rgba(99, 102, 241, 0.2)", "rgba(30, 20, 60, 0.8)"]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.cardIcon}>🌙</Text>
              <Text style={styles.cardTitle}>Dream Coder</Text>
              <Text style={styles.cardDescription}>{t("dreamWelcomeDesc")}</Text>
              <View style={[styles.cardBadge, styles.dreamBadge]}>
                <Text style={[styles.cardBadgeText, styles.dreamBadgeText]}>{t("dreamBadge")}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Transit Timeline Card */}
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push("/transits")}>
            <LinearGradient
              colors={["rgba(251, 146, 60, 0.28)", "rgba(168, 85, 247, 0.16)", "rgba(30, 20, 60, 0.82)"]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.cardIcon}>🪐</Text>
              <Text style={styles.cardTitle}>{t("transitTitle")}</Text>
              <Text style={styles.cardDescription}>{t("transitSubtitle")}</Text>
              <View style={[styles.cardBadge, { backgroundColor: "rgba(251,146,60,0.25)", borderColor: "rgba(251,146,60,0.45)" }]}>
                <Text style={[styles.cardBadgeText, { color: "#fdba74" }]}>{t("transitBadge")}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Moon Astro */}
          {moonLoading && !moonData ? (
            <View style={[styles.card, styles.astroCard, { padding: 20 }]}>
              <Text style={styles.loadingText}>{t(LOADING_KEYS[loadingMsgIdx])}</Text>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
                />
              </View>
            </View>
          ) : moonData?.allSlots && moonData.allSlots.length > 0 ? (
            <View>
              <FlatList
                ref={flatListRef}
                data={moonData.allSlots.slice(0, 12)}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                 initialScrollIndex={Math.min(moonData.currentIndex || 0, 11)}
                getItemLayout={(_, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
                keyExtractor={(item) => item.id}
                onScroll={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                  if (idx !== activeSlotIndex && idx >= 0 && idx < Math.min(moonData?.allSlots?.length || 0, 12)) {
                    setActiveSlotIndex(idx);
                  }
                }}
                scrollEventThrottle={100}
                renderItem={({ item: s }) => {
                  const slotStart = new Date(s.start);
                  const today = new Date();
                  const isToday = slotStart.getDate() === today.getDate() && slotStart.getMonth() === today.getMonth() && slotStart.getFullYear() === today.getFullYear();
                  const isLocked = !isPremium && !isToday;
                  const grad = ZODIAC_GRADIENTS[s.zodiac.key] || DEFAULT_GRADIENT;
                  return (
                    <LinearGradient
                      colors={grad as [string, string, ...string[]]}
                      style={[styles.slotCard, { width: CARD_WIDTH }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <StarField count={20} width={CARD_WIDTH} height={220} />
                      <View style={styles.slotDateRow}>
                        <Text style={styles.slotDate} numberOfLines={1}>{formatSlotTime(s.start, todayLabel, tomorrowLabel)}</Text>
                        <Text style={styles.slotDate} numberOfLines={1}>{formatSlotTime(s.end, todayLabel, tomorrowLabel)}</Text>
                      </View>
                      <View style={styles.astroColumns}>
                        <TouchableOpacity style={styles.astroCol} onPress={() => navigatePhase(s)} activeOpacity={0.7} disabled={isLocked}>
                          <Moon3D illumination={getMoonIllumination(new Date())} size={72} />
                          <Text style={styles.astroColName} numberOfLines={1}>{s.phase.name}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.astroCol} onPress={() => navigateZodiac(s)} activeOpacity={0.7} disabled={isLocked}>
                          <Zodiac3D zodiacKey={s.zodiac.key} size={72} />
                          <Text style={styles.astroColName} numberOfLines={1}>{s.zodiac.name}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.astroCol} onPress={() => navigatePlanet(s)} activeOpacity={0.7} disabled={isLocked}>
                          <Planet3D planetKey={s.planet.key} size={72} />
                          <Text style={styles.astroColName} numberOfLines={1}>{s.planet.name}</Text>
                        </TouchableOpacity>
                      </View>
                      {isLocked && (
                        <BlurView intensity={30} tint="dark" style={styles.blurOverlay}>
                          <TouchableOpacity style={styles.unlockButton} onPress={() => router.push("/market")} activeOpacity={0.8}>
                            <Text style={styles.unlockText}>{t("moonPremiumUnlock")}</Text>
                          </TouchableOpacity>
                        </BlurView>
                      )}
                    </LinearGradient>
                  );
                }}
              />
              <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotTabs}>
                {moonData.allSlots.slice(0, 12).map((s, i) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.slotTab, i === activeSlotIndex && styles.slotTabActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveSlotIndex(i);
                      flatListRef.current?.scrollToIndex({ index: i, animated: true });
                    }}
                  >
                    <Text style={[styles.slotTabText, i === activeSlotIndex && styles.slotTabTextActive]} numberOfLines={1}>
                      {formatSlotTime(s.start, todayLabel, tomorrowLabel)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : slot ? (
            <LinearGradient
              colors={(ZODIAC_GRADIENTS[slot.zodiac.key] || DEFAULT_GRADIENT) as [string, string, ...string[]]}
              style={styles.slotCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.astroColumns}>
                <TouchableOpacity style={styles.astroCol} onPress={() => navigatePhase(slot)} activeOpacity={0.7}>
                  <Moon3D illumination={getMoonIllumination(new Date())} size={72} />
                  <Text style={styles.astroColName} numberOfLines={1}>{slot.phase.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.astroCol} onPress={() => navigateZodiac(slot)} activeOpacity={0.7}>
                  <Zodiac3D zodiacKey={slot.zodiac.key} size={72} />
                  <Text style={styles.astroColName} numberOfLines={1}>{slot.zodiac.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.astroCol} onPress={() => navigatePlanet(slot)} activeOpacity={0.7}>
                  <Planet3D planetKey={slot.planet.key} size={72} />
                  <Text style={styles.astroColName} numberOfLines={1}>{slot.planet.name}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : null}

          {/* Daily Horoscope Card */}
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push("/horoscope")}>
            <LinearGradient
              colors={["rgba(251, 146, 60, 0.3)", "rgba(234, 88, 12, 0.2)", "rgba(30, 20, 10, 0.8)"]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.cardIcon}>♈</Text>
              <Text style={styles.cardTitle}>{t("horoscopeTitle")}</Text>
              <Text style={styles.cardDescription}>{t("horoscopeDesc")}</Text>
              <View style={[styles.cardBadge, styles.horoscopeBadge]}>
                <Text style={[styles.cardBadgeText, styles.horoscopeBadgeText]}>{t("horoscopeBadge")}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Natal Chart Card */}
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push("/natal/detail")}>
            <View style={styles.natalCardContainer}>
              <View style={styles.natalBgWrap}>
                <Image
                  source={require("../assets/natalchart.jpg")}
                  style={styles.natalBgImage}
                  resizeMode="cover"
                />
              </View>
              <LinearGradient
                colors={["rgba(10, 5, 25, 0.45)", "rgba(139, 92, 246, 0.08)", "rgba(10, 5, 25, 0.8)"]}
                style={styles.natalCardOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Text style={styles.cardTitle}>{t("natalTitle")}</Text>
                <Text style={styles.cardDescription}>{t("natalDesc")}</Text>
                <View style={[styles.cardBadge, styles.natalBadge]}>
                  <Text style={[styles.cardBadgeText, styles.natalBadgeText]}>{t("natalBadge")}</Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══ TAROT MASASI ═══ */}
        <View style={styles.masaSection}>
          <View style={styles.masaHeader}>
            <Text style={styles.masaTitle}>Tarot Masası</Text>
          </View>

          {tarotMasaLoading && (
            <ActivityIndicator color="#a855f7" size="small" style={{ marginVertical: 20 }} />
          )}
        </View>

        {/* ── Büyük Arkana ── */}
        {majorArcanaCards.length > 0 && (
          <View style={{ alignSelf: "stretch", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <MaterialCommunityIcons name="star-four-points-outline" size={16} color="rgba(255,255,255,0.55)" />
              <Text style={[styles.masaGroupLabel, { marginBottom: 0 }]}>{t("majorArcana")}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}>
              {majorArcanaCards.map(renderMasaCard)}
            </ScrollView>
          </View>
        )}

        {/* ── Küçük Arkana ── */}
        {minorArcanaSuits.length > 0 && (
          <View style={{ alignSelf: "stretch", marginTop: 12, marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="cards-outline" size={16} color="rgba(255,255,255,0.55)" />
              <Text style={[styles.masaGroupLabel, { marginBottom: 0 }]}>{t("minorArcana")}</Text>
            </View>
          </View>
        )}

        {minorArcanaSuits.map(({ suit, icon, label, cards }) => (
          <View key={suit} style={{ alignSelf: "stretch", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8, marginBottom: 8 }}>
              <MaterialCommunityIcons name={icon as any} size={14} color="rgba(255,255,255,0.5)" />
              <Text style={[styles.masaGroupLabel, { fontSize: 13, opacity: 0.85, marginBottom: 0 }]}>{label}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}>
              {cards.map(renderMasaCard)}
            </ScrollView>
          </View>
        ))}

        {/* Version */}
        <Text style={styles.version}>v4.1</Text>
      </ScrollView>

      {/* ═══ CARD DETAIL MODAL ═══ */}
      <Modal
        visible={!!selectedCard}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.cardModalOverlay}>
          <View style={styles.cardModalSheet}>
            {selectedCard && (
              <>
                {/* Close */}
                <TouchableOpacity style={styles.cardModalClose} onPress={() => setSelectedCard(null)}>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>✕</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Card tile + name */}
                  {(() => {
                    const SUIT_COLORS: Record<string, string[]> = {
                      wands:     ["rgba(251,146,60,0.6)",  "rgba(180,60,0,0.9)"],
                      cups:      ["rgba(56,189,248,0.6)",  "rgba(0,80,160,0.9)"],
                      swords:    ["rgba(148,163,184,0.6)", "rgba(30,50,80,0.9)"],
                      pentacles: ["rgba(74,222,128,0.6)",  "rgba(0,80,30,0.9)"],
                    };
                    const SUIT_ICON_MAP: Record<string, string> = { wands: "magic-staff", cups: "cup", swords: "sword-cross", pentacles: "star-four-points" };
                    const cc = selectedCard.suit ? SUIT_COLORS[selectedCard.suit] || ["rgba(168,85,247,0.6)", "rgba(40,10,60,0.9)"] : ["rgba(168,85,247,0.6)", "rgba(40,10,60,0.9)"];
                    const iconName = selectedCard.suit ? SUIT_ICON_MAP[selectedCard.suit] || "cards-outline" : "cards-outline";
                    const SUIT_I18N: Record<string, string> = { wands: t("suitWands"), cups: t("suitCups"), swords: t("suitSwords"), pentacles: t("suitPentacles") };
                    const suitLabel = selectedCard.arcana === "major" ? t("majorArcana") : (selectedCard.suit ? SUIT_I18N[selectedCard.suit] || selectedCard.suit : "");
                    return (
                      <View style={styles.cardModalHero}>
                        <LinearGradient colors={cc as [string, string]} style={styles.cardModalImage} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <MaterialCommunityIcons name={iconName as any} size={32} color="rgba(255,255,255,0.7)" />
                          {selectedCard.number ? <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 8 }}>{selectedCard.number}</Text> : null}
                        </LinearGradient>
                        <View style={styles.cardModalMeta}>
                          <Text style={styles.cardModalName}>{selectedCard.name}</Text>
                          <Text style={styles.cardModalBadge}>{suitLabel}{selectedCard.number ? `  ·  ${selectedCard.number}` : ""}</Text>
                          {selectedCard.element && (
                            <Text style={styles.cardModalElement}>{selectedCard.element}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Tarih & Sembolizm — herkese açık */}
                  {selectedCard.history && (
                    <View style={styles.cardModalHistoryBox}>
                      <Text style={styles.cardModalHistoryLabel}>{t("historySymbolism")}</Text>
                      <Text style={styles.cardModalHistoryText}>{selectedCard.history}</Text>
                    </View>
                  )}

                  {/* Affirmation / Motto */}
                  {selectedCard.affirmation && (
                    <View style={[styles.cardModalHistoryBox, { alignItems: "center", paddingVertical: 20 }]}>
                      <MaterialCommunityIcons name="format-quote-open" size={20} color="rgba(167,139,250,0.5)" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", fontStyle: "italic", textAlign: "center", lineHeight: 22, paddingHorizontal: 8 }}>
                        "{selectedCard.affirmation}"
                      </Text>
                      <Text style={{ fontSize: 12, color: "rgba(167,139,250,0.6)", fontWeight: "600", marginTop: 10 }}>
                        — {selectedCard.name}
                      </Text>
                    </View>
                  )}

                  {/* Semboller — chip + meaning list */}
                  {selectedCard.symbols && selectedCard.symbols.length > 0 && (
                    <View style={styles.cardModalHistoryBox}>
                      <Text style={styles.cardModalHistoryLabel}>{t("cardSymbols")}</Text>
                      {selectedCard.symbols.map((sym, idx) => (
                        <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
                          <View style={{ backgroundColor: "rgba(167,139,250,0.1)", borderWidth: 1, borderColor: "rgba(167,139,250,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, color: "#a78bfa", fontWeight: "700" }}>{sym.symbol}</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", flex: 1 }}>{sym.meaning}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Kart Geçmişi — herkese açık, AsyncStorage'dan */}
                  <View style={styles.cardModalHistoryBox}>
                    <Text style={styles.cardModalHistoryLabel}>{t("yourCardHistory")}</Text>
                    {cardDrawHistory.length === 0 ? (
                      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                        {t("cardNotDrawn")}
                      </Text>
                    ) : (
                      <>
                        <Text style={{ fontSize: 13, color: "#a78bfa", fontWeight: "700", marginBottom: 10 }}>
                          {t("timesDrawn", { count: cardDrawHistory.length })}
                        </Text>
                        {cardDrawHistory.slice(0, 5).map((r, i) => (
                          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: i < Math.min(cardDrawHistory.length, 5) - 1 ? 1 : 0, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>
                                {SPREAD_LABELS[r.spreadType] || r.spreadType}
                              </Text>
                              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                                {new Date(r.date).toLocaleDateString(language === "tr" ? "tr-TR" : language === "de" ? "de-DE" : language === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                              </Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                {FOCUS_LABELS[r.focusArea] || r.focusArea}
                              </Text>
                              <Text style={{ fontSize: 11, color: r.orientation === "upright" ? "#4ade80" : "#f87171", fontWeight: "700" }}>
                                {r.orientation === "upright" ? `● ${t("upright")}` : `● ${t("reversed")}`}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>

                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════ */}
      {/* SETTINGS MODAL                                 */}
      {/* ═══════════════════════════════════════════════ */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={closeSettings}>
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>⚙️ Ayarlar</Text>
              <TouchableOpacity onPress={closeSettings} activeOpacity={0.7}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {statusLoading && !moonStatus ? (
                <ActivityIndicator color="#a855f7" size="small" style={{ marginTop: 20 }} />
              ) : (
                <>
                  {/* ─── Günlük Burç (Dive Deep) Section ─── */}
                  <View style={ms.section}>
                    <Text style={ms.sectionTitle}>♈ Günlük Burç Test Verisi (Dive Deep)</Text>

                    {/* Element Balance */}
                    {(() => {
                      const el = calcElements(natalSun, natalMoon, natalRising);
                      return (
                        <View style={[ms.infoBox, { marginBottom: 10 }]}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Element</Text>
                            <Text style={ms.infoValue}>
                              🔥{el.fire}  🌍{el.earth}  💨{el.air}  💧{el.water}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Baskın</Text>
                            <Text style={[ms.infoValue, { color: "#fbbf24", fontWeight: "900" }]}>
                              {el.dominant === "fire" ? "🔥 Ateş" : el.dominant === "earth" ? "🌍 Toprak" : el.dominant === "air" ? "💨 Hava" : "💧 Su"}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}

                    {/* ☉ Güneş Burcu */}
                    <Text style={ms.inputLabel}>☉ Güneş Burcu</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={ms.signRow}>
                        {ZODIAC_LIST.map((z) => (
                          <TouchableOpacity
                            key={`sun_${z.key}`}
                            style={[ms.signChip, natalSun === z.key && ms.signChipActive]}
                            onPress={() => setNatalSun(z.key)}
                            activeOpacity={0.7}
                          >
                            <Text style={[ms.signChipText, natalSun === z.key && { color: "#fbbf24" }]}>
                              {z.symbol}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* ☽ Ay Burcu */}
                    <Text style={ms.inputLabel}>☽ Ay Burcu</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={ms.signRow}>
                        {ZODIAC_LIST.map((z) => (
                          <TouchableOpacity
                            key={`moon_${z.key}`}
                            style={[ms.signChip, natalMoon === z.key && ms.signChipActiveMoon]}
                            onPress={() => setNatalMoon(z.key)}
                            activeOpacity={0.7}
                          >
                            <Text style={[ms.signChipText, natalMoon === z.key && { color: "#c084fc" }]}>
                              {z.symbol}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* ↑ Yükselen (opsiyonel) */}
                    <Text style={ms.inputLabel}>↑ Yükselen (opsiyonel)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={ms.signRow}>
                        <TouchableOpacity
                          style={[ms.signChip, natalRising === null && ms.signChipActiveRising]}
                          onPress={() => setNatalRising(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={[ms.signChipText, natalRising === null && { color: "#38bdf8" }]}>—</Text>
                        </TouchableOpacity>
                        {ZODIAC_LIST.map((z) => (
                          <TouchableOpacity
                            key={`rising_${z.key}`}
                            style={[ms.signChip, natalRising === z.key && ms.signChipActiveRising]}
                            onPress={() => setNatalRising(z.key)}
                            activeOpacity={0.7}
                          >
                            <Text style={[ms.signChipText, natalRising === z.key && { color: "#38bdf8" }]}>
                              {z.symbol}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Save */}
                    <TouchableOpacity
                      style={ms.actionBtn}
                      onPress={saveNatalChart}
                      disabled={natalLoading}
                      activeOpacity={0.7}
                    >
                      {natalLoading ? (
                        <ActivityIndicator color="#a855f7" size="small" />
                      ) : (
                        <Text style={ms.actionBtnText}>{natalSaved ? "✓ Kaydet" : "💾 Kaydet"}</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* ─── Natal Chart Verileri (Mock) Section ─── */}
                  <View style={ms.section}>
                    <Text style={ms.sectionTitle}>🪐 Natal Chart  Test Verileri (Mock)</Text>

                    {mockNatalData.input ? (
                      <>
                        <View style={ms.infoBox}>
                          <View style={ms.infoRow}>
                            <Text style={[ms.infoLabel, { color: "#a78bfa", fontWeight: "800" }]}>Input</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Doğum Tarihi</Text>
                            <Text style={ms.infoValue}>{mockNatalData.input.birthDate}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Doğum Saati</Text>
                            <Text style={ms.infoValue}>{mockNatalData.input.birthTime}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Enlem / Boylam</Text>
                            <Text style={ms.infoValue}>{mockNatalData.input.latitude}, {mockNatalData.input.longitude}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Timezone</Text>
                            <Text style={ms.infoValue}>{mockNatalData.input.timezone}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Ev Sistemi</Text>
                            <Text style={ms.infoValue}>{mockNatalData.input.houseSystem}</Text>
                          </View>
                        </View>

                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={[ms.infoLabel, { color: "#a78bfa", fontWeight: "800" }]}>Output — Gezegen Konumları</Text>
                          </View>
                          {(mockNatalData.planets || []).map((p: any) => (
                            <View key={p.name} style={[ms.infoRow, { paddingVertical: 3 }]}>
                              <Text style={[ms.infoLabel, { fontSize: 10 }]}>
                                {p.symbol} {p.name}
                              </Text>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>
                                {p.degree}°{p.minute}' {p.sign}
                                {p.house ? ` | Ev ${p.house}` : ""}
                                {p.retrograde ? " ℞" : ""}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {/* Hesaplanan Analiz Verileri */}
                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={[ms.infoLabel, { color: "#fbbf24", fontWeight: "800" }]}>Hesaplanan Analiz (Natal verilerinden)</Text>
                          </View>

                          <View style={[ms.infoRow, { marginTop: 4 }]}>
                            <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Aspects (Orb)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>☌ ☽Moon - ♀Venus conjunction (0.3°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>☌ ☿Mercury - ♂Mars conjunction (0.3°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>□ ♀Venus - ASC square (0.3°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>□ ☽Moon - ASC square (0.5°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>△ ☿Mercury - ☊North Node trine (0.6°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>△ ♃Jupiter - ♄Saturn trine (2.1°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>□ ☉Sun - ♃Jupiter square (2.3°)</Text>
                          </View>
                          <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>☌ ♄Saturn - ♆Neptune conjunction (3.6°)</Text>
                          </View>

                          <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 6 }}>
                            <View style={ms.infoRow}>
                              <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Ev Yoğunlukları</Text>
                            </View>
                            <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>Ev 5: sun, mercury, mars, black_moon (4 — Stellium!)</Text>
                            </View>
                            <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>Ev 4: moon, venus, south_node (3)</Text>
                            </View>
                            <View style={[ms.infoRow, { paddingVertical: 2 }]}>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>Ev 10: saturn, neptune, north_node (3)</Text>
                            </View>
                          </View>

                          <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 6 }}>
                            <View style={ms.infoRow}>
                              <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Element Dengesi</Text>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>🔥1  🌍1  💨8  💧11</Text>
                            </View>
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Baskın</Text>
                              <Text style={[ms.infoValue, { color: "#818cf8", fontWeight: "900" }]}>💧 Su (Water)</Text>
                            </View>
                          </View>

                          <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 6 }}>
                            <View style={ms.infoRow}>
                              <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Retrograde</Text>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>♄ Saturn, ♅ Uranus, ♆ Neptune</Text>
                            </View>
                          </View>
                        </View>
                      </>
                    ) : (
                      <ActivityIndicator color="#a78bfa" size="small" style={{ marginTop: 10 }} />
                    )}

                    {/* Delete Natal Interpretation */}
                    <View style={ms.actionRow}>
                      <TouchableOpacity
                        style={[ms.actionBtn, ms.actionBtnDanger]}
                        onPress={() => adminAction("natal_delete")}
                        disabled={actionLoading === "natal_delete"}
                        activeOpacity={0.7}
                      >
                        {actionLoading === "natal_delete" ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <Text style={[ms.actionBtnText, ms.actionBtnDangerText]}>🗑 Natal Yorumu Sil</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ─── Transit Takibi Section ─── */}
                  <View style={ms.section}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={ms.sectionTitle}>🪐 Transit Takibi (TR)</Text>
                      {transitStatus && (
                        <View style={[ms.bufferBadge, {
                          backgroundColor: transitStatus.hasCache ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
                          borderColor: transitStatus.hasCache ? "rgba(34,197,94,0.5)" : "rgba(251,191,36,0.5)",
                        }]}>
                          <Text style={[ms.bufferBadgeText, { color: transitStatus.hasCache ? "#4ade80" : "#fbbf24" }]}>
                            {transitStatus.hasCache ? "✓ Takip Var" : "⚠ Takip Yok"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {transitStatus && (
                      <>
                        {transitStatus?.methodSummary?.title && (
                        <View style={ms.infoBox}>
                          <View style={ms.infoRow}>
                            <Text style={[ms.infoLabel, { color: "#fbbf24", fontWeight: "800" }]}>
                              {transitStatus.methodSummary.title}
                            </Text>
                          </View>
                          {(transitStatus.methodSummary.steps || []).map((step: string, i: number) => (
                            <View key={i} style={[ms.infoRow, { alignItems: "flex-start", paddingVertical: 2 }]}>
                              <Text style={[ms.infoValue, { fontSize: 10, lineHeight: 15 }]}>{`${i + 1}) ${step}`}</Text>
                            </View>
                          ))}
                        </View>
                        )}

                        {transitStatus.mockupSnapshot && (
                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Mockup Snapshot (şu anki gökyüzü)</Text>
                            <Text style={[ms.infoValue, { fontSize: 10 }]}>
                              {new Date(transitStatus.mockupSnapshot.generatedAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Natal gezegen sayısı</Text>
                            <Text style={ms.infoValue}>{transitStatus.mockupSnapshot.natalPlanetCount}</Text>
                          </View>
                          <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 6 }}>
                            <View style={ms.infoRow}>
                              <Text style={[ms.infoLabel, { color: "#a78bfa", fontSize: 10 }]}>Kullanılan Konum Planı</Text>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>{transitStatus.mockupSnapshot.locationsUsed?.length || 0} konum</Text>
                            </View>
                            {(transitStatus.mockupSnapshot.locationsUsed || []).map((loc, i) => (
                              <View key={i} style={[ms.infoRow, { paddingVertical: 2 }]}>
                                <Text style={[ms.infoLabel, { fontSize: 10 }]}>{loc.city}</Text>
                                <Text style={[ms.infoValue, { fontSize: 10 }]}>
                                  {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)} | UTC{loc.utcOffset >= 0 ? "+" : ""}{loc.utcOffset}
                                  {loc.startDate || loc.endDate ? ` | ${loc.startDate || "?"}→${loc.endDate || "?"}` : ""}
                                </Text>
                              </View>
                            ))}
                          </View>
                          {(transitStatus.mockupSnapshot.currentTransitPositions || []).slice(0, 6).map((p, i) => (
                            <View key={i} style={[ms.infoRow, { paddingVertical: 2 }]}>
                              <Text style={[ms.infoLabel, { fontSize: 10 }]}>{p.planet}</Text>
                              <Text style={[ms.infoValue, { fontSize: 10 }]}>
                                {p.degree}°{String(p.minute).padStart(2, "0")} {p.sign}{p.retrograde ? " (R)" : ""}
                              </Text>
                            </View>
                          ))}
                        </View>
                        )}

                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Kaydedilmiş dönemler</Text>
                            <Text style={ms.infoValue}>{transitStatus.periods.length}</Text>
                          </View>
                          {transitStatus.periods.length === 0 ? (
                            <View style={ms.infoRow}>
                              <Text style={[ms.infoValue, { color: "rgba(255,255,255,0.4)", fontSize: 11 }]}>Henüz transit satın alımı yok.</Text>
                            </View>
                          ) : (
                            transitStatus.periods.map((r, i) => (
                              <View key={i} style={[ms.infoRow, { paddingVertical: 2 }]}>
                                <Text style={[ms.infoLabel, { fontSize: 10 }]}>{r.months} ay</Text>
                                <Text style={[ms.infoValue, { fontSize: 10 }]}>
                                  {r.events} olay · {r.period?.start || "?"}→{r.period?.end || "?"}
                                </Text>
                              </View>
                            ))
                          )}
                        </View>
                      </>
                    )}

                    <View style={ms.actionRow}>
                      <TouchableOpacity
                        style={[ms.actionBtn, ms.actionBtnDanger]}
                        onPress={() => adminAction("transit_delete")}
                        disabled={actionLoading === "transit_delete"}
                        activeOpacity={0.7}
                      >
                        {actionLoading === "transit_delete" ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <Text style={[ms.actionBtnText, ms.actionBtnDangerText]}>🗑 Transit Takibini Sil</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ─── Moon Astro Section ─── */}
                  <View style={ms.section}>
                    {/* Header with buffer badge */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={ms.sectionTitle}>🌙 Moon Astro</Text>
                      {moonStatus && (
                        <View style={[ms.bufferBadge, {
                          backgroundColor: moonStatus.isGenerating ? "rgba(251,191,36,0.15)" : moonStatus.bufferOk ? "rgba(34,197,94,0.15)" : moonStatus.remainingHours < 6 ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                          borderColor: moonStatus.isGenerating ? "rgba(251,191,36,0.5)" : moonStatus.bufferOk ? "rgba(34,197,94,0.5)" : moonStatus.remainingHours < 6 ? "rgba(239,68,68,0.5)" : "rgba(251,191,36,0.5)",
                        }]}>
                          <Text style={[ms.bufferBadgeText, {
                            color: moonStatus.isGenerating ? "#fbbf24" : moonStatus.bufferOk ? "#4ade80" : moonStatus.remainingHours < 6 ? "#ef4444" : "#fbbf24",
                          }]}>
                            {moonStatus.isGenerating ? "⏳ Üretiliyor" : moonStatus.bufferOk ? "✓ Buffer OK" : moonStatus.remainingHours < 6 ? "🔴 Kritik" : "⚠ Dikkat"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {moonStatus && (
                      <>
                        {/* ── Özet Bilgiler ── */}
                        <View style={ms.infoBox}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Slot sayısı</Text>
                            <Text style={ms.infoValue}>
                              {moonStatus.slotCount} ({moonStatus.slotsWithContent ?? 0}/{moonStatus.slotCount} içerik)
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Cache bitiş</Text>
                            <Text style={[ms.infoValue, {
                              color: moonStatus.bufferOk ? "#4ade80" : moonStatus.remainingHours < 6 ? "#ef4444" : "#fbbf24"
                            }]}>
                              {formatMinutes(moonStatus.remainingMinutes)} kaldı
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Üretildi kadar</Text>
                            <Text style={ms.infoValue}>
                              {moonStatus.generatedUntil
                                ? new Date(moonStatus.generatedUntil).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Sonraki geçiş</Text>
                            <Text style={ms.infoValue}>{formatMinutes(moonStatus.nextTransitionMinutes)}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Diller</Text>
                            <Text style={ms.infoValue}>{moonStatus.languages.join(", ").toUpperCase()}</Text>
                          </View>
                        </View>

                        {/* ── Cron Log ── */}
                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Cron</Text>
                            <Text style={[ms.infoValue, { color: "#4ade80" }]}>● Aktif (her 6 saatte)</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Sonraki cron</Text>
                            <Text style={ms.infoValue}>
                              {moonStatus.nextCronRun
                                ? new Date(moonStatus.nextCronRun).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Son çalışma</Text>
                            <Text style={ms.infoValue}>
                              {moonStatus.lastCronRun
                                ? new Date(moonStatus.lastCronRun).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                                : "Henüz çalışmadı"}
                            </Text>
                          </View>
                          {moonStatus.lastCronAction && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Son aksiyon</Text>
                              <Text style={[ms.infoValue, {
                                color: moonStatus.lastCronAction === "generated" ? "#fb923c" : moonStatus.lastCronAction === "skipped" ? "rgba(255,255,255,0.4)" : "#fbbf24"
                              }]}>
                                {moonStatus.lastCronAction === "generated"
                                  ? `Üretildi (${moonStatus.lastCronRemainingHours}h kalmıştı)`
                                  : moonStatus.lastCronAction === "skipped"
                                  ? `Atlandı (${moonStatus.lastCronRemainingHours}h yeterliydi)`
                                  : moonStatus.lastCronAction}
                              </Text>
                            </View>
                          )}
                          {moonStatus.lastCronError && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Hata</Text>
                              <Text style={[ms.infoValue, { color: "#ef4444", fontSize: 10 }]}>
                                {moonStatus.lastCronError}
                              </Text>
                            </View>
                          )}
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Toplam çalışma</Text>
                            <Text style={ms.infoValue}>{moonStatus.cronTotalRuns ?? 0} kez</Text>
                          </View>
                        </View>

                        {/* ── Slot Listesi (toggle) ── */}
                        {(moonStatus.slotList?.length ?? 0) > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <TouchableOpacity
                              onPress={() => setSlotListOpen(v => !v)}
                              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}
                              activeOpacity={0.7}
                            >
                              <Text style={[ms.infoLabel, { color: "rgba(255,255,255,0.5)" }]}>
                                {slotListOpen ? "▲" : "▼"} SLOT LİSTESİ ({moonStatus.slotList.length})
                              </Text>
                            </TouchableOpacity>
                            {slotListOpen && (
                              <View style={ms.infoBox}>
                                {moonStatus.slotList.map((slot) => (
                                  <View key={slot.id} style={[ms.infoRow, {
                                    paddingVertical: 5,
                                    backgroundColor: slot.isCurrent ? "rgba(139,92,246,0.12)" : "transparent",
                                    borderRadius: 6,
                                    paddingHorizontal: slot.isCurrent ? 4 : 0,
                                  }]}>
                                    <View style={{ flex: 1, gap: 2 }}>
                                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: slot.isCurrent ? "#a78bfa" : slot.hasContent ? "#4ade80" : "#ef4444" }} />
                                        <Text style={{ fontSize: 9, color: slot.isCurrent ? "#a78bfa" : "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                                          {new Date(slot.start).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                          {" → "}
                                          {new Date(slot.end).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                          {slot.isCurrent ? " ◀ AKTİF" : ""}
                                        </Text>
                                      </View>
                                      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", paddingLeft: 11 }}>
                                        {slot.phase} · {slot.zodiac} · {slot.planet}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: slot.hasContent ? "#4ade80" : "#ef4444", fontWeight: "800" }}>
                                      {slot.hasContent ? "✓" : "✗"}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}

                        {moonStatus.isGenerating && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                            <ActivityIndicator color="#a78bfa" size="small" />
                            <Text style={{ color: "#fbbf24", fontSize: 11 }}>Üretiliyor... (4s'de otomatik yenileniyor)</Text>
                          </View>
                        )}
                      </>
                    )}

                    <View style={[ms.actionRow, { marginTop: 12 }]}>
                      <TouchableOpacity
                        style={[ms.actionBtn, ms.actionBtnWide, { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.3)" }]}
                        onPress={() => adminAction("moon_force_generate")}
                        disabled={actionLoading === "moon_force_generate" || moonStatus?.isGenerating}
                        activeOpacity={0.7}
                      >
                        {actionLoading === "moon_force_generate" || moonStatus?.isGenerating ? (
                          <ActivityIndicator color="#a78bfa" size="small" />
                        ) : (
                          <Text style={[ms.actionBtnText, { color: "#a78bfa" }]}>⚡ Force Üret</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {moonStatus?.genProgress && (
                      <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                            {moonStatus.genProgress.phase === "chatgpt" ? "ChatGPT" : moonStatus.genProgress.phase === "deepl" ? "DeepL çeviri" : "Tamamlandı"}
                          </Text>
                          <Text style={{ fontSize: 11, color: "rgba(167,139,250,0.7)" }}>
                            {moonStatus.genProgress.done}/{moonStatus.genProgress.total}
                          </Text>
                        </View>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <View style={{ height: 6, borderRadius: 3, backgroundColor: "#a78bfa", width: `${moonStatus.genProgress.total > 0 ? Math.round((moonStatus.genProgress.done / moonStatus.genProgress.total) * 100) : 0}%` }} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* ─── Horoscope Section ─── */}
                  <View style={ms.section}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={ms.sectionTitle}>♈ Daily Horoscope</Text>
                      {horoscopeStatus && (
                        <View style={[ms.bufferBadge, { backgroundColor: horoscopeStatus.bufferOk ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", borderColor: horoscopeStatus.bufferOk ? "rgba(34,197,94,0.5)" : "rgba(251,191,36,0.5)" }]}>
                          <Text style={[ms.bufferBadgeText, { color: horoscopeStatus.bufferOk ? "#4ade80" : "#fbbf24" }]}>
                            {horoscopeStatus.isGenerating ? "⏳ Üretiliyor" : horoscopeStatus.bufferOk ? "✓ Buffer OK" : "⚠ Buffer Eksik"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {horoscopeStatus && (
                      <>
                        {/* ── Özet Satırları ── */}
                        <View style={ms.infoBox}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Toplam yorum</Text>
                            <Text style={ms.infoValue}>{horoscopeStatus.totalHoroscopes} ({horoscopeStatus.cachedDates.length} gün)</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Cache sonu</Text>
                            <Text style={[ms.infoValue, { color: horoscopeStatus.bufferOk ? "#4ade80" : "#fbbf24" }]}>
                              {horoscopeStatus.maxCachedDate || "—"}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Dün / Bugün / Yarın</Text>
                            <Text style={ms.infoValue}>
                              {horoscopeStatus.hasYesterday ? "✓" : "✗"} / {horoscopeStatus.hasToday ? "✓" : "✗"} / {horoscopeStatus.hasTomorrow ? "✓" : "✗"}
                            </Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Yeni güne kalan</Text>
                            <Text style={ms.infoValue}>{formatMinutes(horoscopeStatus.untilNextDayMinutes)}</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Sonraki cron</Text>
                            <Text style={ms.infoValue}>
                              {horoscopeStatus.nextCronRun ? new Date(horoscopeStatus.nextCronRun).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </Text>
                          </View>
                          {horoscopeStatus.lastUpdated && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Son güncelleme</Text>
                              <Text style={ms.infoValue}>{new Date(horoscopeStatus.lastUpdated).toLocaleTimeString("tr-TR")}</Text>
                            </View>
                          )}
                        </View>

                        {/* ── Cron Log ── */}
                        <View style={[ms.infoBox, { marginTop: 8 }]}>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Cron</Text>
                            <Text style={[ms.infoValue, { color: "#4ade80" }]}>● Aktif (00:05 UTC)</Text>
                          </View>
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Son çalışma</Text>
                            <Text style={ms.infoValue}>
                              {horoscopeStatus.lastCronRun ? new Date(horoscopeStatus.lastCronRun).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Henüz çalışmadı"}
                            </Text>
                          </View>
                          {horoscopeStatus.lastCronGenerated?.length > 0 && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Son üretilenler</Text>
                              <Text style={[ms.infoValue, { color: "#fb923c", fontSize: 10 }]}>
                                {horoscopeStatus.lastCronGenerated.join(", ")}
                              </Text>
                            </View>
                          )}
                          {horoscopeStatus.lastCronSkipped?.length > 0 && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Atlandı (zaten var)</Text>
                              <Text style={[ms.infoValue, { fontSize: 10, color: "rgba(255,255,255,0.35)" }]}>
                                {horoscopeStatus.lastCronSkipped.join(", ")}
                              </Text>
                            </View>
                          )}
                          {horoscopeStatus.lastCronError && (
                            <View style={ms.infoRow}>
                              <Text style={ms.infoLabel}>Hata</Text>
                              <Text style={[ms.infoValue, { color: "#ef4444", fontSize: 10 }]}>
                                {horoscopeStatus.lastCronError}
                              </Text>
                            </View>
                          )}
                          <View style={ms.infoRow}>
                            <Text style={ms.infoLabel}>Toplam çalışma</Text>
                            <Text style={ms.infoValue}>{horoscopeStatus.cronTotalRuns ?? 0} kez</Text>
                          </View>
                        </View>

                        {/* ── Per-Date Listesi ── */}
                        {Object.keys(horoscopeStatus.dateDetails || {}).length > 0 && (
                          <View style={[ms.infoBox, { marginTop: 8 }]}>
                            <Text style={[ms.infoLabel, { marginBottom: 8 }]}>CACHE İÇERİĞİ</Text>
                            {Object.entries(horoscopeStatus.dateDetails)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([date, info]) => {
                                const roleLabels: Record<string, string> = {
                                  yesterday: "Dün",
                                  today: "Bugün",
                                  tomorrow: "Yarın",
                                  buffer: "Buffer",
                                  future: "İleri",
                                  past: "Geçmiş",
                                };
                                const roleColors: Record<string, string> = {
                                  yesterday: "rgba(255,255,255,0.35)",
                                  today: "#4ade80",
                                  tomorrow: "#38bdf8",
                                  buffer: "#fb923c",
                                  future: "#a78bfa",
                                  past: "rgba(255,255,255,0.2)",
                                };
                                return (
                                  <View key={date} style={[ms.infoRow, { paddingVertical: 4 }]}>
                                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: roleColors[info.role] || "#fff" }} />
                                      <Text style={[ms.infoLabel, { color: roleColors[info.role] || "#fff", fontSize: 11 }]}>
                                        {date}
                                      </Text>
                                      <Text style={{ fontSize: 9, color: roleColors[info.role] || "#fff", opacity: 0.7, fontWeight: "700" }}>
                                        {roleLabels[info.role] || info.role}
                                      </Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                      <Text style={[ms.infoValue, { fontSize: 11 }]}>{info.count} yorum</Text>
                                      {info.createdAt && (
                                        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                                          {new Date(info.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                          </View>
                        )}

                        {/* Auto-refresh indicator */}
                        {horoscopeStatus.isGenerating && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                            <ActivityIndicator color="#fb923c" size="small" />
                            <Text style={{ color: "#fbbf24", fontSize: 11 }}>Üretiliyor... (4s'de otomatik yenileniyor)</Text>
                          </View>
                        )}
                      </>
                    )}

                    <View style={[ms.actionRow, { marginTop: 12 }]}>
                      <TouchableOpacity
                        style={[ms.actionBtn, ms.actionBtnWide]}
                        onPress={() => adminAction("horoscope_generate")}
                        disabled={actionLoading === "horoscope_generate" || horoscopeStatus?.isGenerating}
                        activeOpacity={0.7}
                      >
                        {actionLoading === "horoscope_generate" ? (
                          <ActivityIndicator color="#fb923c" size="small" />
                        ) : (
                          <Text style={[ms.actionBtnText, { color: "#fb923c" }]}>⚡ Check & Fill</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[ms.actionBtn, ms.actionBtnDanger]}
                        onPress={() => adminAction("horoscope_delete")}
                        disabled={actionLoading === "horoscope_delete"}
                        activeOpacity={0.7}
                      >
                        {actionLoading === "horoscope_delete" ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <Text style={[ms.actionBtnText, ms.actionBtnDangerText]}>🗑 Sil</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ─── Action Result ─── */}
                  {actionResult && (
                    <View style={ms.resultBox}>
                      <Text style={ms.resultText}>{actionResult}</Text>
                    </View>
                  )}

                  {/* ─── Refresh Button ─── */}
                  <TouchableOpacity style={ms.refreshBtn} onPress={() => fetchStatuses()} activeOpacity={0.7}>
                    {statusLoading ? (
                      <ActivityIndicator color="#a855f7" size="small" />
                    ) : (
                      <Text style={ms.refreshBtnText}>🔄 Durumu Yenile</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  topBar: {
    width: "100%",
    marginBottom: 20,
    zIndex: 100,
  },
  glassBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "visible",
  },
  barCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  barSep: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  barText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  barTextPremium: {
    color: "#c084fc",
  },
  barFlag: { fontSize: 14 },
  barArrow: { color: "rgba(255,255,255,0.35)", fontSize: 7, marginLeft: 1 },
  barTextGem: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "800",
  },
  barTextMarket: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "800",
  },
  langDropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: "rgba(30,20,50,0.97)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
    paddingVertical: 4,
    minWidth: 120,
    zIndex: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  langDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  langDropdownItemActive: {
    backgroundColor: "rgba(168,85,247,0.2)",
  },
  langDropdownFlag: { fontSize: 16 },
  langDropdownText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  langDropdownTextActive: { color: "#c084fc" },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 3,
  },
  appSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 6,
    marginTop: 4,
    textTransform: "uppercase",
  },
  astroCard: {
    overflow: "hidden",
    backgroundColor: "rgba(20, 15, 40, 0.9)",
    padding: 20,
  },
  slotCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    overflow: "hidden",
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 14,
    textAlign: "center",
    minHeight: 18,
  },
  progressBarBg: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 3,
    backgroundColor: "#fbbf24",
    borderRadius: 2,
  },
  slotDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  slotDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "600",
  },
  slotTabs: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  slotTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  slotTabActive: {
    backgroundColor: "rgba(168, 85, 247, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  slotTabText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "600",
  },
  slotTabTextActive: {
    color: "#c084fc",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(168, 85, 247, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.7)",
  },
  unlockText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  astroColumns: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  astroCol: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
  },
  astroColName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  cardsContainer: {
    width: "100%",
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  cardGradient: {
    padding: 24,
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 12,
  },
  cardBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  cardBadgeText: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tarotGateRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  tarotGateCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tarotGateCardPremium: {
    backgroundColor: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.15)",
  },
  tarotGateBtnTitle: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  tarotGateBtnSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  tarotGateBtnCount: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dreamBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  dreamBadgeText: {
    color: "#7dd3fc",
  },
  horoscopeBadge: {
    backgroundColor: "rgba(251, 146, 60, 0.2)",
    borderColor: "rgba(251, 146, 60, 0.4)",
  },
  horoscopeBadgeText: {
    color: "#fb923c",
  },
  natalBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  natalBadgeText: {
    color: "#a78bfa",
  },
  natalCardContainer: {
    overflow: "hidden",
    borderRadius: 20,
    position: "relative",
  },
  natalBgWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  natalBgImage: {
    width: 220,
    height: SCREEN_WIDTH,
    transform: [{ rotate: "90deg" }],
    opacity: 0.55,
  },
  natalCardOverlay: {
    padding: 24,
    alignItems: "center",
  },
  version: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 12,
    marginTop: 24,
  },

  // ── Tarot Masası ──
  masaSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  masaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  masaTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  masaSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },
  masaGroupLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 10,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  masaCardItem: {
    width: 72,
    alignItems: "center",
  },
  masaCardTile: {
    width: 68,
    height: 110,
    borderRadius: 10,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  masaCardEmoji: {
    fontSize: 22,
  },
  masaCardNumber: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 1,
  },
  masaCardName: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 13,
  },

  // ── Card Detail Modal ──
  cardModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  cardModalSheet: {
    backgroundColor: "rgba(12,8,30,0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    maxHeight: "88%",
    borderTopWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
  },
  cardModalClose: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  cardModalHero: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  cardModalImage: {
    width: 80,
    height: 130,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cardModalMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  cardModalName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  cardModalBadge: {
    fontSize: 12,
    color: "#a78bfa",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardModalElement: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardModalHistoryBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardModalHistoryLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardModalHistoryText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.7)",
  },
  cardModalOrientRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  cardModalOrientBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardModalOrientBtnActive: {
    backgroundColor: "rgba(139,92,246,0.3)",
    borderColor: "rgba(139,92,246,0.6)",
  },
  cardModalOrientText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  cardModalTabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  cardModalTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  cardModalTabActive: {
    backgroundColor: "rgba(139,92,246,0.2)",
    borderColor: "rgba(139,92,246,0.4)",
  },
  cardModalTabLocked: {
    opacity: 0.5,
  },
  cardModalTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  cardModalMeaningBox: {
    marginBottom: 16,
    minHeight: 120,
  },
  cardModalMeaningText: {
    fontSize: 15,
    lineHeight: 25,
    color: "rgba(255,255,255,0.80)",
  },
  cardModalBlurBox: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 120,
  },
  cardModalLockOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cardModalLockText: {
    color: "#c084fc",
    fontSize: 15,
    fontWeight: "800",
  },
  cardModalMarketBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.25)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.5)",
  },
  cardModalMarketBtnText: {
    color: "#c084fc",
    fontWeight: "700",
    fontSize: 13,
  },
});

// ═══════════════════════════════════════════════
// SETTINGS MODAL STYLES
// ═══════════════════════════════════════════════

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a1028",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.15)",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeBtn: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  infoValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(168,85,247,0.15)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
  },
  actionBtnWide: {
    flex: 2,
    backgroundColor: "rgba(251,146,60,0.12)",
    borderColor: "rgba(251,146,60,0.3)",
  },
  actionBtnDanger: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  actionBtnText: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnDangerText: {
    color: "#ef4444",
  },
  bufferBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  bufferBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  resultText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  refreshBtn: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.1)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
  },
  refreshBtnText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "700",
  },
  // Natal chart sign pickers
  signRow: {
    flexDirection: "row",
    gap: 5,
    paddingVertical: 2,
  },
  signChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  signChipActive: {
    backgroundColor: "rgba(251,191,36,0.15)",
    borderColor: "rgba(251,191,36,0.5)",
  },
  signChipActiveMoon: {
    backgroundColor: "rgba(168,85,247,0.15)",
    borderColor: "rgba(168,85,247,0.5)",
  },
  signChipActiveRising: {
    backgroundColor: "rgba(56,189,248,0.15)",
    borderColor: "rgba(56,189,248,0.5)",
  },
  signChipText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.3)",
  },
  inputLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 6,
  },
});
