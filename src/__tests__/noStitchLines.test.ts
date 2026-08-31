// The stitch-line language is retired (user, 2026-08-31: "No dotted lines
// anywhere" — the app moved away from the quilt/stitch visual grammar in its
// line work). This sweep pins the decision at the source level: no dashed or
// dotted border, no SVG dash pattern, no stitchDash token may reappear in app
// code. Tentative/quiet states are expressed with solid inkFaint borders and
// inkMuted labels instead (see EmotionChip's `quiet` variant).

import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const BANNED: Array<{ label: string; pattern: RegExp }> = [
  { label: "borderStyle: 'dashed' | 'dotted'", pattern: /borderStyle:\s*['"](dashed|dotted)['"]/ },
  { label: 'SVG strokeDasharray', pattern: /strokeDasharray/ },
  { label: 'stitchDash token', pattern: /stitchDash/ },
];

describe('no stitch-line language in app code', () => {
  it('has no dashed/dotted borders or dash patterns anywhere under src/', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const { label, pattern } of BANNED) {
        if (pattern.test(text)) {
          offenders.push(`${path.relative(SRC, file)} — ${label}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
