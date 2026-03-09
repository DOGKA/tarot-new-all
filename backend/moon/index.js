/**
 * Moon Astro — Express Router
 * Mount: app.use("/api/moon", moonRouter)
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const deepl = require("deepl-node");
const { getTransitions, buildSlots, getMoonPhase, getMoonZodiac, getPlanetOfDay } = require("../utils/moon");
const { getGeneralPrompts } = require("../prompts");
const generalTr = getGeneralPrompts();
const moonPrompt = {
  systemMessage: generalTr.moonSystemMessage,
  buildDailyPrompt: generalTr.buildMoonDailyPrompt,
};

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const deeplKey = process.env.DEEPL_API_KEY || "";
const translator = deeplKey ? new deepl.Translator(deeplKey) : null;
if (!translator) console.warn("[Moon] DEEPL_API_KEY missing — translations disabled");

const translationsPath = path.join(__dirname, "../../tarot-app/moon-translations.json");
const translations = JSON.parse(fs.readFileSync(translationsPath, "utf8"));

const planetsByKey = {};
translations.planets.forEach(p => { planetsByKey[p.key] = p; });
const zodiacByKey = {};
translations.zodiac.forEach(z => { zodiacByKey[z.key] = z; });
const phasesByKey = translations.phases;

const DEEPL_LANGS = { en: "en-US", de: "de", es: "es" };
const FORMALITY_SUPPORTED = ["de", "es"];
const SUPPORTED_LANGS = ["tr", "en", "de", "es"];

const getCachePath = (lang = "tr") => {
  const dir = path.join(__dirname, "../data", lang);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "moon-slots.json");
};

const loadCache = (lang = "tr") => {
  try {
    return JSON.parse(fs.readFileSync(getCachePath(lang), "utf8"));
  } catch {
    return { slots: [], generatedUntil: "2000-01-01T00:00:00.000Z" };
  }
};

const saveCache = (data, lang = "tr") => {
  fs.writeFileSync(getCachePath(lang), JSON.stringify(data, null, 2), "utf8");
};

async function translateContent(content, targetLang) {
  if (!content || !translator || !DEEPL_LANGS[targetLang]) return content;

  const target = DEEPL_LANGS[targetLang];
  const texts = [
    content.planet?.meaning || "",
    content.planet?.advice || "",
    content.zodiac?.meaning || "",
    content.zodiac?.firsat || "",
    content.zodiac?.his || "",
    content.phase?.sentence || "",
    content.phase?.general || "",
    content.phase?.ayna || "",
  ];

  const opts = FORMALITY_SUPPORTED.includes(targetLang) ? { formality: "less" } : {};

  try {
    const results = await translator.translateText(texts, "tr", target, opts);
    return {
      planet: { meaning: results[0].text, advice: results[1].text },
      zodiac: { meaning: results[2].text, firsat: results[3].text, his: results[4].text },
      phase: { sentence: results[5].text, general: results[6].text, ayna: results[7].text },
    };
  } catch (err) {
    console.error(`[Moon] DeepL error (${targetLang}):`, err.message);
    return content;
  }
}

async function generateSlotContent(slot) {
  const planet = planetsByKey[slot.planet];
  const zodiac = zodiacByKey[slot.zodiac];
  const phase = phasesByKey[slot.phase];
  if (!planet || !zodiac || !phase) return null;

  const prompt = moonPrompt.buildDailyPrompt({
    phase: slot.phase, phaseName: phase.name,
    zodiac: slot.zodiac, zodiacName: zodiac.name,
    planet: slot.planet, planetName: planet.name, dayName: planet.day,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: moonPrompt.systemMessage },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    const raw = completion.choices[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`[Moon] ChatGPT error: ${err.message}`);
    return null;
  }
}

// Concurrency lock
let generationLock = null;

// Generation progress tracking
const genProgress = { total: 0, done: 0, phase: null };

// In-memory cron activity log
const moonCronLog = {
  lastRun: null,          // ISO string of last check
  lastAction: null,       // "generated" | "skipped" | "locked"
  remainingAtRun: null,   // hours remaining when cron ran
  lastError: null,
  totalRuns: 0,
};

async function ensureSlots(lang = "tr") {
  // If generation running, wait and return cached result
  if (generationLock) {
    await generationLock;
    return loadCache(lang);
  }

  // Read TR cache (source of truth)
  const trCache = loadCache("tr");
  const now = new Date();

  // Find the last slot's end time — don't regenerate until we're past it
  const lastSlotEnd = trCache.slots.length > 0
    ? new Date(trCache.slots[trCache.slots.length - 1].end).getTime()
    : 0;
  const genUntilMs = new Date(trCache.generatedUntil || "2000-01-01").getTime();
  const trIsValid = trCache.slots.length > 0 && now.getTime() < lastSlotEnd && genUntilMs > now.getTime();

  // If TR is valid, just return the requested lang cache
  if (trIsValid) {
    const c = loadCache(lang);
    if (c.slots.length > 0) return c;
    // Lang cache missing but TR valid — translate on demand
    if (translator && lang !== "tr") {
      const translated = [];
      for (const slot of trCache.slots) {
        translated.push({ ...slot, content: await translateContent(slot.content, lang) });
      }
      const result = { slots: translated, generatedUntil: trCache.generatedUntil };
      saveCache(result, lang);
      return result;
    }
    return trCache;
  }

  // Need generation — acquire lock
  const horizon = new Date(now.getTime() + 72 * 3600000);

  generationLock = (async () => {
    try {
      console.log("[Moon] Generating TR slots...");
      genProgress.phase = "chatgpt";
      genProgress.done = 0;

      // Build content lookup from existing slots
      const contentByCombo = {};
      const existingById = {};
      for (const s of trCache.slots) {
        existingById[s.id] = s;
        if (s.content?.zodiac?.firsat && s.content?.phase?.ayna) {
          contentByCombo[`${s.phase}_${s.zodiac}_${s.planet}`] = s.content;
        }
      }

      // Keep past slots that haven't expired too long ago (last 24h)
      const pastCutoff = now.getTime() - 24 * 3600000;
      const pastSlots = trCache.slots.filter(s => {
        const endMs = new Date(s.end).getTime();
        return endMs <= now.getTime() && endMs >= pastCutoff && s.content;
      });

      // Generate future slots from now → horizon
      const transitions = getTransitions(now, 72);
      const futureSlots = buildSlots(transitions, now, horizon);

      for (const slot of futureSlots) {
        if (existingById[slot.id]) {
          slot.content = existingById[slot.id].content;
        } else {
          const key = `${slot.phase}_${slot.zodiac}_${slot.planet}`;
          if (contentByCombo[key]) slot.content = contentByCombo[key];
        }
      }

      // Merge: past + future, deduplicated by id
      const seenIds = new Set();
      const allSlots = [];
      for (const s of [...pastSlots, ...futureSlots]) {
        if (!seenIds.has(s.id)) { seenIds.add(s.id); allSlots.push(s); }
      }

      const needGen = allSlots.filter(s => !s.content);
      genProgress.total = needGen.length + 3;
      genProgress.done = 0;

      for (const slot of needGen) {
        console.log(`[Moon] ChatGPT → ${slot.phase} + ${slot.zodiac} + ${slot.planet}`);
        slot.content = await generateSlotContent(slot);
        genProgress.done++;
      }

      const genUntil = horizon.toISOString();
      saveCache({ slots: allSlots, generatedUntil: genUntil }, "tr");
      console.log(`[Moon] TR: ${allSlots.length} slots saved (${pastSlots.length} past + ${futureSlots.length} future)`);

      if (translator) {
        genProgress.phase = "deepl";
        for (const tl of ["en", "de", "es"]) {
          console.log(`[Moon] DeepL → ${tl}...`);
          const existingLangCache = loadCache(tl);
          const existingLangById = {};
          existingLangCache.slots.forEach(s => { existingLangById[s.id] = s; });
          const translated = [];
          for (const slot of allSlots) {
            if (existingLangById[slot.id]?.content) {
              translated.push(existingLangById[slot.id]);
            } else {
              translated.push({ ...slot, content: await translateContent(slot.content, tl) });
            }
          }
          saveCache({ slots: translated, generatedUntil: genUntil }, tl);
          console.log(`[Moon] ${tl.toUpperCase()}: done`);
          genProgress.done++;
        }
      }

      genProgress.phase = "done";
    } finally {
      generationLock = null;
    }
  })();

  await generationLock;
  return loadCache(lang);
}

// Proactive buffer check — called by cron and startup
// force=true: regenerate regardless of remaining time
async function checkAndRefreshMoon(force = false) {
  if (generationLock) {
    return { action: "locked" };
  }

  const trCache = loadCache("tr");
  const now = new Date();
  const lastSlotEnd = trCache.slots.length > 0
    ? new Date(trCache.slots[trCache.slots.length - 1].end).getTime()
    : 0;
  const remainingMs = Math.max(0, lastSlotEnd - now.getTime());
  const remainingHours = remainingMs / 3600000;

  if (!force && remainingHours >= 24 && trCache.slots.length > 0) {
    moonCronLog.lastRun = now.toISOString();
    moonCronLog.lastAction = "skipped";
    moonCronLog.remainingAtRun = +remainingHours.toFixed(1);
    moonCronLog.totalRuns++;
    return { action: "skipped", remainingHours: +remainingHours.toFixed(1) };
  }

  // Buffer short or force=true: reset generatedUntil so ensureSlots regenerates
  console.log(`[Moon] checkAndRefreshMoon — buffer ${remainingHours.toFixed(1)}h, regenerating...`);
  const tempCache = { ...trCache, generatedUntil: "2000-01-01T00:00:00.000Z" };
  saveCache(tempCache, "tr");

  try {
    await ensureSlots("tr");
    moonCronLog.lastRun = now.toISOString();
    moonCronLog.lastAction = "generated";
    moonCronLog.remainingAtRun = +remainingHours.toFixed(1);
    moonCronLog.lastError = null;
    moonCronLog.totalRuns++;
    return { action: "generated", previousRemaining: +remainingHours.toFixed(1) };
  } catch (err) {
    moonCronLog.lastError = err.message;
    throw err;
  }
}

function findCurrentSlot(slots, utcNow) {
  const nowMs = utcNow.getTime();
  return slots.find(s =>
    new Date(s.start).getTime() <= nowMs && new Date(s.end).getTime() > nowMs
  ) || null;
}

function findNextTransition(slots, utcNow) {
  const nowMs = utcNow.getTime();
  let earliest = null;
  for (const slot of slots) {
    const endMs = new Date(slot.end).getTime();
    if (endMs > nowMs && (!earliest || endMs < new Date(earliest.time).getTime())) {
      const next = slots.find(s => new Date(s.start).getTime() === endMs);
      if (next) {
        let type = "planet", to = next.planet;
        if (next.zodiac !== slot.zodiac) { type = "zodiac"; to = next.zodiac; }
        if (next.phase !== slot.phase) { type = "phase"; to = next.phase; }
        earliest = { time: slot.end, type, to };
      }
    }
  }
  return earliest;
}

const PHASE_NAMES = {
  tr: translations.phases,
  en: { new_moon: { name: "New Moon" }, waxing_crescent: { name: "Waxing Crescent" }, first_quarter: { name: "First Quarter" }, waxing_gibbous: { name: "Waxing Gibbous" }, full_moon: { name: "Full Moon" }, disseminating_moon: { name: "Disseminating Moon" }, waning_gibbous: { name: "Waning Gibbous" }, last_quarter: { name: "Last Quarter" }, waning_crescent: { name: "Waning Crescent" }, balsamic_moon: { name: "Balsamic Moon" } },
  de: { new_moon: { name: "Neumond" }, waxing_crescent: { name: "Zunehmende Sichel" }, first_quarter: { name: "Erstes Viertel" }, waxing_gibbous: { name: "Zunehmender Mond" }, full_moon: { name: "Vollmond" }, disseminating_moon: { name: "Abnehmender Mond" }, waning_gibbous: { name: "Abnehmender Dreiviertel" }, last_quarter: { name: "Letztes Viertel" }, waning_crescent: { name: "Abnehmende Sichel" }, balsamic_moon: { name: "Balsamischer Mond" } },
  es: { new_moon: { name: "Luna Nueva" }, waxing_crescent: { name: "Luna Creciente" }, first_quarter: { name: "Cuarto Creciente" }, waxing_gibbous: { name: "Gibosa Creciente" }, full_moon: { name: "Luna Llena" }, disseminating_moon: { name: "Luna Diseminante" }, waning_gibbous: { name: "Gibosa Menguante" }, last_quarter: { name: "Cuarto Menguante" }, waning_crescent: { name: "Luna Menguante" }, balsamic_moon: { name: "Luna Balsámica" } },
};

const ZODIAC_NAMES = {
  tr: { aries: { name: "Koç", element: "Ateş" }, taurus: { name: "Boğa", element: "Toprak" }, gemini: { name: "İkizler", element: "Hava" }, cancer: { name: "Yengeç", element: "Su" }, leo: { name: "Aslan", element: "Ateş" }, virgo: { name: "Başak", element: "Toprak" }, libra: { name: "Terazi", element: "Hava" }, scorpio: { name: "Akrep", element: "Su" }, sagittarius: { name: "Yay", element: "Ateş" }, capricorn: { name: "Oğlak", element: "Toprak" }, aquarius: { name: "Kova", element: "Hava" }, pisces: { name: "Balık", element: "Su" } },
  en: { aries: { name: "Aries", element: "Fire" }, taurus: { name: "Taurus", element: "Earth" }, gemini: { name: "Gemini", element: "Air" }, cancer: { name: "Cancer", element: "Water" }, leo: { name: "Leo", element: "Fire" }, virgo: { name: "Virgo", element: "Earth" }, libra: { name: "Libra", element: "Air" }, scorpio: { name: "Scorpio", element: "Water" }, sagittarius: { name: "Sagittarius", element: "Fire" }, capricorn: { name: "Capricorn", element: "Earth" }, aquarius: { name: "Aquarius", element: "Air" }, pisces: { name: "Pisces", element: "Water" } },
  de: { aries: { name: "Widder", element: "Feuer" }, taurus: { name: "Stier", element: "Erde" }, gemini: { name: "Zwillinge", element: "Luft" }, cancer: { name: "Krebs", element: "Wasser" }, leo: { name: "Löwe", element: "Feuer" }, virgo: { name: "Jungfrau", element: "Erde" }, libra: { name: "Waage", element: "Luft" }, scorpio: { name: "Skorpion", element: "Wasser" }, sagittarius: { name: "Schütze", element: "Feuer" }, capricorn: { name: "Steinbock", element: "Erde" }, aquarius: { name: "Wassermann", element: "Luft" }, pisces: { name: "Fische", element: "Wasser" } },
  es: { aries: { name: "Aries", element: "Fuego" }, taurus: { name: "Tauro", element: "Tierra" }, gemini: { name: "Géminis", element: "Aire" }, cancer: { name: "Cáncer", element: "Agua" }, leo: { name: "Leo", element: "Fuego" }, virgo: { name: "Virgo", element: "Tierra" }, libra: { name: "Libra", element: "Aire" }, scorpio: { name: "Escorpio", element: "Agua" }, sagittarius: { name: "Sagitario", element: "Fuego" }, capricorn: { name: "Capricornio", element: "Tierra" }, aquarius: { name: "Acuario", element: "Aire" }, pisces: { name: "Piscis", element: "Agua" } },
};

const PLANET_NAMES = {
  tr: { sun: { name: "Güneş", day: "Pazar" }, moon: { name: "Ay", day: "Pazartesi" }, mars: { name: "Mars", day: "Salı" }, mercury: { name: "Merkür", day: "Çarşamba" }, jupiter: { name: "Jüpiter", day: "Perşembe" }, venus: { name: "Venüs", day: "Cuma" }, saturn: { name: "Satürn", day: "Cumartesi" } },
  en: { sun: { name: "Sun", day: "Sunday" }, moon: { name: "Moon", day: "Monday" }, mars: { name: "Mars", day: "Tuesday" }, mercury: { name: "Mercury", day: "Wednesday" }, jupiter: { name: "Jupiter", day: "Thursday" }, venus: { name: "Venus", day: "Friday" }, saturn: { name: "Saturn", day: "Saturday" } },
  de: { sun: { name: "Sonne", day: "Sonntag" }, moon: { name: "Mond", day: "Montag" }, mars: { name: "Mars", day: "Dienstag" }, mercury: { name: "Merkur", day: "Mittwoch" }, jupiter: { name: "Jupiter", day: "Donnerstag" }, venus: { name: "Venus", day: "Freitag" }, saturn: { name: "Saturn", day: "Samstag" } },
  es: { sun: { name: "Sol", day: "Domingo" }, moon: { name: "Luna", day: "Lunes" }, mars: { name: "Marte", day: "Martes" }, mercury: { name: "Mercurio", day: "Miércoles" }, jupiter: { name: "Júpiter", day: "Jueves" }, venus: { name: "Venus", day: "Viernes" }, saturn: { name: "Saturno", day: "Sábado" } },
};

function enrichSlot(slot, lang = "tr") {
  if (!slot) return null;
  const p = (PHASE_NAMES[lang] || PHASE_NAMES.tr)[slot.phase] || {};
  const z = (ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[slot.zodiac] || {};
  const pl = (PLANET_NAMES[lang] || PLANET_NAMES.tr)[slot.planet] || {};
  return {
    id: slot.id, start: slot.start, end: slot.end,
    phase: { key: slot.phase, name: p.name || slot.phase },
    zodiac: { key: slot.zodiac, name: z.name || slot.zodiac, element: z.element || "" },
    planet: { key: slot.planet, name: pl.name || slot.planet, day: pl.day || "" },
    content: slot.content,
  };
}

// GET /status — cache info for admin panel
router.get("/status", (req, res) => {
  try {
    const trCache = loadCache("tr");
    const slotCount = trCache.slots.length;
    const generatedUntil = trCache.generatedUntil;
    const now = new Date();

    // Remaining time based on last slot end (more accurate than generatedUntil)
    const lastSlotEnd = trCache.slots.length > 0
      ? new Date(trCache.slots[trCache.slots.length - 1].end).getTime()
      : 0;
    const remainingMs = Math.max(0, lastSlotEnd - now.getTime());
    const remainingMin = Math.round(remainingMs / 60000);
    const remainingHours = +(remainingMin / 60).toFixed(1);
    const bufferOk = remainingHours >= 24;

    // Find next transition
    let nextTransitionMs = 0;
    const currentSlot = trCache.slots.length > 0 ? findCurrentSlot(trCache.slots, now) : null;
    if (currentSlot) {
      nextTransitionMs = Math.max(0, new Date(currentSlot.end).getTime() - now.getTime());
    }

    // Content coverage: how many slots have generated content
    const slotsWithContent = trCache.slots.filter(s => !!(s.content?.zodiac?.meaning)).length;

    // Slot list for admin detail view
    const slotList = trCache.slots.map(s => ({
      id: s.id,
      start: s.start,
      end: s.end,
      phase: s.phase,
      zodiac: s.zodiac,
      planet: s.planet,
      hasContent: !!(s.content?.zodiac?.meaning),
      isCurrent: currentSlot?.id === s.id,
    }));

    // Next cron runs: 0,6,12,18 UTC
    const nextCronHours = [0, 6, 12, 18];
    const utcH = now.getUTCHours();
    const utcM = now.getUTCMinutes();
    const nextCronH = nextCronHours.find(h => h > utcH) ?? nextCronHours[0];
    const nextCronDate = new Date(now);
    if (nextCronH <= utcH) nextCronDate.setUTCDate(nextCronDate.getUTCDate() + 1);
    nextCronDate.setUTCHours(nextCronH, 0, 0, 0);

    res.json({
      success: true,
      slotCount,
      generatedUntil,
      remainingMinutes: remainingMin,
      remainingHours,
      nextTransitionMinutes: Math.round(nextTransitionMs / 60000),
      isGenerating: !!generationLock,
      languages: SUPPORTED_LANGS.filter(l => {
        try { const c = loadCache(l); return c.slots.length > 0; } catch { return false; }
      }),
      // Buffer
      bufferOk,
      slotsWithContent,
      // Cron
      cronEnabled: true,
      nextCronRun: nextCronDate.toISOString(),
      lastCronRun: moonCronLog.lastRun,
      lastCronAction: moonCronLog.lastAction,
      lastCronRemainingHours: moonCronLog.remainingAtRun,
      lastCronError: moonCronLog.lastError,
      cronTotalRuns: moonCronLog.totalRuns,
      // Slot detail
      slotList,
      // Generation progress
      genProgress: generationLock ? { total: genProgress.total, done: genProgress.done, phase: genProgress.phase } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /cache — clear all moon slot caches
router.delete("/cache", (req, res) => {
  try {
    for (const lang of SUPPORTED_LANGS) {
      const p = getCachePath(lang);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    console.log("[Moon] Cache cleared (all languages)");
    res.json({ success: true, message: "Moon cache cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/current", async (req, res) => {
  try {
    const lang = SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : "tr";
    const cache = await ensureSlots(lang);
    const utcNow = new Date();
    const currentSlot = findCurrentSlot(cache.slots, utcNow);
    const nextTransition = findNextTransition(cache.slots, utcNow);

    const allSlots = cache.slots.map(s => enrichSlot(s, lang));
    const currentIndex = allSlots.findIndex(s => s.id === currentSlot?.id);

    if (!currentSlot) {
      const phase = getMoonPhase(utcNow);
      const zodiac = getMoonZodiac(utcNow);
      const planet = getPlanetOfDay(utcNow);
      const p = (PHASE_NAMES[lang] || PHASE_NAMES.tr)[phase] || {};
      const z = (ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[zodiac] || {};
      const pl = (PLANET_NAMES[lang] || PLANET_NAMES.tr)[planet] || {};
      return res.json({
        currentSlot: {
          id: "live", start: utcNow.toISOString(), end: utcNow.toISOString(),
          phase: { key: phase, name: p.name }, zodiac: { key: zodiac, name: z.name, element: z.element },
          planet: { key: planet, name: pl.name, day: pl.day }, content: null,
        },
        nextTransition: null,
        allSlots,
        currentIndex: 0,
      });
    }

    res.json({
      currentSlot: enrichSlot(currentSlot, lang),
      nextTransition,
      allSlots,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
    });
  } catch (err) {
    console.error("[Moon] Error:", err);
    res.status(500).json({ error: "Moon data unavailable" });
  }
});

// POST /force-generate — admin: force regenerate moon slots regardless of buffer
router.post("/force-generate", async (req, res) => {
  try {
    const result = await checkAndRefreshMoon(true);
    res.json({
      success: true,
      action: result.action,
      previousRemaining: result.previousRemaining ?? null,
      message: result.action === "generated"
        ? `Moon slots regenerated (was ${result.previousRemaining}h remaining)`
        : result.action === "locked"
        ? "Generation already in progress"
        : "Skipped",
    });
  } catch (err) {
    console.error("[Moon] Force-generate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// CRON: Every 6 hours — proactive buffer check
// Regenerates if remaining < 24h
// ═══════════════════════════════════════════════════════

const cron = require("node-cron");

// 00:00, 06:00, 12:00, 18:00 UTC
cron.schedule("0 0,6,12,18 * * *", async () => {
  console.log("[Moon Cron] 6h buffer check...");
  try {
    const r = await checkAndRefreshMoon(false);
    if (r.action === "generated") {
      console.log(`[Moon Cron] Regenerated (was ${r.previousRemaining}h remaining)`);
    } else if (r.action === "skipped") {
      console.log(`[Moon Cron] Buffer OK (${r.remainingHours}h remaining), skipped`);
    }
  } catch (err) {
    moonCronLog.lastError = err.message;
    console.error("[Moon Cron] Error:", err.message);
  }
}, { timezone: "UTC" });

// Startup: 5s after boot — check buffer proactively
setTimeout(async () => {
  console.log("[Moon] Startup buffer check...");
  try {
    const r = await checkAndRefreshMoon(false);
    console.log(`[Moon] Startup check: action=${r.action}`);
  } catch (err) {
    console.error("[Moon] Startup check error:", err.message);
  }
}, 5000);

module.exports = router;
