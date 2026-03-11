/**
 * Unified v4 response contract.
 * All fields always present — empty arrays/strings, never null/undefined.
 * Frontend does .length > 0 checks, never null checks.
 */

function buildEmptyResponse(periodMode) {
  return {
    formatVersion: 4,
    periodMode: periodMode || "monthly",
    period: { start: "", end: "" },
    months: 0,
    overview: { title: "", summary: "" },
    phases: [],
    themes: [],
    retrogradeWindows: [],
    milestones: [],
    recurringThemes: [],
    focusAreas: {
      career: "",
      relationships: "",
      innerLife: "",
      growth: "",
      health: "",
    },
    detailedDrivers: [],
    background: [],
    stats: {
      rawEventCount: 0,
      filteredEventCount: 0,
      clusterCount: 0,
      phaseCount: 0,
      retrogradeCount: 0,
      aiCallCount: 0,
      aiCallBFailed: false,
      pipelineMs: 0,
    },
  };
}

function applyContentCaps(response, profile) {
  if (profile.maxThemes > 0 && response.themes.length > profile.maxThemes) {
    response.themes = response.themes.slice(0, profile.maxThemes);
  }
  if (profile.maxMilestones > 0 && response.milestones.length > profile.maxMilestones) {
    response.milestones = response.milestones.slice(0, profile.maxMilestones);
  }
  if (profile.maxRecurring > 0 && response.recurringThemes.length > profile.maxRecurring) {
    response.recurringThemes = response.recurringThemes.slice(0, profile.maxRecurring);
  }
  if (profile.maxDrivers > 0 && response.detailedDrivers.length > profile.maxDrivers) {
    response.detailedDrivers = response.detailedDrivers.slice(0, profile.maxDrivers);
  }
  if (profile.maxBackground > 0 && response.background.length > profile.maxBackground) {
    response.background = response.background.slice(0, profile.maxBackground);
  }
  if (!profile.hasFocusAreas) {
    response.focusAreas = { career: "", relationships: "", innerLife: "", growth: "", health: "" };
  }
  return response;
}

module.exports = { buildEmptyResponse, applyContentCaps };
