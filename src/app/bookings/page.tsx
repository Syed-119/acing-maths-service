'use client'

import { useState, useEffect } from 'react'
import { getAvailableSlots, createBooking, getMyBookings, cancelBooking } from './actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'
import type { Booking, AvailabilitySlot } from '@/lib/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDate])

  async function loadBookings() {
    const result = await getMyBookings()
    if (result.data) {
      setBookings(result.data)
    }
  }

  async function loadAvailableSlots() {
    const result = await getAvailableSlots(new Date(selectedDate))
    if (result.data) {
      setAvailableSlots(result.data)
    }
  }

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !selectedDate) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('booking_date', selectedDate)
    formData.append('start_time', selectedSlot.start_time)
    formData.append('end_time', selectedSlot.end_time)
    formData.append('notes', notes)

    const result = await createBooking(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Booking created successfully!' })
      setSelectedSlot(null)
      setNotes('')
      loadBookings()
      loadAvailableSlots()
    }
    
    setIsLoading(false)
  }

  async function handleCancel(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    const result = await cancelBooking(bookingId)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Booking cancelled' })
      loadBookings()
    }
  }

  return (
    <>
      <Navigation role="student" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Book a Tuition Session</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>New Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBooking} className="space-y-4">
                <Input
                  type="date"
                  label="Select Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />

                {availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots
                    </label>
                    <div className="space-y-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && availableSlots.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No available slots for this date
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any specific topics you'd like to cover?"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedSlot || !selectedDate}
                  isLoading={isLoading}
                >
                  Confirm Booking
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{formatDate(booking.booking_date)}</p>
                          <p className="text-sm text-gray-600">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-gray-600 mt-2">{booking.notes}</p>
                      )}
                      {booking.status === 'pending' && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No bookings yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
