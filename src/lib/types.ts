export interface User {
  id: string
  email: string
  username: string
  student_level: 'gcse' | 'a-level'
  role: 'student' | 'admin'
  exam_board_id?: string
  created_at: string
  updated_at: string
}


export interface Booking {
  id: string
  student_id: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  users?: {
    username: string
    email: string
  }
}

export interface AvailabilitySlot {
  id: string
  admin_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export interface ExamBoard {
  id: string
  name: string
  level: 'gcse' | 'a-level'
  created_at: string
}

export interface PastPaper {
  id: string
  exam_board_id: string
  paper_name: string
  year: number
  month: string
  total_marks: number
  level: 'gcse' | 'a-level'
  paper_number?: string
  exam_boards?: ExamBoard
}

export interface ProgressEntry {
  id: string
  student_id: string
  past_paper_id: string
  marks_achieved: number
  total_marks: number
  percentage: number
  completed_date: string
  notes?: string
  past_papers?: PastPaper & {
    exam_boards?: ExamBoard
  }
}

export interface ProgressStats {
  totalPapers: number
  averagePercentage: string
  highestScore: string
}
