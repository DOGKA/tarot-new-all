/**
 * Transit Importance Scoring — pure event-level math
 */

const PLANET_WEIGHT = {
  pluto: 10, saturn: 9, uranus: 8, neptune: 8,
  jupiter: 7, mars: 5, venus: 4, mercury: 3, moon: 1,
};

const NATAL_TARGET_WEIGHT = {
  asc: 10, mc: 10, sun: 9, moon: 9,
  mercury: 7, venus: 7, mars: 7,
  jupiter: 4, saturn: 4, uranus: 4, neptune: 4, pluto: 4,
};

const ASPECT_WEIGHT = {
  conjunction: 10, opposition: 9, square: 8, trine: 6, sextile: 4,
};

const THRESHOLDS = {
  1:  { ai: 65, template: 40 },
  3:  { ai: 75, template: 50 },
  6:  { ai: 80, template: 60 },
  12: { ai: 85, template: 70 },
};

const SLOW_PLANETS = ["jupiter", "saturn", "uranus", "neptune", "pluto"];
const FAST_PLANETS = ["mercury", "venus", "moon"];

function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function scoreEvent(event) {
  if (event.type === "retrograde") {
    const pw = PLANET_WEIGHT[event.transitPlanet] || 3;
    const base = pw * 6;
    const stationBonus = 8;
    const dur = daysBetween(event.startDate, event.endDate);
    const durationBonus = dur >= 14 ? 5 : dur >= 7 ? 3 : 0;
    return Math.min(100, base + stationBonus + durationBonus);
  }

  if (event.type === "lunar_return") {
    return 25;
  }

  const pw = PLANET_WEIGHT[event.transitPlanet] || 3;
  const nw = NATAL_TARGET_WEIGHT[event.natalPlanet] || 4;
  const aw = ASPECT_WEIGHT[event.aspect] || 4;

  let score = Math.round((pw + nw + aw) * 2.5);

  const orb = event.minOrb ?? 3;
  if (orb <= 0.5) score += 10;
  else if (orb <= 1) score += 6;
  else if (orb <= 2) score += 3;

  const dur = daysBetween(event.startDate, event.endDate);
  if (dur >= 14) score += 6;
  else if (dur >= 7) score += 3;

  if (FAST_PLANETS.includes(event.transitPlanet)) score -= 5;

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  scoreEvent,
  daysBetween,
  PLANET_WEIGHT,
  NATAL_TARGET_WEIGHT,
  ASPECT_WEIGHT,
  THRESHOLDS,
  SLOW_PLANETS,
  FAST_PLANETS,
};
