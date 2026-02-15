
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { fetchUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Important Notice
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 2: Emergency Contact (replaced sponsor fields)
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Step 3: Personalize
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState(15);
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleNext = async () => {
    console.log('[Onboarding] User tapped Next/Continue button, current step:', currentStep);
    setError('');

    // Step 1 validation
    if (currentStep === 0 && !agreedToTerms) {
      setError('You must agree to continue.');
      return;
    }

    // Move to next step or finish
    if (currentStep < 2) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      console.log('[Onboarding] Moving to step:', nextStep);
    } else {
      // Step 3: Finish onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      console.log('[Onboarding] Moving back to step:', prevStep);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    console.log('[Onboarding] Completing onboarding with data:', {
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      timer_minutes: selectedTimerMinutes,
      sobriety_date: sobrietyDate,
    });

    try {
      const profileUpdates: any = {
        onboarded: true,
        timer_minutes: selectedTimerMinutes,
      };

      if (emergencyContactName.trim()) {
        profileUpdates.emergency_contact_name = emergencyContactName.trim();
      }
      if (emergencyContactPhone.trim()) {
        profileUpdates.emergency_contact_phone = emergencyContactPhone.trim();
      }
      if (sobrietyDate) {
        const year = sobrietyDate.getFullYear();
        const month = String(sobrietyDate.getMonth() + 1).padStart(2, '0');
        const day = String(sobrietyDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        profileUpdates.sobriety_date = formattedDate;
        console.log('[Onboarding] Formatted sobriety date:', formattedDate);
      }

      console.log('[Onboarding] Sending profile updates:', profileUpdates);
      await authenticatedPut('/api/user/profile', profileUpdates);
      console.log('[Onboarding] Profile updated successfully');
      
      await fetchUser();
      
      router.replace('/(tabs)/(home)/');
    } catch (err: any) {
      console.error('[Onboarding] Failed to complete onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('[Onboarding] Date picker event:', event.type, selectedDate);
    
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
        console.log('[Onboarding] Future date selected, rejecting');
        setError('Cannot select a future date for sobriety date.');
        if (Platform.OS === 'ios') {
          setShowDatePicker(false);
        }
        return;
      }
      
      setSobrietyDate(selectedDate);
      console.log('[Onboarding] Sobriety date selected:', selectedDate);
      setError('');
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={64}
                color={themeColors.warning}
              />
            </View>
            
            <Text style={[styles.stepTitle, { color: themeColors.text }]}>
              Important Notice
            </Text>
            
            <Text style={[styles.warningText, { color: themeColors.textSecondary }]}>
              This app is designed as a supplemental support tool for your recovery journey. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </Text>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                console.log('[Onboarding] User toggled agreement checkbox:', !agreedToTerms);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { borderColor: themeColors.border },
                agreedToTerms && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}>
                {agreedToTerms && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={18}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: themeColors.text }]}>
                I understand and agree to use this app as a supplemental support tool
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={64}
                color={themeColors.primary}
              />
            </View>
            
            <Text style={[styles.stepTitle, { color: themeColors.text }]}>
              Emergency Contact
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
              />
            </View>

            <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
              Used for quick access on Home
            </Text>
          </View>
        );

      case 2:
        const sobrietyDateDisplay = sobrietyDate 
          ? sobrietyDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Select date';
        
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="slider.horizontal.3"
                android_material_icon_name="settings"
                size={64}
                color={themeColors.primary}
              />
            </View>
            
            <Text style={[styles.stepTitle, { color: themeColors.text }]}>
              Personalize
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Timer Duration
              </Text>
              <View style={styles.timerOptions}>
                {[10, 15, 20].map((minutes) => {
                  const isSelected = selectedTimerMinutes === minutes;
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
                        setSelectedTimerMinutes(minutes);
                        console.log('[Onboarding] Timer minutes selected:', minutes);
                      }}
                      activeOpacity={0.7}
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
                Sobriety Date (Optional)
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
                  console.log('[Onboarding] Date picker button tapped');
                  setShowDatePicker(true);
                }}
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
        );

      default:
        return null;
    }
  };

  const continueButtonText = currentStep === 2 ? 'Get Started' : 'Continue';
  const isContinueDisabled = currentStep === 0 && !agreedToTerms;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => {
            const isActive = index === currentStep;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? themeColors.primary : themeColors.border,
                  }
                ]}
              />
            );
          })}
        </View>

        {renderStep()}

        {error ? (
          <Text style={[styles.errorText, { color: themeColors.error }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[
              styles.backButton,
              { borderColor: themeColors.border }
            ]}
            onPress={handleBack}
            disabled={loading}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-left"
              size={20}
              color={themeColors.text}
            />
            <Text style={[styles.backButtonText, { color: themeColors.text }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: themeColors.primary },
            isContinueDisabled && styles.continueButtonDisabled,
            currentStep === 0 && styles.continueButtonFull
          ]}
          onPress={handleNext}
          disabled={isContinueDisabled || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              {continueButtonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxLabel: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
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
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
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
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonFull: {
    flex: 1,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
