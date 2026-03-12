import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { GemstoneIcon, StarField } from "../../components/ui";
import { useApp } from "../../context/AppContext";

import type { V4Payload, Phase } from "../../components/transit/types";
import OverviewHero from "../../components/transit/OverviewHero";
import PhaseCard from "../../components/transit/PhaseCard";
import PhaseDetailSheet from "../../components/transit/PhaseDetailSheet";
import ThemeConstellation from "../../components/transit/ThemeConstellation";
import RetrogradeWindowCard from "../../components/transit/RetrogradeWindowCard";
import MilestoneTimeline from "../../components/transit/MilestoneTimeline";
import FocusAreasSection from "../../components/transit/FocusAreaBlock";
import BackgroundSection from "../../components/transit/BackgroundSection";
import { localizeTransitPayload } from "../../components/transit/localize";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;


function SectionLead({ title }: { title: string }) {
  return (
    <View style={s.sectionLead}>
      <View style={s.sectionLine} />
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

export default function TransitDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { deviceId, gemstoneBalance, language } = useApp();
  const params = useLocalSearchParams<{ months?: string; createdAt?: string; t?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<V4Payload | null>(null);
  const months = Number(params.months || 0) || null;

  useEffect(() => {
    const run = async () => {
      if (!deviceId) return;
      setLoading(true);
      setError(null);
      try {
        const qParams = new URLSearchParams();
        if (months) qParams.set("months", String(months));
        if (params.createdAt) qParams.set("createdAt", params.createdAt);
        qParams.set("lang", language || "tr");
        const res = await fetch(`${API_BASE}/natal/transits/${deviceId}/latest?${qParams}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(t("transitDataNotFound"));
          return;
        }
        setData(json.data as V4Payload);
      } catch (e: any) {
        setError(e.message || t("transitLoadError"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [deviceId, months, params.createdAt, params.t]);

  const [selectedPhase, setSelectedPhase] = useState<{ phase: Phase; index: number } | null>(null);
  const localizedData = useMemo(
    () => (data ? localizeTransitPayload(data, language) : null),
    [data, language]
  );

  const showPhases = (localizedData?.phases?.length ?? 0) > 0;
  const showThemes = (localizedData?.themes?.length ?? 0) > 0;
  const showRetro = (localizedData?.retrogradeWindows?.length ?? 0) > 0;
  const showMilestones = (localizedData?.milestones?.length ?? 0) > 0;
  const showFocusAreas = localizedData?.focusAreas ? Object.values(localizedData.focusAreas).some((v) => v !== "") : false;
  const showBackground = (localizedData?.background?.length ?? 0) > 0;


  if (loading) {
    return (
      <View style={s.fullScreen}>
        <CosmicBackground />
        <View style={s.center}>
          <ActivityIndicator color="#a78bfa" size="large" />
          <Text style={s.loadingText}>{t("transitLoadingReading")}</Text>
        </View>
      </View>
    );
  }

  if (!localizedData) {
    return (
      <View style={s.fullScreen}>
        <CosmicBackground />
        <View style={s.center}>
          <Text style={s.errorText}>{error || t("transitNoData")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backBtn}>← {t("back")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isPhased = showPhases;

  return (
    <View style={s.fullScreen}>
      <CosmicBackground />

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Floating Utility Header */}
        <View style={s.floatingHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backBtn}>← {t("back")}</Text>
          </TouchableOpacity>
          <View style={s.gemChip}>
            <GemstoneIcon size={24} />
            <Text style={s.gemText}>{gemstoneBalance}</Text>
          </View>
        </View>

        {error && <Text style={s.errorText}>{error}</Text>}

        {/* 1. Master Hero Insight Card */}
        <OverviewHero data={localizedData} />

        {/* 2. Phases (6+12 ay) — tappable, opens PhaseDetailSheet */}
        {showPhases && (
          <>
            <SectionLead title={t("transitSectionPhases")} />
            {localizedData.phases.map((phase, i) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={i}
                onPress={() => setSelectedPhase({ phase, index: i })}
              />
            ))}
          </>
        )}

        {/* 3. Theme Constellation (1-3 ay only: "Ana Temalar") */}
        {showThemes && !isPhased && (
          <>
            <SectionLead title={t("transitSectionThemes")} />
            <ThemeConstellation themes={localizedData.themes} />
          </>
        )}

        {/* 4. Retrograde Windows */}
        {showRetro && (
          <>
            <SectionLead title={t("transitSectionRetro")} />
            {localizedData.retrogradeWindows.map((retro, i) => (
              <RetrogradeWindowCard key={`${retro.planet}_${i}`} retro={retro} />
            ))}
          </>
        )}

        {/* 5. Milestones */}
        {showMilestones && (
          <>
            <SectionLead title={t("transitSectionMilestones")} />
            <MilestoneTimeline milestones={localizedData.milestones} />
          </>
        )}

        {/* 6. Focus Areas (6+12 ay) */}
        {showFocusAreas && localizedData.focusAreas && (
          <>
            <SectionLead title={t("transitSectionFocus")} />
            <FocusAreasSection areas={localizedData.focusAreas} />
          </>
        )}

        {/* 7. Background (1+3 ay, collapsed) */}
        {showBackground && <BackgroundSection events={localizedData.background} />}

        <View style={{ height: 60 }} />
      </ScrollView>

      {showPhases && (
        <PhaseDetailSheet
          phase={selectedPhase?.phase ?? null}
          index={selectedPhase?.index ?? 0}
          drivers={localizedData.detailedDrivers || []}
          visible={selectedPhase !== null}
          onClose={() => setSelectedPhase(null)}
        />
      )}
    </View>
  );
}

function CosmicBackground() {
  return (
    <>
      <LinearGradient
        colors={["#020210", "#0a0820", "#110d30", "#0a0820", "#020210"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={["transparent", "rgba(88,40,180,0.08)", "rgba(30,60,160,0.06)", "transparent"]}
        style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
      />
      <StarField count={60} />
    </>
  );
}

const s = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#020210" },
  container: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  errorText: { color: "#fda4af", fontSize: 13, marginBottom: 10 },

  floatingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtn: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 15 },
  gemChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  gemText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
