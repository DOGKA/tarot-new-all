# Astrolic — Tarot · Dream Coder · Moon Astro · Daily Horoscope · Natal Chart · Transit Takvimi

6 modüllü psikolojik farkındalık platformu. Tarot okumaları, rüya çözümlemesi, gerçek zamanlı ay astrolojisi, günlük burç yorumları, natal harita yorumlaması ve transit astroloji takvimi. 4 dil desteği (TR/EN/DE/ES), ortak gemstone ekonomisi, premium abonelik. GPT-4o destekli davranış analizi + sembol çözümlemesi. DeepL ile çoklu dil çevirisi.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React Native (Expo ~54.0), Expo Router ^6.0 |
| Backend | Express.js ^5.2 (Node.js) |
| AI | OpenAI GPT-4o (tek çağrı, retry yok) |
| Çeviri | DeepL API (DE/ES: formality "less" — sen dili) |
| i18n | i18next + react-i18next (TR/EN/DE/ES) |
| UI | Glassmorphism (expo-blur, expo-linear-gradient) |
| 3D | Three.js + expo-gl + expo-three (Ay, gezegen, burç görselleri) |
| Astronomi | lunarphase-js + suncalc (ay evresi, burç, gezegen hesabı) |
| Storage | JSON dosyaları + AsyncStorage (kalıcı deviceId) |
| Cron | node-cron (horoscope + moon otomatik üretim) |

---

## 6 Modül Özeti

| Modül | Açıklama | Gelir Modeli |
|-------|----------|--------------|
| **Tarot** | Psikolojik tarot okumaları (1-3-5 kart, 16 açılım) | Gemstone (FREE: hardcoded, PREMIUM: GPT) |
| **Dream Coder** | Rüya çözümlemesi (A/B/C modları + upsell sembol) | Gemstone (11-22gs) |
| **Moon Astro** | Gerçek zamanlı ay evresi, burç, gezegen | FREE: aktif slot, PREMIUM: tüm slotlar |
| **Daily Horoscope** | 372-tema çapraz rotasyon günlük burç yorumu | FREE: headline+body+do/dont, PREMIUM: Dive Deeper (3gs) |
| **Natal Chart** | Kişisel doğum haritası AI yorumlaması | 50 gemstone (tek seferlik) |
| **Transit Takvimi** | 1/3/6/12 aylık transit astroloji takvimi + yıllık rapor | Gemstone (15-75gs) + Premium (3+ ay) |

---

## Style DNA

### Tarot

```
Felsefe: "Kehanet değil, farkındalık aracı."
Ton:     %40 koçluk + %40 psikolojik içgörü + %20 tarot sembolizmi
Dil:     "sen" dili, kısa yoğun cümleler, yüzleştirici ama yargısız
```

Kategori tonları: Genel (profesyonel koç), Aşk (ilişki stratejisti), Kariyer (farkındalık dili), Ruhsal (mistik ama yere basan).

### Dream Coder

```
Felsefe: "Rüya yorumu değil, bilinçaltı farkındalık aracı."
Ton:     %40 psikolojik içgörü + %40 sembol analizi + %20 arketipsel rehberlik
Dil:     "sen" dili, "sende neyi tetikliyor/sıkıştırıyor/büyütüyor" üzerinden yaz
```

Dinamizm fiilleri: açıyor, netleştiriyor, sertleştiriyor, gevşetiyor, büyütüyor, daraltıyor, sıkıştırıyor, tetikliyor, bastırıyor, kilitliyor, hızlandırıyor, yavaşlatıyor.

### Moon Astro

```
Felsefe: "Dikkatli bir gözlemcinin sesi."
Ton:     Gözlemle, motive etme. Yargılamadan yüzleştir.
Dil:     "sen" dili, her cümle farklı fiille başlar, kesin ifadeler
```

### Daily Horoscope

```
Felsefe: "Psikolojik farkındalık + günlük pratik aksiyon."
Ton:     FREE: 2 cümle headline + body + do/dont listesi
         PREMIUM: Dive Deeper (coreInsight, challenge, powerMove, prompt, microAction)
Sistem:  372-tema çapraz rotasyon (12 faz × 31 tema, burca göre offset)
```

### Natal Chart

```
Felsefe: "Kişisel astroloji haritanı anlamlandır."
Ton:     Psikolojik içgörü, kişiye özel, yargısız
Dil:     Kullanıcı dilinde direkt GPT üretimi (çeviri yok)
Veri:    Sadece natal chart verileri + hesaplanan açılar kullanılır
```

### Ortak DNA

Kehanet YOK, guru tonu YOK, uydurma detay YOK. Hepsi "sende neyi tetikliyor" sorusuna cevap verir, "anlamı budur" demez.

---

## Erişim Matrisi

| İçerik | FREE | Gemstone | Premium Abo |
|--------|------|----------|-------------|
| Tekli Tarot (1 kart) | Hardcoded meaning | GPT yorum (6gs) | GPT yorum (6gs) |
| Yes/No | Hardcoded shortReason | GPT yorum (6gs) | GPT yorum (6gs) |
| 3'lü Tarot (PPF, SOA vs.) | KİLİTLİ | GPT yorum (14gs) | GPT yorum (14gs) |
| 5'li Tarot (Love, Moon vs.) | KİLİTLİ | GPT yorum (22gs) | GPT yorum (22gs) |
| Dream A (Hızlı Çözümleme) | KİLİTLİ | 11gs | 11gs |
| Dream B (Derin Çözümleme) | KİLİTLİ | 22gs | 22gs |
| Dream C (Dönüştürme Planı) | KİLİTLİ | KİLİTLİ | 12gs (sadece abone) |
| Upsell Sembol | — | 3gs | 3gs |
| JournalPlus (Tavsiye) | — | 5gs | 5gs |
| Moon Astro (aktif slot) | ✓ Ücretsiz | — | — |
| Moon Astro (tüm slotlar) | Bulanık (blur) | — | ✓ Açık |
| Horoscope FREE | ✓ headline+body+do/dont | — | — |
| Horoscope Dive Deeper | — | 3gs | 1 ücretsiz/gün + 3gs |
| Natal Chart Yorumu | — | 50gs | 50gs |
| Transit 1 Ay | — | 15gs | 15gs |
| Transit 3 Ay | — | — | 30gs (Premium) |
| Transit 6 Ay | — | — | 50gs (Premium) |
| Transit 12 Ay (Yillik Rapor) | — | — | 75gs (Premium) |

---

## Premium Abonelik

| Plan | Fiyat | Bonus | Süre |
|------|-------|-------|------|
| Aylık | $4.99/ay | +50 gemstone (her ay) | 30 gün |
| Yıllık | ~~$59.88~~ **$45.00/yıl** | +500 gemstone | 365 gün ($3.75/ay, %25 tasarruf) |

## Gemstone Paketleri

| Paket | Gerçek | Bonus | Toplam | Fiyat | $/gem |
|-------|--------|-------|--------|-------|-------|
| 50 | 50 | 0 | **50** | $3.99 | $0.0798 |
| 100 | 75 | 25 | **100** | $5.99 | $0.0599 |
| 250 | 150 | 100 | **250** | $11.99 | $0.0480 |
| 500 | 250 | 250 | **500** | $19.99 | $0.0400 |

---

## Tarot Açılımları (16 Spread)

### FREE (Hardcoded → GPT ile Premium)

| Açılım | Kart | Kategori |
|--------|------|----------|
| Single Card | 1 | Genel / Aşk / Kariyer / Ruhsal |
| Yes/No | 1 | Genel / Aşk / Kariyer / Ruhsal |

### PREMIUM (Gemstone Gerekli)

| Açılım | Kart | Gem | Kategori |
|--------|------|-----|----------|
| Past/Present/Future | 3 | 14 | Genel |
| Situation/Obstacle/Advice | 3 | 14 | Genel |
| Destiny's Embrace | 3 | 14 | Aşk |
| Mind · Body · Spirit | 3 | 14 | Ruhsal |
| Celestial Illumination | 3 | 14 | Ruhsal |
| Career Clarity | 3 | 14 | Kariyer |
| Career Path Guide | 3 | 14 | Kariyer |
| Love Choice | 5 | 22 | Aşk |
| Path to Love | 5 | 22 | Aşk |
| New Moon Ritual | 5 | 22 | Ruhsal |
| Full Moon Release | 5 | 22 | Ruhsal |
| New Business Exploration | 5 | 22 | Kariyer |
| Wealth Flow | 5 | 22 | Kariyer |

---

## Dream Coder Modları

### A — Hızlı Çözümleme (11gs)

| Alan | Açıklama |
|------|----------|
| overall | 2-3 cümle, çekirdek tema |
| beats | 2-3 öge, [somut rüya ögesi] + [dinamizm fiili] ile başlar |
| keywords | 3 kelime |
| Upsell | 1 aday otomatik, 3gs'e açılır |

### B — Derin Çözümleme (22gs)

| Alan | Açıklama |
|------|----------|
| overall | 3-4 cümle, tema + psikolojik arka plan |
| beats | 4-6 öge, her beat yeni katman ekler |
| pattern | TAM 3 cümle: tetikleyici→tepki→bedel |
| keywords | 3 kelime |
| journal | 1 içsel soru (Kendine Sor) |
| JournalPlus | Kullanıcı cevap yazarsa somut tavsiye alır (5gs) |
| Upsell | 3 aday, kullanıcı seçer, 3gs'e açılır |

### C — Dönüştürme Planı (12gs, PREMIUM ONLY)

| Alan | Açıklama |
|------|----------|
| overall | 2-3 cümle |
| beats | 2-4 öge |
| plan[0] | 24 saat: 5 dk'da yapılabilir somut aksiyon |
| plan[1] | 7 gün: günlük küçük alışkanlık |
| plan[2] | Sınır: "Ben artık..." formatı |
| keywords | 3 kelime |
| journal | 1 içsel soru |
| JournalPlus | 5gs tavsiye |

---

## Daily Horoscope — 372-Tema Çapraz Rotasyon

### Tema Sistemi

12 faz × 31 tema = 372 benzersiz tema. Her gün, her burç farklı faz+tema kombinasyonu alır.

| Faz | Konu |
|-----|------|
| 1 | Temel Psikoloji |
| 2 | İlişkiler |
| 3 | Kişisel Gelişim |
| 4 | Shadow Work |
| 5 | İş & Kariyer |
| 6 | Para & Kaynaklar |
| 7 | Sağlık & Beden |
| 8 | Yaratıcılık |
| 9 | Sosyal İmaj |
| 10 | Zihin & Düşünce |
| 11 | Anlam & Amaç |
| 12 | Kapanış & Yeniden Doğuş |

### FREE İçerik (ChatGPT TR → DeepL 4 dil)
- `headline`: Günün tek cümlelik özeti
- `body`: 2-3 cümle psikolojik içgörü
- `do[]`: 2 yapılacak eylem
- `dont[]`: 2 kaçınılacak davranış

### PREMIUM — Dive Deeper (GPT, kullanıcı dilinde direkt üretim)
- `coreInsight`: Derinlemesine psikolojik analiz
- `challenge`: Günün meydan okuması
- `powerMove`: Somut güç hamlesi
- `prompt`: İçsel farkındalık sorusu
- `microAction`: 5 dakikada yapılabilir aksiyon

Kişiselleştirme: Kullanıcının güneş burcu, ay burcu ve varsa yükselen burcu (doğum saati bilinmiyorsa null) prompt'a eklenir.

Premium aboneler günde 1 ücretsiz Dive Deeper hakkına sahip, sonraki atışlar 3gs.

### Cron — Rolling-Window Buffer Sistemi

```
İlk başlangıç  → 4 gün üret: D-1, D, D+1, D+2
Günlük kontrol → maxCachedDate < today+2 ise 3 gün daha üret
Sonuç         → Her 3 günde bir otomatik üretim, kullanıcı eksik gün görmez
```

- Cron: UTC 00:05'te günlük buffer kontrolü
- Buffer yetersizse `maxCachedDate+1`'den itibaren 3 gün üretilir
- Zaten cache'li tarihler atlanır

---

## Moon Astro — Slot Bazlı Dinamik Astroloji

### Slot Sistemi
Ay evresi + Ay burcu + günün gezegeni üçlüsünün değişmediği zaman dilimi. 72 saatlik pencerede 5-8 slot oluşur. Her slot için ayrı ChatGPT isteği atılır, ardından DeepL ile tüm dillere çevrilir.

### Astronomi
- **Ay Evresi**: 10 faz (yeni_ay → balsamik_ay)
- **Ay Burcu**: J2000.0 ekliptik boylam hesabı, binary search ile ~1dk hassasiyet
- **Günün Gezegeni**: UTC gün bazlı (Güneş=Pazar ... Satürn=Cumartesi)

### İçerik Alanları

| Ekran | Alan | Açıklama |
|-------|------|----------|
| Gezegen | `meaning` + `advice` | Enerji + somut aksiyon |
| Burç | `meaning` + `firsat` + `his` | Duygusal etki + fırsat + hakim duygu |
| Evre | `sentence` + `general` + `ayna` | Günün özü + etkisi + farkındalık |

### Cron — Proaktif Buffer Kontrolü

```
Her 6 saatte bir (00:00, 06:00, 12:00, 18:00 UTC):
  Kalan süre < 24 saat → 72 saatlik slot yeniden üretilir
  Kalan süre >= 24 saat → Sessizce atlanır
```

Startup'ta da 5 saniye sonra buffer kontrolü yapılır.

### 3D Görseller
- `Moon3D`: Three.js küresi, aydınlanma yüzdesine göre ışık
- `Planet3D`: Gezegen bazlı renkler (Satürn halkaları var)
- `Zodiac3D`: Her burç için PNG illüstrasyon

---

## Natal Chart — Kişisel Doğum Haritası

### Kullanıcı Girişi
- Güneş burcu (zorunlu)
- Ay burcu (zorunlu)
- Yükselen burç (opsiyonel — doğum saati bilinmiyorsa null)

### Hesaplama
Girilen verilerden element dengesi hesaplanır:
- Güneş: 3 puan, Ay: 2 puan, Yükselen: 1 puan
- 4 element (ateş/toprak/hava/su) toplam skorları ve baskın element belirlenir
- Hesaplanan açılar ve yerleşimler prompt'a eklenir

### AI Yorum Yapısı (kullanıcı dilinde direkt GPT)
- `corePersonality`: Temel kişilik özeti
- `ascendant`: Yükselen burç yorumu (varsa)
- `planets[]`: Her gezegen için evde yorum
- `aspects[]`: Önemli açılar (conjunction, opposition, trine...)
- `retrograde`: Gezegen geriye dönüşleri
- `houses[]`: Ev yorumları
- `nodeAxis`: Kuzey/Güney node analizi
- `elements`: Element dengesi yorumu + özet
- `lifeMission`: Yaşam misyonu
- `strengths[]` + `challenges[]`: Güçlü yanlar ve zorluklar
- `advice`: Genel tavsiye

### Element Dengesi UI
- Donut ring: 4 element arası oranı radial gradient ile gösterir
- Glassmorphism barlar: Her element için derinlikli gradient bar + yüzde

### Maliyet
50 gemstone (tek seferlik, sonuç kalıcı olarak saklanır)

---

## Admin Panel (Ayarlar)

Ayarlar ekranından tüm sistemlerin anlık durumu izlenebilir:

### Moon Astro Durumu
- Buffer badge (yeşil >24h / sarı 6-24h / kırmızı <6h)
- Cache bitiş süresi, üretildi-kadar tarihi, slot sayısı + içerik durumu
- Cron log: sonraki çalışma, son aksiyon (üretildi/atlandı + kaç saat kalmıştı)
- Slot listesi (toggle): her slot start→end, faz/burç/gezegen, içerik ✓/✗, aktif slot highlight
- Butonlar: `Çek` (lazy refresh) / `Force Üret` (zorunlu 72h regeneration) / `Sil`

### Daily Horoscope Durumu
- Buffer badge (yeşil=OK / sarı=eksik)
- Cache sonu tarihi, sonraki cron çalışma zamanı
- Cron log: son çalışma, son üretilen tarihler, atlandılar, hata (varsa)
- Per-date liste: tarih, rol (Dün/Bugün/Yarın/Buffer/Geçmiş), yorum sayısı, oluşturulma saati
- Üretim sırasında 4 saniyede otomatik yenileme
- Butonlar: `Check & Fill` / `Sil`

### Natal Chart Test Verisi
- Ayarlar kısmından test verisi ve hesaplanan verileri görüntüleme
- Hesaplanan kısımda sadece natal chart bilgileri kullanılır

---

## Proje Yapısı

```
TAROT-NEW-ALL/
├── backend/
│   ├── index.js                        # Express API + Tarot Engine + gemstone
│   ├── .env                            # OPENAI_API_KEY + DEEPL_API_KEY
│   ├── prompts/                        # Merkezi prompt hub
│   │   ├── index.js                    # Hub — tum getter'lari export eder
│   │   ├── tarot/{tr,en,de,es}.js      # Tarot spread promptlari
│   │   ├── horoscope/{tr,en,de,es}.js  # Dive Deeper promptlari
│   │   ├── natal/{tr,en,de,es}.js      # Natal chart yorum promptlari
│   │   └── general/tr.js              # Moon Astro + Horoscope FREE (cron)
│   ├── data/
│   │   ├── premium-readings.json
│   │   └── {tr,en,de,es}/
│   │       ├── tarot-template.json
│   │       ├── tendency.map.json
│   │       ├── moon-slots.json
│   │       ├── horoscopes.json
│   │       ├── transit-readings.json
│   │       └── natalchart-readings.json
│   ├── dream-coder/
│   │   ├── index.js                    # Router + decode/upsell/journal
│   │   ├── prompts/{tr,en,de,es}.js    # Dream Coder promptlari (co-located)
│   │   └── data/
│   │       ├── prices.json             # Tum urun fiyatlari
│   │       └── users.json              # Ortak kullanici DB
│   ├── natal-transit/
│   │   ├── index.js                    # Router + pipeline orchestration
│   │   ├── prompts/
│   │   │   ├── standard-tr.js          # 1/3/6 ay tema-bazli prompt
│   │   │   └── yearly-tr.js            # 12 ay narrative prompt
│   │   ├── shared/
│   │   │   ├── ephemeris.js            # Swiss Ephemeris wrapper
│   │   │   ├── scoring.js              # Event importance skoru
│   │   │   ├── clustering.js           # Tema kumeleme + tier split
│   │   │   ├── formatters.js           # Baslik, tarih, etiket
│   │   │   └── transits.js             # Ham transit hesaplama
│   │   ├── standard/
│   │   │   ├── pipeline.js             # 1/3/6 ay pipeline
│   │   │   └── templates.js            # Theme+variant sablonlar
│   │   └── yearly/
│   │       ├── pipeline.js             # 12 ay yearly narrative
│   │       └── phases.js               # Faz segmentasyonu
│   ├── natal-chart/
│   │   └── index.js                    # Natal chart yorum + element dengesi
│   ├── horoscope/
│   │   └── index.js                    # Horoscope API + cron + DeepL
│   ├── moon/
│   │   └── index.js                    # Moon Astro API + cron + slot cache
│   └── utils/
│       └── moon.js                     # Astronomi hesaplayici
│
├── tarot-app/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                   # Welcome + Moon Astro + Admin Panel
│   │   ├── tarot.tsx
│   │   ├── market.tsx
│   │   ├── pick/[spread].tsx
│   │   ├── result.tsx
│   │   ├── premium-result.tsx
│   │   ├── yesno-result.tsx
│   │   ├── transits.tsx                # Transit satin alma + progress
│   │   ├── dream/
│   │   │   ├── index.tsx, input.tsx, result.tsx
│   │   ├── horoscope/
│   │   │   ├── index.tsx, detail.tsx
│   │   ├── natal/
│   │   │   └── detail.tsx
│   │   ├── transit/
│   │   │   └── detail.tsx              # Transit detay (standard + yearly UI)
│   │   └── astro/
│   │       ├── phase.tsx, zodiac.tsx, planet.tsx
│   ├── components/ui/
│   │   ├── Moon3D.tsx, Planet3D.tsx, Zodiac3D.tsx
│   │   ├── SpreadCard.tsx, GradientBackground.tsx, StarField.tsx
│   │   └── PremiumPreview.tsx
│   ├── context/
│   │   ├── AppContext.tsx              # Global state
│   │   └── DreamContext.tsx
│   ├── utils/
│   │   ├── deviceId.ts, deck.ts, moon.ts, rng.ts
│   ├── i18n/translations.ts           # 4 dil, 1500+ satir
│   └── assets/
│       ├── cards/                      # 78 tarot kart gorseli
│       ├── zodiac/                     # 12 burc PNG
│       └── planets/                    # Gezegen gorselleri
│
└── README.md
```

---

## API Endpoints

### Tarot

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/reading` | Tarot okuma (FREE/PREMIUM, 16 spread) |
| POST | `/api/reading/free` | Deterministic FREE okuma |
| GET | `/api/cards/:language` | Kart verileri (78 kart) |

### Dream Coder

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/dream/decode` | Rüya çözümle (A/B/C) |
| POST | `/api/dream/upsell-symbol` | Seçilen sembolü aç (3gs) |
| POST | `/api/dream/journal-plus` | Journal cevabına tavsiye (5gs) |
| GET | `/api/dream/user/:deviceId` | Kullanıcı bakiye + premium |
| GET | `/api/dream/prices` | Fiyatlar + paketler |

### Moon Astro

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/moon/current?lang=tr` | Aktif slot + tüm slotlar (72 saat) |
| GET | `/api/moon/status` | Cache durumu, cron log, slot listesi (admin) |
| POST | `/api/moon/force-generate` | 72h slot zorla yeniden üret (admin) |
| DELETE | `/api/moon/cache` | Tüm slot cache'lerini temizle (admin) |

### Daily Horoscope

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/horoscope/signs?lang=tr` | 12 burç listesi |
| POST | `/api/horoscope/free` | Günlük FREE yorum (cache'den) |
| POST | `/api/horoscope/premium` | Dive Deeper (GPT, 3gs) |
| POST | `/api/horoscope/generate` | Buffer check & fill (admin/cron) |
| GET | `/api/horoscope/status` | Cache durumu, buffer, cron log, per-date (admin) |
| DELETE | `/api/horoscope/cache` | Cache temizle (admin) |

### Natal Chart

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/natal/save` | Natal chart kaydet (güneş/ay/yükselen) |
| GET | `/api/natal/:deviceId` | Kullanıcı natal chart verisi |
| POST | `/api/natal/interpret` | AI yorumu üret (50gs, kalıcı cache) |
| DELETE | `/api/natal/interpret/:deviceId` | Yorum cache'ini temizle (admin) |

### Transit Takvimi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/natal/transits` | Transit analizi üret (1/3/6/12 ay) |
| GET | `/api/natal/transits/:deviceId/latest` | Son transit okuması |
| GET | `/api/natal/transits/:deviceId/status` | Transit durumu |
| DELETE | `/api/natal/transits/:deviceId` | Transit cache temizle |

---

## Prompt Mimarisi

Merkezi `prompts/index.js` hub'i + co-located prompt'lar:

| Kategori | Konum | Tetikleyen | Aciklama |
|----------|-------|------------|----------|
| **Tarot** | `prompts/tarot/{lang}.js` | Kullanici istegi | 16 spread GPT promptlari |
| **Dream Coder** | `dream-coder/prompts/{lang}.js` | Kullanici istegi | A/B/C mod + upsell + JournalPlus |
| **Horoscope** | `prompts/horoscope/{lang}.js` | Kullanici istegi | Dive Deeper premium icerik |
| **Natal Chart** | `prompts/natal/{lang}.js` | Kullanici istegi | Natal chart AI yorumu |
| **Transit Standard** | `natal-transit/prompts/standard-tr.js` | Kullanici istegi | 1/3/6 ay tema-bazli yorum |
| **Transit Yearly** | `natal-transit/prompts/yearly-tr.js` | Kullanici istegi | 12 ay narrative rapor |
| **General** | `prompts/general/tr.js` | Cron/Job | Moon Astro + Horoscope FREE |

Dream Coder ve Transit prompt'lari kendi modulleri icinde tutulur (co-location prensibi). Hub bunlari da import edip disariya ayni API'den sunar.

---

## API Maliyet Analizi

| Ürün | GPT Çağrısı | Maliyet/istek | Gemstone | ROI (min-max) |
|------|-------------|---------------|----------|---------------|
| Tekli Tarot | 1 | ~$0.0015 | 6gs | 16,000% - 32,000% |
| 3'lü Tarot | 1 | ~$0.007 | 14gs | 8,000% - 16,000% |
| 5'li Tarot | 1 | ~$0.0085 | 22gs | 10,300% - 20,700% |
| Dream A | 2 (decode + upsell) | ~$0.0066 | 11gs | 6,600% - 13,300% |
| Dream B | 2 (decode + upsell) | ~$0.0079 | 22gs | 11,100% - 22,200% |
| Dream C | 1 (decode only) | ~$0.0073 | 12gs | 6,500% - 13,100% |
| Upsell Sembol | 0 (önceden hazır) | $0 | 3gs | ∞ (saf kar) |
| JournalPlus | 1 | ~$0.002 | 5gs | 10,000% - 20,000% |
| Horoscope FREE | 1/burç (cron batch) | ~$0.001/burç | 0 | Kullanıcı çekim |
| Horoscope Dive Deeper | 1 | ~$0.003 | 3gs | 4,000% - 8,000% |
| Moon Astro | 1/slot | ~$0.002/slot | 0 | Kullanıcı çekim |
| Natal Chart | 1 | ~$0.015 | 50gs | 13,000%+ |
| Transit 1 Ay | 1 | ~$0.008 | 15gs | 7,500%+ |
| Transit 3 Ay | 1 | ~$0.010 | 30gs | 12,000%+ |
| Transit 12 Ay (Yillik) | 1 | ~$0.012 | 75gs | 25,000%+ |

*Ortalama ROI: %6,500 - %20,000+ (maliyetin 65-200 katı)*

---

## Yes/No v2 Engine

```
confidence = 55 + clarityWeight + orientationMod
orientationMod: upright +8, reversed: low -8, standard -12, high -18
Sınırlar: uncertain 40-75, diğer 45-90
Clarity: >=75% Net | 55-74% Şartlı | <55% Belirsiz
```

---

## Kullanıcı Akışı

```
Welcome (index.tsx)
  ├── Dil seç (TR/EN/DE/ES)
  ├── Premium toggle
  ├── Market → market.tsx
  ├── Ayarlar (Admin Panel)
  │     ├── Moon Astro: buffer durumu, cron log, slot listesi
  │     ├── Daily Horoscope: buffer durumu, cron log, per-date liste
  │     └── Natal Chart: test verisi + hesaplanan veriler
  ├── Moon Astro → Kaydırmalı slot kartları (ana ekranda)
  │     ├── FREE: Sadece aktif slot görünür
  │     ├── PREMIUM: Tüm slotlar erişilebilir
  │     ├── Evre detay → astro/phase.tsx
  │     ├── Burç detay → astro/zodiac.tsx
  │     └── Gezegen detay → astro/planet.tsx
  ├── Tarot → tarot.tsx
  │     ├── FREE: Tekli + Yes/No (hardcoded)
  │     └── PREMIUM: 16 açılım (GPT, gemstone)
  ├── Dream Coder → dream/index.tsx
  │     ├── A (11gs) → input → result (overall + beats + keywords + 1 sembol)
  │     ├── B (22gs) → input → result (+ pattern + journal + 3 sembol + tavsiye)
  │     └── C (12gs, premium) → input → result (+ plan + journal + tavsiye)
  ├── Daily Horoscope → horoscope/index.tsx
  │     ├── Burç seçimi (12 burç grid)
  │     └── Detay → horoscope/detail.tsx
  │           ├── FREE: headline + body + do/dont
  │           ├── Dün / Bugün / Yarın navigasyonu
  │           └── PREMIUM: Dive Deeper (3gs veya 1 ücretsiz/gün)
  └── Natal Chart → natal/detail.tsx
        ├── Güneş / Ay / Yükselen burç seçimi
        ├── Element dengesi (donut ring + glassmorphism barlar)
        └── AI Yorum (50gs) → Gezegenler, Açılar, Evler, Node, Güçler/Zorluklar
```

---

## Ortam Değişkenleri

```
OPENAI_API_KEY=sk-proj-...
DEEPL_API_KEY=...
PORT=3001
```

---

## Kurulum

```bash
# Backend
cd backend && cp .env.example .env && npm install && node index.js

# Frontend
cd tarot-app && npm install && npx expo start
```

---

## Notlar

- **Ortak users.json**: Tarot + Dream Coder + Horoscope + Natal aynı DB (deviceId bazlı)
- **Ortak deviceId**: AsyncStorage ile kalıcı
- **Ortak gemstone**: Tüm modüller aynı bakiyeyi kullanır
- **Premium süresi dolunca**: Backend otomatik `isPremiumSubscriber: false`
- **Horoscope cache**: Rolling-window buffer (today+2 sınırı), 7 günlük pencere tutulur
- **Horoscope cron**: UTC 00:05 günlük buffer kontrolü, eksikse 3 günlük üretim
- **Dive Deeper cache**: device+sign+date bazlı, 4 günden eski girdiler temizlenir
- **Moon slot cache**: 72 saatlik pencere, aynı kombinasyon tekrar kullanılır
- **Moon cron**: 00:00/06:00/12:00/18:00 UTC, kalan < 24h ise 72h yeniden üretim
- **Natal chart cache**: device bazlı kalıcı, yorumlar saklanır
- **Drift Checker**: Backend başlarken veri tutarlılığı kontrol edilir
- **Prompt Hub**: `prompts/index.js` merkezi yonetim + co-located prompt'lar (dream-coder, natal-transit)
- **Transit Pipeline**: 1/3/6 ay standard mod (tema+tier), 12 ay yearly narrative mod (faz+rapor)
- **Her modul kendi README'sine sahip**: `backend/{modul}/README.md`
- **DeepL çeviri stratejisi**: Moon + Horoscope FREE → TR'de üret, DeepL ile çevir. Horoscope Dive Deeper + Natal → doğrudan hedef dilde üret
- **Idempotency**: `requestId` ile duplicate önlenir
- **Market**: Bilgi amaçlı, satın alma entegrasyonu henüz yok
