/**
 * Utility for parsing QueueLess QR codes and deep-link URLs.
 * Handles custom schemes (queueless://join/TOKEN), web URLs (https://.../join/TOKEN),
 * and raw tokens.
 */
export interface ParsedQR {
  isValid: boolean;
  token: string | null;
  raw: string;
  scheme: 'custom' | 'web' | 'raw' | 'invalid';
}

export function parseQRCode(data: string): ParsedQR {
  if (!data || typeof data !== 'string') {
    return { isValid: false, token: null, raw: '', scheme: 'invalid' };
  }

  const trimmed = data.trim();

  // 1. Custom Scheme: queueless://join/TOKEN or queueless://TOKEN
  if (trimmed.startsWith('queueless://')) {
    let clean = trimmed.replace('queueless://join/', '').replace('queueless://', '');
    clean = clean.split('?')[0].split('/')[0];
    if (clean.length > 0) {
      return { isValid: true, token: clean, raw: trimmed, scheme: 'custom' };
    }
  }

  // 2. Web URL: https://queueless.app/join/TOKEN or similar domain
  if (trimmed.includes('/join/')) {
    const parts = trimmed.split('/join/');
    const tokenPart = parts[1]?.split('?')[0].split('/')[0];
    if (tokenPart && tokenPart.length > 0) {
      return { isValid: true, token: tokenPart, raw: trimmed, scheme: 'web' };
    }
  }

  // 3. Raw Token (e.g. UUID, QR-ACCRA-001, or alphanumeric token)
  // Check if string looks like an identifier without whitespace
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(trimmed)) {
    return { isValid: true, token: trimmed, raw: trimmed, scheme: 'raw' };
  }

  return { isValid: false, token: null, raw: trimmed, scheme: 'invalid' };
}
