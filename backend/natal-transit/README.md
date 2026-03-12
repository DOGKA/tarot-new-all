# natal-transit

Transit astrology engine for the Tarot app. Generates personalized transit readings for 1, 3, 6, and 12-month periods.

## Architecture

```
natal-transit/
├── index.js              # Express router, cache management, API endpoints
├── pipelines/
│   ├── monthly.js        # 1-month pipeline (themes only)
│   ├── quarterly.js      # 3-month pipeline (themes + milestones)
│   ├── hybrid.js         # 6-month pipeline (phases + milestones + focusAreas)
│   └── yearly.js         # 12-month pipeline (phases + milestones + focusAreas)
├── prompts/
│   ├── standard-{lang}.js  # 1+3 month prompts (tr, en, de, es)
│   ├── hybrid-{lang}.js    # 6-month prompts (tr, en, de, es)
│   ├── yearly-{lang}.js    # 12-month prompts (tr, en, de, es)
│   └── retro-{lang}.js     # Retrograde polish prompts (tr, en, de, es)
└── shared/
    ├── engine.js           # Base model builder, milestone selector, output assembler
    ├── transits.js          # Transit timeline builder (ephemeris-based)
    ├── ephemeris.js          # Planet position calculator
    ├── scoring.js           # Transit scoring algorithm
    ├── clustering.js        # Theme clustering
    ├── phases.js            # Phase segmentation + recurring theme detection
    ├── retrogrades.js       # Retrograde window builder + AI merge
    ├── formatters.js        # Title/range text builders
    ├── periodProfiles.js    # Period configuration (caps, phase counts, AI strategy)
    └── contract.js          # Output validation
```

## Period Modes

| Period | Mode | Phases | Themes | Drivers | FocusAreas | Retro | AI Calls |
|--------|------|--------|--------|---------|------------|-------|----------|
| 1 month | monthly | 0 | 6 | 0 | No | Template | 1 |
| 3 months | quarterly | 0 | 6 | 0 | No | Template | 1 |
| 6 months | hybrid | 3 | 0 | 20 | Yes | Template+AI | 2 |
| 12 months | yearlyNarrative | 4 | 0 | 25 | Yes | Template+AI | 2 |

## Supported Languages

- Turkish (tr) — primary
- English (en)
- German (de)
- Spanish (es)

Language is passed via `lang` parameter in the API request. Each language has its own prompt files and data cache.

## API Endpoints

### POST /api/natal/transits
Generate or retrieve a transit reading.

```json
{
  "deviceId": "user_device_id",
  "months": 6,
  "lang": "tr",
  "locations": [
    {
      "city": "Istanbul",
      "latitude": 41.0082,
      "longitude": 28.9784,
      "utcOffset": 3,
      "timezone": "Europe/Istanbul",
      "startDate": "2026-03-11",
      "endDate": "2026-09-11"
    }
  ]
}
```

### GET /api/natal/transits/:deviceId/latest?months=6
Get the latest cached reading for a device.

### GET /api/natal/transits/:deviceId/status
Get reading history and current transit positions.

### DELETE /api/natal/transits/:deviceId
Clear all cached readings for a device.

## Data Flow

1. **Transit Timeline** — Ephemeris calculates planet positions, finds aspects to natal chart
2. **Scoring** — Each transit scored by aspect type, planet weight, orb tightness
3. **Clustering** — Transits grouped into themes (career, relationships, etc.)
4. **Phases** — For 6+12 month: themes segmented into time-based phases
5. **AI Call A** — GPT-4o generates interpretations, milestones, focus areas
6. **AI Call B** — GPT-4o personalizes retrograde windows (6+12 month only)
7. **Assembly** — Merge AI results with base model, build final output
