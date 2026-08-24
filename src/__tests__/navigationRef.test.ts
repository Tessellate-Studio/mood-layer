/**
 * The deep-link queue (regression row 21). `navigate()` used to return early
 * when the navigator was not mounted yet, which sounds defensive and is
 * actually data loss: the ONE case a notification deep link exists for — a
 * reminder tapped while the app is closed — is precisely the case where the
 * container cannot be ready, because App.tsx gates the whole tree on
 * `useFonts` and the tap resolves in milliseconds.
 *
 * So these tests pin the queue, not the guard: an early call must survive and
 * be delivered once the container reports ready.
 */
const mockIsReady = jest.fn<boolean, []>();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: () => mockIsReady(),
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }),
}));

import { flushPendingNavigation, navigate } from '@/navigation/navigationRef';

beforeEach(() => {
  jest.clearAllMocks();
  // Drain anything a previous test left queued — the module holds one slot.
  mockIsReady.mockReturnValue(true);
  flushPendingNavigation();
  jest.clearAllMocks();
});

describe('navigate', () => {
  it('goes straight through when the container is ready', () => {
    mockIsReady.mockReturnValue(true);
    navigate('CheckInFlow', { source: 'name-it' });
    expect(mockNavigate).toHaveBeenCalledWith('CheckInFlow', { source: 'name-it' });
  });

  it('holds the route instead of dropping it when the container is not ready', () => {
    mockIsReady.mockReturnValue(false);
    navigate('CheckInFlow', { source: 'name-it' });
    expect(mockNavigate).not.toHaveBeenCalled(); // nothing to navigate yet…

    mockIsReady.mockReturnValue(true);
    flushPendingNavigation();
    expect(mockNavigate).toHaveBeenCalledWith('CheckInFlow', { source: 'name-it' }); // …but not lost
  });

  it('keeps only the most recent intent — two taps before ready is one arrival', () => {
    mockIsReady.mockReturnValue(false);
    navigate('CheckInFlow', { source: 'name-it' });
    navigate('Main', { screen: 'CircleTab' });

    mockIsReady.mockReturnValue(true);
    flushPendingNavigation();
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'CircleTab' });
  });
});

describe('flushPendingNavigation', () => {
  it('does nothing when nothing was queued', () => {
    mockIsReady.mockReturnValue(true);
    flushPendingNavigation();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not deliver twice — a second flush is a no-op', () => {
    mockIsReady.mockReturnValue(false);
    navigate('CheckInFlow', { source: 'name-it' });

    mockIsReady.mockReturnValue(true);
    flushPendingNavigation();
    flushPendingNavigation();
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('keeps the intent queued if it fires while still not ready', () => {
    mockIsReady.mockReturnValue(false);
    navigate('CheckInFlow', { source: 'name-it' });
    flushPendingNavigation(); // premature — must not discard
    expect(mockNavigate).not.toHaveBeenCalled();

    mockIsReady.mockReturnValue(true);
    flushPendingNavigation();
    expect(mockNavigate).toHaveBeenCalledWith('CheckInFlow', { source: 'name-it' });
  });
});
