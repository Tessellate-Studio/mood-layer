// Source-level pin for anti-pattern #11, in the style of
// noStitchLines/noHandTunedOffsets: a page screen wears ScreenFrame rather
// than hand-assembling paper ground + safe-area top + gutters, which is how
// the seven drifted apart in the first place.

import * as fs from 'fs';
import * as path from 'path';

const SCREENS = path.join(__dirname, '..', 'screens');

/** Footer-driven wizards, not pages — a different shape, deliberately out
 *  (they keep their own measured footer and floating hint). */
const FLOW_SCREENS = [
  'CheckInFlowScreen.tsx',
  'JudgmentFlowScreen.tsx',
  'PracticeFlowScreen.tsx',
  'BreathingScreen.tsx',
  'NameItSetupScreen.tsx',
  'OnboardingScreen.tsx',
];

const pageScreens = () =>
  fs
    .readdirSync(SCREENS)
    .filter((name) => /\.tsx$/.test(name) && !FLOW_SCREENS.includes(name));

describe('every page screen wears ScreenFrame', () => {
  it('finds the seven pages', () => {
    // A new page screen lands here first, which is the point: it has to
    // choose between the frame and the flow list, not drift by default.
    expect(pageScreens().sort()).toEqual([
      'CircleScreen.tsx',
      'ExperimentsScreen.tsx',
      'FieldGuideScreen.tsx',
      'InsightsScreen.tsx',
      'QuiltScreen.tsx',
      'ReflectionsScreen.tsx',
      'SettingsScreen.tsx',
    ]);
  });

  it('renders ScreenFrame and hand-assembles none of the frame itself', () => {
    const offenders: string[] = [];
    for (const name of pageScreens()) {
      const text = fs.readFileSync(path.join(SCREENS, name), 'utf8');
      if (!text.includes('<ScreenFrame')) offenders.push(`${name} — no <ScreenFrame>`);
      // The four things the frame owns; a screen setting one itself is the
      // drift this rule closes.
      if (text.includes('<PaperTexture')) offenders.push(`${name} — own PaperTexture`);
      if (text.includes('insets.top')) offenders.push(`${name} — own safe-area top`);
      // The paper ground is the tell for a screen-level container; the side
      // gutters are NOT checked separately, because `paddingHorizontal:
      // spacing.md` is also how a bordered row pads its own content, and a
      // rule that cries wolf is a rule someone deletes.
      if (/backgroundColor: colors\.paper\b/.test(text)) offenders.push(`${name} — own paper ground`);
    }
    expect(offenders).toEqual([]);
  });
});
