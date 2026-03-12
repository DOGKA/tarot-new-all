import React, { useMemo, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useTranslation } from "react-i18next";
import { THEME_ICON_KEYS, THEME_I18N_KEYS } from "./constants";
import type { TransitTheme } from "./types";
import ThemeDetailSheet from "./ThemeDetailSheet";

const { width: SCREEN_W } = Dimensions.get("window");
const CONTAINER_W = SCREEN_W - 32;
const BASE_W = 340;
const S = CONTAINER_W / BASE_W;
const OCT_R = 42;

const INTENSITY_STROKE: Record<string, string> = {
  high: "#fbbf24",
  medium: "#a78bfa",
  low: "#6ee7b7",
};
const INTENSITY_FILL: Record<string, string> = {
  high: "rgba(251,191,36,0.10)",
  medium: "rgba(167,139,250,0.08)",
  low: "rgba(110,231,183,0.08)",
};

type NodeData = {
  cx: number;
  cy: number;
  r: number;
  theme: TransitTheme;
  stroke: string;
  fill: string;
};

type LayoutDef = {
  nodes: { x: number; y: number }[];
  h: number;
};

/**
 * Cascading zigzag layouts for 1-6 themes.
 * Octagons connect via flat edges with a small gap (~4 px).
 * Edge-to-edge offsets (apothem = OCT_R·cos π/8 ≈ 38.8):
 *   down-left  : dx=-58  dy=+58  (through edges 4-5 ↔ 0-1)
 *   down-right : dx=+58  dy=+58  (through edges 2-3 ↔ 6-7)
 *   right      : dx=+82  dy=  0  (through edges 1-2 ↔ 5-6)
 */
const TOP_PAD = 30;
const LAYOUTS: Record<number, LayoutDef> = {
  1: {
    nodes: [{ x: 170, y: 54 + TOP_PAD }],
    h: 112 + TOP_PAD,
  },
  2: {
    nodes: [
      { x: 170, y: 54 + TOP_PAD },
      { x: 112, y: 112 + TOP_PAD },
    ],
    h: 170 + TOP_PAD,
  },
  3: {
    nodes: [
      { x: 170, y: 54 + TOP_PAD },
      { x: 112, y: 112 + TOP_PAD },
      { x: 170, y: 170 + TOP_PAD },
    ],
    h: 228 + TOP_PAD,
  },
  4: {
    nodes: [
      { x: 170, y: 54 + TOP_PAD },
      { x: 112, y: 112 + TOP_PAD },
      { x: 170, y: 170 + TOP_PAD },
      { x: 252, y: 170 + TOP_PAD },
    ],
    h: 228 + TOP_PAD,
  },
  5: {
    nodes: [
      { x: 170, y: 54 + TOP_PAD },
      { x: 112, y: 112 + TOP_PAD },
      { x: 170, y: 170 + TOP_PAD },
      { x: 252, y: 170 + TOP_PAD },
      { x: 112, y: 228 + TOP_PAD },
    ],
    h: 286 + TOP_PAD,
  },
  6: {
    nodes: [
      { x: 170, y: 54 + TOP_PAD },
      { x: 112, y: 112 + TOP_PAD },
      { x: 170, y: 170 + TOP_PAD },
      { x: 252, y: 170 + TOP_PAD },
      { x: 112, y: 228 + TOP_PAD },
      { x: 170, y: 286 + TOP_PAD },
    ],
    h: 344 + TOP_PAD,
  },
};

function octPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 + Math.PI / 8 + i * (Math.PI / 4);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function seededScatter(w: number, h: number, count: number, seed: number) {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const x = ((s % 1000) / 1000) * w;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const y = ((s % 1000) / 1000) * h;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = 0.4 + ((s % 100) / 100) * 1.0;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.06 + ((s % 100) / 100) * 0.14;
    out.push({ x, y, r, o });
  }
  return out;
}

export default function ThemeConstellation({
  themes,
}: {
  themes: TransitTheme[];
}) {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<TransitTheme | null>(null);

  const sorted = useMemo(
    () => [...themes].sort((a, b) => b.maxScore - a.maxScore),
    [themes],
  );

  const count = Math.min(sorted.length, 6);
  if (count === 0) return null;

  const layout = LAYOUTS[count] || LAYOUTS[3];
  const svgH = layout.h * S;
  const r = OCT_R * S;

  const nodes: NodeData[] = useMemo(
    () =>
      sorted.slice(0, count).map((theme, i) => ({
        cx: layout.nodes[i].x * S,
        cy: layout.nodes[i].y * S,
        r,
        theme,
        stroke: INTENSITY_STROKE[theme.intensity] || INTENSITY_STROKE.medium,
        fill: INTENSITY_FILL[theme.intensity] || INTENSITY_FILL.medium,
      })),
    [sorted, count, layout, r],
  );

  const stars = useMemo(() => seededScatter(CONTAINER_W, svgH, 30, 42), [svgH]);

  return (
    <View style={[styles.wrapper, { height: svgH }]}>
      <Svg width={CONTAINER_W} height={svgH}>
        <Defs>
          {nodes.map((n, i) => (
            <RadialGradient key={`rg${i}`} id={`rg${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={n.stroke} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={n.stroke} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>

        {/* Ambient star scatter */}
        {stars.map((st, i) => (
          <Circle
            key={`s${i}`}
            cx={st.x}
            cy={st.y}
            r={st.r}
            fill="#fff"
            opacity={st.o}
          />
        ))}

        {/* Glow halos */}
        {nodes.map((n, i) => (
          <Circle
            key={`h${i}`}
            cx={n.cx}
            cy={n.cy}
            r={n.r * 1.7}
            fill={`url(#rg${i})`}
          />
        ))}

        {/* Octagon shapes */}
        {nodes.map((n, i) => (
          <React.Fragment key={`o${i}`}>
            <Polygon
              points={octPoints(n.cx, n.cy, n.r)}
              fill={n.fill}
              stroke={n.stroke}
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            {/* Label */}
            <SvgText
              x={n.cx}
              y={n.cy}
              textAnchor="middle"
              dy={4}
              fontSize={11}
              fontWeight="700"
              fill="rgba(255,255,255,0.88)"
              letterSpacing={0.5}
            >
              {THEME_I18N_KEYS[n.theme.theme] ? t(THEME_I18N_KEYS[n.theme.theme]) : n.theme.label}
            </SvgText>
          </React.Fragment>
        ))}

      </Svg>

      {/* Invisible touch targets */}
      {nodes.map((n, i) => (
        <TouchableOpacity
          key={`t${i}`}
          activeOpacity={0.7}
          onPress={() => setSelectedTheme(n.theme)}
          style={{
            position: "absolute",
            left: n.cx - n.r,
            top: n.cy - n.r,
            width: n.r * 2,
            height: n.r * 2,
            borderRadius: n.r,
          }}
        />
      ))}

      <ThemeDetailSheet
        theme={selectedTheme}
        visible={selectedTheme !== null}
        onClose={() => setSelectedTheme(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CONTAINER_W,
    alignSelf: "center",
    position: "relative",
  },
});
