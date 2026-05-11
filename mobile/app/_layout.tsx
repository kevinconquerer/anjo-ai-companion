import { useEffect, useState } from 'react';
import { SplashScreen, Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getToken, hasCompletedOnboarding } from '../lib/storage';
import { AuthContext } from '../lib/auth-context';
import { ThemeProvider } from '../lib/theme-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [authed, setAuthed]       = useState<boolean | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router   = useRouter();
  const segments = useSegments();

  // Load auth + onboarding status once on mount
  useEffect(() => {
    (async () => {
      try {
        const token    = await getToken();
        const isAuthed = !!token;
        setAuthed(isAuthed);
        // Only check onboarding for authenticated users
        setOnboarded(isAuthed ? await hasCompletedOnboarding() : false);
      } catch {
        setAuthed(false);
        setOnboarded(false);
      }
    })();
  }, []);

  // Route once both states are resolved
  useEffect(() => {
    if (authed === null || onboarded === null) return;
    SplashScreen.hideAsync();
    const inAuth = segments[0] === '(auth)';
    const inApp  = segments[0] === '(app)';
    if (!authed && !inAuth) {
      router.replace('/(auth)/login');
    } else if (authed && !inApp) {
      router.replace(onboarded ? '/(app)/chat' : '/(app)/onboarding');
    }
  }, [authed, onboarded, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthContext.Provider value={{ setAuthed }}>
          <Slot />
        </AuthContext.Provider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
