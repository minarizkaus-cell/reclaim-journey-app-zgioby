
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Calendar',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={64}
              color={themeColors.primary}
            />
            <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
              Calendar & Reminders
            </Text>
            <Text style={[styles.comingSoonText, { color: themeColors.textSecondary }]}>
              Set reminders for check-ins, appointments, and important milestones on your recovery journey.
            </Text>
            <Text style={[styles.comingSoonBadge, { color: themeColors.primary }]}>
              Coming Soon
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={[styles.featureCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Daily Check-ins</Text>
              <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
                Get reminded to log your mood and progress
              </Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={32}
                color={themeColors.success}
              />
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Milestones</Text>
              <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
                Track and celebrate your achievements
              </Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="event"
                size={32}
                color={themeColors.warning}
              />
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Appointments</Text>
              <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
                Never miss therapy or support group meetings
              </Text>
            </View>
          </View>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  comingSoonCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  comingSoonBadge: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
