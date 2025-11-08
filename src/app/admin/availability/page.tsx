'use client'

import { useState, useEffect } from 'react'
import { getAvailabilitySlots, createAvailabilitySlot, deleteAvailabilitySlot } from './actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { getDayName, formatTime } from '@/lib/utils'
import type { AvailabilitySlot } from '@/lib/types'

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    day_of_week: '1',
    start_time: '09:00',
    end_time: '10:00'
  })

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    const result = await getAvailabilitySlots()
    if (result.data) {
      setSlots(result.data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    const result = await createAvailabilitySlot(formDataObj)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Slot created!' })
      setShowAddForm(false)
      loadSlots()
    }
    
    setIsLoading(false)
  }

  async function handleDelete(slotId: string) {
    if (!confirm('Are you sure you want to delete this slot?')) return
    
    const result = await deleteAvailabilitySlot(slotId)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Slot deleted' })
      loadSlots()
    }
  }

  const slotsByDay = slots.reduce((acc, slot) => {
    const day = slot.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(slot)
    return acc
  }, {} as Record<number, AvailabilitySlot[]>)

  return (
    <>
      <Navigation role="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Time Slot'}
          </Button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Add Slot Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Availability Slot</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  label="Day of Week"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  options={[
                    { value: '1', label: 'Monday' },
                    { value: '2', label: 'Tuesday' },
                    { value: '3', label: 'Wednesday' },
                    { value: '4', label: 'Thursday' },
                    { value: '5', label: 'Friday' },
                    { value: '6', label: 'Saturday' },
                    { value: '0', label: 'Sunday' }
                  ]}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    label="Start Time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                  
                  <Input
                    type="time"
                    label="End Time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Slot
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Slots by Day */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{getDayName(day)}</CardTitle>
              </CardHeader>
              <CardContent>
                {slotsByDay[day] && slotsByDay[day].length > 0 ? (
                  <div className="space-y-2">
                    {slotsByDay[day].map((slot) => (
                      <div key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No slots</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
