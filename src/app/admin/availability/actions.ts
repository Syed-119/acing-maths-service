// src/app/admin/availability/actions.ts

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// This function now gets ALL slots from today onwards
export async function getAvailabilitySlots() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .gte('available_date', new Date().toISOString().split('T')[0]) // Only get future slots
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// This function is updated to take a specific date
export async function createAvailabilitySlot(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    available_date: formData.get('available_date') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
  }

  // Basic validation
  if (!rawData.available_date || !rawData.start_time || !rawData.end_time) {
    return { success: null, error: 'Missing required fields.' }
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .insert(rawData)
    .select()
    .single()

  if (error) return { success: null, error: error.message }
  
  revalidatePath('/admin/availability')
  return { success: 'Slot created successfully!', error: null, data }
}

// No changes needed for delete
export async function deleteAvailabilitySlot(slotId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', slotId)

  if (error) return { success: null, error: error.message }

  revalidatePath('/admin/availability')
  return { success: 'Slot deleted successfully!', error: null }
}
