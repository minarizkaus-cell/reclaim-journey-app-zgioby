
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const urgencyLevels = [
  { id: 1, label: 'Mild', description: 'I can manage this', color: '#81C784' },
  { id: 2, label: 'Moderate', description: 'It\'s getting stronger', color: '#FFD54F' },
  { id: 3, label: 'Strong', description: 'I need help now', color: '#FFB74D' },
  { id: 4, label: 'Intense', description: 'This is very difficult', color: '#E57373' },
];

const copingStrategies = [
  { id: '1', title: 'Call Support Person', icon: 'phone', action: 'call' },
  { id: '2', title: 'Deep Breathing', icon: 'air', action: 'breathing' },
  { id: '3', title: 'Go for a Walk', icon: 'directions-walk', action: 'walk' },
  { id: '4', title: 'Distraction Activity', icon: 'sports-esports', action: 'distract' },
];

export default function CravingFlowScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [selectedUrgency, setSelectedUrgency] = useState<number | null>(null);
  const [step, setStep] = useState<'urgency' | 'strategies'>('urgency');

  const handleUrgencySelect = (level: number) => {
    console.log('Craving urgency selected:', level);
    setSelectedUrgency(level);
    setStep('strategies');
  };

  const handleStrategySelect = (strategyId: string) => {
    console.log('Coping strategy selected:', strategyId);
    router.push('/(tabs)/coping-tools');
  };

  const titleText = step === 'urgency' ? 'How urgent is this craving?' : 'Choose a coping strategy';
  const subtitleText = step === 'urgency' 
    ? 'Be honest with yourself - there\'s no wrong answer'
    : 'Pick what feels right for you right now';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Craving Support',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>{titleText}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {subtitleText}
            </Text>
          </View>

          {step === 'urgency' ? (
            <View style={styles.urgencyContainer}>
              {urgencyLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.urgencyCard,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: selectedUrgency === level.id ? level.color : themeColors.border,
                      borderWidth: selectedUrgency === level.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleUrgencySelect(level.id)}
                >
                  <View style={[styles.urgencyIndicator, { backgroundColor: level.color }]} />
                  <View style={styles.urgencyInfo}>
                    <Text style={[styles.urgencyLabel, { color: themeColors.text }]}>{level.label}</Text>
                    <Text style={[styles.urgencyDescription, { color: themeColors.textSecondary }]}>
                      {level.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.strategiesContainer}>
              {copingStrategies.map((strategy) => (
                <TouchableOpacity
                  key={strategy.id}
                  style={[styles.strategyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                  onPress={() => handleStrategySelect(strategy.id)}
                >
                  <View style={[styles.strategyIcon, { backgroundColor: `${themeColors.primary}20` }]}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name={strategy.icon}
                      size={32}
                      color={themeColors.primary}
                    />
                  </View>
                  <Text style={[styles.strategyTitle, { color: themeColors.text }]}>{strategy.title}</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              ))}

              <View style={[styles.emergencyCard, { backgroundColor: themeColors.card, borderColor: themeColors.primary, borderWidth: 2 }]}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={32}
                  color={themeColors.primary}
                />
                <Text style={[styles.emergencyTitle, { color: themeColors.text }]}>
                  In Crisis?
                </Text>
                <Text style={[styles.emergencyText, { color: themeColors.textSecondary }]}>
                  If you're in immediate danger, please call emergency services or a crisis helpline.
                </Text>
                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => router.push('/resources')}
                >
                  <Text style={styles.emergencyButtonText}>Emergency Resources</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
  header: {
    marginTop: 20,
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
  urgencyContainer: {
    gap: 12,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  urgencyIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  urgencyDescription: {
    fontSize: 14,
  },
  strategiesContainer: {
    gap: 12,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  strategyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  strategyTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  emergencyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
