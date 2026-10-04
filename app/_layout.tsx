import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { KleeOne_400Regular, KleeOne_600SemiBold } from '@expo-google-fonts/klee-one';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { initDb } from '../src/db/client';
import { loadSettings } from '../src/db/settings';
import { useStore } from '../src/store';
import { theme } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    KleeOne_400Regular,
    KleeOne_600SemiBold,
  });

  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => loadSettings())
      .then((settings) => {
        if (Object.keys(settings).length) useStore.setState(settings);
        setDbReady(true);
      });
  }, []);

  if (!fontsLoaded || !dbReady) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.paper },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
