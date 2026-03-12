import React from "react";
import { View } from "react-native";
import LottieView from "lottie-react-native";

interface GemstoneIconProps {
  size?: number;
}

export default function GemstoneIcon({ size = 16 }: GemstoneIconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={require("../../assets/lottie/gem.json")}
        autoPlay
        loop
        speed={0.5}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
