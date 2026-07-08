// Core data model for The Mood Layer. Everything here is local-only —
// persisted via zustand + AsyncStorage, never sent anywhere (hard rule,
// CLAUDE.md "Local-only data").

/** Ekman's seven universal emotion families (contempt included per his later work). */
export type EmotionFamilyId =
  | 'anger'
  | 'fear'
  | 'sadness'
  | 'disgust'
  | 'enjoyment'
  | 'surprise'
  | 'contempt';

/** How strongly a feeling is present, 1 (a light touch) to 4 (pressed hard). */
export type Intensity = 1 | 2 | 3 | 4;

/** Joe Hudson's four tells that an emotion is being resisted rather than felt. */
export type ResistanceTellId =
  | 'looping-thoughts'
  | 'harsh-judgment'
  | 'binary-stuckness'
  | 'comparison';

/** One named emotion inside a check-in's quilt patch. */
export interface EmotionSelection {
  emotionId: string;
  family: EmotionFamilyId;
  intensity: Intensity;
}

/** One check-in = one quilt patch: 1–5 co-occurring emotions plus context. */
export interface CheckIn {
  id: string;
  createdAt: string;
  /** Local-time 'YYYY-MM-DD' derived from createdAt (see utils/dates). */
  dayKey: string;
  emotions: EmotionSelection[];
  bodySensations?: string[];
  resistanceFlags: ResistanceTellId[];
  /**
   * Masking-state ids ('stressed', 'fine', …) the user started from before
   * unpacking to real emotions. Tracked separately from emotions because
   * masking states are covers, not feelings — insights count them to spot
   * numbing weeks.
   */
  maskingUsed?: string[];
  note?: string;
  source: 'manual' | 'name-it';
}

/** One entry from the judgment experiment (judgments point at unfelt feelings). */
export interface JudgmentEntry {
  id: string;
  createdAt: string;
  target: string;
  judgment: string;
  uncoveredFeeling: EmotionSelection | null;
  freeWriting?: string;
}

/** How much of the quilt a circle person is shown. */
export type CircleSeesLevel = 'colours-words' | 'colours' | 'count';
/** How often the user intends to share with a circle person ('paused' = off). */
export type CircleFrequency = 'evening' | 'weekly' | 'paused';

/**
 * One trusted person in the user's circle. LOCAL ONLY — this is a sharing
 * *preference*, not a channel: nothing is stored off-device and nothing sends
 * on its own. When the user chooses to share, a summary is generated on the
 * spot (respecting `sees`) and handed to the OS share sheet.
 */
export interface CirclePerson {
  id: string;
  name: string;
  /** Free text — 'Partner', 'Mum', 'Close friend'. */
  relationship: string;
  sees: CircleSeesLevel;
  frequency: CircleFrequency;
}

/** Settings for the "name it" prompts during waking hours. */
export interface NameItSettings {
  enabled: boolean;
  /** Clamped to 1–10 (utils/notificationPlanner MIN/MAX_TIMES_PER_DAY). */
  timesPerDay: number;
  /** Waking window, hours 0–23 local. */
  wakeStart: number;
  wakeEnd: number;
  /** Notification ids currently scheduled (so they can be cancelled). */
  scheduledIds: string[];
}

/** A generated weekly insight card. */
export interface InsightCardState {
  id: string;
  weekKey: string;
  templateId: string;
  /**
   * Which shelf this insight sits on — drives the card's overline. 'pattern'
   * is a gentle observation of the week's texture; 'resistance' is the soft
   * notice of a resisted feeling (looping, harsh judgment, either/or,
   * comparison).
   */
  kind: 'pattern' | 'resistance';
  title: string;
  body: string;
  dismissedAt?: string;
}

/** Aggregated stats for one ISO week — the input insight templates match on. */
export interface WeekStats {
  weekKey: string;
  checkInCount: number;
  /** Distinct days that held at least one check-in ('across N days'). */
  activeDayCount: number;
  familyCounts: Record<EmotionFamilyId, number>;
  resistanceCounts: Record<ResistanceTellId, number>;
  /** Check-ins that started from a masking state ('stressed', 'fine', …). */
  maskingCount: number;
  distinctEmotionIds: string[];
  judgmentEntryCount: number;
  /**
   * The two emotion families that most often showed up together inside the
   * same check-in this week (≥2 co-occurrences), or null. Feeds the "keep
   * arriving together" pattern — the quilt holding two things at once.
   */
  coOccurringFamilies: [EmotionFamilyId, EmotionFamilyId] | null;
}
