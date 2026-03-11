/**
 * Phase segmentation & dominance analysis.
 * Used by hybrid (6 month, 3 phases) and yearly (12 month, 4 phases).
 * phaseCount is configurable via periodProfiles.
 */

const { daysBetween } = require("./scoring");

const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const PHASE_LABELS_TR = ["Birinci Dönem", "İkinci Dönem", "Üçüncü Dönem", "Dördüncü Dönem"];

function segmentPhases(clusters, period, phaseCount = 3) {
  const start = new Date(period.start);
  const totalDays = daysBetween(period.start, period.end);
  const phaseLength = Math.ceil(totalDays / phaseCount);

  const phases = [];
  for (let i = 0; i < phaseCount; i++) {
    const phaseStart = new Date(start.getTime() + i * phaseLength * 86400000);
    const phaseEnd = new Date(start.getTime() + Math.min((i + 1) * phaseLength, totalDays) * 86400000);
    const ps = phaseStart.toISOString().slice(0, 10);
    const pe = phaseEnd.toISOString().slice(0, 10);

    const startMonth = MONTH_NAMES_TR[phaseStart.getUTCMonth()];
    const endMonth = MONTH_NAMES_TR[phaseEnd.getUTCMonth()];

    phases.push({
      id: `phase_${i + 1}`,
      index: i,
      title: PHASE_LABELS_TR[i] || `${i + 1}. Dönem`,
      window: `${startMonth} – ${endMonth}`,
      windowStart: ps,
      windowEnd: pe,
      clusters: [],
      events: [],
      dominantThemes: [],
    });
  }

  for (const cluster of clusters) {
    for (const phase of phases) {
      const eventsInPhase = cluster.events.filter(
        (e) => e.startDate <= phase.windowEnd && e.endDate >= phase.windowStart
      );
      if (eventsInPhase.length > 0) {
        phase.clusters.push({
          theme: cluster.theme,
          label: cluster.label,
          themeScore: cluster.themeScore,
          eventCount: eventsInPhase.length,
        });
        phase.events.push(...eventsInPhase);
      }
    }
  }

  for (const phase of phases) {
    phase.clusters.sort((a, b) => b.themeScore - a.themeScore);
    phase.dominantThemes = phase.clusters.slice(0, 3).map((c) => c.theme);
  }

  return phases;
}

function buildPhaseDominance(phases, clusters) {
  const themeAppearances = {};
  for (const phase of phases) {
    for (const c of phase.clusters) {
      if (!themeAppearances[c.theme]) themeAppearances[c.theme] = [];
      if (!themeAppearances[c.theme].includes(phase.id)) {
        themeAppearances[c.theme].push(phase.id);
      }
    }
  }

  const recurringThemes = Object.entries(themeAppearances)
    .filter(([, appearances]) => appearances.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([theme, appearances]) => ({
      theme,
      label: clusters.find((c) => c.theme === theme)?.label || theme,
      phases: appearances,
      count: appearances.length,
      description: "",
    }));

  const focusAreaMapping = {
    career: ["career_direction", "structural_pressure", "money_resources"],
    relationships: ["relationship_values", "emotional_reset"],
    innerLife: ["identity_transformation", "life_purpose", "spirituality_intuition"],
    growth: ["growth_opportunity", "communication_mental", "energy_action"],
    health: ["health_body"],
  };

  const focusAreas = {};
  for (const [area, themeKeys] of Object.entries(focusAreaMapping)) {
    const relevant = clusters.filter((c) => themeKeys.includes(c.theme));
    focusAreas[area] = {
      themes: relevant.map((c) => ({ theme: c.theme, label: c.label, themeScore: c.themeScore })),
      hasContent: relevant.length > 0,
    };
  }

  return { recurringThemes, focusAreas };
}

module.exports = { segmentPhases, buildPhaseDominance, MONTH_NAMES_TR };
