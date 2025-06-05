/**
 * QR Code utility functions for generating shop QR codes
 */

export interface QRCodeOptions {
  size?: number;
  format?: 'png' | 'svg';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: string;
  bgcolor?: string;
}

/**
 * Generate QR code URL for a shop using QR Server API
 */
export const generateShopQRCodeURL = (
  shopUsername: string, 
  options: QRCodeOptions = {}
): string => {
  const {
    size = 250,
    format = 'png',
    errorCorrectionLevel = 'M',
    margin = 0,
    color = '000000',
    bgcolor = 'ffffff'
  } = options;

  // Construct the shop URL (always use current username)
  const shopUrl = `${window.location.origin}/salons/${shopUsername}`;
  
  // Build QR Server API URL
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: shopUrl,
    format,
    ecc: errorCorrectionLevel,
    margin: margin.toString(),
    color,
    bgcolor
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
};

/**
 * Download QR code as image file
 */
export const downloadQRCode = async (
  shopUsername: string, 
  shopName: string,
  options: QRCodeOptions = {}
): Promise<void> => {
  try {
    const qrUrl = generateShopQRCodeURL(shopUsername, { ...options, size: 512 });
    
    // Fetch the image
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${shopName.replace(/[^a-zA-Z0-9]/g, '-')}-qr-code.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error('Failed to download QR code. Please try again.');
  }
};

/**
 * Copy shop URL to clipboard
 */
export const copyShopURL = async (shopUsername: string): Promise<void> => {
  const shopUrl = `${window.location.origin}/salons/${shopUsername}`;
  
  try {
    await navigator.clipboard.writeText(shopUrl);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shopUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

/**
 * Validate if QR code can be generated (basic checks)
 */
export const validateQRCodeGeneration = (shopUsername: string): boolean => {
  return !!(shopUsername && shopUsername.trim().length > 0);
};
