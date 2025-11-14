'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get available time slots for a specific date
export async function getAvailableSlots(date: Date) {
  const supabase = await createClient()
  const dateString = date.toISOString().split('T')[0]

  // New, simpler query: Find all slots for the exact date provided.
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('available_date', dateString)
    .order('start_time', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// Create a new booking
export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }
  
  const bookingDate = formData.get('booking_date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const notes = formData.get('notes') as string
  
  // Check if slot is still available
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_date', bookingDate)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .in('status', ['pending', 'confirmed'])
    .single()
  
  if (existingBooking) {
    return { success: null, error: 'This time slot is no longer available' }
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      student_id: user.id,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      notes: notes,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/bookings')
  return { success: 'Booking created successfully', error: null, data }
}

// Get user's bookings
export async function getMyBookings() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_id', user.id)
    .order('booking_date', { ascending: true })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// Cancel a booking
export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('student_id', user.id)
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/bookings')
  return { success: 'Booking cancelled successfully', error: null }
}
