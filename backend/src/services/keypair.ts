import { generateKeyPairSync, privateDecrypt, constants } from "crypto";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

export function getPublicKeyPem(): string {
  return publicKey;
}

export function decryptWithPrivateKey(base64Ciphertext: string): string {
  const buffer = Buffer.from(base64Ciphertext, "base64");
  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return decrypted.toString("utf8");
}
