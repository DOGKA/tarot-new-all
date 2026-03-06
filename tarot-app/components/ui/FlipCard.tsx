import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface FlipCardProps {
  isRevealed: boolean;
  cardName?: string;
  orientation?: "upright" | "reversed";
  onPress: () => void;
  disabled?: boolean;
}

export default function FlipCard({
  isRevealed,
  cardName,
  orientation,
  onPress,
  disabled = false,
}: FlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showFront, setShowFront] = useState(false);

  useEffect(() => {
    if (isRevealed && !showFront) {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
      // Show front side halfway through animation
      const timer = setTimeout(() => setShowFront(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealed]);

  // Interpolate rotation for back (unrevealed) side
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Interpolate rotation for front (revealed) side
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  // Opacity to hide backface
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
      <View style={styles.container}>
        {/* Back - unrevealed */}
        <Animated.View 
          style={[
            styles.card, 
            styles.cardBack,
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
            styles.card,
            styles.cardFront,
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
            <Text style={styles.cardName} numberOfLines={2} adjustsFontSizeToFit>
              {cardName || "?"}
            </Text>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    margin: 4,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    borderWidth: 2,
  },
  cardBack: {
    backgroundColor: "#4a3f6b",
    borderColor: "#7c6b9e",
  },
  cardFront: {
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
  cardName: {
    fontSize: 8,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
