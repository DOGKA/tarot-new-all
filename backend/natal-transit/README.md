# natal-transit

Transit astroloji modulu. Kullanicinin natal harita gezegenlerine gore 1/3/6/12 aylik transit olaylarini hesaplar, skorlar, tema kumelerine ayirir ve yorumlar.

## Yapi

```
natal-transit/
  index.js              Router + orchestration (ince katman)
  prompts/
    standard-tr.js      1/3/6 ay tema-bazli prompt
    yearly-tr.js        12 ay narrative prompt
  shared/
    ephemeris.js        Swiss Ephemeris wrapper (gezegen pozisyonlari)
    scoring.js          Event-level importance skoru (0-100)
    clustering.js       Tema kumeleme, themeScore, merge, tier split
    formatters.js       Baslik, tarih araligi, etiket uretimi
    transits.js         Ham transit hesaplama (buildTransitTimeline)
  standard/
    pipeline.js         1/3/6 ay pipeline (score->cluster->tier->AI)
    templates.js        Theme+variant sablon sistemi
  yearly/
    pipeline.js         12 ay pipeline (score->suppress->cluster->phase->AI)
    phases.js           Faz segmentasyonu + faz dominansi analizi
```

## Pipeline Akisi

### Standard (1/3/6 ay)

```
buildTransitTimeline -> scoreEvent -> clusterEvents -> mergeOverlapping
  -> splitTiers -> interpretThemes(AI, sadece critical) -> template(supportive) -> response
```

- **Critical temalar**: AI'ye gonder, tam yorum al
- **Supportive temalar**: Theme+variant sablondan metin uret
- **Background**: Sadece baslik + tarih

### Yearly (12 ay)

```
buildTransitTimeline -> suppressFastPlanets -> scoreEvent -> clusterEvents
  -> segmentPhases(3 faz) -> buildPhaseDominance -> interpretYearlyNarrative(AI) -> response
```

Cikti: `yearOverview`, `phases[3]`, `focusAreas`, `milestones` — liste degil rapor.

## Skorlama

100 puanlik onem skoru:
- Gezegen agirligi (Pluto=10 ... Moon=1)
- Natal hedef agirligi (ASC/MC=10, Sun/Moon=9, ...)
- Aci agirligi (conjunction=10, opposition=9, ...)
- Orb bonusu, sure bonusu, hizli gezegen cezasi

Tema skoru = maxEventScore + density + multiPlanetBonus + durationBonus

Periyoda gore esikler: 1ay ai:65, 3ay ai:75, 6ay ai:80, 12ay ai:85

## API

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | `/api/natal/transits` | Transit analizi uret (1/3/6/12 ay) |
| GET | `/api/natal/transits/:deviceId/latest` | Son transit okumasi |
| GET | `/api/natal/transits/:deviceId/status` | Transit durumu |
| DELETE | `/api/natal/transits/:deviceId` | Transit cache temizle |

## Bagimliliklar

- `swisseph` (Swiss Ephemeris Node.js binding)
- `openai` (GPT-4o, index.js uzerinden inject edilir)
- `../prompts` hub (getTransitPrompts)
- `../dream-coder/data/prices.json` (fiyat tablosu)
