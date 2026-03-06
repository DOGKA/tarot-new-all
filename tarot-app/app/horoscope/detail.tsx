import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useApp } from "../../context/AppContext";
import { GradientBackground, StarField, Zodiac3D, GemstoneIcon } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const DIVE_DEEPER_COST = 3;

const ELEMENT_GRADIENTS: Record<string, string[]> = {
  fire:  ["rgba(251,146,60,0.35)", "rgba(234,88,12,0.2)", "rgba(40,20,5,0.95)"],
  earth: ["rgba(74,222,128,0.3)", "rgba(34,197,94,0.15)", "rgba(10,30,15,0.95)"],
  air:   ["rgba(147,197,253,0.3)", "rgba(96,165,250,0.2)", "rgba(10,15,40,0.95)"],
  water: ["rgba(129,140,248,0.3)", "rgba(99,102,241,0.2)", "rgba(15,10,40,0.95)"],
};

const SIGN_ELEMENTS: Record<string, string> = {
  aries: "fire", taurus: "earth", gemini: "air", cancer: "water",
  leo: "fire", virgo: "earth", libra: "air", scorpio: "water",
  sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water",
};

type DayTab = "yesterday" | "today" | "tomorrow";

interface FreeHoroscope {
  date: string;
  sign: string;
  headline: string;
  body: string;
  do: string[];
  dont: string[];
  theme: string;
}

interface PremiumHoroscope {
  coreInsight: string;
  challenge: string;
  powerMove: string;
  prompt: string;
  microAction: string;
}

export default function HoroscopeDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, isPremium, deviceId, fetchUserInfo, userSign } = useApp();
  const params = useLocalSearchParams<{ sign: string }>();
  const sign = params.sign || "aries";
  const isOwnSign = sign === userSign;

  const [activeTab, setActiveTab] = useState<DayTab>("today");
  const [horoscope, setHoroscope] = useState<FreeHoroscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDiveDeeper, setShowDiveDeeper] = useState(false);
  const [premiumData, setPremiumData] = useState<PremiumHoroscope | null>(null);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [insufficientGems, setInsufficientGems] = useState(false);

  const element = SIGN_ELEMENTS[sign] || "fire";
  const gradient = ELEMENT_GRADIENTS[element] || ELEMENT_GRADIENTS.fire;

  const fetchHoroscope = useCallback(async (day: DayTab) => {
    setLoading(true);
    setError(null);
    setHoroscope(null);
    setShowDiveDeeper(false);
    setPremiumData(null);
    setInsufficientGems(false);

    try {
      const tz = -new Date().getTimezoneOffset();
      const res = await fetch(`${API_BASE}/horoscope/free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sign, lang: language, timezoneOffset: tz, day, deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        setHoroscope(data.data);
        if (data.data.diveDeeper) {
          setPremiumData(data.data.diveDeeper);
          setShowDiveDeeper(true);
        }
      } else {
        setError(data.error || t("horoscopeNoData"));
      }
    } catch {
      setError(t("horoscopeNoData"));
    } finally {
      setLoading(false);
    }
  }, [sign, language, deviceId]);

  useEffect(() => {
    fetchHoroscope(activeTab);
  }, [activeTab, sign, language]);

  const handleTabPress = (tab: DayTab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const handleDiveDeeper = async () => {
    setShowDiveDeeper(true);
    setInsufficientGems(false);

    if (premiumData) return;

    setLoadingPremium(true);
    try {
      const tz = -new Date().getTimezoneOffset();
      const res = await fetch(`${API_BASE}/horoscope/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sign,
          lang: language,
          day: activeTab,
          freeHeadline: horoscope?.headline || "",
          theme: horoscope?.theme || "",
          timezoneOffset: tz,
          deviceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPremiumData(data.data);
        fetchUserInfo();
      } else if (data.error === "INSUFFICIENT_GEMSTONES") {
        setInsufficientGems(true);
      }
    } catch (err) {
      console.warn("Premium fetch error:", err);
    } finally {
      setLoadingPremium(false);
    }
  };

  const tabs: { key: DayTab; label: string }[] = [
    { key: "yesterday", label: t("horoscopeYesterday") },
    { key: "today", label: t("horoscopeToday") },
    { key: "tomorrow", label: t("horoscopeTomorrow") },
  ];

  return (
    <GradientBackground>
      <StarField count={30} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t("back")}</Text>
        </TouchableOpacity>

        {/* Zodiac Hero */}
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Zodiac3D zodiacKey={sign} size={100} />
        </LinearGradient>

        {/* Day Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <ActivityIndicator color="#a855f7" size="large" style={{ marginTop: 30 }} />
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* FREE Content */}
        {!loading && horoscope && (
          <View style={styles.content}>
            {/* Headline */}
            <Text style={styles.headline}>{horoscope.headline}</Text>

            {/* Body */}
            <Text style={styles.body}>{horoscope.body}</Text>

            {/* Do / Don't */}
            <View style={styles.doRow}>
              <View style={styles.doCol}>
                <Text style={styles.doLabel}>{t("horoscopeDo")}</Text>
                {horoscope.do?.map((item, i) => (
                  <Text key={i} style={styles.doItem}>{item}</Text>
                ))}
              </View>
              <View style={styles.doCol}>
                <Text style={styles.dontLabel}>{t("horoscopeDont")}</Text>
                {horoscope.dont?.map((item, i) => (
                  <Text key={i} style={styles.doItem}>{item}</Text>
                ))}
              </View>
            </View>

            {/* Dive Deeper (own sign) or Compatibility (other sign) */}
            {!showDiveDeeper && isOwnSign && (
              <TouchableOpacity
                style={styles.diveBtnPremium}
                onPress={handleDiveDeeper}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.diveBtnTextPremium}>✨ {t("horoscopeDiveDeeper")}</Text>
                  {!isPremium && (
                    <>
                      <Text style={styles.diveBtnTextPremium}> (</Text>
                      <GemstoneIcon size={26} />
                      <Text style={styles.diveBtnTextPremium}>{DIVE_DEEPER_COST})</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {!showDiveDeeper && !isOwnSign && (
              <TouchableOpacity
                style={styles.compatBtn}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Text style={styles.compatBtnText}>
                  🔮 {t("horoscopeCompatibility")}
                </Text>
              </TouchableOpacity>
            )}


            {/* Dive Deeper Content */}
            {showDiveDeeper && (
              <View style={styles.deeperSection}>
                <View style={styles.deeperDivider}>
                  <Text style={[styles.deeperTitle, !insufficientGems && { color: "#fbbf24" }]}>
                    {t("horoscopeDiveDeeper")}
                  </Text>
                </View>

                {/* Loading */}
                {loadingPremium && (
                  <ActivityIndicator color="#fbbf24" size="small" style={{ marginVertical: 20 }} />
                )}

                {/* Real content (both premium and free users who paid gems) */}
                {!loadingPremium && premiumData && (
                  <View>
                    <Text style={styles.premiumBody}>{premiumData.coreInsight}</Text>

                    <View style={styles.premiumBlock}>
                      <Text style={styles.premiumLabel}>{t("horoscopeChallenge")}</Text>
                      <Text style={styles.premiumText}>{premiumData.challenge}</Text>
                    </View>

                    <View style={styles.premiumBlock}>
                      <Text style={styles.premiumLabel}>{t("horoscopePowerMove")}</Text>
                      <Text style={styles.premiumText}>{premiumData.powerMove}</Text>
                    </View>

                    <View style={styles.premiumBlock}>
                      <Text style={styles.premiumLabel}>{t("horoscopeMicroAction")}</Text>
                      <Text style={styles.premiumText}>{premiumData.microAction}</Text>
                    </View>
                  </View>
                )}

                {/* Insufficient gemstones — blur mockup with lock */}
                {!loadingPremium && insufficientGems && (
                  <View style={styles.blurContainer}>
                    <BlurView intensity={30} tint="dark" style={styles.blurOverlay}>
                      <View style={styles.lockBox}>
                        <GemstoneIcon size={44} />
                        <Text style={styles.lockTitle}>{t("horoscopePremiumRequired")}</Text>
                        <Text style={styles.lockDesc}>{t("horoscopePremiumDesc")}</Text>
                        <TouchableOpacity
                          style={styles.lockMarketBtn}
                          onPress={() => router.push("/market")}
                        >
                          <Text style={styles.lockMarketText}>Market</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.lockCloseBtn}
                          onPress={() => setShowDiveDeeper(false)}
                        >
                          <Text style={styles.lockCloseText}>{t("horoscopeClose")}</Text>
                        </TouchableOpacity>
                      </View>
                    </BlurView>

                    <View style={styles.fakeContent}>
                      <Text style={styles.fakeText}>XXXXXXXX XXXXXX XXXX XXXXXXXXXX XXXX XXXXXX</Text>
                      <View style={styles.fakeBlock}>
                        <Text style={styles.fakeLabel}>{t("horoscopeChallenge")}</Text>
                        <Text style={styles.fakeText}>XXXXXXXX XXXXXX XXXXXXXX</Text>
                      </View>
                      <View style={styles.fakeBlock}>
                        <Text style={styles.fakeLabel}>{t("horoscopePowerMove")}</Text>
                        <Text style={styles.fakeText}>XXXXXX XXXXXXXX XXXXXXXXXX</Text>
                      </View>
                      <View style={styles.fakeBlock}>
                        <Text style={styles.fakeLabel}>{t("horoscopeMicroAction")}</Text>
                        <Text style={styles.fakeText}>XXXXXX XXXXXXXX XXXXXX</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
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
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "rgba(168,85,247,0.25)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.5)",
  },
  tabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: { color: "#c084fc" },

  errorBox: {
    padding: 20,
    backgroundColor: "rgba(255,50,50,0.1)",
    borderRadius: 12,
    marginTop: 10,
  },
  errorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },

  content: { marginTop: 4 },

  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 36,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 28,
  },

  doRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
  },
  doCol: { flex: 1 },
  doLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: "rgba(74,222,128,0.7)",
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  dontLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: "rgba(251,113,133,0.7)",
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  doItem: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    lineHeight: 21,
  },

  diveBtnPremium: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(168,85,247,0.2)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.5)",
    alignItems: "center",
  },
  diveBtnTextPremium: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  compatBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    alignItems: "center",
  },
  compatBtnText: {
    color: "#818cf8",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },

  deeperSection: { marginTop: 8 },
  deeperDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 20,
    marginBottom: 16,
  },
  deeperTitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
  },

  premiumBody: {
    fontSize: 18,
    lineHeight: 28,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 24,
  },
  premiumBlock: { marginBottom: 20 },
  premiumLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  premiumText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
  },
  promptCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#fbbf24",
  },
  promptText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
    lineHeight: 24,
  },

  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    minHeight: 280,
  },
  blurOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBox: {
    backgroundColor: "rgba(0,0,0,0.9)",
    padding: 28,
    borderRadius: 16,
    alignItems: "center",
    maxWidth: 260,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.4)",
  },
  lockIcon: { fontSize: 28, marginBottom: 12 },
  lockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#c084fc",
    marginBottom: 8,
  },
  lockDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  lockMarketBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.3)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.6)",
    marginBottom: 10,
  },
  lockMarketText: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  lockCloseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  lockCloseText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },

  fakeContent: {
    padding: 20,
    opacity: 0.2,
  },
  fakeBlock: { marginBottom: 14 },
  fakeLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fakeText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.3)",
    lineHeight: 22,
  },
});
