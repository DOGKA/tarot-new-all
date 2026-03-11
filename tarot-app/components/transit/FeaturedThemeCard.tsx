import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME_ICONS } from "./constants";
import type { TransitTheme } from "./types";

const INTENSITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "Güçlü" },
  medium: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Orta" },
  low: { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", label: "Hafif" },
};

export default function FeaturedThemeCard({ theme }: { theme: TransitTheme }) {
  const ic = INTENSITY_COLORS[theme.intensity] || INTENSITY_COLORS.medium;

  return (
    <LinearGradient
      colors={["rgba(139,92,246,0.15)", "rgba(59,130,246,0.05)", "rgba(5,8,26,0.95)"]}
      style={s.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top row: category + intensity */}
      <View style={s.topRow}>
        <View style={s.categoryPill}>
          <Text style={s.categoryText}>{THEME_ICONS[theme.theme] || "Tema"}</Text>
        </View>
        <View style={[s.intensityPill, { backgroundColor: ic.bg }]}>
          <Text style={[s.intensityText, { color: ic.color }]}>{ic.label}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={s.title}>{theme.title}</Text>

      {/* Date */}
      <Text style={s.date}>{theme.window}</Text>

      {/* Summary */}
      {(theme.summary ?? "") !== "" && (
        <Text style={s.summary}>{theme.summary}</Text>
      )}

      {/* Support count */}
      {(theme.events?.length ?? 0) > 0 && (
        <View style={s.supportRow}>
          <View style={s.supportDot} />
          <Text style={s.supportText}>{theme.events!.length} transit destekliyor</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    padding: 20,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: "#8b5cf6", shadowRadius: 16, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 6 },
    }),
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  categoryPill: { backgroundColor: "rgba(139,92,246,0.18)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  categoryText: { color: "#c4b5fd", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  intensityPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  intensityText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", lineHeight: 26, letterSpacing: -0.5 },
  date: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 },
  summary: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 22, marginTop: 14 },
  supportRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  supportDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(167,139,250,0.5)" },
  supportText: { color: "rgba(167,139,250,0.6)", fontSize: 11, fontWeight: "600" },
});
