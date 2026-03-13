import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthColors } from '@/shared/constants/Colors';
import { authStyles } from '@/features/auth/styles/auth';
import { authService } from '@/features/auth/services/authService';
import { validation } from '@/shared/utils/validation';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ResetPasswordScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleOtpChange = useCallback((text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setOtpDigits((prev) => {
      const updated = [...prev];
      updated[index] = digit;
      return updated;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otpDigits[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleResend = async () => {
    if (resendCountdown > 0 || !paramEmail) return;
    try {
      await authService.forgotPassword({ email: paramEmail });
      setResendCountdown(RESEND_COOLDOWN);
      Alert.alert('Đã gửi lại', 'Mã OTP mới đã được gửi đến email của bạn.');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lại mã OTP.');
    }
  };

  const handleSubmit = async () => {
    const otpCode = otpDigits.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP 6 số');
      return;
    }

    const passwordError = validation.getPasswordError(newPassword);
    if (passwordError) {
      Alert.alert('Lỗi', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword({
        email: paramEmail || '',
        otpCode,
        newPassword,
      });
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.', [
        {
          text: 'Đăng nhập',
          onPress: () => router.replace('/(auth)/login' as any),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <View style={styles.backgroundPlaceholder}>
        <View style={authStyles.overlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header */}
            <View style={authStyles.headerContainer}>
              <Text style={authStyles.welcomeText}>Nhập mã OTP</Text>
              <Text style={authStyles.subtitleText}>
                Mã đã được gửi đến {paramEmail || 'email của bạn'}
              </Text>
            </View>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend */}
            <View style={styles.resendContainer}>
              {resendCountdown > 0 ? (
                <Text style={styles.resendText}>
                  Gửi lại mã sau {resendCountdown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Gửi lại mã OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* New Password */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Mật khẩu mới</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Tối thiểu 8 ký tự"
                  placeholderTextColor={AuthColors.inputPlaceholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={authStyles.inputIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={AuthColors.inputPlaceholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={AuthColors.inputPlaceholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[authStyles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundPlaceholder: {
    flex: 1,
    backgroundColor: '#6B4A3A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: AuthColors.inputBackground,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  otpInputFilled: {
    borderWidth: 2,
    borderColor: AuthColors.primaryButton,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  resendText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
