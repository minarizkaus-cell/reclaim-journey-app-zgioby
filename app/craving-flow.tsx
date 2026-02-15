
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';

// Same trigger list as Journal Add
const COMMON_TRIGGERS = [
  'Stress',
  'Anxiety',
  'Social pressure',
  'Boredom',
  'Loneliness',
  'Anger',
  'Depression',
  'Celebration',
  'Fatigue',
  'Other',
];

// Need type options
const NEED_TYPES = [
  { id: 'distract', label: 'Distract', description: 'Take my mind off it', icon: 'sports-esports', color: '#81C784' },
  { id: 'calm', label: 'Calm', description: 'Reduce anxiety and stress', icon: 'air', color: '#64B5F6' },
  { id: 'support', label: 'Support', description: 'Connect with someone', icon: 'people', color: '#FFB74D' },
  { id: 'escape', label: 'Escape', description: 'Get away from triggers', icon: 'directions-walk', color: '#BA68C8' },
  { id: 'reflect', label: 'Reflect', description: 'Understand what I\'m feeling', icon: 'psychology', color: '#4DB6AC' },
];

type Step = 'triggers' | 'intensity' | 'need_type';

export default function CravingFlowScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const [step, setStep] = useState<Step>('triggers');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [needType, setNeedType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTrigger = (trigger: string) => {
    console.log('[CravingFlow] User toggled trigger:', trigger);
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleNextFromTriggers = () => {
    if (selectedTriggers.length === 0) {
      console.log('[CravingFlow] No triggers selected');
      return;
    }
    console.log('[CravingFlow] Moving to intensity step');
    setStep('intensity');
  };

  const handleNextFromIntensity = () => {
    if (intensity === null) {
      console.log('[CravingFlow] No intensity selected');
      return;
    }
    console.log('[CravingFlow] Moving to need_type step');
    setStep('need_type');
  };

  const handleComplete = async () => {
    if (!needType || intensity === null || selectedTriggers.length === 0) {
      console.log('[CravingFlow] Missing required fields');
      return;
    }

    setSaving(true);
    try {
      console.log('[CravingFlow] Creating craving session...', {
        triggers: selectedTriggers,
        intensity,
        need_type: needType,
      });

      const response = await authenticatedPost('/api/craving-sessions', {
        triggers: selectedTriggers,
        intensity: intensity,
        need_type: needType,
      });

      console.log('[CravingFlow] Craving session created:', response);

      // Navigate to Coping Tools with session ID
      router.push({
        pathname: '/(tabs)/coping-tools',
        params: { fromCravingFlow: 'true', sessionId: response.id },
      });
    } catch (error) {
      console.error('[CravingFlow] Failed to create craving session:', error);
      alert('Failed to save craving session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getTitleText = () => {
    switch (step) {
      case 'triggers':
        return 'What triggered this craving?';
      case 'intensity':
        return 'How intense is this craving?';
      case 'need_type':
        return 'What do you need right now?';
    }
  };

  const getSubtitleText = () => {
    switch (step) {
      case 'triggers':
        return 'Select all that apply';
      case 'intensity':
        return 'Rate from 1 (mild) to 10 (intense)';
      case 'need_type':
        return 'Choose what would help you most';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'triggers':
        return selectedTriggers.length > 0;
      case 'intensity':
        return intensity !== null;
      case 'need_type':
        return needType !== null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Craving Flow',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step === 'triggers' && styles.progressDotActive, { backgroundColor: step === 'triggers' ? themeColors.primary : themeColors.border }]} />
            <View style={[styles.progressLine, { backgroundColor: themeColors.border }]} />
            <View style={[styles.progressDot, step === 'intensity' && styles.progressDotActive, { backgroundColor: step === 'intensity' ? themeColors.primary : themeColors.border }]} />
            <View style={[styles.progressLine, { backgroundColor: themeColors.border }]} />
            <View style={[styles.progressDot, step === 'need_type' && styles.progressDotActive, { backgroundColor: step === 'need_type' ? themeColors.primary : themeColors.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>{getTitleText()}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {getSubtitleText()}
            </Text>
          </View>

          {/* Step 1: Triggers */}
          {step === 'triggers' && (
            <View style={styles.optionRow}>
              {COMMON_TRIGGERS.map((trigger) => {
                const isSelected = selectedTriggers.includes(trigger);
                return (
                  <TouchableOpacity
                    key={trigger}
                    style={[
                      styles.optionButton,
                      { backgroundColor: themeColors.card, borderColor: themeColors.border },
                      isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                    ]}
                    onPress={() => toggleTrigger(trigger)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: themeColors.text },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {trigger}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Step 2: Intensity */}
          {step === 'intensity' && (
            <View style={styles.intensityContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                const isSelected = intensity === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityButton,
                      { backgroundColor: themeColors.card, borderColor: themeColors.border },
                      isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                    ]}
                    onPress={() => {
                      console.log('[CravingFlow] User selected intensity:', level);
                      setIntensity(level);
                    }}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        { color: themeColors.text },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Step 3: Need Type */}
          {step === 'need_type' && (
            <View style={styles.needTypeContainer}>
              {NEED_TYPES.map((need) => {
                const isSelected = needType === need.id;
                return (
                  <TouchableOpacity
                    key={need.id}
                    style={[
                      styles.needTypeCard,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: isSelected ? need.color : themeColors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      console.log('[CravingFlow] User selected need type:', need.id);
                      setNeedType(need.id);
                    }}
                  >
                    <View style={[styles.needTypeIcon, { backgroundColor: `${need.color}20` }]}>
                      <IconSymbol
                        ios_icon_name="heart.fill"
                        android_material_icon_name={need.icon}
                        size={32}
                        color={need.color}
                      />
                    </View>
                    <View style={styles.needTypeInfo}>
                      <Text style={[styles.needTypeLabel, { color: themeColors.text }]}>{need.label}</Text>
                      <Text style={[styles.needTypeDescription, { color: themeColors.textSecondary }]}>
                        {need.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        <View style={[styles.actionContainer, { backgroundColor: themeColors.background }]}>
          {step !== 'triggers' && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: themeColors.border }]}
              onPress={() => {
                if (step === 'intensity') setStep('triggers');
                else if (step === 'need_type') setStep('intensity');
              }}
            >
              <Text style={[styles.backButtonText, { color: themeColors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: themeColors.primary },
              !canProceed() && styles.nextButtonDisabled,
            ]}
            onPress={() => {
              if (step === 'triggers') handleNextFromTriggers();
              else if (step === 'intensity') handleNextFromIntensity();
              else if (step === 'need_type') handleComplete();
            }}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 'need_type' ? 'Go to Coping Tools' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressLine: {
    width: 40,
    height: 2,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  needTypeContainer: {
    gap: 12,
  },
  needTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  needTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  needTypeInfo: {
    flex: 1,
  },
  needTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  needTypeDescription: {
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
