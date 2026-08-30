// Home tab: the quilt canvas. Weeks stream in a FlatList (current week first);
// each is an SVG of shaded, textured patches with a11y-focusable press
// overlays. Tapping a patch opens a read-only detail sheet. A freshly stitched
// check-in animates in once (skipped under reduce-motion).

import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';

import {
  borderRadius,
  colors,
  familyPalette,
  hitTarget,
  motion,
  mutedPalette,
  spacing,
  typography,
} from '@/constants/theme';
import LayeredClusterVignette from '@/components/LayeredClusterVignette';
import LogoMark from '@/components/LogoMark';
import PaperTexture from '@/components/PaperTexture';
import CoachNote from '@/components/CoachNote';
import { useSettingsStore } from '@/store/settingsStore';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import { homeWeeklySummary } from '@/content/circle';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { findVocabularyWord } from '@/content/vocabulary';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import QuiltWeek from '@/components/QuiltWeek';
import { selectWeekStats, useCheckInStore } from '@/store/checkInStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { CheckIn, EmotionFamilyId } from '@/types/models';
import { useMotion } from '@/hooks/useMotion';
import { dayKey, weekKey } from '@/utils/dates';
import { computeQuiltLayout, offsetForCheckIn, type WeekBlock } from '@/utils/quiltLayout';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** A hint of the palette on the field-guide row — the full key is inside. */
const GUIDE_SWATCH_FAMILIES: EmotionFamilyId[] = ['anger', 'enjoyment', 'sadness', 'anticipation'];

// Settings glyph: three sliders with knobs. The previous gear — a small
// circle with eight radiating spokes — read as a brightness/theme control at
// 22px (device feedback 2026-07-18); sliders are unambiguously settings and
// keep the app's thin-line language.
const SLIDER_ROWS = [
  { y: 7, knob: 15 },
  { y: 12, knob: 9 },
  { y: 17, knob: 16 },
];

function wordLabel(emotionId: string): string {
  return findVocabularyWord(emotionId)?.word.label ?? emotionId;
}

function uniqueFamilies(checkIn: CheckIn): EmotionFamilyId[] {
  const seen: EmotionFamilyId[] = [];
  for (const sel of checkIn.emotions) {
    if (!seen.includes(sel.family)) seen.push(sel.family);
  }
  return seen;
}

function layeredTime(iso: string): string {
  const d = new Date(iso);
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `layered ${hh}:${mm}`;
}

export default function QuiltScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const checkIns = useCheckInStore((s) => s.checkIns);
  const { width } = useWindowDimensions();
  const { reduced: reduceMotion } = useMotion();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [animateId, setAnimateId] = React.useState<string | null>(null);

  // Both entry points to a check-in (header + and the empty-state row) —
  // taking the pointed-at action retires its helper note.
  const beginCheckIn = () => {
    useSettingsStore.getState().dismissTip('note-quilt');
    navigation.navigate('CheckInFlow', { source: 'manual' });
  };

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
  const todayHasEntry = React.useMemo(
    () => checkIns.some((c) => c.dayKey === dayKey(new Date().toISOString())),
    [checkIns]
  );

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

  // A fresh check-in lands at the bottom of the current week (Saturday is the
  // 6th row) — often below the fold, so saving looked like nothing happened
  // (user, 2026-07-18). Scroll it into view; the arrival animation then plays
  // where the eye already is.
  const listRef = React.useRef<FlatList<WeekBlock>>(null);
  React.useEffect(() => {
    if (!animateId) return;
    const offset = offsetForCheckIn(blocks, animateId, spacing.md, spacing.lg);
    if (offset === null) return;
    listRef.current?.scrollToOffset({ offset, animated: !reduceMotion });
  }, [animateId, blocks, reduceMotion]);

  const selected = selectedId
    ? checkIns.find((c) => c.id === selectedId) ?? null
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-quilt">
      <PaperTexture />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your mood layers</Text>
        {/* Once check-ins exist, the field guide lives up here as the small
            layered mark — colour among the ink chrome names it. */}
        {checkIns.length > 0 ? (
          <Pressable
            testID="header-field-guide"
            accessibilityRole="button"
            accessibilityLabel="Field guide"
            style={styles.iconButton}
            onPress={() => navigation.navigate('FieldGuide')}
          >
            <LogoMark size={24} />
          </Pressable>
        ) : null}
        {/* Add lives up here as quiet chrome, twin to settings — no floating
            disc over the quilt (user, 2026-07-18). */}
        <Pressable
          testID="checkin-fab"
          accessibilityRole="button"
          accessibilityLabel="Add a check-in"
          style={styles.iconButton}
          onPress={beginCheckIn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Line x1={12} y1={5} x2={12} y2={19} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={5} y1={12} x2={19} y2={12} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Pressable
          testID="open-settings"
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            {SLIDER_ROWS.map((row) => (
              <React.Fragment key={row.y}>
                <Line
                  x1={4}
                  y1={row.y}
                  x2={20}
                  y2={row.y}
                  stroke={colors.ink}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <Circle
                  cx={row.knob}
                  cy={row.y}
                  r={2.6}
                  fill={colors.paper}
                  stroke={colors.ink}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            ))}
          </Svg>
        </Pressable>
      </View>

      <WeeklySummaryCard summary={weeklySummary} />

      {/* The field guide's home-screen doorway: a FULL row only while the
          screen is brand new (it teaches where the guide lives); once the
          first check-in exists it collapses into the header's layered icon —
          the row was eating half the screen (user, 2026-07-18). */}
      {checkIns.length === 0 ? (
        <Pressable
          testID="home-field-guide"
          accessibilityRole="button"
          accessibilityLabel="Field guide. Learn the emotion families and find the right word."
          style={styles.guideRow}
          onPress={() => navigation.navigate('FieldGuide')}
        >
          <View style={styles.guideSwatches}>
            {GUIDE_SWATCH_FAMILIES.map((family) => (
              <View
                key={family}
                style={[styles.guideSwatch, { backgroundColor: familyPalette[family].shades[3] }]}
              />
            ))}
          </View>
          <Text style={styles.guideText}>Field guide — learn the words →</Text>
        </Pressable>
      ) : null}

      {/* First-ever entry doorway — gone for good once anything is layered
          (user, 2026-07-18: the header + carries every entry after that). */}
      {checkIns.length === 0 ? (
        <Pressable
          testID="checkin-today"
          accessibilityRole="button"
          accessibilityLabel="Layer in today's first entry"
          style={styles.todayRow}
          onPress={beginCheckIn}
        >
          <Text style={styles.todayText}>+ layer in today&apos;s first entry</Text>
        </Pressable>
      ) : null}

      {checkIns.length === 0 ? (
        <View style={styles.empty}>
          {/* The layered cluster in miniature — what a first check-in will
              look like (replaced the dashed placeholder square 2026-07-17). */}
          <LayeredClusterVignette size={72} />
          <Text style={styles.emptyText}>Your layers begin with a single check-in.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
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

      {/* First-visit helper note, floating under the header chrome and
          pointing up at the + (present on day zero AND returning layouts).
          pointerInset ≈ settings icon (minWidth 36) + header gap, aiming the
          tip under the second icon from the right. */}
      <CoachNote
        id="note-quilt"
        topOffset={48}
        pointer="up"
        pointerInset={44}
        style={{ left: spacing.xl }}
      />

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedId(null)}
      >
        {/* The backdrop is a SIBLING behind the sheet, never its parent: a
            Pressable ancestor claims the pan gesture on Android, so a
            ScrollView nested inside one cannot scroll at all (this bug was
            reported three times before the ancestry — not the flex sizing —
            was identified as the cause, 2026-07-18). */}
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close check-in details"
            onPress={() => setSelectedId(null)}
          />
          {/* Plain View + a start-responder so taps on the card are swallowed
              (they'd otherwise fall through to the backdrop and dismiss),
              while the ScrollView below still wins the move gesture. */}
          {/* Raised paper, deliberately NOT the family tint: with the
              re-tuned (more saturated) fills the whole sheet read as a wall
              of colour behind the words (user, 2026-07-18) — the thread
              spine alone ties the sheet to its patch. */}
          <View
            onStartShouldSetResponder={() => true}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
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
                {/* A check-in with many emotions overflows the screen — the
                    sheet caps its height and scrolls FROM THE TOP, instead of
                    growing past the status bar (bug, 2026-07-17). */}
                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetScrollContent}
                  showsVerticalScrollIndicator={false}
                >
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
                <Text style={styles.stitchedAt}>{layeredTime(selected.createdAt)}</Text>
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
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
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
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    flex: 1,
    flexWrap: 'wrap',
  },
  iconButton: {
    minWidth: 36,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: hitTarget,
    paddingVertical: spacing.xs,
  },
  guideSwatches: {
    flexDirection: 'row',
    gap: 3,
  },
  guideSwatch: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.sm,
  },
  guideText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  todayRow: {
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
    marginTop: spacing.xs,
  },
  todayText: {
    ...typography.label,
    color: colors.inkSoft,
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
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
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
    // Tall check-ins scroll inside instead of growing past the screen top.
    maxHeight: '78%',
  },
  sheetSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  sheetScroll: {
    flexGrow: 0,
    // MUST shrink inside the sheet's maxHeight — RN's default flexShrink of 0
    // let long content overflow the hidden clip instead of scrolling, cutting
    // off the bottom (device bug, 2026-07-17).
    flexShrink: 1,
  },
  sheetScrollContent: {
    gap: spacing.sm,
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
