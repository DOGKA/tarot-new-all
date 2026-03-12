const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { buildTransitTimeline } = require("./shared/transits");
const { getPlanetPositions } = require("./shared/ephemeris");
const { getProfile } = require("./shared/periodProfiles");

const { createYearlyPipeline } = require("./pipelines/yearly");
const { createHybridPipeline } = require("./pipelines/hybrid");
const { createQuarterlyPipeline } = require("./pipelines/quarterly");
const { createMonthlyPipeline } = require("./pipelines/monthly");

const VALID_TRANSIT_MONTHS = [1, 3, 6, 12];

function createTransitRouter({ openai, getUser, updateUser, isPremium, getFallbackNatalPlanets }) {
  const router = express.Router();
  const backendDataPath = path.join(__dirname, "..", "data");
  const pricesPath = path.join(__dirname, "..", "dream-coder", "data", "prices.json");
  const pricesData = JSON.parse(fs.readFileSync(pricesPath, "utf8"));
  const TRANSIT_PRICES = pricesData.transit || { 1: 15, 3: 30, 6: 50, 12: 75 };

  function getPipeline(periodMonths, lang) {
    if (periodMonths === 12) return createYearlyPipeline({ openai, lang });
    if (periodMonths === 6) return createHybridPipeline({ openai, lang });
    if (periodMonths === 3) return createQuarterlyPipeline({ openai, lang });
    return createMonthlyPipeline({ openai, lang });
  }

  // --- Cache helpers ---

  function getTransitReadingsPath(lang = "tr") {
    return path.join(backendDataPath, lang, "transit-readings.json");
  }

  function getTransitEventsCachePath(lang = "tr") {
    return path.join(backendDataPath, lang, "transit-events-cache.json");
  }

  function loadTransitReadings(lang = "tr") {
    const p = getTransitReadingsPath(lang);
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.warn("[Transit] readings cache read error:", e.message);
    }
    return { readings: {} };
  }

  function saveTransitReadings(cache, lang = "tr") {
    fs.writeFileSync(getTransitReadingsPath(lang), JSON.stringify(cache, null, 2), "utf8");
  }

  function loadTransitEventsCache(lang = "tr") {
    const p = getTransitEventsCachePath(lang);
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.warn("[Transit] events cache read error:", e.message);
    }
    return {};
  }

  function saveTransitEventsCache(cache, lang = "tr") {
    fs.writeFileSync(getTransitEventsCachePath(lang), JSON.stringify(cache, null, 2), "utf8");
  }

  function getTransitCost(months) {
    return TRANSIT_PRICES[String(months)] || 15;
  }

  function normalizeTransitLocations(locations = []) {
    if (!Array.isArray(locations) || locations.length === 0) return [];
    return locations
      .map((l) => ({
        city: String(l.city || "").trim() || "Unknown",
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        utcOffset: Number(l.utcOffset),
        timezone: String(l.timezone || "").trim() || null,
        startDate: l.startDate ? String(l.startDate).slice(0, 10) : null,
        endDate: l.endDate ? String(l.endDate).slice(0, 10) : null,
      }))
      .filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude) && Number.isFinite(l.utcOffset));
  }

  function hashTransitLocations(locations = []) {
    const payload = JSON.stringify(locations);
    return crypto.createHash("sha1").update(payload).digest("hex").slice(0, 10);
  }

  // --- Routes ---

  router.post("/", async (req, res) => {
    try {
      const { deviceId, months = 1, locations = [], lang = "tr" } = req.body;
      const validLang = ["tr", "en", "de", "es"].includes(lang) ? lang : "tr";
      console.log(`[Transit] Request start ${String(deviceId || "").slice(0, 12)}... months=${months} lang=${validLang}`);
      if (!deviceId) return res.status(400).json({ success: false, error: "deviceId required" });

      const periodMonths = parseInt(months, 10);
      if (!VALID_TRANSIT_MONTHS.includes(periodMonths)) {
        return res.status(400).json({ success: false, error: "months must be 1,3,6,12" });
      }

      const normalizedLocations = normalizeTransitLocations(locations);
      if (normalizedLocations.length === 0) {
        return res.status(400).json({
          success: false,
          error: "LOCATIONS_REQUIRED",
          message: "Transit hesaplamasi icin en az 1 konum (city, lat, lon, utcOffset) gerekli",
        });
      }

      const user = getUser(deviceId);
      const gemCost = getTransitCost(periodMonths);
      const requiresPremium = periodMonths >= 3;
      if (requiresPremium && !isPremium(deviceId)) {
        return res.status(402).json({
          success: false,
          error: "PREMIUM_REQUIRED",
          message: "3+ ay transit takvimi icin Premium gerekli",
          requiredMonths: periodMonths,
        });
      }
      if ((user?.gemstoneBalance || 0) < gemCost) {
        return res.status(402).json({
          success: false,
          error: "INSUFFICIENT_GEMSTONES",
          required: gemCost,
          balance: user?.gemstoneBalance || 0,
        });
      }

      const locationsHash = hashTransitLocations(normalizedLocations);
      const cacheKey = `${deviceId}:${periodMonths}:${validLang}:v4:${locationsHash}`;
      const readingsCache = loadTransitReadings(validLang);
      if (readingsCache.readings[cacheKey]) {
        return res.json({
          success: true,
          source: "cache",
          gemCost: 0,
          data: readingsCache.readings[cacheKey].data,
        });
      }

      const chartPlanets = user?.natalChart?.planets || getFallbackNatalPlanets();
      const eventsCache = loadTransitEventsCache(validLang);
      const eventsCacheKey = `${deviceId}:${periodMonths}:v4:${locationsHash}`;
      let timelinePayload = eventsCache[eventsCacheKey]?.payload;
      if (!timelinePayload) {
        timelinePayload = buildTransitTimeline({
          natalPlanets: chartPlanets,
          months: periodMonths,
          locations: normalizedLocations,
        });
        eventsCache[eventsCacheKey] = {
          createdAt: new Date().toISOString(),
          locations: normalizedLocations,
          payload: timelinePayload,
        };
        saveTransitEventsCache(eventsCache, validLang);
      }

      const period = timelinePayload.period;
      const periodText = `${period.start} – ${period.end} (${periodMonths} months)`;
      const profile = getProfile(periodMonths);

      const pipeline = getPipeline(periodMonths, validLang);
      const result = await pipeline.generate(timelinePayload, period, periodText, chartPlanets);

      const data = {
        ...result,
        period,
        months: periodMonths,
        locationsUsed: timelinePayload.locationsUsed || normalizedLocations,
      };

      updateUser(deviceId, { gemstoneBalance: (user?.gemstoneBalance || 0) - gemCost });
      readingsCache.readings[cacheKey] = {
        createdAt: new Date().toISOString(),
        months: periodMonths,
        lang: validLang,
        locationsHash,
        locations: normalizedLocations,
        gemCost,
        data,
      };
      saveTransitReadings(readingsCache, validLang);

      console.log(`[Transit] ${deviceId.substring(0, 12)}... months=${periodMonths} mode=${profile.mode} -${gemCost}gs`);
      return res.json({ success: true, source: "generated", gemCost, data });
    } catch (err) {
      console.error("[Transit] Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get("/:deviceId/status", (req, res) => {
    try {
      const { deviceId } = req.params;
      const lang = ["tr", "en", "de", "es"].includes(req.query.lang) ? req.query.lang : "tr";
      const readings = loadTransitReadings(lang);
      const eventsCache = loadTransitEventsCache(lang);
      const keys = Object.keys(readings.readings).filter((k) => k.startsWith(`${deviceId}:`));

      const sortedReadings = keys
        .map((k) => readings.readings[k])
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const periods = sortedReadings.map((r) => ({
        months: r.months,
        createdAt: r.createdAt,
        themes: r.data?.themes?.length || 0,
        period: r.data?.period || null,
      }));
      const latestReading = sortedReadings[0] || null;

      const user = getUser(deviceId);
      const chartPlanets = user?.natalChart?.planets || getFallbackNatalPlanets();
      const nowPos = getPlanetPositions(new Date(), ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]);
      const samplePositions = Object.entries(nowPos).map(([planet, p]) => ({
        planet,
        sign: p.sign,
        degree: p.degree,
        minute: p.minute,
        retrograde: p.retrograde,
      }));

      const hasAnyCache = periods.length > 0 || Object.keys(eventsCache.items).some((k) => k.startsWith(`${deviceId}:`));
      return res.json({
        success: true,
        hasCache: hasAnyCache,
        periods,
        mockupSnapshot: {
          generatedAt: new Date().toISOString(),
          natalPlanetCount: chartPlanets.length,
          locationsUsed: latestReading?.locations || [],
          currentTransitPositions: samplePositions,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get("/:deviceId/latest", (req, res) => {
    try {
      const { deviceId } = req.params;
      const monthsFilter = Number(req.query.months || 0);
      const lang = ["tr", "en", "de", "es"].includes(req.query.lang) ? req.query.lang : "tr";
      const readings = loadTransitReadings(lang);
      const keys = Object.keys(readings.readings).filter((k) => k.startsWith(`${deviceId}:`));

      const sortedReadings = keys
        .map((k) => readings.readings[k])
        .filter(Boolean)
        .filter((r) => (monthsFilter ? Number(r.months) === monthsFilter : true))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latest = sortedReadings[0];
      if (!latest) {
        return res.status(404).json({ success: false, error: "NOT_FOUND" });
      }

      return res.json({
        success: true,
        data: latest.data,
        createdAt: latest.createdAt,
        months: latest.months,
        source: "cache",
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete("/:deviceId", (req, res) => {
    try {
      const { deviceId } = req.params;
      const lang = ["tr", "en", "de", "es"].includes(req.query.lang) ? req.query.lang : "tr";
      const readings = loadTransitReadings(lang);
      const eventsCache = loadTransitEventsCache(lang);

      let removedReadings = 0;
      Object.keys(readings.readings).forEach((k) => {
        if (k.startsWith(`${deviceId}:`)) {
          delete readings.readings[k];
          removedReadings++;
        }
      });
      saveTransitReadings(readings, lang);

      let removedEvents = 0;
      Object.keys(eventsCache).forEach((k) => {
        if (k.startsWith(`${deviceId}:`)) {
          delete eventsCache[k];
          removedEvents++;
        }
      });
      saveTransitEventsCache(eventsCache, lang);

      return res.json({
        success: true,
        removedReadings,
        removedEvents,
        message: removedReadings || removedEvents
          ? "Transit takip verileri temizlendi."
          : "Temizlenecek transit verisi bulunamadi.",
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createTransitRouter;
