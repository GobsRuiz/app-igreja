import { z } from 'zod'

// Schema de Anexo
export const AttachmentSchema = z.object({
  url: z.string().url('Invalid attachment URL'),
  name: z.string().trim().min(1, 'Attachment name required'),
  type: z.string().optional(),
})

export type Attachment = z.infer<typeof AttachmentSchema>

// Schema do Event com validações robustas
export const EventSchema = z.object({
  id: z.string().trim().min(1, 'Event ID is required'),
  title: z.string().trim().min(1, 'Event title cannot be empty'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:mm format'),
  church: z.string().trim().min(1, 'Church name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  conductor: z.string().trim().min(1, 'Conductor is required'),
  description: z.string().trim().optional(),
  attachments: z.array(AttachmentSchema).default([]),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  status: z.enum(['active', 'finished', 'cancelled']).default('active'),
  isFavorite: z.boolean().default(false),
  isNotifying: z.boolean().default(false),
})

export type Event = z.infer<typeof EventSchema>

// Helper para parse com validação (lança erro se inválido)
export function parseEvent(json: unknown): Event {
  return EventSchema.parse(json)
}

// Helper para parse seguro (retorna { success: boolean, data/error })
export function safeParseEvent(json: unknown) {
  return EventSchema.safeParse(json)
}

// Helper para parse de array
export function parseEventArray(jsonArray: unknown): Event[] {
  return z.array(EventSchema).parse(jsonArray)
}
