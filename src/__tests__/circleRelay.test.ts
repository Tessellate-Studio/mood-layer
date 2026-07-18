// Circle relay client — the privacy-bearing seams, tested exactly: the
// envelope crypto round-trips (and refuses tampering), the QR payload
// survives encode/decode, keypairs persist through the secure store, and the
// relay client speaks the deployed function's protocol.

import nacl from 'tweetnacl';

import {
  claimInvite,
  createInvite,
  decodeInviteQr,
  encodeInviteQr,
  fetchSealed,
  fromBase64,
  getKeyPair,
  open,
  pollInvite,
  seal,
  sendSealed,
  toBase64,
  RELAY_URL,
} from '@/services/circleRelay';

describe('base64 helpers', () => {
  it('round-trips arbitrary bytes, including padding cases', () => {
    for (const len of [0, 1, 2, 3, 24, 32, 57]) {
      const bytes = new Uint8Array(Array.from({ length: len }, (_, i) => (i * 37 + 5) % 256));
      expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    }
  });
});

describe('envelope crypto', () => {
  it('seals for the peer and opens on the other side', () => {
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const sealed = seal('Mostly tender and bracing.', toBase64(bob.publicKey), alice.secretKey);
    // Bob opens with Alice's public key.
    expect(open(sealed, toBase64(alice.publicKey), bob.secretKey)).toBe(
      'Mostly tender and bracing.'
    );
  });

  it('refuses a tampered box and a wrong key', () => {
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const eve = nacl.box.keyPair();
    const sealed = seal('private', toBase64(bob.publicKey), alice.secretKey);
    const tampered = { ...sealed, box: sealed.box.slice(0, -4) + 'AAAA' };
    expect(open(tampered, toBase64(alice.publicKey), bob.secretKey)).toBeNull();
    // Eve holds the ciphertext but not Bob's secret.
    expect(open(sealed, toBase64(alice.publicKey), eve.secretKey)).toBeNull();
  });
});

describe('getKeyPair', () => {
  it('mints once and returns the SAME keypair afterwards (secure store)', async () => {
    const first = await getKeyPair();
    const second = await getKeyPair();
    expect(toBase64(second.publicKey)).toBe(toBase64(first.publicKey));
  });
});

describe('invite QR payload', () => {
  it('round-trips and rejects foreign QR content', () => {
    const encoded = encodeInviteQr('a-uuid', 'a-pub-key');
    expect(decodeInviteQr(encoded)).toEqual({ v: 1, invite: 'a-uuid', pub: 'a-pub-key' });
    expect(decodeInviteQr('https://example.com/some-random-qr')).toBeNull();
    expect(decodeInviteQr('{"v":2,"invite":"x","pub":"y"}')).toBeNull();
  });
});

describe('relay client protocol', () => {
  const mockFetch = jest.fn();
  const reply = (body: unknown, status = 200) =>
    mockFetch.mockResolvedValueOnce({
      ok: status < 400,
      status,
      json: async () => body,
    });

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('walks invite → poll → send → fetch with the deployed protocol shapes', async () => {
    reply({ invite: 'inv-1', token: 'tok-inviter' });
    const invite = await createInvite('PUB_A');
    expect(mockFetch).toHaveBeenLastCalledWith(
      RELAY_URL,
      expect.objectContaining({
        body: JSON.stringify({ action: 'invite', pub: 'PUB_A' }),
      })
    );
    expect(invite).toEqual({ invite: 'inv-1', token: 'tok-inviter' });

    reply({ claimed: false });
    expect(await pollInvite('inv-1', 'tok-inviter')).toBeNull();

    reply({ claimed: true, pairing: 'pair-1', side: 'a', token: 'tok-a', peerPub: 'PUB_B' });
    const creds = await pollInvite('inv-1', 'tok-inviter');
    expect(creds).toEqual({ pairingId: 'pair-1', side: 'a', token: 'tok-a', peerPub: 'PUB_B' });

    reply({ sent: true });
    await sendSealed(creds!, { nonce: 'n', box: 'b' });
    expect(JSON.parse(mockFetch.mock.calls.at(-1)![1].body)).toEqual({
      action: 'send',
      pairing: 'pair-1',
      token: 'tok-a',
      nonce: 'n',
      box: 'b',
    });

    reply({ messages: [{ nonce: 'n', box: 'b', sentAt: '2026-07-18T10:00:00Z' }] });
    expect(await fetchSealed(creds!)).toEqual([
      { nonce: 'n', box: 'b', sentAt: '2026-07-18T10:00:00Z' },
    ]);
  });

  it('claim returns side b with the inviter as peer', async () => {
    reply({ pairing: 'pair-2', side: 'b', token: 'tok-b', peerPub: 'PUB_A' });
    expect(await claimInvite('inv-2', 'PUB_B')).toEqual({
      pairingId: 'pair-2',
      side: 'b',
      token: 'tok-b',
      peerPub: 'PUB_A',
    });
  });

  it('surfaces relay errors as thrown errors', async () => {
    reply({ error: 'invite already claimed' }, 409);
    await expect(claimInvite('inv-3', 'PUB_C')).rejects.toThrow('invite already claimed');
  });
});
