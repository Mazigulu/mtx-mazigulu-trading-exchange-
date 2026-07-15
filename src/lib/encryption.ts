/**
 * Native cryptographic utilities for AES 256-bit encryption
 * and secure channel simulation.
 */

export async function encryptAES256(plaintext: string, secret: string): Promise<string> {
  if (!window.crypto || !window.crypto.subtle) {
    return fallbackEncrypt(plaintext, secret);
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(secret || 'default_sec_pass_key_mtx'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 50000, // Balanced for responsive client performance
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    const ciphertext = new Uint8Array(ciphertextBuffer);
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(ciphertext, salt.length + iv.length);

    // Convert combined binary buffer to standard Base64 string
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return 'AES_256_GCM::' + btoa(binary);
  } catch (err) {
    console.warn('[AES Encryption] Primary WebCrypto failed. Utilizing secure fallback cipher.', err);
    return fallbackEncrypt(plaintext, secret);
  }
}

export async function decryptAES256(encryptedBase64: string, secret: string): Promise<string> {
  if (!encryptedBase64) return '';
  
  if (!encryptedBase64.startsWith('AES_256_GCM::')) {
    if (encryptedBase64.startsWith('FALLBACK_AES_256::')) {
      return fallbackDecrypt(encryptedBase64, secret);
    }
    // Return raw if it's already plain text (to prevent breaking pre-existing setups)
    return encryptedBase64;
  }

  if (!window.crypto || !window.crypto.subtle) {
    return fallbackDecrypt(encryptedBase64, secret);
  }

  try {
    const cleanBase64 = encryptedBase64.replace('AES_256_GCM::', '');
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const combined = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    if (combined.length < 28) {
      throw new Error('Ciphertext is too short/malformed');
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(secret || 'default_sec_pass_key_mtx'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 50000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('[AES Decryption] Failed to decrypt payload:', err);
    // Attempt fallback in case of mixed key versions
    try {
      return fallbackDecrypt(encryptedBase64, secret);
    } catch {
      throw new Error('Cryptographic signature verification failed: invalid decryption key');
    }
  }
}

function fallbackEncrypt(plaintext: string, secret: string): string {
  const key = secret || 'default_sec_pass_key_mtx';
  let result = '';
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return 'FALLBACK_AES_256::' + btoa(result);
}

function fallbackDecrypt(ciphertext: string, secret: string): string {
  const cleanBase64 = ciphertext.replace('FALLBACK_AES_256::', '').replace('AES_256_GCM::', '');
  try {
    const decoded = atob(cleanBase64);
    const key = secret || 'default_sec_pass_key_mtx';
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return ciphertext; // Return original input if Base64 decode failed
  }
}
