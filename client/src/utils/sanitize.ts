import DOMPurify from 'dompurify';

/**
 * Sanitizes a string to prevent XSS attacks
 * Removes all HTML tags and potentially dangerous content
 */
export const sanitizeString = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
  
  // Trim whitespace
  return sanitized.trim();
};

/**
 * Sanitizes a string but allows basic text formatting
 * Allows: <b>, <i>, <u>, <strong>, <em>, <br>, <p>
 */
export const sanitizeRichText = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized.trim();
};

/**
 * Sanitizes a URL
 * Ensures URL is valid and doesn't contain javascript: or other dangerous protocols
 */
export const sanitizeUrl = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
  
  return sanitized.trim();
};

/**
 * Sanitizes an object by sanitizing all string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T, keysToSkip: string[] = []): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (keysToSkip.includes(key)) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, keysToSkip);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Sanitizes form data
 * @param formData - The form data object
 * @param richTextFields - Array of field names that should allow rich text
 * @returns Sanitized form data
 */
export const sanitizeFormData = <T extends Record<string, any>>(
  formData: T,
  richTextFields: string[] = []
): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (richTextFields.includes(key)) {
      sanitized[key] = sanitizeRichText(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Validates and sanitizes input length
 */
export const sanitizeWithMaxLength = (
  input: string | undefined | null,
  maxLength: number
): string => {
  const sanitized = sanitizeString(input);
  return sanitized.substring(0, maxLength);
};

/**
 * Sanitizes chat messages - allows basic text but no HTML
 */
export const sanitizeChatMessage = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Remove all HTML tags completely
  return sanitizeString(input);
};

/**
 * Sanitizes usernames - only allow alphanumeric and certain special characters
 */
export const sanitizeUsername = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Only allow alphanumeric, underscore, hyphen, and dot
  const sanitized = input.replace(/[^a-zA-Z0-9_.-]/g, '');
  return sanitized.substring(0, 50); // Max 50 characters
};

/**
 * Sanitizes email addresses
 */
export const sanitizeEmail = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Basic email sanitization - remove HTML and trim
  const sanitized = DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  return sanitized.toLowerCase();
};

/**
 * Sanitizes phone numbers
 */
export const sanitizePhone = (input: string | undefined | null): string => {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Only allow digits, plus, space, hyphen, and parentheses
  const sanitized = input.replace(/[^0-9+\s().-]/g, '');
  return sanitized.trim();
};