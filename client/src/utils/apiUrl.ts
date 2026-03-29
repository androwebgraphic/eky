/**
 * Centralized API URL utility
 * Ensures consistent protocol usage (HTTP in dev, HTTPS in production)
 */

export const getApiUrl = (): string => {
  // Use environment variable if set (e.g., Render production URL)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Dynamically construct URL based on current protocol
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  return `${protocol}//${hostname}:3001`;
};

/**
 * Get API URL without port (for image URLs)
 */
export const getApiBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    const url = process.env.REACT_APP_API_URL;
    // Remove port if present
    return url.replace(/:\d+$/, '');
  }
  
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  return `${protocol}//${hostname}`;
};// Force rebuild Sun Mar 29 01:36:06 CET 2026
export const BUILD_TIMESTAMP = 1774744861;
