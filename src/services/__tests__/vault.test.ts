import nacl from 'tweetnacl';

jest.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: jest.fn(), getRandomBytes: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { _forTests } = require('../vault') as typeof import('../vault');

describe('backup encryption', () => {
  it('turns bytes into text and back without losing any', () => {
    for (const n of [0, 1, 2, 3, 31, 100]) {
      const bytes = new Uint8Array(Array.from({ length: n }, (_, i) => (i * 37 + 11) % 256));
      expect(_forTests.fromB64(_forTests.toB64(bytes))).toEqual(bytes);
    }
  });
  it('opens only with the right key', () => {
    const key = new Uint8Array(32).fill(7);
    const nonce = new Uint8Array(24).fill(1);
    const box = nacl.secretbox(new TextEncoder().encode('{"days":[]}'), nonce, key);
    expect(new TextDecoder().decode(nacl.secretbox.open(box, nonce, key)!)).toBe('{"days":[]}');
    expect(nacl.secretbox.open(box, nonce, new Uint8Array(32).fill(8))).toBeNull();
  });
});
