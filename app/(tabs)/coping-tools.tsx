
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedPost } from '@/utils/api';
import { CopingTool, CopingToolCompletion } from '@/types/models';

// Hardcoded list of mandatory tool IDs
const MANDATORY_TOOL_IDS = [
  'tool-deep-breathing',
  'tool-box-breathing',
  'tool-grounding',
  'tool-delay-10',
  'tool-change-location',
];

export default function CopingToolsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copingTools, setCopingTools] = useState<CopingTool[]>([]);
  const [completions, setCompletions] = useState<CopingToolCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fromCravingFlow = params.fromCravingFlow === 'true';
  const sessionId = params.sessionId as string | undefined;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[CopingTools] Loading coping tools and completions...');
      
      const [toolsData, completionsData] = await Promise.all([
        authenticatedGet<CopingTool[]>('/api/coping-tools'),
        sessionId 
          ? authenticatedGet<CopingToolCompletion[]>(`/api/coping-tools/completions?session_id=${sessionId}`)
          : authenticatedGet<CopingToolCompletion[]>('/api/coping-tools/completions'),
      ]);

      console.log('[CopingTools] Loaded tools:', toolsData);
      console.log('[CopingTools] Loaded completions:', completionsData);

      setCopingTools(toolsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('[CopingTools] Failed to load data:', error);
      setErrorMessage('Failed to load coping tools. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Check if a tool is mandatory based on hardcoded IDs
  const isToolMandatory = (toolId: string) => {
    return MANDATORY_TOOL_IDS.includes(toolId);
  };

  const isToolCompleted = (toolId: string) => {
    return completions.some(c => c.tool_id === toolId);
  };

  // Get mandatory tools based on hardcoded IDs
  const getMandatoryTools = () => {
    return copingTools.filter(t => isToolMandatory(t.id));
  };

  // Count completed mandatory tools
  const getCompletedMandatoryCount = () => {
    const mandatoryTools = getMandatoryTools();
    return mandatoryTools.filter(t => isToolCompleted(t.id)).length;
  };

  // Check if all mandatory tools are completed
  const areAllMandatoryToolsCompleted = () => {
    const mandatoryTools = getMandatoryTools();
    return mandatoryTools.length > 0 && mandatoryTools.every(t => isToolCompleted(t.id));
  };

  const handleCompleteTool = async (toolId: string) => {
    try {
      setCompleting(toolId);
      console.log('[CopingTools] Completing tool:', toolId, 'for session:', sessionId);

      const response = await authenticatedPost('/api/coping-tools/complete', {
        tool_id: toolId,
        session_id: sessionId,
      });

      console.log('[CopingTools] Tool completed:', response);

      // Add to local completions
      setCompletions(prev => [...prev, response.completion]);

      // Check if all mandatory tools are now completed
      const updatedCompletions = [...completions, response.completion];
      const mandatoryTools = getMandatoryTools();
      const allMandatoryCompleted = mandatoryTools.every(t => 
        updatedCompletions.some(c => c.tool_id === t.id)
      );

      if (fromCravingFlow && allMandatoryCompleted) {
        console.log('[CopingTools] All mandatory tools completed, creating journal entry...');
        await createAutoJournalEntry();
      }
    } catch (error) {
      console.error('[CopingTools] Failed to complete tool:', error);
      setErrorMessage('Failed to mark tool as completed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setCompleting(null);
    }
  };

  const createAutoJournalEntry = async () => {
    try {
      const completedToolTitles = copingTools
        .filter(t => completions.some(c => c.tool_id === t.id))
        .map(t => t.title);

      console.log('[CopingTools] Creating auto journal entry with tools:', completedToolTitles);

      await authenticatedPost('/api/journal', {
        had_craving: true,
        intensity: 5,
        tools_used: completedToolTitles,
        outcome: 'resisted',
        notes: 'Completed coping session.',
        triggers: [], // Empty triggers for auto-created entries
      });

      console.log('[CopingTools] Auto journal entry created successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[CopingTools] Failed to create auto journal entry:', error);
      setErrorMessage('Failed to create journal entry. Please add one manually.');
      setShowErrorModal(true);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Loading coping tools...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const mandatoryToolsCount = getMandatoryTools().length;
  const completedMandatoryCount = getCompletedMandatoryCount();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Coping Tools</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Strategies to help you through difficult moments
        </Text>
        
        {fromCravingFlow && (
          <View style={[styles.progressBanner, { backgroundColor: themeColors.card, borderColor: themeColors.primary }]}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={themeColors.primary}
            />
            <Text style={[styles.progressText, { color: themeColors.text }]}>
              Complete {completedMandatoryCount}/{mandatoryToolsCount} mandatory tools
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {copingTools.map((tool) => {
          const isExpanded = expandedId === tool.id;
          const isCompleted = isToolCompleted(tool.id);
          const isMandatory = isToolMandatory(tool.id);
          const isCompletingThis = completing === tool.id;

          return (
            <View
              key={tool.id}
              style={[
                styles.toolCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: isCompleted ? '#4CAF50' : themeColors.border,
                  borderWidth: isCompleted ? 2 : 1,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleExpand(tool.id)}
                activeOpacity={0.7}
              >
                <View style={styles.toolHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${themeColors.primary}20` }]}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="air"
                      size={28}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={styles.toolInfo}>
                    <View style={styles.toolTitleRow}>
                      <Text style={[styles.toolTitle, { color: themeColors.text }]}>
                        {tool.title}
                      </Text>
                      {isMandatory && (
                        <View style={[styles.mandatoryBadge, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.mandatoryText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.toolDuration, { color: themeColors.textSecondary }]}>
                      {tool.duration} • {tool.when_to_use}
                    </Text>
                  </View>
                  {isCompleted ? (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={28}
                      color="#4CAF50"
                    />
                  ) : (
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={themeColors.textSecondary}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.stepsContainer}>
                  <Text style={[styles.stepsTitle, { color: themeColors.text }]}>Steps:</Text>
                  {tool.steps.map((step, index) => {
                    const stepNumber = `${index + 1}`;
                    return (
                      <View key={index} style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.stepNumberText}>{stepNumber}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>{step}</Text>
                      </View>
                    );
                  })}

                  {!isCompleted && (
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => handleCompleteTool(tool.id)}
                      disabled={isCompletingThis}
                    >
                      {isCompletingThis ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.completeButtonText}>Mark as Completed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={[styles.emergencyCard, { backgroundColor: themeColors.card, borderColor: themeColors.primary, borderWidth: 2 }]}>
          <IconSymbol
            ios_icon_name="phone.fill"
            android_material_icon_name="phone"
            size={32}
            color={themeColors.primary}
          />
          <Text style={[styles.emergencyTitle, { color: themeColors.text }]}>Need Immediate Help?</Text>
          <Text style={[styles.emergencyText, { color: themeColors.textSecondary }]}>
            If you're in crisis, please reach out to a professional or call a helpline.
          </Text>
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/resources')}
          >
            <Text style={styles.emergencyButtonText}>View Resources</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={64}
              color="#4CAF50"
            />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Great Job!</Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              You completed all mandatory coping tools. A journal entry has been created automatically.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push('/journal');
                }}
              >
                <Text style={styles.modalButtonText}>View Journal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonSecondary, { borderColor: themeColors.border }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: themeColors.text }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={64}
              color="#E57373"
            />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Error</Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  progressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  toolCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mandatoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  toolDuration: {
    fontSize: 14,
  },
  stepsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});
