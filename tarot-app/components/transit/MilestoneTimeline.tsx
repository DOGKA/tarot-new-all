import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import LottieView from "lottie-react-native";
import type { Milestone } from "./types";

const { width: SCREEN_W } = Dimensions.get("window");
const CONTAINER_W = SCREEN_W - 32;
const CENTER_X = CONTAINER_W / 2;
const BUBBLE_SIZE = 72;

const AMBER = "#fbbf24";

export default function MilestoneTimeline({
  milestones,
}: {
  milestones: Milestone[];
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (milestones.length === 0) return null;

  const count = milestones.length;

  return (
    <View style={s.container}>
      {milestones.map((m, i) => {
        const isExpanded = expandedIdx === i;
        const isRight = i % 2 === 0;
        const progress = count <= 1 ? 1 : i / (count - 1);
        const scale = 0.75 + progress * 0.25;
        const xSpread = 0.10 + progress * 0.10;
        const cx = CENTER_X + (isRight ? 1 : -1) * CONTAINER_W * xSpread;
        const bubbleSize = BUBBLE_SIZE * scale;

        return (
          <View key={i}>
            {/* Energy connection line */}
            {i > 0 && (
              <View style={s.connectorWrap}>
                <Svg width={CONTAINER_W} height={40}>
                  <Path
                    d={(() => {
                      const prevIsRight = (i - 1) % 2 === 0;
                      const prevProgress = count <= 1 ? 1 : (i - 1) / (count - 1);
                      const prevXSpread = 0.10 + prevProgress * 0.10;
                      const prevCx = CENTER_X + (prevIsRight ? 1 : -1) * CONTAINER_W * prevXSpread;
                      return `M ${prevCx} 0 C ${prevCx} 20, ${cx} 20, ${cx} 40`;
                    })()}
                    stroke={AMBER}
                    strokeWidth={1.5}
                    strokeDasharray="8,6"
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.25}
                  />
                </Svg>
              </View>
            )}

            {/* Node row */}
            <View style={s.nodeRow}>
              {/* Lottie bubble */}
              <View
                style={[
                  s.bubbleWrap,
                  {
                    width: bubbleSize,
                    height: bubbleSize,
                    left: cx - bubbleSize / 2,
                  },
                ]}
              >
                <LottieView
                  source={require("../../assets/lottie/bubble.json")}
                  autoPlay
                  loop
                  speed={0.4}
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    opacity: 0.7 + progress * 0.3,
                  }}
                />
                <View style={[s.glyphOverlay, { width: bubbleSize, height: bubbleSize }]}>
                  <Text style={[s.glyph, { fontSize: 14 * scale }]}>
                    {i + 1}
                  </Text>
                </View>
              </View>

              {/* Label */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedIdx(isExpanded ? null : i)}
                style={[
                  s.labelTouch,
                  isRight
                    ? { left: 8, width: cx - bubbleSize / 2 - 16 }
                    : { left: cx + bubbleSize / 2 + 8, width: CONTAINER_W - cx - bubbleSize / 2 - 16 },
                ]}
              >
                <Text
                  style={[s.title, { textAlign: isRight ? "right" : "left" }]}
                  numberOfLines={2}
                >
                  {m.title}
                </Text>
                <Text style={[s.window, { textAlign: isRight ? "right" : "left" }]}>
                  {m.window}
                </Text>
              </TouchableOpacity>

              {/* Invisible tap on bubble */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedIdx(isExpanded ? null : i)}
                style={[
                  s.bubbleTap,
                  {
                    left: cx - bubbleSize / 2,
                    width: bubbleSize,
                    height: bubbleSize,
                    borderRadius: bubbleSize / 2,
                  },
                ]}
              />
            </View>

            {/* Expanded description */}
            {isExpanded && (m.description ?? "") !== "" && (
              <View style={s.descBox}>
                <Text style={s.descText}>{m.description}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: CONTAINER_W,
    alignSelf: "center",
    transform: [
      { perspective: 4400 },
      { rotateX: "10deg" },

    ],
  },
  connectorWrap: {
    width: CONTAINER_W,
    height: 40,
  },
  nodeRow: {
    width: CONTAINER_W,
    height: 80,
    position: "relative",
  },
  bubbleWrap: {
    position: "absolute",
    top: 4,
  },
  glyphOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontWeight: "900",
    color: "rgba(251,191,36,0.8)",
  },
  labelTouch: {
    position: "absolute",
    top: 24,
    justifyContent: "center",
  },
  title: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  window: {
    color: "rgba(251,191,36,0.5)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  bubbleTap: {
    position: "absolute",
    top: 4,
  },
  descBox: {
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: "rgba(251,191,36,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.12)",
    padding: 14,
  },
  descText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
  },
});
