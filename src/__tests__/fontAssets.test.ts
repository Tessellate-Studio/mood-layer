// Guardrail: every fontFamily the theme hands to components must be a key in
// the registration map App.tsx loads. A mismatch doesn't error at runtime —
// Android silently substitutes a system font and the typewriter design
// evaporates. This test makes that failure loud.

import { FONT_ASSETS } from '@/constants/fontAssets';
import { fonts } from '@/constants/theme';

describe('font registration', () => {
  it('registers every fontFamily used by theme tokens', () => {
    const registered = Object.keys(FONT_ASSETS);
    const used = [...new Set(Object.values(fonts))];
    for (const family of used) {
      expect(registered).toContain(family);
    }
  });

  it('bundles a real asset for each registered family', () => {
    for (const [family, asset] of Object.entries(FONT_ASSETS)) {
      // Metro resolves require('*.ttf') to a numeric asset id (or an object
      // under jest's asset transform) — null/undefined means a broken path.
      expect(asset).toBeDefined();
      expect(asset).not.toBeNull();
      expect(family.startsWith('CourierPrime')).toBe(true);
    }
  });
});
