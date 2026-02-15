
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { authenticatedGet, authenticatedPut } from '@/utils/api';
import { User } from '@/types/models';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user: authUser, signOut } = useAuth();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    timezone: '',
    sponsor_name: '',
    sponsor_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    timer_minutes: 15,
    sobriety_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[Profile] Loading user profile...');
      const data = await authenticatedGet<User>('/api/user/profile');
      console.log('[Profile] Profile loaded:', data);
      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        timezone: data.timezone || '',
        sponsor_name: data.sponsor_name || '',
        sponsor_phone: data.sponsor_phone || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        timer_minutes: data.timer_minutes || 15,
        sobriety_date: data.sobriety_date || '',
      });
      if (data.sobriety_date) {
        setSelectedDate(new Date(data.sobriety_date));
      }
    } catch (error) {
      console.error('[Profile] Failed to load profile:', error);
      setErrorMessage('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('[Profile] Saving profile updates...', editForm);
      const updated = await authenticatedPut<User>('/api/user/profile', editForm);
      console.log('[Profile] Profile updated:', updated);
      setProfile(updated);
      setShowEditModal(false);
    } catch (error) {
      console.error('[Profile] Failed to update profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[Profile] User confirmed sign out');
    setShowSignOutConfirm(false);
    try {
      await signOut();
      console.log('[Profile] Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('[Profile] Sign out error:', error);
      setErrorMessage('Failed to sign out. Please try again.');
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date > today) {
        console.log('[Profile] Future date selected, rejecting');
        setErrorMessage('Cannot select a future date for sobriety date.');
        return;
      }
      
      console.log('[Profile] Date selected:', date);
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setEditForm({ ...editForm, sobriety_date: formattedDate });
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const userName = profile?.display_name || authUser?.name || 'User';
  const userEmail = profile?.email || authUser?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const sobrietyDays = profile?.sobriety_date 
    ? Math.floor((new Date().getTime() - new Date(profile.sobriety_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>Profile</Text>
          </View>

          <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>

          {sobrietyDays !== null && (
            <View style={[styles.sobrietyCard, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.sobrietyDays}>{sobrietyDays}</Text>
              <Text style={styles.sobrietyLabel}>Days Sober</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              ACCOUNT
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: themeColors.card }]}
              onPress={() => {
                console.log('[Profile] Edit Profile tapped');
                setShowEditModal(true);
              }}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="person"
                  android_material_icon_name="person"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>
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

            {profile?.sponsor_name && (
              <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Sponsor</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{profile.sponsor_name}</Text>
                {profile.sponsor_phone && (
                  <Text style={[styles.infoSubvalue, { color: themeColors.textSecondary }]}>{profile.sponsor_phone}</Text>
                )}
              </View>
            )}

            {profile?.emergency_contact_name && (
              <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Emergency Contact</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{profile.emergency_contact_name}</Text>
                {profile.emergency_contact_phone && (
                  <Text style={[styles.infoSubvalue, { color: themeColors.textSecondary }]}>{profile.emergency_contact_phone}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              SUPPORT
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: themeColors.card }]}
              onPress={() => console.log('Help Center tapped')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="questionmark.circle"
                  android_material_icon_name="help"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                  Help Center
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: themeColors.card }]}
              onPress={() => console.log('About tapped')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                  About
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

          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: themeColors.error }]}
            onPress={() => setShowSignOutConfirm(true)}
          >
            <IconSymbol
              ios_icon_name="arrow.right.square"
              android_material_icon_name="logout"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: themeColors.textSecondary }]}>
            Version 1.0.0
          </Text>
        </ScrollView>

        {/* Sign Out Confirmation Modal */}
        <Modal
          visible={showSignOutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSignOutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Sign Out?
              </Text>
              <Text style={[styles.modalText, { color: themeColors.textSecondary }]}>
                Are you sure you want to sign out?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.highlight }]}
                  onPress={() => setShowSignOutConfirm(false)}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.error }]}
                  onPress={handleSignOut}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Message Modal */}
        <Modal
          visible={!!errorMessage}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorMessage('')}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.modalTitle, { color: themeColors.error }]}>
                Error
              </Text>
              <Text style={[styles.modalText, { color: themeColors.textSecondary }]}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
                onPress={() => setErrorMessage('')}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.editModalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.editModalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  Edit Profile
                </Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.editModalScroll}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Display Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.display_name}
                  onChangeText={(text) => setEditForm({ ...editForm, display_name: text })}
                  placeholder="Your name"
                  placeholderTextColor={themeColors.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Sobriety Date</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                  onPress={() => {
                    console.log('[Profile] Date picker button tapped');
                    setShowDatePicker(true);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={20}
                    color={themeColors.text}
                  />
                  <Text style={[styles.datePickerText, { color: themeColors.text }]}>
                    {formatDisplayDate(editForm.sobriety_date)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    textColor={themeColors.text}
                  />
                )}

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Sponsor Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.sponsor_name}
                  onChangeText={(text) => setEditForm({ ...editForm, sponsor_name: text })}
                  placeholder="Sponsor's name"
                  placeholderTextColor={themeColors.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Sponsor Phone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.sponsor_phone}
                  onChangeText={(text) => setEditForm({ ...editForm, sponsor_phone: text })}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Emergency Contact Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.emergency_contact_name}
                  onChangeText={(text) => setEditForm({ ...editForm, emergency_contact_name: text })}
                  placeholder="Emergency contact name"
                  placeholderTextColor={themeColors.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Emergency Contact Phone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.emergency_contact_phone}
                  onChangeText={(text) => setEditForm({ ...editForm, emergency_contact_phone: text })}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Timer Minutes (Default: 15)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={String(editForm.timer_minutes)}
                  onChangeText={(text) => setEditForm({ ...editForm, timer_minutes: parseInt(text) || 15 })}
                  placeholder="15"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="number-pad"
                />

                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Timezone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editForm.timezone}
                  onChangeText={(text) => setEditForm({ ...editForm, timezone: text })}
                  placeholder="America/New_York"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </ScrollView>

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.highlight, flex: 1 }]}
                  onPress={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.primary, flex: 1 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  sobrietyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  sobrietyDays: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sobrietyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSubvalue: {
    fontSize: 14,
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editModalScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
