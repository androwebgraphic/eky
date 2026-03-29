/**
 * Centralized API URL utility
 * Ensures consistent protocol usage (HTTP in dev, HTTPS in production)
 */

export const getApiUrl = (): string => {
  // Use environment variable if set (e.g., Render production URL)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're on Render production
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Known production backend URLs - add your Render backend URL here
  if (hostname.includes('onrender.com') || hostname.includes('render.com')) {
    // Try to extract the service name from frontend URL and construct backend URL
    // If frontend is sharedog-abc.onrender.com, backend should be sharedog-backend-abc.onrender.com
    if (hostname.includes('sharedog')) {
      return 'https://sharedog-backend-o8ta.onrender.com';
    }
    // Fallback for other Render apps
    return 'https://sharedog-backend-o8ta.onrender.com';
  }
  
  // Dynamically construct URL based on current protocol for local development
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  
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
