import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";

const PLANET_IMAGES: Record<string, ImageSourcePropType> = {
  sun: require("../../assets/planets/sun.jpg"),
  moon: require("../../assets/planets/moon.jpg"),
  mars: require("../../assets/planets/mars.jpg"),
  mercury: require("../../assets/planets/mercury.jpg"),
  jupiter: require("../../assets/planets/jupiter.jpg"),
  venus: require("../../assets/planets/venus.jpg"),
  saturn: require("../../assets/planets/saturn.jpg"),
};

interface Planet3DProps {
  planetKey: string;
  size?: number;
}

export default function Planet3D({ planetKey, size = 120 }: Planet3DProps) {
  const source = PLANET_IMAGES[planetKey] || PLANET_IMAGES.moon;
  const isSaturn = planetKey === "saturn";

  return (
    <View style={[styles.container, { width: isSaturn ? size * 1.4 : size, height: size }]}>
      <Image
        source={source}
        style={[styles.planet, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
      {isSaturn && (
        <Image
          source={require("../../assets/planets/saturn_ring.png")}
          style={[styles.ring, { width: size * 1.4, height: size * 0.4, top: size * 0.3 }]}
          resizeMode="contain"
        />
      )}
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
  ring: {
    position: "absolute",
    zIndex: 2,
    opacity: 0.7,
  },
});
