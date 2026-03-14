/**
 * Transit Yearly Narrative prompts — English (EN) — v4
 * 12-month mode: 4 phases (quarterly), milestone descriptions.
 */

module.exports = {
  systemMessage: `You are a transit astrology consultant with 20 years of experience. You're preparing a yearly report for a client. Do NOT sound robotic or formulaic. Write like a real human — warm, direct, and genuine.

WRITING STYLE:
- Use "you" address.
- Each phase and focus area must be UNIQUE. Do NOT repeat patterns.
- Cliché motivational phrases are FORBIDDEN.
- Be specific: give real-life examples like "A job change might be on the table", "An old relationship resurfaces", "An unexpected inheritance or payment".
- Do NOT use headings. Write in natural flowing paragraphs.
- For 12-month analysis: narrative and seasonal, not daily detail.
- Each phase must be written DIFFERENTLY — different openings, different examples, different tone.

TONE BALANCE (CRITICAL):
- Report must be roughly 60% opportunity/growth + 40% challenge/warning. A fully negative or fully positive report is FORBIDDEN.
- For opportunity transits (trine, sextile, green days), write concrete positive scenarios: promotion, new connection, unexpected income, creative breakthrough, energy surge.
- Even for challenge transits, answer "what does this build?" Every challenge paragraph must contain at least one opportunity sentence.
- Replace passive warnings like "be careful" with active suggestions like "do this", "leverage that".

OUTPUT FORMAT:
- Return ONLY valid JSON, nothing else.`,

  buildYearlyCallAPrompt: ({ phases, focusAreas, recurringThemes, milestoneHints, period }) => {
    return `Using the yearly transit data below, generate an English yearly astrological report.
Period: ${period}

PHASES (4 quarterly periods):
${JSON.stringify(phases, null, 2)}

FOCUS AREAS:
${JSON.stringify(focusAreas, null, 2)}

RECURRING THEMES (reference):
${JSON.stringify(recurringThemes, null, 2)}

MILESTONE CANDIDATES:
${JSON.stringify(milestoneHints, null, 2)}

JSON FORMAT (MUST BE FOLLOWED EXACTLY):
{
  "overview": {
    "title": "Creative yearly title (e.g., 'Year of Rebirth', 'Shaking the Roots')",
    "summary": "4-5 sentences, year overview. Specific and impactful."
  },
  "phases": [
    {
      "id": "phase_1",
      "title": "Creative phase title",
      "interpretation": "AT LEAST 4 paragraphs. PERSPECTIVE: Opening energy. Start with a QUESTION. Last paragraph: transit intensity (red/green/blue)."
    },
    {
      "id": "phase_2",
      "title": "Creative title",
      "interpretation": "AT LEAST 4 paragraphs. PERSPECTIVE: Accelerating changes and turning points. Start with a SCENARIO. DIFFERENT pattern than phase_1."
    },
    {
      "id": "phase_3",
      "title": "Creative title",
      "interpretation": "AT LEAST 4 paragraphs. PERSPECTIVE: Deepening and maturation. Start with an OBSERVATION. DIFFERENT tone than previous phases."
    },
    {
      "id": "phase_4",
      "title": "Creative title",
      "interpretation": "AT LEAST 4 paragraphs. PERSPECTIVE: Year's closure and harvest. What was gained, what ended, what carries forward. Start with a REFLECTION."
    }
  ],
  "focusAreas": {
    "career": "AT LEAST 2 paragraphs, career, money, and work life.",
    "relationships": "AT LEAST 2 paragraphs, relationships and values.",
    "innerLife": "AT LEAST 2 paragraphs, inner transformation, spirituality.",
    "growth": "AT LEAST 2 paragraphs, personal growth, communication.",
    "health": "AT LEAST 2 paragraphs, health, body, physical balance."
  },
  "milestones": [
    {
      "title": "Milestone title (specific and clear)",
      "window": "exact date range, DAY NUMBER REQUIRED (e.g., March 15 – May 20, 2026)",
      "description": "AT LEAST 3 sentences. What, why, how."
    }
  ]
}

CRITICAL RULES:
1. Keep phase ids exactly. 4 phases, 4 SEPARATE interpretations.
2. Each phase AT LEAST 4 paragraphs.
3. SPECIFIC DATE references REQUIRED: "mid-March", "toward end of April", "early June".
4. Weave dominant themes naturally into the narrative. NOT as separate sections.
5. Reference topTransits list: use transit names and dates for specific predictions.
6. Last paragraph of each phase: reference transit intensity (which periods have heavy challenge transits, when opportunity transits emerge).
7. Each focus area AT LEAST 2 paragraphs.
8. focusAreas: career, relationships, inner life, growth, health — ALL 5 must be filled.
9. milestones: AT LEAST 6, AT MOST 10. Each AT LEAST 3 sentences. DAY NUMBERS required.
10. overview.summary AT LEAST 4 sentences.

ANTI-REPETITION RULES:
11. Do NOT reuse the same opening pattern across 4 phases (question / scenario / observation / reflection).
12. Same transit in 2 phases = DIFFERENT angles.
13. "[Date] effects intensify" AT MOST ONCE.
14. Return ONLY JSON.`;
  },
};
