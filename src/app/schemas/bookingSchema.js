import { z } from 'zod';


// Starter schema for the task. Implement full validation rules from README.
export const createBookingSchema = (timeSlots = []) =>
    z.object({
    bookerName: z.string().min(2, {message: "Booker name must be at least 2 characters long"}),
    bookerEmail: z.union([
      z.string().email({ message: 'Invalid email address' }),
      z.literal(''),
    ]).optional(),
    eventName: z.string().min(2, {message: "Event name must be at least 2 characters long"}),
    eventDate: z.coerce.date().refine((date) => {
        const today = new Date();
      today.setHours(0, 0, 0, 0);

      const inputDate = new Date(date);
      inputDate.setHours(0, 0, 0, 0);

      return inputDate > today;}, {
      message: "Event date must be in the future",
    }),
    numberOfGuests: z.coerce.number().int({message: "Number of Guests must be integer"}).gte(1, {message: "Number of Guests must be at least 1"}).lte(10, {message: "Number of Guests must be less than or equal to 10"}),
    timeSlot: z.string().refine((val) => timeSlots.includes(val), {
      message: "Selected time slot is unavailable",
    }),
    eventLink: z.string().url({message: "Invalid URL. Please enter a valid event link"}),
  });
  
