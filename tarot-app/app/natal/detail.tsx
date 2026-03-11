import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useApp } from "../../context/AppContext";
import { GradientBackground, StarField, GemstoneIcon } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const SCREEN_WIDTH = Dimensions.get("window").width;
const NATAL_COST = 50;

interface PlanetData {
  name: string;
  symbol: string;
  sign: string;
  degree: number;
  minute: number;
  house?: number;
  retrograde?: boolean;
}

interface PlanetInterpretation {
  planet: string;
  symbol: string;
  sign: string;
  house: number;
  headline: string;
  body: string;
}

interface AspectInterpretation {
  pair: string;
  type: string;
  headline: string;
  body: string;
}

interface NatalInterpretation {
  title: string;
  coreSelf: { headline: string; body: string };
  ascendant?: { headline: string; body: string };
  planets: PlanetInterpretation[];
  retrogrades?: { headline: string; body: string };
  aspects?: AspectInterpretation[];
  houseEmphasis?: { headline: string; body: string };
  nodeAxis: { headline: string; body: string };
  elements: { dominant: string; fire?: number; earth?: number; air?: number; water?: number; summary: string };
  lifeMission: string;
  strengths: string[];
  challenges: string[];
  advice?: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  fire:  "#ff6b35",
  earth: "#2ecc71",
  air:   "#38bdf8",
  water: "#a78bfa",
};

const ELEMENT_GRADIENTS: Record<string, string[]> = {
  fire:  ["#ff9a3c", "#ff5e1a", "#c0392b", "#7b1a0a"],
  earth: ["#6ee7a0", "#2ecc71", "#1a9e52", "#0d5c30"],
  air:   ["#7dd3fc", "#38bdf8", "#0ea5e9", "#0c4a6e"],
  water: ["#c4b5fd", "#a78bfa", "#7c3aed", "#3b1087"],
};

const ELEMENT_GLOW: Record<string, string> = {
  fire:  "rgba(255, 94, 26, 0.55)",
  earth: "rgba(46, 204, 113, 0.5)",
  air:   "rgba(56, 189, 248, 0.5)",
  water: "rgba(167, 139, 250, 0.55)",
};

// MaterialCommunityIcons icon names for each element
const ELEMENT_MCO_ICONS: Record<string, string> = {
  fire:  "fire",
  earth: "earth",
  air:   "weather-windy",
  water: "water",
};

const ELEMENT_NAMES: Record<string, Record<string, string>> = {
  fire: { tr: "Ateş", en: "Fire", de: "Feuer", es: "Fuego" },
  earth: { tr: "Toprak", en: "Earth", de: "Erde", es: "Tierra" },
  air: { tr: "Hava", en: "Air", de: "Luft", es: "Aire" },
  water: { tr: "Su", en: "Water", de: "Wasser", es: "Agua" },
};

const ASPECT_ICONS: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  trine: "△",
  square: "□",
  sextile: "⚹",
};

const LOADING_KEYS = [
  "natalLoading1",
  "natalLoading2",
  "natalLoading3",
  "natalLoading4",
];

const PLANET_IMAGES_MAP: Record<string, ImageSourcePropType> = {
  sun: require("../../assets/planets/sun.png"),
  moon: require("../../assets/planets/moon.png"),
  mars: require("../../assets/planets/mars.png"),
  mercury: require("../../assets/planets/mercury.png"),
  jupiter: require("../../assets/planets/jupiter.png"),
  venus: require("../../assets/planets/venus.png"),
  saturn: require("../../assets/planets/saturn.png"),
  north_node: require("../../assets/north-node.png"),
  south_node: require("../../assets/south-node.png"),
  asc: require("../../assets/asc-desing.png"),
};

const ICON_ASSET_KEYS = new Set(["north_node", "south_node", "asc", "mc"]);

const ASPECT_TYPE_NAMES = ["conjunction", "opposition", "trine", "square", "sextile"];

function parsePairPlanets(pair: string): string[] {
  const cleaned = pair.replace(/[^\w-]/g, "").toLowerCase();
  const parts = cleaned.split("-").filter(Boolean);
  const result: string[] = [];
  for (const part of parts) {
    if (ASPECT_TYPE_NAMES.includes(part)) continue;
    let key = part;
    if (key.startsWith("asc")) key = "asc";
    if (key.startsWith("north")) key = "north_node";
    if (["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "asc", "north_node", "mc"].includes(key)) {
      result.push(key);
    }
  }
  return result.slice(0, 2);
}

function formatPairLabel(pair: string): string {
  const keys = parsePairPlanets(pair);
  const DISPLAY: Record<string, string> = {
    sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury",
    jupiter: "Jupiter", venus: "Venus", saturn: "Saturn",
    asc: "Ascendant", north_node: "North Node", mc: "MC",
  };
  return keys.map(k => DISPLAY[k] || k).join("-");
}

const ASPECT_GRADIENTS: Record<string, [string, string, string]> = {
  conjunction: ["rgba(139,92,246,0.18)", "rgba(59,130,246,0.08)", "rgba(15,10,40,0.92)"],
  square: ["rgba(255, 255, 255, 0.14)", "rgba(252, 225, 178, 0.06)", "rgba(57, 47, 105, 0.92)"],
  trine: ["rgba(74,222,128,0.12)", "rgba(34,197,94,0.06)", "rgba(15,10,40,0.92)"],
  opposition: ["rgba(248,113,113,0.12)", "rgba(239,68,68,0.06)", "rgba(15,10,40,0.92)"],
  sextile: ["rgba(147,197,253,0.12)", "rgba(96,165,250,0.06)", "rgba(15,10,40,0.92)"],
};

const ASPECT_BORDER_COLORS: Record<string, string> = {
  conjunction: "rgba(139,92,246,0.25)",
  square: "rgba(251,191,36,0.25)",
  trine: "rgba(74,222,128,0.20)",
  opposition: "rgba(248,113,113,0.20)",
  sextile: "rgba(147,197,253,0.20)",
};

const ASPECT_ACCENT: Record<string, string> = {
  conjunction: "#a78bfa",
  square: "#fbbf24",
  trine: "#4ade80",
  opposition: "#f87171",
  sextile: "#93c5fd",
};

function PlanetSphere({ planetKey, size }: { planetKey: string; size: number }) {
  const source = PLANET_IMAGES_MAP[planetKey];
  if (!source) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "rgba(167,139,250,0.12)",
        borderWidth: 1.5, borderColor: "rgba(167,139,250,0.3)",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ color: "#c4b5fd", fontSize: size * 0.35, fontWeight: "800" }}>✦</Text>
      </View>
    );
  }

  if (ICON_ASSET_KEYS.has(planetKey)) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
       
        alignItems: "center", justifyContent: "center",
      }}>
        <Image
          source={source}
          style={{ width: size * 1, height: size * 1 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      overflow: "hidden", backgroundColor: "#0a0a1a",
    }}>
      <Image
        source={source}
        style={{
          width: size * 1.2, height: size * 1.2,
          marginLeft: -size * 0.1, marginTop: -size * 0.1,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

function AspectPlanetVisual({ planets, type }: { planets: string[]; type: string }) {
  if (planets.length < 1) return null;
  const [p1, p2] = planets;
  const isConjunction = type === "conjunction";

  return (
    <View style={aspVisualStyles.wrap}>
      <PlanetSphere planetKey={p1} size={isConjunction ? 64 : 52} />
      {p2 && (
        <View style={{ marginLeft: isConjunction ? -15 : 6 }}>
          <PlanetSphere planetKey={p2} size={isConjunction ? 52 : 52} />
        </View>
      )}
    </View>
  );
}

const aspVisualStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default function NatalDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, deviceId, fetchUserInfo, gemstoneBalance } = useApp();

  const [mockPlanets, setMockPlanets] = useState<PlanetData[]>([]);
  const [interpretation, setInterpretation] = useState<NatalInterpretation | null>(null);
  const [loading, setLoading] = useState(true);
  const [interpreting, setInterpreting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientGems, setInsufficientGems] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (deviceId) {
      fetchExistingInterpretation();
      fetchMockData();
    }
  }, [deviceId, language]);

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
  }, []);

  const fetchMockData = async () => {
    try {
      const res = await fetch(`${API_BASE}/natal/mock`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMockPlanets(data.data.planets);
      }
    } catch (err) {
      console.warn("Mock data fetch error:", err);
    }
  };

  const fetchExistingInterpretation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/natal/interpret/${deviceId}?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.exists) {
          setInterpretation(data.data);
        }
      }
    } catch (err) {
      console.warn("Natal fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startLoadingAnim = () => {
    setLoadingMsgIdx(0);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: 45000,
      useNativeDriver: false,
    }).start();
    msgTimerRef.current = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_KEYS.length);
    }, 5000);
  };

  const stopLoadingAnim = () => {
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleInterpret = async () => {
    if (gemstoneBalance < NATAL_COST) {
      setInsufficientGems(true);
      return;
    }

    setInterpreting(true);
    setError(null);
    setInsufficientGems(false);
    startLoadingAnim();

    try {
      const res = await fetch(`${API_BASE}/natal/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, lang: language }),
      });
      const data = await res.json();

      if (data.success) {
        setInterpretation(data.data);
        fetchUserInfo();
      } else if (data.error === "INSUFFICIENT_GEMSTONES") {
        setInsufficientGems(true);
      } else {
        setError(data.error || t("natalError"));
      }
    } catch (err: any) {
      setError(err.message || t("natalError"));
    } finally {
      stopLoadingAnim();
      setInterpreting(false);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <ActivityIndicator color="#a855f7" size="large" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#020210" }}>
      <LinearGradient
        colors={["#020210", "#0a0820", "#110d30", "#0a0820", "#020210"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={["transparent", "rgba(88,40,180,0.08)", "rgba(30,60,160,0.06)", "transparent"]}
        style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
      />
      <StarField count={60} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t("back")}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <LinearGradient
          colors={["rgba(139,92,246,0.35)", "rgba(59,130,246,0.2)", "rgba(15,10,40,0.95)"]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroIcon}>🪐</Text>
          <Text style={styles.heroTitle}>{t("natalTitle")}</Text>
          {interpretation && (
            <Text style={styles.heroSubtitle}>{interpretation.title}</Text>
          )}
        </LinearGradient>

        {/* Planet Summary Grid (before interpretation) */}
        {mockPlanets && mockPlanets.length > 0 && !interpretation && (
          <View style={styles.planetGrid}>
            <Text style={styles.sectionTitle}>{t("natalPlanetPositions")}</Text>
            {mockPlanets.filter(p => !["asc", "mc", "south_node", "black_moon"].includes(p.name)).map((p) => (
              <View key={p.name} style={styles.planetRow}>
                <Text style={styles.planetSymbol}>{p.symbol}</Text>
                <Text style={styles.planetName}>{p.name}</Text>
                <Text style={styles.planetSign}>
                  {p.degree}° {p.sign} {p.minute}'
                </Text>
                {p.house ? <Text style={styles.planetHouse}>Ev {p.house}</Text> : null}
                {p.retrograde && <Text style={styles.retroBadge}>R</Text>}
              </View>
            ))}
          </View>
        )}

        {/* State: Not yet interpreted */}
        {!interpretation && !interpreting && (
          <View style={styles.interpretSection}>
            {insufficientGems ? (
              <View style={styles.gemWarning}>
                <GemstoneIcon size={40} />
                <Text style={styles.gemWarningTitle}>{t("natalInsufficientGems")}</Text>
                <Text style={styles.gemWarningDesc}>
                  {t("natalInsufficientGemsDesc", { cost: NATAL_COST, balance: gemstoneBalance })}
                </Text>
                <TouchableOpacity style={styles.marketBtn} onPress={() => router.push("/market")} activeOpacity={0.8}>
                  <Text style={styles.marketBtnText}>Market</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.interpretBtn} onPress={handleInterpret} activeOpacity={0.8}>
                <View style={styles.interpretBtnContent}>
                  <Text style={styles.interpretBtnText}>{t("natalInterpret")}</Text>
                  <View style={styles.costBadge}>
                    <GemstoneIcon size={22} />
                    <Text style={styles.costText}>{NATAL_COST}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}

        {/* State: Interpreting */}
        {interpreting && (
          <View style={styles.loadingSection}>
            <ActivityIndicator color="#a78bfa" size="large" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingText}>{t(LOADING_KEYS[loadingMsgIdx])}</Text>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ═══ Interpretation Result ═══ */}
        {interpretation && (
          <View style={styles.resultSection}>
            {/* Core Self */}
            <View style={styles.coreSection}>
              <Text style={styles.coreHeadline}>{interpretation.coreSelf.headline}</Text>
              <Text style={styles.coreBody}>{interpretation.coreSelf.body}</Text>
            </View>

            {/* Ascendant */}
            {interpretation.ascendant && (
              <View style={styles.ascSection}>
                <Text style={styles.sectionTitle}>{t("natalAscendant")}</Text>
                <Text style={styles.ascHeadline}>{interpretation.ascendant.headline}</Text>
                <Text style={styles.ascBody}>{interpretation.ascendant.body}</Text>
              </View>
            )}

            {/* Planets */}
            <Text style={styles.sectionTitle}>{t("natalPlanets")}</Text>
            {interpretation.planets.map((p) => (
              <BlurView
                key={p.planet}
                intensity={25}
                tint="dark"
                style={styles.planetCard}
              >
                <View style={styles.planetCardInner}>
                  <View style={styles.planetCardHeader}>
                    <Text style={styles.planetCardSymbol}>{p.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planetCardHeadline}>{p.headline}</Text>
                      <Text style={styles.planetCardMeta}>
                        {p.sign} | {t("natalHouse")} {p.house}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planetCardBody}>{p.body}</Text>
                </View>
              </BlurView>
            ))}

            {/* Aspects — Key Connections */}
            {interpretation.aspects && interpretation.aspects.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t("natalAspects")}</Text>
                {interpretation.aspects.map((a, i) => {
                  const planets = parsePairPlanets(a.pair);
                  const gradColors = ASPECT_GRADIENTS[a.type] || ASPECT_GRADIENTS.conjunction;
                  const borderClr = ASPECT_BORDER_COLORS[a.type] || ASPECT_BORDER_COLORS.conjunction;
                  const accent = ASPECT_ACCENT[a.type] || ASPECT_ACCENT.conjunction;
                  return (
                    <View key={i} style={styles.aspectCardOuter}>
                      <LinearGradient
                        colors={gradColors}
                        style={[styles.aspectCardNew, { borderColor: borderClr }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.aspectCardTop}>
                          <View style={styles.aspectTextCol}>
                            <Text style={styles.aspectHeadlineNew}>{a.headline}</Text>
                            <Text style={[styles.aspectMetaNew, { color: accent }]}>
                              {formatPairLabel(a.pair)} — {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                            </Text>
                          </View>
                          <View style={styles.aspectPlanetVisual}>
                            <AspectPlanetVisual planets={planets} type={a.type} />
                          </View>
                        </View>
                        <Text style={styles.aspectBodyNew}>{a.body}</Text>
                      </LinearGradient>
                    </View>
                  );
                })}
              </>
            )}

            {/* Retrogrades */}
            {interpretation.retrogrades && (
              <View style={styles.retroSection}>
                <Text style={styles.sectionTitle}>{t("natalRetrogrades")}</Text>
                <Text style={styles.retroHeadline}>{interpretation.retrogrades.headline}</Text>
                <Text style={styles.retroBody}>{interpretation.retrogrades.body}</Text>
              </View>
            )}

            {/* House Emphasis */}
            {interpretation.houseEmphasis && (
              <View style={styles.houseSection}>
                <Text style={styles.sectionTitle}>{t("natalHouseEmphasis")}</Text>
                <Text style={styles.houseHeadline}>{interpretation.houseEmphasis.headline}</Text>
                <Text style={styles.houseBody}>{interpretation.houseEmphasis.body}</Text>
              </View>
            )}

            {/* Node Axis */}
            <View style={styles.nodeSection}>
              <Text style={styles.sectionTitle}>{t("natalNodeAxis")}</Text>
              <Text style={styles.nodeHeadline}>{interpretation.nodeAxis.headline}</Text>
              <Text style={styles.nodeBody}>{interpretation.nodeAxis.body}</Text>
            </View>

            {/* Elements donut ring */}
            <View style={styles.elementSection}>
              <Text style={styles.sectionTitle}>{t("natalElements")}</Text>
              {(() => {
                const elems = interpretation.elements;
                const values: { key: "fire" | "earth" | "air" | "water"; val: number }[] = [
                  { key: "fire",  val: elems.fire  || 0 },
                  { key: "earth", val: elems.earth || 0 },
                  { key: "air",   val: elems.air   || 0 },
                  { key: "water", val: elems.water || 0 },
                ];
                const total = values.reduce((s, v) => s + v.val, 0) || 1;

                const RING   = 270;
                const STROKE = 40;
                const CTR    = RING / 2;
                const R      = (RING - STROKE) / 2;
                const C      = 2 * Math.PI * R;
                const GAP    = 8;
                const active = values.filter(v => v.val > 0).length;
                const usable = C - active * GAP;
                const GLOW_R = R - STROKE / 2 - 8;
                const domColor = ELEMENT_COLORS[elems.dominant] || "#a78bfa";

                let dashOff  = -C / 4;
                let angleAcc = 0;

                const arcs = values.map((item) => {
                  if (item.val === 0) return { ...item, dOff: 0, len: 0, midA: 0, iconR: 0 };
                  const len  = (item.val / total) * usable;
                  const arcA = (len / C) * 2 * Math.PI;
                  const gapA = (GAP / C) * 2 * Math.PI;
                  const midA = -Math.PI / 2 + angleAcc + arcA / 2;
                  const dOff = dashOff;
                  dashOff  += len + GAP;
                  angleAcc += arcA + gapA;
                  // Icon radius: fit within stroke width AND arc length
                  const iconR = Math.max(5, Math.min(STROKE / 2 - 5, len / 2 - 4));
                  return { ...item, dOff, len, midA, iconR };
                });

                // Gradient geometry — gradient r = outer edge of arc
                const GRAD_R = R + STROKE / 2;            // = 135 (= CTR)
                const OFF_INNER = `${((R - STROKE / 2) / GRAD_R * 100).toFixed(1)}%`; // ≈ 70.4%
                const OFF_MID   = `${(R / GRAD_R * 100).toFixed(1)}%`;                // ≈ 85.2%

                return (
                  <View style={[styles.ringWrapper, { width: RING, height: RING }]}>
                    {/* SVG: radial-gradient depth donut (no overflow) */}
                    <Svg width={RING} height={RING} style={{ position: "absolute" }}>
                      <Defs>
                        {/* Center ambient glow — dominant element */}
                        <SvgRadialGradient id="elGlow" cx="50%" cy="50%" r="50%">
                          <Stop offset="0%"   stopColor={domColor} stopOpacity="0.60" />
                          <Stop offset="45%"  stopColor={domColor} stopOpacity="0.20" />
                          <Stop offset="100%" stopColor={domColor} stopOpacity="0"    />
                        </SvgRadialGradient>

                        {/* Per-element arc gradients: bright inner edge → vivid → dark outer */}
                        {(["fire","earth","air","water"] as const).map((key) => (
                          <SvgRadialGradient
                            key={key}
                            id={`grad-${key}`}
                            gradientUnits="userSpaceOnUse"
                            cx={CTR} cy={CTR} r={GRAD_R}
                          >
                            <Stop offset="0%"       stopColor={ELEMENT_GRADIENTS[key][0]} stopOpacity="0"   />
                            <Stop offset={OFF_INNER} stopColor={ELEMENT_GRADIENTS[key][0]} stopOpacity="1"   />
                            <Stop offset={OFF_MID}   stopColor={ELEMENT_GRADIENTS[key][1]} stopOpacity="1"   />
                            <Stop offset="100%"      stopColor={ELEMENT_GRADIENTS[key][3]} stopOpacity="1"   />
                          </SvgRadialGradient>
                        ))}

                        {/* Unified top→bottom lighting: bright top, dark bottom */}
                        <SvgLinearGradient id="topLight" x1="50%" y1="0%" x2="50%" y2="100%">
                          <Stop offset="0%"   stopColor="rgba(255,255,255,1)" stopOpacity="0.20" />
                          <Stop offset="28%"  stopColor="rgba(255,255,255,1)" stopOpacity="0.05" />
                          <Stop offset="65%"  stopColor="rgba(0,0,0,1)"       stopOpacity="0.04" />
                          <Stop offset="100%" stopColor="rgba(0,0,0,1)"       stopOpacity="0.36" />
                        </SvgLinearGradient>
                      </Defs>

                      {/* Center ambient glow */}
                      <Circle cx={CTR} cy={CTR} r={GLOW_R * 1.1} fill="url(#elGlow)" />

                      {/* Track: outer edge shadow */}
                      <Circle cx={CTR} cy={CTR} r={R + STROKE / 2 - 3}
                        stroke="rgba(0,0,0,0.60)" strokeWidth={5} fill="none" />
                      {/* Track: dark glassmorphic background */}
                      <Circle cx={CTR} cy={CTR} r={R}
                        stroke="rgba(255,255,255,0.055)"
                        strokeWidth={STROKE} fill="none" />
                      {/* Track: inner edge shadow */}
                      <Circle cx={CTR} cy={CTR} r={R - STROKE / 2 + 3}
                        stroke="rgba(0,0,0,0.60)" strokeWidth={5} fill="none" />

                      {/* Layer 1 — main arc with radial gradient stroke (bright inner→vivid→dark outer) */}
                      {arcs.map((a) => {
                        if (a.val === 0) return null;
                        return (
                          <Circle key={a.key}
                            cx={CTR} cy={CTR} r={R}
                            stroke={`url(#grad-${a.key})`}
                            strokeWidth={STROKE}
                            fill="none"
                            strokeDasharray={`${a.len} ${C - a.len}`}
                            strokeDashoffset={-a.dOff}
                            strokeLinecap="butt"
                          />
                        );
                      })}

                      {/* Layer 2 — inner-edge highlight strip (matches bar's top shine) */}
                      {arcs.map((a) => {
                        if (a.val === 0) return null;
                        const R_hi  = R - STROKE / 2 + 5;
                        const C_hi  = 2 * Math.PI * R_hi;
                        const sc    = C_hi / C;
                        return (
                          <Circle key={`hi-${a.key}`}
                            cx={CTR} cy={CTR} r={R_hi}
                            stroke={ELEMENT_GRADIENTS[a.key][0]}
                            strokeWidth={4}
                            fill="none"
                            strokeDasharray={`${a.len * sc} ${C_hi - a.len * sc}`}
                            strokeDashoffset={-a.dOff * sc}
                            strokeLinecap="butt"
                            opacity={0.70}
                          />
                        );
                      })}

                      {/* Layer 3 — unified top-lighting overlay (3D tube illusion) */}
                      <Circle cx={CTR} cy={CTR} r={R}
                        stroke="url(#topLight)"
                        strokeWidth={STROKE}
                        fill="none" />

                      {/* Rim lines — outer + inner */}
                      <Circle cx={CTR} cy={CTR} r={R + STROKE / 2 - 2}
                        stroke="rgba(0,0,0,0.30)" strokeWidth={2} fill="none" />
                      <Circle cx={CTR} cy={CTR} r={R - STROKE / 2 + 2}
                        stroke="rgba(0,0,0,0.30)" strokeWidth={2} fill="none" />
                    </Svg>

                    {/* MaterialCommunityIcons positioned on each arc midpoint */}
                    {arcs.map((a) => {
                      if (a.val === 0) return null;
                      const bx  = CTR + R * Math.cos(a.midA);
                      const by  = CTR + R * Math.sin(a.midA);
                      const sz  = Math.max(10, Math.min(a.iconR * 1.6, STROKE - 8));
                      return (
                        <View key={`ic-${a.key}`} style={{
                          position: "absolute",
                          left: bx - sz / 2,
                          top:  by - sz / 2,
                          width: sz,
                          height: sz,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <MaterialCommunityIcons
                            name={ELEMENT_MCO_ICONS[a.key] as any}
                            size={sz * 0.88}
                            color="rgba(255,255,255,0.92)"
                          />
                        </View>
                      );
                    })}

                    {/* Center: only dominant element name */}
                    <View style={[styles.ringCenterName, { top: CTR - 10 }]}>
                      <Text style={[styles.ringCenterText, { color: domColor }]}>
                        {(ELEMENT_NAMES[elems.dominant]?.[language] || elems.dominant).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })()}
              {/* Glassmorphism Element Bars */}
              {(() => {
                const elems = interpretation.elements;
                const bars: { key: "fire" | "earth" | "air" | "water"; val: number }[] = [
                  { key: "fire",  val: elems.fire  || 0 },
                  { key: "earth", val: elems.earth || 0 },
                  { key: "air",   val: elems.air   || 0 },
                  { key: "water", val: elems.water || 0 },
                ];
                const total = bars.reduce((s, b) => s + b.val, 0) || 1;
                return (
                  <View style={styles.elementBarsWrapper}>
                    {bars.map((b) => {
                      const pct = b.val / total;
                      return (
                        <View key={b.key} style={styles.elementBarRow}>
                          <MaterialCommunityIcons
                            name={ELEMENT_MCO_ICONS[b.key] as any}
                            size={18}
                            color={ELEMENT_COLORS[b.key]}
                            style={styles.elementBarIcon}
                          />
                          <View style={styles.elementBarTrack}>
                            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
                            <View style={[styles.elementBarTrackInner, { width: `${Math.round(pct * 100)}%` as any }]}>
                              <LinearGradient
                                colors={ELEMENT_GRADIENTS[b.key] as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.elementBarFill}
                              />
                              {/* Glow overlay */}
                              <View style={[styles.elementBarGlow, { backgroundColor: ELEMENT_GLOW[b.key] }]} />
                            </View>
                            {/* Top shine */}
                            <LinearGradient
                              colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={styles.elementBarShine}
                            />
                          </View>
                          <Text style={[styles.elementBarPct, { color: ELEMENT_COLORS[b.key] }]}>
                            {Math.round(pct * 100)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}

              <Text style={styles.elementSummary}>{interpretation.elements.summary}</Text>
            </View>

            {/* Life Mission */}
            <View style={styles.missionSection}>
              <Text style={styles.sectionTitle}>{t("natalLifeMission")}</Text>
              <Text style={styles.missionText}>{interpretation.lifeMission}</Text>
            </View>

            {/* Strengths / Challenges */}
            <View style={styles.doRow}>
              <View style={styles.doCol}>
                <Text style={styles.strengthLabel}>{t("natalStrengths")}</Text>
                {interpretation.strengths.map((s, i) => (
                  <Text key={i} style={styles.listItem}>{s}</Text>
                ))}
              </View>
              <View style={styles.doCol}>
                <Text style={styles.challengeLabel}>{t("natalChallenges")}</Text>
                {interpretation.challenges.map((c, i) => (
                  <Text key={i} style={styles.listItem}>{c}</Text>
                ))}
              </View>
            </View>

            {/* Advice */}
            {interpretation.advice && (
              <View style={styles.adviceSection}>
                <LinearGradient
                  colors={["rgba(139,92,246,0.15)", "rgba(30,20,50,0.4)"]}
                  style={styles.adviceCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.adviceText}>{interpretation.advice}</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: { marginBottom: 16 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" },

  heroCard: {
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
    fontWeight: "600",
  },

  planetGrid: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  planetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    gap: 8,
  },
  planetSymbol: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
    color: "#a78bfa",
  },
  planetName: {
    flex: 1,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  planetSign: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  planetHouse: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  retroBadge: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },

  interpretSection: { marginTop: 8 },
  interpretBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.5)",
    alignItems: "center",
  },
  interpretBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  interpretBtnText: {
    color: "#a78bfa",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  costText: { color: "#c084fc", fontSize: 14, fontWeight: "800" },

  gemWarning: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  gemWarningTitle: { color: "#c084fc", fontSize: 16, fontWeight: "800", marginTop: 12, marginBottom: 8 },
  gemWarningDesc: { color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 16 },
  marketBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(168,85,247,0.3)", borderWidth: 1, borderColor: "rgba(168,85,247,0.6)" },
  marketBtnText: { color: "#c084fc", fontSize: 13, fontWeight: "700", letterSpacing: 1 },

  errorBox: { padding: 16, backgroundColor: "rgba(255,50,50,0.1)", borderRadius: 12, marginTop: 12 },
  errorText: { color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" },

  loadingSection: { alignItems: "center", paddingVertical: 32 },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontStyle: "italic", marginBottom: 14, textAlign: "center", minHeight: 18 },
  progressBarBg: { width: "80%", height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: 3, backgroundColor: "#a78bfa", borderRadius: 2 },

  resultSection: { marginTop: 4 },

  sectionTitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 28,
  },

  coreSection: { marginBottom: 8 },
  coreHeadline: { fontSize: 26, fontWeight: "800", color: "#fff", lineHeight: 34, marginBottom: 14 },
  coreBody: { fontSize: 16, lineHeight: 26, color: "rgba(255,255,255,0.7)" },

  ascSection: { marginBottom: 8 },
  ascHeadline: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  ascBody: { fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.7)" },

  planetCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  planetCardInner: {
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  planetCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  planetCardSymbol: { fontSize: 28, color: "#a78bfa" },
  planetCardHeadline: { fontSize: 16, fontWeight: "800", color: "#fff" },
  planetCardMeta: { fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: "600", marginTop: 2 },
  planetCardBody: { fontSize: 15, lineHeight: 23, color: "rgba(255,255,255,0.7)" },

  aspectCardOuter: {
    marginBottom: 16,
  },
  aspectCardNew: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  aspectCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  aspectTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  aspectPlanetVisual: {
    marginRight: -4,
    marginTop: -4,
  },
  aspectHeadlineNew: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  aspectMetaNew: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  aspectBodyNew: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.7)",
  },

  retroSection: { marginBottom: 8 },
  retroHeadline: { fontSize: 18, fontWeight: "800", color: "#fbbf24", marginBottom: 8 },
  retroBody: { fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.7)" },

  houseSection: { marginBottom: 8 },
  houseHeadline: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  houseBody: { fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.7)" },

  nodeSection: { marginBottom: 8 },
  nodeHeadline: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  nodeBody: { fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.7)" },

  elementSection: {
    marginBottom: 8,
    backgroundColor: "rgba(10,14,40,0.72)",
    borderRadius: 28,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },

  elementBarsWrapper: {
    width: "100%",
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  elementBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  elementBarIcon: {
    width: 22,
  },
  elementBarTrack: {
    flex: 1,
    height: 16,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    position: "relative",
  },
  elementBarTrackInner: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    minWidth: 26,
    borderRadius: 10,
    overflow: "hidden",
  },
  elementBarFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  elementBarGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    opacity: 0.55,
  },
  elementBarShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  elementBarPct: {
    fontSize: 12,
    fontWeight: "800",
    minWidth: 36,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenterName: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  ringCenterText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
  },
  elementSummary: {
    fontSize: 15,
    lineHeight: 26,
    color: "rgba(255,255,255,0.70)",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 16,
    fontStyle: "italic",
  },

  missionSection: { marginBottom: 8 },
  missionText: { fontSize: 16, lineHeight: 26, color: "rgba(255,255,255,0.8)", fontStyle: "italic" },

  doRow: { flexDirection: "row", gap: 24, marginTop: 24 },
  doCol: { flex: 1 },
  strengthLabel: { fontSize: 12, letterSpacing: 2, color: "rgba(74,222,128,0.7)", fontWeight: "700", marginBottom: 10, textTransform: "uppercase" },
  challengeLabel: { fontSize: 12, letterSpacing: 2, color: "rgba(251,113,133,0.7)", fontWeight: "700", marginBottom: 10, textTransform: "uppercase" },
  listItem: { fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 8, lineHeight: 21 },

  adviceSection: { marginTop: 28 },
  adviceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  adviceText: {
    fontSize: 16,
    lineHeight: 26,
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
    textAlign: "center",
  },
});
