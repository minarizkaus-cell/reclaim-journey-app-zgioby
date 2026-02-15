
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedDelete } from '@/utils/api';

interface JournalEntry {
  id: string;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'difficult';
  triggers: string[];
  notes: string;
  createdAt: string;
}

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    try {
      console.log('Loading journal entry:', id);
      const data = await authenticatedGet<JournalEntry[]>('/api/journal');
      const foundEntry = data.find((e) => e.id === id);
      if (foundEntry) {
        setEntry(foundEntry);
      }
    } catch (error) {
      console.error('Failed to load journal entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    setDeleting(true);
    try {
      console.log('Deleting journal entry:', entry.id);
      await authenticatedDelete(`/api/journal/${entry.id}`);
      console.log('Journal entry deleted successfully');
      router.back();
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const moodKey = `mood${mood.charAt(0).toUpperCase() + mood.slice(1)}` as keyof typeof themeColors;
    return themeColors[moodKey] || themeColors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Journal Entry',
            headerBackTitle: 'Back',
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Journal Entry',
            headerBackTitle: 'Back',
          }}
        />
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
            Entry not found
          </Text>
        </View>
      </>
    );
  }

  const moodColor = getMoodColor(entry.mood);
  const dateText = formatDate(entry.createdAt);
  const timeText = formatTime(entry.createdAt);
  const moodText = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Journal Entry',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={22}
                color={themeColors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.moodCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <View style={[styles.moodIndicator, { backgroundColor: moodColor }]} />
            <Text style={[styles.moodText, { color: themeColors.text }]}>{moodText}</Text>
          </View>

          <View style={styles.dateContainer}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>{dateText}</Text>
          </View>

          <View style={styles.dateContainer}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="access-time"
              size={20}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>{timeText}</Text>
          </View>

          {entry.triggers.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Triggers</Text>
              <View style={styles.triggersContainer}>
                {entry.triggers.map((trigger, index) => (
                  <View
                    key={index}
                    style={[styles.triggerTag, { backgroundColor: `${themeColors.primary}20`, borderColor: themeColors.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.triggerText, { color: themeColors.primary }]}>{trigger}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {entry.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notes</Text>
              <View style={[styles.notesCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
                <Text style={[styles.notesText, { color: themeColors.textSecondary }]}>{entry.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Delete Entry</Text>
              <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
                Are you sure you want to delete this journal entry? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.border }]}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  moodIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  moodText: {
    fontSize: 24,
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesCard: {
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
