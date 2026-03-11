import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { GradientBackground, GemstoneIcon } from "../components/ui";
import { useApp } from "../context/AppContext";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const TRANSIT_FETCH_TIMEOUT_MS = 180000;

type TransitPayload = {
  formatVersion?: number;
  periodMode?: string;
  period: { start: string; end: string };
  months: number;
  locationsUsed?: TransitLocation[];
  overview?: { title: string; summary: string };
  phases?: any[];
  themes?: any[];
  retrogradeWindows?: any[];
  milestones?: any[];
  recurringThemes?: any[];
  background?: any[];
  stats?: Record<string, any>;
};

type TransitLocation = {
  city: string;
  latitude: string;
  longitude: string;
  utcOffset: string;
  timezone: string;
  startDate?: string;
  endDate?: string;
};

const PERIODS = [
  { months: 1, gems: 30, premium: false },
  { months: 3, gems: 50, premium: true },
  { months: 6, gems: 75, premium: true },
  { months: 12, gems: 100, premium: true },
];

const LOCATION_MOCKUPS: TransitLocation[] = [
  {
    city: "Istanbul",
    latitude: "41.0082",
    longitude: "28.9784",
    utcOffset: "3",
    timezone: "Europe/Istanbul",
    startDate: "",
    endDate: "",
  },
  {
    city: "Ankara",
    latitude: "39.9334",
    longitude: "32.8597",
    utcOffset: "3",
    timezone: "Europe/Istanbul",
    startDate: "",
    endDate: "",
  },
  {
    city: "Berlin",
    latitude: "52.5200",
    longitude: "13.4050",
    utcOffset: "1",
    timezone: "Europe/Berlin",
    startDate: "",
    endDate: "",
  },
];

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildRangeByMonths(months: number) {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return {
    startDate: formatDateLocal(start),
    endDate: formatDateLocal(end),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TransitScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { deviceId, language, gemstoneBalance, isPremium, fetchUserInfo } = useApp();

  const [loadingMonths, setLoadingMonths] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<"calculating" | "interpreting">("calculating");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TransitPayload | null>(null);
  const [locations, setLocations] = useState<TransitLocation[]>([
    { city: "Istanbul", latitude: "41.0082", longitude: "28.9784", utcOffset: "3", timezone: "Europe/Istanbul", startDate: "", endDate: "" },
  ]);
  const isLocked = loadingMonths !== null;

  useEffect(() => {
    if (!loadingMonths) {
      setLoadingProgress(0);
      setLoadingPhase("calculating");
      return;
    }

    setLoadingProgress(5);
    setLoadingPhase("calculating");

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 99) return prev;
        if (prev < 45) {
          return Math.min(45, prev + 8);
        }
        if (prev === 45) {
          setLoadingPhase("interpreting");
          return 50;
        }
        const step = prev < 80 ? 3 : prev < 95 ? 1 : 0.5;
        return Math.min(99, prev + step);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [loadingMonths]);

  const buyPeriod = async (months: number, sourceLocations: TransitLocation[] = locations) => {
    setError(null);
    const normalized = sourceLocations
      .map((l) => ({
        city: l.city.trim(),
        latitude: parseFloat(l.latitude),
        longitude: parseFloat(l.longitude),
        utcOffset: parseFloat(l.utcOffset),
        timezone: l.timezone.trim(),
        startDate: l.startDate?.trim() || null,
        endDate: l.endDate?.trim() || null,
      }))
      .filter((l) => l.city && Number.isFinite(l.latitude) && Number.isFinite(l.longitude) && Number.isFinite(l.utcOffset));
    if (normalized.length === 0) {
      setError("En az 1 geçerli konum gir (şehir, lat, lon, UTC).");
      return;
    }
    setLoadingMonths(months);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSIT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/natal/transits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ deviceId, months, lang: language, locations: normalized }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.error === "PREMIUM_REQUIRED") {
          setError(t("transitNeedPremium"));
        } else if (json.error === "INSUFFICIENT_GEMSTONES") {
          setError(t("transitNeedGems", { required: json.required || 0, balance: gemstoneBalance }));
        } else if (json.error === "LOCATIONS_REQUIRED") {
          setError("Konum bilgisi gerekli. En az 1 konum ekle.");
        } else {
          setError(json.error || t("transitLoadError"));
        }
        return;
      }
      setLoadingProgress(100);
      setData(json.data);
      await fetchUserInfo();
      await wait(300);
      router.push({ pathname: "/transit/detail", params: { months: String(months), t: String(Date.now()) } });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Transit istegi zaman asimina ugradi. Backend baglantisini kontrol edip tekrar dene.");
      } else {
      setError(e.message || t("transitLoadError"));
      }
    } finally {
      clearTimeout(timeoutId);
      setLoadingMonths(null);
    }
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={isLocked}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("transitTitle")}</Text>
          <View style={styles.balance}>
            <GemstoneIcon size={22} />
            <Text style={styles.balanceText}>{gemstoneBalance}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>{t("transitDesc")}</Text>

        {!isLocked && (
          <>
            <View style={styles.locWrap}>
              <Text style={styles.locTitle}>Konum Planı (lat/lon/UTC)</Text>
              {locations.map((loc, idx) => (
                <View key={idx} style={styles.locCard}>
                  <View style={styles.locRow}>
                    <TextInput
                      value={loc.city}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, city: v } : x)))}
                      placeholder="Şehir"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      value={loc.utcOffset}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, utcOffset: v } : x)))}
                      placeholder="UTC"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { width: 72 }]}
                    />
                  </View>
                  <View style={styles.locRow}>
                    <TextInput
                      value={loc.latitude}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, latitude: v } : x)))}
                      placeholder="Latitude"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      value={loc.longitude}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, longitude: v } : x)))}
                      placeholder="Longitude"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                  <View style={styles.locRow}>
                    <TextInput
                      value={loc.startDate}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, startDate: v } : x)))}
                      placeholder="Başlangıç (YYYY-MM-DD)"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      value={loc.endDate}
                      onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, endDate: v } : x)))}
                      placeholder="Bitiş (YYYY-MM-DD)"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                  <TextInput
                    value={loc.timezone}
                    onChangeText={(v) => setLocations((arr) => arr.map((x, i) => (i === idx ? { ...x, timezone: v } : x)))}
                    placeholder="Timezone (Europe/Istanbul)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                  />
                  {locations.length > 1 && (
                    <TouchableOpacity onPress={() => setLocations((arr) => arr.filter((_, i) => i !== idx))}>
                      <Text style={styles.removeLoc}>Konumu Sil</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addLocBtn}
                onPress={() =>
                  setLocations((arr) => {
                    const nextMock = LOCATION_MOCKUPS[arr.length % LOCATION_MOCKUPS.length];
                    return [...arr, { ...nextMock }];
                  })
                }
              >
                <Text style={styles.addLocText}>+ Konum Ekle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.periodGrid}>
              {PERIODS.map((p) => {
                const lockedByPremium = p.premium && !isPremium;
                const loading = loadingMonths === p.months;
                return (
                  <TouchableOpacity
                    key={p.months}
                    style={[styles.periodCard, lockedByPremium && styles.periodCardLocked]}
                    activeOpacity={0.85}
                    onPress={() => {
                      const range = buildRangeByMonths(p.months);
                      const nextLocations = locations.map((loc) => ({
                        ...loc,
                        startDate: range.startDate,
                        endDate: range.endDate,
                      }));
                      setLocations(nextLocations);
                      buyPeriod(p.months, nextLocations);
                    }}
                    disabled={loading || !deviceId}
                  >
                    <Text style={styles.periodTitle}>{p.months} {t("transitMonthShort")}</Text>
                    <Text style={styles.periodSub}>{p.premium ? t("transitPremiumPlusGem") : t("transitGemOnly")}</Text>
                    <View style={styles.periodCost}>
                      <GemstoneIcon size={22} />
                      <Text style={styles.periodCostText}>{p.gems}</Text>
                    </View>
                    {lockedByPremium && <Text style={styles.lockText}>Premium</Text>}
                    {loading && <ActivityIndicator color="#a78bfa" size="small" style={{ marginTop: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {loadingMonths && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressWrap}>
              <Text style={styles.progressText}>
                {loadingPhase === "calculating"
                  ? "Transitler hesaplaniyor..."
                  : "Yorumlar hazirlaniyor..."}
              </Text>
              <Text style={styles.progressPercent}>%{Math.max(1, Math.round(loadingProgress))}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(1, loadingProgress)}%` }]} />
              </View>
              <View style={styles.phaseSteps}>
                <View style={styles.phaseRow}>
                  <View style={[styles.phaseDot, loadingPhase === "calculating" ? styles.phaseDotActive : loadingProgress > 45 ? styles.phaseDotDone : null]} />
                  <Text style={[styles.phaseLabel, loadingPhase === "calculating" && styles.phaseLabelActive]}>
                    1/2 Hesaplama
                  </Text>
                </View>
                <View style={styles.phaseRow}>
                  <View style={[styles.phaseDot, loadingPhase === "interpreting" ? styles.phaseDotActive : null]} />
                  <Text style={[styles.phaseLabel, loadingPhase === "interpreting" && styles.phaseLabelActive]}>
                    2/2 Yorumlama
                  </Text>
                </View>
              </View>
              {loadingProgress >= 99 && (
                <Text style={styles.progressWait}>Lutfen bekleyiniz...</Text>
              )}
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {data && !isLocked && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              {t("transitTimelineTitle", { months: data.months })} hazir
            </Text>
            <Text style={styles.successSub}>
              {data.period.start} → {data.period.end} • {data.periodMode || "standard"} • {data.stats?.rawEventCount || data.stats?.totalRaw || 0} transit
            </Text>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => router.push({ pathname: "/transit/detail", params: { months: String(data.months), t: String(Date.now()) } })}
            >
              <Text style={styles.viewBtnText}>Okumasi Goruntule →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  back: { color: "#fff", fontSize: 28, fontWeight: "300" },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 16, lineHeight: 19 },
  locWrap: { marginBottom: 14, gap: 8 },
  locTitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700" },
  locCard: {
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)", padding: 10, gap: 8,
  },
  locRow: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10,
    backgroundColor: "rgba(20,10,40,0.85)", color: "#fff", paddingHorizontal: 10, paddingVertical: 8, fontSize: 12,
  },
  addLocBtn: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: "rgba(167,139,250,0.2)" },
  addLocText: { color: "#c4b5fd", fontSize: 12, fontWeight: "700" },
  removeLoc: { color: "#fda4af", fontSize: 11, fontWeight: "700", marginTop: 2 },
  balance: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  balanceText: { color: "#fff", fontWeight: "700" },
  periodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  periodCard: {
    width: "48%", borderRadius: 14, borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: "rgba(30,20,60,0.7)", padding: 12,
  },
  periodCardLocked: { opacity: 0.9, borderColor: "rgba(244,114,182,0.25)" },
  periodTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  periodSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 3 },
  periodCost: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  periodCostText: { color: "#c4b5fd", fontSize: 14, fontWeight: "800" },
  lockText: { color: "#f472b6", fontSize: 11, fontWeight: "700", marginTop: 8 },
  progressOverlay: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: "rgba(30,20,60,0.65)",
    padding: 14,
    marginBottom: 14,
  },
  progressWrap: { gap: 8 },
  progressText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700" },
  progressPercent: { color: "#a78bfa", fontSize: 22, fontWeight: "900" },
  phaseSteps: { flexDirection: "row", gap: 20, marginTop: 4 },
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  phaseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)" },
  phaseDotActive: { backgroundColor: "#a78bfa" },
  phaseDotDone: { backgroundColor: "#4ade80" },
  phaseLabel: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: "600" },
  phaseLabelActive: { color: "rgba(255,255,255,0.8)" },
  progressWait: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontStyle: "italic", marginTop: 2 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#a78bfa",
  },
  errorText: { color: "#fda4af", fontSize: 12, marginBottom: 10 },
  successBox: {
    marginTop: 6, borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)", backgroundColor: "rgba(74,222,128,0.06)",
    padding: 14, gap: 8,
  },
  successText: { color: "#4ade80", fontSize: 16, fontWeight: "800" },
  successSub: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  viewBtn: {
    alignSelf: "flex-start", marginTop: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: "rgba(167,139,250,0.2)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.3)",
  },
  viewBtnText: { color: "#c4b5fd", fontWeight: "700", fontSize: 13 },
});
