import React, { useState } from "react";
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PHASE_GRADIENTS, THEME_ICONS } from "./constants";
import type { Phase } from "./types";

export default function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const gradient = PHASE_GRADIENTS[index % PHASE_GRADIENTS.length];

  return (
    <LinearGradient colors={gradient} style={s.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}
      >
        <View style={s.header}>
          <View style={s.numberWrap}><Text style={s.number}>{index + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{phase.title}</Text>
            <Text style={s.window}>{phase.window}</Text>
          </View>
          <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (phase.interpretation ?? "") !== "" && (
        <View style={s.body}>
          <View style={s.divider} />
          <Text style={s.interpretation}>{phase.interpretation}</Text>
          {(phase.dominantThemes?.length ?? 0) > 0 && (
            <View style={s.tags}>
              {phase.dominantThemes.map((t) => (
                <View key={t} style={s.tag}><Text style={s.tagText}>{THEME_ICONS[t] || t}</Text></View>
              ))}
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 12, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  numberWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  number: { color: "#fff", fontSize: 16, fontWeight: "900" },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  window: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 12 },
  interpretation: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 23 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});
