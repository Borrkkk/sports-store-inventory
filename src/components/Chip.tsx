import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.chip,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: {
    backgroundColor: colors.navy,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  labelOn: {
    color: '#fff',
  },
});
