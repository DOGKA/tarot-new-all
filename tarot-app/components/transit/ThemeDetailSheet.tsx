import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { THEME_ICONS, COLOR_MAP, INTENSITY_CONFIG } from "./constants";
import type { TransitTheme, TransitEvent } from "./types";

const { width: SCREEN_W } = Dimensions.get("window");

const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const MONTHS_TR_FULL = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CELL = 18;
const CELL_GAP = 3;
const STEP = CELL + CELL_GAP;
const DAY_LABEL_W = 36;
const MONTH_LABEL_H = 18;

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatRange(startDate: string, endDate: string): string {
  const s = parseDate(startDate);
  const e = parseDate(endDate);
  if (!s || !e) return `${startDate} – ${endDate}`;
  const sD = s.getDate();
  const eD = e.getDate();
  const sM = MONTHS_TR_FULL[s.getMonth()];
  const eM = MONTHS_TR_FULL[e.getMonth()];
  const sY = s.getFullYear();
  const eY = e.getFullYear();
  if (sY !== eY) return `${sD} ${sM} ${sY} – ${eD} ${eM} ${eY}`;
  if (sD === eD && s.getMonth() === e.getMonth()) return `${sD} ${sM} ${sY}`;
  if (s.getMonth() === e.getMonth()) return `${sD}–${eD} ${sM} ${sY}`;
  return `${sD} ${sM} – ${eD} ${eM} ${sY}`;
}

function formatPeak(exactDate: string): string {
  const d = parseDate(exactDate);
  if (!d) return exactDate;
  return `${d.getDate()} ${MONTHS_TR_FULL[d.getMonth()].toUpperCase()}`;
}

/* ------------------------------------------------------------------ */
/*  Contribution Grid Calendar                                         */
/* ------------------------------------------------------------------ */

const COLOR_LABELS: Record<string, string> = {
  danger: "Zorluk",
  opportunity: "Fırsat",
  change: "Değişim",
  retro: "Retro",
  lunar: "Ay",
};

type CellData = {
  week: number;
  day: number;
  dayNum: number;
  count: number;
  isPeak: boolean;
  dateStr: string;
};

function countOpacity(count: number): number {
  if (count >= 4) return 0.85;
  if (count === 3) return 0.7;
  if (count === 2) return 0.55;
  return 0.35;
}

type ColorGroup = {
  colorKey: string;
  colorHex: string;
  label: string;
  events: TransitEvent[];
};

function SingleColorGrid({
  group,
  flashDates,
  onFlashDone,
  onPressEvent,
}: {
  group: ColorGroup;
  flashDates?: { start: string; end: string } | null;
  onFlashDone?: () => void;
  onPressEvent?: (ev: TransitEvent) => void;
}) {
  const [flashOn, setFlashOn] = useState(false);

  const flashDateSet = useMemo(() => {
    if (!flashDates) return null;
    const set = new Set<string>();
    const s = parseDate(flashDates.start);
    const e = parseDate(flashDates.end);
    if (!s || !e) return null;
    const cur = new Date(s);
    while (cur <= e) {
      set.add(dateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return set;
  }, [flashDates]);

  React.useEffect(() => {
    if (!flashDateSet) { setFlashOn(false); return; }
    setFlashOn(true);
    const t1 = setTimeout(() => setFlashOn(false), 300);
    const t2 = setTimeout(() => setFlashOn(true), 600);
    const t3 = setTimeout(() => { setFlashOn(false); onFlashDone?.(); }, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [flashDateSet]);

  const { cells, monthLabels, numWeeks, valid } = useMemo(() => {
    let minD: Date | null = null;
    let maxD: Date | null = null;

    for (const ev of group.events) {
      for (const raw of [ev.startDate, ev.endDate]) {
        const d = parseDate(raw);
        if (!d) continue;
        if (!minD || d < minD) minD = d;
        if (!maxD || d > maxD) maxD = d;
      }
    }

    if (!minD || !maxD)
      return { cells: [], monthLabels: [], numWeeks: 0, valid: false };

    const gridStart = addDays(minD, -mondayIndex(minD));
    const gridEnd = addDays(maxD, 6 - mondayIndex(maxD));
    const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
    const weeks = Math.ceil(totalDays / 7);

    const dayMap = new Map<string, { count: number; isPeak: boolean }>();
    for (const ev of group.events) {
      const s = parseDate(ev.startDate);
      const e = parseDate(ev.endDate);
      const peak = parseDate(ev.exactDate);
      if (!s || !e) continue;
      const cur = new Date(s);
      while (cur <= e) {
        const k = dateKey(cur);
        const prev = dayMap.get(k) || { count: 0, isPeak: false };
        prev.count += 1;
        if (peak && dateKey(cur) === dateKey(peak)) prev.isPeak = true;
        dayMap.set(k, prev);
        cur.setDate(cur.getDate() + 1);
      }
    }

    const cellList: CellData[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = addDays(gridStart, w * 7 + d);
        const k = dateKey(date);
        const hit = dayMap.get(k);
        cellList.push({
          week: w,
          day: d,
          dayNum: date.getDate(),
          count: hit ? hit.count : 0,
          isPeak: hit ? hit.isPeak : false,
          dateStr: k,
        });
      }
    }

    const labels: { week: number; label: string }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < weeks; w++) {
      const firstDay = addDays(gridStart, w * 7);
      if (firstDay.getMonth() !== prevMonth) {
        labels.push({ week: w, label: MONTHS_TR[firstDay.getMonth()] });
        prevMonth = firstDay.getMonth();
      }
    }

    return { cells: cellList, monthLabels: labels, numWeeks: weeks, valid: true };
  }, [group.events]);

  if (!valid) return null;

  const gridW = DAY_LABEL_W + numWeeks * STEP;
  const gridH = MONTH_LABEL_H + 7 * STEP;

  return (
    <View style={cal.gridBlock}>
      <View style={cal.gridHeader}>
        <View style={[cal.gridDot, { backgroundColor: group.colorHex }]} />
        <Text style={[cal.gridLabel, { color: group.colorHex }]}>{group.label}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={gridW} height={gridH}>
          {DAY_LABELS.map((label, row) => (
            <SvgText
              key={`dl${row}`}
              x={2}
              y={MONTH_LABEL_H + row * STEP + CELL * 0.72}
              fontSize={7.5}
              fill="rgba(255,255,255,0.3)"
              fontWeight="600"
            >
              {label}
            </SvgText>
          ))}

          {monthLabels.map((ml, i) => (
            <SvgText
              key={`ml${i}`}
              x={DAY_LABEL_W + ml.week * STEP}
              y={12}
              fontSize={9}
              fill="rgba(255,255,255,0.4)"
              fontWeight="700"
            >
              {ml.label}
            </SvgText>
          ))}

          {cells.map((c, i) => {
            const x = DAY_LABEL_W + c.week * STEP;
            const y = MONTH_LABEL_H + c.day * STEP;
            const half = CELL / 2;
            const hasEvent = c.count > 0;

            return (
              <React.Fragment key={i}>
                {c.isPeak && (
                  <Rect
                    x={x - 2}
                    y={y - 2}
                    width={CELL + 4}
                    height={CELL + 4}
                    rx={5}
                    fill="#fff"
                    opacity={0.4}
                  />
                )}
                <Rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={hasEvent ? group.colorHex : "#fff"}
                  opacity={hasEvent ? countOpacity(c.count) : 0.04}
                  stroke={c.isPeak ? "#fff" : "none"}
                  strokeWidth={c.isPeak ? 1.5 : 0}
                  strokeOpacity={0.75}
                />
                <SvgText
                  x={x + half}
                  y={y + half + 2.5}
                  textAnchor="middle"
                  fontSize={6.5}
                  fill={hasEvent ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.1)"}
                  fontWeight={hasEvent ? "700" : "400"}
                >
                  {c.dayNum}
                </SvgText>
                {flashOn && flashDateSet?.has(c.dateStr) && (
                  <Rect
                    x={x - 1}
                    y={y - 1}
                    width={CELL + 2}
                    height={CELL + 2}
                    rx={4}
                    fill="#fbbf24"
                    opacity={0.5}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      <View style={{ height: 10 }} />
      {group.events.map((ev, idx) => (
        <TouchableOpacity
          key={ev.id}
          activeOpacity={0.6}
          onPress={() => onPressEvent?.(ev)}
          style={[cal.eventRow, idx === 0 && { borderTopWidth: 0 }]}
        >
          <View style={cal.eventLeft}>
            <Text style={cal.eventName}>{ev.title}</Text>
            <Text style={cal.eventRange}>{formatRange(ev.startDate, ev.endDate)}</Text>
          </View>
          <View style={cal.peakBadge}>
            <Text style={cal.peakBadgeText}>{formatPeak(ev.exactDate)}</Text>
            <Text style={cal.peakLabel}>DORUK</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ContributionGrid({
  events,
  accentColor,
  highlightEvent,
  onFlashDone,
  onPressEvent,
}: {
  events: TransitEvent[];
  accentColor: string;
  highlightEvent?: TransitEvent | null;
  onFlashDone?: () => void;
  onPressEvent?: (ev: TransitEvent) => void;
}) {
  const groups = useMemo<ColorGroup[]>(() => {
    const map = new Map<string, TransitEvent[]>();
    for (const ev of events) {
      const key = ev.color;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return [...map.entries()]
      .map(([colorKey, evs]) => ({
        colorKey,
        colorHex: COLOR_MAP[colorKey] || accentColor,
        label: COLOR_LABELS[colorKey] || colorKey,
        events: evs,
      }))
      .sort((a, b) => b.events.length - a.events.length);
  }, [events, accentColor]);

  if (groups.length === 0) return null;

  return (
    <View style={cal.container}>
      <Text style={cal.title}>UZAY TAKVİMİ</Text>
      {groups.map((g) => (
        <SingleColorGrid
          key={g.colorKey}
          group={g}
          flashDates={
            highlightEvent && highlightEvent.color === g.colorKey
              ? { start: highlightEvent.startDate, end: highlightEvent.endDate }
              : null
          }
          onFlashDone={onFlashDone}
          onPressEvent={onPressEvent}
        />
      ))}
      <View style={cal.legendRow}>
        <View style={cal.legendItem}>
          <View style={cal.legendPeakDot} />
          <Text style={cal.legendText}>Doruk</Text>
        </View>
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { marginTop: 4 },
  title: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  gridBlock: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  gridHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    paddingLeft: 2,
  },
  gridDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendPeakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    opacity: 0.85,
  },
  legendText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "600",
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.03)",
  },
  eventLeft: { flex: 1 },
  eventName: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "600" },
  eventRange: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 },
  peakBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 48,
  },
  peakBadgeText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  peakLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 1,
  },
});

/* ------------------------------------------------------------------ */
/*  Detail Sheet                                                       */
/* ------------------------------------------------------------------ */

export default function ThemeDetailSheet({
  theme,
  visible,
  onClose,
}: {
  theme: TransitTheme | null;
  visible: boolean;
  onClose: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const calendarY = useRef(0);
  const [highlightEvent, setHighlightEvent] = useState<TransitEvent | null>(null);

  if (!theme) return null;

  const ic = INTENSITY_CONFIG[theme.intensity] || INTENSITY_CONFIG.medium;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={s.sheet}>
          <LinearGradient
            colors={["rgba(18,15,36,0.98)", "rgba(5,8,26,0.99)"]}
            style={s.sheetGradient}
          >
            {/* Drag handle */}
            <View style={s.handle} />

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scroll}
            >
              {/* Header row */}
              <View style={s.headerRow}>
                <View style={[s.pill, { backgroundColor: `${ic.color}18` }]}>
                  <Text style={[s.pillText, { color: ic.color }]}>{ic.label}</Text>
                </View>
                <Text style={s.window}>{theme.window}</Text>
              </View>

              {/* Title */}
              <Text style={s.title}>{theme.title}</Text>

              {/* Category badge */}
              <View style={s.catRow}>
                <View style={[s.catDot, { backgroundColor: ic.color }]} />
                <Text style={[s.catLabel, { color: ic.color }]}>
                  {THEME_ICONS[theme.theme] || theme.label}
                </Text>
              </View>

              {/* Summary */}
              {(theme.summary ?? "") !== "" && (
                <Text style={s.summary}>{theme.summary}</Text>
              )}

              {/* Interpretation */}
              {(theme.interpretation ?? "") !== "" && (
                <>
                  <View style={s.divider} />
                  <Text style={s.interpretation}>{theme.interpretation}</Text>
                </>
              )}

              {/* Calendar grids with transit lists per color */}
              {(theme.events?.length ?? 0) > 0 && (
                <View onLayout={(e) => { calendarY.current = e.nativeEvent.layout.y; }}>
                  <View style={s.divider} />
                  <ContributionGrid
                    events={theme.events!}
                    accentColor={ic.color}
                    highlightEvent={highlightEvent}
                    onFlashDone={() => setHighlightEvent(null)}
                    onPressEvent={(ev) => setHighlightEvent(ev)}
                  />
                </View>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Close button */}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeTxt}>Kapat</Text>
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
    maxHeight: "85%",
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  window: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: "600" },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  summary: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 16,
  },

  interpretation: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 23,
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
