import React, { ReactNode } from 'react'
import { XStack } from 'tamagui'
import { X } from '@tamagui/lucide-icons'
import { Button } from './button'

export interface AdminModalFooterProps {
  /**
   * Text for cancel button
   * @default 'Cancelar'
   */
  cancelText?: string

  /**
   * Text for confirm button (can be dynamic based on state)
   * Example: submitting ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'
   */
  confirmText: string

  /**
   * Handler for cancel button click
   */
  onCancel: () => void

  /**
   * Handler for confirm button click
   */
  onConfirm: () => void

  /**
   * Disables confirm button (validation logic)
   */
  confirmDisabled: boolean

  /**
   * Controls loading state and disabled state of both buttons
   */
  submitting: boolean

  /**
   * Hide confirm button completely (for view-only modes like finished events)
   * @default false
   */
  hideConfirm?: boolean

  /**
   * Custom cancel button flex value
   * @default 1
   */
  cancelFlex?: number

  /**
   * Custom confirm button flex value
   * @default 1
   */
  confirmFlex?: number
}

export function AdminModalFooter({
  cancelText = 'Cancelar',
  confirmText,
  onCancel,
  onConfirm,
  confirmDisabled,
  submitting,
  hideConfirm = false,
  cancelFlex = 1,
  confirmFlex = 1,
}: AdminModalFooterProps) {
  return (
    <XStack gap="$3">
      <Button
        flex={cancelFlex}
        variant="outlined"
        icon={X}
        onPress={onCancel}
        disabled={submitting}
        opacity={submitting ? 0.5 : 1}
      >
        {cancelText}
      </Button>

      {!hideConfirm && (
        <Button
          flex={confirmFlex}
          variant="primary"
          onPress={onConfirm}
          disabled={confirmDisabled}
          opacity={confirmDisabled ? 0.5 : 1}
        >
          {confirmText}
        </Button>
      )}
    </XStack>
  )
}
