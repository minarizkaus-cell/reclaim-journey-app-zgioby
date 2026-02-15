
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { JournalStats, User, JournalEntry } from '@/types/models';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  scrollContent: {
    padding: 20,
  },
  streakCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  outcomeBar: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  outcomeBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  triggersList: {
    gap: 8,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  triggerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  insightText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

function getInsightMessage(stats: JournalStats): string {
  if (stats.totalEntries === 0) {
    return 'Start journaling to track your progress and gain insights into your recovery journey.';
  }

  const resistRate = stats.totalEntries > 0 ? (stats.resistedCount / stats.totalEntries) * 100 : 0;

  if (resistRate >= 80) {
    return `Excellent work! You've resisted ${resistRate.toFixed(0)}% of the time. Your commitment to recovery is inspiring.`;
  } else if (resistRate >= 60) {
    return `You're making good progress with a ${resistRate.toFixed(0)}% resistance rate. Keep using your coping tools!`;
  } else if (resistRate >= 40) {
    return `You're building momentum. Focus on the tools that work best for you and reach out for support when needed.`;
  } else {
    return 'Recovery is a journey with ups and downs. Every entry is a step forward. Consider reaching out to your sponsor or support network.';
  }
}

function calculateStreak(sobrietyDate: string | undefined): number | null {
  if (!sobrietyDate) {
    return null;
  }

  const sobrietyDateObj = new Date(sobrietyDate);
  const today = new Date();
  
  // Reset time to midnight for accurate day calculation
  sobrietyDateObj.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - sobrietyDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function calculateAvgIntensityThisWeek(journalEntries: JournalEntry[]): number | null {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const relevantEntries = journalEntries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    return (
      entry.had_craving &&
      entry.intensity !== null &&
      entry.intensity !== undefined &&
      entryDate >= sevenDaysAgo
    );
  });

  if (relevantEntries.length === 0) {
    return null;
  }

  const totalIntensity = relevantEntries.reduce((sum, entry) => sum + (entry.intensity || 0), 0);
  const avgIntensity = totalIntensity / relevantEntries.length;
  
  console.log('[Progress] Calculated avg intensity (7d):', avgIntensity, 'from', relevantEntries.length, 'entries');
  
  return avgIntensity;
}

function calculateCravingsThisWeek(journalEntries: JournalEntry[]): number {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const cravingsCount = journalEntries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    return entry.had_craving && entryDate >= sevenDaysAgo;
  }).length;

  console.log('[Progress] Calculated cravings this week:', cravingsCount);
  
  return cravingsCount;
}

function calculateDaysSinceLastUsed(journalEntries: JournalEntry[]): number | null {
  // Find all entries where outcome = 'used'
  const usedEntries = journalEntries.filter(entry => entry.outcome === 'used');
  
  if (usedEntries.length === 0) {
    console.log('[Progress] No entries with outcome="used" found');
    return null;
  }

  // Sort by created_at descending to get the most recent
  const sortedUsedEntries = usedEntries.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const mostRecentUsedEntry = sortedUsedEntries[0];
  const usedDate = new Date(mostRecentUsedEntry.created_at);
  const today = new Date();
  
  // Reset time to midnight for accurate day calculation
  usedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - usedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  console.log('[Progress] Days since last used:', diffDays, 'from entry:', mostRecentUsedEntry.id);
  
  return diffDays;
}

function calculateMostUsedTools(journalEntries: JournalEntry[]): Array<{ tool: string; count: number }> {
  const toolCounts: { [key: string]: number } = {};

  journalEntries.forEach(entry => {
    if (entry.tools_used && Array.isArray(entry.tools_used)) {
      entry.tools_used.forEach(tool => {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      });
    }
  });

  const sortedTools = Object.entries(toolCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3)
    .map(([tool, count]) => ({ tool, count }));

  console.log('[Progress] Most used tools:', sortedTools);
  
  return sortedTools;
}

function calculateMostCommonTriggers(journalEntries: JournalEntry[]): Array<{ trigger: string; count: number }> {
  const triggerCounts: { [key: string]: number } = {};

  journalEntries.forEach(entry => {
    if (entry.triggers && Array.isArray(entry.triggers)) {
      entry.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    }
  });

  const sortedTriggers = Object.entries(triggerCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3)
    .map(([trigger, count]) => ({ trigger, count }));

  console.log('[Progress] Most common triggers:', sortedTriggers);
  
  return sortedTriggers;
}

export default function ProgressScreen() {
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[Progress] Loading journal statistics, entries, and profile...');
      
      // Load stats
      const statsData = await authenticatedGet<JournalStats>('/api/journal/stats');
      console.log('[Progress] Loaded stats:', statsData);
      setStats(statsData);
      
      // Load journal entries for weekly calculations
      const entriesData = await authenticatedGet<JournalEntry[]>('/api/journal/entries');
      console.log('[Progress] Loaded journal entries:', entriesData.length, 'entries');
      setJournalEntries(entriesData);
      
      // Load profile for sobriety_date
      const profileData = await authenticatedGet<User>('/api/user/profile');
      console.log('[Progress] Loaded profile:', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('[Progress] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  // Memoized calculations
  const currentStreak = useMemo(() => calculateStreak(profile?.sobriety_date), [profile?.sobriety_date]);
  const cravingsThisWeek = useMemo(() => calculateCravingsThisWeek(journalEntries), [journalEntries]);
  const avgIntensityThisWeek = useMemo(() => calculateAvgIntensityThisWeek(journalEntries), [journalEntries]);
  const daysSinceLastUsed = useMemo(() => calculateDaysSinceLastUsed(journalEntries), [journalEntries]);
  const mostUsedTools = useMemo(() => calculateMostUsedTools(journalEntries), [journalEntries]);
  const mostCommonTriggers = useMemo(() => calculateMostCommonTriggers(journalEntries), [journalEntries]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const streakDaysText = currentStreak === 1 ? 'Day' : 'Days';
  const streakSubtitleText = 'Days of sobriety';
  
  const avgIntensityWeekDisplay = avgIntensityThisWeek !== null 
    ? avgIntensityThisWeek.toFixed(1) 
    : null;

  if (!stats || stats.totalEntries === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>
        <ScrollView style={styles.scrollContent}>
          {/* Show streak even if no journal entries */}
          {currentStreak !== null && (
            <View style={styles.streakCard}>
              <IconSymbol
                ios_icon_name="flame"
                android_material_icon_name="local-fire-department"
                size={48}
                color="#FFFFFF"
              />
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>{streakDaysText}</Text>
              <Text style={styles.streakSubtitle}>{streakSubtitleText}</Text>
            </View>
          )}
          
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="chart"
              android_material_icon_name="show-chart"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No data yet.{'\n'}Start journaling to see your progress.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const insightMessage = getInsightMessage(stats);
  const resistedPercentage = getMoodPercentage(stats.resistedCount, stats.totalEntries);
  const partialPercentage = getMoodPercentage(stats.partialCount, stats.totalEntries);
  const usedPercentage = getMoodPercentage(stats.usedCount, stats.totalEntries);
  const averageIntensityDisplay = stats.averageIntensity > 0 
    ? stats.averageIntensity.toFixed(1) 
    : 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Current Streak Card - Only show if sobriety_date exists */}
        {currentStreak !== null && (
          <View style={styles.streakCard}>
            <IconSymbol
              ios_icon_name="flame"
              android_material_icon_name="local-fire-department"
              size={48}
              color="#FFFFFF"
            />
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>{streakDaysText}</Text>
            <Text style={styles.streakSubtitle}>{streakSubtitleText}</Text>
          </View>
        )}

        <View style={styles.insightCard}>
          <Text style={styles.insightText}>{insightMessage}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="book"
                android_material_icon_name="menu-book"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.statValue}>{stats.totalEntries}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="warning"
                android_material_icon_name="warning"
                size={32}
                color="#FF9800"
              />
              <Text style={styles.statValue}>{stats.cravingCount}</Text>
              <Text style={styles.statLabel}>Cravings</Text>
            </View>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="chart"
                android_material_icon_name="show-chart"
                size={32}
                color="#4CAF50"
              />
              <Text style={styles.statValue}>{averageIntensityDisplay}</Text>
              <Text style={styles.statLabel}>Avg Intensity</Text>
            </View>
          </View>
        </View>

        {/* Weekly Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="warning"
                android_material_icon_name="warning"
                size={32}
                color="#FF9800"
              />
              <Text style={styles.statValue}>{cravingsThisWeek}</Text>
              <Text style={styles.statLabel}>Cravings This Week</Text>
            </View>
            {avgIntensityWeekDisplay !== null && (
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="chart"
                  android_material_icon_name="show-chart"
                  size={32}
                  color="#2196F3"
                />
                <Text style={styles.statValue}>{avgIntensityWeekDisplay}</Text>
                <Text style={styles.statLabel}>Avg Intensity (7d)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Days Since Last Used Card - Only show if there's a 'used' entry */}
        {daysSinceLastUsed !== null && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recovery Milestone</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={32}
                  color="#4CAF50"
                />
                <Text style={styles.statValue}>{daysSinceLastUsed}</Text>
                <Text style={styles.statLabel}>Days Since Last Used</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outcomes</Text>
          {stats.resistedCount > 0 && (
            <View
              style={[
                styles.outcomeBar,
                { backgroundColor: '#4CAF50', width: `${resistedPercentage}%` },
              ]}
            >
              <Text style={styles.outcomeBarText}>
                Resisted {resistedPercentage}%
              </Text>
            </View>
          )}
          {stats.partialCount > 0 && (
            <View
              style={[
                styles.outcomeBar,
                { backgroundColor: '#FF9800', width: `${partialPercentage}%` },
              ]}
            >
              <Text style={styles.outcomeBarText}>
                Partial {partialPercentage}%
              </Text>
            </View>
          )}
          {stats.usedCount > 0 && (
            <View
              style={[
                styles.outcomeBar,
                { backgroundColor: colors.primary, width: `${usedPercentage}%` },
              ]}
            >
              <Text style={styles.outcomeBarText}>
                Used {usedPercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* Most Used Tools - Calculated from journal entries */}
        {mostUsedTools.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Used Tools</Text>
            <View style={styles.triggersList}>
              {mostUsedTools.map((item, index) => (
                <View key={index} style={styles.triggerItem}>
                  <IconSymbol
                    ios_icon_name="check"
                    android_material_icon_name="check"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.triggerText}>{item.tool}</Text>
                  <Text style={styles.triggerCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Most Common Triggers - NEW SECTION */}
        {mostCommonTriggers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Common Triggers</Text>
            <View style={styles.triggersList}>
              {mostCommonTriggers.map((item, index) => (
                <View key={index} style={styles.triggerItem}>
                  <IconSymbol
                    ios_icon_name="warning"
                    android_material_icon_name="warning"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.triggerText}>{item.trigger}</Text>
                  <Text style={styles.triggerCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
