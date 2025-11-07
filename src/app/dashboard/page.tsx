import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/logout/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  // Fetch user data from custom users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username, email')
    .eq('id', data.user.id)
    .single()

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>Dashboard</h1>
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Welcome, {userData?.username || 'User'}!</h2>
        <p><strong>Email:</strong> {userData?.email}</p>
        <p><strong>User ID:</strong> {data.user.id}</p>
      </div>
      
      <form action={logout} style={{ marginTop: '20px' }}>
        <button 
          type="submit"
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#ff4444', 
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Logout
        </button>
      </form>
    </div>
  )
}
