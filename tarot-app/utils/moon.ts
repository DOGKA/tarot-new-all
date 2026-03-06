/**
 * Moon Astro — Frontend Utilities
 * Lightweight: slot matching + suncalc wrappers for location-based data.
 */

import SunCalc from "suncalc";

// ============================================
// Types
// ============================================

export interface MoonSlot {
  id: string;
  start: string;
  end: string;
  phase: { key: string; name: string; emoji: string };
  zodiac: { key: string; name: string; symbol: string; element: string };
  planet: { key: string; name: string; symbol: string; day: string };
  content: {
    planet: { meaning: string; advice: string };
    zodiac: { meaning: string; firsat: string; his: string };
    phase: {
      general: string;
      ayna: string;
    };
  } | null;
}

export interface MoonApiResponse {
  currentSlot: MoonSlot;
  nextTransition: {
    time: string;
    type: "zodiac" | "phase" | "planet";
    to: string;
  } | null;
  allSlots: MoonSlot[];
  currentIndex: number;
}

export interface MoonLocationData {
  rise: Date | null;
  set: Date | null;
  altitude: number;
  azimuth: number;
  illumination: number;
}

// ============================================
// Slot Matching
// ============================================

export function findCurrentSlot(
  slots: MoonSlot[],
  utcNow: Date
): MoonSlot | null {
  const nowMs = utcNow.getTime();
  return (
    slots.find(
      (s) =>
        new Date(s.start).getTime() <= nowMs &&
        new Date(s.end).getTime() > nowMs
    ) || null
  );
}

// ============================================
// Location-Based Data (suncalc)
// ============================================

export function getMoonLocationData(
  date: Date,
  lat: number,
  lng: number
): MoonLocationData {
  const times = SunCalc.getMoonTimes(date, lat, lng);
  const position = SunCalc.getMoonPosition(date, lat, lng);
  const illumination = SunCalc.getMoonIllumination(date);

  return {
    rise: times.rise || null,
    set: times.set || null,
    altitude: (position.altitude * 180) / Math.PI,
    azimuth: (position.azimuth * 180) / Math.PI,
    illumination: illumination.fraction,
  };
}

export function getMoonIllumination(date: Date): number {
  return SunCalc.getMoonIllumination(date).fraction;
}

// ============================================
// Time Formatting Helpers
// ============================================

export function formatMoonTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getTimeUntilTransition(transitionTime: string): number {
  return new Date(transitionTime).getTime() - Date.now();
}

// ============================================
// Lunar Calculations (no API needed)
// ============================================

const SYNODIC = 29.53058770576;

function getLunarAge(date: Date): number {
  const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();
  const diff = date.getTime() - KNOWN_NEW_MOON;
  const days = diff / 86400000;
  let age = days % SYNODIC;
  if (age < 0) age += SYNODIC;
  return age;
}

export function getPhaseForDate(date: Date): string {
  const age = getLunarAge(date);
  if (age < 1.84566) return "new_moon";
  if (age < 5.53699) return "waxing_crescent";
  if (age < 9.22831) return "first_quarter";
  if (age < 12.91963) return "waxing_gibbous";
  if (age < 16.61096) return "full_moon";
  if (age < 18.45662) return "disseminating_moon";
  if (age < 20.30228) return "waning_gibbous";
  if (age < 23.99360) return "last_quarter";
  if (age < 27.68493) return "waning_crescent";
  return "balsamic_moon";
}

export function getNextPhaseDate(targetPhase: string, from: Date): Date {
  const cursor = new Date(from);
  for (let i = 0; i < 45; i++) {
    cursor.setDate(cursor.getDate() + 1);
    if (getPhaseForDate(cursor) === targetPhase) return cursor;
  }
  return cursor;
}

export function getMoonDistance(date: Date): number {
  const illum = SunCalc.getMoonIllumination(date);
  const pos = SunCalc.getMoonPosition(date, 0, 0);
  return pos.distance;
}

export function getMoonTimes(date: Date, lat: number, lng: number) {
  return SunCalc.getMoonTimes(date, lat, lng);
}

export function getMonthPhases(year: number, month: number): { day: number; phase: string }[] {
  const result: { day: number; phase: string }[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d, 12, 0, 0);
    result.push({ day: d, phase: getPhaseForDate(date) });
  }
  return result;
}

const PHASE_EMOJIS: Record<string, string> = {
  new_moon: "🌑",
  waxing_crescent: "🌒",
  first_quarter: "🌓",
  waxing_gibbous: "🌔",
  full_moon: "🌕",
  disseminating_moon: "🌖",
  waning_gibbous: "🌖",
  last_quarter: "🌗",
  waning_crescent: "🌘",
  balsamic_moon: "🌘",
};

export function getPhaseEmoji(phase: string): string {
  return PHASE_EMOJIS[phase] || "🌑";
}
