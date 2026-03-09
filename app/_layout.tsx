import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  // Fonts load gracefully — if they fail (e.g. invalid TTF), the app falls back to system fonts
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay: require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    DMMono: require('../assets/fonts/DMMono-Regular.ttf'),
  });

  useEffect(() => {
    // Hide splash whether fonts loaded successfully or not
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle notification taps → deep link to relevant screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        screen?: string;
        orderId?: string;
      };

      if (data?.screen === 'OrderDetail' && data?.orderId) {
        router.push(`/order/${data.orderId}` as never);
      } else if (data?.screen === 'Reports') {
        router.push('/reports' as never);
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Don't render until fonts are resolved (either loaded or errored)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.cream} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/edit/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="reports/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
