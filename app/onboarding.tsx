
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
import DateTimePicker from '@react-native-community/datetimepicker';

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

  // Step 2: Emergency Contact
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  // Step 3: Personalize
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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
      setCurrentStep(currentStep + 1);
      console.log('[Onboarding] Moving to step:', currentStep + 1);
    } else {
      // Step 3: Finish onboarding
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    console.log('[Onboarding] Completing onboarding with data:', {
      sponsor_name: sponsorName,
      sponsor_phone: sponsorPhone,
      timer_minutes: timerMinutes,
      sobriety_date: sobrietyDate,
    });

    try {
      const profileUpdates: any = {
        onboarded: true,
        timer_minutes: timerMinutes,
      };

      if (sponsorName.trim()) {
        profileUpdates.sponsor_name = sponsorName.trim();
      }
      if (sponsorPhone.trim()) {
        profileUpdates.sponsor_phone = sponsorPhone.trim();
      }
      if (sobrietyDate) {
        profileUpdates.sobriety_date = sobrietyDate;
      }

      console.log('[Onboarding] Sending profile updates:', profileUpdates);
      await authenticatedPut('/api/user/profile', profileUpdates);
      console.log('[Onboarding] Profile updated successfully');
      
      // Refresh user context
      await fetchUser();
      
      // Navigate to home
      router.replace('/(tabs)/(home)/');
    } catch (err: any) {
      console.error('[Onboarding] Failed to complete onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setSobrietyDate(formattedDate);
      console.log('[Onboarding] Sobriety date selected:', formattedDate);
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
                Sponsor Name (Optional)
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
                placeholder="Enter sponsor name"
                placeholderTextColor={themeColors.textSecondary}
                value={sponsorName}
                onChangeText={setSponsorName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Sponsor Phone (Optional)
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
                value={sponsorPhone}
                onChangeText={setSponsorPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
              Used for quick access on Home
            </Text>
          </View>
        );

      case 2:
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
                  const isSelected = timerMinutes === minutes;
                  const minutesText = `${minutes} min`;
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
                        console.log('[Onboarding] Timer minutes selected:', minutes);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.timerButtonText,
                        { color: isSelected ? '#FFFFFF' : themeColors.text }
                      ]}>
                        {minutesText}
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
              
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={themeColors.textSecondary}
                  value={sobrietyDate}
                  onChangeText={setSobrietyDate}
                  maxLength={10}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dateButton,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                      }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[
                      styles.dateButtonText,
                      { color: sobrietyDate ? themeColors.text : themeColors.textSecondary }
                    ]}>
                      {sobrietyDate || 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const continueButtonText = currentStep === 2 ? 'Finish' : 'Continue';
  const isContinueDisabled = currentStep === 0 && !agreedToTerms;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dot Indicator */}
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

        {/* Step Content */}
        {renderStep()}

        {/* Error Message */}
        {error ? (
          <Text style={[styles.errorText, { color: themeColors.error }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      {/* Footer with Continue Button */}
      <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: themeColors.primary },
            isContinueDisabled && styles.continueButtonDisabled
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
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
