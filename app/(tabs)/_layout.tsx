
import React from 'react';
import { useColorScheme } from 'react-native';
import { Redirect } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const tabs = [
    {
      name: 'Journal',
      route: '/(tabs)/(home)/',
      ios_icon_name: 'book.fill',
      android_material_icon_name: 'book' as const,
    },
    {
      name: 'Progress',
      route: '/(tabs)/progress',
      ios_icon_name: 'chart.bar.fill',
      android_material_icon_name: 'bar-chart' as const,
    },
    {
      name: 'Profile',
      route: '/(tabs)/profile',
      ios_icon_name: 'person.fill',
      android_material_icon_name: 'person' as const,
    },
  ];

  return <FloatingTabBar tabs={tabs} />;
}
