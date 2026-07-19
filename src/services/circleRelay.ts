// Circle relay client — the app side of peer-to-peer weekly sharing.
// PRIVACY CONTRACT (docs/SECURITY.md → "Circle relay"): the summary is
// encrypted ON THIS DEVICE with nacl.box to the recipient's public key
// before anything leaves the phone; the relay (Supabase edge function
// `moodlayer-relay`) stores only opaque blobs and deletes them on delivery.
// This is the app's ONE sanctioned exception to local-only (user-decided
// 2026-07-18): what transits is the same gated summary "Share this week"
// hands to the OS share sheet — never check-ins, notes, or reflections.
//
// Identity is a device keypair in the OS secure store — no accounts. A
// pairing is created by a QR/link invite handshake; each side holds a
// relay-minted bearer token for its half of the pairing.

import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';

import { getRandomBytes } from 'expo-crypto';

// tweetnacl needs a PRNG in React Native (no window.crypto) — expo-crypto's
// native randomness feeds it. Must run before any keypair/nonce generation.
nacl.setPRNG((out: Uint8Array, n: number) => {
  out.set(getRandomBytes(n));
});

/** The deployed relay endpoint (alate Supabase project, `moodlayer-relay`).
 *  Not a secret — auth is the per-pairing bearer token, not the URL. */
export const RELAY_URL =
  'https://ancuwmmivgdvommzigwv.supabase.co/functions/v1/moodlayer-relay';

const SECRET_KEY_STORE = 'tml-circle-secret-key';

// ── base64 helpers (no Buffer in RN) ────────────────────────────────────
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_CHARS[a >> 2] + B64_CHARS[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64_CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_CHARS[c & 63] : '=';
  }
  return out;
}

export function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const value = B64_CHARS.indexOf(ch);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

// ── device identity ─────────────────────────────────────────────────────

/** This device's keypair. Created once, secret key lives in the OS secure
 *  store and never leaves it; the public key is what a QR shares. */
export async function getKeyPair(): Promise<nacl.BoxKeyPair> {
  const stored = await SecureStore.getItemAsync(SECRET_KEY_STORE);
  if (stored) {
    return nacl.box.keyPair.fromSecretKey(fromBase64(stored));
  }
  const pair = nacl.box.keyPair();
  await SecureStore.setItemAsync(SECRET_KEY_STORE, toBase64(pair.secretKey));
  return pair;
}

// ── envelope crypto ─────────────────────────────────────────────────────

export interface SealedBox {
  nonce: string;
  box: string;
}

/** Seal a summary for the peer: nacl.box(plain, nonce, theirPub, mySecret). */
export function seal(plain: string, peerPubB64: string, mySecret: Uint8Array): SealedBox {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = new TextEncoder().encode(plain);
  const box = nacl.box(message, nonce, fromBase64(peerPubB64), mySecret);
  return { nonce: toBase64(nonce), box: toBase64(box) };
}

/** Open a sealed summary from the peer. Null when tampered or mis-keyed. */
export function open(sealed: SealedBox, peerPubB64: string, mySecret: Uint8Array): string | null {
  const plain = nacl.box.open(
    fromBase64(sealed.box),
    fromBase64(sealed.nonce),
    fromBase64(peerPubB64),
    mySecret
  );
  return plain ? new TextDecoder().decode(plain) : null;
}

// ── relay calls ─────────────────────────────────────────────────────────

export interface PairingCredentials {
  pairingId: string;
  side: 'a' | 'b';
  token: string;
  peerPub: string;
}

async function relay<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `relay ${response.status}`);
  return body;
}

/** Mint an invite; the QR carries {invite id, my public key}. */
export async function createInvite(myPub: string): Promise<{ invite: string; token: string }> {
  return relay({ action: 'invite', pub: myPub });
}

/** Scan side: claim an invite, receiving my half of the pairing. */
export async function claimInvite(invite: string, myPub: string): Promise<PairingCredentials> {
  const r = await relay<{ pairing: string; side: 'b'; token: string; peerPub: string }>({
    action: 'claim',
    invite,
    pub: myPub,
  });
  return { pairingId: r.pairing, side: r.side, token: r.token, peerPub: r.peerPub };
}

/** Invite side: poll until claimed; returns my half once, or null while open. */
export async function pollInvite(
  invite: string,
  token: string
): Promise<PairingCredentials | null> {
  const r = await relay<{
    claimed: boolean;
    pairing?: string;
    side?: 'a';
    token?: string;
    peerPub?: string;
  }>({ action: 'invite-status', invite, token });
  if (!r.claimed) return null;
  return { pairingId: r.pairing!, side: r.side!, token: r.token!, peerPub: r.peerPub! };
}

/** Send one sealed summary to the peer. */
export async function sendSealed(creds: PairingCredentials, sealed: SealedBox): Promise<void> {
  await relay({ action: 'send', pairing: creds.pairingId, token: creds.token, ...sealed });
}

/** Fetch (and thereby delete from the relay) everything pending for me. */
export async function fetchSealed(
  creds: PairingCredentials
): Promise<{ nonce: string; box: string; sentAt: string }[]> {
  const r = await relay<{ messages: { nonce: string; box: string; sentAt: string }[] }>({
    action: 'fetch',
    pairing: creds.pairingId,
    token: creds.token,
  });
  return r.messages;
}

/** Sever a pairing on the relay (either side may). */
export async function unpair(creds: PairingCredentials): Promise<void> {
  await relay({ action: 'unpair', pairing: creds.pairingId, token: creds.token });
}

// ── QR payload ──────────────────────────────────────────────────────────

export interface InviteQr {
  v: 1;
  invite: string;
  pub: string;
}

export function encodeInviteQr(invite: string, pub: string): string {
  return JSON.stringify({ v: 1, invite, pub } satisfies InviteQr);
}

export function decodeInviteQr(raw: string): InviteQr | null {
  try {
    const parsed = JSON.parse(raw) as InviteQr;
    if (parsed.v !== 1 || typeof parsed.invite !== 'string' || typeof parsed.pub !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
