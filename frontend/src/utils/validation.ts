/**
 * Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate required fields
 */
export const validateRequired = (fields: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {};
  
  Object.keys(fields).forEach((key) => {
    const value = fields[key];
    if (value === null || value === undefined || value === '') {
      errors[key] = `${key} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  }
  if (!/\d/.test(password)) {
    errors.password = 'Password must contain at least one number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
