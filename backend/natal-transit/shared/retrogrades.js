/**
 * Template-hybrid retrograde engine.
 * Katman 1: Template pool (tum periodlar)
 * Katman 2: Natal resonance mapping (deterministic, tum periodlar)
 * Katman 3: AI polish (Call B, sadece 6+12 ay — handled in pipeline orchestrators)
 */

const ZODIAC_LABELS_TR = {
  aries: "Koç", taurus: "Boğa", gemini: "İkizler", cancer: "Yengeç",
  leo: "Aslan", virgo: "Başak", libra: "Terazi", scorpio: "Akrep",
  sagittarius: "Yay", capricorn: "Oğlak", aquarius: "Kova", pisces: "Balık",
};

const PLANET_LABELS_TR = {
  sun: "Güneş", moon: "Ay", mercury: "Merkür", venus: "Venüs",
  mars: "Mars", jupiter: "Jüpiter", saturn: "Satürn",
  uranus: "Uranüs", neptune: "Neptün", pluto: "Plüton",
  asc: "Yükselen", mc: "MC",
};

const RETRO_TEMPLATES = {
  mercury: {
    base: "Merkür retrosu: iletişim, teknoloji, sözleşmeler ve kısa yolculuklar yavaşlıyor. Eski konulara dönüş olabilir, yanlış anlaşılma riski artar.",
    review: "Bu dönem eski fikirleri, yarım kalan konuşmaları ve ertelenmiş kararları yeniden ele almak için ideal. Teknoloji yedekle, önemli imzaları ertele.",
    pressure: "İletişim aksaklıkları, geciken cevaplar ve planların altüst olması muhtemel. Esnek kal, alternatif planlar hazırla.",
    opening: "Geçmişten gelen bir bilgi veya teklif seni şaşırtabilir. Eski bağlantılar yeniden canlanabilir.",
  },
  venus: {
    base: "Venüs retrosu: ilişkiler, değerler ve finansal konularda içsel gözden geçirme zamanı. Eski aşklar kapıyı çalabilir.",
    review: "Neye ve kime değer verdiğini yeniden sorguluyorsun. Büyük harcamalardan ve estetik değişikliklerden kaçın.",
    pressure: "İlişkilerde gerilim, değer çatışmaları ve mali belirsizlik artabilir.",
    opening: "Eski bir ilişkiden gelen ders veya tamamlanmamış bir duygusal süreç netleşebilir.",
  },
  mars: {
    base: "Mars retrosu: enerji, motivasyon ve girişimcilik yavaşlıyor. Strateji gözden geçirme zamanı, yeni başlangıçlar için uygun değil.",
    review: "Eylem planını gözden geçir. Hangi savaşları seçtiğine dikkat et, enerjini verimli kullan.",
    pressure: "Sinirlilik, engellenme hissi ve geciken projeler gündemde. Sabır sınavı geliyor.",
    opening: "Ertelenmiş bir projeyi tamamlamak veya eski bir hedefi yeniden değerlendirmek için iyi fırsat.",
  },
  jupiter: {
    base: "Jüpiter retrosu: büyüme, inanç ve genişleme alanlarında içe dönüş. Dışa açılma yerine iç değerlendirme.",
    review: "Büyüme planlarını sorgula. Gerçekten sana hizmet eden fırsatlar hangileri?",
    pressure: "Aşırı iyimserlik ve şişirilmiş beklentilerin gerçekle yüzleşmesi.",
  },
  saturn: {
    base: "Satürn retrosu: sorumluluklar, sınırlar ve yapılar sorgulanıyor. Otorite figürleriyle ve kurallarla ilişkin gözden geçiriliyor.",
    review: "Hangi yapılar seni destekliyor, hangileri hapsettiyor? Temelleri kontrol et.",
    pressure: "Geciken ödüller, ağırlaşan sorumluluklar ve disiplin testleri.",
  },
  uranus: {
    base: "Uranüs retrosu: değişim ve özgürleşme süreçlerinde geçici duraklamanın zamanı. İç devrim kaynıyor.",
    review: "Dış değişim hızı yavaşlarken içsel farkındalık artıyor. Nerede sıkışmış hissediyorsun?",
  },
  neptune: {
    base: "Neptün retrosu: rüyalar, sezgiler ve yanılsamalar yüzeye çıkıyor. Manevi derinlik artarken kafa karışıklığı da olabilir.",
    review: "Hangi hayallerin gerçekçi, hangileri yanılsama? Sezgilerine güven ama ayağını yere bas.",
  },
  pluto: {
    base: "Plüton retrosu: derin dönüşüm süreçlerinde içsel muhakeme. Kontrol ihtiyacın ve güç dinamiklerin sorgulanıyor.",
    review: "Bırakman gereken eski kalıplar, bastırdığın duygular ve tamamlanmamış dönüşümler yüzeye çıkıyor.",
  },
};

const PLANET_DOMAIN_MAP = {
  mercury: { themes: ["iletişim", "yakın çevre", "kısa yolculuklar", "teknoloji"], area: "zihinsel" },
  venus: { themes: ["ilişkiler", "değerler", "finanslar", "estetik"], area: "duygusal" },
  mars: { themes: ["enerji", "motivasyon", "girişimcilik", "fiziksel aktivite"], area: "eylemsel" },
  jupiter: { themes: ["büyüme", "inanç", "eğitim", "uzak yolculuklar"], area: "genişleme" },
  saturn: { themes: ["sorumluluk", "yapı", "disiplin", "kariyer"], area: "yapısal" },
  uranus: { themes: ["değişim", "özgürlük", "yenilikçilik", "beklenmedik olaylar"], area: "dönüştürücü" },
  neptune: { themes: ["sezgi", "maneviyat", "rüyalar", "yaratıcılık"], area: "spiritüel" },
  pluto: { themes: ["dönüşüm", "güç", "kontrol", "yeniden doğuş"], area: "derin dönüşüm" },
};

const NATAL_RESONANCE_KEYWORDS = {
  sun: "kimliğin ve yaşam amacın",
  moon: "duyguların ve iç dünyan",
  mercury: "düşünce ve iletişim biçimin",
  venus: "ilişki ve değer algın",
  mars: "enerji ve eylem tarzın",
  jupiter: "büyüme ve inanç sistemi",
  saturn: "sorumluluk ve kariyer yapın",
  uranus: "özgürlük ve yenilik alanın",
  neptune: "sezgi ve manevi tarafın",
  pluto: "dönüşüm ve güç dinamiklerin",
  asc: "dış görünüşün ve kendini ifade ediş biçimin",
  mc: "kariyer yönün ve toplumsal imajın",
};

// --- Template selection ---

function selectRetroVariant(retroEvent) {
  const planet = retroEvent.transitPlanet;
  const templates = RETRO_TEMPLATES[planet];
  if (!templates) return "Gözden geçirme dönemi.";

  const dur = daysBetween(retroEvent.startDate, retroEvent.endDate);
  if (dur >= 30) return templates.pressure || templates.review || templates.base;
  if (dur >= 14) return templates.review || templates.base;
  return templates.opening || templates.base;
}

function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

// --- Natal resonance (deterministic) ---

function findNatalResonance(retroPlanet, natalPlanets) {
  if (!natalPlanets || natalPlanets.length === 0) return null;

  const natalMatch = natalPlanets.find((p) => p.name === retroPlanet);
  if (!natalMatch) return null;

  const sign = natalMatch.sign || null;
  const signLabel = sign ? (ZODIAC_LABELS_TR[sign] || sign) : null;

  return {
    planet: retroPlanet,
    planetLabel: PLANET_LABELS_TR[retroPlanet] || retroPlanet,
    sign,
    signLabel,
    resonanceNote: signLabel
      ? `Natal ${PLANET_LABELS_TR[retroPlanet] || retroPlanet}'ün ${signLabel} burcunda — ${NATAL_RESONANCE_KEYWORDS[retroPlanet] || "bu alan"} özellikle etkileniyor.`
      : "",
  };
}

function getAffectedThemes(retroPlanet) {
  const domain = PLANET_DOMAIN_MAP[retroPlanet];
  return domain ? domain.themes.slice(0, 3) : [];
}

// --- Main builder ---

function buildRetroWindows(retrogrades, natalPlanets) {
  if (!retrogrades || retrogrades.length === 0) return [];

  return retrogrades.map((retro) => {
    const baseInterpretation = selectRetroVariant(retro);
    const resonance = findNatalResonance(retro.transitPlanet, natalPlanets);
    const affectedThemes = getAffectedThemes(retro.transitPlanet);

    let natalNote = "";
    if (resonance && resonance.resonanceNote) {
      natalNote = resonance.resonanceNote;
    }

    return {
      planet: retro.transitPlanet,
      planetLabel: PLANET_LABELS_TR[retro.transitPlanet] || retro.transitPlanet,
      startDate: retro.startDate,
      endDate: retro.endDate,
      baseInterpretation: natalNote ? `${baseInterpretation} ${natalNote}` : baseInterpretation,
      personalNote: "",
      affectedThemes,
      priority: retro.priority || "medium",
    };
  });
}

function buildRetroAIPayload(retroWindows, natalPlanets) {
  return retroWindows.map((rw) => ({
    planet: rw.planet,
    planetLabel: rw.planetLabel,
    startDate: rw.startDate,
    endDate: rw.endDate,
    baseText: rw.baseInterpretation,
    affectedThemes: rw.affectedThemes,
    natalSign: natalPlanets?.find((p) => p.name === rw.planet)?.sign || null,
  }));
}

function mergeRetroAIResults(retroWindows, aiResults) {
  if (!aiResults || !Array.isArray(aiResults)) return retroWindows;

  const aiMap = {};
  aiResults.forEach((r) => { if (r.planet) aiMap[r.planet] = r; });

  return retroWindows.map((rw) => {
    const ai = aiMap[rw.planet];
    return {
      ...rw,
      personalNote: ai?.personalNote || ai?.interpretation || "",
    };
  });
}

module.exports = {
  buildRetroWindows,
  buildRetroAIPayload,
  mergeRetroAIResults,
  RETRO_TEMPLATES,
  PLANET_LABELS_TR,
  ZODIAC_LABELS_TR,
};
