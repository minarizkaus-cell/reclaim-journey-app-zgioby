
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = async () => {
    try {
      console.log('User tapped Sign Out');
      await signOut();
      console.log('Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setShowSignOutModal(false);
    }
  };

  const userEmail = user?.email || 'Not signed in';
  const userName = user?.name || 'User';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: themeColors.text }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: themeColors.textSecondary }]}>{userEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>GENERAL</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/calendar')}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>Calendar & Reminders</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/resources')}
          >
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="book"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>Resources & Crisis Help</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => console.log('Notifications tapped')}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>Notifications</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>SUPPORT</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => console.log('Help tapped')}
          >
            <IconSymbol
              ios_icon_name="questionmark.circle.fill"
              android_material_icon_name="help"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>Help & Support</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => console.log('Privacy tapped')}
          >
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>Privacy Policy</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Button
          onPress={() => setShowSignOutModal(true)}
          variant="outline"
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Sign Out</Text>
            <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowSignOutModal(false)}
                variant="secondary"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSignOut}
                style={styles.modalButton}
              >
                Sign Out
              </Button>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 16,
  },
  signOutButton: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
