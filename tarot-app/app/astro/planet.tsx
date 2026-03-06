import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { GradientBackground, Planet3D, StarField, WeekRuler } from "../../components/ui";

const PLANET_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  sun:     { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
  moon:    { bg: "rgba(200,200,255,0.1)", border: "rgba(200,200,255,0.2)", text: "#c8c8ff" },
  mars:    { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", text: "#f87171" },
  mercury: { bg: "rgba(180,180,200,0.1)", border: "rgba(180,180,200,0.25)", text: "#b4b4c8" },
  jupiter: { bg: "rgba(220,180,100,0.12)", border: "rgba(220,180,100,0.3)", text: "#dcb464" },
  venus:   { bg: "rgba(255,220,150,0.12)", border: "rgba(255,220,150,0.3)", text: "#ffdc96" },
  saturn:  { bg: "rgba(220,200,150,0.1)", border: "rgba(220,200,150,0.25)", text: "#dcc896" },
};

const DAY_PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
const DAY_SYMBOLS: Record<string, string> = {
  sun: "☉", moon: "☽", mars: "♂", mercury: "☿", jupiter: "♃", venus: "♀", saturn: "♄",
};

export default function PlanetDetailScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "tr";
  const params = useLocalSearchParams<{
    planetKey: string;
    planetName: string;
    planetDay: string;
    meaning: string;
    advice: string;
  }>();

  const pKey = params.planetKey || "sun";
  const pColors = PLANET_COLORS[pKey] || PLANET_COLORS.sun;

  return (
    <GradientBackground>
      <StarField count={50} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Planet3D planetKey={pKey} size={160} />
          <Text style={styles.title}>{params.planetName}</Text>
          <Text style={styles.dayLabel}>{params.planetDay}</Text>
          <View style={[styles.symbolBadge, { backgroundColor: pColors.bg, borderColor: pColors.border }]}>
            <Text style={[styles.symbolText, { color: pColors.text }]}>{DAY_SYMBOLS[pKey] || "★"}</Text>
          </View>
        </View>

        {/* Week Ruler */}
        <WeekRuler lang={lang} accentColor={pColors.text} />

        {/* Meaning */}
        {params.meaning ? (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{params.meaning}</Text>
          </View>
        ) : null}

        {/* Advice */}
        {params.advice ? (
          <View style={[styles.adviceCard, { backgroundColor: pColors.bg, borderColor: pColors.border }]}>
            <Text style={[styles.adviceTitle, { color: pColors.text }]}>{t("moonPlanetStep")}</Text>
            <Text style={styles.adviceText}>{params.advice}</Text>
          </View>
        ) : null}

        {/* Weekly Planet Overview */}
        <View style={styles.weekCard}>
          {DAY_PLANET_ORDER.map((pk) => {
            const isActive = pk === pKey;
            const c = PLANET_COLORS[pk] || PLANET_COLORS.sun;
            return (
              <View key={pk} style={[styles.weekItem, isActive && { backgroundColor: c.bg, borderRadius: 12 }]}>
                <Text style={[styles.weekSymbol, isActive && { color: c.text }]}>{DAY_SYMBOLS[pk]}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  hero: { alignItems: "center", paddingTop: 50, paddingBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
  },
  dayLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  symbolBadge: {
    marginTop: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolText: { fontSize: 22 },
  section: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  sectionText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 23,
  },
  adviceCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  adviceText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 23,
  },
  weekCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  weekItem: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  weekSymbol: {
    fontSize: 20,
    color: "rgba(255,255,255,0.3)",
  },
});
