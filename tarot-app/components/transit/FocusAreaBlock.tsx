import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_CONFIG } from "./constants";

const { width: SCREEN_W } = Dimensions.get("window");
const CONTAINER_W = SCREEN_W - 32;
const CARD_GAP = 8;
const CARD_W = (CONTAINER_W - CARD_GAP * 4) / 5;
const CARD_H = CARD_W * 1.8;

const AREA_ICONS: Record<string, { name: string; size: number }> = {
  career: { name: "briefcase-outline", size: 26 },
  relationships: { name: "heart-multiple-outline", size: 26 },
  innerLife: { name: "meditation", size: 26 },
  growth: { name: "sprout-outline", size: 26 },
  health: { name: "heart-pulse", size: 26 },
};

const CARD_GRADIENTS: Record<string, [string, string, string]> = {
  career: ["rgba(96,165,250,0.5)", "rgba(37,99,235,0.25)", "rgba(15,20,50,0.95)"],
  relationships: ["rgba(251,113,133,0.5)", "rgba(225,29,72,0.25)", "rgba(15,20,50,0.95)"],
  innerLife: ["rgba(192,132,252,0.5)", "rgba(126,34,206,0.25)", "rgba(15,20,50,0.95)"],
  growth: ["rgba(74,222,128,0.5)", "rgba(22,163,74,0.25)", "rgba(15,20,50,0.95)"],
  health: ["rgba(251,191,36,0.5)", "rgba(234,179,8,0.25)", "rgba(15,20,50,0.95)"],
};

type FocusAreas = {
  career: string;
  relationships: string;
  innerLife: string;
  growth: string;
  health: string;
};

export default function FocusAreasSection({ areas }: { areas: FocusAreas }) {
  const keys = (Object.keys(areas) as (keyof FocusAreas)[]).filter(
    (k) => areas[k] !== ""
  );

  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState<string | null>(
    keys[Math.floor(keys.length / 2)] || null
  );

  if (keys.length === 0) return null;

  const selectedConfig = selectedKey
    ? FOCUS_AREA_CONFIG[selectedKey] || { label: selectedKey, i18nKey: "", color: "#a78bfa" }
    : null;

  return (
    <View style={s.container}>
      {/* Cards row */}
      <View style={s.row}>
        {keys.map((key) => {
          const config = FOCUS_AREA_CONFIG[key] || { label: key, color: "#a78bfa" };
          const isSelected = selectedKey === key;
          const gradient = CARD_GRADIENTS[key] || CARD_GRADIENTS.career;

          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.85}
              onPress={() => setSelectedKey(isSelected ? null : key)}
              style={[
                s.card,
                {
                  marginTop: isSelected ? 0 : 18,
                  borderColor: isSelected ? config.color + "60" : "rgba(255,255,255,0.06)",
                },
              ]}
            >
              <LinearGradient
                colors={gradient}
                style={s.cardGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={(AREA_ICONS[key]?.name || "star-outline") as any}
                  size={AREA_ICONS[key]?.size || 26}
                  color={config.color}
                />
                <Text style={[s.label, { color: config.color }]} numberOfLines={3}>
                  {config.i18nKey ? t(config.i18nKey) : config.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected description */}
      {selectedKey && selectedConfig && (
        <View style={[s.descBox, { borderColor: selectedConfig.color + "20" }]}>
          <Text style={[s.descTitle, { color: selectedConfig.color }]}>
            {selectedConfig.i18nKey ? t(selectedConfig.i18nKey) : selectedConfig.label}
          </Text>
          <Text style={s.descText}>{areas[selectedKey as keyof FocusAreas]}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: CONTAINER_W,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    gap: 4,
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    textAlign: "center",
    lineHeight: 11,
  },
  descBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  descText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 20,
  },
});
