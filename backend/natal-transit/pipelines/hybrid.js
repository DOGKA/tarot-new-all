/**
 * Hybrid pipeline orchestrator (6 months) — v4
 * 3 phases + top 5 themes + milestones + recurring themes
 *
 * Call A: overview + 3 phases + top themes + milestones
 * Call B: retro AI polish (parallel)
 * Call B fail → graceful degrade
 */

const { getProfile } = require("../shared/periodProfiles");
const { buildBaseTransitModel, selectMilestones, selectTopThemes, assembleOutput } = require("../shared/engine");
const { buildRetroWindows, buildRetroAIPayload, mergeRetroAIResults } = require("../shared/retrogrades");

const AI_TIMEOUT_MS = 120000;

function createHybridPipeline({ openai }) {
  const profile = getProfile(6);
  const hybridPrompts = require("../prompts/hybrid-tr");
  const retroPrompts = require("../prompts/retro-tr");

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

  async function runCallA(baseModel, period, periodText) {
    const aiPayloadPhases = baseModel.phases.map((p) => ({
      id: p.id,
      title: p.title,
      window: p.window,
      dominantThemes: p.dominantThemes,
      clusterSummary: p.clusters.slice(0, 4).map((c) => `${c.label} (skor: ${c.themeScore})`),
    }));

    const topThemes = selectTopThemes([...baseModel.merged], profile.maxThemes)
      .map((c) => ({
        id: c.theme,
        label: c.label,
        maxScore: c.themeScore,
        window: `${c.windowStart} – ${c.windowEnd}`,
        eventCount: c.events.length,
      }));

    const milestoneHints = selectMilestones(baseModel.merged, profile.maxMilestones, baseModel.merged)
      .map((m) => ({ title: m.title, window: m.window, theme: m.theme }));

    const prompt = hybridPrompts.buildHybridCallAPrompt({
      phases: aiPayloadPhases,
      topThemes,
      milestoneHints,
      period: periodText,
    });

    try {
      return await callAI([
        { role: "system", content: hybridPrompts.systemMessage },
        { role: "user", content: prompt },
      ], "Hybrid Call A");
    } catch (e) {
      console.warn(`[Hybrid] Call A failed, retrying...`, e.message);
      try {
        return await callAI([
          { role: "system", content: hybridPrompts.systemMessage },
          { role: "user", content: prompt },
        ], "Hybrid Call A retry");
      } catch (e2) {
        console.error(`[Hybrid] Call A retry also failed:`, e2.message);
        return {};
      }
    }
  }

  async function runCallB(retroWindows, natalPlanets, periodText) {
    if (retroWindows.length === 0) return { retrogrades: [] };

    const retroPayload = buildRetroAIPayload(retroWindows, natalPlanets);
    const prompt = retroPrompts.buildRetroPollishPrompt(retroPayload, periodText);

    try {
      return await callAI([
        { role: "system", content: retroPrompts.systemMessage },
        { role: "user", content: prompt },
      ], "Hybrid Call B (retro)");
    } catch (e) {
      console.warn(`[Hybrid] Call B (retro) failed:`, e.message);
      return null;
    }
  }

  async function generate(timelinePayload, period, periodText, natalPlanets) {
    const startedAt = Date.now();

    console.log(`[Hybrid] Building base model...`);
    const baseModel = buildBaseTransitModel(timelinePayload.events, 6, profile);
    console.log(`[Hybrid] ${baseModel.filtered.length}/${timelinePayload.events.length} events, ${baseModel.merged.length} themes, ${baseModel.phases.length} phases`);

    const retroWindows = buildRetroWindows(timelinePayload.retrogrades, natalPlanets);

    console.log(`[Hybrid] Running Call A + Call B in parallel...`);
    const [aiResultA, aiResultB] = await Promise.all([
      runCallA(baseModel, period, periodText),
      runCallB(retroWindows, natalPlanets, periodText),
    ]);

    const aiCallBFailed = aiResultB === null;
    const finalRetro = aiCallBFailed
      ? retroWindows
      : mergeRetroAIResults(retroWindows, aiResultB?.retrogrades || []);

    const ms = Date.now() - startedAt;
    console.log(`[Hybrid] Pipeline total: ${ms}ms`);

    const response = assembleOutput(profile, period, baseModel, aiResultA, aiResultB, finalRetro);

    response.stats.rawEventCount = timelinePayload.events.length;
    response.stats.filteredEventCount = baseModel.filtered.length;
    response.stats.clusterCount = baseModel.merged.length;
    response.stats.phaseCount = baseModel.phases.length;
    response.stats.retrogradeCount = retroWindows.length;
    response.stats.aiCallCount = aiCallBFailed ? 1 : 2;
    response.stats.aiCallBFailed = aiCallBFailed;
    response.stats.pipelineMs = ms;

    return response;
  }

  return { generate };
}

module.exports = { createHybridPipeline };
