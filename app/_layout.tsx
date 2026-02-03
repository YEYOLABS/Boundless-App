
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import React, { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { 
  initializeNotificationService, 
  setupNotificationResponseListener 
} from "@/services/notificationService";
import { useColorScheme, Alert, View, ActivityIndicator, Text, StyleSheet } from "react-native";
import "react-native-reanimated";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useNetworkState } from "expo-network";
import { Stack, router, useSegments } from "expo-router";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isConnected } = useNetworkState();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  useEffect(() => {
    if (isLoading || !loaded) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/(home)");
    }
  }, [isAuthenticated, segments, isLoading, loaded]);

  useEffect(() => {
    initializeNotificationService();
    
    setupNotificationResponseListener((screen, data) => {
      console.log('[Notification] User tapped notification:', screen, data);
      
      if (screen === 'daily-check') {
        router.push('/daily-check');
      }
    });
  }, []);

  if (!loaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2962FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="daily-check" options={{ headerShown: false }} />
        <Stack.Screen name="pre-tour" options={{ headerShown: false }} />
        <Stack.Screen name="post-tour" options={{ headerShown: false }} />
        <Stack.Screen name="float-management" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle-details" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="formsheet"
          options={{
            presentation: "formSheet",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="transparent-modal"
          options={{
            presentation: "transparentModal",
            headerShown: false,
            animation: "fade",
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ExpenseProvider>
          <WidgetProvider>
            <RootLayoutNav />
          </WidgetProvider>
        </ExpenseProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
