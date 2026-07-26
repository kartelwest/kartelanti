import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/theme';
import { Text } from './Text';

interface PillProps extends ViewProps {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}

export function Pill({ label, color = 'muted', style, ...props }: PillProps) {
  const theme = useTheme();
  const colorMap = {
    primary: { bg: theme.colors.primaryMuted, text: theme.colors.primary },
    success: { bg: '#E6F7EA', text: theme.colors.success },
    warning: { bg: '#FFF5E6', text: theme.colors.warning },
    danger: { bg: '#FDECEC', text: theme.colors.danger },
    muted: { bg: theme.colors.border, text: theme.colors.textMuted },
  };
  const c = colorMap[color];

  return (
    <View
      style={[
        { backgroundColor: c.bg, borderRadius: theme.radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
        style,
      ]}
      {...props}
    >
      <Text variant="caption" color={color === 'primary' ? 'primary' : color === 'success' ? 'success' : color === 'warning' ? 'warning' : color === 'danger' ? 'danger' : 'muted'} weight="600">
        {label}
      </Text>
    </View>
  );
}
