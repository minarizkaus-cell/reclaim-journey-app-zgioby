
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

interface JournalEntry {
  id: string;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'difficult';
  triggers: string[];
  notes: string;
  createdAt: string;
}

const moodOptions = [
  { value: 'great', label: 'Great', emoji: '😊', icon: 'sentiment-very-satisfied' },
  { value: 'good', label: 'Good', emoji: '🙂', icon: 'sentiment-satisfied' },
  { value: 'okay', label: 'Okay', emoji: '😐', icon: 'sentiment-neutral' },
  { value: 'struggling', label: 'Struggling', emoji: '😔', icon: 'sentiment-dissatisfied' },
  { value: 'difficult', label: 'Difficult', emoji: '😢', icon: 'sentiment-very-dissatisfied' },
];

const commonTriggers = [
  'Stress', 'Anxiety', 'Loneliness', 'Anger', 'Sadness',
  'Cravings', 'Social pressure', 'Boredom', 'Fatigue', 'Pain',
];

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  useEffect(() => {
    console.log('JournalScreen mounted, user:', user?.email);
    loadEntries();
  }, []);

  const loadEntries = async () => {
    console.log('Loading journal entries...');
    setLoading(true);
    try {
      // TODO: Backend Integration - GET /api/journal → [{ id, mood, triggers, notes, createdAt }]
      // Placeholder data for now
      setEntries([]);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedMood) {
      Alert.alert('Required', 'Please select your mood');
      return;
    }

    console.log('Submitting journal entry:', { mood: selectedMood, triggers: selectedTriggers, notes });
    setSubmitting(true);

    try {
      // TODO: Backend Integration - POST /api/journal with { mood, triggers, notes } → created entry
      // Placeholder: Add to local state
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        mood: selectedMood as any,
        triggers: selectedTriggers,
        notes,
        createdAt: new Date().toISOString(),
      };
      setEntries([newEntry, ...entries]);
      
      // Reset form
      setSelectedMood('');
      setSelectedTriggers([]);
      setNotes('');
      setShowNewEntry(false);
      
      Alert.alert('Success', 'Journal entry saved');
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    console.log('Deleting entry:', id);
    try {
      // TODO: Backend Integration - DELETE /api/journal/:id → { success: true }
      setEntries(entries.filter(e => e.id !== id));
      setDeleteModalVisible(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  const toggleTrigger = (trigger: string) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const getMoodColor = (mood: string) => {
    const moodColorMap: Record<string, string> = {
      great: themeColors.moodGreat,
      good: themeColors.moodGood,
      okay: themeColors.moodOkay,
      struggling: themeColors.moodStruggling,
      difficult: themeColors.moodDifficult,
    };
    return moodColorMap[mood] || themeColors.primary;
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
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Journal', headerLargeTitle: true }} />
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Journal',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowNewEntry(true)}>
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
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="book"
                android_material_icon_name="book"
                size={64}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                Start your recovery journey by adding your first journal entry
              </Text>
            </View>
          ) : (
            entries.map((entry) => {
              const moodOption = moodOptions.find(m => m.value === entry.mood);
              const dateDisplay = formatDate(entry.createdAt);
              const timeDisplay = formatTime(entry.createdAt);
              const moodColor = getMoodColor(entry.mood);

              return (
                <View
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: themeColors.card }]}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderLeft}>
                      <View style={[styles.moodBadge, { backgroundColor: moodColor }]}>
                        <Text style={styles.moodEmoji}>{moodOption?.emoji}</Text>
                      </View>
                      <View>
                        <Text style={[styles.moodLabel, { color: themeColors.text }]}>
                          {moodOption?.label}
                        </Text>
                        <View style={styles.dateRow}>
                          <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
                            {dateDisplay}
                          </Text>
                          <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>
                            {timeDisplay}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setEntryToDelete(entry.id);
                        setDeleteModalVisible(true);
                      }}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={themeColors.error}
                      />
                    </TouchableOpacity>
                  </View>

                  {entry.triggers.length > 0 && (
                    <View style={styles.triggersContainer}>
                      {entry.triggers.map((trigger, index) => (
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
                  )}

                  {entry.notes && (
                    <Text style={[styles.notesText, { color: themeColors.textSecondary }]}>
                      {entry.notes}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* New Entry Modal */}
        <Modal
          visible={showNewEntry}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowNewEntry(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewEntry(false)}>
                <Text style={[styles.cancelButton, { color: themeColors.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                New Entry
              </Text>
              <TouchableOpacity
                onPress={handleSubmitEntry}
                disabled={submitting || !selectedMood}
              >
                {submitting ? (
                  <ActivityIndicator color={themeColors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.saveButton,
                      { color: selectedMood ? themeColors.primary : themeColors.textSecondary },
                    ]}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                How are you feeling?
              </Text>
              <View style={styles.moodGrid}>
                {moodOptions.map((mood) => {
                  const isSelected = selectedMood === mood.value;
                  const moodColor = getMoodColor(mood.value);
                  return (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodOption,
                        {
                          backgroundColor: isSelected ? moodColor : themeColors.card,
                          borderColor: isSelected ? moodColor : themeColors.border,
                        },
                      ]}
                      onPress={() => setSelectedMood(mood.value)}
                    >
                      <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                      <Text
                        style={[
                          styles.moodOptionLabel,
                          { color: isSelected ? '#FFFFFF' : themeColors.text },
                        ]}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Triggers (optional)
              </Text>
              <View style={styles.triggersGrid}>
                {commonTriggers.map((trigger) => {
                  const isSelected = selectedTriggers.includes(trigger);
                  return (
                    <TouchableOpacity
                      key={trigger}
                      style={[
                        styles.triggerOption,
                        {
                          backgroundColor: isSelected ? themeColors.primary : themeColors.card,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleTrigger(trigger)}
                    >
                      <Text
                        style={[
                          styles.triggerOptionText,
                          { color: isSelected ? '#FFFFFF' : themeColors.text },
                        ]}
                      >
                        {trigger}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: themeColors.card,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="How was your day? What helped you?"
                placeholderTextColor={themeColors.textSecondary}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </ScrollView>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.deleteModalTitle, { color: themeColors.text }]}>
                Delete Entry?
              </Text>
              <Text style={[styles.deleteModalText, { color: themeColors.textSecondary }]}>
                This action cannot be undone.
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, { backgroundColor: themeColors.highlight }]}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setEntryToDelete(null);
                  }}
                >
                  <Text style={[styles.deleteModalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, { backgroundColor: themeColors.error }]}
                  onPress={() => entryToDelete && handleDeleteEntry(entryToDelete)}
                >
                  <Text style={[styles.deleteModalButtonText, { color: '#FFFFFF' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
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
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  triggerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  moodOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodOptionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  triggerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  triggerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 24,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
