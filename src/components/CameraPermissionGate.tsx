import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { colors } from '@/theme';

export function CameraPermissionGate({ children }: { children: ReactNode }) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    const blocked = permission.canAskAgain === false;
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Camera access is needed</Text>
        <Text style={styles.body}>
          The camera scans barcodes and photographs each product. Photos stay in this app until you export them.
        </Text>
        {blocked ? (
          <PrimaryButton label="Open Settings" onPress={() => void Linking.openSettings()} />
        ) : (
          <PrimaryButton label="Allow camera" onPress={() => void requestPermission()} />
        )}
        <SecondaryButton
          label="Not now"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
        {blocked ? (
          <Text style={styles.note}>
            Camera access is off. Turn it on for Expo Go, or for Apparel Inventory if you installed a standalone build.
          </Text>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    backgroundColor: colors.bg,
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
