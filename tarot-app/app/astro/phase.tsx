import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { GradientBackground, Moon3D, StarField, WeekRuler } from "../../components/ui";
import {
  getMoonIllumination,
  getMoonDistance,
  getMoonTimes,
  getNextPhaseDate,
  getMonthPhases,
  getPhaseEmoji,
  formatMoonTime,
} from "../../utils/moon";

const SCREEN_W = Dimensions.get("window").width;
const DAY_LABELS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DAY_LABELS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MONTH_NAMES_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAMES_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const MONTH_NAMES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getDayLabels(lang: string) {
  if (lang === "tr") return DAY_LABELS_TR;
  if (lang === "de") return DAY_LABELS_DE;
  if (lang === "es") return DAY_LABELS_ES;
  return DAY_LABELS_EN;
}

function getMonthName(month: number, lang: string) {
  if (lang === "tr") return MONTH_NAMES_TR[month];
  if (lang === "de") return MONTH_NAMES_DE[month];
  if (lang === "es") return MONTH_NAMES_ES[month];
  return MONTH_NAMES_EN[month];
}

function formatDateShort(date: Date, lang: string) {
  const d = date.getDate();
  const m = getMonthName(date.getMonth(), lang);
  const dayNames: Record<string, string[]> = {
    tr: ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"],
    en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    de: ["So","Mo","Di","Mi","Do","Fr","Sa"],
    es: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  };
  const dn = (dayNames[lang] || dayNames.en)[date.getDay()];
  return `${d} ${m} ${dn}`;
}

export default function PhaseDetailScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "tr";
  const params = useLocalSearchParams<{
    phaseKey: string;
    phaseName: string;
    general: string;
    ayna: string;
  }>();

  const now = useMemo(() => new Date(), []);
  const illumination = getMoonIllumination(now);
  const illumPercent = Math.round(illumination * 100);

  const distance = useMemo(() => getMoonDistance(now), []);
  const distKm = Math.round(distance).toLocaleString();

  const moonTimes = useMemo(() => {
    try { return getMoonTimes(now, 41.0, 29.0); }
    catch { return { rise: null, set: null }; }
  }, []);

  const nextFullMoon = useMemo(() => getNextPhaseDate("full_moon", now), []);
  const nextNewMoon = useMemo(() => getNextPhaseDate("new_moon", now), []);
  const daysToFull = Math.ceil((nextFullMoon.getTime() - now.getTime()) / 86400000);
  const daysToNew = Math.ceil((nextNewMoon.getTime() - now.getTime()) / 86400000);

  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const monthPhases = useMemo(() => getMonthPhases(calYear, calMonth), [calYear, calMonth]);

  const firstDayOfWeek = useMemo(() => {
    const d = new Date(calYear, calMonth, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [calYear, calMonth]);

  const dayLabels = getDayLabels(lang);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  return (
    <GradientBackground>
      <StarField count={50} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Hero Moon */}
        <View style={styles.hero}>
          <Moon3D illumination={illumination} size={200} phaseKey={params.phaseKey} />
          <Text style={styles.phaseName}>{params.phaseName}</Text>
          <Text style={styles.phaseDate}>{formatDateShort(now, lang)}</Text>
        </View>

        {/* Week Ruler */}
        <WeekRuler lang={lang} accentColor="#c084fc" />

        {/* Info Rows */}
        <View style={styles.infoCard}>
          <InfoRow label={t("moonIllumination")} value={`%${illumPercent}`} />
          <InfoRow label={t("moonMoonset")} value={formatMoonTime(moonTimes.set || null)} />
          <InfoRow label={t("moonMoonrise")} value={formatMoonTime(moonTimes.rise || null)} />
          <InfoRow label={t("moonNextFullMoon")} value={t("moonDaysAway", { count: daysToFull })} last={false} />
          <InfoRow label={t("moonDistance")} value={`${distKm} km`} last />
        </View>

        {/* Key Events */}
        <View style={styles.eventRow}>
          <View style={styles.eventItem}>
            <Text style={styles.eventLabel}>{t("moonNextFullMoon")}</Text>
            <Text style={styles.eventValue}>{formatDateShort(nextFullMoon, lang)}</Text>
          </View>
          <View style={styles.eventItem}>
            <Text style={styles.eventLabel}>{t("moonNextNewMoon")}</Text>
            <Text style={styles.eventValue}>{formatDateShort(nextNewMoon, lang)}</Text>
          </View>
        </View>

        {/* ChatGPT Content: General */}
        {params.general ? (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{params.general}</Text>
          </View>
        ) : null}

        {/* ChatGPT Content: Ayna */}
        {params.ayna ? (
          <View style={styles.aynaCard}>
            <Text style={styles.aynaTitle}>{t("moonPhaseNotice")}</Text>
            <Text style={styles.aynaText}>{params.ayna}</Text>
          </View>
        ) : null}

        {/* About Illumination */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>{t("moonAboutIllumination")}</Text>
          <Text style={styles.aboutText}>{t("moonAboutIlluminationDesc")}</Text>
        </View>

        {/* About Distance */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>{t("moonAboutDistance")}</Text>
          <Text style={styles.aboutText}>{t("moonAboutDistanceDesc")}</Text>
        </View>

        {/* Calendar */}
        <Text style={styles.calendarTitle}>{t("moonCalendar")}</Text>
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth}>
              <Text style={styles.calNav}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthText}>{getMonthName(calMonth, lang)} {calYear}</Text>
            <TouchableOpacity onPress={nextMonth}>
              <Text style={styles.calNav}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calDayLabels}>
            {dayLabels.map(d => (
              <Text key={d} style={styles.calDayLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`e${i}`} style={styles.calCell} />
            ))}
            {monthPhases.map(({ day, phase }) => {
              const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              return (
                <View key={day} style={[styles.calCell, isToday && styles.calCellToday]}>
                  <Text style={[styles.calDayNum, isToday && styles.calDayNumToday]}>{day}</Text>
                  <Text style={styles.calEmoji}>{getPhaseEmoji(phase)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  hero: { alignItems: "center", paddingTop: 50, paddingBottom: 20 },
  phaseName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  phaseDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  infoLabel: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  infoValue: { color: "#fff", fontSize: 15, fontWeight: "600" },
  eventRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  eventItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  eventLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 4 },
  eventValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  section: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  sectionText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 23,
  },
  aynaCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.25)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  aynaTitle: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  aynaText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 23,
  },
  aboutCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  aboutTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  aboutText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 22,
  },
  calendarTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  calendarCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
  },
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calNav: { color: "rgba(255,255,255,0.5)", fontSize: 24, paddingHorizontal: 10 },
  calMonthText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  calDayLabels: {
    flexDirection: "row",
    marginBottom: 6,
  },
  calDayLabel: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calCell: {
    width: (SCREEN_W - 72) / 7,
    alignItems: "center",
    paddingVertical: 4,
  },
  calCellToday: {
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    borderRadius: 10,
  },
  calDayNum: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  calDayNumToday: {
    color: "#fff",
    fontWeight: "700",
  },
  calEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
});
