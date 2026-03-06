import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { GradientBackground, GlassCard, PremiumPreview } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import type { YesNoReading } from "../types/tarot";
import Constants from "expo-constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.65, 260);

// Backend API URL - dynamic based on Expo host
const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001`;

// Answer colors
const getAnswerColor = (answer: string): string => {
  if (answer === "yes") return "#22c55e"; // Yeşil - Evet
  if (answer === "no") return "#ef4444"; // Kırmızı - Hayır
  return "#a855f7"; // Mor - Belirsiz
};

// Answer glow colors (lighter version for glow)
const getAnswerGlowColor = (answer: string): string => {
  if (answer === "yes") return "#4ade80";
  if (answer === "no") return "#f87171";
  return "#c084fc";
};

// Answer dark colors (for inner shadow)
const getAnswerDarkColor = (answer: string): string => {
  if (answer === "yes") return "#166534";
  if (answer === "no") return "#991b1b";
  return "#6b21a8";
};

// Answer icons - horizontal arrows based on design
const getAnswerIcon = (answer: string): string => {
  if (answer === "yes") return "→";
  if (answer === "no") return "←";
  return "?";
};

// Progress bar gradients based on answer type
const getProgressBarGradient = (answer: string): readonly [string, string, string] => {
  if (answer === "yes") return ["#22c55e", "#16a34a", "#15803d"] as const; // Green
  if (answer === "no") return ["#ef4444", "#dc2626", "#b91c1c"] as const; // Red
  return ["#fbbf24", "#f59e0b", "#d97706"] as const; // Orange/Yellow for uncertain
};

// Moon icon color
const MOON_ICON_COLOR = "#60a5fa";

export default function YesNoResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCards, language, resetReading, focusArea, isPremium } = useApp();

  const [reading, setReading] = useState<YesNoReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReading = async () => {
      if (!selectedCards[0]) {
        setError("No card selected");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/reading`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            spread: "yes_no",
            focusArea,
            isPremium,
            card: {
              name: selectedCards[0].card.name,
              image: selectedCards[0].card.image,
              orientation: selectedCards[0].orientation,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();
        setReading(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, []);

  const handleNewReading = () => {
    resetReading();
    router.replace("/");
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>
            {isPremium ? t("preparingReading") || "Yorumunuz hazırlanıyor..." : t("loading") || "Yükleniyor..."}
          </Text>
        </View>
      </GradientBackground>
    );
  }

  if (error || !reading) {
    return (
      <GradientBackground>
        <View style={styles.errorContainer}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{t("error")}: {error}</Text>
            <TouchableOpacity onPress={handleNewReading}>
              <LinearGradient
                colors={["#a855f7", "#6366f1"]}
                style={styles.retryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.retryButtonText}>{t("newReading")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  const answer = reading.answer || "uncertain";
  const answerColor = getAnswerColor(answer);
  const answerGlowColor = getAnswerGlowColor(answer);
  const answerDarkColor = getAnswerDarkColor(answer);
  const answerIcon = getAnswerIcon(answer);
  const isUncertain = answer === "uncertain";

  const getAnswerText = () => {
    if (answer === "yes") return t("yes") || "EVET";
    if (answer === "no") return t("no") || "HAYIR";
    return t("uncertainAnswer") || "BELİRSİZ";
  };

  // Confidence percentage for progress bar
  const confidencePercent = reading.confidence || 0;

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{reading.title}</Text>
          <TouchableOpacity onPress={handleNewReading}>
            <Text style={styles.newReadingLink}>{t("newReading")}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Answer Display */}
        <View style={styles.answerSection}>
          {/* Outer Glow Circle */}
          <View style={[styles.glowContainer, { shadowColor: answerGlowColor }]}>
            {/* SVG Circle with Glow */}
            <Svg width={CIRCLE_SIZE + 40} height={CIRCLE_SIZE + 40} style={styles.svgCircle}>
              <Defs>
                <RadialGradient id="circleGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor={answerColor} stopOpacity="0.3" />
                  <Stop offset="70%" stopColor={answerColor} stopOpacity="0.1" />
                  <Stop offset="100%" stopColor={answerColor} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle
                cx={(CIRCLE_SIZE + 40) / 2}
                cy={(CIRCLE_SIZE + 40) / 2}
                r={CIRCLE_SIZE / 2 + 15}
                fill="url(#circleGlow)"
              />
            </Svg>

            {/* Main Circle */}
            <View
              style={[
                styles.mainCircle,
                {
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  borderRadius: CIRCLE_SIZE / 2,
                  borderColor: answerColor,
                  shadowColor: answerColor,
                },
              ]}
            >
              {/* Inner Dark Background */}
              <View
                style={[
                  styles.innerCircle,
                  {
                    width: CIRCLE_SIZE - 16,
                    height: CIRCLE_SIZE - 16,
                    borderRadius: (CIRCLE_SIZE - 16) / 2,
                    backgroundColor: answerDarkColor + "40",
                  },
                ]}
              >
                {/* Arrow Icon */}
                <Text style={[styles.arrowIcon, { color: answerColor }]}>
                  {answerIcon}
                </Text>

                {/* Answer Text */}
                <Text style={[styles.answerText, { color: answerColor }]}>
                  {getAnswerText()}
                </Text>

                {/* Clarity Label */}
                {reading.clarityLabel && (
                  <Text style={[styles.clarityLabel, { color: answerColor }]}>
                    {reading.clarityLabel}
                  </Text>
                )}
              </View>
            </View>
          </View>

        {/* Confidence Bar - Horizontal Progress */}
        <View style={styles.confidenceBarContainer}>
          {/* Label */}
          <Text style={styles.confidenceBarLabel}>{t("clarityLevel") || "Netlik Düzeyi"}</Text>
          
          {/* Progress Bar with Moon Icon */}
          <View style={styles.progressBarWrapper}>
            {/* Moon Icon - Overlapping left edge */}
            <View style={styles.moonIconCircle}>
              <Text style={styles.moonIcon}>☽</Text>
              <Text style={styles.moonRunes}>ᛗᚨᛃᛁᚱ</Text>
            </View>
            
            {/* Progress Bar with text inside */}
            <View style={styles.progressBarOuter}>
              <LinearGradient
                colors={getProgressBarGradient(answer)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${confidencePercent}%` }]}
              />
              {/* Percentage Text Inside Bar */}
              <View style={styles.progressBarTextContainer}>
                <Text style={styles.progressBarText}>
                  {reading.confidence}% ({reading.clarityLabel})
                </Text>
              </View>
            </View>
          </View>
        </View>

          {/* Condition Message for Uncertain */}
          {isUncertain && reading.conditionMessage && (
            <Text style={styles.conditionMessage}>
              {reading.conditionMessage}
            </Text>
          )}
        </View>

        {/* Keywords Section - Circular Badges */}
        {reading.keywords && reading.keywords.length > 0 && (
          <View style={styles.keywordsSection}>
            {reading.keywords.map((keyword, index) => {
              // Dynamic font size based on keyword length
              const fontSize = keyword.length > 10 ? 10 : keyword.length > 7 ? 11 : 13;
              return (
                <View
                  key={index}
                  style={[
                    styles.keywordCircle,
                    {
                      borderColor: answerColor,
                      shadowColor: answerColor,
                    },
                  ]}
                >
                  <View style={[styles.keywordInner, { backgroundColor: answerDarkColor + "60" }]}>
                    <Text
                      style={[styles.keywordText, { fontSize }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {keyword}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Explanation */}
        <GlassCard style={styles.explanationSection}>
          <Text style={styles.explanationText}>{reading.explanation}</Text>
        </GlassCard>

        {/* Premium Preview for FREE users */}
        {!isPremium && (
          <PremiumPreview
            spreadType="yes_no"
            focusArea={reading.focusArea}
            onUnlock={() => {
              console.log("Premium unlock requested");
            }}
          />
        )}

        {/* Premium Badge */}
        {isPremium && (
          <LinearGradient
            colors={["#a855f7", "#6366f1"]}
            style={styles.premiumBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.premiumBadgeText}>★ Premium</Text>
          </LinearGradient>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 50,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  newReadingLink: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "500",
  },
  answerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  glowContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  svgCircle: {
    position: "absolute",
  },
  mainCircle: {
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 15,
    backgroundColor: "rgba(0, 10, 30, 0.8)",
  },
  innerCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIcon: {
    fontSize: 56,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  answerText: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  clarityLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    textTransform: "capitalize",
  },
  confidenceBarContainer: {
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  confidenceBarLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    letterSpacing: 1,
  },
  progressBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    position: "relative",
  },
  moonIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 2,
    borderColor: "#60a5fa",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    zIndex: 10,
    shadowColor: "#60a5fa",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  moonIcon: {
    fontSize: 22,
    color: "#60a5fa",
    textShadowColor: "#60a5fa",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  moonRunes: {
    fontSize: 6,
    color: "#60a5fa",
    marginTop: -2,
    letterSpacing: 0.5,
  },
  progressBarOuter: {
    flex: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginLeft: 25,
    justifyContent: "center",
  },
  progressBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
  },
  progressBarTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 25,
  },
  progressBarText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  conditionMessage: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
    maxWidth: 300,
  },
  keywordsSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  keywordCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  keywordInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  keywordText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
    flexShrink: 1,
    color: "#ffffff",
  },
  explanationSection: {
    marginBottom: 20,
    width: "100%",
  },
  explanationText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
  premiumBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  premiumBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 30,
  },
});
