
import { User } from '@/types/models';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  useEffect(() => {
    console.log('[Home] Component mounted, loading profile...');
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[Home] Starting profile load...');
      setError(null);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile request timeout after 10 seconds')), 10000);
      });

      const profilePromise = authenticatedGet<User>('/api/user/profile');
      
      console.log('[Home] Waiting for profile response...');
      const data = await Promise.race([profilePromise, timeoutPromise]);
      
      console.log('[Home] Profile loaded successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('[Home] Failed to load profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      console.log('[Home] Profile load complete, setting loading to false');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    console.log('[Home] User triggered refresh');
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleCallEmergency = () => {
    console.log('[Home] User tapped Call Emergency');
    if (profile?.sponsor_phone) {
      console.log('[Home] Opening dialer with sponsor phone:', profile.sponsor_phone);
      Linking.openURL(`tel:${profile.sponsor_phone}`);
    } else {
      console.log('[Home] No sponsor phone set, showing modal');
      setShowModal(true);
    }
  };

  const handleModalGoToSettings = () => {
    console.log('[Home] User chose to go to Settings');
    setShowModal(false);
    router.push('/(tabs)/settings');
  };

  const handleFindNAMeeting = () => {
    console.log('[Home] User tapped Find NA Meeting button');
    Linking.openURL('https://www.na.org/meetingsearch/');
  };

  if (loading) {
    console.log('[Home] Rendering loading state');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ color: themeColors.textSecondary, marginTop: 16, fontSize: 16 }}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (error) {
    console.log('[Home] Rendering error state:', error);
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: themeColors.primary }]} 
          onPress={loadProfile}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('[Home] Rendering main content with profile:', profile);
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there';
  const welcomeBackText = 'Welcome back';
  const subtitleText = 'One day at a time';
  const cravingButtonText = "I'M HAVING A CRAVING";
  const cravingButtonSubtitle = 'Start a guided reset';
  const appTitle = 'MyRecovery';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: themeColors.primary }]}>{appTitle}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              console.log('[Home] User tapped Settings button');
              router.push('/(tabs)/settings');
            }}
          >
            <IconSymbol
              ios_icon_name="gear"
              android_material_icon_name="settings"
              size={28}
              color={themeColors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: themeColors.textSecondary }]}>{welcomeBackText}</Text>
          <Text style={[styles.displayName, { color: themeColors.text }]}>{displayName}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{subtitleText}</Text>
        </View>

        <TouchableOpacity
          style={[styles.cravingButton, { backgroundColor: themeColors.primary }]}
          onPress={() => {
            console.log('[Home] User tapped craving button');
            router.push('/craving-flow');
          }}
        >
          <Text style={styles.cravingButtonText}>{cravingButtonText}</Text>
          <Text style={styles.cravingButtonSubtitle}>{cravingButtonSubtitle}</Text>
        </TouchableOpacity>

        <View style={styles.tilesContainer}>
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                console.log('[Home] User tapped Journal tile');
                router.push('/journal');
              }}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="book"
                  android_material_icon_name="menu-book"
                  size={32}
                  color={themeColors.text}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                console.log('[Home] User tapped Calendar tile');
                router.push('/calendar');
              }}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={32}
                  color={themeColors.text}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                console.log('[Home] User tapped Progress tile');
                router.push('/(tabs)/progress');
              }}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="chart"
                  android_material_icon_name="show-chart"
                  size={32}
                  color={themeColors.text}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                console.log('[Home] User tapped Coping Tools tile');
                router.push('/(tabs)/coping-tools');
              }}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="heart"
                  android_material_icon_name="favorite"
                  size={32}
                  color={themeColors.text}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Coping Tools</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                console.log('[Home] User tapped Resources tile');
                router.push('/resources');
              }}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="info"
                  android_material_icon_name="info"
                  size={32}
                  color={themeColors.text}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={handleCallEmergency}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="phone"
                  android_material_icon_name="phone"
                  size={32}
                  color={themeColors.primary}
                />
              </View>
              <Text style={[styles.tileText, { color: themeColors.text }]}>Call Emergency</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.naMeetingButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={handleFindNAMeeting}
          >
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="place"
              size={20}
              color={themeColors.primary}
            />
            <Text style={[styles.naMeetingButtonText, { color: themeColors.text }]}>Find NA Meeting</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>No Emergency Contact</Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              You haven&apos;t set up a sponsor phone number yet. Would you like to add one in Settings?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                onPress={() => {
                  console.log('[Home] User cancelled modal');
                  setShowModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: themeColors.primary }]}
                onPress={handleModalGoToSettings}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Go to Settings
                </Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 15,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  cravingButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  cravingButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cravingButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  tilesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tilesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tile: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  tileIcon: {
    marginBottom: 12,
  },
  tileText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  naMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 6,
    marginTop: 8,
    gap: 8,
  },
  naMeetingButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonConfirm: {
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
});
