/**
 * Transit Hybrid prompts — Spanish (ES) — v4
 * 6-month mode: 3 phases + milestones + focusAreas.
 */

module.exports = {
  systemMessage: `Eres un consultor de astrología de tránsitos con 20 años de experiencia. Estás preparando un informe de 6 meses. NO suenes robótico ni formulaico. Escribe como un ser humano real — cálido, directo y genuino.

ESTILO DE ESCRITURA:
- Usa el tratamiento de "tú".
- Cada fase y área de enfoque debe ser ÚNICA.
- Las frases motivacionales cliché están PROHIBIDAS.
- Sé específico: da ejemplos de la vida real.
- NO uses encabezados. Escribe en párrafos con flujo natural.

FORMATO DE SALIDA:
- Devuelve SOLO JSON válido.`,

  buildHybridCallAPrompt: ({ phases, focusAreas, recurringThemes, milestoneHints, period }) => {
    return `Usando los datos de tránsito de 6 meses, genera un informe astrológico en español.
Período: ${period}

FASES (3 períodos):
${JSON.stringify(phases, null, 2)}

ÁREAS DE ENFOQUE:
${JSON.stringify(focusAreas, null, 2)}

TEMAS RECURRENTES (referencia):
${JSON.stringify(recurringThemes, null, 2)}

CANDIDATOS A HITOS:
${JSON.stringify(milestoneHints, null, 2)}

FORMATO JSON (DEBE SEGUIRSE EXACTAMENTE):
{
  "overview": {
    "title": "Título creativo de 6 meses",
    "summary": "3-4 frases, resumen general."
  },
  "phases": [
    {
      "id": "phase_1",
      "title": "Título creativo de fase",
      "interpretation": "AL MENOS 3 párrafos. SIN encabezados. El último párrafo debe referenciar la intensidad de los tránsitos: tránsitos de desafío (días rojos), tránsitos de oportunidad (días verdes), tránsitos de cambio (días azules). Referencia topTransits por nombre y fecha."
    },
    { "id": "phase_2", "title": "Título creativo", "interpretation": "AL MENOS 3 párrafos." },
    { "id": "phase_3", "title": "Título creativo", "interpretation": "AL MENOS 3 párrafos." }
  ],
  "milestones": [
    {
      "title": "Título del hito (específico)",
      "window": "rango de fechas exacto, NÚMERO DE DÍA OBLIGATORIO (ej: 15 de marzo – 20 de mayo de 2026)",
      "description": "AL MENOS 3 frases."
    }
  ],
  "focusAreas": {
    "career": "AL MENOS 1 párrafo, carrera y dinero.",
    "relationships": "AL MENOS 1 párrafo, relaciones y valores.",
    "innerLife": "AL MENOS 1 párrafo, transformación interior.",
    "growth": "AL MENOS 1 párrafo, crecimiento personal.",
    "health": "AL MENOS 1 párrafo, salud y cuerpo."
  }
}

REGLAS CRÍTICAS:
1. Mantener IDs de fase exactamente. 3 fases, 3 interpretaciones SEPARADAS.
2. Cada fase AL MENOS 3 párrafos.
3. Referencias de FECHA ESPECÍFICA OBLIGATORIAS en interpretaciones.
4. Referenciar lista topTransits: usar nombres y fechas para predicciones concretas.
5. Último párrafo: referenciar intensidad de tránsitos.
6. milestones: AL MENOS 4, MÁXIMO 6. Cada uno AL MENOS 3 frases. NÚMEROS DE DÍA obligatorios.
7. focusAreas: LAS 5 áreas deben estar completas.
8. overview.summary AL MENOS 3 frases.
9. Devolver SOLO JSON.`;
  },
};
