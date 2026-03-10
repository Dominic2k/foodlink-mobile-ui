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
      return 'Vui lòng nhập email';
    }
    if (!this.isValidEmail(email)) {
      return 'Email không hợp lệ';
    }
    return null;
  },

  getPasswordError(password: string): string | null {
    if (!password) {
      return 'Vui lòng nhập mật khẩu';
    }
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    return null;
  },

  getFullNameError(name: string): string | null {
    if (!name.trim()) {
      return 'Vui lòng nhập họ và tên';
    }
    if (name.trim().length < 2) {
      return 'Họ và tên phải có ít nhất 2 ký tự';
    }
    return null;
  },
};
