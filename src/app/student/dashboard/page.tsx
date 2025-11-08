import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/logout/actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getMyBookings } from '@/app/bookings/actions'
import { getProgressStats } from '@/app/progress/actions'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  // Fix: Use single() to get one exam board instead of array
  const { data: userData } = await supabase
    .from('users')
    .select('username, email, student_level, role, exam_board_id, exam_boards!inner(name)')
    .eq('id', data.user.id)
    .single()

  // Redirect admins to admin dashboard
  if (userData?.role === 'admin') {
    redirect('/dashboard')
  }

  const bookingsResult = await getMyBookings()
  const statsResult = await getProgressStats()
  
  const upcomingBookings = bookingsResult.data?.filter(
    b => b.status !== 'cancelled' && new Date(b.booking_date) >= new Date()
  ).slice(0, 3)

  // Extract exam board name (it's still an object, not array with !inner)
  const examBoardName = userData?.exam_boards ? (userData.exam_boards as any).name : null

  return (
    <>
      <Navigation role="student" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userData?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              {userData?.student_level === 'gcse' ? 'GCSE' : 'A-Level'} Student
              {examBoardName && ` • ${examBoardName}`}
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
              <p className="text-gray-600 text-sm mb-2">Papers Completed</p>
              <p className="text-4xl font-bold text-blue-600">
                {statsResult.data?.totalPapers || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-2">Average Score</p>
              <p className="text-4xl font-bold text-green-600">
                {statsResult.data?.averagePercentage || 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-2">Highest Score</p>
              <p className="text-4xl font-bold text-purple-600">
                {statsResult.data?.highestScore || 0}%
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
              <Link href="/bookings">
                <Button className="w-full" variant="primary">
                  📅 Book a Session
                </Button>
              </Link>
              <Link href="/progress">
                <Button className="w-full" variant="secondary">
                  📊 Add Progress Entry
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatDate(booking.booking_date)}</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
