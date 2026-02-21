
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname, Link } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Debug Info Component
function DebugInfo() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  const userPresent = user ? 'true' : 'false';
  const isLoadingText = loading ? 'true' : 'false';
  const onboardedText = 'false';
  const tokenPresent = 'checking...';
  
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>Route: {pathname}</Text>
      <Text style={styles.debugText}>isLoading: {isLoadingText}</Text>
      <Text style={styles.debugText}>User present: {userPresent}</Text>
      <Text style={styles.debugText}>Onboarded: {onboardedText}</Text>
      <Text style={styles.debugText}>Token present: {tokenPresent}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const { user, fetchUser } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState<number>(5);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Web-compatible date input
  const [dateInputValue, setDateInputValue] = useState('');

  const handleNext = () => {
    console.log('[Onboarding] User tapped Next, current step:', currentStep);
    if (currentStep < 2) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      console.log('[Onboarding] Advanced to step:', nextStep);
    }
  };

  const handleBack = () => {
    console.log('[Onboarding] User tapped Back, current step:', currentStep);
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      console.log('[Onboarding] Went back to step:', prevStep);
    }
  };

  const completeOnboarding = async () => {
    console.log('[Onboarding] User tapped Get Started');
    setLoading(true);

    try {
      const formattedDate = sobrietyDate ? sobrietyDate.toISOString().split('T')[0] : null;

      console.log('[Onboarding] Saving profile data...', {
        sobriety_date: formattedDate,
        timer_minutes: selectedTimerMinutes,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        onboarded: true,
      });
      
      await authenticatedPut('/api/user/profile', {
        sobriety_date: formattedDate,
        timer_minutes: selectedTimerMinutes,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        onboarded: true,
      });

      console.log('[Onboarding] Profile saved, refreshing user session');
      await fetchUser();
      
      console.log('[Onboarding] Redirecting to home');
      router.replace('/home');
    } catch (error) {
      console.error('[Onboarding] Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (event.type === 'set' && selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        console.log('[Onboarding] Future date selected, rejecting');
        return;
      }

      console.log('[Onboarding] Sobriety date selected:', selectedDate);
      setSobrietyDate(selectedDate);
      setDateInputValue(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleWebDateInput = (value: string) => {
    setDateInputValue(value);
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date <= today) {
        console.log('[Onboarding] Web date input:', date);
        setSobrietyDate(date);
      }
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      const welcomeText = `Welcome, ${user?.name || 'Friend'}!`;
      return (
        <View style={styles.stepContainer}>
          <IconSymbol
            ios_icon_name="hand.wave.fill"
            android_material_icon_name="waving-hand"
            size={64}
            color={themeColors.primary}
          />
          <Text style={[styles.stepTitle, { color: themeColors.text }]}>
            {welcomeText}
          </Text>
          <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
            Let&apos;s set up your recovery journey together. This will only take a moment.
          </Text>
        </View>
      );
    }

    if (currentStep === 1) {
      const formattedDate = sobrietyDate
        ? sobrietyDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Not set';

      return (
        <View style={styles.stepContainer}>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={64}
            color={themeColors.primary}
          />
          <Text style={[styles.stepTitle, { color: themeColors.text }]}>
            Sobriety Date
          </Text>
          <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
            When did you start your recovery journey?
          </Text>

          {Platform.OS === 'web' ? (
            <View style={styles.webDateContainer}>
              <TextInput
                style={[styles.webDateInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                value={dateInputValue}
                onChangeText={handleWebDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textSecondary}
              />
              <Text style={[styles.webDateHelper, { color: themeColors.textSecondary }]}>
                Enter date in format: YYYY-MM-DD (e.g., 2024-01-15)
              </Text>
              {sobrietyDate && (
                <Text style={[styles.webDateDisplay, { color: themeColors.text }]}>
                  Selected: {formattedDate}
                </Text>
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: themeColors.text }]}>
                  {formattedDate}
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
            </>
          )}
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepContainer}>
          <IconSymbol
            ios_icon_name="person.fill"
            android_material_icon_name="person"
            size={64}
            color={themeColors.primary}
          />
          <Text style={[styles.stepTitle, { color: themeColors.text }]}>
            Emergency Contact
          </Text>
          <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
            Add someone you can call during difficult moments (optional).
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Contact Name"
            placeholderTextColor={themeColors.textSecondary}
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
          />

          <TextInput
            style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Contact Phone"
            placeholderTextColor={themeColors.textSecondary}
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            keyboardType="phone-pad"
          />

          <View style={styles.timerSection}>
            <Text style={[styles.timerLabel, { color: themeColors.text }]}>
              Craving Timer Duration
            </Text>
            <View style={styles.timerOptions}>
              {[5, 10, 15].map((minutes) => {
                const isSelected = selectedTimerMinutes === minutes;
                const minutesText = `${minutes} min`;
                return (
                  <React.Fragment key={minutes}>
                  <TouchableOpacity
                    style={[
                      styles.timerOption,
                      { borderColor: themeColors.border },
                      isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                    ]}
                    onPress={() => {
                      console.log('[Onboarding] Timer duration selected:', minutes);
                      setSelectedTimerMinutes(minutes);
                    }}
                  >
                    <Text style={[styles.timerOptionText, { color: isSelected ? '#FFFFFF' : themeColors.text }]}>
                      {minutesText}
                    </Text>
                  </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const canProceed = currentStep === 0 || (currentStep === 1 && sobrietyDate !== null) || currentStep === 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <DebugInfo />
      
      <Link href="/reset" style={styles.resetLink}>
        <Text style={styles.resetLinkText}>Emergency Reset</Text>
      </Link>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <React.Fragment key={step}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: isActive || isCompleted ? themeColors.primary : themeColors.border },
                ]}
              />
              </React.Fragment>
            );
          })}
        </View>

        {renderStep()}

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: themeColors.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.buttonText, { color: themeColors.text }]}>
                Back
              </Text>
            </TouchableOpacity>
          )}

          {currentStep < 2 ? (
            <TouchableOpacity
              style={[
                styles.button, 
                styles.buttonPrimary, 
                { backgroundColor: canProceed ? themeColors.primary : themeColors.border }
              ]}
              onPress={handleNext}
              disabled={!canProceed}
            >
              <Text style={styles.buttonTextPrimary}>
                Next
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { backgroundColor: themeColors.primary }]}
              onPress={completeOnboarding}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonTextPrimary}>
                  Get Started
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: '#333',
    marginBottom: 10,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resetLink: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 8,
  },
  resetLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dateButton: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  webDateContainer: {
    width: '100%',
    gap: 8,
  },
  webDateInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  webDateHelper: {
    fontSize: 12,
    textAlign: 'center',
  },
  webDateDisplay: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  timerSection: {
    width: '100%',
    marginTop: 16,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  timerOptions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  timerOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  timerOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPrimary: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
