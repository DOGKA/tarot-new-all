import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const RULER_W = SCREEN_W - 48;
const TICK_COUNT = 49;

const DAY_LABELS: Record<string, string[]> = {
  tr: ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"],
  en: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  de: ["MO", "DI", "MI", "DO", "FR", "SA", "SO"],
  es: ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"],
};

const TODAY_LABEL: Record<string, string> = {
  tr: "BUGÜN",
  en: "TODAY",
  de: "HEUTE",
  es: "HOY",
};

interface WeekRulerProps {
  lang?: string;
  date?: Date;
  accentColor?: string;
}

export default function WeekRuler({ lang = "tr", date, accentColor = "#818cf8" }: WeekRulerProps) {
  const now = date || new Date();

  const { dayIndex, hourFraction, labels } = useMemo(() => {
    const jsDay = now.getDay();
    // Convert JS day (0=Sun) to Mon-based index (0=Mon)
    const di = jsDay === 0 ? 6 : jsDay - 1;
    const hf = (now.getHours() + now.getMinutes() / 60) / 24;
    const dayNames = DAY_LABELS[lang] || DAY_LABELS.en;
    const todayWord = TODAY_LABEL[lang] || TODAY_LABEL.en;
    const lbls = dayNames.map((name, i) => (i === di ? todayWord : name));
    return { dayIndex: di, hourFraction: hf, labels: lbls };
  }, [now, lang]);

  // Position of the indicator (0..1 across the ruler)
  const position = (dayIndex + hourFraction) / 7;
  const indicatorLeft = position * RULER_W;

  return (
    <View style={styles.container}>
      {/* Indicator triangle */}
      <View style={[styles.indicator, { left: indicatorLeft - 6 }]}>
        <Text style={[styles.triangle, { color: accentColor }]}>▼</Text>
      </View>

      {/* Tick marks */}
      <View style={styles.tickRow}>
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const isMajor = i % 7 === 0;
          return (
            <View
              key={i}
              style={[
                styles.tick,
                isMajor ? styles.tickMajor : styles.tickMinor,
              ]}
            />
          );
        })}
      </View>

      {/* Day labels */}
      <View style={styles.labelRow}>
        {labels.map((label, i) => {
          const isToday = i === dayIndex;
          return (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                isToday && [styles.dayLabelToday, { color: accentColor }],
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RULER_W,
    alignSelf: "center",
    marginVertical: 16,
  },
  indicator: {
    position: "absolute",
    top: -14,
    zIndex: 2,
  },
  triangle: {
    fontSize: 12,
  },
  tickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 16,
  },
  tick: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tickMajor: {
    height: 14,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  tickMinor: {
    height: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    fontWeight: "800",
  },
});
