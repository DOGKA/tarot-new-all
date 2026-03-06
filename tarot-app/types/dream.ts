// ============================================
// DREAM CODER — Type Definitions
// ============================================

export type DreamMode = "A" | "B" | "C";

export type FeelingTag =
  | "korku"
  | "özlem"
  | "merak"
  | "rahatlık"
  | "utanç"
  | "öfke"
  | "hüzün"
  | "şaşkınlık"
  | "mutluluk"
  | "hayal kırıklığı"
  | "endişe"
  | "suçluluk"
  | "güvensizlik"
  | "huzur"
  | "çaresizlik"
  | "kıskançlık";

export type LifeContextTag =
  | "iş"
  | "aşk"
  | "para"
  | "aile"
  | "sağlık"
  | "arkadaşlık"
  | "kayıp"
  | "değişim"
  | "eğitim";

// ============================================
// API Request / Response
// ============================================

export interface DreamDecodeRequest {
  mode: DreamMode;
  dreamText: string;
  feelingTags?: FeelingTag[];
  lifeContextTags?: LifeContextTag[];
  deviceId: string;
  requestId: string;
  language?: string;
}

export interface DreamUpsellRequest {
  dreamDecodeId: string;
  deviceId: string;
  requestId: string;
  language?: string;
}

// ============================================
// Result Types (mode-specific)
// ============================================

export interface DreamResultA {
  overall: string;
  beats: string[];
  nextStep: string;
  keywords: [string, string, string];
  journal: string;
  upsellSymbol?: UpsellSymbol;
}

export interface DreamResultB extends DreamResultA {
  pattern: string;
}

export interface DreamResultC extends DreamResultA {
  plan: [string, string, string];
}

export type DreamResult = DreamResultA | DreamResultB | DreamResultC;

export interface UpsellSymbol {
  symbol: string;
  insight: string;
  nextStepAddOn: string;
  journalAddOn?: string;
}

export interface DreamJournalPlus {
  answer: string;
  insight: string;
}

// ============================================
// API Response wrappers
// ============================================

export interface DreamDecodeResponse extends DreamResultA {
  readingId: string;
  mode: DreamMode;
  wasFree: boolean;
  gemstoneCost: number;
  // B mode extras
  pattern?: string;
  // C mode extras
  plan?: [string, string, string];
  // Upsell candidates (pre-generated)
  upsellCandidates?: Array<{ symbol: string; hint: string; insight: string }>;
  // JournalPlus (kullanicinin journal cevabi + GPT insight)
  dreamJournalPlus?: DreamJournalPlus;
}

export interface DreamUpsellResponse {
  readingId: string;
  upsellCost: number;
  upsellSymbol: UpsellSymbol;
  alreadyUnlocked?: boolean;
}

export interface DreamUserInfo {
  deviceId: string;
  gemstoneBalance: number;
  dreamFreeCredit: number;
  createdAt: string;
}

export interface DreamPrices {
  A: number;
  B: number;
  C: number;
  UPSELL_SYMBOL: number;
  JOURNAL_PLUS: number;
}
