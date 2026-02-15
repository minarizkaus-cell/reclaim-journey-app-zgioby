
import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/Button';
import { authenticatedGet, authenticatedPost } from '@/utils/api';
import { CopingTool, CopingToolCompletion } from '@/types/models';
import { useLocalSearchParams, useRouter } from 'expo-router';

const MANDATORY_TOOL_IDS = ['breathing', 'grounding', 'distraction'];

export default function CopingToolsScreen() {
  const [tools, setTools] = useState<CopingTool[]>([]);
  const [completions, setCompletions] = useState<CopingToolCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log('[CopingTools] Loading tools and completions...');
      const [toolsData, completionsData] = await Promise.all([
        authenticatedGet<CopingTool[]>('/api/coping-tools'),
        authenticatedGet<CopingToolCompletion[]>('/api/coping-tools/completions'),
      ]);
      console.log('[CopingTools] Loaded:', toolsData.length, 'tools,', completionsData.length, 'completions');
      setTools(toolsData);
      setCompletions(completionsData);

      if (params.autoExpand) {
        const toolId = params.autoExpand as string;
        console.log('[CopingTools] Auto-expanding tool:', toolId);
        setExpandedId(toolId);
      }
    } catch (error) {
      console.error('[CopingTools] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.autoExpand]);

  const isToolMandatory = (toolId: string) => {
    return MANDATORY_TOOL_IDS.includes(toolId);
  };

  const isToolCompleted = (toolId: string) => {
    return completions.some(c => c.tool_id === toolId);
  };

  const getMandatoryTools = () => {
    return tools.filter(t => isToolMandatory(t.id));
  };

  const getCompletedMandatoryCount = () => {
    return getMandatoryTools().filter(t => isToolCompleted(t.id)).length;
  };

  const areAllMandatoryToolsCompleted = () => {
    return getMandatoryTools().every(t => isToolCompleted(t.id));
  };

  const handleCompleteTool = async (toolId: string) => {
    try {
      console.log('[CopingTools] Marking tool as complete:', toolId);
      await authenticatedPost('/api/coping-tools/complete', { tool_id: toolId });
      await loadData();

      if (areAllMandatoryToolsCompleted()) {
        console.log('[CopingTools] All mandatory tools completed, creating journal entry');
        await createAutoJournalEntry();
      }
    } catch (error) {
      console.error('[CopingTools] Failed to complete tool:', error);
    }
  };

  const createAutoJournalEntry = async () => {
    try {
      const title = 'Coping Tools Completed';
      const content = 'I completed all mandatory coping tools during a craving. I used breathing exercises, grounding techniques, and distraction methods to manage my urges.';
      await authenticatedPost('/api/journal', {
        title,
        content,
        mood: 'good',
        triggers: [],
        tools_used: MANDATORY_TOOL_IDS,
        outcome: 'managed',
      });
      console.log('[CopingTools] Auto journal entry created');
    } catch (error) {
      console.error('[CopingTools] Failed to create auto journal entry:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const completedMandatoryCount = getCompletedMandatoryCount();
  const totalMandatoryCount = getMandatoryTools().length;
  const progressText = `${completedMandatoryCount} / ${totalMandatoryCount} completed`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.progressCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.progressTitle, { color: themeColors.text }]}>
            Mandatory Tools Progress
          </Text>
          <Text style={[styles.progressText, { color: themeColors.primary }]}>
            {progressText}
          </Text>
        </View>

        {tools.map((tool) => {
          const isExpanded = expandedId === tool.id;
          const isCompleted = isToolCompleted(tool.id);
          const isMandatory = isToolMandatory(tool.id);

          return (
            <React.Fragment key={tool.id}>
            <View
              style={[styles.toolCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            >
              <TouchableOpacity
                style={styles.toolHeader}
                onPress={() => toggleExpand(tool.id)}
                activeOpacity={0.7}
              >
                <View style={styles.toolHeaderLeft}>
                  <IconSymbol
                    ios_icon_name={isCompleted ? 'checkmark.circle.fill' : 'circle'}
                    android_material_icon_name={isCompleted ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={isCompleted ? themeColors.success : themeColors.textSecondary}
                  />
                  <View style={styles.toolTitleContainer}>
                    <Text style={[styles.toolTitle, { color: themeColors.text }]}>
                      {tool.title}
                    </Text>
                    {isMandatory && (
                      <View style={[styles.mandatoryBadge, { backgroundColor: 'rgba(77, 170, 140, 0.15)' }]}>
                        <Text style={[styles.mandatoryBadgeText, { color: themeColors.primary }]}>
                          Required
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.toolContent}>
                  <Text style={[styles.toolDescription, { color: themeColors.textSecondary }]}>
                    {tool.description}
                  </Text>
                  {!isCompleted && (
                    <Button
                      title="Mark as Complete"
                      onPress={() => handleCompleteTool(tool.id)}
                      variant="primary"
                    />
                  )}
                </View>
              )}
            </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    padding: 20,
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
  },
  toolCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toolTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mandatoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toolContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  toolDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
