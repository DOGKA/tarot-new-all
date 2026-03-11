const swisseph = require("swisseph");

const PLANET_IDS = {
  sun: swisseph.SE_SUN,
  moon: swisseph.SE_MOON,
  mercury: swisseph.SE_MERCURY,
  venus: swisseph.SE_VENUS,
  mars: swisseph.SE_MARS,
  jupiter: swisseph.SE_JUPITER,
  saturn: swisseph.SE_SATURN,
  uranus: swisseph.SE_URANUS,
  neptune: swisseph.SE_NEPTUNE,
  pluto: swisseph.SE_PLUTO,
};

const PLANET_LIST = Object.keys(PLANET_IDS);

const ZODIAC_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const FLAGS = swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH;

const normalize = (deg) => ((deg % 360) + 360) % 360;

function toJulianDay(date) {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    hour,
    swisseph.SE_GREG_CAL
  );
}

function getPlanetPosition(date, planet) {
  const planetId = PLANET_IDS[planet];
  if (planetId == null) throw new Error(`Unknown planet: ${planet}`);

  const jd = toJulianDay(date);
  const body = swisseph.swe_calc_ut(jd, planetId, FLAGS);
  if (!body || body.error) {
    throw new Error(body?.error || `swe_calc_ut failed for ${planet}`);
  }

  const lng = normalize(body.longitude || 0);
  return {
    lng,
    speed: body.longitudeSpeed || 0,
    retrograde: (body.longitudeSpeed || 0) < 0,
    sign: ZODIAC_KEYS[Math.floor(lng / 30) % 12],
    degree: Math.floor(lng % 30),
    minute: Math.round((lng % 1) * 60),
  };
}

function getPlanetPositions(date, planets = PLANET_LIST) {
  const result = {};
  planets.forEach((p) => {
    result[p] = getPlanetPosition(date, p);
  });
  return result;
}

module.exports = {
  PLANET_IDS,
  PLANET_LIST,
  ZODIAC_KEYS,
  normalize,
  toJulianDay,
  getPlanetPosition,
  getPlanetPositions,
};
