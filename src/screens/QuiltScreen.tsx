// Home tab: the quilt canvas. Weeks stream in a FlatList (current week first);
// each is an SVG of shaded, textured patches with a11y-focusable press
// overlays. Tapping a patch opens a read-only detail sheet. A freshly stitched
// check-in animates in once (skipped under reduce-motion).

import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import {
  borderRadius,
  colors,
  familyPalette,
  hitTarget,
  motion,
  mutedPalette,
  spacing,
  textures,
  typography,
} from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import { homeWeeklySummary } from '@/content/circle';
import { EMOTION_FAMILIES, findEmotionWord } from '@/content/emotions';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import QuiltWeek from '@/components/QuiltWeek';
import { selectWeekStats, useCheckInStore } from '@/store/checkInStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { CheckIn, EmotionFamilyId } from '@/types/models';
import { weekKey } from '@/utils/dates';
import { computeQuiltLayout } from '@/utils/quiltLayout';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAB_SIZE = hitTarget + 12;

// Gear: a circle with 8 spokes, same line language as the tab icons.
const GEAR_SPOKES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4;
  return {
    x1: 12 + Math.cos(angle) * 6,
    y1: 12 + Math.sin(angle) * 6,
    x2: 12 + Math.cos(angle) * 9.5,
    y2: 12 + Math.sin(angle) * 9.5,
  };
});

function wordLabel(emotionId: string): string {
  return findEmotionWord(emotionId)?.word.label ?? emotionId;
}

function uniqueFamilies(checkIn: CheckIn): EmotionFamilyId[] {
  const seen: EmotionFamilyId[] = [];
  for (const sel of checkIn.emotions) {
    if (!seen.includes(sel.family)) seen.push(sel.family);
  }
  return seen;
}

function stitchedTime(iso: string): string {
  const d = new Date(iso);
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `stitched ${hh}:${mm}`;
}

export default function QuiltScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const checkIns = useCheckInStore((s) => s.checkIns);
  const { width } = useWindowDimensions();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [animateId, setAnimateId] = React.useState<string | null>(null);

  // Content width the canvas gets; QuiltWeek reserves a left margin for
  // weekday labels, so the layout engine is handed the already-margin-less
  // width (it lays out patches from x=0).
  const contentWidth = width - spacing.md * 2;
  const blocks = React.useMemo(
    () => computeQuiltLayout(checkIns, contentWidth - 34),
    [checkIns, contentWidth]
  );
  const weeklySummary = React.useMemo(() => {
    const wk = weekKey(new Date().toISOString());
    return homeWeeklySummary(selectWeekStats(checkIns, 0, wk));
  }, [checkIns]);

  // Stitch-in: when the newest check-in id changes (a fresh stitch, not a
  // rehydrate), flag it for the one-shot arrival animation, then clear.
  const prevFirstId = React.useRef<string | null>(checkIns[0]?.id ?? null);
  React.useEffect(() => {
    const firstId = checkIns[0]?.id ?? null;
    if (firstId && firstId !== prevFirstId.current) {
      setAnimateId(firstId);
      const t = setTimeout(() => setAnimateId(null), motion.stitchMs);
      prevFirstId.current = firstId;
      return () => clearTimeout(t);
    }
    prevFirstId.current = firstId;
  }, [checkIns]);

  const selected = selectedId
    ? checkIns.find((c) => c.id === selectedId) ?? null
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-quilt">
      <PaperTexture />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your emotional quilt</Text>
        <Pressable
          testID="open-settings"
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={4} stroke={colors.ink} strokeWidth={1.5} />
            {GEAR_SPOKES.map((spoke, index) => (
              <Line
                key={index}
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={colors.ink}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}
          </Svg>
        </Pressable>
      </View>

      <WeeklySummaryCard summary={weeklySummary} />

      {checkIns.length === 0 ? (
        <View style={styles.empty}>
          <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
            <Rect
              x={1.5}
              y={1.5}
              width={61}
              height={61}
              rx={borderRadius.sm}
              stroke={colors.inkFaint}
              strokeWidth={1.5}
              strokeDasharray={[...textures.stitchDash]}
            />
          </Svg>
          <Text style={styles.emptyText}>Your quilt begins with one square.</Text>
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.weekKey}
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) => (
            <QuiltWeek
              block={item}
              width={contentWidth}
              animateId={animateId}
              onPatchPress={setSelectedId}
            />
          )}
        />
      )}

      <Pressable
        testID="checkin-fab"
        accessibilityRole="button"
        accessibilityLabel="Add a check-in"
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => navigation.navigate('CheckInFlow', { source: 'manual' })}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Line x1={12} y1={5} x2={12} y2={19} stroke={colors.ink} strokeWidth={2} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={19} y2={12} stroke={colors.ink} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedId(null)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close check-in details"
          onPress={() => setSelectedId(null)}
        >
          {/* Inner press is swallowed so tapping the card doesn't dismiss. */}
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.lg },
              // Muted-layer treatment: the sheet wears the check-in's leading
              // family as a whisper tint + thread spine, tying the detail card
              // to the patch that opened it.
              selected
                ? { backgroundColor: mutedPalette[uniqueFamilies(selected)[0]].fill }
                : null,
            ]}
            testID="patch-detail"
          >
            {selected ? (
              <>
                <View
                  style={[
                    styles.sheetSpine,
                    { backgroundColor: mutedPalette[uniqueFamilies(selected)[0]].thread },
                  ]}
                />
                <Text style={styles.sheetTitle}>{buildTitle(selected)}</Text>
                {selected.emotions.map((sel, i) => (
                  <View key={`${sel.emotionId}-${i}`} style={styles.emotionRow}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: familyPalette[sel.family].shades[sel.intensity] },
                      ]}
                    />
                    <Text style={typography.body}>{wordLabel(sel.emotionId)}</Text>
                    <Text style={styles.intensityDot}>· {sel.intensity}</Text>
                  </View>
                ))}
                {selected.note ? <Text style={styles.note}>{selected.note}</Text> : null}
                {selected.bodySensations && selected.bodySensations.length > 0 ? (
                  <View style={styles.chipRow}>
                    {selected.bodySensations.map((s) => (
                      <Text key={s} style={styles.chip}>
                        {s}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.stitchedAt}>{stitchedTime(selected.createdAt)}</Text>
                {uniqueFamilies(selected).map((fam) => (
                  <Pressable
                    key={fam}
                    testID={`about-${fam}`}
                    accessibilityRole="button"
                    accessibilityLabel={`About ${EMOTION_FAMILIES[fam].label}`}
                    style={styles.aboutLink}
                    // Close the detail sheet first, then open the family's
                    // helper — two stacked modals fight for the backdrop.
                    onPress={() => {
                      setSelectedId(null);
                      useHelperSheetStore.getState().open(fam);
                    }}
                  >
                    <Text style={styles.aboutText}>about {EMOTION_FAMILIES[fam].label} →</Text>
                  </Pressable>
                ))}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** The patch a11y label doubles as the detail title (weekday + parts + words). */
function buildTitle(checkIn: CheckIn): string {
  // computeQuiltLayout stamps a11yLabel onto patch layouts, but the detail
  // sheet reads the raw CheckIn — rebuild the same human sentence here.
  const d = new Date(checkIn.createdAt);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const words = checkIn.emotions
    .map((s) => `${wordLabel(s.emotionId).toLowerCase()} ${s.intensity}`)
    .join(', ');
  return `${weekday}: ${words}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    flex: 1,
    flexWrap: 'wrap',
  },
  iconButton: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: FAB_SIZE + spacing.xxl,
    gap: spacing.lg,
  },
  fab: {
    position: 'absolute',
    // Tucked to the bottom-right so it doesn't dominate the centre of the
    // quilt; a quiet paper button with a stitched ink outline, not a solid
    // black disc (device feedback 2026-07-08).
    right: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    padding: spacing.lg,
    gap: spacing.sm,
    // Clip the thread spine into the rounded top corner.
    overflow: 'hidden',
  },
  sheetSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
  },
  intensityDot: {
    ...typography.caption,
  },
  note: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    ...typography.caption,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stitchedAt: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  aboutLink: {
    minHeight: hitTarget,
    justifyContent: 'center',
  },
  aboutText: {
    ...typography.label,
    color: colors.inkSoft,
  },
});
