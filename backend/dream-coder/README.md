# dream-coder

Ruya cozumleme modulu. Kullanicinin ruya metnini alir, bilincalti tema analizi yapar, semboller cikarir, donusum plani olusturur.

## Yapi

```
dream-coder/
  index.js          Router + decode/upsell/journal logic
  prompts/
    tr.js           Turkce prompt (A/B/C mod)
    en.js           Ingilizce prompt
    de.js           Almanca prompt
    es.js           Ispanyolca prompt
  data/
    prices.json     Tum urun fiyatlari (tarot, dream, horoscope, natal, transit)
    users.json      Ortak kullanici DB (deviceId bazli, gemstone, premium)
```

## 3 Mod

| Mod | Maliyet | Cikti |
|-----|---------|-------|
| **A** (Hizli) | 11gs | overall + beats + keywords + 1 upsell sembol |
| **B** (Derin) | 22gs | A + pattern + journal + 3 upsell sembol + JournalPlus |
| **C** (Donusum) | 12gs (Premium) | overall + beats + 3 asamali plan + journal |

## API

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | `/api/dream/decode` | Ruya cozumle (A/B/C mod) |
| POST | `/api/dream/upsell-symbol` | Sembol ac (3gs) |
| POST | `/api/dream/journal-plus` | Journal cevabina tavsiye (5gs) |
| GET | `/api/dream/user/:deviceId` | Kullanici bakiye + premium |
| GET | `/api/dream/prices` | Fiyatlar + paketler |

## Ortak Veri

`data/users.json` ve `data/prices.json` tum backend modulleri tarafindan paylasilir. Gemstone bakiyesi, premium durumu ve fiyatlar burada tutulur.

## Prompt Felsefesi

```
Felsefe: "Ruya yorumu degil, bilincalti farkindalik araci."
Ton:     %40 psikolojik icgoru + %40 sembol analizi + %20 arketipsel rehberlik
Dil:     "sen" dili, "sende neyi tetikliyor/sikistiriyor/buyutuyor" uzerinden yaz
```
