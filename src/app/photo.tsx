import { CameraView } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { CameraPermissionGate } from '@/components/CameraPermissionGate';
import { copyToComputer } from '@/lib/computer-sync';
import { getDraft, setDraftPhoto } from '@/lib/draft';
import { errorMessage, makeImageName, oneParam } from '@/lib/format';
import { useInventory } from '@/lib/inventory-context';
import { deletePhoto, persistPhoto } from '@/lib/storage';
import { colors } from '@/theme';

export default function PhotoScreen() {
  return (
    <CameraPermissionGate>
      <PhotoCapture />
    </CameraPermissionGate>
  );
}

function PhotoCapture() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = oneParam(params.productId);
  const { products, updateProduct } = useInventory();
  const existing = productId ? products.find((product) => product.id === productId) : undefined;
  const draft = getDraft();
  const replacing = Boolean(productId);

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function shoot() {
    if (!cameraRef.current || !cameraReady || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) setPreviewUri(photo.uri);
    } catch (error) {
      Alert.alert('Could not take photo', errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!previewUri || busy) return;
    if (replacing) {
      if (!existing) return;
      setBusy(true);
      try {
        const imageName = makeImageName(existing, existing.id);
        await persistPhoto(previewUri, imageName);
        const previous = existing.imageName;
        updateProduct({
          ...existing,
          imageName,
          updatedAt: new Date().toISOString(),
        });
        if (previous !== imageName) deletePhoto(previous);
        const copied = await copyToComputer({
          imageNames: [imageName],
          deleteNames: previous === imageName ? [] : [previous],
        });
        if (!copied.ok) {
          Alert.alert('Saved on this phone', copied.message);
        }
        router.back();
      } catch (error) {
        Alert.alert('Could not save photo', errorMessage(error));
      } finally {
        setBusy(false);
      }
      return;
    }

    setDraftPhoto(previewUri);
    router.push('/details');
  }

  if (replacing && !existing) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>That item is no longer saved.</Text>
        <PrimaryButton label="Back to inventory" onPress={() => router.replace('/')} />
      </View>
    );
  }

  if (!replacing && !draft.active) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>Start from the scanner.</Text>
        <PrimaryButton label="Scan a barcode" onPress={() => router.replace('/scan')} />
      </View>
    );
  }

  const caption = replacing
    ? 'Replace photo'
    : draft.upc
      ? `UPC ${draft.upc}`
      : 'No barcode';

  if (previewUri) {
    return (
      <View style={styles.screen}>
        <Image source={{ uri: previewUri }} style={styles.preview} />
        <View style={[styles.previewBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <View style={[styles.previewActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <SecondaryButton label="Retake" onPress={() => setPreviewUri(null)} style={styles.action} />
          <PrimaryButton
            disabled={busy}
            label={busy ? 'Saving...' : replacing ? 'Save photo' : 'Use photo'}
            onPress={() => void confirm()}
            style={styles.action}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        enableTorch={torch}
        facing="back"
        mode="picture"
        onCameraReady={() => setCameraReady(true)}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.previewBar, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={close} style={styles.topButton}>
          <Text style={styles.topButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.caption}>{caption}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTorch((current) => !current)}
          style={styles.topButton}
        >
          <Text style={styles.topButtonText}>{torch ? 'Light on' : 'Light'}</Text>
        </Pressable>
      </View>
      <View style={[styles.shutterWrap, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.hint}>Fill the frame with the product.</Text>
        <Pressable
          accessibilityLabel="Take photo"
          accessibilityRole="button"
          disabled={!cameraReady || busy}
          onPress={() => void shoot()}
          style={[styles.shutter, (!cameraReady || busy) && styles.shutterDisabled]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000',
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
  },
  caption: {
    color: '#fff',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  topButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shutterWrap: {
    alignItems: 'center',
    bottom: 0,
    gap: 14,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shutter: {
    alignItems: 'center',
    borderColor: '#fff',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  shutterDisabled: {
    opacity: 0.45,
  },
  shutterInner: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  previewActions: {
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  action: {
    flex: 1,
  },
  message: {
    backgroundColor: colors.bg,
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  messageTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
