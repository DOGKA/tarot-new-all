# prompts

Merkezi prompt hub. Tum AI promptlari kategoriye gore alt klasorlerde tutulur. `index.js` hub dosyasi disariya tek noktadan export saglar.

## Yapi

```
prompts/
  index.js              Hub — tum prompt getter'lari export eder
  tarot/
    tr.js, en.js, de.js, es.js    16 spread icin tarot promptlari
  horoscope/
    tr.js, en.js, de.js, es.js    Dive Deeper premium promptlari
  natal/
    tr.js, en.js, de.js, es.js    Natal chart yorum promptlari
  general/
    tr.js                          Moon Astro + Horoscope FREE (cron/batch)
```

Dream Coder ve Transit promptlari kendi modulleri icinde tutulur (co-location):
- `../dream-coder/prompts/` (tr/en/de/es)
- `../natal-transit/prompts/` (standard-tr, yearly-tr)

Hub bunlari da import edip export eder, disaridan ayni API ile erisim saglanir.

## Getter API

```javascript
const {
  getTarotPrompts,       // (lang) => tarot prompt objesi
  getDreamCoderPrompts,  // (lang) => dreamcoder prompt objesi
  getHoroscopePrompts,   // (lang) => horoscope prompt objesi
  getNatalPrompts,       // (lang) => natal chart prompt objesi
  getGeneralPrompts,     // () => general-tr (cron/batch)
  getTransitPrompts,     // () => transit standard-tr
} = require("./prompts");
```

Tum getter'lar fallback dili destekler (genelde EN veya TR).

## Backward Compatibility

Eski tarot helper fonksiyonlari (`buildSinglePrompt`, `buildPpfPrompt`, vs.) hala export edilir. `backend/index.js` bunlari kullanir.

## Prompt Felsefesi

- "sen" hitabi, kehanet degil farkindalik araci
- Klise/bos motivasyon cumleleri yasak
- Her kategori kendi tonuna sahip (koclub, stratejist, gozlemci, vs.)
- Astro jargon minimum, hayata bagla
