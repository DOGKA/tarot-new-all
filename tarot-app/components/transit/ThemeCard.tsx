import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME_ICONS, COLOR_MAP } from "./constants";
import type { TransitTheme } from "./types";

const INTENSITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "Güçlü" },
  medium: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Orta" },
  low: { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", label: "Hafif" },
};

export default function ThemeCard({ theme, expanded, onToggle }: { theme: TransitTheme; expanded: boolean; onToggle: () => void }) {
  const ic = INTENSITY_COLORS[theme.intensity] || INTENSITY_COLORS.medium;
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, { toValue: expanded ? 1 : 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [expanded]);

  const chevronRotation = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={s.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75}>
        {/* Top row */}
        <View style={s.topRow}>
          <View style={s.categoryPill}>
            <Text style={s.categoryText}>{THEME_ICONS[theme.theme] || "Tema"}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.intensityPill, { backgroundColor: ic.bg }]}>
              <Text style={[s.intensityText, { color: ic.color }]}>{ic.label}</Text>
            </View>
            <Animated.Text style={[s.chevron, { transform: [{ rotate: chevronRotation }] }]}>▼</Animated.Text>
          </View>
        </View>

        {/* Title + Date */}
        <Text style={s.title} numberOfLines={expanded ? undefined : 2}>{theme.title}</Text>
        <Text style={s.date}>{theme.window}</Text>

        {/* Summary preview */}
        {(theme.summary ?? "") !== "" && (
          <Text style={s.summary} numberOfLines={expanded ? undefined : 2}>{theme.summary}</Text>
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded && (
        <View style={s.expandedContent}>
          <View style={s.divider} />
          {(theme.interpretation ?? "") !== "" && (
            <Text style={s.interpretation}>{theme.interpretation}</Text>
          )}
          {(theme.events?.length ?? 0) > 0 && (
            <View style={s.eventsList}>
              <Text style={s.eventsLabel}>Bu temayi olusturan transitler</Text>
              {(theme.events || []).map((ev) => (
                <View key={ev.id} style={s.eventRow}>
                  <View style={[s.eventDot, { backgroundColor: COLOR_MAP[ev.color] || "#a78bfa" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventTitle}>{ev.title}</Text>
                    <Text style={s.eventRange}>{ev.rangeText}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    marginBottom: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  categoryPill: { backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  categoryText: { color: "#c4b5fd", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  intensityPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  intensityText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 10 },
  title: { color: "#fff", fontWeight: "800", fontSize: 16, lineHeight: 22 },
  date: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 },
  summary: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, marginTop: 8 },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 14 },
  interpretation: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 23, marginBottom: 14 },
  eventsList: { marginTop: 4 },
  eventsLabel: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  eventDot: { width: 5, height: 5, borderRadius: 3 },
  eventTitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },
  eventRange: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 1 },
});
