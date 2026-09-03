// Word-level content: what a SPECIFIC feeling actually is, and what people
// tend to do with it. Modeled on atlasofemotions.org's own method, not
// copied from it — the Atlas doesn't grade one emotion by strength ("a light
// touch" / "pressed hard"; retired, and good riddance — user, 2026-09-03: "a
// light touch, pressed hard - isn't really doing much"). Every named state
// gets its own SITUATIONAL definition (Atlas's own Frustration: "a response
// to failure to overcome an obstacle despite repeated attempts") — the word
// carries the intensity, the definition says what's specifically true.
//
// The Atlas also scores each state's likely actions constructive, ambiguous,
// or destructive — a third bucket beyond the usual good/bad binary, because
// plenty of real reactions (going quiet, checking your phone, laughing it
// off) are genuinely ambiguous: which one it is depends on how it's held,
// not on the action itself. Every entry below keeps that shape: a short
// named behaviour, then what it looks like — a description of a tendency,
// never an instruction ("you should…"). This app's own gradient is a fixed
// 6-words-per-family scale the Atlas doesn't share, so every line here is
// written fresh for THIS vocabulary, in the Atlas's spirit.
//
// Covers every word in EMOTION_FAMILIES' gradients + vocabulary.ts's
// EXTENDED_VOCABULARY — wordDefinitions.test.ts's completeness check is what
// keeps this file honest against both.

export interface WordActionSet {
  /** A behaviour that tends to help — channels the feeling toward something. */
  constructive: string;
  /** A behaviour that could go either way — genuinely depends how it's held. */
  ambiguous: string;
  /** A behaviour that tends to cost something — escalates harm or distance. */
  destructive: string;
}

/** Display labels for the three buckets — copy lives here, not inline in the
 *  component that renders it (hard rule). */
export const WORD_ACTION_LABELS: Record<keyof WordActionSet, string> = {
  constructive: 'Constructive',
  ambiguous: 'Ambiguous',
  destructive: 'Destructive',
};

export interface WordDefinition {
  /** One situational sentence: what this specific state actually is. */
  definition: string;
  actions: WordActionSet;
}

export const WORD_DEFINITIONS: Record<string, WordDefinition> = {
  // ————— Anger — "Something you care about is being stepped on." —————
  irritated: {
    definition: 'A small crossing, not yet worth raising — the itch before the scratch.',
    actions: {
      constructive: "Naming it lightly — \"that bugged me,\" said out loud before it builds.",
      ambiguous: "Letting it pass — could be genuinely nothing, could be the first one you're swallowing.",
      destructive: 'Snapping — the sharpness comes out sideways, at something else entirely.',
    },
  },
  annoyed: {
    definition: 'The same small crossing, repeating — patience wearing thin at the edges.',
    actions: {
      constructive: "Saying what's wearing thin, plainly, before it turns into sarcasm.",
      ambiguous: 'Sighing loudly — reads as venting to you, as a jab to them.',
      destructive: 'Muttering under your breath — heard, but never actually said.',
    },
  },
  frustrated: {
    definition: "Something is blocking you, and trying again the same way isn't working.",
    actions: {
      constructive: 'Stepping back to name the actual obstacle, instead of pushing harder at it.',
      ambiguous: 'Trying once more, faster — might solve it, might just tighten the knot.',
      destructive: 'Taking it out on the nearest easy target, not the actual obstacle.',
    },
  },
  resentful: {
    definition: 'An old crossing that was never resolved, and still feels owed.',
    actions: {
      constructive: "Naming the debt out loud — what you're still owed, and to whom.",
      ambiguous: 'Keeping score quietly — protects you, or just widens the gap.',
      destructive: 'Bringing up the past mid-argument, as a weapon, not context.',
    },
  },
  angry: {
    definition: 'The boundary has been crossed, clearly, and it wants to be met.',
    actions: {
      constructive: "Saying the boundary plainly — this, not that, and here's why.",
      ambiguous: 'Raising your voice a little — might land as clarity, might land as a threat.',
      destructive: 'Insulting the person instead of naming the crossing.',
    },
  },
  furious: {
    definition: "The boundary wasn't just crossed — it was flattened, and every part of you knows it.",
    actions: {
      constructive: 'Putting words to exactly what was flattened, even if your voice shakes doing it.',
      ambiguous: "Walking away mid-conversation — might be protecting everyone, might be avoiding the reckoning.",
      destructive: 'Breaking something, or someone, to match the size of what you feel.',
    },
  },
  peeved: {
    definition: 'A minor jab — more surface than sting.',
    actions: {
      constructive: "Shrugging it off out loud — \"a bit peeved,\" and back to your day.",
      ambiguous: 'Rolling your eyes where no one sees — costs nothing, or quietly builds.',
      destructive: 'Making a snide little comment, small enough to deny.',
    },
  },
  miffed: {
    definition: 'Caught a bit off guard by something that felt unfair.',
    actions: {
      constructive: 'Asking directly what happened, instead of guessing at the slight.',
      ambiguous: 'Going quiet for a moment — settling, or the first brick of a wall.',
      destructive: 'Deciding they meant it, without ever checking.',
    },
  },
  critical: {
    definition: 'Everything about the situation starts looking like evidence against it.',
    actions: {
      constructive: "Saying specifically what's wrong, aimed at the thing, not the person.",
      ambiguous: 'Listing every flaw in your head — sharpens your case, or just sharpens you.',
      destructive: "Picking apart something unrelated because it's easier to hit.",
    },
  },
  'hot-tempered': {
    definition: "The fuse is already short, before anything's even happened yet.",
    actions: {
      constructive: "Naming that you're primed, out loud, before the match gets struck.",
      ambiguous: 'Leaving the room preemptively — protective, or just delaying the same fight.',
      destructive: 'Going off at the first small thing, at full size.',
    },
  },
  fuming: {
    definition: 'The heat is fully lit and has nowhere yet to go.',
    actions: {
      constructive: 'Moving your body — a fast walk, until there is room to speak instead of steam.',
      ambiguous: 'Staying silent and rigid — composure, or a kettle with the lid on.',
      destructive: 'Slamming something to let the pressure out somewhere, anywhere.',
    },
  },
  outraged: {
    definition: 'Something crossed a line that should never be crossed — not just yours.',
    actions: {
      constructive: 'Directing it at the actual line that was crossed, and who crossed it.',
      ambiguous: 'Posting about it immediately — can mobilize, can just spend the heat.',
      destructive: "Turning it on the nearest person who agrees a little too slowly.",
    },
  },
  vindictive: {
    definition: 'The hurt has curdled into wanting them to feel it too.',
    actions: {
      constructive: 'Naming the wish for payback to yourself, without acting on it yet.',
      ambiguous: 'Withholding something small — fair distance, or the first move in a quiet war.',
      destructive: 'Engineering their loss, specifically, on purpose.',
    },
  },
  boiling: {
    definition: 'Right at the edge — one more degree and it goes over the side.',
    actions: {
      constructive: 'Leaving, on purpose, before the degree that tips it.',
      ambiguous: 'Gripping something tightly and saying nothing — holding, or about to crack.',
      destructive: "Letting it boil over onto whoever happens to be standing there.",
    },
  },
  livid: {
    definition: 'Cold, total, and completely in control of itself — which is its own kind of frightening.',
    actions: {
      constructive: "Writing down exactly what happened while it's this clear, before you speak.",
      ambiguous: 'Going eerily calm — could be the clearest you have thought all day, or the quiet before it lands.',
      destructive: 'Delivering the coldest, most precise thing you could possibly say.',
    },
  },
  infuriated: {
    definition: 'Triggered past the point of thinking straight, by something that felt deliberate.',
    actions: {
      constructive: 'Naming what felt deliberate about it, specifically, once you can speak.',
      ambiguous: 'Demanding an explanation right now — can clear the air, can corner someone.',
      destructive: 'Assuming the worst about their intent and acting on the assumption.',
    },
  },
  explosive: {
    definition: 'About to go, with no more room left to hold it.',
    actions: {
      constructive: "Getting somewhere alone, fast, before whatever's coming comes out at someone.",
      ambiguous: 'Warning people to back off — protective, or itself the first blast.',
      destructive: "Letting it all out at once, at whoever's closest when it goes.",
    },
  },

  // ————— Fear — "Something matters to you and its outcome is uncertain." —————
  uneasy: {
    definition: "Nothing name-able yet — just a background hum that something's off.",
    actions: {
      constructive: 'Noticing the hum out loud, even without knowing what it is about yet.',
      ambiguous: 'Scanning the room once more — reasonable caution, or the start of vigilance.',
      destructive: 'Ignoring it and pushing through, leaving the hum to grow unattended.',
    },
  },
  nervous: {
    definition: "Something specific is coming, and your body is already bracing for it.",
    actions: {
      constructive: 'Naming exactly what is coming, out loud, to someone who can hear it.',
      ambiguous: 'Over-preparing — can genuinely help, or can just be another way to brace.',
      destructive: "Avoiding the thing entirely, and calling it 'not ready yet.'",
    },
  },
  worried: {
    definition: 'Your mind keeps running the same uncertain outcome, looking for a way through.',
    actions: {
      constructive: "Asking what you'd actually do if the worst version happened, then setting it down.",
      ambiguous: 'Checking for updates repeatedly — informed, or feeding the loop.',
      destructive: 'Spiraling through every possible bad outcome at once, out loud, to whoever is near.',
    },
  },
  afraid: {
    definition: 'Something you care about is genuinely at risk, right now.',
    actions: {
      constructive: 'Saying plainly what you are afraid of, to someone who can stand with you.',
      ambiguous: 'Freezing for a moment — assessing, or stuck.',
      destructive: 'Lashing out at whoever is nearby, so the fear has somewhere to go that is not you.',
    },
  },
  dreading: {
    definition: "Something specific and unwanted is coming, and there is no version where it doesn't.",
    actions: {
      constructive: 'Naming the exact thing, so it is a fact to prepare for, not a shadow.',
      ambiguous: 'Putting it off one more day — sometimes rest, sometimes just delay.',
      destructive: 'Letting the dread bleed into everything else you do until it arrives.',
    },
  },
  panicked: {
    definition: 'The threat feels immediate, and your body has already decided to act.',
    actions: {
      constructive: 'One slow breath, on purpose, before the next move — buys a second of choice.',
      ambiguous: 'Running — genuinely gets you clear, or just moves the panic somewhere else.',
      destructive: 'Acting on the first impulse the fear hands you, without checking it.',
    },
  },
  insecure: {
    definition: 'A quiet doubt about whether you actually measure up here.',
    actions: {
      constructive: 'Naming the doubt to someone who knows you, and hearing them answer it.',
      ambiguous: 'Double-checking your work once more — care, or the doubt talking.',
      destructive: 'Deciding the doubt is fact, and acting smaller because of it.',
    },
  },
  timid: {
    definition: 'Holding back before you have even tried, just in case.',
    actions: {
      constructive: 'Trying the small version first, on purpose, to see what happens.',
      ambiguous: 'Waiting to be asked twice — genuine hesitation, or a habit of shrinking.',
      destructive: 'Staying silent on something that actually mattered to say.',
    },
  },
  hesitant: {
    definition: "Genuinely unsure which way to step, so you haven't stepped yet.",
    actions: {
      constructive: "Naming the specific thing you're unsure about, out loud, to think it through.",
      ambiguous: 'Sleeping on it — can sharpen the choice, can just stall it.',
      destructive: 'Letting someone else decide, so it is never really your choice at all.',
    },
  },
  unsettled: {
    definition: "Something shifted, and the ground doesn't feel quite level yet.",
    actions: {
      constructive: 'Naming what changed, plainly, so it stops being a vague feeling.',
      ambiguous: 'Reorganizing something small and unrelated — soothes, or just distracts.',
      destructive: "Picking a fight with the nearest stable thing, to match how unstable you feel.",
    },
  },
  uncertain: {
    definition: "You genuinely don't know what happens next, and can't make yourself know.",
    actions: {
      constructive: 'Listing what you DO know, to shrink the unknown part down to size.',
      ambiguous: 'Asking everyone their opinion — can genuinely help, can just outsource the deciding.',
      destructive: 'Forcing a decision early just to make the not-knowing stop.',
    },
  },
  troubled: {
    definition: "Something is sitting wrong, and it hasn't let you rest yet.",
    actions: {
      constructive: 'Saying what is sitting wrong, to someone, before it sits any longer.',
      ambiguous: 'Turning it over alone at night — can work through it, can just keep you up.',
      destructive: 'Taking it out on the people around you instead of naming it.',
    },
  },
  lost: {
    definition: 'No clear next step is visible from here.',
    actions: {
      constructive: "Asking someone who's been here before what comes next.",
      ambiguous: 'Standing still to get your bearings — wise, or stuck.',
      destructive: 'Picking any direction at all, just to feel like you are moving.',
    },
  },
  jittery: {
    definition: "Your body is running ahead of whatever's actually happening.",
    actions: {
      constructive: 'Moving it out — a short walk, before you try to sit with anything.',
      ambiguous: 'More caffeine — can sharpen you, can wind the jitters tighter.',
      destructive: "Snapping at something small because your body's already at full charge.",
    },
  },
  embarrassed: {
    definition: 'You were seen in a way you did not want to be seen.',
    actions: {
      constructive: 'Naming it lightly, out loud — takes its power away faster than hiding does.',
      ambiguous: 'Laughing it off — can genuinely land it, can paper over a real sting.',
      destructive: 'Replaying it on a loop, alone, making it bigger each time.',
    },
  },
  frightened: {
    definition: 'Something real and immediate feels like it could hurt you.',
    actions: {
      constructive: 'Getting to someone or somewhere that actually feels safe, and saying why.',
      ambiguous: 'Going very still and quiet — can be steadying, can be shutting down.',
      destructive: 'Striking out at whatever is closest, friend or threat, without checking which it is.',
    },
  },
  horrified: {
    definition: "Something crossed a line you didn't think could be crossed.",
    actions: {
      constructive: 'Saying exactly what you saw, plainly, to someone who can hold it with you.',
      ambiguous: 'Going numb on the spot — protective, or a full disconnect.',
      destructive: 'Turning away entirely and refusing to look at it again, ever.',
    },
  },
  terrified: {
    definition: 'Every part of you believes something is about to genuinely harm you.',
    actions: {
      constructive: 'Getting to safety, then telling exactly one person exactly what happened.',
      ambiguous: 'Freezing completely — can be the safest option, can trap you there.',
      destructive: 'Fighting or fleeing without any read on whether it actually helps.',
    },
  },
  petrified: {
    definition: 'So overtaken that moving at all feels impossible.',
    actions: {
      constructive: 'Letting someone else move first, and following their lead out.',
      ambiguous: 'Staying exactly still — sometimes the safest choice, sometimes just paralysis.',
      destructive: 'Forcing yourself to act anyway, badly, because stillness feels unbearable.',
    },
  },

  // ————— Sadness — "Something you love is missing, lost, or out of reach." —————
  wistful: {
    definition: 'A soft ache for something that mattered — missing it, not mourning it.',
    actions: {
      constructive: 'Letting the memory play out fully, on purpose, instead of pushing it away.',
      ambiguous: 'Scrolling old photos — can be a visit, can be picking at it.',
      destructive: 'Deciding nothing since has measured up, and treating the present accordingly.',
    },
  },
  down: {
    definition: 'Everything feels a little flatter than usual, without one clear cause.',
    actions: {
      constructive: 'Naming that you are down, out loud, to someone — even without a reason attached.',
      ambiguous: 'Staying in — can be real rest, can be avoidance dressed as rest.',
      destructive: "Deciding you're just like this, and stopping there.",
    },
  },
  disappointed: {
    definition: "Something you hoped for didn't happen, or didn't happen the way you needed.",
    actions: {
      constructive: 'Naming exactly what you hoped for, so the gap is clear instead of vague.',
      ambiguous: 'Lowering your expectations for next time — protective, or a quiet kind of giving up.',
      destructive: 'Making the person who let you down carry all of it, unspoken.',
    },
  },
  hurt: {
    definition: 'Someone or something that mattered treated what you offered carelessly.',
    actions: {
      constructive: 'Saying plainly what hurt, and why it mattered that it came from them.',
      ambiguous: 'Pulling back a little — self-protection, or the start of a wall.',
      destructive: 'Hurting them back, to make sure they understand.',
    },
  },
  sad: {
    definition: 'Something that mattered is genuinely gone, missing, or changed for good.',
    actions: {
      constructive: 'Letting yourself actually cry it out, instead of holding the shape of it.',
      ambiguous: 'Keeping busy — can carry you through, can just postpone the grieving.',
      destructive: 'Pushing everyone away right when company would actually help.',
    },
  },
  grieving: {
    definition: 'A real loss, being carried through, one wave of it at a time.',
    actions: {
      constructive: "Letting the wave move through you fully, without rushing its timeline.",
      ambiguous: 'Going through the motions of daily life — functional, or a way of not feeling it.',
      destructive: 'Numbing it entirely, so the loss never actually gets felt at all.',
    },
  },
  lonely: {
    definition: 'You want company and there is none, even in a full room.',
    actions: {
      constructive: 'Reaching out to exactly one person, honestly, instead of waiting to be found.',
      ambiguous: "Going quiet on everyone — rest, or the loneliness deepening its own hole.",
      destructive: 'Deciding no one would actually come, and never testing it.',
    },
  },
  gloomy: {
    definition: 'A grey has settled over things, without one clear source.',
    actions: {
      constructive: 'Getting outside, even briefly — a small, deliberate counterweight.',
      ambiguous: 'Staying in dim light and quiet — can be soothing, can be feeding it.',
      destructive: 'Letting the grey decide what you cancel and what you avoid.',
    },
  },
  withdrawn: {
    definition: 'Pulling back from everyone, on purpose, without saying why.',
    actions: {
      constructive: "Telling one person you're pulling back, so it isn't a silent disappearance.",
      ambiguous: 'Taking space — can be exactly what is needed, can drift into isolation.',
      destructive: 'Letting the distance grow until reconnecting feels impossible.',
    },
  },
  discouraged: {
    definition: 'Effort keeps meeting the same wall, and belief in the outcome is thinning.',
    actions: {
      constructive: 'Naming the wall specifically, to someone who might see past it with you.',
      ambiguous: 'Taking a break from trying — recovery, or quietly quitting.',
      destructive: 'Deciding you were never going to manage it, and stopping there.',
    },
  },
  regretful: {
    definition: "Looking back at a choice you'd genuinely make differently now.",
    actions: {
      constructive: "Naming what you'd do differently, plainly, and what you'll do about it now.",
      ambiguous: 'Replaying the choice in your head — can extract the lesson, can just loop.',
      destructive: 'Letting the regret define the whole of who you are.',
    },
  },
  remorseful: {
    definition: 'You caused a hurt, and can genuinely feel its weight.',
    actions: {
      constructive: 'Naming it directly to the person you hurt, without excusing it.',
      ambiguous: 'Apologizing quickly — can genuinely repair, can just relieve your own discomfort.',
      destructive: 'Making your guilt their problem to manage and reassure you about.',
    },
  },
  ashamed: {
    definition: 'Something about who you were in that moment feels genuinely hard to own.',
    actions: {
      constructive: 'Telling someone safe the actual thing, and letting them see you anyway.',
      ambiguous: 'Keeping it entirely private — can be dignity, can be isolation.',
      destructive: 'Deciding the moment defines all of you, permanently.',
    },
  },
  defeated: {
    definition: 'Effort stopped feeling like it could change the outcome.',
    actions: {
      constructive: 'Naming exactly what you tried, and what genuinely did not work about it.',
      ambiguous: 'Stepping away from it for now — can be wisdom, can be surrender.',
      destructive: 'Deciding trying again is pointless, everywhere, from now on.',
    },
  },
  miserable: {
    definition: "Nothing right now feels bearable, and it's been this way a while.",
    actions: {
      constructive: 'Telling someone plainly how bad it has been, without minimizing it for them.',
      ambiguous: 'Isolating to cope — can be genuine rest, can deepen the misery.',
      destructive: 'Making everyone around you carry the weight of it too.',
    },
  },
  anguished: {
    definition: 'Sadness agitated past stillness — it will not sit quietly.',
    actions: {
      constructive: 'Letting it move through your body — sound, tears, movement, whatever it needs.',
      ambiguous: 'Pacing, restless — can be releasing it, can be feeding the agitation.',
      destructive: 'Turning the agitation into harm, toward yourself or someone else.',
    },
  },
  heartbroken: {
    definition: 'What mattered is genuinely, permanently gone, and the loss is total.',
    actions: {
      constructive: 'Letting people who love you actually be there for this one.',
      ambiguous: 'Throwing yourself into something else entirely — distraction, or displaced grief.',
      destructive: "Deciding you'll never let anything matter that much again.",
    },
  },
  devastated: {
    definition: 'The loss is so total that rebuilding feels genuinely unimaginable right now.',
    actions: {
      constructive: 'Taking exactly the next hour, not the whole rebuilding, one hour at a time.',
      ambiguous: 'Letting others handle everything for a while — can be needed, can become dependence.',
      destructive: "Deciding nothing will ever be whole again, and living as if that's already true.",
    },
  },
  distraught: {
    definition: 'So overwhelmed by the loss that thinking clearly is not currently possible.',
    actions: {
      constructive: 'Letting someone else hold the practical decisions until you can think again.',
      ambiguous: 'Crying it out loudly — can release the flood, can alarm the people trying to help.',
      destructive: 'Making an irreversible decision from inside the flood.',
    },
  },
  bereft: {
    definition: 'Emptied out by the loss — the space where it lived is just gone.',
    actions: {
      constructive: 'Sitting with the emptiness itself, without rushing to fill it with something else.',
      ambiguous: 'Keeping their things exactly as they were — can honor it, can keep you stuck in it.',
      destructive: 'Filling the emptiness with the first thing that numbs it.',
    },
  },

  // ————— Disgust — "Something does not sit right with you, and your body knows it." —————
  'put-off': {
    definition: "A small recoil — this isn't for you, and you've noticed.",
    actions: {
      constructive: 'Just stepping back from it, plainly, without needing to explain why.',
      ambiguous: 'Making a face — honest, or a bit performative for whoever is watching.',
      destructive: 'Announcing loudly how put off you are, at the expense of whoever it is about.',
    },
  },
  squeamish: {
    definition: "Your body is flinching before your mind's caught up to why.",
    actions: {
      constructive: 'Looking away and letting the flinch pass, without judging yourself for it.',
      ambiguous: 'Forcing yourself to look anyway — can build tolerance, can just be unpleasant.',
      destructive: 'Making the thing that squicked you someone else’s problem to hide too.',
    },
  },
  averse: {
    definition: 'A settled unwillingness to go anywhere near this.',
    actions: {
      constructive: 'Naming the aversion and simply opting out, without apology.',
      ambiguous: 'Avoiding the topic entirely — can be self-protective, can close off a real conversation.',
      destructive: "Shaming anyone who doesn't share the same aversion.",
    },
  },
  repulsed: {
    definition: 'A full-body no — nothing about this can be tolerated close.',
    actions: {
      constructive: 'Removing yourself from it completely, as fast as you reasonably can.',
      ambiguous: 'Reacting visibly, loudly — honest, or humiliating to whoever caused it.',
      destructive: 'Treating the source of it as less than a person because of the reaction.',
    },
  },
  offended: {
    definition: 'Something crossed a line of what you find acceptable, and it landed personally.',
    actions: {
      constructive: 'Naming exactly what crossed the line, and why it landed the way it did.',
      ambiguous: 'Going cold toward them — can protect you, can end things unspoken.',
      destructive: 'Punishing them for something you never actually told them mattered.',
    },
  },
  queasy: {
    definition: 'Your stomach has already made up its mind about this.',
    actions: {
      constructive: 'Stepping away and letting your body settle before deciding anything.',
      ambiguous: 'Pushing through it anyway — can be necessary, can just make it worse.',
      destructive: 'Ignoring what your body is clearly telling you, repeatedly.',
    },
  },
  revolted: {
    definition: 'A strong, visceral no that is hard to hide or soften.',
    actions: {
      constructive: 'Removing yourself, plainly, and naming why if it is asked.',
      ambiguous: 'Making your revulsion visible — honest reaction, or a public shaming.',
      destructive: 'Treating the source as beneath basic decency because of how it landed.',
    },
  },
  loathing: {
    definition: 'A settled, total rejection — nothing about it earns a second look.',
    actions: {
      constructive: 'Keeping real distance, deliberately, and being honest about why.',
      ambiguous: 'Talking about it at length to others — can process it, can spread contempt.',
      destructive: 'Letting the loathing justify treating them as less than human.',
    },
  },

  // ————— Enjoyment — "Something is nourishing you, right here, right now." —————
  content: {
    definition: 'Nothing missing right now — a quiet, settled enough.',
    actions: {
      constructive: 'Actually noticing it, for a moment, instead of rushing past it.',
      ambiguous: 'Staying still with it — can be presence, can be avoiding what is next.',
      destructive: 'Mistaking it for permanent, and stopping tending to what built it.',
    },
  },
  glad: {
    definition: 'Something worked out, and it is genuinely welcome.',
    actions: {
      constructive: 'Saying thank you to whoever or whatever made it happen.',
      ambiguous: 'Keeping it to yourself — can be quiet enjoyment, can miss sharing it with someone who would care.',
      destructive: "Rubbing the good outcome in where someone else didn't get theirs.",
    },
  },
  amused: {
    definition: 'Something struck you as genuinely funny, right now.',
    actions: {
      constructive: 'Laughing out loud, actually, instead of just noting that it was funny.',
      ambiguous: "Laughing at someone's expense — funny, or unkind, depending entirely on them.",
      destructive: "Turning the humor into mockery once it's clear it stings.",
    },
  },
  warm: {
    definition: 'A closeness with someone or something, felt in the body.',
    actions: {
      constructive: "Saying it out loud — \"I feel close to you right now.\"",
      ambiguous: 'Getting quietly nostalgic — can deepen the warmth, can slide into missing what is gone.',
      destructive: 'Clinging to the moment so tightly it cannot just be what it is.',
    },
  },
  delighted: {
    definition: 'Something exceeded what you expected, clearly and pleasantly.',
    actions: {
      constructive: 'Sharing the delight with whoever is near — it multiplies, told out loud.',
      ambiguous: 'Wanting more of exactly this, right away — can chase the good, can grasp at it.',
      destructive: 'Needing everyone else to match your delight, and souring if they do not.',
    },
  },
  joyful: {
    definition: 'Full, unguarded happiness — nothing held back from feeling it.',
    actions: {
      constructive: 'Letting it show fully, on your face, in your body, without editing it down.',
      ambiguous: 'Wanting to hold onto this exact feeling forever — natural, or setting up a fall.',
      destructive: "Performing more joy than you actually feel, for whoever's watching.",
    },
  },
  serene: {
    definition: 'A stillness with nothing pulling at it.',
    actions: {
      constructive: 'Staying in it, unhurried, letting it be exactly as long as it lasts.',
      ambiguous: 'Avoiding anything that might disturb it — protects it, or avoids something real.',
      destructive: 'Resenting whoever or whatever breaks the stillness.',
    },
  },
  peaceful: {
    definition: 'Nothing currently at war, inside or around you.',
    actions: {
      constructive: 'Noting what made this possible, so you can find your way back to it.',
      ambiguous: 'Disengaging from anything hard — can protect the peace, can dodge what needs handling.',
      destructive: 'Punishing whoever disrupts it, out of proportion to the disruption.',
    },
  },
  relieved: {
    definition: 'A threat or worry has genuinely lifted.',
    actions: {
      constructive: 'Letting your body actually exhale — shoulders down, a real breath out.',
      ambiguous: 'Immediately moving on — can be healthy, can skip processing what just happened.',
      destructive: 'Blaming whoever caused the original worry for what the relief cost you.',
    },
  },
  pleased: {
    definition: 'Something went the way you had hoped, cleanly.',
    actions: {
      constructive: 'Acknowledging your own part in it, specifically, out loud.',
      ambiguous: 'Downplaying it to others — modesty, or discomfort with being seen enjoying it.',
      destructive: "Comparing it to someone else's worse outcome to feel it more.",
    },
  },
  cheerful: {
    definition: 'A light, easy good mood, without needing a big reason.',
    actions: {
      constructive: 'Letting it be contagious — sharing it plainly with whoever is around.',
      ambiguous: "Being upbeat with someone who's struggling — can lift them, can miss where they are.",
      destructive: 'Insisting everyone else match your mood.',
    },
  },
  playful: {
    definition: 'Wanting to be light, silly, unserious for a while.',
    actions: {
      constructive: 'Inviting someone else into the play, directly.',
      ambiguous: 'Teasing someone — fun for both, or landing wrong for one.',
      destructive: 'Pushing the joke past where the other person actually wanted it to go.',
    },
  },
  happy: {
    definition: 'A clear, whole-feeling good — things are, right now, genuinely well.',
    actions: {
      constructive: 'Naming specifically what is making it so, to hold onto the shape of it.',
      ambiguous: "Broadcasting it widely — can be genuine sharing, can be a bit much for someone struggling.",
      destructive: 'Needing everyone around you to affirm it to keep feeling it.',
    },
  },
  thrilled: {
    definition: 'A charge of excitement that is hard to sit still through.',
    actions: {
      constructive: 'Moving your body with it — the energy wants somewhere real to go.',
      ambiguous: 'Telling everyone immediately — can be pure sharing, can be needing it witnessed to feel real.',
      destructive: 'Making an impulsive, expensive decision riding the charge of it.',
    },
  },
  ecstatic: {
    definition: 'Beyond ordinary happy — almost too much feeling for the moment to hold.',
    actions: {
      constructive: 'Letting the size of it out fully, in a body, in a sound, in a moment.',
      ambiguous: 'Needing this feeling to last forever — natural, or setting up a hard landing.',
      destructive: 'Making choices at this pitch that you would not make level-headed.',
    },
  },
  overjoyed: {
    definition: 'Joy at the very top of the scale, hard to even speak through.',
    actions: {
      constructive: 'Letting yourself be fully, visibly moved by it, without minimizing it.',
      ambiguous: 'Crying from happiness in front of others — vulnerable honesty, or discomfort for them.',
      destructive: "Dismissing anyone whose reaction doesn't match the size of yours.",
    },
  },
  exuberant: {
    definition: 'Overflowing, expansive good energy that wants to spill outward.',
    actions: {
      constructive: 'Channeling it into something — dancing, creating, moving, out loud.',
      ambiguous: 'Taking up a lot of space with it — can be joy, can crowd out someone quieter.',
      destructive: "Steamrolling anyone who isn't matching your energy right now.",
    },
  },

  // ————— Surprise — "Something new just landed, and you have not sorted it yet." —————
  curious: {
    definition: 'Something unfamiliar caught your attention, and you want to know more.',
    actions: {
      constructive: 'Asking a genuine question about it, out loud.',
      ambiguous: 'Looking it up privately — can satisfy it, can become a rabbit hole.',
      destructive: 'Prying into something that was not actually offered to you.',
    },
  },
  intrigued: {
    definition: 'The unfamiliar thing has hooked you, past simple noticing.',
    actions: {
      constructive: 'Following the thread a little further, with someone who can answer.',
      ambiguous: 'Watching from a distance — can be patience, can be avoidance of engaging.',
      destructive: "Chasing it obsessively, past the point it's actually serving you.",
    },
  },
  startled: {
    definition: 'Something happened faster than you could brace for it.',
    actions: {
      constructive: 'Letting your body settle — a breath, a beat — before reacting further.',
      ambiguous: 'Laughing it off immediately — can genuinely be fine, can be covering the jolt.',
      destructive: 'Snapping at whoever startled you, disproportionate to what actually happened.',
    },
  },
  amazed: {
    definition: 'Something exceeded what you thought was possible, plainly.',
    actions: {
      constructive: 'Saying what amazed you, specifically, to whoever made it happen.',
      ambiguous: 'Comparing everything else to this from now on — can raise your bar, can dim everything else.',
      destructive: 'Making the amazement about how it reflects on you, not the thing itself.',
    },
  },
  bemused: {
    definition: 'Puzzled in a mild, not-unpleasant way.',
    actions: {
      constructive: 'Asking what you are missing, plainly, instead of guessing.',
      ambiguous: 'Smiling and letting it go unresolved — can be ease, can be avoidance.',
      destructive: "Deciding it's not worth understanding, and dismissing whoever brought it.",
    },
  },
  'taken-aback': {
    definition: "Caught off guard by something you genuinely didn't see coming.",
    actions: {
      constructive: "Taking a beat before responding, out loud if useful — \"give me a second.\"",
      ambiguous: "Going quiet — can be processing, can look like a disapproval you didn't mean.",
      destructive: 'Reacting from the shock instead of from what you actually think.',
    },
  },
  perplexed: {
    definition: 'None of this is adding up the way you expected.',
    actions: {
      constructive: 'Asking directly for the piece you are missing.',
      ambiguous: 'Trying to work it out alone, silently — can crack it, can just spin.',
      destructive: "Deciding you're wrong about everything, far past what's actually confusing.",
    },
  },
  baffled: {
    definition: 'Completely without a frame for what just happened.',
    actions: {
      constructive: "Saying plainly, \"I don't understand,\" to someone who can help.",
      ambiguous: 'Pretending you followed — saves face, or buries a real gap.',
      destructive: "Making the confusion someone else's failure to explain, loudly.",
    },
  },
  bewildered: {
    definition: 'Disoriented enough that even the next step is unclear.',
    actions: {
      constructive: 'Asking someone steady to walk you through it, slowly.',
      ambiguous: 'Standing still until it clears — a wise pause, or stuck.',
      destructive: 'Making a decision anyway, from inside the disorientation.',
    },
  },
  shocked: {
    definition: 'Something landed hard enough to stop your usual response entirely.',
    actions: {
      constructive: "Naming, simply, \"I'm shocked,\" before trying to say anything more.",
      ambiguous: "Going silent — can be processing, can look like you don't care.",
      destructive: "Blurting the first raw reaction, unfiltered, at whoever's closest.",
    },
  },
  astounded: {
    definition: 'Past ordinary surprise — this genuinely rearranges what you thought was true.',
    actions: {
      constructive: 'Sitting with it a while before responding, letting it actually land.',
      ambiguous: 'Telling everyone immediately — can be genuine sharing, can be needing it confirmed.',
      destructive: 'Refusing to update anything you believed, despite the evidence.',
    },
  },
  stunned: {
    definition: 'Response has fully stalled — nothing coming out yet.',
    actions: {
      constructive: 'Letting the silence be, without forcing a reaction before you have one.',
      ambiguous: 'Being led through the next steps by someone else — helpful, or a total handoff.',
      destructive: 'Faking composure you do not have, and making choices from the fake.',
    },
  },
  flabbergasted: {
    definition: "So thrown that words genuinely won't come.",
    actions: {
      constructive: "Naming that words aren't coming, which is itself an honest answer.",
      ambiguous: 'Laughing helplessly — release, or a mask for being completely unmoored.',
      destructive: 'Filling the silence with whatever comes out, unexamined.',
    },
  },
  speechless: {
    definition: 'No words are available right now, at all.',
    actions: {
      constructive: 'A nod, a hand on someone’s arm — presence, without needing words yet.',
      ambiguous: 'Staying silent for a long stretch — respectful, or leaving someone hanging.',
      destructive: 'Letting the silence be read as a verdict you did not intend.',
    },
  },

  // ————— Contempt — "You have placed yourself above someone — often to protect something tender." —————
  dismissive: {
    definition: "Not worth your attention, you've quietly decided.",
    actions: {
      constructive: "Checking, honestly, whether that's actually true or just easier to believe.",
      ambiguous: 'Changing the subject — can spare everyone, can shut someone out.',
      destructive: 'Talking over them as if they had not spoken at all.',
    },
  },
  judgy: {
    definition: 'Measuring someone against a standard, and finding them short.',
    actions: {
      constructive: "Asking yourself what standard you're actually using, and where it came from.",
      ambiguous: 'Keeping the judgment to yourself — can be discretion, can be quiet contempt.',
      destructive: "Making sure they know, indirectly, exactly how they've fallen short.",
    },
  },
  disdainful: {
    definition: 'A settled sense that this is beneath you.',
    actions: {
      constructive: "Naming to yourself what's actually underneath the disdain — often something tender.",
      ambiguous: 'Keeping physical distance — can protect you, can be a quiet punishment.',
      destructive: 'Letting the disdain show on your face, deliberately, so they feel it.',
    },
  },
  scornful: {
    definition: "Open, visible contempt — you've stopped hiding how far above you've placed yourself.",
    actions: {
      constructive: 'Stepping back to ask what you are protecting by standing this far above.',
      ambiguous: 'Mocking them in front of others — can be defended as humor, can be public humiliation.',
      destructive: 'Humiliating them on purpose, to make the distance undeniable.',
    },
  },
  condescending: {
    definition: 'Explaining something in a way that makes your superiority the point.',
    actions: {
      constructive: 'Checking your tone before you speak, and matching it to theirs.',
      ambiguous: 'Simplifying your language — can be genuine care, can be quiet superiority.',
      destructive: 'Making sure they feel small while you explain.',
    },
  },
  smug: {
    definition: 'Quietly enjoying being right, a little too much.',
    actions: {
      constructive: 'Noticing the satisfaction, privately, without needing anyone else to see it.',
      ambiguous: 'Bringing it up again later — can be harmless, can be rubbing it in.',
      destructive: "Reminding them, repeatedly, that you were right and they weren't.",
    },
  },
  superior: {
    definition: 'A settled sense that you are simply better than the person in front of you.',
    actions: {
      constructive: 'Asking honestly what is underneath needing to be above them right now.',
      ambiguous: 'Staying quiet about the feeling — can be restraint, can be a private verdict.',
      destructive: 'Treating their input as beneath serious consideration.',
    },
  },

  // ————— Anticipation — "Something is on its way, and you are leaning toward it." —————
  interested: {
    definition: "Something ahead has caught your attention, gently.",
    actions: {
      constructive: 'Asking a question that moves you a step closer to it.',
      ambiguous: 'Looking into it quietly on your own — can satisfy it, can spiral into more waiting.',
      destructive: 'Losing interest in everything else while you wait to find out.',
    },
  },
  expectant: {
    definition: "You're leaning forward, waiting for a specific thing to arrive.",
    actions: {
      constructive: 'Naming what you are expecting, out loud, to someone who can wait with you.',
      ambiguous: 'Checking for updates constantly — can be reasonable, can become compulsive.',
      destructive: 'Getting irritable at everyone around you while you wait.',
    },
  },
  eager: {
    definition: 'Wanting to move toward it now, not later.',
    actions: {
      constructive: 'Taking one real step toward it today, instead of just wanting to.',
      ambiguous: 'Rushing ahead of the plan — can seize the moment, can skip steps that mattered.',
      destructive: 'Pushing everyone else to move at your pace, regardless of theirs.',
    },
  },
  excited: {
    definition: 'Genuinely charged about what is coming, and it shows.',
    actions: {
      constructive: 'Sharing the excitement with someone who will actually enjoy hearing it.',
      ambiguous: "Talking about it nonstop — can be joy, can wear out whoever's listening.",
      destructive: 'Making plans you cannot actually follow through on, riding the charge.',
    },
  },
  enthusiastic: {
    definition: 'Fully leaning in, energy and all, toward what is coming.',
    actions: {
      constructive: 'Channeling the energy into real preparation, not just the feeling of it.',
      ambiguous: 'Volunteering for more than usual — can be genuine, can overcommit you.',
      destructive: 'Steamrolling anyone less enthusiastic to keep the momentum yours.',
    },
  },
  elated: {
    definition: 'As high on what is coming as anticipation gets.',
    actions: {
      constructive: 'Letting yourself feel the full lift of it, without rushing to the arrival.',
      ambiguous: 'Building it up as the thing that will fix everything — can motivate, can set up a crash.',
      destructive: "Neglecting what's actually in front of you for the sake of what's coming.",
    },
  },
  vigilant: {
    definition: "Watching closely for what's coming, so nothing catches you off guard.",
    actions: {
      constructive: 'Naming specifically what you are watching for, so the vigilance has an edge, not just a hum.',
      ambiguous: "Staying alert past the point it's needed — can protect you, can exhaust you.",
      destructive: "Treating everyone around you as a potential threat because you can't stop scanning.",
    },
  },
  hopeful: {
    definition: "Leaning toward a good outcome, without yet knowing if it's coming.",
    actions: {
      constructive: 'Naming the hope out loud, even without guarantees attached to it.',
      ambiguous: 'Holding off on backup plans — can be trust, can leave you unprepared.',
      destructive: "Ignoring real signs it isn't coming, because the hope feels better than looking.",
    },
  },

  // ————— Trust — "You can rest your weight on this — a person, a place, yourself." —————
  open: {
    definition: 'Willing to let something or someone in, a little.',
    actions: {
      constructive: 'Sharing one real thing, to see how it is held.',
      ambiguous: "Lowering your guard quickly — can build closeness fast, can outpace what's actually earned.",
      destructive: 'Handing over everything at once, before there is any real basis for it.',
    },
  },
  comfortable: {
    definition: 'At ease here — nothing bracing against it.',
    actions: {
      constructive: 'Letting yourself actually settle into it, without watching for it to end.',
      ambiguous: 'Getting a little too relaxed — can be genuine ease, can miss something worth noticing.',
      destructive: 'Taking the comfort for granted until it quietly erodes.',
    },
  },
  accepting: {
    definition: 'Taking this person or situation as they actually are.',
    actions: {
      constructive: 'Saying plainly what you accept, so it is known, not assumed.',
      ambiguous: 'Not raising a concern — can be genuine peace with it, can be avoidance.',
      destructive: "Accepting something that's actually costing you, and calling it fine.",
    },
  },
  secure: {
    definition: 'Steady here — nothing currently threatens this footing.',
    actions: {
      constructive: 'Naming what built this security, so you know how to protect it.',
      ambiguous: 'Relaxing your usual caution — can be earned ease, can be complacency.',
      destructive: 'Taking the security for granted and stopping the work that built it.',
    },
  },
  faithful: {
    definition: 'A steady, chosen loyalty, held over time.',
    actions: {
      constructive: 'Renewing the commitment out loud, on purpose, not just by default.',
      ambiguous: 'Staying through something hard without saying why — can be devotion, can be avoidance of a real conversation.',
      destructive: "Staying loyal to something that's actively costing you, past the point it's earned.",
    },
  },
  devoted: {
    definition: 'Fully given over — this matters more than most things do.',
    actions: {
      constructive: 'Making sure the devotion is actually seen, plainly, not just assumed.',
      ambiguous: 'Prioritizing it above everything else — can be genuine devotion, can crowd out the rest of your life.',
      destructive: 'Losing yourself entirely into it, until nothing else remains.',
    },
  },
  reassured: {
    definition: 'A worry just got answered, and the ground feels steadier.',
    actions: {
      constructive: 'Naming what reassured you, so you can find your way back to it again.',
      ambiguous: "Taking someone's word for it without checking — can be trust, can skip due care.",
      destructive: 'Letting the reassurance stop you from ever checking again.',
    },
  },
  confident: {
    definition: 'A settled belief that you can actually handle this.',
    actions: {
      constructive: 'Taking the next step because of it, plainly, without waiting for permission.',
      ambiguous: 'Skipping preparation because you feel ready — can be earned, can be premature.',
      destructive: "Dismissing anyone who raises a real concern, because you're sure.",
    },
  },
  assured: {
    definition: 'Someone or something has given you a clear reason to trust it.',
    actions: {
      constructive: 'Letting the assurance actually land, instead of still bracing out of habit.',
      ambiguous: 'Relaxing your guard fully — can be well-placed, can be too soon.',
      destructive: 'Ignoring a real warning sign because the assurance felt good.',
    },
  },
  loyal: {
    definition: 'Staying, on purpose, because this is worth staying for.',
    actions: {
      constructive: 'Saying out loud why you are staying, so it is a choice, not just a habit.',
      ambiguous: 'Defending them without question — can be loyalty, can excuse something real.',
      destructive: 'Staying loyal to something that is actively hurting you or someone else.',
    },
  },
  admiring: {
    definition: 'Genuinely looking up to something about this person.',
    actions: {
      constructive: 'Telling them, specifically, what you admire — it rarely costs you anything to say.',
      ambiguous: 'Comparing yourself to them — can motivate you, can just make you feel small.',
      destructive: 'Excusing something they did wrong because of how much you admire them.',
    },
  },
};

/** Word-level content for a specific feeling, or undefined if it has none yet. */
export function findWordDefinition(wordId: string): WordDefinition | undefined {
  return WORD_DEFINITIONS[wordId];
}
