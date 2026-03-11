import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Milestone } from "./types";

export default function MilestoneRow({ milestone }: { milestone: Milestone }) {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={s.dot} />
        <Text style={s.title}>{milestone.title}</Text>
      </View>
      <Text style={s.window}>{milestone.window}</Text>
      {(milestone.description ?? "") !== "" && (
        <Text style={s.description}>{milestone.description}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    marginBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fbbf24" },
  title: { color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: "700", flex: 1 },
  window: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4, marginLeft: 20 },
  description: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, marginTop: 8, marginLeft: 20 },
});
