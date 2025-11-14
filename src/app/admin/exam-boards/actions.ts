'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

// Get all exam boards
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

// Add new past paper
export async function addPastPaper(formData: FormData) {
  if (!await isAdmin()) {
    return { success: null, error: 'Unauthorized' }
  }
  
  const supabase = await createClient()
  
  const examBoardId = formData.get('exam_board_id') as string
  const paperName = formData.get('paper_name') as string
  const year = parseInt(formData.get('year') as string)
  const month = formData.get('month') as string
  const totalMarks = parseInt(formData.get('total_marks') as string)
  const level = formData.get('level') as string
  const paperNumber = formData.get('paper_number') as string
  
  const { data, error } = await supabase
    .from('past_papers')
    .insert({
      exam_board_id: examBoardId,
      paper_name: paperName,
      year: year,
      month: month,
      total_marks: totalMarks,
      level: level,
      paper_number: paperNumber
    })
    .select()
    .single()
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/admin/past-papers')
  return { success: 'Past paper added successfully', error: null, data }
}
