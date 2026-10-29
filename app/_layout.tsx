import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, savePushToken } from '../config/notifications';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootLayoutNav() {
  const { colors, theme } = useTheme();

  useEffect(() => {
    async function setupNotifications() {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(token);
        }
      } catch (e) {
        console.log('Mobile notification setup error:', e);
      }
    }
    setupNotifications();
  }, []);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 250,
        contentStyle: { backgroundColor: colors.background }
      }}>
        <Stack.Screen name="index" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="auth" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="scan" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ animation: 'fade_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
