import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const SCREEN = Dimensions.get("window");

interface StarFieldProps {
  count?: number;
  width?: number;
  height?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  delay: number;
  duration: number;
}

export default function StarField({ count = 40, width, height }: StarFieldProps) {
  const w = width || SCREEN.width;
  const h = height || SCREEN.height;

  const stars = useRef<Star[]>(
    Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2.5 + 0.5,
      opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
      delay: Math.random() * 3000,
      duration: Math.random() * 3000 + 2000,
    }))
  ).current;

  useEffect(() => {
    stars.forEach((star) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.2 + 0.05,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ]).start(twinkle);
      };
      twinkle();
    });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#fff",
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}
