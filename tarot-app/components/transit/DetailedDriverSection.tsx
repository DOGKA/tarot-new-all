import React, { useState } from "react";
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PLANET_COLORS, getScoreColor } from "./constants";
import { PlanetIcon, CircularScoreBadge } from "./shared";
import type { DetailedDriver } from "./types";

export default function DetailedDriverSection({ drivers }: { drivers: DetailedDriver[] }) {
  const [expanded, setExpanded] = useState(false);
  if (drivers.length === 0) return null;

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.header}
        activeOpacity={0.8}
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}
      >
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>Detaylı Kanıtlar</Text>
          <View style={s.countPill}><Text style={s.countText}>{drivers.length}</Text></View>
        </View>
        <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.list}>
          <Text style={s.hint}>Tam detayları görüntülemek için dokunun.</Text>
          {drivers.map((d, idx) => (
            <View key={`${d.id}_${idx}`} style={s.row}>
              <PlanetIcon planet={d.transitPlanet} size={38} />
              <View style={s.info}>
                <Text style={s.title}>{d.title}</Text>
                <Text style={s.range}>{d.rangeText || `${d.startDate} — ${d.endDate}`}</Text>
              </View>
              <CircularScoreBadge score={d.score} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "700" },
  countPill: { backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { color: "#fbbf24", fontSize: 11, fontWeight: "800" },
  chevron: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  list: { marginTop: 12 },
  hint: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  info: { flex: 1 },
  title: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700" },
  range: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
});
