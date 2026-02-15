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
import { useAuth } from '@/features/auth/context/AuthContext';
import { validation } from '@/shared/utils/validation';

export default function RegisterScreen() {
  const { register, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const fullNameError = validation.getFullNameError(fullName);
    const emailError = validation.getEmailError(email);
    const passwordError = validation.getPasswordError(password);

    if (fullNameError || emailError || passwordError) {
      Alert.alert('Validation Error', fullNameError || emailError || passwordError || '');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(fullName, email, password);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login' as any);
  };

  return (
    <View style={authStyles.container}>
      {/* 
        TODO: Replace this with your actual background image
        Example: 
        <ImageBackground 
          source={require('@/assets/images/register-background.png')} 
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
                <Text style={authStyles.welcomeText}>Create Account</Text>
                <Text style={styles.welcomeEmoji}>🍜</Text>
              </View>
              <Text style={authStyles.subtitleText}>Join FoodLink today</Text>
            </View>

            {/* Full Name Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Full Name</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={AuthColors.inputPlaceholder}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Enter your email"
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
              <Text style={authStyles.inputLabel}>Password</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={authStyles.input}
                  placeholder="Enter your password"
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

            {/* Register Button */}
            <TouchableOpacity
              style={[
                authStyles.primaryButton, 
                { marginTop: 30 },
                (isSubmitting || authLoading) && { opacity: 0.7 }
              ]}
              onPress={handleRegister}
              disabled={isSubmitting || authLoading}
              activeOpacity={0.8}
            >
              {(isSubmitting || authLoading) ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={authStyles.bottomLinkContainer}>
              <Text style={authStyles.bottomLinkText}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={authStyles.bottomLinkHighlight}>Login</Text>
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
