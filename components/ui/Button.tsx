import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({ title, variant = 'primary', size = 'md', fullWidth, disabled, style, ...props }: ButtonProps) {
  const theme = useTheme();

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.md },
    md: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.md },
    lg: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, borderRadius: theme.radius.lg },
  };

  const variantColors: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: theme.colors.primary, text: theme.colors.textInverse },
    secondary: { bg: theme.colors.surface, text: theme.colors.text, border: theme.colors.border },
    ghost: { bg: 'transparent', text: theme.colors.primary },
    danger: { bg: theme.colors.danger, text: theme.colors.textInverse },
  };

  const colors = variantColors[variant];

  const textColor: 'inverse' | 'primary' | 'danger' =
    colors.text === theme.colors.textInverse ? 'inverse' : variant === 'danger' ? 'danger' : 'primary';

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: colors.bg,
          borderWidth: colors.border ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          width: fullWidth ? '100%' : undefined,
          minHeight: 44,
        },
        sizeStyles[size],
      ]}
      {...props}
    >
      <Text variant="label" color={textColor} weight="600">
        {title}
      </Text>
    </Pressable>
  );
}
