
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('User tapped Sign Out button');
    try {
      await signOut();
      console.log('Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <Stack.Screen options={{ title: 'Profile', headerLargeTitle: true }} />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              ACCOUNT
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: themeColors.card }]}
              onPress={() => console.log('Edit Profile tapped')}
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

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: themeColors.card }]}
              onPress={() => console.log('Privacy tapped')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="lock"
                  android_material_icon_name="lock"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                  Privacy
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
            onPress={handleSignOut}
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
});
