'use server'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const studentLevel = formData.get('student_level') as string
  const examBoardId = formData.get('exam_board_id') as string

  // Sign up with Supabase Auth - trigger automatically creates profile
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        username: username,
        student_level: studentLevel,
        exam_board_id: examBoardId
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

// Get all exam boards for signup dropdown
export async function getExamBoards() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_boards')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}
