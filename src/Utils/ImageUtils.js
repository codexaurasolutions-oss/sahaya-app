/**
 * Image Utilities
 * 
 * Helper functions for handling images and placeholders.
 */

/**
 * Checks if a given image URL or path is a placeholder/default image.
 * 
 * @param {string} url - The image URL or path to check
 * @returns {boolean} True if it's a placeholder, false otherwise
 */
export const isPlaceholderImage = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') {
    return true;
  }

  const lowerUrl = url.toLowerCase();
  // Only consider explicit "no image" strings as placeholders
  return (
    lowerUrl.includes('noimage') ||
    lowerUrl.includes('no_image') ||
    lowerUrl.includes('no-image')
  );
};

/**
 * Returns a valid image source object or null if it's a placeholder.
 * 
 * @param {string} url - The image URL or path
 * @returns {object|null} {uri: string} or null
 */
export const getImageSource = (url) => {
  if (isPlaceholderImage(url)) {
    return null;
  }
  return { uri: url };
};

export default {
  isPlaceholderImage,
  getImageSource,
};
