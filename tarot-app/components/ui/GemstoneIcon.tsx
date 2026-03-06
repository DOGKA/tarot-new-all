import React from "react";
import { Image } from "react-native";

const gemstoneImg = require("../../assets/gemstone-ametist.png");

interface GemstoneIconProps {
  size?: number;
}

export default function GemstoneIcon({ size = 16 }: GemstoneIconProps) {
  return (
    <Image
      source={gemstoneImg}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
