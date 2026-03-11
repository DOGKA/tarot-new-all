# moon

Moon Astro modulu. Gercek zamanli ay evresi, ay burcu ve gunun gezegeni verileriyle slot bazli dinamik astroloji icerigi uretir.

## Yapi

```
moon/
  index.js          Router + cron + slot cache + 3D veri hazirlama
```

Astronomi hesaplamalari `../utils/moon.js` icerisinde.
Promptlar `../prompts/general/tr.js` icerisinde.

## Slot Sistemi

Ay evresi + ay burcu + gunun gezegeni uclusunun degismedigi zaman dilimi. 72 saatlik pencerede 5-8 slot olusur. Her slot icin ayri ChatGPT istegi atilir, ardindan DeepL ile 4 dile cevrilir.

## Astronomi

- **Ay Evresi**: 10 faz (yeni_ay -> balsamik_ay)
- **Ay Burcu**: J2000.0 ekliptik boylam hesabi, binary search ile ~1dk hassasiyet
- **Gunun Gezegeni**: UTC gun bazli (Gunes=Pazar ... Saturn=Cumartesi)

## Icerik Alanlari

| Ekran | Alan | Aciklama |
|-------|------|----------|
| Gezegen | meaning + advice | Enerji + somut aksiyon |
| Burc | meaning + firsat + his | Duygusal etki + firsat + hakim duygu |
| Evre | sentence + general + ayna | Gunun ozu + etkisi + farkindalik |

## Erisim

- **FREE**: Sadece aktif slot gorulur
- **Premium**: Tum slotlar erisime acik

## Cron — Proaktif Buffer

```
Her 6 saatte bir (00:00, 06:00, 12:00, 18:00 UTC):
  Kalan sure < 24 saat -> 72 saatlik slot yeniden uretilir
  Kalan sure >= 24 saat -> Atlanir
```

Startup'ta 5 saniye sonra buffer kontrolu yapilir.

## API

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | `/api/moon/current?lang=tr` | Aktif slot + tum slotlar (72 saat) |
| GET | `/api/moon/status` | Cache durumu, cron log, slot listesi (admin) |
| POST | `/api/moon/force-generate` | 72h slot zorla yeniden uret (admin) |
| DELETE | `/api/moon/cache` | Tum slot cache temizle (admin) |

## Bagimliliklar

- `openai` (GPT-4o)
- `deepl-node` (4 dil ceviri)
- `../utils/moon.js` (astronomi hesaplayici)
- `../prompts` hub (getGeneralPrompts)
