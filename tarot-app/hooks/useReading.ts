import { useState } from "react";
import Constants from "expo-constants";
import type {
  Language,
  FocusArea,
  SelectedCard,
  SingleCardReading,
  ThreeCardReading,
  SOAReading,
  DestinysEmbraceReading,
  LoveChoiceReading,
  PathToLoveReading,
  NewMoonRitualReading,
  FullMoonReleaseReading,
  MindBodySpiritReading,
  CelestialIlluminationReading,
  CareerClarityReading,
  CareerPathGuideReading,
  NewBusinessExplorationReading,
  WealthFlowReading,
} from "../types/tarot";

// Backend API URL - always use dynamic Expo host IP
const hostUri =
  Constants.expoConfig?.hostUri ||
  (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri ||
  (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
    .manifest2?.extra?.expoGo?.debuggerHost;
const host = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${host}:3001`;

// Debug log API URL on load
console.log("[useReading] API_URL:", API_URL, "| hostUri:", hostUri);

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 60000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

interface SingleCardPayload {
  language: Language;
  spread: "single_card";
  focusArea: FocusArea;
  card: {
    name: string;
    orientation: "upright" | "reversed";
  };
}

interface ThreeCardPayload {
  language: Language;
  spread: "past_present_future";
  cards: Array<{
    position: "past" | "present" | "future";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface SOAPayload {
  language: Language;
  spread: "situation_obstacle_advice";
  isPremium: boolean;
  cards: Array<{
    position: "situation" | "obstacle" | "advice";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface DestinysEmbracePayload {
  language: Language;
  spread: "destinys_embrace";
  isPremium: boolean;
  cards: Array<{
    position: "destiny" | "path" | "union";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface LoveChoicePayload {
  language: Language;
  spread: "love_choice";
  isPremium: boolean;
  cards: Array<{
    position: "optionA" | "optionA_outcome" | "optionB" | "optionB_outcome" | "advice";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface PathToLovePayload {
  language: Language;
  spread: "path_to_love";
  isPremium: boolean;
  cards: Array<{
    position: "self" | "block" | "need" | "action" | "potential";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// Spiritual Spread Payloads
interface NewMoonRitualPayload {
  language: Language;
  spread: "new_moon_ritual";
  isPremium: boolean;
  cards: Array<{
    position: "intention" | "seed" | "shadow" | "support" | "firstStep";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface FullMoonReleasePayload {
  language: Language;
  spread: "full_moon_release";
  isPremium: boolean;
  cards: Array<{
    position: "illumination" | "tension" | "lesson" | "release" | "integration";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface MindBodySpiritPayload {
  language: Language;
  spread: "mind_body_spirit";
  isPremium: boolean;
  cards: Array<{
    position: "mind" | "body" | "spirit";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface CelestialIlluminationPayload {
  language: Language;
  spread: "celestial_illumination";
  isPremium: boolean;
  cards: Array<{
    position: "signal" | "guidance" | "integration";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

// ============================================
// CAREER SPREAD PAYLOADS
// ============================================

interface CareerClarityPayload {
  language: Language;
  spread: "career_clarity";
  isPremium: boolean;
  cards: Array<{
    position: "current" | "challenge" | "clarity";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface CareerPathGuidePayload {
  language: Language;
  spread: "career_path_guide";
  isPremium: boolean;
  cards: Array<{
    position: "strength" | "opportunity" | "direction";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface NewBusinessExplorationPayload {
  language: Language;
  spread: "new_business_exploration";
  isPremium: boolean;
  cards: Array<{
    position: "idea" | "foundation" | "challenge" | "opportunity" | "shift";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

interface WealthFlowPayload {
  language: Language;
  spread: "wealth_flow";
  isPremium: boolean;
  cards: Array<{
    position: "income" | "block" | "resource" | "growth" | "balance";
    name: string;
    orientation: "upright" | "reversed";
  }>;
}

export function useReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSingleCardReading = async (
    language: Language,
    selectedCard: SelectedCard,
    focusArea: FocusArea
  ): Promise<SingleCardReading | null> => {
    setLoading(true);
    setError(null);

    const payload: SingleCardPayload = {
      language,
      spread: "single_card",
      focusArea,
      card: {
        name: selectedCard.card.name,
        orientation: selectedCard.orientation,
      },
    };

    try {
      console.log("[useReading] Calling API for single_card...");
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[useReading] single_card response received");
      return data as SingleCardReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      console.error("[useReading] single_card error:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getThreeCardReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<ThreeCardReading | null> => {
    setLoading(true);
    setError(null);

    const payload: ThreeCardPayload = {
      language,
      spread: "past_present_future",
      cards: selectedCards.map((sel) => ({
        position: sel.position as "past" | "present" | "future",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      console.log("[useReading] Calling API for three_card...");
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[useReading] three_card response received");
      return data as ThreeCardReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      console.error("[useReading] three_card error:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSOAReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<SOAReading | null> => {
    setLoading(true);
    setError(null);

    const payload: SOAPayload = {
      language,
      spread: "situation_obstacle_advice",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "situation" | "obstacle" | "advice",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      console.log("[useReading] Calling API for SOA...");
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as SOAReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDestinysEmbraceReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<DestinysEmbraceReading | null> => {
    setLoading(true);
    setError(null);

    const payload: DestinysEmbracePayload = {
      language,
      spread: "destinys_embrace",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "destiny" | "path" | "union",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as DestinysEmbraceReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLoveChoiceReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<LoveChoiceReading | null> => {
    setLoading(true);
    setError(null);

    const payload: LoveChoicePayload = {
      language,
      spread: "love_choice",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "optionA" | "optionA_outcome" | "optionB" | "optionB_outcome" | "advice",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as LoveChoiceReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPathToLoveReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<PathToLoveReading | null> => {
    setLoading(true);
    setError(null);

    const payload: PathToLovePayload = {
      language,
      spread: "path_to_love",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "self" | "block" | "need" | "action" | "potential",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as PathToLoveReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SPIRITUAL SPREADS
  // ============================================

  const getNewMoonRitualReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<NewMoonRitualReading | null> => {
    setLoading(true);
    setError(null);

    const payload: NewMoonRitualPayload = {
      language,
      spread: "new_moon_ritual",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "intention" | "seed" | "shadow" | "support" | "firstStep",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as NewMoonRitualReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFullMoonReleaseReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<FullMoonReleaseReading | null> => {
    setLoading(true);
    setError(null);

    const payload: FullMoonReleasePayload = {
      language,
      spread: "full_moon_release",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "illumination" | "tension" | "lesson" | "release" | "integration",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as FullMoonReleaseReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMindBodySpiritReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<MindBodySpiritReading | null> => {
    setLoading(true);
    setError(null);

    const payload: MindBodySpiritPayload = {
      language,
      spread: "mind_body_spirit",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "mind" | "body" | "spirit",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as MindBodySpiritReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCelestialIlluminationReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<CelestialIlluminationReading | null> => {
    setLoading(true);
    setError(null);

    const payload: CelestialIlluminationPayload = {
      language,
      spread: "celestial_illumination",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "signal" | "guidance" | "integration",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as CelestialIlluminationReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CAREER SPREAD API FUNCTIONS
  // ============================================

  const getCareerClarityReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<CareerClarityReading | null> => {
    setLoading(true);
    setError(null);

    const payload: CareerClarityPayload = {
      language,
      spread: "career_clarity",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "current" | "challenge" | "clarity",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as CareerClarityReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCareerPathGuideReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<CareerPathGuideReading | null> => {
    setLoading(true);
    setError(null);

    const payload: CareerPathGuidePayload = {
      language,
      spread: "career_path_guide",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "strength" | "opportunity" | "direction",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as CareerPathGuideReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getNewBusinessExplorationReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<NewBusinessExplorationReading | null> => {
    setLoading(true);
    setError(null);

    const payload: NewBusinessExplorationPayload = {
      language,
      spread: "new_business_exploration",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "idea" | "foundation" | "challenge" | "opportunity" | "shift",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as NewBusinessExplorationReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getWealthFlowReading = async (
    language: Language,
    selectedCards: SelectedCard[]
  ): Promise<WealthFlowReading | null> => {
    setLoading(true);
    setError(null);

    const payload: WealthFlowPayload = {
      language,
      spread: "wealth_flow",
      isPremium: true,
      cards: selectedCards.map((sel) => ({
        position: sel.position as "income" | "block" | "resource" | "growth" | "balance",
        name: sel.card.name,
        orientation: sel.orientation,
      })),
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/api/reading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as WealthFlowReading;
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı' : err.message)
        : "Unknown error";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetPremiumLogs = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/logs/reset`, {
        method: "POST",
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  };

  return {
    loading,
    error,
    getSingleCardReading,
    getThreeCardReading,
    getSOAReading,
    getDestinysEmbraceReading,
    getLoveChoiceReading,
    getPathToLoveReading,
    getNewMoonRitualReading,
    getFullMoonReleaseReading,
    getMindBodySpiritReading,
    getCelestialIlluminationReading,
    getCareerClarityReading,
    getCareerPathGuideReading,
    getNewBusinessExplorationReading,
    getWealthFlowReading,
    resetPremiumLogs,
  };
}
