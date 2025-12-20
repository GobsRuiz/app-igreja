import { Pencil, Trash2 } from '@tamagui/lucide-icons'
import React from 'react'
import { XStack } from 'tamagui'
import { Button } from './button'

export interface AdminActionButtonsProps {
  /**
   * Disables all buttons (when any global operation is in progress)
   */
  disabled?: boolean

  /**
   * Shows loading state on EDIT button specifically
   */
  isEditProcessing?: boolean

  /**
   * Shows loading state on DELETE button specifically
   */
  isDeleteProcessing?: boolean

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
  isEditProcessing = false,
  isDeleteProcessing = false,
  onEdit,
  onDelete,
  deleteVariant = 'danger',
}: AdminActionButtonsProps) {
  const isEditDisabled = disabled || isEditProcessing
  const isDeleteDisabled = disabled || isDeleteProcessing

  return (
    <XStack gap="$2">
      {/* Edit Button */}
      <Button
        variant="outlined"
        icon={Pencil}
        onPress={onEdit}
        circular
        disabled={isEditDisabled}
        opacity={isEditDisabled ? 0.5 : 1}
      />

      {/* Delete Button */}
      <Button
        variant={deleteVariant}
        icon={Trash2}
        onPress={onDelete}
        circular
        disabled={isDeleteDisabled}
        opacity={isDeleteDisabled ? 0.5 : 1}
      />
    </XStack>
  )
}
