
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, TouchableOpacity, View, StyleSheet, Image, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SystemBars } from "react-native-edge-to-edge";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

function HeaderRightButtons() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          console.log('[Header] User tapped Home icon');
          router.push('/home');
        }}
      >
        <IconSymbol
          ios_icon_name="house"
          android_material_icon_name="home"
          size={24}
          color={themeColors.text}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          console.log('[Header] User tapped Settings icon');
          router.push('/settings');
        }}
      >
        <IconSymbol
          ios_icon_name="gear"
          android_material_icon_name="settings"
          size={24}
          color={themeColors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

function HomeHeaderLeft() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <View style={styles.homeHeaderLeft}>
      <Image
        source={require('@/assets/images/final_quest_240x240.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.appName, { color: themeColors.text }]}>
        MyRecovery
      </Text>
    </View>
  );
}

function HomeHeaderRight() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => {
        console.log('[Header] User tapped Settings icon from Home');
        router.push('/settings');
      }}
    >
      <IconSymbol
        ios_icon_name="gear"
        android_material_icon_name="settings"
        size={24}
        color={themeColors.text}
      />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SystemBars style="light" />
        <AuthProvider>
          <WidgetProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                headerStyle: {
                  backgroundColor: colors.dark.background,
                },
                headerTintColor: colors.dark.text,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 18,
                },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
              <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="reset" options={{ headerShown: false }} />
              
              {/* Home screen with custom header */}
              <Stack.Screen 
                name="home" 
                options={{ 
                  headerShown: true,
                  headerLeft: () => <HomeHeaderLeft />,
                  headerRight: () => <HomeHeaderRight />,
                  headerTitle: '',
                  headerStyle: {
                    backgroundColor: colors.dark.background,
                  },
                }} 
              />
              
              {/* Settings screen */}
              <Stack.Screen 
                name="settings" 
                options={{ 
                  headerShown: true, 
                  title: "Settings",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Coping Tools screen */}
              <Stack.Screen 
                name="coping-tools" 
                options={{ 
                  headerShown: true, 
                  title: "Coping Tools",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Progress screen */}
              <Stack.Screen 
                name="progress" 
                options={{ 
                  headerShown: true, 
                  title: "Progress",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Craving Flow */}
              <Stack.Screen 
                name="craving-flow" 
                options={{ 
                  headerShown: true, 
                  title: "Craving Support",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Journal screens */}
              <Stack.Screen 
                name="journal" 
                options={{ 
                  headerShown: true, 
                  title: "Journal",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              <Stack.Screen 
                name="journal-add" 
                options={{ 
                  presentation: "modal", 
                  headerShown: true, 
                  title: "Add Journal Entry",
                  headerBackTitle: "Cancel",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              <Stack.Screen 
                name="journal-detail" 
                options={{ 
                  headerShown: true, 
                  title: "Journal Entry",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Calendar */}
              <Stack.Screen 
                name="calendar" 
                options={{ 
                  headerShown: true, 
                  title: "Calendar",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Resources */}
              <Stack.Screen 
                name="resources" 
                options={{ 
                  headerShown: true, 
                  title: "Resources",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Profile Settings */}
              <Stack.Screen 
                name="profile-settings" 
                options={{ 
                  headerShown: true, 
                  title: "Edit Profile",
                  headerBackTitle: "Back",
                  headerRight: () => <HeaderRightButtons />
                }} 
              />
              
              {/* Verify Email */}
              <Stack.Screen 
                name="verify-email" 
                options={{ 
                  headerShown: true, 
                  title: "Verify Email",
                  headerBackTitle: "Back",
                }} 
              />
              
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </WidgetProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  homeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
