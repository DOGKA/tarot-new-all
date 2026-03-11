import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME_ICONS, PHASE_DOT_COLORS } from "./constants";
import type { RecurringTheme } from "./types";

export default function RecurringThemeRow({ rt }: { rt: RecurringTheme }) {
  return (
    <View style={s.row}>
      <View style={s.icon}><Text style={s.iconText}>{THEME_ICONS[rt.theme] || rt.theme}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{rt.label}</Text>
        <View style={s.dotsRow}>
          {(rt.phases || []).map((p: string, i: number) => {
            const phaseIndex = parseInt(p.replace("phase_", ""), 10) - 1;
            const dotColor = PHASE_DOT_COLORS[phaseIndex] || "#a78bfa";
            return <View key={p} style={[s.phaseDot, { backgroundColor: dotColor }]} />;
          })}
          <Text style={s.phaseText}>
            Faz {(rt.phases || []).map((p: string) => p.replace("phase_", "")).join(", ")}
          </Text>
        </View>
        {(rt.description ?? "") !== "" && <Text style={s.description}>{rt.description}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  icon: { backgroundColor: "rgba(167,139,250,0.15)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginTop: 2 },
  iconText: { color: "#c4b5fd", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  label: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700" },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseText: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginLeft: 4 },
  description: { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 19, marginTop: 6 },
});
