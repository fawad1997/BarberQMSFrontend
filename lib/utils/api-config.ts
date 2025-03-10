// Default API URLs
const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://walk-inonline.com';

// Determine environment
const isProd = process.env.NODE_ENV === 'production';

// Log environment information when module loads
console.log(`API Configuration - Environment: ${isProd ? 'Production' : 'Development'}`);
console.log(`API Configuration - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`API Configuration - NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Test API connectivity
export const testApiConnection = async (): Promise<{success: boolean; message: string}> => {
  const baseUrl = getApiUrl();
  
  try {
    // Try a simple HEAD request to check if the API is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId);
    
    return {
      success: response.ok,
      message: response.ok 
        ? `API connection successful (${response.status})` 
        : `API connection failed with status: ${response.status}`
    };
  } catch (error) {
    console.error('API connectivity test failed:', error);
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for specific network errors
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timed out';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network request failed - API server may be unreachable';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch - CORS issue or server unreachable';
      }
    }
    
    return {
      success: false,
      message: `API connection failed: ${errorMessage}. API URL: ${baseUrl}`
    };
  }
};

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

// This function is no longer needed as we're using the correct API URL
export const getAlternativeApiUrl = () => {
  // We're not using any alternative URL anymore
  return getApiUrl();
};

// Use this function to get the full API endpoint URL
export const getApiEndpoint = (endpoint: string) => {
  const baseUrl = getApiUrl();
  
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Build the full URL
  const fullUrl = `${baseUrl}/${cleanEndpoint}`;
  
  // Log the constructed URL
  console.log(`API Request: ${fullUrl}`);
  
  // Return the full URL
  return fullUrl;
}; 