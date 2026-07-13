// The underneath map: everyday stuck states → the resisted emotion they tend
// to carry (Joe Hudson's fluidity framing — resisted fear becomes anxiety,
// resisted sadness becomes numbness, resisted anger becomes stuckness). This
// is the inverse of helpers.ts's whenResisted: you start from how today
// already feels and follow it down to the feeling that wants to be felt.
// Tone: hedged and invitational — a place to look, never a diagnosis.
//
// Distinct from MASKING_STATES (emotions.ts): those five are quick covers
// offered during a check-in; this map is the fuller educational reference on
// the field-guide screen. 'Numb' appears in both on purpose — different doors
// into the same room.

import type { EmotionFamilyId } from '@/types/models';

export interface UnderneathEntry {
  id: string;
  label: string;
  /** What this state tends to be carrying — hedged, 2–3 sentences. */
  description: string;
  /** The emotion families most often waiting underneath. */
  underneath: EmotionFamilyId[];
  /** A one-line question inviting the feeling, matching the helper voice. */
  invitation: string;
}

export const UNDERNEATH_MAP: UnderneathEntry[] = [
  {
    id: 'anxious',
    label: 'Anxious',
    description:
      'Anxiety is usually fear that has not been felt yet. When the fear of a real moment never lands in the body, it spreads into weather — a braced, everywhere unease with no single address.',
    underneath: ['fear'],
    invitation: 'Is there one specific fear under the hum — and where does it sit in your body?',
  },
  {
    id: 'restless',
    label: 'Restless',
    description:
      'Restlessness often means the body is trying to outrun a flutter of fear. The moving keeps the feeling one step behind you.',
    underneath: ['fear'],
    invitation: 'If you sat completely still for one breath, what feeling might catch up?',
  },
  {
    id: 'numb',
    label: 'Numb',
    description:
      'Numbness is usually a feeling on pause — often a sadness that felt like too much at the time. The mute button works, but it mutes everything, warmth included.',
    underneath: ['sadness', 'fear'],
    invitation: 'If the mute lifted a little, what might be waiting there?',
  },
  {
    id: 'bored',
    label: 'Bored',
    description:
      'Boredom can be resistance wearing a grey coat — often a quieter sadness, or a fear that nothing on offer will really meet you. Flatness is sometimes a lid, not an absence.',
    underneath: ['sadness', 'fear'],
    invitation: 'What feeling might be under the flatness, asking for your attention?',
  },
  {
    id: 'stuck',
    label: 'Stuck',
    description:
      'Circling between two options is rarely about missing information. More often an emotion is waiting to be felt first — fear of choosing wrong, or anger at having to choose at all.',
    underneath: ['anger', 'fear'],
    invitation: 'What would you feel if the decision were already made?',
  },
  {
    id: 'irritable',
    label: 'Irritable',
    description:
      'Irritability is often anger arriving in small sparks — a bigger boundary feeling that never got its say, leaking out at the edges.',
    underneath: ['anger'],
    invitation: 'Is there one larger anger these small sparks might belong to?',
  },
  {
    id: 'bitter',
    label: 'Bitter',
    description:
      'Bitterness tends to be old anger braided with loss. Something mattered, it went wrong, and neither the anger nor the grief got fully felt — so they set together, like resin.',
    underneath: ['anger', 'sadness'],
    invitation: 'If the bitterness could speak, what would it say it lost?',
  },
  {
    id: 'cynical',
    label: 'Cynical',
    description:
      'Cynicism is often a swallowed no — a disgust that kept being overridden — mixed with hope that got hurt. Expecting the worst can feel safer than caring again.',
    underneath: ['disgust', 'sadness'],
    invitation: 'What did you care about, before it felt safer not to?',
  },
  {
    id: 'envious',
    label: 'Envious',
    description:
      'Envy usually carries two quieter feelings: sadness about something missing from your own life, and fear that it might stay missing. The other person is just where it happens to be visible.',
    underneath: ['sadness', 'fear'],
    invitation: 'What is the envy pointing at, that you long for?',
  },
  {
    id: 'guarded',
    label: 'Bracing for the fall',
    description:
      'When something good arrives and you immediately rehearse losing it, that is often resisted enjoyment — joy feels exposed, so the body braces instead of receiving.',
    underneath: ['enjoyment'],
    invitation: 'Could you let the good thing land for one breath longer than feels safe?',
  },
  {
    id: 'impatient',
    label: 'Impatient',
    description:
      'Impatience is often anticipation gripped too tight — the leaning-toward turned into pulling — sometimes with anger at whatever stands in the way.',
    underneath: ['anticipation', 'anger'],
    invitation: 'Could the waiting itself be felt for a moment, instead of fought?',
  },
  {
    id: 'wary',
    label: 'Wary of everyone',
    description:
      'Wariness that outstays its evidence is often trust being resisted — staying braced can feel safer than resting your weight on anyone. Underneath there is usually a fear that got burned once.',
    underneath: ['trust', 'fear'],
    invitation: 'Is there one place it might be safe to set a little weight down?',
  },
  {
    id: 'controlling',
    label: 'Needing control',
    description:
      'A tightening grip on plans is often resisted surprise — life declining to be predictable — with fear underneath about what happens if it is not.',
    underneath: ['surprise', 'fear'],
    invitation: 'What might you feel if the plan were allowed to wobble?',
  },
  {
    id: 'distant',
    label: 'Above it all',
    description:
      'Feeling above people — cooler than anger, quieter than judgment — often stands guard over something tender: a hurt, or a value that got stepped on.',
    underneath: ['contempt', 'sadness'],
    invitation: 'What softer feeling might the height be protecting?',
  },
];
