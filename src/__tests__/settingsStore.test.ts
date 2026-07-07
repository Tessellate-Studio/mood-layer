import { useSettingsStore } from '@/store/settingsStore';

const initialState = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialState, true);
});

describe('settingsStore', () => {
  it('has the expected defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.onboardingCompletedAt).toBeNull();
    expect(s.hapticsEnabled).toBe(true);
    expect(s.reduceMotionOverride).toBeNull();
  });

  it('completeOnboarding stamps an ISO timestamp', () => {
    useSettingsStore.getState().completeOnboarding();
    const stamped = useSettingsStore.getState().onboardingCompletedAt;
    expect(stamped).not.toBeNull();
    expect(new Date(stamped as string).getTime()).not.toBeNaN();
  });

  it('setHapticsEnabled and setReduceMotionOverride update state', () => {
    useSettingsStore.getState().setHapticsEnabled(false);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);

    useSettingsStore.getState().setReduceMotionOverride(true);
    expect(useSettingsStore.getState().reduceMotionOverride).toBe(true);
    useSettingsStore.getState().setReduceMotionOverride(null);
    expect(useSettingsStore.getState().reduceMotionOverride).toBeNull();
  });

  it('resetAll restores the defaults', () => {
    useSettingsStore.getState().completeOnboarding();
    useSettingsStore.getState().setHapticsEnabled(false);
    useSettingsStore.getState().setReduceMotionOverride(true);

    useSettingsStore.getState().resetAll();
    const s = useSettingsStore.getState();
    expect(s.onboardingCompletedAt).toBeNull();
    expect(s.hapticsEnabled).toBe(true);
    expect(s.reduceMotionOverride).toBeNull();
  });
});
