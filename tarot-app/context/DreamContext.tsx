import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Constants from "expo-constants";
import { getDeviceId } from "../utils/deviceId";
import type {
  DreamMode,
  FeelingTag,
  LifeContextTag,
  DreamDecodeResponse,
  DreamPrices,
} from "../types/dream";

// API URL
const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001/api/dream`;

interface DreamContextType {
  // State
  dreamMode: DreamMode;
  setDreamMode: (mode: DreamMode) => void;
  dreamText: string;
  setDreamText: (text: string) => void;
  feelingTags: FeelingTag[];
  setFeelingTags: (tags: FeelingTag[]) => void;
  lifeContextTags: LifeContextTag[];
  setLifeContextTags: (tags: LifeContextTag[]) => void;
  currentResult: DreamDecodeResponse | null;
  setCurrentResult: (result: DreamDecodeResponse | null) => void;

  // User info
  gemstoneBalance: number;
  isPremiumSubscriber: boolean;
  deviceId: string;
  prices: DreamPrices;

  // Actions
  fetchUserInfo: () => Promise<void>;
  resetDream: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const DreamContext = createContext<DreamContextType | undefined>(undefined);

const DEFAULT_PRICES: DreamPrices = { A: 11, B: 22, C: 12, UPSELL_SYMBOL: 3, JOURNAL_PLUS: 5 };

export function DreamProvider({ children }: { children: ReactNode }) {
  const [dreamMode, setDreamMode] = useState<DreamMode>("A");
  const [dreamText, setDreamText] = useState("");
  const [feelingTags, setFeelingTags] = useState<FeelingTag[]>([]);
  const [lifeContextTags, setLifeContextTags] = useState<LifeContextTag[]>([]);
  const [currentResult, setCurrentResult] = useState<DreamDecodeResponse | null>(null);

  const [gemstoneBalance, setGemstoneBalance] = useState(0);
  const [isPremiumSubscriber, setIsPremiumSubscriber] = useState(false);
  const [prices, setPrices] = useState<DreamPrices>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  // Load persistent device ID (shared with AppContext)
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
        setIsPremiumSubscriber(data.isPremiumSubscriber ?? false);
      }
    } catch (err) {
      console.warn("Dream user fetch error:", err);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/prices`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } catch {
      // Use defaults
    }
  };

  const resetDream = () => {
    setDreamMode("A");
    setDreamText("");
    setFeelingTags([]);
    setLifeContextTags([]);
    setCurrentResult(null);
  };

  useEffect(() => {
    if (deviceId) {
      fetchUserInfo();
      fetchPrices();
    }
  }, [deviceId]);

  return (
    <DreamContext.Provider
      value={{
        dreamMode,
        setDreamMode,
        dreamText,
        setDreamText,
        feelingTags,
        setFeelingTags,
        lifeContextTags,
        setLifeContextTags,
        currentResult,
        setCurrentResult,
        gemstoneBalance,
        isPremiumSubscriber,
        deviceId,
        prices,
        fetchUserInfo,
        resetDream,
        loading,
        setLoading,
      }}
    >
      {children}
    </DreamContext.Provider>
  );
}

export function useDream() {
  const context = useContext(DreamContext);
  if (!context) {
    throw new Error("useDream must be used within DreamProvider");
  }
  return context;
}
