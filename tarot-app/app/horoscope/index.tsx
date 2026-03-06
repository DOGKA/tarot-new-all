import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useApp } from "../../context/AppContext";
import { GradientBackground, StarField, Zodiac3D } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_BASE = `http://${host}:3001/api`;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface ZodiacSign {
  sign: string;
  name: string;
  symbol: string;
  element: string;
  dateRange: string;
}

const ELEMENT_COLORS: Record<string, string[]> = {
  fire:  ["rgba(251,146,60,0.25)", "rgba(234,88,12,0.15)", "rgba(40,20,5,0.9)"],
  earth: ["rgba(74,222,128,0.2)", "rgba(34,197,94,0.1)", "rgba(10,30,15,0.9)"],
  air:   ["rgba(147,197,253,0.25)", "rgba(96,165,250,0.15)", "rgba(10,15,40,0.9)"],
  water: ["rgba(129,140,248,0.25)", "rgba(99,102,241,0.15)", "rgba(15,10,40,0.9)"],
};

const DEFAULT_GRADIENT = ["rgba(168,85,247,0.2)", "rgba(99,102,241,0.1)", "rgba(20,15,40,0.9)"];

export default function HoroscopeSignsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, userSign } = useApp();
  const [signs, setSigns] = useState<ZodiacSign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSigns();
  }, [language]);

  const fetchSigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/horoscope/signs?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSigns(data.data);
      }
    } catch (err) {
      console.warn("Signs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignPress = (sign: string) => {
    router.push({
      pathname: "/horoscope/detail",
      params: { sign },
    });
  };

  return (
    <GradientBackground>
      <StarField count={30} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t("back")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t("horoscopeSelectSign")}</Text>

        {loading ? (
          <ActivityIndicator color="#a855f7" size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {signs.map((z) => {
              const grad = ELEMENT_COLORS[z.element] || DEFAULT_GRADIENT;
              return (
                <TouchableOpacity
                  key={z.sign}
                  style={[styles.signCard, userSign === z.sign && styles.signCardOwn]}
                  activeOpacity={0.8}
                  onPress={() => handleSignPress(z.sign)}
                >
                  <LinearGradient
                    colors={grad as [string, string, ...string[]]}
                    style={styles.signGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Zodiac3D zodiacKey={z.sign} size={56} />
                    <Text style={styles.signName}>{z.name}</Text>
                    <Text style={styles.signDate}>{z.dateRange}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const CARD_SIZE = (SCREEN_WIDTH - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  signCard: {
    width: CARD_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  signCardOwn: {
    borderColor: "rgba(168,85,247,0.6)",
    borderWidth: 2,
  },
  signGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
  },
  signName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  signDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
    fontWeight: "500",
  },
});
