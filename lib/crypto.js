import * as ed from '@noble/ed25519';
import canonicalize from 'canonicalize';

if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

export async function generateKeyPair() {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex')
  };
}

export async function computeKeyId(publicKeyHex: string): Promise<string> {
  const pubBytes = Buffer.from(publicKeyHex, 'hex');
  const hashBuffer = await crypto.subtle.digest('SHA-256', pubBytes);
  const hashHex = Buffer.from(hashBuffer).toString('hex');
  return `key_${hashHex.substring(0, 16)}`;
}

export function toCanonicalString(obj: any): string {
  const standardized = JSON.parse(JSON.stringify(obj, (_, v) => {
    if (typeof v === 'number') return Math.floor(v);
    return v;
  }));
  return canonicalize(standardized) || '';
}

export async function signPayload(obj: any, privateKeyHex: string): Promise<string> {
  const message = toCanonicalString(obj);
  const msgBytes = new TextEncoder().encode(message);
  const sigBytes = await ed.signAsync(msgBytes, privateKeyHex);
  return Buffer.from(sigBytes).toString('base64url');
}

export async function verifySignature(obj: any, signatureBase64Url: string, publicKeyHex: string): Promise<boolean> {
  try {
    const message = toCanonicalString(obj);
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Buffer.from(signatureBase64Url, 'base64url');
    const pubBytes = Buffer.from(publicKeyHex, 'hex');
    return await ed.verifyAsync(sigBytes, msgBytes, pubBytes);
  } catch (e) {
    return false;
  }
}
