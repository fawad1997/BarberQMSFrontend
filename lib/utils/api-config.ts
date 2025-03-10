// Default API URLs
const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://walk-inonline.com';

// Determine environment
const isProd = process.env.NODE_ENV === 'production';

// Get API URL from environment variable or fallback
export const getApiUrl = () => {
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If we have an environment variable, use it
  if (envApiUrl) {
    // Remove trailing slash if present
    return envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
  }
  
  // Otherwise, fallback based on environment
  return isProd ? PROD_API_URL : DEV_API_URL;
};

// Use this function to get the full API endpoint URL
export const getApiEndpoint = (endpoint: string) => {
  const baseUrl = getApiUrl();
  
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Return the full URL
  return `${baseUrl}/${cleanEndpoint}`;
}; 