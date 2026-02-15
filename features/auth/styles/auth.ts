import { StyleSheet, Dimensions } from 'react-native';
import { AuthColors } from '@/shared/constants/Colors';

const { width, height } = Dimensions.get('window');

export const authStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AuthColors.overlay,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Get Started screen specific
  circleImageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    overflow: 'hidden',
    marginBottom: 40,
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '600',
    fontStyle: 'italic',
    color: AuthColors.titleText,
    marginBottom: 60,
  },
  
  // Login/Register screen specific
  authContentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: AuthColors.titleText,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: AuthColors.subtitleText,
  },
  
  // Input styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: AuthColors.labelText,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuthColors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AuthColors.inputText,
  },
  inputIcon: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: AuthColors.primaryButton,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: AuthColors.primaryButtonText,
  },
  secondaryButton: {
    backgroundColor: AuthColors.secondaryButton,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AuthColors.secondaryButtonText,
  },
  
  // Link styles
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: AuthColors.linkText,
  },
  bottomLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  bottomLinkText: {
    fontSize: 14,
    color: AuthColors.subtitleText,
  },
  bottomLinkHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: AuthColors.linkText,
    marginLeft: 4,
  },
});
