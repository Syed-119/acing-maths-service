'use client'

import { useState, useEffect } from 'react'
import { signup, getExamBoards } from './actions'
import { useRouter } from 'next/navigation'
import type { ExamBoard } from '@/lib/types'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [studentLevel, setStudentLevel] = useState<'gcse' | 'a-level'>('gcse')
  const [examBoardId, setExamBoardId] = useState('')
  const [examBoards, setExamBoards] = useState<ExamBoard[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadExamBoards()
  }, [])

  useEffect(() => {
    // Reset exam board when level changes
    setExamBoardId('')
  }, [studentLevel])

  async function loadExamBoards() {
    console.log('Loading exam boards...') // Debug
    const result = await getExamBoards()
    console.log('Exam boards result:', result) // Debug
    
    if (result.data) {
      setExamBoards(result.data)
      console.log('Exam boards loaded:', result.data.length) // Debug
    } else {
      console.error('Error loading exam boards:', result.error)
      setError('Failed to load exam boards')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!examBoardId) {
      setError('Please select an exam board')
      return
    }

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('username', username)
    formData.append('student_level', studentLevel)
    formData.append('exam_board_id', examBoardId)

    const result = await signup(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setMessage(result.success || 'Please check your email to verify your account')
    }
  }

  const filteredExamBoards = examBoards.filter(board => board.level === studentLevel)

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
            Username:
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="student_level" style={{ display: 'block', marginBottom: '5px' }}>
            Student Level:
          </label>
          <select
            id="student_level"
            name="student_level"
            value={studentLevel}
            onChange={(e) => setStudentLevel(e.target.value as 'gcse' | 'a-level')}
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="gcse">GCSE</option>
            <option value="a-level">A-Level</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="exam_board" style={{ display: 'block', marginBottom: '5px' }}>
            Exam Board:
          </label>
          <select
            id="exam_board"
            name="exam_board"
            value={examBoardId}
            onChange={(e) => setExamBoardId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">Select an exam board...</option>
            {filteredExamBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          {filteredExamBoards.length === 0 && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
              No exam boards available for {studentLevel === 'gcse' ? 'GCSE' : 'A-Level'}
            </p>
          )}
        </div>

        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#0070f3', 
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sign Up
        </button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      <p style={{ marginTop: '15px' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  )
}
