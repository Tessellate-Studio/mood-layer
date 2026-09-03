// P7 — SVG quilt rendering: QuiltPatch/PatchPreview draw, QuiltWeek exposes
// one accessible pressable per patch, QuiltScreen wires the canvas + detail
// modal. Layout math itself is covered in quiltLayout.test.ts — these tests
// assert the RENDERED contract (testIDs, a11y labels, press behaviour).

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import Svg from 'react-native-svg';

import LogoMark from '@/components/LogoMark';
import QuiltPatch, { PatchPreview } from '@/components/QuiltPatch';
import QuiltWeek from '@/components/QuiltWeek';
import QuiltScreen from '@/screens/QuiltScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { CheckIn, EmotionSelection } from '@/types/models';
import { clothPieces, computeQuiltLayout } from '@/utils/quiltLayout';
import { dayKey } from '@/utils/dates';

const sel = (
  emotionId: string,
  family: EmotionSelection['family'],
  intensity: 1 | 2 | 3 | 4
): EmotionSelection => ({ emotionId, family, intensity });

// Date-stable "now" for layout-driven tests (Thursday of the Jul 6–12 week).
const NOW = new Date('2026-07-09T12:00:00');

function checkIn(overrides: Partial<CheckIn> & { id: string; createdAt: string }): CheckIn {
  return {
    emotions: [sel('sad', 'sadness', 3)],
    resistanceFlags: [],
    source: 'manual',
    dayKey: dayKey(overrides.createdAt),
    ...overrides,
  };
}

const initialCheckIns = useCheckInStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useCheckInStore.setState(initialCheckIns, true);
  useSettingsStore.setState(initialSettings, true);
});

describe('QuiltPatch', () => {
  it('renders a cluster of cloth pieces inside a host Svg', () => {
    const [patch] = computeQuiltLayout(
      [checkIn({ id: 'p1', createdAt: '2026-07-07T09:30:00', emotions: [sel('sad', 'sadness', 3), sel('glad', 'enjoyment', 2)] })],
      300,
      NOW
    )[0].rows.filter((r) => !r.empty)[0].patches;

    const tree = render(
      <Svg width={300} height={100}>
        <QuiltPatch layout={patch} />
      </Svg>
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('PatchPreview', () => {
  it('renders standalone with an accessibility label', () => {
    render(
      <PatchPreview
        emotions={[sel('sad', 'sadness', 3), sel('uneasy', 'fear', 1)]}
        size={160}
        a11yLabel="sad 3, uneasy 1"
      />
    );
    expect(screen.getByLabelText('sad 3, uneasy 1')).toBeTruthy();
  });

  it('lays cloth the same way the layout engine does (one piece per emotion)', () => {
    // Sanity: preview and engine share clothPieces, so a 3-emotion preview
    // means 3 pieces — asserted at the data level since SVG nodes carry no
    // testIDs.
    expect(
      clothPieces([sel('sad', 'sadness', 2), sel('glad', 'enjoyment', 2), sel('uneasy', 'fear', 2)], 160, 160)
    ).toHaveLength(3);
  });
});

describe('QuiltWeek', () => {
  const twoPatchBlock = () =>
    computeQuiltLayout(
      [
        checkIn({ id: 'c1', createdAt: '2026-07-07T09:30:00' }),
        checkIn({
          id: 'c2',
          createdAt: '2026-07-08T10:00:00',
          emotions: [sel('irritated', 'anger', 2)],
        }),
      ],
      300 - 34,
      NOW
    )[0];

  it('renders one accessible pressable per patch with the layout a11y label', () => {
    const onPatchPress = jest.fn();
    render(
      <QuiltWeek block={twoPatchBlock()} width={300} animateId={null} onPatchPress={onPatchPress} />
    );
    expect(screen.getByTestId('patch-c1')).toBeTruthy();
    expect(screen.getByTestId('patch-c2')).toBeTruthy();
    expect(screen.getByLabelText('Tuesday morning: sad 3')).toBeTruthy();
    expect(screen.getByLabelText('Wednesday morning: irritated 2')).toBeTruthy();
  });

  it('reports presses with the checkInId', () => {
    const onPatchPress = jest.fn();
    render(
      <QuiltWeek block={twoPatchBlock()} width={300} animateId={null} onPatchPress={onPatchPress} />
    );
    fireEvent.press(screen.getByTestId('patch-c2'));
    expect(onPatchPress).toHaveBeenCalledWith('c2');
  });

  it('shows the week label and weekday labels for rendered rows', () => {
    render(
      <QuiltWeek block={twoPatchBlock()} width={300} animateId={null} onPatchPress={jest.fn()} />
    );
    expect(screen.getByText('Jul 6 – Jul 12')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
  });
});

describe('QuiltScreen', () => {
  // Seed with TODAY-based check-ins so they land in the live current week —
  // QuiltScreen calls computeQuiltLayout with the real clock.
  const seedToday = () => {
    const now = new Date();
    const iso1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString();
    const iso2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString();
    useCheckInStore.setState({
      checkIns: [
        checkIn({
          id: 'today-2',
          createdAt: iso2,
          emotions: [sel('irritated', 'anger', 2)],
          note: 'long day',
          bodySensations: ['tight chest'],
        }),
        checkIn({ id: 'today-1', createdAt: iso1 }),
      ],
    });
  };

  const renderScreen = () =>
    render(
      <NavigationContainer>
        <QuiltScreen />
      </NavigationContainer>
    );

  it('shows the empty state with no check-ins', async () => {
    renderScreen();
    expect(await screen.findByText('Your layers begin with a single check-in.')).toBeTruthy();
    expect(screen.getByTestId('screen-quilt')).toBeTruthy();
    expect(screen.getByTestId('checkin-fab')).toBeTruthy();
    expect(screen.getByTestId('open-settings')).toBeTruthy();
    expect(screen.queryByTestId('weekly-summary')).toBeNull();
  });

  it('floats the first-visit helper note; starting a check-in retires it', async () => {
    renderScreen();
    expect(await screen.findByTestId('coach-note-quilt')).toBeTruthy();
    // Taking the pointed-at action counts as understanding the note.
    fireEvent.press(screen.getByTestId('checkin-fab'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-quilt');
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
  });

  it('renders a pressable patch per seeded check-in', async () => {
    seedToday();
    renderScreen();
    expect(await screen.findByTestId('patch-today-1')).toBeTruthy();
    expect(screen.getByTestId('patch-today-2')).toBeTruthy();
  });

  it('tints the header field-guide mark by this week’s prominent mood', async () => {
    seedToday();
    renderScreen();
    const button = await screen.findByTestId('header-field-guide');
    // sadness (today-1) and anger (today-2), one each — anger first on the tie.
    // Same families the weekly-summary mark wears: one mood, every mark.
    expect(within(button).UNSAFE_getByType(LogoMark).props.families).toEqual(['anger', 'sadness']);
  });

  it('shows the weekly summary once check-ins exist this week', async () => {
    seedToday();
    renderScreen();
    expect(await screen.findByTestId('weekly-summary')).toBeTruthy();
    // sadness (today-1) and anger (today-2), one check-in each — anger sorts
    // first alphabetically on a tie, so its tone ("fiery") headlines.
    expect(screen.getByText('Fiery')).toBeTruthy();
  });

  it('opens the patch detail modal on press, with emotion word + note + sensations', async () => {
    seedToday();
    renderScreen();
    fireEvent.press(await screen.findByTestId('patch-today-2'));
    expect(await screen.findByTestId('patch-detail')).toBeTruthy();
    expect(screen.getByText('Irritated')).toBeTruthy();
    expect(screen.getByText('long day')).toBeTruthy();
    expect(screen.getByText('tight chest')).toBeTruthy();
    // One "about" affordance per unique family in the patch.
    expect(screen.getByTestId('about-anger')).toBeTruthy();
  });

  it('detail header names the day once and carries the timestamp — no duplicate emotion list', async () => {
    seedToday();
    renderScreen();
    fireEvent.press(await screen.findByTestId('patch-today-2'));
    const header = await screen.findByTestId('patch-detail-header');
    // The title used to repeat every emotion + intensity (e.g. "irritated
    // 2") on top of the per-row breakdown already shown below it.
    expect(within(header).queryByText(/irritated 2/i)).toBeNull();
    // The timestamp now lives in the header, same font as before.
    expect(within(header).getByText(/^layered \d{2}:\d{2}$/)).toBeTruthy();
    // The per-row breakdown still names the word exactly once.
    expect(screen.getAllByText('Irritated')).toHaveLength(1);
  });
});
