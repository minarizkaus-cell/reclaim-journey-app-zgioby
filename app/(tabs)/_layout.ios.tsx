
import React from 'react';
import { Redirect } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Journal</Label>
        <Icon sf={{ default: 'book', selected: 'book.fill' }} drawable="book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
