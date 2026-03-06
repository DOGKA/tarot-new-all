// Card data types
export interface Card {
  id: number;
  name: string;
  image: string;
  arcana: "major" | "minor";
  number: string;
  suit: "wands" | "cups" | "swords" | "pentacles" | null;
  element: "fire" | "water" | "air" | "earth" | null;
  meanings: {
    upright: CategoryMeanings;
    reversed: CategoryMeanings;
  };
}

export interface CategoryMeanings {
  general: string;
  love: string;
  career: string;
  spiritual: string;
}

export type FocusArea = "general" | "love" | "career" | "spiritual";

export interface TarotData {
  cards: Card[];
}

// Selected card for reading
export interface SelectedCard {
  card: Card;
  orientation: "upright" | "reversed";
  position?: "past" | "present" | "future" | "situation" | "obstacle" | "advice" | "destiny" | "path" | "union" | "optionA" | "optionA_outcome" | "optionB" | "optionB_outcome" | "self" | "block" | "need" | "action" | "potential" | "intention" | "seed" | "shadow" | "support" | "firstStep" | "illumination" | "tension" | "lesson" | "release" | "integration" | "mind" | "body" | "spirit" | "signal" | "guidance" | "current" | "challenge" | "clarity" | "strength" | "opportunity" | "direction" | "idea" | "foundation" | "shift" | "income" | "resource" | "growth" | "balance";
}

// Spread types
export type SpreadType = "single_card" | "past_present_future" | "yes_no" | "situation_obstacle_advice" | "destinys_embrace" | "love_choice" | "path_to_love" | "new_moon_ritual" | "full_moon_release" | "mind_body_spirit" | "celestial_illumination" | "career_clarity" | "career_path_guide" | "new_business_exploration" | "wealth_flow";

// Language types
export type Language = "en" | "tr" | "de" | "es";

// User type
export interface User {
  isPremium: boolean;
}

// API Request types
export interface SingleCardRequest {
  language: Language;
  spread: "single_card";
  focusArea: FocusArea;
  card: {
    name: string;
    orientation: "upright" | "reversed";
  };
}

export interface ThreeCardRequest {
  language: Language;
  spread: "past_present_future";
  cards: Array<{
    position: "past" | "present" | "future";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

export interface SingleCardReading {
  title: string;
  overall: string;
  focusArea: FocusArea;
  deepDive: string;
  shadow: string;
  nextStep: string;
  journal: string;
}

// Premium output types - Three Card
export interface ThreeCardReading {
  title: string;
  overall: string;
  throughline: string;
  story: string;
  beats: {
    past: string;
    present: string;
    future: string;
  };
  choice: {
    pathA: string;
    pathB: string;
  };
  keywords: string[];
  mood: string;
  nextStep: string;
}

// SOA (Situation/Obstacle/Advice) Reading Output
export interface SOAReading {
  title: string;
  overall: string;
  beats: {
    situation: string;
    obstacle: string;
    advice: string;
  };
  nextStep: string;
}

// SOA Request
export interface SOARequest {
  language: Language;
  spread: "situation_obstacle_advice";
  isPremium: boolean;
  cards: Array<{
    position: "situation" | "obstacle" | "advice";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Yes/No Request
export interface YesNoRequest {
  language: Language;
  spread: "yes_no";
  focusArea: FocusArea;
  card: {
    name: string;
    orientation: "upright" | "reversed";
  };
}

// Yes/No Reading Output
export interface YesNoReading {
  title: string;
  focusArea: FocusArea;
  answer: "yes" | "no" | "uncertain"; // v2: added uncertain
  confidence: number; // 40-95
  clarityLabel?: string; // v2: "Net", "Şartlı", "Düşük", "Belirsiz"
  conditionMessage?: string; // v2: for uncertain answers
  explanation: string;
  keywords?: string[]; // focusArea'ya göre keywords
}

// Yes/No Clarity Data (for JSON file)
export interface YesNoClarityData {
  clarityWeight: number;
  keywords: {
    [lang in Language]: {
      [area in FocusArea]: [string, string];
    };
  };
}

// Destiny's Embrace Reading Output
export interface DestinysEmbraceReading {
  title: string;
  overall: string;
  beats: {
    destiny: string;
    path: string;
    union: string;
  };
  nextStep: string;
  keywords: string[];
}

// Love Choice Reading Output (5 kart)
export interface LoveChoiceReading {
  title: string;
  overall: string;
  beats: {
    optionA: string;
    optionA_outcome: string;
    optionB: string;
    optionB_outcome: string;
    advice: string;
  };
  decisionLens: string;
  nextStep: string;
  keywords: string[];
}

// Path to Love Reading Output (5 kart)
export interface PathToLoveReading {
  title: string;
  overall: string;
  beats: {
    self: string;
    block: string;
    need: string;
    action: string;
    potential: string;
  };
  strategy: string;
  nextStep: string;
  keywords: string[];
}

// ============================================
// SPIRITUAL SPREADS
// ============================================

// New Moon Ritual Reading Output (5 kart)
export interface NewMoonRitualReading {
  title: string;
  overall: string;
  ritualTheme: string;
  beats: {
    intention: string;
    seed: string;
    shadow: string;
    support: string;
    firstStep: string;
  };
  affirmation: string;
  nextStep: string;
  journal: string;
}

// New Moon Ritual Request
export interface NewMoonRitualRequest {
  language: Language;
  spread: "new_moon_ritual";
  isPremium: boolean;
  cards: Array<{
    position: "intention" | "seed" | "shadow" | "support" | "firstStep";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Full Moon Release Reading Output (5 kart)
export interface FullMoonReleaseReading {
  title: string;
  overall: string;
  releaseTheme: string;
  beats: {
    illumination: string;
    tension: string;
    lesson: string;
    release: string;
    integration: string;
  };
  cleansingAdvice: string;
  affirmation: string;
  nextStep: string;
  journal: string;
}

// Full Moon Release Request
export interface FullMoonReleaseRequest {
  language: Language;
  spread: "full_moon_release";
  isPremium: boolean;
  cards: Array<{
    position: "illumination" | "tension" | "lesson" | "release" | "integration";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Mind Body Spirit Reading Output (3 kart)
export interface MindBodySpiritReading {
  title: string;
  overall: string;
  harmonyScore: number;
  beats: {
    mind: string;
    body: string;
    spirit: string;
  };
  alignmentAdvice: string;
  nextStep: string;
  journal: string;
}

// Mind Body Spirit Request
export interface MindBodySpiritRequest {
  language: Language;
  spread: "mind_body_spirit";
  isPremium: boolean;
  cards: Array<{
    position: "mind" | "body" | "spirit";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Celestial Illumination Reading Output (3 kart)
export interface CelestialIlluminationReading {
  title: string;
  overall: string;
  celestialMessage: string;
  beats: {
    signal: string;
    guidance: string;
    integration: string;
  };
  omenKeywords: [string, string, string];
  nextStep: string;
  journal: string;
}

// Celestial Illumination Request
export interface CelestialIlluminationRequest {
  language: Language;
  spread: "celestial_illumination";
  isPremium: boolean;
  cards: Array<{
    position: "signal" | "guidance" | "integration";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// ============================================
// CAREER SPREADS
// ============================================

// Career Clarity Reading Output (3 kart)
export interface CareerClarityReading {
  title: string;
  overall: string;
  throughline: string;
  directionHint: string;
  journal: string;
}

// Career Clarity Request
export interface CareerClarityRequest {
  language: Language;
  spread: "career_clarity";
  isPremium: boolean;
  cards: Array<{
    position: "current" | "challenge" | "clarity";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Career Path Guide Reading Output (3 kart)
export interface CareerPathGuideReading {
  title: string;
  overall: string;
  beats: {
    strength: string;
    opportunity: string;
    direction: string;
  };
  directionHint: string;
  journal: string;
}

// Career Path Guide Request
export interface CareerPathGuideRequest {
  language: Language;
  spread: "career_path_guide";
  isPremium: boolean;
  cards: Array<{
    position: "strength" | "opportunity" | "direction";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// New Business Exploration Reading Output (5 kart)
export interface NewBusinessExplorationReading {
  title: string;
  overall: string;
  strategy: string;
  riskNote: string;
  directionHint: string;
  journal: string;
}

// New Business Exploration Request
export interface NewBusinessExplorationRequest {
  language: Language;
  spread: "new_business_exploration";
  isPremium: boolean;
  cards: Array<{
    position: "idea" | "foundation" | "challenge" | "opportunity" | "shift";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Wealth Flow Reading Output (5 kart)
export interface WealthFlowReading {
  title: string;
  overall: string;
  flowInsight: string;
  optimization: string;
  directionHint: string;
  journal: string;
}

// Wealth Flow Request
export interface WealthFlowRequest {
  language: Language;
  spread: "wealth_flow";
  isPremium: boolean;
  cards: Array<{
    position: "income" | "block" | "resource" | "growth" | "balance";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}
