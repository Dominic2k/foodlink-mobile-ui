import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthColors } from '@/shared/constants/Colors';
import { authStyles } from '@/features/auth/styles/auth';
import { authService } from '@/features/auth/services/authService';
import { validation } from '@/shared/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const emailError = validation.getEmailError(email);
    if (emailError) {
      Alert.alert('Lỗi', emailError);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.forgotPassword({ email: email.trim() });
      Alert.alert(
        'Đã gửi mã OTP',
        'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email của bạn.',
        [
          {
            text: 'Nhập mã OTP',
            onPress: () =>
              router.push({
                pathname: '/(auth)/reset-password',
                params: { email: email.trim() },
              } as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
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
              <Text style={authStyles.welcomeText}>Quên mật khẩu</Text>
              <Text style={authStyles.subtitleText}>
                Nhập email đã đăng ký để nhận mã xác nhận
              </Text>
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={48} color={AuthColors.primaryButton} />
              </View>
            </View>

            {/* Email Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor={AuthColors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
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
                <Text style={authStyles.primaryButtonText}>Gửi mã OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={authStyles.bottomLinkContainer}>
              <Text style={authStyles.bottomLinkText}>Đã nhớ mật khẩu?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={authStyles.bottomLinkHighlight}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
