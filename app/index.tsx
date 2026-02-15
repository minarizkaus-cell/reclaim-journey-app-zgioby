
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import { User } from '@/types/models';

export default function IndexScreen() {
  const { user, loading: authLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkOnboardingStatus();
    }
  }, [authLoading, user]);

  const checkOnboardingStatus = async () => {
    try {
      console.log('[Index] Checking onboarding status...');
      const profile = await authenticatedGet<User>('/api/user/profile');
      console.log('[Index] Profile loaded:', profile);
      setIsOnboarded(profile.onboarded);
    } catch (error) {
      console.error('[Index] Failed to check onboarding status:', error);
      // If we can't check, assume they need onboarding
      setIsOnboarded(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  if (authLoading || checkingOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/(home)/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
