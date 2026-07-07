// Per-family helper copy: Joe Hudson's framing — emotions are messengers, and
// it's not the emotion that hurts, it's our resistance to it. Each entry says
// what the messenger carries, where it tends to live in the body, what it
// hardens into when resisted, and a couple of soft invitations to feel it.
// Tone: warm, plain, non-clinical. Invitations, never instructions.

import type { EmotionFamilyId } from '@/types/models';

export interface EmotionHelper {
  family: EmotionFamilyId;
  /** Messenger framing, 2–3 sentences. */
  whatItMeans: string;
  /** 3–5 felt sensations people commonly notice. */
  bodySignature: string[];
  /** What this emotion tends to become when resisted instead of felt. */
  whenResisted: {
    becomes: string;
    description: string;
  };
  /** 2–3 one-line invitations to feel it in the body. */
  invitationToFeel: string[];
}

export const EMOTION_HELPERS: Record<EmotionFamilyId, EmotionHelper> = {
  anger: {
    family: 'anger',
    whatItMeans:
      'Anger is a messenger about a boundary. Something you value is being crossed, and the energy you feel is the fuel to protect it. It only turns harsh when it goes unheard.',
    bodySignature: [
      'heat in the chest or face',
      'a tight jaw',
      'clenched hands or shoulders',
      'a surge of energy in the arms',
    ],
    whenResisted: {
      becomes: 'stuckness',
      description:
        'When you resist your anger, it turns inward. You criticize yourself, get passive-aggressive with people you care about, and over time the unfelt charge can sink into depression.',
    },
    invitationToFeel: [
      'Where does this heat live in your body right now?',
      'Could you let it be 10% louder, just for a breath?',
      'What is this anger trying to protect?',
    ],
  },
  fear: {
    family: 'fear',
    whatItMeans:
      'Fear is a messenger about something that matters. It shows up when the outcome is uncertain and you care how it goes. Felt directly, it sharpens you rather than shrinking you.',
    bodySignature: [
      'a fluttery or hollow stomach',
      'a quickened heartbeat',
      'shallow breath high in the chest',
      'restless legs or hands',
    ],
    whenResisted: {
      becomes: 'chronic anxiety',
      description:
        'When you resist your fear, it stops being a moment and becomes a weather system. You spin in worst-case scenarios, overthink every move, and the body stays braced long after the moment has passed.',
    },
    invitationToFeel: [
      'Where do you notice this in your body right now?',
      'Could you stay with the flutter for one slow breath?',
      'What does this fear say you care about?',
    ],
  },
  sadness: {
    family: 'sadness',
    whatItMeans:
      'Sadness is a messenger about love. It points at something that mattered and is missing, lost, or changing. Letting it move is how the heart makes room again.',
    bodySignature: [
      'heaviness in the chest',
      'a lump in the throat',
      'tired, sinking limbs',
      'pressure behind the eyes',
    ],
    whenResisted: {
      becomes: 'numbness and angst',
      description:
        'When you resist your sadness, you get lost in doubt, stop trusting yourself, and lose touch with what matters. The world goes a little grey, and so does the joy you were saving yourself for.',
    },
    invitationToFeel: [
      'Where does the heaviness sit right now?',
      'Could you let your shoulders soften around it for a breath?',
      'What did this matter to you?',
    ],
  },
  disgust: {
    family: 'disgust',
    whatItMeans:
      'Disgust is a messenger about what you cannot take in. It guards what is nourishing by flagging what is not, in food, situations, and behaviour alike. It is your taste, speaking plainly.',
    bodySignature: [
      'a turning or clenching stomach',
      'a wrinkled nose or curled lip',
      'an urge to pull back or turn away',
      'a closed, tight throat',
    ],
    whenResisted: {
      becomes: 'swallowed cynicism',
      description:
        'When you resist your disgust, you keep swallowing what your body already refused. Over time you stop trusting your own no, and the unspoken aversion leaks out as cynicism or quiet self-blame.',
    },
    invitationToFeel: [
      'Where does the no live in your body right now?',
      'Could you let yourself fully not-want this, just for a moment?',
    ],
  },
  enjoyment: {
    family: 'enjoyment',
    whatItMeans:
      'Enjoyment is a messenger about nourishment. It marks the moments and people that feed you, so you can find your way back to them. It asks only to be let in fully.',
    bodySignature: [
      'warmth spreading in the chest',
      'a soft, open belly',
      'lightness in the limbs',
      'an easy, unguarded smile',
    ],
    whenResisted: {
      becomes: 'foreboding joy',
      description:
        'When you resist your enjoyment, you brace for the fall instead of letting the joy land. The good moment arrives and you spend it rehearsing its ending, so it never quite reaches you.',
    },
    invitationToFeel: [
      'Where is the warmth right now? Could you let it spread a little?',
      'Could you stay with the good feeling one breath longer than usual?',
    ],
  },
  surprise: {
    family: 'surprise',
    whatItMeans:
      'Surprise is a messenger about the new. Something just landed that your map did not predict, and for a moment you are wide open. It is the doorway every other feeling walks through.',
    bodySignature: [
      'a small jolt or catch of breath',
      'raised eyebrows, widened eyes',
      'a moment of stillness before the next feeling',
    ],
    whenResisted: {
      becomes: 'rigidity',
      description:
        'When you resist surprise, you start managing life so nothing unexpected can reach you. The plans tighten, the openness closes, and the new stops finding you at all.',
    },
    invitationToFeel: [
      'Can you feel the openness of not knowing yet, just for a breath?',
      'What feeling is arriving right behind the surprise?',
    ],
  },
  contempt: {
    family: 'contempt',
    whatItMeans:
      'Contempt is a messenger wearing armour. Placing yourself above someone usually protects a feeling underneath, often hurt, fear, or a value that got stepped on. It points inward more than it points at them.',
    bodySignature: [
      'a lifted chin or one-sided smirk',
      'coolness or distance in the chest',
      'an urge to turn away or look down',
    ],
    whenResisted: {
      becomes: 'quiet distance',
      description:
        'When contempt goes unexamined, it hardens into a wall. You stay above and therefore alone, and the tender feeling it was guarding never gets felt or finished.',
    },
    invitationToFeel: [
      'What softer feeling might be underneath the looking-down?',
      'Where do you feel the armour in your body right now?',
    ],
  },
};
