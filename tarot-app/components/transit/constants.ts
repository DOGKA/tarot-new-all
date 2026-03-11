export const TOKENS = {
  bg: { card: "rgba(255,255,255,0.02)", cardHover: "rgba(255,255,255,0.04)", featured: "rgba(139,92,246,0.06)" },
  border: { subtle: "rgba(255,255,255,0.06)", featured: "rgba(139,92,246,0.2)", amber: "rgba(251,191,36,0.15)" },
  radius: { card: 18, pill: 20, inner: 10, section: 22 },
  spacing: { section: 24, card: 12, inner: 16 },
  text: {
    primary: "#fff",
    secondary: "rgba(255,255,255,0.85)",
    muted: "rgba(255,255,255,0.45)",
    hint: "rgba(255,255,255,0.3)",
    separator: "rgba(255,255,255,0.05)",
  },
};

export const THEME_ICONS: Record<string, string> = {
  identity_transformation: "Dönüşüm",
  life_purpose: "Misyon",
  career_direction: "Kariyer",
  money_resources: "Para",
  structural_pressure: "Yapılanma",
  growth_opportunity: "Büyüme",
  relationship_values: "İlişkiler",
  health_body: "Sağlık",
  spirituality_intuition: "Maneviyat",
  communication_mental: "İletişim",
  emotional_reset: "Duygusal",
  energy_action: "Enerji",
  general_transit: "Genel",
};

export const COLOR_MAP: Record<string, string> = {
  danger: "#fb7185",
  opportunity: "#4ade80",
  change: "#60a5fa",
  retro: "#c084fc",
  lunar: "#94a3b8",
};

export const INTENSITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "Güçlü", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  medium: { label: "Orta", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  low: { label: "Hafif", color: "#6ee7b7", bg: "rgba(110,231,183,0.12)" },
};

export const PLANET_COLORS: Record<string, string> = {
  mercury: "#60a5fa",
  venus: "#ec4899",
  mars: "#ef4444",
  jupiter: "#f97316",
  saturn: "#fbbf24",
  uranus: "#22d3ee",
  neptune: "#a78bfa",
  pluto: "#c084fc",
  sun: "#fbbf24",
  moon: "#94a3b8",
};

export const RETRO_CARD_COLORS: Record<string, { border: string; gradient: [string, string] }> = {
  mercury: { border: "rgba(96,165,250,0.35)", gradient: ["rgba(96,165,250,0.08)", "rgba(96,165,250,0.02)"] },
  venus: { border: "rgba(236,72,153,0.35)", gradient: ["rgba(236,72,153,0.08)", "rgba(236,72,153,0.02)"] },
  mars: { border: "rgba(239,68,68,0.35)", gradient: ["rgba(239,68,68,0.08)", "rgba(239,68,68,0.02)"] },
  jupiter: { border: "rgba(249,115,22,0.35)", gradient: ["rgba(249,115,22,0.08)", "rgba(249,115,22,0.02)"] },
  saturn: { border: "rgba(251,191,36,0.35)", gradient: ["rgba(251,191,36,0.08)", "rgba(251,191,36,0.02)"] },
  uranus: { border: "rgba(34,211,238,0.35)", gradient: ["rgba(34,211,238,0.08)", "rgba(34,211,238,0.02)"] },
  neptune: { border: "rgba(167,139,250,0.35)", gradient: ["rgba(167,139,250,0.08)", "rgba(167,139,250,0.02)"] },
  pluto: { border: "rgba(192,132,252,0.35)", gradient: ["rgba(192,132,252,0.08)", "rgba(192,132,252,0.02)"] },
};

export const FOCUS_AREA_CONFIG: Record<string, { label: string; color: string }> = {
  career: { label: "Kariyer ve Para", color: "#60a5fa" },
  relationships: { label: "İlişkiler ve Değerler", color: "#fb7185" },
  innerLife: { label: "İçsel Dönüşüm", color: "#c084fc" },
  growth: { label: "Kişisel Büyüme", color: "#4ade80" },
  health: { label: "Sağlık ve Beden", color: "#fbbf24" },
};

export const PHASE_GRADIENTS: [string, string, string][] = [
  ["rgba(139,92,246,0.22)", "rgba(59,130,246,0.10)", "rgba(18,10,35,0.96)"],
  ["rgba(251,191,36,0.18)", "rgba(234,179,8,0.06)", "rgba(18,10,35,0.96)"],
  ["rgba(74,222,128,0.18)", "rgba(22,163,74,0.06)", "rgba(18,10,35,0.96)"],
  ["rgba(244,114,182,0.18)", "rgba(236,72,153,0.06)", "rgba(18,10,35,0.96)"],
];

export const PHASE_DOT_COLORS = ["#a78bfa", "#fbbf24", "#4ade80", "#f472b6"];

export const PLANET_GLYPHS: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};

export function getScoreColor(score: number): string {
  if (score >= 80) return "#fbbf24";
  if (score >= 70) return "#60a5fa";
  if (score >= 60) return "#a78bfa";
  if (score >= 50) return "#6ee7b7";
  return "#94a3b8";
}

export const HERO_SIZES: Record<string, { titleSize: number; padding: number; borderTint: string }> = {
  monthly: { titleSize: 22, padding: 20, borderTint: "rgba(255,255,255,0.08)" },
  quarterly: { titleSize: 24, padding: 22, borderTint: "rgba(255,255,255,0.08)" },
  hybrid: { titleSize: 26, padding: 24, borderTint: "rgba(139,92,246,0.15)" },
  yearlyNarrative: { titleSize: 30, padding: 28, borderTint: "rgba(251,191,36,0.15)" },
};
