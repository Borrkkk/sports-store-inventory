import { CameraView, type BarcodeType } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { CameraPermissionGate } from '@/components/CameraPermissionGate';
import { clearDraft, beginDraft } from '@/lib/draft';
import { errorMessage, formatWhen, productName } from '@/lib/format';
import { copyToComputer } from '@/lib/computer-sync';
import { useInventory } from '@/lib/inventory-context';
import { photoUri } from '@/lib/storage';
import type { Product } from '@/lib/types';
import { normalizeUpc } from '@/lib/upc';
import { colors } from '@/theme';

const BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'];

export default function ScanScreen() {
  return (
    <CameraPermissionGate>
      <Scanner />
    </CameraPermissionGate>
  );
}

function Scanner() {
  const insets = useSafeAreaInsets();
  const { findByUpc, incrementQuantity } = useInventory();
  const [torch, setTorch] = useState(false);
  const [duplicate, setDuplicate] = useState<Product | null>(null);
  const lock = useRef(false);
  const cooldownUntil = useRef(0);
  const findRef = useRef(findByUpc);
  findRef.current = findByUpc;

  useFocusEffect(
    useCallback(() => {
      lock.current = false;
      cooldownUntil.current = Date.now() + 800;
      setDuplicate(null);
      return () => {
        lock.current = true;
      };
    }, []),
  );

  function closeScanner() {
    clearDraft();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function continueWithoutBarcode() {
    if (lock.current) return;
    lock.current = true;
    beginDraft(null);
    router.push('/photo');
  }

  function scanAnother() {
    lock.current = false;
    cooldownUntil.current = Date.now() + 1200;
    setDuplicate(null);
  }

  async function addOne() {
    if (!duplicate) return;
    try {
      incrementQuantity(duplicate.id);
      setDuplicate((current) => (current ? { ...current, quantity: current.quantity + 1 } : current));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void copyToComputer({ imageNames: [] });
    } catch (error) {
      Alert.alert('Could not update quantity', errorMessage(error));
    }
  }

  return (
    <View style={styles.screen}>
      <CameraView
        active={!duplicate}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        enableTorch={torch}
        facing="back"
        onBarcodeScanned={
          duplicate
            ? undefined
            : (result) => {
                if (lock.current || Date.now() < cooldownUntil.current) return;
                const upc = normalizeUpc(result.data);
                if (upc.length < 6) return;
                lock.current = true;
                const existing = findRef.current(upc);
                if (existing) {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
                  setDuplicate(existing);
                  return;
                }
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                beginDraft(upc);
                router.push('/photo');
              }
        }
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.mask}>
        <View style={styles.maskFlex} />
        <View style={styles.maskMiddle}>
          <View style={styles.maskSide} />
          <View style={styles.frame} />
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom} />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={closeScanner} style={styles.topButton}>
          <Text style={styles.topButtonText}>Close</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTorch((current) => !current)}
          style={styles.topButton}
        >
          <Text style={styles.topButtonText}>{torch ? 'Light on' : 'Light'}</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.hint}>Point at the UPC on the tag or packaging.</Text>
        <PrimaryButton label="No barcode, continue anyway" onPress={continueWithoutBarcode} />
      </View>

      {duplicate ? (
        <View style={styles.duplicateWrap}>
          <View style={[styles.duplicate, { marginBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.duplicateTitle}>Already logged</Text>
            <Text style={styles.duplicateBody}>
              This UPC is already in your inventory. Back out, or add one if you have another of the same item.
            </Text>
            <View style={styles.duplicateRow}>
              <Image source={{ uri: photoUri(duplicate.imageName) }} style={styles.duplicateImage} />
              <View style={styles.duplicateCopy}>
                <Text style={styles.duplicateCategory}>{productName(duplicate) || duplicate.category}</Text>
                <Text style={styles.duplicateMeta}>{duplicate.upc}</Text>
                <Text style={styles.duplicateMeta}>Quantity {duplicate.quantity}</Text>
                <Text style={styles.duplicateMeta}>{formatWhen(duplicate.createdAt)}</Text>
              </View>
            </View>
            <PrimaryButton label="Back out" onPress={closeScanner} />
            <SecondaryButton label="Add 1 to quantity" onPress={() => void addOne()} />
            <Pressable
              onPress={() => router.push(`/product/${duplicate.id}`)}
              style={styles.textButton}
            >
              <Text style={styles.textButtonLabel}>View saved item</Text>
            </Pressable>
            <Pressable onPress={scanAnother} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Scan a different item</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000',
    flex: 1,
  },
  mask: {
    ...StyleSheet.absoluteFill,
  },
  maskFlex: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
  },
  maskBottom: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1.35,
  },
  maskMiddle: {
    flexDirection: 'row',
    height: 160,
  },
  maskSide: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
  },
  frame: {
    borderColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    width: '74%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
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
  bottom: {
    bottom: 0,
    gap: 12,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  duplicateWrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  duplicate: {
    backgroundColor: colors.card,
    borderRadius: 20,
    gap: 12,
    marginHorizontal: 12,
    padding: 16,
  },
  duplicateTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  duplicateBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  duplicateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  duplicateImage: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    height: 84,
    width: 84,
  },
  duplicateCopy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  duplicateCategory: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  duplicateMeta: {
    color: colors.muted,
    fontSize: 14,
  },
  textButton: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  textButtonLabel: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});
