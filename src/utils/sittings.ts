// Pure helper: judgment entries → sittings. One sitting of "Explore avoided
// emotions" saves several entries sharing a sittingId (pre-multi entries have
// none and read as one-judgment sittings). Kept out of the screens so the
// Reflections catalog, the Experiments count, and the monthly digest all
// group the same way.

import type { JudgmentEntry } from '@/types/models';

export interface JudgmentSitting {
  id: string;
  entries: JudgmentEntry[];
}

/** Group entries into sittings, keeping the store's newest-first order. */
export function groupSittings(entries: JudgmentEntry[]): JudgmentSitting[] {
  const order: string[] = [];
  const byId = new Map<string, JudgmentEntry[]>();
  for (const entry of entries) {
    const id = entry.sittingId ?? entry.id;
    if (!byId.has(id)) {
      byId.set(id, []);
      order.push(id);
    }
    byId.get(id)!.push(entry);
  }
  return order.map((id) => ({ id, entries: byId.get(id)! }));
}
