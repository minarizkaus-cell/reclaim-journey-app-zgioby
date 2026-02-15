
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { colors } from '@/styles/commonStyles';
import { Button } from '@/components/Button';
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

export default function JournalAddScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const [hadCraving, setHadCraving] = useState<boolean | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'resisted' | 'partial' | 'used' | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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

      await authenticatedPost('/api/journal', {
        had_craving: hadCraving,
        triggers: selectedTriggers,
        intensity: intensity,
        tools_used: selectedTools,
        outcome: outcome,
        notes: notes || undefined,
      });

      console.log('Journal entry saved successfully, navigating back');
      router.back();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const canSave = hadCraving !== null && outcome !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'New Entry',
          headerShown: true,
          presentation: 'modal',
        }}
      />

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Did you experience a craving?</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                hadCraving === true && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
              ]}
              onPress={() => {
                console.log('User selected: Had craving');
                setHadCraving(true);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: themeColors.text },
                  hadCraving === true && { color: '#FFFFFF' },
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                hadCraving === false && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
              ]}
              onPress={() => {
                console.log('User selected: No craving');
                setHadCraving(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: themeColors.text },
                  hadCraving === false && { color: '#FFFFFF' },
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
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>What triggered it?</Text>
              <View style={styles.optionRow}>
                {COMMON_TRIGGERS.map((trigger) => {
                  const isSelected = selectedTriggers.includes(trigger);
                  return (
                    <TouchableOpacity
                      key={trigger}
                      style={[
                        styles.optionButton,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                      ]}
                      onPress={() => toggleTrigger(trigger)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: themeColors.text },
                          isSelected && { color: '#FFFFFF' },
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
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Intensity (1-10)</Text>
              <View style={styles.intensityContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const isSelected = intensity === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                      ]}
                      onPress={() => {
                        console.log('User selected intensity:', level);
                        setIntensity(level);
                      }}
                    >
                      <Text
                        style={[
                          styles.intensityText,
                          { color: themeColors.text },
                          isSelected && { color: '#FFFFFF' },
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
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Tools used</Text>
              <View style={styles.optionRow}>
                {COMMON_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <TouchableOpacity
                      key={tool}
                      style={[
                        styles.optionButton,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                      ]}
                      onPress={() => toggleTool(tool)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: themeColors.text },
                          isSelected && { color: '#FFFFFF' },
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
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Outcome</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[
                styles.outcomeButton,
                { borderColor: themeColors.border },
                outcome === 'resisted' && { borderColor: themeColors.primary, backgroundColor: themeColors.card },
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
                color={outcome === 'resisted' ? '#4CAF50' : themeColors.textSecondary}
              />
              <Text style={[styles.outcomeText, { color: themeColors.text }]}>Resisted</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outcomeButton,
                { borderColor: themeColors.border },
                outcome === 'partial' && { borderColor: themeColors.primary, backgroundColor: themeColors.card },
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
                color={outcome === 'partial' ? '#FF9800' : themeColors.textSecondary}
              />
              <Text style={[styles.outcomeText, { color: themeColors.text }]}>Partial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outcomeButton,
                { borderColor: themeColors.border },
                outcome === 'used' && { borderColor: themeColors.primary, backgroundColor: themeColors.card },
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
                color={outcome === 'used' ? themeColors.primary : themeColors.textSecondary}
              />
              <Text style={[styles.outcomeText, { color: themeColors.text }]}>Used</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
            placeholder="Add any additional notes..."
            placeholderTextColor={themeColors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
        >
          Save Entry
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  optionText: {
    fontSize: 14,
  },
  outcomeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 10,
  },
});
