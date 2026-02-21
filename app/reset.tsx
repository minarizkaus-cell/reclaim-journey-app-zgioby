
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResetScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isResetting, setIsResetting] = React.useState(true);

  useEffect(() => {
    const performReset = async () => {
      try {
        console.log('[Reset] Performing emergency reset...');
        
        // Clear all AsyncStorage
        await AsyncStorage.clear();
        console.log('[Reset] AsyncStorage cleared');
        
        // Sign out (clears auth tokens)
        await signOut();
        console.log('[Reset] Auth tokens cleared');
        
        console.log('[Reset] Reset complete');
      } catch (error) {
        console.error('[Reset] Error during reset:', error);
      } finally {
        setIsResetting(false);
      }
    };
    
    performReset();
  }, [signOut]);

  if (isResetting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
        <Text style={[styles.text, { color: colors.dark.text }]}>
          Resetting app...
        </Text>
      </View>
    );
  }

  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
