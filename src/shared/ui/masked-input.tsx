import { forwardRef } from 'react'
import MaskInput, { type MaskInputProps } from 'react-native-mask-input'
import { useTheme } from 'tamagui'
import type { TextInput } from 'react-native'

// Brazilian masks presets
export const MASKS = {
  CEP: [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/],
  CPF: [
    /\d/,
    /\d/,
    /\d/,
    '.',
    /\d/,
    /\d/,
    /\d/,
    '.',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
  ],
  CNPJ: [
    /\d/,
    /\d/,
    '.',
    /\d/,
    /\d/,
    /\d/,
    '.',
    /\d/,
    /\d/,
    /\d/,
    '/',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
  ],
  RG: [/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/],
  PHONE: [
    '(',
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ],
  CELLPHONE: [
    '(',
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    ' ',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ],
} as const

export type MaskPreset = keyof typeof MASKS

export interface MaskedInputProps extends Omit<MaskInputProps, 'mask'> {
  mask?: MaskInputProps['mask']
  preset?: MaskPreset
  error?: boolean
}

export const MaskedInput = forwardRef<TextInput, MaskedInputProps>(
  ({ preset, mask, error = false, style, placeholderTextColor, ...props }, ref) => {
    const theme = useTheme()

    const finalMask = preset ? MASKS[preset] : mask

    const baseStyles = {
      height: 50,
      borderColor: error ? theme.red10?.val : theme.borderColor?.val || '#e5e5e5',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.background?.val || '#fff',
      fontSize: 14,
      color: theme.color12?.val || '#000',
    }

    return (
      <MaskInput
        ref={ref}
        mask={finalMask}
        style={[baseStyles, style]}
        placeholderTextColor={placeholderTextColor || theme.color11?.val || '#666'}
        {...props}
      />
    )
  }
)

MaskedInput.displayName = 'MaskedInput'
