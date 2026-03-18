import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OrdersProvider } from '../context/OrdersContext';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

// Inner layout reads theme colors
function InnerLayout() {
  const router = useRouter();
  const { colors } = useTheme();

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

  return (
    <>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} backgroundColor={colors.header} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order/new" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/edit/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="reports/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="backup/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay: require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    DMMono: require('../assets/fonts/DMMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <OrdersProvider>
        <ProfileProvider>
          <InnerLayout />
        </ProfileProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}
