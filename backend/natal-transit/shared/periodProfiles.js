/**
 * Central configuration for all transit period modes.
 * Single source of truth for caps, phase counts, AI call strategy, retro strategy.
 */

const PERIOD_PROFILES = {
  1: {
    mode: "monthly",
    aiCalls: 1,
    phaseCount: 0,
    maxThemes: 6,
    maxMilestones: 0,
    maxRecurring: 0,
    maxDrivers: 0,
    maxBackground: 10,
    retroStrategy: "template",
    hasFocusAreas: false,
    callAContent: ["themes"],
    callBContent: [],
  },
  3: {
    mode: "quarterly",
    aiCalls: 1,
    phaseCount: 0,
    maxThemes: 6,
    maxMilestones: 3,
    maxRecurring: 0,
    maxDrivers: 0,
    maxBackground: 8,
    retroStrategy: "template",
    hasFocusAreas: false,
    callAContent: ["overview", "themes", "milestones"],
    callBContent: [],
  },
  6: {
    mode: "hybrid",
    aiCalls: 2,
    phaseCount: 3,
    maxThemes: 5,
    maxMilestones: 4,
    maxRecurring: 3,
    maxDrivers: 15,
    maxBackground: 0,
    retroStrategy: "template+ai",
    hasFocusAreas: false,
    callAContent: ["overview", "phases", "themes"],
    callBContent: ["retroPolish"],
  },
  12: {
    mode: "yearlyNarrative",
    aiCalls: 2,
    phaseCount: 4,
    maxThemes: 0,
    maxMilestones: 5,
    maxRecurring: 5,
    maxDrivers: 25,
    maxBackground: 0,
    retroStrategy: "template+ai",
    hasFocusAreas: true,
    callAContent: ["overview", "phases", "focusAreas", "milestones", "recurringDesc"],
    callBContent: ["retroPolish"],
  },
};

function getProfile(months) {
  return PERIOD_PROFILES[months] || PERIOD_PROFILES[3];
}

module.exports = { PERIOD_PROFILES, getProfile };
