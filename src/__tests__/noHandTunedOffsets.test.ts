// Source-level pin for anti-pattern #9 on the one prop where hand-tuned
// offsets kept recurring: a CoachNote's topOffset is a measurement.

import * as fs from 'fs';
import * as path from 'path';

const SCREENS = path.join(__dirname, '..', 'screens');

describe('no hand-tuned coach-note offsets in screens', () => {
  it('only ever passes a measured *Height value as topOffset', () => {
    // A numeric literal is the obvious offender; a named constant
    // (`topOffset={NOTE_OFFSET}`) or arithmetic (`spacing.xl + 20`) is the
    // same bug wearing a name. Only a value that reads as a measurement —
    // an identifier ending in `Height`, as useMeasuredHeight yields — passes.
    const offenders: string[] = [];
    for (const name of fs.readdirSync(SCREENS).filter((n) => /\.tsx$/.test(n))) {
      const file = path.join(SCREENS, name);
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/topOffset=\{([^}]*)\}/g)) {
        const value = match[1].trim();
        if (!/^[A-Za-z_$][\w$]*Height$/.test(value)) {
          offenders.push(`${path.basename(file)} — topOffset={${value}}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
