// Source-level pin for anti-pattern #9 on the one prop where hand-tuned
// offsets kept recurring: a CoachNote's topOffset is a measurement.

import * as fs from 'fs';
import * as path from 'path';

// Screens AND components: the only `topOffset` call site now lives in
// ScreenFrame, so a screens-only sweep would pass while matching nothing.
const ROOTS = ['screens', 'components'].map((dir) => path.join(__dirname, '..', dir));

describe('no hand-tuned coach-note offsets in screens', () => {
  it('only ever passes a measured *Height value as topOffset', () => {
    // A numeric literal is the obvious offender; a named constant
    // (`topOffset={NOTE_OFFSET}`) or arithmetic (`spacing.xl + 20`) is the
    // same bug wearing a name. Only a value that reads as a measurement —
    // an identifier ending in `Height`, as useMeasuredHeight yields — passes.
    const offenders: string[] = [];
    const files = ROOTS.flatMap((root) =>
      fs.readdirSync(root).filter((n) => /\.tsx$/.test(n)).map((n) => path.join(root, n))
    );
    let seen = 0;
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/topOffset=\{([^}]*)\}/g)) {
        seen += 1;
        const value = match[1].trim();
        if (!/^[A-Za-z_$][\w$]*Height$/.test(value)) {
          offenders.push(`${path.basename(file)} — topOffset={${value}}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    // And the sweep actually looked at something — a rename that moves every
    // call site must fail here, not pass vacuously.
    expect(seen).toBeGreaterThan(0);
  });
});
