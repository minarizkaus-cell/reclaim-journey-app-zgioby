
import { StyleSheet } from 'react-native';

// Recovery Support App - Calming, supportive color palette
export const colors = {
  // Light mode
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
    primary: '#667EEA', // Calming purple
    secondary: '#48BB78', // Hopeful green
    accent: '#ED8936', // Warm orange
    highlight: '#EDF2F7',
    border: '#E2E8F0',
    success: '#48BB78',
    warning: '#ED8936',
    error: '#F56565',
    moodGreat: '#48BB78',
    moodGood: '#68D391',
    moodOkay: '#ECC94B',
    moodStruggling: '#ED8936',
    moodDifficult: '#F56565',
  },
  // Dark mode
  dark: {
    background: '#1A202C',
    card: '#2D3748',
    text: '#F7FAFC',
    textSecondary: '#A0AEC0',
    primary: '#7F9CF5',
    secondary: '#68D391',
    accent: '#F6AD55',
    highlight: '#2D3748',
    border: '#4A5568',
    success: '#68D391',
    warning: '#F6AD55',
    error: '#FC8181',
    moodGreat: '#68D391',
    moodGood: '#9AE6B4',
    moodOkay: '#F6E05E',
    moodStruggling: '#F6AD55',
    moodDifficult: '#FC8181',
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
