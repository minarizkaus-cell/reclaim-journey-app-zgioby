
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface CopingTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: string[];
}

const copingTools: CopingTool[] = [
  {
    id: '1',
    title: 'Deep Breathing',
    description: 'Calm your mind and body with controlled breathing',
    icon: 'air',
    steps: [
      'Find a comfortable position',
      'Breathe in slowly through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale slowly through your mouth for 6 counts',
      'Repeat 5-10 times',
    ],
  },
  {
    id: '2',
    title: 'Grounding Exercise',
    description: 'Connect with the present moment using your senses',
    icon: 'visibility',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
  },
  {
    id: '3',
    title: 'Progressive Muscle Relaxation',
    description: 'Release tension by tensing and relaxing muscle groups',
    icon: 'self-improvement',
    steps: [
      'Start with your feet, tense for 5 seconds',
      'Release and notice the relaxation',
      'Move up to your calves, repeat',
      'Continue through each muscle group',
      'End with your face and head',
    ],
  },
  {
    id: '4',
    title: 'Positive Affirmations',
    description: 'Reinforce your strength and commitment',
    icon: 'favorite',
    steps: [
      'I am strong and capable',
      'I choose health and wellness',
      'Every day I am getting better',
      'I deserve a life of recovery',
      'I am proud of my progress',
    ],
  },
  {
    id: '5',
    title: 'Distraction Techniques',
    description: 'Redirect your focus to healthy activities',
    icon: 'sports-esports',
    steps: [
      'Call a supportive friend or family member',
      'Go for a walk or exercise',
      'Listen to your favorite music',
      'Engage in a hobby or creative activity',
      'Watch a funny video or movie',
    ],
  },
  {
    id: '6',
    title: 'Urge Surfing',
    description: 'Ride out cravings without giving in',
    icon: 'waves',
    steps: [
      'Acknowledge the craving without judgment',
      'Notice where you feel it in your body',
      'Observe how it changes over time',
      'Remember: cravings peak and then subside',
      'Wait 15-20 minutes before making any decisions',
    ],
  },
];

export default function CopingToolsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Coping Tools</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Strategies to help you through difficult moments
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {copingTools.map((tool) => {
          const isExpanded = expandedId === tool.id;

          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
              onPress={() => toggleExpand(tool.id)}
              activeOpacity={0.7}
            >
              <View style={styles.toolHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${themeColors.primary}20` }]}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name={tool.icon}
                    size={28}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: themeColors.text }]}>{tool.title}</Text>
                  <Text style={[styles.toolDescription, { color: themeColors.textSecondary }]}>
                    {tool.description}
                  </Text>
                </View>
                <IconSymbol
                  ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={themeColors.textSecondary}
                />
              </View>

              {isExpanded && (
                <View style={styles.stepsContainer}>
                  <Text style={[styles.stepsTitle, { color: themeColors.text }]}>Steps:</Text>
                  {tool.steps.map((step, index) => {
                    const stepNumber = `${index + 1}`;
                    return (
                      <View key={index} style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.stepNumberText}>{stepNumber}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>{step}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={[styles.emergencyCard, { backgroundColor: themeColors.card, borderColor: themeColors.primary, borderWidth: 2 }]}>
          <IconSymbol
            ios_icon_name="phone.fill"
            android_material_icon_name="phone"
            size={32}
            color={themeColors.primary}
          />
          <Text style={[styles.emergencyTitle, { color: themeColors.text }]}>Need Immediate Help?</Text>
          <Text style={[styles.emergencyText, { color: themeColors.textSecondary }]}>
            If you're in crisis, please reach out to a professional or call a helpline.
          </Text>
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: themeColors.primary }]}
            onPress={() => console.log('Emergency resources tapped')}
          >
            <Text style={styles.emergencyButtonText}>View Resources</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  toolCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
  },
  stepsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
