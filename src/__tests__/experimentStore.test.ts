import { useExperimentStore } from '@/store/experimentStore';
import { setEntry } from '@/utils/practiceWork';

const initialState = useExperimentStore.getState();

beforeEach(() => {
  useExperimentStore.setState(initialState, true);
});

describe('experimentStore', () => {
  it('has sensible name-it defaults', () => {
    expect(useExperimentStore.getState().nameIt).toEqual({
      enabled: false,
      timesPerDay: 3,
      wakeStart: 9,
      wakeEnd: 21,
      scheduledIds: [],
    });
    expect(useExperimentStore.getState().judgmentEntries).toEqual([]);
  });

  it('addJudgmentEntry stamps id + createdAt and prepends newest-first', () => {
    const first = useExperimentStore.getState().addJudgmentEntry({
      target: 'my coworker',
      judgment: 'being disorganized',
      uncoveredFeelings: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
    });
    const second = useExperimentStore.getState().addJudgmentEntry({
      target: 'myself',
      judgment: 'being lazy',
      uncoveredFeelings: [],
      freeWriting: 'I never give myself a break.',
    });

    expect(first.id.length).toBeGreaterThan(0);
    expect(new Date(first.createdAt).getTime()).not.toBeNaN();
    expect(first.id).not.toBe(second.id);

    const { judgmentEntries } = useExperimentStore.getState();
    expect(judgmentEntries).toHaveLength(2);
    expect(judgmentEntries[0].id).toBe(second.id);
    expect(judgmentEntries[1].id).toBe(first.id);
    expect(judgmentEntries[0].freeWriting).toBe('I never give myself a break.');
  });

  it('setNameIt merges a partial without clobbering other fields', () => {
    useExperimentStore.getState().setNameIt({ enabled: true, timesPerDay: 5 });
    expect(useExperimentStore.getState().nameIt).toEqual({
      enabled: true,
      timesPerDay: 5,
      wakeStart: 9,
      wakeEnd: 21,
      scheduledIds: [],
    });

    useExperimentStore.getState().setNameIt({ scheduledIds: ['n1', 'n2'] });
    expect(useExperimentStore.getState().nameIt.scheduledIds).toEqual(['n1', 'n2']);
    expect(useExperimentStore.getState().nameIt.enabled).toBe(true);
  });

  it('clearAll resets entries, name-it settings, and practice work', () => {
    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [],
    });
    useExperimentStore.getState().setNameIt({ enabled: true });
    useExperimentStore
      .getState()
      .updatePracticeWork('problem-solution', (w) => setEntry(w, 'problem', 0, 'the problem'));

    useExperimentStore.getState().clearAll();
    expect(useExperimentStore.getState().judgmentEntries).toEqual([]);
    expect(useExperimentStore.getState().nameIt.enabled).toBe(false);
    expect(useExperimentStore.getState().practiceWork).toEqual({});
  });

  it('updatePracticeWork seeds empty work and updates one practice only', () => {
    useExperimentStore
      .getState()
      .updatePracticeWork('five-year-flashback', (w) => setEntry(w, 'decision', 0, 'move or stay'));
    useExperimentStore
      .getState()
      .updatePracticeWork('problem-solution', (w) => setEntry(w, 'problem', 0, 'no time'));

    const { practiceWork } = useExperimentStore.getState();
    expect(practiceWork['five-year-flashback'].entries.decision).toEqual(['move or stay']);
    expect(practiceWork['problem-solution'].entries.problem).toEqual(['no time']);
    // Untouched fields stay in shape.
    expect(practiceWork['five-year-flashback'].marks).toEqual({});
    expect(practiceWork['five-year-flashback'].picks).toEqual({});
  });
});
