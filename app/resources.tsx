
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Resource {
  id: string;
  title: string;
  description: string;
  phone?: string;
  website?: string;
  icon: string;
  type: 'crisis' | 'support' | 'info';
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'National Suicide Prevention Lifeline',
    description: '24/7 crisis support for anyone in emotional distress or suicidal crisis',
    phone: '988',
    icon: 'phone',
    type: 'crisis',
  },
  {
    id: '2',
    title: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service for substance abuse',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    icon: 'support-agent',
    type: 'crisis',
  },
  {
    id: '3',
    title: 'Alcoholics Anonymous',
    description: 'Fellowship of people who share their experience, strength and hope',
    website: 'https://www.aa.org',
    icon: 'group',
    type: 'support',
  },
  {
    id: '4',
    title: 'Narcotics Anonymous',
    description: 'Community-based association of recovering drug addicts',
    website: 'https://www.na.org',
    icon: 'groups',
    type: 'support',
  },
  {
    id: '5',
    title: 'SMART Recovery',
    description: 'Science-based addiction recovery support groups',
    website: 'https://www.smartrecovery.org',
    icon: 'psychology',
    type: 'support',
  },
  {
    id: '6',
    title: 'National Institute on Drug Abuse',
    description: 'Research and information on drug abuse and addiction',
    website: 'https://www.drugabuse.gov',
    icon: 'local-library',
    type: 'info',
  },
];

export default function ResourcesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const handlePhonePress = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWebsitePress = (website: string) => {
    Linking.openURL(website);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crisis':
        return themeColors.primary;
      case 'support':
        return themeColors.success;
      case 'info':
        return themeColors.warning;
      default:
        return themeColors.primary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'crisis':
        return 'Crisis Support';
      case 'support':
        return 'Support Group';
      case 'info':
        return 'Information';
      default:
        return '';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Resources',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.emergencyBanner, { backgroundColor: themeColors.primary }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color="#FFFFFF"
            />
            <View style={styles.emergencyText}>
              <Text style={styles.emergencyTitle}>In Crisis?</Text>
              <Text style={styles.emergencySubtitle}>
                If you're in immediate danger, call 911 or go to the nearest emergency room
              </Text>
            </View>
          </View>

          {resources.map((resource) => {
            const typeColor = getTypeColor(resource.type);
            const typeLabel = getTypeLabel(resource.type);

            return (
              <View
                key={resource.id}
                style={[styles.resourceCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
              >
                <View style={styles.resourceHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${typeColor}20` }]}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name={resource.icon}
                      size={28}
                      color={typeColor}
                    />
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
                    <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
                  </View>
                </View>

                <Text style={[styles.resourceTitle, { color: themeColors.text }]}>{resource.title}</Text>
                <Text style={[styles.resourceDescription, { color: themeColors.textSecondary }]}>
                  {resource.description}
                </Text>

                <View style={styles.actionsContainer}>
                  {resource.phone && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => handlePhonePress(resource.phone!)}
                    >
                      <IconSymbol
                        ios_icon_name="phone.fill"
                        android_material_icon_name="phone"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>{resource.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {resource.website && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: themeColors.border }]}
                      onPress={() => handleWebsitePress(resource.website!)}
                    >
                      <IconSymbol
                        ios_icon_name="globe"
                        android_material_icon_name="language"
                        size={20}
                        color={themeColors.text}
                      />
                      <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Visit Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <View style={[styles.disclaimerCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.disclaimerText, { color: themeColors.textSecondary }]}>
              These resources are provided for informational purposes. MyRecovery is not affiliated with these organizations and does not provide medical advice.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emergencyBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencySubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  resourceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 12,
  },
});
