import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../lib/theme';

interface Props {
  label: string;
  onRemove?: () => void;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
}

export function TagChip({ label, onRemove, onPress, selected, color }: Props) {
  // When a custom color is provided: tinted bg; selected: primary tint; default: surfaceContainer
  const bg = color
    ? `${color}22`
    : selected
    ? `${Colors.primaryContainer}33`
    : Colors.surfaceContainer;
  const textColor = color ?? (selected ? Colors.primary : Colors.subText);

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress && !onRemove}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {onRemove && (
        <Text style={[styles.remove, { color: textColor }]} onPress={onRemove}>
          {' ×'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginRight: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 0.3,
  },
  remove: {
    fontSize: 14,
    fontFamily: 'DMSans',
    lineHeight: 16,
  },
});
