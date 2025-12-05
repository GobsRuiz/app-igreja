import { forwardRef } from 'react'
import { Button as TamaguiButton, ButtonProps as TamaguiButtonProps } from 'tamagui'
import type { IconProps } from '@tamagui/helpers-icon'

export type ButtonVariant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'info' | 'success'

export interface ButtonProps extends Omit<TamaguiButtonProps, 'variant' | 'backgroundColor' | 'color' | 'borderColor' | 'icon' | 'iconAfter'> {
  variant?: ButtonVariant
  icon?: React.ComponentType<IconProps>
  iconAfter?: React.ReactNode
}

export const Button = forwardRef<any, ButtonProps>(
  ({ variant = 'primary', icon, iconAfter, children, ...props }, ref) => {
    const variantStyles: Record<ButtonVariant, any> = {
      primary: {
        backgroundColor: '$color12',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$color11',
        },
        pressStyle: {
          backgroundColor: '$color11',
        },
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$color12',
        color: '$color12',
        hoverStyle: {
          backgroundColor: '$color2',
        },
        pressStyle: {
          backgroundColor: '$color3',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$color7',
        color: '$color12',
        hoverStyle: {
          backgroundColor: '$color2',
        },
        pressStyle: {
          backgroundColor: '$color3',
        },
      },
      danger: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$red10',
        color: '$red10',
        hoverStyle: {
          backgroundColor: '$red2',
        },
        pressStyle: {
          backgroundColor: '$red3',
        },
      },
      info: {
        backgroundColor: '$blue10',
        color: 'white',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$blue9',
        },
        pressStyle: {
          backgroundColor: '$blue9',
        },
      },
      success: {
        backgroundColor: '$green10',
        color: 'white',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$green9',
        },
        pressStyle: {
          backgroundColor: '$green9',
        },
      },
    }

    return (
      <TamaguiButton
        ref={ref}
        size="$3"
        {...variantStyles[variant]}
        icon={icon}
        iconAfter={iconAfter}
        {...props}
      >
        {children}
      </TamaguiButton>
    )
  }
)

Button.displayName = 'Button'
