import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useCountdown } from '../hooks/useCountdown';
import { UrgencyColors } from '../lib/theme';
import type { TextStyle } from 'react-native';

interface Props {
  dueDate: Date | string;
  style?: TextStyle;
  showIcon?: boolean;
}

export function CountdownTimer({ dueDate, style, showIcon = true }: Props) {
  const { timeLeft, urgency, isOverdue } = useCountdown(dueDate);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (urgency === 'critical') {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [urgency]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const color = UrgencyColors[urgency];

  return (
    <Animated.Text
      style={[
        styles.base,
        { color },
        urgency === 'critical' && animatedStyle,
        style,
      ]}
    >
      {showIcon && '⏱ '}
      {timeLeft}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 12,
    fontFamily: 'DMMono',
    letterSpacing: 0.5,
  },
});
