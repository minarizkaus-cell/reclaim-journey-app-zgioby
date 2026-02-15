
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    console.log('[VerifyEmail] Resending verification email');
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await authenticatedPost('/api/user/send-verification-email', {});
      console.log('[VerifyEmail] Verification email sent');
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('[VerifyEmail] Failed to send verification email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[VerifyEmail] User signing out');
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('[VerifyEmail] Sign out error:', error);
    }
  };

  const userEmail = user?.email || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.dark.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="envelope.fill"
            android_material_icon_name="email"
            size={80}
            color={colors.dark.primary}
          />
        </View>

        <Text style={[styles.title, { color: colors.dark.text }]}>
          Verify Your Email
        </Text>

        <Text style={[styles.description, { color: colors.dark.textSecondary }]}>
          Your account requires email verification to continue. We&apos;ve sent a verification link to:
        </Text>

        <Text style={[styles.email, { color: colors.dark.primary }]}>
          {userEmail}
        </Text>

        <Text style={[styles.instructions, { color: colors.dark.textSecondary }]}>
          Please check your inbox and click the verification link. If you don&apos;t see the email, check your spam folder.
        </Text>

        {message ? (
          <View style={styles.successContainer}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color="#4CAF50"
            />
            <Text style={[styles.successText, { color: '#4CAF50' }]}>
              {message}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.dark.primary }]}
          onPress={handleResendEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Resend Verification Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.dark.border }]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.dark.text }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    flex: 1,
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
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
