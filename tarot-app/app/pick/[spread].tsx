import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { GradientBackground, GlassCard } from "../../components/ui";
import { shuffleArray, getOrientation } from "../../utils";
import type { Card, SelectedCard, SpreadType, TarotData, FocusArea } from "../../types/tarot";
import Constants from "expo-constants";

// Backend API URL - always use dynamic Expo host IP
const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001`;

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.5;


// Animated FlipCard Component using React Native's Animated API
interface FlipCardProps {
  card: Card;
  index: number;
  isRevealed: boolean;
  orientation?: "upright" | "reversed";
  onPress: () => void;
  disabled: boolean;
}

function FlipCard({ card, index, isRevealed, orientation, onPress, disabled }: FlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showFront, setShowFront] = useState(false);

  useEffect(() => {
    if (isRevealed && !showFront) {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
      const timer = setTimeout(() => setShowFront(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealed]);

  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const glowColor = orientation === "upright" 
    ? "rgba(34, 197, 94, 0.6)" 
    : orientation === "reversed"
    ? "rgba(239, 68, 68, 0.6)"
    : undefined;

  const borderColor = orientation === "upright" 
    ? "#22c55e" 
    : orientation === "reversed"
    ? "#ef4444"
    : "#7c6b9e";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isRevealed}
      activeOpacity={0.8}
    >
      <View style={styles.flipCardContainer}>
        {/* Back - unrevealed */}
        <Animated.View 
          style={[
            styles.flipCard, 
            styles.flipCardBack,
            {
              transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
              opacity: backOpacity,
            }
          ]}
        >
          <View style={styles.cardBackDesign}>
            <Text style={styles.starIcon}>✦</Text>
          </View>
        </Animated.View>

        {/* Front - revealed */}
        <Animated.View
          style={[
            styles.flipCard,
            styles.flipCardFront,
            {
              transform: [
                { perspective: 1000 }, 
                { rotateY: frontRotateY },
                ...(orientation === "reversed" ? [{ rotate: "180deg" }] : []),
              ],
              opacity: frontOpacity,
            },
            showFront && {
              borderColor,
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 10,
            },
          ]}
        >
          {showFront && (
            <Text style={styles.flipCardName} numberOfLines={2} adjustsFontSizeToFit>
              {card.name}
            </Text>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function PickScreen() {
  const { spread } = useLocalSearchParams<{ spread: SpreadType }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setSelectedCards, focusArea, setFocusArea, isPremium } = useApp();

  const [deck, setDeck] = useState<Card[]>([]);
  const [revealedCards, setRevealedCards] = useState<Map<number, "upright" | "reversed">>(new Map());
  const [selected, setSelected] = useState<SelectedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [tarotData, setTarotData] = useState<TarotData | null>(null);

  const requiredCards = spread === "single_card" || spread === "yes_no" ? 1 
    : spread === "love_choice" || spread === "path_to_love" || spread === "new_moon_ritual" || spread === "full_moon_release" || spread === "new_business_exploration" || spread === "wealth_flow" ? 5 
    : 3;

  // Position arrays for different spreads
  const positionArrays: Record<string, string[]> = {
    past_present_future: ["past", "present", "future"],
    situation_obstacle_advice: ["situation", "obstacle", "advice"],
    destinys_embrace: ["destiny", "path", "union"],
    love_choice: ["optionA", "optionA_outcome", "optionB", "optionB_outcome", "advice"],
    path_to_love: ["self", "block", "need", "action", "potential"],
    new_moon_ritual: ["intention", "seed", "shadow", "support", "firstStep"],
    full_moon_release: ["illumination", "tension", "lesson", "release", "integration"],
    mind_body_spirit: ["mind", "body", "spirit"],
    celestial_illumination: ["signal", "guidance", "integration"],
    career_clarity: ["current", "challenge", "clarity"],
    career_path_guide: ["strength", "opportunity", "direction"],
    new_business_exploration: ["idea", "foundation", "challenge", "opportunity", "shift"],
    wealth_flow: ["income", "block", "resource", "growth", "balance"],
  };

  const getSpreadTitle = () => {
    const titles: Record<string, string> = {
      single_card: "singleCard",
      yes_no: "yesNo",
      past_present_future: "threeCards",
      situation_obstacle_advice: "situationObstacleAdvice",
      destinys_embrace: "destinysEmbrace",
      love_choice: "loveChoice",
      path_to_love: "pathToLove",
      new_moon_ritual: "newMoonRitual",
      full_moon_release: "fullMoonRelease",
      mind_body_spirit: "mindBodySpirit",
      celestial_illumination: "celestialIllumination",
      career_clarity: "careerClarity",
      career_path_guide: "careerPathGuide",
      new_business_exploration: "newBusinessExploration",
      wealth_flow: "wealthFlow",
    };
    return t(titles[spread || ""] || "threeCards");
  };

  // Fetch cards from API when language changes
  useEffect(() => {
    const fetchCards = async () => {
      setCardsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/cards/${language}`);
        if (!response.ok) throw new Error("Failed to fetch cards");
        const data: TarotData = await response.json();
        setTarotData(data);
        setDeck(shuffleArray(data.cards));
        setRevealedCards(new Map());
        setSelected([]);
      } catch (error) {
        console.error("Error fetching cards:", error);
        // Fallback: try English
        try {
          const fallback = await fetch(`${API_URL}/api/cards/en`);
          const data: TarotData = await fallback.json();
          setTarotData(data);
          setDeck(shuffleArray(data.cards));
        } catch (e) {
          console.error("Fallback also failed:", e);
        }
      } finally {
        setCardsLoading(false);
      }
    };
    fetchCards();
  }, [language]);

  const handleCardTap = (card: Card, index: number) => {
    if (selected.length >= requiredCards) return;
    if (revealedCards.has(index)) return;

    // Merkezi RNG kullanarak orientation belirle (%30 ters)
    const orientation = getOrientation({ reversedRate: 0.3, reversalsEnabled: true });
    
    let position: SelectedCard["position"];
    const positions = positionArrays[spread || ""];
    if (positions) {
      position = positions[selected.length] as SelectedCard["position"];
    }

    const newSelected: SelectedCard = {
      card,
      orientation,
      position,
    };

    setRevealedCards((prev) => new Map(prev).set(index, orientation));
    setSelected((prev) => [...prev, newSelected]);
  };

  const handleContinue = () => {
    setSelectedCards(selected);
    if (spread === "yes_no") {
      router.push("/yesno-result");
    } else if (isPremium) {
      router.push("/premium-result");
    } else {
      router.push("/result");
    }
  };

  const handleShuffle = () => {
    if (!tarotData) return;
    setDeck(shuffleArray(tarotData.cards));
    setRevealedCards(new Map());
    setSelected([]);
  };

  // Loading state while fetching cards
  if (cardsLoading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>{t("shuffle") || "Yükleniyor..."}</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← {t("back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getSpreadTitle()}</Text>
        <TouchableOpacity onPress={handleShuffle} disabled={selected.length > 0}>
          <Text style={[styles.shuffleButton, selected.length > 0 && styles.shuffleButtonDisabled]}>
            {t("shuffle")}
          </Text>
        </TouchableOpacity>
      </View>


      {/* Selected Cards Display - Minimal chips */}
      <View style={styles.selectedSection}>
        <Text style={styles.selectedTitle}>
          {selected.length}/{requiredCards} {t("selectCard")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.selectedCards}>
            {selected.map((sel, i) => (
              <View key={i} style={styles.selectedCard}>
                <Text style={styles.selectedCardName}>{sel.card.name}</Text>
                <Text style={[
                  styles.selectedCardOrientation,
                  { color: sel.orientation === "upright" ? "#22c55e" : "#ef4444" }
                ]}>
                  {sel.orientation === "upright" ? "↑" : "↓"} {t(sel.orientation)}
                </Text>
                {sel.position && (
                  <Text style={styles.selectedCardPosition}>
                    {t(sel.position === "shadow" ? "hiddenResistance" : sel.position)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Card Deck with Flip Animation */}
      <ScrollView contentContainerStyle={styles.deckContainer}>
        <View style={styles.deck}>
          {deck.map((card, index) => {
            const orientation = revealedCards.get(index);
            const isRevealed = revealedCards.has(index);
            return (
              <FlipCard
                key={`${card.id}-${index}`}
                card={card}
                index={index}
                isRevealed={isRevealed}
                orientation={orientation}
                onPress={() => handleCardTap(card, index)}
                disabled={selected.length >= requiredCards}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selected.length === requiredCards && (
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>{t("yourReading")} →</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    color: "#a855f7",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  shuffleButton: {
    color: "#a855f7",
    fontSize: 16,
  },
  shuffleButtonDisabled: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  selectedSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    marginBottom: 12,
  },
  selectedCards: {
    flexDirection: "row",
    gap: 8,
  },
  selectedCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedCardName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  selectedCardOrientation: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  selectedCardPosition: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  deckContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  deck: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  // FlipCard styles
  flipCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    margin: 2,
  },
  flipCard: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    backfaceVisibility: "hidden",
  },
  flipCardBack: {
    backgroundColor: "#4a3f6b",
    borderColor: "#7c6b9e",
  },
  flipCardFront: {
    backgroundColor: "#2a2545",
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 4,
  },
  cardBackDesign: {
    opacity: 0.6,
  },
  starIcon: {
    fontSize: 18,
    color: "#9b87c4",
  },
  flipCardName: {
    fontSize: 8,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  continueButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#a855f7",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
