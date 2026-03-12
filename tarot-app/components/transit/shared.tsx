import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { INTENSITY_CONFIG, PLANET_COLORS, PLANET_GLYPHS, getScoreColor } from "./constants";

export function IntensityBadge({ intensity }: { intensity: string }) {
  const { t } = useTranslation();
  const cfg = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.medium;
  return (
    <View style={[st.intensityBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[st.intensityText, { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
    </View>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <View style={[st.scoreBadge, { borderColor: color + "33" }]}>
      <Text style={[st.scoreText, { color }]}>{score}</Text>
    </View>
  );
}

export function CircularScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <View style={[st.circularScore, { backgroundColor: color + "22" }]}>
      <Text style={[st.circularScoreText, { color }]}>{score}</Text>
    </View>
  );
}

export function PlanetIcon({ planet, size = 38 }: { planet: string; size?: number }) {
  const color = PLANET_COLORS[planet] || "#a78bfa";
  const glyph = PLANET_GLYPHS[planet] || "★";
  return (
    <View style={[st.planetIcon, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + "22" }]}>
      <Text style={[st.planetGlyph, { color, fontSize: size * 0.45 }]}>{glyph}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  intensityBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  intensityText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  scoreBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  scoreText: { fontSize: 10, fontWeight: "800" },
  circularScore: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  circularScoreText: { fontSize: 13, fontWeight: "800" },
  planetIcon: { alignItems: "center", justifyContent: "center" },
  planetGlyph: { fontWeight: "700" },
});
