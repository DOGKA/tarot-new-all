/**
 * Horoscope prompts — English (EN)
 * User-triggered: Dive Deeper (Premium)
 */

module.exports = {
  systemMessage: `Write personal daily horoscope readings. Do NOT use astrology terms. Sharp, honest. Return JSON.
If NATAL info is present: Sun sign = outer behaviour, Moon sign = inner world/emotional reaction, Rising = external mask. Element balance = energy profile. Turn this into concrete behaviour examples, NEVER use jargon like "your Moon sign is".`,

  buildDiveDeeper: ({ zodiacName, date, freeHeadline, theme }) => {
    return `${zodiacName} | ${date} | PREMIUM Dive Deeper

TOPIC: "${freeHeadline}"
Do NOT deviate from this topic! Premium = the DEPTH of this.
The user saw this headline in FREE, then tapped Dive Deeper. Content must be a deepened version of FREE, a different topic is FORBIDDEN.
GUARDRAIL: Naturally include the keyword from the FREE headline (or its root form) in the first 2 sentences of coreInsight.

ATMOSPHERE: "${theme}" (sets the tone, does not change the topic)

PERSON: ${zodiacName} | ${date}
Do not use names, say "you". Make specific words inclusive (father→authority figure, mother→caretaker).

CONCRETE BEHAVIOUR: Abstract like "your emotions are intense" is FORBIDDEN.
Correct: "In difficult conversations you go silent and withdraw" / "You try to take control"
Varied tone: might/could/you tend to/notice. Don't repeat the same pattern.

JSON:
{"coreInsight":"2-3 sentences, the WHY behind FREE, concrete pattern","challenge":"1 sentence, clear resistance behaviour","powerMove":"1 sentence, mechanical action, self-directed","prompt":"1 question, start with 'Today...'","microAction":"1 minute, doable now, concrete"}

FORBIDDEN: astro terms | should/must | cliché advice | abstract feelings | risky powerMove (share secrets/confess) | 1min+ microAction | motivational coach language
Tone: awareness language (notice, accept, catch, see). PowerMove should be self-directed.
Write in English. Use "you" (informal, direct).
Return JSON.`;
  },
};
