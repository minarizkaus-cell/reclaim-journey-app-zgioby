
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
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import { User } from '@/types/models';

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

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  const validateFields = (): boolean => {
    const isLoginMode = mode === 'login';
    
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return false;
    }

    if (!password.trim()) {
      setErrorMessage('Password is required');
      return false;
    }

    if (!isLoginMode) {
      if (!displayName.trim()) {
        setErrorMessage('Display name is required');
        return false;
      }

      if (!confirmPassword.trim()) {
        setErrorMessage('Please confirm your password');
        return false;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return false;
      }
    }

    return true;
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
        
        // Check onboarding status after login
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
      const errorMsg = error.message || 'Authentication failed';
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
      
      // Check onboarding status after social auth
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
      const errorMsg = error.message || 'Authentication failed';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
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
  };

  const isLoginMode = mode === 'login';
  const buttonText = isLoginMode ? 'Login' : 'Register';
  const toggleText = isLoginMode ? "Don't have an account? Register" : 'Already have an account? Login';
  const appNameText = 'MyRecovery';
  const taglineText = 'Your recovery companion';

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/app-icon-dgf.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* App Name */}
          <Text style={[styles.appName, { color: colors.dark.primary }]}>
            {appNameText}
          </Text>

          {/* Tagline */}
          <Text style={[styles.tagline, { color: colors.dark.textSecondary }]}>
            {taglineText}
          </Text>

          {/* Title */}
          <Text style={[styles.title, { color: colors.dark.text }]}>
            {buttonText}
          </Text>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Display Name (Register only) */}
          {!isLoginMode && (
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.dark.card, 
                borderColor: colors.dark.border,
                color: colors.dark.text 
              }]}
              placeholder="Display Name"
              placeholderTextColor={colors.dark.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              editable={!loading}
            />
          )}

          {/* Email */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.dark.card, 
              borderColor: colors.dark.border,
              color: colors.dark.text 
            }]}
            placeholder="Email"
            placeholderTextColor={colors.dark.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Password */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.dark.card, 
              borderColor: colors.dark.border,
              color: colors.dark.text 
            }]}
            placeholder="Password"
            placeholderTextColor={colors.dark.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Confirm Password (Register only) */}
          {!isLoginMode && (
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.dark.card, 
                borderColor: colors.dark.border,
                color: colors.dark.text 
              }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.dark.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          )}

          {/* Submit Button */}
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

          {/* Toggle Mode Button */}
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={[styles.switchModeText, { color: colors.dark.primary }]}>
              {toggleText}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.dark.border }]} />
            <Text style={[styles.dividerText, { color: colors.dark.textSecondary }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.dark.border }]} />
          </View>

          {/* Social Auth Buttons */}
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
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
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
});
