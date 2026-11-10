import { enableLegacyHeaderAppearance, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { InventoryProvider } from '@/lib/inventory-context';
import { colors } from '@/theme';

enableLegacyHeaderAppearance();

export default function RootLayout() {
  return (
    <InventoryProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Inventory' }} />
        <Stack.Screen name="scan" options={{ headerShown: false, title: 'Scan barcode' }} />
        <Stack.Screen name="photo" options={{ headerShown: false, title: 'Photograph product' }} />
        <Stack.Screen name="details" options={{ title: 'Categories' }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Item' }} />
      </Stack>
    </InventoryProvider>
  );
}
