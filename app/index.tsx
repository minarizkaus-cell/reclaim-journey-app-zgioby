
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import { User } from '@/types/models';

export default function IndexScreen() {
  const { user, loading: authLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Index] Auth loading:', authLoading, 'User:', user?.id);
    if (!authLoading && user) {
      checkOnboardingStatus();
    } else if (!authLoading && !user) {
      console.log('[Index] No user, stopping onboarding check');
      setCheckingOnboarding(false);
    }
  }, [authLoading, user]);

  const checkOnboardingStatus = async () => {
    try {
      console.log('[Index] Checking onboarding status...');
      setError(null);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 5 seconds')), 5000);
      });

      const profilePromise = authenticatedGet<User>('/api/user/profile');
      
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      
      console.log('[Index] Profile loaded:', profile);
      setIsOnboarded(profile.onboarded || false);
    } catch (error) {
      console.error('[Index] Failed to check onboarding status:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load profile';
      setError(errorMsg);
      setIsOnboarded(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleRetry = () => {
    console.log('[Index] User tapped retry');
    setCheckingOnboarding(true);
    setError(null);
    checkOnboardingStatus();
  };

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
        <Text style={[styles.loadingText, { color: colors.dark.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // No user = redirect to auth
  if (!user) {
    console.log('[Index] Redirecting to /auth (no user)');
    return <Redirect href="/auth" />;
  }

  // User exists, check onboarding status
  if (checkingOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
        <Text style={[styles.loadingText, { color: colors.dark.textSecondary }]}>
          Checking your profile...
        </Text>
        {error && (
          <>
            <Text style={[styles.errorText, { color: colors.dark.error }]}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  // User not onboarded = redirect to onboarding
  if (!isOnboarded) {
    console.log('[Index] Redirecting to /onboarding (user not onboarded)');
    return <Redirect href="/onboarding" />;
  }

  // User onboarded = redirect to home
  console.log('[Index] Redirecting to /home (user onboarded)');
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
