
import { useRouter } from 'expo-router';
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
  RefreshControl,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import React, { useState, useEffect } from 'react';
import { User } from '@/types/models';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  settingsButton: {
    padding: 8,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  cravingButton: {
    backgroundColor: colors.dark.primary,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  cravingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cravingButtonSubtitle: {
    fontSize: 14,
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
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  tileIcon: {
    marginBottom: 12,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark.text,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.dark.textSecondary,
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
    backgroundColor: colors.dark.background,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.dark.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark.text,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
});

export default function HomeScreen() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[Home] Loading user profile...');
      const data = await authenticatedGet<User>('/api/user/profile');
      console.log('[Home] Profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error('[Home] Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  const displayName = profile?.display_name || user?.name || user?.email?.split('@')[0] || 'there';
  const welcomeBackText = 'Welcome back';
  const subtitleText = 'One day at a time';
  const cravingButtonText = "I'M HAVING A CRAVING";
  const cravingButtonSubtitle = 'Start a guided reset';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.dark.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/natively-dark.png')}
            style={styles.logo}
          />
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
              color={colors.dark.text}
            />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{welcomeBackText}</Text>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
        </View>

        {/* Primary Craving Button */}
        <TouchableOpacity
          style={styles.cravingButton}
          onPress={() => {
            console.log('[Home] User tapped craving button');
            router.push('/craving-flow');
          }}
        >
          <Text style={styles.cravingButtonText}>{cravingButtonText}</Text>
          <Text style={styles.cravingButtonSubtitle}>{cravingButtonSubtitle}</Text>
        </TouchableOpacity>

        {/* 2-Column Grid Tiles */}
        <View style={styles.tilesContainer}>
          {/* Row 1: Journal, Calendar */}
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={styles.tile}
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
                  color={colors.dark.text}
                />
              </View>
              <Text style={styles.tileText}>Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
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
                  color={colors.dark.text}
                />
              </View>
              <Text style={styles.tileText}>Calendar</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Progress, Coping Tools */}
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={styles.tile}
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
                  color={colors.dark.text}
                />
              </View>
              <Text style={styles.tileText}>Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
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
                  color={colors.dark.text}
                />
              </View>
              <Text style={styles.tileText}>Coping Tools</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Resources, Call Emergency */}
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={styles.tile}
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
                  color={colors.dark.text}
                />
              </View>
              <Text style={styles.tileText}>Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tile}
              onPress={handleCallEmergency}
            >
              <View style={styles.tileIcon}>
                <IconSymbol
                  ios_icon_name="phone"
                  android_material_icon_name="phone"
                  size={32}
                  color={colors.dark.primary}
                />
              </View>
              <Text style={styles.tileText}>Call Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal for missing sponsor phone */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>No Emergency Contact</Text>
            <Text style={styles.modalMessage}>
              You haven't set up a sponsor phone number yet. Would you like to add one in Settings?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('[Home] User cancelled modal');
                  setShowModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
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
