import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
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
import { useAuth } from '@/features/auth/context/AuthContext';
import { validation } from '@/shared/utils/validation';

export default function LoginScreen() {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const emailError = validation.getEmailError(email);
    const passwordError = validation.getPasswordError(password);

    if (emailError || passwordError) {
      Alert.alert('Lỗi xác thực', emailError || passwordError || '');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.message || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/register' as any);
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password' as any);
  };

  return (
    <View style={authStyles.container}>
      {/* 
        TODO: Replace this with your actual background image
        Example: 
        <ImageBackground 
          source={require('@/assets/images/login-background.png')} 
          style={authStyles.backgroundImage}
        >
      */}
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
            {/* Header */}
            <View style={authStyles.headerContainer}>
              <View style={styles.welcomeRow}>
                <Text style={authStyles.welcomeText}>Chào mừng đến Foodlink</Text>
                {/* TODO: Add small icon here if needed */}
                <Text style={styles.welcomeEmoji}>🍜</Text>
              </View>
              <Text style={authStyles.subtitleText}>Đăng nhập tài khoản của bạn</Text>
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

            {/* Password Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Mật khẩu</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor={AuthColors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
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

            {/* Forgot Password */}
            <TouchableOpacity
              style={authStyles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={authStyles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                authStyles.primaryButton, 
                (isSubmitting || authLoading) && { opacity: 0.7 }
              ]}
              onPress={handleLogin}
              disabled={isSubmitting || authLoading}
              activeOpacity={0.8}
            >
              {(isSubmitting || authLoading) ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={authStyles.bottomLinkContainer}>
              <Text style={authStyles.bottomLinkText}>
                Chưa có tài khoản?
              </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={authStyles.bottomLinkHighlight}>Đăng ký</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeEmoji: {
    fontSize: 28,
  },
});
