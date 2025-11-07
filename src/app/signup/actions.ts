'use server'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // Sign up with Supabase Auth - trigger automatically creates profile
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        username: username, // Stored in raw_user_meta_data
      }
    }
  })

  if (authError) {
    return {
      success: null,
      error: authError.message,
    }
  }

  return {
    success: 'Please check your email to verify your account',
    error: null,
  }
}
