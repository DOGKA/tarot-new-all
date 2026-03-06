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
import { GradientBackground, Zodiac3D, StarField, WeekRuler } from "../../components/ui";

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  fire: { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)", text: "#fb923c" },
  earth: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", text: "#4ade80" },
  air: { bg: "rgba(147,197,253,0.12)", border: "rgba(147,197,253,0.3)", text: "#93c5fd" },
  water: { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)", text: "#818cf8" },
};

const ELEMENT_NAMES: Record<string, Record<string, string>> = {
  fire: { tr: "Ateş", en: "Fire", de: "Feuer", es: "Fuego" },
  earth: { tr: "Toprak", en: "Earth", de: "Erde", es: "Tierra" },
  air: { tr: "Hava", en: "Air", de: "Luft", es: "Aire" },
  water: { tr: "Su", en: "Water", de: "Wasser", es: "Agua" },
};

const ZODIAC_ELEMENTS: Record<string, string> = {
  aries: "fire", taurus: "earth", gemini: "air", cancer: "water",
  leo: "fire", virgo: "earth", libra: "air", scorpio: "water",
  sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water",
};

export default function ZodiacDetailScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "tr";
  const params = useLocalSearchParams<{
    zodiacKey: string;
    zodiacName: string;
    zodiacElement: string;
    meaning: string;
    firsat: string;
    his: string;
  }>();

  const element = ZODIAC_ELEMENTS[params.zodiacKey || "aries"] || "fire";
  const elemStyle = ELEMENT_COLORS[element] || ELEMENT_COLORS.fire;
  const elemName = ELEMENT_NAMES[element]?.[lang] || element;

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
          <Zodiac3D zodiacKey={params.zodiacKey || "aries"} size={160} />
          <Text style={styles.title}>
            {t("moonZodiacDetail", { name: params.zodiacName })}
          </Text>
          {params.his ? (
            <Text style={styles.his}>{params.his}</Text>
          ) : null}
          <View style={[styles.elementBadge, { backgroundColor: elemStyle.bg, borderColor: elemStyle.border }]}>
            <Text style={[styles.elementText, { color: elemStyle.text }]}>{elemName}</Text>
          </View>
        </View>

        {/* Week Ruler */}
        <WeekRuler lang={lang} accentColor={elemStyle.text} />

        {/* Meaning */}
        {params.meaning ? (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{params.meaning}</Text>
          </View>
        ) : null}

        {/* Firsat */}
        {params.firsat ? (
          <View style={[styles.highlightCard, { backgroundColor: elemStyle.bg, borderColor: elemStyle.border }]}>
            <Text style={[styles.highlightTitle, { color: elemStyle.text }]}>{t("moonZodiacChance")}</Text>
            <Text style={styles.highlightText}>{params.firsat}</Text>
          </View>
        ) : null}

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
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
  },
  his: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    marginTop: 8,
    fontStyle: "italic",
    letterSpacing: 1,
  },
  elementBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  elementText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
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
  highlightCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  highlightText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 23,
  },
});
