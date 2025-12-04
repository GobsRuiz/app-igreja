import { z } from 'zod'

export const BrazilStateSchema = z.object({
  name: z.string().min(1, 'State name required'),
  code: z.string().length(2, 'State code must be 2 characters'),
  cities: z.array(z.string()).min(1, 'State must have at least one city'),
})

export type BrazilState = z.infer<typeof BrazilStateSchema>

export const LocationFilterSchema = z.object({
  state: z.string().optional(),
  city: z.string().optional(),
  radiusKm: z.number().min(1, 'Radius must be at least 1km').max(100, 'Radius cannot exceed 100km'),
})

export type LocationFilter = z.infer<typeof LocationFilterSchema>
