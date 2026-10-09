import { parseQRCode } from './qrParser';

describe('QR Parser Utility', () => {
  it('should parse custom scheme queueless://join/TOKEN', () => {
    const result = parseQRCode('queueless://join/QR-AIRPORT-01');
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('QR-AIRPORT-01');
    expect(result.scheme).toBe('custom');
  });

  it('should parse web URLs https://queueless.app/join/TOKEN', () => {
    const result = parseQRCode('https://queueless.app/join/QR-KUMASI-99');
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('QR-KUMASI-99');
    expect(result.scheme).toBe('web');
  });

  it('should parse raw branch/service alphanumeric tokens', () => {
    const result = parseQRCode('QR-AIRPORT-CITY');
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('QR-AIRPORT-CITY');
    expect(result.scheme).toBe('raw');
  });

  it('should handle invalid or empty strings gracefully', () => {
    expect(parseQRCode('').isValid).toBe(false);
    expect(parseQRCode('invalid token with spaces').isValid).toBe(false);
  });
});
