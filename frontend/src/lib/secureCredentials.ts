import type { AwsCredentials } from "./useFinOpsChat";

const BACKEND_URL = "http://localhost:3001";

let cachedPublicKey: CryptoKey | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;

  const response = await fetch(`${BACKEND_URL}/api/public-key`);
  const { publicKey: pem } = await response.json();

  cachedPublicKey = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  return cachedPublicKey;
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * Encrypts AWS credentials with the backend's RSA public key.
 * Only the backend's private key (held server-side) can decrypt this.
 */
export async function encryptCredentials(credentials: AwsCredentials): Promise<string> {
  const publicKey = await getPublicKey();
  const encoded = new TextEncoder().encode(JSON.stringify(credentials));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );

  return bufToBase64(ciphertext);
}
