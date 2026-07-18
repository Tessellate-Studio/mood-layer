// Pairing sheet — connects this install with a circle person's install, like
// following on a social app but with nothing but keys: "Show code" mints an
// invite QR (invite id + this device's public key) and polls until their
// phone claims it; "Scan theirs" reads their QR and claims it here. Either
// way both sides end holding the same pairing + each other's public key —
// no accounts, no addresses (design decided with the user, 2026-07-18).

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import {
  claimInvite,
  createInvite,
  decodeInviteQr,
  encodeInviteQr,
  getKeyPair,
  pollInvite,
  toBase64,
  type PairingCredentials,
} from '@/services/circleRelay';

const POLL_MS = 3000;

interface Props {
  visible: boolean;
  personName: string;
  onPaired(creds: PairingCredentials): void;
  onClose(): void;
}

type Mode = 'show' | 'scan';

export default function PairSheet({ visible, personName, onPaired, onClose }: Props) {
  const [mode, setMode] = React.useState<Mode>('show');
  const [qrValue, setQrValue] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = React.useRef(false);

  // "Show code": mint an invite when the sheet opens, poll while it's up.
  React.useEffect(() => {
    if (!visible || mode !== 'show') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError(null);
    (async () => {
      try {
        const pair = await getKeyPair();
        const myPub = toBase64(pair.publicKey);
        const { invite, token } = await createInvite(myPub);
        if (cancelled) return;
        setQrValue(encodeInviteQr(invite, myPub));
        const poll = async () => {
          try {
            const creds = await pollInvite(invite, token);
            if (cancelled) return;
            if (creds) {
              onPaired(creds);
              return;
            }
          } catch {
            // Transient network trouble — keep polling while the sheet is up.
          }
          if (!cancelled) timer = setTimeout(poll, POLL_MS);
        };
        timer = setTimeout(poll, POLL_MS);
      } catch {
        if (!cancelled) setError('Could not reach the relay — try again in a moment.');
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setQrValue(null);
    };
    // onPaired/onClose are stable enough for the sheet's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode]);

  // "Scan theirs": claim the first valid invite QR the camera sees.
  const handleScan = async (raw: string) => {
    if (scannedRef.current) return;
    const parsed = decodeInviteQr(raw);
    if (!parsed) return; // not our QR — keep scanning
    scannedRef.current = true;
    try {
      const pair = await getKeyPair();
      const creds = await claimInvite(parsed.invite, toBase64(pair.publicKey));
      onPaired(creds);
    } catch {
      setError('That invite did not work — it may be expired or already used.');
      scannedRef.current = false;
    }
  };

  React.useEffect(() => {
    if (!visible) {
      scannedRef.current = false;
      setMode('show');
      setError(null);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close pairing" onPress={onClose} />
        <View style={styles.sheet} onStartShouldSetResponder={() => true} testID="pair-sheet">
          <Text style={typography.heading}>Pair with {personName}&apos;s app</Text>

          <View style={styles.modeRow}>
            <Pressable
              testID="pair-mode-show"
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'show' }}
              style={[styles.modeBtn, mode === 'show' && styles.modeBtnOn]}
              onPress={() => setMode('show')}
            >
              <Text style={styles.modeText}>Show code</Text>
            </Pressable>
            <Pressable
              testID="pair-mode-scan"
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'scan' }}
              style={[styles.modeBtn, mode === 'scan' && styles.modeBtnOn]}
              onPress={() => setMode('scan')}
            >
              <Text style={styles.modeText}>Scan theirs</Text>
            </Pressable>
          </View>

          {mode === 'show' ? (
            <View style={styles.stage}>
              {qrValue ? (
                <>
                  <View style={styles.qrHolder} testID="pair-qr">
                    <QRCode value={qrValue} size={190} color={colors.ink} backgroundColor={colors.paperRaised} />
                  </View>
                  <Text style={styles.hint}>
                    On {personName}&apos;s phone: Circle → their card → Pair → Scan
                    theirs. This code waits 48 hours, once.
                  </Text>
                </>
              ) : (
                <Text style={styles.hint}>{error ?? 'Preparing your code…'}</Text>
              )}
            </View>
          ) : (
            <View style={styles.stage}>
              {permission?.granted ? (
                <View style={styles.cameraHolder}>
                  <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={({ data }) => void handleScan(data)}
                  />
                </View>
              ) : (
                <Pressable
                  testID="pair-camera-permission"
                  accessibilityRole="button"
                  style={styles.permissionBtn}
                  onPress={() => void requestPermission()}
                >
                  <Text style={styles.modeText}>Allow the camera to scan their code</Text>
                </Pressable>
              )}
              {error ? <Text style={styles.hint}>{error}</Text> : null}
            </View>
          )}

          <Pressable testID="pair-close" accessibilityRole="button" style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  modeBtnOn: {
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  modeText: {
    ...typography.label,
  },
  stage: {
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 230,
    justifyContent: 'center',
  },
  qrHolder: {
    padding: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
  },
  cameraHolder: {
    width: 220,
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
  },
  camera: {
    flex: 1,
  },
  permissionBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  closeBtn: {
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...typography.label,
    color: colors.inkSoft,
  },
});
