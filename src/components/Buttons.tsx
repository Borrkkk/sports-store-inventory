import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function DangerButton({ label, onPress, disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.danger, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondary: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  danger: {
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  dangerText: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
