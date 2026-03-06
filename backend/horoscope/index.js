/**
 * Horoscope — Express Router
 * Mount: app.use("/api/horoscope", horoscopeRouter)
 *
 * Ported from DAILY-HOROSCOPE (Next.js) into Expo backend.
 * - 372-theme cross rotation system (12 phases × 31 themes)
 * - FREE: headline, body, do/dont (ChatGPT + DeepL 4-lang)
 * - PREMIUM: Dive Deeper (coreInsight, challenge, powerMove, prompt, microAction)
 * - File-based JSON cache per language
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const deepl = require("deepl-node");

const { getHoroscopePrompts, getGeneralPrompts } = require("../prompts");

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Shared user/gemstone system (loaded after dream-coder mounts — lazy access)
const pricesPath = path.join(__dirname, "../dream-coder/data/prices.json");
const pricesData = JSON.parse(fs.readFileSync(pricesPath, "utf8"));
const DIVE_DEEPER_COST = pricesData.horoscope?.diveDeeper || 3;

let _sharedHelpers = null;
function getShared() {
  if (!_sharedHelpers) {
    const dreamCoder = require("../dream-coder");
    _sharedHelpers = dreamCoder.shared;
  }
  return _sharedHelpers;
}

const deeplKey = process.env.DEEPL_API_KEY || "";
const translator = deeplKey ? new deepl.Translator(deeplKey) : null;
if (!translator) console.warn("[Horoscope] DEEPL_API_KEY missing — translations disabled");

const DEEPL_LANGS = { en: "en-US", de: "de", es: "es" };
const FORMALITY_SUPPORTED = ["de", "es"];
const SUPPORTED_LANGS = ["tr", "en", "de", "es"];

// ═══════════════════════════════════════════════════════
// ZODIAC DATA
// ═══════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const ZODIAC_INFO = {
  aries:       { symbol: "♈", element: "fire",  dateRange: "21 Mar - 19 Apr" },
  taurus:      { symbol: "♉", element: "earth", dateRange: "20 Apr - 20 May" },
  gemini:      { symbol: "♊", element: "air",   dateRange: "21 May - 20 Jun" },
  cancer:      { symbol: "♋", element: "water", dateRange: "21 Jun - 22 Jul" },
  leo:         { symbol: "♌", element: "fire",  dateRange: "23 Jul - 22 Aug" },
  virgo:       { symbol: "♍", element: "earth", dateRange: "23 Aug - 22 Sep" },
  libra:       { symbol: "♎", element: "air",   dateRange: "23 Sep - 22 Oct" },
  scorpio:     { symbol: "♏", element: "water", dateRange: "23 Oct - 21 Nov" },
  sagittarius: { symbol: "♐", element: "fire",  dateRange: "22 Nov - 21 Dec" },
  capricorn:   { symbol: "♑", element: "earth", dateRange: "22 Dec - 19 Jan" },
  aquarius:    { symbol: "♒", element: "air",   dateRange: "20 Jan - 18 Feb" },
  pisces:      { symbol: "♓", element: "water", dateRange: "19 Feb - 20 Mar" },
};

const ZODIAC_NAMES = {
  tr: { aries: "Koç", taurus: "Boğa", gemini: "İkizler", cancer: "Yengeç", leo: "Aslan", virgo: "Başak", libra: "Terazi", scorpio: "Akrep", sagittarius: "Yay", capricorn: "Oğlak", aquarius: "Kova", pisces: "Balık" },
  en: { aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio", sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces" },
  de: { aries: "Widder", taurus: "Stier", gemini: "Zwillinge", cancer: "Krebs", leo: "Löwe", virgo: "Jungfrau", libra: "Waage", scorpio: "Skorpion", sagittarius: "Schütze", capricorn: "Steinbock", aquarius: "Wassermann", pisces: "Fische" },
  es: { aries: "Aries", taurus: "Tauro", gemini: "Géminis", cancer: "Cáncer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Escorpio", sagittarius: "Sagitario", capricorn: "Capricornio", aquarius: "Acuario", pisces: "Piscis" },
};

// ═══════════════════════════════════════════════════════
// 372-THEME CROSS ROTATION SYSTEM
// ═══════════════════════════════════════════════════════

const DAILY_THEMES = [
  // FAZ 1: TEMEL PSİKOLOJİ (31)
  'İletişim ve söylenmeyen sözler','Sınırlar ve hayır deme','Arzu ve istek','Sabır ve zamanlama',
  'Özgürlük ve bağımsızlık','Güven ve inanç','Kontrol ve bırakma','Ego ve gurur','Merak ve keşif',
  'Disiplin ve odak','Empati ve anlayış','Sezgi ve içgüdü','Hırs ve rekabet','Kabul ve teslimiyet',
  'Risk ve cesaret','Sessizlik ve dinleme','Öfke ve ifade','Korku ve yüzleşme','Sevinç ve kutlama',
  'Üzüntü ve yas','Utanç ve kabullenme','Suçluluk ve onarım','Kıskançlık ve özfarkındalık',
  'Minnet ve şükran','Hayal kırıklığı ve kabul','Umut ve iyimserlik','Kararsızlık ve seçim',
  'Yorgunluk ve yenilenme','Heyecan ve enerji','Denge ve merkez','Dürüstlük ve yalan',
  // FAZ 2: İLİŞKİLER (31)
  'Aile ve kökenler','Anne ile ilişki','Baba ile ilişki','Kardeş dinamikleri','Çocukluk kalıpları',
  'Arkadaşlık ve sadakat','Eski dostlar ve mesafe','Yeni bağlantılar','Güven inşa etmek',
  'Güven kırılması','Romantik çekim','Aşk ve tutku','Partner seçimi','İlişkide güç dengesi',
  'Yakınlık ve mesafe','Cinsellik ve bağ','Bağlanma stilleri','Bağımlı ilişkiler','Sağlıklı sınırlar',
  'Kırgınlık ve onarım','Affetme ve bırakma','Tartışma ve çözüm','Sessiz anlaşmalar',
  'Beklentiler ve gerçeklik','Duygusal destek','Karşılıklı saygı','Vedalar ve ayrılıklar',
  'Eski ilişkilerin gölgesi','Yalnızlık ve kendinle kalma','İlişkide otantiklik','İlişkide büyüme',
  // FAZ 3: KİŞİSEL GELİŞİM (31)
  'Alışkanlıklar ve döngüler','Sabah rutini','Akşam ritüelleri','Enerji yönetimi','Zaman ve öncelik',
  'Hayır demenin gücü','Evet demenin riski','Erteleme ve başlama','Odak ve dikkat',
  'Dağınıklık ve düzen','Mükemmeliyetçilik tuzağı','Yeterince iyi','Özgüven temelleri',
  'Özsaygı ve sınırlar','İç eleştirmen','Kendine şefkat','Başarısızlık ve öğrenme',
  'Zafer ve alçakgönüllülük','Kıyas tuzağı','Kendi yolun','Toplumsal baskı','Otantik seçimler',
  'Motivasyon kaynakları','İç direnç','Disiplini sevmek','Esneklik ve uyum','Tükenmişlik sinyalleri',
  'Yenilenme ve mola','Kutlama ve ödül','Yeni alışkanlık başlatma','Sürdürülebilir sistemler',
  // FAZ 4: SHADOW WORK (31)
  'Gölge benlik nedir','Bastırılan öfke','Bastırılan korku','Bastırılan üzüntü','Reddedilen parçalar',
  'Projeksiyon farkındalığı','Başkasında gördüğün','Savunma mekanizmaları','Kaçınma stratejileri',
  'İnkar ve yüzleşme','Rasyonalizasyon','Travma izleri','Çocukluk yaraları','İç çocuk',
  'Terk edilme yarası','Reddedilme yarası','İhanet yarası','Adaletsizlik yarası','Aşağılanma yarası',
  'Değersizlik inancı','Yetersizlik inancı','Sevilmezlik inancı','Bilinçaltı kalıplar',
  'Tekrarlayan senaryolar','Kendini sabote etme','Duygusal donukluk','Aşırı uyum','Sahte benlik',
  'Karanlıkla tanışma','Gölgeyi kucaklama','Bütünleşme yolculuğu',
  // FAZ 5: İŞ & KARİYER (31)
  'İş ve kimlik','Kariyer yönü','Tutku ve meslek','Performans kaygısı','Görünürlük ve sahne',
  'Otorite ile ilişki','Patron dinamikleri','Meslektaş ilişkileri','Takım çalışması',
  'Liderlik ve sorumluluk','Yetki devretme','Karar verme','Strateji ve planlama','Risk ve fırsat',
  'Rekabet ve işbirliği','Müzakere ve pazarlık','Hayır demek işte','Sınır koymak işte',
  'Terfi ve tanınma','Kıskançlık işte','Başarı korkusu','Başarısızlık korkusu',
  'İmpostör sendromu işte','Değer biçmek kendine','Maaş ve değer','İş-yaşam dengesi',
  'Tükenmişlik işte','Anlam ve iş','Kariyer geçişi','Yeni başlangıçlar işte','İş ve değerler',
  // FAZ 6: PARA & KAYNAKLAR (31)
  'Para ve duygular','Para hikayem','Çocuklukta para','Ailenin para kalıbı','Kıtlık zihniyeti',
  'Bolluk zihniyeti','Hak etme inancı','Para ve değer','Kazanmak ve almak','Harcama kalıpları',
  'Tasarruf ve korku','Cömertlik ve sınır','Borç ve utanç','Finansal özgürlük','Para ve güç',
  'Para ve ilişkiler','Para ve kontrol','Yatırım ve risk','Kayıp korkusu','Açgözlülük farkındalığı',
  'Sahip olma ve bırakma','Maddi güvenlik','Para ve mutluluk','Enflasyon kaygısı','Gelecek planlaması',
  'Para konuşmak','Değer ve fiyat','Zaman vs para','Kaynakları yönetmek','Bollukla barışmak','Para ve özgürlük',
  // FAZ 7: SAĞLIK & BEDEN (31)
  'Beden ve zihin bağı','Bedenini dinlemek','Fiziksel sinyaller','Ağrı ve mesaj','Stres ve beden',
  'Gerginlik haritası','Nefes ve farkındalık','Uyku ve onarım','Uyku sorunları','Enerji döngüleri',
  'Yorgunluk çeşitleri','Hareket ve ruh hali','Egzersiz ve duygular','Beslenme ve duygu',
  'Duygusal yeme','Bağımlılık döngüleri','Kafein ve enerji','Alkol ve kaçış','Detox ve arınma',
  'Kronik stres','Kaygı bedende','Panik ve nefes','Somatik farkındalık','Bedensel hafıza',
  'Gevşeme teknikleri','Doğa ve iyileşme','Dijital detox','Rutin ve ritim','Hastalık ve mesaj',
  'Sağlıkla barışmak','Beden bilgeliği',
  // FAZ 8: YARATICILIK (31)
  'Yaratıcılık nedir','Yaratıcı kimliğin','İfade ve özgürlük','Sanat ve terapi','Yazma ve keşif',
  'Görsel ifade','Müzik ve duygu','Hareket ve dans','Oyun ve yaratıcılık','Çocuk gibi üretmek',
  'Mükemmeliyetçilik bloğu','Yargı korkusu','Sahne korkusu','Görünür olmak','Eleştiri ve yaratıcılık',
  'Reddedilme ve üretim','İlham kaynakları','Yaratıcı blok','Akış hali','Üretkenlik ve anlam',
  'Proje başlatmak','Proje bitirmek','Yarım kalanlar','Miras ve iz bırakmak','Kopya ve özgünlük',
  'Estetik ve zevk','Güzellik arayışı','Kaos ve yaratıcılık','Disiplin ve sanat','Yaratıcı cesaret','Yaratıcı ritüeller',
  // FAZ 9: SOSYAL İMAJ (31)
  'Sosyal maske','Kim olduğunu sanıyorsun','Kim olduğunu biliyorlar','Gerçek ben kimdir',
  'Rol ve kimlik','Anne/baba rolü','Partner rolü','Profesyonel rol','Arkadaş rolü','Rol çatışması',
  'Onay ihtiyacı','Beğenilme arzusu','Reddedilme korkusu sosyal','Sosyal kaygı','Görünürlük ve güç',
  'Statü ve değer','Karşılaştırma oyunu','Sosyal medya ve benlik','İmaj ve gerçeklik','Algı yönetimi',
  'İtibar ve korku','Dedikodu ve yargı','Topluluk ve aidiyet','Dışlanma korkusu','Uyum vs otantiklik',
  'Farklı olmak','Normal nedir','Marjinallik ve güç','Sesini bulmak','Otantik duruş','Sosyal sınırlar',
  // FAZ 10: ZİHİN & DÜŞÜNCE (31)
  'Düşünce kalıpları','Otomatik düşünceler','Negatif önyargı','Felaket senaryoları',
  'Siyah-beyaz düşünme','Aşırı genelleme','Zihin okuma yanılgısı','Kişiselleştirme',
  'Zorunluluk tiranlığı','Etiketleme','Duygusal akıl yürütme','Temel inançlar','Sınırlayıcı inançlar',
  'Güçlendirici inançlar','İnanç dönüşümü','Hikaye anlatıcısı zihin','Anlatıyı değiştirmek',
  'Ruminasyon döngüsü','Kaygı senaryoları','Endişe ve kontrol','Karar paralizi','Bilgi bağımlılığı',
  'Analiz felci','Sezgi vs analiz','Zihinsel netlik','Odak ve dikkat','Zihin dağınıklığı',
  'Meditasyon ve farkındalık','Düşüncelerden uzaklaşmak','Zihinsel özgürlük','Zihinsel hijyen',
  // FAZ 11: ANLAM & AMAÇ (31)
  'Anlam arayışı','Neden buradayım','Değerlerim neler','Değerlerle yaşamak','Değer çatışması',
  'Öncelik ve anlam','Amaç ve yön','Kaybolmuşluk hissi','Boşluk ve anlamsızlık','Varoluşsal kaygı',
  'Ölüm farkındalığı','Sonluluk ve anlam','Miras ve iz','Nesiller arası aktarım','Etik ve doğru',
  'Vicdan ve karar','İyilik ve kötülük','Sorumluluk ve özgürlük','Başkalarına karşı','Dünyaya karşı',
  'Doğaya karşı','Maneviyat ve anlam','İnanç ve şüphe','Ritüel ve anlam','Topluluk ve amaç',
  'Hizmet ve katkı','Etki ve değişim','Küçük vs büyük anlam','Günlük anlam','Anlamı yaşamak','Anlam ve eylem',
  // FAZ 12: KAPANIŞ & YENİDEN DOĞUŞ (31)
  'Kapanış zamanı','Geride kalanlar','Tamamlanmamış işler','Söylenmemiş sözler','Özür ve onarım',
  'Affetme yolculuğu','Kendini affetmek','Başkalarını affetmek','Bırakma pratiği','Tutunduğun ne',
  'Kaybetme ve yas','Geçmişe veda','Eski beni bırakmak','Kim oldum','Ne öğrendim',
  'Minnettarlık listesi','Zorlukların hediyesi','Büyüme noktaları','Güç kazanımları','Zayıflık kabulü',
  'Entegrasyon','Parçaları birleştirmek','Bütünlük hissi','Barış ve kabul','Şimdi ve burada',
  'Geleceğe bakış','Yeni niyet','Yeni vizyon','Yeni döngü','Yeniden doğuş','Bugün başlıyor',
];

const PHASE_NAMES = [
  'Temel Psikoloji','İlişkiler','Kişisel Gelişim','Shadow Work','İş & Kariyer',
  'Para & Kaynaklar','Sağlık & Beden','Yaratıcılık','Sosyal İmaj','Zihin & Düşünce',
  'Anlam & Amaç','Kapanış & Yeniden Doğuş',
];

function getSignIndex(sign) {
  return ZODIAC_SIGNS.indexOf(sign);
}

function getThemeInfoForDate(dateStr, sign) {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const signOffset = sign ? getSignIndex(sign) : 0;
  const baseFazIndex = (dayOfYear + signOffset) % 12;
  const temaInFaz = Math.floor((dayOfYear - 1) / 12) % 31;
  const finalThemeIndex = baseFazIndex * 31 + temaInFaz;
  return {
    theme: DAILY_THEMES[finalThemeIndex],
    fazIndex: baseFazIndex,
    fazName: PHASE_NAMES[baseFazIndex],
    temaInFaz: temaInFaz + 1,
  };
}

function getTodayTheme(date, sign) {
  const info = getThemeInfoForDate(date, sign);
  return `Faz ${info.fazIndex + 1}: ${info.fazName} - "${info.theme}"`;
}

// ═══════════════════════════════════════════════════════
// CACHE SYSTEM
// ═══════════════════════════════════════════════════════

const getCachePath = (lang = "tr") => {
  const dir = path.join(__dirname, "../data", lang);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "horoscopes.json");
};

const loadCache = (lang = "tr") => {
  try {
    return JSON.parse(fs.readFileSync(getCachePath(lang), "utf8"));
  } catch {
    return { dates: {}, lastUpdated: "" };
  }
};

const saveCache = (data, lang = "tr") => {
  fs.writeFileSync(getCachePath(lang), JSON.stringify(data, null, 2), "utf8");
};

// ═══════════════════════════════════════════════════════
// DIVE DEEPER CACHE (per device+sign+date)
// ═══════════════════════════════════════════════════════

const getDiveDeepCachePath = () => {
  const dir = path.join(__dirname, "../data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "dive-deeper-cache.json");
};

const loadDiveDeepCache = () => {
  try {
    return JSON.parse(fs.readFileSync(getDiveDeepCachePath(), "utf8"));
  } catch {
    return {};
  }
};

const saveDiveDeepCache = (data) => {
  fs.writeFileSync(getDiveDeepCachePath(), JSON.stringify(data, null, 2), "utf8");
};

function getDiveDeepKey(deviceId, sign, date) {
  return `${deviceId}:${sign}:${date}`;
}

function getCachedDiveDeep(deviceId, sign, date) {
  const cache = loadDiveDeepCache();
  return cache[getDiveDeepKey(deviceId, sign, date)] || null;
}

function saveDiveDeep(deviceId, sign, date, lang, content) {
  const cache = loadDiveDeepCache();
  cache[getDiveDeepKey(deviceId, sign, date)] = { lang, content, savedAt: new Date().toISOString() };

  // Prune entries older than 4 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 4);
  for (const key of Object.keys(cache)) {
    const parts = key.split(":");
    const entryDate = parts[2]; // YYYY-MM-DD
    if (entryDate && new Date(entryDate) < cutoff) delete cache[key];
  }

  saveDiveDeepCache(cache);
}

function getUTCDate(offsetDays = 0) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().split("T")[0];
}

function getLocalDate(timezoneOffset) {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utcTime + timezoneOffset * 60000);
  return localTime.toISOString().split("T")[0];
}

function isDateCached(date, lang = "tr") {
  const cache = loadCache(lang);
  return !!(cache.dates?.[date]?.horoscopes?.length);
}

// ═══════════════════════════════════════════════════════
// TRANSLATION (DeepL)
// ═══════════════════════════════════════════════════════

async function translateTexts(texts, targetLang) {
  if (!translator || !DEEPL_LANGS[targetLang]) return texts;
  const target = DEEPL_LANGS[targetLang];
  const opts = FORMALITY_SUPPORTED.includes(targetLang) ? { formality: "less" } : {};
  try {
    const results = await translator.translateText(texts, "tr", target, opts);
    return results.map(r => r.text);
  } catch (err) {
    console.error(`[Horoscope] DeepL error (${targetLang}):`, err.message);
    return texts;
  }
}

async function translateFreeHoroscope(turkishData) {
  const result = { tr: turkishData };
  for (const lang of ["en", "de", "es"]) {
    const texts = [
      turkishData.headline,
      turkishData.body,
      ...turkishData.do,
      ...turkishData.dont,
    ];
    const translated = await translateTexts(texts, lang);
    const doCount = turkishData.do.length;
    result[lang] = {
      headline: translated[0],
      body: translated[1],
      do: translated.slice(2, 2 + doCount),
      dont: translated.slice(2 + doCount),
    };
  }
  return result;
}

async function translatePremiumContent(content, targetLang) {
  if (!translator || !DEEPL_LANGS[targetLang]) return content;
  const texts = [content.coreInsight, content.challenge, content.powerMove, content.prompt, content.microAction];
  const translated = await translateTexts(texts, targetLang);
  return {
    coreInsight: translated[0],
    challenge: translated[1],
    powerMove: translated[2],
    prompt: translated[3],
    microAction: translated[4],
  };
}

// ═══════════════════════════════════════════════════════
// CHATGPT GENERATION
// ═══════════════════════════════════════════════════════

async function generateFreeHoroscope(sign, date) {
  const zodiacName = ZODIAC_NAMES.tr[sign] || sign;
  const theme = getThemeInfoForDate(date, sign).theme;
  const gp = getGeneralPrompts();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: gp.horoscopeFreeSystemMessage },
        { role: "user", content: gp.buildHoroscopeFreePrompt({ zodiacName, date, theme }) },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`[Horoscope] ChatGPT error for ${sign}:`, err.message);
    return {
      headline: `${zodiacName} için bugünün mesajı yükleniyor...`,
      body: "Yorum şu anda oluşturulamadı. Lütfen tekrar deneyin.",
      do: ["Sabırlı ol", "Tekrar dene"],
      dont: ["Panik yapmak", "Vazgeçmek"],
    };
  }
}

async function generatePremiumHoroscope(sign, date, lang, freeHeadline, theme, natalChart) {
  const zodiacName = (ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[sign] || sign;
  const hp = getHoroscopePrompts(lang);

  // Build natal context string if available
  let natalContext = "";
  if (natalChart) {
    const sunName = (ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[natalChart.sunSign] || natalChart.sunSign;
    const moonName = (ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[natalChart.moonSign] || natalChart.moonSign;
    const risingName = natalChart.risingSign
      ? ((ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr)[natalChart.risingSign] || natalChart.risingSign)
      : null;
    const el = natalChart.elements || {};
    const dominantEl = el.dominant || "?";

    natalContext = `\nNATAL: ☉${sunName} ☽${moonName}${risingName ? ` ASC:${risingName}` : ""} | Element: ${dominantEl} (🔥${el.fire || 0} 🌍${el.earth || 0} 💨${el.air || 0} 💧${el.water || 0})`;
  }

  try {
    const promptText = hp.buildDiveDeeper({ zodiacName, date, freeHeadline, theme }) + natalContext;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: hp.systemMessage },
        { role: "user", content: promptText },
      ],
      temperature: 0.8,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`[Horoscope] Premium ChatGPT error:`, err.message);
    return {
      coreInsight: "Content could not be loaded. Please try again.",
      challenge: "Be patient.",
      powerMove: "Try again.",
      prompt: "What do you feel today?",
      microAction: "Take 3 deep breaths and try again.",
    };
  }
}

// Generate a full day's horoscopes for all 12 signs
async function generateDayHoroscopes(date) {
  const results = [];
  console.log(`[Horoscope] Generating horoscopes for ${date}...`);

  for (const sign of ZODIAC_SIGNS) {
    console.log(`  - ${sign}`);
    const turkishData = await generateFreeHoroscope(sign, date);
    const translations = await translateFreeHoroscope(turkishData);

    results.push({
      date,
      sign,
      headline: { tr: translations.tr.headline, en: translations.en.headline, de: translations.de.headline, es: translations.es.headline },
      body: { tr: translations.tr.body, en: translations.en.body, de: translations.de.body, es: translations.es.body },
      do: { tr: translations.tr.do, en: translations.en.do, de: translations.de.do, es: translations.es.do },
      dont: { tr: translations.tr.dont, en: translations.en.dont, de: translations.de.dont, es: translations.es.dont },
      theme: getTodayTheme(date, sign),
      createdAt: new Date().toISOString(),
    });

    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

// ═══════════════════════════════════════════════════════
// ROLLING-WINDOW BUFFER HELPERS
// ═══════════════════════════════════════════════════════

// Returns the latest cached date string (YYYY-MM-DD) or null
function getMaxCachedDate() {
  const cache = loadCache("tr");
  const dates = Object.keys(cache.dates || {}).sort();
  return dates[dates.length - 1] || null;
}

// Add n days to a YYYY-MM-DD string
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

// Generate one day, save to each language's own cache file (like Moon Astro)
async function generateAndSaveDay(date) {
  const horoscopes = await generateDayHoroscopes(date); // multi-lang objects
  const now = new Date().toISOString();
  const cutoff = addDays(getUTCDate(0), -2);

  for (const lang of SUPPORTED_LANGS) {
    // Extract language-specific flat records
    const langHoroscopes = horoscopes.map(h => ({
      date: h.date,
      sign: h.sign,
      headline: h.headline[lang] || h.headline.tr,
      body:     h.body[lang]     || h.body.tr,
      do:       h.do[lang]       || h.do.tr,
      dont:     h.dont[lang]     || h.dont.tr,
      theme:    h.theme,
      createdAt: h.createdAt,
    }));

    const cache = loadCache(lang);
    cache.dates[date] = { horoscopes: langHoroscopes, createdAt: now };
    cache.lastUpdated = now;

    // Prune: keep 7-day rolling window
    for (const d of Object.keys(cache.dates)) {
      if (d < cutoff) delete cache.dates[d];
    }

    saveCache(cache, lang);
    console.log(`[Horoscope] ${lang.toUpperCase()} cache saved for ${date} (${langHoroscopes.length} signs)`);
  }

  return horoscopes;
}

// ═══════════════════════════════════════════════════════
// GENERATION LOCK (prevent duplicate generation)
// ═══════════════════════════════════════════════════════

let generationLock = false;

// In-memory cron activity log (survives until server restart)
const cronLog = {
  lastRun: null,        // ISO string of last cron/fill execution
  lastGenerated: [],    // dates generated in last run
  lastSkipped: [],      // dates skipped (already cached) in last run
  lastError: null,      // error message if last run failed
  totalRuns: 0,
};

// ─── checkAndFill(mode) ───────────────────────────────
// mode "startup" : generate 4 days (D-1, D, D+1, D+2)
// mode "cron"    : generate only if maxCached < today+2
// mode "admin"   : same as cron (manual trigger from panel)
// ─────────────────────────────────────────────────────
async function checkAndFill(mode = "cron") {
  if (generationLock) {
    console.log(`[Horoscope] checkAndFill(${mode}) — locked, skipping`);
    return { generated: [], skipped: [], reason: "lock" };
  }

  generationLock = true;
  const generated = [];
  const skipped   = [];

  try {
    let datesToProcess;

    if (mode === "startup") {
      // First-time init: always ensure D-1, D, D+1, D+2 exist
      datesToProcess = [-1, 0, 1, 2].map(n => getUTCDate(n));
      console.log(`[Horoscope] Startup fill: checking ${datesToProcess.join(", ")}`);
    } else {
      // Cron / admin: buffer check
      const maxCached  = getMaxCachedDate();
      const bufferLine = getUTCDate(2); // today+2
      if (maxCached && maxCached >= bufferLine) {
        console.log(`[Horoscope] checkAndFill(${mode}) — buffer OK (maxCached: ${maxCached}), nothing to do`);
        return { generated: [], skipped: [], reason: "buffer_ok", maxCached };
      }
      // Generate 3 days starting from just after the current max
      const from = maxCached ? addDays(maxCached, 1) : getUTCDate(-1);
      datesToProcess = [from, addDays(from, 1), addDays(from, 2)];
      console.log(`[Horoscope] checkAndFill(${mode}) — buffer short (maxCached: ${maxCached || "none"}), generating ${datesToProcess.join(", ")}`);
    }

    for (const date of datesToProcess) {
      if (isDateCached(date, "tr")) {
        skipped.push(date);
        console.log(`[Horoscope]   ${date} — already cached, skip`);
        continue;
      }
      console.log(`[Horoscope]   ${date} — generating...`);
      await generateAndSaveDay(date);
      generated.push(date);
      console.log(`[Horoscope]   ${date} — done`);
    }

    // Update cronLog
    cronLog.lastRun       = new Date().toISOString();
    cronLog.lastGenerated = generated;
    cronLog.lastSkipped   = skipped;
    cronLog.lastError     = null;
    cronLog.totalRuns    += 1;

    console.log(`[Horoscope] checkAndFill(${mode}) complete — generated: [${generated.join(", ")}], skipped: [${skipped.join(", ")}]`);
    return { generated, skipped };
  } catch (err) {
    cronLog.lastError = err.message;
    console.error(`[Horoscope] checkAndFill(${mode}) ERROR:`, err.message);
    throw err;
  } finally {
    generationLock = false;
  }
}

// ═══════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════

// GET /status — cache info for admin panel
router.get("/status", (req, res) => {
  try {
    const cache = loadCache("tr");
    const dates = Object.keys(cache.dates || {}).sort();
    const now   = new Date();
    const today = getUTCDate(0);
    const maxCached  = getMaxCachedDate();
    const bufferLine = getUTCDate(2); // today+2

    const hasToday     = dates.includes(today);
    const hasTomorrow  = dates.includes(getUTCDate(1));
    const hasYesterday = dates.includes(getUTCDate(-1));

    // Count total horoscopes
    let totalHoroscopes = 0;
    for (const d of dates) {
      totalHoroscopes += cache.dates[d]?.horoscopes?.length || 0;
    }

    // Next midnight UTC
    const nextMidnight = new Date(now);
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
    nextMidnight.setUTCHours(0, 0, 0, 0);
    const untilMidnightMs  = nextMidnight.getTime() - now.getTime();
    const untilMidnightMin = Math.round(untilMidnightMs / 60000);

    // Next cron run: 00:05 UTC tomorrow
    const nextCronRun = new Date(nextMidnight);
    nextCronRun.setUTCMinutes(5);

    // Per-date details
    const dateDetails = {};
    const todayStr      = today;
    const yesterdayStr  = getUTCDate(-1);
    const tomorrowStr   = getUTCDate(1);
    const bufferStr     = getUTCDate(2);
    for (const d of dates) {
      let role = "past";
      if (d === yesterdayStr) role = "yesterday";
      else if (d === todayStr) role = "today";
      else if (d === tomorrowStr) role = "tomorrow";
      else if (d === bufferStr) role = "buffer";
      else if (d > bufferStr) role = "future";
      dateDetails[d] = {
        count: cache.dates[d]?.horoscopes?.length || 0,
        createdAt: cache.dates[d]?.createdAt || null,
        role,
      };
    }

    res.json({
      success: true,
      cachedDates: dates,
      totalHoroscopes,
      hasToday,
      hasTomorrow,
      hasYesterday,
      lastUpdated: cache.lastUpdated || null,
      isGenerating: !!generationLock,
      untilNextDayMinutes: untilMidnightMin,
      untilNextDayHours: +(untilMidnightMin / 60).toFixed(1),
      // Buffer status
      bufferOk: !!(maxCached && maxCached >= bufferLine),
      maxCachedDate: maxCached,
      nextCronRun: nextCronRun.toISOString(),
      // Cron log
      cronEnabled: true,
      lastCronRun: cronLog.lastRun,
      lastCronGenerated: cronLog.lastGenerated,
      lastCronSkipped: cronLog.lastSkipped,
      lastCronError: cronLog.lastError,
      cronTotalRuns: cronLog.totalRuns,
      // Per-date detail
      dateDetails,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /cache — clear all horoscope caches
router.delete("/cache", (req, res) => {
  try {
    for (const lang of SUPPORTED_LANGS) {
      const p = getCachePath(lang);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    // Also clear dive deeper cache
    const ddPath = getDiveDeepCachePath();
    if (fs.existsSync(ddPath)) fs.unlinkSync(ddPath);

    console.log("[Horoscope] Cache cleared (all languages + dive deeper)");
    res.json({ success: true, message: "Horoscope cache cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /signs — returns zodiac sign data
router.get("/signs", (req, res) => {
  const lang = SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : "tr";
  const names = ZODIAC_NAMES[lang] || ZODIAC_NAMES.tr;

  const signs = ZODIAC_SIGNS.map(sign => ({
    sign,
    name: names[sign],
    symbol: ZODIAC_INFO[sign].symbol,
    element: ZODIAC_INFO[sign].element,
    dateRange: ZODIAC_INFO[sign].dateRange,
  }));

  res.json({ success: true, data: signs });
});

// POST /free — get cached FREE horoscope for a sign
// Also returns diveDeeper data if user previously purchased it for this sign+date
router.post("/free", (req, res) => {
  try {
    const { sign, lang = "tr", timezoneOffset = 0, day = "today", deviceId } = req.body;

    if (!sign || !ZODIAC_SIGNS.includes(sign)) {
      return res.status(400).json({ success: false, error: "Invalid sign" });
    }

    const validLang = SUPPORTED_LANGS.includes(lang) ? lang : "tr";

    let targetDate;
    const localDate = getLocalDate(timezoneOffset);
    if (day === "yesterday") {
      const d = new Date(localDate);
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().split("T")[0];
    } else if (day === "tomorrow") {
      const d = new Date(localDate);
      d.setDate(d.getDate() + 1);
      targetDate = d.toISOString().split("T")[0];
    } else {
      targetDate = localDate;
    }

    // Load from the language-specific cache file
    const cache = loadCache(validLang);
    const dayData = cache.dates?.[targetDate];

    if (!dayData || !dayData.horoscopes?.length) {
      return res.json({
        success: false,
        error: "No horoscope available for this date. Generate first.",
        date: targetDate,
      });
    }

    const horoscope = dayData.horoscopes.find(h => h.sign === sign);
    if (!horoscope) {
      return res.json({ success: false, error: "Horoscope not found for this sign" });
    }

    // Check if dive deeper exists for this device+sign+date
    let diveDeeper = null;
    if (deviceId) {
      const cached = getCachedDiveDeep(deviceId, sign, targetDate);
      if (cached) {
        diveDeeper = cached.content;
      }
    }

    res.json({
      success: true,
      data: {
        date: horoscope.date,
        sign: horoscope.sign,
        headline: horoscope.headline,
        body:     horoscope.body,
        do:       horoscope.do,
        dont:     horoscope.dont,
        theme:    horoscope.theme,
        diveDeeper,
      },
      source: "cache",
    });
  } catch (err) {
    console.error("[Horoscope] Free error:", err);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

// POST /generate — admin trigger: check buffer and fill if needed
router.post("/generate", async (req, res) => {
  try {
    const result = await checkAndFill("admin");
    const total = result.generated.reduce((s) => s + 12, 0); // 12 signs per day
    res.json({
      success: true,
      message: result.reason === "buffer_ok"
        ? `Buffer already OK (maxCached: ${result.maxCached}). Nothing generated.`
        : `Generated ${result.generated.length} day(s): ${result.generated.join(", ")}`,
      generated: result.generated,
      skipped: result.skipped,
      reason: result.reason || null,
      totalHoroscopes: result.generated.length * 12,
    });
  } catch (err) {
    console.error("[Horoscope] Generate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /premium — Dive Deeper content
// Premium users: 1 free per day (tracked in user DB), then gemstone cost
// Free users: always gemstone cost
// Language: ChatGPT generates directly in target language (no translate)
router.post("/premium", async (req, res) => {
  try {
    const { sign, lang = "tr", day = "today", freeHeadline = "", theme = "", timezoneOffset = 0, deviceId } = req.body;

    if (!sign || !ZODIAC_SIGNS.includes(sign)) {
      return res.status(400).json({ success: false, error: "Invalid sign" });
    }
    if (!deviceId) {
      return res.status(400).json({ success: false, error: "deviceId required" });
    }

    const shared = getShared();
    const user = shared.getUser(deviceId);
    const userIsPremium = user.isPremiumSubscriber === true;
    const validLang = SUPPORTED_LANGS.includes(lang) ? lang : "tr";
    const localDate = getLocalDate(timezoneOffset);

    // Calculate target date based on day parameter
    let targetDate = localDate;
    if (day === "yesterday") {
      const d = new Date(localDate);
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().split("T")[0];
    } else if (day === "tomorrow") {
      const d = new Date(localDate);
      d.setDate(d.getDate() + 1);
      targetDate = d.toISOString().split("T")[0];
    }

    // 1. Check cache first — if already generated, return free (no charge)
    const existingDive = getCachedDiveDeep(deviceId, sign, targetDate);
    if (existingDive) {
      return res.json({
        success: true,
        data: existingDive.content,
        wasFree: true,
        gemCost: 0,
        source: "cache",
      });
    }

    // 2. Payment: premium gets 1 free/day, then gems. Free always pays gems.
    const todayStr = localDate;
    let wasFree = false;
    let gemCost = 0;

    if (userIsPremium) {
      if (user.horoscopeFreeDate === todayStr) {
        if (user.gemstoneBalance < DIVE_DEEPER_COST) {
          return res.status(402).json({
            success: false,
            error: "INSUFFICIENT_GEMSTONES",
            message: "Günlük ücretsiz hakkını kullandın. Gemstone bakiyen yetersiz.",
            required: DIVE_DEEPER_COST,
            balance: user.gemstoneBalance,
          });
        }
        shared.updateUser(deviceId, { gemstoneBalance: user.gemstoneBalance - DIVE_DEEPER_COST });
        gemCost = DIVE_DEEPER_COST;
        console.log(`[Horoscope] Premium 2nd+ dive -${DIVE_DEEPER_COST}gs — ${deviceId.substring(0, 12)}...`);
      } else {
        shared.updateUser(deviceId, { horoscopeFreeDate: todayStr });
        wasFree = true;
        console.log(`[Horoscope] Premium daily free dive — ${deviceId.substring(0, 12)}...`);
      }
    } else {
      if (user.gemstoneBalance < DIVE_DEEPER_COST) {
        return res.status(402).json({
          success: false,
          error: "INSUFFICIENT_GEMSTONES",
          message: "Yetersiz gemstone bakiyesi.",
          required: DIVE_DEEPER_COST,
          balance: user.gemstoneBalance,
        });
      }
      shared.updateUser(deviceId, { gemstoneBalance: user.gemstoneBalance - DIVE_DEEPER_COST });
      gemCost = DIVE_DEEPER_COST;
      console.log(`[Horoscope] Free user dive -${DIVE_DEEPER_COST}gs — ${deviceId.substring(0, 12)}...`);
    }

    // 3. Generate in the user's selected language (with natal chart if available)
    const themeInfo = getTodayTheme(targetDate, sign);
    const userNatal = user.natalChart || null;
    const content = await generatePremiumHoroscope(
      sign,
      targetDate,
      validLang,
      freeHeadline || "Bugünün mesajı",
      theme || themeInfo,
      userNatal
    );

    const diveData = {
      coreInsight: content.coreInsight,
      challenge: content.challenge,
      powerMove: content.powerMove,
      prompt: content.prompt,
      microAction: content.microAction,
    };

    // 4. Save to persistent cache (keyed by device+sign+targetDate)
    saveDiveDeep(deviceId, sign, targetDate, validLang, diveData);

    res.json({
      success: true,
      data: diveData,
      wasFree,
      gemCost,
      source: "generated",
    });
  } catch (err) {
    console.error("[Horoscope] Premium error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// CRON: Daily buffer check at 00:05 UTC
// Generates 3 days only when maxCachedDate < today+2
// ═══════════════════════════════════════════════════════

const cron = require("node-cron");

cron.schedule("5 0 * * *", async () => {
  console.log("[Horoscope Cron] 00:05 UTC — running buffer check...");
  try {
    const result = await checkAndFill("cron");
    if (result.generated && result.generated.length > 0) {
      console.log(`[Horoscope Cron] Generated: ${result.generated.join(", ")}`);
    } else {
      console.log(`[Horoscope Cron] Buffer sufficient (maxCached: ${result.maxCached || "n/a"}), nothing to do.`);
    }
  } catch (err) {
    console.error("[Horoscope Cron] Error:", err.message);
  }
}, { timezone: "UTC" });

// Startup: 4-day init after 3 seconds (give server time to fully boot)
setTimeout(async () => {
  console.log("[Horoscope] Startup fill — checking 4-day buffer...");
  try {
    await checkAndFill("startup");
  } catch (err) {
    console.error("[Horoscope] Startup fill error:", err.message);
  }
}, 3000);

module.exports = router;
