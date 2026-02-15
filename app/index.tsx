
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
      
      // Reduced timeout for faster failure
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
      // If we can't check, assume they need onboarding
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

  if (!user) {
    console.log('[Index] Redirecting to /auth');
    return <Redirect href="/auth" />;
  }

  if (!isOnboarded) {
    console.log('[Index] Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  console.log('[Index] Redirecting to /(tabs)/(home)/');
  return <Redirect href="/(tabs)/(home)/" />;
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
