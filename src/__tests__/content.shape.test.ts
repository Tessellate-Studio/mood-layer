// Shape tests for the typed content model (P3). These run against the data
// itself — if a family loses its helper, a gradient word duplicates an id, or
// an insight template stops rendering, this suite catches it before any UI
// does.

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import type { EmotionFamilyId, ResistanceTellId, WeekStats } from '@/types/models';
import {
  EMOTION_FAMILIES,
  MASKING_STATES,
  findEmotionWord,
} from '@/content/emotions';
import { EMOTION_HELPERS } from '@/content/helpers';
import { RESISTANCE_TELLS } from '@/content/resistance';
import * as insightsContent from '@/content/insights';
import {
  INSIGHTS_FOOTER,
  INSIGHTS_HEADER_TITLE,
  INSIGHTS_OVERLINE_PATTERN,
  INSIGHT_TEMPLATES,
} from '@/content/insights';
import { MONTHLY_PRACTICES_OVERLINE, MONTHLY_TEXTURE_OVERLINE } from '@/content/monthlyDigest';
import { JUDGMENT_EXAMPLES } from '@/content/judgmentExamples';
import { ONBOARDING_SLIDES } from '@/content/onboarding';
import { CHECK_IN_COPY } from '@/content/checkInCopy';
import { COACH_MARKS } from '@/content/coachMarks';

const FAMILY_IDS: EmotionFamilyId[] = [
  'anger',
  'fear',
  'sadness',
  'disgust',
  'enjoyment',
  'surprise',
  'contempt',
  'anticipation',
  'trust',
];

const TELL_IDS: ResistanceTellId[] = [
  'looping-thoughts',
  'harsh-judgment',
  'binary-stuckness',
  'comparison',
];

/**
 * Recursively pulls every prose string out of a content export (nested
 * objects, arrays) — skipping `id` fields, which are internal identifiers
 * (e.g. `ONBOARDING_SLIDES`'s `id: 'quilt'`), not copy a user reads.
 */
function collectStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') return [value];
  if (value === null || typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v, seen));
  return Object.entries(value)
    .filter(([key]) => key !== 'id')
    .flatMap(([, v]) => collectStrings(v, seen));
}

/**
 * Every literal string/template-literal fragment written in a .ts file's
 * source — read from the raw text via the TypeScript compiler API, not from
 * an imported export. Catches copy embedded in generator functions
 * (`circle.ts`'s `shareSummary`, `monthlyDigest.ts`'s digests) that a
 * const-only scan would miss, and skips comments by construction (they're
 * trivia, never AST literal nodes) — so a metaphor mentioned in a code
 * comment doesn't false-positive against the user-facing-copy ban.
 *
 * Also skips string literals that are internal identifiers, not prose a user
 * reads: type-literal positions (`type X = 'note-quilt' | ...`), object/
 * interface property KEYS (`'note-quilt': ...`), and the VALUE of a field
 * literally named `id` (`{ id: 'quilt', ... }`), mirroring collectStrings'
 * `id`-field skip above.
 */
function collectLiteralStrings(sourceText: string, fileName: string): string[] {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const strings: string[] = [];

  const isInternalIdentifier = (node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): boolean => {
    const parent = node.parent;
    if (!parent) return false;
    if (ts.isLiteralTypeNode(parent)) return true;
    if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === node) {
      return true;
    }
    if (
      ts.isPropertyAssignment(parent) &&
      parent.initializer === node &&
      ts.isIdentifier(parent.name) &&
      parent.name.text === 'id'
    ) {
      return true;
    }
    return false;
  };

  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isInternalIdentifier(node)) strings.push(node.text);
    } else if (ts.isTemplateExpression(node)) {
      strings.push(node.head.text);
      for (const span of node.templateSpans) strings.push(span.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return strings;
}

/** Every `.ts` file directly under a content directory, as [fileName, literalStrings]. */
function collectContentDirStrings(dir: string): [string, string[]][] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f): [string, string[]] => {
      const filePath = path.join(dir, f);
      return [f, collectLiteralStrings(fs.readFileSync(filePath, 'utf8'), filePath)];
    });
}

/** Tone rule (CLAUDE.md): gentle, no exclamations, never directive. */
function expectGentleCopy(strings: string[]): void {
  for (const text of strings) {
    expect(text).not.toContain('!');
    expect(text.toLowerCase()).not.toContain('you should');
    expect(text.toLowerCase()).not.toContain('you must');
  }
}

function emptyStats(overrides: Partial<WeekStats> = {}): WeekStats {
  return {
    weekKey: '2026-W28',
    checkInCount: 0,
    activeDayCount: 0,
    familyCounts: {
      anger: 0,
      fear: 0,
      sadness: 0,
      disgust: 0,
      enjoyment: 0,
      surprise: 0,
      contempt: 0,
      anticipation: 0,
      trust: 0,
    },
    resistanceCounts: {
      'looping-thoughts': 0,
      'harsh-judgment': 0,
      'binary-stuckness': 0,
      comparison: 0,
    },
    maskingCount: 0,
    distinctEmotionIds: [],
    coOccurringFamilies: null,
    judgmentEntryCount: 0,
    ...overrides,
  };
}

/** A week where every template's condition is satisfied at once. */
const maxedStats: WeekStats = emptyStats({
  checkInCount: 12,
  familyCounts: {
    anger: 4,
    fear: 4,
    sadness: 3,
    disgust: 2,
    enjoyment: 3,
    surprise: 2,
    contempt: 2,
    anticipation: 2,
    trust: 2,
  },
  resistanceCounts: {
    'looping-thoughts': 5,
    'harsh-judgment': 5,
    'binary-stuckness': 5,
    comparison: 5,
  },
  maskingCount: 5,
  distinctEmotionIds: [
    'irritated',
    'frustrated',
    'worried',
    'afraid',
    'sad',
    'hurt',
    'content',
    'joyful',
    'curious',
  ],
  judgmentEntryCount: 5,
  coOccurringFamilies: ['enjoyment', 'sadness'],
});

/** Per-template fixtures: each satisfies ONLY that template's own condition. */
const TEMPLATE_FIXTURES: Record<string, WeekStats> = {
  'co-occurrence': emptyStats({
    checkInCount: 4,
    coOccurringFamilies: ['sadness', 'enjoyment'],
  }),
  'stuck-decisions': emptyStats({
    checkInCount: 4,
    resistanceCounts: {
      'looping-thoughts': 0,
      'harsh-judgment': 0,
      'binary-stuckness': 3,
      comparison: 0,
    },
  }),
  'looping-week': emptyStats({
    checkInCount: 4,
    resistanceCounts: {
      'looping-thoughts': 3,
      'harsh-judgment': 0,
      'binary-stuckness': 0,
      comparison: 0,
    },
  }),
  'judgment-heavy': emptyStats({ checkInCount: 4, judgmentEntryCount: 3 }),
  'numb-cluster': emptyStats({ checkInCount: 4, maskingCount: 3 }),
  'masking-fine': emptyStats({ checkInCount: 4, maskingCount: 2 }),
  'fluid-week': emptyStats({
    checkInCount: 8,
    distinctEmotionIds: [
      'irritated',
      'worried',
      'sad',
      'hurt',
      'content',
      'glad',
      'curious',
      'amazed',
    ],
  }),
};

describe('emotion families', () => {
  it('has exactly the nine families (Ekman seven + anticipation/trust)', () => {
    expect(Object.keys(EMOTION_FAMILIES).sort()).toEqual([...FAMILY_IDS].sort());
  });

  it.each(FAMILY_IDS)('%s has a label, essence, and >=4 gradient words', (id) => {
    const family = EMOTION_FAMILIES[id];
    expect(family.id).toBe(id);
    expect(family.label.length).toBeGreaterThan(0);
    expect(family.essence.length).toBeGreaterThan(0);
    expect(family.gradient.length).toBeGreaterThanOrEqual(4);
  });

  it.each(FAMILY_IDS)('%s gradient runs mild to intense with valid hints', (id) => {
    const hints = EMOTION_FAMILIES[id].gradient.map((w) => w.intensityHint);
    for (const hint of hints) {
      expect([1, 2, 3, 4]).toContain(hint);
    }
    for (let i = 1; i < hints.length; i += 1) {
      expect(hints[i]).toBeGreaterThanOrEqual(hints[i - 1]);
    }
  });

  it('gradient word ids are unique across ALL families', () => {
    const ids = FAMILY_IDS.flatMap((f) => EMOTION_FAMILIES[f].gradient.map((w) => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every gradient word has a non-empty label', () => {
    for (const familyId of FAMILY_IDS) {
      for (const word of EMOTION_FAMILIES[familyId].gradient) {
        expect(word.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps 'anxious' out of fear's gradient (anxiety is resisted fear, not fear)", () => {
    const fearIds = EMOTION_FAMILIES.fear.gradient.map((w) => w.id);
    expect(fearIds).not.toContain('anxious');
  });

  it('findEmotionWord resolves a known id to its word and family', () => {
    const hit = findEmotionWord('irritated');
    expect(hit).toBeDefined();
    expect(hit?.word.id).toBe('irritated');
    expect(hit?.family.id).toBe('anger');
    expect(findEmotionWord('not-an-emotion')).toBeUndefined();
  });
});

describe('masking states', () => {
  it('has the six masking states with prompts that unpack to valid families', () => {
    const ids = MASKING_STATES.map((m) => m.id).sort();
    expect(ids).toEqual(['busy', 'fine', 'guilty', 'numb', 'overwhelmed', 'stressed']);
    for (const state of MASKING_STATES) {
      expect(state.label.length).toBeGreaterThan(0);
      expect(state.prompt.length).toBeGreaterThan(0);
      expect(state.unpacksTo.length).toBeGreaterThan(0);
      for (const family of state.unpacksTo) {
        expect(FAMILY_IDS).toContain(family);
      }
    }
  });

  it("unpacks 'guilty' through anger first — guilt as anger turned inward", () => {
    const guilty = MASKING_STATES.find((m) => m.id === 'guilty');
    // Position matters: the underneath panel renders unpacksTo in order, so
    // anger leading is the pedagogy, not a coincidence.
    expect(guilty?.unpacksTo[0]).toBe('anger');
  });
});

describe('emotion helpers', () => {
  it.each(FAMILY_IDS)('%s has a complete helper', (id) => {
    const helper = EMOTION_HELPERS[id];
    expect(helper.family).toBe(id);
    expect(helper.whatItMeans.length).toBeGreaterThan(0);
    expect(helper.bodySignature.length).toBeGreaterThanOrEqual(3);
    for (const sensation of helper.bodySignature) {
      expect(sensation.length).toBeGreaterThan(0);
    }
    expect(helper.whenResisted.becomes.length).toBeGreaterThan(0);
    expect(helper.whenResisted.description.length).toBeGreaterThan(0);
    expect(helper.invitationToFeel.length).toBeGreaterThanOrEqual(2);
    for (const invitation of helper.invitationToFeel) {
      expect(invitation.length).toBeGreaterThan(0);
    }
  });

  it('names the Hudson resistance outcomes for the big three plus enjoyment', () => {
    expect(EMOTION_HELPERS.fear.whenResisted.becomes.toLowerCase()).toContain('anxiety');
    expect(EMOTION_HELPERS.sadness.whenResisted.becomes.toLowerCase()).toContain('numb');
    expect(EMOTION_HELPERS.anger.whenResisted.becomes.toLowerCase()).toContain('stuck');
    expect(EMOTION_HELPERS.enjoyment.whenResisted.becomes.toLowerCase()).toContain('joy');
  });

  it('copy stays gentle: no exclamations, never directive', () => {
    expectGentleCopy(collectStrings(EMOTION_HELPERS));
  });
});

describe('resistance tells', () => {
  it('has all four tells with prompts and valid pointsToward families', () => {
    expect(Object.keys(RESISTANCE_TELLS).sort()).toEqual([...TELL_IDS].sort());
    for (const tellId of TELL_IDS) {
      const tell = RESISTANCE_TELLS[tellId];
      expect(tell.id).toBe(tellId);
      expect(tell.label.length).toBeGreaterThan(0);
      expect(tell.checkInPrompt.length).toBeGreaterThan(0);
      expect(tell.description.length).toBeGreaterThan(0);
      expect(tell.pointsToward.length).toBeGreaterThan(0);
      for (const family of tell.pointsToward) {
        expect(FAMILY_IDS).toContain(family);
      }
    }
  });

  it('maps each tell to its Hudson emotion families', () => {
    expect(RESISTANCE_TELLS['looping-thoughts'].pointsToward).toEqual(['fear']);
    expect(RESISTANCE_TELLS['harsh-judgment'].pointsToward).toEqual(['anger', 'sadness']);
    expect(RESISTANCE_TELLS['binary-stuckness'].pointsToward).toEqual(['fear', 'anger']);
    expect(RESISTANCE_TELLS.comparison.pointsToward).toEqual(['sadness', 'contempt']);
  });
});

describe('insight templates', () => {
  it('has the seven templates with unique ids', () => {
    const ids = INSIGHT_TEMPLATES.map((t) => t.id).sort();
    expect(ids).toEqual([
      'co-occurrence',
      'fluid-week',
      'judgment-heavy',
      'looping-week',
      'masking-fine',
      'numb-cluster',
      'stuck-decisions',
    ]);
  });

  it('tags each template with a pattern/resistance kind', () => {
    const RESISTANCE = new Set(['stuck-decisions', 'looping-week', 'judgment-heavy']);
    for (const template of INSIGHT_TEMPLATES) {
      expect(template.kind).toBe(RESISTANCE.has(template.id) ? 'resistance' : 'pattern');
    }
  });

  it('every template matches the maxed-out week and renders non-empty copy', () => {
    for (const template of INSIGHT_TEMPLATES) {
      expect(template.matches(maxedStats)).toBe(true);
      const { title, body } = template.render(maxedStats);
      expect(title.length).toBeGreaterThan(0);
      expect(body.length).toBeGreaterThan(0);
    }
  });

  it('every template matches its own designed fixture', () => {
    for (const template of INSIGHT_TEMPLATES) {
      const fixture = TEMPLATE_FIXTURES[template.id];
      expect(fixture).toBeDefined();
      expect(template.matches(fixture)).toBe(true);
      const { title, body } = template.render(fixture);
      expect(title.length).toBeGreaterThan(0);
      expect(body.length).toBeGreaterThan(0);
    }
  });

  it('no template matches an empty week', () => {
    const empty = emptyStats();
    for (const template of INSIGHT_TEMPLATES) {
      expect(template.matches(empty)).toBe(false);
    }
  });

  it('copy stays gentle: no exclamation marks anywhere', () => {
    for (const template of INSIGHT_TEMPLATES) {
      const { title, body } = template.render(maxedStats);
      expect(title).not.toContain('!');
      expect(body).not.toContain('!');
    }
  });

  it('fluid-week reflects the actual count of named emotions', () => {
    const fluid = INSIGHT_TEMPLATES.find((t) => t.id === 'fluid-week');
    expect(fluid).toBeDefined();
    const { body } = fluid!.render(maxedStats);
    expect(body).toContain(String(maxedStats.distinctEmotionIds.length));
  });

  it('describes the completed week accurately — cards render for last week, never claim "this week"', () => {
    // insightEngine always generates for previousWeekKey (a fully completed
    // week), so the copy must say "last week", not "this week" — otherwise
    // the card reads as describing check-ins that haven't happened yet.
    for (const template of INSIGHT_TEMPLATES) {
      const { title, body } = template.render(maxedStats);
      expect(title.toLowerCase()).not.toContain('this week');
      expect(body.toLowerCase()).not.toContain('this week');
      expect(body.toLowerCase()).toContain('last week');
    }
  });

  it('co-occurrence card names the two families grammatically, not "something <noun>"', () => {
    const coOccurrence = INSIGHT_TEMPLATES.find((t) => t.id === 'co-occurrence');
    expect(coOccurrence).toBeDefined();
    const fixture = TEMPLATE_FIXTURES['co-occurrence'];
    const { body } = coOccurrence!.render(fixture);
    expect(body).not.toMatch(/something [a-z]+ and something [a-z]+/i);
  });

  it('footer explains the sparseness without exposing the mechanics', () => {
    // "Two a week, at most" was the builder's view of the page, not the
    // reader's (user, 2026-09-02) — the footer says why the page is sparse
    // and points back to the layers, in layer language, no numbers.
    expect(INSIGHTS_FOOTER.length).toBeGreaterThan(0);
    expect(INSIGHTS_FOOTER).not.toContain('!');
    expect(INSIGHTS_FOOTER.toLowerCase()).not.toMatch(/two a week|at most|\d/);
    expect(INSIGHTS_FOOTER.toLowerCase()).toContain('layers');
  });

  it('every Insights screen string is non-empty and stays gentle', () => {
    // All of the screen's own copy lives in content/insights.ts (copy rule,
    // CLAUDE.md), so one review covers it — picked up by prefix, so a new
    // string cannot be forgotten here.
    const strings = Object.entries(insightsContent)
      .filter(([name, value]) => name.startsWith('INSIGHTS_') && typeof value === 'string')
      .map(([, value]) => value as string);
    expect(strings.length).toBeGreaterThanOrEqual(8);
    for (const s of strings) {
      expect(s.length).toBeGreaterThan(0);
      expect(s).not.toContain('!');
    }
    // The pattern overline names the same window as the header.
    expect(INSIGHTS_OVERLINE_PATTERN).toContain(INSIGHTS_HEADER_TITLE);
    // The month cards' overlines live with the titles they label and name
    // their window too: the calendar month that just ended.
    expect(MONTHLY_TEXTURE_OVERLINE).toMatch(/^Last month/);
    expect(MONTHLY_PRACTICES_OVERLINE).toMatch(/^Last month/);
  });
});

describe('judgment examples', () => {
  it('has at least 6 examples, all fields filled', () => {
    expect(JUDGMENT_EXAMPLES.length).toBeGreaterThanOrEqual(6);
    for (const example of JUDGMENT_EXAMPLES) {
      expect(example.target.length).toBeGreaterThan(0);
      expect(example.judgment.length).toBeGreaterThan(0);
      expect(example.feeling.length).toBeGreaterThan(0);
    }
  });
});

describe('check-in copy', () => {
  const values = Object.values(CHECK_IN_COPY);

  it('every line is non-empty', () => {
    expect(values.length).toBeGreaterThan(0);
    for (const line of values) {
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('copy stays gentle: no exclamations, never directive', () => {
    expectGentleCopy(values);
  });

  it('the feel hint invites several words, not just one', () => {
    expect(CHECK_IN_COPY.feelHint.toLowerCase()).toContain('several');
  });
});

describe('coach marks', () => {
  it('has exactly one note per coached screen, ids fresh and namespaced', () => {
    const ids = Object.keys(COACH_MARKS).sort();
    expect(ids).toEqual([
      'note-circle',
      'note-experiments',
      'note-field-guide',
      'note-insights',
      'note-quilt',
    ]);
    for (const id of ids) {
      expect(id.startsWith('note-')).toBe(true);
      // Fresh ids by design: users who dismissed the retired inline ScreenTips
      // (ids below) still meet these notes once.
      expect(['home', 'experiments', 'insights', 'circle']).not.toContain(id);
    }
  });

  it('copy stays gentle', () => {
    const values = Object.values(COACH_MARKS);
    for (const text of values) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
    expectGentleCopy(values);
  });
});

describe('onboarding slides', () => {
  it('has four slides with unique ids and non-empty copy', () => {
    // Four since 2026-07-18: the field-guide suggestion joined quilt /
    // fluidity / privacy so new users meet the vocabulary early.
    expect(ONBOARDING_SLIDES).toHaveLength(4);
    expect(new Set(ONBOARDING_SLIDES.map((s) => s.id)).size).toBe(4);
    for (const slide of ONBOARDING_SLIDES) {
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.body.length).toBeGreaterThan(0);
    }
  });

  it('covers quilt, fluidity, privacy, then the field guide in order', () => {
    const allCopy = ONBOARDING_SLIDES.map((s) => `${s.title} ${s.body}`.toLowerCase());
    expect(allCopy[0]).toContain('one thing');
    expect(allCopy[1]).toContain('resist');
    expect(allCopy[2]).toContain('phone');
    expect(allCopy[3]).toContain('field guide');
  });

  it('copy stays gentle: no exclamations, never directive', () => {
    expectGentleCopy(collectStrings(ONBOARDING_SLIDES));
  });
});

describe('content glossary (ADR-003)', () => {
  // Generalizes the quilt/stitch/sew ban (formerly two separate hardcoded
  // regexes on check-in copy and coach marks) into one data-driven table
  // that scans every content source below, per memory/content_glossary.md —
  // the source of truth for what's listed here.
  const GLOSSARY: { canonical: string; banned: string[] }[] = [
    { canonical: 'underneath', banned: ['cover word'] },
    { canonical: 'layers (never quilt/stitch/sew)', banned: ['quilt', 'stitch', 'sew'] },
  ];

  // Every literal string in every src/content/*.ts file, parsed from source —
  // not a hand-picked list of imported exports. That matters here: several
  // content files (circle.ts, monthlyDigest.ts, noteReflection.ts) build their
  // copy inside generator functions rather than static consts, so an
  // import-and-introspect scan silently misses them; a new content file is
  // covered automatically too, without editing this list.
  const SOURCE_STRINGS = collectContentDirStrings(path.join(__dirname, '../content'));

  it('never uses a banned synonym in place of its glossary term', () => {
    const offenders: string[] = [];
    for (const { canonical, banned } of GLOSSARY) {
      for (const synonym of banned) {
        for (const [sourceName, strings] of SOURCE_STRINGS) {
          for (const text of strings) {
            if (text.toLowerCase().includes(synonym)) {
              offenders.push(`${sourceName}: found "${synonym}" (use "${canonical}") in "${text}"`);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
