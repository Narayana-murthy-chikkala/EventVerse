const cloudinary = require('../config/cloudinary');

/**
 * Check if Cloudinary is properly configured with real credentials
 */
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
  );
};

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g., 'eventverse/events')
 * @param {string} options.publicId - Optional custom public_id
 * @param {string} options.transformation - Optional transformation string
 * @returns {object} { url, publicId } or { url (data URI), publicId: null } in fallback mode
 */
const uploadImage = async (buffer, options = {}) => {
  const {
    folder = 'eventverse/events',
    publicId = null,
    transformation = null,
  } = options;

  // Fallback: convert to base64 data URI if Cloudinary isn't configured
  if (!isCloudinaryConfigured()) {
    console.log('[CloudinaryService] Not configured — using base64 data URI fallback');
    const base64 = buffer.toString('base64');
    return {
      url: `data:image/jpeg;base64,${base64}`,
      publicId: null,
      fallback: true,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[CloudinaryService] Upload failed:', error.message);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          fallback: false,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload a thumbnail (with automatic optimization/resizing)
 * @param {Buffer} buffer - Image buffer
 * @param {string} eventId - Event ID for naming
 * @returns {object} { url, publicId }
 */
const uploadThumbnail = async (buffer, eventId = '') => {
  return uploadImage(buffer, {
    folder: 'eventverse/thumbnails',
    publicId: eventId ? `thumb_${eventId}_${Date.now()}` : null,
    transformation: [
      { width: 800, height: 600, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload a user avatar
 * @param {Buffer} buffer - Image buffer
 * @param {string} userId - User ID for naming
 * @returns {object} { url, publicId }
 */
const uploadAvatar = async (buffer, userId = '') => {
  return uploadImage(buffer, {
    folder: 'eventverse/avatars',
    publicId: userId ? `avatar_${userId}` : null,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public_id of the image
 * @returns {object} Deletion result
 */
const deleteImage = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) {
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('[CloudinaryService] Delete failed:', error.message);
    return { result: 'error', error: error.message };
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public_ids
 * @returns {object} Deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  if (!isCloudinaryConfigured() || !publicIds || publicIds.length === 0) {
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('[CloudinaryService] Bulk delete failed:', error.message);
    return { result: 'error', error: error.message };
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadImage,
  uploadThumbnail,
  uploadAvatar,
  deleteImage,
  deleteMultipleImages,
};
