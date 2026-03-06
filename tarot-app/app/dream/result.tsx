import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useDream } from "../../context/DreamContext";
import { useApp } from "../../context/AppContext";
import { GradientBackground, GlassCard, GemstoneIcon } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001/api/dream`;

export default function DreamResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    currentResult,
    dreamMode,
    gemstoneBalance,
    prices,
    deviceId,
    fetchUserInfo,
    resetDream,
    setDreamMode,
    setCurrentResult,
  } = useDream();

  const { language } = useApp();
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const [journalAnswer, setJournalAnswer] = useState("");
  const [journalPlusLoading, setJournalPlusLoading] = useState(false);
  const [showJournalInput, setShowJournalInput] = useState(false);

  if (!currentResult) {
    return (
      <GradientBackground>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          <TouchableOpacity onPress={() => router.replace("/dream")}>
            <Text style={styles.retryLink}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const result = currentResult;
  const hasUpsell = !!result.upsellSymbol;
  const canAffordUpsell = gemstoneBalance >= (prices.UPSELL_SYMBOL || 3);
  const hasJournalPlus = !!(result as any).dreamJournalPlus;
  const canAffordJournalPlus = gemstoneBalance >= (prices.JOURNAL_PLUS || 5);

  const candidates = (result as any).upsellCandidates || [];

  // JournalPlus: kullanici journal sorusuna cevap yazdi
  const handleJournalPlus = async () => {
    if (hasJournalPlus || !canAffordJournalPlus || journalAnswer.trim().length < 5) return;
    setJournalPlusLoading(true);
    try {
      const response = await fetch(`${API_URL}/journal-plus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamDecodeId: result.readingId,
          deviceId,
          journalAnswer: journalAnswer.trim(),
          language,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        Alert.alert("Hata", err.message || err.error);
        return;
      }
      const data = await response.json();
      setCurrentResult({ ...result, dreamJournalPlus: data.dreamJournalPlus } as any);
      fetchUserInfo();
    } catch {
      Alert.alert("Baglanti Hatasi", "Sunucuya baglanamadi.");
    } finally {
      setJournalPlusLoading(false);
    }
  };

  // User selects a symbol, pay & reveal insight
  const handleSelectSymbol = async (symbol: string) => {
    if (!canAffordUpsell) {
      Alert.alert(t("insufficientGemstone") || "Gemstone yetersiz");
      return;
    }
    setUpsellLoading(true);
    try {
      const response = await fetch(`${API_URL}/upsell-symbol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamDecodeId: result.readingId,
          deviceId,
          selectedSymbol: symbol,
          language,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        Alert.alert("Hata", err.message || err.error);
        return;
      }
      const data = await response.json();
      setCurrentResult({ ...result, upsellSymbol: data.upsellSymbol });
      setShowCandidates(false);
      fetchUserInfo();
    } catch {
      Alert.alert("Bağlantı Hatası", "Sunucuya bağlanılamadı.");
    } finally {
      setUpsellLoading(false);
    }
  };

  const handleNewDream = () => {
    resetDream();
    router.replace("/dream");
  };

  const handleUpgrade = (mode: "B" | "C") => {
    setDreamMode(mode);
    router.push("/dream/input");
  };

  const modeLabel = dreamMode === "A" ? "Quick Decode" : dreamMode === "B" ? "Deep Decode" : "Rewrite Plan";

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌙 {modeLabel}</Text>
          <TouchableOpacity onPress={handleNewDream}>
            <Text style={styles.newLink}>{t("newDream") || "Yeni Rüya"}</Text>
          </TouchableOpacity>
        </View>

        {/* Overall */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t("dreamOverall") || "Genel Çerçeve"}</Text>
          <Text style={styles.overallText}>{result.overall}</Text>
        </GlassCard>

        {/* Beats */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t("dreamBeats") || "Sembol Çözümlemesi"}</Text>
          {result.beats?.map((beat: string, i: number) => (
            <View key={i} style={styles.beatRow}>
              <View style={styles.beatDot} />
              <Text style={styles.beatText}>{beat}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Pattern (B mode only) */}
        {result.pattern && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>{t("dreamPattern") || "Davranış İzi"}</Text>
            <Text style={styles.patternText}>{result.pattern}</Text>
          </GlassCard>
        )}

        {/* Plan (C mode only) */}
        {result.plan && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>{t("dreamPlan") || "Dönüştürme Planı"}</Text>
            {result.plan.map((step: string, i: number) => (
              <View key={i} style={styles.planRow}>
                <View style={[styles.planNumber, i === 0 && styles.planFirst, i === 1 && styles.planSecond, i === 2 && styles.planThird]}>
                  <Text style={styles.planNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.planText}>{step}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Keywords */}
        {result.keywords && (
          <View style={styles.keywordsRow}>
            {result.keywords.map((kw: string, i: number) => (
              <View key={i} style={styles.keywordChip}>
                <Text style={styles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Journal (B ve C modunda, A'da yok) */}
        {dreamMode !== "A" && result.journal && (
          <GlassCard style={[styles.section, styles.journalSection]}>
            <Text style={styles.journalLabel}>{t("dreamJournal") || "Kendine Sor"}</Text>
            <Text style={styles.journalText}>{result.journal}</Text>
          </GlassCard>
        )}

        {/* JournalPlus — tavsiye al (B ve C modunda, A'da yok) */}
        {dreamMode !== "A" && hasJournalPlus && (result as any).dreamJournalPlus ? (
          /* Acilmis: cevap + tavsiye goster */
          <GlassCard style={[styles.section, styles.journalPlusResult]}>
            <Text style={styles.jpLabel}>{t("journalPlusYourAnswer") || "Senin Cevabın"}</Text>
            <Text style={styles.jpAnswer}>{(result as any).dreamJournalPlus.answer}</Text>
            <View style={styles.jpDivider} />
            <Text style={styles.jpInsightLabel}>{t("journalPlusAdvice") || "Tavsiye"}</Text>
            <Text style={styles.jpInsight}>{(result as any).dreamJournalPlus.advice || (result as any).dreamJournalPlus.insight}</Text>
          </GlassCard>
        ) : dreamMode !== "A" && showJournalInput ? (
          /* TextInput acik: yaz + gonder */
          <GlassCard style={[styles.section, styles.journalPlusInput]}>
            <Text style={styles.jpInputLabel}>{t("journalPlusWriteAnswer") || "Cevabını yaz"}</Text>
            <TextInput
              style={styles.jpTextInput}
              placeholder={t("journalPlusPlaceholder") || "Cevabını buraya yaz..."}
              placeholderTextColor="rgba(255, 255, 255, 0.25)"
              multiline
              maxLength={200}
              value={journalAnswer}
              onChangeText={setJournalAnswer}
              textAlignVertical="top"
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleJournalPlus}
              disabled={journalPlusLoading || journalAnswer.trim().length < 5 || !canAffordJournalPlus}
            >
              <LinearGradient
                colors={
                  journalAnswer.trim().length < 5 || !canAffordJournalPlus
                    ? ["rgba(100,100,100,0.3)", "rgba(80,80,80,0.2)"]
                    : ["#c084fc", "#6366f1"]
                }
                style={styles.jpButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {journalPlusLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={styles.jpButtonText}>{t("journalPlusSend") || "Gönder"} (</Text>
                    <GemstoneIcon size={26} />
                    <Text style={styles.jpButtonText}>{prices.JOURNAL_PLUS || 5})</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        ) : null}

        {/* Upsell Symbol (if unlocked) */}
        {hasUpsell && result.upsellSymbol && (
          <GlassCard style={[styles.section, styles.upsellResult]}>
            <Text style={styles.upsellResultTitle}>
              +1 {result.upsellSymbol.symbol}
            </Text>
            <Text style={styles.upsellInsight}>{result.upsellSymbol.insight}</Text>
          </GlassCard>
        )}

        {/* MODE A: Single auto-symbol offer */}
        {dreamMode === "A" && !hasUpsell && candidates.length === 1 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectSymbol(candidates[0].symbol)}
            disabled={upsellLoading || !canAffordUpsell}
          >
            <GlassCard style={[styles.section, styles.upsellOffer]}>
              <View style={styles.upsellOfferRow}>
                <View style={styles.upsellOfferLeft}>
                  <Text style={styles.upsellOfferSymbol}>{candidates[0].symbol}</Text>
                  <Text style={styles.upsellOfferHint}>{candidates[0].hint}</Text>
                </View>
                <View style={styles.upsellOfferBadge}>
                  {upsellLoading ? (
                    <ActivityIndicator color="#38bdf8" size="small" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <GemstoneIcon size={26} />
                      <Text style={styles.upsellOfferPrice}>{prices.UPSELL_SYMBOL}</Text>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* MODE B: 3 candidate symbols (user picks one) */}
        {dreamMode === "B" && showCandidates && candidates.length > 0 && !hasUpsell && (
          <GlassCard style={[styles.section, styles.candidateSection]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Text style={styles.candidateTitle}>Bir sembol seç (</Text>
              <GemstoneIcon size={26} />
              <Text style={styles.candidateTitle}>{prices.UPSELL_SYMBOL})</Text>
            </View>
            {candidates.map((c: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.candidateRow}
                activeOpacity={0.8}
                onPress={() => handleSelectSymbol(c.symbol)}
                disabled={upsellLoading}
              >
                <View style={styles.candidateDot} />
                <View style={styles.candidateContent}>
                  <Text style={styles.candidateSymbol}>{c.symbol}</Text>
                  <Text style={styles.candidateHint}>{c.hint}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {upsellLoading && <ActivityIndicator color="#38bdf8" style={{ marginTop: 8 }} />}
          </GlassCard>
        )}

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          {/* MODE B: Upsell CTA to show candidates */}
          {dreamMode === "B" && !hasUpsell && !showCandidates && candidates.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCandidates(true)}
            >
              <LinearGradient
                colors={["#38bdf8", "#6366f1"]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.ctaText}>+1 Sembol Aç (</Text>
                  <GemstoneIcon size={26} />
                  <Text style={styles.ctaText}>{prices.UPSELL_SYMBOL})</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* JournalPlus CTA — "Kendime Sordum" butonu (B ve C, A'da yok) */}
          {dreamMode !== "A" && !hasJournalPlus && !showJournalInput && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowJournalInput(true)}
            >
              <LinearGradient
                colors={["#c084fc", "#7c3aed"]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.ctaText}>{t("journalPlusCTA") || "Kendime Sordum"} (</Text>
                  <GemstoneIcon size={26} />
                  <Text style={styles.ctaText}>{prices.JOURNAL_PLUS || 5})</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Upgrade CTAs (only show if current mode is A) */}
          {dreamMode === "A" && (
            <>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleUpgrade("B")}>
                <LinearGradient
                  colors={["rgba(168, 85, 247, 0.5)", "rgba(99, 102, 241, 0.4)"]}
                  style={styles.ctaButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={styles.ctaText}>🔮 Deep Decode (</Text>
                    <GemstoneIcon size={26} />
                    <Text style={styles.ctaText}>{prices.B})</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={() => handleUpgrade("C")}>
                <LinearGradient
                  colors={["rgba(245, 158, 11, 0.4)", "rgba(234, 88, 12, 0.3)"]}
                  style={styles.ctaButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={styles.ctaText}>🗺️ Rewrite Plan (</Text>
                    <GemstoneIcon size={26} />
                    <Text style={styles.ctaText}>{prices.C})</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginBottom: 12,
  },
  retryLink: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  newLink: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 16,
    width: "100%",
  },
  sectionTitle: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  overallText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 16,
    lineHeight: 26,
  },
  beatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  beatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a855f7",
    marginTop: 8,
  },
  beatText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  patternText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  planNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  planFirst: { backgroundColor: "rgba(34, 197, 94, 0.3)" },
  planSecond: { backgroundColor: "rgba(56, 189, 248, 0.3)" },
  planThird: { backgroundColor: "rgba(245, 158, 11, 0.3)" },
  planNumberText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  planText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  keywordsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  keywordChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  keywordText: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "600",
  },
  nextStepText: {
    color: "#4ade80",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  journalSection: {
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  journalPlusResult: {
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    backgroundColor: "rgba(168, 85, 247, 0.05)",
  },
  jpLabel: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  jpAnswer: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
  jpDivider: {
    height: 1,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    marginVertical: 12,
  },
  jpInsightLabel: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  jpInsight: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    lineHeight: 24,
  },
  journalPlusInput: {
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.2)",
  },
  jpInputLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
  jpTextInput: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
    maxHeight: 120,
    marginBottom: 10,
  },
  jpButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  jpButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  journalLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  journalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  upsellOffer: {
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  upsellOfferRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upsellOfferLeft: {
    flex: 1,
    marginRight: 12,
  },
  upsellOfferSymbol: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  upsellOfferHint: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    lineHeight: 17,
  },
  upsellOfferBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  upsellOfferPrice: {
    color: "#7dd3fc",
    fontSize: 13,
    fontWeight: "700",
  },
  upsellResult: {
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    backgroundColor: "rgba(56, 189, 248, 0.05)",
  },
  upsellResultTitle: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  upsellInsight: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 24,
  },
  candidateSection: {
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  candidateTitle: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
  },
  candidateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    marginBottom: 8,
    gap: 10,
  },
  candidateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38bdf8",
    marginTop: 6,
  },
  candidateContent: {
    flex: 1,
  },
  candidateSymbol: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  candidateHint: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 13,
    lineHeight: 19,
  },
  ctaContainer: {
    gap: 10,
    marginTop: 8,
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomPadding: {
    height: 30,
  },
});
