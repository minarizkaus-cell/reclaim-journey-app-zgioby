
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';
import { User, JournalEntry } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';

export default function ProgressScreen() {
  const [profile, setProfile] = useState<User | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[Progress] Loading profile and journal entries...');
      const [profileData, journalData] = await Promise.all([
        authenticatedGet<User>('/api/user/profile'),
        authenticatedGet<JournalEntry[]>('/api/journal'),
      ]);
      console.log('[Progress] Loaded profile and', journalData.length, 'journal entries');
      setProfile(profileData);
      setJournalEntries(journalData);
    } catch (error) {
      console.error('[Progress] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sobrietyDays = useMemo(() => {
    if (!profile?.sobriety_date) {
      return 0;
    }
    const sobrietyDate = dayjs(profile.sobriety_date);
    const today = dayjs();
    return today.diff(sobrietyDate, 'day');
  }, [profile]);

  const moodData = useMemo(() => {
    const last7Days = journalEntries
      .slice(0, 7)
      .reverse()
      .map(entry => {
        const moodValue = entry.mood === 'great' ? 5 : entry.mood === 'good' ? 4 : entry.mood === 'okay' ? 3 : entry.mood === 'struggling' ? 2 : 1;
        return moodValue;
      });

    while (last7Days.length < 7) {
      last7Days.unshift(3);
    }

    return last7Days;
  }, [journalEntries]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const sobrietyDaysText = `${sobrietyDays}`;
  const journalCountText = `${journalEntries.length}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={32}
            color={themeColors.primary}
          />
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {sobrietyDaysText}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Days Sober
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <IconSymbol
            ios_icon_name="book.fill"
            android_material_icon_name="book"
            size={32}
            color={themeColors.secondary}
          />
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {journalCountText}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Journal Entries
          </Text>
        </View>

        <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.chartTitle, { color: themeColors.text }]}>
            Mood Trend (Last 7 Days)
          </Text>
          <LineChart
            data={{
              labels: ['', '', '', '', '', '', ''],
              datasets: [
                {
                  data: moodData,
                },
              ],
            }}
            width={Dimensions.get('window').width - 80}
            height={200}
            chartConfig={{
              backgroundColor: themeColors.card,
              backgroundGradientFrom: themeColors.card,
              backgroundGradientTo: themeColors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(77, 170, 140, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(168, 176, 186, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: themeColors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  statValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
