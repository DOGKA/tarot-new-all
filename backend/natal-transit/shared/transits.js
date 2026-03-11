const { getPlanetPositions, normalize } = require("./ephemeris");

const ASPECTS = [
  { name: "conjunction", angle: 0, orb: 3 },
  { name: "opposition", angle: 180, orb: 3 },
  { name: "trine", angle: 120, orb: 2.5 },
  { name: "square", angle: 90, orb: 2.5 },
  { name: "sextile", angle: 60, orb: 2 },
];

const SLOW_PLANETS = ["jupiter", "saturn", "uranus", "neptune", "pluto"];
const FAST_PLANETS = ["mercury", "venus", "mars"];
const ASPECT_PLANETS = [...SLOW_PLANETS, ...FAST_PLANETS];
const TRANSIT_PLANETS = [...ASPECT_PLANETS, "moon"];
const NATAL_TARGETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "asc", "mc"];
const RETRO_PLANETS = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

const ONE_DAY = 24 * 3600 * 1000;

const angularDistance = (a, b) => {
  let d = Math.abs(normalize(a) - normalize(b)) % 360;
  if (d > 180) d = 360 - d;
  return d;
};

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * ONE_DAY);
}

function getDateRange(months) {
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return { start, end };
}

function sanitizeLocations(locations = []) {
  if (!Array.isArray(locations) || locations.length === 0) return [];
  return locations
    .map((l) => ({
      city: String(l.city || "").trim() || "Unknown",
      latitude: Number(l.latitude),
      longitude: Number(l.longitude),
      utcOffset: Number(l.utcOffset),
      timezone: String(l.timezone || "").trim() || null,
      startDate: l.startDate ? String(l.startDate).slice(0, 10) : null,
      endDate: l.endDate ? String(l.endDate).slice(0, 10) : null,
    }))
    .filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude) && Number.isFinite(l.utcOffset));
}

function getActiveLocation(locations, dayDate) {
  if (!locations.length) return null;
  const day = toISODate(dayDate);
  const exact = locations.find((l) => (!l.startDate || l.startDate <= day) && (!l.endDate || l.endDate >= day));
  return exact || locations[locations.length - 1];
}

function buildSampleDateForLocation(dayDate, location) {
  // Local noon sampling for given UTC offset.
  const y = dayDate.getUTCFullYear();
  const m = dayDate.getUTCMonth();
  const d = dayDate.getUTCDate();
  const utcHour = 12 - (location?.utcOffset || 0);
  return new Date(Date.UTC(y, m, d, utcHour, 0, 0));
}

function getNatalLongitudeMap(planets = []) {
  const map = {};
  planets.forEach((p) => {
    if (!p?.name) return;
    if (p.lng != null) {
      map[p.name] = normalize(p.lng);
      return;
    }
    if (p.sign && p.degree != null) {
      const offsets = {
        aries: 0, taurus: 30, gemini: 60, cancer: 90, leo: 120, virgo: 150,
        libra: 180, scorpio: 210, sagittarius: 240, capricorn: 270, aquarius: 300, pisces: 330,
      };
      map[p.name] = normalize((offsets[p.sign] || 0) + p.degree + ((p.minute || 0) / 60));
    }
  });
  return map;
}

function classifyTransit(tPlanet, aspect) {
  if (aspect === "square" || aspect === "opposition") {
    return { color: "danger", priority: SLOW_PLANETS.includes(tPlanet) ? "high" : "medium" };
  }
  if (aspect === "trine" || aspect === "sextile") {
    return { color: "opportunity", priority: tPlanet === "jupiter" || tPlanet === "venus" ? "high" : "medium" };
  }
  if (aspect === "conjunction") {
    if (["pluto", "uranus", "neptune", "saturn"].includes(tPlanet)) return { color: "change", priority: "high" };
    return { color: "change", priority: "medium" };
  }
  return { color: "change", priority: "low" };
}

function generateAspectEvents(natalMap, dailyPositions) {
  const open = {};
  const closed = [];

  for (let i = 0; i < dailyPositions.length; i++) {
    const day = dailyPositions[i];
    const activeToday = {};

    ASPECT_PLANETS.forEach((tPlanet) => {
      const tLng = day.positions[tPlanet]?.lng;
      if (tLng == null) return;

      NATAL_TARGETS.forEach((nPlanet) => {
        const nLng = natalMap[nPlanet];
        if (nLng == null) return;

        const dist = angularDistance(tLng, nLng);
        ASPECTS.forEach((asp) => {
          const orb = Math.abs(dist - asp.angle);
          if (orb > asp.orb) return;

          const key = `${tPlanet}_${nPlanet}_${asp.name}`;
          activeToday[key] = {
            key,
            transitPlanet: tPlanet,
            natalPlanet: nPlanet,
            aspect: asp.name,
            orb: +orb.toFixed(2),
            date: day.date,
            ...classifyTransit(tPlanet, asp.name),
            type: "aspect",
          };
        });
      });
    });

    Object.keys(activeToday).forEach((k) => {
      const a = activeToday[k];
      if (!open[k]) {
        open[k] = {
          id: `tr_${k}_${toISODate(a.date)}`,
          transitPlanet: a.transitPlanet,
          natalPlanet: a.natalPlanet,
          aspect: a.aspect,
          type: a.type,
          color: a.color,
          priority: a.priority,
          startDate: toISODate(a.date),
          endDate: toISODate(a.date),
          exactDate: toISODate(a.date),
          minOrb: a.orb,
        };
      } else {
        open[k].endDate = toISODate(a.date);
        if (a.orb < open[k].minOrb) {
          open[k].minOrb = a.orb;
          open[k].exactDate = toISODate(a.date);
        }
      }
    });

    Object.keys(open).forEach((k) => {
      if (!activeToday[k]) {
        closed.push(open[k]);
        delete open[k];
      }
    });
  }

  Object.keys(open).forEach((k) => closed.push(open[k]));
  return closed;
}

function generateLunarReturnEvents(natalMap, dailyPositions) {
  const natalMoonLng = natalMap["moon"];
  if (natalMoonLng == null) return [];

  const events = [];
  let inReturn = false;
  let current = null;

  for (let i = 0; i < dailyPositions.length; i++) {
    const day = dailyPositions[i];
    const moonLng = day.positions["moon"]?.lng;
    if (moonLng == null) continue;

    const dist = angularDistance(moonLng, natalMoonLng);
    if (dist <= 3) {
      if (!inReturn) {
        inReturn = true;
        current = {
          id: `tr_lunar_return_${toISODate(day.date)}`,
          transitPlanet: "moon",
          natalPlanet: "moon",
          aspect: "conjunction",
          type: "lunar_return",
          color: "lunar",
          priority: "medium",
          startDate: toISODate(day.date),
          endDate: toISODate(day.date),
          exactDate: toISODate(day.date),
          minOrb: dist,
        };
      } else {
        current.endDate = toISODate(day.date);
        if (dist < current.minOrb) {
          current.minOrb = dist;
          current.exactDate = toISODate(day.date);
        }
      }
    } else if (inReturn) {
      events.push(current);
      inReturn = false;
      current = null;
    }
  }
  if (inReturn && current) events.push(current);
  return events;
}

function generateRetrogradeEvents(dailyPositions) {
  const events = [];
  RETRO_PLANETS.forEach((planet) => {
    let inRetro = false;
    let start = null;
    for (let i = 1; i < dailyPositions.length; i++) {
      const prev = dailyPositions[i - 1].positions[planet]?.speed ?? 0;
      const curr = dailyPositions[i].positions[planet]?.speed ?? 0;
      if (!inRetro && prev >= 0 && curr < 0) {
        inRetro = true;
        start = toISODate(dailyPositions[i].date);
      }
      if (inRetro && prev < 0 && curr >= 0) {
        const end = toISODate(dailyPositions[i].date);
        events.push({
          id: `tr_retro_${planet}_${start}`,
          type: "retrograde",
          transitPlanet: planet,
          natalPlanet: null,
          aspect: null,
          startDate: start,
          endDate: end,
          exactDate: start,
          minOrb: 0,
          color: "retro",
          priority: SLOW_PLANETS.includes(planet) ? "high" : "medium",
        });
        inRetro = false;
      }
    }
    if (inRetro && start) {
      events.push({
        id: `tr_retro_${planet}_${start}`,
        type: "retrograde",
        transitPlanet: planet,
        natalPlanet: null,
        aspect: null,
        startDate: start,
        endDate: toISODate(dailyPositions[dailyPositions.length - 1].date),
        exactDate: start,
        minOrb: 0,
        color: "retro",
        priority: SLOW_PLANETS.includes(planet) ? "high" : "medium",
      });
    }
  });
  return events;
}

function buildTransitTimeline({ natalPlanets, months, locations = [] }) {
  const natalMap = getNatalLongitudeMap(natalPlanets);
  const { start, end } = getDateRange(months);
  const safeLocations = sanitizeLocations(locations);
  const dailyPositions = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const activeLocation = getActiveLocation(safeLocations, d);
    const sampleDate = buildSampleDateForLocation(d, activeLocation);
    dailyPositions.push({
      date: new Date(d),
      sampleDate,
      location: activeLocation,
      positions: getPlanetPositions(sampleDate, TRANSIT_PLANETS),
    });
  }

  const transitAspects = generateAspectEvents(natalMap, dailyPositions);
  const retrogrades = generateRetrogradeEvents(dailyPositions);
  const lunarReturns = generateLunarReturnEvents(natalMap, dailyPositions);

  const events = [...transitAspects, ...retrogrades, ...lunarReturns]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return {
    period: { start: toISODate(start), end: toISODate(end) },
    locationsUsed: safeLocations,
    events,
    transitAspects,
    retrogrades,
    lunarReturns,
  };
}

module.exports = {
  buildTransitTimeline,
  getNatalLongitudeMap,
  classifyTransit,
};
