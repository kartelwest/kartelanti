import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/theme';

export function Card({ style, children, ...props }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
