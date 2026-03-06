import React from "react";
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from "react-native";
import { BlurView } from "expo-blur";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: "default" | "upright" | "reversed";
}

export default function GlassCard({ 
  children, 
  style, 
  intensity = 20,
  variant = "default"
}: GlassCardProps) {
  const shadowColor = 
    variant === "upright" ? "#22c55e" :
    variant === "reversed" ? "#ef4444" :
    "#000";

  // iOS uses BlurView, Android uses semi-transparent background
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          styles.blurContainer,
          variant !== "default" && { shadowColor, ...styles.glowShadow },
          style,
        ]}
      >
        <View style={styles.innerContent}>
          {children}
        </View>
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View
      style={[
        styles.androidContainer,
        variant !== "default" && { shadowColor, ...styles.glowShadow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  innerContent: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
  },
  androidContainer: {
    borderRadius: 16,
    backgroundColor: "rgba(30, 30, 60, 0.8)",
    padding: 16,
  },
  glowShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
