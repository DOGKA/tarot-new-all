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

TONBALANCE (KRITISCH):
- Der allgemeine emotionale Ton sollte ungefähr 70% Chancen/Wachstum/Öffnung/Positives und 30% Herausforderung/Konfrontation/aufmerksamkeitsbedürftige Bereiche betragen.
- Die Ausgabe darf nie komplett düster und nie komplett rosarot sein. Jede Interpretation muss ein realistisches, aber stärkendes Gefühl vermitteln.
- Bei positiven Transiten nicht nur abstrakte Wohlfühlaussagen machen. Stattdessen konkrete Lebensmöglichkeiten schreiben: erhöhte Sichtbarkeit, neue Bekanntschaften, Entspannung in Beziehungen, unerwartetes Einkommen, kreativer Fluss, Motivationsschub, mutige Entscheidungen, beruflicher Aufstieg.
- Bei herausfordernden Transiten nicht nur Risiko oder Spannung beschreiben. Jeder herausfordernde Absatz muss beide Elemente enthalten:
  1. die Quelle der Spannung oder Blockade
  2. was dieser Prozess dem Charakter, der Bewusstheit oder der Lebensordnung der Person bringen kann
- Jeder Herausforderungsbereich muss einen transformativen Chancensatz enthalten. Der Leser soll nicht nur sehen, worauf zu achten ist, sondern wie er gestärkt aus dieser Phase hervorgehen kann.
- Keine passive, fatalistische oder angsterzeugende Warnsprache verwenden. Vermeide: "sei vorsichtig", "bereite dich auf Druck vor", "eine schwierige Zeit", "negative Auswirkungen möglich".
- Stattdessen aktive und leitende Sprache verwenden: "kläre diesen Bereich", "richte deine Energie hierhin", "lerne Grenzen zu setzen", "nutze diese Chance", "vereinfache deine Entscheidungen bewusst".
- Die Sprache soll keine Angst erzeugen; sie soll Selbsterkenntnis, Selbstvertrauen und Handlungsbereitschaft vermitteln.
- Wenn der Leser den Bericht zu Ende liest, soll er sich nicht verkleinert, verängstigt oder passiv fühlen. Er soll sich klarer, vorbereiteter und stärker fühlen.
- Selbst bei den schwierigsten Transiten soll die Erzählung nicht als "Krisenvorhersage" klingen, sondern aus der Perspektive von "bewusster Steuerung und Transformation" geschrieben sein.

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
      "id": "phase_1",
      "title": "Kreativer Phasentitel",
      "interpretation": "MINDESTENS 3 Absätze. PERSPEKTIVE: Stelle die Hauptenergie dieser Phase vor. Beginne mit einer FRAGE. Letzter Absatz: Transit-Intensität (rot/grün/blau)."
    },
    {
      "id": "phase_2",
      "title": "Kreativer Titel",
      "interpretation": "MINDESTENS 3 Absätze. PERSPEKTIVE: Fokus auf Wendepunkte. Bei Krise: Lösung anbieten. Bei Chance: konkrete Schritte. Beginne mit einem SZENARIO. ANDERES Muster als Phase 1."
    },
    {
      "id": "phase_3",
      "title": "Kreativer Titel",
      "interpretation": "MINDESTENS 3 Absätze. PERSPEKTIVE: Ernte und Abschluss. Was wurde gewonnen, was beendet. Beginne mit einer BEOBACHTUNG. ANDERER Ton als vorherige Phasen."
    }
  ],
  "milestones": [
    {
      "title": "Meilensteintitel (konkret)",
      "window": "exakter Datumsbereich, TAGNUMMER ERFORDERLICH (z.B. 15. März – 20. Mai 2026)",
      "description": "MINDESTENS 3 Sätze."
    }
  ],
  "focusAreas": {
    "career": "MINDESTENS 2 Absätze. Erster: Situationsanalyse. Zweiter: konkreter Aktionsplan.",
    "relationships": "MINDESTENS 2 Absätze. Erster: Hauptdynamik. Zweiter: was tun, wann die Öffnung kommt.",
    "innerLife": "MINDESTENS 2 Absätze. Erster: innerer Prozess. Zweiter: konkrete Unterstützungsschritte.",
    "growth": "MINDESTENS 2 Absätze. Erster: welcher Wachstumsbereich. Zweiter: wie nutzen.",
    "health": "MINDESTENS 2 Absätze. Erster: Körper/Energiezustand. Zweiter: praktische Empfehlung."
  }
}

KRITISCHE REGELN:
1. Phasen-IDs exakt beibehalten. 3 Phasen, 3 SEPARATE Interpretationen.
2. Jede Phase MINDESTENS 3 Absätze.
3. KONKRETE DATUMSANGABEN in Phasen-Interpretationen ERFORDERLICH.
4. TopTransits-Liste referenzieren: Transitnamen und -daten für konkrete Vorhersagen verwenden.
5. Letzter Absatz: Transit-Intensität referenzieren.
6. milestones: MINDESTENS 4, MAXIMAL 6. Jeweils MINDESTENS 3 Sätze. TAGNUMMERN im Fenster erforderlich.
7. focusAreas: ALLE 5 Bereiche mit MINDESTENS 2 ABSÄTZEN.
8. overview.summary MINDESTENS 3 Sätze.

ANTI-WIEDERHOLUNG:
9. NICHT dasselbe Einstiegsmuster über Phasen hinweg verwenden (Frage / Szenario / Beobachtung).
10. Gleicher Transit in 2 Phasen = VERSCHIEDENE Perspektiven.
11. "[Datum] Effekte intensivieren sich" MAXIMAL 1 MAL verwenden.
12. Nur JSON zurückgeben.`;
  },
};
