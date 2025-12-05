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
  conductor: z.string().trim().min(1, 'Conductor is required'),
  description: z.string().trim().min(1, 'Description is required'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  attachments: z.array(AttachmentSchema).default([]),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  isFavorite: z.boolean().default(false),
  isNotifying: z.boolean().default(false),
})
  .refine(
    (data) =>
      (data.latitude != null && data.longitude != null) ||
      (data.latitude == null && data.longitude == null),
    { message: 'Latitude and longitude must both be provided or both be null' }
  )

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
