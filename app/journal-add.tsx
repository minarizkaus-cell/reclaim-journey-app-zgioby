
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
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { colors } from '@/styles/commonStyles';
import { authenticatedPost } from '@/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

const COMMON_TRIGGERS = [
  'Stress',
  'Anxiety',
  'Social pressure',
  'Boredom',
  'Loneliness',
  'Anger',
  'Depression',
  'Celebration',
  'Fatigue',
  'Other',
];

const COMMON_TOOLS = [
  'Deep breathing',
  'Called sponsor',
  'Meditation',
  'Exercise',
  'Journaling',
  'Distraction',
  'Support group',
  'Prayer',
  'Music',
  'Other',
];

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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  outcomeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  outcomeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  intensityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  intensityTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function JournalAddScreen() {
  const router = useRouter();
  const [hadCraving, setHadCraving] = useState<boolean | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'resisted' | 'partial' | 'used' | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme();

  const toggleTrigger = (trigger: string) => {
    console.log('User toggled trigger:', trigger);
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const toggleTool = (tool: string) => {
    console.log('User toggled tool:', tool);
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSave = async () => {
    if (hadCraving === null || outcome === null) {
      console.log('Cannot save: missing required fields');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving journal entry...', {
        hadCraving,
        triggers: selectedTriggers,
        intensity,
        toolsUsed: selectedTools,
        outcome,
        notes,
      });

      // TODO: Backend Integration - POST /api/journal with { had_craving, triggers, intensity?, tools_used, outcome, notes? } → created entry
      await authenticatedPost('/api/journal', {
        had_craving: hadCraving,
        triggers: selectedTriggers,
        intensity: intensity,
        tools_used: selectedTools,
        outcome: outcome,
        notes: notes || undefined,
      });

      console.log('Journal entry saved successfully');
      router.back();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const canSave = hadCraving !== null && outcome !== null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'New Entry',
          headerShown: true,
          presentation: 'modal',
        }}
      />

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Did you experience a craving?</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                hadCraving === true && styles.optionButtonSelected,
              ]}
              onPress={() => {
                console.log('User selected: Had craving');
                setHadCraving(true);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  hadCraving === true && styles.optionTextSelected,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                hadCraving === false && styles.optionButtonSelected,
              ]}
              onPress={() => {
                console.log('User selected: No craving');
                setHadCraving(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  hadCraving === false && styles.optionTextSelected,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {hadCraving && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What triggered it?</Text>
              <View style={styles.optionRow}>
                {COMMON_TRIGGERS.map((trigger) => {
                  const isSelected = selectedTriggers.includes(trigger);
                  return (
                    <TouchableOpacity
                      key={trigger}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => toggleTrigger(trigger)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {trigger}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intensity (1-10)</Text>
              <View style={styles.intensityContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const isSelected = intensity === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        isSelected && styles.intensityButtonSelected,
                      ]}
                      onPress={() => {
                        console.log('User selected intensity:', level);
                        setIntensity(level);
                      }}
                    >
                      <Text
                        style={[
                          styles.intensityText,
                          isSelected && styles.intensityTextSelected,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tools used</Text>
              <View style={styles.optionRow}>
                {COMMON_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <TouchableOpacity
                      key={tool}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => toggleTool(tool)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {tool}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outcome</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[
                styles.outcomeButton,
                outcome === 'resisted' && styles.outcomeButtonSelected,
              ]}
              onPress={() => {
                console.log('User selected outcome: resisted');
                setOutcome('resisted');
              }}
            >
              <IconSymbol
                ios_icon_name="check-circle"
                android_material_icon_name="check-circle"
                size={32}
                color={outcome === 'resisted' ? '#4CAF50' : colors.textSecondary}
              />
              <Text style={styles.outcomeText}>Resisted</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outcomeButton,
                outcome === 'partial' && styles.outcomeButtonSelected,
              ]}
              onPress={() => {
                console.log('User selected outcome: partial');
                setOutcome('partial');
              }}
            >
              <IconSymbol
                ios_icon_name="warning"
                android_material_icon_name="warning"
                size={32}
                color={outcome === 'partial' ? '#FF9800' : colors.textSecondary}
              />
              <Text style={styles.outcomeText}>Partial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outcomeButton,
                outcome === 'used' && styles.outcomeButtonSelected,
              ]}
              onPress={() => {
                console.log('User selected outcome: used');
                setOutcome('used');
              }}
            >
              <IconSymbol
                ios_icon_name="error"
                android_material_icon_name="error"
                size={32}
                color={outcome === 'used' ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.outcomeText}>Used</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add any additional notes..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave || saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Entry</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
