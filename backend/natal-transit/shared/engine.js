/**
 * Shared transit engine — single source of truth for scoring, clustering, selection.
 * All pipelines use this. No business logic in orchestrators.
 *
 * Strategy: flat low threshold (25) + ranking + caps from periodProfiles.
 */

const { scoreEvent, daysBetween } = require("./scoring");
const { clusterEvents, mergeOverlappingThemes, splitTiers } = require("./clustering");
const { buildTitle, buildRangeText } = require("./formatters");
const { segmentPhases, buildPhaseDominance } = require("./phases");
const { buildEmptyResponse, applyContentCaps } = require("./contract");

const MIN_SCORE = 25;

function buildBaseTransitModel(rawEvents, periodMonths, profile) {
  const scored = rawEvents.map((e) => ({
    ...e,
    score: scoreEvent(e),
    title: buildTitle(e),
    rangeText: buildRangeText(e),
  }));

  const filtered = scored.filter((e) => e.score >= MIN_SCORE);
  const clustered = clusterEvents(filtered);
  const merged = mergeOverlappingThemes(clustered);

  let phases = [];
  let phaseDominance = { recurringThemes: [], focusAreas: {} };

  if (profile.phaseCount > 0) {
    const period = {
      start: rawEvents.length > 0 ? scored[0].startDate || scored[0].exactDate : "",
      end: rawEvents.length > 0 ? scored[scored.length - 1].endDate || scored[scored.length - 1].exactDate : "",
    };
    phases = segmentPhases(merged, period, profile.phaseCount);
    phaseDominance = buildPhaseDominance(phases, merged);
  }

  const { critical, supportive, background } = splitTiers(merged, periodMonths);

  return {
    scored,
    filtered,
    merged,
    phases,
    recurringThemes: phaseDominance.recurringThemes,
    focusAreas: phaseDominance.focusAreas,
    critical,
    supportive,
    background,
  };
}

// --- Multi-factor milestone selection ---

function selectMilestones(clusters, maxCount, allClusters) {
  if (maxCount === 0) return [];

  const candidates = clusters
    .map((c) => ({
      cluster: c,
      milestoneScore: scoreMilestoneCandidate(c, allClusters || clusters),
    }))
    .sort((a, b) => b.milestoneScore - a.milestoneScore)
    .slice(0, maxCount);

  return candidates.map((c) => {
    const peak = c.cluster.events.reduce(
      (best, e) => (e.score > (best?.score || 0) ? e : best),
      null
    );
    return {
      title: c.cluster.label,
      window: peak ? `${peak.startDate} – ${peak.endDate}` : `${c.cluster.windowStart} – ${c.cluster.windowEnd}`,
      theme: c.cluster.theme,
      score: c.cluster.themeScore,
      description: "",
    };
  });
}

function scoreMilestoneCandidate(cluster, allClusters) {
  let s = 0;
  s += normalize01(cluster.themeScore, 0, 100) * 0.40;
  s += temporalDistinctiveness(cluster, allClusters) * 0.25;
  s += clusterCentrality(cluster) * 0.20;
  s += dateExactness(cluster) * 0.15;
  return s;
}

function normalize01(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function temporalDistinctiveness(cluster, allClusters) {
  if (allClusters.length <= 1) return 1.0;
  let overlapCount = 0;
  for (const other of allClusters) {
    if (other.theme === cluster.theme) continue;
    if (other.windowStart <= cluster.windowEnd && other.windowEnd >= cluster.windowStart) {
      overlapCount++;
    }
  }
  const overlapRatio = overlapCount / (allClusters.length - 1);
  return 1.0 - overlapRatio;
}

function clusterCentrality(cluster) {
  const eventCount = Math.min(1, cluster.events.length / 10) * 0.5;
  const uniquePlanets = new Set(cluster.events.map((e) => e.transitPlanet)).size;
  const planetDiversity = Math.min(1, uniquePlanets / 4) * 0.5;
  return eventCount + planetDiversity;
}

function dateExactness(cluster) {
  const days = daysBetween(cluster.windowStart, cluster.windowEnd);
  if (days <= 7) return 1.0;
  if (days <= 14) return 0.8;
  if (days <= 30) return 0.5;
  return 0.2;
}

// --- Theme selection ---

function selectTopThemes(clusters, maxCount) {
  if (maxCount === 0) return [];
  return clusters
    .sort((a, b) => b.themeScore - a.themeScore)
    .slice(0, maxCount);
}

// --- Detailed drivers (curated narrative evidence) ---

function selectDetailedDrivers(phases, maxCount) {
  if (maxCount === 0 || phases.length === 0) return [];
  const perPhase = Math.ceil(maxCount / phases.length);
  const drivers = [];

  for (const phase of phases) {
    const topEvents = [...phase.events]
      .sort((a, b) => b.score - a.score)
      .slice(0, perPhase);

    drivers.push(
      ...topEvents.map((e) => ({
        id: e.id,
        phaseId: phase.id,
        type: e.type,
        color: e.color,
        transitPlanet: e.transitPlanet,
        natalPlanet: e.natalPlanet,
        aspect: e.aspect,
        startDate: e.startDate,
        endDate: e.endDate,
        exactDate: e.exactDate,
        score: e.score,
        title: e.title || buildTitle(e),
        rangeText: e.rangeText || buildRangeText(e),
      }))
    );
  }

  return drivers.slice(0, maxCount);
}

// --- Output assembly ---

function assembleOutput(profile, period, baseModel, aiResultA, aiResultB, retroWindows) {
  const response = buildEmptyResponse(profile.mode);

  response.period = period;
  const { PERIOD_PROFILES } = require("./periodProfiles");
  const monthsKey = Object.keys(PERIOD_PROFILES).find((k) => PERIOD_PROFILES[k].mode === profile.mode);
  response.months = monthsKey ? parseInt(monthsKey) : 0;

  if (aiResultA?.overview) {
    response.overview = aiResultA.overview;
  }

  if (profile.phaseCount > 0 && baseModel.phases.length > 0) {
    const aiPhases = {};
    (aiResultA?.phases || []).forEach((p) => { aiPhases[p.id] = p; });

    response.phases = baseModel.phases.map((p) => ({
      id: p.id,
      title: aiPhases[p.id]?.title || p.title,
      window: p.window,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
      dominantThemes: p.dominantThemes,
      interpretation: aiPhases[p.id]?.interpretation || "",
      clusterCount: p.clusters.length,
      eventCount: p.events.length,
    }));
    response.stats.phaseCount = response.phases.length;
  }

  if (aiResultA?.themes) {
    response.themes = aiResultA.themes;
  }

  if (aiResultA?.focusAreas && profile.hasFocusAreas) {
    response.focusAreas = {
      career: aiResultA.focusAreas.career || "",
      relationships: aiResultA.focusAreas.relationships || "",
      innerLife: aiResultA.focusAreas.innerLife || "",
      growth: aiResultA.focusAreas.growth || "",
      health: aiResultA.focusAreas.health || "",
    };
  }

  if (aiResultA?.milestones) {
    response.milestones = aiResultA.milestones;
  }

  if (aiResultA?.recurringThemes) {
    response.recurringThemes = aiResultA.recurringThemes;
  } else if (baseModel.recurringThemes && baseModel.recurringThemes.length > 0) {
    response.recurringThemes = baseModel.recurringThemes;
  }

  response.retrogradeWindows = retroWindows || [];

  if (profile.maxDrivers > 0 && baseModel.phases.length > 0) {
    response.detailedDrivers = selectDetailedDrivers(baseModel.phases, profile.maxDrivers);
  }

  if (profile.maxBackground > 0) {
    response.background = baseModel.background
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, profile.maxBackground)
      .map((e) => ({
        id: e.id,
        type: e.type,
        color: e.color,
        transitPlanet: e.transitPlanet,
        natalPlanet: e.natalPlanet,
        aspect: e.aspect,
        startDate: e.startDate,
        endDate: e.endDate,
        exactDate: e.exactDate,
        score: e.score,
        title: e.title || buildTitle(e),
        rangeText: e.rangeText || buildRangeText(e),
      }));
  }

  return applyContentCaps(response, profile);
}

module.exports = {
  buildBaseTransitModel,
  selectMilestones,
  selectTopThemes,
  selectDetailedDrivers,
  assembleOutput,
  MIN_SCORE,
};
