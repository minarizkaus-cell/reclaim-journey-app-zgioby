
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { signOut, deleteAccount } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    console.log('[Settings] User confirmed sign out');
    setShowSignOutModal(false);
    try {
      await signOut();
      console.log('[Settings] Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('[Settings] Sign out failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('[Settings] User confirmed account deletion');
      setIsDeleting(true);
      await deleteAccount();
      console.log('[Settings] Account deletion successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('[Settings] Account deletion error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Account
          </Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/profile-settings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={24}
                color={themeColors.primary}
              />
              <Text style={[styles.settingItemText, { color: themeColors.text }]}>
                Edit Profile
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Support
          </Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push('/resources')}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color={themeColors.primary}
              />
              <Text style={[styles.settingItemText, { color: themeColors.text }]}>
                Resources
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={() => setShowSignOutModal(true)}
            variant="outline"
          />
        </View>

        <View style={styles.dangerZone}>
          <Text style={[styles.sectionTitle, { color: themeColors.error }]}>
            Danger Zone
          </Text>
          <TouchableOpacity
            style={[styles.dangerItem, { backgroundColor: themeColors.card, borderColor: themeColors.error }]}
            onPress={() => setShowDeleteAccountModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={24}
                color={themeColors.error}
              />
              <Text style={[styles.dangerText, { color: themeColors.error }]}>
                Delete Account
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.error}
            />
          </TouchableOpacity>
          <Text style={[styles.dangerWarning, { color: themeColors.textSecondary }]}>
            This will permanently delete your account and all associated data. This action cannot be undone.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <IconSymbol
              ios_icon_name="arrow.right.square.fill"
              android_material_icon_name="exit-to-app"
              size={48}
              color={themeColors.error}
            />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Sign Out?
            </Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: themeColors.border }]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger, { backgroundColor: themeColors.error }]}
                onPress={handleSignOut}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={themeColors.error}
            />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Delete Account?
            </Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              This will permanently delete your account and all associated data including:
            </Text>
            <View style={styles.deleteList}>
              <Text style={[styles.deleteListItem, { color: themeColors.textSecondary }]}>• All journal entries</Text>
              <Text style={[styles.deleteListItem, { color: themeColors.textSecondary }]}>• Calendar events and reminders</Text>
              <Text style={[styles.deleteListItem, { color: themeColors.textSecondary }]}>• Craving session history</Text>
              <Text style={[styles.deleteListItem, { color: themeColors.textSecondary }]}>• Progress tracking data</Text>
              <Text style={[styles.deleteListItem, { color: themeColors.textSecondary }]}>• Profile information</Text>
            </View>
            <Text style={[styles.modalWarning, { color: themeColors.error }]}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: themeColors.border }]}
                onPress={() => setShowDeleteAccountModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger, { backgroundColor: themeColors.error }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dangerZone: {
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 59, 48, 0.2)',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
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
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteList: {
    alignSelf: 'stretch',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  deleteListItem: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  modalWarning: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
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
  modalButtonDanger: {
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
