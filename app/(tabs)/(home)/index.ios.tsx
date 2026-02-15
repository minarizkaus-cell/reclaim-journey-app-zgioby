
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { authenticatedGet } from '@/utils/api';
import { JournalEntry } from '@/types/models';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  entriesList: {
    padding: 20,
    paddingTop: 0,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cravingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cravingText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  triggerChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  triggerText: {
    fontSize: 12,
    color: colors.text,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      console.log('Loading journal entries...');
      // TODO: Backend Integration - GET /api/journal → [{ id, created_at, had_craving, triggers, intensity, tools_used, outcome, notes }]
      const data = await authenticatedGet<JournalEntry[]>('/api/journal');
      console.log('Loaded entries:', data);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'resisted':
        return '#4CAF50';
      case 'partial':
        return '#FF9800';
      case 'used':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'resisted':
        return 'check-circle';
      case 'partial':
        return 'warning';
      case 'used':
        return 'error';
      default:
        return 'info';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'resisted':
        return 'Resisted';
      case 'partial':
        return 'Partial';
      case 'used':
        return 'Used';
      default:
        return outcome;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = user?.display_name || user?.email || 'there';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Journal',
          headerLargeTitle: true,
        }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          console.log('User tapped Add Entry button');
          router.push('/journal-add');
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.addButtonText}>Add Entry</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.entriesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="book"
              android_material_icon_name="menu-book"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No journal entries yet.{'\n'}Tap "Add Entry" to get started.
            </Text>
          </View>
        ) : (
          entries.map((entry) => {
            const outcomeColor = getOutcomeColor(entry.outcome);
            const outcomeIcon = getOutcomeIcon(entry.outcome);
            const outcomeLabel = getOutcomeLabel(entry.outcome);
            const dateDisplay = formatDate(entry.created_at);
            const timeDisplay = formatTime(entry.created_at);
            const cravingLabel = entry.had_craving ? 'Had craving' : 'No craving';
            const intensityLabel = entry.intensity !== undefined && entry.intensity !== null
              ? `Intensity: ${entry.intensity}/10`
              : null;

            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => {
                  console.log('User tapped journal entry:', entry.id);
                  router.push(`/journal-detail?id=${entry.id}`);
                }}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.outcomeContainer}>
                    <IconSymbol
                      ios_icon_name={outcomeIcon}
                      android_material_icon_name={outcomeIcon}
                      size={24}
                      color={outcomeColor}
                    />
                    <Text style={[styles.outcomeText, { color: outcomeColor }]}>
                      {outcomeLabel}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {dateDisplay}
                  </Text>
                </View>

                <View style={styles.cravingRow}>
                  <IconSymbol
                    ios_icon_name="info"
                    android_material_icon_name="info"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.cravingText}>{cravingLabel}</Text>
                </View>

                {intensityLabel && (
                  <View style={styles.intensityRow}>
                    <IconSymbol
                      ios_icon_name="chart"
                      android_material_icon_name="show-chart"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.intensityText}>{intensityLabel}</Text>
                  </View>
                )}

                {entry.triggers.length > 0 && (
                  <View style={styles.triggersContainer}>
                    {entry.triggers.map((trigger, index) => (
                      <View key={index} style={styles.triggerChip}>
                        <Text style={styles.triggerText}>{trigger}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {entry.notes && (
                  <Text style={styles.notesText} numberOfLines={2}>
                    {entry.notes}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
