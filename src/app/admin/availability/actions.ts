'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Check if user is admin
async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role === 'admin'
}

// Create availability slot
export async function createAvailabilitySlot(formData: FormData) {
  if (!await isAdmin()) {
    return { success: null, error: 'Unauthorized' }
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const dayOfWeek = parseInt(formData.get('day_of_week') as string)
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  
  const { data, error } = await supabase
    .from('availability_slots')
    .insert({
      admin_id: user?.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_available: true
    })
    .select()
    .single()
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/admin/availability')
  return { success: 'Availability slot created', error: null, data }
}

// Get all availability slots
export async function getAvailabilitySlots() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// Delete availability slot
export async function deleteAvailabilitySlot(slotId: string) {
  if (!await isAdmin()) {
    return { success: null, error: 'Unauthorized' }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', slotId)
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/admin/availability')
  return { success: 'Slot deleted successfully', error: null }
}

// Get all bookings (admin only)
export async function getAllBookings() {
  if (!await isAdmin()) {
    return { data: null, error: 'Unauthorized' }
  }
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      users:student_id (username, email)
    `)
    .order('booking_date', { ascending: true })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// Update booking status (admin only)
export async function updateBookingStatus(bookingId: string, status: string) {
  if (!await isAdmin()) {
    return { success: null, error: 'Unauthorized' }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/admin/bookings')
  return { success: 'Booking status updated', error: null }
}
