
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
import React, { useState, useEffect } from 'react';
import { JournalStats } from '@/types/models';

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

export default function ProgressScreen() {
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('Loading journal statistics...');
      // TODO: Backend Integration - GET /api/journal/stats → { totalEntries, cravingCount, resistedCount, partialCount, usedCount, commonTriggers, commonTools, averageIntensity }
      const data = await authenticatedGet<JournalStats>('/api/journal/stats');
      console.log('Loaded stats:', data);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stats || stats.totalEntries === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>
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

        {stats.commonTriggers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Common Triggers</Text>
            <View style={styles.triggersList}>
              {stats.commonTriggers.slice(0, 5).map((trigger, index) => (
                <View key={index} style={styles.triggerItem}>
                  <IconSymbol
                    ios_icon_name="warning"
                    android_material_icon_name="warning"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.triggerText}>{trigger}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {stats.commonTools.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Used Tools</Text>
            <View style={styles.triggersList}>
              {stats.commonTools.slice(0, 5).map((tool, index) => (
                <View key={index} style={styles.triggerItem}>
                  <IconSymbol
                    ios_icon_name="check"
                    android_material_icon_name="check"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.triggerText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
