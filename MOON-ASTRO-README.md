# Moon Astro — Slot Bazli Dinamik Astroloji Sistemi

## Genel Bakis

Moon Astro, Astrolic uygulamasinin gercek zamanli astroloji moduludur. Astronomik algoritmalarla Ay evresi, Ay burcu ve gunun gezegenini hesaplar. ChatGPT ile Turkce icgoru uretir, DeepL ile 4 dile cevirir ve kaydirmali kart arayuzuyle sunar.

## Mimari

```
Backend (Node.js / Express)
├── utils/moon.js              — Astronomi hesaplayici (evre, burc, gecisler, slotlar)
├── prompts/moon-daily-tr.js   — ChatGPT Style DNA promptu
├── moon/index.js              — REST API + slot cache + DeepL ceviri
└── data/{tr,en,de,es}/moon-slots.json — Dil bazli slot cache

Frontend (React Native / Expo)
├── utils/moon.ts              — Tipler + suncalc yardimcilari
├── components/ui/Moon3D.tsx   — 3D ay kuresi (expo-gl + three.js)
├── components/ui/Planet3D.tsx — 3D gezegen kuresi
├── components/ui/Zodiac3D.tsx — Burc illustrasyonu (PNG)
├── app/index.tsx              — Ana ekran, kaydirmali slot kartlari
├── app/astro/phase.tsx        — Ay evresi detay ekrani
├── app/astro/zodiac.tsx       — Ay burcu detay ekrani
└── app/astro/planet.tsx       — Gezegen detay ekrani
```

## Slot Sistemi

"Slot", Ay evresi + Ay burcu + gunun gezegeni uclusunun degismedigi zaman dilimidir. 72 saatlik pencerede tipik olarak 5-8 slot olusur. her değişiklik bir yeni bir slota sebep verir. 

### Slot Uretim Akisi

1. `getTransitions(simdi, 72)` — 72 saat icindeki tum evre, burc ve gezegen gecislerini bulur
2. `buildSlots(gecisler, baslangic, bitis)` — Gecis sinirlarindan slot listesi olusturur
3. Icerigi olmayan her slot icin ChatGPT Turkce icerik uretir (1 istek = 1 slot)
4. DeepL ile TR icerik EN, DE, ES'e cevrilir (DE/ES icin `formality: "less"` — sen dili)
5. 4 dil cache dosyasina kaydedilir

### Cache Dogrulama

- Cache gecerliligi: son slot `end` zamani gecilmedigi surece cache gecerli
- Icerik tekrar kullanimi: Ayni evre+burc+gezegen kombinasyonu varsa ve format gecerliyse (`firsat` + `ayna` key'leri) ChatGPT'ye gitmeden eski icerik kullanilir
- Esazamanlilik kilidi: Paralel uretim isteklerini onler

### Cron — Proaktif Buffer Kontrolü

Her 6 saatte bir (00:00, 06:00, 12:00, 18:00 UTC) buffer kontrolü yapilir:
- Kalan sure < 24 saat → 72 saatlik slot yeniden uretilir (`checkAndRefreshMoon(force=false)`)
- Kalan sure >= 24 saat → Sessizce atlanir
- Server startup'ta 5 saniye sonra da kontrol yapilir
- Admin panelinden `POST /api/moon/force-generate` ile zorla uretim tetiklenebilir

## Astronomi Hesaplayici (`utils/moon.js`)

### Ay Evresi (10 faz)
`lunarphase-js` ay yasi + balsamik ve yayici fazlar icin ozel sinirlar:
- yeni_ay, hilal_ay, ilk_dordun, siskin_ay, dolunay
- yayici_ay, azalan_dolunay, son_dordun, azalan_hilal, balsamik_ay

### Ay Burcu
J2000.0 epoch ekliptik boylam hesabi:
```
L = (218.3165 + 13.17639648 * d) % 360
+ 6.29 * sin(M)  // anomali duzeltmesi
- 1.27 * sin(M - 2*Ms) + 0.66 * sin(2*Ms) + ...
```
30 derecelik dilimler burc isaretlerine eslestirilir. Gecis zamanlari binary search ile ~1 dakika hassasiyetle bulunur.

### Gunun Gezegeni
UTC gun bazli esleme: Gunes=Pazar, Ay=Pazartesi, Mars=Sali, Merkur=Carsamba, Jupiter=Persembe, Venus=Cuma, Saturn=Cumartesi. Gecis her gece yarisi UTC'de.

## API

### `GET /api/moon/status` (Admin)

Cache durumu, buffer sagligi, cron log ve slot listesi doner. Admin panelinde gosterilir:
- `bufferOk`: Kalan sure 24 saatten fazla mi?
- `slotList[]`: Her slot icin id, start, end, phase, zodiac, planet, hasContent, isCurrent
- `cronEnabled` / `lastCronRun` / `lastCronAction` / `cronTotalRuns`
- `nextCronRun`: Sonraki cron calisma zamani

### `POST /api/moon/force-generate` (Admin)

Kalan sureye bakilmaksizin 72h slot yeniden uretir.

### `GET /api/moon/current?lang=tr`

Dondurur:
```json
{
  "currentSlot": {
    "id": "2026-03-04T...",
    "start": "ISO",
    "end": "ISO",
    "phase": { "key": "full_moon", "name": "Dolunay" },
    "zodiac": { "key": "virgo", "name": "Basak", "element": "Toprak" },
    "planet": { "key": "mercury", "name": "Merkur", "day": "Carsamba" },
    "content": {
      "planet": { "meaning": "...", "advice": "..." },
      "zodiac": { "meaning": "...", "firsat": "...", "his": "..." },
      "phase": { "sentence": "...", "general": "...", "ayna": "..." }
    }
  },
  "nextTransition": { "time": "ISO", "type": "zodiac", "to": "libra" },
  "allSlots": [...],
  "currentIndex": 0
}
```

## Icerik Alanlari

| Ekran | Alan | Aciklama | UI Etiketi |
|-------|------|----------|------------|
| Gezegen | `meaning` | Bu gezegenin enerjisi bugün sende neyi harekete geciriyor (2 cümle) | — |
| Gezegen | `advice` | Spesifik, yapilabilir eylem (1 cümle) | Bugünkü Adim |
| Burc | `meaning` | Ay'in bu burctaki gecisinin duygusal etkisi (2 cümle) | — |
| Burc | `firsat` | Ay'in bu burctaki gecisinin actigi kapi (1 cümle, olumlu) | Firsat |
| Burc | `his` | Hakim duygu tonu (2-3 kelime) | Baslik altinda italik |
| Evre | `sentence` | Gunun ozu (max 6 kelime) | Ana kartta gosterilir |
| Evre | `general` | Evre bugün ne yapiyor (2 cümle) | — |
| Evre | `ayna` | Bu evre sana neyi gosteriyor (1-2 cümle) | Fark Et |

## Lokalize Meta Veriler

Evre isimleri, burc isimleri, gezegen isimleri ve gun isimleri backend'de dil bazli hardcoded (ChatGPT'den gelmiyor). Sadece icerik metinleri ChatGPT (TR) ve DeepL (EN/DE/ES) ile uretilir.

## ChatGPT Promptu (Style DNA v2)

Temel ilkeler:
- **Ses**: Dikkatli bir gozlemcinin sesi. Kisa, yogun, somut.
- **Dil**: Turkce "sen" dili. Her cumle farkli bir fiille baslar.
- **Ton**: Gozlemle, motive etme. Yargilamadan yuzlestir. "-abilir/-ebilir" eki yok, kesin ifadeler.
- **Somutluk**: Gunluk hayattan ornekler. "Duygularini paylas" degil "o soylenmemis cumleyi soyle".
- **Fiil paleti**: aciyor, netlestiriyor, sertlestiriyor, gevsetiyor, buyutuyor, daraltiyor, sikistiriyor, tetikliyor, bastiriyor, kilitliyor, hizlandiriyor, yavasliyor, kesiyor, eritiyor, sarsiyor, catliyor.
- **Cesitlilik**: `firsat` icin her seferinde farkli yasam alani (ev, is, beden, iliskiler, hobiler). `his` icin asla tekrar etmeyen duygu kombinasyonlari.

## Frontend Ozellikleri

### Kaydirmali Slot Kartlari
- `FlatList` horizontal + `snapToInterval` ile sayfa gecisi
- Her slot, Ay'in bulundugu burca gore farkli gradient arka plan (12 benzersiz renk)
- Alt tarih tab'lari kart kaydirilinca otomatik senkronize olur
- Tab'a tiklaninca kart o slota kayar

### Burc Gradientleri
Her burcun kendine ozgu renk paleti:
- Koc: ates kirmizisi | Boga: orman yesili | Ikizler: parlak sari
- Yengec: okyanus mavisi | Aslan: altin turuncu | Basak: koyu mor
- Terazi: pembe lavanta | Akrep: kan kirmizisi | Yay: sicak turuncu
- Oglak: toprak kahve | Kova: neon cyan | Balik: eflatun

### Ucretsiz / Premium Kapisi
- Ucretsiz: Sadece aktif slot gorunur, diger slotlar `expo-blur` ile bulanik
- Premium: Tum slotlar erisilebilir
- Bulanik slota tiklaninca "Premium ile Ac" butonu gorunur

### 3D Gorseller
- `Moon3D`: Three.js kuresi, aydinlanma yuzdesine gore isik yonu degisir
- `Planet3D`: Gezegen bazli renkler (Saturn halkalari var)
- `Zodiac3D`: Her burc icin ozel PNG illustrasyon (`assets/zodiac/`)

### Yukleme Animasyonu
- Ilerleme cubugu (45 saniyede %90'a kadar, veri gelince %100'e atlar)
- Degisen mesajlar: "Yildizlar okunuyor...", "Ay fisildliyor...", "Konumlar hesaplaniyor..."

### Coklu Dil (i18n)
4 dil: TR, EN, DE, ES. Tum UI etiketleri lokalize. Icerik metinleri DeepL ile cevrilir (DE/ES icin samimi ton).

## Bagimliliklar

### Backend
- `lunarphase-js` — Ay evresi hesabi
- `suncalc` — Ay pozisyonu / aydinlanma
- `openai` — ChatGPT icerik uretimi
- `deepl-node` — Ceviri (DE/ES icin formality: "less")

### Frontend
- `expo-gl` + `expo-three` + `three` — 3D render
- `expo-blur` — Premium blur efekti
- `expo-location` — Kullanici konumu (opsiyonel, ay dogus/batis icin)
- `suncalc` — Istemci tarafinda ay aydinlanmasi
- `lunarphase-js` — Evre yardimcilari

## Ortam Degiskenleri

```
OPENAI_API_KEY=sk-proj-...
PORT=3001
DEEPL_API_KEY=...
```

## Dosya Yapisi

```
backend/
  utils/moon.js                — Astronomi hesaplayici
  prompts/moon-daily-tr.js     — ChatGPT promptu
  moon/index.js                — Express router + API
  data/tr/moon-slots.json      — TR slot cache
  data/en/moon-slots.json      — EN slot cache
  data/de/moon-slots.json      — DE slot cache
  data/es/moon-slots.json      — ES slot cache
  zodiac-illustrations/        — Kaynak burc PNG'leri

tarot-app/
  utils/moon.ts                — Tipler + yardimcilar
  components/ui/Moon3D.tsx      — 3D ay
  components/ui/Planet3D.tsx    — 3D gezegen
  components/ui/Zodiac3D.tsx    — Burc illustrasyonu
  assets/zodiac/*.png          — Burc gorselleri
  app/index.tsx                — Ana ekran + slot kartlari
  app/astro/phase.tsx          — Evre detay
  app/astro/zodiac.tsx         — Burc detay
  app/astro/planet.tsx         — Gezegen detay
  app/_layout.tsx              — Route tanimlari
  i18n/translations.ts         — 4 dilde etiketler
  moon-translations.json       — Statik astroloji referans verisi
```
