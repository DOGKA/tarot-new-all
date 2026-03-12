/**
 * Transit Hybrid prompts — English (EN) — v4
 * 6-month mode: 3 phases + milestones + focusAreas.
 */

module.exports = {
  systemMessage: `You are a transit astrology consultant with 20 years of experience. You're preparing a 6-month report for a client sitting in front of you. Do NOT sound robotic or formulaic. Write like a real human — warm, direct, and genuine.

WRITING STYLE:
- Use "you" address.
- Each phase and focus area must be UNIQUE. Do NOT repeat patterns.
- Cliché motivational phrases are FORBIDDEN.
- Be specific: give real-life examples.
- Do NOT use headings. Write in natural flowing paragraphs.
- For 6-month analysis: balance between macro trends and specific period clues.

OUTPUT FORMAT:
- Return ONLY valid JSON, nothing else.`,

  buildHybridCallAPrompt: ({ phases, focusAreas, recurringThemes, milestoneHints, period }) => {
    return `Using the 6-month transit data below, generate an English astrological report.
Period: ${period}

PHASES (3 periods):
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
    "title": "Creative 6-month title",
    "summary": "3-4 sentences, general overview. Specific and impactful."
  },
  "phases": [
    {
      "id": "phase_1",
      "title": "Creative phase title",
      "interpretation": "AT LEAST 3 paragraphs. NO headings. Last paragraph must reference transit intensity: which periods have heavy challenge transits (red days), when opportunity transits kick in (green days), when change transits peak (blue days). Reference topTransits by name and date."
    },
    { "id": "phase_2", "title": "Creative title", "interpretation": "AT LEAST 3 paragraphs." },
    { "id": "phase_3", "title": "Creative title", "interpretation": "AT LEAST 3 paragraphs." }
  ],
  "milestones": [
    {
      "title": "Milestone title (specific)",
      "window": "exact date range, DAY NUMBER REQUIRED (e.g., March 15 – May 20, 2026)",
      "description": "AT LEAST 3 sentences. What will happen, why it matters, how it will affect you."
    }
  ],
  "focusAreas": {
    "career": "AT LEAST 1 paragraph, career and money interpretation.",
    "relationships": "AT LEAST 1 paragraph, relationships and values.",
    "innerLife": "AT LEAST 1 paragraph, inner transformation.",
    "growth": "AT LEAST 1 paragraph, personal growth.",
    "health": "AT LEAST 1 paragraph, health and body."
  }
}

CRITICAL RULES:
1. Keep phase ids exactly. 3 phases, 3 SEPARATE interpretations.
2. Each phase AT LEAST 3 paragraphs.
3. SPECIFIC DATE references REQUIRED in phase interpretations.
4. Reference topTransits list: use transit names and dates for specific predictions.
5. Last paragraph of each phase must reference transit intensity (challenge/opportunity/change colors).
6. milestones: AT LEAST 4, AT MOST 6. Each with AT LEAST 3 sentences. DAY NUMBERS required in window.
7. focusAreas: ALL 5 areas must be filled.
8. overview.summary AT LEAST 3 sentences.
9. Return ONLY JSON.`;
  },
};
