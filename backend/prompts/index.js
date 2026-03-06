/**
 * Prompt Hub — Central export for all prompt categories
 *
 * Categories:
 *   tarot-{lang}       User-triggered tarot card readings
 *   dreamcoder-{lang}  User-triggered dream decode
 *   horoscope-{lang}   User-triggered Dive Deeper (premium)
 *   general-{lang}     Cron/job: Moon Astro + Horoscope FREE batch
 */

// ============================================
// TAROT
// ============================================
const tarotTr = require("./tarot-tr");
const tarotEn = require("./tarot-en");
const tarotDe = require("./tarot-de");
const tarotEs = require("./tarot-es");
const tarotPrompts = { tr: tarotTr, en: tarotEn, de: tarotDe, es: tarotEs };

// ============================================
// DREAM CODER
// ============================================
const dreamcoderTr = require("./dreamcoder-tr");
const dreamcoderEn = require("./dreamcoder-en");
const dreamcoderDe = require("./dreamcoder-de");
const dreamcoderEs = require("./dreamcoder-es");
const dreamcoderPrompts = { tr: dreamcoderTr, en: dreamcoderEn, de: dreamcoderDe, es: dreamcoderEs };

// ============================================
// HOROSCOPE (Dive Deeper — user-triggered)
// ============================================
const horoscopeTr = require("./horoscope-tr");
const horoscopeEn = require("./horoscope-en");
const horoscopeDe = require("./horoscope-de");
const horoscopeEs = require("./horoscope-es");
const horoscopePrompts = { tr: horoscopeTr, en: horoscopeEn, de: horoscopeDe, es: horoscopeEs };

// ============================================
// NATAL CHART (One-time natal interpretation — user-triggered)
// ============================================
const natalTr = require("./natal-tr");
const natalEn = require("./natal-en");
const natalDe = require("./natal-de");
const natalEs = require("./natal-es");
const natalPrompts = { tr: natalTr, en: natalEn, de: natalDe, es: natalEs };

// ============================================
// GENERAL (Moon Astro + Horoscope FREE — cron/job, TR only, DeepL translates)
// ============================================
const generalTr = require("./general-tr");
const generalPrompts = { tr: generalTr };

// ============================================
// GETTERS
// ============================================

const getTarotPrompts = (lang) => tarotPrompts[lang] || tarotPrompts.en;
const getDreamCoderPrompts = (lang) => dreamcoderPrompts[lang] || dreamcoderPrompts.tr;
const getHoroscopePrompts = (lang) => horoscopePrompts[lang] || horoscopePrompts.en;
const getNatalPrompts = (lang) => natalPrompts[lang] || natalPrompts.en;
const getGeneralPrompts = () => generalPrompts.tr;

// ============================================
// BACKWARD COMPAT — Tarot (used by backend/index.js)
// ============================================

const getPrompts = (lang) => getTarotPrompts(lang);

const getSystemMessage = (lang, isRetry = false) => {
  const p = getTarotPrompts(lang);
  return isRetry ? p.retrySystemMessage : p.systemMessage;
};

const buildSinglePrompt = (lang, params) => getTarotPrompts(lang).buildSinglePrompt(params).trim();
const buildPpfPrompt = (lang, params) => getTarotPrompts(lang).buildPpfPrompt(params).trim();
const buildYesNoPrompt = (lang, params) => getTarotPrompts(lang).buildYesNoPrompt(params).trim();
const buildSoaPrompt = (lang, params) => getTarotPrompts(lang).buildSoaPrompt(params).trim();
const buildDestinysEmbracePrompt = (lang, params) => getTarotPrompts(lang).buildDestinysEmbracePrompt(params).trim();
const buildLoveChoicePrompt = (lang, params) => getTarotPrompts(lang).buildLoveChoicePrompt(params).trim();
const buildPathToLovePrompt = (lang, params) => getTarotPrompts(lang).buildPathToLovePrompt(params).trim();
const buildNewMoonPrompt = (lang, params) => getTarotPrompts(lang).buildNewMoonPrompt(params).trim();
const buildFullMoonPrompt = (lang, params) => getTarotPrompts(lang).buildFullMoonPrompt(params).trim();
const buildMbsPrompt = (lang, params) => getTarotPrompts(lang).buildMbsPrompt(params).trim();
const buildCelestialPrompt = (lang, params) => getTarotPrompts(lang).buildCelestialPrompt(params).trim();
const buildCareerClarityPrompt = (lang, params) => getTarotPrompts(lang).buildCareerClarityPrompt(params).trim();
const buildCareerPathGuidePrompt = (lang, params) => getTarotPrompts(lang).buildCareerPathGuidePrompt(params).trim();
const buildNewBusinessPrompt = (lang, params) => getTarotPrompts(lang).buildNewBusinessPrompt(params).trim();
const buildWealthFlowPrompt = (lang, params) => getTarotPrompts(lang).buildWealthFlowPrompt(params).trim();

module.exports = {
  // Category getters
  getTarotPrompts,
  getDreamCoderPrompts,
  getHoroscopePrompts,
  getNatalPrompts,
  getGeneralPrompts,
  // Backward compat (tarot)
  getPrompts,
  getSystemMessage,
  buildSinglePrompt,
  buildPpfPrompt,
  buildYesNoPrompt,
  buildSoaPrompt,
  buildDestinysEmbracePrompt,
  buildLoveChoicePrompt,
  buildPathToLovePrompt,
  buildNewMoonPrompt,
  buildFullMoonPrompt,
  buildMbsPrompt,
  buildCelestialPrompt,
  buildCareerClarityPrompt,
  buildCareerPathGuidePrompt,
  buildNewBusinessPrompt,
  buildWealthFlowPrompt,
};
