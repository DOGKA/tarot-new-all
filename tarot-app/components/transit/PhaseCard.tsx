import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PHASE_GRADIENTS, THEME_ICON_KEYS } from "./constants";
import type { Phase } from "./types";

export default function PhaseCard({
  phase,
  index,
  onPress,
}: {
  phase: Phase;
  index: number;
  onPress?: () => void;
}) {
  const gradient = PHASE_GRADIENTS[index % PHASE_GRADIENTS.length];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <LinearGradient colors={gradient} style={s.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.header}>
          <View style={s.numberWrap}>
            <Text style={s.number}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{phase.title}</Text>
            <Text style={s.window}>{phase.window}</Text>
          </View>
          <Text style={s.chevron}>▼</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  numberWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  number: { color: "#fff", fontSize: 16, fontWeight: "900" },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  window: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
});
