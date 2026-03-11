export type TransitEvent = {
  id: string;
  type: string;
  color: string;
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  title: string;
  rangeText: string;
  startDate: string;
  endDate: string;
  exactDate: string;
  score: number;
};

export type TransitTheme = {
  id: string;
  theme: string;
  label: string;
  tier: "critical" | "supportive";
  maxScore: number;
  window: string;
  title: string;
  summary: string;
  interpretation: string;
  intensity: string;
  events?: TransitEvent[];
};

export type Phase = {
  id: string;
  title: string;
  window: string;
  windowStart: string;
  windowEnd: string;
  interpretation: string;
  dominantThemes: string[];
  clusterCount: number;
  eventCount: number;
};

export type RetrogradeWindow = {
  planet: string;
  planetLabel: string;
  startDate: string;
  endDate: string;
  baseInterpretation: string;
  personalNote: string;
  affectedThemes: string[];
  priority: string;
};

export type Milestone = {
  title: string;
  window: string;
  description: string;
};

export type RecurringTheme = {
  theme: string;
  label: string;
  phases: string[];
  count: number;
  description: string;
};

export type DetailedDriver = {
  id: string;
  phaseId: string;
  type: string;
  color: string;
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  startDate: string;
  endDate: string;
  score: number;
  title: string;
  rangeText: string;
};

export type V4Payload = {
  formatVersion: number;
  periodMode: "monthly" | "quarterly" | "hybrid" | "yearlyNarrative";
  period: { start: string; end: string };
  months: number;
  overview: { title: string; summary: string };
  phases: Phase[];
  themes: TransitTheme[];
  retrogradeWindows: RetrogradeWindow[];
  milestones: Milestone[];
  recurringThemes: RecurringTheme[];
  focusAreas: { career: string; relationships: string; innerLife: string; growth: string; health: string };
  detailedDrivers: DetailedDriver[];
  background: TransitEvent[];
  stats: {
    rawEventCount: number;
    filteredEventCount: number;
    clusterCount: number;
    phaseCount: number;
    retrogradeCount: number;
    aiCallCount: number;
    aiCallBFailed: boolean;
    pipelineMs: number;
  };
};
