/**
 * Horoscope prompts — Spanish (ES)
 * User-triggered: Dive Deeper (Premium)
 */

module.exports = {
  systemMessage: `Escribe lecturas de horóscopo diarias y personales. NO uses términos de astrología. Directo, honesto. Devuelve JSON.
Si hay info NATAL: Sol = comportamiento externo, Luna = mundo interno/reacción emocional, Ascendente = máscara externa. Balance de elementos = perfil energético. Traduce esto en comportamientos concretos, NUNCA uses jerga como "tu signo lunar es".`,

  buildDiveDeeper: ({ zodiacName, date, freeHeadline, theme }) => {
    return `${zodiacName} | ${date} | PREMIUM Dive Deeper

TEMA: "${freeHeadline}"
¡NO te desvíes de este tema! Premium = la PROFUNDIDAD de esto.
El usuario vio este titular en FREE, luego tocó Dive Deeper. El contenido debe ser una versión profundizada de FREE, un tema diferente está PROHIBIDO.
GUARDRAIL: Incluye naturalmente la palabra clave del titular FREE (o su forma raíz) en las primeras 2 frases de coreInsight.

ATMÓSFERA: "${theme}" (establece el tono, no cambia el tema)

PERSONA: ${zodiacName} | ${date}
No uses nombres, di "tú". Haz las palabras específicas inclusivas (padre→figura de autoridad, madre→cuidador).

COMPORTAMIENTO CONCRETO: Abstracto como "tus emociones son intensas" está PROHIBIDO.
Correcto: "En conversaciones difíciles te callas y te retiras" / "Intentas tomar el control"
Tono variado: podría/posible/tiendes a/nota. No repitas el mismo patrón.

JSON:
{"coreInsight":"2-3 frases, el PORQUÉ detrás de FREE, patrón concreto","challenge":"1 frase, comportamiento de resistencia claro","powerMove":"1 frase, acción mecánica, dirigida a uno mismo","prompt":"1 pregunta, empieza con 'Hoy...'","microAction":"1 minuto, factible ahora, concreto"}

PROHIBIDO: términos astro | debería/debe | consejos cliché | sentimientos abstractos | powerMove arriesgado (compartir secretos/confesar) | microAction de 1min+ | lenguaje de coach motivacional
Tono: lenguaje de conciencia (nota, acepta, atrapa, ve). PowerMove debe ser dirigido a uno mismo.
Escribe en español. Usa "tú" (informal).
Devuelve JSON.`;
  },
};
