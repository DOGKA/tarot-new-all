import React from "react";
import { View, Image, StyleSheet } from "react-native";

interface Moon3DProps {
  illumination: number;
  size?: number;
  phaseKey?: string;
}

export default function Moon3D({ illumination, size = 150 }: Moon3DProps) {
  const shadowOpacity = 1 - illumination;
  const shadowLeft = illumination > 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require("../../assets/planets/moon.jpg")}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
      <View
        style={[
          styles.shadow,
          {
            width: size / 2,
            height: size,
            borderRadius: size / 2,
            opacity: shadowOpacity * 0.85,
            [shadowLeft ? "right" : "left"]: 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 999,
  },
  image: {
    position: "absolute",
  },
  shadow: {
    position: "absolute",
    backgroundColor: "#0a0a1a",
  },
});
