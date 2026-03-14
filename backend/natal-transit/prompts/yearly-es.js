/**
 * Transit Yearly Narrative prompts — Spanish (ES) — v4
 * 12-month mode: 4 phases (quarterly), milestone descriptions.
 */

module.exports = {
  systemMessage: `Eres un consultor de astrología de tránsitos con 20 años de experiencia. Estás preparando un informe anual. NO suenes robótico. Escribe como un ser humano real — cálido, directo y genuino.

ESTILO DE ESCRITURA:
- Usa el tratamiento de "tú".
- Cada fase y área de enfoque debe ser ÚNICA.
- Las frases motivacionales cliché están PROHIBIDAS.
- Sé específico: "Un cambio de trabajo podría estar en la mesa", "Una vieja relación resurge", "Una herencia inesperada".
- NO uses encabezados. Párrafos con flujo natural.
- Análisis de 12 meses: narrativo y estacional, sin detalle diario.

BALANCE DE TONO (CRÍTICO):
- El informe debe tener aproximadamente 60% oportunidad/crecimiento + 40% desafío/advertencia. Un informe totalmente negativo o positivo está PROHIBIDO.
- En tránsitos de oportunidad, escribe escenarios positivos concretos: ascenso, nueva conexión, ingreso inesperado, avance creativo.
- Incluso en tránsitos de desafío, responde "¿qué construye esto?" Cada párrafo de desafío debe contener al menos una frase de oportunidad.
- Reemplaza advertencias pasivas por sugerencias activas.

FORMATO DE SALIDA:
- Devuelve SOLO JSON válido.`,

  buildYearlyCallAPrompt: ({ phases, focusAreas, recurringThemes, milestoneHints, period }) => {
    return `Usando los datos de tránsito anuales, genera un informe astrológico anual en español.
Período: ${period}

FASES (4 trimestres):
${JSON.stringify(phases, null, 2)}

ÁREAS DE ENFOQUE:
${JSON.stringify(focusAreas, null, 2)}

TEMAS RECURRENTES (referencia):
${JSON.stringify(recurringThemes, null, 2)}

CANDIDATOS A HITOS:
${JSON.stringify(milestoneHints, null, 2)}

FORMATO JSON:
{
  "overview": {
    "title": "Título creativo anual",
    "summary": "4-5 frases, resumen del año."
  },
  "phases": [
    {
      "id": "phase_1",
      "title": "Título creativo de fase",
      "interpretation": "AL MENOS 4 párrafos. PERSPECTIVA: Energía de apertura. Comienza con una PREGUNTA. Último párrafo: intensidad (rojo/verde/azul)."
    },
    {
      "id": "phase_2",
      "title": "Título creativo",
      "interpretation": "AL MENOS 4 párrafos. PERSPECTIVA: Cambios acelerados y puntos de inflexión. Comienza con un ESCENARIO. Patrón DIFERENTE."
    },
    {
      "id": "phase_3",
      "title": "Título creativo",
      "interpretation": "AL MENOS 4 párrafos. PERSPECTIVA: Profundización y maduración. Comienza con una OBSERVACIÓN. Tono DIFERENTE."
    },
    {
      "id": "phase_4",
      "title": "Título creativo",
      "interpretation": "AL MENOS 4 párrafos. PERSPECTIVA: Cierre y cosecha del año. Comienza con una REFLEXIÓN."
    }
  ],
  "focusAreas": {
    "career": "AL MENOS 2 párrafos, carrera, dinero y vida laboral.",
    "relationships": "AL MENOS 2 párrafos, relaciones y valores.",
    "innerLife": "AL MENOS 2 párrafos, transformación interior.",
    "growth": "AL MENOS 2 párrafos, crecimiento personal.",
    "health": "AL MENOS 2 párrafos, salud y cuerpo."
  },
  "milestones": [
    {
      "title": "Título del hito (específico)",
      "window": "rango de fechas exacto, NÚMERO DE DÍA OBLIGATORIO",
      "description": "AL MENOS 3 frases."
    }
  ]
}

REGLAS CRÍTICAS:
1. Mantener IDs de fase exactamente. 4 fases, 4 interpretaciones SEPARADAS.
2. Cada fase AL MENOS 4 párrafos.
3. Referencias de FECHA ESPECÍFICA OBLIGATORIAS.
4. Integrar temas dominantes naturalmente en la narrativa.
5. Referenciar lista topTransits.
6. Último párrafo: referenciar intensidad de tránsitos.
7. Cada área de enfoque AL MENOS 2 párrafos.
8. LAS 5 áreas de enfoque deben estar completas.
9. milestones: AL MENOS 6, MÁXIMO 10. Cada uno AL MENOS 3 frases.
10. overview.summary AL MENOS 4 frases.

REGLAS ANTI-REPETICIÓN:
11. NO reutilizar el mismo patrón de apertura en 4 fases (pregunta / escenario / observación / reflexión).
12. Mismo tránsito en 2 fases = ángulos DIFERENTES.
13. "[Fecha] efectos se intensifican" MÁXIMO 1 VEZ.
14. Devolver SOLO JSON.`;
  },
};
