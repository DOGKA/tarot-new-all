import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from "react-native";
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

    // Five cards - pyramid style
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

  return (
    <TouchableOpacity onPress={locked ? undefined : onPress} activeOpacity={locked ? 1 : 0.8}>
      <GlassCard style={[styles.card, style, locked && styles.cardLocked]}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            {locked ? (
              <Text style={styles.lockIcon}>🔒</Text>
            ) : (
              renderCardIcons()
            )}
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.title, { color: locked ? "rgba(255,255,255,0.35)" : categoryColor }]}>{title}</Text>
            <Text style={[styles.description, locked && styles.descLocked]}>{description}</Text>
          </View>
          {gemCost !== undefined && (
            <View style={[styles.gemBadge, locked && styles.gemBadgeLocked, { flexDirection: "row", alignItems: "center", gap: 3 }]}>
              {locked ? (
                <Text style={[styles.gemText, styles.gemTextLocked]}>🔒</Text>
              ) : (
                <>
                  <GemstoneIcon size={26} />
                  <Text style={styles.gemText}>{gemCost}</Text>
                </>
              )}
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
  content: {
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
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 18,
  },
  cardLocked: {
    opacity: 0.5,
  },
  descLocked: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  lockIcon: {
    fontSize: 24,
  },
  gemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    marginLeft: 8,
  },
  gemBadgeLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gemText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
  },
  gemTextLocked: {
    color: "rgba(255, 255, 255, 0.3)",
  },
});
