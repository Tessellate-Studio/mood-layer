// Circle store — the people the user may choose to share with, and how much
// each sees. Persisted via AsyncStorage. Sharing has two paths: the OS share
// sheet (text, on demand), and — the ONE sanctioned exception to local-only
// (user-decided 2026-07-18, docs/SECURITY.md) — peer-app delivery, where a
// pairing holds relay credentials and the peer's public key so the gated
// summary can be sealed on-device and dropped on the send-and-forget relay.
// The pairing token/peerPub here are NOT emotional data; sealed summaries
// transit the relay encrypted, and received ones live only in this store.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { shareSummary } from '@/content/circle';
import {
  fetchSealed,
  getKeyPair,
  open as openSealed,
  seal,
  sendSealed,
  type PairingCredentials,
} from '@/services/circleRelay';
import { rescheduleCircle } from '@/services/notifications';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import type { CirclePerson } from '@/types/models';
import { dueSends } from '@/utils/circleSchedule';
import { weekKey } from '@/utils/dates';
import { generateUUID } from '@/utils/ids';
import { computeStatsForWeek } from '@/utils/insightEngine';

/** One decrypted status received from a paired person. */
export interface ReceivedStatus {
  id: string;
  personId: string;
  message: string;
  sentAt: string;
  receivedAt: string;
}

interface CircleState {
  people: CirclePerson[];
  /**
   * personId → the scheduled local-notification ids for their share nudge, so
   * a reminder can be cancelled/rescheduled when a person is removed, paused,
   * or recadenced. Persisted (the OS keeps scheduled notifications across
   * restarts, so we must remember which ids are ours to cancel).
   */
  reminderIds: Record<string, string[]>;
  /**
   * Set when a tapped Circle reminder asks the Circle screen to open the OS
   * share sheet for this person. Transient (NOT persisted — a share intent
   * must not survive a restart); the screen clears it once it acts.
   */
  pendingSharePersonId: string | null;
  /** personId → relay pairing (credentials + peer public key). */
  pairings: Record<string, PairingCredentials>;
  /** Decrypted statuses from paired people, newest-first. */
  received: ReceivedStatus[];
  /** personId → ISO time of the last AUTOMATIC send (dueSends dedupe). */
  lastAutoSent: Record<string, string>;
  addPerson(input: Omit<CirclePerson, 'id'>): CirclePerson;
  updatePerson(id: string, patch: Partial<Omit<CirclePerson, 'id'>>): void;
  removePerson(id: string): void;
  setReminderIds(map: Record<string, string[]>): void;
  requestShare(personId: string): void;
  clearPendingShare(): void;
  setPairing(personId: string, creds: PairingCredentials): void;
  removePairing(personId: string): void;
  markAutoSent(personId: string, iso: string): void;
  /** Add decrypted statuses; keeps only the latest few per person. */
  addReceived(statuses: Omit<ReceivedStatus, 'id'>[]): void;
  clearAll(): void;
}

/** Statuses kept per person — a glance at their recent weeks, not an archive. */
const RECEIVED_KEEP_PER_PERSON = 4;

export const useCircleStore = create<CircleState>()(
  persist(
    (set) => ({
      people: [],
      reminderIds: {},
      pendingSharePersonId: null,
      pairings: {},
      received: [],
      lastAutoSent: {},
      addPerson: (input) => {
        const person: CirclePerson = { ...input, id: generateUUID() };
        set((state) => ({ people: [...state.people, person] }));
        return person;
      },
      updatePerson: (id, patch) =>
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
        })),
      removePerson: (id) =>
        set((state) => {
          const { [id]: _dropped, ...pairings } = state.pairings;
          return {
            people: state.people.filter((p) => p.id !== id),
            pairings,
            received: state.received.filter((r) => r.personId !== id),
          };
        }),
      setReminderIds: (map) => set({ reminderIds: map }),
      requestShare: (personId) => set({ pendingSharePersonId: personId }),
      clearPendingShare: () => set({ pendingSharePersonId: null }),
      setPairing: (personId, creds) =>
        set((state) => ({ pairings: { ...state.pairings, [personId]: creds } })),
      markAutoSent: (personId, iso) =>
        set((state) => ({ lastAutoSent: { ...state.lastAutoSent, [personId]: iso } })),
      removePairing: (personId) =>
        set((state) => {
          const { [personId]: _dropped, ...pairings } = state.pairings;
          return { pairings, received: state.received.filter((r) => r.personId !== personId) };
        }),
      addReceived: (statuses) =>
        set((state) => {
          const merged = [
            ...statuses.map((s) => ({ ...s, id: generateUUID() })),
            ...state.received,
          ].sort((x, y) => y.sentAt.localeCompare(x.sentAt));
          // Cap per person so the strip stays a glance.
          const counts = new Map<string, number>();
          const kept = merged.filter((r) => {
            const n = (counts.get(r.personId) ?? 0) + 1;
            counts.set(r.personId, n);
            return n <= RECEIVED_KEEP_PER_PERSON;
          });
          return { received: kept };
        }),
      clearAll: () =>
        set({
          people: [],
          reminderIds: {},
          pendingSharePersonId: null,
          pairings: {},
          received: [],
          lastAutoSent: {},
        }),
    }),
    {
      name: 'tml-circle',
      storage: createJSONStorage(() => AsyncStorage),
      // pendingSharePersonId is deliberately excluded — it's a one-shot intent,
      // never a stored preference.
      partialize: (state) => ({
        people: state.people,
        reminderIds: state.reminderIds,
        pairings: state.pairings,
        received: state.received,
        lastAutoSent: state.lastAutoSent,
      }),
    }
  )
);

// Serialize concurrent syncs (people change + app-foreground can fire together)
// so two reschedules don't race on the same OS queue and double-book.
let circleSyncInFlight = false;

/**
 * Reconcile the on-device Circle reminders with the current people list: cancel
 * the previously-scheduled ids, (re)schedule one nudge per non-paused person,
 * and persist the fresh id map. Call on app start, on app foreground, and
 * whenever the people list changes. No-op-safe under Expo Go (the service
 * returns {} there).
 */
export async function syncCircleReminders(): Promise<void> {
  if (circleSyncInFlight) return;
  circleSyncInFlight = true;
  try {
    const { people, reminderIds } = useCircleStore.getState();
    const next = await rescheduleCircle(people, reminderIds);
    useCircleStore.getState().setReminderIds(next);
  } finally {
    circleSyncInFlight = false;
  }
}

let inboxSyncInFlight = false;

/**
 * Pull every pairing's pending sealed statuses off the relay, decrypt them on
 * this device, and file them under their person. Delete-on-fetch on the relay
 * side (send-and-forget). Failures are silent per pairing — a flaky network
 * must never break the Circle screen; the next focus retries. Returns the
 * names of people whose statuses just arrived, so the background task can
 * raise a gentle local notification (the foreground callers ignore it).
 */
export async function syncCircleInbox(): Promise<string[]> {
  if (inboxSyncInFlight) return [];
  inboxSyncInFlight = true;
  const arrivedFrom: string[] = [];
  try {
    const { pairings, people } = useCircleStore.getState();
    const entries = Object.entries(pairings);
    if (entries.length === 0) return [];
    const pair = await getKeyPair();
    const receivedNow = new Date().toISOString();
    for (const [personId, creds] of entries) {
      try {
        const sealedList = await fetchSealed(creds);
        const opened = sealedList.flatMap((sealed) => {
          const plain = openSealed(sealed, creds.peerPub, pair.secretKey);
          return plain === null
            ? []
            : [{ personId, message: plain, sentAt: sealed.sentAt, receivedAt: receivedNow }];
        });
        if (opened.length > 0) {
          useCircleStore.getState().addReceived(opened);
          const name = people.find((p) => p.id === personId)?.name;
          if (name) arrivedFrom.push(name);
        }
      } catch {
        // Skip this pairing this round.
      }
    }
    return arrivedFrom;
  } finally {
    inboxSyncInFlight = false;
  }
}

let autoSendInFlight = false;

/**
 * Automatic delivery (phase 2): seal + send the gated weekly summary to every
 * paired person whose cadence is due (utils/circleSchedule). Runs from the
 * background task AND on app foreground as a catch-up — the summary can only
 * be built on this phone, so a send happens at the first wake after its
 * moment. Same privacy boundary as a manual send (docs/SECURITY.md).
 */
export async function runCircleAutoSend(now: Date = new Date()): Promise<number> {
  if (autoSendInFlight) return 0;
  autoSendInFlight = true;
  try {
    const { people, pairings, lastAutoSent } = useCircleStore.getState();
    const due = dueSends(people, pairings, lastAutoSent, now);
    if (due.length === 0) return 0;

    const stats = computeStatsForWeek(
      useCheckInStore.getState().checkIns,
      useExperimentStore.getState().judgmentEntries,
      weekKey(now.toISOString())
    );
    const pair = await getKeyPair();
    let sent = 0;
    for (const personId of due) {
      const person = people.find((p) => p.id === personId);
      const creds = pairings[personId];
      if (!person || !creds) continue;
      try {
        const summary = shareSummary(person.sees, stats);
        await sendSealed(creds, seal(summary, creds.peerPub, pair.secretKey));
        useCircleStore.getState().markAutoSent(personId, now.toISOString());
        sent += 1;
      } catch {
        // Unreachable relay — the next wake retries (dedupe is by day/week).
      }
    }
    return sent;
  } finally {
    autoSendInFlight = false;
  }
}
