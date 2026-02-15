
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';

interface JournalEntry {
  id: string;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'difficult';
  triggers: string[];
  notes: string;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      console.log('Loading journal entries...');
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

  const userName = user?.name || 'Friend';
  const greeting = `Welcome back, ${userName}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.text }]}>{greeting}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              How are you feeling today?
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/journal-add')}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/craving-flow')}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color={themeColors.primary}
            />
            <Text style={[styles.actionTitle, { color: themeColors.text }]}>Craving Help</Text>
            <Text style={[styles.actionSubtitle, { color: themeColors.textSecondary }]}>
              Get immediate support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/(tabs)/coping-tools')}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={32}
              color={themeColors.success}
            />
            <Text style={[styles.actionTitle, { color: themeColors.text }]}>Coping Tools</Text>
            <Text style={[styles.actionSubtitle, { color: themeColors.textSecondary }]}>
              Helpful strategies
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Entries</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : entries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={48}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No journal entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                Tap the + button to add your first entry
              </Text>
            </View>
          ) : (
            entries.slice(0, 5).map((entry) => {
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
                      <Text style={[styles.entryDate, { color: themeColors.textSecondary }]}>
                        {dateText}
                      </Text>
                      <Text style={[styles.entryDate, { color: themeColors.textSecondary }]}>
                        {timeText}
                      </Text>
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
                </TouchableOpacity>
              );
            })
          )}

          {entries.length > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/journal')}
            >
              <Text style={[styles.viewAllText, { color: themeColors.primary }]}>View All Entries</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
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
  entryDate: {
    fontSize: 13,
  },
  entryNotes: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
