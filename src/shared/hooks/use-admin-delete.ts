import { Alert } from 'react-native'
import { toast } from '@shared/ui'

interface UseAdminDeleteOptions<T> {
  // Identification
  entityName: string // "Usuário", "Evento", "Local", "Categoria"
  getItemName: (item: T) => string // Function to get item display name

  // Actions
  deleteAction: (id: string) => Promise<{ error?: string | null }> // Delete function
  checkInUse?: (id: string) => Promise<{ inUse: boolean; error?: string | null }> // Optional check

  // State setters
  setLoading: (loading: boolean) => void
  setProcessingId: (id: string | null) => void // Sets the ID being deleted (for loading state)
  setIsDeleting?: (isDeleting: boolean) => void // Global flag to disable all buttons during delete (optional)

  // Customization (optional)
  inUseMessage?: string // Custom message when item is in use
  successMessage?: string // Custom success message
}

export function useAdminDelete<T extends { id: string }>(
  options: UseAdminDeleteOptions<T>
) {
  const handleDelete = async (item: T) => {
    const {
      entityName,
      getItemName,
      deleteAction,
      checkInUse,
      setLoading,
      setProcessingId,
      setIsDeleting,
      inUseMessage,
      successMessage,
    } = options

    // Block all buttons globally (like modal open)
    setIsDeleting?.(true)
    setProcessingId(item.id)

    // Check if in use (if provided)
    if (checkInUse) {
      const { inUse, error: checkError } = await checkInUse(item.id)

      if (checkError) {
        toast.error(checkError)
        setProcessingId(null)
        setIsDeleting?.(false)
        return
      }

      if (inUse) {
        Alert.alert(
          'Não é possível deletar',
          inUseMessage ||
            `Este ${entityName.toLowerCase()} está sendo usado por eventos.\n\nRemova ou altere o ${entityName.toLowerCase()} desses eventos antes de deletá-lo.`,
          [
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                setProcessingId(null)
                setIsDeleting?.(false)
              },
            },
          ]
        )
        return
      }
    }

    // Confirmation alert
    Alert.alert(
      `Deletar ${entityName}`,
      `Tem certeza que deseja deletar "${getItemName(item)}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            setProcessingId(null)
            setIsDeleting?.(false)
          },
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)

            const { error } = await deleteAction(item.id)

            if (error) {
              toast.error(error)
              setLoading(false)
              setProcessingId(null)
              setIsDeleting?.(false)
              return
            }

            toast.success(successMessage || `${entityName} deletado!`)

            // Wait for listener to update data
            setTimeout(() => {
              setLoading(false)
              setProcessingId(null)
              setIsDeleting?.(false)
            }, 300)
          },
        },
      ]
    )
  }

  return { handleDelete }
}
