/**
 * Convert a blob to an object URL for displaying images
 * @param {Blob} blob - The image blob from the server
 * @returns {string} - Object URL that can be used as src for img tags
 */
export const blobToObjectUrl = (blob) => {
  if (!blob || !(blob instanceof Blob)) {
    return null;
  }
  return URL.createObjectURL(blob);
};

/**
 * Revoke an object URL when the component unmounts or image is no longer needed
 * @param {string} url - The object URL to revoke
 */
export const revokeObjectUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Fetch event thumbnail and convert to object URL
 * @param {string} eventId - The event ID
 * @param {function} getEventThumbnail - The service function to fetch thumbnail
 * @returns {Promise<string>} - Promise that resolves to object URL
 */
export const fetchThumbnailUrl = async (eventId, getEventThumbnail) => {
  try {
    const res = await getEventThumbnail(eventId);
    return blobToObjectUrl(res.data);
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return null;
  }
};

/**
 * Fetch event image and convert to object URL
 * @param {string} eventId - The event ID
 * @param {number} imageIndex - The image index
 * @param {function} getEventImage - The service function to fetch image
 * @returns {Promise<string>} - Promise that resolves to object URL
 */
export const fetchImageUrl = async (eventId, imageIndex, getEventImage) => {
  try {
    const res = await getEventImage(eventId, imageIndex);
    return blobToObjectUrl(res.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};
