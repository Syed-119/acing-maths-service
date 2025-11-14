'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all past papers
export async function getPastPapers(level?: 'gcse' | 'a-level') {
  const supabase = await createClient()
  
  let query = supabase
    .from('past_papers')
    .select(`
      *,
      exam_boards (name, level)
    `)
    .order('year', { ascending: false })
  
  if (level) {
    query = query.eq('level', level)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// Add progress entry
export async function addProgressEntry(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }
  
  const pastPaperId = formData.get('past_paper_id') as string
  const marksAchieved = parseInt(formData.get('marks_achieved') as string)
  const totalMarks = parseInt(formData.get('total_marks') as string)
  const completedDate = formData.get('completed_date') as string
  const notes = formData.get('notes') as string
  
  const { data, error } = await supabase
    .from('student_progress')
    .insert({
      student_id: user.id,
      past_paper_id: pastPaperId,
      marks_achieved: marksAchieved,
      total_marks: totalMarks,
      completed_date: completedDate,
      notes: notes
    })
    .select()
    .single()
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/progress')
  return { success: 'Progress entry added', error: null, data }
}

// Get user's progress
export async function getMyProgress() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('student_progress')
    .select(`
      *,
      past_papers (
        paper_name,
        year,
        month,
        exam_boards (name, level)
      )
    `)
    .eq('student_id', user.id)
    .order('completed_date', { ascending: false })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// Get progress statistics
export async function getProgressStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('student_progress')
    .select('marks_achieved, total_marks, percentage')
    .eq('student_id', user.id)
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  // Calculate statistics
  const totalPapers = data?.length || 0
  const averagePercentage = data?.reduce((sum, entry) => sum + (entry.percentage || 0), 0) / totalPapers || 0
  const highestScore = Math.max(...(data?.map(entry => entry.percentage || 0) || [0]))
  
  return { 
    data: {
      totalPapers,
      averagePercentage: averagePercentage.toFixed(2),
      highestScore: highestScore.toFixed(2)
    }, 
    error: null 
  }
}

// Delete progress entry
export async function deleteProgressEntry(entryId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('student_progress')
    .delete()
    .eq('id', entryId)
    .eq('student_id', user.id)
  
  if (error) {
    return { success: null, error: error.message }
  }
  
  revalidatePath('/progress')
  return { success: 'Progress entry deleted', error: null }
}

// Add this function to progress/actions.ts

export async function addCustomPastPaper(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }

  const paperName = formData.get('paper_name') as string
  const totalMarks = parseInt(formData.get('total_marks') as string)

  // Get user's exam board and level
  const { data: userData } = await supabase
    .from('users')
    .select('exam_board_id, student_level')
    .eq('id', user.id)
    .single()

  if (!userData?.exam_board_id) {
    return { success: null, error: 'Please set your exam board in profile first' }
  }

  // Create custom past paper
  const { data, error } = await supabase
    .from('past_papers')
    .insert({
      exam_board_id: userData.exam_board_id,
      paper_name: paperName,
      year: new Date().getFullYear(),
      month: new Date().toLocaleString('default', { month: 'long' }),
      total_marks: totalMarks,
      level: userData.student_level,
      paper_number: 'Custom'
    })
    .select()
    .single()

  if (error) {
    return { success: null, error: error.message }
  }

  revalidatePath('/progress')
  return { success: 'Custom paper added', error: null, data }
}

// Add this new function to allow students to create custom papers
export async function addCustomProgressEntry(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: null, error: 'Not authenticated' }
  }

  const paperName = formData.get('paper_name') as string
  const marksAchieved = parseInt(formData.get('marks_achieved') as string)
  const totalMarks = parseInt(formData.get('total_marks') as string)
  const completedDate = formData.get('completed_date') as string
  const notes = formData.get('notes') as string

  // Get user's exam board and level
  const { data: userData } = await supabase
    .from('users')
    .select('exam_board_id, student_level')
    .eq('id', user.id)
    .single()

  if (!userData?.exam_board_id) {
    return { success: null, error: 'Please set your exam board in your profile first' }
  }

  // Create custom past paper first
  const { data: paperData, error: paperError } = await supabase
    .from('past_papers')
    .insert({
      exam_board_id: userData.exam_board_id,
      paper_name: paperName,
      year: new Date().getFullYear(),
      month: new Date().toLocaleString('default', { month: 'long' }),
      total_marks: totalMarks,
      level: userData.student_level,
      paper_number: 'Custom'
    })
    .select()
    .single()

  if (paperError) {
    return { success: null, error: paperError.message }
  }

  // Now create the progress entry
  const { data, error } = await supabase
    .from('student_progress')
    .insert({
      student_id: user.id,
      past_paper_id: paperData.id,
      marks_achieved: marksAchieved,
      total_marks: totalMarks,
      completed_date: completedDate,
      notes: notes
    })
    .select()
    .single()

  if (error) {
    return { success: null, error: error.message }
  }

  revalidatePath('/progress')
  return { success: 'Progress entry added successfully', error: null, data }
}

