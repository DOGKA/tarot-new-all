import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, ImageSourcePropType } from "react-native";

const ZODIAC_IMAGES: Record<string, ImageSourcePropType> = {
  aries: require("../../assets/zodiac/aries.png"),
  taurus: require("../../assets/zodiac/taurus.png"),
  gemini: require("../../assets/zodiac/gemini.png"),
  cancer: require("../../assets/zodiac/cancer.png"),
  leo: require("../../assets/zodiac/leo.png"),
  virgo: require("../../assets/zodiac/virgo.png"),
  libra: require("../../assets/zodiac/libra.png"),
  scorpio: require("../../assets/zodiac/scorpio.png"),
  sagittarius: require("../../assets/zodiac/sagitarius.png"),
  capricorn: require("../../assets/zodiac/capricorn.png"),
  aquarius: require("../../assets/zodiac/aquarius.png"),
  pisces: require("../../assets/zodiac/pisces.png"),
};

interface Zodiac3DProps {
  zodiacKey: string;
  size?: number;
}

export default function Zodiac3D({ zodiacKey, size = 56 }: Zodiac3DProps) {
  const source = ZODIAC_IMAGES[zodiacKey] || ZODIAC_IMAGES.aries;

  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 2500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(168, 85, 247, 0.12)",
  },
});
