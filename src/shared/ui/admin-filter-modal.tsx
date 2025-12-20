import React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { BottomSheetModal } from './bottom-sheet-modal'
import { Button } from './button'

export interface AdminFilterModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean

  /**
   * Callback when modal closes
   */
  onClose: () => void

  /**
   * Callback when "Aplicar" button is pressed
   */
  onApply: () => void

  /**
   * Callback when "Limpar" button is pressed
   */
  onClear: () => void

  /**
   * Modal title
   * @default 'Filtros'
   */
  title?: string

  /**
   * Filter content (inputs, dropdowns, etc.)
   */
  children: React.ReactNode
}

/**
 * Generic Admin Filter Modal
 *
 * Pattern: Same as FilterModal used in user area
 * - Uses BottomSheetModal with fixed header + footer
 * - "Limpar" and "Aplicar" buttons in footer
 * - Customizable content via children
 *
 * @example
 * ```tsx
 * <AdminFilterModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onApply={handleApply}
 *   onClear={handleClear}
 *   title="Filtrar Usuários"
 * >
 *   <YStack gap="$3">
 *     <Input placeholder="Buscar..." value={search} onChangeText={setSearch} />
 *     <Dropdown ... />
 *   </YStack>
 * </AdminFilterModal>
 * ```
 */
export function AdminFilterModal({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = 'Filtros',
  children,
}: AdminFilterModalProps) {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      header={
        <Text fontSize="$6" fontWeight="700" color="$color12">
          {title}
        </Text>
      }
      footer={
        <XStack gap="$3">
          <Button flex={1} variant="outlined" onPress={onClear}>
            Limpar
          </Button>
          <Button flex={1} variant="primary" onPress={onApply}>
            Aplicar
          </Button>
        </XStack>
      }
      contentContainerProps={{ padding: '$4', gap: '$5' }}
    >
      {children}
    </BottomSheetModal>
  )
}
