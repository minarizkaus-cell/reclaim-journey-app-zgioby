
import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';
import { User } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { getJFTReading, getFirstTwoSentences, getJFTUrl } from '@/services/justForTodayService';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jftReading, setJftReading] = useState('');
  const [jftLoading, setJftLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Email verification state
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [verificationExpired, setVerificationExpired] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      console.log('[Home] Loading user profile...');
      const data = await authenticatedGet<User>('/api/user/profile');
      console.log('[Home] Profile loaded:', data);
      setProfile(data);

      // Check email verification status
      if (!data.email_verified && data.registration_timestamp) {
        const registrationTime = new Date(data.registration_timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceRegistration = (currentTime - registrationTime) / (1000 * 60 * 60);

        console.log('[Home] Hours since registration:', hoursSinceRegistration);

        if (hoursSinceRegistration >= 24) {
          console.log('[Home] Email verification expired, blocking access');
          setVerificationExpired(true);
          router.replace('/verify-email');
        } else {
          console.log('[Home] Showing verification banner');
          setShowVerificationBanner(true);
        }
      }
    } catch (error) {
      console.error('[Home] Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadJFT = useCallback(async () => {
    try {
      console.log('[Home] Loading Just For Today reading...');
      const reading = await getJFTReading();
      const preview = getFirstTwoSentences(reading);
      setJftReading(preview);
      console.log('[Home] JFT reading loaded');
    } catch (error) {
      console.error('[Home] Failed to load JFT reading:', error);
      setJftReading('Today\'s reading unavailable. Tap to open.');
    } finally {
      setJftLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadJFT();
  }, [loadProfile, loadJFT]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadJFT()]);
    setRefreshing(false);
  };

  const handleCallEmergency = () => {
    const emergencyName = profile?.emergency_contact_name;
    const emergencyPhone = profile?.emergency_contact_phone;

    if (emergencyPhone) {
      console.log('[Home] Calling emergency contact:', emergencyPhone);
      Linking.openURL(`tel:${emergencyPhone}`);
    } else {
      console.log('[Home] No emergency contact set, showing modal');
      setShowEmergencyModal(true);
    }
  };

  const handleModalGoToSettings = () => {
    setShowEmergencyModal(false);
    router.push('/(tabs)/settings');
  };

  const handleFindNAMeeting = () => {
    console.log('[Home] Opening NA Meetings link');
    Linking.openURL('https://www.na.org.au/meetings/');
  };

  const handleJFTPress = () => {
    console.log('[Home] Opening Just For Today full reading');
    const url = getJFTUrl();
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const displayName = profile?.display_name || user?.name || 'Friend';
  const welcomeText = `Welcome, ${displayName}`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
        >
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: themeColors.text }]}>
              {welcomeText}
            </Text>
          </View>

          {showVerificationBanner && !verificationExpired && (
            <TouchableOpacity
              style={[styles.verificationBanner, { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderColor: '#FF9800' }]}
              onPress={() => router.push('/verify-email')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color="#FF9800"
              />
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerTitle, { color: '#FF9800' }]}>
                  Verify your email within 24 hours
                </Text>
                <Text style={[styles.bannerSubtitle, { color: themeColors.textSecondary }]}>
                  Tap to resend verification email
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color="#FF9800"
              />
            </TouchableOpacity>
          )}

          {!jftLoading && jftReading && (
            <TouchableOpacity
              style={[styles.jftWidget, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={handleJFTPress}
              activeOpacity={0.7}
            >
              <View style={styles.jftHeader}>
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="book"
                  size={20}
                  color={themeColors.primary}
                />
                <Text style={[styles.jftTitle, { color: themeColors.text }]}>
                  Just For Today
                </Text>
              </View>
              <Text style={[styles.jftText, { color: themeColors.textSecondary }]}>
                {jftReading}
                <Text style={[styles.jftMore, { color: themeColors.primary }]}> more</Text>
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.cravingButton, { backgroundColor: '#D32F2F' }]}
            onPress={() => router.push('/craving-flow')}
            activeOpacity={0.8}
          >
            <Text style={styles.cravingButtonText}>I&apos;M HAVING A CRAVING</Text>
          </TouchableOpacity>

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push('/journal')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Journal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push('/calendar')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Calendar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push('/(tabs)/progress')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Progress
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push('/(tabs)/coping-tools')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="wrench.and.screwdriver.fill"
                android_material_icon_name="build"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Coping Tools
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => router.push('/resources')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={32}
                color={themeColors.primary}
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Resources
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={handleCallEmergency}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={32}
                color="#D32F2F"
              />
              <Text style={[styles.gridItemText, { color: themeColors.text }]}>
                Call Emergency
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.naMeetingButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={handleFindNAMeeting}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="map.fill"
              android_material_icon_name="place"
              size={24}
              color={themeColors.primary}
            />
            <Text style={[styles.naMeetingButtonText, { color: themeColors.text }]}>
              Find NA Meeting
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showEmergencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmergencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color="#FF9800"
              />
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                No Emergency Contact Set
              </Text>
              <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
                Please add an emergency contact in Settings to use this feature.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: themeColors.border }]}
                  onPress={() => setShowEmergencyModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: themeColors.primary }]}
                  onPress={handleModalGoToSettings}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Go to Settings
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
  },
  jftWidget: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  jftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  jftTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  jftText: {
    fontSize: 14,
    lineHeight: 20,
  },
  jftMore: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent',
    marginVertical: 8,
  },
  cravingButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  cravingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  naMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  naMeetingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
