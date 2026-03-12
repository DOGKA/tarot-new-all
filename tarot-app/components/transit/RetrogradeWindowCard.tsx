import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Planet3D from "../ui/Planet3D";
import { RETRO_CARD_COLORS, PLANET_COLORS } from "./constants";
import { formatRange } from "./ThemeDetailSheet";
import type { RetrogradeWindow } from "./types";

export default function RetrogradeWindowCard({ retro }: { retro: RetrogradeWindow }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const colors = RETRO_CARD_COLORS[retro.planet] || RETRO_CARD_COLORS.pluto;
  const planetColor = PLANET_COLORS[retro.planet] || "#c084fc";
  const isSaturn = retro.planet === "saturn";

  return (
    <LinearGradient
      colors={[colors.gradient[0], colors.gradient[1], "rgba(5,8,26,0.95)"]}
      style={[s.card, { borderColor: colors.border }]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={s.header}>
          <View style={[s.dot, { backgroundColor: planetColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.planetName, { color: planetColor }]}>{retro.planetLabel} {t("transitRetroSuffix")}</Text>
            <Text style={s.dates}>{formatRange(retro.startDate, retro.endDate, t)}</Text>
          </View>
          <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      <View style={s.planetVisual}>
        <Planet3D planetKey={retro.planet} size={isSaturn ? 56 : 48} />
      </View>

      {expanded && (
        <View style={s.body}>
          <View style={s.divider} />
          <Text style={s.interpretation}>{retro.personalNote}</Text>
          {(retro.affectedThemes?.length ?? 0) > 0 && (
            <View style={s.themeTags}>
              {(retro.affectedThemes || []).map((t, i) => (
                <View key={i} style={[s.themeTag, { backgroundColor: planetColor + "18" }]}>
                  <Text style={[s.themeTagText, { color: planetColor }]}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1.5, marginBottom: 12, overflow: "hidden", position: "relative" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingRight: 70 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  planetName: { fontSize: 16, fontWeight: "800" },
  dates: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  planetVisual: { position: "absolute", right: 8, top: 4, opacity: 0.85 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 12 },
  interpretation: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 21 },
  personalNote: { color: "rgba(196,181,253,0.9)", fontSize: 13, lineHeight: 21, marginTop: 8, fontStyle: "italic" },
  themeTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  themeTag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  themeTagText: { fontSize: 10, fontWeight: "700" },
});
