import React, { ReactNode } from 'react'
import { YStack, Text } from 'tamagui'

export interface FormFieldProps {
  /**
   * Label text for the field
   */
  label: string

  /**
   * Shows asterisk (*) after label if true
   * @default false
   */
  required?: boolean

  /**
   * The input component (Input, TextArea, Dropdown, etc.)
   */
  children: ReactNode

  /**
   * Additional spacing gap between label and input
   * @default '$2'
   */
  gap?: string | number
}

export function FormField({
  label,
  required = false,
  children,
  gap = '$2',
}: FormFieldProps) {
  return (
    <YStack gap={gap}>
      <Text fontSize="$3" fontWeight="600" color="$color11">
        {label}{required ? ' *' : ''}
      </Text>
      {children}
    </YStack>
  )
}
