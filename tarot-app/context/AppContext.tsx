import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Constants from "expo-constants";
import { getDeviceId } from "../utils/deviceId";
import type { Language, SpreadType, SelectedCard, FocusArea } from "../types/tarot";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001/api`;

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Gemstone + Premium
  gemstoneBalance: number;
  isPremium: boolean;
  togglePremium: () => Promise<void>;
  deviceId: string;
  fetchUserInfo: () => Promise<void>;
  // User zodiac sign (for Dive Deeper / Compatibility)
  userSign: string;
  setUserSign: (sign: string) => void;
  // Tarot state
  spreadType: SpreadType | null;
  setSpreadType: (spread: SpreadType | null) => void;
  focusArea: FocusArea;
  setFocusArea: (area: FocusArea) => void;
  selectedCards: SelectedCard[];
  setSelectedCards: (cards: SelectedCard[]) => void;
  resetReading: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [spreadType, setSpreadType] = useState<SpreadType | null>(null);
  const [focusArea, setFocusArea] = useState<FocusArea>("general");
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);

  // Gemstone + Premium
  const [gemstoneBalance, setGemstoneBalance] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [userSign, setUserSign] = useState("aries");

  const togglePremium = async () => {
    if (!deviceId) {
      setIsPremium((p) => !p);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/user/${deviceId}/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: !isPremium }),
      });
      if (!res.ok) {
        setIsPremium((p) => !p);
        return;
      }
      const data = await res.json();
      setIsPremium(Boolean(data?.isPremiumSubscriber));
      await fetchUserInfo();
    } catch {
      setIsPremium((p) => !p);
    }
  };

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const fetchUserInfo = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${API_URL}/user/${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setGemstoneBalance(data.gemstoneBalance ?? 0);
        setIsPremium(data.isPremiumSubscriber ?? false);
      }
    } catch (err) {
      console.warn("User fetch error:", err);
    }
  };

  useEffect(() => {
    if (deviceId) fetchUserInfo();
  }, [deviceId]);

  const resetReading = () => {
    setSpreadType(null);
    setFocusArea("general");
    setSelectedCards([]);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        gemstoneBalance,
        isPremium,
        togglePremium,
        deviceId,
        fetchUserInfo,
        userSign,
        setUserSign,
        spreadType,
        setSpreadType,
        focusArea,
        setFocusArea,
        selectedCards,
        setSelectedCards,
        resetReading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
