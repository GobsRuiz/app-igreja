import { forwardRef } from 'react'
import { XStack, XStackProps, Text } from 'tamagui'
import type { IconProps } from '@tamagui/helpers-icon'

export type BadgeVariant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'info' | 'success'

export interface BadgeProps extends Omit<XStackProps, 'variant'> {
  variant?: BadgeVariant
  icon?: React.ComponentType<IconProps>
  children?: React.ReactNode
}

export const Badge = forwardRef<any, BadgeProps>(
  ({ variant = 'primary', icon: Icon, children, ...props }, ref) => {
    const variantStyles: Record<BadgeVariant, any> = {
      primary: {
        backgroundColor: '$color12',
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$color12',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$color7',
      },
      danger: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$red10',
      },
      info: {
        backgroundColor: '$blue10',
        borderWidth: 0,
      },
      success: {
        backgroundColor: '$green10',
        borderWidth: 0,
      },
    }

    const textColors: Record<BadgeVariant, string> = {
      primary: '$color1',
      outlined: '$color12',
      ghost: '$color12',
      danger: '$red10',
      info: 'white',
      success: 'white',
    }

    const iconColors: Record<BadgeVariant, string> = {
      primary: '$color1',
      outlined: '$color12',
      ghost: '$color12',
      danger: '$red10',
      info: 'white',
      success: 'white',
    }

    return (
      <XStack
        ref={ref}
        alignItems="center"
        gap="$1.5"
        paddingHorizontal="$2.5"
        paddingVertical="$1.5"
        borderRadius="$10"
        {...variantStyles[variant]}
        {...props}
      >
        {Icon && <Icon size={14} color={iconColors[variant]} />}
        <Text fontSize="$2" fontWeight="500" color={textColors[variant]}>
          {children}
        </Text>
      </XStack>
    )
  }
)

Badge.displayName = 'Badge'
