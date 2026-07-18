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
import { rescheduleCircle } from '@/services/notifications';
import type { PairingCredentials } from '@/services/circleRelay';
import type { CirclePerson } from '@/types/models';
import { generateUUID } from '@/utils/ids';

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
  /** New people start Paused — sharing is off until the user turns it on. */
  addPerson(input: Omit<CirclePerson, 'id'>): CirclePerson;
  updatePerson(id: string, patch: Partial<Omit<CirclePerson, 'id'>>): void;
  removePerson(id: string): void;
  setReminderIds(map: Record<string, string[]>): void;
  requestShare(personId: string): void;
  clearPendingShare(): void;
  setPairing(personId: string, creds: PairingCredentials): void;
  removePairing(personId: string): void;
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
 * must never break the Circle screen; the next focus retries.
 */
export async function syncCircleInbox(): Promise<void> {
  if (inboxSyncInFlight) return;
  inboxSyncInFlight = true;
  try {
    const { pairings } = useCircleStore.getState();
    const entries = Object.entries(pairings);
    if (entries.length === 0) return;
    // Lazy import keeps app start clear of crypto/secure-store work.
    const relayModule = await import('@/services/circleRelay');
    const pair = await relayModule.getKeyPair();
    const receivedNow = new Date().toISOString();
    for (const [personId, creds] of entries) {
      try {
        const sealedList = await relayModule.fetchSealed(creds);
        const opened = sealedList.flatMap((sealed) => {
          const plain = relayModule.open(sealed, creds.peerPub, pair.secretKey);
          return plain === null
            ? []
            : [{ personId, message: plain, sentAt: sealed.sentAt, receivedAt: receivedNow }];
        });
        if (opened.length > 0) useCircleStore.getState().addReceived(opened);
      } catch {
        // Skip this pairing this round.
      }
    }
  } finally {
    inboxSyncInFlight = false;
  }
}
