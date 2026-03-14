const express = require("express");
const fs = require("fs");
const path = require("path");

const natalPricesData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dream-coder", "data", "prices.json"), "utf8"));
const NATAL_INTERPRET_COST = natalPricesData.natal?.interpret || 50;
const NATAL_SUPPORTED_LANGS = ["tr", "en", "de", "es"];

const ZODIAC_NAMES_NATAL = {
  tr: { aries: "Koç", taurus: "Boğa", gemini: "İkizler", cancer: "Yengeç", leo: "Aslan", virgo: "Başak", libra: "Terazi", scorpio: "Akrep", sagittarius: "Yay", capricorn: "Oğlak", aquarius: "Kova", pisces: "Balık" },
  en: { aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio", sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces" },
  de: { aries: "Widder", taurus: "Stier", gemini: "Zwillinge", cancer: "Krebs", leo: "Löwe", virgo: "Jungfrau", libra: "Waage", scorpio: "Skorpion", sagittarius: "Schütze", capricorn: "Steinbock", aquarius: "Wassermann", pisces: "Fische" },
  es: { aries: "Aries", taurus: "Tauro", gemini: "Géminis", cancer: "Cáncer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Escorpio", sagittarius: "Sagitario", capricorn: "Capricornio", aquarius: "Acuario", pisces: "Piscis" },
};

// Mock natal chart data for testing
const MOCK_NATAL_CHART = {
  input: { birthDate: "1991-04-24", birthTime: "00:55:00", latitude: 39.92, longitude: 32.85, timezone: "Europe/Istanbul", houseSystem: "placidus" },
  planets: [
    { name: "sun", symbol: "☉", sign: "taurus", degree: 3, minute: 14, house: 3, retrograde: false, lng: 33.23 },
    { name: "moon", symbol: "☽", sign: "virgo", degree: 3, minute: 36, house: 8, retrograde: false, lng: 153.60 },
    { name: "mercury", symbol: "☿", sign: "aries", degree: 18, minute: 48, house: 3, retrograde: true, lng: 18.80 },
    { name: "venus", symbol: "♀", sign: "gemini", degree: 12, minute: 44, house: 5, retrograde: false, lng: 72.73 },
    { name: "mars", symbol: "♂", sign: "cancer", degree: 11, minute: 21, house: 7, retrograde: false, lng: 101.35 },
    { name: "jupiter", symbol: "♃", sign: "leo", degree: 4, minute: 27, house: 7, retrograde: false, lng: 124.45 },
    { name: "saturn", symbol: "♄", sign: "aquarius", degree: 6, minute: 24, house: 1, retrograde: false, lng: 306.40 },
    { name: "uranus", symbol: "♅", sign: "capricorn", degree: 13, minute: 48, house: 1, retrograde: true, lng: 283.80 },
    { name: "neptune", symbol: "♆", sign: "capricorn", degree: 16, minute: 45, house: 1, retrograde: true, lng: 286.75 },
    { name: "pluto", symbol: "♇", sign: "scorpio", degree: 19, minute: 26, house: 10, retrograde: true, lng: 229.43 },
    { name: "north_node", symbol: "☊", sign: "capricorn", degree: 23, minute: 9, house: 1, retrograde: true, lng: 293.15 },
    { name: "south_node", symbol: "☋", sign: "cancer", degree: 23, minute: 9, house: 7, retrograde: true, lng: 113.15 },
    { name: "black_moon", symbol: "⚸", sign: "sagittarius", degree: 29, minute: 46, house: 12, retrograde: false, lng: 269.76 },
    { name: "asc", symbol: "ASC", sign: "capricorn", degree: 11, minute: 17, lng: 281.28 },
    { name: "mc", symbol: "MC", sign: "scorpio", degree: 5, minute: 20, lng: 215.33 },
  ],
};

const SIGN_OFFSETS = { aries: 0, taurus: 30, gemini: 60, cancer: 90, leo: 120, virgo: 150, libra: 180, scorpio: 210, sagittarius: 240, capricorn: 270, aquarius: 300, pisces: 330 };
const SIGN_ELEMENTS = { aries: "fire", taurus: "earth", gemini: "air", cancer: "water", leo: "fire", virgo: "earth", libra: "air", scorpio: "water", sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water" };
const SIGN_MODALITIES = { aries: "cardinal", taurus: "fixed", gemini: "mutable", cancer: "cardinal", leo: "fixed", virgo: "mutable", libra: "cardinal", scorpio: "fixed", sagittarius: "mutable", capricorn: "cardinal", aquarius: "fixed", pisces: "mutable" };

const ASPECT_DEFS = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "opposition", angle: 180, orb: 8 },
  { name: "trine", angle: 120, orb: 8 },
  { name: "square", angle: 90, orb: 7 },
  { name: "sextile", angle: 60, orb: 6 },
];
const ASPECT_PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "north_node", "asc", "mc"];

function getPlanetLongitude(p) {
  if (p.lng != null) return p.lng;
  return (SIGN_OFFSETS[p.sign] || 0) + p.degree + p.minute / 60;
}

function angularDistance(lng1, lng2) {
  let d = Math.abs(lng1 - lng2) % 360;
  return d > 180 ? 360 - d : d;
}

function calculateAspects(planets) {
  const eligible = planets.filter((p) => ASPECT_PLANETS.includes(p.name));
  const aspects = [];
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const a = eligible[i];
      const b = eligible[j];
      const dist = angularDistance(getPlanetLongitude(a), getPlanetLongitude(b));
      for (const asp of ASPECT_DEFS) {
        const diff = Math.abs(dist - asp.angle);
        if (diff <= asp.orb) {
          aspects.push({
            planet1: a.name,
            symbol1: a.symbol,
            planet2: b.name,
            symbol2: b.symbol,
            aspect: asp.name,
            exactDeg: Math.round(dist * 10) / 10,
            orb: Math.round(diff * 10) / 10,
          });
          break;
        }
      }
    }
  }
  aspects.sort((a, b) => a.orb - b.orb);
  return aspects;
}

function findRetrogrades(planets) {
  return planets.filter((p) => p.retrograde && !["south_node", "north_node"].includes(p.name));
}

function findHouseClusters(planets) {
  const houses = {};
  for (const p of planets) {
    if (p.house) {
      if (!houses[p.house]) houses[p.house] = [];
      houses[p.house].push(p.name);
    }
  }
  return Object.entries(houses)
    .filter(([, ps]) => ps.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([h, ps]) => ({ house: parseInt(h, 10), planets: ps, count: ps.length }));
}

function calculateElementBalance(planets) {
  const weighted = { fire: 0, earth: 0, air: 0, water: 0 };
  const personalPlanets = ["sun", "moon", "mercury", "venus", "mars", "asc"];
  for (const p of planets) {
    if (!p.sign || !SIGN_ELEMENTS[p.sign]) continue;
    const el = SIGN_ELEMENTS[p.sign];
    const w = personalPlanets.includes(p.name) ? 2 : 1;
    weighted[el] += w;
  }
  const sorted = Object.entries(weighted).sort((a, b) => b[1] - a[1]);
  return { ...weighted, dominant: sorted[0][0] };
}

function calculateModalityBalance(planets) {
  const counts = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of planets) {
    if (p.sign && SIGN_MODALITIES[p.sign]) counts[SIGN_MODALITIES[p.sign]]++;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { ...counts, dominant: sorted[0][0] };
}

function buildEnrichedNatalContext(planets, lang) {
  const names = ZODIAC_NAMES_NATAL[lang] || ZODIAC_NAMES_NATAL.tr;

  const planetLines = planets.map((p) => {
    const signName = names[p.sign] || p.sign;
    const retro = p.retrograde ? " (R)" : "";
    const houseStr = p.house ? ` | Ev ${p.house}` : "";
    return `${p.symbol} ${p.name}: ${p.degree}°${p.minute}' ${signName}${houseStr}${retro}`;
  }).join("\n");

  const aspects = calculateAspects(planets);
  const topAspects = aspects.slice(0, 8);
  const aspectLines = topAspects.map((a) =>
    `${a.symbol1}${a.planet1} ${a.aspect} ${a.symbol2}${a.planet2} (orb ${a.orb}°)`
  ).join("\n");

  const retrogrades = findRetrogrades(planets);
  const retroLines = retrogrades.map((p) => `${p.symbol} ${p.name} (${names[p.sign] || p.sign})`).join(", ");

  const houseClusters = findHouseClusters(planets);
  const clusterLines = houseClusters.map((c) => `Ev ${c.house}: ${c.planets.join(", ")} (${c.count} gezegen)`).join("\n");

  const elements = calculateElementBalance(planets);
  const modality = calculateModalityBalance(planets);

  return {
    summary: `GEZEGEN KONUMLARI:\n${planetLines}\n\nÖNEMLI AÇILAR (ASPECTS):\n${aspectLines || "Yok"}\n\nRETROGRADE GEZEGENLER:\n${retroLines || "Yok"}\n\nEV YOĞUNLUKLARI:\n${clusterLines || "Yok"}\n\nELEMENT DENGESI: Ateş:${elements.fire} Toprak:${elements.earth} Hava:${elements.air} Su:${elements.water} | Baskın: ${elements.dominant}\nMODALITE: Kardinal:${modality.cardinal} Sabit:${modality.fixed} Değişken:${modality.mutable} | Baskın: ${modality.dominant}`,
    aspects: topAspects,
    retrogrades,
    houseClusters,
    elements,
    modality,
  };
}

function createNatalChartRouter({ openai, calculateNatalChart, getUser, updateUser, getNatalPrompts }) {
  const router = express.Router();
  const backendDataPath = path.join(__dirname, "..", "data");

  function getNatalReadingCachePath(lang) {
    const validLang = NATAL_SUPPORTED_LANGS.includes(lang) ? lang : "tr";
    return path.join(backendDataPath, validLang, "natalchart-readings.json");
  }

  function loadNatalReadingCache(lang) {
    const p = getNatalReadingCachePath(lang);
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.warn(`[Natal] Cache read error (${lang}):`, e.message);
    }
    return { readings: {} };
  }

  function saveNatalReadingCache(lang, cache) {
    const p = getNatalReadingCachePath(lang);
    fs.writeFileSync(p, JSON.stringify(cache, null, 2), "utf8");
  }

  router.post("/calculate", (req, res) => {
    try {
      const { deviceId, birthDate, birthTime, latitude, longitude, birthCity } = req.body;
      if (!deviceId || !birthDate) {
        return res.status(400).json({ success: false, error: "deviceId and birthDate required" });
      }

      const chart = calculateNatalChart({ birthDate, birthTime, latitude, longitude });
      if (!chart) {
        return res.status(400).json({ success: false, error: "Invalid birth date" });
      }

      updateUser(deviceId, {
        birthDate,
        birthTime: birthTime || null,
        birthCity: birthCity || null,
        birthLatitude: latitude || null,
        birthLongitude: longitude || null,
        natalChart: chart,
      });

      console.log(`[Natal] Chart calculated for ${deviceId.substring(0, 12)}... -> sun:${chart.sunSign} moon:${chart.moonSign} ASC:${chart.risingSign || "?"}`);
      return res.json({ success: true, data: chart });
    } catch (err) {
      console.error("[Natal] Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/save", (req, res) => {
    try {
      const { deviceId, chart } = req.body;
      if (!deviceId || !chart?.sunSign) {
        return res.status(400).json({ success: false, error: "deviceId and chart.sunSign required" });
      }

      updateUser(deviceId, { natalChart: chart });
      console.log(`[Natal] Saved for ${deviceId.substring(0, 12)}... -> sun:${chart.sunSign} moon:${chart.moonSign} ASC:${chart.risingSign || "?"}`);
      return res.json({ success: true });
    } catch (err) {
      console.error("[Natal] Save error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/interpret", async (req, res) => {
    try {
      const { deviceId, lang = "tr" } = req.body;
      if (!deviceId) {
        return res.status(400).json({ success: false, error: "deviceId required" });
      }

      const validLang = NATAL_SUPPORTED_LANGS.includes(lang) ? lang : "tr";
      const user = getUser(deviceId);
      const cache = loadNatalReadingCache(validLang);
      if (cache.readings[deviceId]) {
        return res.json({
          success: true,
          data: cache.readings[deviceId].interpretation,
          source: "cache",
          alreadyInterpreted: true,
        });
      }

      if ((user?.gemstoneBalance || 0) < NATAL_INTERPRET_COST) {
        return res.status(402).json({
          success: false,
          error: "INSUFFICIENT_GEMSTONES",
          required: NATAL_INTERPRET_COST,
          balance: user?.gemstoneBalance || 0,
        });
      }

      const chartPlanets = user?.natalChart?.planets || MOCK_NATAL_CHART.planets;
      const enriched = buildEnrichedNatalContext(chartPlanets, validLang);
      const np = getNatalPrompts(validLang);
      const promptText = np.buildNatalInterpret({
        planets: chartPlanets,
        natalSummary: enriched.summary,
        aspects: enriched.aspects,
        retrogrades: enriched.retrogrades,
        houseClusters: enriched.houseClusters,
        elements: enriched.elements,
        modality: enriched.modality,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: np.systemMessage },
          { role: "user", content: promptText },
        ],
        temperature: 0.8,
        max_tokens: 3500,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in GPT response");
      const interpretation = JSON.parse(jsonMatch[0]);

      updateUser(deviceId, { gemstoneBalance: (user?.gemstoneBalance || 0) - NATAL_INTERPRET_COST });
      cache.readings[deviceId] = {
        createdAt: new Date().toISOString(),
        lang: validLang,
        interpretation,
      };
      saveNatalReadingCache(validLang, cache);

      const tokens = completion.usage;
      console.log(`[Natal] Interpretation generated for ${deviceId.substring(0, 12)}... (${validLang}) - ${tokens?.total_tokens || "?"} tokens, -${NATAL_INTERPRET_COST}gs`);

      return res.json({
        success: true,
        data: interpretation,
        source: "generated",
        gemCost: NATAL_INTERPRET_COST,
        tokens: tokens?.total_tokens || null,
      });
    } catch (err) {
      console.error("[Natal] Interpret error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get("/interpret/:deviceId", (req, res) => {
    try {
      const lang = NATAL_SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : "tr";
      const cache = loadNatalReadingCache(lang);
      const reading = cache.readings[req.params.deviceId];
      if (!reading) return res.json({ success: false, exists: false });
      return res.json({
        success: true,
        exists: true,
        data: reading.interpretation,
        createdAt: reading.createdAt,
        lang: reading.lang,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete("/interpret/:deviceId", (req, res) => {
    try {
      const { deviceId } = req.params;
      let deleted = false;
      for (const lang of NATAL_SUPPORTED_LANGS) {
        const cache = loadNatalReadingCache(lang);
        if (cache.readings[deviceId]) {
          delete cache.readings[deviceId];
          saveNatalReadingCache(lang, cache);
          deleted = true;
        }
      }
      console.log(`[Natal] Interpretation deleted for ${deviceId.substring(0, 12)}... (found: ${deleted})`);
      return res.json({ success: true, deleted, message: deleted ? "Natal yorum silindi. Tekrar yorumlatabilirsiniz." : "Silinecek yorum bulunamadı." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get("/mock", (req, res) => {
    return res.json({ success: true, data: MOCK_NATAL_CHART });
  });

  router.get("/:deviceId", (req, res) => {
    try {
      const user = getUser(req.params.deviceId);
      if (!user.natalChart) {
        return res.json({ success: false, error: "No natal chart found" });
      }
      return res.json({
        success: true,
        data: {
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          birthCity: user.birthCity,
          chart: user.natalChart,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = {
  createNatalChartRouter,
  MOCK_NATAL_CHART,
  NATAL_INTERPRET_COST,
  NATAL_SUPPORTED_LANGS,
};
