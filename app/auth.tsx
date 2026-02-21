
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
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authClient } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, apiPost } from '@/utils/api';
import { User } from '@/types/models';

/**
 * Check if an email address is available for registration
 * Uses the /api/user/check-email endpoint to pre-validate before attempting signup
 */
async function checkEmailAvailability(email: string): Promise<{ available: boolean; email: string }> {
  console.log('[Auth] Checking email availability for:', email);
  const result = await apiPost<{ available: boolean; email: string }>('/api/user/check-email', { email: email.toLowerCase().trim() });
  console.log('[Auth] Email availability result:', result);
  return result;
}

/**
 * Validate registration data using the backend validation endpoint
 * Returns validation result with specific error messages from the backend
 */
async function validateRegistration(
  email: string,
  password: string,
  name: string
): Promise<{ valid: boolean; errors: string[]; email: string; suggestions?: string }> {
  console.log('[Auth] Validating registration data for:', email);
  const result = await apiPost<{ valid: boolean; errors: string[]; email: string; suggestions?: string }>(
    '/api/user/validate-registration',
    { email: email.toLowerCase().trim(), password, name }
  );
  console.log('[Auth] Validation result:', result);
  return result;
}

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { fetchUser } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const isValidEmail = (emailText: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const isValidPassword = (passwordText: string) => {
    if (passwordText.length < 8) {
      return false;
    }
    if (!/[A-Z]/.test(passwordText)) {
      return false;
    }
    if (!/[a-z]/.test(passwordText)) {
      return false;
    }
    if (!/[0-9]/.test(passwordText)) {
      return false;
    }
    if (/[^a-zA-Z0-9]/.test(passwordText)) {
      return false;
    }
    return true;
  };

  const validateEmailField = (text: string) => {
    setEmail(text);
    setEmailError('');
  };

  const validatePasswordField = (text: string) => {
    setPassword(text);
    if (mode === 'register' && text) {
      if (text.length < 8) {
        setPasswordError('Password must be at least 8 characters');
      } else if (!/[A-Z]/.test(text)) {
        setPasswordError('Password must include at least 1 uppercase letter');
      } else if (!/[a-z]/.test(text)) {
        setPasswordError('Password must include at least 1 lowercase letter');
      } else if (!/[0-9]/.test(text)) {
        setPasswordError('Password must include at least 1 number');
      } else if (/[^a-zA-Z0-9]/.test(text)) {
        setPasswordError('Password must only contain letters and numbers');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPasswordField = (text: string) => {
    setConfirmPassword(text);
    if (mode === 'register' && text && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateDisplayNameField = (text: string) => {
    setDisplayName(text);
    if (mode === 'register' && text && text.length < 2) {
      setDisplayNameError('Name must be at least 2 characters');
    } else {
      setDisplayNameError('');
    }
  };

  const validateFields = () => {
    let isValid = true;

    if (!email || !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (mode === 'register') {
      if (!displayName || displayName.length < 2) {
        setDisplayNameError('Name must be at least 2 characters');
        isValid = false;
      }

      if (!password || !isValidPassword(password)) {
        setPasswordError('Password must be 8+ characters with uppercase, lowercase, and number');
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        isValid = false;
      }
    } else {
      if (!password) {
        setPasswordError('Please enter your password');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleAuth = async () => {
    console.log('[Auth] User tapped', mode === 'login' ? 'Login' : 'Register');

    if (mode === 'login') {
      if (!email || !isValidEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
      if (!password) {
        setPasswordError('Please enter your password');
        return;
      }
      setEmailError('');
      setPasswordError('');
    } else {
      if (!validateFields()) {
        console.log('[Auth] Validation failed');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        console.log('[Auth] Attempting login...');
        const result = await authClient.signIn.email({
          email,
          password,
        });

        console.log('[Auth] Login result:', result);

        if (result.error) {
          console.error('[Auth] Login error:', result.error);
          setPasswordError('Incorrect email or password');
          setLoading(false);
          return;
        }

        console.log('[Auth] Login successful, fetching user profile');
        await fetchUser();
        
        const profile = await authenticatedGet<User>('/api/user/profile');

        if (!profile.onboarded) {
          console.log('[Auth] User not onboarded, redirecting to onboarding');
          router.replace('/onboarding');
        } else {
          console.log('[Auth] User onboarded, redirecting to home');
          router.replace('/home');
        }
      } else {
        console.log('[Auth] Attempting registration with email:', email, 'name:', displayName);

        // Pre-validate registration data using the dedicated validation endpoint
        // This provides accurate, backend-driven error messages before attempting signup
        try {
          console.log('[Auth] Pre-validating registration data...');
          const validation = await validateRegistration(email, password, displayName);
          console.log('[Auth] Validation result:', JSON.stringify(validation, null, 2));

          if (!validation.valid) {
            console.log('[Auth] Validation failed with errors:', validation.errors);
            // Parse validation errors and assign to appropriate fields
            const errors = validation.errors || [];
            let hasEmailError = false;
            let hasPasswordError = false;

            for (const err of errors) {
              const errLower = err.toLowerCase();
              // Only show "already in use" if the error message explicitly says so
              const isAlreadyInUseError =
                errLower.includes('already in use') ||
                errLower === 'email address already in use' ||
                errLower.includes('email already');

              if (isAlreadyInUseError) {
                if (!hasEmailError) {
                  console.log('[Auth] Email already in use (from validate-registration)');
                  setEmailError('This email address is already in use. Please sign in or use a different email.');
                  hasEmailError = true;
                }
              } else if (errLower.includes('email') || errLower.includes('invalid email')) {
                if (!hasEmailError) {
                  setEmailError(err);
                  hasEmailError = true;
                }
              } else if (errLower.includes('password')) {
                if (!hasPasswordError) {
                  setPasswordError(err);
                  hasPasswordError = true;
                }
              } else if (errLower.includes('name')) {
                setDisplayNameError(err);
              } else {
                // Generic error - show on email field
                if (!hasEmailError) {
                  setEmailError(err);
                  hasEmailError = true;
                }
              }
            }

            if (validation.suggestions) {
              console.log('[Auth] Suggestions:', validation.suggestions);
            }

            setLoading(false);
            return;
          }
          console.log('[Auth] Pre-validation passed, proceeding with registration');
        } catch (validationError: any) {
          // If the validate-registration endpoint fails, log and continue
          console.warn('[Auth] validate-registration endpoint failed:', validationError?.message);
          console.warn('[Auth] validate-registration error status:', validationError?.status);
          console.warn('[Auth] validate-registration error body:', validationError?.responseBody);

          // Only surface 400 validation errors - do NOT map other errors to "already in use"
          if (validationError?.status === 400 && validationError?.message) {
            const errMsg = validationError.message.toLowerCase();
            if (errMsg.includes('password')) {
              setPasswordError(validationError.message);
            } else if (errMsg.includes('name')) {
              setDisplayNameError(validationError.message);
            } else if (errMsg.includes('email')) {
              setEmailError(validationError.message);
            } else {
              setEmailError('Registration failed. Please try again.');
            }
            setLoading(false);
            return;
          }

          // For non-400 errors (network issues, 500s, etc.), proceed to let Better Auth handle it
          console.warn('[Auth] Non-400 validation error, proceeding to Better Auth signup');
        }

        console.log('[Auth] Calling Better Auth signUp.email...');
        const result = await authClient.signUp.email({
          email: email.toLowerCase().trim(),
          password,
          name: displayName,
        });

        console.log('[Auth] Registration result:', JSON.stringify(result, null, 2));

        if (result.error) {
          console.error('[Auth] Registration error:', JSON.stringify(result.error, null, 2));

          const errorMessage = result.error.message || '';
          const errorStatus = result.error.status;

          console.log('[Auth] Error message:', errorMessage);
          console.log('[Auth] Error status:', errorStatus);

          // Handle specific error cases based on HTTP status code ONLY
          if (errorStatus === 409) {
            // 409 Conflict - Email already exists (backend confirmed)
            console.log('[Auth] 409 Conflict - Email already exists');
            setEmailError('This email address is already in use. Please sign in or use a different email.');
          } else if (errorStatus === 400) {
            // 400 Bad Request - Validation error (weak password, invalid email, etc.)
            console.log('[Auth] 400 Bad Request - Validation error:', errorMessage);
            const errLower = errorMessage.toLowerCase();
            if (errLower.includes('password')) {
              setPasswordError(errorMessage || 'Password does not meet requirements');
            } else if (errLower.includes('name')) {
              setDisplayNameError(errorMessage || 'Invalid name');
            } else if (errLower.includes('email')) {
              setEmailError(errorMessage || 'Invalid email address');
            } else {
              setEmailError(errorMessage || 'Invalid registration details. Please check your input.');
            }
          } else {
            // All other errors (500, network errors, unknown) - show generic message
            // NEVER show "already in use" for non-409 errors
            console.log('[Auth] Non-409/400 error - showing generic failure message');
            console.error('[Auth] Backend error details for debugging:', errorMessage, 'status:', errorStatus);
            setEmailError('Registration failed. Please try again.');
          }
          setLoading(false);
          return;
        }

        console.log('[Auth] Registration successful, fetching user profile');
        await fetchUser();

        console.log('[Auth] Redirecting to onboarding');
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error('[Auth] Auth error:', error);
      console.error('[Auth] Error details:', JSON.stringify(error, null, 2));

      if (mode === 'login') {
        setPasswordError('Incorrect email or password');
      } else {
        // For registration errors, use HTTP status code to determine the message
        console.error('[Auth] Caught registration error - status:', error?.status, 'message:', error?.message);
        if (error?.status === 409) {
          // Only 409 means "email already in use"
          console.log('[Auth] Caught 409 error - Email already in use');
          setEmailError('This email address is already in use. Please sign in or use a different email.');
        } else if (error?.status === 400) {
          console.log('[Auth] Caught 400 error - Validation failed:', error?.message);
          const errMsg = (error.message || '').toLowerCase();
          if (errMsg.includes('password')) {
            setPasswordError(error.message || 'Password does not meet requirements');
          } else if (errMsg.includes('name')) {
            setDisplayNameError(error.message || 'Invalid name');
          } else if (errMsg.includes('email')) {
            setEmailError(error.message || 'Invalid email address');
          } else {
            setEmailError(error.message || 'Invalid registration details. Please check your input.');
          }
        } else {
          // All other errors (500, network, unknown) - generic message, NEVER "already in use"
          console.log('[Auth] Unexpected error during registration (non-409/400)');
          console.error('[Auth] Full error object for debugging:', JSON.stringify(error, null, 2));
          setEmailError('Registration failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    console.log('[Auth] User tapped', provider, 'sign in');
    console.log('[Auth] Social auth not yet implemented');
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !isValidEmail(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      console.log('[Auth] Sending password reset email to:', forgotPasswordEmail);
      await authClient.forgetPassword({
        email: forgotPasswordEmail,
        redirectTo: '/auth',
      });
      setForgotPasswordMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (error) {
      console.error('[Auth] Forgot password error:', error);
      setForgotPasswordMessage('An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const toggleMode = () => {
    console.log('[Auth] Toggling mode from', mode, 'to', mode === 'login' ? 'register' : 'login');
    setMode(mode === 'login' ? 'register' : 'login');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setDisplayNameError('');
  };

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
    setForgotPasswordEmail(email);
    setForgotPasswordMessage('');
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
  };

  const themeColors = colors.dark;
  const isLoginMode = mode === 'login';
  const modeTitle = isLoginMode ? 'Welcome Back' : 'Create Account';
  const modeButtonText = isLoginMode ? 'Login' : 'Register';
  const modeToggleText = isLoginMode ? 'Don\'t have an account?' : 'Already have an account?';
  const modeToggleButtonText = isLoginMode ? 'Register' : 'Login';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/final_quest_240x240.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: themeColors.text }]}>
            MyRecovery
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {modeTitle}
          </Text>

          {!isLoginMode && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: themeColors.card, color: themeColors.text, borderColor: displayNameError ? themeColors.error : themeColors.border },
                ]}
                placeholder="Display Name"
                placeholderTextColor={themeColors.textSecondary}
                value={displayName}
                onChangeText={validateDisplayNameField}
                autoCapitalize="words"
                editable={!loading}
              />
              {displayNameError ? (
                <Text style={[styles.errorText, { color: themeColors.error }]}>
                  {displayNameError}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: themeColors.card, color: themeColors.text, borderColor: emailError ? themeColors.error : themeColors.border },
              ]}
              placeholder="Email"
              placeholderTextColor={themeColors.textSecondary}
              value={email}
              onChangeText={validateEmailField}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {emailError ? (
              <Text style={[styles.errorText, { color: themeColors.error }]}>
                {emailError}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { backgroundColor: themeColors.card, color: themeColors.text, borderColor: passwordError ? themeColors.error : themeColors.border },
                ]}
                placeholder="Password"
                placeholderTextColor={themeColors.textSecondary}
                value={password}
                onChangeText={validatePasswordField}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  android_material_icon_name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={[styles.errorText, { color: themeColors.error }]}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          {!isLoginMode && (
            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: themeColors.card, color: themeColors.text, borderColor: confirmPasswordError ? themeColors.error : themeColors.border },
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={themeColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={validateConfirmPasswordField}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <IconSymbol
                    ios_icon_name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
                    android_material_icon_name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.errorText, { color: themeColors.error }]}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>
          )}

          {isLoginMode && (
            <TouchableOpacity onPress={openForgotPasswordModal}>
              <Text style={[styles.forgotPassword, { color: themeColors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {modeButtonText}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, { color: themeColors.textSecondary }]}>
              {modeToggleText}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={[styles.toggleButton, { color: themeColors.primary }]}>
                {modeToggleButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showForgotPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Reset Password
            </Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border },
              ]}
              placeholder="Email"
              placeholderTextColor={themeColors.textSecondary}
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!forgotPasswordLoading}
            />
            {forgotPasswordMessage ? (
              <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
                {forgotPasswordMessage}
              </Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: themeColors.border }]}
                onPress={closeForgotPasswordModal}
                disabled={forgotPasswordLoading}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: themeColors.primary }]}
                onPress={handleForgotPassword}
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>
                    Send Link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 20,
    fontWeight: '500',
  },
  button: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
