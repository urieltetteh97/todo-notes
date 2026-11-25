import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../hooks/useTheme';
import { HIT, radius, type ThemeColors } from '../theme';
import { formatDateShort, formatTime, nextHour, toDateString, toTimeString } from '../utils/dates';

type Props = {
  mode: 'date' | 'time';
  value: Date | null;
  onValueChange: (value: Date | null) => void;
  placeholder: string;
  clearable?: boolean;
  accessibilityLabel: string;
};

// A tappable chip that picks a date or a time.
//  - Android: the chip opens the system dialog.
//  - iOS: with no value the chip sets a default value, then the native compact picker
//    takes its place (tapping it opens the system popover).
export function DateField({
  mode,
  value,
  onValueChange,
  placeholder,
  clearable = false,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const label = value
    ? mode === 'date'
      ? formatDateShort(toDateString(value))
      : formatTime(toTimeString(value))
    : placeholder;

  function open() {
    // A new time defaults to the next whole hour rather than "right now".
    const base = value ?? (mode === 'time' ? nextHour() : new Date());
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode,
        is24Hour: false,
        onValueChange: (_event, selected) => {
          if (selected) onValueChange(selected);
        },
      });
    } else {
      onValueChange(base);
    }
  }

  const showNativeCompact = Platform.OS === 'ios' && value !== null;

  return (
    <View style={styles.row}>
      {showNativeCompact ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display="compact"
          accentColor={colors.accent}
          onValueChange={(_event, selected) => {
            if (selected) onValueChange(selected);
          }}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={value ? `${accessibilityLabel}: ${label}` : accessibilityLabel}
          onPress={open}
          style={styles.chip}
        >
          <Ionicons
            name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
            size={18}
            color={colors.accent}
          />
          <Text style={styles.chipText}>{label}</Text>
        </Pressable>
      )}

      {clearable && value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear ${accessibilityLabel.toLowerCase()}`}
          onPress={() => onValueChange(null)}
          style={styles.clear}
        >
          <Ionicons name="close-circle" size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: colors.soft,
  },
  chipText: { fontSize: 14, color: colors.ink },
  clear: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  });
}
