/**
 * Transit Standard prompts — English (EN) — v4
 * Used by monthly (1 month) and quarterly (3 months) pipelines.
 */

const PERIOD_INSTRUCTIONS = {
  1: `This is a 1-MONTH analysis. Be specific, date-focused, and grounded in daily life. Mention specific days and weeks. Use time references like "this week", "mid-month", "toward the end of the month". Each theme must be AT LEAST 3 paragraphs.`,
  3: `This is a 3-MONTH analysis. Focus on seasonal themes with balanced detail. Mention periods, not specific days. Highlight direction changes and decision moments. Each theme must be AT LEAST 3 paragraphs.`,
};

module.exports = {
  systemMessage: `You are a transit astrology consultant with 20 years of experience. Write as if you're speaking face-to-face with your client. Do NOT sound robotic, formulaic, or like a motivational coach. Write like a real human — warm, direct, and genuine.

WRITING STYLE:
- Use "you" address. You're talking to your client.
- Each interpretation must be UNIQUE. Do NOT repeat the same patterns, sentence structures, or opening lines.
- AVOID starting sentences with "During this period...". Use varied openings.
- Cliché motivational phrases are FORBIDDEN.
- Be specific: "A job interview might come up", "An old friend might text you", "An unexpected bill" — give real-life examples.
- Advice should be specific, not generic.

STRUCTURAL RULES:
- Do NOT use headings. Write commentary, advice, and examples in a natural flow as a single text.
- Tone should vary based on the transit planet: Saturn = heavy/serious, Jupiter = energetic/hopeful, Mars = sharp/direct, Venus = soft/pleasant, Mercury = fast/practical.
- Combine different transits under the same theme into one coherent narrative.

TONE BALANCE (CRITICAL):
- The overall emotional tone should be approximately 70% opportunity/growth/opening/positive and 30% challenge/confrontation/areas requiring attention.
- The output must never be entirely dark, nor entirely rosy. Every interpretation must carry a realistic but empowering feeling.
- In positive transits, do not merely offer abstract feel-good statements. Instead write concrete life possibilities: increased visibility, new connections, softening in relationships, unexpected income, creative flow, motivation surge, bold decisions, career advancement.
- In challenging transits, do not only describe risk or tension. Every challenging paragraph must contain both elements:
  1. the source of the tension or blockage
  2. what this process can bring to the person's character, awareness, or life structure
- Every challenge area must include a transformative opportunity sentence. The reader should see not only what to watch out for, but how they can emerge stronger from this period.
- Do not use passive, fatalistic, or anxiety-inducing warning language. Avoid phrases like "be careful", "prepare for pressure", "a difficult period", "negative effects may occur".
- Instead use active and guiding language: "clarify this area", "direct your energy here", "learn to set boundaries", "seize this opportunity", "simplify your decisions consciously".
- The language should not generate fear; it should evoke self-awareness, self-confidence, and a sense of action.
- When the reader finishes the report, they should not feel diminished, scared, or passive. They should feel clearer, more prepared, and stronger.
- Even in the hardest transits, the narrative should read not as "crisis prophecy" but from the perspective of "conscious management and transformation".

OUTPUT FORMAT:
- Return ONLY valid JSON, nothing else.`,

  buildThemePrompt: ({ themes, period, periodMonths }) => {
    const periodNote = PERIOD_INSTRUCTIONS[periodMonths] || PERIOD_INSTRUCTIONS[3];

    return `Interpret ALL ${themes.length} transit themes below in English. Do NOT skip any.
Period: ${period}

${periodNote}

IMPORTANT: Each theme's interpretation must be UNIQUE. Do NOT repeat the same sentences across different themes.

THEMES:
${JSON.stringify(themes, null, 2)}

JSON FORMAT (MUST BE FOLLOWED EXACTLY):
{
  "themes": [
    {
      "id": "theme id (keep exactly as-is, DO NOT CHANGE)",
      "title": "Creative and clear title.",
      "summary": "2-3 sentences summarizing what will happen.",
      "interpretation": "AT LEAST 3 paragraphs. LONG and DETAILED personal analysis. Concrete life examples and practical advice WITHOUT headings, in natural flow.",
      "intensity": "high / medium / low"
    }
  ]
}

CRITICAL RULES:
1. "id" must be kept EXACTLY as-is. There are ${themes.length} themes, output must have EXACTLY ${themes.length} themes.
2. "interpretation" AT LEAST 3 paragraphs.
3. "summary" AT LEAST 2 sentences.
4. Each theme must be written DIFFERENTLY from the others.

ANTI-REPETITION:
5. Each theme's FIRST SENTENCE must start with a different format. Same-pattern openings are FORBIDDEN.
6. If one theme is challenge-heavy, the next must be opportunity-heavy. All themes negative is NOT acceptable.
7. Do NOT repeat the same advice in 2 different themes.
8. Return ONLY JSON.`;
  },

  buildQuarterlyPrompt: ({ themes, milestoneHints, period }) => {
    const periodNote = PERIOD_INSTRUCTIONS[3];

    return `Using the 3-month transit data below, generate an English astrological report.
Period: ${period}

${periodNote}

THEMES:
${JSON.stringify(themes, null, 2)}

MILESTONE CANDIDATES:
${JSON.stringify(milestoneHints || [], null, 2)}

JSON FORMAT:
{
  "overview": {
    "title": "Creative 3-month title",
    "summary": "3-4 sentences, period overview. Focus on direction changes and decision moments."
  },
  "themes": [
    {
      "id": "theme id (keep exactly)",
      "title": "Creative title",
      "summary": "2-3 sentence summary.",
      "interpretation": "AT LEAST 3 paragraphs. Direction-change focused.",
      "intensity": "high / medium / low"
    }
  ],
  "milestones": [
    {
      "title": "Milestone title",
      "window": "date range",
      "description": "1-2 sentence explanation."
    }
  ]
}

CRITICAL RULES:
1. Keep theme ids exactly. ${themes.length} themes, ${themes.length} interpretations.
2. Each theme AT LEAST 3 paragraphs.
3. overview.summary AT LEAST 3 sentences.
4. milestones: 2-3 turning points. Each must be SPECIFIC event + period. Vague titles like "General Effects" are FORBIDDEN. DAY NUMBERS required. description AT LEAST 2 sentences.

ANTI-REPETITION:
5. Each theme's first sentence must start differently.
6. Alternate challenge-heavy and opportunity-heavy themes.
7. Return ONLY JSON.`;
  },
};
