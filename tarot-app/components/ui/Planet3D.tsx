import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";

const PLANET_IMAGES: Record<string, ImageSourcePropType> = {
  sun: require("../../assets/planets/sun.png"),
  moon: require("../../assets/planets/moon.png"),
  mars: require("../../assets/planets/mars.png"),
  mercury: require("../../assets/planets/mercury.png"),
  jupiter: require("../../assets/planets/jupiter.png"),
  venus: require("../../assets/planets/venus.png"),
  saturn: require("../../assets/planets/saturn.png"),
  uranus: require("../../assets/planets/uranus.png"),
  neptune: require("../../assets/planets/neptune.png"),
  pluto: require("../../assets/planets/pluto.png"),
};

interface Planet3DProps {
  planetKey: string;
  size?: number;
}

export default function Planet3D({ planetKey, size = 120 }: Planet3DProps) {
  const source = PLANET_IMAGES[planetKey] || PLANET_IMAGES.moon;
  const isSaturn = planetKey === "saturn";
  const displayWidth = isSaturn ? size * 1.6 : size;

  return (
    <View style={[styles.container, { width: displayWidth, height: size }]}>
      <Image
        source={source}
        style={[
          styles.planet,
          {
            width: isSaturn ? displayWidth : size,
            height: size,
            borderRadius: isSaturn ? 0 : size / 2,
          },
        ]}
        resizeMode={isSaturn ? "contain" : "cover"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  planet: {
    zIndex: 1,
  },
});
