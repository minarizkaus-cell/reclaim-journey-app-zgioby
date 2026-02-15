
import { StyleSheet } from 'react-native';

// MyRecovery App - Dark theme with specified colors
export const colors = {
  // Dark mode (primary theme)
  dark: {
    background: '#0F1115',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    primary: '#E57373',
    primaryDark: '#D35F5F',
    success: '#81C784',
    warning: '#FFB74D',
    error: '#E57373',
    moodGreat: '#81C784',
    moodGood: '#AED581',
    moodOkay: '#FFD54F',
    moodStruggling: '#FFB74D',
    moodDifficult: '#E57373',
  },
  // Light mode (fallback)
  light: {
    background: '#FFFFFF',
    card: '#F5F5F5',
    border: '#E0E0E0',
    text: '#0F1115',
    textSecondary: 'rgba(0,0,0,0.6)',
    primary: '#E57373',
    primaryDark: '#D35F5F',
    success: '#81C784',
    warning: '#FFB74D',
    error: '#E57373',
    moodGreat: '#81C784',
    moodGood: '#AED581',
    moodOkay: '#FFD54F',
    moodStruggling: '#FFB74D',
    moodDifficult: '#E57373',
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
