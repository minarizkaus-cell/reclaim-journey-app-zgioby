
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
import { LineChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import { User, JournalEntry } from '@/types/models';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load user profile and journal entries
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Progress: Loading user profile and journal entries');
    setLoading(true);
    try {
      const [profileData, entriesData] = await Promise.all([
        authenticatedGet<User>('/api/user/profile'),
        authenticatedGet<JournalEntry[]>('/api/journal'),
      ]);
      console.log('Progress: Profile loaded:', profileData);
      console.log('Progress: Entries loaded:', entriesData?.length || 0, 'entries');
      setUserProfile(profileData);
      setJournalEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (error) {
      console.error('Progress: Error loading data:', error);
      setUserProfile(null);
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate sobriety streak (days since sobriety_date)
  const sobrietyStreak = useMemo(() => {
    if (!userProfile?.sobriety_date) return null;
    const start = dayjs(userProfile.sobriety_date);
    if (!start.isValid()) return null;
    const days = dayjs().diff(start, 'days');
    console.log('Progress: Sobriety streak calculated:', days, 'days');
    return days;
  }, [userProfile]);

  // Calculate cravings this week (last 7 days)
  const cravingsThisWeek = useMemo(() => {
    if (!Array.isArray(journalEntries) || journalEntries.length === 0) return 0;
    const sevenDaysAgo = dayjs().subtract(7, 'days');
    const count = journalEntries.filter(entry =>
      entry.had_craving && dayjs(entry.created_at).isAfter(sevenDaysAgo)
    ).length;
    console.log('Progress: Cravings this week:', count);
    return count;
  }, [journalEntries]);

  // Calculate average intensity this week (only entries with had_craving=true)
  const avgIntensityThisWeek = useMemo(() => {
    if (!Array.isArray(journalEntries) || journalEntries.length === 0) return null;
    const sevenDaysAgo = dayjs().subtract(7, 'days');
    const relevantEntries = journalEntries.filter(entry =>
      entry.had_craving &&
      typeof entry.intensity === 'number' &&
      dayjs(entry.created_at).isAfter(sevenDaysAgo)
    );
    if (relevantEntries.length === 0) return null;
    const totalIntensity = relevantEntries.reduce((sum, entry) => sum + (entry.intensity || 0), 0);
    const avg = parseFloat((totalIntensity / relevantEntries.length).toFixed(1));
    console.log('Progress: Average intensity this week:', avg);
    return avg;
  }, [journalEntries]);

  // Calculate days since last used (based on outcome='used')
  const daysSinceLastUsed = useMemo(() => {
    if (!Array.isArray(journalEntries) || journalEntries.length === 0) return null;
    const usedEntries = journalEntries
      .filter(entry => entry.outcome === 'used' && dayjs(entry.created_at).isValid())
      .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());

    if (usedEntries.length === 0) return null;
    const lastUsedDate = dayjs(usedEntries[0].created_at);
    const days = dayjs().diff(lastUsedDate, 'days');
    console.log('Progress: Days since last used:', days);
    return days;
  }, [journalEntries]);

  // Calculate most used tools (top 3 from tools_used array)
  const mostUsedTools = useMemo(() => {
    if (!Array.isArray(journalEntries) || journalEntries.length === 0) return [];
    const toolCounts: { [tool: string]: number } = {};

    journalEntries.forEach(entry => {
      const tools = entry.tools_used;
      if (Array.isArray(tools)) {
        tools.forEach(tool => {
          if (typeof tool === 'string' && tool.trim() !== '') {
            toolCounts[tool] = (toolCounts[tool] || 0) + 1;
          }
        });
      }
    });

    const topTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    console.log('Progress: Most used tools:', topTools);
    return topTools;
  }, [journalEntries]);

  // Calculate most common triggers (top 3 from triggers array)
  const mostCommonTriggers = useMemo(() => {
    if (!Array.isArray(journalEntries) || journalEntries.length === 0) return [];
    const triggerCounts: { [trigger: string]: number } = {};

    journalEntries.forEach(entry => {
      const triggers = entry.triggers;
      if (Array.isArray(triggers)) {
        triggers.forEach(trigger => {
          if (typeof trigger === 'string' && trigger.trim() !== '') {
            triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
          }
        });
      }
    });

    const topTriggers = Object.entries(triggerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    console.log('Progress: Most common triggers:', topTriggers);
    return topTriggers;
  }, [journalEntries]);

  // Calculate 7-day cravings chart data (daily counts)
  const cravingsChartData = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(6, 'days').startOf('day');
    const dailyCravings: { [date: string]: number } = {};
    const labels: string[] = [];
    const data: number[] = [];

    // Initialize counts for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = sevenDaysAgo.add(i, 'days');
      const dateKey = date.format('YYYY-MM-DD');
      dailyCravings[dateKey] = 0;
      labels.push(date.format('ddd'));
    }

    // Populate counts from entries
    if (Array.isArray(journalEntries)) {
      journalEntries.forEach(entry => {
        if (entry.had_craving && dayjs(entry.created_at).isAfter(sevenDaysAgo)) {
          const dateKey = dayjs(entry.created_at).format('YYYY-MM-DD');
          if (Object.prototype.hasOwnProperty.call(dailyCravings, dateKey)) {
            dailyCravings[dateKey]++;
          }
        }
      });
    }

    // Extract data in order
    for (let i = 0; i < 7; i++) {
      const date = sevenDaysAgo.add(i, 'days');
      const dateKey = date.format('YYYY-MM-DD');
      data.push(dailyCravings[dateKey]);
    }

    console.log('Progress: Chart data:', { labels, data });
    return { labels, data };
  }, [journalEntries]);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? colors.dark.background : colors.light.background;
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const cardBg = isDark ? colors.dark.card : colors.light.card;
  const accentColor = isDark ? colors.dark.accent : colors.light.accent;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </SafeAreaView>
    );
  }

  const sobrietyStreakDisplay = sobrietyStreak !== null ? `${sobrietyStreak}` : 'N/A';
  const cravingsThisWeekDisplay = `${cravingsThisWeek}`;
  const avgIntensityDisplay = avgIntensityThisWeek !== null ? `${avgIntensityThisWeek}/10` : 'N/A';
  const daysSinceLastUsedDisplay = daysSinceLastUsed !== null ? `${daysSinceLastUsed}` : 'N/A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Your Progress</Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Sobriety Streak */}
          {sobrietyStreak !== null && (
            <View style={[styles.metricCard, { backgroundColor: cardBg }]}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={32}
                color={accentColor}
              />
              <Text style={[styles.metricValue, { color: textColor }]}>
                {sobrietyStreakDisplay}
              </Text>
              <Text style={[styles.metricLabel, { color: textColor }]}>Days Sober</Text>
            </View>
          )}

          {/* Cravings This Week */}
          <View style={[styles.metricCard, { backgroundColor: cardBg }]}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="show-chart"
              size={32}
              color={accentColor}
            />
            <Text style={[styles.metricValue, { color: textColor }]}>
              {cravingsThisWeekDisplay}
            </Text>
            <Text style={[styles.metricLabel, { color: textColor }]}>Cravings This Week</Text>
          </View>

          {/* Average Intensity */}
          {avgIntensityThisWeek !== null && (
            <View style={[styles.metricCard, { backgroundColor: cardBg }]}>
              <IconSymbol
                ios_icon_name="gauge"
                android_material_icon_name="speed"
                size={32}
                color={accentColor}
              />
              <Text style={[styles.metricValue, { color: textColor }]}>
                {avgIntensityDisplay}
              </Text>
              <Text style={[styles.metricLabel, { color: textColor }]}>Avg Intensity</Text>
            </View>
          )}

          {/* Days Since Last Used */}
          {daysSinceLastUsed !== null && (
            <View style={[styles.metricCard, { backgroundColor: cardBg }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={32}
                color={accentColor}
              />
              <Text style={[styles.metricValue, { color: textColor }]}>
                {daysSinceLastUsedDisplay}
              </Text>
              <Text style={[styles.metricLabel, { color: textColor }]}>Days Since Last Used</Text>
            </View>
          )}
        </View>

        {/* 7-Day Cravings Chart */}
        {cravingsChartData.data.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Cravings This Week</Text>
            <LineChart
              data={{
                labels: cravingsChartData.labels,
                datasets: [{ data: cravingsChartData.data }],
              }}
              width={Dimensions.get('window').width - 48}
              height={220}
              chartConfig={{
                backgroundColor: cardBg,
                backgroundGradientFrom: cardBg,
                backgroundGradientTo: cardBg,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(${isDark ? '100, 200, 255' : '0, 122, 255'}, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: accentColor,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Most Used Tools */}
        {mostUsedTools.length > 0 && (
          <View style={[styles.listCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Most Used Tools</Text>
            {mostUsedTools.map((tool, index) => {
              const toolName = tool.name;
              const toolCount = `${tool.count}`;
              return (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <IconSymbol
                      ios_icon_name="wrench"
                      android_material_icon_name="build"
                      size={20}
                      color={accentColor}
                    />
                    <Text style={[styles.listItemText, { color: textColor }]}>{toolName}</Text>
                  </View>
                  <Text style={[styles.listItemCount, { color: textColor }]}>{toolCount}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Most Common Triggers */}
        {mostCommonTriggers.length > 0 && (
          <View style={[styles.listCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Most Common Triggers</Text>
            {mostCommonTriggers.map((trigger, index) => {
              const triggerName = trigger.name;
              const triggerCount = `${trigger.count}`;
              return (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle"
                      android_material_icon_name="warning"
                      size={20}
                      color={accentColor}
                    />
                    <Text style={[styles.listItemText, { color: textColor }]}>{triggerName}</Text>
                  </View>
                  <Text style={[styles.listItemCount, { color: textColor }]}>{triggerCount}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {journalEntries.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="show-chart"
              size={64}
              color={textColor}
            />
            <Text style={[styles.emptyStateText, { color: textColor }]}>
              No journal entries yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: textColor }]}>
              Start journaling to track your progress
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  listItemCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.7,
  },
});
