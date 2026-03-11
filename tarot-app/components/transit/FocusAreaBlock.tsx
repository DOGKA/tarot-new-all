import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FOCUS_AREA_CONFIG } from "./constants";

export default function FocusAreaBlock({ areaKey, text }: { areaKey: string; text: string }) {
  const config = FOCUS_AREA_CONFIG[areaKey] || { label: areaKey, color: "#a78bfa" };
  if (text === "" || !text) return null;

  return (
    <View style={[s.card, { borderColor: config.color + "33", borderLeftColor: config.color }]}>
      <Text style={[s.label, { color: config.color }]}>{config.label}</Text>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderLeftWidth: 3, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  text: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 23 },
});
