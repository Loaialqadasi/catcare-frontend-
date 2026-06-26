/** Password requirements: min 8 chars + at least one special character */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/;
export const PASSWORD_SPECIAL_CHAR_MESSAGE = 'Password must contain at least one special character (!@#$%^&*...)';

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, error: PASSWORD_SPECIAL_CHAR_MESSAGE };
  }
  return { valid: true };
}

export function validatePasswordMatch(password: string, confirmPassword: string): { valid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}
