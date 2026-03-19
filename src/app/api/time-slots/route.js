import { NextResponse } from 'next/server';

const availableTimeSlots = ['09:00', '12:00', '15:00', '18:00'];

export async function GET() {
  return NextResponse.json(availableTimeSlots);
}
