# horoscope

Gunluk burc yorumu modulu. 372-tema capraz rotasyon sistemi (12 faz x 31 tema). FREE icin ChatGPT + DeepL 4-dil, Premium Dive Deeper icin kullanici dilinde direkt GPT uretimi.

## Yapi

```
horoscope/
  index.js          Router + cron + rolling-window buffer + Dive Deeper
```

Promptlar `../prompts/horoscope/` ve `../prompts/general/` altinda.

## Tema Sistemi

12 faz x 31 tema = 372 benzersiz tema. Her gun, her burc farkli faz+tema kombinasyonu alir.

| Faz | Konu |
|-----|------|
| 1 | Temel Psikoloji |
| 2 | Iliskiler |
| 3 | Kisisel Gelisim |
| 4 | Shadow Work |
| 5 | Is & Kariyer |
| 6 | Para & Kaynaklar |
| 7 | Saglik & Beden |
| 8 | Yaraticilik |
| 9 | Sosyal Imaj |
| 10 | Zihin & Dusunce |
| 11 | Anlam & Amac |
| 12 | Kapanis & Yeniden Dogus |

## Icerik Katmanlari

- **FREE**: headline + body + do/dont listesi (ChatGPT TR -> DeepL 4 dil)
- **Dive Deeper** (3gs): coreInsight + challenge + powerMove + prompt + microAction (direkt GPT, kullanici dilinde)

Premium aboneler gunde 1 ucretsiz Dive Deeper hakki alir.

## Cron — Rolling-Window Buffer

```
Startup  -> 4 gun uretiyor: D-1, D, D+1, D+2
Gunluk   -> UTC 00:05, maxCachedDate < today+2 ise 3 gun daha uretiyor
```

Zaten cache'li tarihler atlanir. Kullanici eksik gun gormez.

## API

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | `/api/horoscope/signs?lang=tr` | 12 burc listesi |
| POST | `/api/horoscope/free` | Gunluk FREE yorum (cache'den) |
| POST | `/api/horoscope/premium` | Dive Deeper (GPT, 3gs) |
| POST | `/api/horoscope/generate` | Buffer check & fill (admin/cron) |
| GET | `/api/horoscope/status` | Cache durumu, buffer, cron log (admin) |
| DELETE | `/api/horoscope/cache` | Cache temizle (admin) |

## Bagimliliklar

- `openai` (GPT-4o)
- `deepl-node` (FREE icin 4 dil ceviri)
- `../dream-coder` (ortak getUser/updateUser)
- `../prompts` hub (getHoroscopePrompts, getGeneralPrompts)
