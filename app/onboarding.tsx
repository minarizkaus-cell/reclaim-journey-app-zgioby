
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPut } from '@/utils/api';

const onboardingSteps = [
  {
    title: 'Welcome to Reclaim Journey',
    description: 'Your personal companion on your recovery journey. Track your progress, manage cravings, and build healthy habits.',
    icon: 'favorite',
  },
  {
    title: 'Daily Journal',
    description: 'Record your mood, triggers, and thoughts. Understanding patterns is the first step to lasting change.',
    icon: 'edit',
  },
  {
    title: 'Coping Tools',
    description: 'Access proven strategies and techniques to manage cravings and difficult moments.',
    icon: 'build',
  },
  {
    title: 'Track Progress',
    description: 'Visualize your journey with charts and insights. Celebrate every milestone, no matter how small.',
    icon: 'trending-up',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const completeOnboarding = async () => {
    setCompleting(true);
    try {
      console.log('[Onboarding] Marking user as onboarded...');
      await authenticatedPut('/api/user/profile', { onboarded: true });
      console.log('[Onboarding] User marked as onboarded');
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('[Onboarding] Failed to mark as onboarded:', error);
      // Still navigate even if the API call fails
      router.replace('/(tabs)/(home)/');
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const buttonText = isLastStep ? 'Get Started' : 'Next';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name={step.icon}
              size={64}
              color={themeColors.primary}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: themeColors.text }]}>{step.title}</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          {step.description}
        </Text>

        <View style={styles.dotsContainer}>
          {onboardingSteps.map((_, index) => {
            const isActive = index === currentStep;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? themeColors.primary : themeColors.border,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primary }]}
          onPress={handleNext}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{buttonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
