import React from 'react'
import { YStack, Spinner } from 'tamagui'
import { Pencil, Trash2 } from '@tamagui/lucide-icons'
import { Button } from './button'

export interface AdminActionButtonsProps {
  /**
   * Disables all buttons (when any global operation is in progress)
   */
  disabled?: boolean

  /**
   * Shows loading state on this specific item's buttons
   */
  isProcessing?: boolean

  /**
   * Handler for edit button click
   */
  onEdit: () => void

  /**
   * Handler for delete button click
   */
  onDelete: () => void

  /**
   * Optional custom variant for delete button
   * @default 'danger'
   */
  deleteVariant?: 'danger' | 'outlined'
}

export function AdminActionButtons({
  disabled = false,
  isProcessing = false,
  onEdit,
  onDelete,
  deleteVariant = 'danger',
}: AdminActionButtonsProps) {
  const isDisabled = disabled || isProcessing

  return (
    <YStack gap="$2">
      <Button
        variant="outlined"
        icon={isProcessing ? undefined : Pencil}
        onPress={onEdit}
        circular
        disabled={isDisabled}
        opacity={isDisabled ? 0.5 : 1}
      >
        {isProcessing && <Spinner size="small" color="$color11" />}
      </Button>
      <Button
        variant={deleteVariant}
        icon={isProcessing ? undefined : Trash2}
        onPress={onDelete}
        circular
        disabled={isDisabled}
        opacity={isDisabled ? 0.5 : 1}
      >
        {isProcessing && <Spinner size="small" color="white" />}
      </Button>
    </YStack>
  )
}
