const SALT = 'hyblock2022';

export function encodeEvent(eventName: string): string {
  // Simple Base64 encoding with salt to make it non-obvious in the URL
  const str = `${SALT}:${eventName}`;
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str).toString('base64');
}

export function decodeEvent(encoded: string): string | null {
  try {
    let decoded = '';
    if (typeof window !== 'undefined') {
      decoded = decodeURIComponent(escape(atob(encoded)));
    } else {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    }
    
    if (decoded.startsWith(`${SALT}:`)) {
      return decoded.replace(`${SALT}:`, '');
    }
    return null;
  } catch (e) {
    return null;
  }
}
