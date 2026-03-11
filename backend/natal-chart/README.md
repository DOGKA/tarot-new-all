# natal-chart

Kisisel dogum haritasi modulu. Kullanicinin gunes, ay ve yukselen burclarindan element dengesi hesaplar, GPT ile detayli kisisellestirilmis yorum uretir.

## Yapi

```
natal-chart/
  index.js          Router + element hesaplama + AI yorum
```

Promptlar `../prompts/natal/` altinda (tr/en/de/es).

## Kullanici Girisi

- Gunes burcu (zorunlu)
- Ay burcu (zorunlu)
- Yukselen burc (opsiyonel — dogum saati bilinmiyorsa null)

## Element Dengesi

Girilen burclardan element skoru hesaplanir:
- Gunes: 3 puan, Ay: 2 puan, Yukselen: 1 puan
- 4 element (ates/toprak/hava/su) toplam skorlari + baskin element

## AI Yorum Yapisi

Kullanici dilinde direkt GPT uretimi (ceviri yok):

| Alan | Aciklama |
|------|----------|
| corePersonality | Temel kisilik ozeti |
| ascendant | Yukselen burc yorumu (varsa) |
| planets[] | Her gezegen icin evde yorum |
| aspects[] | Onemli acilar |
| retrograde | Geriye donus yorumlari |
| houses[] | Ev yorumlari |
| nodeAxis | Kuzey/Guney node analizi |
| elements | Element dengesi yorumu |
| lifeMission | Yasam misyonu |
| strengths[] / challenges[] | Guclu yanlar ve zorluklar |
| advice | Genel tavsiye |

## API

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | `/api/natal/save` | Natal chart kaydet |
| GET | `/api/natal/:deviceId` | Kullanici natal chart verisi |
| POST | `/api/natal/interpret` | AI yorumu uret (50gs, kalici cache) |
| DELETE | `/api/natal/interpret/:deviceId` | Yorum cache temizle (admin) |

## Maliyet

50 gemstone (tek seferlik, sonuc kalici olarak saklanir).

## Bagimliliklar

- `openai` (GPT-4o, index.js uzerinden inject edilir)
- `../prompts` hub (getNatalPrompts)
- `../dream-coder/data/prices.json` (fiyat tablosu)
