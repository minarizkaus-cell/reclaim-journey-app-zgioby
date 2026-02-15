
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface LibraryResource {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  website?: string;
  description: string;
}

const libraryResources: LibraryResource[] = [
  {
    id: '1',
    title: 'Just For Today (Daily Reading)',
    subtitle: 'Daily meditation and reflection',
    url: 'https://www.na.org.au/just-for-today/',
  },
  {
    id: '2',
    title: 'NA Literature (Australia)',
    subtitle: 'Books, pamphlets, and resources',
    url: 'https://www.na.org.au/literature/',
  },
  {
    id: '3',
    title: 'NA Literature Downloads (PDF)',
    subtitle: 'Free downloadable literature',
    url: 'https://www.na.org.au/multi/literature-downloads/',
  },
];

const emergencyContacts: EmergencyContact[] = [
  {
    id: '0',
    name: 'Emergency – Call 000',
    phone: '000',
    description: 'Police, Fire, Ambulance',
  },
  {
    id: '1',
    name: 'Lifeline',
    phone: '13 11 14',
    website: 'https://www.lifeline.org.au',
    description: '24/7 crisis support and suicide prevention',
  },
  {
    id: '2',
    name: 'Suicide Call Back Service',
    phone: '1300 659 467',
    website: 'https://www.suicidecallbackservice.org.au',
    description: '24/7 telephone and online counselling',
  },
  {
    id: '3',
    name: 'Beyond Blue',
    phone: '1300 22 4636',
    website: 'https://www.beyondblue.org.au',
    description: 'Mental health support and information',
  },
  {
    id: '4',
    name: 'Kids Helpline',
    phone: '1800 55 1800',
    website: 'https://kidshelpline.com.au',
    description: 'Free 24/7 counselling for young people',
  },
  {
    id: '5',
    name: 'MensLine Australia',
    phone: '1300 78 99 78',
    website: 'https://mensline.org.au',
    description: '24/7 telephone and online support for men',
  },
  {
    id: '6',
    name: 'QLife',
    phone: '1800 184 527',
    website: 'https://www.qlife.org.au',
    description: 'LGBTI peer support and referral',
  },
  {
    id: '7',
    name: '1800RESPECT',
    phone: '1800 737 732',
    website: 'https://www.1800respect.org.au',
    description: 'Domestic, family and sexual violence counselling',
  },
  {
    id: '8',
    name: '13YARN',
    phone: '13 92 76',
    website: 'https://www.13yarn.org.au',
    description: 'Crisis support for Aboriginal and Torres Strait Islander peoples',
  },
  {
    id: '9',
    name: 'Poisons Information Centre',
    phone: '13 11 26',
    description: '24/7 advice on poisons, medications, and chemicals',
  },
];

export default function ResourcesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const handleCall = async (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const url = `tel:${cleanPhone}`;
    console.log('[Resources] Attempting to call:', url);
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('[Resources] Cannot open phone URL:', url);
    }
  };

  const handleWebsite = async (url: string) => {
    console.log('[Resources] Opening website:', url);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('[Resources] Cannot open URL:', url);
    }
  };

  const sectionTitleText1 = 'The Library';
  const sectionTitleText2 = 'Emergency Assistance';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{sectionTitleText1}</Text>
          <View style={[styles.sectionDivider, { backgroundColor: themeColors.border }]} />
          
          {libraryResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={[styles.libraryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => handleWebsite(resource.url)}
              activeOpacity={0.7}
            >
              <View style={styles.libraryCardContent}>
                <View style={styles.libraryCardText}>
                  <Text style={[styles.libraryTitle, { color: themeColors.text }]}>{resource.title}</Text>
                  <Text style={[styles.librarySubtitle, { color: themeColors.textSecondary }]}>{resource.subtitle}</Text>
                </View>
                <IconSymbol
                  ios_icon_name="arrow.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{sectionTitleText2}</Text>
          <View style={[styles.sectionDivider, { backgroundColor: themeColors.border }]} />
          
          {emergencyContacts.map((contact) => {
            const isEmergency = contact.id === '0';
            
            return (
              <View
                key={contact.id}
                style={[
                  styles.emergencyCard,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  isEmergency && { borderColor: themeColors.error, borderWidth: 2 },
                ]}
              >
                <View style={styles.emergencyHeader}>
                  <Text style={[styles.emergencyName, { color: themeColors.text }]}>{contact.name}</Text>
                  <Text style={[styles.emergencyDescription, { color: themeColors.textSecondary }]}>
                    {contact.description}
                  </Text>
                </View>
                
                <View style={styles.emergencyActions}>
                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      { backgroundColor: isEmergency ? themeColors.error : themeColors.primary },
                    ]}
                    onPress={() => handleCall(contact.phone)}
                  >
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.callButtonText}>{contact.phone}</Text>
                  </TouchableOpacity>
                  
                  {contact.website && (
                    <TouchableOpacity
                      style={[styles.websiteButton, { borderColor: themeColors.border }]}
                      onPress={() => handleWebsite(contact.website!)}
                    >
                      <IconSymbol
                        ios_icon_name="globe"
                        android_material_icon_name="language"
                        size={18}
                        color={themeColors.text}
                      />
                      <Text style={[styles.websiteButtonText, { color: themeColors.text }]}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    marginBottom: 16,
  },
  libraryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  libraryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  libraryCardText: {
    flex: 1,
    marginRight: 12,
  },
  libraryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  librarySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  emergencyHeader: {
    marginBottom: 12,
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  websiteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 8,
  },
  websiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
