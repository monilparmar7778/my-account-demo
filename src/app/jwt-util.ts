// src/app/auth/jwt-util.ts

// Function to parse JWT token
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
}

// Function to check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

// Function to get token expiration date
export function getTokenExpiration(token: string): Date | null {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
}

// Function to get user data from token
export function getUserFromToken(token: string): any {
  const decoded = parseJwt(token);
  if (!decoded) return null;
  
  return {
    user_id: decoded.user_id,
    username: decoded.username,
    sub: decoded.sub
  };
}