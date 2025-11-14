'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to check if the current user is an admin
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

// Function to get all bookings (for the admin view)
export async function getAllBookings() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { data: null, error: 'Unauthorized: You must be an admin.' }
  }

  // Fetch all bookings and join them with the user's information
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      student_id,
      booking_date,
      start_time,
      end_time,
      status,
      notes,
      users (
        username,
        email
      )
    `)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// Function to update the status of any booking (for the admin)
export async function updateBookingStatus(bookingId: string, newStatus: string) {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    return { success: null, error: 'Unauthorized: You must be an admin.' }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    return { success: null, error: error.message }
  }

  // Revalidate paths to ensure the UI updates everywhere
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/bookings')

  return { success: `Booking status updated to ${newStatus}.`, error: null, data }
}
