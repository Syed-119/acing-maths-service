'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }
  
  const username = formData.get('username') as string
  const studentLevel = formData.get('student_level') as string

  
  const { error } = await supabase
    .from('users')
    .update({
      username: username,
      student_level: studentLevel,
   
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'Profile updated successfully', error: null }
}

export async function getProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}
