import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/src/theme';
import { useState } from 'react';

export function Input({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          borderWidth: 1,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          fontSize: theme.typography.sizes.base,
          minHeight: 48,
        },
        style,
      ]}
      {...props}
    />
  );
}
