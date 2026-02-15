
import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';

interface JournalEntry {
  id: string;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'difficult';
  triggers: string[];
  notes: string;
  createdAt: string;
}

export default function JournalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      console.log('Loading all journal entries...');
      const data = await authenticatedGet<JournalEntry[]>('/api/journal');
      console.log('Journal entries loaded:', data);
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const getMoodColor = (mood: string) => {
    const moodKey = `mood${mood.charAt(0).toUpperCase() + mood.slice(1)}` as keyof typeof themeColors;
    return themeColors[moodKey] || themeColors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Journal',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/journal-add')}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color={themeColors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : entries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={64}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No journal entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                Start tracking your journey by adding your first entry
              </Text>
            </View>
          ) : (
            entries.map((entry) => {
              const moodColor = getMoodColor(entry.mood);
              const dateText = formatDate(entry.createdAt);
              const timeText = formatTime(entry.createdAt);
              const moodText = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                  onPress={() => router.push(`/journal-detail?id=${entry.id}`)}
                >
                  <View style={styles.entryHeader}>
                    <View style={[styles.moodIndicator, { backgroundColor: moodColor }]} />
                    <View style={styles.entryInfo}>
                      <Text style={[styles.entryMood, { color: themeColors.text }]}>{moodText}</Text>
                      <View style={styles.dateRow}>
                        <Text style={[styles.entryDate, { color: themeColors.textSecondary }]}>
                          {dateText}
                        </Text>
                        <Text style={[styles.entryDate, { color: themeColors.textSecondary }]}>
                          {' • '}
                        </Text>
                        <Text style={[styles.entryDate, { color: themeColors.textSecondary }]}>
                          {timeText}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </View>
                  {entry.notes && (
                    <Text style={[styles.entryNotes, { color: themeColors.textSecondary }]} numberOfLines={2}>
                      {entry.notes}
                    </Text>
                  )}
                  {entry.triggers.length > 0 && (
                    <View style={styles.triggersContainer}>
                      {entry.triggers.slice(0, 3).map((trigger, index) => (
                        <View key={index} style={[styles.triggerTag, { backgroundColor: `${themeColors.primary}20`, borderColor: themeColors.border, borderWidth: 1 }]}>
                          <Text style={[styles.triggerText, { color: themeColors.primary }]}>{trigger}</Text>
                        </View>
                      ))}
                      {entry.triggers.length > 3 && (
                        <Text style={[styles.moreText, { color: themeColors.textSecondary }]}>
                          +{entry.triggers.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 13,
  },
  entryNotes: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  triggerTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    alignSelf: 'center',
  },
});
