import React, { useState } from "react";
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLOR_MAP } from "./constants";
import type { TransitEvent } from "./types";

export default function BackgroundSection({ events }: { events: TransitEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) return null;

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.header}
        activeOpacity={0.8}
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}
      >
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>Arka Plan Etkileri</Text>
          <View style={s.countPill}><Text style={s.countText}>{events.length}</Text></View>
        </View>
        <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && events.map((ev) => (
        <View key={ev.id} style={s.row}>
          <View style={[s.dot, { backgroundColor: COLOR_MAP[ev.color] || "#64748b" }]} />
          <Text style={s.title} numberOfLines={1}>{ev.title}</Text>
          <Text style={s.date}>{ev.startDate}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "700" },
  countPill: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800" },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { color: "rgba(255,255,255,0.45)", fontSize: 12, flex: 1 },
  date: { color: "rgba(255,255,255,0.25)", fontSize: 10 },
});
