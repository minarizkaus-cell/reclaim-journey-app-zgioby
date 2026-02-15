
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
      name: 'Home',
      route: '/(tabs)/(home)/',
      ios_icon_name: 'house.fill',
      android_material_icon_name: 'home' as const,
    },
    {
      name: 'Coping Tools',
      route: '/(tabs)/coping-tools',
      ios_icon_name: 'heart.fill',
      android_material_icon_name: 'favorite' as const,
    },
    {
      name: 'Progress',
      route: '/(tabs)/progress',
      ios_icon_name: 'chart.bar.fill',
      android_material_icon_name: 'trending-up' as const,
    },
    {
      name: 'Settings',
      route: '/(tabs)/settings',
      ios_icon_name: 'gearshape.fill',
      android_material_icon_name: 'settings' as const,
    },
  ];

  return <FloatingTabBar tabs={tabs} />;
}
