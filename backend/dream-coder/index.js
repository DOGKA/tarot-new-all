/**
 * Dream Coder — Express Router
 * Mount: app.use("/api/dream", dreamRouter)
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getDreamCoderPrompts: getPrompts } = require("../prompts");

const router = express.Router();

// ============================================
// DATA PATHS
// ============================================
const dataDir = path.join(__dirname, "data");
const pricesPath = path.join(dataDir, "prices.json");
const usersPath = path.join(dataDir, "users.json");

const getReadingsPath = (language = "tr") => {
  const langDir = path.join(dataDir, language);
  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
  const p = path.join(langDir, "readings.json");
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({ readings: [] }), "utf8");
  return p;
};

// ============================================
// DATA HELPERS
// ============================================
const loadJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
};

const saveJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

const pricesData = loadJSON(pricesPath) || {};
const PRICES = pricesData.decode || { A: 10, B: 22, C: 12, UPSELL_SYMBOL: 5 };
const TAROT_PRICES = pricesData.tarot || { single: 6, three: 14, five: 22, yes_no: 6 };
const GEMSTONE_PACKAGES = pricesData.gemstonePackages || [];
const PREMIUM_PLANS = pricesData.premiumSubscription || {};

// ============================================
// USER HELPERS (exported for tarot backend)
// ============================================
const getUsers = () => loadJSON(usersPath) || { users: {} };

const { calculateNatalChart } = require("../utils/moon");

const DEFAULT_BIRTH = { date: "1992-12-07", time: "14:30", city: "Ankara", lat: 39.93, lng: 32.86 };

const DEFAULT_USER = {
  gemstoneBalance: 1000,
  isPremiumSubscriber: false,
  premiumPlan: null,
  premiumExpiresAt: null,
  createdAt: null,
  // Natal chart (pre-calculated for test user)
  birthDate: DEFAULT_BIRTH.date,
  birthTime: DEFAULT_BIRTH.time,
  birthCity: DEFAULT_BIRTH.city,
  birthLatitude: DEFAULT_BIRTH.lat,
  birthLongitude: DEFAULT_BIRTH.lng,
  natalChart: calculateNatalChart({
    birthDate: DEFAULT_BIRTH.date,
    birthTime: DEFAULT_BIRTH.time,
    latitude: DEFAULT_BIRTH.lat,
    longitude: DEFAULT_BIRTH.lng,
  }),
};

const getUser = (deviceId) => {
  const data = getUsers();
  let needsSave = false;

  if (!data.users[deviceId]) {
    data.users[deviceId] = {
      ...DEFAULT_USER,
      createdAt: new Date().toISOString(),
    };
    needsSave = true;
  }

  const user = data.users[deviceId];

  // Backfill natal chart for existing users who don't have it
  if (!user.natalChart && !user.birthDate) {
    user.birthDate = DEFAULT_BIRTH.date;
    user.birthTime = DEFAULT_BIRTH.time;
    user.birthCity = DEFAULT_BIRTH.city;
    user.birthLatitude = DEFAULT_BIRTH.lat;
    user.birthLongitude = DEFAULT_BIRTH.lng;
    user.natalChart = DEFAULT_USER.natalChart;
    needsSave = true;
  }

  // Check premium expiry
  if (user.isPremiumSubscriber && user.premiumExpiresAt) {
    if (new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremiumSubscriber = false;
      user.premiumPlan = null;
      user.premiumExpiresAt = null;
      needsSave = true;
    }
  }

  if (needsSave) saveJSON(usersPath, data);
  return user;
};

const updateUser = (deviceId, updates) => {
  const data = getUsers();
  if (!data.users[deviceId]) {
    data.users[deviceId] = {
      ...DEFAULT_USER,
      createdAt: new Date().toISOString(),
    };
  }
  Object.assign(data.users[deviceId], updates);
  saveJSON(usersPath, data);
  return data.users[deviceId];
};

// Check if user has active premium subscription
const isPremium = (deviceId) => {
  const user = getUser(deviceId);
  return user.isPremiumSubscriber === true;
};

// ============================================
// READINGS HELPERS
// ============================================
const getReadings = (language = "tr") => {
  const data = loadJSON(getReadingsPath(language));
  return data?.readings || [];
};

const addReading = (language, reading) => {
  const p = getReadingsPath(language);
  const data = loadJSON(p) || { readings: [] };
  data.readings.push(reading);
  saveJSON(p, data);
};

const updateReading = (language, readingId, updates) => {
  const p = getReadingsPath(language);
  const data = loadJSON(p) || { readings: [] };
  const idx = data.readings.findIndex((r) => r.id === readingId);
  if (idx === -1) return null;
  Object.assign(data.readings[idx], updates);
  saveJSON(p, data);
  return data.readings[idx];
};

const findReadingByRequestId = (language, requestId) => {
  const readings = getReadings(language);
  return readings.find((r) => r.requestId === requestId) || null;
};

// ============================================
// OpenAI — lazy init (uses parent's env)
// ============================================
let _openai = null;
const getOpenAI = () => {
  if (!_openai) {
    const OpenAI = require("openai");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
};

// ============================================
// GPT CALL HELPER (tek cagri, retry yok, token tasarrufu)
// ============================================
const callGPT = async (systemMsg, userMsg) => {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    temperature: 0.7,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content || "";
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
  return JSON.parse(jsonMatch[1].trim());
};

// ============================================
// VALIDATION
// ============================================
const ALLOWED_MODES = ["A", "B", "C"];
const MAX_DREAM_LENGTH = 300;

const FEELING_TAGS = ["korku", "özlem", "merak", "rahatlık", "utanç", "öfke", "hüzün", "şaşkınlık"];
const LIFE_CONTEXT_TAGS = ["iş", "aşk", "para", "aile", "sağlık", "arkadaşlık", "kayıp", "değişim"];

// ============================================
// POST /decode
// ============================================
router.post("/decode", async (req, res) => {
  try {
    const { mode, dreamText, deviceId, requestId, language } = req.body;
    const feelingTag = req.body.feelingTags || req.body.feelingTag || null;
    const lifeContextTag = req.body.lifeContextTags || req.body.lifeContextTag || null;
    const lang = language || "tr";

    // Validation
    if (!deviceId) return res.status(400).json({ error: "deviceId gerekli" });
    if (!mode || !ALLOWED_MODES.includes(mode)) return res.status(400).json({ error: "Geçersiz mod. A, B veya C olmalı." });
    if (!dreamText || dreamText.length < 20) return res.status(400).json({ error: "Rüya metni en az 20 karakter olmalı." });
    if (dreamText.length > MAX_DREAM_LENGTH) return res.status(400).json({ error: `Rüya metni en fazla ${MAX_DREAM_LENGTH} karakter olabilir.` });

    // Idempotency check
    if (requestId) {
      const existing = findReadingByRequestId(lang, requestId);
      if (existing) return res.json(existing.resultJson);
    }

    // Premium check for mode C (backend users.json OR frontend isPremium flag)
    const clientIsPremium = req.body.isPremium === true;
    if (mode === "C" && !isPremium(deviceId) && !clientIsPremium) {
      return res.status(403).json({
        error: "PREMIUM_REQUIRED",
        message: "Dönüştürme Planı sadece premium aboneler için kullanılabilir.",
      });
    }

    // User & balance
    const user = getUser(deviceId);
    const cost = PRICES[mode] || 10;

    // Check balance
    if (user.gemstoneBalance < cost) {
      return res.status(402).json({
        error: "INSUFFICIENT_GEMSTONES",
        message: "Yetersiz gemstone bakiyesi.",
        required: cost,
        balance: user.gemstoneBalance,
      });
    }
    // Debit
    updateUser(deviceId, { gemstoneBalance: user.gemstoneBalance - cost });

    // Build prompt
    const prompts = getPrompts(lang);
    const promptInput = { dreamText, feelingTag, lifeContextTag };

    let userPrompt;
    if (mode === "A") userPrompt = prompts.buildModeAPrompt(promptInput);
    else if (mode === "B") userPrompt = prompts.buildModeBPrompt(promptInput);
    else userPrompt = prompts.buildModeCPrompt(promptInput);

    // GPT call - main decode
    const resultJson = await callGPT(
      prompts.systemMessage,
      userPrompt
    );

    // GPT call - upsell candidates (A=1 aday, B=3 aday, C=yok)
    let upsellCandidates = [];
    if (mode !== "C") {
      try {
        const upsellPrompt = prompts.buildUpsellAllPrompt({
          dreamText,
          existingBeats: resultJson.beats || [],
          feelingTag,
          lifeContextTag,
        });
        const upsellResult = await callGPT(
          prompts.systemMessage,
          upsellPrompt
        );
        const allCandidates = upsellResult.candidates || [];
        // A mode: only 1 candidate (auto), B mode: all 3 candidates (user picks)
        upsellCandidates = mode === "A" ? allCandidates.slice(0, 1) : allCandidates;
      } catch (err) {
        console.warn("Upsell candidates pre-gen failed:", err.message);
      }
    }

    // Save reading
    const reading = {
      id: crypto.randomUUID(),
      requestId: requestId || null,
      userId: deviceId,
      language: lang,
      mode,
      dreamText,
      feelingTag: feelingTag || null,
      lifeContextTag: lifeContextTag || null,
      wasFree: false,
      gemstoneCost: cost,
      resultJson,
      upsellCandidates,
      upsellUnlocked: false,
      upsellSymbol: null,
      upsellCost: null,
      createdAt: new Date().toISOString(),
    };

    addReading(lang, reading);

    // Log
    console.log(`✓ Dream Decode [${mode}] (${cost}gs) — ${deviceId.substring(0, 8)}...`);

    return res.json({
      readingId: reading.id,
      mode,
      wasFree: false,
      gemstoneCost: cost,
      upsellCandidates,
      ...resultJson,
    });
  } catch (err) {
    console.error("Dream Decode error:", err.message);
    return res.status(500).json({ error: "Dream decode başarısız.", detail: err.message });
  }
});

// ============================================
// Helper: find reading across languages
// ============================================
const findReading = (dreamDecodeId, lang) => {
  let reading = null;
  let readingLang = lang;
  const langReadings = getReadings(lang);
  reading = langReadings.find((r) => r.id === dreamDecodeId);
  if (!reading) {
    for (const searchLang of ["tr", "en", "de", "es"]) {
      const searchReadings = getReadings(searchLang);
      const found = searchReadings.find((r) => r.id === dreamDecodeId);
      if (found) { reading = found; readingLang = searchLang; break; }
    }
  }
  return { reading, readingLang };
};

// ============================================
// POST /upsell-symbol — Seçilen sembolü aç (GPT yok, önceden hazır insight gösterilir)
// ============================================
router.post("/upsell-symbol", async (req, res) => {
  try {
    const { dreamDecodeId, deviceId, selectedSymbol, language } = req.body;
    const lang = language || "tr";

    if (!deviceId) return res.status(400).json({ error: "deviceId gerekli" });
    if (!dreamDecodeId) return res.status(400).json({ error: "dreamDecodeId gerekli" });
    if (!selectedSymbol) return res.status(400).json({ error: "selectedSymbol gerekli" });

    const { reading, readingLang } = findReading(dreamDecodeId, lang);
    if (!reading) return res.status(404).json({ error: "Okuma bulunamadı." });

    // Already unlocked?
    if (reading.upsellUnlocked) {
      return res.json({
        readingId: reading.id,
        upsellSymbol: { symbol: reading.upsellSymbol, insight: reading.upsellInsight || "" },
        alreadyUnlocked: true,
      });
    }

    // Find the pre-generated candidate
    const candidates = reading.upsellCandidates || [];
    const selected = candidates.find((c) => c.symbol === selectedSymbol);
    if (!selected) {
      return res.status(400).json({ error: "Seçilen sembol adaylar arasında bulunamadı." });
    }

    // Check balance
    const user = getUser(deviceId);
    const cost = PRICES.UPSELL_SYMBOL || 5;
    if (user.gemstoneBalance < cost) {
      return res.status(402).json({
        error: "INSUFFICIENT_GEMSTONES",
        message: "Yetersiz gemstone bakiyesi.",
        required: cost,
        balance: user.gemstoneBalance,
      });
    }

    // Debit
    updateUser(deviceId, { gemstoneBalance: user.gemstoneBalance - cost });

    // Use pre-generated insight (no GPT call)
    const upsellResult = {
      symbol: selected.symbol,
      insight: selected.insight,
    };

    // Update reading (meta only, resultJson untouched)
    updateReading(readingLang, dreamDecodeId, {
      upsellUnlocked: true,
      upsellSymbol: selected.symbol,
      upsellInsight: selected.insight,
      upsellCost: cost,
    });

    console.log(`✓ Dream Upsell "${selectedSymbol}" (${cost}gs) — ${deviceId.substring(0, 8)}...`);

    return res.json({
      readingId: dreamDecodeId,
      upsellCost: cost,
      upsellSymbol: upsellResult,
    });
  } catch (err) {
    console.error("Dream Upsell error:", err.message);
    return res.status(500).json({ error: "Upsell başarısız.", detail: err.message });
  }
});

// ============================================
// POST /journal-plus — Kullanicinin journal cevabina kisisel insight
// ============================================
router.post("/journal-plus", async (req, res) => {
  try {
    const { dreamDecodeId, deviceId, journalAnswer, language } = req.body;
    const lang = language || "tr";

    if (!deviceId) return res.status(400).json({ error: "deviceId gerekli" });
    if (!dreamDecodeId) return res.status(400).json({ error: "dreamDecodeId gerekli" });
    if (!journalAnswer || journalAnswer.trim().length < 5) return res.status(400).json({ error: "Cevap en az 5 karakter olmali." });

    const { reading, readingLang } = findReading(dreamDecodeId, lang);
    if (!reading) return res.status(404).json({ error: "Okuma bulunamadi." });

    // Already unlocked?
    if (reading.journalPlusUnlocked) {
      return res.json({
        readingId: reading.id,
        dreamJournalPlus: { answer: reading.journalPlusAnswer, advice: reading.journalPlusInsight || "" },
        alreadyUnlocked: true,
      });
    }

    // Check balance
    const user = getUser(deviceId);
    const cost = PRICES.JOURNAL_PLUS || 5;
    if (user.gemstoneBalance < cost) {
      return res.status(402).json({
        error: "INSUFFICIENT_GEMSTONES",
        message: "Yetersiz gemstone bakiyesi.",
        required: cost,
        balance: user.gemstoneBalance,
      });
    }

    // Debit
    updateUser(deviceId, { gemstoneBalance: user.gemstoneBalance - cost });

    // GPT call — minimal prompt with overall+keywords context (safe formatting)
    const prompts = getPrompts(lang);
    const safeOverall = (reading.resultJson.overall || "").slice(0, 320);
    const safeKeywords = Array.isArray(reading.resultJson.keywords) ? reading.resultJson.keywords.slice(0, 3) : [];
    const jpPrompt = prompts.buildJournalPlusPrompt({
      overall: safeOverall,
      keywords: safeKeywords,
      journalQuestion: reading.resultJson.journal || "",
      journalAnswer: journalAnswer.trim(),
    });

    const gpResult = await callGPT(
      prompts.systemMessage,
      jpPrompt
    );

    const journalPlus = {
      answer: journalAnswer.trim(),
      advice: gpResult.advice || gpResult.insight || "",
    };

    // Update reading (meta only, resultJson untouched)
    updateReading(readingLang, dreamDecodeId, {
      journalPlusUnlocked: true,
      journalPlusAnswer: journalAnswer.trim(),
      journalPlusInsight: gpResult.advice || gpResult.insight || "",
      journalPlusCost: cost,
    });

    console.log(`✓ Dream JournalPlus (${cost}gs) — ${deviceId.substring(0, 8)}...`);

    return res.json({
      readingId: dreamDecodeId,
      journalPlusCost: cost,
      dreamJournalPlus: journalPlus,
    });
  } catch (err) {
    console.error("Dream JournalPlus error:", err.message);
    return res.status(500).json({ error: "JournalPlus basarisiz.", detail: err.message });
  }
});

// ============================================
// GET /user/:deviceId
// ============================================
router.get("/user/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) return res.status(400).json({ error: "deviceId gerekli" });

  const user = getUser(deviceId);
  return res.json({
    deviceId,
    gemstoneBalance: user.gemstoneBalance,
    isPremiumSubscriber: user.isPremiumSubscriber || false,
    premiumPlan: user.premiumPlan || null,
    premiumExpiresAt: user.premiumExpiresAt || null,
    createdAt: user.createdAt,
    // Natal chart
    birthDate: user.birthDate || null,
    birthTime: user.birthTime || null,
    birthCity: user.birthCity || null,
    natalChart: user.natalChart || null,
  });
});

// ============================================
// GET /prices
// ============================================
router.get("/prices", (req, res) => {
  return res.json({
    ...PRICES,
    tarot: TAROT_PRICES,
    packages: GEMSTONE_PACKAGES,
    premiumSubscription: PREMIUM_PLANS,
  });
});

// Export router + shared helpers for tarot backend
router.shared = { getUser, updateUser, isPremium, TAROT_PRICES, PRICES, PREMIUM_PLANS, loadJSON, pricesPath };
module.exports = router;
