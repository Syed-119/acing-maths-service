'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return {
      success: null,
      error: error.message,
    }
  }

  revalidatePath('/', 'layout')
  
  return {
    success: 'Login successful',
    error: null,
  }
}
