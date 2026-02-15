import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AuthColors } from '@/shared/constants/Colors';
import { authStyles } from '@/features/auth/styles/auth';

const { width } = Dimensions.get('window');

export default function GetStartedScreen() {
  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={[AuthColors.gradientStart, AuthColors.gradientEnd]}
      style={authStyles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={authStyles.contentContainer}>
        {/* Circle Image - Replace with your actual food image */}
        <View style={styles.circleImageContainer}>
          {/* 
            TODO: Replace this placeholder with your actual image
            Example: <Image source={require('@/assets/images/food-circle.png')} style={styles.circleImage} />
          */}
          <View style={styles.placeholderCircle}>
            <Text style={styles.placeholderText}>Thay bằng ảnh{'\n'}món ăn tròn</Text>
          </View>
        </View>

        {/* Logo Text */}
        <Text style={authStyles.logoText}>FoodLink</Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={authStyles.secondaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circleImageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    overflow: 'hidden',
    marginBottom: 40,
    backgroundColor: '#ddd',
  },
  circleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCircle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
