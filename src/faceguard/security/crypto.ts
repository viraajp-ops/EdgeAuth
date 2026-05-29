import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'faceguard-local-encryption-key';

export async function getOrCreateDeviceKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) {
    return existing;
  }

  const seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  const key = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, seed);
  await SecureStore.setItemAsync(KEY_NAME, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
  return key;
}

export async function encryptJson(payload: unknown): Promise<string> {
  const key = await getOrCreateDeviceKey();
  const plain = JSON.stringify(payload);
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${key}:${plain}`
  );
  return JSON.stringify({
    alg: 'DEVICE-KEY-XOR-PROTOTYPE',
    digest,
    payload: xorToHex(plain, key)
  });
}

export async function decryptJson<T>(encryptedPayload: string): Promise<T> {
  const key = await getOrCreateDeviceKey();
  const envelope = JSON.parse(encryptedPayload) as { payload: string };
  return JSON.parse(xorFromHex(envelope.payload, key)) as T;
}

function xorToHex(value: string, key: string): string {
  return Array.from(value)
    .map((char, index) => {
      const code = char.charCodeAt(0) ^ key.charCodeAt(index % key.length);
      return code.toString(16).padStart(4, '0');
    })
    .join('');
}

function xorFromHex(value: string, key: string): string {
  const chars = value.match(/.{1,4}/g) ?? [];
  return chars
    .map((part, index) => {
      const code = Number.parseInt(part, 16) ^ key.charCodeAt(index % key.length);
      return String.fromCharCode(code);
    })
    .join('');
}
