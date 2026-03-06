import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import i18n from "../i18n";
import { AppProvider } from "../context/AppContext";
import { DreamProvider } from "../context/DreamContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AppProvider>
          <DreamProvider>
            <Stack>
              {/* Welcome — entry point (index.tsx) */}
              <Stack.Screen name="index" options={{ headerShown: false }} />
              {/* Tarot screens */}
              <Stack.Screen name="tarot" options={{ headerShown: false }} />
              <Stack.Screen name="pick/[spread]" options={{ headerShown: false }} />
              <Stack.Screen name="result" options={{ headerShown: false }} />
              <Stack.Screen name="premium-result" options={{ headerShown: false }} />
              <Stack.Screen name="yesno-result" options={{ headerShown: false }} />
              <Stack.Screen name="market" options={{ headerShown: false }} />
              {/* Dream Coder screens */}
              <Stack.Screen name="dream/index" options={{ headerShown: false }} />
              <Stack.Screen name="dream/input" options={{ headerShown: false }} />
              <Stack.Screen name="dream/result" options={{ headerShown: false }} />
              {/* Moon Astro screens */}
              <Stack.Screen name="astro/phase" options={{ headerShown: false }} />
              <Stack.Screen name="astro/zodiac" options={{ headerShown: false }} />
              <Stack.Screen name="astro/planet" options={{ headerShown: false }} />
              {/* Horoscope screens */}
              <Stack.Screen name="horoscope/index" options={{ headerShown: false }} />
              <Stack.Screen name="horoscope/detail" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </DreamProvider>
        </AppProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
