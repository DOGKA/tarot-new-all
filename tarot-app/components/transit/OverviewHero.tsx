import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Planet3D from "../ui/Planet3D";
import type { V4Payload } from "./types";

const DURATION_CONFIG: Record<string, {
  accentColor: string;
  glowColor: string;
  planetKey: string;
}> = {
  monthly:         { accentColor: "#a78bfa", glowColor: "#8b5cf6", planetKey: "moon" },
  quarterly:       { accentColor: "#60a5fa", glowColor: "#3b82f6", planetKey: "mercury" },
  hybrid:          { accentColor: "#c084fc", glowColor: "#a855f7", planetKey: "saturn" },
  yearlyNarrative: { accentColor: "#fbbf24", glowColor: "#d97706", planetKey: "sun" },
};

export default function OverviewHero({ data }: { data: V4Payload }) {
  const mode = data.periodMode || "monthly";
  const cfg = DURATION_CONFIG[mode] || DURATION_CONFIG.monthly;
  const dateText = formatHeroDateRange(data.period?.start, data.period?.end);

  const metrics: { value: string; label: string }[] = [];
  if ((data.phases?.length ?? 0) > 0) metrics.push({ value: String(data.phases.length), label: "faz" });
  if ((data.themes?.length ?? 0) > 0) metrics.push({ value: String(data.themes.length), label: "tema" });
  metrics.push({ value: String(data.stats?.rawEventCount || 0), label: "transit" });
  metrics.push({ value: String(data.months || 0), label: "ay" });

  return (
    <View style={s.heroWrapper}>
      <View style={[s.glowRing, { shadowColor: cfg.glowColor }]} />

      <BlurView intensity={25} tint="dark" style={s.blurContainer}>
        <LinearGradient
          colors={[`${cfg.accentColor}15`, "rgba(255,255,255,0.03)", "rgba(5,8,26,0.6)"]}
          style={s.innerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Planet visual — top right, absolute */}
          <View style={s.planetContainer}>
            <Planet3D planetKey={cfg.planetKey} size={100} />
          </View>

          <View style={s.topContent}>
            {/* Title */}
            <Text style={s.title} numberOfLines={3}>
              {data.overview?.title || "Gökyüzü Hikayen"}
            </Text>

            {!!dateText && (
              <View style={s.dateChip}>
                <View style={[s.dateDot, { backgroundColor: cfg.accentColor }]} />
                <Text style={s.dateChipText}>{dateText}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Summary — full length */}
          {(data.overview?.summary ?? "") !== "" && (
            <Text style={s.summary}>{data.overview.summary}</Text>
          )}

          {/* Bottom: metrics inline + date */}
          <View style={s.bottomRow}>
            {metrics.map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <Text style={s.metricSep}>·</Text>}
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

function formatHeroDateRange(start?: string, end?: string) {
  if (!start || !end) return "";

  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) return "";

  const months = [
    "OCAK",
    "ŞUBAT",
    "MART",
    "NİSAN",
    "MAYIS",
    "HAZİRAN",
    "TEMMUZ",
    "AĞUSTOS",
    "EYLÜL",
    "EKİM",
    "KASIM",
    "ARALIK",
  ];

  if (startYear === endYear) {
    return `${startDay} ${months[startMonth - 1]} - ${endDay} ${months[endMonth - 1]} ${startYear}`;
  }

  return `${startDay} ${months[startMonth - 1]} ${startYear} - ${endDay} ${months[endMonth - 1]} ${endYear}`;
}

const s = StyleSheet.create({
  heroWrapper: {
    marginBottom: 8,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    top: 4, left: 4, right: 4, bottom: 4,
    borderRadius: 22,
    ...Platform.select({
      ios: { shadowRadius: 24, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 12 },
    }),
  },
  blurContainer: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  innerGradient: {
    padding: 20,
  },
  topContent: {
    paddingRight: 86,
  },

  planetContainer: {
    position: "absolute",
    top: 10,
    right: 8,
    opacity: 0.95,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dateChipText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 14,
    marginRight: -20,
  },

  summary: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 22,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 4,
    paddingRight: 20,
  },
  metricValue: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "800",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    marginRight: 2,
  },
  metricSep: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 13,
    fontWeight: "400",
    marginHorizontal: 2,
  },
});
