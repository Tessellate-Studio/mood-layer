/**
 * The Android permission surface is a promise to the user, and it is easy to
 * break without noticing: any dependency can merge a permission into the final
 * manifest from its own AndroidManifest.xml, and nothing in the build fails
 * when it does. Two arrived that way and shipped in 0.2.0 (regression row 19):
 * expo-camera declares RECORD_AUDIO for video capture we never use, and
 * expo-file-system declares READ/WRITE_EXTERNAL_STORAGE for shared-storage
 * access we never use — this app writes only to its own sandbox.
 *
 * So this test pins the surface rather than the config: it asserts the blocks
 * stay in place, so a future `expo install` that re-adds one fails here instead
 * of on someone's App permissions screen.
 */
import appJson from '../../app.json';

const android = appJson.expo.android as {
  permissions?: string[];
  blockedPermissions?: string[];
};

const plugins = appJson.expo.plugins as (string | [string, Record<string, unknown>])[];

function pluginConfig(name: string): Record<string, unknown> | undefined {
  const entry = plugins.find((p) => Array.isArray(p) && p[0] === name);
  return Array.isArray(entry) ? entry[1] : undefined;
}

describe('android permission surface', () => {
  it('keeps CAMERA — the circle-invite QR scanner in PairSheet needs it', () => {
    // Declared by the expo-camera plugin; it must survive the blocklist.
    expect(android.blockedPermissions ?? []).not.toContain('android.permission.CAMERA');
  });

  it('does not ask for the microphone', () => {
    expect(android.permissions ?? []).not.toContain('android.permission.RECORD_AUDIO');
    expect(android.blockedPermissions ?? []).toContain('android.permission.RECORD_AUDIO');
  });

  it('turns off expo-camera audio recording at the source, not just the blocklist', () => {
    // Belt and braces: the plugin option stops RECORD_AUDIO being merged at all,
    // the blocklist catches it if the option is ever renamed or dropped upstream.
    expect(pluginConfig('expo-camera')?.recordAudioAndroid).toBe(false);
  });

  it('does not ask for files and media', () => {
    const blocked = android.blockedPermissions ?? [];
    expect(blocked).toContain('android.permission.READ_EXTERNAL_STORAGE');
    expect(blocked).toContain('android.permission.WRITE_EXTERNAL_STORAGE');
  });
});
