import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import GlassCard from "./GlassCard";
import GemstoneIcon from "./GemstoneIcon";

type CardLayout = "single" | "three" | "five";

interface SpreadCardProps {
  title: string;
  description: string;
  cardCount: CardLayout;
  onPress: () => void;
  categoryColor?: string;
  style?: ViewStyle;
  gemCost?: number;
  locked?: boolean;
}

export default function SpreadCard({
  title,
  description,
  cardCount,
  onPress,
  categoryColor = "#a855f7",
  style,
  gemCost,
  locked,
}: SpreadCardProps) {
  const renderCardIcons = () => {
    if (cardCount === "single") {
      return (
        <View style={styles.iconContainer}>
          <View style={[styles.cardIcon, styles.cardIconLarge]} />
        </View>
      );
    }

    if (cardCount === "three") {
      return (
        <View style={styles.iconContainer}>
          <View style={styles.threeCardRow}>
            <View style={styles.cardIcon} />
            <View style={styles.cardIcon} />
            <View style={styles.cardIcon} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>
        <View style={styles.fiveCardTop}>
          <View style={styles.cardIconSmall} />
          <View style={styles.cardIconSmall} />
        </View>
        <View style={styles.fiveCardBottom}>
          <View style={styles.cardIconSmall} />
          <View style={styles.cardIconSmall} />
          <View style={styles.cardIconSmall} />
        </View>
      </View>
    );
  };

  if (locked) {
    return (
      <View style={[styles.card, styles.lockedCard, style]}>
        {/* Blurred content underneath */}
        <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFillObject} />

        {/* Spread info on top of blur */}
        <View style={styles.lockedContent}>
          <View style={styles.lockedLeft}>
            <View style={styles.iconWrapper}>
              {renderCardIcons()}
            </View>
            <View style={styles.textContent}>
              <Text style={styles.lockedTitle}>{title}</Text>
              <Text style={styles.lockedDesc} numberOfLines={3}>{description}</Text>
            </View>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>Premium{"\n"}ile Aç</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={[styles.card, style]}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            {renderCardIcons()}
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.title, { color: categoryColor }]}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          {gemCost !== undefined && (
            <View style={[styles.gemBadge, { flexDirection: "row", alignItems: "center", gap: 3 }]}>
              <GemstoneIcon size={26} />
              <Text style={styles.gemText}>{gemCost}</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  lockedCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  lockedContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  lockedLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 60,
    height: 60,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    width: 16,
    height: 24,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 2,
  },
  cardIconLarge: {
    width: 28,
    height: 42,
    borderRadius: 4,
    borderWidth: 2,
  },
  cardIconSmall: {
    width: 14,
    height: 20,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 1,
    marginVertical: 1,
  },
  threeCardRow: {
    flexDirection: "row",
  },
  fiveCardTop: {
    flexDirection: "row",
    marginBottom: 2,
  },
  fiveCardBottom: {
    flexDirection: "row",
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 5,
  },
  lockedDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 17,
  },
  lockedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    alignItems: "center",
  },
  lockedBadgeText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 16,
  },
  gemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.2)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.4)",
    marginLeft: 8,
  },
  gemText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
  },
});
