/**
 * Quarterly pipeline orchestrator (3 months) — v4
 * 2 AI calls: Call A (themes) + Call B (retro polish, parallel).
 *
 * Call A: overview + themes (direction-focused) + milestones
 * Call B: retro AI polish (parallel, graceful degrade)
 */

const { getProfile } = require("../shared/periodProfiles");
const { buildBaseTransitModel, selectMilestones, selectTopThemes, assembleOutput } = require("../shared/engine");
const { buildRetroWindows, buildRetroAIPayload, mergeRetroAIResults } = require("../shared/retrogrades");
const { buildTitle, buildRangeText } = require("../shared/formatters");
const { splitTiers } = require("../shared/clustering");

const AI_TIMEOUT_MS = 120000;

function createQuarterlyPipeline({ openai, lang = "tr" }) {
  const profile = getProfile(3);
  const standardPrompts = require(`../prompts/standard-${lang}`);
  const retroPrompts = require(`../prompts/retro-${lang}`);

  async function callAI(messages, label) {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.75,
        max_tokens: 16000,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} zaman asimi (${AI_TIMEOUT_MS}ms)`)), AI_TIMEOUT_MS)
      ),
    ]);
    const raw = completion.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  async function runCallB(retroWindows, natalPlanets, periodText) {
    if (retroWindows.length === 0) return { retrogrades: [] };

    const retroPayload = buildRetroAIPayload(retroWindows, natalPlanets);
    const prompt = retroPrompts.buildRetroPollishPrompt(retroPayload, periodText);

    try {
      return await callAI([
        { role: "system", content: retroPrompts.systemMessage },
        { role: "user", content: prompt },
      ], "Quarterly Call B (retro)");
    } catch (e) {
      console.warn(`[Quarterly] Call B (retro) failed:`, e.message);
      return null;
    }
  }

  async function runCallA(baseModel, periodText) {
    const topThemes = selectTopThemes([...baseModel.merged], profile.maxThemes);

    const aiPayload = topThemes.map((cluster) => ({
      id: cluster.theme,
      label: cluster.label,
      tier: cluster.themeScore >= 75 ? "critical" : "supportive",
      window: `${cluster.windowStart} – ${cluster.windowEnd}`,
      maxScore: cluster.themeScore,
      drivers: cluster.events.slice(0, 6).map((e) => ({
        title: e.title || buildTitle(e),
        aspect: e.aspect,
        transitPlanet: e.transitPlanet,
        natalPlanet: e.natalPlanet,
        startDate: e.startDate,
        endDate: e.endDate,
        exactDate: e.exactDate,
        score: e.score,
        type: e.type,
      })),
    }));

    const milestoneHints = selectMilestones(baseModel.merged, profile.maxMilestones, baseModel.merged)
      .map((m) => ({ title: m.title, window: m.window, theme: m.theme }));

    const prompt = standardPrompts.buildQuarterlyPrompt
      ? standardPrompts.buildQuarterlyPrompt({ themes: aiPayload, milestoneHints, period: periodText })
      : standardPrompts.buildThemePrompt({ themes: aiPayload, period: periodText, periodMonths: 3 });

    try {
      return await callAI([
        { role: "system", content: standardPrompts.systemMessage },
        { role: "user", content: prompt },
      ], "Quarterly Call A");
    } catch (e) {
      console.warn(`[Quarterly] Call A failed, retrying...`, e.message);
      try {
        return await callAI([
          { role: "system", content: standardPrompts.systemMessage },
          { role: "user", content: prompt },
        ], "Quarterly Call A retry");
      } catch (e2) {
        console.error(`[Quarterly] Call A retry also failed:`, e2.message);
        return {};
      }
    }
  }

  async function generate(timelinePayload, period, periodText, natalPlanets) {
    const startedAt = Date.now();

    console.log(`[Quarterly] Building base model...`);
    const baseModel = buildBaseTransitModel(timelinePayload.events, 3, profile);
    console.log(`[Quarterly] ${baseModel.filtered.length}/${timelinePayload.events.length} events, ${baseModel.merged.length} themes`);

    const retroWindows = buildRetroWindows(timelinePayload.retrogrades, natalPlanets);

    console.log(`[Quarterly] Running Call A + Call B in parallel...`);
    const [aiResultA, aiResultB] = await Promise.all([
      runCallA(baseModel, periodText),
      runCallB(retroWindows, natalPlanets, periodText),
    ]);

    const aiCallBFailed = aiResultB === null;
    const finalRetro = aiCallBFailed
      ? retroWindows
      : mergeRetroAIResults(retroWindows, aiResultB?.retrogrades || []);

    const aiThemes = {};
    (aiResultA?.themes || []).forEach((t) => { aiThemes[t.id] = t; });

    const topThemes = selectTopThemes([...baseModel.merged], profile.maxThemes);
    const outputThemes = topThemes.map((cluster) => {
      const ai = aiThemes[cluster.theme] || {};
      return {
        id: cluster.theme,
        theme: cluster.theme,
        label: cluster.label,
        tier: cluster.themeScore >= 75 ? "critical" : "supportive",
        maxScore: cluster.themeScore,
        window: `${cluster.windowStart} – ${cluster.windowEnd}`,
        title: ai.title || cluster.label,
        summary: ai.summary || "",
        interpretation: ai.interpretation || "",
        intensity: ai.intensity || (cluster.themeScore >= 80 ? "high" : cluster.themeScore >= 50 ? "medium" : "low"),
        events: cluster.events.slice(0, 8).map((e) => ({
          id: e.id,
          type: e.type,
          color: e.color,
          transitPlanet: e.transitPlanet,
          natalPlanet: e.natalPlanet,
          aspect: e.aspect,
          startDate: e.startDate,
          endDate: e.endDate,
          exactDate: e.exactDate,
          score: e.score,
          title: e.title || buildTitle(e),
          rangeText: e.rangeText || buildRangeText(e),
        })),
      };
    });

    const ms = Date.now() - startedAt;
    console.log(`[Quarterly] Pipeline total: ${ms}ms`);

    const response = assembleOutput(profile, period, baseModel, null, null, finalRetro);
    response.themes = outputThemes;

    if (aiResultA?.overview) {
      response.overview = aiResultA.overview;
    } else if (outputThemes.length > 0) {
      response.overview = {
        title: `Önümüzdeki ${period.months || 3} Ayın Yön Haritası`,
        summary: outputThemes.slice(0, 2).map((t) => t.summary).filter(Boolean).join(" ") || "",
      };
    }

    if (aiResultA?.milestones) {
      response.milestones = aiResultA.milestones;
    } else {
      response.milestones = selectMilestones(baseModel.merged, profile.maxMilestones, baseModel.merged);
    }

    response.stats.rawEventCount = timelinePayload.events.length;
    response.stats.filteredEventCount = baseModel.filtered.length;
    response.stats.clusterCount = baseModel.merged.length;
    response.stats.retrogradeCount = retroWindows.length;
    response.stats.aiCallCount = aiCallBFailed ? 1 : 2;
    response.stats.aiCallBFailed = aiCallBFailed;
    response.stats.pipelineMs = ms;

    return response;
  }

  return { generate };
}

module.exports = { createQuarterlyPipeline };
