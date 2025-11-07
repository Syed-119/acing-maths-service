'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error.message)
    // Don't return - just log the error
  }

  revalidatePath('/', 'layout')
  redirect('/login')
  
  // No return statement needed - redirect terminates execution
}
