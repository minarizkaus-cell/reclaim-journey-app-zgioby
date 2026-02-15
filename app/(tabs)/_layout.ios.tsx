
import React from 'react';
import { useColorScheme } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { Href } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const tabs = [
    {
      name: 'Home',
      label: 'Home',
      route: '/(tabs)/(home)/' as Href,
      icon: 'home' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      name: 'Coping Tools',
      label: 'Tools',
      route: '/(tabs)/coping-tools' as Href,
      icon: 'favorite' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      name: 'Progress',
      label: 'Progress',
      route: '/(tabs)/progress' as Href,
      icon: 'trending-up' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      name: 'Settings',
      label: 'Settings',
      route: '/(tabs)/settings' as Href,
      icon: 'settings' as keyof typeof MaterialIcons.glyphMap,
    },
  ];

  return <FloatingTabBar tabs={tabs} />;
}
