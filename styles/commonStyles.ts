
import { StyleSheet } from 'react-native';

// MyRecovery App - Calm Neutral Palette
export const colors = {
  // Dark mode (primary theme)
  dark: {
    background: '#121417',
    card: '#1B1F24',
    border: '#2A2F36',
    text: '#FFFFFF',
    textSecondary: '#A8B0BA',
    primary: '#4DAA8C',
    primaryDark: '#3D8A72',
    secondary: '#6C8CF5',
    success: '#4DAA8C',
    warning: '#FFB74D',
    error: '#D65A5A',
    moodGreat: '#4DAA8C',
    moodGood: '#6C8CF5',
    moodOkay: '#A8B0BA',
    moodStruggling: '#FFB74D',
    moodDifficult: '#D65A5A',
  },
  // Light mode (fallback)
  light: {
    background: '#FFFFFF',
    card: '#F5F5F5',
    border: '#E0E0E0',
    text: '#121417',
    textSecondary: '#A8B0BA',
    primary: '#4DAA8C',
    primaryDark: '#3D8A72',
    secondary: '#6C8CF5',
    success: '#4DAA8C',
    warning: '#FFB74D',
    error: '#D65A5A',
    moodGreat: '#4DAA8C',
    moodGood: '#6C8CF5',
    moodOkay: '#A8B0BA',
    moodStruggling: '#FFB74D',
    moodDifficult: '#D65A5A',
  },
};

export const typography = {
  screenTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
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
  },
  title: {
    ...typography.screenTitle,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
