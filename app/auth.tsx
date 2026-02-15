
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet, apiPost } from '@/utils/api';
import { User } from '@/types/models';
import { IconSymbol } from '@/components/IconSymbol';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Inline validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  const isValidEmail = (emailText: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const validateEmailField = (text: string) => {
    setEmail(text);
    if (!text.trim()) {
      setEmailError('Email is required');
    } else if (!isValidEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const validatePasswordField = (text: string) => {
    setPassword(text);
    if (!text.trim()) {
      setPasswordError('Password is required');
    } else if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPasswordField = (text: string) => {
    setConfirmPassword(text);
    if (!text.trim()) {
      setConfirmPasswordError('Please confirm your password');
    } else if (text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateDisplayNameField = (text: string) => {
    setDisplayName(text);
    if (!text.trim()) {
      setDisplayNameError('Display name is required');
    } else {
      setDisplayNameError('');
    }
  };

  const validateFields = (): boolean => {
    const isLoginMode = mode === 'login';
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Validate register-specific fields
    if (!isLoginMode) {
      if (!displayName.trim()) {
        setDisplayNameError('Display name is required');
        isValid = false;
      }

      if (!confirmPassword.trim()) {
        setConfirmPasswordError('Please confirm your password');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        isValid = false;
      }
    }

    if (!isValid) {
      setErrorMessage('Please fix the errors above');
    }

    return isValid;
  };

  const handleAuth = async () => {
    console.log('[Auth] Starting authentication, mode:', mode);
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const isLoginMode = mode === 'login';
      
      if (isLoginMode) {
        console.log('[Auth] Signing in with email...');
        await signInWithEmail(email, password);
        
        console.log('[Auth] Login successful, checking onboarding status...');
        const profile = await authenticatedGet<User>('/api/user/profile');
        console.log('[Auth] Profile loaded:', profile);
        
        const onboardedStatus = profile.onboarded;
        
        if (onboardedStatus) {
          console.log('[Auth] User is onboarded, redirecting to home...');
          router.replace('/(tabs)/(home)/');
        } else {
          console.log('[Auth] User not onboarded, redirecting to onboarding...');
          router.replace('/onboarding');
        }
      } else {
        console.log('[Auth] Signing up with email...');
        await signUpWithEmail(email, password, displayName);
        
        console.log('[Auth] Registration successful, redirecting to onboarding...');
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error('[Auth] Authentication error:', error);
      let errorMsg = 'Authentication failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          errorMsg = 'Invalid email or password';
        } else if (error.message.includes('already exists') || error.message.includes('409')) {
          errorMsg = 'An account with this email already exists';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg = 'Network error. Please check your connection.';
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    console.log('[Auth] Starting social auth with:', provider);
    setLoading(true);
    setErrorMessage('');
    
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'apple') {
        await signInWithApple();
      }
      
      console.log('[Auth] Social auth successful, checking onboarding status...');
      const profile = await authenticatedGet<User>('/api/user/profile');
      console.log('[Auth] Profile loaded:', profile);
      
      const onboardedStatus = profile.onboarded;
      
      if (onboardedStatus) {
        console.log('[Auth] User is onboarded, redirecting to home...');
        router.replace('/(tabs)/(home)/');
      } else {
        console.log('[Auth] User not onboarded, redirecting to onboarding...');
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error('[Auth] Social auth error:', error);
      const errorMsg = 'Social authentication failed. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log('[Auth] Forgot password requested for:', forgotPasswordEmail);
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address');
      return;
    }
    
    if (!isValidEmail(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    try {
      // TODO: Backend Integration - POST /api/auth/forgot-password with { email: string }
      // For now, simulate the call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[Auth] Password reset email sent');
      const successMsg = 'If an account with that email exists, a reset link has been sent.';
      setForgotPasswordSuccess(successMsg);
      setForgotPasswordError('');
      
      // Clear form after 3 seconds
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setForgotPasswordSuccess('');
      }, 3000);
    } catch (error: any) {
      console.error('[Auth] Forgot password error:', error);
      setForgotPasswordError('Could not process request. Please try again later.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    console.log('[Auth] Toggling mode to:', newMode);
    setMode(newMode);
    setErrorMessage('');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setDisplayNameError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openForgotPasswordModal = () => {
    console.log('[Auth] Opening forgot password modal');
    setShowForgotPasswordModal(true);
    setForgotPasswordEmail(email);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  };

  const isLoginMode = mode === 'login';
  const buttonText = isLoginMode ? 'Login' : 'Register';
  const toggleText = isLoginMode ? "Don't have an account? Register" : 'Already have an account? Login';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.dark.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/app-icon-dgf.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.appName, { color: colors.dark.primary }]}>
            MyRecovery
          </Text>

          <Text style={[styles.tagline, { color: colors.dark.textSecondary }]}>
            Your recovery companion
          </Text>

          <Text style={[styles.title, { color: colors.dark.text }]}>
            {buttonText}
          </Text>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!isLoginMode && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.dark.card, 
                  borderColor: displayNameError ? '#E57373' : colors.dark.border,
                  color: colors.dark.text 
                }]}
                placeholder="Display Name"
                placeholderTextColor={colors.dark.textSecondary}
                value={displayName}
                onChangeText={validateDisplayNameField}
                autoCapitalize="words"
                editable={!loading}
              />
              {displayNameError ? (
                <Text style={styles.fieldError}>{displayNameError}</Text>
              ) : null}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.dark.card, 
                borderColor: emailError ? '#E57373' : colors.dark.border,
                color: colors.dark.text 
              }]}
              placeholder="Email"
              placeholderTextColor={colors.dark.textSecondary}
              value={email}
              onChangeText={validateEmailField}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {emailError ? (
              <Text style={styles.fieldError}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.passwordInput, { 
                  backgroundColor: colors.dark.card, 
                  borderColor: passwordError ? '#E57373' : colors.dark.border,
                  color: colors.dark.text 
                }]}
                placeholder="Password"
                placeholderTextColor={colors.dark.textSecondary}
                value={password}
                onChangeText={validatePasswordField}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"}
                  android_material_icon_name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color={colors.dark.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.fieldError}>{passwordError}</Text>
            ) : null}
          </View>

          {isLoginMode && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={openForgotPasswordModal}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.dark.textSecondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          {!isLoginMode && (
            <View style={styles.inputContainer}>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.passwordInput, { 
                    backgroundColor: colors.dark.card, 
                    borderColor: confirmPasswordError ? '#E57373' : colors.dark.border,
                    color: colors.dark.text 
                  }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.dark.textSecondary}
                  value={confirmPassword}
                  onChangeText={validateConfirmPasswordField}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <IconSymbol
                    ios_icon_name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                    android_material_icon_name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={colors.dark.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.fieldError}>{confirmPasswordError}</Text>
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton, 
              { backgroundColor: colors.dark.primary },
              loading && styles.buttonDisabled
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{buttonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={[styles.switchModeText, { color: colors.dark.primary }]}>
              {toggleText}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.dark.border }]} />
            <Text style={[styles.dividerText, { color: colors.dark.textSecondary }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.dark.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { 
              borderColor: colors.dark.border,
              backgroundColor: colors.dark.card 
            }]}
            onPress={() => handleSocialAuth('google')}
            disabled={loading}
          >
            <Text style={[styles.socialButtonText, { color: colors.dark.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => handleSocialAuth('apple')}
              disabled={loading}
            >
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.dark.card }]}>
            <Text style={[styles.modalTitle, { color: colors.dark.text }]}>
              Reset Password
            </Text>
            
            <Text style={[styles.modalDescription, { color: colors.dark.textSecondary }]}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Text>

            {forgotPasswordSuccess ? (
              <View style={styles.successContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={48}
                  color="#4CAF50"
                />
                <Text style={[styles.successText, { color: '#4CAF50' }]}>
                  {forgotPasswordSuccess}
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: colors.dark.background, 
                    borderColor: forgotPasswordError ? '#E57373' : colors.dark.border,
                    color: colors.dark.text 
                  }]}
                  placeholder="Email"
                  placeholderTextColor={colors.dark.textSecondary}
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!forgotPasswordLoading}
                />
                
                {forgotPasswordError ? (
                  <Text style={styles.fieldError}>{forgotPasswordError}</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.dark.border }]}
                    onPress={closeForgotPasswordModal}
                    disabled={forgotPasswordLoading}
                  >
                    <Text style={[styles.modalButtonTextSecondary, { color: colors.dark.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.dark.primary }]}
                    onPress={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    padding: 4,
  },
  fieldError: {
    color: '#E57373',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
  },
  primaryButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  socialButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.3)',
  },
  errorText: {
    color: '#E57373',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
    // backgroundColor set dynamically
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});
