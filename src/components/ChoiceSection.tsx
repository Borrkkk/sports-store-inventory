import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { colors } from '@/theme';

type Props = {
  label: string;
  hint?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  customPlaceholder?: string;
};

export function ChoiceSection({ label, hint, options, value, onChange, customPlaceholder }: Props) {
  const [customDraft, setCustomDraft] = useState(options.includes(value) ? '' : value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setCustomDraft(options.includes(value) ? '' : value);
  }, [focused, options, value]);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(value === option ? '' : option)}
          />
        ))}
      </View>
      {customPlaceholder ? (
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onBlur={() => setFocused(false)}
          onChangeText={(text) => {
            setCustomDraft(text);
            onChange(text);
          }}
          onFocus={() => {
            setFocused(true);
            setCustomDraft(options.includes(value) ? '' : value);
          }}
          placeholder={customPlaceholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={focused ? customDraft : options.includes(value) ? '' : value}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
