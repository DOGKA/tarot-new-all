import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useDream } from "../../context/DreamContext";
import { useApp } from "../../context/AppContext";
import { GradientBackground, GlassCard, GemstoneIcon } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import type { DreamMode } from "../../types/dream";

const MODE_CONFIG = [
  {
    mode: "A" as DreamMode,
    icon: "⚡",
    titleKey: "quickDecode",
    descKey: "quickDecodeDesc",
    color: "#22c55e",
    gradient: ["rgba(34, 197, 94, 0.25)", "rgba(34, 197, 94, 0.05)"] as const,
  },
  {
    mode: "B" as DreamMode,
    icon: "🔮",
    titleKey: "deepDecode",
    descKey: "deepDecodeDesc",
    color: "#a855f7",
    gradient: ["rgba(168, 85, 247, 0.25)", "rgba(168, 85, 247, 0.05)"] as const,
  },
  {
    mode: "C" as DreamMode,
    icon: "🗺️",
    titleKey: "rewritePlan",
    descKey: "rewritePlanDesc",
    color: "#f59e0b",
    gradient: ["rgba(245, 158, 11, 0.25)", "rgba(245, 158, 11, 0.05)"] as const,
  },
];

export default function DreamHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium } = useApp();
  const {
    setDreamMode,
    gemstoneBalance,
    prices,
    fetchUserInfo,
  } = useDream();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleModeSelect = (mode: DreamMode) => {
    if (mode === "C" && !isPremium) {
      return;
    }
    setDreamMode(mode);
    router.push("/dream/input");
  };

  const isModeDisabled = (mode: DreamMode): boolean => {
    return mode === "C" && !isPremium;
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Dream Coder</Text>
          <View style={[styles.balanceBadge, { flexDirection: "row", alignItems: "center" }]}>
            <GemstoneIcon size={34} />
            <Text style={styles.balanceText}> {gemstoneBalance}</Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t("dreamSubtitle") || "Rüyanı çöz, bilinçaltını keşfet"}
        </Text>

        {/* Mode Selection */}
        <Text style={styles.sectionTitle}>
          {t("selectMode") || "Mod Seç"}
        </Text>

        {MODE_CONFIG.map((cfg) => {
          const disabled = isModeDisabled(cfg.mode);

          return (
            <TouchableOpacity
              key={cfg.mode}
              activeOpacity={disabled ? 1 : 0.85}
              onPress={() => handleModeSelect(cfg.mode)}
              style={[styles.modeCard, disabled && styles.modeCardDisabled]}
            >
              <LinearGradient
                colors={disabled ? ["rgba(60,60,60,0.3)", "rgba(40,40,40,0.2)"] : [cfg.gradient[0], cfg.gradient[1]]}
                style={styles.modeCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modeHeader}>
                  <Text style={[styles.modeIcon, disabled && { opacity: 0.4 }]}>{disabled ? "🔒" : cfg.icon}</Text>
                  <View style={styles.modeTitleRow}>
                    <Text style={[styles.modeTitle, { color: disabled ? "rgba(255,255,255,0.35)" : cfg.color }]}>
                      {t(cfg.titleKey) || cfg.titleKey}
                    </Text>
                    <View
                      style={[
                        styles.gemBadge,
                        disabled && styles.gemBadgeLocked,
                        { flexDirection: "row", alignItems: "center", gap: 3 },
                      ]}
                    >
                      {disabled ? (
                        <Text style={[styles.gemText, styles.gemTextLocked]}>🔒</Text>
                      ) : (
                        <>
                          <GemstoneIcon size={38} />
                          <Text style={styles.gemText}>{prices[cfg.mode]}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.modeDesc}>
                  {t(cfg.descKey) || ""}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    paddingRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  balanceText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  modeCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeCardGradient: {
    padding: 20,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  modeTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  gemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  gemBadgeLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gemText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
  },
  gemTextLocked: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  modeDesc: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 40,
  },
  bottomPadding: {
    height: 30,
  },
});
