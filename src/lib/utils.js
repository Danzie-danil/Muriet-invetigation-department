/**
 * Detects phone number patterns in a string and formats them to +255-XXX-XXX-XXX.
 * Patterns detected:
 * - 0xxxxxxxxx (10 digits)
 * - +255xxxxxxxxx (12 digits)
 * - 0xxx-xxx-xxx (with dashes)
 */
export const formatPhoneNumbersInText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Pattern 1 & 2: 0xxxxxxxxx or +255xxxxxxxxx
  // Pattern 3: 0xxx-xxx-xxx or similar with dashes
  
  return text.replace(/(?:\+255|0)(\d{9})\b|(0\d{3}-\d{3}-\d{3})\b/g, (match, p1, p2) => {
    let digits = '';
    if (p1) {
      digits = p1;
    } else if (p2) {
      digits = p2.replace(/\D/g, '').substring(1); // remove leading 0 and dashes
    }
    
    if (digits.length === 9) {
      return `+255-${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6, 9)}`;
    }
    return match;
  });
};

/**
 * Capitalizes the first character of a string and any character following 
 * a sentence-ending period and whitespace.
 */
export const capitalizeSentences = (text) => {
  if (typeof text !== 'string' || text.length === 0) return text;
  
  // Use a regex to find the start of the string or terminal punctuation plus whitespace
  // and capitalize the subsequent letter.
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};

/**
 * Wraps a Promise with a timeout. If the promise doesn't resolve within
 * `ms` milliseconds, it rejects with a timeout error.
 * Use this to prevent Supabase queries from silently hanging forever.
 */
export const withTimeout = (promise, ms = 15000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out. Check your connection.')), ms)
  );
  return Promise.race([promise, timeout]);
};

/**
 * Compresses an image file using the browser Canvas API.
 * Resizes to maxDimension (preserving aspect ratio) and re-encodes as JPEG.
 * @param {File} file - The original image File
 * @param {Object} options
 * @param {number} options.maxDimension - Maximum width or height (default: 1200px)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<File>} A compressed File object
 */
export const compressImage = (file, { maxDimension = 1200, quality = 0.7 } = {}) => {
  return new Promise((resolve, reject) => {
    // Skip if not an image
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Image compression failed'));
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`[COMPRESS] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% savings)`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
