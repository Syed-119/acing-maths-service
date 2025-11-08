'use client'

import { useState, useEffect } from 'react'
import { getMyProgress, getPastPapers, addProgressEntry, deleteProgressEntry } from './actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatDate, getGradeColor } from '@/lib/utils'
import type { ProgressEntry, PastPaper } from '@/lib/types'

export default function ProgressPage() {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    past_paper_id: '',
    marks_achieved: '',
    total_marks: '',
    completed_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadProgress()
    loadPastPapers()
  }, [])

  async function loadProgress() {
    const result = await getMyProgress()
    if (result.data) {
      setProgressEntries(result.data)
    }
  }

  async function loadPastPapers() {
    const result = await getPastPapers()
    if (result.data) {
      setPastPapers(result.data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    const result = await addProgressEntry(formDataObj)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Progress entry added!' })
      setFormData({
        past_paper_id: '',
        marks_achieved: '',
        total_marks: '',
        completed_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowAddForm(false)
      loadProgress()
    }
    
    setIsLoading(false)
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    const result = await deleteProgressEntry(entryId)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Entry deleted' })
      loadProgress()
    }
  }

  const selectedPaper = pastPapers.find(p => p.id === formData.past_paper_id)

  return (
    <>
      <Navigation role="student" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Entry'}
          </Button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Add Progress Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Progress Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  label="Select Past Paper"
                  value={formData.past_paper_id}
                  onChange={(e) => {
                    const paper = pastPapers.find(p => p.id === e.target.value)
                    setFormData({
                      ...formData,
                      past_paper_id: e.target.value,
                      total_marks: paper ? paper.total_marks.toString() : ''
                    })
                  }}
                  options={[
                    { value: '', label: 'Select a paper...' },
                    ...pastPapers.map(paper => ({
                      value: paper.id,
                      label: `${paper.exam_boards?.name || 'Unknown'} - ${paper.paper_name} (${paper.year})`
                    }))
                  ]}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Marks Achieved"
                    value={formData.marks_achieved}
                    onChange={(e) => setFormData({ ...formData, marks_achieved: e.target.value })}
                    min="0"
                    max={formData.total_marks}
                    required
                  />
                  
                  <Input
                    type="number"
                    label="Total Marks"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    readOnly={!!selectedPaper}
                    required
                  />
                </div>

                {formData.marks_achieved && formData.total_marks && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Percentage</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((parseInt(formData.marks_achieved) / parseInt(formData.total_marks)) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}

                <Input
                  type="date"
                  label="Completion Date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Topics you struggled with, things to review..."
                  />
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Add Progress Entry
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Progress Entries */}
        <div className="space-y-4">
          {progressEntries.length > 0 ? (
            progressEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {entry.past_papers?.exam_boards?.name || 'Unknown'} - {entry.past_papers?.paper_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {entry.past_papers?.year} {entry.past_papers?.month}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="text-lg font-semibold">
                            {entry.marks_achieved}/{entry.total_marks}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Percentage</p>
                          <p className={`text-lg font-semibold ${getGradeColor(entry.percentage)}`}>
                            {entry.percentage.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-lg font-semibold">
                            {formatDate(entry.completed_date)}
                          </p>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No progress entries yet. Add your first one!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
