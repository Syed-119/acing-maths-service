// src/app/admin/availability/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getAvailabilitySlots, createAvailabilitySlot, deleteAvailabilitySlot } from './actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { format, isBefore, startOfToday } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css' // Import styles for calendar
import type { AvailabilitySlot } from '@/lib/types'
import { formatTime } from '@/lib/utils'

export default function AvailabilityPage() {
  const [allSlots, setAllSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [newSlot, setNewSlot] = useState({ start_time: '09:00', end_time: '10:00' })

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    setIsLoading(true)
    const result = await getAvailabilitySlots()
    if (result.data) {
      setAllSlots(result.data)
    } else if (result.error) {
      setMessage({ type: 'error', text: result.error })
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) {
      setMessage({ type: 'error', text: 'Please select a date first.' })
      return
    }

    const formDataObj = new FormData()
    formDataObj.append('available_date', format(selectedDate, 'yyyy-MM-dd'))
    formDataObj.append('start_time', newSlot.start_time)
    formDataObj.append('end_time', newSlot.end_time)

    const result = await createAvailabilitySlot(formDataObj)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Slot created!' })
      loadSlots() // Refresh all slots
    }
  }

  async function handleDelete(slotId: string) {
    const result = await deleteAvailabilitySlot(slotId)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Slot deleted' })
      loadSlots()
    }
  }

  // Get days that have slots to highlight them on the calendar
  const daysWithSlots = allSlots.map(slot => new Date(slot.available_date))

  // Get slots for the currently selected day
  const slotsForSelectedDay = selectedDate
    ? allSlots.filter(
        (slot) => format(new Date(slot.available_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      )
    : []

  return (
    <>
      <Navigation role="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Availability</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="md:col-span-2">
            <CardContent className="p-0">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ booked: daysWithSlots }}
                modifiersStyles={{
                  booked: { fontWeight: 'bold', border: '2px solid var(--blue-500)' },
                }}
                disabled={{ before: startOfToday() }} // Disable past dates
                className="flex justify-center"
                footer={selectedDate ? `Selected: ${format(selectedDate, 'PPP')}` : 'Please select a day.'}
              />
            </CardContent>
          </Card>

          {/* Slots for Selected Day */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? `Slots for ${format(selectedDate, 'MMM d')}` : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add New Slot Form */}
              {selectedDate && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 pb-6 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="time"
                      label="Start Time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      required
                    />
                    <Input
                      type="time"
                      label="End Time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    + Add Slot
                  </Button>
                </form>
              )}

              {/* Existing Slots List */}
              <div className="space-y-2">
                {isLoading ? (
                  <p>Loading...</p>
                ) : selectedDate ? (
                  slotsForSelectedDay.length > 0 ? (
                    slotsForSelectedDay.map((slot) => (
                      <div key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(slot.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No slots for this day.</p>
                  )
                ) : (
                  <p className="text-gray-500 text-center py-4">Select a date to see and add slots.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
