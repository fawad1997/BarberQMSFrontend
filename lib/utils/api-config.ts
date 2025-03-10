// Default API URLs
const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://walk-inonline.com';

// Determine environment
const isProd = process.env.NODE_ENV === 'production';

// Log environment information when module loads
console.log(`API Configuration - Environment: ${isProd ? 'Production' : 'Development'}`);
console.log(`API Configuration - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`API Configuration - NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Get API URL from environment variable or fallback
export const getApiUrl = () => {
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If we have an environment variable, use it
  if (envApiUrl) {
    // Remove trailing slash if present
    const normalizedUrl = envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
    console.log(`Using API URL from env: ${normalizedUrl}`);
    return normalizedUrl;
  }
  
  // Otherwise, fallback based on environment
  const fallbackUrl = isProd ? PROD_API_URL : DEV_API_URL;
  console.log(`Using fallback API URL: ${fallbackUrl}`);
  return fallbackUrl;
};

// Use this function to get the full API endpoint URL
export const getApiEndpoint = (endpoint: string) => {
  const baseUrl = getApiUrl();
  
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Build the full URL
  const fullUrl = `${baseUrl}/${cleanEndpoint}`;
  
  // Log the constructed URL (only in development)
  if (typeof window !== 'undefined' && !isProd) {
    console.log(`API Request: ${fullUrl}`);
  }
  
  // Return the full URL
  return fullUrl;
}; 