/**
 * Theme Clustering, Theme Scoring, Merging, Tier Splitting
 */

const { daysBetween, THRESHOLDS, SLOW_PLANETS, FAST_PLANETS, NATAL_TARGET_WEIGHT } = require("./scoring");

const THEME_RULES = [
  {
    theme: "identity_transformation",
    label: "Kimlik ve Donusum",
    match: (e) =>
      ["pluto", "uranus", "neptune"].includes(e.transitPlanet) &&
      ["sun", "moon", "asc"].includes(e.natalPlanet) &&
      ["conjunction", "square", "opposition"].includes(e.aspect),
  },
  {
    theme: "life_purpose",
    label: "Yasam Misyonu",
    match: (e) =>
      (["pluto", "jupiter"].includes(e.transitPlanet) && ["sun", "mc"].includes(e.natalPlanet) && ["conjunction", "trine"].includes(e.aspect)) ||
      (e.transitPlanet === "saturn" && e.natalPlanet === "sun" && e.aspect === "conjunction"),
  },
  {
    theme: "career_direction",
    label: "Kariyer ve Yon",
    match: (e) =>
      (e.natalPlanet === "mc") ||
      (["saturn", "jupiter", "pluto"].includes(e.transitPlanet) && e.natalPlanet === "sun" && ["square", "opposition"].includes(e.aspect)),
  },
  {
    theme: "money_resources",
    label: "Para ve Kaynaklar",
    match: (e) =>
      (e.transitPlanet === "jupiter" && e.natalPlanet === "venus" && ["conjunction", "square", "opposition"].includes(e.aspect)) ||
      (e.transitPlanet === "saturn" && e.natalPlanet === "venus") ||
      (e.transitPlanet === "pluto" && e.natalPlanet === "venus"),
  },
  {
    theme: "structural_pressure",
    label: "Yapisal Baski",
    match: (e) =>
      e.transitPlanet === "saturn" && ["conjunction", "square", "opposition"].includes(e.aspect),
  },
  {
    theme: "growth_opportunity",
    label: "Buyume Firsati",
    match: (e) =>
      (e.transitPlanet === "jupiter" && ["conjunction", "trine", "sextile"].includes(e.aspect)) ||
      (e.transitPlanet === "venus" && ["trine", "sextile"].includes(e.aspect) && (NATAL_TARGET_WEIGHT[e.natalPlanet] || 0) >= 7),
  },
  {
    theme: "relationship_values",
    label: "Iliskiler ve Degerler",
    match: (e) =>
      (e.transitPlanet === "venus" && ["conjunction", "square", "opposition"].includes(e.aspect) && e.natalPlanet !== "venus") ||
      (["venus", "moon"].includes(e.natalPlanet) && SLOW_PLANETS.includes(e.transitPlanet) && !["venus"].includes(e.natalPlanet)),
  },
  {
    theme: "health_body",
    label: "Saglik ve Beden",
    match: (e) =>
      (e.transitPlanet === "mars" && ["moon", "asc"].includes(e.natalPlanet) && ["conjunction", "square", "opposition"].includes(e.aspect)) ||
      (e.transitPlanet === "saturn" && e.natalPlanet === "asc"),
  },
  {
    theme: "spirituality_intuition",
    label: "Maneviyat ve Sezgi",
    match: (e) =>
      (e.transitPlanet === "neptune" && ["sun", "moon", "asc"].includes(e.natalPlanet)) ||
      (e.transitPlanet === "pluto" && e.natalPlanet === "moon" && ["trine", "sextile"].includes(e.aspect)),
  },
  {
    theme: "communication_mental",
    label: "Iletisim ve Zihinsel Surec",
    match: (e) =>
      e.transitPlanet === "mercury" ||
      (e.type === "retrograde" && e.transitPlanet === "mercury"),
  },
  {
    theme: "emotional_reset",
    label: "Duygusal Yenilenme",
    match: (e) =>
      e.type === "lunar_return" ||
      (e.transitPlanet === "neptune" && e.natalPlanet === "venus"),
  },
  {
    theme: "energy_action",
    label: "Enerji ve Aksiyon",
    match: (e) =>
      e.transitPlanet === "mars" && ["conjunction", "square", "opposition"].includes(e.aspect),
  },
];

function clusterEvents(scoredEvents) {
  const clusters = {};

  for (const ev of scoredEvents) {
    let assigned = false;
    for (const rule of THEME_RULES) {
      if (rule.match(ev)) {
        if (!clusters[rule.theme]) {
          clusters[rule.theme] = {
            theme: rule.theme,
            label: rule.label,
            events: [],
            maxScore: 0,
            windowStart: ev.startDate,
            windowEnd: ev.endDate,
          };
        }
        const c = clusters[rule.theme];
        c.events.push(ev);
        if (ev.score > c.maxScore) c.maxScore = ev.score;
        if (ev.startDate < c.windowStart) c.windowStart = ev.startDate;
        if (ev.endDate > c.windowEnd) c.windowEnd = ev.endDate;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const fallback = "general_transit";
      if (!clusters[fallback]) {
        clusters[fallback] = {
          theme: fallback,
          label: "Genel Etkiler",
          events: [],
          maxScore: 0,
          windowStart: ev.startDate,
          windowEnd: ev.endDate,
        };
      }
      const c = clusters[fallback];
      c.events.push(ev);
      if (ev.score > c.maxScore) c.maxScore = ev.score;
      if (ev.startDate < c.windowStart) c.windowStart = ev.startDate;
      if (ev.endDate > c.windowEnd) c.windowEnd = ev.endDate;
    }
  }

  const list = Object.values(clusters);
  list.forEach((c) => { c.themeScore = scoreTheme(c); });
  return list.sort((a, b) => b.themeScore - a.themeScore);
}

function scoreTheme(cluster) {
  const maxEvent = cluster.maxScore;
  const density = Math.min(cluster.events.length, 5) * 3;
  const uniquePlanets = new Set(cluster.events.map((e) => e.transitPlanet)).size;
  const multiPlanetBonus = uniquePlanets >= 3 ? 8 : uniquePlanets >= 2 ? 4 : 0;
  const dur = daysBetween(cluster.windowStart, cluster.windowEnd);
  const durationBonus = dur >= 30 ? 5 : dur >= 14 ? 3 : 0;
  return Math.min(100, maxEvent + density + multiPlanetBonus + durationBonus);
}

function mergeOverlappingThemes(clusters) {
  const byTheme = {};
  for (const c of clusters) {
    if (!byTheme[c.theme]) byTheme[c.theme] = [];
    byTheme[c.theme].push(c);
  }

  const merged = [];
  for (const arr of Object.values(byTheme)) {
    if (arr.length <= 1) {
      merged.push(...arr);
      continue;
    }
    arr.sort((a, b) => a.windowStart.localeCompare(b.windowStart));
    let current = { ...arr[0], events: [...arr[0].events] };
    for (let i = 1; i < arr.length; i++) {
      const next = arr[i];
      if (next.windowStart <= current.windowEnd) {
        current.events.push(...next.events);
        if (next.windowEnd > current.windowEnd) current.windowEnd = next.windowEnd;
        if (next.maxScore > current.maxScore) current.maxScore = next.maxScore;
      } else {
        current.themeScore = scoreTheme(current);
        merged.push(current);
        current = { ...next, events: [...next.events] };
      }
    }
    current.themeScore = scoreTheme(current);
    merged.push(current);
  }

  return merged.sort((a, b) => b.themeScore - a.themeScore);
}

function suppressFastPlanets(events) {
  return events.filter((e) => {
    if (e.type === "lunar_return") return false;
    if (FAST_PLANETS.includes(e.transitPlanet) && e.type === "aspect") return false;
    if (e.type === "retrograde" && FAST_PLANETS.includes(e.transitPlanet)) return false;
    return true;
  });
}

function splitTiers(clusters, months) {
  const th = THRESHOLDS[months] || THRESHOLDS[3];

  const critical = [];
  const supportive = [];
  const background = [];

  for (const cluster of clusters) {
    const criticalEvents = cluster.events.filter((e) => e.score >= th.ai);
    const supportiveEvents = cluster.events.filter((e) => e.score >= th.template && e.score < th.ai);
    const backgroundEvents = cluster.events.filter((e) => e.score < th.template);

    if (cluster.themeScore >= th.ai && criticalEvents.length > 0) {
      critical.push({
        ...cluster,
        tier: "critical",
        events: criticalEvents,
        supportiveEvents,
        backgroundEvents,
      });
    } else if (cluster.themeScore >= th.template || supportiveEvents.length > 0) {
      supportive.push({
        ...cluster,
        tier: "supportive",
        events: [...criticalEvents, ...supportiveEvents],
        backgroundEvents,
      });
    }

    background.push(...backgroundEvents.map((e) => ({ ...e, tier: "background" })));
  }

  const maxBg = months === 12 ? 3 : months === 6 ? 6 : 999;
  const trimmedBg = background.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, maxBg);

  return { critical, supportive, background: trimmedBg };
}

module.exports = {
  clusterEvents,
  scoreTheme,
  mergeOverlappingThemes,
  splitTiers,
  suppressFastPlanets,
  THEME_RULES,
};
