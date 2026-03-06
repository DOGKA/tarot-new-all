import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { GradientBackground, GlassCard, PremiumPreview } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

// Backend API URL
const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001`;

// API response types
interface CardReading {
  position: string | null;
  cardKey: string;
  name: string;
  orientation: "upright" | "reversed";
  meaning: string;
  arcana?: string;
  suit?: string;
  element?: string;
  reversalStyle?: "delay" | "internal" | "shadow" | "imbalance" | "blocked";
}

// ReversalStyle color map (no emojis, colors only)
const reversalStyleColors: Record<string, string> = {
  delay: "#f59e0b",      // Amber - waiting/timing
  internal: "#8b5cf6",   // Purple - inner work
  shadow: "#6b7280",     // Gray - hidden
  imbalance: "#ec4899",  // Pink - excess
  blocked: "#ef4444",    // Red - stopped
};

interface FreeReadingResponse {
  spread: string;
  focusArea: string;
  language: string;
  cards: CardReading[];
  meta: {
    totalCards: number;
    reversedCount: number;
    majorCount: number;
  };
  warnings?: string[];
}

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCards, isPremium, spreadType, resetReading, focusArea, language } = useApp();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<FreeReadingResponse | null>(null);

  // Fetch FREE reading from backend
  useEffect(() => {
    const fetchReading = async () => {
      if (selectedCards.length === 0 || !spreadType) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/reading/free`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            spread: spreadType,
            focusArea,
            cards: selectedCards.map(sel => ({
              cardKey: sel.card.image, // Use image as cardKey
              orientation: sel.orientation,
              position: sel.position || null,
            })),
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "API request failed");
        }

        const data: FreeReadingResponse = await response.json();
        setReading(data);
      } catch (err) {
        console.error("[result] Error fetching reading:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, [selectedCards, spreadType, language, focusArea]);

  const handleNewReading = () => {
    resetReading();
    router.replace("/");
  };

  const handleGoDive = () => {
    if (isPremium) {
      router.push("/premium-result");
    } else {
      setShowPremiumModal(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>{t("shuffle") || "Yükleniyor..."}</Text>
        </View>
      </GradientBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <GradientBackground>
        <View style={styles.errorContainer}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>Hata: {error}</Text>
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

  if (selectedCards.length === 0 || !reading) {
    return (
      <GradientBackground>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No cards selected</Text>
          <TouchableOpacity onPress={handleNewReading}>
            <GlassCard style={styles.newButton}>
              <Text style={styles.newButtonText}>{t("newReading")}</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("yourReading")}</Text>
          <TouchableOpacity onPress={handleNewReading}>
            <Text style={styles.newReadingLink}>{t("newReading")}</Text>
          </TouchableOpacity>
        </View>

        {/* Cards Summary - Minimal Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsSummary}
        >
          {reading.cards.map((card, i) => (
            <View key={i} style={styles.cardChip}>
              <Text style={styles.cardChipName} numberOfLines={1}>
                {card.name}
              </Text>
              <Text style={[
                styles.cardChipOrientation,
                { color: card.orientation === "upright" ? "#22c55e" : "#ef4444" }
              ]}>
                {card.orientation === "upright" ? "↑" : "↓"}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Focus area badge */}
        <View style={styles.focusBadgeContainer}>
          <View style={styles.focusBadge}>
            <Text style={styles.focusBadgeText}>{t(reading.focusArea)}</Text>
          </View>
        </View>

        {/* Card Meanings - from API */}
        <View style={styles.meaningsSection}>
          {reading.cards.map((card, i) => (
            <GlassCard key={i} style={styles.meaningCard}>
              {/* Position Label */}
              {card.position && (
                <Text style={[
                  styles.positionLabel,
                  { color: card.orientation === "upright" ? "#22c55e" : "#ef4444" }
                ]}>
                  {t(card.position === "shadow" ? "hiddenResistance" : card.position)}
                </Text>
              )}
              
              {/* Card Name */}
              <Text style={styles.cardNameLabel}>{card.name}</Text>
              
              {/* Orientation */}
              <Text style={[
                styles.orientationLabel,
                { color: card.orientation === "upright" ? "#22c55e" : "#ef4444" }
              ]}>
                {card.orientation === "upright" ? "↑" : "↓"} {t(card.orientation)}
              </Text>
              
              {/* ReversalStyle Badge - only for reversed cards */}
              {card.orientation === "reversed" && card.reversalStyle && (
                <View style={[
                  styles.reversalBadge,
                  { backgroundColor: reversalStyleColors[card.reversalStyle] + "20" }
                ]}>
                  <View style={[
                    styles.reversalDot,
                    { backgroundColor: reversalStyleColors[card.reversalStyle] }
                  ]} />
                  <Text style={[
                    styles.reversalText,
                    { color: reversalStyleColors[card.reversalStyle] }
                  ]}>
                    {t(`reversal${card.reversalStyle.charAt(0).toUpperCase() + card.reversalStyle.slice(1)}`)}
                  </Text>
                </View>
              )}
              
              {/* Meaning from API */}
              <Text style={styles.meaningText}>
                {card.meaning}
              </Text>
            </GlassCard>
          ))}
        </View>

        {/* Premium Section */}
        {isPremium ? (
          // Premium User - Go Dive Button
          <TouchableOpacity onPress={handleGoDive} activeOpacity={0.8}>
            <LinearGradient
              colors={["#a855f7", "#6366f1"]}
              style={styles.goDiveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.goDiveButtonText}>✨ {t("goDive")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Free User - Premium Preview (spread-specific)
          <PremiumPreview 
            spreadType={spreadType || "single_card"} 
            focusArea={focusArea}
            onUnlock={() => setShowPremiumModal(true)} 
          />
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Premium Modal */}
      {showPremiumModal && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modal}>
            <Text style={styles.modalTitle}>{t("premiumFeature")}</Text>
            <Text style={styles.modalText}>
              Unlock deep dive readings with shadow analysis, blockers, mantras,
              and journal prompts.
            </Text>
            <TouchableOpacity
              onPress={() => setShowPremiumModal(false)}
            >
              <LinearGradient
                colors={["#a855f7", "#6366f1"]}
                style={styles.modalButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 18,
    marginBottom: 20,
  },
  newButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  newButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  newReadingLink: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "500",
  },
  cardsSummary: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  cardChipName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    maxWidth: 100,
  },
  cardChipOrientation: {
    fontSize: 14,
    fontWeight: "bold",
  },
  focusBadgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  focusBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a855f7",
  },
  focusBadgeText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  meaningsSection: {
    padding: 16,
    gap: 12,
  },
  meaningCard: {
    marginBottom: 4,
  },
  positionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  cardNameLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orientationLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  reversalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  reversalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  reversalText: {
    fontSize: 11,
    fontWeight: "600",
  },
  meaningText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 24,
  },
  goDiveButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  goDiveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
