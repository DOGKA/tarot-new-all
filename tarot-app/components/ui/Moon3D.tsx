import React from "react";
import { View, Image, StyleSheet } from "react-native";
import Svg, { Circle, Ellipse, Defs, Mask, Rect } from "react-native-svg";

interface Moon3DProps {
  illumination: number;
  size?: number;
  phaseKey?: string;
}

const WANING_PHASES = [
  "full_moon", "dolunay",
  "waning_gibbous", "azalan_gibbous",
  "last_quarter", "son_dordun",
  "waning_crescent", "azalan_hilal",
  "balsamic_moon", "balsamik_ay",
];

export default function Moon3D({ illumination, size = 150, phaseKey }: Moon3DProps) {
  const r = size / 2;
  const phase = Math.max(0, Math.min(1, illumination));
  const ellipseRx = Math.abs(phase * 2 - 1) * r;

  const isWaning = phaseKey
    ? WANING_PHASES.some((p) => phaseKey.toLowerCase().includes(p))
    : phase > 0.5;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: r }]}>
      <Image
        source={require("../../assets/planets/moon.png")}
        style={[styles.image, { width: size, height: size, borderRadius: r }]}
        resizeMode="cover"
      />
      <Svg width={size} height={size} style={styles.svgOverlay}>
        <Defs>
          <Mask id="moonMask">
            <Rect x={0} y={0} width={size} height={size} fill="white" />
            {isWaning ? (
              <>
                <Rect x={0} y={0} width={r} height={size} fill="black" />
                <Ellipse cx={r} cy={r} rx={ellipseRx} ry={r} fill={phase < 0.5 ? "white" : "black"} />
              </>
            ) : (
              <>
                <Rect x={r} y={0} width={r} height={size} fill="black" />
                <Ellipse cx={r} cy={r} rx={ellipseRx} ry={r} fill={phase > 0.5 ? "white" : "black"} />
              </>
            )}
          </Mask>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill="#05081a" opacity={0.92} mask="url(#moonMask)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  image: {
    position: "absolute",
  },
  svgOverlay: {
    position: "absolute",
  },
});
