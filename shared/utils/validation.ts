/**
 * Form validation utilities
 */

export const validation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword(password: string): boolean {
    // At least 8 characters
    return password.length >= 8;
  },

  isValidFullName(name: string): boolean {
    // At least 2 characters, only letters and spaces
    return name.trim().length >= 2;
  },

  getEmailError(email: string): string | null {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!this.isValidEmail(email)) {
      return 'Please enter a valid email';
    }
    return null;
  },

  getPasswordError(password: string): string | null {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  },

  getFullNameError(name: string): string | null {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    return null;
  },
};
