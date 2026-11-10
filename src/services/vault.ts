import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';
import nacl from 'tweetnacl';

import { cleanCode, type Vault } from '../core/sync';

/**
 * End to end encryption for the backup. The family code makes two different hashes: one is the address the
 * server files the backup under, the other is the key that locks it. Only the address is ever sent.
 */
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
export const vaultAvailable = URL !== '' && KEY !== '';

const hex = (h: string) => new Uint8Array(h.match(/../g)!.map((b) => parseInt(b, 16)));
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return s;
}
function fromB64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].reduce((acc, j) => (acc << 6) | (i + j < clean.length ? B64.indexOf(clean[i + j]) : 0), 0);
    out.push((n >> 16) & 255);
    if (i + 2 < clean.length) out.push((n >> 8) & 255);
    if (i + 3 < clean.length) out.push(n & 255);
  }
  return new Uint8Array(out);
}

async function keysFor(code: string) {
  const c = cleanCode(code);
  const [id, key] = await Promise.all([
    digestStringAsync(CryptoDigestAlgorithm.SHA256, `moonday address:${c}`),
    digestStringAsync(CryptoDigestAlgorithm.SHA256, `moonday key:${c}`),
  ]);
  return { id, key: hex(key) };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${name} ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** The family's backup, decrypted, or null when there is none yet. Throws when it can't be reached. */
export async function fetchVault(code: string): Promise<Vault | null> {
  const { id, key } = await keysFor(code);
  const r = await rpc<{ box: string; nonce: string } | null>('moonday_get', { vault: id });
  if (!r) return null;
  const opened = nacl.secretbox.open(fromB64(r.box), fromB64(r.nonce), key);
  if (!opened) throw new Error('could not decrypt');
  return JSON.parse(new TextDecoder().decode(opened)) as Vault;
}

/** Encrypts and sends the backup. */
export async function storeVault(code: string, v: Vault): Promise<void> {
  const { id, key } = await keysFor(code);
  const nonce = getRandomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(new TextEncoder().encode(JSON.stringify(v)), nonce, key);
  await rpc('moonday_put', { vault: id, box: toB64(box), nonce: toB64(nonce), shared_at: v.sharedAt });
}

export async function deleteVault(code: string): Promise<boolean> {
  const { id } = await keysFor(code);
  return rpc<boolean>('moonday_delete', { vault: id });
}

export const newCodeBytes = () => getRandomBytes(16);
export const _forTests = { toB64, fromB64 };
