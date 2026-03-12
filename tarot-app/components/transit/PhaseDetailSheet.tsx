import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { PHASE_GRADIENTS } from "./constants";
import { ContributionGrid, formatRange, formatPeak } from "./ThemeDetailSheet";
import type {
  Phase,
  DetailedDriver,
  TransitEvent,
} from "./types";

function driverToEvent(d: DetailedDriver): TransitEvent {
  return {
    id: d.id,
    type: d.type,
    color: d.color,
    transitPlanet: d.transitPlanet,
    natalPlanet: d.natalPlanet,
    aspect: d.aspect,
    title: d.title,
    rangeText: d.rangeText,
    startDate: d.startDate,
    endDate: d.endDate,
    exactDate: d.exactDate,
    score: d.score,
  };
}

export default function PhaseDetailSheet({
  phase,
  index,
  drivers,
  visible,
  onClose,
}: {
  phase: Phase | null;
  index: number;
  drivers: DetailedDriver[];
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const calendarY = useRef(0);
  const [highlightEvent, setHighlightEvent] = useState<TransitEvent | null>(null);

  if (!phase) return null;

  const phaseDrivers = drivers.filter((d) => d.phaseId === phase.id);
  const events = phaseDrivers.map(driverToEvent);

  const gradient = PHASE_GRADIENTS[index % PHASE_GRADIENTS.length];
  const accentColor = ["#a78bfa", "#fbbf24", "#4ade80", "#f472b6"][index % 4];

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={s.sheet}>
          <LinearGradient
            colors={["rgba(18,15,36,0.98)", "rgba(5,8,26,0.99)"]}
            style={s.sheetGradient}
          >
            <View style={s.handle} />

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scroll}
            >
              {/* Phase header */}
              <LinearGradient
                colors={gradient}
                style={s.phaseHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={s.numberWrap}>
                  <Text style={s.number}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{phase.title}</Text>
                  <Text style={s.window}>{phase.window}</Text>
                </View>
              </LinearGradient>

              {/* Stats */}
              <View style={s.statsRow}>
                <Text style={s.stat}>
                  <Text style={s.statNum}>{phaseDrivers.length}</Text> {t("transitMetricTransit")}
                </Text>
              </View>

              {/* Interpretation */}
              {(phase.interpretation ?? "") !== "" && (
                <Text style={s.interpretation}>{phase.interpretation}</Text>
              )}

              {/* Calendar + transit list */}
              {events.length > 0 && (
                <View onLayout={(e) => { calendarY.current = e.nativeEvent.layout.y; }}>
                  <View style={s.divider} />
                  <ContributionGrid
                    events={events}
                    accentColor={accentColor}
                    highlightEvent={highlightEvent}
                    onFlashDone={() => setHighlightEvent(null)}
                    onPressEvent={(ev) => setHighlightEvent(ev)}
                  />
                </View>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeTxt}>{t("transitClose")}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 16,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
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
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  window: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },

  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  stat: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  statNum: { color: "rgba(255,255,255,0.7)", fontWeight: "800" },

  interpretation: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 23,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 16,
  },

  sectionLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  closeBtn: {
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
  },
  closeTxt: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700" },
});
