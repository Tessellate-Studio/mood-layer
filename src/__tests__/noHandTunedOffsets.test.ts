// Hand-tuned layout offsets are retired (user, 2026-09-03; anti-pattern #9,
// earned from regression rows #24, #27 and the Insights/Circle coach-note
// mismatch). A floating element's position comes from a measurement of the
// thing it sits under — `useMeasuredHeight` + `onLayout` — never from a number
// typed to match today's type scale. This sweep pins that at the source level
// for the one prop where it kept recurring.

import * as fs from 'fs';
import * as path from 'path';

const SCREENS = path.join(__dirname, '..', 'screens');

function screenFiles(): string[] {
  return fs
    .readdirSync(SCREENS)
    .filter((name) => /\.tsx$/.test(name))
    .map((name) => path.join(SCREENS, name));
}

describe('no hand-tuned coach-note offsets in screens', () => {
  it('only ever passes a measured *Height value as topOffset', () => {
    // A numeric literal is the obvious offender; a named constant
    // (`topOffset={NOTE_OFFSET}`) or arithmetic (`spacing.xl + 20`) is the
    // same bug wearing a name. Only a value that reads as a measurement —
    // an identifier ending in `Height`, as useMeasuredHeight yields — passes.
    const offenders: string[] = [];
    for (const file of screenFiles()) {
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
