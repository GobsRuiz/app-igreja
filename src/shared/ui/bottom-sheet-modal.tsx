import { forwardRef, useCallback, useEffect, useMemo, useRef, useImperativeHandle } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import { YStack, type YStackProps } from 'tamagui'

/**
 * Snap point configurations
 * - 'small': 40% height - quick actions, confirmations
 * - 'medium': 60% height - forms, filters
 * - 'large': 90% height - detailed content, full lists
 * - 'full': 95% height - maximum content
 */
export type BottomSheetSize = 'small' | 'medium' | 'large' | 'full'

const SNAP_POINT_MAP: Record<BottomSheetSize, string> = {
  small: '40%',
  medium: '60%',
  large: '90%',
  full: '95%',
}

export interface BottomSheetModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean

  /**
   * Callback when modal closes (via backdrop, pan down, or programmatic)
   */
  onClose: () => void

  /**
   * Modal size preset
   * @default 'large'
   */
  size?: BottomSheetSize

  /**
   * Custom snap points (overrides size prop)
   * @example ['50%', '90%']
   */
  snapPoints?: string[]

  /**
   * Initial snap index when opening
   * @default 0
   */
  initialSnapIndex?: number

  /**
   * Header content (fixed at top)
   */
  header?: React.ReactNode

  /**
   * Main content (scrollable)
   */
  children: React.ReactNode

  /**
   * Footer content (fixed at bottom)
   */
  footer?: React.ReactNode

  /**
   * Enable pan down to close gesture
   * @default true
   */
  enablePanDownToClose?: boolean

  /**
   * Additional props for the content wrapper
   */
  contentContainerProps?: YStackProps

  /**
   * Custom style for BottomSheetScrollView's contentContainerStyle
   * Use this for custom paddingBottom, etc.
   * @example { paddingBottom: 40 }
   */
  scrollContentContainerStyle?: StyleProp<ViewStyle>

  /**
   * Test ID for testing
   */
  testID?: string
}

export interface BottomSheetModalRef {
  /**
   * Programmatically open modal to specific snap index
   */
  snapToIndex: (index: number) => void

  /**
   * Programmatically close modal
   */
  close: () => void
}

/**
 * Professional BottomSheet Modal component
 *
 * Features:
 * - Fixed header + scrollable content + fixed footer
 * - Multiple size presets or custom snap points
 * - Automatic backdrop with dismiss on tap
 * - Pan down to close gesture
 * - Proper TypeScript typing
 * - Tamagui tokens for theming
 * - Performance optimized (memoized callbacks)
 * - Follows @gorhom/bottom-sheet best practices
 *
 * @example
 * ```tsx
 * <BottomSheetModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="large"
 *   header={
 *     <Text fontSize="$6" fontWeight="700">Title</Text>
 *   }
 *   footer={
 *     <XStack gap="$3">
 *       <Button flex={1} variant="outlined" onPress={onCancel}>Cancel</Button>
 *       <Button flex={1} variant="primary" onPress={onConfirm}>Confirm</Button>
 *     </XStack>
 *   }
 * >
 *   <YStack padding="$4" gap="$4">
 *     {content}
 *   </YStack>
 * </BottomSheetModal>
 * ```
 */
export const BottomSheetModal = forwardRef<BottomSheetModalRef, BottomSheetModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'large',
      snapPoints: customSnapPoints,
      initialSnapIndex = 0,
      header,
      children,
      footer,
      enablePanDownToClose = true,
      contentContainerProps,
      scrollContentContainerStyle,
      testID,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheet>(null)

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        bottomSheetRef.current?.snapToIndex(index)
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    // Determine snap points
    const snapPoints = useMemo(() => {
      if (customSnapPoints) return customSnapPoints
      return [SNAP_POINT_MAP[size]]
    }, [customSnapPoints, size])

    // Sync isOpen state with bottomSheet
    useEffect(() => {
      if (isOpen) {
        bottomSheetRef.current?.snapToIndex(initialSnapIndex)
      } else {
        bottomSheetRef.current?.close()
      }
    }, [isOpen, initialSnapIndex])

    // Backdrop component (memoized for performance)
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    )

    // Footer component (memoized for performance)
    const renderFooter = useCallback(
      (props: any) => {
        if (!footer) return null

        return (
          <BottomSheetFooter {...props} bottomInset={0}>
            <YStack
              padding="$4"
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
            >
              {footer}
            </YStack>
          </BottomSheetFooter>
        )
      },
      [footer]
    )

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={isOpen ? initialSnapIndex : -1}
        enablePanDownToClose={enablePanDownToClose}
        onClose={onClose}
        backdropComponent={renderBackdrop}
        footerComponent={footer ? renderFooter : undefined}
        {...(testID && { accessibilityLabel: testID })}
      >
        {/* Header (fixed) */}
        {header && (
          <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
            {header}
          </YStack>
        )}

        {/* Content (scrollable) */}
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.scrollContent,
            scrollContentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <YStack {...contentContainerProps}>{children}</YStack>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  }
)

BottomSheetModal.displayName = 'BottomSheetModal'

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
})
