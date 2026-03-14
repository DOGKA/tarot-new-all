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

BALANCE DE TONO (CRÍTICO):
- El informe debe tener aproximadamente 60% oportunidad/crecimiento + 40% desafío/advertencia. Un informe totalmente negativo o positivo está PROHIBIDO.
- En tránsitos de oportunidad (trígono, sextil, días verdes), escribe escenarios positivos concretos: ascenso, nueva conexión, ingreso inesperado, avance creativo.
- Incluso en tránsitos de desafío, responde "¿qué construye esto?" Cada párrafo de desafío debe contener al menos una frase de oportunidad.
- Reemplaza advertencias pasivas como "ten cuidado" por sugerencias activas: "haz esto", "aprovecha aquello".

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
      "interpretation": "AL MENOS 3 párrafos. PERSPECTIVA: Presenta la energía principal. Comienza con una PREGUNTA. Último párrafo: intensidad de tránsitos (rojo/verde/azul)."
    },
    {
      "id": "phase_2",
      "title": "Título creativo",
      "interpretation": "AL MENOS 3 párrafos. PERSPECTIVA: Enfócate en puntos de inflexión. Si hay crisis, ofrece solución. Si hay oportunidad, da pasos concretos. Comienza con un ESCENARIO. Patrón DIFERENTE a fase 1."
    },
    {
      "id": "phase_3",
      "title": "Título creativo",
      "interpretation": "AL MENOS 3 párrafos. PERSPECTIVA: Cosecha y cierre. Qué se ganó, qué terminó. Comienza con una OBSERVACIÓN. Tono DIFERENTE a fases anteriores."
    }
  ],
  "milestones": [
    {
      "title": "Título del hito (específico)",
      "window": "rango de fechas exacto, NÚMERO DE DÍA OBLIGATORIO (ej: 15 de marzo – 20 de mayo de 2026)",
      "description": "AL MENOS 3 frases."
    }
  ],
  "focusAreas": {
    "career": "AL MENOS 2 párrafos. Primero: análisis de situación. Segundo: plan de acción concreto.",
    "relationships": "AL MENOS 2 párrafos. Primero: dinámica principal. Segundo: qué hacer y cuándo se abre.",
    "innerLife": "AL MENOS 2 párrafos. Primero: proceso interior. Segundo: pasos concretos de apoyo.",
    "growth": "AL MENOS 2 párrafos. Primero: qué área de crecimiento. Segundo: cómo aprovecharlo.",
    "health": "AL MENOS 2 párrafos. Primero: estado corporal/energético. Segundo: recomendación práctica."
  }
}

REGLAS CRÍTICAS:
1. Mantener IDs de fase exactamente. 3 fases, 3 interpretaciones SEPARADAS.
2. Cada fase AL MENOS 3 párrafos.
3. Referencias de FECHA ESPECÍFICA OBLIGATORIAS en interpretaciones.
4. Referenciar lista topTransits: usar nombres y fechas para predicciones concretas.
5. Último párrafo: referenciar intensidad de tránsitos.
6. milestones: AL MENOS 4, MÁXIMO 6. Cada uno AL MENOS 3 frases. NÚMEROS DE DÍA obligatorios.
7. focusAreas: LAS 5 áreas con AL MENOS 2 PÁRRAFOS cada una.
8. overview.summary AL MENOS 3 frases.

REGLAS ANTI-REPETICIÓN:
9. NO reutilizar el mismo patrón de apertura entre fases (pregunta / escenario / observación).
10. Mismo tránsito en 2 fases = perspectivas DIFERENTES.
11. "[Fecha] los efectos se intensifican" MÁXIMO 1 VEZ.
12. Devolver SOLO JSON.`;
  },
};
