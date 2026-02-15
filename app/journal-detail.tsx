
import { authenticatedGet, authenticatedDelete } from '@/utils/api';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
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
import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '@/types/models';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outcomeText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerText: {
    fontSize: 14,
    color: colors.text,
  },
  notesContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  deleteButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonDelete: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: colors.text,
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
  },
});

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const loadEntry = useCallback(async () => {
    try {
      console.log('Loading journal entry:', id);
      // TODO: Backend Integration - GET /api/journal/:id → { id, created_at, had_craving, triggers, intensity, tools_used, outcome, notes }
      const data = await authenticatedGet<JournalEntry[]>('/api/journal');
      const foundEntry = data.find((e) => e.id === id);
      if (foundEntry) {
        console.log('Loaded entry:', foundEntry);
        setEntry(foundEntry);
      } else {
        console.error('Entry not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      console.log('Deleting journal entry:', id);
      // TODO: Backend Integration - DELETE /api/journal/:id → { success: true }
      await authenticatedDelete(`/api/journal/${id}`);
      console.log('Entry deleted successfully');
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      setDeleting(false);
    }
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!entry) {
    return null;
  }

  const outcomeColor = getOutcomeColor(entry.outcome);
  const outcomeIcon = getOutcomeIcon(entry.outcome);
  const outcomeLabel = getOutcomeLabel(entry.outcome);
  const dateDisplay = formatDate(entry.created_at);
  const timeDisplay = formatTime(entry.created_at);
  const cravingLabel = entry.had_craving ? 'Had craving' : 'No craving';
  const intensityLabel = entry.intensity !== undefined && entry.intensity !== null
    ? `${entry.intensity}/10`
    : 'Not recorded';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Entry Details',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {dateDisplay}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="access-time"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {timeDisplay}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outcome</Text>
          <View style={styles.outcomeContainer}>
            <IconSymbol
              ios_icon_name={outcomeIcon}
              android_material_icon_name={outcomeIcon}
              size={32}
              color={outcomeColor}
            />
            <Text style={[styles.outcomeText, { color: outcomeColor }]}>
              {outcomeLabel}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Craving Status</Text>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="info"
              android_material_icon_name="info"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>{cravingLabel}</Text>
          </View>
        </View>

        {entry.had_craving && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intensity</Text>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="chart"
                  android_material_icon_name="show-chart"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>{intensityLabel}</Text>
              </View>
            </View>

            {entry.triggers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Triggers</Text>
                <View style={styles.triggersContainer}>
                  {entry.triggers.map((trigger, index) => (
                    <View key={index} style={styles.triggerChip}>
                      <Text style={styles.triggerText}>{trigger}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {entry.tools_used.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tools Used</Text>
                <View style={styles.triggersContainer}>
                  {entry.tools_used.map((tool, index) => (
                    <View key={index} style={styles.triggerChip}>
                      <Text style={styles.triggerText}>{tool}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {entry.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          console.log('User tapped Delete button');
          setShowDeleteModal(true);
        }}
      >
        <Text style={styles.deleteButtonText}>Delete Entry</Text>
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Entry?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('User cancelled delete');
                  setShowDeleteModal(false);
                }}
                disabled={deleting}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextDelete]}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
