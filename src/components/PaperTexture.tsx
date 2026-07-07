// A whisper of paper grain: sparse fibers + specks over the cream background,
// so surfaces read as paper stock instead of flat colour (device feedback
// 2026-07-08). Deterministic (seeded PRNG) and memoised — the grain never
// dances between renders. Render as the FIRST child of a screen container;
// it fills absolutely and ignores touches. Decorative only (a11y-hidden).

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors } from '@/constants/theme';

// Grain density per 100×100 dp cell.
const FIBERS_PER_CELL = 1.1;
const SPECKS_PER_CELL = 1.6;

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function PaperTexture() {
  const { width, height } = useWindowDimensions();

  const elements = React.useMemo(() => {
    const rand = prng(19260701);
    const cells = (width * height) / (100 * 100);
    const fibers = Math.round(cells * FIBERS_PER_CELL);
    const specks = Math.round(cells * SPECKS_PER_CELL);
    const out: React.ReactElement[] = [];

    for (let i = 0; i < fibers; i++) {
      const x = rand() * width;
      const y = rand() * height;
      const len = 3 + rand() * 7;
      const angle = rand() * Math.PI;
      out.push(
        <Line
          key={`f${i}`}
          x1={x}
          y1={y}
          x2={x + Math.cos(angle) * len}
          y2={y + Math.sin(angle) * len}
          stroke={colors.inkFaint}
          strokeWidth={0.5}
          opacity={0.10}
        />
      );
    }
    for (let i = 0; i < specks; i++) {
      out.push(
        <Circle
          key={`s${i}`}
          cx={rand() * width}
          cy={rand() * height}
          r={0.4 + rand() * 0.5}
          fill={colors.inkFaint}
          opacity={0.12}
        />
      );
    }
    return out;
  }, [width, height]);

  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {elements}
    </Svg>
  );
}

export default PaperTexture;
