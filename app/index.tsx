
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
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
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const profilePromise = authenticatedGet<User>('/api/user/profile');
      
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      
      console.log('[Index] Profile loaded:', profile);
      setIsOnboarded(profile.onboarded || false);
    } catch (error) {
      console.error('[Index] Failed to check onboarding status:', error);
      // If we can't check, assume they need onboarding
      setIsOnboarded(false);
      setError('Failed to load profile. Redirecting to onboarding...');
    } finally {
      setCheckingOnboarding(false);
    }
  };

  if (authLoading || checkingOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
        {error && (
          <Text style={[styles.errorText, { color: colors.dark.error }]}>
            {error}
          </Text>
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
  errorText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
