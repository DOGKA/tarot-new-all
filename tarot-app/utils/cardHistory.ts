import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "card_draw_history_v1";

export interface CardDrawRecord {
  cardImage: string;
  cardName: string;
  spreadType: string;
  focusArea: string;
  orientation: "upright" | "reversed";
  date: string; // ISO string
}

// Load all history from AsyncStorage
async function loadAll(): Promise<CardDrawRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Record a new card draw
export async function recordCardDraw(record: CardDrawRecord): Promise<void> {
  try {
    const all = await loadAll();
    all.unshift(record); // newest first
    // Keep max 500 records total
    const trimmed = all.slice(0, 500);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[cardHistory] save error:", err);
  }
}

// Get draw history for a specific card image key
export async function getCardHistory(cardImage: string): Promise<CardDrawRecord[]> {
  const all = await loadAll();
  return all.filter(r => r.cardImage === cardImage);
}

// Spread type label map (Turkish)
export const SPREAD_LABELS: Record<string, string> = {
  single_card: "Tekli Kart",
  yes_no: "Evet / Hayır",
  past_present_future: "Geçmiş · Bugün · Gelecek",
  situation_obstacle_advice: "Durum · Engel · Tavsiye",
  destinys_embrace: "Destiny's Embrace",
  love_choice: "Aşk Seçimi",
  path_to_love: "Aşka Giden Yol",
  career_clarity: "Kariyer Netliği",
  career_path_guide: "Kariyer Rehberi",
  new_business_exploration: "Yeni İş Keşfi",
  wealth_flow: "Servet Akışı",
  new_moon_ritual: "Yeni Ay Ritüeli",
  full_moon_release: "Dolunay Bırakışı",
  mind_body_spirit: "Zihin · Beden · Ruh",
  celestial_illumination: "Göksel Aydınlanma",
};

export const FOCUS_LABELS: Record<string, string> = {
  general: "Genel",
  love: "Aşk",
  career: "Kariyer",
  spiritual: "Ruhsal",
};
