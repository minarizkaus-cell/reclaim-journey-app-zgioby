/**
 * Validates password against required rules
 * - Minimum 8 characters
 * - Only letters and numbers (a-z, A-Z, 0-9)
 * - Must include at least 1 uppercase letter
 * - Must include at least 1 lowercase letter
 * - Must include at least 1 number
 * - NO spaces, NO special characters
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for valid characters (letters and numbers only)
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    errors.push('Password must contain only letters and numbers (no spaces or special characters)');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least 1 uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least 1 lowercase letter');
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least 1 number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
