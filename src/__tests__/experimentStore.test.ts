import { useExperimentStore } from '@/store/experimentStore';

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

  it('clearAll resets entries, name-it settings, and practice notes', () => {
    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [],
    });
    useExperimentStore.getState().setNameIt({ enabled: true });
    useExperimentStore.getState().setPracticeNote('problem-solution', 0, 'the problem');

    useExperimentStore.getState().clearAll();
    expect(useExperimentStore.getState().judgmentEntries).toEqual([]);
    expect(useExperimentStore.getState().nameIt.enabled).toBe(false);
    expect(useExperimentStore.getState().practiceNotes).toEqual({});
  });

  it('setPracticeNote writes per-step text without disturbing other steps', () => {
    useExperimentStore.getState().setPracticeNote('five-year-flashback', 1, 'option A');
    useExperimentStore.getState().setPracticeNote('five-year-flashback', 0, 'the decision');
    expect(useExperimentStore.getState().practiceNotes['five-year-flashback']).toEqual([
      'the decision',
      'option A',
    ]);

    // Editing one step leaves the others intact.
    useExperimentStore.getState().setPracticeNote('five-year-flashback', 0, 'a clearer decision');
    expect(useExperimentStore.getState().practiceNotes['five-year-flashback']).toEqual([
      'a clearer decision',
      'option A',
    ]);
  });
});
