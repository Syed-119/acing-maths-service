import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/logout/actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getAllBookings } from '@/app/admin/bookings/actions'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('username, email, role')
    .eq('id', data.user.id)
    .single()

  // Redirect students to student dashboard
  if (userData?.role === 'student') {
    redirect('/student/dashboard')
  }

  // Admin Dashboard
  const bookingsResult = await getAllBookings()
  
  const todayBookings = bookingsResult.data?.filter(
    b => b.booking_date === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
  ) || []

  const pendingBookings = bookingsResult.data?.filter(
    b => b.status === 'pending'
  ) || []

  const upcomingBookings = bookingsResult.data?.filter(
    b => b.status === 'confirmed' && new Date(b.booking_date) > new Date()
  ).slice(0, 5) || []

  return (
    <>
      <Navigation role="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {userData?.username}
            </p>
          </div>
          <form action={logout}>
            <Button variant="danger" type="submit">
              Logout
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-2">Today's Sessions</p>
              <p className="text-4xl font-bold text-blue-600">
                {todayBookings.length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-2">Pending Requests</p>
              <p className="text-4xl font-bold text-yellow-600">
                {pendingBookings.length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-2">Upcoming Sessions</p>
              <p className="text-4xl font-bold text-green-600">
                {upcomingBookings.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/bookings">
                <Button className="w-full" variant="primary">
                  📅 Manage Bookings
                </Button>
              </Link>
              <Link href="/admin/availability">
                <Button className="w-full" variant="secondary">
                  ⏰ Set Availability
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBookings.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {pendingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium">{booking.users?.username}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.booking_date)} at {formatTime(booking.start_time)}
                      </p>
                    </div>
                  ))}
                  {pendingBookings.length > 3 && (
                    <Link href="/admin/bookings">
                      <p className="text-sm text-blue-600 text-center">
                        +{pendingBookings.length - 3} more pending
                      </p>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No pending requests</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length > 0 ? (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{booking.users?.username}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-gray-500 mt-1">{booking.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sessions scheduled for today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
