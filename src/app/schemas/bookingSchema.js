import { z } from 'zod';

// Starter schema for the task. Implement full validation rules from README.
export const createBookingSchema = () =>
  z.object({
    bookerName: z.string(),
    bookerEmail: z.string().optional(),
    eventName: z.string(),
    eventDate: z.any(),
    numberOfGuests: z.any(),
    timeSlot: z.string(),
    eventLink: z.string(),
  });
