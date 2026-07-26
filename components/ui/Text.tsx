import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/src/theme';

type TextVariant = 'title' | 'heading' | 'body' | 'muted' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'text' | 'muted' | 'inverse' | 'primary' | 'danger' | 'success' | 'warning';
  align?: 'left' | 'center' | 'right';
  weight?: TextStyle['fontWeight'];
}

export function Text({ variant = 'body', color = 'text', align = 'left', weight, style, ...props }: TextProps) {
  const theme = useTheme();

  const variantStyles: Record<TextVariant, TextStyle> = {
    title: { fontSize: theme.typography.sizes.xxl, fontWeight: '700', lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xxl },
    heading: { fontSize: theme.typography.sizes.lg, fontWeight: '600', lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.lg },
    body: { fontSize: theme.typography.sizes.base, fontWeight: '400', lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base },
    muted: { fontSize: theme.typography.sizes.sm, fontWeight: '400', lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm },
    caption: { fontSize: theme.typography.sizes.xs, fontWeight: '500', lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.xs },
    label: { fontSize: theme.typography.sizes.sm, fontWeight: '600', lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm },
  };

  const colorMap: Record<typeof color, string> = {
    text: theme.colors.text,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
    primary: theme.colors.primary,
    danger: theme.colors.danger,
    success: theme.colors.success,
    warning: theme.colors.warning,
  };

  return (
    <RNText
      style={[
        { color: colorMap[color], textAlign: align },
        variantStyles[variant],
        weight ? { fontWeight: weight } : undefined,
        style,
      ]}
      {...props}
    />
  );
}
