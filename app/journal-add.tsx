
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';

const moods = [
  { value: 'great', label: 'Great', icon: 'sentiment-very-satisfied', color: '#81C784' },
  { value: 'good', label: 'Good', icon: 'sentiment-satisfied', color: '#AED581' },
  { value: 'okay', label: 'Okay', icon: 'sentiment-neutral', color: '#FFD54F' },
  { value: 'struggling', label: 'Struggling', icon: 'sentiment-dissatisfied', color: '#FFB74D' },
  { value: 'difficult', label: 'Difficult', icon: 'sentiment-very-dissatisfied', color: '#E57373' },
];

const commonTriggers = [
  'Stress', 'Anxiety', 'Social Pressure', 'Boredom', 'Loneliness',
  'Anger', 'Sadness', 'Celebration', 'Fatigue', 'Physical Pain',
];

export default function JournalAddScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTrigger = (trigger: string) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter((t) => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const handleSave = async () => {
    if (!selectedMood) {
      console.log('No mood selected');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating journal entry:', { mood: selectedMood, triggers: selectedTriggers, notes });
      await authenticatedPost('/api/journal', {
        mood: selectedMood,
        triggers: selectedTriggers,
        notes: notes.trim() || undefined,
      });
      console.log('Journal entry created successfully');
      router.back();
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSave = selectedMood !== null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Journal Entry',
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: themeColors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={!canSave || loading}>
              {loading ? (
                <ActivityIndicator size="small" color={themeColors.primary} />
              ) : (
                <Text style={{ color: canSave ? themeColors.primary : themeColors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>How are you feeling?</Text>
            <View style={styles.moodsContainer}>
              {moods.map((mood) => {
                const isSelected = selectedMood === mood.value;
                return (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodButton,
                      {
                        backgroundColor: isSelected ? mood.color : themeColors.card,
                        borderColor: isSelected ? mood.color : themeColors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => setSelectedMood(mood.value)}
                  >
                    <IconSymbol
                      ios_icon_name="face.smiling"
                      android_material_icon_name={mood.icon}
                      size={32}
                      color={isSelected ? '#FFFFFF' : themeColors.text}
                    />
                    <Text style={[styles.moodLabel, { color: isSelected ? '#FFFFFF' : themeColors.text }]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Any triggers?</Text>
            <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
              Select all that apply
            </Text>
            <View style={styles.triggersContainer}>
              {commonTriggers.map((trigger) => {
                const isSelected = selectedTriggers.includes(trigger);
                return (
                  <TouchableOpacity
                    key={trigger}
                    style={[
                      styles.triggerButton,
                      {
                        backgroundColor: isSelected ? `${themeColors.primary}30` : themeColors.card,
                        borderColor: isSelected ? themeColors.primary : themeColors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => toggleTrigger(trigger)}
                  >
                    <Text style={[styles.triggerLabel, { color: isSelected ? themeColors.primary : themeColors.text }]}>
                      {trigger}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notes (optional)</Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              placeholder="What's on your mind?"
              placeholderTextColor={themeColors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
});
