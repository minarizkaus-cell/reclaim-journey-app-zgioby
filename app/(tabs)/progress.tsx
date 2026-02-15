
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';

interface MoodStats {
  moodCounts: {
    great: number;
    good: number;
    okay: number;
    struggling: number;
    difficult: number;
  };
  totalEntries: number;
  recentTriggers: string[];
}

const moodConfig = [
  { value: 'great', label: 'Great', emoji: '😊', color: '#4CAF50' },
  { value: 'good', label: 'Good', emoji: '🙂', color: '#8BC34A' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: '#FFC107' },
  { value: 'struggling', label: 'Struggling', emoji: '😔', color: '#FF9800' },
  { value: 'difficult', label: 'Difficult', emoji: '😢', color: '#F44336' },
];

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();

  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log('[Progress] Screen mounted, user:', user?.email);
    loadStats();
  }, []);

  const loadStats = async () => {
    console.log('[Progress] Loading stats...');
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await authenticatedGet<MoodStats>('/api/journal/stats');
      console.log('[Progress] Loaded stats:', data);
      setStats(data);
    } catch (error) {
      console.error('[Progress] Error loading stats:', error);
      setErrorMessage('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMoodPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: themeColors.text }]}>Progress</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Your recovery journey
            </Text>
          </View>
          <TouchableOpacity onPress={loadStats}>
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={24}
              color={themeColors.primary}
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: themeColors.error + '20' }]}>
            <Text style={[styles.errorText, { color: themeColors.error }]}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={themeColors.error}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {!stats || stats.totalEntries === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="chart.bar"
                android_material_icon_name="bar-chart"
                size={64}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No data yet
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                Start journaling to see your progress
              </Text>
            </View>
          ) : (
            <>
              {/* Total Entries Card */}
              <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios_icon_name="book.fill"
                    android_material_icon_name="book"
                    size={24}
                    color={themeColors.primary}
                  />
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    Total Entries
                  </Text>
                </View>
                <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                  {stats.totalEntries}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  journal entries recorded
                </Text>
              </View>

              {/* Mood Distribution */}
              <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios_icon_name="face.smiling"
                    android_material_icon_name="sentiment-satisfied"
                    size={24}
                    color={themeColors.primary}
                  />
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    Mood Distribution
                  </Text>
                </View>

                {moodConfig.map((mood) => {
                  const count = stats.moodCounts[mood.value as keyof typeof stats.moodCounts] || 0;
                  const percentage = getMoodPercentage(count, stats.totalEntries);

                  return (
                    <View key={mood.value} style={styles.moodRow}>
                      <View style={styles.moodInfo}>
                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                        <Text style={[styles.moodLabel, { color: themeColors.text }]}>
                          {mood.label}
                        </Text>
                      </View>
                      <View style={styles.moodStats}>
                        <View style={[styles.progressBarContainer, { backgroundColor: themeColors.highlight }]}>
                          <View
                            style={[
                              styles.progressBar,
                              { backgroundColor: mood.color, width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={[styles.moodCount, { color: themeColors.textSecondary }]}>
                          {count} ({percentage}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recent Triggers */}
              {stats.recentTriggers && stats.recentTriggers.length > 0 && (
                <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                  <View style={styles.cardHeader}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle.fill"
                      android_material_icon_name="warning"
                      size={24}
                      color={themeColors.primary}
                    />
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                      Common Triggers
                    </Text>
                  </View>
                  <View style={styles.triggersContainer}>
                    {stats.recentTriggers.map((trigger, index) => (
                      <View
                        key={index}
                        style={[styles.triggerChip, { backgroundColor: themeColors.highlight }]}
                      >
                        <Text style={[styles.triggerText, { color: themeColors.text }]}>
                          {trigger}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Insights */}
              <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios_icon_name="lightbulb.fill"
                    android_material_icon_name="lightbulb"
                    size={24}
                    color={themeColors.primary}
                  />
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    Insights
                  </Text>
                </View>
                <Text style={[styles.insightText, { color: themeColors.textSecondary }]}>
                  {getInsightMessage(stats)}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getInsightMessage(stats: MoodStats): string {
  const { moodCounts, totalEntries } = stats;
  const positiveCount = (moodCounts.great || 0) + (moodCounts.good || 0);
  const negativeCount = (moodCounts.struggling || 0) + (moodCounts.difficult || 0);
  const positivePercentage = Math.round((positiveCount / totalEntries) * 100);

  if (positivePercentage >= 70) {
    return "You're doing great! Keep up the positive momentum on your recovery journey.";
  } else if (positivePercentage >= 50) {
    return "You're making steady progress. Remember to celebrate small wins along the way.";
  } else if (negativeCount > positiveCount) {
    return "Recovery has its challenges. Consider reaching out to your support network or a professional.";
  } else {
    return "Every day is a new opportunity. Keep tracking your journey and stay committed to your recovery.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  moodCount: {
    fontSize: 12,
    width: 60,
    textAlign: 'right',
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
