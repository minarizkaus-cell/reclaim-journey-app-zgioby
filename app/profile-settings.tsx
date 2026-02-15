
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedPut, authenticatedPost } from '@/utils/api';
import { User } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { fetchUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  // Form fields
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Inline validation
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[ProfileSettings] Loading profile...');
      const data = await authenticatedGet<User>('/api/user/profile');
      console.log('[ProfileSettings] Profile loaded:', data);
      setProfile(data);

      // Populate form fields
      setEmergencyContactName(data.emergency_contact_name || '');
      setEmergencyContactPhone(data.emergency_contact_phone || '');
      setTimerMinutes(data.timer_minutes || 15);
      
      if (data.sobriety_date) {
        const date = new Date(data.sobriety_date);
        setSobrietyDate(date);
      }
    } catch (error) {
      console.error('[ProfileSettings] Failed to load profile:', error);
      setErrorMessage('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidPassword = (passwordText: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z0-9]{8,}$/;
    return passwordRegex.test(passwordText);
  };

  const validateNewPasswordField = (text: string) => {
    setNewPassword(text);
    if (!text.trim()) {
      setNewPasswordError('New password is required');
    } else if (!isValidPassword(text)) {
      setNewPasswordError('Min 8 chars, 1 uppercase, 1 lowercase, 1 number, no spaces/special chars');
    } else {
      setNewPasswordError('');
    }
  };

  const validateConfirmPasswordField = (text: string) => {
    setConfirmNewPassword(text);
    if (!text.trim()) {
      setConfirmPasswordError('Please confirm your new password');
    } else if (text !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSaveProfile = async () => {
    console.log('[ProfileSettings] Saving profile...');
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const updates: any = {
        timer_minutes: timerMinutes,
      };

      if (emergencyContactName.trim()) {
        updates.emergency_contact_name = emergencyContactName.trim();
      }
      if (emergencyContactPhone.trim()) {
        updates.emergency_contact_phone = emergencyContactPhone.trim();
      }
      if (sobrietyDate) {
        const year = sobrietyDate.getFullYear();
        const month = String(sobrietyDate.getMonth() + 1).padStart(2, '0');
        const day = String(sobrietyDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        updates.sobriety_date = formattedDate;
        console.log('[ProfileSettings] Formatted sobriety date:', formattedDate);
      }

      console.log('[ProfileSettings] Sending updates:', updates);
      await authenticatedPut('/api/user/profile', updates);
      console.log('[ProfileSettings] Profile updated successfully');
      
      await fetchUser();
      setSuccessMessage('Profile updated successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('[ProfileSettings] Failed to save profile:', error);
      setErrorMessage(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    console.log('[ProfileSettings] Changing password...');
    
    // Validate fields
    if (!currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setPasswordError('New password must be 8+ chars with 1 uppercase, 1 lowercase, 1 number, no special chars');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await authenticatedPost('/api/user/change-password', {
        currentPassword,
        newPassword,
      });
      
      console.log('[ProfileSettings] Password changed successfully');
      setPasswordSuccess('Password changed successfully!');
      setPasswordError('');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setNewPasswordError('');
      setConfirmPasswordError('');
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      console.error('[ProfileSettings] Failed to change password:', error);
      let errorMsg = 'Failed to change password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid') || error.message.includes('incorrect') || error.message.includes('401')) {
          errorMsg = 'Current password is incorrect';
        } else if (error.message.includes('password') && error.message.includes('requirements')) {
          errorMsg = 'New password does not meet requirements';
        }
      }
      
      setPasswordError(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('[ProfileSettings] Date picker event:', event.type, selectedDate);
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed') {
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
      return;
    }
    
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        console.log('[ProfileSettings] Future date selected, rejecting');
        setErrorMessage('Cannot select a future date for sobriety date.');
        if (Platform.OS === 'ios') {
          setShowDatePicker(false);
        }
        return;
      }
      
      setSobrietyDate(selectedDate);
      console.log('[ProfileSettings] Sobriety date selected:', selectedDate);
      setErrorMessage('');
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const openPasswordModal = () => {
    console.log('[ProfileSettings] Opening change password modal');
    setShowPasswordModal(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const sobrietyDateDisplay = sobrietyDate 
    ? sobrietyDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not set';

  const isPasswordFormValid = currentPassword && newPassword && confirmNewPassword && !newPasswordError && !confirmPasswordError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {successMessage ? (
          <View style={styles.successBanner}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={20}
              color="#4CAF50"
            />
            <Text style={[styles.successText, { color: '#4CAF50' }]}>
              {successMessage}
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            EMERGENCY CONTACT
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Contact Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }
              ]}
              placeholder="Enter contact name"
              placeholderTextColor={themeColors.textSecondary}
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              editable={!saving}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Contact Phone
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }
              ]}
              placeholder="Enter phone number"
              placeholderTextColor={themeColors.textSecondary}
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            PREFERENCES
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Timer Duration
            </Text>
            <View style={styles.timerOptions}>
              {[10, 15, 20].map((minutes) => {
                const isSelected = timerMinutes === minutes;
                const minutesLabel = `${minutes} min`;
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.timerButton,
                      { borderColor: themeColors.border },
                      isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                    ]}
                    onPress={() => {
                      setTimerMinutes(minutes);
                      console.log('[ProfileSettings] Timer minutes selected:', minutes);
                    }}
                    activeOpacity={0.7}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.timerButtonText,
                      { color: isSelected ? '#FFFFFF' : themeColors.text }
                    ]}>
                      {minutesLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Sobriety Date
            </Text>
            
            <TouchableOpacity
              style={[
                styles.input,
                styles.dateButton,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                }
              ]}
              onPress={() => {
                console.log('[ProfileSettings] Date picker button tapped');
                setShowDatePicker(true);
              }}
              disabled={saving}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={themeColors.text}
              />
              <Text style={[
                styles.dateButtonText,
                { color: sobrietyDate ? themeColors.text : themeColors.textSecondary }
              ]}>
                {sobrietyDateDisplay}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={sobrietyDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            SECURITY
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={openPasswordModal}
            disabled={saving}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.settingText, { color: themeColors.text }]}>
              Change Password
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: themeColors.primary },
            saving && styles.saveButtonDisabled
          ]}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Change Password
            </Text>

            {passwordSuccess ? (
              <View style={styles.successContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={48}
                  color="#4CAF50"
                />
                <Text style={[styles.passwordSuccessText, { color: '#4CAF50' }]}>
                  {passwordSuccess}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.passwordInputContainer}>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: themeColors.background, 
                        borderColor: themeColors.border,
                        color: themeColors.text,
                        paddingRight: 48,
                      }]}
                      placeholder="Current Password"
                      placeholderTextColor={themeColors.textSecondary}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                      editable={!changingPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconModal}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={changingPassword}
                    >
                      <IconSymbol
                        ios_icon_name={showCurrentPassword ? "eye.slash.fill" : "eye.fill"}
                        android_material_icon_name={showCurrentPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordInputContainer}>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: themeColors.background, 
                        borderColor: newPasswordError ? '#E57373' : themeColors.border,
                        color: themeColors.text,
                        paddingRight: 48,
                      }]}
                      placeholder="New Password"
                      placeholderTextColor={themeColors.textSecondary}
                      value={newPassword}
                      onChangeText={validateNewPasswordField}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      editable={!changingPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconModal}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={changingPassword}
                    >
                      <IconSymbol
                        ios_icon_name={showNewPassword ? "eye.slash.fill" : "eye.fill"}
                        android_material_icon_name={showNewPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {newPasswordError ? (
                    <Text style={styles.fieldError}>{newPasswordError}</Text>
                  ) : null}
                </View>

                <View style={styles.passwordInputContainer}>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: themeColors.background, 
                        borderColor: confirmPasswordError ? '#E57373' : themeColors.border,
                        color: themeColors.text,
                        paddingRight: 48,
                      }]}
                      placeholder="Confirm New Password"
                      placeholderTextColor={themeColors.textSecondary}
                      value={confirmNewPassword}
                      onChangeText={validateConfirmPasswordField}
                      secureTextEntry={!showConfirmNewPassword}
                      autoCapitalize="none"
                      editable={!changingPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconModal}
                      onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      disabled={changingPassword}
                    >
                      <IconSymbol
                        ios_icon_name={showConfirmNewPassword ? "eye.slash.fill" : "eye.fill"}
                        android_material_icon_name={showConfirmNewPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text style={styles.fieldError}>{confirmPasswordError}</Text>
                  ) : null}
                </View>

                {passwordError ? (
                  <View style={styles.passwordErrorContainer}>
                    <Text style={styles.passwordErrorText}>{passwordError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: themeColors.border }]}
                    onPress={closePasswordModal}
                    disabled={changingPassword}
                  >
                    <Text style={[styles.modalButtonTextSecondary, { color: themeColors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.modalButtonPrimary, 
                      { backgroundColor: themeColors.primary },
                      (!isPasswordFormValid || changingPassword) && styles.modalButtonDisabled
                    ]}
                    onPress={handleChangePassword}
                    disabled={!isPasswordFormValid || changingPassword}
                  >
                    {changingPassword ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Change Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    flex: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.3)',
  },
  errorText: {
    color: '#E57373',
    fontSize: 14,
    textAlign: 'center',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
  },
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 16,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInputContainer: {
    marginBottom: 12,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIconModal: {
    position: 'absolute',
    right: 12,
    top: 15,
    padding: 4,
  },
  fieldError: {
    color: '#E57373',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordErrorContainer: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.3)',
  },
  passwordErrorText: {
    color: '#E57373',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  passwordSuccessText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
