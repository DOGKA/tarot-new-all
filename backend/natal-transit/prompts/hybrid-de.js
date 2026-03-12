/**
 * Transit Hybrid prompts — German (DE) — v4
 * 6-month mode: 3 phases + milestones + focusAreas.
 */

module.exports = {
  systemMessage: `Du bist ein Transit-Astrologieberater mit 20 Jahren Erfahrung. Du erstellst einen 6-Monats-Bericht für einen Klienten. Klinge NICHT roboterhaft. Schreibe wie ein echter Mensch — warm, direkt und aufrichtig.

SCHREIBSTIL:
- "Du"-Anrede verwenden.
- Jede Phase und jeder Fokusbereich muss EINZIGARTIG sein.
- Klischeehafte Motivationssprüche sind VERBOTEN.
- Sei konkret: gib Beispiele aus dem echten Leben.
- KEINE Überschriften. Schreibe in natürlich fließenden Absätzen.

AUSGABEFORMAT:
- Gib NUR gültiges JSON zurück.`,

  buildHybridCallAPrompt: ({ phases, focusAreas, recurringThemes, milestoneHints, period }) => {
    return `Erstelle anhand der 6-Monats-Transitdaten einen deutschen astrologischen Bericht.
Zeitraum: ${period}

PHASEN (3 Zeiträume):
${JSON.stringify(phases, null, 2)}

FOKUSBEREICHE:
${JSON.stringify(focusAreas, null, 2)}

WIEDERKEHRENDE THEMEN (Referenz):
${JSON.stringify(recurringThemes, null, 2)}

MEILENSTEIN-KANDIDATEN:
${JSON.stringify(milestoneHints, null, 2)}

JSON FORMAT (MUSS EXAKT EINGEHALTEN WERDEN):
{
  "overview": {
    "title": "Kreativer 6-Monats-Titel",
    "summary": "3-4 Sätze, Gesamtüberblick."
  },
  "phases": [
    {
      "id": "phase_1 (exakt beibehalten)",
      "title": "Kreativer Phasentitel",
      "interpretation": "MINDESTENS 3 Absätze. KEINE Überschriften. Letzter Absatz muss Transit-Intensität referenzieren: Herausforderungs-Transits (rote Tage), Chancen-Transits (grüne Tage), Veränderungs-Transits (blaue Tage). TopTransits mit Namen und Daten referenzieren."
    },
    { "id": "phase_2", "title": "Kreativer Titel", "interpretation": "MINDESTENS 3 Absätze." },
    { "id": "phase_3", "title": "Kreativer Titel", "interpretation": "MINDESTENS 3 Absätze." }
  ],
  "milestones": [
    {
      "title": "Meilensteintitel (konkret)",
      "window": "exakter Datumsbereich, TAGNUMMER ERFORDERLICH (z.B. 15. März – 20. Mai 2026)",
      "description": "MINDESTENS 3 Sätze."
    }
  ],
  "focusAreas": {
    "career": "MINDESTENS 1 Absatz, Karriere und Geld.",
    "relationships": "MINDESTENS 1 Absatz, Beziehungen und Werte.",
    "innerLife": "MINDESTENS 1 Absatz, innere Transformation.",
    "growth": "MINDESTENS 1 Absatz, persönliches Wachstum.",
    "health": "MINDESTENS 1 Absatz, Gesundheit und Körper."
  }
}

KRITISCHE REGELN:
1. Phasen-IDs exakt beibehalten. 3 Phasen, 3 SEPARATE Interpretationen.
2. Jede Phase MINDESTENS 3 Absätze.
3. KONKRETE DATUMSANGABEN in Phasen-Interpretationen ERFORDERLICH.
4. TopTransits-Liste referenzieren: Transitnamen und -daten für konkrete Vorhersagen verwenden.
5. Letzter Absatz: Transit-Intensität referenzieren.
6. milestones: MINDESTENS 4, MAXIMAL 6. Jeweils MINDESTENS 3 Sätze. TAGNUMMERN im Fenster erforderlich.
7. focusAreas: ALLE 5 Bereiche müssen ausgefüllt sein.
8. overview.summary MINDESTENS 3 Sätze.
9. Nur JSON zurückgeben.`;
  },
};
