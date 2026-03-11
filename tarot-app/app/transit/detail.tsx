import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { GemstoneIcon } from "../../components/ui";
import { useApp } from "../../context/AppContext";

import type { V4Payload } from "../../components/transit/types";
import OverviewHero from "../../components/transit/OverviewHero";
import PhaseCard from "../../components/transit/PhaseCard";
import ThemeConstellation from "../../components/transit/ThemeConstellation";
import RecurringThemeRow from "../../components/transit/RecurringThemeRow";
import RetrogradeWindowCard from "../../components/transit/RetrogradeWindowCard";
import MilestoneRow from "../../components/transit/MilestoneRow";
import FocusAreaBlock from "../../components/transit/FocusAreaBlock";
import DetailedDriverSection from "../../components/transit/DetailedDriverSection";
import BackgroundSection from "../../components/transit/BackgroundSection";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  const { deviceId, gemstoneBalance } = useApp();
  const params = useLocalSearchParams<{ months?: string; t?: string }>();
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
        const q = months ? `?months=${months}` : "";
        const res = await fetch(`${API_BASE}/natal/transits/${deviceId}/latest${q}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError("Transit okuma verisi bulunamadi.");
          return;
        }
        setData(json.data as V4Payload);
      } catch (e: any) {
        setError(e.message || "Transit okuma yuklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [deviceId, months, params.t]);

  const showPhases = (data?.phases?.length ?? 0) > 0;
  const showThemes = (data?.themes?.length ?? 0) > 0;
  const showRetro = (data?.retrogradeWindows?.length ?? 0) > 0;
  const showMilestones = (data?.milestones?.length ?? 0) > 0;
  const showRecurring = (data?.recurringThemes?.length ?? 0) > 0;
  const showFocusAreas = data?.focusAreas ? Object.values(data.focusAreas).some((v) => v !== "") : false;
  const showDrivers = (data?.detailedDrivers?.length ?? 0) > 0;
  const showBackground = (data?.background?.length ?? 0) > 0;

  if (loading) {
    return (
      <View style={s.fullScreen}>
        <CosmicBackground />
        <View style={s.center}>
          <ActivityIndicator color="#a78bfa" size="large" />
          <Text style={s.loadingText}>Transit okumasi yukleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={s.fullScreen}>
        <CosmicBackground />
        <View style={s.center}>
          <Text style={s.errorText}>{error || "Veri bulunamadi."}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backBtn}>← Geri</Text>
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
            <Text style={s.backBtn}>← Geri</Text>
          </TouchableOpacity>
          <View style={s.gemChip}>
            <GemstoneIcon size={16} />
            <Text style={s.gemText}>{gemstoneBalance}</Text>
          </View>
        </View>

        {error && <Text style={s.errorText}>{error}</Text>}

        {/* 1. Master Hero Insight Card */}
        <OverviewHero data={data} />

        {/* 2. Phases (6+12 ay) */}
        {showPhases && (
          <>
            <SectionLead title="Dönemin Fazlari" />
            {data.phases.map((phase, i) => (
              <PhaseCard key={phase.id} phase={phase} index={i} />
            ))}
          </>
        )}

        {/* 3. Theme Constellation */}
        {showThemes && (
          <>
            <SectionLead title={isPhased ? "Öne Çikan Temalar" : "Ana Temalar"} />
            <ThemeConstellation themes={data.themes} />
          </>
        )}

        {/* 4. Recurring Themes (6+12 ay) */}
        {showRecurring && (
          <>
            <SectionLead title="Tekrar Eden Temalar" />
            {data.recurringThemes.map((rt) => (
              <RecurringThemeRow key={rt.theme} rt={rt} />
            ))}
          </>
        )}

        {/* 5. Retrograde Windows — DOKUNMA */}
        {showRetro && (
          <>
            <SectionLead title="Retrograde Pencereleri" />
            {data.retrogradeWindows.map((retro, i) => (
              <RetrogradeWindowCard key={`${retro.planet}_${i}`} retro={retro} />
            ))}
          </>
        )}

        {/* 6. Milestones (3+6+12 ay) */}
        {showMilestones && (
          <>
            <SectionLead title="Dönüm Noktalari" />
            {data.milestones.map((m, i) => (
              <MilestoneRow key={i} milestone={m} />
            ))}
          </>
        )}

        {/* 7. Focus Areas (12 ay only) */}
        {showFocusAreas && data.focusAreas && (
          <>
            <SectionLead title="Odak Alanlari" />
            <FocusAreaBlock areaKey="career" text={data.focusAreas.career || ""} />
            <FocusAreaBlock areaKey="relationships" text={data.focusAreas.relationships || ""} />
            <FocusAreaBlock areaKey="innerLife" text={data.focusAreas.innerLife || ""} />
            <FocusAreaBlock areaKey="growth" text={data.focusAreas.growth || ""} />
            <FocusAreaBlock areaKey="health" text={data.focusAreas.health || ""} />
          </>
        )}

        {/* 8. Detailed Drivers (6+12 ay, collapsed) */}
        {showDrivers && <DetailedDriverSection drivers={data.detailedDrivers} />}

        {/* 9. Background (1+3 ay, collapsed) */}
        {showBackground && <BackgroundSection events={data.background} />}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function CosmicBackground() {
  return (
    <View style={s.bgContainer}>
      <ImageBackground
        source={require("../../assets/backgrounds/dark-space.jpg")}
        style={s.bgImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(5,8,26,0.3)", "rgba(18,15,36,0.5)", "rgba(5,8,26,0.75)"]}
        style={s.bgOverlay}
      />
    </View>
  );
}

const s = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#05081A" },
  bgContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgImage: { width: SCREEN_W, height: SCREEN_H, position: "absolute", top: 0, left: 0 },
  bgOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
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
